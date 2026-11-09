/* Concours Maroc (Android app) — live content: the app keeps up with the
 * website without a new version on Google Play.
 *
 * Every website build (npm run build → scripts/build-app.mjs --live) also
 * publishes the app's own pages and data, rendered exactly as in this www:
 *   <site>/app/live/manifest.json              small, revalidated each time
 *   <site>/app/live/packs/<name>.<hash>.json   immutable packs:
 *     core       registry (data/pages.json), calendar, concours, search, CSS
 *     pages-fr   HTML fragments of the French pages
 *     pages-ar   HTML fragments of the Arabic pages
 *     questions  question banks
 *
 * The app compares the manifest with data/live-base.json (the hashes of its
 * own packs, written by the app build): only packs that differ from the
 * installed content are downloaded, checked (SHA-256) and stored with the
 * Cache API, one cache per pack. When every pack is stored, the new version
 * becomes the active one at once: CM.load reads through it, so the next page
 * opened shows it (the page on screen is never reloaded under the reader),
 * and the next start uses it from the first screen. Offline, the app keeps
 * the last content it has.
 *
 * Only content travels: HTML fragments, JSON and CSS, never JavaScript. The
 * app's code changes only through Google Play (store policy, and the code
 * that reads the content stays the one shipped with the APK). Content made
 * for newer app code is left aside until the app is updated: manifest.shell
 * above SHELL, or a page that needs a file (script, image) this www lacks.
 *
 * Safety: a version that keeps the app from starting is dropped and never
 * downloaded again (the app then starts with its built-in content), a pack
 * whose hash does not match is refused, and content older than the
 * installed one (after an update from Google Play) is never used.
 */
(function (global) {
  'use strict';

  // Version of the app code that reads the content. Bump it when pages start
  // to need app code that older versions do not have: those versions then
  // keep their content until they are updated from Google Play.
  var SHELL = 1;

  var KEY = 'cm.live';              // localStorage: state of the active content
  var PREFIX = 'cm-live-';          // Cache API: one cache per pack, PREFIX + sha256
  var DONE = '__complete__';        // last entry written in a pack's cache
  var CHECK_EVERY = 30 * 60000;     // at most one automatic check per half hour
  var MAX_TRIES = 2;                // starts of a version that never finished

  var supported = !!(global.caches && global.fetch && global.crypto && global.crypto.subtle &&
    global.TextDecoder && global.Request && global.Response && global.Promise);
  var base = null;                  // data/live-base.json of this www
  var opened = {};                  // sha -> Cache of the active packs
  var ready = null;
  var initialized = false;          // init() finished: drops must refresh the app
  var running = null;
  var last = null;                  // result of the last check
  var state = read();

  function now() { return Date.now(); }
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  function siteUrl() {
    return (document.documentElement.getAttribute('data-site-url') || 'https://www.maroc-concour.com/').replace(/\/?$/, '/');
  }
  function liveUrl(file) { return siteUrl() + 'app/live/' + file; }
  function keyUrl(path) { return global.location.origin + '/__live__/' + path; }
  function norm(url) { return String(url || '').split(/[?#]/)[0].replace(/^\.\//, '').replace(/^\//, ''); }
  function type(path) {
    return /\.html$/.test(path) ? 'text/html; charset=utf-8' : /\.css$/.test(path) ? 'text/css; charset=utf-8' : 'application/json; charset=utf-8';
  }
  function load() { return global.CM && global.CM.load; }

  /* The pack whose prefix is the longest match: 'pages/ar/' before 'pages/',
     'data/questions/' before 'data/'; a prefix without a final slash is a
     single file ('css/app.css'). */
  function packFor(path, packs) {
    var best = null;
    var len = -1;
    Object.keys(packs || {}).forEach(function (name) {
      (packs[name].prefixes || []).forEach(function (p) {
        var hit = p.charAt(p.length - 1) === '/' ? path.indexOf(p) === 0 : path === p;
        if (hit && p.length > len) { best = packs[name]; len = p.length; }
      });
    });
    return best;
  }

  function activeShas(packs) {
    return Object.keys(packs || {}).filter(function (n) { return !packs[n].local; }).map(function (n) { return packs[n].sha; });
  }

  function withTimeout(ms, run) {
    var ctrl = global.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
    return run(ctrl ? ctrl.signal : undefined).then(function (v) { clearTimeout(timer); return v; },
      function (e) { clearTimeout(timer); throw e; });
  }
  function fetchJson(url, ms) {
    return withTimeout(ms, function (signal) {
      return global.fetch(url, { cache: 'no-cache', signal: signal }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
        return res.json();
      });
    });
  }
  function fetchBuffer(url, ms) {
    return withTimeout(ms, function (signal) {
      return global.fetch(url, { signal: signal }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
        return res.arrayBuffer();
      });
    });
  }
  function sha256(buf) {
    return global.crypto.subtle.digest('SHA-256', buf).then(function (d) {
      return Array.prototype.map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  // ------------------------------------------------------------ CSS
  /* The stylesheet of the active content replaces css/app.css (same file,
     newer version); fonts keep their place next to index.html. */
  function applyCss() {
    return lookup('css/app.css').then(function (css) {
      var style = document.getElementById('cm-live-css');
      var link = document.querySelector('link[href="css/app.css"]');
      if (!css) {
        if (style) style.parentNode.removeChild(style);
        if (link) link.disabled = false;
        return;
      }
      if (!style) {
        style = document.createElement('style');
        style.id = 'cm-live-css';
        document.head.appendChild(style);
      }
      style.textContent = css.replace(/url\((['"]?)\.\.\//g, 'url($1');
      if (link) link.disabled = true;
    }).catch(function () { /* the built-in stylesheet stays */ });
  }

  // ------------------------------------------------------------ state
  function gc(keep) {
    return global.caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) {
        return n.indexOf(PREFIX) === 0 && keep.indexOf(n.slice(PREFIX.length)) === -1;
      }).map(function (n) { return global.caches.delete(n); }));
    }).catch(function () { /* ignore */ });
  }

  /* Back to the content of the APK (and to a check at the next occasion). */
  function drop(why) {
    var had = !!state.v;
    if (had) console.warn('[live] contenu en ligne abandonné : ' + why);
    state = { bad: state.bad || [], dropped: why, at: now(), checked: 0 };
    save();
    opened = {};
    if (had && initialized) {
      if (load() && load().clear) load().clear();
      if (global.CM.shell && global.CM.shell.reload) global.CM.shell.reload();
    }
    return applyCss().then(function () { return gc([]); });
  }

  function markBad(v) {
    var bad = (state.bad || []).filter(function (x) { return x !== v; });
    bad.push(v);
    state.bad = bad.slice(-5);
    save();
  }

  function openAll(shas) {
    var next = {};
    return Promise.all(shas.map(function (sha) {
      return global.caches.open(PREFIX + sha).then(function (c) {
        return c.match(keyUrl(DONE)).then(function (r) {
          if (!r) throw new Error('paquet incomplet ' + sha.slice(0, 12));
          next[sha] = c;
        });
      });
    })).then(function () { opened = next; });
  }

  /* At start-up: the stored version, if it still fits this www. */
  function activate() {
    if (!state.v) return Promise.resolve();
    if (state.base !== base.id) return drop('application mise à jour');
    if ((state.tries || 0) >= MAX_TRIES) {
      markBad(state.v);
      return drop('la version ' + state.v + ' empêchait le démarrage');
    }
    return openAll(activeShas(state.packs)).then(function () {
      state.tries = (state.tries || 0) + 1;   // reset by started()
      save();
      return applyCss();
    }, function (e) { return drop(e.message); });
  }

  function init() {
    if (ready) return ready;
    ready = (supported ? Promise.resolve() : Promise.reject(new Error('unsupported')))
      .then(function () { return load().local('data/live-base.json'); })
      .then(function (text) {
        base = JSON.parse(text);
        return activate();
      })
      .catch(function (e) {
        opened = {};
        if (e && e.message !== 'unsupported') console.warn('[live] ' + e.message);
      })
      .then(function () { initialized = true; });
    return ready;
  }

  /* Text of a file of the active content, or null (then CM.load reads the
     file of the APK). lookup() does not wait for init(): it is what init()
     itself uses (stylesheet), get() is what the rest of the app uses. */
  function lookup(path) {
    if (!state.v) return Promise.resolve(null);
    var pack = packFor(path, state.packs);
    if (!pack || pack.local || !opened[pack.sha]) return Promise.resolve(null);
    return opened[pack.sha].match(keyUrl(path)).then(function (res) { return res ? res.text() : null; });
  }
  function get(url) {
    if (!supported) return Promise.resolve(null);
    return init().then(function () { return lookup(norm(url)); }).catch(function () { return null; });
  }

  // ------------------------------------------------------------ download
  function storePack(p) {
    var name = PREFIX + p.sha;
    return global.caches.open(name).then(function (cache) {
      return cache.match(keyUrl(DONE)).then(function (done) {
        if (done) return 0;   // already here (an earlier version, an interrupted check)
        return fetchBuffer(liveUrl(p.file), 90000).then(function (buf) {
          return sha256(buf).then(function (hex) {
            if (hex !== p.sha) throw new Error('empreinte invalide : ' + p.name);
            var files = JSON.parse(new global.TextDecoder('utf-8').decode(buf));
            var paths = Object.keys(files);
            return Promise.all(paths.map(function (path) {
              return cache.put(keyUrl(path), new global.Response(files[path], { headers: { 'Content-Type': type(path) } }));
            })).then(function () {
              return cache.put(keyUrl(DONE), new global.Response(String(paths.length)));
            }).then(function () { return buf.byteLength; });
          });
        });
      });
    }).catch(function (e) {
      global.caches.delete(name);
      throw e;
    });
  }

  function current() { return state.v || (base && base.id) || null; }

  function update(m) {
    if (!m || m.format !== 1 || !m.packs || typeof m.version !== 'string') throw new Error('manifeste illisible');
    if ((m.shell || 0) > SHELL) return { status: 'app-update', version: current(), offered: m.version };
    var have = base.files || [];
    var missing = (m.needs || []).filter(function (f) { return have.indexOf(f) === -1; });
    if (missing.length) return { status: 'app-update', version: current(), offered: m.version, missing: missing.slice(0, 5) };
    if (String(m.updated || '') < String(base.updated || '')) return { status: 'uptodate', version: current() };
    if ((state.bad || []).indexOf(m.version) !== -1) return { status: 'uptodate', version: current(), refused: m.version };
    // Same content = same pack hashes. The version also changes when only the
    // app code changed (that code never comes from the website): nothing to do then.
    var names = Object.keys(m.packs);
    var sameAs = function (packs, shaOf) {
      return !!packs && names.length === Object.keys(packs).length && names.every(function (n) {
        return !!packs[n] && shaOf(packs[n]) === m.packs[n].sha256;
      });
    };
    if (m.version === base.id || sameAs(base.packs, function (sha) { return sha; })) {
      // the content published is the one of this APK
      return (state.v ? drop('identique au contenu de l’application') : Promise.resolve())
        .then(function () { return { status: 'uptodate', version: base.id }; });
    }
    if (m.version === state.v || (state.v && sameAs(state.packs, function (p) { return p.sha; }))) {
      return { status: 'uptodate', version: state.v };
    }

    var packs = {};
    var todo = [];
    Object.keys(m.packs).forEach(function (name) {
      var p = m.packs[name];
      var local = !!(base.packs && base.packs[name] === p.sha256);
      packs[name] = { sha: p.sha256, prefixes: p.prefixes || [], local: local };
      if (!local) todo.push({ name: name, sha: p.sha256, file: p.file });
    });
    var bytes = 0;
    // one pack at a time: a phone never holds two of them in memory
    return todo.reduce(function (chain, p) {
      return chain.then(function () { return storePack(p).then(function (n) { bytes += n; }); });
    }, Promise.resolve()).then(function () {
      var shas = todo.map(function (p) { return p.sha; });
      return openAll(shas).then(function () {
        state = { v: m.version, updated: m.updated, base: base.id, packs: packs, checked: state.checked, bad: state.bad || [], tries: 0, at: now() };
        save();
        // from now on every file is read from the new content
        if (load() && load().clear) load().clear();
        if (global.CM.shell && global.CM.shell.reload) global.CM.shell.reload();
        return applyCss().then(function () {
          gc(shas);
          try {
            document.dispatchEvent(new CustomEvent('cm:live', { detail: { version: m.version, updated: m.updated } }));
          } catch (e) { /* ignore */ }
          return { status: 'updated', version: m.version, updated: m.updated, packs: todo.map(function (p) { return p.name; }), bytes: bytes };
        });
      });
    });
  }

  function finish(status, extra) {
    last = { status: status, at: now() };
    Object.keys(extra || {}).forEach(function (k) { if (k !== 'status') last[k] = extra[k]; });
    return last;
  }

  /* Looks for new content (force: even if the last check is recent).
     Resolves { status: 'updated' | 'uptodate' | 'app-update' | 'offline' |
     'skipped' | 'unsupported' | 'error', … }, never rejects. */
  function check(force) {
    if (running) return running;
    if (!supported) return Promise.resolve(finish('unsupported'));
    if (!force && state.checked && now() - state.checked < CHECK_EVERY) return Promise.resolve({ status: 'skipped', at: now() });
    if (global.navigator && global.navigator.onLine === false) return Promise.resolve(finish('offline'));
    running = init().then(function () {
      if (!base) throw new Error('data/live-base.json illisible');
      return fetchJson(liveUrl('manifest.json'), 15000);
    }).then(function (m) {
      state.checked = now();
      delete state.error;
      save();
      return update(m);
    }).then(function (r) {
      return finish(r.status, r);
    }, function (e) {
      state.error = String((e && e.message) || e);
      save();
      return finish(global.navigator && global.navigator.onLine === false ? 'offline' : 'error', { error: state.error });
    }).then(function (r) {
      running = null;
      return r;
    });
    return running;
  }

  global.CM = global.CM || {};
  global.CM.live = {
    SHELL: SHELL,
    supported: function () { return supported; },
    init: init,
    get: get,
    check: check,
    /* The first page is on screen: the active version works. */
    started: function () {
      if (state.v && state.tries) { state.tries = 0; save(); }
      setTimeout(function () { check(false); }, 4000);
    },
    /* The first page could not be shown: true if live content was in use
       (it is then dropped for good, and the caller restarts the app). */
    failed: function () {
      if (!state.v) return false;
      markBad(state.v);
      drop('la première page n’a pas pu s’afficher');
      return true;
    },
    /* Date of the content in use: the one downloaded, else the APK's. */
    contentDate: function () { return state.v ? state.updated : (base ? base.updated : null); },
    status: function () {
      return {
        supported: supported, shell: SHELL,
        active: state.v || null, updated: state.v ? state.updated : null,
        installed: base ? base.id : null, installedUpdated: base ? base.updated : null,
        packs: state.packs ? Object.keys(state.packs).map(function (n) { return n + (state.packs[n].local ? ' (APK)' : ' (téléchargé)'); }) : [],
        checked: state.checked || 0, last: last, bad: state.bad || [], error: state.error || null, dropped: state.dropped || null
      };
    },
    reset: function () { return drop('retour manuel au contenu de l’application'); }
  };
})(window);

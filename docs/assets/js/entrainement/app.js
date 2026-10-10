/* Concours Maroc — practice app: boot and router.
 *
 * Each screen has its own URL (#/home, #/setup, #/quiz, #/results…), pushed
 * with the History API. Consequences:
 *   - the browser's back/forward buttons and the phone's system back button
 *     move between screens (and finally back to the previous page of the site);
 *   - every screen can be bookmarked or shared, e.g. /entrainement/?concours=ensa#/mock;
 *   - leaving a running quiz never loses it: it is saved and offered again
 *     as "Reprendre la session" on the home screen.
 *
 * Inside the Android app (single-page shell, see js/router.js) the trainer is
 * mounted on demand with CM.app.mount(host) and its routes live under a prefix
 * given by data-route-base, e.g. #/entrainement/setup.
 */
(function (global) {
  'use strict';

  var U = global.CM.utils;
  var T = global.CM.i18n;
  var Store = global.CM.store;
  var Data = global.CM.data;
  var Quiz = global.CM.quiz;
  var TTS = global.CM.tts;
  var UI = global.CM.ui;

  var ROUTES = ['home', 'setup', 'quiz', 'results', 'stats', 'bookmarks', 'settings', 'mock', 'memoire'];
  var host = null;
  var LANG = 'fr';
  var BASE = '';
  var current = null;
  var renderedHash = null;
  var booted = false;
  var bootedLangs = {};
  var docs = null;

  /* Route of the current URL, or null when the URL belongs to another page
     of the app shell. */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    if (BASE) {
      if (h.indexOf(BASE) !== 0 && h + '/' !== BASE) return null;
      h = h.slice(BASE.length);
    }
    var parts = h.split('?');
    var name = parts[0] || 'home';
    var params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        try { params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } catch (e) { /* ignore */ }
      });
    }
    if (ROUTES.indexOf(name) === -1) name = 'home';
    return { name: name, params: params };
  }

  function buildHash(name, params) {
    var q = params ? Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&') : '';
    return '#/' + BASE + name + (q ? '?' + q : '');
  }

  function depth() { return (history.state && history.state.cm) || 0; }

  var App = {
    go: function (name, params, replace) {
      var hash = buildHash(name, params);
      var url = location.pathname + location.search + hash;
      if (replace) history.replaceState({ cm: depth() }, '', url);
      else history.pushState({ cm: depth() + 1 }, '', url);
      render(true);
    },
    /* In-app back arrow: same as the browser button when there is an
       in-app screen to go back to, otherwise the practice home. */
    back: function () {
      if (depth() > 0) history.back();
      else App.go('home', null, true);
    },
    route: function () { return current; },
    mounted: function () { return !!host; },
    /* Re-reads the URL (the app shell changed it with pushState). */
    refresh: function () { render(true); },

    /* Shell integration: attach the trainer to a freshly inserted host. */
    mount: function (el) {
      if (!el) return;
      host = el;
      LANG = host.getAttribute('data-lang') || 'fr';
      BASE = host.getAttribute('data-route-base') || '';
      renderedHash = null;
      current = null;
      if (booted) startLanguage().then(function () { afterBoot(); }).catch(fail);
      else boot();
    },

    /* Shell integration: the page is being replaced. A running session is
       saved (and offered again on return), timers and speech are stopped. */
    unmount: function () {
      if (!host) return;
      if (current === 'quiz' || current === 'memoire') UI.leaveQuiz();
      if (UI.isSheetOpen()) UI.closeSheet();
      host = null;
      current = null;
      renderedHash = null;
      document.body.removeAttribute('data-cm-route');
    }
  };

  function scrollToApp() {
    if (!host) return;
    var header = document.querySelector('.site-header');
    var offset = header ? header.getBoundingClientRect().height : 0;
    var y = host.getBoundingClientRect().top + global.pageYOffset - offset - 6;
    if (global.pageYOffset > y || host.getBoundingClientRect().top > global.innerHeight * 0.6) {
      global.scrollTo({ top: Math.max(0, y), behavior: U.reducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function render(force) {
    if (!booted || !host) return;
    var hash = location.hash || '#/home';
    if (!force && hash === renderedHash) return;
    var r = parseHash();
    if (!r) {
      // Another page of the shell: keep a running session for later.
      if (current === 'quiz' || current === 'memoire') {
        UI.leaveQuiz();
        var s = Quiz.savedSummary();
        if (s && s.remaining > 0) UI.toast(T.t('quiz.savedToast'));
      }
      current = null;
      return;
    }
    renderedHash = hash;
    if (current === 'quiz' && r.name !== 'quiz') {
      UI.leaveQuiz();
      var saved = Quiz.savedSummary();
      if (saved && saved.remaining > 0) UI.toast(T.t('quiz.savedToast'));
    }
    if (current === 'memoire' && r.name !== 'memoire') UI.leaveQuiz();
    if (UI.isSheetOpen()) UI.closeSheet();
    var previous = current;
    current = r.name;
    document.body.setAttribute('data-cm-route', r.name);
    switch (r.name) {
      case 'setup': UI.renderSetup(r.params); break;
      case 'quiz': renderQuiz(); break;
      case 'results': UI.renderResults(); break;
      case 'stats': UI.renderStats(); break;
      case 'bookmarks': UI.renderBookmarks(); break;
      case 'settings': UI.renderSettings(); break;
      case 'mock': UI.renderMock(); break;
      case 'memoire': UI.renderMemory(); break;
      default: UI.renderHome(); break;
    }
    if (previous !== null || r.name !== 'home') scrollToApp();
    try { document.dispatchEvent(new CustomEvent('cm:route', { detail: { name: r.name, previous: previous } })); } catch (e) { /* old WebView */ }
  }

  /* A reload on #/quiz (or a resumed tab) restores the saved session. */
  function renderQuiz() {
    if (Quiz.current() && !Quiz.current().finished) { UI.renderQuiz(); return; }
    var saved = Quiz.savedSummary();
    if (!saved) { App.go('home', null, true); return; }
    Data.ensure(saved.categories).then(function (qs) {
      Quiz.addQuestions(qs);
      if (Quiz.resume()) UI.renderQuiz();
      else App.go('home', null, true);
    });
  }

  global.addEventListener('popstate', function () { render(false); });
  global.addEventListener('hashchange', function () { render(false); });

  document.addEventListener('keydown', function (e) {
    if (!host) return;
    if (e.key === 'Escape' && UI.isSheetOpen()) { UI.closeSheet(); return; }
    if (current === 'quiz' && UI._keys) UI._keys(e);
  });

  // Chips "S'entraîner par concours" below the app: switch without reloading.
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-pick-concours]') : null;
    if (!a || !booted || !host) return;
    var id = a.getAttribute('data-pick-concours');
    if (!UI.hasConcours(id)) return;
    e.preventDefault();
    e.stopPropagation();
    Store.patchProfile({ targetExam: id });
    if (!BASE) history.replaceState(history.state, '', location.pathname + '?concours=' + id + (location.hash || '#/home'));
    App.go('home');
    UI.toast(T.t('picker.chosenShort'));
  });

  function fail(err) {
    if (!host) return;
    U.clear(host);
    var box = U.el('div', { class: 'state error' }, [
      U.el('div', { class: 'st-star' }),
      U.el('p', { text: T.has(LANG) ? T.t('common.loadError') : 'Erreur de chargement / خطأ في التحميل' }),
      U.el('p', { class: 'legal', text: String(err && err.message ? err.message : err) })
    ]);
    box.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () { global.location.reload(); } }, ['↻']));
    host.appendChild(box);
  }

  /* Language packs needed by the page language (French is always loaded:
     it is the fallback of every string). */
  function startLanguage() {
    var packs = (LANG === 'fr' ? ['fr'] : ['fr', LANG]).filter(function (c) { return !bootedLangs[c]; });
    return Promise.all(packs.map(function (code) {
      return Data.i18n(code).then(function (pack) { T.register(code, pack); bootedLangs[code] = true; });
    })).then(function () { T.set(LANG); });
  }

  /* Deep link ?concours=<id>, from the query string (website) or from the
     route parameters (app shell). */
  function wantedConcours() {
    var r = parseHash();
    if (r && r.params && r.params.concours) return r.params.concours;
    try { return new URLSearchParams(location.search).get('concours'); } catch (e) { return null; }
  }

  function afterBoot() {
    if (!host) return;
    UI.init({ app: App, manifest: docs.manifest, concours: docs.concours, sources: docs.sources });
    var prof = Store.getProfile();
    var wanted = wantedConcours();
    if (wanted && UI.hasConcours(wanted)) Store.patchProfile({ targetExam: wanted, onboarded: true });
    else if (prof.targetExam && !UI.hasConcours(prof.targetExam)) Store.patchProfile({ targetExam: null });
    if (!history.state) history.replaceState({ cm: 0 }, '', location.href);
    render(true);
  }

  function boot() {
    startLanguage().then(function () {
      return Promise.all([Data.manifest(), Data.concours(), Data.sources()]);
    }).then(function (res) {
      docs = { manifest: res[0], concours: res[1], sources: res[2] };
      Quiz.setManifest(docs.manifest);
      var prof = Store.getProfile();
      TTS.setPrefs(prof.tts || {});
      if (prof.contentVersion !== docs.manifest.contentVersion) Store.patchProfile({ contentVersion: docs.manifest.contentVersion });
      booted = true;
      afterBoot();
    }).catch(function (err) {
      console.error('[entrainement] boot failed', err);
      fail(err);
    });
  }

  // Website: the page itself contains the trainer.
  function autoMount() {
    var el = document.getElementById('cm-app');
    if (el && !host) App.mount(el);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();

  global.CM.app = App;
})(window);

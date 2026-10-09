/* Concours Maroc — practice app: boot and router.
 *
 * Each screen has its own URL (#/home, #/setup, #/quiz, #/results…), pushed
 * with the History API. Consequences:
 *   - the browser's back/forward buttons and the phone's system back button
 *     move between screens (and finally back to the previous page of the site);
 *   - every screen can be bookmarked or shared, e.g. /entrainement/?concours=ensa#/mock;
 *   - leaving a running quiz never loses it: it is saved and offered again
 *     as "Reprendre la session" on the home screen.
 */
(function (global) {
  'use strict';

  var host = document.getElementById('cm-app');
  if (!host) return;

  var U = global.CM.utils;
  var T = global.CM.i18n;
  var Store = global.CM.store;
  var Data = global.CM.data;
  var Quiz = global.CM.quiz;
  var TTS = global.CM.tts;
  var UI = global.CM.ui;

  var LANG = host.getAttribute('data-lang') || 'fr';
  var ROUTES = ['home', 'setup', 'quiz', 'results', 'stats', 'bookmarks', 'settings', 'mock', 'memoire'];
  var current = null;
  var renderedHash = null;
  var booted = false;

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
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
    return '#/' + name + (q ? '?' + q : '');
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
    route: function () { return current; }
  };

  function scrollToApp() {
    var header = document.querySelector('.site-header');
    var offset = header ? header.getBoundingClientRect().height : 0;
    var y = host.getBoundingClientRect().top + global.pageYOffset - offset - 6;
    if (global.pageYOffset > y || host.getBoundingClientRect().top > global.innerHeight * 0.6) {
      global.scrollTo({ top: Math.max(0, y), behavior: U.reducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function render(force) {
    if (!booted) return;
    var hash = location.hash || '#/home';
    if (!force && hash === renderedHash) return;
    renderedHash = hash;
    var r = parseHash();
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
    if (e.key === 'Escape' && UI.isSheetOpen()) { UI.closeSheet(); return; }
    if (current === 'quiz' && UI._keys) UI._keys(e);
  });

  // Chips "S'entraîner par concours" below the app: switch without reloading.
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-pick-concours]') : null;
    if (!a || !booted) return;
    var id = a.getAttribute('data-pick-concours');
    if (!UI.hasConcours(id)) return;
    e.preventDefault();
    Store.patchProfile({ targetExam: id });
    history.replaceState(history.state, '', location.pathname + '?concours=' + id + (location.hash || '#/home'));
    App.go('home');
    UI.toast(T.t('picker.chosenShort'));
  });

  function fail(err) {
    U.clear(host);
    var box = U.el('div', { class: 'state error' }, [
      U.el('div', { class: 'st-star' }),
      U.el('p', { text: T.has(LANG) ? T.t('common.loadError') : 'Erreur de chargement / خطأ في التحميل' }),
      U.el('p', { class: 'legal', text: String(err && err.message ? err.message : err) })
    ]);
    box.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () { global.location.reload(); } }, ['↻']));
    host.appendChild(box);
  }

  function boot() {
    var packs = LANG === 'fr' ? ['fr'] : ['fr', LANG];
    Promise.all(packs.map(function (code) {
      return Data.i18n(code).then(function (pack) { T.register(code, pack); });
    })).then(function () {
      T.set(LANG);
      return Promise.all([Data.manifest(), Data.concours(), Data.sources()]);
    }).then(function (res) {
      var manifest = res[0];
      var concours = res[1];
      Quiz.setManifest(manifest);
      UI.init({ app: App, manifest: manifest, concours: concours, sources: res[2] });
      var prof = Store.getProfile();
      TTS.setPrefs(prof.tts || {});
      if (prof.contentVersion !== manifest.contentVersion) Store.patchProfile({ contentVersion: manifest.contentVersion });
      // Deep link ?concours=<id> selects the target concours.
      var wanted = null;
      try { wanted = new URLSearchParams(location.search).get('concours'); } catch (e) { wanted = null; }
      if (wanted && UI.hasConcours(wanted)) Store.patchProfile({ targetExam: wanted, onboarded: true });
      else if (prof.targetExam && !UI.hasConcours(prof.targetExam)) Store.patchProfile({ targetExam: null });
      booted = true;
      if (!history.state) history.replaceState({ cm: 0 }, '', location.href);
      render(true);
    }).catch(function (err) {
      console.error('[entrainement] boot failed', err);
      fail(err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  global.CM.app = App;
})(window);

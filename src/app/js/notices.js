/* Concours Maroc (Android app) — announcement popup.
 *
 * A short message shown once (e.g. "Inscriptions police ouvertes jusqu'au
 * 22 septembre"), with an optional button to a page of the app or a link.
 * Two sources, the first that has a current announcement wins:
 *   1. Firebase Remote Config, key "annonce" (when the Firebase plugins and
 *      google-services.json are in the build);
 *   2. the website: https://www.maroc-concour.com/app/annonce.json, written
 *      by scripts/build.mjs from content/app-annonce.json.
 * Format (both sources): { "annonces": [ { "id": "2026-09-dgsn",
 *   "from": "2026-09-07", "until": "2026-09-22",
 *   "fr": { "title": "…", "body": "…", "cta": "Voir le concours" },
 *   "ar": { "title": "…", "body": "…", "cta": "…" },
 *   "route": "concours/police-dgsn/"  or  "url": "https://…" } ] }
 * A single object without the "annonces" array is accepted too.
 *
 * Shown once per id, never on the first launch, never during a question,
 * never over another dialog; at most one per day.
 */
(function (global) {
  'use strict';

  var KEY = 'cm.notices';
  var DAY = 86400000;
  var state = { source: null, current: null, checked: 0, error: null };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }
  function lang() { return document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'fr'; }
  function tr(fr, a) { return lang() === 'ar' ? a : fr; }
  function siteUrl() { return (document.documentElement.getAttribute('data-site-url') || 'https://www.maroc-concour.com/').replace(/\/?$/, '/'); }
  function day(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? new Date(s + 'T00:00:00') : null; }

  function list(data) {
    if (!data) return [];
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return []; } }
    var arr = Array.isArray(data.annonces) ? data.annonces : (data.id ? [data] : []);
    var now = new Date();
    return arr.filter(function (a) {
      if (!a || !a.id || a.active === false) return false;
      var from = day(a.from), until = day(a.until);
      if (from && now < from) return false;
      if (until && now > new Date(until.getTime() + DAY)) return false;
      var t = a[lang()] || a.fr;
      return !!(t && (t.title || t.body));
    });
  }

  function fromFirebase() {
    var FB = global.CM && global.CM.firebase;
    if (!FB || !FB.present().config) return Promise.resolve([]);
    return FB.fetchConfig().then(function () { return FB.getString('annonce'); }).then(list);
  }
  function fromSite() {
    if (global.navigator && global.navigator.onLine === false) return Promise.resolve([]);
    return fetch(siteUrl() + 'app/annonce.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(list, function () { return []; });
  }

  function show(a, preview) {
    var UI = global.CM && global.CM.ui;
    if (!UI || !UI.sheet) return false;
    if (!preview && UI.isSheetOpen && UI.isSheetOpen()) return false;
    var t = a[lang()] || a.fr;
    var actions = [{ label: tr('Fermer', 'إغلاق'), style: 'ghost' }];
    var Shell = global.CM.shell;
    if (a.route || a.url) {
      actions.push({ label: t.cta || tr('Voir', 'عرض'), style: 'primary', onclick: function () {
        var FB = global.CM.firebase;
        if (FB) FB.log('announcement_open', { id: a.id });
        if (a.route && FB) FB.openRoute(a.route);
        else if (a.url && /^https:\/\//.test(a.url) && Shell) Shell.openExternal(a.url);
      } });
    }
    UI.sheet({ title: t.title || 'Concours Maroc', body: t.body || '', actions: actions });
    return true;
  }

  var Notices = {
    /* Called a few seconds after start-up and when the app comes back. */
    check: function (force) {
      var s = load();
      s.launches = (s.launches || 0) + (force ? 0 : 1);
      save(s);
      if (!force && s.launches < 2) return Promise.resolve(null);            // not on the first launch
      if (!force && Date.now() - (s.lastShown || 0) < DAY) return Promise.resolve(null);
      return fromFirebase().then(function (a) {
        if (a.length) { state.source = 'firebase'; return a; }
        return fromSite().then(function (b) { state.source = b.length ? 'site' : null; return b; });
      }).then(function (items) {
        state.checked = Date.now();
        var seen = load().seen || [];
        var next = items.filter(function (a) { return force || seen.indexOf(a.id) === -1; })[0] || null;
        state.current = next;
        if (!next) return null;
        var boot = global.CM.boot;
        if (!force && boot && boot.isPlaying && boot.isPlaying()) return null;   // a question is on screen
        if (!show(next)) return null;
        var st = load();
        st.seen = (st.seen || []).concat(next.id).slice(-50);
        st.lastShown = Date.now();
        save(st);
        return next;
      }).catch(function (e) { state.error = String(e && e.message || e); return null; });
    },
    preview: function () {
      if (state.current) return show(state.current, true);
      return show({ id: 'apercu', fr: { title: 'Aperçu d’annonce', body: 'Exemple de message envoyé depuis Firebase Remote Config (clé « annonce ») ou depuis content/app-annonce.json.', cta: 'Calendrier' },
        ar: { title: 'معاينة إعلان', body: 'مثال لرسالة من Firebase Remote Config أو من content/app-annonce.json.', cta: 'الأجندة' },
        route: (lang() === 'ar' ? 'ar/' : '') + 'outils/calendrier-concours/' }, true);
    },
    debug: function () { var s = load(); return { source: state.source, current: state.current, checked: state.checked, error: state.error, seen: s.seen || [], launches: s.launches || 0, lastShown: s.lastShown || 0 }; },
    reset: function () { save({}); }
  };

  global.CM = global.CM || {};
  global.CM.notices = Notices;
})(window);

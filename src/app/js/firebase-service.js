/* Concours Maroc (Android app) — Firebase: usage statistics, notifications,
 * remote settings.
 *
 * Plugins (each optional: without it, its part is a no-op):
 *   cordova-plugin-firebase-analytics 9.0.0  -> cordova.plugins.firebase.analytics
 *   cordova-plugin-firebase-messaging 9.2.0  -> cordova.plugins.firebase.messaging
 *   cordova-plugin-firebase-config    9.0.0  -> cordova.plugins.firebase.config
 * They need the google-services.json of the Firebase project in the Cordova
 * project (cordova/LISEZMOI-ANDROID.md, "Firebase").
 *
 * Statistics (Google Analytics for Firebase): one screen_view per page and
 * the trainer's events, with the same names as on the website (gtag events:
 * select_concours, quiz_start, quiz_complete, search) — page keys and
 * counts only, never an answer or anything personal. Off with the
 * "Statistiques d'utilisation" switch of the settings.
 *
 * Notifications (Firebase Cloud Messaging): opt-in only, from the settings
 * ("Alertes concours"). Android 13+ then asks for the permission, and the
 * app subscribes to the topics "concours" and "concours_fr" or
 * "concours_ar" (send to them from the Firebase console). A notification may
 * carry a data field "route" (e.g. "concours/police-dgsn/"), opened when it
 * is tapped or from the in-app message.
 *
 * Remote Config: the key "annonce" (JSON) feeds the announcement popup
 * (notices.js).
 */
(function (global) {
  'use strict';

  var KEY = 'cm.firebase';
  var TOPIC = 'concours';
  var state = { token: null, lastMessage: null, configFetched: 0, errors: [], started: false };

  function prefs() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function savePrefs(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } }
  function plugins() { return (global.cordova && global.cordova.plugins && global.cordova.plugins.firebase) || {}; }
  function A() { return plugins().analytics; }
  function M() { return plugins().messaging; }
  function C() { return plugins().config; }
  function ar() { return document.documentElement.getAttribute('lang') === 'ar'; }
  function tr(fr, a) { return ar() ? a : fr; }

  function note(where, e) {
    var msg = String(e && e.message || e);
    state.errors.push({ t: Date.now(), where: where, msg: msg });
    if (state.errors.length > 30) state.errors.shift();
    console.warn('[firebase] ' + where + ' :', msg);
  }

  /* Firebase rules: event and parameter names [A-Za-z0-9_], at most 40
     characters; string values at most 100 characters. */
  function name40(s) { return String(s || '').replace(/[^A-Za-z0-9_]/g, '_').replace(/^[^A-Za-z]+/, '').slice(0, 40); }
  function clean(params) {
    var out = {};
    Object.keys(params || {}).slice(0, 25).forEach(function (k) {
      var v = params[k];
      if (v == null) return;
      out[name40(k)] = typeof v === 'number' || typeof v === 'boolean' ? v : String(v).slice(0, 100);
    });
    return out;
  }

  /* Only app routes made of plain path characters are opened. */
  function safeRoute(r) {
    r = String(r || '').replace(/^#?\/?/, '');
    return /^[a-z0-9\-\/]{0,120}$/.test(r) ? r : null;
  }
  function openRoute(r) {
    var route = safeRoute(r);
    if (route !== null) global.location.hash = '#/' + route;
  }

  function messageText(payload) {
    var g = (payload && (payload.gcm || payload.notification)) || {};
    return { title: g.title || payload.title || '', body: g.body || payload.body || '', route: payload && payload.route };
  }

  function showMessage(payload) {
    var m = messageText(payload);
    state.lastMessage = { t: Date.now(), title: m.title, body: m.body, route: m.route || null };
    if (!m.title && !m.body) return;
    var UI = global.CM && global.CM.ui;
    if (!UI || !UI.sheet || (UI.isSheetOpen && UI.isSheetOpen())) {
      if (global.cmToast) global.cmToast(m.title || m.body);
      return;
    }
    var actions = [{ label: tr('Fermer', 'إغلاق'), style: 'ghost' }];
    if (safeRoute(m.route) !== null && m.route) actions.push({ label: tr('Voir', 'عرض'), style: 'primary', onclick: function () { openRoute(m.route); } });
    UI.sheet({ title: m.title || tr('Concours Maroc', 'Concours Maroc'), body: m.body, actions: actions });
  }

  function topics(lang, on) {
    var M_ = M();
    var list = [TOPIC, TOPIC + '_' + (lang === 'ar' ? 'ar' : 'fr')];
    var other = TOPIC + '_' + (lang === 'ar' ? 'fr' : 'ar');
    var jobs = list.map(function (t) { return on ? M_.subscribe(t) : M_.unsubscribe(t); });
    if (on) jobs.push(Promise.resolve(M_.unsubscribe(other)).catch(function () { /* not subscribed */ }));
    return Promise.all(jobs);
  }

  var FB = {
    present: function () { return { analytics: !!A(), messaging: !!M(), config: !!C() }; },

    // ------------------------------------------------------------ statistics
    analyticsOn: function () { return prefs().analytics !== false; },
    setAnalytics: function (on) {
      var p = prefs();
      p.analytics = !!on;
      savePrefs(p);
      if (!A()) return Promise.resolve(false);
      return Promise.resolve(A().setEnabled(!!on)).then(function () { return true; }, function (e) { note('setEnabled', e); return false; });
    },
    log: function (name, params) {
      if (!A() || !FB.analyticsOn()) return Promise.resolve(false);
      return Promise.resolve(A().logEvent(name40(name), clean(params))).then(function () { return true; }, function (e) { note('logEvent', e); return false; });
    },
    screen: function (key) {
      if (!A() || !FB.analyticsOn()) return;
      var name = String(key || 'accueil').replace(/\/$/, '') || 'accueil';
      Promise.resolve(A().setCurrentScreen(name.slice(0, 100))).catch(function (e) { note('setCurrentScreen', e); });
    },

    // --------------------------------------------------------- notifications
    notificationsOn: function () { return !!prefs().alerts; },
    enableNotifications: function (lang) {
      if (!M()) return Promise.resolve('unavailable');
      return Promise.resolve(M().requestPermission({ forceShow: false }))
        .then(function () { return topics(lang, true); })
        .then(function () {
          var p = prefs(); p.alerts = true; p.alertsLang = lang; savePrefs(p);
          FB.log('notifications_on', { language: lang });
          return 'on';
        })
        .catch(function (e) { note('notifications', e); return 'denied'; });
    },
    disableNotifications: function () {
      var p = prefs();
      var lang = p.alertsLang || 'fr';
      p.alerts = false; savePrefs(p);
      if (!M()) return Promise.resolve('off');
      return topics(lang, false).then(function () { return 'off'; }, function (e) { note('unsubscribe', e); return 'off'; });
    },
    token: function () {
      if (!M()) return Promise.resolve(null);
      return Promise.resolve(M().getToken()).then(function (t) { state.token = t || null; return state.token; }, function (e) { note('getToken', e); return null; });
    },

    // --------------------------------------------------------- remote config
    fetchConfig: function (maxAgeSeconds) {
      if (!C()) return Promise.resolve(false);
      return Promise.resolve(C().fetch(maxAgeSeconds == null ? 6 * 3600 : maxAgeSeconds))
        .then(function () { return C().activate(); })
        .then(function () { state.configFetched = Date.now(); return true; }, function (e) { note('config', e); return false; });
    },
    getString: function (key) {
      if (!C()) return Promise.resolve('');
      return Promise.resolve(C().getString(key)).then(function (v) { return v || ''; }, function () { return ''; });
    },

    debug: function () {
      var p = prefs();
      return { present: FB.present(), analytics: FB.analyticsOn(), alerts: !!p.alerts, alertsLang: p.alertsLang || null,
        token: state.token, lastMessage: state.lastMessage, configFetched: state.configFetched, errors: state.errors.slice() };
    },
    openRoute: openRoute,

    init: function (lang) {
      if (state.started) return;
      state.started = true;
      if (A()) {
        if (!FB.analyticsOn()) FB.setAnalytics(false);
        // The trainer and the search send gtag events on the website; in the
        // app the same calls go to Firebase.
        if (typeof global.gtag !== 'function') {
          global.gtag = function (cmd, name, params) { if (cmd === 'event') FB.log(name, params); };
        }
        document.addEventListener('cm:page', function (e) { FB.screen(e.detail && e.detail.key); });
      }
      if (M()) {
        M().onMessage(showMessage, function (e) { note('onMessage', e); });
        // a notification tapped while the app was closed or in the background
        M().onBackgroundMessage(function (payload) {
          state.lastMessage = { t: Date.now(), background: true, route: payload && payload.route || null };
          if (payload && payload.route) openRoute(payload.route);
        }, function (e) { note('onBackgroundMessage', e); });
        var p = prefs();
        if (p.alerts && p.alertsLang !== lang) {      // language changed: switch topic
          topics(lang, true).then(function () { var q = prefs(); q.alertsLang = lang; savePrefs(q); }, function (e) { note('topics', e); });
        }
      }
    }
  };

  global.CM = global.CM || {};
  global.CM.firebase = FB;
})(window);

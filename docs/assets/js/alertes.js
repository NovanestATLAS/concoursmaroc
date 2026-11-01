/* Concours Maroc — alerts by notification (website only).
 *
 * Every [data-alert="<concours>"] button turns the alerts for that concours
 * on or off. On: notification permission (asked only after a tap), push
 * subscription through the service worker (sw.js), then the list of
 * concours is saved by the API (/api/push/, push/api.mjs), which sends a
 * confirmation at once and the reminders later. State kept on the device
 * in localStorage "cm.alerts" = { t: [concours…], e: endpoint }. */
(function () {
  'use strict';
  var doc = document.documentElement;
  if (doc.hasAttribute('data-app')) return;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-alert]'));
  if (!buttons.length) return;

  var ROOT = doc.getAttribute('data-root') || './';
  var API = ROOT + 'api/push/';
  var LANG = doc.getAttribute('data-lang') || 'fr';
  var AR = LANG === 'ar';
  var SUPPORTED = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var IOS = doc.classList.contains('is-ios');
  var STANDALONE = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);

  var T = AR ? {
    on: function (n) { return 'تم التفعيل: ' + n + '. سيصلك إشعار تأكيد الآن.'; },
    off: 'تم إيقاف التنبيهات لهذه المباراة.',
    ios: 'على iPhone: اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية»، وافتح Concours Maroc من الأيقونة، ثم فعّل التنبيهات.',
    unsupported: 'متصفحك لا يدعم الإشعارات. جرّب Chrome.',
    denied: 'الإشعارات محظورة لهذا الموقع. اسمح بها من إعدادات المتصفح (رمز القفل بجانب العنوان) ثم أعد المحاولة.',
    dismissed: 'لتصلك التنبيهات، اقبل الإشعارات عندما يطلب المتصفح ذلك.',
    soon: 'التنبيهات ستكون متاحة خلال ساعات قليلة. عد قريبًا!',
    error: 'تعذر تفعيل التنبيهات حاليًا. أعد المحاولة لاحقًا.',
    wait: 'جارٍ التفعيل…'
  } : {
    on: function (n) { return 'C’est activé : ' + n + '. Une notification de confirmation arrive.'; },
    off: 'Alertes désactivées pour ce concours.',
    ios: 'Sur iPhone : touche « Partager » puis « Sur l’écran d’accueil », ouvre Concours Maroc depuis l’icône, puis active les alertes.',
    unsupported: 'Ton navigateur ne gère pas les notifications. Essaie avec Chrome.',
    denied: 'Les notifications sont bloquées pour ce site. Autorise-les dans les réglages du navigateur (cadenas à gauche de l’adresse), puis réessaie.',
    dismissed: 'Pour recevoir les alertes, accepte les notifications quand le navigateur te le demande.',
    soon: 'Les alertes seront disponibles dans quelques heures. Reviens bientôt !',
    error: 'Impossible d’activer les alertes pour le moment. Réessaie plus tard.',
    wait: 'Activation…'
  };

  function load() { try { var s = JSON.parse(localStorage.getItem('cm.alerts') || 'null'); if (s && Array.isArray(s.t)) return s; } catch (e) { /* none */ } return { t: [], e: '' }; }
  function save() { try { localStorage.setItem('cm.alerts', JSON.stringify(state)); } catch (e) { /* private mode */ } }
  function track(name, params) { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* ignore */ } }
  function b64uToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    var bin = atob(s + '==='.slice((s.length + 3) % 4));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function sameKey(buf, key) {
    if (!buf) return false;
    var a = new Uint8Array(buf), b = b64uToBytes(key);
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function post(route, data) {
    return fetch(API + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }

  var state = load();
  var busy = false;

  function label(id) {
    var b = document.querySelector('[data-alert="' + id + '"][data-label]');
    return b ? b.getAttribute('data-label') : id;
  }
  function render() {
    buttons.forEach(function (b) {
      var on = state.t.indexOf(b.getAttribute('data-alert')) !== -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('on', on);
    });
  }
  function say(btn, msg, kind) {
    var host = btn.closest('.alert-line, .alert-box, .updated, .hero-art') || btn.parentNode;
    var p = host.querySelector('.alert-msg');
    if (!p) { p = document.createElement('p'); p.className = 'alert-msg'; p.setAttribute('role', 'status'); host.appendChild(p); }
    p.textContent = msg;
    p.className = 'alert-msg' + (kind ? ' ' + kind : '');
  }

  function registration() {
    return navigator.serviceWorker.getRegistration().then(function (reg) {
      return reg || navigator.serviceWorker.register(ROOT + 'sw.js');
    }).then(function () { return navigator.serviceWorker.ready; });
  }
  function getKey() {
    return fetch(API + 'key').then(function (r) {
      if (r.status === 503) throw new Error('soon');
      if (!r.ok) throw new Error('key ' + r.status);
      return r.json();
    }).then(function (j) { return j.key; });
  }
  /* A push subscription made with the site's current key. */
  function subscription(fresh) {
    var keyP = getKey();
    return Promise.all([registration(), keyP]).then(function (res) {
      var reg = res[0], key = res[1];
      return reg.pushManager.getSubscription().then(function (sub) {
        if (sub && !fresh && sameKey(sub.options && sub.options.applicationServerKey, key)) return { sub: sub, key: key };
        return (sub ? sub.unsubscribe() : Promise.resolve()).then(function () {
          return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(key) });
        }).then(function (s) { return { sub: s, key: key }; });
      });
    });
  }
  function saveTopics(topics, confirm, retried) {
    return subscription(retried).then(function (x) {
      return post('subscribe', { sub: x.sub.toJSON(), topics: topics, lang: LANG, key: x.key, confirm: confirm }).then(function (r) {
        if ((r._status === 409 || r._status === 410) && !retried) return saveTopics(topics, confirm, true);
        if (!r.ok) throw new Error(r.error || ('status ' + r._status));
        state = { t: r.topics || topics, e: x.sub.endpoint };
        save();
        return state;
      });
    });
  }

  function turnOn(btn, id) {
    if (!SUPPORTED) { say(btn, IOS && !STANDALONE ? T.ios : T.unsupported, 'warn'); return; }
    if (Notification.permission === 'denied') { say(btn, T.denied, 'warn'); return; }
    busy = true;
    btn.classList.add('busy');
    say(btn, T.wait);
    Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') { say(btn, perm === 'denied' ? T.denied : T.dismissed, 'warn'); return; }
      var topics = state.t.indexOf(id) === -1 ? state.t.concat(id) : state.t.slice();
      return saveTopics(topics, true, false).then(function () {
        render();
        say(btn, T.on(label(id)), 'ok');
        track('alert_subscribe', { topic: id, page_lang: LANG });
      });
    }).catch(function (e) {
      say(btn, e && e.message === 'soon' ? T.soon : T.error, 'warn');
    }).then(function () { busy = false; btn.classList.remove('busy'); });
  }

  function turnOff(btn, id) {
    busy = true;
    var topics = state.t.filter(function (x) { return x !== id; });
    var done = function () {
      state.t = topics;
      if (!topics.length) state.e = '';
      save(); render();
      say(btn, T.off);
      track('alert_unsubscribe', { topic: id, page_lang: LANG });
    };
    navigator.serviceWorker.getRegistration().then(function (reg) {
      return reg ? reg.pushManager.getSubscription() : null;
    }).then(function (sub) {
      if (!sub) return null;
      if (topics.length) return post('subscribe', { sub: sub.toJSON(), topics: topics, lang: LANG, confirm: false });
      return post('unsubscribe', { endpoint: sub.endpoint }).then(function () { return sub.unsubscribe(); });
    }).catch(function () { /* the server forgets dead subscriptions by itself */ })
      .then(done).then(function () { busy = false; });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      if (busy) return;
      var id = b.getAttribute('data-alert');
      if (state.t.indexOf(id) === -1) turnOn(b, id); else turnOff(b, id);
    });
  });

  /* The device state may have changed since the last visit (permission
     revoked, subscription renewed or dropped by the browser). */
  if (SUPPORTED && state.t.length) {
    if (Notification.permission !== 'granted') { state = { t: [], e: '' }; save(); }
    else {
      navigator.serviceWorker.getRegistration().then(function (reg) {
        return reg ? reg.pushManager.getSubscription() : null;
      }).then(function (sub) {
        if (!sub) state = { t: [], e: '' };
        else if (sub.endpoint !== state.e) state.e = sub.endpoint; // renewed by sw.js
        save(); render();
      }).catch(function () {});
    }
  } else if (!SUPPORTED && state.t.length) { state = { t: [], e: '' }; save(); }
  render();
})();

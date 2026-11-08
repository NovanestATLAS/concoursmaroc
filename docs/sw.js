/* Concours Maroc — service worker.
 * Network-first for pages (always fresh when online), cache-first for static
 * assets and question banks (instant and offline after the first visit).
 * Also shows the alerts sent by the API (push/api.mjs, src/js/alertes.js). */
var VERSION = 'dc73b9609b86';
var CACHE = 'cm-' + VERSION;
var PRECACHE = ["ar/entrainement/index.html","ar/index.html","assets/css/concours-maroc.css","assets/css/entrainement.css","assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2","assets/fonts/readex-pro-arabic-wght-normal.woff2","assets/js/alertes.js","assets/js/annuaire.js","assets/js/contact.js","assets/js/echeances.js","assets/js/engage.js","assets/js/entrainement/app.js","assets/js/entrainement/data-loader.js","assets/js/entrainement/i18n.js","assets/js/entrainement/math.js","assets/js/entrainement/quiz-engine.js","assets/js/entrainement/stats.js","assets/js/entrainement/storage.js","assets/js/entrainement/tts.js","assets/js/entrainement/ui.js","assets/js/entrainement/utils.js","assets/js/outils/calcul-note-bac.js","assets/js/outils/checklist-dossier.js","assets/js/outils/commun.js","assets/js/outils/orientation-apres-bac.js","assets/js/outils/planning-revision.js","assets/js/outils/simulateur-qcm.js","assets/js/site.js","assets/vendor/katex/fonts/KaTeX_AMS-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2","assets/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2","assets/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Main-Bold.woff2","assets/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2","assets/vendor/katex/fonts/KaTeX_Main-Italic.woff2","assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2","assets/vendor/katex/fonts/KaTeX_Math-Italic.woff2","assets/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2","assets/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2","assets/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Script-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Size1-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Size2-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Size3-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Size4-Regular.woff2","assets/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2","assets/vendor/katex/katex.min.css","assets/vendor/katex/katex.min.js","data/concours.json","data/i18n/ar.json","data/i18n/fr.json","data/manifest.json","data/outils.json","data/sources.json","entrainement/index.html","favicon.svg","index.html","manifest.webmanifest","offline.html"];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE.map(function (p) { return new Request(p, { cache: 'reload' }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('cm-') === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var isPage = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isPage) {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match(new URL('offline.html', self.registration.scope).href);
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
      return hit || net;
    })
  );
});

/* ---------------------------------------------------------------- alerts
   Payload (JSON, encrypted by the push service): { title, body, url, tag, lang }. */
self.addEventListener('push', function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  var scope = self.registration.scope;
  event.waitUntil(self.registration.showNotification(d.title || 'Concours Maroc', {
    body: d.body || '',
    icon: new URL('assets/img/concours-maroc-icon-192.png', scope).href,
    badge: new URL('assets/img/notification-badge.png', scope).href,
    tag: d.tag || 'cm',
    renotify: !!d.tag,
    lang: d.lang || 'fr',
    dir: d.lang === 'ar' ? 'rtl' : 'ltr',
    data: { url: d.url || scope }
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.split('?')[0] === url.split('?')[0] && 'focus' in list[i]) return list[i].focus();
    }
    return self.clients.openWindow(url);
  }));
});

/* The browser replaced the subscription: keep the same concours on the new one. */
self.addEventListener('pushsubscriptionchange', function (event) {
  var old = event.oldSubscription;
  var next = event.newSubscription
    ? Promise.resolve(event.newSubscription)
    : (old && old.options ? self.registration.pushManager.subscribe(old.options) : Promise.reject(new Error('no options')));
  event.waitUntil(next.then(function (sub) {
    return fetch(new URL('api/push/renew', self.registration.scope).href, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ old: old ? old.endpoint : '', sub: sub.toJSON() })
    });
  }).catch(function () { /* the next visit asks again */ }));
});

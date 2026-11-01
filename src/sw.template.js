/* Concours Maroc — service worker.
 * Network-first for pages (always fresh when online), cache-first for static
 * assets and question banks (instant and offline after the first visit).
 * Also shows the alerts sent by the API (push/api.mjs, src/js/alertes.js). */
var VERSION = '__VERSION__';
var CACHE = 'cm-' + VERSION;
var PRECACHE = __PRECACHE__;

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

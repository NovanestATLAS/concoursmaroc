/* Concours Maroc — service worker.
 * Network-first for pages (always fresh when online), cache-first for static
 * assets and question banks (instant and offline after the first visit). */
var VERSION = 'd9c913a2e3ec';
var CACHE = 'cm-' + VERSION;
var PRECACHE = ["ar/entrainement/index.html","ar/index.html","assets/css/concours-maroc.css","assets/css/entrainement.css","assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2","assets/fonts/readex-pro-arabic-wght-normal.woff2","assets/js/annuaire.js","assets/js/echeances.js","assets/js/entrainement/app.js","assets/js/entrainement/data-loader.js","assets/js/entrainement/i18n.js","assets/js/entrainement/quiz-engine.js","assets/js/entrainement/stats.js","assets/js/entrainement/storage.js","assets/js/entrainement/tts.js","assets/js/entrainement/ui.js","assets/js/entrainement/utils.js","assets/js/outils/calcul-note-bac.js","assets/js/outils/checklist-dossier.js","assets/js/outils/commun.js","assets/js/outils/orientation-apres-bac.js","assets/js/outils/planning-revision.js","assets/js/outils/simulateur-qcm.js","assets/js/site.js","data/concours.json","data/i18n/ar.json","data/i18n/fr.json","data/manifest.json","data/outils.json","data/sources.json","entrainement/index.html","favicon.svg","index.html","manifest.webmanifest","offline.html"];

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

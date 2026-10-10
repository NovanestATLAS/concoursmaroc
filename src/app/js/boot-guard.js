/* Concours Maroc (Android app) — last-resort start-up diagnostic.
 *
 * Runs before every other script, so that a missing file or an error in any
 * of them shows a readable message instead of an endless spinner. It stands
 * down as soon as the app sets CM.appStarted. (The first version had this as
 * an inline script, which its own CSP blocked; it is now a file.) */
(function () {
  'use strict';
  var reported = false;
  function started() { return window.CM && window.CM.appStarted; }
  function report(title, detail) {
    if (reported || started()) return;
    reported = true;
    var host = document.getElementById('view');
    if (!host) return;
    host.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'container app-boot';
    var h = document.createElement('p');
    h.textContent = title;
    var d = document.createElement('p');
    d.className = 'err';
    d.textContent = detail || '';
    var b = document.createElement('button');
    b.className = 'btn';
    b.type = 'button';
    b.textContent = 'Réessayer / إعادة المحاولة';
    b.onclick = function () { location.reload(); };
    box.appendChild(h); box.appendChild(d); box.appendChild(b);
    host.appendChild(box);
  }
  window.addEventListener('error', function (e) {
    var src = e && e.target && (e.target.src || e.target.href);
    // cordova.js does not exist in a desktop browser: that is expected.
    if (src && /cordova\.js$/.test(src)) return;
    if (src) { report('Fichier introuvable / ملف غير موجود', String(src).split('/').pop()); return; }
    report('Erreur au démarrage / خطأ عند التشغيل', (e && e.message) || '');
  }, true);
  setTimeout(function () {
    if (started()) return;
    var expected = ['load', 'utils', 'store', 'i18n', 'data', 'tts', 'ads', 'stats', 'quiz', 'ui', 'app', 'shell'];
    var missing = expected.filter(function (k) { return !window.CM || !window.CM[k]; });
    report('Le démarrage n’a pas abouti / تعذر التشغيل',
      missing.length ? 'Modules : ' + missing.join(', ') : 'Les modules sont chargés mais la première page n’a pas pu s’afficher.');
  }, 15000);
})();

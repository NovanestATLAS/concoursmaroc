/* Concours Maroc (Android app) — applied before the first paint so that the
 * dark theme never flashes white. Kept in a file: the CSP forbids inline
 * scripts. */
(function () {
  try {
    var t = localStorage.getItem('cm.theme');
    if (!t || t === 'auto') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* storage unavailable */ }
})();

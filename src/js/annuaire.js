/* Concours directory: client-side filters (name, bac series, level). */
(function () {
  'use strict';
  var q = document.getElementById('f-q');
  var bac = document.getElementById('f-bac');
  var level = document.getElementById('f-level');
  var count = document.getElementById('f-count');
  var none = document.getElementById('f-none');
  if (!q || !bac || !level) return;
  var LANG = document.documentElement.getAttribute('data-lang') || 'fr';
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-concours]'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-group-section]'));

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function apply() {
    var term = norm(q.value.trim());
    var b = bac.value;
    var l = level.value;
    var shown = 0;
    cards.forEach(function (c) {
      var ok = true;
      if (term && norm(c.getAttribute('data-name')).indexOf(term) === -1) ok = false;
      if (b) {
        var list = (c.getAttribute('data-bac') || '').split(' ');
        // concours open to any bac (or none) carry an empty list: keep them
        if (list[0] && list.indexOf(b) === -1) ok = false;
      }
      if (l && c.getAttribute('data-level') !== l) ok = false;
      c.hidden = !ok;
      if (ok) shown++;
    });
    sections.forEach(function (s) {
      s.hidden = !s.querySelector('[data-concours]:not([hidden])');
    });
    if (count) count.textContent = shown + (LANG === 'ar' ? ' مباراة' : ' concours');
    if (none) none.hidden = shown !== 0;
    try {
      var params = new URLSearchParams();
      if (q.value) params.set('q', q.value);
      if (b) params.set('bac', b);
      if (l) params.set('niveau', l);
      var s = params.toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
    } catch (e) { /* old browser */ }
  }
  try {
    var p = new URLSearchParams(location.search);
    if (p.get('q')) q.value = p.get('q');
    if (p.get('bac')) bac.value = p.get('bac');
    if (p.get('niveau')) level.value = p.get('niveau');
  } catch (e) { /* ignore */ }
  [q, bac, level].forEach(function (el) { el.addEventListener('input', apply); el.addEventListener('change', apply); });
  apply();
})();

/* Concours Maroc — practice app: shared helpers. Classic script, no modules. */
(function (global) {
  'use strict';

  var U = {};

  // ---------------------------------------------------------------- DOM
  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  U.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };

  U.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); };

  /* Text is always inserted through textContent, never innerHTML, so the only
     escaping needed is for the few places building an attribute string. */
  U.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // ---------------------------------------------------------------- random
  /* Mulberry32: small, fast, and above all deterministic, which is what the
     daily challenge needs so that every device gets the same 10 questions. */
  U.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.hash = function (str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  U.shuffle = function (arr, rand) {
    var r = rand || Math.random;
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  };

  U.sample = function (arr, n, rand) { return U.shuffle(arr, rand).slice(0, n); };

  // ---------------------------------------------------------------- format
  U.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  U.clock = function (seconds) {
    var s = Math.max(0, Math.round(seconds));
    var m = Math.floor(s / 60);
    if (m >= 60) return Math.floor(m / 60) + ':' + U.pad2(m % 60) + ':' + U.pad2(s % 60);
    return m + ':' + U.pad2(s % 60);
  };

  U.pct = function (num, den) { return den > 0 ? Math.round((num / den) * 100) : 0; };

  U.todayKey = function (d) {
    var t = d || new Date();
    return t.getFullYear() + '-' + U.pad2(t.getMonth() + 1) + '-' + U.pad2(t.getDate());
  };

  U.addDays = function (key, n) {
    var d = new Date((key || U.todayKey()) + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return U.todayKey(d);
  };

  /* French-style number: 12.5 -> "12,5" (Arabic UI keeps the dot). */
  U.num = function (x, lang, digits) {
    var v = typeof digits === 'number' ? Number(x).toFixed(digits) : String(Math.round(x * 100) / 100);
    return lang === 'ar' ? v : v.replace('.', ',');
  };

  U.daysBetween = function (aKey, bKey) {
    var a = new Date(aKey + 'T00:00:00');
    var b = new Date(bKey + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  };

  U.dateLabel = function (iso, lang) {
    try {
      return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-MA',
        { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return String(iso).slice(0, 10); }
  };

  // ---------------------------------------------------------------- misc
  U.debounce = function (fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait || 200);
    };
  };

  U.uid = function (prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' +
      Math.floor(Math.random() * 1e6).toString(36);
  };

  U.deepClone = function (obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return null; }
  };

  U.reducedMotion = function () {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  U.vibrate = function (pattern) {
    // Feature-detected: absent on desktop browsers and on some Android builds.
    if (!global.navigator || typeof global.navigator.vibrate !== 'function') return false;
    try { return global.navigator.vibrate(pattern); } catch (e) { return false; }
  };

  global.CM = global.CM || {};
  global.CM.utils = U;
})(window);

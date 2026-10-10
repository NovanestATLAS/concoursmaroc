/* Concours Maroc — shared helpers for the tools pages (outils/*).
 * Plain ES5-compatible script, loaded before each tool script. Exposes
 * window.CMT. Everything runs in the browser; inputs are kept in
 * localStorage on the visitor's device only. */
(function (global) {
  'use strict';

  var doc = document.documentElement;
  // Page links start with ROOT ("../../" on the website, "#/" in the Android
  // app); data files with ASSETS (the www root in the app).
  var ROOT = doc.getAttribute('data-root') || './';
  var ASSETS = doc.hasAttribute('data-asset-root') ? doc.getAttribute('data-asset-root') : ROOT;
  var APP = doc.hasAttribute('data-app');
  var LANG = doc.getAttribute('data-lang') || 'fr';
  var AR = LANG === 'ar';
  var cache = {};

  /* Parameters of the current URL: the query string on the website, the
     part after "?" in the route ("#/outils/x/?bac=SM") in the app. */
  function params() {
    var q = location.search;
    var h = location.hash.indexOf('?');
    if (h !== -1) q = location.hash.slice(h);
    try { return new URLSearchParams(q); } catch (e) { return null; }
  }

  var CMT = {
    ROOT: ROOT,
    APP: APP,
    LANG: LANG,
    AR: AR,

    /* Picks the string for the page language. */
    tr: function (fr, ar) { return AR ? ar : fr; },

    /* "14,5" or "14.5" -> 14.5 ; empty or invalid -> NaN. */
    num: function (v) {
      if (v === null || v === undefined) return NaN;
      var s = String(v).trim().replace(/\s/g, '').replace(',', '.');
      if (s === '') return NaN;
      var n = Number(s);
      return isFinite(n) ? n : NaN;
    },

    /* Same convention as the practice app: comma decimals in French,
       dot decimals in Arabic, trailing zeros removed. */
    fmt: function (n, digits) {
      if (!isFinite(n)) return '—';
      var d = typeof digits === 'number' ? digits : 2;
      var p = Math.pow(10, d);
      var v = String(Math.round(n * p) / p);
      return AR ? v : v.replace('.', ',');
    },

    signed: function (n, digits) {
      if (!isFinite(n)) return '—';
      return (n > 0 ? '+' : n < 0 ? '−' : '') + CMT.fmt(Math.abs(n), digits);
    },

    el: function (tag, attrs, children) {
      var node = document.createElement(tag);
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          var v = attrs[k];
          if (v === null || v === undefined || v === false) return;
          if (k === 'class') node.className = v;
          else if (k === 'text') node.textContent = v;
          else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
          else node.setAttribute(k, v === true ? '' : String(v));
        });
      }
      (children || []).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
      return node;
    },

    clear: function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); },

    /* JSON from /data/, fetched once per page. */
    data: function (name) {
      if (!cache[name]) {
        var url = ASSETS + 'data/' + name + '.json';
        cache[name] = global.CM && global.CM.load ? global.CM.load.json(url) : fetch(url).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
      }
      return cache[name];
    },

    store: {
      get: function (key, def) {
        try {
          var v = localStorage.getItem('cm.tools.' + key);
          return v === null ? def : JSON.parse(v);
        } catch (e) { return def; }
      },
      set: function (key, value) {
        try { localStorage.setItem('cm.tools.' + key, JSON.stringify(value)); } catch (e) { /* private mode */ }
      }
    },

    /* Query string parameters (?bac=SM&note=14.2). */
    param: function (name) {
      var p = params();
      return p ? p.get(name) : null;
    },

    L: function (obj) { return obj ? (obj[LANG] || obj.fr || '') : ''; },

    guideHref: function (c) { return ROOT + (c.guide ? (c.guide[LANG] || c.guide.fr) : ''); },
    /* Link to the trainer with a concours selected, optionally on a given
       screen ("mock"). The screen is a hash route on the website and a path
       segment of the route in the app. */
    practiceHref: function (id, screen) {
      var base = ROOT + (AR ? 'ar/' : '') + 'entrainement/';
      var q = '?concours=' + encodeURIComponent(id);
      if (APP) return base + (screen || '') + q;
      return base + q + (screen ? '#/' + screen : '');
    },

    today: function () {
      var d = new Date();
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    },

    parseDate: function (iso) {
      var p = String(iso).split('-').map(Number);
      return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
    },

    dateLabel: function (d, opts) {
      try {
        return d.toLocaleDateString(AR ? 'ar-MA' : 'fr-FR', opts || { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) { return d.toISOString().slice(0, 10); }
    },

    /* Full years between birth (yyyy-mm-dd) and a Date. */
    ageAt: function (birthIso, at) {
      var b = CMT.parseDate(birthIso);
      var age = at.getFullYear() - b.getFullYear();
      if (at.getMonth() < b.getMonth() || (at.getMonth() === b.getMonth() && at.getDate() < b.getDate())) age--;
      return age;
    },

    fail: function (host, err) {
      if (!host) return;
      CMT.clear(host);
      host.appendChild(CMT.el('div', { class: 'callout warn' }, [
        CMT.tr('Impossible de charger les données de l’outil. Vérifiez votre connexion puis rechargez la page.', 'تعذر تحميل بيانات الأداة. تحقق من الاتصال ثم أعد تحميل الصفحة.')
      ]));
      if (global.console) console.error('[outils]', err);
    }
  };

  global.CMT = CMT;
})(window);

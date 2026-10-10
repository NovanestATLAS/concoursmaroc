/* Concours Maroc — site-wide behaviour: menu, theme, search, print/share,
 * service worker. Plain ES5-compatible script, no dependency. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var ROOT = doc.getAttribute('data-root') || './';
  // Android app: pages are routes of a single-page shell and change language
  // without a reload, so the language is always read at call time.
  var APP = doc.hasAttribute('data-app');
  function lang() { return doc.getAttribute('data-lang') || 'fr'; }
  function searchUrl() {
    return (doc.getAttribute('data-search') || ROOT + 'assets/search-{lang}.json').replace('{lang}', lang());
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---------------------------------------------------------------- toast
  window.cmToast = function (msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  };

  // ---------------------------------------------------------------- menu
  var menuBtn = $('#menu-btn');
  var nav = $('#site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---------------------------------------------------------------- theme
  var SUN = 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M11 1h2v3h-2zm0 19h2v3h-2zM3.5 4.9l1.4-1.4 2.1 2.1-1.4 1.4zm12.9 12.9 1.4-1.4 2.1 2.1-1.4 1.4zM1 11h3v2H1zm19 0h3v2h-3zM4.9 20.5l-1.4-1.4 2.1-2.1 1.4 1.4zM17.8 7.6l-1.4-1.4 2.1-2.1 1.4 1.4z';
  var MOON = 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z';
  var themeBtn = $('#theme-btn');
  function paintThemeIcon() {
    if (!themeBtn) return;
    var p = themeBtn.querySelector('path');
    if (p) p.setAttribute('d', doc.getAttribute('data-theme') === 'dark' ? SUN : MOON);
  }
  paintThemeIcon();
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('cm.theme', next); } catch (e) { /* private mode */ }
      paintThemeIcon();
      document.dispatchEvent(new CustomEvent('cm:theme', { detail: next }));
    });
  }

  // ---------------------------------------------------------------- search
  var index = null;
  var indexLang = null;
  var loading = null;
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/[’'`´\-_\/.,;:!?()«»"]+/g, ' ');
  }
  // words that say nothing about what is searched ("école de l'air", "marine ou air")
  var STOP = { de: 1, du: 1, des: 1, la: 1, le: 1, les: 1, l: 1, d: 1, et: 1, ou: 1, en: 1, a: 1, au: 1, aux: 1, un: 1, une: 1, pour: 1, concours: 1, 'في': 1, 'من': 1, 'و': 1, 'مباراه': 1 };
  function getJson(url) {
    if (window.CM && window.CM.load) return window.CM.load.json(url);
    return fetch(url).then(function (r) { return r.json(); });
  }
  function loadIndex() {
    if (index && indexLang === lang()) return Promise.resolve(index);
    if (loading && indexLang === lang()) return loading;
    indexLang = lang();
    index = null;
    loading = getJson(searchUrl())
      .then(function (data) {
        index = data.map(function (e) { e._t = norm(e.t); e._all = norm(e.t + ' ' + e.d + ' ' + e.k + ' ' + e.u); return e; });
        return index;
      }).catch(function () { index = []; return index; });
    return loading;
  }
  function search(q) {
    var all = norm(q).split(/\s+/).filter(Boolean);
    var terms = all.filter(function (t) { return !STOP[t]; });
    if (!terms.length) terms = all;
    if (!terms.length || !index) return [];
    var scored = index.map(function (e) {
      var hits = 0, score = 0;
      for (var i = 0; i < terms.length; i++) {
        if (e._all.indexOf(terms[i]) === -1) continue;
        hits++;
        score += 2;
        if (e._t.indexOf(terms[i]) !== -1) score += 3;
      }
      if (!hits) return null;
      if (e.u.indexOf('concours/') !== -1) score += 1;
      return { e: e, h: hits, s: score };
    }).filter(Boolean);
    // pages matching every word first, then those matching most of them
    // ("marine royale ou école de l'air" names two schools at once)
    var min = Math.min(2, terms.length);
    return scored.filter(function (x) { return x.h >= min; })
      .sort(function (a, b) { return b.h - a.h || b.s - a.s; }).slice(0, 8).map(function (x) { return x.e; });
  }
  function bindSearch(input, list) {
    if (!input || !list) return;
    var active = -1;
    function render() {
      var res = search(input.value);
      list.innerHTML = '';
      active = -1;
      if (!input.value.trim()) return;
      if (!res.length) {
        var li = document.createElement('li');
        li.innerHTML = '<small style="padding:9px 10px;display:block"></small>';
        li.firstChild.textContent = lang() === 'ar' ? 'لا توجد نتائج.' : 'Aucun résultat. Essayez « ENSA », « médecine » ou « police ».';
        list.appendChild(li);
        return;
      }
      res.forEach(function (e) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = ROOT + e.u;
        a.textContent = e.t.replace(/ \| Concours Maroc$/, '');
        var sm = document.createElement('small');
        sm.textContent = e.d;
        a.appendChild(sm);
        li.appendChild(a);
        list.appendChild(li);
      });
    }
    input.addEventListener('focus', loadIndex);
    input.addEventListener('input', function () { loadIndex().then(render); });
    input.addEventListener('keydown', function (ev) {
      var links = $$('a', list);
      if (!links.length) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        active = (active + (ev.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach(function (l, i) { l.classList.toggle('active', i === active); });
        links[active].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        (links[active] || links[0]).click();
      }
    });
  }
  var sBtn = $('#search-btn');
  var sPanel = $('#search-panel');
  if (sBtn && sPanel) {
    sBtn.addEventListener('click', function () {
      var open = sPanel.classList.toggle('open');
      sBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { loadIndex(); $('#search-input').focus(); }
    });
    function closeSearch() { sPanel.classList.remove('open'); sBtn.setAttribute('aria-expanded', 'false'); }
    document.addEventListener('click', function (e) {
      if (!sPanel.contains(e.target) && !sBtn.contains(e.target)) closeSearch();
      // a result was chosen: the panel must not stay over the next page
      else if (e.target.closest && e.target.closest('#search-results a')) closeSearch();
    });
    document.addEventListener('cm:page', closeSearch);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sPanel.classList.contains('open')) { sPanel.classList.remove('open'); sBtn.focus(); }
      if (e.key === '/' && !/input|textarea|select/i.test((document.activeElement || {}).tagName || '')) {
        e.preventDefault(); sPanel.classList.add('open'); loadIndex(); $('#search-input').focus();
      }
    });
  }
  bindSearch($('#search-input'), $('#search-results'));

  // ---------------------------------------------------------------- page content
  /* In the app, the page's address is local (https://localhost/#/…): share
     the same page of the website instead. */
  function shareUrl() {
    if (!APP) return location.href;
    var base = document.documentElement.getAttribute('data-site-url') || '';
    var cur = window.CM && CM.shell && CM.shell.current ? CM.shell.current() : null;
    var key = (cur && cur.key) || '';
    if (/^(ar\/)?app\//.test(key)) key = lang() === 'ar' ? 'ar/' : '';   // app-only pages
    return base + key;
  }
  function share() {
    var data = { title: document.title, url: shareUrl() };
    var sharing = window.plugins && window.plugins.socialsharing;
    if (sharing && sharing.shareWithOptions) { sharing.shareWithOptions({ subject: data.title, message: data.title, url: data.url }); return; }
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data.url).then(function () {
        window.cmToast(lang() === 'ar' ? 'تم نسخ الرابط' : 'Lien copié dans le presse-papiers');
      });
    }
  }
  /* Behaviour attached to elements of the page body. Called once on the
     website, and by the app router after every page swap. */
  function bindContent(root) {
    $$('[data-search-input]', root).forEach(function (inp) {
      bindSearch(inp, inp.parentNode.querySelector('[data-search-results]'));
    });
    $$('[data-print]', root).forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
    $$('[data-share]', root).forEach(function (b) { b.addEventListener('click', share); });
  }
  window.CMSite = { bindContent: bindContent, loadIndex: loadIndex };
  if (!APP) bindContent(document);

  // ---------------------------------------------------------------- service worker
  if (!APP && 'serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(ROOT + 'sw.js').catch(function () { /* optional */ });
    });
  }
})();

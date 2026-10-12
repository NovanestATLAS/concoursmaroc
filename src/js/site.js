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
  /* The index (assets/search-{lang}.json) lists every page with its title (t),
     description (d), keywords (k), address (u) and the distinct words of its
     text (w). A query word matches an indexed word exactly, as its beginning,
     through a common stem ("policier" → "police") or with one or two typos
     ("medcine" → "medecine"); pages are ranked by the number of query words
     they match, then by where they match (title > keywords > text); a word
     of the page address ("maths" → qcm/mathematiques-bac/) counts extra. */
  var index = null;
  var indexLang = null;
  var loading = null;
  var vocab = null;      // word -> { entry number: weight }
  var vocabWords = null; // the words of vocab, for prefix and typo matching
  var slugs = null;      // word of a page address -> { entry number: 1 }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[ً-ٕـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  }
  function words(s) { return norm(s).split(/[^a-z0-9ء-ي]+/).filter(Boolean); }
  // words that say nothing about what is searched ("école de l'air", "marine ou air")
  var STOP = { de: 1, du: 1, des: 1, la: 1, le: 1, les: 1, l: 1, d: 1, et: 1, ou: 1, en: 1, a: 1, au: 1, aux: 1, un: 1, une: 1, pour: 1, sur: 1, avec: 1, dans: 1, quel: 1, quelle: 1, comment: 1, concours: 1, 'في': 1, 'من': 1, 'و': 1, 'مباراه': 1, 'علي': 1 };
  // everyday words for a school or a field → word used on its page
  var SYN = {
    prepa: 'cpge', prepas: 'cpge', medecin: 'medecine', docteur: 'medecine', pharmacien: 'pharmacie', dentiste: 'dentaire',
    infirmier: 'ispits', infirmiere: 'ispits', sagefemme: 'ispits', paramedical: 'ispits', commerce: 'encg', gestion: 'encg',
    management: 'encg', architecte: 'architecture', policier: 'police', gendarme: 'gendarmerie', armee: 'far', soldat: 'far',
    militaire: 'far', pompier: 'protection', prison: 'dgapr', penitentiaire: 'dgapr', journaliste: 'isic', journalisme: 'isic',
    cinema: 'ismac', theatre: 'isadac', tourisme: 'isit', enseignant: 'ens', professeur: 'ens', prof: 'ens', instituteur: 'ens',
    codage: '1337', programmation: '1337', developpeur: '1337', veterinaire: 'iav', agronome: 'iav', agronomie: 'iav',
    pilote: 'era', aviation: 'era', aviateur: 'era', marin: 'ern', douanier: 'douane', ingenieur: 'ensa', mokhazni: 'auxiliaires',
    bourse: 'minhaty', exercices: 'qcm', exercice: 'qcm', test: 'qcm', tests: 'qcm', questions: 'qcm', annales: 'qcm', examen: 'qcm',
    math: 'mathematiques', maths: 'mathematiques', bio: 'biologie', biologie: 'svt', ingenieurs: 'ensa'
  };
  function getJson(url) {
    if (window.CM && window.CM.load) return window.CM.load.json(url);
    return fetch(url).then(function (r) { return r.json(); });
  }
  function addWords(list, i, weight) {
    for (var j = 0; j < list.length; j++) {
      var w = list[j];
      if (w.length < 2) continue;
      // Arabic: "الهندسة" is also found as "هندسة"
      var bare = w.length > 4 ? w.replace(/^(وال|بال|لل|ال)/, '') : w;
      var forms = bare !== w ? [w, bare] : [w];
      for (var f = 0; f < forms.length; f++) {
        var m = vocab[forms[f]] || (vocab[forms[f]] = {});
        if (!m[i] || m[i] < weight) m[i] = weight;
      }
    }
  }
  function prepare(data) {
    vocab = {};
    slugs = {};
    data.forEach(function (e, i) {
      addWords(words(e.t), i, 6);
      addWords(words(e.k + ' ' + e.u), i, 4);
      addWords(words(e.d), i, 3);
      addWords((e.w || '').split(' '), i, 1.5);
      words(e.u).forEach(function (w) { (slugs[w] || (slugs[w] = {}))[i] = 1; });
    });
    vocabWords = Object.keys(vocab);
    return data;
  }
  function loadIndex() {
    if (index && indexLang === lang()) return Promise.resolve(index);
    if (loading && indexLang === lang()) return loading;
    indexLang = lang();
    index = null;
    loading = getJson(searchUrl())
      .then(function (data) { index = prepare(data); return index; })
      .catch(function () { index = []; vocab = {}; vocabWords = []; slugs = {}; return index; });
    return loading;
  }
  // Damerau-Levenshtein distance, stopped early above max
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev2 = null, prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      var best = i;
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v;
        if (v < best) best = v;
      }
      if (best > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[b.length];
  }
  function common(a, b) { var n = 0; while (n < a.length && n < b.length && a[n] === b[n]) n++; return n; }
  /* Indexed words close to one query word, with a quality between 0 and 1. */
  function variants(term) {
    var out = {};
    if (vocab[term]) out[term] = 1;
    if (/^\d+$/.test(term)) return out;
    var maxd = term.length >= 7 ? 2 : term.length >= 4 ? 1 : 0;
    for (var i = 0; i < vocabWords.length; i++) {
      var w = vocabWords[i];
      if (w === term) continue;
      var q = 0;
      if (term.length >= 3 && w.indexOf(term) === 0) q = 0.85;                       // beginning of a word
      else if (w.length >= 4 && term.indexOf(w) === 0 && term.length - w.length <= 3) q = 0.8; // infirmieres → infirmier
      else if (Math.min(term.length, w.length) >= 5 && common(term, w) >= Math.max(5, Math.min(term.length, w.length) - 3)) q = 0.7; // stem
      else if (maxd && dist(term, w, maxd) <= maxd) q = 0.6;                          // typo
      if (q && (!out[w] || out[w] < q)) out[w] = q;
    }
    return out;
  }
  function search(q) {
    if (!index || !vocab) return [];
    var all = words(q);
    var terms = all.filter(function (t) { return !STOP[t]; });
    if (!terms.length) terms = all;
    if (!terms.length) return [];
    var score = {}, hits = {};
    terms.forEach(function (term) {
      var best = {}, slug = {};
      var groups = [variants(term)];
      if (SYN[term]) groups.push(variants(SYN[term]));
      var bare = term.length > 4 ? term.replace(/^(وال|بال|لل|ال)/, '') : term;
      if (bare !== term) groups.push(variants(bare));
      groups.forEach(function (vars, g) {
        Object.keys(vars).forEach(function (w) {
          var m = vocab[w];
          for (var i in m) {
            var s = vars[w] * m[i] * (g ? 0.9 : 1);
            if (!best[i] || best[i] < s) best[i] = s;
          }
          if (vars[w] === 1 && slugs[w]) for (var k in slugs[w]) slug[k] = 3;
        });
      });
      for (var i in best) { score[i] = (score[i] || 0) + best[i] + (slug[i] || 0); hits[i] = (hits[i] || 0) + 1; }
    });
    var need = Math.max(1, Math.ceil(terms.length / 2));
    return Object.keys(score).filter(function (i) { return hits[i] >= need; }).map(function (i) {
      var e = index[i];
      var s = score[i] + (e.u.indexOf('concours/') !== -1 ? 0.5 : 0);
      return { e: e, h: hits[i], s: s };
    }).sort(function (a, b) { return b.h - a.h || b.s - a.s; }).slice(0, 8).map(function (x) { return x.e; });
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
        // nothing found: say so, then offer the main sections instead of a dead end
        var li = document.createElement('li');
        li.innerHTML = '<small style="padding:9px 10px;display:block"></small>';
        li.firstChild.textContent = lang() === 'ar' ? 'لا توجد نتائج. تصفح:' : 'Aucun résultat exact. Essayez « ENSA », « médecine » ou « police », ou parcourez :';
        list.appendChild(li);
        res = lang() === 'ar'
          ? [{ u: 'ar/concours/', t: 'كل المباريات', d: 'دليل كل مباراة: الشروط، المواد، التواريخ' },
            { u: 'ar/entrainement/', t: 'التدريب', d: 'أسئلة متعددة الاختيارات مصححة حسب المباراة' },
            { u: 'ar/guides/', t: 'الأدلة', d: 'التوجيه، المنحة، الاختبارات النفسية التقنية' }]
          : [{ u: 'concours/', t: 'Tous les concours', d: 'Guide de chaque concours : conditions, matières, dates' },
            { u: 'qcm/', t: 'QCM corrigés', d: 'Questions corrigées par matière' },
            { u: 'entrainement/', t: 'Entraînement', d: 'Séries et concours blancs par concours' },
            { u: 'guides/', t: 'Guides', d: 'Orientation, bourse, tests psychotechniques, oral' }];
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
      else if (e.target.closest && e.target.closest('#search-results a')) {
        // Google Analytics (website only, when the GA4 tag is configured)
        var term = ($('#search-input') || {}).value;
        if (term && typeof window.gtag === 'function') window.gtag('event', 'search', { search_term: term.trim().slice(0, 80) });
        closeSearch();
      }
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

/* Concours Maroc — keeping visitors oriented and engaged (website only).
 *
 *  - "Quiz express" ([data-quiz]): 5 corrected QCM played inside the page
 *    (home page and concours fiches). Banks are fetched on demand from
 *    data/questions/<subject>.json; KaTeX is loaded only when a question
 *    holds a formula. Questions already seen are avoided (cm.qx.seen).
 *  - Recently viewed fiches ([data-track] records, [data-recent] lists).
 *  - Long pages ([data-track] with a .toc): reading progress and a bar under
 *    the header that names the current section and opens the table of
 *    contents; the current section is also marked in the side table.
 *
 * In the Android app (html[data-app]) the quiz and the recent fiches run too
 * (paths from data-asset-root, routes in the hash); the long-page bar does not. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var APP = doc.hasAttribute('data-app');
  var ROOT = doc.getAttribute('data-root') || './';
  var ASSET = APP ? (doc.getAttribute('data-asset-root') || '') : ROOT;
  var LANG = doc.getAttribute('data-lang') || 'fr';
  var AR = LANG === 'ar';
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] == null || attrs[k] === false) return;
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'cls') e.className = attrs[k];
      else e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  function track(name, params) { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* ignore */ } }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var T = AR ? {
    loading: 'جارٍ تحميل الأسئلة…', error: 'تعذر تحميل الأسئلة. تحقق من الاتصال وأعد المحاولة.', retry: 'أعد المحاولة',
    q: 'السؤال', next: 'السؤال التالي', finish: 'اعرض نتيجتي', ok: 'إجابة صحيحة!', ko: 'ليس تمامًا.', answer: 'الجواب الصحيح:',
    explain: 'الشرح', score: 'نتيجتك', again: '5 أسئلة أخرى', full: 'أكمل التمرين', mock: 'امتحان تجريبي', best: 'أفضل نتيجة',
    share: 'شارك نتيجتي', copied: 'تم نسخ الرابط', frNote: 'سؤال بالفرنسية', streak: 'إجابات صحيحة متتالية',
    msg: [[5, 'ممتاز! أنت مستعد للمستوى الأعلى.'], [4, 'جيد جدًا! بقي القليل لتبلغ العلامة الكاملة.'], [3, 'لا بأس! واصل التمرن على هذه المادة.'], [0, 'كل خطأ تصححه اليوم نقطة تربحها يوم المباراة. أعد المحاولة!']],
    shareText: function (s, n) { return 'حصلت على ' + s + '/' + n + ' في الاختبار السريع على Concours Maroc. جرّب أنت أيضًا!'; },
    recent: 'تابع من حيث توقفت:', toc: 'المحتويات', close: 'إغلاق', onPage: 'في هذه الصفحة'
  } : {
    loading: 'Chargement des questions…', error: 'Impossible de charger les questions. Vérifie ta connexion et réessaie.', retry: 'Réessayer',
    q: 'Question', next: 'Question suivante', finish: 'Voir mon score', ok: 'Bonne réponse !', ko: 'Pas tout à fait.', answer: 'Bonne réponse :',
    explain: 'Explication', score: 'Ton score', again: 'Encore 5 questions', full: "Continuer l'entraînement", mock: 'Examen blanc', best: 'Meilleur score',
    share: 'Partager mon score', copied: 'Lien copié', frNote: 'Question en français', streak: "bonnes réponses d'affilée",
    msg: [[5, 'Parfait ! Tu es prêt(e) pour le niveau supérieur.'], [4, "Très bien ! Encore un petit effort et c'est le sans-faute."], [3, "Pas mal ! Continue à t'entraîner sur cette matière."], [0, 'Chaque erreur corrigée aujourd’hui, c’est un point gagné le jour J. Recommence !']],
    shareText: function (s, n) { return "J'ai eu " + s + '/' + n + ' au quiz express de Concours Maroc. À toi de jouer !'; },
    recent: 'Reprendre là où tu t’es arrêté :', toc: 'Sommaire', close: 'Fermer', onPage: 'Sur cette page'
  };

  /* ------------------------------------------------------------ data */
  var banks = {};
  function bank(id) {
    if (!banks[id]) {
      var url = ASSET + 'data/questions/' + id + '.json';
      banks[id] = (APP && window.CM && CM.load && CM.load.json ? CM.load.json(url) : fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })).then(function (b) { return b.questions || []; });
      banks[id].catch(function () { delete banks[id]; });
    }
    return banks[id];
  }

  /* KaTeX + the trainer's formula helper, loaded once, only if needed. */
  var mathReady = null;
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = el('script', { src: src }); s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function ensureMath() {
    if (window.CM && window.CM.math && window.katex) return Promise.resolve();
    if (!mathReady) {
      document.head.appendChild(el('link', { rel: 'stylesheet', href: ASSET + (APP ? 'vendor/katex/katex.min.css' : 'assets/vendor/katex/katex.min.css') }));
      mathReady = loadScript(ASSET + (APP ? 'vendor/katex/katex.min.js' : 'assets/vendor/katex/katex.min.js'))
        .then(function () { return loadScript(ASSET + (APP ? 'js/math.js' : 'assets/js/entrainement/math.js')); })
        .catch(function () { /* formulas then show as plain text */ });
    }
    return mathReady;
  }
  function hasMath(q) {
    var L = q.l10n[q._lang];
    return [L.text, L.correction, L.explanation].concat(L.choices).join(' ').indexOf('$') !== -1;
  }
  function setText(node, s) {
    if (window.CM && window.CM.math && String(s || '').indexOf('$') !== -1) window.CM.math.set(node, s, true);
    else node.textContent = s == null ? '' : s;
    return node;
  }

  /* Picks n questions from the pool: page language first (then French),
     unseen first, following the difficulty mix of the concours if given. */
  function pick(pool, n, mix) {
    var seen = store.get('cm.qx.seen', []);
    var seenMap = {};
    seen.forEach(function (id) { seenMap[id] = 1; });
    var mine = pool.filter(function (q) { return q.l10n[LANG]; });
    var base = mine.length >= n ? mine : mine.concat(pool.filter(function (q) { return !q.l10n[LANG] && q.l10n.fr; }));
    var fresh = shuffle(base.filter(function (q) { return !seenMap[q.id]; }));
    var old = shuffle(base.filter(function (q) { return seenMap[q.id]; }));
    var ordered = fresh.concat(old);
    var out = [];
    var taken = {};
    function takeFrom(diff) {
      for (var i = 0; i < ordered.length; i++) {
        var q = ordered[i];
        if (!taken[q.id] && (!diff || q.difficulty === diff)) { taken[q.id] = 1; out.push(q); return true; }
      }
      return false;
    }
    while (out.length < n && out.length < ordered.length) {
      var diff = null;
      if (mix) {
        var r = Math.random(), acc = 0;
        Object.keys(mix).some(function (k) { acc += mix[k]; if (r <= acc) { diff = k; return true; } return false; });
      }
      if (!takeFrom(diff)) takeFrom(null);
    }
    out.forEach(function (q) { q._lang = q.l10n[LANG] ? LANG : 'fr'; });
    return out;
  }

  /* ------------------------------------------------------------ quiz */
  function Quiz(root) {
    var all = (root.getAttribute('data-subjects') || '').split(/\s+/).filter(Boolean);
    var labels = {};
    try { labels = JSON.parse(root.getAttribute('data-labels') || '{}'); } catch (e) { /* none */ }
    var mix = null;
    try { mix = JSON.parse(root.getAttribute('data-mix') || 'null'); } catch (e) { /* none */ }
    var N = +root.getAttribute('data-count') || 5;
    var practice = root.getAttribute('data-practice') || ROOT + (AR ? 'ar/' : '') + 'entrainement/';
    var mockHref = root.getAttribute('data-mock') || '';
    var where = root.getAttribute('data-where') || 'page';
    var stage = $('[data-quiz-stage]', root);
    var intro = $('[data-quiz-intro]', root);
    var chosen = all.slice();
    var qs = [], i = 0, good = 0, streak = 0;

    $$('[data-quiz-subject]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-quiz-subject]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var id = b.getAttribute('data-quiz-subject');
        chosen = id === '*' ? all.slice() : [id];
      });
    });
    $$('[data-quiz-start]', root).forEach(function (b) { b.addEventListener('click', start); });

    function show(node) {
      while (stage.firstChild) stage.removeChild(stage.firstChild);
      stage.appendChild(node);
      stage.hidden = false;
      if (intro) intro.hidden = true;
    }
    function scrollIn() {
      var r = root.getBoundingClientRect();
      if (r.top < 70 || r.top > window.innerHeight * 0.6) {
        var y = window.pageYOffset + r.top - 80;
        window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
      }
    }

    function start() {
      show(el('p', { cls: 'qx-loading', text: T.loading }));
      root.classList.add('playing');
      Promise.all(chosen.map(function (id) { return bank(id).catch(function () { return []; }); }))
        .then(function (lists) {
          var pool = [].concat.apply([], lists);
          qs = pick(pool, N, mix);
          if (!qs.length) throw new Error('empty');
          return qs.some(hasMath) ? ensureMath() : null;
        })
        .then(function () {
          i = 0; good = 0; streak = 0;
          track('quiz_express_start', { placement: where, subjects: chosen.join(','), page_lang: LANG });
          render();
          scrollIn();
        })
        .catch(function () {
          var retry = el('button', { cls: 'btn sm', type: 'button', text: T.retry });
          retry.addEventListener('click', start);
          show(el('div', { cls: 'qx-error' }, [el('p', { text: T.error }), retry]));
        });
    }

    function render() {
      var q = qs[i];
      var L = q.l10n[q._lang];
      var foreign = q._lang !== LANG;
      var box = el('div', { cls: 'qx-card' });
      var sub = labels[q.category] || q.category;
      box.appendChild(el('div', { cls: 'qx-top' }, [
        el('span', { cls: 'qx-sub', text: sub }),
        streak >= 2 ? el('span', { cls: 'qx-streak', text: '🔥 ' + streak + ' ' + T.streak }) : null,
        el('span', { cls: 'qx-count', text: T.q + ' ' + (i + 1) + '/' + qs.length })
      ]));
      var bar = el('div', { cls: 'qx-bar', 'aria-hidden': 'true' }, [el('i')]);
      bar.firstChild.style.width = (i / qs.length * 100) + '%';
      box.appendChild(bar);
      var body = el('div', foreign ? { lang: 'fr', dir: 'ltr', cls: 'qx-body' } : { cls: 'qx-body' });
      if (foreign) body.appendChild(el('span', { cls: 'qx-lang', text: T.frNote }));
      body.appendChild(setText(el('p', { cls: 'qx-q', id: 'qx-q-' + where + i }), L.text));
      var opts = el('div', { cls: 'qx-opts', role: 'group', 'aria-labelledby': 'qx-q-' + where + i });
      L.choices.forEach(function (c, k) {
        var b = el('button', { cls: 'qx-opt', type: 'button' }, [el('span', { cls: 'qx-letter', text: 'ABCDE'.charAt(k) }), setText(el('span', { cls: 'qx-txt' }), c)]);
        b.addEventListener('click', function () { answer(k, opts, L, body); });
        opts.appendChild(b);
      });
      body.appendChild(opts);
      box.appendChild(body);
      show(box);
      var first = $('.qx-opt', box);
      if (first && i > 0) first.focus({ preventScroll: true });
    }

    function answer(k, opts, L, body) {
      var right = k === L.correctIndex;
      if (right) { good++; streak++; } else streak = 0;
      $$('.qx-opt', opts).forEach(function (b, n) {
        b.disabled = true;
        if (n === L.correctIndex) b.classList.add('ok');
        else if (n === k) b.classList.add('ko');
      });
      var seen = store.get('cm.qx.seen', []);
      seen.push(qs[i].id);
      store.set('cm.qx.seen', seen.slice(-300));
      var fb = el('div', { cls: 'qx-fb ' + (right ? 'ok' : 'ko'), role: 'status' }, [
        el('strong', { text: right ? T.ok : T.ko }),
        right ? null : setText(el('p', { cls: 'qx-corr' }), L.correction || (T.answer + ' ' + L.choices[L.correctIndex])),
        L.explanation ? setText(el('p', { cls: 'qx-exp' }), L.explanation) : null
      ]);
      body.appendChild(fb);
      var last = i === qs.length - 1;
      var nx = el('button', { cls: 'btn qx-next', type: 'button', text: last ? T.finish : T.next });
      nx.addEventListener('click', function () { if (last) end(); else { i++; render(); scrollIn(); } });
      body.appendChild(el('div', { cls: 'qx-actions' }, [nx]));
      nx.focus({ preventScroll: true });
      if (fb.getBoundingClientRect().bottom > window.innerHeight) nx.scrollIntoView({ block: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' });
    }

    function end() {
      var key = chosen.slice().sort().join('+');
      var best = store.get('cm.qx.best', {});
      var prev = best[key] || 0;
      if (good > prev) { best[key] = good; store.set('cm.qx.best', best); }
      var plays = (store.get('cm.qx.plays', 0) || 0) + 1;
      store.set('cm.qx.plays', plays);
      track('quiz_express_complete', { placement: where, score: good, total: qs.length, subjects: chosen.join(','), page_lang: LANG });
      var msg = T.msg.filter(function (m) { return good >= m[0] * qs.length / 5; })[0][1];
      var again = el('button', { cls: 'btn', type: 'button', text: T.again });
      again.addEventListener('click', start);
      var shareBtn = el('button', { cls: 'btn sm quiet', type: 'button', text: T.share });
      shareBtn.addEventListener('click', function () {
        var data = { title: 'Concours Maroc', text: T.shareText(good, qs.length), url: location.href.split('#')[0] };
        if (navigator.share) { navigator.share(data).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(data.text + ' ' + data.url).then(function () { if (window.cmToast) window.cmToast(T.copied); });
      });
      var pct = Math.round(good / qs.length * 100);
      var ring = el('div', { cls: 'qx-ring', style: '--p:' + pct, role: 'img', 'aria-label': T.score + ' ' + good + '/' + qs.length }, [
        el('b', { text: String(good) }), el('span', { text: '/' + qs.length })
      ]);
      var links = [again, el('a', { cls: 'btn ghost', href: practice, text: T.full })];
      // WhatsApp (wa.me link): the score and the page, tagged for GA4
      var here = location.href.split('#')[0].split('?')[0] + '?utm_source=whatsapp&utm_medium=partage&utm_campaign=quiz';
      var wa = el('a', { cls: 'btn sm wa', href: 'https://wa.me/?text=' + encodeURIComponent(T.shareText(good, qs.length) + '\n' + here), target: '_blank', rel: 'noopener', text: 'WhatsApp' });
      wa.addEventListener('click', function () { track('share', { method: 'whatsapp', content_type: 'quiz_express', item_id: where }); });
      var more = [wa, shareBtn];
      if (mockHref) more.unshift(el('a', { cls: 'btn sm quiet', href: mockHref, text: T.mock }));
      show(el('div', { cls: 'qx-end' }, [
        ring,
        el('div', { cls: 'qx-end-txt' }, [
          el('p', { cls: 'qx-msg', text: msg }),
          prev ? el('p', { cls: 'qx-best', text: T.best + ' : ' + Math.max(prev, good) + '/' + qs.length }) : null,
          el('div', { cls: 'btn-row' }, links),
          el('div', { cls: 'btn-row qx-more' }, more)
        ])
      ]));
      root.classList.remove('playing');
      scrollIn();
    }
  }
  $$('[data-quiz]').forEach(function (r) { try { Quiz(r); } catch (e) { /* leave the static block */ } });

  /* ------------------------------------------------------------ recently viewed */
  var art = $('[data-track]');
  var recent = store.get('cm.recent', []);
  if (art && art.getAttribute('data-track-title')) {
    var here = APP ? location.hash.split('?')[0] : location.pathname;
    recent = recent.filter(function (r) { return r.u !== here; });
    recent.unshift({ u: here, t: art.getAttribute('data-track-title'), l: LANG });
    store.set('cm.recent', recent.slice(0, 6));
  }
  $$('[data-recent]').forEach(function (box) {
    var now = APP ? location.hash.split('?')[0] : location.pathname;
    var list = recent.filter(function (r) { return r.l === LANG && r.u !== now; }).slice(0, 3);
    if (!list.length) return;
    box.appendChild(el('span', { cls: 'rc-label', text: T.recent }));
    list.forEach(function (r) { box.appendChild(el('a', { cls: 'rc-chip', href: r.u, text: r.t })); });
    box.hidden = false;
  });

  /* ------------------------------------------------------------ long pages */
  var tocList = $('.toc ol');
  if (APP || !art || !tocList) return;
  var links = $$('a[href^="#"]', tocList);
  var targets = links.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
  if (targets.filter(Boolean).length < 3) return;

  var bar = el('div', { cls: 'sec-bar no-print', hidden: true });
  var btn = el('button', { cls: 'sec-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'sec-menu' }, [
    el('span', { cls: 'sec-lab', text: T.onPage }),
    el('span', { cls: 'sec-cur', text: '' })
  ]);
  var menu = el('ol', { cls: 'sec-menu', id: 'sec-menu', hidden: true });
  links.forEach(function (a) {
    var li = el('li');
    var c = el('a', { href: a.getAttribute('href'), text: a.textContent });
    c.addEventListener('click', function () { toggle(false); });
    li.appendChild(c);
    menu.appendChild(li);
  });
  var prog = el('div', { cls: 'sec-prog', 'aria-hidden': 'true' }, [el('i')]);
  bar.appendChild(el('div', { cls: 'container sec-row' }, [btn]));
  bar.appendChild(menu);
  bar.appendChild(prog);
  var header = $('.site-header');
  (header || document.body).appendChild(bar);

  function toggle(open) {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    bar.classList.toggle('open', open);
  }
  btn.addEventListener('click', function () { toggle(menu.hidden); });
  document.addEventListener('click', function (e) { if (!bar.contains(e.target)) toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });

  var current = -1;
  function setCurrent(n) {
    if (n === current) return;
    current = n;
    var name = n >= 0 ? links[n].textContent : '';
    $('.sec-cur', btn).textContent = name;
    links.forEach(function (a, k) { if (k === n) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    $$('a', menu).forEach(function (a, k) { if (k === n) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.pageYOffset;
    var start = art.getBoundingClientRect().top + y;
    var height = art.offsetHeight - window.innerHeight;
    var p = height > 0 ? Math.min(1, Math.max(0, (y - start) / height)) : 0;
    prog.firstChild.style.transform = 'scaleX(' + p + ')';
    var first = targets[0] ? targets[0].getBoundingClientRect().top : 0;
    bar.hidden = first > 120;
    var n = -1;
    targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top < 140) n = k; });
    setCurrent(n < 0 ? 0 : n);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

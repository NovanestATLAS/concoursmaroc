/* Concours Maroc — practice app: screens.
 *
 * Every screen renders into #cm-app. Text is always inserted with
 * textContent (never innerHTML), so question content can never inject markup.
 * Navigation goes through App.go(), which writes the URL hash: the browser's
 * back/forward buttons and the phone's system back button therefore move
 * between screens exactly like between pages.
 */
(function (global) {
  'use strict';

  var U = global.CM.utils;
  var T = global.CM.i18n;
  var Store = global.CM.store;
  var Quiz = global.CM.quiz;
  var Stats = global.CM.stats;
  var TTS = global.CM.tts;
  var Data = global.CM.data;

  var UI = {};
  var host = null;
  var app = null;          // router, injected by app.js
  var concoursDoc = { concours: [], groups: [], subjects: [] };
  var manifest = { categories: [] };
  var sourcesDoc = { sources: [] };
  var lastSummary = null;
  var quizTimer = null;
  var questionStartedAt = 0;
  var setup = { count: 10, subjects: null, difficulty: 'all', timed: false };

  // ---------------------------------------------------------------- icons
  var ICONS = {
    play: 'M8 5v14l11-7z',
    resume: 'M6 4h3v16H6zm5 0 10 8-10 8z',
    clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 5h-2v6l5 3 1-1.7-4-2.3z',
    star: 'M12 2l2.5 6.5L21 9.5l-5 4.3 1.6 6.7L12 17l-5.6 3.5L8 13.8l-5-4.3 6.5-1z',
    target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12m0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    chart: 'M4 20h16v2H4zM6 10h3v8H6zm5-6h3v14h-3zm5 3h3v11h-3z',
    gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m9 4-2-.6a7 7 0 0 0-.6-1.5l1-1.8-1.5-1.5-1.8 1a7 7 0 0 0-1.5-.6L14 5h-2l-.6 2a7 7 0 0 0-1.5.6l-1.8-1L6.6 8.1l1 1.8a7 7 0 0 0-.6 1.5L5 12v2l2 .6a7 7 0 0 0 .6 1.5l-1 1.8 1.5 1.5 1.8-1a7 7 0 0 0 1.5.6L12 21h2l.6-2a7 7 0 0 0 1.5-.6l1.8 1 1.5-1.5-1-1.8a7 7 0 0 0 .6-1.5L21 14z',
    back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z',
    chev: 'M9 6l6 6-6 6z',
    sound: 'M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z',
    flame: 'M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.4-2-1-3 2 1 4 3 4 6a6 6 0 1 1-12 0c0-5 5-7 6-12z',
    repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z',
    cal: 'M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h3zm-2 8v10h14V10z',
    grid: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
    share: 'M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7c0 .3 0 .5.1.8L8.4 11.2a3 3 0 1 0 0 3.6l6.7 3.4A3 3 0 1 0 18 16z',
    doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 5 5h-5z',
    brain: 'M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V4a3 3 0 0 0-3-1m6 0a3 3 0 0 0-3 1v13a3 3 0 0 0 6-1 3 3 0 0 0 2-5 3 3 0 0 0-2-5 3 3 0 0 0-3-3z'
  };

  function icon(name, cls) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (cls) svg.setAttribute('class', cls);
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', ICONS[name] || ICONS.star);
    svg.appendChild(p);
    return svg;
  }

  // ---------------------------------------------------------------- helpers
  function t(k, v) { return T.t(k, v); }
  function L(obj) { return obj ? (obj[T.lang] || obj.fr || '') : ''; }

  function catInfo(id) {
    return (manifest.categories || []).filter(function (c) { return c.id === id; })[0] || null;
  }
  function catLabel(id, short) {
    var c = catInfo(id);
    if (!c) return id;
    return short && c.short ? L(c.short) : L(c.labels);
  }
  function catCount(id) { var c = catInfo(id); return c ? c.count : 0; }

  function profile() {
    var id = Store.getProfile().targetExam;
    return (concoursDoc.concours || []).filter(function (c) { return c.id === id; })[0] || null;
  }
  function targetSubjects() {
    var p = profile();
    var subs = p ? p.subjects : (manifest.categories || []).map(function (c) { return c.id; });
    return subs.filter(function (s) { return !!catInfo(s); });
  }

  function screen() {
    U.clear(host);
    var el = U.el('section', { class: 'screen is-active' });
    host.appendChild(el);
    return el;
  }

  function appbar(parent, title, opts) {
    var o = opts || {};
    var bar = U.el('div', { class: 'appbar' });
    var b = U.el('button', { class: 'icon-btn flip', type: 'button', 'aria-label': t('common.back'), onclick: o.onBack || function () { app.back(); } });
    b.appendChild(icon('back'));
    bar.appendChild(b);
    bar.appendChild(U.el('h2', { text: title }));
    (o.extras || []).forEach(function (e) { bar.appendChild(e); });
    parent.appendChild(bar);
    return bar;
  }

  function tile(o) {
    var ic = U.el('div', { class: 't-icon' });
    ic.appendChild(icon(o.icon));
    var body = U.el('div', { class: 't-body' }, [U.el('div', { class: 't-title', text: o.title })]);
    if (o.hint) body.appendChild(U.el('div', { class: 't-hint', text: o.hint }));
    var chev = U.el('div', { class: 't-chev' });
    chev.appendChild(icon('chev'));
    return U.el('button', { class: 'tile' + (o.cls ? ' ' + o.cls : ''), type: 'button', onclick: o.onclick }, [ic, body, chev]);
  }

  function emptyState(message, isError) {
    return U.el('div', { class: 'state' + (isError ? ' error' : '') }, [U.el('div', { class: 'st-star' }), U.el('p', { text: message })]);
  }

  function busy(parent, msg) {
    var s = U.el('div', { class: 'state' }, [U.el('div', { class: 'spinner' }), U.el('p', { text: msg || t('common.loading') })]);
    parent.appendChild(s);
    return s;
  }

  UI.toast = function (message) {
    if (global.cmToast) global.cmToast(message);
  };

  UI.sheet = function (opts) {
    var back = document.getElementById('sheet');
    U.clear(back);
    var box = U.el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title });
    box.appendChild(U.el('h3', { text: opts.title }));
    if (opts.body) box.appendChild(U.el('p', { class: 'legal', text: opts.body }));
    (opts.content || []).forEach(function (n) { box.appendChild(n); });
    if (opts.actions && opts.actions.length) {
      var row = U.el('div', { class: 'btn-row', style: 'margin-top:14px' });
      opts.actions.forEach(function (a) {
        row.appendChild(U.el('button', {
          class: 'btn ' + (a.style || 'ghost'), type: 'button',
          onclick: function () { UI.closeSheet(); if (a.onclick) a.onclick(); }
        }, [a.label]));
      });
      box.appendChild(row);
    }
    back.appendChild(box);
    back.classList.add('is-open');
    back.onclick = function (e) { if (e.target === back) UI.closeSheet(); };
    var focusable = box.querySelector('input, button');
    if (focusable) setTimeout(function () { focusable.focus(); }, 30);
  };
  UI.closeSheet = function () {
    var back = document.getElementById('sheet');
    back.classList.remove('is-open');
    U.clear(back);
  };
  UI.isSheetOpen = function () { return document.getElementById('sheet').classList.contains('is-open'); };

  function haptic(ok) {
    if (!Store.getProfile().haptics) return;
    U.vibrate(ok ? 25 : [20, 60, 20]);
  }

  function fmtDuration(minutes) {
    if (minutes >= 60) {
      var h = Math.floor(minutes / 60), m = minutes % 60;
      return h + ' h' + (m ? ' ' + U.pad2(m) : '');
    }
    return minutes + ' min';
  }

  function scoringLabel(sc) {
    if (!sc) return '';
    var n = function (x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + U.num(Math.abs(x), T.lang); };
    return n(sc.correct) + ' / ' + n(sc.wrong) + ' / ' + n(sc.blank || 0);
  }

  function mockSummary(p) {
    var m = p.mock;
    var n = m.sections.reduce(function (s, x) { return s + x.count; }, 0);
    return t('mock.format', { n: n, d: fmtDuration(m.minutes) }) +
      (m.scoring && m.scoring.wrong < 0 ? ' · ' + t('mock.penalty', { s: scoringLabel(m.scoring) }) : '') +
      (m.official ? '' : ' · ' + t('mock.indicative'));
  }

  function ensure(cats) {
    return Data.ensure(cats).then(function (qs) { Quiz.addQuestions(qs); });
  }

  function startWith(cats, builder) {
    var holder = U.el('div');
    host.appendChild(holder);
    busy(holder);
    return ensure(cats).then(function () {
      holder.remove();
      var built = builder();
      if (!built) { UI.toast(t('setup.notEnough')); return; }
      app.go('quiz');
    });
  }

  // ================================================================ CONCOURS PICKER
  UI.pickConcours = function (onDone) {
    var search = U.el('input', { class: 'picker-search', type: 'search', placeholder: t('picker.search'), 'aria-label': t('picker.search') });
    var list = U.el('div');
    var current = Store.getProfile().targetExam;
    function choose(id) {
      Store.patchProfile({ targetExam: id || null });
      UI.closeSheet();
      UI.toast(id ? t('picker.chosen', { name: L(byId(id).short) }) : t('picker.general'));
      if (onDone) onDone(id);
    }
    function paint() {
      U.clear(list);
      var q = String(search.value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      var general = U.el('div', { class: 'picker-list' });
      general.appendChild(U.el('button', { type: 'button', 'aria-pressed': !current ? 'true' : 'false', onclick: function () { choose(null); } }, [t('picker.generalBtn')]));
      if (!q) list.appendChild(general);
      (concoursDoc.groups || []).forEach(function (g) {
        var items = (concoursDoc.concours || []).filter(function (c) {
          if (c.group !== g.id) return false;
          if (!q) return true;
          var hay = (L(c.short) + ' ' + L(c.name) + ' ' + c.name.fr + ' ' + c.id).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
          return hay.indexOf(q) !== -1;
        });
        if (!items.length) return;
        list.appendChild(U.el('div', { class: 'picker-group', text: L(g) }));
        var grid = U.el('div', { class: 'picker-list' });
        items.forEach(function (c) {
          grid.appendChild(U.el('button', { type: 'button', 'aria-pressed': c.id === current ? 'true' : 'false', title: L(c.name), onclick: function () { choose(c.id); } }, [L(c.short)]));
        });
        list.appendChild(grid);
      });
    }
    search.oninput = paint;
    paint();
    UI.sheet({ title: t('picker.title'), body: t('picker.body'), content: [search, list], actions: [{ label: t('common.close'), style: 'ghost' }] });
  };

  function byId(id) { return (concoursDoc.concours || []).filter(function (c) { return c.id === id; })[0] || null; }

  // ================================================================ HOME
  UI.renderHome = function () {
    var el = screen();
    var p = profile();
    var st = Stats.all();

    // Target banner — the concours can be changed from here at any time.
    var banner = U.el('div', { class: 'target' });
    var body = U.el('div', { class: 'tg-body' });
    body.appendChild(U.el('div', { class: 'tg-lab', text: t('home.target') }));
    body.appendChild(U.el('div', { class: 'tg-name', text: p ? L(p.name) : t('home.noTarget') }));
    body.appendChild(U.el('div', { class: 'tg-sub', text: p ? targetSubjects().map(function (s) { return catLabel(s, true); }).join(' · ') : t('home.noTargetHint') }));
    banner.appendChild(body);
    var btns = U.el('div', { class: 'btn-row' });
    btns.appendChild(U.el('button', { class: 'btn sm', type: 'button', onclick: function () { UI.pickConcours(function () { UI.renderHome(); }); } }, [p ? t('home.change') : t('home.choose')]));
    if (p) {
      var guideHref = (host.getAttribute('data-guides') || '../') + (p.guide ? L(p.guide) : '');
      btns.appendChild(U.el('a', { class: 'btn sm ghost', href: guideHref }, [t('home.guide')]));
    }
    banner.appendChild(btns);
    el.appendChild(banner);

    var chips = U.el('div', { class: 'home-chips' });
    chips.appendChild(U.el('span', { class: 'chip', text: t('home.streak', { n: st.streak }) }));
    chips.appendChild(U.el('span', { class: 'chip gold', text: t('home.xp', { n: st.xp }) }));
    chips.appendChild(U.el('span', { class: 'chip', text: t('home.answered', { n: st.answered }) }));
    el.appendChild(chips);

    var tiles = U.el('div', { class: 'tiles' });
    var saved = Quiz.savedSummary();
    if (saved) {
      tiles.appendChild(tile({
        icon: 'resume', cls: 'primary', title: t('home.resume'), hint: t('home.resumeHint', { n: saved.remaining, total: saved.total }),
        onclick: function () {
          ensure(saved.categories).then(function () {
            if (Quiz.resume()) app.go('quiz'); else { UI.toast(t('common.error')); UI.renderHome(); }
          });
        }
      }));
    }
    tiles.appendChild(tile({ icon: 'play', cls: saved ? '' : 'primary', title: t('home.practice'), hint: t('home.practiceHint'), onclick: function () { setup.subjects = null; app.go('setup'); } }));
    if (p && p.mock) {
      tiles.appendChild(tile({ icon: 'clock', title: t('home.mock', { name: L(p.short) }), hint: mockSummary(p), onclick: function () { app.go('mock'); } }));
    } else {
      tiles.appendChild(tile({ icon: 'clock', title: t('home.mockGeneric'), hint: t('home.mockGenericHint'), onclick: function () { setup.timed = true; setup.count = 40; app.go('setup'); } }));
    }
    var due = Quiz.srsDue().length;
    tiles.appendChild(tile({
      icon: 'repeat', cls: due ? 'gold' : '', title: t('home.review'), hint: due ? t('home.reviewHint', { n: due }) : t('home.reviewNone'),
      onclick: function () {
        var ids = Quiz.srsDue();
        if (!ids.length) { UI.toast(t('home.reviewNone')); return; }
        startWith(Quiz.srsDueCategories(), function () { return Quiz.buildReview(); });
      }
    }));
    var daily = Quiz.dailyState(p ? p.id : null);
    tiles.appendChild(tile({
      icon: 'target', title: t('home.daily'), hint: daily.done ? t('home.dailyDone') : t('home.dailyHint'),
      onclick: function () {
        var subs = targetSubjects();
        startWith(subs, function () { return Quiz.buildDaily(p ? p.id : null, subs); });
      }
    }));
    tiles.appendChild(tile({
      icon: 'flame', title: t('home.weak'), hint: t('home.weakHint'),
      onclick: function () {
        var subs = targetSubjects();
        startWith(subs, function () { return Quiz.buildWeak({ count: 15, categories: subs }); });
      }
    }));
    tiles.appendChild(tile({ icon: 'star', title: t('home.bookmarks'), hint: t('home.bookmarksHint', { n: Quiz.bookmarks().length }), onclick: function () { app.go('bookmarks'); } }));
    tiles.appendChild(tile({ icon: 'chart', title: t('home.stats'), hint: t('home.statsHint'), onclick: function () { app.go('stats'); } }));
    tiles.appendChild(tile({ icon: 'brain', title: t('home.memory'), hint: t('home.memoryHint'), onclick: function () { app.go('memoire'); } }));
    tiles.appendChild(tile({ icon: 'gear', title: t('home.settings'), hint: t('home.settingsHint'), onclick: function () { app.go('settings'); } }));
    el.appendChild(tiles);

    // Progress per subject of the target concours
    var subs = targetSubjects();
    var card = U.el('div', { class: 'card', style: 'margin-top:16px' });
    card.appendChild(U.el('h3', { text: p ? t('home.progressFor', { name: L(p.short) }) : t('home.progress') }));
    var bars = U.el('div', { class: 'bars' });
    subs.forEach(function (s) {
      var d = st.perCategory[s] || { answered: 0, correct: 0 };
      var pct = U.pct(d.correct, d.answered);
      var row = U.el('div', { class: 'bar-row' + (d.answered && pct < 50 ? ' weak' : '') });
      var label = U.el('span', { text: catLabel(s) + ' · ' + t('home.inBank', { n: catCount(s) }) });
      var go = U.el('button', { class: 'btn sm quiet', type: 'button', style: 'min-height:30px;padding:3px 10px', onclick: function () { setup.subjects = [s]; app.go('setup'); } }, [t('home.train')]);
      row.appendChild(U.el('div', { class: 'b-top' }, [label, U.el('span', { text: d.answered ? pct + ' % · ' + d.answered : '—' })]));
      var track = U.el('div', { class: 'b-track' });
      var fill = U.el('div', { class: 'b-fill' });
      fill.style.width = pct + '%';
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(U.el('div', { style: 'margin-top:6px' }, [go]));
      bars.appendChild(row);
    });
    card.appendChild(bars);
    el.appendChild(card);
  };

  // ================================================================ MOCK INTRO
  UI.renderMock = function () {
    var el = screen();
    var p = profile();
    appbar(el, t('mock.title'));
    if (!p || !p.mock) {
      el.appendChild(emptyState(t('mock.none')));
      el.appendChild(U.el('button', { class: 'btn block', type: 'button', onclick: function () { UI.pickConcours(function () { UI.renderMock(); }); } }, [t('home.choose')]));
      return;
    }
    var m = p.mock;
    var card = U.el('div', { class: 'card' });
    card.appendChild(U.el('h3', { text: t('mock.of', { name: L(p.name) }) }));
    var rows = [
      [t('mock.questions'), String(m.sections.reduce(function (s, x) { return s + x.count; }, 0))],
      [t('mock.duration'), fmtDuration(m.minutes)],
      [t('mock.scoring'), scoringLabel(m.scoring) + (m.scoring.wrong < 0 ? ' — ' + t('mock.negative') : '')],
      [t('mock.sections'), m.sections.map(function (s) { return s.subjects.map(function (x) { return catLabel(x, true); }).join(' + ') + ' (' + s.count + ')'; }).join(' · ')]
    ];
    if (m.eliminatory) rows.push([t('mock.elim'), t('mock.elimRule', { n: m.eliminatory })]);
    rows.forEach(function (r) {
      card.appendChild(U.el('div', { class: 'list-row' }, [U.el('div', { class: 'lr-main' }, [U.el('div', { class: 'lr-sub', text: r[0] }), U.el('div', { text: r[1] })])]));
    });
    card.appendChild(U.el('p', { class: 'legal', style: 'margin-top:10px', text: m.official ? t('mock.officialNote') : t('mock.indicativeNote') }));
    el.appendChild(card);
    var tips = U.el('div', { class: 'card' });
    tips.appendChild(U.el('h3', { text: t('mock.rulesTitle') }));
    [t('mock.rule1'), t('mock.rule2'), t('mock.rule3')].forEach(function (r) { tips.appendChild(U.el('p', { class: 'legal', text: '• ' + r })); });
    el.appendChild(tips);
    el.appendChild(U.el('button', {
      class: 'btn block', type: 'button',
      onclick: function () {
        var cats = [];
        m.sections.forEach(function (s) { s.subjects.forEach(function (x) { if (cats.indexOf(x) === -1) cats.push(x); }); });
        startWith(cats, function () {
          var s = Quiz.buildMock(p, T.lang);
          if (s && s.shortSections && s.shortSections.length) UI.toast(t('mock.short'));
          return s;
        });
      }
    }, [t('mock.start')]));
  };

  // ================================================================ SETUP
  UI.renderSetup = function (params) {
    var el = screen();
    appbar(el, t('setup.title'));
    var p = profile();
    if (params && params.subject && catInfo(params.subject)) setup.subjects = [params.subject];
    var all = (manifest.categories || []).map(function (c) { return c.id; });
    var selected = setup.subjects ? setup.subjects.slice() : targetSubjects();

    var head = U.el('p', { class: 'legal' }, [t('setup.forConcours') + ' ', U.el('strong', { text: p ? L(p.short) : t('home.noTarget') }), ' · ']);
    head.appendChild(U.el('a', { href: '#', onclick: function (e) { e.preventDefault(); UI.pickConcours(function () { setup.subjects = null; UI.renderSetup(); }); } }, [t('home.change')]));
    el.appendChild(head);

    var availEl, startBtn;
    function filters() {
      return { categories: selected, difficulties: setup.difficulty === 'all' ? null : [setup.difficulty] };
    }
    function refresh() {
      var n = selected.reduce(function (s, c) { return s + catCount(c); }, 0);
      availEl.textContent = n ? t('setup.available', { n: n }) : t('setup.pickSubject');
      startBtn.disabled = !selected.length;
    }

    // subjects
    var f0 = U.el('div', { class: 'field' });
    f0.appendChild(U.el('span', { class: 'label', text: t('setup.subjects') }));
    var grid = U.el('div', { class: 'subject-grid' });
    var order = targetSubjects().concat(all.filter(function (c) { return targetSubjects().indexOf(c) === -1; }));
    order.forEach(function (c) {
      var b = U.el('button', { type: 'button', 'aria-pressed': selected.indexOf(c) !== -1 ? 'true' : 'false', text: catLabel(c, true) + ' (' + catCount(c) + ')' });
      b.onclick = function () {
        var i = selected.indexOf(c);
        if (i === -1) selected.push(c); else selected.splice(i, 1);
        b.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
        setup.subjects = selected.slice();
        refresh();
      };
      grid.appendChild(b);
    });
    f0.appendChild(grid);
    var quick = U.el('div', { class: 'btn-row', style: 'margin-top:8px' });
    quick.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () { setup.subjects = targetSubjects(); UI.renderSetup(); } }, [t('setup.concoursSubjects')]));
    quick.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () { setup.subjects = all.slice(); UI.renderSetup(); } }, [t('setup.allSubjects')]));
    f0.appendChild(quick);
    el.appendChild(f0);

    function seg(label, options, current, onPick) {
      var f = U.el('div', { class: 'field' });
      f.appendChild(U.el('span', { class: 'label', text: label }));
      var s = U.el('div', { class: 'seg' });
      options.forEach(function (o) {
        var b = U.el('button', { type: 'button', text: o[1], 'aria-pressed': current === o[0] ? 'true' : 'false' });
        b.onclick = function () {
          U.$$('button', s).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          onPick(o[0]);
        };
        s.appendChild(b);
      });
      f.appendChild(s);
      el.appendChild(f);
    }
    seg(t('setup.length'), [[5, '5'], [10, '10'], [20, '20'], [40, '40']], setup.count, function (v) { setup.count = v; });
    seg(t('setup.difficulty'), [['all', t('setup.allDifficulties')], ['beginner', t('difficulty.beginner')], ['intermediate', t('difficulty.intermediate')], ['advanced', t('difficulty.advanced')]], setup.difficulty, function (v) { setup.difficulty = v; });
    seg(t('setup.timer'), [[false, t('setup.timerOff')], [true, t('setup.timerOn')]], setup.timed, function (v) { setup.timed = v; });

    availEl = U.el('p', { class: 'legal' });
    el.appendChild(availEl);
    startBtn = U.el('button', {
      class: 'btn block', type: 'button',
      onclick: function () {
        var f = filters();
        startWith(f.categories, function () {
          return Quiz.build({
            count: setup.count, categories: f.categories, difficulties: f.difficulties,
            mode: 'practice', concours: p ? p.id : null,
            limitMs: setup.timed ? setup.count * 90 * 1000 : 0
          });
        });
      }
    }, [t('setup.startSession')]);
    el.appendChild(startBtn);
    refresh();
  };

  // ================================================================ QUIZ
  UI.renderQuiz = function () {
    var view = Quiz.item();
    if (!view) { app.go('home', null, true); return; }
    var session = Quiz.current();
    var exam = session.feedback === 'end';
    var el = screen();

    // ---- header
    var head = U.el('div', { class: 'quiz-head' });
    var top = U.el('div', { class: 'qh-top' });
    var quitBtn = U.el('button', { class: 'icon-btn flip', type: 'button', 'aria-label': t('quiz.quitTitle'), onclick: function () { UI.confirmQuit(); } });
    quitBtn.appendChild(icon('back'));
    top.appendChild(quitBtn);
    var catText = catLabel(view.question.category);
    if (exam && view.section) catText = t('quiz.section', { n: view.section.index + 1 }) + ' · ' + view.section.subjects.map(function (s) { return catLabel(s, true); }).join(' + ');
    top.appendChild(U.el('div', { class: 'qh-meta' }, [
      U.el('div', { class: 'qh-cat', text: catText }),
      U.el('div', { class: 'qh-count', text: t('quiz.progress', { i: view.position, n: view.total }) + (exam ? ' · ' + t('quiz.answered', { n: Quiz.answeredCount() }) : '') })
    ]));
    var timerEl = null;
    if (session.limitMs && Store.getProfile().showTimer !== false) {
      timerEl = U.el('div', { class: 'qh-timer', text: U.clock(Quiz.timeLeftMs() / 1000), 'aria-label': t('quiz.timeLeft') });
      top.appendChild(timerEl);
    }
    var starBtn = U.el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('quiz.bookmark'), 'aria-pressed': Quiz.isBookmarked(view.question.id) ? 'true' : 'false' });
    starBtn.appendChild(icon('star'));
    if (Quiz.isBookmarked(view.question.id)) starBtn.style.color = 'var(--gold)';
    starBtn.onclick = function () {
      var on = Quiz.toggleBookmark(view.question.id);
      starBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      starBtn.style.color = on ? 'var(--gold)' : '';
      UI.toast(on ? t('quiz.bookmarked') : t('quiz.unbookmarked'));
    };
    top.appendChild(starBtn);
    // English questions are read with an English voice.
    var speechLang = view.question.category === 'anglais' ? 'en' : view.lang === 'ar' ? 'ar' : 'fr';
    if (TTS.isAvailable() && TTS.hasVoice(speechLang)) {
      var speakBtn = U.el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('quiz.readAloud'), onclick: function () { if (TTS.isSpeaking()) TTS.stop(); else TTS.speakQuestion(view.body, speechLang); } });
      speakBtn.appendChild(icon('sound'));
      top.appendChild(speakBtn);
    }
    if (exam) {
      var gridBtn = U.el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('quiz.navigator'), onclick: function () { showNavigator(); } });
      gridBtn.appendChild(icon('grid'));
      top.appendChild(gridBtn);
    }
    head.appendChild(top);
    var track = U.el('div', { class: 'star-track' });
    session.items.forEach(function (it, i) {
      var cls = i === session.index ? 'now' : it.answeredIndex !== null ? 'done' : it.skipped ? 'skip' : '';
      track.appendChild(U.el('i', { class: cls }));
    });
    head.appendChild(track);
    el.appendChild(head);

    // ---- body
    var card = U.el('div', { class: 'q-card' });
    var meta = U.el('div', { class: 'q-meta' });
    meta.appendChild(U.el('span', { class: 'badge', text: t('difficulty.' + view.question.difficulty) }));
    if (view.lang !== T.lang && view.question.category !== 'arabe' && view.question.category !== 'francais' && view.question.category !== 'anglais') {
      meta.appendChild(U.el('span', { class: 'badge blue', text: view.lang === 'ar' ? t('quiz.inArabic') : t('quiz.inFrench') }));
    }
    card.appendChild(meta);
    var qlang = view.question.category === 'anglais' ? 'en' : view.lang;
    card.appendChild(U.el('div', { class: 'q-text', lang: qlang, dir: view.lang === 'ar' ? 'rtl' : 'ltr', text: view.body.text }));
    var optionsEl = U.el('div', { class: 'options', role: 'group', 'aria-label': t('quiz.choices'), lang: qlang, dir: view.lang === 'ar' ? 'rtl' : 'ltr' });
    var letters = view.lang === 'ar' ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
    var buttons = [];
    view.choices.forEach(function (choice, i) {
      var b = U.el('button', { class: 'opt', type: 'button' }, [U.el('span', { class: 'opt-key', text: letters[i] }), U.el('span', { class: 'opt-label', text: choice })]);
      if (exam && view.state.answeredIndex === i) b.setAttribute('data-state', 'selected');
      b.onclick = function () { onAnswer(i); };
      buttons.push(b);
      optionsEl.appendChild(b);
    });
    card.appendChild(optionsEl);
    var feedbackHost = U.el('div');
    card.appendChild(feedbackHost);
    el.appendChild(card);

    // ---- footer
    var foot = U.el('div', { class: 'quiz-foot' });
    var skipBtn, nextBtn;
    if (exam) {
      var prev = U.el('button', { class: 'btn ghost', type: 'button', onclick: function () { stopTimer(); if (Quiz.prev()) UI.renderQuiz(); } }, ['‹ ' + t('quiz.prev')]);
      prev.disabled = session.index === 0;
      foot.appendChild(prev);
      if (Quiz.isLast()) foot.appendChild(U.el('button', { class: 'btn', type: 'button', onclick: confirmFinish }, [t('quiz.finishExam')]));
      else foot.appendChild(U.el('button', { class: 'btn', type: 'button', onclick: function () { stopTimer(); Quiz.next(); UI.renderQuiz(); } }, [t('quiz.nextShort') + ' ›']));
    } else {
      skipBtn = U.el('button', { class: 'btn ghost', type: 'button', onclick: function () { Quiz.skip(); advance(); } }, [t('quiz.skip')]);
      nextBtn = U.el('button', { class: 'btn', type: 'button', onclick: advance }, [Quiz.isLast() ? t('common.finish') : t('common.next')]);
      nextBtn.style.display = 'none';
      foot.appendChild(skipBtn);
      foot.appendChild(nextBtn);
    }
    el.appendChild(foot);
    el.appendChild(U.el('p', { class: 'kbd-hint', text: exam ? t('quiz.kbdExam') : t('quiz.kbd') }));

    // A question answered before the session was left (back button, another
    // page, app closed) reopens answered, with its correction, instead of
    // looking fresh while refusing every tap.
    var alreadyAnswered = !exam && view.state.answeredIndex !== null;
    if (alreadyAnswered) {
      showAnswered({ correct: view.state.correct, correctDisplayIndex: view.correctDisplayIndex, body: view.body, question: view.question, lang: view.lang }, view.state.answeredIndex);
    }

    questionStartedAt = Date.now();
    startTimer(timerEl);
    if (!alreadyAnswered && Store.getProfile().tts && Store.getProfile().tts.autoRead && TTS.isAvailable()) TTS.speakQuestion(view.body, speechLang);

    function onAnswer(displayIndex) {
      var res = Quiz.answer(displayIndex, Date.now() - questionStartedAt);
      questionStartedAt = Date.now();
      if (!res) return;
      if (res.mock) {
        buttons.forEach(function (b, i) { if (i === res.selected) b.setAttribute('data-state', 'selected'); else b.removeAttribute('data-state'); });
        var ti = U.$$('i', track)[session.index];
        if (ti) ti.className = res.selected === null ? 'now' : 'done now';
        return;
      }
      TTS.stop();
      haptic(res.correct);
      showAnswered(res, displayIndex);
      nextBtn.focus({ preventScroll: true });
    }

    function showAnswered(res, displayIndex) {
      buttons.forEach(function (b, i) {
        b.disabled = true;
        if (i === res.correctDisplayIndex) b.setAttribute('data-state', 'correct');
        else if (i === displayIndex) b.setAttribute('data-state', 'wrong');
      });
      skipBtn.style.display = 'none';
      nextBtn.style.display = '';
      renderFeedback(res);
    }

    function renderFeedback(res) {
      U.clear(feedbackHost);
      var box = U.el('div', { class: 'feedback ' + (res.correct ? 'good' : 'bad'), role: 'status' });
      box.appendChild(U.el('div', { class: 'fb-head', text: res.correct ? t('quiz.correct') : t('quiz.incorrect') }));
      box.appendChild(U.el('p', { lang: res.lang, text: res.body.correction }));
      if (!res.correct) box.appendChild(U.el('p', { class: 'legal', text: t('quiz.correctAnswerIs') + ' ' + res.body.choices[res.body.correctIndex] }));
      var expBox = U.el('div', { class: 'explain', lang: res.lang, dir: res.lang === 'ar' ? 'rtl' : 'ltr' });
      expBox.appendChild(U.el('div', { text: res.body.explanation }));
      var src = (sourcesDoc.sources || []).filter(function (s) { return s.id === res.question.sourceId; })[0];
      if (src && src.url) {
        var a = U.el('a', { href: src.url, target: '_blank', rel: 'noopener nofollow', class: 'src' }, [t('quiz.source') + ' : ' + src.title]);
        expBox.appendChild(a);
      }
      var noteBox = U.el('textarea', { placeholder: t('quiz.notePlaceholder'), 'aria-label': t('quiz.note') });
      noteBox.value = Quiz.getNote(res.question.id);
      noteBox.onchange = function () { Quiz.setNote(res.question.id, noteBox.value); UI.toast(t('quiz.noteSaved')); };
      expBox.appendChild(U.el('div', { class: 'field', style: 'margin-top:10px' }, [U.el('span', { class: 'label', text: t('quiz.note') }), noteBox]));
      box.appendChild(expBox);
      feedbackHost.appendChild(box);
      box.scrollIntoView({ behavior: U.reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }

    function advance() {
      TTS.stop();
      stopTimer();
      if (Quiz.next()) UI.renderQuiz(); else finishSession();
    }

    function confirmFinish() {
      var left = session.items.length - Quiz.answeredCount();
      UI.sheet({
        title: t('quiz.finishTitle'), body: left ? t('quiz.finishBodyLeft', { n: left }) : t('quiz.finishBody'),
        actions: [{ label: t('quiz.keepGoing'), style: 'ghost' }, { label: t('quiz.finishExam'), style: '', onclick: function () { finishSession(); } }]
      });
    }

    function showNavigator() {
      var grid = U.el('div', { class: 'navgrid' });
      session.items.forEach(function (it, i) {
        var b = U.el('button', { type: 'button', text: String(i + 1), class: (it.answeredIndex !== null ? 'answered' : '') + (i === session.index ? ' current' : '') });
        b.onclick = function () { UI.closeSheet(); stopTimer(); Quiz.goTo(i); UI.renderQuiz(); };
        grid.appendChild(b);
      });
      UI.sheet({ title: t('quiz.navigator'), body: t('quiz.answered', { n: Quiz.answeredCount() }) + ' / ' + session.items.length, content: [grid], actions: [{ label: t('common.close'), style: 'ghost' }, { label: t('quiz.finishExam'), style: '', onclick: confirmFinish }] });
    }

    // keyboard shortcuts
    UI._keys = function (e) {
      if (UI.isSheetOpen() || /input|textarea|select/i.test((document.activeElement || {}).tagName || '')) return;
      var k = e.key.toLowerCase();
      var map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      if (Object.prototype.hasOwnProperty.call(map, k)) { e.preventDefault(); if (!buttons[map[k]].disabled) onAnswer(map[k]); return; }
      if (exam) {
        var rtl = document.documentElement.dir === 'rtl';
        if (k === (rtl ? 'arrowleft' : 'arrowright')) { if (!Quiz.isLast()) { stopTimer(); Quiz.next(); UI.renderQuiz(); } }
        if (k === (rtl ? 'arrowright' : 'arrowleft')) { if (Quiz.prev()) { stopTimer(); UI.renderQuiz(); } }
      } else if ((k === 'enter' || k === 'arrowright' || k === 'arrowleft') && nextBtn.style.display !== 'none') {
        e.preventDefault(); advance();
      }
    };
  };

  function startTimer(timerEl) {
    stopTimer();
    var s = Quiz.current();
    if (!s) return;
    quizTimer = setInterval(function () {
      if (document.hidden) return;                      // background tab: time does not run
      Quiz.tick(1000);
      if (!s.limitMs) return;
      var left = Quiz.timeLeftMs();
      if (timerEl) {
        timerEl.textContent = U.clock(left / 1000);
        timerEl.classList.toggle('low', left < 60000);
      }
      if (left <= 0) { stopTimer(); UI.toast(t('quiz.timeUp')); finishSession(); }
    }, 1000);
  }
  function stopTimer() { if (quizTimer) { clearInterval(quizTimer); quizTimer = null; } Quiz.save(); }
  UI.stopTimer = stopTimer;

  UI.confirmQuit = function () {
    UI.sheet({
      title: t('quiz.quitTitle'), body: t('quiz.quitBody'),
      actions: [
        { label: t('quiz.quitStay'), style: 'ghost' },
        { label: t('quiz.quitConfirm'), style: 'quiet', onclick: function () { stopTimer(); TTS.stop(); app.go('home', null, true); } }
      ]
    });
  };

  function finishSession() {
    stopTimer();
    TTS.stop();
    var summary = Quiz.finish();
    summary.review = Quiz.review();
    lastSummary = summary;
    Store.write('lastSummary', summary);
    if (summary.mode === 'daily') Quiz.markDailyDone(summary.concours, summary.correct, summary.total);
    Quiz.discard();
    app.go('results', null, true);
    (summary.newBadges || []).forEach(function (b, i) {
      setTimeout(function () { UI.toast(t('results.newBadge', { name: t('badges.' + b) })); }, 900 + i * 2800);
    });
  }

  // ================================================================ RESULTS
  UI.renderResults = function () {
    var el = screen();
    appbar(el, t('results.title'), { onBack: function () { app.go('home'); } });
    var sum = lastSummary || Store.read('lastSummary', null);
    if (!sum) { el.appendChild(emptyState(t('common.empty'))); return; }
    lastSummary = sum;
    var mock = sum.mode === 'mock';
    var p = sum.concours ? byId(sum.concours) : null;

    var hero = U.el('div', { class: 'score-hero' });
    var ring = U.el('div', { class: 'score-ring' }, [U.el('span', { text: mock ? U.num(sum.note20, T.lang, 1) : sum.accuracy + '%' })]);
    ring.style.setProperty('--pct', mock ? Math.round(sum.note20 * 5) : sum.accuracy);
    hero.appendChild(ring);
    hero.appendChild(U.el('h2', { text: mock ? t('results.note', { n: U.num(sum.note20, T.lang, 2) }) : t('results.score', { c: sum.correct, n: sum.total }) }));
    if (mock) {
      hero.appendChild(U.el('p', { class: 'legal', text: t('results.points', { p: U.num(sum.points, T.lang), m: sum.maxPoints, s: scoringLabel(sum.scoring) }) + (p ? ' · ' + L(p.short) : '') }));
    }
    var band = (mock ? sum.note20 * 5 : sum.accuracy) >= 80 ? 'high' : ((mock ? sum.note20 * 5 : sum.accuracy) >= 50 ? 'mid' : 'low');
    hero.appendChild(U.el('p', { class: 'legal', text: t('results.encouragement.' + band) }));
    el.appendChild(hero);

    var elim = (sum.sections || []).filter(function (s) { return s.eliminated; });
    if (elim.length) {
      el.appendChild(U.el('div', { class: 'callout bad', text: t('results.eliminated', { n: sum.eliminatory, list: elim.map(function (s) { return s.subjects.map(function (x) { return catLabel(x, true); }).join('+'); }).join(', ') }) }));
    }

    var kpis = U.el('div', { class: 'kpis' });
    [[sum.accuracy + '%', t('results.accuracy')], [U.clock(sum.durationMs / 1000), t('results.duration')], [String(sum.correct), t('quiz.correct')], [String(sum.wrong) + ' · ' + sum.skipped, t('results.wrongSkipped')]].forEach(function (k) {
      kpis.appendChild(U.el('div', { class: 'kpi' }, [U.el('div', { class: 'k-val', text: k[0] }), U.el('div', { class: 'k-lab', text: k[1] })]));
    });
    el.appendChild(kpis);

    var byTopic = U.el('div', { class: 'card' });
    byTopic.appendChild(U.el('h3', { text: mock && sum.sections.length ? t('results.bySection') : t('results.byTopic') }));
    var bars = U.el('div', { class: 'bars' });
    if (mock && sum.sections.length) {
      sum.sections.forEach(function (s) {
        var row = U.el('div', { class: 'bar-row' + (s.eliminated ? ' elim' : s.note20 < 10 ? ' weak' : '') });
        row.appendChild(U.el('div', { class: 'b-top' }, [U.el('span', { text: s.subjects.map(function (x) { return catLabel(x, true); }).join(' + ') }), U.el('span', { text: U.num(s.note20, T.lang, 1) + '/20 · ' + s.correct + '/' + s.total })]));
        var tr = U.el('div', { class: 'b-track' }); var fi = U.el('div', { class: 'b-fill' }); fi.style.width = Math.round(s.note20 * 5) + '%'; tr.appendChild(fi); row.appendChild(tr);
        bars.appendChild(row);
      });
    } else {
      Object.keys(sum.perCategory).forEach(function (cat) {
        var c = sum.perCategory[cat];
        var pct = U.pct(c.correct, c.total);
        var row = U.el('div', { class: 'bar-row' + (pct < 50 ? ' weak' : '') });
        row.appendChild(U.el('div', { class: 'b-top' }, [U.el('span', { text: catLabel(cat) }), U.el('span', { text: c.correct + '/' + c.total })]));
        var tr = U.el('div', { class: 'b-track' }); var fi = U.el('div', { class: 'b-fill' }); fi.style.width = pct + '%'; tr.appendChild(fi); row.appendChild(tr);
        bars.appendChild(row);
      });
    }
    byTopic.appendChild(bars);
    el.appendChild(byTopic);

    var actions = U.el('div', { class: 'btn-row', style: 'margin-bottom:16px' });
    if (sum.wrongIds.length) {
      actions.appendChild(U.el('button', { class: 'btn', type: 'button', onclick: function () {
        var cats = Object.keys(sum.perCategory);
        startWith(cats, function () { return Quiz.build({ ids: sum.wrongIds, count: sum.wrongIds.length, mode: 'retry', concours: sum.concours }); });
      } }, [t('results.retryWrong')]));
    }
    var shareBtn = U.el('button', { class: 'btn ghost', type: 'button', onclick: function () {
      var txt = mock ? t('results.shareMock', { n: U.num(sum.note20, T.lang, 1), name: p ? L(p.short) : '' }) : t('results.shareText', { c: sum.correct, n: sum.total });
      var url = location.href.split('#')[0].split('?')[0] + (sum.concours ? '?concours=' + sum.concours : '');
      if (navigator.share) navigator.share({ title: 'Concours Maroc', text: txt, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt + ' ' + url).then(function () { UI.toast(t('results.copied')); });
    } });
    shareBtn.appendChild(icon('share'));
    shareBtn.appendChild(document.createTextNode(' ' + t('results.share')));
    actions.appendChild(shareBtn);
    actions.appendChild(U.el('button', { class: 'btn ghost', type: 'button', onclick: function () { app.go('home'); } }, [t('results.backHome')]));
    el.appendChild(actions);

    var review = U.el('div', { class: 'card' });
    review.appendChild(U.el('h3', { text: t('results.review') }));
    var onlyWrong = !!sum.wrongIds.length;
    var listHost = U.el('div');
    var toggle = U.el('button', { class: 'btn sm quiet', type: 'button' });
    var limit = 10;
    function paint() {
      toggle.textContent = onlyWrong ? t('results.showAll') : t('results.showWrong');
      U.clear(listHost);
      var items = (sum.review || []).filter(function (r) { return !onlyWrong || !r.correct; });
      if (!items.length) { listHost.appendChild(emptyState(t('results.noWrong'))); return; }
      var rest = items.length - limit;
      items.slice(0, limit).forEach(function (r) {
        var box = U.el('div', { class: 'review-item ' + (r.correct ? 'ok' : r.answered ? 'ko' : 'skip'), lang: r.lang, dir: r.lang === 'ar' ? 'rtl' : 'ltr' });
        box.appendChild(U.el('div', { class: 'ri-q', text: (r.index + 1) + '. ' + r.body.text }));
        if (r.correct) {
          box.appendChild(U.el('div', { class: 'ri-a', text: '✓ ' + r.chosen }));
        } else {
          box.appendChild(U.el('div', { class: 'ri-a', text: r.answered ? '✗ ' + r.chosen : '— ' + t('results.noAnswer') }));
          box.appendChild(U.el('div', { class: 'ri-a', text: '✓ ' + r.expected }));
        }
        box.appendChild(U.el('div', { class: 'ri-a legal', text: r.body.explanation }));
        listHost.appendChild(box);
      });
      if (rest > 0) {
        listHost.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () { limit += 10; paint(); } }, [t('results.more', { n: rest })]));
      }
    }
    toggle.onclick = function () { onlyWrong = !onlyWrong; limit = 10; paint(); };
    review.appendChild(toggle);
    review.appendChild(U.el('div', { style: 'height:12px' }));
    review.appendChild(listHost);
    el.appendChild(review);
    paint();
  };

  // ================================================================ STATS
  UI.renderStats = function () {
    var el = screen();
    appbar(el, t('stats.title'));
    var st = Stats.all();
    var kpis = U.el('div', { class: 'kpis' });
    [[String(st.answered), t('stats.answered')], [U.pct(st.correct, st.answered) + '%', t('stats.accuracy')], [String(st.sessions), t('stats.sessions')], [String(st.streak) + ' / ' + st.bestStreak, t('stats.streak')]].forEach(function (k) {
      kpis.appendChild(U.el('div', { class: 'kpi' }, [U.el('div', { class: 'k-val', text: k[0] }), U.el('div', { class: 'k-lab', text: k[1] })]));
    });
    el.appendChild(kpis);

    var cats = Object.keys(st.perCategory);
    var topicCard = U.el('div', { class: 'card' });
    topicCard.appendChild(U.el('h3', { text: t('stats.perTopic') }));
    if (!cats.length) topicCard.appendChild(emptyState(t('stats.empty')));
    else {
      var bars = U.el('div', { class: 'bars' });
      cats.sort(function (a, b) { return U.pct(st.perCategory[a].correct, st.perCategory[a].answered) - U.pct(st.perCategory[b].correct, st.perCategory[b].answered); });
      cats.forEach(function (c) {
        var d = st.perCategory[c];
        var pct = U.pct(d.correct, d.answered);
        var row = U.el('div', { class: 'bar-row' + (pct < 50 ? ' weak' : '') });
        row.appendChild(U.el('div', { class: 'b-top' }, [U.el('span', { text: catLabel(c) }), U.el('span', { text: pct + '% · ' + d.answered })]));
        var tr = U.el('div', { class: 'b-track' }); var fi = U.el('div', { class: 'b-fill' }); fi.style.width = pct + '%'; tr.appendChild(fi); row.appendChild(tr);
        bars.appendChild(row);
      });
      topicCard.appendChild(bars);
    }
    el.appendChild(topicCard);

    var badgeCard = U.el('div', { class: 'card' });
    badgeCard.appendChild(U.el('h3', { text: t('stats.badges') }));
    var chips = U.el('div', { class: 'chips' });
    Stats.allBadgeIds().forEach(function (id) {
      chips.appendChild(U.el('span', { class: 'chip' + (st.badges.indexOf(id) !== -1 ? ' on' : ''), text: t('badges.' + id) }));
    });
    badgeCard.appendChild(chips);
    el.appendChild(badgeCard);

    var hist = U.el('div', { class: 'card' });
    hist.appendChild(U.el('h3', { text: t('stats.history') }));
    var rows = Stats.history('');
    if (!rows.length) hist.appendChild(emptyState(t('stats.noHistory')));
    rows.slice(0, 40).forEach(function (h) {
      var p = h.concours ? byId(h.concours) : null;
      hist.appendChild(U.el('div', { class: 'list-row' }, [U.el('div', { class: 'lr-main' }, [
        U.el('div', { text: (h.note20 !== null && h.note20 !== undefined ? U.num(h.note20, T.lang, 1) + '/20 · ' : '') + h.correct + '/' + h.total + ' · ' + h.accuracy + '%' }),
        U.el('div', { class: 'lr-sub', text: U.dateLabel(h.at, T.lang) + ' · ' + t('modes.' + h.mode) + (p ? ' · ' + L(p.short) : '') + ' · ' + U.clock(h.durationMs / 1000) })
      ])]));
    });
    el.appendChild(hist);
  };

  // ================================================================ BOOKMARKS
  UI.renderBookmarks = function () {
    var el = screen();
    appbar(el, t('bookmarks.title'));
    var ids = Quiz.bookmarks();
    if (!ids.length) { el.appendChild(emptyState(t('bookmarks.empty'))); return; }
    var holder = U.el('div');
    el.appendChild(holder);
    busy(holder);
    var cats = (manifest.categories || []).map(function (c) { return c.id; });
    ensure(cats).then(function () {
      U.clear(holder);
      holder.appendChild(U.el('button', { class: 'btn block', type: 'button', onclick: function () {
        startWith([], function () { return Quiz.build({ ids: Quiz.bookmarks(), count: Quiz.bookmarks().length, mode: 'bookmarks' }); });
      } }, [t('bookmarks.practiceThese')]));
      var list = U.el('div', { class: 'card', style: 'margin-top:14px' });
      holder.appendChild(list);
      (function paint() {
        U.clear(list);
        var cur = Quiz.bookmarks();
        if (!cur.length) { list.appendChild(emptyState(t('bookmarks.empty'))); return; }
        cur.forEach(function (id) {
          var q = Quiz.get(id);
          if (!q) return;
          var picked = T.pick(q, T.lang);
          if (!picked) return;
          var note = Quiz.getNote(id);
          list.appendChild(U.el('div', { class: 'list-row' }, [
            U.el('div', { class: 'lr-main', lang: picked.lang, dir: picked.lang === 'ar' ? 'rtl' : 'ltr' }, [
              U.el('div', { text: picked.body.text }),
              U.el('div', { class: 'lr-sub', text: catLabel(q.category) + ' · ✓ ' + picked.body.choices[picked.body.correctIndex] + (note ? ' · 📝 ' + note : '') })
            ]),
            U.el('button', { class: 'btn sm ghost', type: 'button', onclick: function () { Quiz.removeBookmark(id); paint(); } }, [t('bookmarks.remove')])
          ]));
        });
      })();
    });
  };

  // ================================================================ MEMORY GAME (TAFEM / psychotechnique)
  UI.renderMemory = function () {
    var el = screen();
    appbar(el, t('memory.title'));
    el.appendChild(U.el('p', { class: 'legal', text: t('memory.intro') }));
    var WORDS = T.lang === 'ar'
      ? ['قلم', 'شجرة', 'قطار', 'نافذة', 'برتقال', 'جبل', 'ساعة', 'كتاب', 'بحر', 'مفتاح', 'حصان', 'قمر', 'خبز', 'باب', 'نجمة', 'سيارة', 'وردة', 'مدرسة', 'سماء', 'ملعقة']
      : ['crayon', 'arbre', 'train', 'fenêtre', 'orange', 'montagne', 'horloge', 'livre', 'mer', 'clé', 'cheval', 'lune', 'pain', 'porte', 'étoile', 'voiture', 'rose', 'école', 'ciel', 'cuillère', 'tapis', 'lampe', 'oiseau', 'tambour'];
    var level = 8;
    var area = U.el('div');
    el.appendChild(area);
    function round() {
      U.clear(area);
      var shown = U.sample(WORDS, level);
      var board = U.el('div', { class: 'mem-board' });
      shown.forEach(function (w) { board.appendChild(U.el('div', { text: w })); });
      var left = level * 2;
      var timer = U.el('div', { class: 'mem-timer', text: String(left) });
      area.appendChild(timer);
      area.appendChild(board);
      var iv = setInterval(function () {
        left--;
        timer.textContent = String(left);
        if (left <= 0) { clearInterval(iv); ask(shown); }
      }, 1000);
      UI._memIv = iv;
    }
    function ask(shown) {
      U.clear(area);
      var others = WORDS.filter(function (w) { return shown.indexOf(w) === -1; });
      var options = U.shuffle(shown.slice(0, Math.ceil(level / 2)).concat(U.sample(others, Math.floor(level / 2))));
      var picked = [];
      area.appendChild(U.el('p', { text: t('memory.question') }));
      var grid = U.el('div', { class: 'subject-grid' });
      options.forEach(function (w) {
        var b = U.el('button', { type: 'button', 'aria-pressed': 'false', text: w });
        b.onclick = function () { var i = picked.indexOf(w); if (i === -1) picked.push(w); else picked.splice(i, 1); b.setAttribute('aria-pressed', i === -1 ? 'true' : 'false'); };
        grid.appendChild(b);
      });
      area.appendChild(grid);
      area.appendChild(U.el('button', { class: 'btn', type: 'button', style: 'margin-top:14px', onclick: function () {
        var good = options.filter(function (w) { return (shown.indexOf(w) !== -1) === (picked.indexOf(w) !== -1); }).length;
        var pct = Math.round(good / options.length * 100);
        U.clear(area);
        area.appendChild(U.el('div', { class: 'callout ' + (pct >= 80 ? 'ok' : 'warn'), text: t('memory.result', { g: good, n: options.length }) }));
        if (pct >= 80 && level < 16) level += 2;
        else if (pct < 60 && level > 6) level -= 2;
        area.appendChild(U.el('button', { class: 'btn', type: 'button', onclick: round }, [t('memory.again', { n: level })]));
      } }, [t('memory.check')]));
    }
    area.appendChild(U.el('button', { class: 'btn block', type: 'button', onclick: round }, [t('memory.start')]));
  };

  // ================================================================ SETTINGS
  UI.renderSettings = function () {
    var el = screen();
    appbar(el, t('settings.title'));
    var p = Store.getProfile();

    function switchRow(label, sub, checked, onchange) {
      var btn = U.el('button', { class: 'switch', type: 'button', role: 'switch', 'aria-checked': checked ? 'true' : 'false', 'aria-label': label });
      btn.onclick = function () {
        var next = btn.getAttribute('aria-checked') !== 'true';
        btn.setAttribute('aria-checked', next ? 'true' : 'false');
        onchange(next);
      };
      var lab = U.el('div', { class: 'sr-label' }, [U.el('span', { text: label })]);
      if (sub) lab.appendChild(U.el('small', { text: sub }));
      return U.el('div', { class: 'switch-row' }, [lab, btn]);
    }

    // language: the other language lives on its own page
    var langCard = U.el('div', { class: 'card' });
    langCard.appendChild(U.el('h3', { text: t('settings.language') }));
    var other = T.lang === 'ar' ? 'fr' : 'ar';
    var otherHref = (host.getAttribute('data-guides') || '../') + (other === 'ar' ? 'ar/entrainement/' : 'entrainement/') + location.hash;
    langCard.appendChild(U.el('a', { class: 'btn sm quiet', href: otherHref, lang: other }, [other === 'ar' ? 'العربية' : 'Français']));
    langCard.appendChild(U.el('p', { class: 'legal', style: 'margin-top:8px', text: t('settings.languageHint') }));
    el.appendChild(langCard);

    // theme (shared with the whole site)
    var themeCard = U.el('div', { class: 'card' });
    themeCard.appendChild(U.el('h3', { text: t('settings.theme') }));
    var themeSeg = U.el('div', { class: 'seg' });
    var curTheme = 'auto';
    try { curTheme = localStorage.getItem('cm.theme') || 'auto'; } catch (e) { /* ignore */ }
    [['light', 'themeLight'], ['dark', 'themeDark'], ['auto', 'themeAuto']].forEach(function (pair) {
      themeSeg.appendChild(U.el('button', { type: 'button', text: t('settings.' + pair[1]), 'aria-pressed': curTheme === pair[0] ? 'true' : 'false', onclick: function () {
        try { localStorage.setItem('cm.theme', pair[0]); } catch (e) { /* ignore */ }
        var eff = pair[0] === 'auto' ? (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : pair[0];
        document.documentElement.setAttribute('data-theme', eff);
        UI.renderSettings();
      } }));
    });
    themeCard.appendChild(themeSeg);
    el.appendChild(themeCard);

    // practice preferences
    var prefCard = U.el('div', { class: 'card' });
    prefCard.appendChild(U.el('h3', { text: t('settings.practice') }));
    prefCard.appendChild(switchRow(t('settings.showTimer'), t('settings.showTimerHint'), p.showTimer !== false, function (v) { Store.patchProfile({ showTimer: v }); }));
    if (typeof navigator.vibrate === 'function') prefCard.appendChild(switchRow(t('settings.haptics'), null, p.haptics, function (v) { Store.patchProfile({ haptics: v }); if (v) U.vibrate(20); }));
    el.appendChild(prefCard);

    // read-aloud
    var ttsCard = U.el('div', { class: 'card' });
    ttsCard.appendChild(U.el('h3', { text: t('settings.tts') }));
    if (!TTS.isAvailable()) {
      ttsCard.appendChild(U.el('p', { class: 'legal', text: t('settings.ttsUnavailable') }));
    } else {
      ttsCard.appendChild(switchRow(t('settings.ttsAuto'), t('settings.ttsAutoHint'), !!(p.tts && p.tts.autoRead), function (v) { Store.patchProfile({ tts: { autoRead: v } }); }));
      ttsCard.appendChild(switchRow(t('settings.ttsReadChoices'), null, !!(p.tts && p.tts.readChoices), function (v) { Store.patchProfile({ tts: { readChoices: v } }); TTS.setPrefs(Store.getProfile().tts); }));
      [['fr', 'voiceFr'], ['ar', 'voiceAr']].forEach(function (pair) {
        var voices = TTS.voicesFor(pair[0]);
        var f = U.el('div', { class: 'field' });
        f.appendChild(U.el('span', { class: 'label', text: t('settings.ttsVoice') + ' · ' + (pair[0] === 'ar' ? 'العربية' : 'Français') }));
        if (!voices.length) f.appendChild(U.el('p', { class: 'legal', text: t('settings.ttsNoVoice') }));
        else {
          var sel = U.el('select', { 'aria-label': t('settings.ttsVoice') });
          sel.appendChild(U.el('option', { value: '', text: t('settings.auto') }));
          voices.forEach(function (v) { sel.appendChild(U.el('option', { value: v.id, text: v.name + ' (' + v.lang + ')' })); });
          sel.value = (p.tts && p.tts[pair[1]]) || '';
          sel.onchange = function () { var patch = { tts: {} }; patch.tts[pair[1]] = sel.value || null; Store.patchProfile(patch); TTS.setPrefs(Store.getProfile().tts); };
          f.appendChild(sel);
        }
        ttsCard.appendChild(f);
      });
      var rf = U.el('div', { class: 'field' });
      var rl = U.el('span', { class: 'label', text: t('settings.ttsRate') + ' · ' + U.num((p.tts && p.tts.rate) || 1, T.lang, 1) });
      var range = U.el('input', { type: 'range', min: '0.6', max: '1.6', step: '0.1', value: String((p.tts && p.tts.rate) || 1), 'aria-label': t('settings.ttsRate') });
      range.oninput = function () { rl.textContent = t('settings.ttsRate') + ' · ' + U.num(Number(range.value), T.lang, 1); };
      range.onchange = function () { Store.patchProfile({ tts: { rate: Number(range.value) } }); TTS.setPrefs(Store.getProfile().tts); };
      rf.appendChild(rl); rf.appendChild(range);
      ttsCard.appendChild(rf);
      ttsCard.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () { TTS.speak(t('settings.ttsSample'), T.lang); } }, [t('settings.ttsPreview')]));
    }
    el.appendChild(ttsCard);

    // data
    var dataCard = U.el('div', { class: 'card' });
    dataCard.appendChild(U.el('h3', { text: t('settings.data') }));
    dataCard.appendChild(U.el('p', { class: 'legal', text: t('settings.dataHint') }));
    var row = U.el('div', { class: 'btn-row' });
    row.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () {
      var blob = new Blob([JSON.stringify(Store.exportAll(), null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'concours-maroc-progression-' + U.todayKey() + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      UI.toast(t('settings.exportDone'));
    } }, [t('settings.export')]));
    var file = U.el('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
    file.onchange = function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var parsed = null;
        try { parsed = JSON.parse(reader.result); } catch (e) { parsed = null; }
        var res = parsed ? Store.importAll(parsed) : { ok: false };
        UI.toast(res.ok ? t('settings.importDone') : t('settings.importFailed'));
        if (res.ok) app.go('home');
      };
      reader.readAsText(f);
    };
    row.appendChild(file);
    row.appendChild(U.el('button', { class: 'btn sm quiet', type: 'button', onclick: function () { file.click(); } }, [t('settings.import')]));
    row.appendChild(U.el('button', { class: 'btn sm danger', type: 'button', onclick: function () {
      UI.sheet({ title: t('settings.resetTitle'), body: t('settings.resetBody'), actions: [
        { label: t('common.cancel'), style: 'ghost' },
        { label: t('settings.resetConfirm'), style: 'danger', onclick: function () {
          var keep = Store.getProfile().targetExam;
          Store.clearAll();
          Store.patchProfile({ onboarded: true, targetExam: keep });
          Stats.reset();
          UI.toast(t('settings.resetDone'));
          app.go('home');
        } }
      ] });
    } }, [t('settings.reset')]));
    dataCard.appendChild(row);
    el.appendChild(dataCard);

    var about = U.el('div', { class: 'card' });
    about.appendChild(U.el('h3', { text: t('settings.about') }));
    about.appendChild(U.el('p', { class: 'legal', text: t('settings.aboutText') }));
    about.appendChild(U.el('p', { class: 'legal', text: t('settings.version') + ' : ' + ((Quiz.manifest() || {}).contentVersion || '—') + (Store.isPersistent() ? '' : ' · ' + t('settings.memoryOnly')) }));
    el.appendChild(about);
  };

  // ---------------------------------------------------------------- wiring
  UI.init = function (opts) {
    host = document.getElementById('cm-app');
    app = opts.app;
    concoursDoc = opts.concours || concoursDoc;
    manifest = opts.manifest || manifest;
    sourcesDoc = opts.sources || sourcesDoc;
    lastSummary = null;
  };
  UI.subjectsOf = function (id) { var p = byId(id); return p ? p.subjects : []; };
  UI.hasConcours = function (id) { return !!byId(id); };
  UI.leaveQuiz = function () {
    // Called by the router when the user navigates away from a running quiz
    // (browser back, header link…): the session is kept and can be resumed.
    stopTimer();
    TTS.stop();
    if (UI._memIv) clearInterval(UI._memIv);
  };

  global.CM = global.CM || {};
  global.CM.ui = UI;
})(window);

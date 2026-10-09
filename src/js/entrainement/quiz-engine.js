/* Concours Maroc — practice app: quiz session engine.
 *
 * Owns the question pool, the current session and its persistence; knows
 * nothing about the DOM. Sessions are saved after every answer, so closing the
 * tab or pressing the browser's back button never loses progress.
 *
 * Modes:
 *   practice / daily / weak / review / bookmarks / retry : immediate feedback
 *   mock : exam conditions — timer, answers can be changed, no feedback until
 *          the end, official-like scoring (e.g. +2 / −1 / 0) and eliminatory
 *          marks per section when the concours has one.
 */
(function (global) {
  'use strict';

  var U = global.CM.utils;
  var Store = global.CM.store;

  var SESSION_KEY = 'session.current';
  var BOOKMARK_KEY = 'bookmarks';
  var NOTES_KEY = 'notes';
  var DAILY_KEY = 'daily';
  var SRS_KEY = 'srs';
  // Leitner boxes: days until the next review after a correct answer.
  var SRS_INTERVALS = [0, 1, 3, 7, 14, 30];

  var pool = [];
  var byId = {};
  var manifest = null;
  var session = null;

  function T() { return global.CM.i18n; }

  var Engine = {
    // ------------------------------------------------------------ pool
    setManifest: function (mf) { manifest = mf; },
    manifest: function () { return manifest; },

    addQuestions: function (questions) {
      (questions || []).forEach(function (q) {
        if (!byId[q.id]) { byId[q.id] = q; pool.push(q); }
      });
      return pool.length;
    },
    pool: function () { return pool; },
    get: function (id) { return byId[id] || null; },

    categories: function () {
      var seen = {};
      pool.forEach(function (q) { seen[q.category] = (seen[q.category] || 0) + 1; });
      return seen;
    },

    /* filters: { categories[], difficulties[], ids[], exclude[] } */
    filter: function (filters) {
      var f = filters || {};
      return pool.filter(function (q) {
        if (f.ids && f.ids.indexOf(q.id) === -1) return false;
        if (f.exclude && f.exclude.indexOf(q.id) !== -1) return false;
        if (f.categories && f.categories.length && f.categories.indexOf(q.category) === -1) return false;
        if (f.difficulties && f.difficulties.length && f.difficulties.indexOf(q.difficulty) === -1) return false;
        return true;
      });
    },

    countAvailable: function (filters) { return Engine.filter(filters).length; },

    // ------------------------------------------------------------ build
    build: function (opts) {
      var o = opts || {};
      var candidates = Engine.filter({ categories: o.categories, difficulties: o.difficulties, ids: o.ids });
      if (!candidates.length) return null;
      var rand = o.seed !== undefined && o.seed !== null ? U.rng(o.seed) : Math.random;
      var wanted = Math.min(o.count || 10, candidates.length);
      var picked = (o.weighted && o.weights) ? weightedPick(candidates, wanted, o.weights, rand) : U.sample(candidates, wanted, rand);
      if (o.ids && o.keepOrder) {
        picked = o.ids.map(function (id) { return byId[id]; }).filter(Boolean).slice(0, wanted);
      }
      return start(picked, o, rand);
    },

    /* Mock exam following the concours format: sections in a fixed order,
       questions drawn per section, official-like scoring and timer. */
    buildMock: function (profile, lang) {
      var mock = profile && profile.mock;
      if (!mock) return null;
      var rand = Math.random;
      var picked = [];
      var sections = [];
      var short = [];
      mock.sections.forEach(function (sec, si) {
        var cands = U.shuffle(Engine.filter({ categories: sec.subjects }), rand);
        // Prefer exam-level questions, keep a few easier ones for balance.
        cands.sort(function (a, b) { return rank(b.difficulty) - rank(a.difficulty); });
        var hard = cands.filter(function (q) { return q.difficulty !== 'beginner'; });
        var easy = cands.filter(function (q) { return q.difficulty === 'beginner'; });
        var chosen = U.shuffle(hard, rand).slice(0, sec.count);
        if (chosen.length < sec.count) chosen = chosen.concat(U.shuffle(easy, rand).slice(0, sec.count - chosen.length));
        chosen = chosen.filter(function (q) { return picked.indexOf(q) === -1; });
        if (chosen.length < sec.count) short.push(sec.subjects.join('+'));
        var startIdx = picked.length;
        picked = picked.concat(U.shuffle(chosen, rand));
        sections.push({ subjects: sec.subjects, start: startIdx, end: picked.length, wanted: sec.count });
      });
      if (!picked.length) return null;
      var minutes = mock.minutes;
      // Scale the duration when the bank could not fill every section.
      var wantedTotal = mock.sections.reduce(function (s, x) { return s + x.count; }, 0);
      if (picked.length < wantedTotal) minutes = Math.max(5, Math.round(minutes * picked.length / wantedTotal));
      var s = start(picked, {
        mode: 'mock', feedback: 'end', limitMs: minutes * 60000, concours: profile.id,
        scoring: mock.scoring || { correct: 1, wrong: 0, blank: 0 },
        eliminatory: mock.eliminatory || null, sections: sections, keepOrder: true, lang: lang
      }, rand, true);
      s.shortSections = short;
      Engine.save();
      return s;
    },

    buildWeak: function (opts) {
      var o = opts || {};
      var stats = global.CM.stats.perCategory();
      var weights = {};
      (o.categories || Object.keys(Engine.categories())).forEach(function (cat) {
        var s = stats[cat];
        if (!s || s.answered < 3) { weights[cat] = 1.4; return; }
        weights[cat] = 0.4 + (1 - s.correct / s.answered) * 2.6;
      });
      o.weighted = true;
      o.weights = weights;
      o.mode = 'weak';
      return Engine.build(o);
    },

    /* Same ten questions for everyone on a given day and concours. */
    buildDaily: function (concoursId, categories) {
      var key = U.todayKey();
      return Engine.build({
        mode: 'daily', count: 10, categories: categories,
        seed: U.hash('concours-maroc-daily-' + key + '-' + (concoursId || 'all')), concours: concoursId
      });
    },

    dailyState: function (concoursId) {
      var rec = Store.read(DAILY_KEY, {});
      var key = U.todayKey();
      var r = rec[concoursId || 'all'] || {};
      return { key: key, done: r.lastDone === key, lastScore: r.lastScore };
    },

    markDailyDone: function (concoursId, score, total) {
      var rec = Store.read(DAILY_KEY, {});
      if (rec.lastDone) rec = {}; // legacy shape
      rec[concoursId || 'all'] = { lastDone: U.todayKey(), lastScore: score, lastTotal: total };
      Store.write(DAILY_KEY, rec);
    },

    // ------------------------------------------------------------ spaced repetition
    srs: function () { return Store.read(SRS_KEY, {}); },
    /* Wrong answers enter box 1 (review tomorrow); each correct review moves
       the question up one box (1, 3, 7, 14, 30 days) until it is mastered. */
    srsRecord: function (qid, correct, cat) {
      var all = Engine.srs();
      var cur = all[qid];
      var today = U.todayKey();
      if (!correct) {
        all[qid] = { box: 1, due: U.addDays(today, 1), cat: cat };
      } else if (cur) {
        var box = Math.min(cur.box + 1, SRS_INTERVALS.length - 1);
        if (cur.box >= SRS_INTERVALS.length - 1) delete all[qid];   // mastered
        else all[qid] = { box: box, due: U.addDays(today, SRS_INTERVALS[box]), cat: cur.cat || cat };
      }
      Store.write(SRS_KEY, all);
    },
    srsDueCategories: function () {
      var all = Engine.srs();
      var today = U.todayKey();
      var out = [];
      Object.keys(all).forEach(function (id) {
        var e = all[id];
        if (e.due <= today && e.cat && out.indexOf(e.cat) === -1) out.push(e.cat);
      });
      if (!out.length && Object.keys(all).length && manifest) out = (manifest.categories || []).map(function (c) { return c.id; });
      return out;
    },
    srsDue: function (categories) {
      var all = Engine.srs();
      var today = U.todayKey();
      return Object.keys(all).filter(function (id) {
        if (all[id].due > today) return false;
        if (categories && byId[id] && categories.indexOf(byId[id].category) === -1) return false;
        return true;
      });
    },
    buildReview: function (categories) {
      var due = Engine.srsDue(categories).filter(function (id) { return byId[id]; });
      // oldest reviews first
      var all = Engine.srs();
      due.sort(function (a, b) { return all[a].due < all[b].due ? -1 : all[a].due > all[b].due ? 1 : 0; });
      if (!due.length) return null;
      return Engine.build({ ids: due.slice(0, 20), count: Math.min(due.length, 20), mode: 'review' });
    },

    // ------------------------------------------------------------ state
    current: function () { return session; },

    savedSummary: function () {
      var s = Store.read(SESSION_KEY, null);
      if (!s || s.finished || !s.items) return null;
      var remaining = s.items.filter(function (it) { return it.answeredIndex === null && !it.skipped; }).length;
      return { mode: s.mode, total: s.items.length, remaining: remaining, concours: s.concours, categories: s.categoriesNeeded || [] };
    },

    /* Restores the saved session; the caller must have loaded its banks. */
    resume: function () {
      var s = Store.read(SESSION_KEY, null);
      if (!s || s.finished || !Array.isArray(s.items) || !s.items.length) return null;
      var valid = s.items.every(function (it) { return !!byId[it.qid]; });
      if (!valid) { Engine.discard(); return null; }
      session = s;
      return session;
    },

    save: function () { return session ? Store.write(SESSION_KEY, session) : false; },
    discard: function () { session = null; Store.remove(SESSION_KEY); return true; },

    // ------------------------------------------------------------ play
    item: function (i) {
      if (!session) return null;
      var idx = typeof i === 'number' ? i : session.index;
      var it = session.items[idx];
      if (!it) return null;
      var q = byId[it.qid];
      if (!q) return null;
      var picked = T().pick(q, T().lang);
      if (!picked) return null;
      var body = picked.body;
      return {
        state: it,
        question: q,
        lang: picked.lang,
        body: body,
        choices: it.order.map(function (o) { return body.choices[o]; }),
        correctDisplayIndex: it.order.indexOf(body.correctIndex),
        position: idx + 1,
        total: session.items.length,
        section: sectionOf(idx)
      };
    },

    /* Practice: locks the answer and returns the correction.
       Mock: records/changes the choice silently. */
    answer: function (displayIndex, elapsedMs) {
      var view = Engine.item();
      if (!view) return null;
      var it = view.state;
      if (session.feedback === 'end') {
        it.answeredIndex = it.answeredIndex === displayIndex ? null : displayIndex;   // tap again to clear
        it.correct = it.answeredIndex === null ? null : displayIndex === view.correctDisplayIndex;
        it.elapsedMs += Math.max(0, elapsedMs || 0);
        Engine.save();
        return { mock: true, selected: it.answeredIndex };
      }
      if (it.answeredIndex !== null) return null;
      it.answeredIndex = displayIndex;
      it.correct = displayIndex === view.correctDisplayIndex;
      it.elapsedMs = Math.max(0, elapsedMs || 0);
      it.skipped = false;
      Engine.save();
      global.CM.stats.recordAnswer(view.question, it.correct, it.elapsedMs);
      Engine.srsRecord(view.question.id, it.correct, view.question.category);
      return { correct: it.correct, correctDisplayIndex: view.correctDisplayIndex, body: view.body, question: view.question, lang: view.lang };
    },

    skip: function () {
      var view = Engine.item();
      if (!view || view.state.answeredIndex !== null) return false;
      view.state.skipped = true;
      Engine.save();
      return true;
    },

    next: function () {
      if (!session) return false;
      if (session.index < session.items.length - 1) { session.index++; Engine.save(); return true; }
      return false;
    },
    prev: function () {
      if (!session || session.index <= 0) return false;
      session.index--; Engine.save(); return true;
    },
    goTo: function (i) {
      if (!session || i < 0 || i >= session.items.length) return false;
      session.index = i; Engine.save(); return true;
    },
    isLast: function () { return !!session && session.index >= session.items.length - 1; },
    answeredCount: function () {
      return session ? session.items.filter(function (it) { return it.answeredIndex !== null; }).length : 0;
    },
    tick: function (deltaMs) { if (session && !session.finished) session.elapsedMs += deltaMs; },
    timeLeftMs: function () {
      if (!session || !session.limitMs) return null;
      return Math.max(0, session.limitMs - session.elapsedMs);
    },

    finish: function () {
      if (!session) return null;
      if (session.feedback === 'end') {
        // Exam mode: answers are recorded in the statistics only now.
        session.items.forEach(function (it) {
          var q = byId[it.qid];
          if (!q || it.answeredIndex === null) return;
          global.CM.stats.recordAnswer(q, it.correct, it.elapsedMs);
          Engine.srsRecord(q.id, it.correct, q.category);
        });
      }
      session.finished = true;
      session.finishedAt = new Date().toISOString();
      var summary = Engine.summary();
      Engine.save();
      var res = global.CM.stats.recordSession(summary);
      summary.newBadges = res ? res.newBadges : [];
      return summary;
    },

    summary: function () {
      if (!session) return null;
      var sc = session.scoring || { correct: 1, wrong: 0, blank: 0 };
      var total = session.items.length;
      var correct = 0, wrong = 0, skipped = 0;
      var perCat = {};
      session.items.forEach(function (it) {
        var q = byId[it.qid];
        var cat = q ? q.category : 'autre';
        perCat[cat] = perCat[cat] || { total: 0, correct: 0, wrong: 0 };
        perCat[cat].total++;
        if (it.answeredIndex === null) skipped++;
        else if (it.correct) { correct++; perCat[cat].correct++; }
        else { wrong++; perCat[cat].wrong++; }
      });
      var points = correct * sc.correct + wrong * sc.wrong + skipped * sc.blank;
      var max = total * sc.correct;
      var note20 = max > 0 ? Math.max(0, points) / max * 20 : 0;
      var sections = (session.sections || []).map(function (sec) {
        var c = 0, w = 0, b = 0;
        for (var i = sec.start; i < sec.end; i++) {
          var it = session.items[i];
          if (it.answeredIndex === null) b++; else if (it.correct) c++; else w++;
        }
        var n = sec.end - sec.start;
        var pts = c * sc.correct + w * sc.wrong + b * sc.blank;
        var mx = n * sc.correct;
        var n20 = mx > 0 ? Math.max(0, pts) / mx * 20 : 0;
        return { subjects: sec.subjects, total: n, correct: c, wrong: w, blank: b, points: pts, max: mx, note20: n20,
          eliminated: session.eliminatory ? n20 < session.eliminatory : false };
      });
      return {
        sessionId: session.id,
        mode: session.mode,
        concours: session.concours || null,
        lang: T().lang,
        at: session.finishedAt || new Date().toISOString(),
        total: total, correct: correct, wrong: wrong, skipped: skipped,
        accuracy: U.pct(correct, total),
        points: points, maxPoints: max, note20: Math.round(note20 * 100) / 100,
        scoring: sc, sections: sections, eliminatory: session.eliminatory || null,
        durationMs: session.elapsedMs,
        perCategory: perCat,
        wrongIds: session.items.filter(function (it) { return it.answeredIndex !== null && !it.correct; }).map(function (it) { return it.qid; }),
        categories: session.filters ? session.filters.categories : null
      };
    },

    review: function () {
      if (!session) return [];
      return session.items.map(function (it, i) {
        var q = byId[it.qid];
        if (!q) return null;
        var picked = T().pick(q, T().lang);
        if (!picked) return null;
        var body = picked.body;
        return {
          index: i, question: q, body: body, lang: picked.lang,
          answered: it.answeredIndex !== null,
          correct: it.correct === true,
          chosen: it.answeredIndex === null ? null : body.choices[it.order[it.answeredIndex]],
          expected: body.choices[body.correctIndex]
        };
      }).filter(Boolean);
    },

    // ------------------------------------------------------------ bookmarks & notes
    bookmarks: function () { return Store.read(BOOKMARK_KEY, []); },
    isBookmarked: function (qid) { return Engine.bookmarks().indexOf(qid) !== -1; },
    toggleBookmark: function (qid) {
      var list = Engine.bookmarks();
      var i = list.indexOf(qid);
      if (i === -1) list.push(qid); else list.splice(i, 1);
      Store.write(BOOKMARK_KEY, list);
      return i === -1;
    },
    removeBookmark: function (qid) {
      var list = Engine.bookmarks().filter(function (id) { return id !== qid; });
      Store.write(BOOKMARK_KEY, list);
      return list;
    },
    notes: function () { return Store.read(NOTES_KEY, {}); },
    getNote: function (qid) { return Engine.notes()[qid] || ''; },
    setNote: function (qid, text) {
      var all = Engine.notes();
      if (text && text.trim()) all[qid] = text.trim(); else delete all[qid];
      Store.write(NOTES_KEY, all);
      return all[qid] || '';
    }
  };

  // ------------------------------------------------------------ helpers
  function rank(d) { return d === 'advanced' ? 2 : d === 'intermediate' ? 1 : 0; }

  function sectionOf(idx) {
    if (!session || !session.sections) return null;
    for (var i = 0; i < session.sections.length; i++) {
      var s = session.sections[i];
      if (idx >= s.start && idx < s.end) return { index: i, subjects: s.subjects, start: s.start, end: s.end };
    }
    return null;
  }

  function start(picked, o, rand, noSave) {
    session = {
      id: U.uid('s'),
      mode: o.mode || 'practice',
      feedback: o.feedback || 'immediate',
      concours: o.concours || null,
      createdAt: new Date().toISOString(),
      elapsedMs: 0,
      limitMs: o.limitMs || 0,
      index: 0,
      finished: false,
      scoring: o.scoring || null,
      eliminatory: o.eliminatory || null,
      sections: o.sections || null,
      categoriesNeeded: uniq(picked.map(function (q) { return q.category; })),
      filters: { categories: o.categories || null, difficulties: o.difficulties || null },
      items: picked.map(function (q) {
        return {
          qid: q.id,
          order: U.shuffle([0, 1, 2, 3], rand),
          answeredIndex: null,
          correct: null,
          skipped: false,
          elapsedMs: 0
        };
      })
    };
    if (!noSave) Engine.save();
    return session;
  }

  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  function weightedPick(candidates, n, weights, rand) {
    var buckets = {};
    candidates.forEach(function (q) { (buckets[q.category] = buckets[q.category] || []).push(q); });
    var cats = Object.keys(buckets);
    var out = [];
    var guard = 0;
    while (out.length < n && guard++ < n * 40) {
      var totalW = cats.reduce(function (s, c) { return s + (buckets[c].length ? (weights[c] || 1) : 0); }, 0);
      if (totalW <= 0) break;
      var r = rand() * totalW;
      var chosen = null;
      for (var i = 0; i < cats.length; i++) {
        if (!buckets[cats[i]].length) continue;
        r -= (weights[cats[i]] || 1);
        if (r <= 0) { chosen = cats[i]; break; }
      }
      if (!chosen) chosen = cats.filter(function (c) { return buckets[c].length; })[0];
      if (!chosen) break;
      var idx = Math.floor(rand() * buckets[chosen].length);
      out.push(buckets[chosen].splice(idx, 1)[0]);
    }
    if (out.length < n) {
      var ids = {};
      out.forEach(function (q) { ids[q.id] = true; });
      out = out.concat(U.sample(candidates.filter(function (q) { return !ids[q.id]; }), n - out.length, rand));
    }
    return U.shuffle(out, rand);
  }

  global.CM = global.CM || {};
  global.CM.quiz = Engine;
})(window);

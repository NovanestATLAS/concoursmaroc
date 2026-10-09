/* Concours Maroc — practice app: progress, streaks, badges.
 *
 * Everything here is local and additive. Badges reward regularity and breadth,
 * never spending; there are no timers pressuring the user back into the app and
 * no streak-loss penalties beyond the counter resetting.
 */
(function (global) {
  'use strict';

  var U = global.CM.utils;
  var Store = global.CM.store;

  var STATS_KEY = 'stats';
  var HISTORY_KEY = 'history';
  var HISTORY_MAX = 200;

  var BADGES = [
    { id: 'firstSession', test: function (s) { return s.sessions >= 1; } },
    { id: 'tenSessions', test: function (s) { return s.sessions >= 10; } },
    { id: 'hundredAnswers', test: function (s) { return s.answered >= 100; } },
    { id: 'fiveHundredAnswers', test: function (s) { return s.answered >= 500; } },
    { id: 'firstMock', test: function (s) { return s.mocks >= 1; } },
    { id: 'perfectRun', test: function (s) { return s.perfectRuns >= 1; } },
    { id: 'weekStreak', test: function (s) { return s.bestStreak >= 7; } },
    { id: 'explorer', test: function (s) { return Object.keys(s.perCategory).length >= 6; } }
  ];

  function blank() {
    return {
      answered: 0,
      correct: 0,
      sessions: 0,
      mocks: 0,
      perfectRuns: 0,
      totalTimeMs: 0,
      xp: 0,
      streak: 0,
      bestStreak: 0,
      lastDay: null,
      badges: [],
      perCategory: {},   // cat -> { answered, correct }
      perDifficulty: {}  // diff -> { answered, correct }
    };
  }

  function load() {
    var s = Store.read(STATS_KEY, null);
    if (!s || typeof s !== 'object') return blank();
    var base = blank();
    Object.keys(base).forEach(function (k) {
      if (s[k] === undefined || s[k] === null) s[k] = base[k];
    });
    return s;
  }

  function save(s) { Store.write(STATS_KEY, s); }

  /* Streak = consecutive calendar days with at least one answer. */
  function touchDay(s) {
    var today = U.todayKey();
    if (s.lastDay === today) return;
    if (!s.lastDay) s.streak = 1;
    else {
      var gap = U.daysBetween(s.lastDay, today);
      s.streak = gap === 1 ? s.streak + 1 : 1;
    }
    s.lastDay = today;
    if (s.streak > s.bestStreak) s.bestStreak = s.streak;
  }

  var Stats = {
    all: function () { return load(); },

    recordAnswer: function (question, correct, elapsedMs) {
      var s = load();
      touchDay(s);
      s.answered++;
      if (correct) s.correct++;
      s.totalTimeMs += Math.max(0, elapsedMs || 0);

      var cat = question.category || 'inconnu';
      s.perCategory[cat] = s.perCategory[cat] || { answered: 0, correct: 0 };
      s.perCategory[cat].answered++;
      if (correct) s.perCategory[cat].correct++;

      var diff = question.difficulty || 'intermediate';
      s.perDifficulty[diff] = s.perDifficulty[diff] || { answered: 0, correct: 0 };
      s.perDifficulty[diff].answered++;
      if (correct) s.perDifficulty[diff].correct++;

      // 10 XP for a correct answer, 3 for an honest attempt.
      s.xp += correct ? 10 : 3;
      save(s);
      return s;
    },

    /* Returns the badges newly unlocked by this session, so the results screen
       can announce them once instead of on every visit. */
    recordSession: function (summary) {
      var s = load();
      touchDay(s);
      s.sessions++;
      if (summary.mode === 'mock') s.mocks = (s.mocks || 0) + 1;
      if (summary.total > 0 && summary.correct === summary.total) s.perfectRuns++;
      s.xp += 25;                                        // completion bonus
      if (summary.accuracy >= 80) s.xp += 25;            // quality bonus

      var before = s.badges.slice();
      BADGES.forEach(function (b) {
        if (s.badges.indexOf(b.id) === -1 && b.test(s)) s.badges.push(b.id);
      });
      var fresh = s.badges.filter(function (id) { return before.indexOf(id) === -1; });
      save(s);

      var history = Store.read(HISTORY_KEY, []);
      history.unshift({
        at: summary.at,
        mode: summary.mode,
        lang: summary.lang,
        total: summary.total,
        correct: summary.correct,
        accuracy: summary.accuracy,
        durationMs: summary.durationMs,
        concours: summary.concours || null,
        note20: typeof summary.note20 === 'number' ? summary.note20 : null,
        categories: Object.keys(summary.perCategory)
      });
      if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
      Store.write(HISTORY_KEY, history);

      return { stats: s, newBadges: fresh };
    },

    perCategory: function () { return load().perCategory; },

    accuracy: function () {
      var s = load();
      return U.pct(s.correct, s.answered);
    },

    /* Categories sorted from weakest to strongest, ignoring barely-tested ones
       so that a single unlucky answer does not dominate the recommendation. */
    weakest: function (limit) {
      var per = load().perCategory;
      return Object.keys(per)
        .filter(function (c) { return per[c].answered >= 3; })
        .map(function (c) {
          return { category: c, accuracy: U.pct(per[c].correct, per[c].answered),
                   answered: per[c].answered };
        })
        .sort(function (a, b) { return a.accuracy - b.accuracy; })
        .slice(0, limit || 3);
    },

    history: function (query) {
      var list = Store.read(HISTORY_KEY, []);
      if (!query) return list;
      var q = String(query).toLowerCase();
      return list.filter(function (h) {
        return (h.mode || '').toLowerCase().indexOf(q) !== -1
          || (h.categories || []).join(' ').toLowerCase().indexOf(q) !== -1
          || String(h.accuracy).indexOf(q) !== -1
          || (h.at || '').indexOf(q) !== -1;
      });
    },

    badges: function () { return load().badges; },
    allBadgeIds: function () { return BADGES.map(function (b) { return b.id; }); },

    reset: function () {
      Store.remove(STATS_KEY);
      Store.remove(HISTORY_KEY);
      return blank();
    }
  };

  global.CM = global.CM || {};
  global.CM.stats = Stats;
})(window);

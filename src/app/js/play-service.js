/* Concours Maroc (Android app) — Google Play: review prompt and update notice.
 *
 * Review: Google Play's own review card (In-App Review API, plugin
 * cordova-launch-review), requested at a good moment and rarely:
 *   - after a finished session, results on screen, score ≥ 60 %;
 *   - at least 4 finished sessions, on at least 3 different days;
 *   - at most once every 90 days, 3 times in all, never twice in one day.
 * Google decides whether the card actually appears (it has its own quota),
 * and no question is asked before it, as Google Play requires.
 *
 * Rating message: a neutral note of ours ("Votre avis compte") whose button
 * opens the Play Store page, for the moments the card is not due:
 *   - after a finished session, results on screen, score ≥ 60 %;
 *   - at least 8 finished sessions, on at least 5 different days;
 *   - never within 30 days of a review card, at most twice, 60 days apart;
 *   - "Ne plus demander" stops it for good.
 * It asks no question about the user's opinion and sends everyone to the
 * same Play Store page (no review gating, no reward).
 *
 * Update: when Google Play has a newer version (In-App Updates API, local
 * plugin cordova-plugin-play-update), a sheet offers to update now; "Plus
 * tard" hides it for 3 days. Google Play's update screen does the rest. An
 * update left half-done is resumed when the app comes back.
 *
 * Without the plugins (browser, older build) everything is a no-op.
 */
(function (global) {
  'use strict';

  var KEY = 'cm.play';
  var DAY = 86400000;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function online() { return !global.navigator || global.navigator.onLine !== false; }
  function ar() { return document.documentElement.getAttribute('lang') === 'ar'; }
  function tr(fr, a) { return ar() ? a : fr; }

  // ------------------------------------------------------------ usage
  function noteDay(s) {
    var d = today();
    s.days = s.days || [];
    if (s.days.indexOf(d) === -1) { s.days.push(d); if (s.days.length > 30) s.days.shift(); }
    if (!s.first) s.first = Date.now();
  }

  // ------------------------------------------------------------ review
  function reviewAvailable() {
    return !!(global.LaunchReview && typeof global.LaunchReview.rating === 'function');
  }

  function reviewEligible(s, summary) {
    if (!reviewAvailable() || !online()) return false;
    var asks = s.asks || [];
    var last = asks.length ? asks[asks.length - 1] : 0;
    var pct = summary && summary.total ? (summary.correct || 0) / summary.total : 0;
    return (s.sessions || 0) >= 4
      && (s.days || []).length >= 3
      && asks.length < 3
      && Date.now() - last > 90 * DAY
      && pct >= 0.6;
  }

  function storePageAvailable() {
    return !!((global.LaunchReview && typeof global.LaunchReview.launch === 'function') || global.PlayUpdate);
  }

  function promptEligible(s, summary) {
    if (!storePageAvailable() || !online() || s.promptOff) return false;
    var asks = s.asks || [];
    var lastCard = asks.length ? asks[asks.length - 1] : 0;
    var prompts = s.prompts || [];
    var lastPrompt = prompts.length ? prompts[prompts.length - 1] : 0;
    var pct = summary && summary.total ? (summary.correct || 0) / summary.total : 0;
    return (s.sessions || 0) >= 8
      && (s.days || []).length >= 5
      && prompts.length < 2
      && Date.now() - lastPrompt > 60 * DAY
      && Date.now() - lastCard > 30 * DAY
      && pct >= 0.6;
  }

  function requestCard() {
    try {
      global.LaunchReview.rating(function () { /* requested / shown / dismissed */ }, function (e) {
        console.warn('[play] review :', e);
      });
    } catch (e) { console.warn('[play] review :', e && e.message); }
  }

  function ratingPrompt() {
    var UI = global.CM && global.CM.ui;
    if (!UI || !UI.sheet) return false;
    if (UI.isSheetOpen && UI.isSheetOpen()) return false;
    UI.sheet({
      title: tr('Votre avis compte', 'رأيك يهمنا'),
      body: tr('Concours Maroc est gratuit et s’améliore grâce aux retours de ses utilisateurs. Si l’application vous aide à préparer vos concours, vous pouvez laisser une note et un commentaire sur Google Play : cela prend une minute.',
               'تطبيق Concours Maroc مجاني ويتحسن بفضل ملاحظات مستخدميه. إذا كان التطبيق يساعدك في التحضير لمبارياتك، يمكنك ترك تقييم وتعليق على Google Play: يستغرق ذلك دقيقة واحدة.'),
      actions: [
        { label: tr('Ne plus demander', 'لا تسألني مجددًا'), style: 'quiet', onclick: function () { var s = load(); s.promptOff = true; save(s); } },
        { label: tr('Plus tard', 'لاحقًا'), style: 'ghost' },
        { label: tr('Noter sur Google Play', 'التقييم على Google Play'), style: 'primary', onclick: function () { Play.openStorePage(); } }
      ]
    });
    return true;
  }

  var Play = {
    /* A finished session whose results are on screen. Returns true when the
       review card or the rating message was shown (the caller then skips the
       interstitial). */
    sessionFinished: function (summary) {
      var s = load();
      noteDay(s);
      s.sessions = (s.sessions || 0) + 1;
      var ask = reviewEligible(s, summary);
      var prompt = !ask && promptEligible(s, summary);
      if (ask) (s.asks = s.asks || []).push(Date.now());
      if (prompt) (s.prompts = s.prompts || []).push(Date.now());
      save(s);
      if (ask) { setTimeout(requestCard, 900); return true; }
      if (prompt) { setTimeout(ratingPrompt, 1200); return true; }
      return false;
    },

    // developer screen
    debug: function () {
      return { state: load(), reviewPlugin: reviewAvailable(), updatePlugin: Play.updateAvailable(), storePage: storePageAvailable(), online: online() };
    },
    requestReviewCard: function () { if (!reviewAvailable()) return false; requestCard(); return true; },
    previewRatingPrompt: function () { return ratingPrompt(); },
    previewUpdate: function () {
      offer({ availability: 'available', versionCode: 0, immediate: false, flexible: false, priority: 0, preview: true });
    },
    resetState: function () { save({}); },

    /* "Noter l'application" in the settings: the Play Store page. */
    openStorePage: function () {
      if (global.LaunchReview && typeof global.LaunchReview.launch === 'function') { global.LaunchReview.launch(); return true; }
      if (global.PlayUpdate) { global.PlayUpdate.openStore(); return true; }
      return false;
    },

    // ---------------------------------------------------------- update
    updateAvailable: function () { return !!(global.PlayUpdate && typeof global.PlayUpdate.check === 'function'); },

    checkUpdate: function (force) {
      var s = load();
      noteDay(s);
      save(s);
      if (!Play.updateAvailable() || !online()) return Promise.resolve(null);
      var resuming = s.updating && Date.now() - s.updating < DAY;   // an update was started: see it through
      if (!force && !resuming && Date.now() - (s.checked || 0) < 12 * 3600000) return Promise.resolve(null);
      return global.PlayUpdate.check().then(function (info) {
        var st = load();
        st.checked = Date.now();
        save(st);
        if (!info) return null;
        if (info.availability === 'in_progress' || info.downloaded) {
          // an update started earlier: let Google Play finish it
          return global.PlayUpdate.start(info.downloaded ? 'flexible' : 'immediate').then(function () { return info; });
        }
        if (info.availability !== 'available') { if (st.updating) { delete st.updating; save(st); } return info; }
        var snoozed = st.later && st.laterCode === info.versionCode && Date.now() - st.later < 3 * DAY;
        if (!snoozed || info.priority >= 4) offer(info);
        return info;
      }).catch(function (e) { console.warn('[play] update :', e); return null; });
    }
  };

  function offer(info) {
    var UI = global.CM && global.CM.ui;
    if (!UI || !UI.sheet) return;
    if (UI.isSheetOpen && UI.isSheetOpen()) return;   // never over another dialog
    var type = info.immediate ? 'immediate' : (info.flexible ? 'flexible' : null);
    UI.sheet({
      title: tr('Nouvelle version disponible', 'نسخة جديدة متوفرة'),
      body: tr('Une mise à jour de Concours Maroc est disponible sur Google Play : nouvelles fiches, questions et corrections. Elle prend moins d’une minute.',
               'يتوفر تحديث لتطبيق Concours Maroc على Google Play: بطاقات وأسئلة وتصحيحات جديدة. يستغرق أقل من دقيقة.'),
      actions: [
        { label: tr('Plus tard', 'لاحقًا'), style: 'ghost', onclick: function () {
          if (info.preview) return;
          var s = load(); s.later = Date.now(); s.laterCode = info.versionCode; save(s);
        } },
        { label: tr('Mettre à jour', 'تحديث الآن'), style: 'primary', onclick: function () {
          if (!info.preview) { var st = load(); st.updating = Date.now(); save(st); }
          if (type) {
            global.PlayUpdate.start(type).then(function (r) {
              if (r === 'failed') global.PlayUpdate.openStore();
            }, function () { global.PlayUpdate.openStore(); });
          } else if (global.PlayUpdate) {
            global.PlayUpdate.openStore();
          } else {
            Play.openStorePage();
          }
        } }
      ]
    });
  }

  global.CM = global.CM || {};
  global.CM.play = Play;
})(window);

/* Concours Maroc (Android app) — Google Play: update window and review.
 *
 * Every dialog here opens through CM.ads.popups.when(): never while a
 * question is on screen, never over another dialog, never while an
 * interstitial is showing, about to show or just closed (ads-service.js).
 *
 * Update: when Google Play has a newer version (In-App Updates API, local
 * plugin cordova-plugin-play-update), checked at every opening of the app
 * and when it comes back (30 min apart at most), a window offers to update
 * now (Google Play's update screen does the rest; the app restarts
 * updated). "Plus tard": asked again at a later opening, 6 hours later at
 * the earliest, or at once for an update marked high priority (≥ 4) in the
 * Play Console. An update left half-done is resumed when the app comes
 * back; for one downloaded in the background, a window offers to restart
 * the app to install it.
 *
 * Review message ("Votre avis compte", button "Noter sur Google Play",
 * which opens the app's page on Google Play): from the second opening of
 * the app, at most once a month, a little after the app has opened, at a
 * calm moment. "Plus tard": next month; "Noter sur Google Play" or "Ne plus
 * demander": not asked again. It asks nothing about the user's opinion and
 * sends everyone to the same page (Google Play: no review gating, no
 * reward). The "Noter l'application" button of the settings stays.
 *
 * Google's own review card (In-App Review API, plugin
 * cordova-launch-review), requested rarely after a good set: results on
 * screen, score ≥ 60 %, at least 4 finished sets on 3 different days, at
 * most once every 90 days and 3 times in all, never when an interstitial
 * is shown for that set nor within 7 days of the review message. Google
 * decides whether the card actually appears (it has its own quota).
 *
 * Without the plugins (browser, older build) everything is a no-op.
 */
(function (global) {
  'use strict';

  var KEY = 'cm.play';
  var DAY = 86400000;
  var HOUR = 3600000;
  var REVIEW_EVERY = 30 * DAY;          // "once a month"
  var REVIEW_DELAY = 25000;             // after the app has opened
  var UPDATE_AGAIN = 6 * HOUR;          // after "Plus tard"
  var RECHECK = 30 * 60000;             // update check when the app comes back
  var session = { opened: false, updateOffered: false, reviewShown: false, checkedAt: 0, checking: null };

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
  function lastOf(list) { return list && list.length ? list[list.length - 1] : 0; }

  /* Opens fn() at a calm moment (see ads-service.js); fn returns false when
     it had nothing to show after all. */
  function whenCalm(fn, opts) {
    var A = global.CM && global.CM.ads;
    if (A && A.popups) A.popups.when(fn, opts);
    else setTimeout(fn, 0);
  }
  function nativeScreen(what, ms) {
    var A = global.CM && global.CM.ads;
    if (A && A.popups) A.popups.native(what, ms);
  }

  // ------------------------------------------------------------ usage
  function noteDay(s) {
    var d = today();
    s.days = s.days || [];
    if (s.days.indexOf(d) === -1) { s.days.push(d); if (s.days.length > 30) s.days.shift(); }
    if (!s.first) s.first = Date.now();
  }

  // ------------------------------------------------------------ review
  function cardAvailable() {
    return !!(global.LaunchReview && typeof global.LaunchReview.rating === 'function');
  }
  function storePageAvailable() {
    return !!((global.LaunchReview && typeof global.LaunchReview.launch === 'function') || global.PlayUpdate);
  }

  function cardEligible(s, summary) {
    if (!cardAvailable() || !online()) return false;
    var asks = s.asks || [];
    var pct = summary && summary.total ? (summary.correct || 0) / summary.total : 0;
    return (s.sessions || 0) >= 4
      && (s.days || []).length >= 3
      && asks.length < 3
      && Date.now() - lastOf(asks) > 90 * DAY
      && Date.now() - lastOf(s.prompts) > 7 * DAY
      && !session.reviewShown
      && pct >= 0.6;
  }

  function requestCard() {
    nativeScreen('review-card', 30000);
    try {
      global.LaunchReview.rating(function () { /* requested / shown / dismissed */ }, function (e) {
        console.warn('[play] review :', e);
      });
    } catch (e) { console.warn('[play] review :', e && e.message); }
  }

  /* From the second opening, once a month, until "Noter" or "Ne plus
     demander". */
  function promptDue(s) {
    if (!storePageAvailable() || s.promptOff || s.rated) return false;
    if ((s.opens || 0) < 2) return false;
    return Date.now() - lastOf(s.prompts) >= REVIEW_EVERY
      && Date.now() - lastOf(s.asks) >= 7 * DAY;
  }

  function ratingPrompt(preview) {
    var UI = global.CM && global.CM.ui;
    if (!UI || !UI.sheet) return false;
    if (!preview && UI.isSheetOpen && UI.isSheetOpen()) return false;
    UI.sheet({
      title: tr('Votre avis compte', 'رأيك يهمنا'),
      body: tr('Concours Maroc est gratuit et s’améliore grâce aux retours de ses utilisateurs. Si l’application vous aide à préparer vos concours, vous pouvez laisser une note et un commentaire sur Google Play : cela prend une minute.',
               'تطبيق Concours Maroc مجاني ويتحسن بفضل ملاحظات مستخدميه. إذا كان التطبيق يساعدك في التحضير لمبارياتك، يمكنك ترك تقييم وتعليق على Google Play: يستغرق ذلك دقيقة واحدة.'),
      actions: [
        { label: tr('Noter sur Google Play', 'التقييم على Google Play'), style: 'primary', onclick: function () {
          if (!preview) { var s = load(); s.rated = Date.now(); save(s); }
          Play.openStorePage();
        } },
        { label: tr('Plus tard', 'لاحقًا'), style: 'ghost' },
        { label: tr('Ne plus demander', 'لا تسألني مجددًا'), style: 'quiet', onclick: function () {
          if (preview) return;
          var s = load(); s.promptOff = Date.now(); save(s);
        } }
      ]
    });
    return true;
  }

  function showPrompt() {
    var s = load();
    if (session.reviewShown || !promptDue(s) || !online()) return false;
    if (!ratingPrompt()) return false;
    session.reviewShown = true;
    s.prompts = (s.prompts || []).concat(Date.now()).slice(-12);
    save(s);
    return true;
  }

  // ------------------------------------------------------------ update
  function updatePlugin() { return !!(global.PlayUpdate && typeof global.PlayUpdate.check === 'function'); }

  function startUpdate(type) {
    nativeScreen('update', 15000);
    return global.PlayUpdate.start(type).then(function (r) {
      if (r === 'failed') global.PlayUpdate.openStore();
      return r;
    }, function () { global.PlayUpdate.openStore(); return 'failed'; });
  }

  function offer(info) {
    var UI = global.CM && global.CM.ui;
    if (!UI || !UI.sheet) return false;
    if (!info.preview && UI.isSheetOpen && UI.isSheetOpen()) return false;   // never over another dialog
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
          if (type && global.PlayUpdate) startUpdate(type);
          else if (global.PlayUpdate) { nativeScreen('store', 15000); global.PlayUpdate.openStore(); }
          else Play.openStorePage();
        } }
      ]
    });
    return true;
  }

  /* A flexible update downloaded in the background: installing it restarts
     the app, so the user chooses the moment. */
  function offerRestart() {
    var UI = global.CM && global.CM.ui;
    if (!UI || !UI.sheet || (UI.isSheetOpen && UI.isSheetOpen())) return false;
    UI.sheet({
      title: tr('Mise à jour prête', 'التحديث جاهز'),
      body: tr('La nouvelle version est téléchargée. L’application redémarre quelques secondes pour l’installer.',
               'تم تنزيل النسخة الجديدة. سيُعاد تشغيل التطبيق لبضع ثوانٍ لتثبيتها.'),
      actions: [
        { label: tr('Plus tard', 'لاحقًا'), style: 'ghost' },
        { label: tr('Redémarrer', 'إعادة التشغيل'), style: 'primary', onclick: function () { startUpdate('flexible'); } }
      ]
    });
    return true;
  }

  function offerWhenCalm(info) {
    session.updateOffered = true;
    whenCalm(function () { return offer(info); }, { name: 'update', spacing: 0, maxWait: 3 * 60000 });
  }

  var Play = {
    /* Each opening of the app (not a return from the background). */
    appOpened: function () {
      if (session.opened) return;
      session.opened = true;
      var s = load();
      noteDay(s);
      s.opens = (s.opens || 0) + 1;
      save(s);
      if (promptDue(s)) {
        setTimeout(function () {
          whenCalm(showPrompt, { name: 'review', spacing: 3 * 60000, afterAd: 60000, maxWait: 10 * 60000 });
        }, REVIEW_DELAY);
      }
    },

    /* A finished set whose results are on screen. adShown: an interstitial
       is shown for it. Returns true when Google's review card was asked. */
    sessionFinished: function (summary, adShown) {
      var s = load();
      noteDay(s);
      s.sessions = (s.sessions || 0) + 1;
      var ask = !adShown && cardEligible(s, summary);
      if (ask) (s.asks = s.asks || []).push(Date.now());
      save(s);
      if (ask) setTimeout(requestCard, 900);
      return ask;
    },

    // developer screen
    debug: function () {
      return { state: load(), session: session, reviewPlugin: cardAvailable(), updatePlugin: updatePlugin(), storePage: storePageAvailable(), online: online(), promptDue: promptDue(load()) };
    },
    requestReviewCard: function () { if (!cardAvailable()) return false; requestCard(); return true; },
    previewRatingPrompt: function () { return ratingPrompt(true); },
    previewUpdate: function () {
      offer({ availability: 'available', versionCode: 0, immediate: false, flexible: false, priority: 0, preview: true });
    },
    resetState: function () {
      save({});
      session.updateOffered = false;
      session.reviewShown = false;
      session.checkedAt = 0;
    },

    /* "Noter l'application" in the settings: the Play Store page. */
    openStorePage: function () {
      if (global.LaunchReview && typeof global.LaunchReview.launch === 'function') { nativeScreen('store', 15000); global.LaunchReview.launch(); return true; }
      if (global.PlayUpdate) { nativeScreen('store', 15000); global.PlayUpdate.openStore(); return true; }
      return false;
    },

    // ---------------------------------------------------------- update
    updateAvailable: updatePlugin,

    /* force: "Rechercher une mise à jour" in the settings (the window opens
       even after "Plus tard"). fromResume: the app came back. */
    checkUpdate: function (force, fromResume) {
      var s = load();
      noteDay(s);
      save(s);
      if (!updatePlugin() || !online()) return Promise.resolve(null);
      if (session.checking) return session.checking;
      var resuming = s.updating && Date.now() - s.updating < DAY;   // an update was started: see it through
      if (!force && !resuming && fromResume && Date.now() - session.checkedAt < RECHECK) return Promise.resolve(null);
      session.checkedAt = Date.now();
      session.checking = Promise.resolve(global.PlayUpdate.check()).then(function (info) {
        session.checking = null;
        var st = load();
        st.checked = Date.now();
        if (!info) { save(st); return null; }
        save(st);
        if (info.downloaded) {
          if (force || !session.updateOffered) {
            session.updateOffered = true;
            whenCalm(offerRestart, { name: 'update-ready', spacing: 0, maxWait: 3 * 60000 });
          }
          return info;
        }
        if (info.availability === 'in_progress') {
          // an immediate update started earlier: Google Play's screen resumes it
          whenCalm(function () { startUpdate('immediate'); return true; }, { name: 'update-resume', spacing: 0, maxWait: 60000 });
          return info;
        }
        if (info.availability !== 'available') {
          if (st.updating) { delete st.updating; save(st); }
          return info;
        }
        var snoozed = st.later && st.laterCode === info.versionCode && Date.now() - st.later < UPDATE_AGAIN;
        if (force || (!session.updateOffered && (!snoozed || info.priority >= 4))) offerWhenCalm(info);
        return info;
      }).catch(function (e) {
        session.checking = null;
        console.warn('[play] update :', e);
        return null;
      });
      return session.checking;
    }
  };

  global.CM = global.CM || {};
  global.CM.play = Play;
})(window);

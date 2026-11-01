/* Concours Maroc (Android app) — advertising bridge and dialog coordinator.
 *
 * Talks to admob-plus-cordova (npm 2.0.0-alpha.19, its Android sources
 * re-read on 2026-10-30) when the plugin is installed; everywhere else
 * (desktop browser) it is a no-op mock: nothing is requested and no
 * impression is ever faked. Production units go in js/ads-config.js (see
 * that file).
 *
 * Banner — permanent: on every screen, questions included, on the bottom
 * edge of the WebView just above Android's navigation bar, with the app's
 * tab bar sitting right on it. The page keeps exactly the banner's height
 * free (body.has-banner, --banner-h, computed from the banner's size in
 * device pixels; admob-plus's own "dp" figure uses the screen's physical
 * dpi and left a gap of a few pixels on most phones). It only steps aside
 * while the keyboard is open, while a dialog of the app is open (so that
 * the dialog's buttons are never next to an ad) and when it cannot sit on
 * the edge of the page (rotation). A banner that fails to load is retried
 * (30 s, 1, 2, 4, then every 5 minutes) and comes back with the network.
 *
 * Interstitials — only at natural transitions (AdMob policy): never while
 * a question is on screen, never over a dialog of the app, never on launch,
 * on return to the app or on exit:
 *   - end of a set of at least 10 questions (ads-config.js: setQuestions):
 *     one as the results appear, unless the previous one closed less than
 *     3 minutes ago (minGapMs);
 *   - otherwise, once 4 minutes of use (maxGapMs) have passed since the
 *     previous one closed, or since the app was opened, at the next screen
 *     change, browsing pages included;
 *   - one due at the end of a set but not ready yet (still loading, a
 *     dialog open) is shown at the next screen change within 2 minutes.
 * Time spent outside the app or watching an ad does not count as use. The
 * next interstitial is loaded once the previous one has closed (loading it
 * during the show detached the show's callbacks in admob-plus), and failed
 * loads are retried.
 *
 * Dialogs — the update window, the review message and announcements go
 * through CM.ads.popups.when(): they open at a calm moment only (no question
 * on screen, no other dialog, no interstitial showing, about to show or
 * closed less than 10 s ago — 30 s for an announcement, 60 s for the review
 * message), and an interstitial waits 10 s after one of them closes (30 s
 * after Google's own review card), so that no button of theirs ever seems
 * to lead to an ad. No interstitial ever opens over a dialog.
 *
 * Rewarded ads only ever unlock extras; the answer, the short correction
 * and the detailed explanation stay free. No screen offers one yet, so none
 * is requested (showRewarded loads on demand). A reward is granted only
 * when the native reward event fires, or, if no ad could be served at all,
 * through an honest non-ad fallback.
 */
(function (global) {
  'use strict';

  var Store = global.CM.store;

  /* Google's official demo ad units for Android.
     Source: https://developers.google.com/admob/android/test-ads
     Production units are never committed: the build writes them into
     js/ads-config.js from cordova/admob.local.json (ignored by git). */
  var TEST_IDS = {
    banner: 'ca-app-pub-3940256099942544/9214589741',      // anchored adaptive
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917'
  };

  var MIN = 60000;
  var config = {
    enabled: true,
    testMode: true,
    ids: Object.assign({}, TEST_IDS),
    banner: 'auto',
    setQuestions: 10,
    minGapMs: 3 * MIN,
    maxGapMs: 4 * MIN
  };

  /* js/ads-config.js defines window.CM_ADS_CONFIG. In test mode Google's
     demo units are used whatever the file lists, so a test build never
     requests a real ad. With testMode false the file's units are used, and a
     format without a unit is simply never requested. */
  (function applyBuildConfig() {
    var c = global.CM_ADS_CONFIG;
    if (!c || typeof c !== 'object') return;
    if (typeof c.testMode === 'boolean') config.testMode = c.testMode;
    if (!config.testMode) {
      config.ids = {};
      Object.keys(c.ids || {}).forEach(function (k) { if (c.ids[k]) config.ids[k] = c.ids[k]; });
    }
    // minQuestionsBeforeInterstitial: name used by the first versions
    var q = typeof c.setQuestions === 'number' ? c.setQuestions : c.minQuestionsBeforeInterstitial;
    if (typeof q === 'number' && q > 0) config.setQuestions = q;
    if (typeof c.minGapMs === 'number' && c.minGapMs >= 0) config.minGapMs = c.minGapMs;
    if (typeof c.maxGapMs === 'number' && c.maxGapMs > 0) config.maxGapMs = c.maxGapMs;
    if (config.maxGapMs < config.minGapMs) config.maxGapMs = config.minGapMs;
    if (c.banner === true || c.banner === false || c.banner === 'auto') config.banner = c.banner;
  })();

  var CAP_KEY = 'ads.caps';
  var NAV_DELAY = 400;            // screen change -> the new page is drawn behind the ad
  var SET_END_DELAY = 300;        // results route -> the ad, before anything is tapped
  var AFTER_POPUP_MS = 10000;     // no interstitial right after an update / review / announcement window
  var AFTER_AD_MS = 10000;        // no dialog right after an interstitial closed
  var OWED_MS = 2 * MIN;
  var EXPIRY_MS = 55 * MIN;       // a loaded interstitial is valid one hour
  var RETRY = [30000, 60000, 120000, 240000, 300000];
  var startedAt = Date.now();

  var state = {
    mode: 'mock',          // 'native' | 'mock'
    started: false,
    bannerVisible: false,  // the app wants the banner on screen
    consent: 'unknown',    // 'unknown' | 'obtained' | 'not-required' | 'pending' | 'unavailable'
    consentRunning: false,
    online: true,
    canRequestAds: null,   // consent tool's answer (null: no consent tool)
    privacyOptions: false, // the settings must offer to change the choices
    rewardedReady: false,
    rewarded: null,
    banner: null,
    bannerOffset: null,    // px, overlay mode: offset the banner was created with
    bannerHeight: 0,       // CSS px, from the banner's size in device pixels
    bannerLoaded: false,
    bannerMisplaced: false,
    bannerForDialog: false, // native banner hidden while a dialog is open
    bannerRetry: 0,
    bannerRetryTimer: 0,
    insets: null,
    log: [],
    listeners: {}
  };

  var inter = {
    ad: null,
    ready: false,
    loading: false,
    loadedAt: 0,
    showing: false,        // from show() to the dismiss / failure event
    displayed: false,      // admob.ad.show received
    shownAt: 0,
    endedAt: 0,            // last one closed (this run of the app)
    prevLast: 0,
    timer: 0,              // an opportunity is being evaluated shortly
    pendingKind: '',
    watchdog: 0,
    retry: 0,
    retryTimer: 0,
    owed: null,
    last: null             // last decision, for the developer screen
  };

  var screenState = { sheetOpen: false, sheetClosedAt: 0, nativeUntil: 0, nativeWhat: '' };
  var popups = { last: 0, waiting: 0, open: false, closedAt: 0 };

  function emit(name, detail) {
    log(name, detail);
    (state.listeners[name] || []).forEach(function (fn) {
      try { fn(detail); } catch (e) { console.warn('[ads] listener error', e); }
    });
  }

  // Last ad events, for the developer screen (newest last).
  var LOG_MAX = 80;
  function log(type, detail) {
    state.log.push({ t: Date.now(), type: type, detail: detail || null });
    if (state.log.length > LOG_MAX) state.log.shift();
  }

  function caps() {
    return Store.read(CAP_KEY, { lastInterstitial: 0, sessions: 0, interstitialsShown: 0 });
  }
  function saveCaps(c) { Store.write(CAP_KEY, c); }
  function lastInterstitial() {
    var t = caps().lastInterstitial || 0;
    return t > Date.now() ? 0 : t;   // clock changed backwards: ignore
  }

  function pluginPresent() {
    return !!(global.admob && typeof global.admob.start === 'function');
  }
  function online() {
    if (global.navigator && typeof global.navigator.onLine === 'boolean') return global.navigator.onLine;
    return true;
  }
  function playing() {
    var b = global.CM && global.CM.boot;
    return !!(b && b.isPlaying && b.isPlaying());
  }
  function sheetOpenNow() {
    var UI = global.CM && global.CM.ui;
    try { return !!(UI && UI.isSheetOpen && UI.isSheetOpen()); } catch (e) { return false; }
  }
  function stopSpeech() {
    try { var T = global.CM && global.CM.tts; if (T && T.stop) T.stop(); } catch (e) { /* ignore */ }
  }

  // ------------------------------------------------------- time of use
  /* Foreground time since the last interstitial closed or since the app
     was opened: paused in the background and while an ad is on screen. */
  var clock = { active: 0, since: Date.now(), running: true };
  function tick() {
    if (!clock.running) return;
    var n = Date.now();
    if (n > clock.since) clock.active += n - clock.since;
    clock.since = n;
  }
  function pauseClock() { tick(); clock.running = false; }
  function resumeClock() { if (!clock.running) { clock.running = true; clock.since = Date.now(); } }
  function resetClock() { clock.active = 0; clock.since = Date.now(); }
  function activeMs() { tick(); return clock.active; }

  document.addEventListener('pause', function () {
    pauseClock();
    // the ad's own screen has covered the app: it is on screen, even if its
    // show event comes late (timers and events can be held in the background)
    if (inter.showing) inter.displayed = true;
  }, false);
  document.addEventListener('resume', function () {
    if (inter.showing) {
      // the app is back: the ad is closed even if its event got lost
      setTimeout(function () { if (inter.showing && inter.displayed) finish('resumed'); }, 2500);
      return;
    }
    resumeClock();
    if (state.mode === 'native' && state.started) {
      if (!inter.ready && !inter.loading && !inter.retryTimer) preload();
      if (state.bannerVisible && (!state.banner || !state.bannerLoaded)) Ads.showBanner();
    }
  }, false);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pauseClock(); if (inter.showing) inter.displayed = true; }
    else if (!inter.showing) resumeClock();
  });

  // ------------------------------------------------------ app dialogs
  /* The app's dialogs (#sheet, ui.js) are watched: no interstitial while
     one is open or just closed, and the native banner is hidden meanwhile
     (its place is kept, so nothing moves). */
  function watchSheet() {
    var el = document.getElementById('sheet');
    if (!el || el.__cmAds || !global.MutationObserver) return;
    el.__cmAds = true;
    screenState.sheetOpen = el.classList.contains('is-open');
    new global.MutationObserver(function () {
      var open = el.classList.contains('is-open');
      if (open === screenState.sheetOpen) return;
      screenState.sheetOpen = open;
      if (open) {
        cancelPending('dialog');
        bannerForDialog(true);
      } else {
        screenState.sheetClosedAt = Date.now();
        if (popups.open) { popups.open = false; popups.closedAt = screenState.sheetClosedAt; }
        bannerForDialog(false);
      }
    }).observe(el, { attributes: true, attributeFilter: ['class'] });
  }
  watchSheet();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchSheet);

  function dialogBusy() {
    if (screenState.sheetOpen || sheetOpenNow()) return 'dialog-open';
    // the windows of the coordinator (update, review, announcement): their
    // buttons must never seem to lead to an ad
    if (popups.closedAt && Date.now() - popups.closedAt < AFTER_POPUP_MS) return 'dialog-just-closed';
    if (Date.now() < screenState.nativeUntil) return 'native-dialog';
    if (state.consentRunning) return 'consent';
    return '';
  }

  function popupBlocked(afterAd) {
    if (inter.showing) return 'interstitial';
    if (inter.timer) return 'interstitial-pending';
    if (inter.endedAt && Date.now() - inter.endedAt < Math.max(AFTER_AD_MS, afterAd || 0)) return 'after-interstitial';
    if (screenState.sheetOpen || sheetOpenNow()) return 'dialog-open';
    if (Date.now() - screenState.sheetClosedAt < 1500) return 'dialog-just-closed';
    if (Date.now() < screenState.nativeUntil) return 'native-dialog';
    if (state.consentRunning) return 'consent';
    if (playing()) return 'question-on-screen';
    if (document.hidden) return 'hidden';
    if (Date.now() - startedAt < 2500) return 'starting';
    return '';
  }

  // ------------------------------------------------------------ banner
  /* How the banner is placed.
     - 'overlay': admob-plus draws the banner over the window, `offset`
       pixels above its bottom edge (its offset option), and the WebView is
       left where cordova-android put it. The local plugin
       cordova-plugin-system-insets measures that offset: the space under the
       WebView, i.e. the navigation bar. The page then keeps the banner's
       height free (body.has-banner, --banner-h), so nothing is covered.
     - 'legacy': without that plugin, admob-plus moves the WebView into a
       LinearLayout with the ad under it. cordova-android 15 (API level 36,
       required by Google Play) lays the WebView out in a FrameLayout with
       system-bar margins and casts its layout params back to
       FrameLayout.LayoutParams on every insets change: once moved, the
       WebView slides under the status bar and the next insets change
       (keyboard, rotation) throws. That mode is only used up to
       cordova-android 14, or when the config forces it (banner: true).
     - 'off': no banner (cordova-android 15 without the insets plugin, or
       banner: false). Interstitials are unaffected. */
  function platformMajor() {
    var v = global.cordova && global.cordova.platformVersion;
    return v ? parseInt(String(v).split('.')[0], 10) || 0 : 0;
  }
  function insetsPresent() {
    return !!(global.SystemInsets && typeof global.SystemInsets.get === 'function');
  }
  function bannerMode() {
    if (config.banner === false) return 'off';
    if (insetsPresent()) return 'overlay';
    if (config.banner === true) return 'legacy';
    var major = platformMajor();
    return major > 0 && major < 15 ? 'legacy' : 'off';
  }
  function bannerSupported() { return bannerMode() !== 'off'; }

  /* Space kept free under the page for the banner, in CSS pixels. */
  function reserveSlot(on, height) {
    var body = document.body;
    if (!body) return;
    body.classList.toggle('has-banner', !!on);
    if (on && height) body.style.setProperty('--banner-h', height + 'px');
    else body.style.removeProperty('--banner-h');
    var slot = document.getElementById('ad-banner');
    if (!slot) return;
    // desktop browser: grey preview of the slot; in the app: an opaque base
    // under the native banner, the colour of the tab bar (shell.css)
    slot.classList.toggle('on', !!on && state.mode !== 'native');
    slot.classList.toggle('native', !!on && state.mode === 'native');
  }

  /* The banner's height in CSS pixels, from its size in device pixels:
     admob-plus's "dp" divides by the physical dpi (xdpi / 160), which is not
     the WebView's pixel ratio on most phones. Rounded down to the layout
     unit (1/64 px), so that the tab bar never stops short of the banner. */
  function cssHeight(size) {
    if (!size) return 0;
    var dpr = global.devicePixelRatio || (state.insets && state.insets.density) || 1;
    var h = size.heightInPixels ? size.heightInPixels / dpr : (size.height || 0);
    return Math.floor(h * 64) / 64;
  }

  function measureInsets() {
    if (!insetsPresent()) return Promise.resolve(null);
    return Promise.resolve(global.SystemInsets.get()).then(function (ins) {
      state.insets = ins || null;
      return state.insets;
    }, function (err) {
      log('insets-failed', String(err && err.message || err));
      return null;
    });
  }

  function isBanner(evt) { return !!(state.banner && evt && evt.adId === state.banner.id); }

  /* admob-plus reports the banner's size just before it is drawn, and again
     when a refreshed ad has another height. */
  document.addEventListener('admob.banner.size', function (evt) {
    if (!isBanner(evt)) return;
    var h = cssHeight(evt.size);
    if (!h) return;
    state.bannerLoaded = true;
    state.bannerHeight = h;
    state.bannerRetry = 0;
    log('banner-size', { css: h, px: evt.size && evt.size.heightInPixels, dp: evt.size && evt.size.height });
    if (bannerMode() === 'overlay' && state.bannerVisible && !state.bannerMisplaced) reserveSlot(true, h);
  });
  document.addEventListener('admob.ad.loadfail', function (evt) {
    if (!isBanner(evt)) return;
    log('banner-loadfail', { code: evt.code, message: evt.message || null });
    // A banner that has shown an ad keeps it on a failed refresh and the SDK
    // tries again by itself; a banner that never loaded is retried here.
    if (!state.bannerLoaded) retryBanner();
  });

  function retryBanner() {
    if (state.bannerRetryTimer) return;
    var d = RETRY[Math.min(state.bannerRetry, RETRY.length - 1)];
    state.bannerRetry++;
    state.bannerRetryTimer = setTimeout(function () {
      state.bannerRetryTimer = 0;
      if (!state.banner || state.bannerLoaded || !state.bannerVisible) return;
      if (!state.online) return;              // the 'online' event tries again
      log('banner-retry', { attempt: state.bannerRetry });
      Promise.resolve(state.banner.load()).catch(function (e) { log('banner-retry-failed', String(e && e.message || e)); });
    }, d);
  }

  function bannerForDialog(open) {
    if (state.mode !== 'native' || !state.banner) return;
    if (open) {
      if (state.bannerForDialog || !state.bannerVisible || state.bannerMisplaced) return;
      state.bannerForDialog = true;
      try { Promise.resolve(state.banner.hide()).catch(function () {}); } catch (e) { /* ignore */ }
    } else if (state.bannerForDialog) {
      state.bannerForDialog = false;
      if (state.bannerVisible && !state.bannerMisplaced) Ads.showBanner();
    }
  }

  /* Rotation, split screen, keyboard: an overlay banner cannot move, so it
     is hidden while it would not sit on the WebView's edge. */
  var resizeTimer = 0;
  global.addEventListener('resize', function () {
    if (bannerMode() !== 'overlay' || state.mode !== 'native' || !state.bannerVisible) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!state.banner) { Ads.showBanner(); return; }   // first show was put off
      measureInsets().then(function (ins) {
        if (!ins || !state.bannerVisible) return;
        var off = ins.imeVisible || Math.abs((ins.below || 0) - state.bannerOffset) > 2;
        if (off && !state.bannerMisplaced) {
          state.bannerMisplaced = true;
          reserveSlot(false);
          try { state.banner.hide(); } catch (e) { /* ignore */ }
          log('banner-misplaced', { below: ins.below, offset: state.bannerOffset, keyboard: !!ins.imeVisible });
        } else if (!off && state.bannerMisplaced) {
          state.bannerMisplaced = false;
          Ads.showBanner();
        }
      });
    }, 250);
  });

  // ------------------------------------------------------ interstitial
  function isInter(evt) { return !!(inter.ad && evt && evt.adId === inter.ad.id); }
  function interReady() { return inter.ready && Date.now() - inter.loadedAt < EXPIRY_MS; }

  /* now: from the retry timer, the return of the network or the developer
     screen; otherwise a load waits for its retry time (no burst of
     requests while ads cannot be served). */
  function preload(now) {
    if (state.mode !== 'native' || !state.started || !config.enabled || !config.ids.interstitial) return Promise.resolve(false);
    if (inter.showing || inter.loading) return Promise.resolve(false);
    if (interReady()) return Promise.resolve(true);
    if (!state.online) { inter.ready = false; return Promise.resolve(false); }
    if (inter.retryTimer && now !== true) return Promise.resolve(false);
    clearTimeout(inter.retryTimer);
    inter.retryTimer = 0;
    try {
      if (!inter.ad) inter.ad = new global.admob.InterstitialAd({ adUnitId: config.ids.interstitial });
    } catch (e) {
      emit('failed', { stage: 'interstitial-create', error: String(e && e.message || e) });
      return Promise.resolve(false);
    }
    inter.loading = true;
    inter.ready = false;
    return Promise.resolve(inter.ad.load()).then(function () {
      inter.loading = false;
      inter.ready = true;
      inter.loadedAt = Date.now();
      inter.retry = 0;
      emit('loaded', { type: 'interstitial' });
      return true;
    }, function (err) {
      inter.loading = false;
      inter.ready = false;
      emit('failed', { stage: 'interstitial-load', error: String(err && err.message || err) });
      retryInterstitial();
      return false;
    });
  }

  function retryInterstitial() {
    if (inter.retryTimer) return;
    var d = RETRY[Math.min(inter.retry, RETRY.length - 1)];
    inter.retry++;
    inter.retryTimer = setTimeout(function () { inter.retryTimer = 0; preload(true); }, d);
  }

  function cancelPending(why) {
    if (!inter.timer) return;
    clearTimeout(inter.timer);
    inter.timer = 0;
    inter.pendingKind = '';
    log('interstitial-cancel', why || null);
  }

  /* A natural transition: evaluated after a short delay, the latest one
     wins, except that the end of a set is not replaced by the screen change
     that may follow it. */
  function opportunity(ctx) {
    if (inter.timer && inter.pendingKind === 'set-end' && ctx.kind !== 'set-end') return;
    cancelPending();
    inter.pendingKind = ctx.kind;
    inter.timer = setTimeout(function () {
      inter.timer = 0;
      inter.pendingKind = '';
      evaluate(ctx);
    }, ctx.kind === 'set-end' ? SET_END_DELAY : NAV_DELAY);
  }

  // reasons that only mean "not right now"
  var TRANSIENT = ['not-ready', 'dialog-open', 'dialog-just-closed', 'native-dialog', 'consent', 'offline'];

  function evaluate(ctx) {
    var owed = inter.owed && Date.now() - inter.owed.at < OWED_MS ? inter.owed : null;
    if (!owed) inter.owed = null;
    var c = ctx.kind === 'navigation' && owed ? { kind: 'owed', questions: owed.questions } : ctx;
    var d = Ads.interstitialDecision(c);
    if (d.show && state.mode !== 'native') d = { show: false, reason: 'mock' };   // never fake an impression
    if (d.show && !interReady()) {
      d = { show: false, reason: 'not-ready' };
      preload();
    }
    inter.last = { at: Date.now(), kind: c.kind, show: d.show, reason: d.reason, activeMs: activeMs() };
    if (!d.show) {
      if (c.kind === 'set-end' || c.kind === 'owed') {
        // kept for the next screen change only when it was "not right now"
        inter.owed = TRANSIENT.indexOf(d.reason) !== -1 ? (owed || { at: Date.now(), questions: c.questions || 0 }) : null;
      }
      emit('interstitial', { shown: false, reason: d.reason, kind: c.kind });
      return false;
    }
    showInterstitial(d.reason);
    return true;
  }

  function showInterstitial(reason) {
    inter.showing = true;
    inter.displayed = false;
    inter.ready = false;
    inter.owed = null;
    inter.shownAt = Date.now();
    pauseClock();
    stopSpeech();
    var c = caps();
    inter.prevLast = c.lastInterstitial || 0;
    c.lastInterstitial = inter.shownAt;   // final value written when it closes
    saveCaps(c);
    emit('interstitial', { shown: true, reason: reason });
    clearTimeout(inter.watchdog);
    inter.watchdog = setTimeout(function () {
      if (inter.showing && !inter.displayed) finish('no-show');
    }, 8000);
    try {
      Promise.resolve(inter.ad.show()).catch(function (err) {
        emit('failed', { stage: 'interstitial-show', error: String(err && err.message || err) });
        finish('error');
      });
    } catch (err) {
      emit('failed', { stage: 'interstitial-show', error: String(err && err.message || err) });
      finish('error');
    }
  }

  function finish(how) {
    if (!inter.showing) return;
    clearTimeout(inter.watchdog);
    var seen = inter.displayed || how === 'dismissed';
    inter.showing = false;
    inter.displayed = false;
    var now = Date.now();
    var c = caps();
    if (seen) {
      c.lastInterstitial = now;
      c.interstitialsShown = (c.interstitialsShown || 0) + 1;
      inter.endedAt = now;
      resetClock();
    } else {
      c.lastInterstitial = inter.prevLast;   // nothing was seen: no gap to keep
    }
    saveCaps(c);
    if (!document.hidden) resumeClock();
    emit('dismissed', { type: 'interstitial', how: how });
    setTimeout(function () { preload(); }, seen ? 1500 : 5000);
  }

  document.addEventListener('admob.ad.show', function (evt) {
    if (!isInter(evt) || !inter.showing) return;
    inter.displayed = true;
    log('interstitial-on-screen');
  });
  document.addEventListener('admob.ad.dismiss', function (evt) {
    if (isInter(evt)) finish('dismissed');
  });
  document.addEventListener('admob.ad.showfail', function (evt) {
    if (!isInter(evt)) return;
    emit('failed', { stage: 'interstitial-show', error: evt.message || evt.code || null });
    finish('showfail');
  });
  document.addEventListener('admob.ad.loadfail', function (evt) {
    if (isInter(evt)) log('interstitial-loadfail', { code: evt.code, message: evt.message || null });
  });

  // ------------------------------------------------------------- Ads API
  var Ads = {
    TEST_IDS: TEST_IDS,

    on: function (name, fn) {
      (state.listeners[name] = state.listeners[name] || []).push(fn);
      return function () {
        state.listeners[name] = (state.listeners[name] || []).filter(function (f) { return f !== fn; });
      };
    },

    configure: function (patch) {
      Object.keys(patch || {}).forEach(function (k) {
        if (k === 'ids') Object.keys(patch.ids || {}).forEach(function (i) { config.ids[i] = patch.ids[i]; });
        else config[k] = patch[k];
      });
      return Ads.status();
    },

    status: function () {
      return {
        mode: state.mode,
        enabled: config.enabled,
        testMode: config.testMode,
        banner: state.mode === 'native' && bannerSupported() && !!config.ids.banner,
        bannerMode: bannerMode(),
        bannerLoaded: state.bannerLoaded,
        bannerHeight: state.bannerHeight,
        bannerOffset: state.bannerOffset,
        bannerMisplaced: state.bannerMisplaced,
        insets: state.insets,
        units: Object.keys(config.ids).filter(function (k) { return !!config.ids[k]; }),
        started: state.started,
        consent: state.consent,
        canRequestAds: state.canRequestAds,
        privacyOptions: state.privacyOptions,
        bannerVisible: state.bannerVisible,
        interstitialReady: interReady(),
        interstitialShowing: inter.showing,
        rewardedReady: state.rewardedReady,
        online: state.online,
        rules: { setQuestions: config.setQuestions, minGapMs: config.minGapMs, maxGapMs: config.maxGapMs },
        usedMs: activeMs(),
        sinceLastMs: lastInterstitial() ? Date.now() - lastInterstitial() : null
      };
    },

    init: function (profileAds) {
      if (profileAds) {
        config.enabled = profileAds.enabled !== false;
        state.consent = profileAds.consent || 'unknown';
      }
      watchSheet();
      state.online = online();
      global.addEventListener('online', function () {
        state.online = true;
        emit('network', { online: true });
        if (state.mode === 'native' && state.started) {
          if (state.bannerVisible && !state.bannerLoaded) {
            clearTimeout(state.bannerRetryTimer);
            state.bannerRetryTimer = 0;
            state.bannerRetry = 0;
            if (state.banner) Promise.resolve(state.banner.load()).catch(function () {});
            else Ads.showBanner();
          }
          if (!interReady()) { inter.retry = 0; preload(true); }
        }
      });
      global.addEventListener('offline', function () { state.online = false; emit('network', { online: false }); });

      if (!pluginPresent()) {
        state.mode = 'mock';
        state.started = true;
        // A mock impression is not an impression: nothing is requested, nothing
        // is counted, and no revenue event is ever simulated.
        console.info('[ads] no native plugin — running in mock mode, no ads requested');
        emit('ready', Ads.status());
        return Promise.resolve(Ads.status());
      }

      state.mode = 'native';
      return Ads.requestConsent()
        .then(function () {
          // Google's rule: no ad request (not even starting the SDK) until
          // the consent tool says ads may be requested.
          if (state.canRequestAds === false) throw new Error('consent: ads may not be requested yet');
          return global.admob.start();
        })
        .then(function () {
          state.started = true;
          emit('ready', Ads.status());
          preload();
          if (state.bannerVisible) Ads.showBanner();
          return Ads.status();
        })
        .catch(function (err) {
          console.warn('[ads] start failed, falling back to mock:', err && err.message);
          state.mode = 'mock';
          state.started = true;
          emit('failed', { stage: 'start', error: String(err && err.message || err) });
          return Ads.status();
        });
    },

    /* Google's User Messaging Platform (cordova-plugin-consent 3.0.0-alpha.9):
       requestInfoUpdate, then loadAndShowIfRequired (the form only appears
       where the law requires it, e.g. for users in the EEA or the UK), then
       canRequestAds. privacyOptionsRequirementStatus says whether the
       settings must offer "Modifier mes choix" (showPrivacyOptionsForm).
       Without the plugin, consent cannot be collected and the app records it.
       (The plugin's getConsentStatus maps Android's codes wrongly — 1 means
       NOT_REQUIRED on Android — so it is not used.) */
    requestConsent: function (privacyOptions) {
      var C = global.consent;
      if (!C || typeof C.requestInfoUpdate !== 'function') {
        state.consent = state.consent === 'obtained' ? 'obtained' : 'unavailable';
        return Promise.resolve(state.consent);
      }
      function call(name) {
        return typeof C[name] === 'function' ? Promise.resolve(C[name]()) : Promise.resolve(null);
      }
      state.consentRunning = true;
      var flow = privacyOptions
        ? call('showPrivacyOptionsForm')
        : Promise.resolve(C.requestInfoUpdate()).then(function () { return call('loadAndShowIfRequired'); });
      return flow
        .catch(function (err) {
          // offline or form error: the answers of a previous session still count
          console.warn('[ads] consent flow:', err && err.message);
          log('consent-error', String(err && err.message || err));
        })
        .then(function () { return Promise.all([call('canRequestAds'), call('privacyOptionsRequirementStatus')]); })
        .then(function (r) {
          state.consentRunning = false;
          state.canRequestAds = r[0] !== false;
          state.privacyOptions = r[1] === 'Required';
          var s = !state.canRequestAds ? 'pending' : (state.privacyOptions ? 'obtained' : 'not-required');
          state.consent = s;
          Store.patchProfile({ ads: { consent: s } });
          emit('consent', { status: s, canRequestAds: state.canRequestAds, privacyOptions: state.privacyOptions });
          return s;
        })
        .catch(function (err) {
          state.consentRunning = false;
          console.warn('[ads] consent status unavailable:', err && err.message);
          state.consent = 'unavailable';
          return state.consent;
        });
    },

    /* "Modifier mes choix de confidentialité" in the settings. */
    showConsentForm: function () { return Ads.requestConsent(true); },

    /* Developer screen: forget the consent answers and ask again. */
    resetConsent: function () {
      if (!global.consent || typeof global.consent.reset !== 'function') return Promise.resolve('unavailable');
      return Promise.resolve(global.consent.reset()).then(function () { return Ads.requestConsent(); });
    },

    setEnabled: function (on) {
      config.enabled = !!on;
      if (!config.enabled) { Ads.hideBanner(); cancelPending('disabled'); }
      Store.patchProfile({ ads: { enabled: config.enabled } });
      return config.enabled;
    },

    // ------------------------------------------------------------- banner
    /* The banner is permanent: every screen of the app may carry it. */
    canShowBannerOn: function () { return config.enabled; },

    syncBanner: function () {
      if (config.enabled) Ads.showBanner();
      else Ads.hideBanner();
    },

    showBanner: function () {
      if (!config.enabled) return Promise.resolve(false);
      state.bannerVisible = true;

      if (state.mode !== 'native') {
        // Desktop browser: draw where the banner goes. Inside the app without
        // the plugin (or before it has started) no space is taken.
        reserveSlot(!global.cordova);
        emit('banner', { shown: false, reason: 'mock' });
        return Promise.resolve(false);
      }
      if (!state.started) return Promise.resolve(false);      // init() shows it once started
      if (!bannerSupported() || !config.ids.banner || !state.online) {
        emit('banner', { shown: false, reason: !state.online ? 'offline' : (config.ids.banner ? 'unsupported' : 'no-unit') });
        return Promise.resolve(false);
      }
      return (bannerMode() === 'overlay' ? measureInsets() : Promise.resolve(null)).then(function (ins) {
        if (!state.bannerVisible) return false;                 // hidden meanwhile
        // Keyboard open, or rotated / navigation changed since the banner was
        // placed: it would not sit on the WebView's edge, so it waits (the
        // resize listener shows it again).
        var away = ins && (ins.imeVisible || (state.bannerOffset !== null && Math.abs((ins.below || 0) - state.bannerOffset) > 2));
        if (away) {
          state.bannerMisplaced = true;
          reserveSlot(false);
          if (state.banner) { try { state.banner.hide(); } catch (e) { /* ignore */ } }
          emit('banner', { shown: false, reason: ins.imeVisible ? 'keyboard' : 'misplaced' });
          return false;
        }
        state.bannerMisplaced = false;
        if (!state.banner) {
          var opts = { adUnitId: config.ids.banner, position: 'bottom', size: { adaptive: 'anchored' } };
          if (ins) { opts.offset = Math.max(0, Math.round(ins.below || 0)); state.bannerOffset = opts.offset; }
          state.banner = new global.admob.BannerAd(opts);
        }
        if (state.bannerLoaded && bannerMode() === 'overlay') reserveSlot(true, state.bannerHeight);
        if (screenState.sheetOpen || sheetOpenNow()) {
          // a dialog is open: the banner comes back when it closes
          state.bannerForDialog = true;
          return false;
        }
        return Promise.resolve(state.banner.show())
          .then(function () {
            if (bannerMode() === 'overlay' && state.bannerLoaded && state.bannerVisible && !state.bannerMisplaced) reserveSlot(true, state.bannerHeight);
            if (screenState.sheetOpen || sheetOpenNow()) {
              // a dialog opened while the first ad was loading
              state.bannerForDialog = true;
              try { state.banner.hide(); } catch (e) { /* ignore */ }
            }
            emit('banner', { shown: true, mode: bannerMode() });
            return true;
          });
      }).catch(function (err) {
        emit('failed', { stage: 'banner', error: String(err && err.message || err) });
        if (!state.bannerLoaded) retryBanner();
        return false;
      });
    },

    hideBanner: function () {
      reserveSlot(false);
      if (state.bannerVisible) log('banner-hide');
      state.bannerVisible = false;
      if (state.mode === 'native' && state.banner) {
        try { state.banner.hide(); } catch (e) { /* ignore */ }
      }
      return Promise.resolve(true);
    },

    // ------------------------------------------------------- interstitial
    preloadInterstitial: function () { return preload(true); },

    /* The single decision point for interstitials. ctx.kind: 'set-end'
       (results of a finished set, ctx.questions = its size), 'navigation'
       (any other screen change) or 'owed'. Returns the reason an ad is
       withheld, which makes the policy auditable and testable. */
    interstitialDecision: function (ctx) {
      ctx = ctx || {};
      var no = function (r) { return { show: false, reason: r }; };
      if (!config.enabled) return no('ads-disabled');
      if (!config.ids.interstitial) return no('no-unit');
      if (playing()) return no('question-on-screen');
      if (inter.showing) return no('showing');
      var busy = dialogBusy();
      if (busy) return no(busy);
      if (Date.now() - lastInterstitial() < config.minGapMs) return no('min-gap');
      var timeUp = activeMs() >= config.maxGapMs;
      if (ctx.kind === 'set-end' || ctx.kind === 'owed') {
        if (!timeUp && (ctx.questions || 0) < config.setQuestions) return no('set-too-short');
      } else if (!timeUp) {
        return no('not-yet');
      }
      if (!state.online) return no('offline');
      return { show: true, reason: timeUp ? 'time' : 'set-end' };
    },

    /* Results of a finished set are on screen. Returns true when an
       interstitial is about to be shown for it (the caller then keeps the
       review card for another time). */
    setFinished: function (summary) {
      Ads.noteSessionCompleted();
      var ctx = { kind: 'set-end', questions: summary ? (summary.total || 0) : 0 };
      var d = Ads.interstitialDecision(ctx);
      opportunity(ctx);
      return d.show && state.mode === 'native' && interReady();
    },

    /* Any other screen change of the app (pages, practice screens). */
    screenChanged: function () { opportunity({ kind: 'navigation' }); },

    /* A question is on screen: nothing pending may show. */
    questionOnScreen: function () { cancelPending('question'); },

    // ----------------------------------------------------------- rewarded
    preloadRewarded: function () {
      if (state.mode !== 'native' || !state.started || !config.enabled || !state.online || !config.ids.rewarded) return Promise.resolve(false);
      try {
        if (!state.rewarded) {
          state.rewarded = new global.admob.RewardedAd({ adUnitId: config.ids.rewarded });
        }
        return Promise.resolve(state.rewarded.load())
          .then(function () { state.rewardedReady = true; emit('loaded', { type: 'rewarded' }); return true; })
          .catch(function (err) {
            state.rewardedReady = false;
            emit('failed', { stage: 'rewarded-load', error: String(err && err.message || err) });
            return false;
          });
      } catch (e) { return Promise.resolve(false); }
    },

    isRewardedAvailable: function () {
      return config.enabled && state.mode === 'native' && state.online && state.rewardedReady && !inter.showing;
    },

    /* Resolves { rewarded: true, via: 'ad' } only after the native reward
       event has fired and the ad has closed. When no ad can be served,
       resolves { rewarded: true, via: 'fallback' }: the user is never left at
       a dead end because an ad network was unavailable. */
    showRewarded: function () {
      if (!Ads.isRewardedAvailable()) {
        Ads.preloadRewarded();
        emit('reward', { granted: true, via: 'fallback' });
        return Promise.resolve({ rewarded: true, via: 'fallback' });
      }
      var ad = state.rewarded;
      return new Promise(function (resolve) {
        var settled = false;
        var earned = false;
        var offs = [];
        function listen(name, fn) {
          var h = function (evt) { if (evt && evt.adId === ad.id) fn(evt); };
          document.addEventListener(name, h);
          offs.push(function () { document.removeEventListener(name, h); });
        }
        function done(result) {
          if (settled) return;
          settled = true;
          offs.forEach(function (off) { off(); });
          state.rewardedReady = false;
          if (!document.hidden) resumeClock();
          setTimeout(Ads.preloadRewarded, 1500);
          emit('reward', { granted: result.rewarded, via: result.via });
          resolve(result);
        }
        // admob-plus: show() resolves as soon as the ad is asked to show;
        // the reward and the closing come as document events.
        listen('admob.ad.reward', function () { earned = true; });
        listen('admob.ad.dismiss', function () {
          setTimeout(function () { done(earned ? { rewarded: true, via: 'ad' } : { rewarded: false, via: 'dismissed' }); }, 60);
        });
        listen('admob.ad.showfail', function () { done({ rewarded: true, via: 'fallback' }); });
        pauseClock();
        stopSpeech();
        try {
          Promise.resolve(ad.show()).catch(function (err) {
            emit('failed', { stage: 'rewarded-show', error: String(err && err.message || err) });
            done({ rewarded: true, via: 'fallback' });
          });
        } catch (err) {
          done({ rewarded: true, via: 'fallback' });
        }
      });
    },

    // ------------------------------------------------------------- session
    noteSessionCompleted: function () {
      var c = caps();
      c.sessions = (c.sessions || 0) + 1;
      saveCaps(c);
      return c.sessions;
    },

    sessionsCompleted: function () { return caps().sessions || 0; },

    resetCaps: function () {
      saveCaps({ lastInterstitial: 0, sessions: 0, interstitialsShown: 0 });
      inter.owed = null;
      inter.endedAt = 0;
      resetClock();
    },

    /* The app came back to the foreground because an ad (or Google's
       review card) closed: not a return of the user, nothing to check. */
    resumedFromAd: function () {
      return inter.showing || (inter.endedAt > 0 && Date.now() - inter.endedAt < 5000) || Date.now() < screenState.nativeUntil;
    },

    // --------------------------------------------------- dialog coordinator
    popups: {
      /* Why a dialog may not open right now ('' when it may). */
      blocked: function () { return popupBlocked(); },

      /* Runs show() at the next calm moment, checked every second, at most
         opts.maxWait ms from now (default 2 min), at least opts.spacing ms
         after the previous window opened this way (default 30 s) and
         opts.afterAd ms after an interstitial closed (default and minimum
         10 s). show() returns false when it finally had nothing to show. */
      when: function (show, opts) {
        opts = opts || {};
        var deadline = Date.now() + (opts.maxWait || 2 * MIN);
        var spacing = opts.spacing == null ? 30000 : opts.spacing;
        popups.waiting++;
        function attempt() {
          if (Date.now() > deadline) { popups.waiting--; log('popup-gave-up', opts.name || null); return; }
          var why = popupBlocked(opts.afterAd) || (popups.last && Date.now() - popups.last < spacing ? 'spacing' : '');
          if (why) { setTimeout(attempt, 1000); return; }
          popups.waiting--;
          var shown = false;
          try { shown = show() !== false; } catch (e) { console.warn('[ads] dialog', e); }
          if (shown) {
            popups.last = Date.now();
            popups.open = screenState.sheetOpen || sheetOpenNow();
            log('popup', opts.name || null);
          }
        }
        setTimeout(attempt, 0);
      },

      /* A native screen over the app (Google's review card, the store…):
         no interstitial for `ms`, and the return to the app is not a
         "resume" that checks for updates or announcements. */
      native: function (what, ms) {
        screenState.nativeUntil = Math.max(screenState.nativeUntil, Date.now() + (ms || 30000));
        screenState.nativeWhat = what || '';
      },

      lastShown: function () { return popups.last; }
    },

    // --------------------------------------------------- developer screen
    debug: function () {
      return {
        status: Ads.status(),
        caps: caps(),
        platform: platformMajor(),
        interstitial: { ready: interReady(), loading: inter.loading, showing: inter.showing, owed: inter.owed, last: inter.last, endedAt: inter.endedAt, retry: inter.retry },
        popups: { last: popups.last, waiting: popups.waiting, blocked: popupBlocked() },
        log: state.log.slice()
      };
    },

    /* Full-screen formats on demand, outside the placement rules: test mode
       only (Google's demo units), so the developer never clicks real ads. */
    testInterstitial: function () {
      if (state.mode !== 'native') return Promise.resolve({ shown: false, reason: 'mock' });
      if (!config.testMode) return Promise.resolve({ shown: false, reason: 'production' });
      if (inter.showing) return Promise.resolve({ shown: false, reason: 'showing' });
      return (interReady() ? Promise.resolve(true) : preload(true)).then(function (ok) {
        if (!ok) return { shown: false, reason: 'not-loaded' };
        showInterstitial('test');
        return { shown: true, reason: 'test' };
      }).catch(function (err) { return { shown: false, reason: String(err && err.message || err) }; });
    },
    testRewarded: function () {
      if (state.mode !== 'native') return Promise.resolve({ rewarded: false, via: 'mock' });
      if (!config.testMode) return Promise.resolve({ rewarded: false, via: 'production' });
      return (state.rewardedReady ? Promise.resolve(true) : Ads.preloadRewarded()).then(function () { return Ads.showRewarded(); });
    }
  };

  global.CM = global.CM || {};
  global.CM.ads = Ads;
})(window);

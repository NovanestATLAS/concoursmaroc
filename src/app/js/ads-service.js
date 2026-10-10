/* Concours Maroc (Android app) — advertising bridge.
 *
 * Unchanged from the first version of the app except for the placement
 * vocabulary: the app is now made of content pages plus the trainer, so the
 * shell asks for "page" (guides, concours, tools…) or "quiz" (a question is
 * on screen, banners are hidden). Production identifiers go in
 * js/ads-config.js.
 *
 * A www/ package cannot display native ads on its own. This file is the whole
 * JavaScript side of the integration: it talks to admob-plus-cordova
 * (npm 2.0.0-alpha.19, verified 2026-08-11) when the plugin is installed, and
 * runs a no-operation mock everywhere else so that the app is fully usable in
 * a browser. See PRIVACY_AND_ADMOB.md for the install commands and the
 * production checklist.
 *
 * Placement rules enforced here, not left to the caller:
 *   - banners only on content pages, Home, Results, Statistics and Settings;
 *   - never during a question or a timed exam;
 *   - nothing is ever covered: the plugin shrinks the WebView above its
 *     banner (in a desktop browser the slot is only drawn as a preview);
 *   - with cordova-android 15+ banners are off unless forced (see
 *     bannerSupported below); interstitials and rewarded ads are unaffected;
 *   - the first study session of a device is always ad-free;
 *   - at most one interstitial per completed session, after results are shown,
 *     after at least 10 answered questions, and never within MIN_GAP of the
 *     previous one;
 *   - rewarded ads only ever unlock extras; the answer, the short correction
 *     and the detailed explanation stay free;
 *   - a reward is granted only when the native reward callback fires, or, if
 *     no ad could be served at all, through an honest non-ad fallback.
 */
(function (global) {
  'use strict';

  var Store = global.CM.store;

  /* Google's official demo ad units for Android.
     Source: https://developers.google.com/admob/android/test-ads
     These are the ONLY identifiers shipped. Production IDs are injected at
     build time (see PRIVACY_AND_ADMOB.md) and must never be committed here. */
  var TEST_IDS = {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/9214589741',      // anchored adaptive
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917'
  };

  var config = {
    enabled: true,
    testMode: true,
    ids: TEST_IDS,
    minQuestionsBeforeInterstitial: 10,
    minGapMs: 3 * 60 * 1000,
    freeFirstSession: true,
    banner: 'auto'
  };

  /* js/ads-config.js defines window.CM_ADS_CONFIG. While it only contains
     the defaults, Google's demo identifiers above stay in force, so no
     private ID ever needs to be committed and the app still runs. */
  (function applyBuildConfig() {
    var c = global.CM_ADS_CONFIG;
    if (!c || typeof c !== 'object') return;
    if (c.ids) Object.keys(c.ids).forEach(function (k) {
      if (c.ids[k]) TEST_IDS[k] = c.ids[k];
    });
    if (typeof c.testMode === 'boolean') config.testMode = c.testMode;
    if (typeof c.minQuestionsBeforeInterstitial === 'number') {
      config.minQuestionsBeforeInterstitial = c.minQuestionsBeforeInterstitial;
    }
    if (typeof c.minGapMs === 'number') config.minGapMs = c.minGapMs;
    if (typeof c.freeFirstSession === 'boolean') config.freeFirstSession = c.freeFirstSession;
    if (c.banner === true || c.banner === false || c.banner === 'auto') config.banner = c.banner;
  })();

  // 'page' = any content page of the app shell (guides, concours, tools…).
  var BANNER_SCREENS = ['home', 'results', 'stats', 'settings', 'page'];
  var CAP_KEY = 'ads.caps';

  var state = {
    mode: 'mock',          // 'native' | 'mock'
    started: false,
    bannerVisible: false,
    consent: 'unknown',    // 'unknown' | 'obtained' | 'not-required' | 'unavailable'
    online: true,
    interstitialReady: false,
    rewardedReady: false,
    interstitial: null,
    rewarded: null,
    banner: null,
    listeners: {}
  };

  function emit(name, detail) {
    (state.listeners[name] || []).forEach(function (fn) {
      try { fn(detail); } catch (e) { console.warn('[ads] listener error', e); }
    });
  }

  function caps() {
    return Store.read(CAP_KEY, { lastInterstitial: 0, sessions: 0, interstitialsShown: 0 });
  }
  function saveCaps(c) { Store.write(CAP_KEY, c); }

  function pluginPresent() {
    return !!(global.admob && typeof global.admob.start === 'function');
  }

  /* admob-plus-cordova 2.0.0-alpha.19 shows a banner by moving the WebView
     into a LinearLayout with the ad under it. cordova-android 15 (the first
     version that targets API level 36, which Google Play requires) lays the
     WebView out in a FrameLayout with system-bar margins and casts its layout
     params back to FrameLayout.LayoutParams on every insets change: once
     moved, the WebView slides under the status bar and the next insets change
     (keyboard, rotation) throws. 'auto' therefore keeps banners up to
     cordova-android 14 only; true forces them (test on a phone first). */
  function platformMajor() {
    var v = global.cordova && global.cordova.platformVersion;
    return v ? parseInt(String(v).split('.')[0], 10) || 0 : 0;
  }
  function bannerSupported() {
    if (config.banner === true || config.banner === false) return config.banner;
    var major = platformMajor();
    return major > 0 && major < 15;
  }

  function reserveSlot(on) {
    document.body.classList.toggle('has-banner', !!on);
    var slot = document.getElementById('ad-banner');
    if (slot) slot.classList.toggle('on', !!on);
  }

  function online() {
    if (global.navigator && typeof global.navigator.onLine === 'boolean') {
      return global.navigator.onLine;
    }
    return true;
  }

  // ------------------------------------------------------------- lifecycle
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
        banner: state.mode === 'native' && bannerSupported(),
        started: state.started,
        consent: state.consent,
        bannerVisible: state.bannerVisible,
        interstitialReady: state.interstitialReady,
        rewardedReady: state.rewardedReady,
        online: state.online
      };
    },

    init: function (profileAds) {
      if (profileAds) {
        config.enabled = profileAds.enabled !== false;
        state.consent = profileAds.consent || 'unknown';
      }
      state.online = online();
      global.addEventListener('online', function () { state.online = true; emit('network', { online: true }); });
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
        .then(function () { return global.admob.start(); })
        .then(function () {
          state.started = true;
          emit('ready', Ads.status());
          Ads.preloadInterstitial();
          Ads.preloadRewarded();
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

    /* Consent hook for Google's User Messaging Platform. With
       cordova-plugin-consent installed the real form is requested; otherwise
       the app records that consent could not be collected and, per policy,
       personalisation must stay off. */
    requestConsent: function (force) {
      if (!global.consent || typeof global.consent.requestInfoUpdate !== 'function') {
        state.consent = state.consent === 'obtained' ? 'obtained' : 'unavailable';
        return Promise.resolve(state.consent);
      }
      return Promise.resolve(global.consent.requestInfoUpdate())
        .then(function (info) {
          if (force || (info && info.isConsentFormAvailable &&
              info.status === global.consent.ConsentStatus.REQUIRED)) {
            return global.consent.loadAndShowFormIfRequired().then(function () { return 'obtained'; });
          }
          return info && info.status === global.consent.ConsentStatus.NOT_REQUIRED
            ? 'not-required' : 'obtained';
        })
        .then(function (s) {
          state.consent = s;
          Store.patchProfile({ ads: { consent: s } });
          emit('consent', { status: s });
          return s;
        })
        .catch(function (err) {
          console.warn('[ads] consent flow failed:', err && err.message);
          state.consent = 'unavailable';
          return state.consent;
        });
    },

    showConsentForm: function () { return Ads.requestConsent(true); },

    setEnabled: function (on) {
      config.enabled = !!on;
      if (!config.enabled) Ads.hideBanner();
      Store.patchProfile({ ads: { enabled: config.enabled } });
      return config.enabled;
    },

    // ------------------------------------------------------------- banner
    canShowBannerOn: function (screenId) {
      return config.enabled && BANNER_SCREENS.indexOf(screenId) !== -1;
    },

    syncBanner: function (screenId) {
      if (Ads.canShowBannerOn(screenId)) Ads.showBanner();
      else Ads.hideBanner();
    },

    showBanner: function () {
      if (!config.enabled) return Promise.resolve(false);
      state.bannerVisible = true;

      if (state.mode !== 'native') {
        // Desktop browser: draw where the banner goes. Inside the app without
        // the plugin there is nothing to show, so no space is taken.
        reserveSlot(!global.cordova);
        emit('banner', { shown: false, reason: 'mock' });
        return Promise.resolve(false);
      }
      if (!bannerSupported() || !state.online) {
        emit('banner', { shown: false, reason: state.online ? 'unsupported' : 'offline' });
        return Promise.resolve(false);
      }
      try {
        if (!state.banner) {
          state.banner = new global.admob.BannerAd({
            adUnitId: config.ids.banner,
            position: 'bottom'
          });
        }
        return Promise.resolve(state.banner.show())
          .then(function () { emit('banner', { shown: true }); return true; })
          .catch(function (err) {
            emit('failed', { stage: 'banner', error: String(err && err.message || err) });
            return false;
          });
      } catch (err) {
        emit('failed', { stage: 'banner', error: String(err && err.message || err) });
        return Promise.resolve(false);
      }
    },

    hideBanner: function () {
      reserveSlot(false);
      state.bannerVisible = false;
      if (state.mode === 'native' && state.banner) {
        try { state.banner.hide(); } catch (e) { /* ignore */ }
      }
      return Promise.resolve(true);
    },

    // ------------------------------------------------------- interstitial
    preloadInterstitial: function () {
      if (state.mode !== 'native' || !config.enabled || !state.online) return Promise.resolve(false);
      try {
        if (!state.interstitial) {
          state.interstitial = new global.admob.InterstitialAd({ adUnitId: config.ids.interstitial });
        }
        return Promise.resolve(state.interstitial.load())
          .then(function () { state.interstitialReady = true; emit('loaded', { type: 'interstitial' }); return true; })
          .catch(function (err) {
            state.interstitialReady = false;
            emit('failed', { stage: 'interstitial-load', error: String(err && err.message || err) });
            return false;
          });
      } catch (e) { return Promise.resolve(false); }
    },

    /* The single decision point for interstitials. Returns a reason string
       when an ad is withheld, which makes the policy auditable and testable. */
    interstitialDecision: function (ctx) {
      if (!config.enabled) return { show: false, reason: 'ads-disabled' };
      if (!ctx || ctx.questionsAnswered < config.minQuestionsBeforeInterstitial) {
        return { show: false, reason: 'session-too-short' };
      }
      if (!ctx.resultsVisible) return { show: false, reason: 'results-not-visible' };
      var c = caps();
      if (config.freeFirstSession && c.sessions <= 1) return { show: false, reason: 'first-session-free' };
      if (Date.now() - (c.lastInterstitial || 0) < config.minGapMs) {
        return { show: false, reason: 'frequency-cap' };
      }
      if (ctx.alreadyShownThisSession) return { show: false, reason: 'one-per-session' };
      if (!state.online) return { show: false, reason: 'offline' };
      return { show: true, reason: 'ok' };
    },

    maybeShowInterstitial: function (ctx) {
      var decision = Ads.interstitialDecision(ctx);
      if (!decision.show) {
        emit('interstitial', { shown: false, reason: decision.reason });
        return Promise.resolve({ shown: false, reason: decision.reason });
      }
      if (state.mode !== 'native') {
        // Never fake an impression in the browser.
        emit('interstitial', { shown: false, reason: 'mock' });
        return Promise.resolve({ shown: false, reason: 'mock' });
      }
      if (!state.interstitialReady) {
        Ads.preloadInterstitial();
        emit('interstitial', { shown: false, reason: 'not-ready' });
        return Promise.resolve({ shown: false, reason: 'not-ready' });
      }
      return Promise.resolve(state.interstitial.show())
        .then(function () {
          var c = caps();
          c.lastInterstitial = Date.now();
          c.interstitialsShown = (c.interstitialsShown || 0) + 1;
          saveCaps(c);
          state.interstitialReady = false;
          emit('interstitial', { shown: true });
          emit('dismissed', { type: 'interstitial' });
          Ads.preloadInterstitial();
          return { shown: true, reason: 'ok' };
        })
        .catch(function (err) {
          state.interstitialReady = false;
          emit('failed', { stage: 'interstitial-show', error: String(err && err.message || err) });
          return { shown: false, reason: 'error' };
        });
    },

    // ----------------------------------------------------------- rewarded
    preloadRewarded: function () {
      if (state.mode !== 'native' || !config.enabled || !state.online) return Promise.resolve(false);
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
      return config.enabled && state.mode === 'native' && state.online && state.rewardedReady;
    },

    /* Resolves { rewarded: true, via: 'ad' } only after the native reward
       callback has fired. When no ad can be served, resolves
       { rewarded: true, via: 'fallback' }: the user is never left at a dead
       end because an ad network was unavailable. */
    showRewarded: function () {
      if (!Ads.isRewardedAvailable()) {
        Ads.preloadRewarded();
        emit('reward', { granted: true, via: 'fallback' });
        return Promise.resolve({ rewarded: true, via: 'fallback' });
      }
      return new Promise(function (resolve) {
        var settled = false;
        var earned = false;
        var offReward = null;

        function finish(result) {
          if (settled) return;
          settled = true;
          if (offReward) offReward();
          state.rewardedReady = false;
          Ads.preloadRewarded();
          emit('reward', { granted: result.rewarded, via: result.via });
          resolve(result);
        }

        try {
          // admob-plus emits a reward event on the document; the reward is only
          // granted when this fires, never on dismissal alone.
          var handler = function () { earned = true; };
          document.addEventListener('admob.rewarded.reward', handler);
          offReward = function () { document.removeEventListener('admob.rewarded.reward', handler); };

          Promise.resolve(state.rewarded.show())
            .then(function () {
              // show() resolves when the ad closes.
              setTimeout(function () {
                finish(earned ? { rewarded: true, via: 'ad' } : { rewarded: false, via: 'dismissed' });
              }, 60);
            })
            .catch(function (err) {
              emit('failed', { stage: 'rewarded-show', error: String(err && err.message || err) });
              finish({ rewarded: true, via: 'fallback' });
            });
        } catch (err) {
          finish({ rewarded: true, via: 'fallback' });
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

    resetCaps: function () { saveCaps({ lastInterstitial: 0, sessions: 0, interstitialsShown: 0 }); }
  };

  global.CM = global.CM || {};
  global.CM.ads = Ads;
})(window);

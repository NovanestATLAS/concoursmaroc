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
 *   - nothing is ever covered: the banner sits on the bottom edge of the
 *     WebView, just above the navigation bar, and the page keeps a space of
 *     the banner's height free under its content (see bannerMode below; in a
 *     desktop browser the slot is only drawn as a preview);
 *   - the first study session of a device is always ad-free;
 *   - at most one interstitial per completed session, after results are shown,
 *     after at least 10 answered questions, and never within MIN_GAP of the
 *     previous one;
 *   - rewarded ads only ever unlock extras; the answer, the short correction
 *     and the detailed explanation stay free. No screen offers one yet, so
 *     none is requested (showRewarded loads on demand);
 *   - a reward is granted only when the native reward callback fires, or, if
 *     no ad could be served at all, through an honest non-ad fallback.
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

  var config = {
    enabled: true,
    testMode: true,
    ids: Object.assign({}, TEST_IDS),
    minQuestionsBeforeInterstitial: 10,
    minGapMs: 3 * 60 * 1000,
    freeFirstSession: true,
    banner: 'auto'
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
    canRequestAds: null,   // consent tool's answer (null: no consent tool)
    privacyOptions: false, // the settings must offer to change the choices
    interstitialReady: false,
    rewardedReady: false,
    interstitial: null,
    rewarded: null,
    banner: null,
    bannerOffset: null,    // px, overlay mode: offset the banner was created with
    bannerHeight: 0,       // CSS px, from admob-plus's banner size event
    bannerLoaded: false,
    bannerMisplaced: false,
    insets: null,
    log: [],
    listeners: {}
  };

  function emit(name, detail) {
    log(name, detail);
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

  /* How the banner is placed.
     - 'overlay': admob-plus draws the banner over the window, `offset` pixels
       above its bottom edge (its offset option), and the WebView is left
       where cordova-android put it. The local plugin
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
    body.classList.toggle('has-banner', !!on);
    if (on && height) body.style.setProperty('--banner-h', Math.ceil(height) + 'px');
    else body.style.removeProperty('--banner-h');
    var slot = document.getElementById('ad-banner');
    // the grey preview slot only in a desktop browser
    if (slot) slot.classList.toggle('on', !!on && state.mode !== 'native');
  }

  // Last ad events, for the developer screen (newest last).
  var LOG_MAX = 60;
  function log(type, detail) {
    state.log.push({ t: Date.now(), type: type, detail: detail || null });
    if (state.log.length > LOG_MAX) state.log.shift();
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

  /* admob-plus reports the banner's size (dp, i.e. CSS pixels) just before
     it is drawn, and again when a refreshed ad has another height. */
  document.addEventListener('admob.banner.size', function (evt) {
    if (!state.banner || evt.adId !== state.banner.id) return;
    var h = evt.size && evt.size.height;
    if (!h) return;
    state.bannerLoaded = true;
    state.bannerHeight = h;
    log('banner-size', { height: h, width: evt.size.width });
    if (bannerMode() === 'overlay' && state.bannerVisible && !state.bannerMisplaced) reserveSlot(true, h);
  });
  document.addEventListener('admob.ad.loadfail', function (evt) {
    if (!state.banner || evt.adId !== state.banner.id) return;
    log('banner-loadfail', evt.error || evt.message || null);
  });
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
        .then(function () {
          // Google's rule: no ad request (not even starting the SDK) until
          // the consent tool says ads may be requested.
          if (state.canRequestAds === false) throw new Error('consent: ads may not be requested yet');
          return global.admob.start();
        })
        .then(function () {
          state.started = true;
          emit('ready', Ads.status());
          Ads.preloadInterstitial();
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
          state.canRequestAds = r[0] !== false;
          state.privacyOptions = r[1] === 'Required';
          var s = !state.canRequestAds ? 'pending' : (state.privacyOptions ? 'obtained' : 'not-required');
          state.consent = s;
          Store.patchProfile({ ads: { consent: s } });
          emit('consent', { status: s, canRequestAds: state.canRequestAds, privacyOptions: state.privacyOptions });
          return s;
        })
        .catch(function (err) {
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
        return Promise.resolve(state.banner.show())
          .then(function () {
            if (bannerMode() === 'overlay' && state.bannerLoaded && state.bannerVisible) reserveSlot(true, state.bannerHeight);
            emit('banner', { shown: true, mode: bannerMode() });
            return true;
          });
      }).catch(function (err) {
        emit('failed', { stage: 'banner', error: String(err && err.message || err) });
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
    preloadInterstitial: function () {
      if (state.mode !== 'native' || !config.enabled || !state.online || !config.ids.interstitial) return Promise.resolve(false);
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
      if (state.mode !== 'native' || !config.enabled || !state.online || !config.ids.rewarded) return Promise.resolve(false);
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

    resetCaps: function () { saveCaps({ lastInterstitial: 0, sessions: 0, interstitialsShown: 0 }); },

    // --------------------------------------------------- developer screen
    debug: function () {
      return { status: Ads.status(), caps: caps(), platform: platformMajor(), log: state.log.slice() };
    },

    /* Full-screen formats on demand, outside the placement rules: test mode
       only (Google's demo units), so the developer never clicks real ads. */
    testInterstitial: function () {
      if (state.mode !== 'native') return Promise.resolve({ shown: false, reason: 'mock' });
      if (!config.testMode) return Promise.resolve({ shown: false, reason: 'production' });
      return (state.interstitialReady ? Promise.resolve(true) : Ads.preloadInterstitial()).then(function (ok) {
        if (!ok) return { shown: false, reason: 'not-loaded' };
        return Promise.resolve(state.interstitial.show()).then(function () {
          state.interstitialReady = false;
          emit('interstitial', { shown: true, test: true });
          Ads.preloadInterstitial();
          return { shown: true, reason: 'test' };
        });
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

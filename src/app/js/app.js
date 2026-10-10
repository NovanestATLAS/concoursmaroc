/* Concours Maroc (Android app) — bootstrap.
 *
 * Start order: router and first page (needs nothing native) -> optional
 * native services (speech, ads), each bounded in time, so a plugin that never
 * answers costs a feature, never a blank screen. Same lifecycle as the first
 * version: deviceready, a browser path, and a watchdog.
 */
(function (global) {
  'use strict';

  var Shell = global.CM.shell;
  var Store = global.CM.store;
  var TTS = global.CM.tts;
  var Ads = global.CM.ads;
  var Play = global.CM.play;
  var booted = false;

  function tr(fr, ar) { return Shell.lang() === 'ar' ? ar : fr; }
  function toast(msg) { if (global.cmToast) global.cmToast(msg); }

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error((label || 'operation') + ' : aucune réponse après ' + ms + ' ms'));
      }, ms);
      Promise.resolve(promise).then(function (v) {
        if (done) return;
        done = true; clearTimeout(timer); resolve(v);
      }, function (e) {
        if (done) return;
        done = true; clearTimeout(timer); reject(e);
      });
    });
  }

  function fail(err) {
    var host = document.getElementById('view');
    if (!host) return;
    host.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'container app-boot';
    var p = document.createElement('p');
    p.textContent = 'Erreur de chargement / خطأ في التحميل';
    var d = document.createElement('p');
    d.className = 'err';
    d.textContent = String(err && err.message ? err.message : err);
    var b = document.createElement('button');
    b.className = 'btn';
    b.type = 'button';
    b.textContent = 'Réessayer / إعادة المحاولة';
    b.onclick = function () { global.location.reload(); };
    box.appendChild(p); box.appendChild(d); box.appendChild(b);
    host.appendChild(box);
  }

  // ------------------------------------------------------------ status bar
  function syncStatusBar() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var color = dark ? '#0f1730' : '#ffffff';   // background of the header, per theme
    try {
      if (global.StatusBar && typeof global.StatusBar.backgroundColorByHexString === 'function') {
        // cordova-plugin-statusbar, when installed: it also needs the icon style
        global.StatusBar.backgroundColorByHexString(color);
        if (dark) global.StatusBar.styleLightContent(); else global.StatusBar.styleDefault();
      } else if (global.statusbar && typeof global.statusbar.setBackgroundColor === 'function') {
        // built into cordova-android 15+: takes a CSS colour and picks the
        // icon contrast itself
        global.statusbar.setBackgroundColor(color);
      }
    } catch (e) { /* cosmetic only */ }
  }
  document.addEventListener('cm:theme', syncStatusBar);

  /* Edge-to-edge (WebView drawn under the status bar) only when the page is
     as tall as the screen; otherwise the safe areas are ignored (shell.css). */
  function detectEdge() {
    var gap = (global.screen && global.screen.height ? global.screen.height : 0) - global.innerHeight;
    document.documentElement.toggleAttribute('data-edge', gap < 8);
  }
  detectEdge();

  // ------------------------------------------------------------ advertising
  var onPlay = false;
  var pageBanner = true;
  var handled = {};

  function syncBanner() {
    if (!Ads) return;
    Ads.syncBanner(onPlay || !pageBanner ? 'quiz' : 'page');
  }

  document.addEventListener('cm:page', function (e) {
    var d = e.detail || {};
    pageBanner = d.banner !== false;
    if (!d.practice) onPlay = false;
    syncBanner();
  });

  /* Trainer screens: no banner while a question is on screen; after a
     finished session, at most one interstitial, once the results are shown
     (all other conditions are decided by ads-service). */
  document.addEventListener('cm:route', function (e) {
    var d = e.detail || {};
    onPlay = d.name === 'quiz' || d.name === 'memoire';
    syncBanner();
    if (d.name === 'results' && d.previous === 'quiz') {
      var sum = Store.read('lastSummary', null);
      if (!sum || handled[sum.sessionId]) return;
      handled[sum.sessionId] = true;
      Ads.noteSessionCompleted();
      // Google Play's review card replaces the interstitial that time
      if (Play && Play.sessionFinished(sum)) return;
      setTimeout(function () {
        Ads.maybeShowInterstitial({
          questionsAnswered: (sum.total || 0) - (sum.skipped || 0),
          resultsVisible: true,
          alreadyShownThisSession: false
        });
      }, 1200);
    }
  });

  // ------------------------------------------------------------ back button
  var lastBack = 0;
  function closeOverlays() {
    var UI = global.CM.ui;
    if (UI && UI.isSheetOpen && UI.isSheetOpen()) { UI.closeSheet(); return true; }
    var nav = document.getElementById('site-nav');
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
      var menu = document.getElementById('menu-btn');
      if (menu) menu.setAttribute('aria-expanded', 'false');
      return true;
    }
    var panel = document.getElementById('search-panel');
    if (panel && panel.classList.contains('open')) { panel.classList.remove('open'); return true; }
    return false;
  }

  function back(allowExit) {
    if (closeOverlays()) return;
    if (TTS && TTS.isSpeaking && TTS.isSpeaking()) TTS.stop();
    if (Shell.back()) return;
    if (!allowExit) return;
    if (Date.now() - lastBack < 2000) {
      if (navigator.app && navigator.app.exitApp) navigator.app.exitApp();
      return;
    }
    lastBack = Date.now();
    toast(tr('Appuyez encore sur Retour pour quitter', 'اضغط مرة أخرى على زر الرجوع للخروج'));
  }

  document.addEventListener('backbutton', function (e) {
    if (e && e.preventDefault) e.preventDefault();
    back(true);
  }, false);

  var backBtn = document.getElementById('app-back');
  if (backBtn) backBtn.addEventListener('click', function () { back(false); });

  // Escape mirrors the hardware button in a desktop preview.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !(global.CM.ui && global.CM.ui.isSheetOpen && global.CM.ui.isSheetOpen())) closeOverlays();
  });

  // ------------------------------------------------------------ lifecycle
  document.addEventListener('resume', function () {
    if (Play) Play.checkUpdate();
  }, false);

  document.addEventListener('pause', function () {
    if (TTS) TTS.stop();
    var Q = global.CM.quiz;
    try { if (Q && Q.current() && !Q.current().finished) Q.save(); } catch (e) { /* ignore */ }
  }, false);

  function initNativeServices() {
    syncStatusBar();
    withTimeout(TTS.init(Store.getProfile().tts), 6000, 'tts')
      .then(function (s) { if (s && s.available) console.info('[app] tts prête (' + s.engine + ', ' + s.voiceCount + ' voix)'); })
      .catch(function (e) { console.warn('[app] tts indisponible :', e.message); });
    if (Play) setTimeout(function () { Play.checkUpdate(); }, 4000);
    withTimeout(Ads.init(Store.getProfile().ads), 10000, 'ads')
      .then(syncBanner)
      .catch(function (e) { console.warn('[app] publicité indisponible :', e.message); });
  }

  function boot(trigger) {
    if (booted) return;
    booted = true;
    console.info('[app] démarrage (' + trigger + ')');
    Shell.start().then(function () {
      global.CM.appStarted = true;
      initNativeServices();
    }).catch(function (err) {
      console.error('[app] démarrage impossible', err);
      fail(err);
    });
  }

  document.addEventListener('deviceready', function () { boot('deviceready'); }, false);
  function bootIfNoCordova() { setTimeout(function () { if (!global.cordova) boot('navigateur'); }, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootIfNoCordova);
  else bootIfNoCordova();
  // cordova.js present but deviceready never fired (a plugin failed to start):
  // start anyway, native services are optional.
  setTimeout(function () { if (!booted) boot('watchdog'); }, 5000);

  // ------------------------------------------------------------ settings page
  Shell.onInit('settings', function (root) {
    var theme = root.querySelector('#set-theme');
    if (theme) {
      var cur = 'auto';
      try { cur = localStorage.getItem('cm.theme') || 'auto'; } catch (e) { /* ignore */ }
      theme.value = cur;
      theme.addEventListener('change', function () {
        var v = theme.value;
        try { localStorage.setItem('cm.theme', v); } catch (e) { /* ignore */ }
        var eff = v === 'auto' ? (global.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : v;
        document.documentElement.setAttribute('data-theme', eff);
        syncStatusBar();
      });
    }

    var status = root.querySelector('#set-tts-status');
    function fillVoices() {
      var st = TTS.status ? TTS.status() : { available: TTS.isAvailable() };
      if (status) {
        status.textContent = !st.available
          ? tr('Aucun moteur de synthèse vocale détecté. Installez « Services de synthèse vocale Google » depuis le Play Store.', 'لم يتم العثور على محرك للقراءة الصوتية. ثبّت «خدمات Google للنطق» من متجر Play.')
          : tr('Moteur : ', 'المحرك: ') + (st.engine === 'native' ? tr('Android (hors ligne)', 'أندرويد (بدون إنترنت)') : tr('navigateur', 'المتصفح')) + ' · ' + (st.voiceCount || 0) + tr(' voix', ' صوتًا');
      }
      [['fr', '#set-voice-fr', 'voiceFr'], ['ar', '#set-voice-ar', 'voiceAr']].forEach(function (cfg) {
        var sel = root.querySelector(cfg[1]);
        if (!sel) return;
        while (sel.firstChild) sel.removeChild(sel.firstChild);
        var auto = document.createElement('option');
        auto.value = '';
        auto.textContent = tr('Automatique', 'تلقائي');
        sel.appendChild(auto);
        (TTS.voicesFor(cfg[0]) || []).forEach(function (v) {
          var o = document.createElement('option');
          o.value = v.id;
          o.textContent = v.name + (v.lang ? ' (' + v.lang + ')' : '');
          sel.appendChild(o);
        });
        sel.value = (Store.getProfile().tts || {})[cfg[2]] || '';
        sel.onchange = function () {
          var patch = { tts: {} };
          patch.tts[cfg[2]] = sel.value || null;
          Store.patchProfile(patch);
          TTS.setPrefs(Store.getProfile().tts);
        };
      });
    }
    fillVoices();
    if (TTS.init && TTS.status && !TTS.status().ready) {
      TTS.init(Store.getProfile().tts).then(fillVoices, fillVoices);
    }
    Array.prototype.forEach.call(root.querySelectorAll('[data-tts-test]'), function (b) {
      b.addEventListener('click', function () {
        var lang = b.getAttribute('data-tts-test');
        if (TTS.preview) TTS.preview(lang); else TTS.speak(lang === 'ar' ? 'مرحبًا' : 'Bonjour', lang);
      });
    });
    var openTts = root.querySelector('#set-tts-open');
    if (openTts) {
      openTts.hidden = !(TTS.canOpenSettings && TTS.canOpenSettings());
      openTts.addEventListener('click', function () { TTS.openSettings(); });
    }

    var consent = root.querySelector('#set-consent');
    var adsInfo = root.querySelector('#set-ads-status');
    function adsText() {
      var s = Ads.status();
      if (!adsInfo) return;
      adsInfo.textContent = s.mode === 'native'
        ? tr('Publicités Google AdMob actives', 'إعلانات Google AdMob مفعلة') + (s.testMode ? tr(' (mode test)', ' (وضع الاختبار)') : '')
        : tr('Aucune publicité dans cette version', 'لا توجد إعلانات في هذه النسخة');
    }
    adsText();
    if (consent) {
      consent.hidden = !(global.consent && typeof global.consent.requestInfoUpdate === 'function');
      consent.addEventListener('click', function () {
        Ads.showConsentForm().then(function () { adsText(); toast(tr('Choix enregistrés', 'تم حفظ اختياراتك')); });
      });
    }

    var rate = root.querySelector('#set-rate');
    if (rate && Play) {
      rate.hidden = !(global.LaunchReview || global.PlayUpdate);
      rate.addEventListener('click', function () { Play.openStorePage(); });
    }
    var upd = root.querySelector('#set-update');
    if (upd && Play) {
      upd.hidden = !Play.updateAvailable();
      upd.addEventListener('click', function () {
        Play.checkUpdate(true).then(function (info) {
          if (!info) toast(tr('Vérification impossible pour le moment', 'تعذر التحقق حاليًا'));
          else if (info.availability !== 'available' && info.availability !== 'in_progress') toast(tr('Vous avez la dernière version', 'لديك أحدث نسخة'));
        });
      });
    }

    var version = root.querySelector('#set-version');
    if (version) {
      global.CM.load.json('data/manifest.json').then(function (m) {
        version.textContent = (m.contentVersion || '') + ' · ' + (m.totalQuestions || 0) + tr(' questions', ' سؤالًا');
      }).catch(function () { /* ignore */ });
    }
  });

  global.CM.boot = { back: back, syncBanner: syncBanner };
})(window);

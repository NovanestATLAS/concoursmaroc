/* Concours Maroc (Android app) — text-to-speech.
 *
 * Same engine as the first version of the app, now exposing the API used by
 * the new practice screens (isAvailable, hasVoice, voicesFor, setPrefs,
 * speak, speakQuestion, stop). Reading aloud is triggered by an explicit tap,
 * so it is no longer gated by a global "enabled" switch, and English
 * questions are read with an English voice.
 *
 * Engine selection (verified 2026-08-11, see SOURCES.md):
 *   Preferred : cordova-plugin-tts-advanced (npm 0.5.3). It is the only
 *               currently published Cordova TTS plugin that exposes
 *               getVoices(), per-call locale/identifier selection, rate and
 *               pitch, and a Promise API. It is low-activity upstream, which
 *               is exactly why every call here goes through this abstraction:
 *               replacing it later means editing this file only.
 *   Fallback  : window.speechSynthesis, used for browser preview only. It is
 *               guarded because many Android WebViews expose the object but
 *               never fire the voice list or the utterance events.
 *
 * Only methods documented by the plugin are called: speak(), stop(),
 * getVoices(), checkLanguage(), openInstallTts(). Nothing is invented.
 */
(function (global) {
  'use strict';

  var U = global.CM.utils;

  var ENGINE = { NONE: 'none', NATIVE: 'native', BROWSER: 'browser' };

  var state = {
    engine: ENGINE.NONE,
    ready: false,
    voices: [],
    speaking: false,
    token: 0,
    prefs: { enabled: false, voiceFr: null, voiceAr: null, rate: 1, pitch: 1, readChoices: false }
  };

  var LOCALES = {
    fr: ['fr-FR', 'fr-MA', 'fr-CA', 'fr'],
    ar: ['ar-MA', 'ar-SA', 'ar-EG', 'ar'],
    en: ['en-US', 'en-GB', 'en']
  };

  // ------------------------------------------------------------- detection
  function hasNative() {
    return !!(global.TTS && typeof global.TTS.speak === 'function');
  }

  function hasBrowser() {
    return !!(global.speechSynthesis && typeof global.SpeechSynthesisUtterance === 'function');
  }

  function loadNativeVoices() {
    if (!global.TTS || typeof global.TTS.getVoices !== 'function') return Promise.resolve([]);
    try {
      // Some TTS engines never invoke the callback when no voice data is
      // installed. Without this bound the promise would hang for good.
      var voices = Promise.resolve(global.TTS.getVoices()).then(function (list) {
        return (list || []).map(function (v) {
          return {
            id: v.identifier || v.name,
            name: v.name || v.identifier,
            lang: v.language || v.locale || '',
            // The plugin does not expose an offline/quality flag; anything it
            // returns has been enumerated from the installed engines, so it is
            // usable without a network connection.
            native: true
          };
        });
      }).catch(function () { return []; });

      return new Promise(function (resolve) {
        var settled = false;
        var timer = setTimeout(function () {
          if (settled) return;
          settled = true;
          console.warn('[tts] getVoices sans reponse — liste vide');
          resolve([]);
        }, 4000);
        voices.then(function (v) {
          if (settled) return;
          settled = true; clearTimeout(timer); resolve(v);
        });
      });
    } catch (e) { return Promise.resolve([]); }
  }

  function loadBrowserVoices() {
    if (!hasBrowser()) return Promise.resolve([]);
    return new Promise(function (resolve) {
      var settled = false;
      function collect() {
        if (settled) return;
        var list = global.speechSynthesis.getVoices() || [];
        if (!list.length) return;
        settled = true;
        resolve(list.map(function (v) {
          return {
            id: v.voiceURI || v.name,
            name: v.name,
            lang: v.lang || '',
            localService: !!v.localService,
            native: false,
            _ref: v
          };
        }));
      }
      collect();
      if (!settled && 'onvoiceschanged' in global.speechSynthesis) {
        global.speechSynthesis.onvoiceschanged = collect;
      }
      // Some engines never populate the list; do not hang the settings screen.
      setTimeout(function () { if (!settled) { settled = true; resolve([]); } }, 1200);
    });
  }

  // ------------------------------------------------------------- voice choice
  function voicesFor(lang) {
    var wanted = LOCALES[lang] || [lang];
    return state.voices.filter(function (v) {
      var tag = String(v.lang || '').toLowerCase().replace('_', '-');
      return wanted.some(function (w) { return tag.indexOf(w.toLowerCase()) === 0; })
        || tag.split('-')[0] === lang;
    });
  }

  /* Picks the best installed voice: exact preferred locale first, then the
     language family; among equals, prefer a device-local (offline) voice.
     No voice name is ever hardcoded — a name that exists on one device may be
     absent on the next, and asking for it would silently break speech. */
  function bestVoice(lang) {
    var candidates = voicesFor(lang);
    if (!candidates.length) return null;
    var order = LOCALES[lang] || [lang];
    for (var i = 0; i < order.length; i++) {
      var want = order[i].toLowerCase();
      var matches = candidates.filter(function (v) {
        return String(v.lang || '').toLowerCase().replace('_', '-').indexOf(want) === 0;
      });
      if (matches.length) {
        var local = matches.filter(function (v) { return v.native || v.localService; });
        return (local[0] || matches[0]);
      }
    }
    return candidates[0];
  }

  function chosenVoice(lang) {
    var prefId = lang === 'ar' ? state.prefs.voiceAr : state.prefs.voiceFr;
    if (prefId) {
      var found = state.voices.filter(function (v) { return v.id === prefId; })[0];
      if (found) return found;
      // Saved voice was uninstalled since: fall through to automatic choice.
    }
    return bestVoice(lang);
  }

  // ------------------------------------------------------------- normalising
  var ABBR_FR = [
    [/\bM\.\s/g, 'Monsieur '], [/\bMme\b/g, 'Madame '], [/\bDr\b/g, 'Docteur '],
    [/\bart\.\s?/gi, 'article '], [/\bn°\s?/gi, 'numéro '], [/\bp\.\s?/g, 'page '],
    [/\bDH\b/g, 'dirhams'], [/\bkm\/h\b/g, 'kilomètres par heure'],
    [/\bkm\b/g, 'kilomètres'], [/\bcm²/g, 'centimètres carrés'],
    [/\bcm³/g, 'centimètres cubes'], [/\bm²/g, 'mètres carrés'], [/\bm³/g, 'mètres cubes'],
    [/\bkg\b/g, 'kilogrammes'], [/\b°C\b/g, 'degrés Celsius'], [/%/g, ' pour cent ']
  ];
  /* No \b here: JavaScript word boundaries are defined over [A-Za-z0-9_], so
     they never match at the edge of an Arabic word and the rule would be dead.
     The order matters — the compound unit must be replaced before its parts. */
  var ABBR_AR = [
    [/كلم\/س/g, 'كيلومتر في الساعة'],
    [/سم²/g, 'سنتيمتر مربع'], [/سم³/g, 'سنتيمتر مكعب'],
    [/كلم/g, 'كيلومتر'],
    [/م²/g, 'متر مربع'], [/م³/g, 'متر مكعب'],
    [/°م/g, 'درجة مئوية'], [/%/g, ' في المائة ']
  ];

  function normalise(text, lang) {
    var s = String(text || '');
    // Guillemets and typographic marks are read aloud literally by some engines.
    s = s.replace(/[«»“”„]/g, ' ').replace(/[…]/g, '.').replace(/[–—]/g, ', ');
    // Thin/non-breaking spaces inside numbers ("36 828") break number reading.
    s = s.replace(/(\d)[\u00A0\u202F\u2009](\d)/g, '$1$2');
    var rules = lang === 'ar' ? ABBR_AR : lang === 'en' ? [] : ABBR_FR;
    rules.forEach(function (r) { s = s.replace(r[0], r[1]); });
    if (lang === 'fr') {
      // French decimal comma: "3,5" must not be read as two numbers.
      s = s.replace(/(\d),(\d)/g, '$1 virgule $2');
    }
    s = s.replace(/\s{2,}/g, ' ').trim();
    // A trailing period gives the engine a clean prosodic close.
    if (s && !/[.!?؟]$/.test(s)) s += '.';
    return s;
  }

  // ------------------------------------------------------------- speaking
  function speakNative(text, lang, voice) {
    var opts = { text: text, rate: state.prefs.rate, pitch: state.prefs.pitch, cancel: true };
    if (voice && voice.id) opts.identifier = voice.id;
    var locale = (voice && voice.lang) || (LOCALES[lang] || [lang])[0];
    if (locale) opts.locale = locale;
    return Promise.resolve(global.TTS.speak(opts));
  }

  function speakBrowser(text, lang, voice) {
    return new Promise(function (resolve, reject) {
      try { global.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      var utt = new global.SpeechSynthesisUtterance(text);
      utt.rate = state.prefs.rate;
      utt.pitch = state.prefs.pitch;
      utt.lang = (voice && voice.lang) || (LOCALES[lang] || [lang])[0];
      if (voice && voice._ref) utt.voice = voice._ref;
      var settled = false;
      utt.onend = function () { if (!settled) { settled = true; resolve(); } };
      utt.onerror = function (e) {
        if (settled) return;
        settled = true;
        // 'interrupted'/'canceled' are our own stop(), not a failure.
        if (e && (e.error === 'interrupted' || e.error === 'canceled')) resolve();
        else reject(new Error((e && e.error) || 'speech error'));
      };
      global.speechSynthesis.speak(utt);
    });
  }

  // ------------------------------------------------------------- public API
  var TTSService = {
    ENGINE: ENGINE,

    init: function (prefs) {
      if (prefs) TTSService.setPrefs(prefs);
      if (hasNative()) state.engine = ENGINE.NATIVE;
      else if (hasBrowser()) state.engine = ENGINE.BROWSER;
      else state.engine = ENGINE.NONE;

      var loader = state.engine === ENGINE.NATIVE ? loadNativeVoices()
        : state.engine === ENGINE.BROWSER ? loadBrowserVoices()
          : Promise.resolve([]);

      return loader.then(function (voices) {
        state.voices = voices;
        state.ready = true;
        return TTSService.status();
      }).catch(function () {
        state.voices = [];
        state.ready = true;
        return TTSService.status();
      });
    },

    status: function () {
      return {
        engine: state.engine,
        available: state.engine !== ENGINE.NONE,
        preview: state.engine === ENGINE.BROWSER,
        ready: state.ready,
        voiceCount: state.voices.length,
        hasFrenchVoice: voicesFor('fr').length > 0,
        hasArabicVoice: voicesFor('ar').length > 0
      };
    },

    isAvailable: function () { return state.engine !== ENGINE.NONE; },
    isSpeaking: function () { return state.speaking; },
    voicesFor: voicesFor,
    hasVoiceFor: function (lang) { return voicesFor(lang).length > 0; },
    /* The native engine reads every installed language; the button is shown
       as soon as an engine exists, even before the voice list is known. */
    hasVoice: function (lang) {
      if (state.engine === ENGINE.NATIVE) return !state.voices.length || voicesFor(lang).length > 0;
      return voicesFor(lang).length > 0;
    },

    setPrefs: function (prefs) {
      Object.keys(prefs || {}).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(state.prefs, k)) state.prefs[k] = prefs[k];
      });
      state.prefs.rate = Math.min(2, Math.max(0.5, Number(state.prefs.rate) || 1));
      state.prefs.pitch = Math.min(2, Math.max(0.5, Number(state.prefs.pitch) || 1));
      return state.prefs;
    },

    getPrefs: function () { return JSON.parse(JSON.stringify(state.prefs)); },

    /* Speaks a question, optionally followed by its four options.
       Returns a promise that resolves when speech ends, is stopped, or the
       engine is unavailable — it never rejects for an absent engine, so the
       caller does not need a try/catch around every read-aloud button. */
    speakQuestion: function (body, lang) {
      var M = global.CM && global.CM.math;
      var say = function (s) { return M ? M.speech(s) : s; };   // formulas in words
      var parts = [normalise(say(body.ttsText || body.text), lang)];
      if (state.prefs.readChoices && body.choices) {
        var letters = lang === 'ar' ? ['أ', 'ب', 'ج', 'د', 'هـ'] : ['A', 'B', 'C', 'D', 'E'];
        body.choices.forEach(function (c, i) {
          parts.push(letters[i] + '. ' + normalise(say(c), lang));
        });
      }
      return TTSService.speak(parts.join(' '), lang);
    },

    speak: function (text, lang) {
      if (state.engine === ENGINE.NONE) return Promise.resolve(false);
      var clean = normalise(text, lang);
      if (!clean) return Promise.resolve(false);

      // Any new read cancels the previous one; the token guards against a
      // late resolve from the cancelled utterance flipping `speaking` back.
      var token = ++state.token;
      TTSService.stop();
      state.speaking = true;

      var voice = chosenVoice(lang);
      var run = state.engine === ENGINE.NATIVE
        ? speakNative(clean, lang, voice)
        : speakBrowser(clean, lang, voice);

      return run.then(function () {
        if (state.token === token) state.speaking = false;
        return true;
      }).catch(function (err) {
        if (state.token === token) state.speaking = false;
        console.warn('[tts] speak failed:', err && err.message ? err.message : err);
        return false;
      });
    },

    preview: function (lang) {
      var sample = lang === 'ar'
        ? 'هذا مثال لقراءة السؤال بصوت مرتفع.'
        : 'Voici un exemple de lecture de question à voix haute.';
      return TTSService.speak(sample, lang);
    },

    stop: function () {
      state.token++;
      state.speaking = false;
      try {
        if (state.engine === ENGINE.NATIVE && global.TTS && typeof global.TTS.stop === 'function') {
          global.TTS.stop();
        } else if (state.engine === ENGINE.BROWSER && global.speechSynthesis) {
          global.speechSynthesis.cancel();
        }
      } catch (e) { /* stopping must never throw */ }
    },

    /* Opens the Android TTS settings so the user can install a missing voice.
       Only offered when the plugin actually exposes the method. */
    canOpenSettings: function () {
      return !!(global.TTS && typeof global.TTS.openInstallTts === 'function');
    },

    openSettings: function () {
      if (!TTSService.canOpenSettings()) return false;
      try { global.TTS.openInstallTts(); return true; } catch (e) { return false; }
    },

    normalise: normalise
  };

  global.CM = global.CM || {};
  global.CM.tts = TTSService;
})(window);

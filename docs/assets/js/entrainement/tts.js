/* Concours Maroc — practice app: read-aloud with the browser's Web Speech API.
 * Feature-detected: when no synthesis engine or no voice exists for a
 * language, the button simply does not appear. Nothing leaves the device. */
(function (global) {
  'use strict';

  var synth = global.speechSynthesis || null;
  var voices = [];
  var prefs = { enabled: true, rate: 1, pitch: 1, voiceFr: null, voiceAr: null, readChoices: false };

  function loadVoices() {
    if (!synth) return;
    try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
  }
  if (synth) {
    loadVoices();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }

  function voicesFor(lang) {
    return voices.filter(function (v) { return String(v.lang || '').toLowerCase().indexOf(lang) === 0; });
  }

  var LETTERS = { ar: ['أ', 'ب', 'ج', 'د', 'هـ'], fr: ['A', 'B', 'C', 'D', 'E'] };

  var TTS = {
    isAvailable: function () { return !!synth && typeof global.SpeechSynthesisUtterance === 'function'; },
    hasVoice: function (lang) { return voicesFor(lang).length > 0; },
    voicesFor: function (lang) {
      return voicesFor(lang).map(function (v) { return { id: v.voiceURI, name: v.name, lang: v.lang }; });
    },
    setPrefs: function (p) { Object.keys(p || {}).forEach(function (k) { prefs[k] = p[k]; }); },
    getPrefs: function () { return prefs; },
    isSpeaking: function () { return !!synth && synth.speaking; },
    stop: function () { if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } } },

    speak: function (text, lang) {
      if (!TTS.isAvailable()) return false;
      TTS.stop();
      var code = lang === 'ar' ? 'ar' : lang === 'en' ? 'en' : 'fr';
      var u = new global.SpeechSynthesisUtterance(text);
      u.lang = code === 'ar' ? 'ar-SA' : code === 'en' ? 'en-US' : 'fr-FR';
      var wanted = code === 'ar' ? prefs.voiceAr : prefs.voiceFr;
      var list = voicesFor(code);
      var v = list.filter(function (x) { return x.voiceURI === wanted; })[0] || list[0];
      if (v) u.voice = v;
      u.rate = prefs.rate || 1;
      u.pitch = prefs.pitch || 1;
      synth.speak(u);
      return true;
    },

    speakQuestion: function (body, lang) {
      var M = global.CM.math;
      var say = function (s) { return M ? M.speech(s) : s; };   // formulas in words
      var text = say(body.text);
      if (prefs.readChoices) {
        var letters = LETTERS[lang === 'ar' ? 'ar' : 'fr'];
        text += '. ' + body.choices.map(function (c, i) { return letters[i] + ' : ' + say(c); }).join('. ');
      }
      return TTS.speak(text, lang);
    }
  };

  global.CM = global.CM || {};
  global.CM.tts = TTS;
})(window);

/* Concours Maroc — practice app: interface strings and question localization.
 * The page language (fr or ar) is fixed by the page itself (/entrainement/ or
 * /ar/entrainement/); switching language means opening the other page. */
(function (global) {
  'use strict';

  var SUPPORTED = ['fr', 'ar'];
  var packs = {};
  var current = 'fr';

  function lookup(pack, path) {
    var parts = path.split('.');
    var node = pack;
    for (var i = 0; i < parts.length; i++) {
      if (!node || typeof node !== 'object') return undefined;
      node = node[parts[i]];
    }
    return node;
  }

  var I18n = {
    supported: SUPPORTED,

    register: function (code, pack) { packs[code] = pack; },
    has: function (code) { return !!packs[code]; },

    /* First launch: follow the device, but only into a language we ship. */
    detect: function () {
      var langs = [];
      if (global.navigator) {
        if (global.navigator.languages) langs = langs.concat(global.navigator.languages);
        if (global.navigator.language) langs.push(global.navigator.language);
        if (global.navigator.userLanguage) langs.push(global.navigator.userLanguage);
      }
      for (var i = 0; i < langs.length; i++) {
        var base = String(langs[i]).toLowerCase().split('-')[0];
        if (SUPPORTED.indexOf(base) !== -1) return base;
      }
      return 'fr';
    },

    get lang() { return current; },

    dir: function (code) {
      var pack = packs[code || current];
      return (pack && pack.meta && pack.meta.dir) || (code === 'ar' ? 'rtl' : 'ltr');
    },

    isRTL: function (code) { return I18n.dir(code) === 'rtl'; },

    name: function (code) {
      var pack = packs[code];
      return (pack && pack.meta && pack.meta.name) || code;
    },

    set: function (code) {
      if (SUPPORTED.indexOf(code) === -1 || !packs[code]) return false;
      current = code;
      return true;
    },

    /* t('home.streak', {n: 4}) */
    t: function (path, vars) {
      var value = lookup(packs[current], path);
      if (value === undefined) value = lookup(packs.fr, path);
      if (value === undefined) return path;
      if (typeof value !== 'string') return value;
      if (!vars) return value;
      return value.replace(/\{(\w+)\}/g, function (m, k) {
        return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
      });
    },

    /* Question content is stored per language; fall back to the other one
       rather than showing an empty card. */
    pick: function (question, preferred) {
      var lang = preferred || current;
      if (question.l10n && question.l10n[lang]) return { lang: lang, body: question.l10n[lang] };
      var available = question.languages || Object.keys(question.l10n || {});
      for (var i = 0; i < available.length; i++) {
        if (question.l10n[available[i]]) {
          return { lang: available[i], body: question.l10n[available[i]] };
        }
      }
      return null;
    }
  };

  global.CM = global.CM || {};
  global.CM.i18n = I18n;
})(window);

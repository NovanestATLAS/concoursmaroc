/* Concours Maroc — practice app persistence.
 *
 * Everything is written through a small adapter so that the backend can be
 * swapped later (IndexedDB, cordova-plugin-file, a native key-value plugin)
 * without touching the rest of the app. Keys are namespaced and versioned:
 *   cm.v1.<name>
 * A corrupted or unavailable store must never break the app, so every read
 * falls back to the supplied default and every write reports success/failure
 * instead of throwing.
 */
(function (global) {
  'use strict';

  var NS = 'cm';
  var SCHEMA = 1;
  var prefix = NS + '.v' + SCHEMA + '.';

  // ---------------------------------------------------------------- backend
  function LocalStorageBackend() {}
  LocalStorageBackend.prototype.available = function () {
    try {
      var k = prefix + '__probe';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  };
  LocalStorageBackend.prototype.get = function (key) {
    try { return global.localStorage.getItem(prefix + key); } catch (e) { return null; }
  };
  LocalStorageBackend.prototype.set = function (key, value) {
    try { global.localStorage.setItem(prefix + key, value); return true; } catch (e) { return false; }
  };
  LocalStorageBackend.prototype.remove = function (key) {
    try { global.localStorage.removeItem(prefix + key); return true; } catch (e) { return false; }
  };
  LocalStorageBackend.prototype.keys = function () {
    var out = [];
    try {
      for (var i = 0; i < global.localStorage.length; i++) {
        var k = global.localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) out.push(k.slice(prefix.length));
      }
    } catch (e) { /* ignore */ }
    return out;
  };

  /* Used when localStorage is disabled (private mode, WebView restrictions).
     The session still works; only persistence between launches is lost. */
  function MemoryBackend() { this.map = {}; }
  MemoryBackend.prototype.available = function () { return true; };
  MemoryBackend.prototype.get = function (k) {
    return Object.prototype.hasOwnProperty.call(this.map, k) ? this.map[k] : null;
  };
  MemoryBackend.prototype.set = function (k, v) { this.map[k] = v; return true; };
  MemoryBackend.prototype.remove = function (k) { delete this.map[k]; return true; };
  MemoryBackend.prototype.keys = function () { return Object.keys(this.map); };

  var backend = new LocalStorageBackend();
  var persistent = backend.available();
  if (!persistent) backend = new MemoryBackend();

  // ---------------------------------------------------------------- api
  var Store = {
    schema: SCHEMA,
    isPersistent: function () { return persistent; },

    read: function (key, fallback) {
      var raw = backend.get(key);
      if (raw === null || raw === undefined) return fallback;
      try {
        var parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
      } catch (e) {
        // Corrupted entry: drop it rather than let it poison every later read.
        console.warn('[storage] corrupted entry dropped:', key);
        backend.remove(key);
        return fallback;
      }
    },

    write: function (key, value) {
      var raw;
      try { raw = JSON.stringify(value); } catch (e) {
        console.warn('[storage] value not serialisable:', key);
        return false;
      }
      return backend.set(key, raw);
    },

    remove: function (key) { return backend.remove(key); },
    keys: function () { return backend.keys(); },

    clearAll: function () {
      backend.keys().forEach(function (k) { backend.remove(k); });
      return true;
    },

    /* Full snapshot used by the export/import feature. */
    exportAll: function () {
      var data = {};
      backend.keys().forEach(function (k) { data[k] = Store.read(k, null); });
      return {
        app: 'concours-maroc',
        schema: SCHEMA,
        exportedAt: new Date().toISOString(),
        data: data
      };
    },

    importAll: function (payload) {
      if (!payload || typeof payload !== 'object' || payload.app !== 'concours-maroc') {
        return { ok: false, reason: 'not-a-concours-maroc-export' };
      }
      if (typeof payload.schema !== 'number' || payload.schema > SCHEMA) {
        return { ok: false, reason: 'schema-too-recent' };
      }
      if (!payload.data || typeof payload.data !== 'object') {
        return { ok: false, reason: 'no-data' };
      }
      var written = 0;
      Object.keys(payload.data).forEach(function (k) {
        if (Store.write(k, payload.data[k])) written++;
      });
      return { ok: true, written: written };
    }
  };

  // ---------------------------------------------------------------- profile
  var PROFILE_KEY = 'profile';

  var DEFAULT_PROFILE = {
    onboarded: false,
    targetExam: null,
    haptics: true,
    showTimer: true,
    tts: { enabled: false, voiceFr: null, voiceAr: null, rate: 1, pitch: 1, readChoices: false },
    contentVersion: null
  };

  function mergeDefaults(target, defaults) {
    Object.keys(defaults).forEach(function (k) {
      if (target[k] === undefined || target[k] === null) {
        target[k] = (typeof defaults[k] === 'object' && defaults[k] !== null && !Array.isArray(defaults[k]))
          ? JSON.parse(JSON.stringify(defaults[k])) : defaults[k];
      } else if (typeof defaults[k] === 'object' && defaults[k] !== null && !Array.isArray(defaults[k])
                 && typeof target[k] === 'object') {
        mergeDefaults(target[k], defaults[k]);
      }
    });
    return target;
  }

  Store.getProfile = function () {
    var p = Store.read(PROFILE_KEY, null);
    if (!p || typeof p !== 'object') p = {};
    return mergeDefaults(p, DEFAULT_PROFILE);
  };

  Store.saveProfile = function (profile) { return Store.write(PROFILE_KEY, profile); };

  Store.patchProfile = function (patch) {
    var p = Store.getProfile();
    Object.keys(patch).forEach(function (k) {
      if (typeof patch[k] === 'object' && patch[k] !== null && !Array.isArray(patch[k])
          && typeof p[k] === 'object' && p[k] !== null) {
        Object.keys(patch[k]).forEach(function (kk) { p[k][kk] = patch[k][kk]; });
      } else p[k] = patch[k];
    });
    Store.saveProfile(p);
    return p;
  };

  global.CM = global.CM || {};
  global.CM.store = Store;
})(window);

/* Concours Maroc (Android app) — local file loading.
 *
 * Every page, question bank and translation is a file of www/. Under Cordova
 * (cordova-android 10+) the WebView serves www/ from https://localhost, so
 * fetch() works. With AndroidInsecureFileModeEnabled (file://) fetch() is
 * refused by Chromium but XMLHttpRequest still works, and in a desktop
 * browser opened from disk neither works: js/data-bundle.js, a generated copy
 * of the same files, is then loaded on demand. All three paths return
 * identical content. */
(function (global) {
  'use strict';

  var bundle = null;      // promise of window.CM_DATA_BUNDLE
  var textCache = {};

  function viaFetch(url) {
    if (typeof global.fetch !== 'function') return Promise.reject(new Error('fetch unavailable'));
    return global.fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
      return res.text();
    });
  }

  function viaXhr(url) {
    return new Promise(function (resolve, reject) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
          // file:// answers with status 0 when the file exists.
          if ((xhr.status === 200 || xhr.status === 0) && xhr.responseText) resolve(xhr.responseText);
          else reject(new Error('XHR ' + xhr.status + ' — ' + url));
        };
        xhr.onerror = function () { reject(new Error('XHR error — ' + url)); };
        xhr.send();
      } catch (e) { reject(e); }
    });
  }

  function loadBundle() {
    if (bundle) return bundle;
    bundle = new Promise(function (resolve, reject) {
      if (global.CM_DATA_BUNDLE) { resolve(global.CM_DATA_BUNDLE); return; }
      var s = document.createElement('script');
      s.src = 'js/data-bundle.js';
      s.onload = function () { global.CM_DATA_BUNDLE ? resolve(global.CM_DATA_BUNDLE) : reject(new Error('empty bundle')); };
      s.onerror = function () { reject(new Error('js/data-bundle.js missing')); };
      document.head.appendChild(s);
    });
    bundle.catch(function () { bundle = null; });
    return bundle;
  }

  function viaBundle(url) {
    return loadBundle().then(function (b) {
      var key = url.split('?')[0].replace(/^\.\//, '');
      if (!(key in b)) throw new Error('not bundled — ' + key);
      var v = b[key];
      return typeof v === 'string' ? v : JSON.stringify(v);
    });
  }

  var Load = {
    text: function (url) {
      if (textCache[url]) return textCache[url];
      var p = viaFetch(url)
        .catch(function () { return viaXhr(url); })
        .catch(function () { return viaBundle(url); });
      textCache[url] = p;
      p.catch(function () { delete textCache[url]; });
      return p;
    },
    json: function (url) {
      return Load.text(url).then(function (t) { return JSON.parse(t); });
    }
  };

  global.CM = global.CM || {};
  global.CM.load = Load;
})(window);

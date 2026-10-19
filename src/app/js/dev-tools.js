/* Concours Maroc (Android app) — developer mode.
 *
 * Six taps on "À propos" in the settings turn it on (and show a "Mode
 * développeur" button there); the screen app/developpeur/ then diagnoses
 * every function of the app: content data, search, formulas, speech, ads
 * (banner, interstitial, rewarded, consent), Google Play (review, update),
 * Firebase (statistics, notifications, remote settings), announcement,
 * screen measures, storage, network, and the log of errors and warnings.
 * "Tout tester" runs every check and gives a report that can be copied.
 *
 * Loaded right after boot-guard.js so that the log covers the start-up;
 * everything else is looked up when the screen is opened.
 */
(function (global) {
  'use strict';

  var KEY = 'cm.dev';
  var MAX = 150;
  var entries = [];

  // ------------------------------------------------------------ log capture
  function push(level, args) {
    var text;
    try {
      text = Array.prototype.map.call(args, function (a) {
        if (a instanceof Error) return a.message;
        return typeof a === 'string' ? a : JSON.stringify(a);
      }).join(' ');
    } catch (e) { text = String(args[0]); }
    entries.push({ t: Date.now(), level: level, text: String(text).slice(0, 500) });
    if (entries.length > MAX) entries.shift();
  }
  ['info', 'warn', 'error'].forEach(function (level) {
    var orig = global.console && global.console[level];
    if (typeof orig !== 'function') return;
    global.console[level] = function () { push(level, arguments); return orig.apply(global.console, arguments); };
  });
  global.addEventListener('error', function (e) { push('error', [e.message + (e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : '')]); });
  global.addEventListener('unhandledrejection', function (e) { push('error', ['Promise : ' + (e.reason && e.reason.message || e.reason)]); });

  function enabled() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setEnabled(on) { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

  // ------------------------------------------------------------ helpers
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'onclick') n.addEventListener('click', attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function json(v) { try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); } }
  function time(t) { var d = new Date(t); return d.toLocaleTimeString('fr-FR') + '.' + String(d.getMilliseconds()).padStart(3, '0'); }
  function toast(m) { if (global.cmToast) global.cmToast(m); }
  function CM() { return global.CM || {}; }
  function withTimeout(p, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('pas de réponse après ' + ms + ' ms')); }, ms);
      Promise.resolve(p).then(function (v) { clearTimeout(timer); resolve(v); }, function (e) { clearTimeout(timer); reject(e); });
    });
  }
  function copy(text) {
    var done = function () { toast('Copié dans le presse-papiers'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    }
    fallbackCopy(text); done();
    return Promise.resolve();
  }
  function fallbackCopy(text) {
    var ta = el('textarea', { style: 'position:fixed;top:-1000px' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }
  function webViewVersion() {
    var m = /Chrome\/([\d.]+)/.exec(navigator.userAgent || '');
    return m ? m[1] : '—';
  }
  function storageInfo() {
    var keys = [];
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var size = (localStorage.getItem(k) || '').length + k.length;
        total += size;
        keys.push({ key: k, size: size });
      }
    } catch (e) { /* ignore */ }
    keys.sort(function (a, b) { return b.size - a.size; });
    return { count: keys.length, kb: Math.round(total * 2 / 1024), keys: keys };
  }

  // ------------------------------------------------------------ checks
  /* Each check resolves { ok: true | false | null (not applicable), detail }. */
  var CHECKS = [
    ['Stockage local', function () {
      var k = 'cm.dev.test';
      localStorage.setItem(k, '1');
      var ok = localStorage.getItem(k) === '1';
      localStorage.removeItem(k);
      var s = storageInfo();
      return { ok: ok, detail: s.count + ' clés, ~' + s.kb + ' Ko' };
    }],
    ['Données du contenu', function () {
      return CM().load.json('data/manifest.json').then(function (m) {
        return { ok: !!m.totalQuestions, detail: 'version ' + (m.contentVersion || '?') + ', ' + (m.totalQuestions || 0) + ' questions' };
      });
    }],
    ['Banque de questions', function () {
      return CM().data.bank('maths').then(function (b) {
        var n = Array.isArray(b) ? b.length : (b && b.questions ? b.questions.length : 0);
        return { ok: n > 0, detail: 'maths : ' + n + ' questions' };
      });
    }],
    ['Index de recherche', function () {
      var lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'fr';
      return CM().load.json('data/search-' + lang + '.json').then(function (d) {
        var n = Array.isArray(d) ? d.length : (d && d.pages ? d.pages.length : Object.keys(d || {}).length);
        return { ok: n > 0, detail: n + ' entrées (' + lang + ')' };
      });
    }],
    ['Formules (KaTeX)', function () {
      if (!global.katex) return { ok: false, detail: 'katex absent' };
      var html = global.katex.renderToString('\\frac{1}{2}');
      return { ok: /katex/.test(html), detail: 'KaTeX ' + (global.katex.version || '') };
    }],
    ['Navigation', function () {
      var Shell = CM().shell;
      var cur = Shell && Shell.current && Shell.current();
      return { ok: !!cur, detail: cur ? '#/' + cur.key : 'aucune page' };
    }],
    ['Réseau', function () {
      if (navigator.onLine === false) return { ok: false, detail: 'hors ligne' };
      var site = (document.documentElement.getAttribute('data-site-url') || 'https://www.maroc-concour.com/').replace(/\/?$/, '/');
      return withTimeout(fetch(site + 'robots.txt', { cache: 'no-store' }), 8000).then(function (r) {
        return { ok: r.ok, detail: 'site ' + r.status + (navigator.connection ? ', ' + (navigator.connection.effectiveType || '') : '') };
      });
    }],
    ['Synthèse vocale', function () {
      var T = CM().tts;
      if (!T || !T.status) return { ok: false, detail: 'service absent' };
      var s = T.status();
      return { ok: s.available, detail: (s.engine || 'aucun moteur') + ', ' + (s.voiceCount || 0) + ' voix, FR ' + (s.hasFrenchVoice ? 'oui' : 'non') + ', AR ' + (s.hasArabicVoice ? 'oui' : 'non') };
    }],
    ['Publicité (AdMob)', function () {
      var A = CM().ads;
      if (!global.admob) return { ok: null, detail: 'plugin admob-plus-cordova absent (navigateur)' };
      var s = A.status();
      return { ok: s.mode === 'native' && s.started, detail: s.mode + (s.testMode ? ', mode test' : ', production') + ', blocs : ' + (s.units || []).join(', ') };
    }],
    ['Consentement (UMP)', function () {
      if (!global.consent) return { ok: null, detail: 'plugin cordova-plugin-consent absent' };
      var s = CM().ads.status();
      return { ok: s.canRequestAds !== false, detail: s.consent + (s.privacyOptions ? ', options de confidentialité requises' : '') };
    }],
    ['Bannière', function () {
      if (!global.admob) return { ok: null, detail: 'pas de plugin publicitaire' };
      var s = CM().ads.status();
      var d = 'mode ' + s.bannerMode + (s.bannerLoaded ? ', chargée ' + s.bannerHeight + ' px' : ', pas encore chargée') + (s.bannerOffset != null ? ', décalage ' + s.bannerOffset + ' px' : '') + (s.bannerMisplaced ? ', masquée (clavier/rotation)' : '');
      return { ok: s.bannerMode !== 'off', detail: d };
    }],
    ['Mesure de l’écran', function () {
      if (!global.SystemInsets) return { ok: null, detail: 'plugin cordova-plugin-system-insets absent' };
      return withTimeout(global.SystemInsets.get(), 4000).then(function (i) {
        return { ok: i && i.below != null, detail: 'barre d’état ' + i.top + ' px, navigation ' + i.bottom + ' px, sous la WebView ' + i.below + ' px, densité ' + i.density };
      });
    }],
    ['Avis Google Play', function () {
      var P = CM().play;
      if (!P) return { ok: false, detail: 'service absent' };
      var d = P.debug();
      if (!d.reviewPlugin) return { ok: null, detail: 'plugin cordova-launch-review absent' };
      return { ok: true, detail: (d.state.sessions || 0) + ' séries terminées, ' + ((d.state.asks || []).length) + ' demande(s) de note' };
    }],
    ['Mises à jour Google Play', function () {
      if (!global.PlayUpdate) return { ok: null, detail: 'plugin cordova-plugin-play-update absent' };
      return withTimeout(global.PlayUpdate.check(), 10000).then(function (i) {
        return { ok: !!i, detail: i ? i.availability + (i.versionCode ? ' (version ' + i.versionCode + ')' : '') : 'pas de réponse' };
      }, function (e) { return { ok: false, detail: String(e && e.message || e) + ' (normal hors Google Play)' }; });
    }],
    ['Firebase Analytics', function () {
      var F = CM().firebase;
      if (!F || !F.present().analytics) return { ok: null, detail: 'plugin cordova-plugin-firebase-analytics absent' };
      return F.log('dev_test', { source: 'developpeur' }).then(function (ok) {
        return { ok: ok || !F.analyticsOn(), detail: F.analyticsOn() ? 'événement dev_test envoyé' : 'désactivé dans les paramètres' };
      });
    }],
    ['Firebase Messaging', function () {
      var F = CM().firebase;
      if (!F || !F.present().messaging) return { ok: null, detail: 'plugin cordova-plugin-firebase-messaging absent' };
      return withTimeout(F.token(), 10000).then(function (t) {
        return { ok: !!t, detail: t ? 'jeton ' + t.slice(0, 16) + '…, alertes ' + (F.notificationsOn() ? 'activées' : 'désactivées') : 'pas de jeton (google-services.json ?)' };
      });
    }],
    ['Firebase Remote Config', function () {
      var F = CM().firebase;
      if (!F || !F.present().config) return { ok: null, detail: 'plugin cordova-plugin-firebase-config absent' };
      return withTimeout(F.fetchConfig(0), 10000).then(function (ok) {
        return F.getString('annonce').then(function (v) { return { ok: ok, detail: ok ? 'récupéré, « annonce » : ' + (v ? v.length + ' caractères' : 'vide') : 'échec' }; });
      });
    }],
    ['Annonces', function () {
      var N = CM().notices;
      if (!N) return { ok: false, detail: 'service absent' };
      var d = N.debug();
      return { ok: true, detail: 'source : ' + (d.source || 'aucune annonce en cours') + ', vues : ' + d.seen.length };
    }],
    ['Barre d’état', function () {
      var ok = !!(global.statusbar || global.StatusBar);
      return { ok: ok ? true : null, detail: ok ? (global.statusbar ? 'cordova-android (intégrée)' : 'cordova-plugin-statusbar') : 'non disponible (navigateur)' };
    }]
  ];

  function runCheck(c) {
    var t0 = Date.now();
    var p;
    try { p = Promise.resolve(c[1]()); } catch (e) { p = Promise.reject(e); }
    return withTimeout(p, 15000).then(function (r) {
      return { name: c[0], ok: r.ok, detail: r.detail, ms: Date.now() - t0 };
    }, function (e) {
      return { name: c[0], ok: false, detail: String(e && e.message || e), ms: Date.now() - t0 };
    });
  }

  function environment() {
    var c = global.cordova || {};
    return {
      date: new Date().toISOString(),
      cordova: c.version || '—',
      platform: (c.platformId || 'navigateur') + ' ' + (c.platformVersion || ''),
      webview: webViewVersion(),
      userAgent: navigator.userAgent,
      langue: document.documentElement.getAttribute('lang'),
      ecran: screen.width + '×' + screen.height + ' (fenêtre ' + global.innerWidth + '×' + global.innerHeight + ', ratio ' + (global.devicePixelRatio || 1) + ')',
      enLigne: navigator.onLine !== false,
      bordABord: document.documentElement.hasAttribute('data-edge')
    };
  }

  function report(results) {
    var CMx = CM();
    return {
      environnement: environment(),
      verifications: results || null,
      publicite: CMx.ads ? CMx.ads.debug() : null,
      googlePlay: CMx.play ? CMx.play.debug() : null,
      firebase: CMx.firebase ? CMx.firebase.debug() : null,
      annonces: CMx.notices ? CMx.notices.debug() : null,
      stockage: storageInfo(),
      journal: entries.slice(-80)
    };
  }

  // ------------------------------------------------------------ screen
  function section(title, kids) {
    return el('section', { class: 'card', style: 'margin-bottom:14px' }, [el('h2', { style: 'margin-top:0;font-size:1.1rem', text: title })].concat(kids));
  }
  function btn(label, fn, style) {
    return el('button', { class: 'btn sm ' + (style || 'ghost'), type: 'button', onclick: function () {
      try {
        var r = fn();
        if (r && typeof r.then === 'function') r.then(function (v) { if (v !== undefined) toast(typeof v === 'string' ? v : JSON.stringify(v)); }, function (e) { toast('Erreur : ' + (e && e.message || e)); });
      } catch (e) { toast('Erreur : ' + e.message); }
    } }, [label]);
  }
  function row() { return el('div', { class: 'btn-row', style: 'margin-top:10px' }, Array.prototype.slice.call(arguments)); }
  function pre(text) { return el('pre', { class: 'dev-pre', text: text }); }

  function render(root) {
    var host = root.querySelector('#dev-root') || root;
    while (host.firstChild) host.removeChild(host.firstChild);
    if (!enabled()) {
      host.appendChild(el('p', { class: 'muted', text: 'Le mode développeur est désactivé. Touchez six fois « À propos » dans les paramètres pour l’activer.' }));
      return;
    }
    var A = CM().ads, P = CM().play, F = CM().firebase, N = CM().notices, T = CM().tts;
    var lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'fr';

    // all checks
    var table = el('div', { class: 'dev-checks' });
    var last = null;
    host.appendChild(section('Diagnostic complet', [
      el('p', { class: 'muted', text: 'Vérifie chaque fonction de l’application et indique ce qui fonctionne, ce qui échoue et ce qui est absent de cette version.' }),
      row(btn('Tout tester', function () {
        while (table.firstChild) table.removeChild(table.firstChild);
        table.appendChild(el('p', { class: 'muted', text: 'Vérification…' }));
        var results = [];
        return CHECKS.reduce(function (p, c) { return p.then(function () { return runCheck(c).then(function (r) { results.push(r); }); }); }, Promise.resolve())
          .then(function () {
            last = results;
            while (table.firstChild) table.removeChild(table.firstChild);
            results.forEach(function (r) {
              var mark = r.ok === true ? '✓' : (r.ok === false ? '✗' : '–');
              table.appendChild(el('div', { class: 'dev-check ' + (r.ok === true ? 'ok' : (r.ok === false ? 'ko' : 'na')) }, [
                el('span', { class: 'dev-mark', text: mark }), el('strong', { text: r.name }), el('small', { text: r.detail + ' · ' + r.ms + ' ms' })
              ]));
            });
            var ko = results.filter(function (r) { return r.ok === false; }).length;
            return ko ? ko + ' vérification(s) en échec' : 'Tout fonctionne';
          });
      }, 'primary'), btn('Copier le rapport', function () { return copy(json(report(last))); })),
      table
    ]));

    // environment
    host.appendChild(section('Application et appareil', [pre(json(environment()))]));

    // ads
    var adsPre = pre(A ? json(A.status()) : 'service absent');
    host.appendChild(section('Publicité', [
      adsPre,
      row(
        btn('Afficher la bannière', function () { return A.showBanner().then(function (ok) { adsPre.textContent = json(A.status()); return ok ? 'Bannière demandée' : 'Bannière non affichée (voir le journal)'; }); }),
        btn('Masquer la bannière', function () { A.hideBanner(); adsPre.textContent = json(A.status()); }),
        btn('Interstitiel (test)', function () { return A.testInterstitial().then(function (r) { return r.shown ? 'Interstitiel affiché' : 'Non affiché : ' + r.reason; }); }),
        btn('Récompensée (test)', function () { return A.testRewarded().then(function (r) { return 'Résultat : ' + r.via; }); })
      ),
      row(
        btn('Options de confidentialité', function () { return A.showConsentForm().then(function (s) { return 'Consentement : ' + s; }); }),
        btn('Réinitialiser le consentement', function () { return A.resetConsent().then(function (s) { return 'Consentement : ' + s; }); }),
        btn('Remettre à zéro les plafonds', function () { A.resetCaps(); return Promise.resolve('Plafonds remis à zéro'); }),
        btn('Journal publicitaire', function () { adsPre.textContent = json(A.debug()); })
      ),
      el('p', { class: 'muted', style: 'font-size:var(--fs-sm)', text: 'Interstitiel et vidéo récompensée : uniquement en mode test (blocs de démonstration de Google), pour ne jamais cliquer sur une vraie annonce.' })
    ]));

    // speech
    host.appendChild(section('Lecture à voix haute', [
      pre(T && T.status ? json(T.status()) : 'service absent'),
      row(btn('Voix française', function () { T.speak('Bonjour, ceci est un test de la lecture à voix haute. La fraction un sur deux.', 'fr'); }),
        btn('Voix arabe', function () { T.speak('مرحبًا، هذا اختبار للقراءة الصوتية.', 'ar'); }),
        btn('Arrêter', function () { T.stop(); }))
    ]));

    // Google Play
    var playPre = pre(P ? json(P.debug()) : 'service absent');
    host.appendChild(section('Google Play : avis et mises à jour', [
      playPre,
      row(
        btn('Carte d’avis Google', function () { return Promise.resolve(P.requestReviewCard() ? 'Demandée (Google décide de l’afficher)' : 'Plugin absent'); }),
        btn('Message « Votre avis compte »', function () { P.previewRatingPrompt(); }),
        btn('Page Google Play', function () { return Promise.resolve(P.openStorePage() ? undefined : 'Plugin absent'); })
      ),
      row(
        btn('Chercher une mise à jour', function () { return P.checkUpdate(true).then(function (i) { playPre.textContent = json(P.debug()); return i ? 'Google Play : ' + i.availability : 'Pas de réponse (normal hors Google Play)'; }); }),
        btn('Aperçu de la fenêtre de mise à jour', function () { P.previewUpdate(); }),
        btn('Remettre à zéro', function () { P.resetState(); playPre.textContent = json(P.debug()); })
      )
    ]));

    // Firebase
    var fbPre = pre(F ? json(F.debug()) : 'service absent');
    host.appendChild(section('Firebase', [
      fbPre,
      row(
        btn('Événement test', function () { return F.log('dev_test', { source: 'developpeur' }).then(function (ok) { return ok ? 'Envoyé (visible dans DebugView)' : 'Non envoyé'; }); }),
        btn('Jeton de notification', function () { return F.token().then(function (t) { fbPre.textContent = json(F.debug()); if (t) copy(t); return t ? undefined : 'Pas de jeton'; }); }),
        btn('Activer les alertes', function () { return F.enableNotifications(lang).then(function (s) { fbPre.textContent = json(F.debug()); return 'Alertes : ' + s; }); }),
        btn('Récupérer Remote Config', function () { return F.fetchConfig(0).then(function (ok) { return ok ? 'Remote Config à jour' : 'Échec'; }); })
      )
    ]));

    // announcement
    host.appendChild(section('Annonces', [
      pre(N ? json(N.debug()) : 'service absent'),
      row(btn('Aperçu', function () { N.preview(); }),
        btn('Vérifier maintenant', function () { return N.check(true).then(function (a) { return a ? 'Annonce « ' + a.id + ' »' : 'Aucune annonce en cours'; }); }),
        btn('Oublier les annonces vues', function () { N.reset(); return Promise.resolve('Fait'); }))
    ]));

    // storage
    var st = storageInfo();
    host.appendChild(section('Stockage', [
      pre(st.count + ' clés, ~' + st.kb + ' Ko\n' + st.keys.slice(0, 25).map(function (k) { return k.key + ' — ' + k.size + ' car.'; }).join('\n'))
    ]));

    // log
    var logPre = pre('');
    function fillLog() { logPre.textContent = entries.slice().reverse().map(function (e) { return time(e.t) + ' ' + e.level.toUpperCase() + ' ' + e.text; }).join('\n') || '(vide)'; }
    fillLog();
    host.appendChild(section('Journal (erreurs, avertissements, infos)', [
      logPre,
      row(btn('Actualiser', fillLog), btn('Copier', function () { return copy(logPre.textContent); }), btn('Vider', function () { entries.length = 0; fillLog(); }))
    ]));

    host.appendChild(row(btn('Désactiver le mode développeur', function () {
      setEnabled(false);
      toast('Mode développeur désactivé');
      var Shell = CM().shell;
      if (Shell) Shell.back();
    }, 'quiet')));
  }

  /* Six taps within 4 seconds on any of the given elements. */
  function attachTaps(els, onEnable) {
    var count = 0, first = 0;
    els.filter(Boolean).forEach(function (n) {
      n.addEventListener('click', function () {
        var now = Date.now();
        if (now - first > 4000) { count = 0; first = now; }
        count++;
        if (enabled()) { if (count === 6) { count = 0; toast('Le mode développeur est déjà activé'); } return; }
        if (count >= 3 && count < 6) toast('Encore ' + (6 - count) + ' appui(s) pour le mode développeur');
        if (count === 6) {
          count = 0;
          setEnabled(true);
          toast('Mode développeur activé');
          if (onEnable) onEnable();
        }
      });
    });
  }

  global.CM = global.CM || {};
  global.CM.dev = { enabled: enabled, setEnabled: setEnabled, render: render, attachTaps: attachTaps, log: function () { return entries.slice(); }, report: report };
})(window);

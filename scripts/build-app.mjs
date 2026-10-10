#!/usr/bin/env node
/* Concours Maroc — Android app build (Apache Cordova).
 *
 *   node scripts/build-app.mjs   (npm run build:app)
 *     -> dist/cordova/www/                    the Cordova www folder
 *     -> dist/cordova/www_concours_maroc.zip  the same folder, zipped
 *     -> cordova/www_concours_maroc.zip       copy of the zip, committed with
 *                                             the build notes (LISEZMOI-ANDROID.md)
 *
 * Same content as the website (docs/), packaged as a single-page Cordova app
 * with the layout of the first version of the app:
 *
 *   index.html        app shell (CSP, cordova.js, header, tab bar, ad slot)
 *   css/app.css       site styles + trainer styles + app shell styles
 *   js/               trainer modules (same names as before), router, boot,
 *                     speech (cordova-plugin-tts-advanced), ads (admob-plus)
 *   data/             question banks, concours data, pages.json, search
 *   i18n/             trainer strings (fr, ar)
 *   pages/            one HTML fragment per page of the website
 *   img/, fonts/      unchanged assets of the first version
 *
 * Links inside pages are routes of the shell (#/concours/ensa/), so nothing
 * depends on directory index files, which the Cordova WebView does not serve.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import site from '../content/site.mjs';
import { setLinkMode, linker, breadcrumb, appAsset } from './lib/layout.mjs';
import { html } from './lib/html.mjs';
import { icon, logo } from './lib/icons.mjs';
import { t } from './lib/strings.mjs';
import { buildGuide, buildDirectory } from './lib/pages/concours.mjs';
import { buildHome } from './lib/pages/home.mjs';
import { buildToolsPages } from './lib/pages/tools.mjs';
import { buildPracticePage } from './lib/pages/practice.mjs';
import { buildQcmPages } from './lib/pages/qcm.mjs';
import { buildGuidesPages } from './lib/pages/guides.mjs';
import { buildStaticPages } from './lib/pages/static.mjs';
import { loadQuestionBanks } from './lib/questions.mjs';
import { dataFiles, searchIndex } from './lib/data.mjs';
import { appPrivacyTitle, appPrivacyContent } from './lib/pages/app-privacy.mjs';

setLinkMode('app');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist/cordova');
const OUT = path.join(DIST, 'www');

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function copy(fromRel, toRel) { write(toRel, fs.readFileSync(path.join(ROOT, fromRel))); }

async function loadConcours() {
  const dir = path.join(ROOT, 'content/concours');
  const list = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
    list.push((await import(pathToFileURL(path.join(dir, f)).href)).default);
  }
  return list.sort((a, b) => a.order - b.order);
}

/* ------------------------------------------------------------------ pages
   App-only pages: settings, and the privacy policy of the app (ads, consent,
   speech) which replaces the website's one. */

function settingsPage(lang) {
  const ar = lang === 'ar';
  const pfx = ar ? 'ar/' : '';
  const key = `${pfx}app/parametres/`;
  const link = linker('');
  const title = ar ? 'إعدادات التطبيق' : 'Paramètres de l’application';
  const card = (h, body) => html`<section class="card" style="margin-bottom:14px"><h2 style="margin-top:0;font-size:1.15rem">${h}</h2>${body}</section>`;
  const body = html`${breadcrumb(lang, link, [[pfx, t(lang, 'home')], [key, title]])}
<div class="container narrow app-settings" style="padding-bottom:40px">
<header class="page-head"><h1>${title}</h1></header>
${card(ar ? 'المظهر' : 'Apparence', html`<div class="set-row"><div><strong>${ar ? 'السمة' : 'Thème'}</strong><small>${ar ? 'التلقائي يتبع إعدادات الهاتف.' : 'Automatique suit le réglage du téléphone.'}</small></div>
<select id="set-theme" aria-label="${ar ? 'السمة' : 'Thème'}"><option value="auto">${ar ? 'تلقائي' : 'Automatique'}</option><option value="light">${ar ? 'فاتح' : 'Clair'}</option><option value="dark">${ar ? 'داكن' : 'Sombre'}</option></select></div>`)}
${card(ar ? 'اللغة' : 'Langue', html`<div class="btn-row"><a class="btn sm${ar ? ' ghost' : ''}" href="${link('')}" lang="fr">Français</a><a class="btn sm${ar ? '' : ' ghost'}" href="${link('ar/')}" lang="ar">العربية</a></div>`)}
${card(ar ? 'القراءة بصوت مرتفع' : 'Lecture à voix haute', html`<p class="muted" id="set-tts-status"></p>
<div class="set-row"><div><strong>${ar ? 'الصوت الفرنسي' : 'Voix française'}</strong></div><select id="set-voice-fr" aria-label="${ar ? 'الصوت الفرنسي' : 'Voix française'}"></select></div>
<div class="set-row"><div><strong>${ar ? 'الصوت العربي' : 'Voix arabe'}</strong></div><select id="set-voice-ar" aria-label="${ar ? 'الصوت العربي' : 'Voix arabe'}"></select></div>
<div class="btn-row" style="margin-top:12px"><button class="btn sm ghost" type="button" data-tts-test="fr">${ar ? 'تجربة الفرنسية' : 'Tester la voix française'}</button><button class="btn sm ghost" type="button" data-tts-test="ar">${ar ? 'تجربة العربية' : 'Tester la voix arabe'}</button><button class="btn sm quiet" type="button" id="set-tts-open" hidden>${ar ? 'إعدادات النطق في أندرويد' : 'Réglages de synthèse vocale Android'}</button></div>
<p class="muted" style="font-size:var(--fs-sm);margin-top:10px">${ar ? 'السرعة والقراءة التلقائية واختيار قراءة الاقتراحات توجد في إعدادات التمرين.' : 'Vitesse, lecture automatique et lecture des propositions : dans les réglages de l’entraînement.'}</p>`)}
${card(ar ? 'التمرين' : 'Entraînement', html`<p>${ar ? 'النتائج والإحصائيات والمفضلة محفوظة على هاتفك فقط. يمكنك تصديرها أو استيرادها أو حذفها.' : 'Scores, statistiques et favoris sont enregistrés uniquement sur votre téléphone. Vous pouvez les exporter, les importer ou les effacer.'}</p>
<a class="btn sm" href="${link(pfx + 'entrainement/')}settings">${ar ? 'إعدادات التمرين والبيانات' : 'Réglages de l’entraînement et données'}</a>`)}
${card(ar ? 'الإعلانات والخصوصية' : 'Publicité et confidentialité', html`<p class="muted" id="set-ads-status"></p>
<div class="btn-row"><button class="btn sm" type="button" id="set-consent" hidden>${ar ? 'تعديل اختيارات الخصوصية' : 'Modifier mes choix de confidentialité'}</button><a class="btn sm ghost" href="${link(pfx + 'confidentialite/')}">${ar ? 'سياسة الخصوصية' : 'Politique de confidentialité'}</a></div>`)}
${card(ar ? 'حول التطبيق' : 'À propos', html`<p>${ar ? 'نسخة المحتوى:' : 'Version du contenu :'} <span id="set-version"></span></p>
<div class="btn-row"><a class="btn sm ghost" href="${link(pfx + 'a-propos/')}">${ar ? 'من نحن' : 'À propos'}</a><a class="btn sm ghost" href="${link(pfx + 'sources/')}">${ar ? 'المصادر' : 'Sources'}</a><a class="btn sm ghost" href="${link(pfx + 'contact/')}">${ar ? 'اتصل بنا' : 'Contact'}</a></div>
<p class="muted" style="font-size:var(--fs-sm);margin-top:10px">${t(lang, 'disclaimerShort')}</p>`)}
</div>`;
  return { path: `${key}index.html`, lang, title, description: title, alternate: `${ar ? '' : 'ar/'}app/parametres/`, init: 'settings', noSearch: true, body };
}

function privacyBody(lang) {
  const ar = lang === 'ar';
  const pfx = ar ? 'ar/' : '';
  const link = linker('');
  const key = `${pfx}confidentialite/`;
  const title = appPrivacyTitle(lang);
  return {
    title,
    body: html`${breadcrumb(lang, link, [[pfx, t(lang, 'home')], [key, ar ? 'الخصوصية' : 'Confidentialité']])}<div class="container narrow" style="padding-bottom:40px"><header class="page-head"><h1>${title}</h1></header>${appPrivacyContent(site, lang, link)}</div>`,
  };
}

/* ------------------------------------------------------------------ shell */
const HOME_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/></svg>';
const BACK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/></svg>';

function shellHtml(version) {
  const csp = [
    "default-src 'self' file: data: gap: https://ssl.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' file:",
    "img-src 'self' file: data: https:",
    "media-src 'self' data:",
    "connect-src 'self' file: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
  // [route key (French form), section for highlighting, fr, ar]
  const drawer = [
    ['', '', 'Accueil', 'الرئيسية'],
    ['concours/', 'navConcours', 'Concours', 'المباريات'],
    ['entrainement/', 'navPractice', 'Entraînement', 'التمرن'],
    ['outils/', 'navTools', 'Outils', 'أدوات'],
    ['outils/calendrier-concours/', '', 'Calendrier des concours', 'أجندة المباريات'],
    ['guides/', 'navGuides', 'Guides', 'أدلة'],
    ['qcm/', '', 'QCM corrigés', 'أسئلة مصححة'],
    null,
    ['app/parametres/', '', 'Paramètres', 'الإعدادات'],
    ['confidentialite/', '', 'Confidentialité', 'الخصوصية'],
    ['a-propos/', '', 'À propos', 'من نحن'],
    ['sources/', '', 'Sources', 'المصادر'],
    ['contact/', '', 'Contact', 'اتصل بنا'],
  ];
  const tabs = [
    ['', '', 'Accueil', 'الرئيسية', HOME_ICON],
    ['concours/', 'navConcours', 'Concours', 'المباريات', String(icon('building'))],
    ['entrainement/', 'navPractice', 'S’entraîner', 'التمرن', String(icon('play'))],
    ['outils/', 'navTools', 'Outils', 'أدوات', String(icon('calc'))],
    ['guides/', 'navGuides', 'Guides', 'أدلة', String(icon('book'))],
  ];
  const sec = (s) => (s ? ` data-section="${s}"` : '');
  const scripts = [
    'js/boot-guard.js', 'cordova.js', 'js/loader.js',
    'js/utils.js', 'js/storage.js', 'js/i18n.js', 'js/data-loader.js', 'js/tts-service.js',
    'js/ads-config.js', 'js/ads-service.js', 'js/stats.js', 'js/quiz-engine.js', 'js/ui.js', 'js/entrainement.js',
    'js/site.js', 'js/router.js', 'js/app.js',
  ];
  return `<!DOCTYPE html>
<!-- Concours Maroc — application Android (Apache Cordova). Généré par
     scripts/build-app.mjs (version ${version}) : ne pas modifier à la main. -->
<html lang="fr" dir="ltr" data-lang="fr" data-theme="light" data-app data-root="#/" data-asset-root="" data-search="data/search-{lang}.json" data-site-url="${site.siteUrl}/">
<head>
<meta charset="utf-8">
<!--
  Content Security Policy.
  - 'self' (https://localhost with cordova-android 10+) and file: (if the
    project uses AndroidInsecureFileModeEnabled) for every local file.
  - No inline script anywhere and no remote script: script-src has no
    'unsafe-inline'. Inline style attributes are allowed (progress bars…).
  - connect-src keeps https: open for the native AdMob SDK's WebView traffic;
    remove it if you ship the app without advertising.
-->
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">
<meta name="format-detection" content="telephone=no">
<meta name="msapplication-tap-highlight" content="no">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="${site.themeColor}">
<meta name="description" content="Guide des concours au Maroc après le bac, QCM corrigés, examens blancs et outils, utilisable hors ligne.">
<title>Concours Maroc</title>
<link rel="icon" href="img/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="css/app.css">
<script src="js/boot-theme.js"></script>
</head>
<body>
<header class="site-header app-header">
  <div class="container bar">
    <button class="hdr-btn app-back" type="button" id="app-back" hidden data-fr="Retour" data-ar="رجوع" data-label-attr="aria-label" aria-label="Retour">${BACK_ICON}</button>
    <a class="brand" href="#/" data-key="" aria-label="Concours Maroc">${logo(34)}<span>Concours <b>Maroc</b></span></a>
    <nav class="nav" id="site-nav" data-fr="Menu" data-ar="القائمة" data-label-attr="aria-label" aria-label="Menu">
      ${drawer.map((d) => (d ? `<a href="#/${d[0]}" data-key="${d[0]}"${sec(d[1])} data-fr="${d[2]}" data-ar="${d[3]}">${d[2]}</a>` : '<div class="nav-sep" role="separator"></div>')).join('\n      ')}
      <a class="lang-switch" id="app-lang" href="#/ar/" hreflang="ar" data-fr="العربية" data-ar="Français">العربية</a>
    </nav>
    <div class="hdr-tools">
      <div class="search-wrap">
        <button class="hdr-btn" type="button" id="search-btn" aria-expanded="false" aria-controls="search-panel" data-fr="Rechercher" data-ar="بحث" data-label-attr="aria-label" aria-label="Rechercher">${icon('search')}</button>
        <div class="search-panel" id="search-panel" role="search">
          <input id="search-input" type="search" autocomplete="off" data-fr="Concours, école, outil…" data-ar="مباراة، مدرسة، أداة…" data-label-attr="placeholder" placeholder="Concours, école, outil…">
          <ul class="search-results" id="search-results"></ul>
        </div>
      </div>
      <button class="hdr-btn" type="button" id="theme-btn" data-fr="Changer de thème" data-ar="تغيير السمة" data-label-attr="aria-label" aria-label="Changer de thème">${icon('moon')}</button>
      <button class="hdr-btn menu-btn" type="button" id="menu-btn" aria-expanded="false" aria-controls="site-nav" data-fr="Menu" data-ar="القائمة" data-label-attr="aria-label" aria-label="Menu">${icon('menu')}</button>
    </div>
  </div>
</header>
<div class="app-loading" id="app-loading" aria-hidden="true"><i></i></div>
<main id="view" class="app-view" tabindex="-1">
  <div class="app-boot">${String(logo(72)).replace('<svg ', '<svg class="logo" ')}<div class="spinner"></div><p>Chargement… · جارٍ التحميل…</p></div>
</main>
<nav class="tabbar" id="tabbar" data-fr="Navigation" data-ar="التنقل" data-label-attr="aria-label" aria-label="Navigation">
  ${tabs.map((b) => `<a href="#/${b[0]}" data-key="${b[0]}"${sec(b[1])}>${b[4]}<span data-fr="${b[2]}" data-ar="${b[3]}">${b[2]}</span></a>`).join('\n  ')}
</nav>
<!-- Advertising slot. In the APK the AdMob plugin shrinks the WebView above
     its banner, so this element only shows, in a desktop browser, where the
     banner goes. -->
<div id="ad-banner" aria-hidden="true"><span class="ad-mock">Publicité</span></div>
<div class="sheet-back" id="sheet"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<!-- cordova.js is added to the platform's www by the Cordova build; it does
     not exist in this folder (the 404 in a desktop browser is expected). -->
${scripts.map((s) => `<script src="${s}"></script>`).join('\n')}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ checks */
function checkLinks(where, markup, registry) {
  const problems = [];
  for (const m of markup.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const u = m[2];
    if (!u || /^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    if (u.startsWith('#/')) {
      let k = u.slice(2).split('#')[0].split('?')[0];
      const pm = k.match(/^((?:ar\/)?entrainement\/)/);
      if (pm) k = pm[1];
      if (!(k in registry)) problems.push(`${where}: route without page → ${u}`);
      continue;
    }
    if (u.startsWith('#')) continue;
    if (u === 'cordova.js') continue;
    const file = u.split(/[?#]/)[0];
    if (!fs.existsSync(path.join(OUT, file))) problems.push(`${where}: missing file → ${u}`);
  }
  if (/<script[\s>]/.test(markup) && where !== 'index.html') problems.push(`${where}: inline <script> in a page fragment`);
  if (/\son[a-z]+="/i.test(markup)) problems.push(`${where}: inline event handler (blocked by the CSP)`);
  return problems;
}

/* ------------------------------------------------------------------ main */
async function main() {
  const t0 = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const all = await loadConcours();
  const banks = loadQuestionBanks(path.join(ROOT, 'content/questions'));

  // Pages of the website, rendered with app links.
  const pages = [];
  for (const lang of site.languages) {
    pages.push(buildHome(site, all, lang, banks));
    pages.push(buildDirectory(site, all, lang));
    for (const c of all) pages.push(buildGuide(site, c, lang, all));
    pages.push(...buildToolsPages(site, all, lang));
    pages.push(buildPracticePage(site, all, lang, banks));
    pages.push(...buildQcmPages(site, all, lang, banks));
    pages.push(...(await buildGuidesPages(site, all, lang, ROOT)));
    pages.push(...buildStaticPages(site, all, lang, banks));
    pages.push(settingsPage(lang));
  }
  // 404 and offline are website-only; the app's own policy replaces confidentialite/,
  // so its public copy (application/confidentialite/) is not needed in the app.
  const appPages = pages.filter(Boolean).filter((p) => !/(^|\/)(404|offline)\.html$|^(ar\/)?application\//.test(p.path));
  for (const p of appPages) {
    if (/^(ar\/)?confidentialite\/index\.html$/.test(p.path)) Object.assign(p, privacyBody(p.lang));
  }

  // Registry: route key -> fragment, title, language, scripts, flags.
  const keyOf = (p) => p.path.replace(/index\.html$/, '');
  const registry = {};
  for (const p of appPages) registry[keyOf(p)] = true;
  const pagesJson = { v: '', pages: {} };
  for (const p of appPages) {
    const key = keyOf(p);
    const alt = p.alternate && registry[p.alternate.replace(/index\.html$/, '')] ? p.alternate.replace(/index\.html$/, '') : null;
    const practice = /(^|\/)entrainement\/index\.html$/.test(p.path);
    const entry = {
      f: `pages/${p.path}`,
      t: p.title,
      l: p.lang,
      n: p.section || '',
      a: alt,
      s: practice ? [] : (p.scripts || []).map(appAsset),
    };
    if (practice) entry.p = 1;
    if (p.init) entry.i = p.init;
    pagesJson.pages[key] = entry;
  }

  // Static assets with the first version's file names.
  write('css/app.css', [read('src/css/concours-maroc.css'), read('src/css/entrainement.css'), read('src/app/shell.css')].join('\n\n'));
  const js = {
    'js/boot-theme.js': 'src/app/js/boot-theme.js',
    'js/boot-guard.js': 'src/app/js/boot-guard.js',
    'js/loader.js': 'src/app/js/loader.js',
    'js/utils.js': 'src/js/entrainement/utils.js',
    'js/storage.js': 'src/js/entrainement/storage.js',
    'js/i18n.js': 'src/js/entrainement/i18n.js',
    'js/data-loader.js': 'src/js/entrainement/data-loader.js',
    'js/tts-service.js': 'src/app/js/tts-service.js',
    'js/ads-config.js': 'src/app/js/ads-config.js',
    'js/ads-service.js': 'src/app/js/ads-service.js',
    'js/stats.js': 'src/js/entrainement/stats.js',
    'js/quiz-engine.js': 'src/js/entrainement/quiz-engine.js',
    'js/ui.js': 'src/js/entrainement/ui.js',
    'js/entrainement.js': 'src/js/entrainement/app.js',
    'js/site.js': 'src/js/site.js',
    'js/router.js': 'src/app/js/router.js',
    'js/app.js': 'src/app/js/app.js',
    'js/echeances.js': 'src/js/echeances.js',
    'js/annuaire.js': 'src/js/annuaire.js',
  };
  for (const [to, from] of Object.entries(js)) copy(from, to);
  for (const f of fs.readdirSync(path.join(ROOT, 'src/js/outils'))) copy(`src/js/outils/${f}`, `js/outils/${f}`);
  for (const f of fs.readdirSync(path.join(ROOT, 'src/app/img'))) copy(`src/app/img/${f}`, `img/${f}`);
  copy('src/app/fonts/README.md', 'fonts/README.md');

  // Data, translations, search indexes.
  const { files: data, manifest } = dataFiles(site, all, banks, ROOT);
  for (const [rel, content] of Object.entries(data)) write(rel, content);
  for (const f of fs.readdirSync(path.join(ROOT, 'src/i18n'))) copy(`src/i18n/${f}`, `i18n/${f}`);
  for (const lang of site.languages) write(`data/search-${lang}.json`, searchIndex(appPages, lang));

  // Page fragments.
  for (const p of appPages) write(`pages/${p.path}`, String(p.body).trim() + '\n');

  // Version = hash of everything generated so far.
  const h = crypto.createHash('sha256');
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full); else h.update(fs.readFileSync(full));
    }
  })(OUT);
  const version = `${site.updated}-${h.digest('hex').slice(0, 8)}`;
  pagesJson.v = version;
  write('data/pages.json', JSON.stringify(pagesJson));
  const shell = shellHtml(version);
  write('index.html', shell);

  // Link checks (fail the build on any broken route or file).
  const problems = [...checkLinks('index.html', shell, pagesJson.pages)];
  for (const p of appPages) problems.push(...checkLinks(`pages/${p.path}`, String(p.body), pagesJson.pages));
  for (const [key, e] of Object.entries(pagesJson.pages)) {
    for (const s of e.s) if (!fs.existsSync(path.join(OUT, s))) problems.push(`${key}: missing script ${s}`);
  }
  if (problems.length) {
    console.error(problems.slice(0, 40).join('\n'));
    throw new Error(`${problems.length} link problem(s) in the app build`);
  }

  // Fallback bundle for file:// previews (loaded only when fetch and XHR fail).
  const bundle = {};
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      const rel = path.relative(OUT, full).split(path.sep).join('/');
      if (e.isDirectory()) { walk(full); continue; }
      if (/^(data|i18n)\/.*\.json$/.test(rel)) bundle[rel] = JSON.parse(fs.readFileSync(full, 'utf8'));
      else if (/^pages\/.*\.html$/.test(rel)) bundle[rel] = fs.readFileSync(full, 'utf8');
    }
  })(OUT);
  write('js/data-bundle.js', `/* Generated by scripts/build-app.mjs (${version}) — do not edit.\n   Copy of data/, i18n/ and pages/, used only when the app is opened from a\n   file:// URL where fetch() and XHR are refused (desktop preview). */\nwindow.CM_DATA_BUNDLE = ${JSON.stringify(bundle)};\n`);

  // Zip with the same top-level folder as the first version (www/). Sorted
  // entries and a fixed date: the same content always gives the same zip,
  // which is committed in cordova/ next to the build notes.
  const zipName = 'www_concours_maroc.zip';
  const entries = [];
  (function walk(rel) {
    for (const e of fs.readdirSync(path.join(DIST, rel), { withFileTypes: true })) {
      const r = rel + '/' + e.name;
      if (e.isDirectory()) walk(r); else entries.push(r);
    }
  })('www');
  entries.sort();
  const stamp = new Date(`${site.updated}T12:00:00Z`);
  for (const r of entries) fs.utimesSync(path.join(DIST, r), stamp, stamp);
  execFileSync('zip', ['-q', '-X', '-D', zipName, '-@'], { cwd: DIST, input: entries.join('\n') + '\n', env: { ...process.env, TZ: 'UTC' } });
  fs.copyFileSync(path.join(DIST, zipName), path.join(ROOT, 'cordova', zipName));
  for (const f of ['config.xml.exemple', 'LISEZMOI-ANDROID.md']) {
    if (fs.existsSync(path.join(ROOT, 'cordova', f))) fs.copyFileSync(path.join(ROOT, 'cordova', f), path.join(DIST, f));
  }

  const size = (p) => { let n = 0; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else n += fs.statSync(f).size; } })(p); return n; };
  const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
  console.log(`App www: ${appPages.length} pages, ${manifest.totalQuestions} questions, ${mb(size(OUT))} (zip ${mb(fs.statSync(path.join(DIST, zipName)).size)}), version ${version}, ${Date.now() - t0} ms`);
  console.log(`  → ${path.relative(ROOT, path.join(DIST, zipName))}, copied to cordova/${zipName}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

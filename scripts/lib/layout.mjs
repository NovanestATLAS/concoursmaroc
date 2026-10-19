/* Page shell: <head> (SEO, social, structured data), header, footer. */
import { html, raw, esc } from './html.mjs';
import { icon, logo } from './icons.mjs';
import { t } from './strings.mjs';
import { appBadge } from './pages/app-landing.mjs';

/* Relative prefix from a page (site-relative output path) to the site root. */
export function rootOf(pagePath) {
  const clean = pagePath.replace(/index\.html$/, '').replace(/[^/]+\.html$/, '');
  const depth = clean.split('/').filter(Boolean).length;
  return depth === 0 ? './' : '../'.repeat(depth);
}

/* Link mode. "site" (default): relative links between static pages.
 * "app" (Cordova build, scripts/build-app.mjs): every page is a route of the
 * single-page shell ("#/concours/ensa/") and assets are addressed from the
 * www root with the folder names of the app (css/, js/, img/, data/, i18n/). */
let LINK_MODE = 'site';
export function setLinkMode(mode) { LINK_MODE = mode; }
export function linkMode() { return LINK_MODE; }

/* Link to a screen of the trainer ('' = its home, 'mock', 'setup'…), optionally
   for one concours. Website: entrainement/?concours=ensa#/mock; app (routes of
   the shell): #/entrainement/mock?concours=ensa. */
export function practiceHref(link, pfx, screen = '', concours = '') {
  const q = concours ? `?concours=${concours}` : '';
  const base = link(`${pfx}entrainement/`);
  return LINK_MODE === 'app' ? `${base}${screen}${q}` : `${base}${q}${screen ? `#/${screen}` : ''}`;
}

const APP_ASSET_MAP = [
  [/^assets\/css\//, 'css/'],
  [/^assets\/js\//, 'js/'],
  [/^assets\/img\//, 'img/'],
  [/^assets\/search-/, 'data/search-'],
  [/^data\/i18n\//, 'i18n/'],
];
export function appAsset(target) {
  const t = String(target || '').replace(/^\//, '');
  for (const [re, rep] of APP_ASSET_MAP) if (re.test(t)) return t.replace(re, rep);
  return t;
}
export function isAssetPath(target) {
  const p = String(target || '').replace(/^\//, '').split(/[?#]/)[0];
  if (/^(assets|data)\//.test(p)) return true;
  if (/\.html$/.test(p)) return false;
  return /\.[a-z0-9]+$/i.test(p);
}

/* Builds a relative link from the current page to a site-relative target. */
export function linker(pagePath) {
  if (LINK_MODE === 'app') {
    return (target) => {
      const tgt = String(target || '').replace(/^\//, '');
      if (isAssetPath(tgt)) return appAsset(tgt);
      return '#/' + tgt.replace(/index\.html(?=$|[?#])/, '');
    };
  }
  const root = rootOf(pagePath);
  return (target) => {
    const tgt = String(target || '').replace(/^\//, '');
    const out = (root === './' ? '' : root) + tgt;
    return out === '' ? './' : out;
  };
}

export function basePath(site) {
  const p = new URL(site.siteUrl + '/').pathname;
  return p.endsWith('/') ? p : p + '/';
}

function absUrl(site, path) {
  const p = String(path || '').replace(/^\//, '').replace(/index\.html$/, '');
  return `${site.siteUrl}/${p}`;
}

const NAV = {
  fr: [
    ['concours/', 'navConcours'],
    ['entrainement/', 'navPractice'],
    ['outils/', 'navTools'],
    ['outils/calendrier-concours/', 'navCalendar'],
    ['guides/', 'navGuides'],
    ['contact/', 'navContact'],
  ],
  ar: [
    ['ar/concours/', 'navConcours'],
    ['ar/entrainement/', 'navPractice'],
    ['ar/outils/', 'navTools'],
    ['ar/outils/calendrier-concours/', 'navCalendar'],
    ['ar/guides/', 'navGuides'],
    ['ar/contact/', 'navContact'],
  ],
};

function header(lang, link, page) {
  const nav = NAV[lang] || NAV.fr;
  const altHref = page.alternate ? link(page.alternate) : link(lang === 'ar' ? '' : 'ar/');
  const homeHref = link(lang === 'ar' ? 'ar/' : '');
  return html`<header class="site-header">
  <div class="container bar">
    <a class="brand" href="${homeHref}" aria-label="Concours Maroc — ${t(lang, 'home')}">${logo(34)}<span>Concours <b>Maroc</b></span></a>
    <nav class="nav" id="site-nav" aria-label="${lang === 'ar' ? 'التنقل الرئيسي' : 'Navigation principale'}">
      ${nav.map(([href, key]) => html`<a href="${link(href)}"${page.section === key ? raw(' aria-current="page"') : ''}>${t(lang, key)}</a>`)}
      <a class="lang-switch" href="${altHref}" hreflang="${lang === 'ar' ? 'fr' : 'ar'}" lang="${lang === 'ar' ? 'fr' : 'ar'}" title="${t(lang, 'langSwitchLabel')}">${t(lang, 'langSwitch')}</a>
    </nav>
    <div class="hdr-tools">
      <div class="search-wrap">
        <button class="hdr-btn" type="button" id="search-btn" aria-expanded="false" aria-controls="search-panel" aria-label="${t(lang, 'search')}">${icon('search')}</button>
        <div class="search-panel" id="search-panel" role="search">
          <label class="visually-hidden" for="search-input">${t(lang, 'search')}</label>
          <input id="search-input" type="search" autocomplete="off" placeholder="${t(lang, 'searchPlaceholder')}">
          <ul class="search-results" id="search-results"></ul>
        </div>
      </div>
      <button class="hdr-btn" type="button" id="theme-btn" aria-label="${t(lang, 'theme')}">${icon('moon')}</button>
      <button class="hdr-btn menu-btn" type="button" id="menu-btn" aria-expanded="false" aria-controls="site-nav" aria-label="${t(lang, 'menu')}">${icon('menu')}</button>
    </div>
  </div>
</header>`;
}

function footer(lang, link, site, footerLinks) {
  const p = lang === 'ar' ? 'ar/' : '';
  const col = (title, items) => html`<div><h2>${title}</h2><ul>${items.map(([href, label]) => html`<li><a href="${link(href)}">${label}</a></li>`)}</ul></div>`;
  return html`<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="${link(p)}">${logo(32)}<span>Concours <b>Maroc</b></span></a>
        <p>${t(lang, 'footerAbout')}</p>
        ${appBadge(site, lang, link)}
      </div>
      ${col(t(lang, 'footerConcours'), footerLinks.postbac)}
      ${col(t(lang, 'footerSecurity'), footerLinks.niveauBac)}
      ${col(t(lang, 'footerTools'), footerLinks.tools)}
      ${col(t(lang, 'footerSite'), [
        [`${p}a-propos/`, t(lang, 'about')],
        [`${p}sources/`, t(lang, 'sourcesPage')],
        [`${p}contact/`, t(lang, 'contact')],
        [`${p}confidentialite/`, t(lang, 'privacy')],
        [`${p}mentions-legales/`, t(lang, 'legal')],
      ])}
    </div>
    <div class="footer-bottom">
      <span>© ${site.updated.slice(0, 4)} Concours Maroc · ${t(lang, 'rights')} ${t(lang, 'notAffiliated')}</span>
      <span>${t(lang, 'disclaimerShort')}</span>
    </div>
  </div>
</footer>`;
}

/* page = {
 *   path: 'concours/ensa/index.html', lang, title, description, h1?,
 *   alternate: 'ar/concours/ensa/' (site-relative path of the other language),
 *   section: 'navConcours', jsonld: [objects], body: Raw, scripts: ['assets/js/x.js'],
 *   styles: ['assets/css/x.css'], ogImage: 'assets/og/x.png', noindex, type: 'article'|'website',
 *   noAds (no AdSense script: AdSense allows no ads on pages without content)
 * } */
export function layout(site, page, footerLinks) {
  const lang = page.lang || 'fr';
  const root = page.absolute ? basePath(site) : rootOf(page.path);
  const link = page.absolute ? ((target) => root + String(target || '').replace(/^\//, '')) : linker(page.path);
  const canonical = absUrl(site, page.path);
  const altLang = lang === 'ar' ? 'fr' : 'ar';
  const altUrl = page.alternate ? absUrl(site, page.alternate) : null;
  const frUrl = lang === 'fr' ? canonical : altUrl;
  const ogImage = absUrl(site, page.ogImage || 'assets/img/og/concours-maroc.png');
  // The brand is appended only when it still fits in what search results display.
  const fullTitle = page.titleFull || (page.title.includes('Concours Maroc') || page.title.length > 52 ? page.title : `${page.title} | Concours Maroc`);
  const jsonld = (page.jsonld || []).filter(Boolean);

  const themeInit = `(function(){try{var t=localStorage.getItem('cm.theme');if(!t||t==='auto'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

  const ga = site.ga4 ? raw(`<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.ga4)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(site.ga4)}');</script>`) : '';
  const ads = site.adsenseClient && !page.noAds ? raw(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(site.adsenseClient)}" crossorigin="anonymous"></script>`) : '';

  return `<!DOCTYPE html>
${html`<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" data-root="${root}" data-lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${fullTitle}</title>
<meta name="description" content="${page.description}">
${page.noindex ? raw('<meta name="robots" content="noindex, follow">') : raw('<meta name="robots" content="index, follow, max-image-preview:large">')}
<link rel="canonical" href="${canonical}">
${altUrl ? html`<link rel="alternate" hreflang="${lang}" href="${canonical}">
<link rel="alternate" hreflang="${altLang}" href="${altUrl}">
<link rel="alternate" hreflang="x-default" href="${frUrl}">` : html`<link rel="alternate" hreflang="${lang}" href="${canonical}">`}
<meta name="theme-color" content="${site.themeColor}">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="${page.type === 'article' ? 'article' : 'website'}">
<meta property="og:site_name" content="Concours Maroc">
<meta property="og:locale" content="${lang === 'ar' ? 'ar_MA' : 'fr_MA'}">
<meta property="og:title" content="${page.ogTitle || page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${page.type === 'article' ? html`<meta property="article:modified_time" content="${page.updated || site.updated}">` : ''}
${site.googleSiteVerification ? html`<meta name="google-site-verification" content="${site.googleSiteVerification}">` : ''}
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${root}favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="manifest" href="${root}manifest.webmanifest">
<link rel="preload" href="${root}assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
${lang === 'ar' ? html`<link rel="preload" href="${root}assets/fonts/readex-pro-arabic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>` : ''}
<link rel="stylesheet" href="${root}assets/css/concours-maroc.css?v=${site.assetVersion || '1'}">
${(page.styles || []).map((s) => html`<link rel="stylesheet" href="${root}${s}?v=${site.assetVersion || '1'}">`)}
<script>${raw(themeInit)}</script>
${jsonld.map((o) => raw(`<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`))}
${ga}${ads}
</head>
<body${page.bodyClass ? raw(` class="${esc(page.bodyClass)}"`) : ''}>
<a class="skip-link" href="#main">${t(lang, 'skip')}</a>
${header(lang, link, page)}
<main id="main">
${page.body}
</main>
${footer(lang, link, site, footerLinks[lang] || footerLinks.fr)}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="${root}assets/js/site.js?v=${site.assetVersion || '1'}" defer></script>
${(page.scripts || []).map((s) => html`<script src="${root}${s}?v=${site.assetVersion || '1'}" defer></script>`)}
</body>
</html>`}
`;
}

export function breadcrumb(lang, link, items) {
  return html`<nav class="breadcrumb container" aria-label="${lang === 'ar' ? 'مسار التصفح' : "Fil d'Ariane"}"><ol>
${items.map(([href, label], i) => html`<li>${i < items.length - 1 ? html`<a href="${link(href)}">${label}</a>` : html`<span aria-current="page">${label}</span>`}</li>`)}
</ol></nav>`;
}

export function breadcrumbLd(site, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([href, label], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: label,
      item: `${site.siteUrl}/${String(href).replace(/^\//, '')}`,
    })),
  };
}

export function faqLd(faq, lang) {
  if (!faq || !faq.length) return null;
  const strip = (s) => String(s).replace(/\*\*|\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: strip(f.q),
      acceptedAnswer: { '@type': 'Answer', text: strip(f.a) },
    })),
  };
}

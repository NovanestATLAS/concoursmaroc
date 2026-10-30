/* Funnel from the website to the Android app on Google Play.
 *
 * Website only: every block returns '' in the Cordova build (linkMode() ===
 * 'app') and while site.androidApp.status is not 'live'.
 *
 * Every store link carries
 *   - a campaign: referrer=utm_source=<domain>&utm_medium=website&utm_campaign=<where>
 *     (Play Console → acquisition reports, "UTM campaign"), and hl=<page language>;
 *   - data-app-cta="<where>": src/js/site.js sends the GA4 event
 *     "app_store_click" { placement, page_lang } (website only);
 *   - data-google-vignette="false": no AdSense vignette between the click and
 *     Google Play;
 *   - the class "play-only": hidden on iPhone and iPad (no Android app there).
 * The head of every page sets is-android / is-ios / appbanner-off on <html>
 * before the first paint (layout.mjs), so the Android banner never shifts the page. */
import { html, inline } from './html.mjs';
import { icon } from './icons.mjs';
import { linkMode } from './layout.mjs';

export const QR_FILE = 'assets/img/app/qr-google-play.svg';
export const ICON_FILE = 'assets/img/app/icone-application-192.webp';
/* Store screenshots shown on the site (src/img/app/<lang>-<name>.webp, from
   the Google Play package): name, then caption FR / AR. */
export const SHOTS = [
  ['02-fiche-concours', 'Chaque concours en détail', 'كل مباراة بالتفصيل'],
  ['03-question-corrigee', 'Des QCM corrigés et expliqués', 'أسئلة مصححة ومشروحة'],
  ['04-examen-blanc', 'Des examens blancs chronométrés', 'امتحانات تجريبية بتوقيت محدد'],
  ['05-resultats', 'Vos progrès et vos points faibles', 'تقدمك ونقط ضعفك'],
  ['06-entrainement', 'Un entraînement à votre mesure', 'تمرين على مقاسك'],
  ['07-calcul-note-bac', 'Les outils du site, hors ligne', 'أدوات الموقع بدون إنترنت'],
];

export const APP_TXT = {
  fr: {
    store: 'Télécharger sur Google Play',
    storeShort: 'Télécharger l’app',
    nav: 'Télécharger l’app',
    free: 'Gratuite sur Google Play',
    install: 'Installer',
    close: 'Fermer',
    bannerSub: 'Gratuite · fonctionne sans internet',
    discover: 'Découvrir l’application',
    qr: 'Scannez ce code avec votre téléphone Android pour ouvrir l’application sur Google Play.',
    qrShort: 'Scannez avec votre téléphone Android',
    qrAlt: 'Code QR : l’application Concours Maroc sur Google Play',
    iconAlt: 'Icône de l’application Concours Maroc',
    note: 'Gratuite · sans compte · Android 7.0 ou plus récent',
    pill: 'Nouveau : l’application Android est disponible',
    pillOld: 'L’application Android est disponible',
    genericH: 'Concours Maroc sur Android',
    genericP: 'Les fiches, les QCM corrigés et les examens blancs dans une application gratuite qui fonctionne sans internet.',
    ficheH: (s) => `Révisez ${s} sur votre téléphone`,
    ficheP: 'Cette fiche, les QCM corrigés et l’examen blanc dans l’application gratuite, même sans connexion.',
    practiceLine: 'Aussi dans l’application Android, sans connexion :',
    practiceLink: 'télécharger sur Google Play',
    calH: 'Ne ratez plus aucune date',
    calP: 'Activez les alertes concours dans l’application Android gratuite : une notification quand des inscriptions ouvrent ou qu’une date approche.',
    trainH: 'Le même entraînement, dans votre poche',
    trainP: 'Dans l’application Android, les QCM et les examens blancs fonctionnent sans connexion, avec la lecture à voix haute des questions.',
    resultsH: 'Continuez sur votre téléphone',
    resultsP: 'Révisez hors ligne avec l’application gratuite : les mêmes QCM, les examens blancs et la lecture à voix haute.',
    qcmH: 'Ces QCM, aussi sans connexion',
    qcmP: 'Toutes les questions de cette matière et des examens blancs dans l’application Android gratuite.',
    bandEyebrow: 'Application Android',
    bandH: 'Tous les concours dans votre poche, même sans internet',
    bandItems: (nc, nq) => [
      `**${nc} fiches concours** et **${nq} QCM corrigés**, en français et en arabe`,
      '**Examens blancs chronométrés** au format de chaque concours',
      '**Hors ligne** : tout fonctionne sans connexion une fois l’application installée',
      '**Lecture à voix haute** des questions et des corrections',
      '**Alertes concours** facultatives : une notification quand des inscriptions ouvrent',
    ],
    faqQ: 'Existe-t-il une application Concours Maroc ?',
    faqA: 'Oui. L’application Android gratuite Concours Maroc est disponible sur Google Play : elle reprend les fiches, les QCM corrigés, les examens blancs et les outils du site, en français et en arabe, et fonctionne sans connexion. Elle n’existe pas sur iPhone : sur iOS, utilisez le site.',
  },
  ar: {
    store: 'حمّل التطبيق من Google Play',
    storeShort: 'حمّل التطبيق',
    nav: 'حمّل التطبيق',
    free: 'مجاني على Google Play',
    install: 'تثبيت',
    close: 'إغلاق',
    bannerSub: 'مجاني · يعمل بدون إنترنت',
    discover: 'اكتشف التطبيق',
    qr: 'امسح هذا الرمز بهاتفك الأندرويد لفتح التطبيق على Google Play.',
    qrShort: 'امسح الرمز بهاتفك الأندرويد',
    qrAlt: 'رمز QR: تطبيق Concours Maroc على Google Play',
    iconAlt: 'أيقونة تطبيق Concours Maroc',
    note: 'مجاني · بدون حساب · أندرويد 7.0 أو أحدث',
    pill: 'جديد: تطبيق أندرويد متوفر الآن',
    pillOld: 'تطبيق أندرويد متوفر',
    genericH: 'Concours Maroc على أندرويد',
    genericP: 'البطاقات والأسئلة المصححة والامتحانات التجريبية في تطبيق مجاني يعمل بدون إنترنت.',
    ficheH: (s) => `راجع ${s} على هاتفك`,
    ficheP: 'هذه البطاقة والأسئلة المصححة والامتحان التجريبي في التطبيق المجاني، حتى بدون اتصال.',
    practiceLine: 'متوفر أيضًا في تطبيق أندرويد، بدون إنترنت:',
    practiceLink: 'التحميل من Google Play',
    calH: 'لا تفوّت أي موعد',
    calP: 'فعّل تنبيهات المباريات في تطبيق أندرويد المجاني: إشعار عند فتح التسجيل أو اقتراب موعد.',
    trainH: 'نفس التمرين، في جيبك',
    trainP: 'في تطبيق أندرويد، تعمل الأسئلة والامتحانات التجريبية بدون اتصال، مع قراءة الأسئلة بصوت مرتفع.',
    resultsH: 'تابع على هاتفك',
    resultsP: 'راجع بدون إنترنت مع التطبيق المجاني: نفس الأسئلة والامتحانات التجريبية والقراءة بصوت مرتفع.',
    qcmH: 'هذه الأسئلة، بدون إنترنت أيضًا',
    qcmP: 'كل أسئلة هذه المادة والامتحانات التجريبية في تطبيق أندرويد المجاني.',
    bandEyebrow: 'تطبيق أندرويد',
    bandH: 'كل المباريات في جيبك، حتى بدون إنترنت',
    bandItems: (nc, nq) => [
      `**${nc} بطاقة مباراة** و**${nq} سؤالًا مصححًا**، بالعربية والفرنسية`,
      '**امتحانات تجريبية موقتة** بصيغة كل مباراة',
      '**بدون إنترنت**: كل شيء يعمل بدون اتصال بعد تثبيت التطبيق',
      '**قراءة بصوت مرتفع** للأسئلة والتصحيحات',
      '**تنبيهات المباريات** اختيارية: إشعار عند فتح التسجيل',
    ],
    faqQ: 'هل يوجد تطبيق Concours Maroc؟',
    faqA: 'نعم. تطبيق Concours Maroc المجاني متوفر على Google Play لهواتف أندرويد: يتضمن بطاقات المباريات والأسئلة المصححة والامتحانات التجريبية وأدوات الموقع، بالعربية والفرنسية، ويعمل بدون إنترنت. لا يوجد على آيفون: استعمل الموقع على iOS.',
  },
};

const X = (lang) => APP_TXT[lang] || APP_TXT.fr;

/* The funnel is on: live app, website build. */
export function appLive(site) {
  return !!(site.androidApp && site.androidApp.status === 'live' && linkMode() !== 'app');
}

/* Google Play listing, without tracking (structured data, canonical mentions). */
export function storeUrl(site) {
  return `https://play.google.com/store/apps/details?id=${site.androidApp.id}`;
}

/* Google Play listing with the campaign of the link and the page language. */
export function playUrl(site, campaign, lang) {
  const source = String(site.customDomain || new URL(site.siteUrl).host).replace(/^www\./, '');
  const ref = `utm_source=${source}&utm_medium=website&utm_campaign=${campaign}&utm_content=${lang}`;
  return `${storeUrl(site)}&hl=${lang}&referrer=${encodeURIComponent(ref)}`;
}

/* Every store link: campaign, GA4 placement, no AdSense vignette, hidden on iOS. */
export function storeLink(site, lang, campaign, cls, content) {
  return html`<a class="${cls} play-only" href="${playUrl(site, campaign, lang)}" data-app-cta="${campaign}" data-google-vignette="false" rel="noopener">${content}</a>`;
}

export function storeButton(site, lang, campaign, { cls = 'btn', label } = {}) {
  return storeLink(site, lang, campaign, `${cls} store-btn`, html`${icon('download')}<span>${label || X(lang).store}</span>`);
}

export function qrImg(link, lang, size = 132) {
  return html`<img class="app-qr" src="${link(QR_FILE)}" width="${size}" height="${size}" alt="${X(lang).qrAlt}" loading="lazy" decoding="async">`;
}

export function appIcon(link, lang, size = 56, alt = false) {
  return html`<img class="app-ico" src="${link(ICON_FILE)}" width="${size}" height="${size}" alt="${alt ? X(lang).iconAlt : ''}" loading="lazy" decoding="async">`;
}

export function shotImg(link, lang, name, alt, { eager = false, cls = 'app-shot' } = {}) {
  return html`<img class="${cls}" src="${link(`assets/img/app/${lang}-${name}.webp`)}" width="540" height="960" alt="${alt}" ${eager ? '' : html`loading="lazy" `}decoding="async">`;
}

/* ------------------------------------------------------------- site-wide */

/* Header button (desktop navigation; first item of the menu on phones). */
export function navCta(site, lang) {
  if (!appLive(site)) return '';
  return storeLink(site, lang, 'header', 'nav-app', html`${icon('download')}<span>${X(lang).nav}</span>`);
}

/* Android "smart banner" above the header, closed for 14 days with ×. */
export function appBanner(site, lang, link) {
  if (!appLive(site)) return '';
  const x = X(lang);
  return html`<div class="app-banner no-print" id="app-banner" role="region" aria-label="${x.genericH}">
<div class="container ab-row">
<button class="ab-close" type="button" data-appbanner-close aria-label="${x.close}">×</button>
${appIcon(link, lang, 44)}
<div class="ab-text"><b>Concours Maroc</b><span>${x.bannerSub}</span></div>
${storeLink(site, lang, 'banner', 'ab-btn', x.install)}
</div></div>`;
}

/* Footer: link straight to the store. */
export function footerStore(site, lang) {
  if (!appLive(site)) return '';
  return storeLink(site, lang, 'footer', 'app-badge live', html`${icon('download')}<span>${X(lang).free}</span>`);
}

/* ------------------------------------------------------------- blocks */

/* Side card (desktop): icon, text, QR code, button. With cls 'head-app' it
   sits in the right column of the page header (.page-head.with-app), in view
   as soon as the page opens. */
export function asideCard(site, lang, link, { campaign, h, p, cls = '' }) {
  if (!appLive(site)) return '';
  const x = X(lang);
  return html`<div class="app-card aside-app play-only no-print only-desktop${cls ? ` ${cls}` : ''}">
<div class="ac-top">${appIcon(link, lang, 48)}<h3>${h || x.genericH}</h3></div>
<p>${p || x.genericP}</p>
<div class="ac-qr">${qrImg(link, lang, 112)}<small>${x.qrShort}</small></div>
${storeButton(site, lang, campaign, { cls: 'btn sm block' })}
</div>`;
}

/* Card inside the content: icon, text, button (and the QR code on wide screens). */
export function inlineCard(site, lang, link, { campaign, h, p, mobileOnly = false, qr = true }) {
  if (!appLive(site)) return '';
  const x = X(lang);
  return html`<aside class="app-card inline-app play-only no-print${mobileOnly ? ' only-mobile' : ''}" aria-label="${x.genericH}">
${appIcon(link, lang, 56)}
<div class="ia-body"><h3>${h || x.genericH}</h3><p>${p || x.genericP}</p>
<div class="btn-row">${storeButton(site, lang, campaign, { cls: 'btn sm' })}<a class="ia-more" href="${link((lang === 'ar' ? 'ar/' : '') + 'application/')}">${x.discover}</a></div></div>
${qr ? html`<div class="ia-qr only-desktop">${qrImg(link, lang, 96)}</div>` : ''}
</aside>`;
}

/* One line under the "practice" box of a concours page. */
export function practiceLine(site, lang) {
  if (!appLive(site)) return '';
  const x = X(lang);
  return html`<p class="practice-app play-only">${icon('phone')} <span>${x.practiceLine} ${storeLink(site, lang, 'fiche-entrainement', 'pa-link', x.practiceLink)}</span></p>`;
}

/* Home page: pill above the title of the hero. */
export function heroPill(site, lang, link) {
  if (!appLive(site)) return '';
  const x = X(lang);
  const since = site.androidApp.since ? Date.parse(site.androidApp.since) : 0;
  const fresh = since && Date.parse(site.updated) - since < 60 * 864e5;
  const text = fresh ? x.pill.replace(/^[^:]+:\s*/, '') : x.pillOld;
  return html`<a class="app-pill play-only" href="${link((lang === 'ar' ? 'ar/' : '') + 'application/')}">${fresh ? html`<b>${lang === 'ar' ? 'جديد' : 'Nouveau'}</b>` : ''}<span>${text.charAt(0).toUpperCase() + text.slice(1)}</span>${icon('arrow')}</a>`;
}

/* Home page and practice page: the big band (screenshot, QR code, benefits). */
export function appBand(site, lang, link, { campaign, nc, nq, h, items, eyebrow }) {
  if (!appLive(site)) return '';
  const x = X(lang);
  const list = items || x.bandItems(nc, nq);
  return html`<section class="app-band no-print play-only" aria-labelledby="app-band-h"><div class="container ab-grid">
<div class="ab-copy">
<span class="eyebrow">${eyebrow || x.bandEyebrow}</span>
<h2 id="app-band-h">${h || x.bandH}</h2>
<ul class="ab-list">${list.map((s) => html`<li>${icon('check')}<span>${inline(s)}</span></li>`)}</ul>
<div class="btn-row">${storeButton(site, lang, campaign)}<a class="btn ghost" href="${link((lang === 'ar' ? 'ar/' : '') + 'application/')}">${x.discover}</a></div>
<p class="ab-note">${x.note}</p>
</div>
<div class="ab-art">
<div class="phone">${shotImg(link, lang, '04-examen-blanc', lang === 'ar' ? 'لقطة شاشة من التطبيق: امتحان تجريبي' : 'Capture de l’application : un examen blanc')}</div>
<div class="ab-qr only-desktop">${qrImg(link, lang, 120)}<small>${x.qrShort}</small></div>
</div>
</div></section>`;
}

/* Structured data of the app (home page and application/). */
export function appJsonLd(site, lang, extra = {}) {
  if (!site.androidApp || site.androidApp.status !== 'live') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Concours Maroc - QCM corrigés',
    alternateName: 'Concours Maroc',
    operatingSystem: 'Android 7.0+',
    applicationCategory: 'EducationalApplication',
    inLanguage: ['fr', 'ar'],
    url: `${site.siteUrl}/${lang === 'ar' ? 'ar/' : ''}application/`,
    installUrl: storeUrl(site),
    downloadUrl: storeUrl(site),
    image: `${site.siteUrl}/${ICON_FILE}`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'MAD' },
    publisher: { '@type': 'Organization', name: 'Novanest ATLAS' },
    ...extra,
  };
}

/* Strings handed to the trainer (data attributes of #cm-app): the results
   screen shows a card to the app (src/js/entrainement/ui.js). */
export function trainerAppData(site, lang) {
  if (!appLive(site)) return null;
  const x = X(lang);
  return { url: playUrl(site, 'resultats', lang), h: x.resultsH, p: x.resultsP, btn: x.store };
}

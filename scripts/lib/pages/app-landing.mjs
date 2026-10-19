/* Page of the Android app (application/): what it does, its status (site.androidApp.status:
   'soon' = coming soon, 'live' = on Google Play) and, meanwhile, how to install the website
   on the home screen. appBadge() is the small link shown on the home page and in the footer. */
import { html, inline } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd, linkMode } from '../layout.mjs';
import { t } from '../strings.mjs';

const TXT = {
  fr: {
    title: 'Application Android Concours Maroc : bientôt sur Google Play',
    description: 'L’application Android Concours Maroc : fiches des concours, QCM corrigés, examens blancs et lecture à voix haute, utilisables hors ligne. Bientôt sur Google Play ; en attendant, installez le site sur votre écran d’accueil.',
    crumb: 'Application Android', h1: 'L’application Android Concours Maroc',
    soon: 'Bientôt sur Google Play', live: 'Disponible sur Google Play', get: 'Télécharger sur Google Play',
    badgeSoon: 'Application Android : bientôt disponible', badgeLive: 'Application Android sur Google Play',
    lead: 'Tout le site dans une application gratuite, en français et en arabe, qui fonctionne sans connexion.',
    featuresH: 'Ce que contient l’application',
    features: (nc, nq) => [
      `Les **${nc} fiches concours** du site : conditions, seuils, épreuves, calendrier et sources.`,
      `**${nq.toLocaleString('fr-FR').replace(/ /g, ' ')} QCM corrigés** avec explications, par matière et par concours, et des **examens blancs chronométrés**.`,
      'Un niveau de questions adapté à la sélectivité de chaque concours, et le suivi de vos points faibles.',
      '**Lecture à voix haute** des questions et des corrections (voix française et arabe du téléphone).',
      '**Alertes concours** facultatives : une notification quand des inscriptions ouvrent ou qu’une date approche.',
      'Calculateur de note du bac, orientation, calendrier et planning de révision, **hors ligne**.',
      'Aucun compte : votre progression reste sur votre téléphone.',
    ],
    waitH: 'En attendant : installez le site comme une application',
    wait: [
      'Ouvrez **www.maroc-concour.com** dans Chrome sur Android.',
      'Menu **⋮** → **Ajouter à l’écran d’accueil** (ou **Installer l’application**).',
      'L’icône Concours Maroc apparaît sur votre écran d’accueil ; l’entraînement et les pages déjà visitées restent disponibles hors connexion.',
    ],
    privacy: 'Politique de confidentialité de l’application', practice: 'S’entraîner maintenant sur le site',
  },
  ar: {
    title: 'تطبيق Concours Maroc على أندرويد: قريبًا على Google Play',
    description: 'تطبيق Concours Maroc على أندرويد: بطاقات المباريات، أسئلة مصححة، امتحانات تجريبية وقراءة بصوت مرتفع، بدون إنترنت. قريبًا على Google Play؛ وفي الانتظار، ثبّت الموقع على شاشتك الرئيسية.',
    crumb: 'تطبيق أندرويد', h1: 'تطبيق Concours Maroc على أندرويد',
    soon: 'قريبًا على Google Play', live: 'متوفر على Google Play', get: 'التحميل من Google Play',
    badgeSoon: 'تطبيق أندرويد: قريبًا', badgeLive: 'تطبيق أندرويد على Google Play',
    lead: 'كل الموقع في تطبيق مجاني، بالفرنسية والعربية، يعمل بدون اتصال.',
    featuresH: 'ماذا يتضمن التطبيق',
    features: (nc, nq) => [
      `**${nc} بطاقة مباراة**: الشروط، العتبات، الاختبارات، الأجندة والمصادر.`,
      `**${nq} سؤالًا مصححًا** مع الشرح، حسب المادة والمباراة، و**امتحانات تجريبية موقتة**.`,
      'مستوى أسئلة ملائم لدرجة انتقائية كل مباراة، وتتبع نقط ضعفك.',
      '**قراءة بصوت مرتفع** للأسئلة والتصحيحات (الصوت الفرنسي والعربي للهاتف).',
      '**تنبيهات المباريات** اختيارية: إشعار عند فتح التسجيل أو اقتراب موعد.',
      'حساب نقطة البكالوريا، التوجيه، الأجندة وبرنامج المراجعة، **بدون إنترنت**.',
      'بدون حساب: يبقى تقدمك على هاتفك.',
    ],
    waitH: 'في الانتظار: ثبّت الموقع كتطبيق',
    wait: [
      'افتح **www.maroc-concour.com** في متصفح Chrome على أندرويد.',
      'القائمة **⋮** ← **إضافة إلى الشاشة الرئيسية** (أو **تثبيت التطبيق**).',
      'تظهر أيقونة Concours Maroc على شاشتك الرئيسية، ويبقى التمرين والصفحات التي زرتها متاحة بدون اتصال.',
    ],
    privacy: 'سياسة خصوصية التطبيق', practice: 'تمرّن الآن على الموقع',
  },
};

function live(site) { return site.androidApp && site.androidApp.status === 'live'; }
function playUrl(site) { return `https://play.google.com/store/apps/details?id=${site.androidApp.id}`; }

/* Small link to the app page (home page hero, footer); not in the app itself. */
export function appBadge(site, lang, link) {
  if (!site.androidApp || linkMode() === 'app') return '';
  const x = TXT[lang] || TXT.fr;
  const pfx = lang === 'ar' ? 'ar/' : '';
  return html`<a class="app-badge no-app${live(site) ? ' live' : ''}" href="${link(pfx + 'application/')}">${icon('phone')}<span>${live(site) ? x.badgeLive : x.badgeSoon}</span></a>`;
}

export function buildAppLanding(site, lang, all, banks) {
  if (!site.androidApp) return null;
  const x = TXT[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const p = `${pfx}application/index.html`;
  const link = linker(p);
  const crumbs = [[pfx, t(lang, 'home')], [`${pfx}application/`, x.crumb]];
  const nc = all.filter((c) => c[lang]).length;
  const nq = Object.values(banks).reduce((n, qs) => n + qs.length, 0);
  const status = live(site)
    ? html`<p><a class="btn" href="${playUrl(site)}" rel="noopener" target="_blank">${icon('phone')} ${x.get}</a></p>`
    : html`<p><span class="badge gold" style="font-size:var(--fs-sm)">${icon('clock')} ${x.soon}</span></p>`;
  return {
    path: p, lang, title: x.title, description: x.description, alternate: `${lang === 'ar' ? '' : 'ar/'}application/`,
    jsonld: [breadcrumbLd(site, crumbs)],
    body: html`${breadcrumb(lang, link, crumbs)}<div class="container narrow" style="padding-bottom:40px">
<header class="page-head"><h1>${x.h1}</h1><p class="lead">${x.lead}</p>${status}</header>
<section class="prose"><h2>${x.featuresH}</h2><ul>${x.features(nc, nq).map((s) => html`<li>${inline(s)}</li>`)}</ul></section>
${live(site) ? '' : html`<section class="prose"><h2>${x.waitH}</h2><ol class="steps">${x.wait.map((s) => html`<li>${inline(s)}</li>`)}</ol></section>`}
<div class="btn-row" style="margin-top:20px"><a class="btn ghost" href="${link(pfx + 'entrainement/')}">${icon('play')} ${x.practice}</a><a class="btn quiet" href="${link(pfx + 'application/confidentialite/')}">${x.privacy}</a></div>
</div>`,
  };
}

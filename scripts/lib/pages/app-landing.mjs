/* Page of the Android app (application/), the landing page of the funnel to
   Google Play (scripts/lib/app-funnel.mjs). site.androidApp.status: 'soon' =
   coming soon (with how to install the website on the home screen meanwhile),
   'live' = on Google Play: store buttons, QR code, screenshots, features, FAQ.
   appBadge() is the small "coming soon" link of the home page and footer. */
import { html, inline } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd, faqLd, linkMode, practiceHref } from '../layout.mjs';
import { t } from '../strings.mjs';
import { APP_TXT, SHOTS, storeButton, storeUrl, qrImg, appIcon, shotImg, appJsonLd } from '../app-funnel.mjs';
import { hue } from '../art.mjs';

const fmt = (n, lang) => (lang === 'ar' ? String(n) : n.toLocaleString('fr-FR').replace(/ /g, ' '));

const TXT = {
  fr: {
    title: 'Application Android Concours Maroc : bientôt sur Google Play',
    description: 'L’application Android Concours Maroc : fiches des concours, QCM corrigés, examens blancs et lecture à voix haute, utilisables hors ligne. Bientôt sur Google Play ; en attendant, installez le site sur votre écran d’accueil.',
    titleLive: 'Application Concours Maroc : QCM et concours hors ligne sur Android',
    descriptionLive: 'Téléchargez gratuitement l’application Android Concours Maroc sur Google Play : fiches des concours, QCM corrigés, examens blancs, lecture à voix haute et alertes, même sans internet.',
    crumb: 'Application Android', h1: 'L’application Android Concours Maroc',
    h1Live: 'Tous les concours au Maroc dans votre poche, même sans internet',
    eyebrowLive: 'Application Android gratuite',
    soon: 'Bientôt sur Google Play', get: 'Télécharger sur Google Play',
    badgeSoon: 'Application Android : bientôt disponible', badgeLive: 'Application Android sur Google Play',
    lead: 'Tout le site dans une application gratuite, en français et en arabe, qui fonctionne sans connexion.',
    leadLive: (nc, nq) => `Les ${nc} fiches concours, ${nq} QCM corrigés, les examens blancs et les outils du site dans une application gratuite, en français et en arabe, qui fonctionne sans connexion.`,
    facts: ['Gratuite', 'Sans compte', 'Hors ligne', 'Français · العربية', 'Android 7.0+'],
    seeShots: 'Voir les captures',
    ios: 'Sur iPhone ou iPad : l’application n’existe que sur Android. Le site fonctionne dans Safari, avec le même entraînement.',
    qrDesktop: 'Sur ordinateur ? Scannez ce code avec votre téléphone Android : la page de l’application s’ouvre dans Google Play.',
    featuresH: 'Ce que contient l’application',
    features: (nc, nq) => [
      `Les **${nc} fiches concours** du site : conditions, seuils, épreuves, calendrier et sources.`,
      `**${nq} QCM corrigés** avec explications, par matière et par concours, et des **examens blancs chronométrés**.`,
      'Un niveau de questions adapté à la sélectivité de chaque concours, et le suivi de vos points faibles.',
      '**Lecture à voix haute** des questions et des corrections (voix française et arabe du téléphone).',
      '**Alertes concours** facultatives : une notification quand des inscriptions ouvrent ou qu’une date approche.',
      'Calculateur de note du bac, orientation, calendrier et planning de révision, **hors ligne**.',
      'Aucun compte : votre progression reste sur votre téléphone.',
    ],
    whyH: 'Pourquoi installer l’application ?',
    why: [
      ['download', 'Tout hors ligne', 'Les fiches, les QCM et les outils sont dans l’application : plus besoin de connexion pour réviser.'],
      ['clock', 'Examens blancs', 'Durée, nombre de questions et barème du concours choisi, avec le détail par matière.'],
      ['bulb', 'Lecture à voix haute', 'Questions et corrections lues par les voix française et arabe du téléphone.'],
      ['calendar', 'Alertes concours', 'Une notification, si vous l’activez, quand des inscriptions ouvrent ou qu’une date approche.'],
      ['phone', 'Rapide et plein écran', 'Une icône sur l’écran d’accueil, sans barre de navigateur, en mode clair ou sombre.'],
      ['shield', 'Sans compte', 'Aucune inscription : vos scores et vos favoris restent sur votre téléphone.'],
    ],
    shotsH: 'Aperçu de l’application',
    ctaH: 'Prêt à réviser partout ?', ctaP: 'L’application est gratuite, sans compte, et fonctionne sans internet une fois installée.',
    faqH: 'Questions fréquentes',
    faq: [
      { q: 'L’application Concours Maroc est-elle gratuite ?', a: 'Oui. Elle est gratuite et financée par la publicité (Google AdMob), qui n’est jamais affichée pendant une question.' },
      { q: 'Faut-il créer un compte ?', a: 'Non. Aucune inscription n’est demandée : votre progression, vos scores et vos favoris sont enregistrés uniquement sur votre téléphone.' },
      { q: 'L’application fonctionne-t-elle sans internet ?', a: 'Oui. Une fois installée, les fiches, les QCM corrigés, les examens blancs et les outils fonctionnent sans connexion.' },
      { q: 'Sur quels téléphones fonctionne-t-elle ?', a: 'Sur les téléphones et tablettes Android 7.0 ou plus récents, via Google Play. Il n’existe pas de version iPhone : sur iOS, utilisez le site, qui propose le même entraînement.' },
      { q: 'Les informations sont-elles les mêmes que sur le site ?', a: 'Oui : l’application reprend les fiches et les questions du site, avec les mêmes sources datées. Seul l’avis officiel de chaque concours fait foi.' },
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
    titleLive: 'تطبيق Concours Maroc: المباريات والأسئلة المصححة بدون إنترنت',
    descriptionLive: 'حمّل مجانًا تطبيق Concours Maroc على أندرويد من Google Play: بطاقات المباريات، أسئلة مصححة، امتحانات تجريبية، قراءة بصوت مرتفع وتنبيهات، حتى بدون إنترنت.',
    crumb: 'تطبيق أندرويد', h1: 'تطبيق Concours Maroc على أندرويد',
    h1Live: 'كل المباريات بالمغرب في جيبك، حتى بدون إنترنت',
    eyebrowLive: 'تطبيق أندرويد مجاني',
    soon: 'قريبًا على Google Play', get: 'التحميل من Google Play',
    badgeSoon: 'تطبيق أندرويد: قريبًا', badgeLive: 'تطبيق أندرويد على Google Play',
    lead: 'كل الموقع في تطبيق مجاني، بالفرنسية والعربية، يعمل بدون اتصال.',
    leadLive: (nc, nq) => `${nc} بطاقة مباراة و${nq} سؤالًا مصححًا والامتحانات التجريبية وأدوات الموقع في تطبيق مجاني، بالعربية والفرنسية، يعمل بدون اتصال.`,
    facts: ['مجاني', 'بدون حساب', 'بدون إنترنت', 'العربية · Français', 'أندرويد 7.0+'],
    seeShots: 'شاهد لقطات الشاشة',
    ios: 'على آيفون أو آيباد: التطبيق متوفر على أندرويد فقط. الموقع يعمل في Safari بنفس التمرين.',
    qrDesktop: 'على الحاسوب؟ امسح هذا الرمز بهاتفك الأندرويد لتفتح صفحة التطبيق في Google Play.',
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
    whyH: 'لماذا تثبّت التطبيق؟',
    why: [
      ['download', 'كل شيء بدون إنترنت', 'البطاقات والأسئلة والأدوات داخل التطبيق: لا حاجة للاتصال من أجل المراجعة.'],
      ['clock', 'امتحانات تجريبية', 'المدة وعدد الأسئلة وسلم التنقيط للمباراة المختارة، مع التفصيل حسب المادة.'],
      ['bulb', 'قراءة بصوت مرتفع', 'الأسئلة والتصحيحات بالصوت العربي والفرنسي للهاتف.'],
      ['calendar', 'تنبيهات المباريات', 'إشعار، إن فعّلته، عند فتح التسجيل أو اقتراب موعد.'],
      ['phone', 'سريع وبملء الشاشة', 'أيقونة على الشاشة الرئيسية، بدون شريط المتصفح، بالوضع الفاتح أو الداكن.'],
      ['shield', 'بدون حساب', 'لا تسجيل: نتائجك ومفضلتك تبقى على هاتفك.'],
    ],
    shotsH: 'لمحة عن التطبيق',
    ctaH: 'مستعد للمراجعة في كل مكان؟', ctaP: 'التطبيق مجاني وبدون حساب، ويعمل بدون إنترنت بعد تثبيته.',
    faqH: 'أسئلة شائعة',
    faq: [
      { q: 'هل تطبيق Concours Maroc مجاني؟', a: 'نعم، هو مجاني وممول بالإعلانات (Google AdMob)، التي لا تظهر أبدًا أثناء الإجابة عن سؤال.' },
      { q: 'هل يجب إنشاء حساب؟', a: 'لا، لا يُطلب أي تسجيل: يُحفظ تقدمك ونتائجك ومفضلتك على هاتفك فقط.' },
      { q: 'هل يعمل التطبيق بدون إنترنت؟', a: 'نعم، بعد تثبيته تعمل البطاقات والأسئلة المصححة والامتحانات التجريبية والأدوات بدون اتصال.' },
      { q: 'على أي هواتف يعمل؟', a: 'على هواتف ولوحات أندرويد 7.0 أو أحدث، عبر Google Play. لا توجد نسخة لآيفون: على iOS، استعمل الموقع الذي يقدم نفس التمرين.' },
      { q: 'هل المعلومات هي نفسها الموجودة على الموقع؟', a: 'نعم، يتضمن التطبيق بطاقات الموقع وأسئلته بنفس المصادر المؤرخة. والإعلان الرسمي لكل مباراة هو المرجع الوحيد.' },
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

/* Small "coming soon" link to the app page (home page hero, footer); not in the app. */
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
  const common = { path: p, lang, alternate: `${lang === 'ar' ? '' : 'ar/'}application/` };

  if (!live(site)) {
    return {
      ...common, title: x.title, description: x.description,
      jsonld: [breadcrumbLd(site, crumbs)],
      body: html`${breadcrumb(lang, link, crumbs)}<div class="container narrow" style="padding-bottom:40px">
<header class="page-head"><h1>${x.h1}</h1><p class="lead">${x.lead}</p><p><span class="badge gold" style="font-size:var(--fs-sm)">${icon('clock')} ${x.soon}</span></p></header>
<section class="prose"><h2>${x.featuresH}</h2><ul>${x.features(nc, fmt(nq, lang)).map((s) => html`<li>${inline(s)}</li>`)}</ul></section>
<section class="prose"><h2>${x.waitH}</h2><ol class="steps">${x.wait.map((s) => html`<li>${inline(s)}</li>`)}</ol></section>
<div class="btn-row" style="margin-top:20px"><a class="btn ghost" href="${link(pfx + 'entrainement/')}">${icon('play')} ${x.practice}</a><a class="btn quiet" href="${link(pfx + 'application/confidentialite/')}">${x.privacy}</a></div>
</div>`,
    };
  }

  const a = APP_TXT[lang];
  const shotAlt = (s) => (lang === 'ar' ? `لقطة شاشة من التطبيق: ${s[2]}` : `Capture de l’application : ${s[1].charAt(0).toLowerCase()}${s[1].slice(1)}`);
  const body = html`${breadcrumb(lang, link, crumbs)}
<section class="hero app-hero"><div class="container hero-grid">
<div>
<div class="ah-id">${appIcon(link, lang, 72, true)}<div><b>Concours Maroc</b><span>${a.free}</span></div></div>
<span class="eyebrow">${x.eyebrowLive}</span>
<h1>${x.h1Live}</h1>
<p class="lead">${x.leadLive(nc, fmt(nq, lang))}</p>
<div class="btn-row">${storeButton(site, lang, 'page-application')}<a class="btn ghost" href="#captures">${icon('chev')} ${x.seeShots}</a></div>
<ul class="app-facts">${x.facts.map((f) => html`<li>${icon('check')}${f}</li>`)}</ul>
<p class="ios-note">${x.ios}</p>
<div class="app-qr-row only-desktop">${qrImg(link, lang, 112)}<p>${x.qrDesktop}</p></div>
</div>
<div class="ah-art"><div class="phone">${shotImg(link, lang, '04-examen-blanc', shotAlt(SHOTS[2]), { eager: true })}</div></div>
</div></section>

<div class="container">
<section class="section"><div class="section-head"><div><span class="eyebrow">${x.crumb}</span><h2>${x.whyH}</h2></div></div>
<div class="grid cols-3">${x.why.map(([ic, h, s], i) => html`<div class="card ${hue([6, 3, 4, 2, 1, 0][i])}"><div class="card-top"><span class="card-ico">${icon(ic)}</span><span class="card-title">${h}</span></div><p class="card-sub">${s}</p></div>`)}</div>
</section>

<section class="section" id="captures" style="padding-top:8px"><h2 class="mt-0">${x.shotsH}</h2>
<div class="shots">${SHOTS.map((s) => html`<figure>${shotImg(link, lang, s[0], shotAlt(s))}<figcaption>${lang === 'ar' ? s[2] : s[1]}</figcaption></figure>`)}</div>
</section>

<section class="section prose" style="padding-top:8px;max-width:var(--readw)"><h2 class="mt-0">${x.featuresH}</h2><ul>${x.features(nc, fmt(nq, lang)).map((s) => html`<li>${inline(s)}</li>`)}</ul></section>

<section class="section" style="padding-top:8px"><div class="cta-band"><div><h2>${x.ctaH}</h2><p>${x.ctaP}</p></div><div class="btn-row">${storeButton(site, lang, 'page-application-bas')}</div></div></section>

<section class="section faq narrow" style="padding-top:8px"><h2 class="mt-0">${x.faqH}</h2>
${x.faq.map((f) => html`<details><summary>${f.q}</summary><div class="faq-a"><p>${f.a}</p></div></details>`)}
<div class="btn-row" style="margin-top:22px"><a class="btn ghost" href="${practiceHref(link, pfx)}">${icon('play')} ${x.practice}</a><a class="btn quiet" href="${link(pfx + 'application/confidentialite/')}">${x.privacy}</a></div>
</section>
</div>`;

  return {
    ...common,
    title: x.titleLive, titleFull: x.titleLive, description: x.descriptionLive,
    ogImage: 'assets/img/og/application-android.jpg',
    noAppBanner: true,
    jsonld: [breadcrumbLd(site, crumbs), appJsonLd(site, lang, {
      description: x.descriptionLive,
      screenshot: SHOTS.map((s) => `${site.siteUrl}/assets/img/app/${lang}-${s[0]}.webp`),
      sameAs: storeUrl(site),
    }), faqLd(x.faq, lang)],
    keywords: lang === 'ar' ? ['تطبيق Concours Maroc', 'تطبيق المباريات', 'تحميل التطبيق'] : ['application concours maroc', 'appli concours', 'télécharger concours maroc', 'google play'],
    body,
  };
}

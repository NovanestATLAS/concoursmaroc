/* Practice app page (/entrainement/): crawlable intro + the QCM trainer. */
import { html } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd } from '../layout.mjs';
import { t } from '../strings.mjs';
import { SUBJECTS, GROUPS } from '../../../content/taxonomy.mjs';
import { qcmPath } from './qcm.mjs';

const TXT = {
  fr: {
    title: 'Entraînement aux concours : QCM corrigés et examens blancs gratuits',
    desc: "Entraînez-vous gratuitement aux concours marocains : QCM corrigés par concours (médecine, ENSA, ENCG, police, gendarmerie…), examens blancs chronométrés au vrai barème, points faibles et révisions espacées.",
    h1: 'Entraînement aux concours : QCM corrigés et examens blancs',
    lead: "Choisissez votre concours : les questions, l'examen blanc (durée, nombre de questions, barème) et les révisions s'adaptent automatiquement. Changez de concours à tout moment depuis l'accueil de l'entraînement.",
    loading: 'Chargement de l’entraînement…', noscript: "L'entraînement interactif nécessite JavaScript. Vous pouvez consulter les QCM corrigés par matière ci-dessous.",
    byConcours: "S'entraîner par concours", bySubject: 'QCM corrigés par matière', features: 'Ce que propose l’entraînement',
    feats: [
      ['target', 'Concours ciblé modifiable', "Un sélecteur en haut de l'accueil : changez de concours à tout moment."],
      ['clock', 'Examen blanc fidèle', 'Durée, nombre de questions et barème négatif du concours quand ils sont connus.'],
      ['fire', 'Points faibles', 'Une session construite sur les thèmes où vous vous trompez le plus.'],
      ['calendar', 'Révisions espacées', 'Vos erreurs reviennent 1, 3, 7 puis 14 jours plus tard.'],
      ['star', 'Favoris et notes', 'Mettez une question de côté et ajoutez votre propre fiche mémo.'],
      ['chart', 'Progression', 'Précision par matière, série de jours, historique et badges.'],
    ],
  },
  ar: {
    title: 'التمرن على المباريات: أسئلة مصححة وامتحانات تجريبية مجانية',
    desc: 'تمرّن مجانًا على المباريات المغربية: أسئلة مصححة حسب المباراة (الطب، ENSA، ENCG، الشرطة، الدرك…)، امتحانات تجريبية موقتة بسلم التنقيط الحقيقي، نقط الضعف والمراجعة المتباعدة.',
    h1: 'التمرن على المباريات: أسئلة مصححة وامتحانات تجريبية',
    lead: 'اختر مباراتك: تتكيف الأسئلة والامتحان التجريبي (المدة، عدد الأسئلة، سلم التنقيط) والمراجعات تلقائيًا، ويمكنك تغيير المباراة في أي وقت من الصفحة الرئيسية للتمرين.',
    loading: 'جارٍ التحميل…', noscript: 'يتطلب التمرين التفاعلي JavaScript. يمكنك الاطلاع على الأسئلة المصححة حسب المادة أسفله.',
    byConcours: 'التمرن حسب المباراة', bySubject: 'أسئلة مصححة حسب المادة', features: 'ما يقدمه التمرين',
    feats: [
      ['target', 'مباراة مستهدفة قابلة للتغيير', 'محدد في أعلى الصفحة لتغيير المباراة في أي وقت.'],
      ['clock', 'امتحان تجريبي مطابق', 'المدة وعدد الأسئلة والتنقيط السلبي حين تكون معروفة.'],
      ['fire', 'نقط الضعف', 'جلسة مبنية على المحاور التي تخطئ فيها أكثر.'],
      ['calendar', 'مراجعة متباعدة', 'تعود أخطاؤك بعد 1 و3 و7 ثم 14 يومًا.'],
      ['star', 'المفضلة والملاحظات', 'احتفظ بسؤال وأضف بطاقة تذكير خاصة بك.'],
      ['chart', 'التقدم', 'الدقة حسب المادة، سلسلة الأيام، السجل والشارات.'],
    ],
  },
};

export function buildPracticePage(site, all, lang, banks) {
  const x = TXT[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const path = `${pfx}entrainement/index.html`;
  const link = linker(path);
  const crumbs = [[pfx, t(lang, 'home')], [`${pfx}entrainement/`, t(lang, 'navPractice')]];
  const practiceList = all.filter((c) => c.practice && c[lang]);
  const body = html`${breadcrumb(lang, link, crumbs)}
<div class="container practice-head">
<header class="page-head" style="padding-bottom:0"><span class="eyebrow">${t(lang, 'navPractice')}</span><h1>${x.h1}</h1><p class="lead">${x.lead}</p></header>
</div>
<div id="cm-app" class="cm-app" data-lang="${lang}" data-data="${link('data/')}" data-guides="${link('')}">
<section class="screen is-active" id="screen-boot" aria-live="polite"><div class="state"><div class="spinner"></div><p>${x.loading}</p></div></section>
<noscript><div class="callout warn">${x.noscript}</div></noscript>
</div>
<div class="sheet-back" id="sheet"></div>
<div class="container practice-extra">
<section class="section"><h2>${x.features}</h2><div class="grid cols-3">${x.feats.map(([ic, h, p]) => html`<div class="card"><div class="card-top"><span class="card-ico">${icon(ic)}</span><span class="card-title">${h}</span></div><p class="card-sub">${p}</p></div>`)}</div></section>
<section class="section"><h2>${x.byConcours}</h2>
${GROUPS.map((g) => {
  const items = practiceList.filter((c) => c.group === g.id);
  if (!items.length) return '';
  return html`<h3>${g[lang]}</h3><div class="chips">${items.map((c) => html`<a class="chip" href="?concours=${c.id}" data-pick-concours="${c.id}">${c[lang].short}</a>`)}</div>`;
})}</section>
<section class="section"><h2>${x.bySubject}</h2><div class="chips">${SUBJECTS.filter((s) => (banks[s.id] || []).length).map((s) => html`<a class="chip" href="${link(qcmPath(s, lang, banks))}">${s[lang]} · ${banks[s.id].length}</a>`)}</div></section>
</div>`;
  return {
    path, lang, title: x.title, description: x.desc, section: 'navPractice', alternate: `${lang === 'ar' ? '' : 'ar/'}entrainement/`,
    jsonld: [breadcrumbLd(site, crumbs), {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Concours Maroc — Entraînement', applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web', inLanguage: lang, url: `${site.siteUrl}/${pfx}entrainement/`, offers: { '@type': 'Offer', price: '0', priceCurrency: 'MAD' },
    }],
    body,
    styles: ['assets/css/entrainement.css'],
    scripts: ['assets/js/entrainement/utils.js', 'assets/js/entrainement/storage.js', 'assets/js/entrainement/i18n.js', 'assets/js/entrainement/data-loader.js',
      'assets/js/entrainement/tts.js', 'assets/js/entrainement/stats.js', 'assets/js/entrainement/quiz-engine.js', 'assets/js/entrainement/ui.js', 'assets/js/entrainement/app.js'],
    keywords: ['qcm concours maroc', 'entrainement concours', 'examen blanc'],
  };
}

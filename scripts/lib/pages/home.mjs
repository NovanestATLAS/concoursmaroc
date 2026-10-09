/* Home page (FR and AR). */
import { html, raw } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, faqLd } from '../layout.mjs';
import { t } from '../strings.mjs';
import { concoursCard, guidePath } from './concours.mjs';
import { GROUPS, SUBJECTS } from '../../../content/taxonomy.mjs';
import { CALENDAR } from '../../../content/calendar.mjs';
import { deadlineItem } from './tools.mjs';

const TXT = {
  fr: {
    title: 'Concours Maroc 2027 : guide des concours après le bac, QCM corrigés et outils',
    desc: "Le guide gratuit des concours au Maroc après le bac et avec le niveau bac : médecine, ENSA, ENCG, CPGE, ISPITS, police, gendarmerie, FAR… Conditions, seuils, calendrier, QCM corrigés et outils.",
    h1: 'Tous les concours au Maroc, expliqués et préparés',
    lead: "Conditions d'accès, seuils, épreuves, nombre de places, calendrier : un guide clair pour chaque concours après le bac ou avec le niveau bac, avec des QCM corrigés et des examens blancs pour s'entraîner gratuitement.",
    ctaFind: 'Trouver mes concours', ctaPractice: "S'entraîner aux QCM",
    stats: (nc, nq) => [[nc, 'concours expliqués'], [nq, 'QCM corrigés'], ['6', 'outils gratuits'], ['FR · ع', 'bilingue, hors ligne']],
    upcoming: 'Prochaines échéances', upcomingMore: 'Voir le calendrier complet',
    start: 'Par où commencer ?',
    paths: [
      ['compass', "Je viens d'avoir mon bac", 'Quelles écoles correspondent à ma série et à ma moyenne ?', 'outils/orientation-apres-bac/'],
      ['calc', 'Je calcule ma note', 'Moyenne du bac, note de présélection (75/25) et mention.', 'outils/calcul-note-bac/'],
      ['shield', "J'ai le niveau bac ou pas de bac", 'Police, gendarmerie, forces auxiliaires, OFPPT, 1337…', 'guides/concours-sans-bac-niveau-bac/'],
      ['target', 'Je prépare un concours', 'QCM corrigés, examens blancs chronométrés, points faibles.', 'entrainement/'],
    ],
    domains: 'Concours par domaine', popular: 'Les concours les plus recherchés', all: 'Voir tous les concours',
    tools: 'Outils gratuits pour les candidats',
    toolList: [
      ['calc', 'Calcul de la note du bac', 'Moyenne générale, note de présélection et mention en 10 secondes.', 'outils/calcul-note-bac/'],
      ['compass', 'Orientation après le bac', 'Les écoles accessibles selon ta série, ta note et ton âge.', 'outils/orientation-apres-bac/'],
      ['calendar', 'Calendrier des concours', 'Dates clés, compte à rebours et rappel dans ton agenda.', 'outils/calendrier-concours/'],
      ['list', 'Planning de révision', 'Un programme semaine par semaine jusqu’au jour J.', 'outils/planning-revision/'],
      ['check', 'Checklist du dossier', 'Les pièces à préparer pour ne rien oublier.', 'outils/checklist-dossier/'],
      ['scales', 'Simulateur de barème QCM', 'Faut-il répondre au hasard avec des points négatifs ?', 'outils/simulateur-qcm/'],
    ],
    practiceH: 'Entraînement par matière', practiceLead: 'Questions originales vérifiées, avec correction et explication détaillée.',
    guidesH: 'Guides pratiques',
    guides: [
      ['compass', 'Orientation après le bac au Maroc', 'guides/orientation-apres-bac-maroc/'],
      ['doc', 'Cursus Sup : mode d’emploi', 'guides/cursus-sup-inscription/'],
      ['star', 'Réussir un QCM de concours', 'guides/reussir-qcm-concours/'],
      ['wallet', 'Bourse Minhaty et logement', 'guides/bourse-minhaty-logement/'],
    ],
    faqH: 'Questions fréquentes',
    faq: [
      { q: 'Quels concours peut-on passer après le bac au Maroc ?', a: "Les principaux concours post-bac sont ceux des facultés de médecine, pharmacie et médecine dentaire, des ENSA, des ENSAM, des ENCG (TAFEM), de l'ENA (architecture), des ISPITS (infirmiers), de l'IAV Hassan II (APESA), de l'ISCAE, de l'ISIC, des écoles militaires (ARM, École Royale de l'Air, École Royale Navale, santé militaire) et l'accès aux CPGE sur dossier. Chaque fiche du site détaille conditions, seuils et épreuves." },
      { q: 'Comment est calculée la note de présélection ?', a: "Pour la plupart des écoles à accès régulé (médecine, ENSA, ENSAM, ENCG, ISPITS…), la note de présélection vaut 75 % de la note de l'examen national du bac et 25 % de celle de l'examen régional. Le contrôle continu n'est pas pris en compte. Notre calculateur la calcule automatiquement." },
      { q: 'Quels concours sont accessibles sans le bac ?', a: "Plusieurs voies restent ouvertes sans baccalauréat : la formation professionnelle (OFPPT, niveaux spécialisation, qualification et technicien), l'école de code 1337 (18–30 ans, sans diplôme), certains recrutements des Forces Auxiliaires (niveau secondaire qualifiant ou diplôme de qualification) ou de la Protection civile (cycle collégial + permis). Les conditions changent à chaque avis : vérifiez-les." },
      { q: 'Les informations du site sont-elles officielles ?', a: "Non : Concours Maroc est un guide indépendant. Les informations sont recoupées à partir des avis officiels et de sources publiques datées, citées sur chaque page. Seul l'avis officiel de chaque session fait foi." },
      { q: "L'entraînement est-il gratuit et utilisable hors ligne ?", a: "Oui. Les QCM, examens blancs et outils sont gratuits, sans inscription. Votre progression est enregistrée uniquement sur votre appareil, et l'entraînement continue de fonctionner hors ligne après une première visite." },
    ],
  },
  ar: {
    title: 'Concours Maroc 2027: دليل المباريات بعد البكالوريا، أسئلة مصححة وأدوات',
    desc: 'الدليل المجاني للمباريات بالمغرب بعد البكالوريا وبمستوى البكالوريا: الطب، ENSA، ENCG، الأقسام التحضيرية، ISPITS، الشرطة، الدرك، القوات المسلحة… الشروط، العتبات، الأجندة وأسئلة مصححة.',
    h1: 'جميع المباريات بالمغرب: شرح وتحضير',
    lead: 'شروط الولوج، العتبات، الاختبارات، عدد المقاعد والأجندة: دليل واضح لكل مباراة بعد البكالوريا أو بمستوى البكالوريا، مع أسئلة مصححة وامتحانات تجريبية للتمرن مجانًا.',
    ctaFind: 'اكتشف المباريات المناسبة لي', ctaPractice: 'تمرّن على الأسئلة',
    stats: (nc, nq) => [[nc, 'مباراة مشروحة'], [nq, 'سؤالًا مصححًا'], ['6', 'أدوات مجانية'], ['FR · ع', 'ثنائي اللغة، بدون إنترنت']],
    upcoming: 'المواعيد القادمة', upcomingMore: 'الأجندة الكاملة',
    start: 'من أين تبدأ؟',
    paths: [
      ['compass', 'حصلت على البكالوريا', 'ما المدارس المناسبة لشعبتي ومعدلي؟', 'outils/orientation-apres-bac/'],
      ['calc', 'أحسب نقطتي', 'معدل البكالوريا ونقطة الانتقاء (75/25) والميزة.', 'outils/calcul-note-bac/'],
      ['shield', 'مستواي البكالوريا أو بدون باك', 'الشرطة، الدرك، القوات المساعدة، التكوين المهني، 1337…', 'concours/'],
      ['target', 'أحضّر لمباراة', 'أسئلة مصححة، امتحانات تجريبية موقتة، نقط الضعف.', 'entrainement/'],
    ],
    domains: 'المباريات حسب المجال', popular: 'المباريات الأكثر بحثًا', all: 'كل المباريات',
    tools: 'أدوات مجانية للمترشحين',
    toolList: [
      ['calc', 'حساب نقطة البكالوريا', 'المعدل العام ونقطة الانتقاء والميزة في ثوانٍ.', 'outils/calcul-note-bac/'],
      ['compass', 'التوجيه بعد البكالوريا', 'المدارس المتاحة حسب شعبتك ونقطتك وسنك.', 'outils/orientation-apres-bac/'],
      ['calendar', 'أجندة المباريات', 'التواريخ المهمة والعد التنازلي والتذكير.', 'outils/calendrier-concours/'],
      ['list', 'برنامج المراجعة', 'برنامج أسبوعي حتى يوم المباراة.', 'outils/planning-revision/'],
      ['check', 'لائحة وثائق الملف', 'الوثائق التي يجب تحضيرها.', 'outils/checklist-dossier/'],
      ['scales', 'محاكي سلم التنقيط', 'هل تجيب عشوائيًا مع التنقيط السلبي؟', 'outils/simulateur-qcm/'],
    ],
    practiceH: 'التمرين حسب المادة', practiceLead: 'أسئلة أصلية متحقق منها مع التصحيح والشرح المفصل.',
    guidesH: 'أدلة عملية',
    guides: [
      ['compass', 'التوجيه بعد البكالوريا بالمغرب', 'guides/orientation-apres-bac-maroc/'],
      ['doc', 'منصة Cursus Sup: طريقة الاستعمال', 'guides/cursus-sup-inscription/'],
      ['star', 'النجاح في الأسئلة متعددة الاختيارات', 'guides/reussir-qcm-concours/'],
      ['wallet', 'منحة منحتي والسكن الجامعي', 'guides/bourse-minhaty-logement/'],
    ],
    faqH: 'أسئلة شائعة',
    faq: [
      { q: 'ما هي المباريات المتاحة بعد البكالوريا بالمغرب؟', a: 'أهمها مباريات كليات الطب والصيدلة وطب الأسنان، والمدارس الوطنية للعلوم التطبيقية ENSA، والمدارس الوطنية العليا للفنون والمهن ENSAM، ومدارس التجارة والتسيير ENCG، والهندسة المعمارية ENA، ومعاهد المهن التمريضية ISPITS، ومعهد الحسن الثاني للزراعة والبيطرة، وISCAE، وISIC، والمدارس العسكرية، إضافة إلى الأقسام التحضيرية عبر الانتقاء بالملف.' },
      { q: 'كيف تُحسب نقطة الانتقاء؟', a: 'في أغلب المؤسسات ذات الاستقطاب المحدود، تساوي نقطة الانتقاء 75% من نقطة الامتحان الوطني و25% من نقطة الامتحان الجهوي، ولا تحتسب المراقبة المستمرة.' },
      { q: 'هل المعلومات رسمية؟', a: 'لا، Concours Maroc دليل مستقل. المعلومات مستقاة من الإعلانات الرسمية ومصادر عمومية مؤرخة مذكورة في كل صفحة، والإعلان الرسمي هو المرجع الوحيد.' },
      { q: 'هل التمرين مجاني ويعمل بدون إنترنت؟', a: 'نعم، الأسئلة والامتحانات التجريبية والأدوات مجانية وبدون تسجيل، ويُحفظ تقدمك على جهازك فقط.' },
    ],
  },
};

const POPULAR = ['medecine', 'ensa', 'encg-tafem', 'cpge', 'ispits', 'ensam', 'police-dgsn', 'gendarmerie', 'arm', 'ofppt', 'ena-architecture', 'ecole-1337'];

export function buildHome(site, all, lang, banks) {
  const x = TXT[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const path = `${pfx}index.html`;
  const link = linker(path);
  const nq = Object.values(banks).reduce((s, b) => s + b.length, 0);
  const nc = all.filter((c) => c[lang]).length;
  const popular = POPULAR.map((id) => all.find((c) => c.id === id)).filter((c) => c && c[lang]);
  const today = site.updated;
  const upcoming = CALENDAR.filter((e) => e.date && e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  const body = html`<section class="hero"><div class="container hero-grid">
<div>
<span class="eyebrow">${t(lang, 'tagline')}</span>
<h1>${x.h1}</h1>
<p class="lead">${x.lead}</p>
<div class="big-search" role="search" style="margin:18px 0 14px">${icon('search')}<label class="visually-hidden" for="home-search">${t(lang, 'search')}</label><input id="home-search" type="search" autocomplete="off" placeholder="${t(lang, 'searchPlaceholder')}" data-search-input><ul class="search-results" data-search-results></ul></div>
<div class="btn-row"><a class="btn" href="${link(pfx + 'outils/orientation-apres-bac/')}">${icon('compass')} ${x.ctaFind}</a><a class="btn ghost" href="${link(pfx + 'entrainement/')}">${icon('play')} ${x.ctaPractice}</a></div>
<ul class="stat-row">${x.stats(nc, nq).map(([n, l]) => html`<li><b>${n}</b> ${l}</li>`)}</ul>
</div>
<div class="hero-art">
<h2 class="mt-0" style="font-size:1.1rem">${icon('calendar')} ${x.upcoming}</h2>
<ul class="deadlines" data-deadlines data-limit="4">${upcoming.map((e) => deadlineItem(e, lang, link, all))}</ul>
<p style="margin:12px 0 0"><a href="${link(pfx + 'outils/calendrier-concours/')}">${x.upcomingMore} →</a></p>
</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head"><h2>${x.start}</h2></div>
<div class="grid cols-4">${x.paths.map(([ic, h, p, href]) => html`<a class="card path-card" href="${link(pfx + href)}"><div class="card-top"><span class="card-ico">${icon(ic)}</span><span class="card-title">${h}</span></div><p class="card-sub">${p}</p></a>`)}</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head"><h2>${x.popular}</h2><a href="${link(pfx + 'concours/')}">${x.all} →</a></div>
<div class="grid cols-4">${popular.map((c) => concoursCard(c, lang, link))}</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head"><h2>${x.domains}</h2></div>
<div class="grid cols-4">${GROUPS.map((g) => {
  const items = all.filter((c) => c.group === g.id && c[lang]);
  if (!items.length) return '';
  return html`<div class="card"><div class="card-top"><span class="card-ico">${icon(g.icon)}</span><span class="card-title">${g[lang]}</span></div><ul style="margin:0;padding-inline-start:1.1em;font-size:var(--fs-sm)">${items.map((c) => html`<li><a href="${link(guidePath(c, lang))}">${c[lang].short}</a></li>`)}</ul></div>`;
})}</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head"><h2>${x.tools}</h2></div>
<div class="grid cols-3">${x.toolList.map(([ic, h, p, href]) => html`<a class="card path-card" href="${link(pfx + href)}"><div class="card-top"><span class="card-ico">${icon(ic)}</span><span class="card-title">${h}</span></div><p class="card-sub">${p}</p></a>`)}</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head"><div><h2>${x.practiceH}</h2><p>${x.practiceLead}</p></div><a class="btn" href="${link(pfx + 'entrainement/')}">${icon('play')} ${x.ctaPractice}</a></div>
<div class="chips">${SUBJECTS.filter((s) => (banks[s.id] || []).length).map((s) => html`<a class="chip" href="${link(pfx + 'qcm/' + s.slug + '/')}">${s[lang]} · ${(banks[s.id] || []).length}</a>`)}</div>
</div></section>

<section class="section"><div class="container">
<div class="section-head"><h2>${x.guidesH}</h2><a href="${link(pfx + 'guides/')}">${lang === 'ar' ? 'كل الأدلة' : 'Tous les guides'} →</a></div>
<div class="grid cols-4">${x.guides.map(([ic, h, href]) => html`<a class="card path-card" href="${link(pfx + href)}"><div class="card-top"><span class="card-ico">${icon(ic === 'wallet' ? 'briefcase' : ic)}</span><span class="card-title">${h}</span></div></a>`)}</div>
</div></section>

<section class="section"><div class="container narrow faq">
<h2>${x.faqH}</h2>
${x.faq.map((f) => html`<details><summary>${f.q}</summary><div class="faq-a"><p>${f.a}</p></div></details>`)}
<div class="callout warn" style="margin-top:18px">${t(lang, 'disclaimerShort')}</div>
</div></section>`;

  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'WebSite', name: 'Concours Maroc', alternateName: 'ConcoursMaroc',
      url: `${site.siteUrl}/${pfx}`, inLanguage: lang, description: x.desc,
    },
    {
      '@context': 'https://schema.org', '@type': 'Organization', name: 'Concours Maroc', url: `${site.siteUrl}/`,
      logo: `${site.siteUrl}/assets/img/concours-maroc-logo-512.png`,
    },
    faqLd(x.faq, lang),
  ];
  return {
    path, lang, title: x.title, titleFull: x.title, description: x.desc, alternate: lang === 'ar' ? '' : 'ar/',
    jsonld, body, scripts: ['assets/js/echeances.js'], keywords: ['concours maroc', 'concours après bac'],
  };
}

/* Home page (FR and AR). */
import { photo } from '../photos.mjs';
import { HOME_PHOTO } from '../../../content/photos.mjs';
import { html, raw } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, faqLd, practiceHref, linkMode } from '../layout.mjs';
import { t } from '../strings.mjs';
import { concoursCard, guidePath } from './concours.mjs';
import { GROUPS, SUBJECTS } from '../../../content/taxonomy.mjs';
import { qcmPath } from './qcm.mjs';
import { CALENDAR } from '../../../content/calendar.mjs';
import { deadlineItem } from './tools.mjs';
import { hue, subjectArt } from '../art.mjs';
import { appBadge } from './app-landing.mjs';
import { appLive, appBand, appJsonLd, APP_TXT } from '../app-funnel.mjs';
import { quizBlock, quizSubjects, recentRow } from '../engage.mjs';
import { alertHomeLink } from '../alerts.mjs';

const TXT = {
  fr: {
    title: 'Concours Maroc 2027 : tous les concours après le bac et QCM',
    desc: "Tous les concours au Maroc après le bac ou niveau bac : médecine, ENSA, ENCG, police, FAR… Conditions, seuils, dates et QCM corrigés gratuits.",
    h1: 'Tous les concours au Maroc, expliqués et préparés',
    h1Parts: ['Tous les concours au Maroc,', 'expliqués et préparés'],
    trust: [
      ['check', 'Vérifié et sourcé', 'Chaque fiche cite ses sources officielles et sa date de mise à jour.'],
      ['star', '100 % gratuit', 'QCM, examens blancs et outils, sans inscription.'],
      ['phone', 'Pensé pour le mobile', "L'entraînement fonctionne même hors ligne."],
      ['ع', 'Français et arabe', 'Tout le guide est disponible dans les deux langues.'],
    ],
    eyebrows: { start: 'Pour commencer', popular: 'Les plus consultés', domains: 'Par domaine', tools: 'Outils', practice: 'Entraînement', guides: 'Guides', faq: 'FAQ' },
    ctaH: 'Prêt à passer à la pratique ?', ctaP: 'Choisis ton concours et lance un examen blanc chronométré au barème officiel, ou révise matière par matière.', ctaMock: 'Examen blanc',
    lead: "Conditions, seuils, épreuves et dates de chaque concours après le bac ou avec le niveau bac, et des QCM corrigés pour s'entraîner gratuitement.",
    ctaFind: 'Trouver mes concours', ctaPractice: "S'entraîner aux QCM",
    heroPaths: [
      ['compass', "J'ai mon bac (ou je le passe)", 'Les concours pour ma série et ma note', 'outils/orientation-apres-bac/'],
      ['shield', 'Niveau bac ou sans bac', 'Police, gendarmerie, FAR, OFPPT…', 'guides/concours-sans-bac-niveau-bac/'],
      ['target', "Je m'entraîne aux QCM", 'QCM corrigés et examens blancs', 'entrainement/'],
      ['calc', 'Je calcule ma note', 'Présélection 75/25 et mention', 'outils/calcul-note-bac/'],
    ],
    heroNote: ['Sources officielles citées', '100 % gratuit', 'Sans inscription'],
    quizSubjects: ['culture', 'maroc', 'logique', 'francais', 'maths', 'svt', 'physique'],
    domainsLead: 'Choisis un domaine pour voir tous ses concours, avec conditions, seuils et dates.',
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
    practiceH: 'Entraînement par matière', practiceLead: 'Questions originales relues, avec correction et explication détaillée, et la source quand un fait en dépend.',
    guidesH: 'Guides pratiques',
    guides: [
      ['compass', 'Orientation après le bac au Maroc', 'guides/orientation-apres-bac-maroc/', 'Choisir sa voie selon sa série, sa note et ses envies.'],
      ['doc', 'Cursus Sup : mode d’emploi', 'guides/cursus-sup-inscription/', 'Créer son compte, classer ses écoles, suivre les résultats.'],
      ['star', 'Réussir un QCM de concours', 'guides/reussir-qcm-concours/', 'Méthode, gestion du temps et points négatifs.'],
      ['wallet', 'Bourse Minhaty et logement', 'guides/bourse-minhaty-logement/', 'Conditions, dossier et calendrier de la bourse.'],
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
    title: 'Concours Maroc 2027: دليل المباريات وأسئلة مصححة',
    desc: 'كل المباريات بالمغرب بعد البكالوريا أو بمستواها: الطب، ENSA، ENCG، الشرطة، القوات المسلحة… الشروط والعتبات والتواريخ وأسئلة مصححة مجانية.',
    h1: 'جميع المباريات بالمغرب: شرح وتحضير',
    h1Parts: ['جميع المباريات بالمغرب:', 'شرح وتحضير'],
    trust: [
      ['check', 'معلومات موثقة', 'كل بطاقة تذكر مصادرها الرسمية وتاريخ آخر تحديث.'],
      ['star', 'مجاني بالكامل', 'أسئلة وامتحانات تجريبية وأدوات، بدون تسجيل.'],
      ['phone', 'مصمم للهاتف', 'التمرين يعمل حتى بدون إنترنت.'],
      ['Fr', 'بالعربية والفرنسية', 'الدليل كاملًا متوفر باللغتين.'],
    ],
    eyebrows: { start: 'للبداية', popular: 'الأكثر زيارة', domains: 'حسب المجال', tools: 'أدوات', practice: 'التمرين', guides: 'أدلة', faq: 'أسئلة' },
    ctaH: 'مستعد للتطبيق؟', ctaP: 'اختر مباراتك وابدأ امتحانًا تجريبيًا موقتًا بسلم التنقيط الرسمي، أو راجع مادة بمادة.', ctaMock: 'امتحان تجريبي',
    lead: 'الشروط والعتبات والاختبارات وتواريخ كل مباراة بعد البكالوريا أو بمستوى البكالوريا، مع أسئلة مصححة للتمرن مجانًا.',
    ctaFind: 'اكتشف المباريات المناسبة لي', ctaPractice: 'تمرّن على الأسئلة',
    heroPaths: [
      ['compass', 'حصلت على البكالوريا (أو أجتازها)', 'المباريات المناسبة لشعبتي ونقطتي', 'outils/orientation-apres-bac/'],
      ['shield', 'مستوى البكالوريا أو بدون باك', 'الشرطة، الدرك، القوات المسلحة…', 'concours/'],
      ['target', 'أتمرن على الأسئلة', 'أسئلة مصححة وامتحانات تجريبية', 'entrainement/'],
      ['calc', 'أحسب نقطتي', 'نقطة الانتقاء 75/25 والميزة', 'outils/calcul-note-bac/'],
    ],
    heroNote: ['مصادر رسمية مذكورة', 'مجاني بالكامل', 'بدون تسجيل'],
    quizSubjects: ['maroc', 'logique', 'calcul', 'sciences', 'arabe'],
    domainsLead: 'اختر مجالًا لترى كل مبارياته، مع الشروط والعتبات والتواريخ.',
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
    practiceH: 'التمرين حسب المادة', practiceLead: 'أسئلة أصلية مُراجَعة مع التصحيح والشرح المفصل، والمصدر عندما تعتمد على معلومة محددة.',
    guidesH: 'أدلة عملية',
    guides: [
      ['compass', 'التوجيه بعد البكالوريا بالمغرب', 'guides/orientation-apres-bac-maroc/', 'اختيار المسار حسب الشعبة والنقطة والميولات.'],
      ['doc', 'منصة Cursus Sup: طريقة الاستعمال', 'guides/cursus-sup-inscription/', 'إنشاء الحساب وترتيب المؤسسات وتتبع النتائج.'],
      ['star', 'النجاح في الأسئلة متعددة الاختيارات', 'guides/reussir-qcm-concours/', 'المنهجية وتدبير الوقت والتنقيط السلبي.'],
      ['wallet', 'منحة منحتي والسكن الجامعي', 'guides/bourse-minhaty-logement/', 'الشروط والملف وأجندة المنحة.'],
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

const POPULAR = ['medecine', 'ensa', 'encg-tafem', 'cpge', 'ispits', 'ensam', 'police-dgsn', 'gendarmerie'];

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
  // Funnel to the Android app (website only): pill and button in the hero,
  // band under "Par où commencer ?", question in the FAQ, structured data.
  const app = appLive(site);
  const faq = app ? [x.faq[0], { q: APP_TXT[lang].faqQ, a: APP_TXT[lang].faqA }, ...x.faq.slice(1)] : x.faq;

  const sec = (key, h2, extra = '') => html`<div class="section-head"><div><span class="eyebrow">${x.eyebrows[key]}</span><h2>${h2}</h2></div>${extra}</div>`;
  const more = (href, label) => html`<a class="more-link" href="${link(href)}">${label} ${icon('arrow')}</a>`;
  const nGroups = (g) => all.filter((c) => c.group === g.id && c[lang]).length;
  const body = html`<section class="hero hero-compact">${photo(HOME_PHOTO, lang, link, { cls: 'hero-bg', sizes: '100vw', decorative: true })}<div class="container hero-grid">
<div>
${recentRow()}
<span class="eyebrow">${t(lang, 'tagline')}</span>
<h1>${x.h1Parts[0]} <span class="hl">${x.h1Parts[1]}</span></h1>
<p class="lead">${x.lead}</p>
<div class="big-search" role="search">${icon('search')}<label class="visually-hidden" for="home-search">${t(lang, 'search')}</label><input id="home-search" type="search" autocomplete="off" placeholder="${t(lang, 'searchPlaceholder')}" data-search-input><ul class="search-results" data-search-results></ul></div>
<ul class="hero-paths">${x.heroPaths.map(([ic, h, sub, href], i) => html`<li><a class="${i === 0 ? 'hp-main' : ''}" href="${link(pfx + href)}"><span class="hp-ico">${icon(ic)}</span><span><b>${h}</b><small>${sub}</small></span></a></li>`)}</ul>
<p class="hero-note">${x.heroNote.map((n) => html`<span>${icon('check')} ${n}</span>`)}</p>
<ul class="stat-row">${x.stats(nc, nq).map(([n, l]) => html`<li><b>${n}</b> ${l}</li>`)}</ul>
${app ? '' : appBadge(site, lang, link)}
</div>
<div class="hero-art">
<h2 class="mt-0" style="font-size:1.1rem">${icon('calendar')} ${x.upcoming}</h2>
<ul class="deadlines" data-deadlines data-limit="4" data-limit-mobile="2">${upcoming.map((e) => deadlineItem(e, lang, link, all))}</ul>
<p class="hero-art-links">${more(pfx + 'outils/calendrier-concours/', x.upcomingMore)}${alertHomeLink(site, lang, link)}</p>
</div>
</div></section>

<div class="home-compact">
<section class="section qx-section"><div class="container">
${quizBlock(lang, { subjects: quizSubjects(x.quizSubjects, lang, banks), pick: true, where: 'accueil', practice: link(pfx + 'entrainement/'), mock: practiceHref(link, pfx, 'mock') })}
</div></section>

<section class="section"><div class="container">
${sec('popular', x.popular, more(pfx + 'concours/', `${x.all} (${nc})`))}
<div class="grid cols-4">${popular.map((c) => concoursCard(c, lang, link))}</div>
</div></section>

<section class="section alt"><div class="container">
${sec('domains', x.domains)}
<p class="muted" style="margin:-10px 0 18px">${x.domainsLead}</p>
<nav class="dom-chips" aria-label="${x.domains}">${GROUPS.filter((g) => nGroups(g)).map((g) => html`<a href="${link(pfx + 'concours/')}#${g.id}" data-group="${g.id}"><span class="dc-ico">${icon(g.icon)}</span>${g[lang]} <span class="dc-n">${nGroups(g)}</span></a>`)}</nav>
</div></section>

<section class="section"><div class="container">
${sec('tools', x.tools, more(pfx + 'outils/', lang === 'ar' ? 'كل الأدوات' : 'Tous les outils'))}
<div class="grid cols-3">${x.toolList.map(([ic, h, p, href], i) => html`<a class="card path-card ${hue([0, 1, 5, 4, 3, 6][i])}" href="${link(pfx + href)}"><div class="card-top"><span class="card-ico">${icon(ic)}</span><span class="card-title">${h}</span></div><p class="card-sub">${p}</p></a>`)}</div>
</div></section>

<section class="section alt"><div class="container">
${sec('practice', x.practiceH, html`<a class="btn" href="${link(pfx + 'entrainement/')}">${icon('play')} ${x.ctaPractice}</a>`)}
<p class="muted" style="margin:-10px 0 18px">${x.practiceLead}</p>
<div class="subject-grid">${SUBJECTS.filter((s) => (banks[s.id] || []).length).map((s) => {
  const art = subjectArt(s.id);
  return html`<a class="subject ${art.cls}" href="${link(qcmPath(s, lang, banks))}"><span class="s-ico">${art.ico}</span><span><span class="s-name">${s.short ? s.short[lang] : s[lang]}</span><span class="s-count">${(banks[s.id] || []).length} ${lang === 'ar' ? 'سؤالًا مصححًا' : 'QCM corrigés'}</span></span></a>`;
})}</div>
</div></section>

${appBand(site, lang, link, { campaign: 'accueil-bandeau', nc, nq: lang === 'ar' ? nq : nq.toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0') })}

<section class="section"><div class="container">
${sec('guides', x.guidesH, more(pfx + 'guides/', lang === 'ar' ? 'كل الأدلة' : 'Tous les guides'))}
<div class="grid cols-4">${x.guides.map(([ic, h, href, sub], i) => html`<a class="card path-card guide-card ${hue([1, 6, 3, 4][i])}" href="${link(pfx + href)}"><div class="cover">${icon(ic === 'wallet' ? 'briefcase' : ic)}</div><div class="g-body"><span class="card-title">${h}</span><p class="card-sub">${sub}</p></div></a>`)}</div>
</div></section>

<section class="section" style="padding-top:12px"><div class="container narrow faq">
<span class="eyebrow">${x.eyebrows.faq}</span>
<h2 class="mt-0">${x.faqH}</h2>
${faq.map((f) => html`<details><summary>${f.q}</summary><div class="faq-a"><p>${f.a}</p></div></details>`)}
<div class="callout warn" style="margin-top:18px">${t(lang, 'disclaimerShort')}</div>
</div></section>
</div>`;

  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'WebSite', name: 'Concours Maroc', alternateName: 'ConcoursMaroc',
      url: `${site.siteUrl}/${pfx}`, inLanguage: lang, description: x.desc,
    },
    {
      '@context': 'https://schema.org', '@type': 'Organization', name: 'Concours Maroc', url: `${site.siteUrl}/`,
      logo: `${site.siteUrl}/assets/img/concours-maroc-logo-512.png`,
    },
    faqLd(faq, lang),
    app ? appJsonLd(site, lang) : null,
  ];
  return {
    path, lang, title: x.title, titleFull: x.title, description: x.desc, alternate: lang === 'ar' ? '' : 'ar/',
    jsonld, body, scripts: linkMode() === 'app' ? ['assets/js/echeances.js', 'assets/js/engage.js'] : ['assets/js/echeances.js', 'assets/js/engage.js'], keywords: ['concours maroc', 'concours après bac'],
  };
}

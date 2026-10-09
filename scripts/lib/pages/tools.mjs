/* Tools pages: static, crawlable explanations + interactive widgets
 * (behaviour in src/js/outils/*.js, data in data/outils.json). */
import { html, raw, inline } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd, faqLd } from '../layout.mjs';
import { t, formatDate, STR } from '../strings.mjs';
import { guidePath } from './concours.mjs';
import { BAC, GROUPS } from '../../../content/taxonomy.mjs';
import { CALENDAR } from '../../../content/calendar.mjs';

const TYPE = {
  fr: { inscription: 'Inscriptions', ecrit: 'Épreuves', resultats: 'Résultats', deadline: 'Date limite', estimation: 'Estimation', annonce: 'Annoncé', officiel: 'Officiel' },
  ar: { inscription: 'التسجيل', ecrit: 'الاختبارات', resultats: 'النتائج', deadline: 'آخر أجل', estimation: 'تقدير', annonce: 'معلن', officiel: 'رسمي' },
};

export function deadlineItem(e, lang, link, all) {
  const c = e.concours ? all.find((x) => x.id === e.concours) : null;
  const href = c ? link(guidePath(c, lang)) : e.guide ? link((lang === 'ar' ? 'ar/' : '') + e.guide) : null;
  const months = STR[lang].monthsShort;
  let dayBox;
  if (e.date) {
    const [, m, d] = e.date.split('-').map(Number);
    dayBox = html`<b>${d}</b><span>${months[m - 1]}</span>`;
  } else {
    const [y, m] = e.month.split('-').map(Number);
    dayBox = html`<b>≈</b><span>${months[m - 1]} ${String(y).slice(2)}</span>`;
  }
  const title = e[lang] || e.fr;
  const meta = [TYPE[lang][e.type], TYPE[lang][e.confidence]].filter(Boolean).join(' · ');
  const range = e.start && e.date ? `${formatDate(e.start, lang)} → ${formatDate(e.date, lang)}` : e.date ? formatDate(e.date, lang) : '';
  return html`<li class="deadline" data-date="${e.date || ''}" data-start="${e.start || ''}" data-month="${e.month || ''}" data-id="${e.id}">
<div class="d-date">${dayBox}</div>
<div class="d-main">${href ? html`<a href="${href}">${title}</a>` : html`<strong>${title}</strong>`}<small>${range ? range + ' · ' : ''}${meta}</small></div>
<div class="d-left" data-left></div>
</li>`;
}

const TOOLS = ['calcul-note-bac', 'orientation-apres-bac', 'calendrier-concours', 'planning-revision', 'checklist-dossier', 'simulateur-qcm'];

const COPY = {
  fr: {
    toolsH: 'Outils gratuits pour préparer ses concours', toolsTitle: 'Outils pour les candidats : calcul note bac, orientation, calendrier, planning',
    toolsDesc: "Outils gratuits pour les bacheliers marocains : calcul de la moyenne et de la note de présélection, orientation selon la série, calendrier des concours, planning de révision, checklist et simulateur de barème QCM.",
    toolsLead: 'Calculez, vérifiez, planifiez : tout fonctionne dans votre navigateur, sans inscription, et vos données restent sur votre appareil.',
    tools: 'Outils',
    noscript: 'Cet outil nécessite JavaScript. Le contenu explicatif ci-dessous reste disponible.',
    'calcul-note-bac': {
      icon: 'calc', short: 'Calcul note du bac',
      title: 'Calcul de la note du bac et de la note de présélection (75/25) — Maroc',
      desc: "Calculez votre moyenne générale du bac marocain (25 % contrôle continu, 25 % régional, 50 % national), votre mention et votre note de présélection 75/25 pour médecine, ENSA, ENCG, ENSAM, ISPITS.",
      h1: 'Calcul de la moyenne du bac et de la note de présélection',
      lead: "Entrez vos trois notes : l'outil calcule votre moyenne générale, votre mention et la note de présélection utilisée par la plupart des écoles, puis la compare aux derniers seuils connus.",
      keywords: ['calcul note bac', 'calcul moyenne bac maroc', 'note de présélection', '75 25', 'calcul seuil'],
    },
    'orientation-apres-bac': {
      icon: 'compass', short: 'Orientation après le bac',
      title: 'Orientation après le bac au Maroc : quelles écoles selon ma série et ma note ?',
      desc: "Indiquez votre série de bac, votre note de présélection et votre âge : l'outil liste les concours et écoles accessibles au Maroc et vous situe par rapport aux derniers seuils connus.",
      h1: 'Quelles écoles et quels concours pour mon bac ?',
      lead: "Un filtre rapide et honnête : il vérifie la série, le seuil indicatif de la dernière session et la limite d'âge connue de chaque concours. Il ne remplace pas l'avis officiel, mais il évite d'oublier une piste.",
      keywords: ['orientation après bac', 'quelle école après le bac', 'seuil école maroc', 'tawjih'],
    },
    'calendrier-concours': {
      icon: 'calendar', short: 'Calendrier des concours',
      title: 'Calendrier des concours au Maroc 2026-2027 : dates d’inscription et d’épreuves',
      desc: "Dates limites d'inscription, épreuves écrites et périodes habituelles des concours au Maroc (médecine, ENSA, ENCG, CPGE, police, gendarmerie, FAR, OFPPT…), avec compte à rebours et ajout à l'agenda.",
      h1: 'Calendrier des concours au Maroc',
      lead: "Les prochaines échéances confirmées, puis les périodes habituelles de la session 2027 et les repères de la session 2026. Ajoutez une date à votre agenda en un clic.",
      keywords: ['calendrier concours maroc', 'date concours 2027', 'date limite inscription concours'],
    },
    'planning-revision': {
      icon: 'list', short: 'Planning de révision',
      title: 'Planning de révision pour concours : programme semaine par semaine',
      desc: "Générez un planning de révision personnalisé jusqu'au jour du concours : répartition des matières selon vos points faibles, examens blancs et révisions finales.",
      h1: 'Créer mon planning de révision',
      lead: "Choisissez votre concours, la date de l'épreuve et le temps disponible : vous obtenez un programme semaine par semaine, imprimable et enregistré sur votre appareil.",
      keywords: ['planning révision concours', 'programme révision bac concours', 'organisation révisions'],
    },
    'checklist-dossier': {
      icon: 'check', short: 'Checklist du dossier',
      title: 'Checklist du dossier de candidature aux concours au Maroc',
      desc: "Liste des pièces à préparer pour un concours ou une inscription au Maroc : CNIE, relevés de notes, photos, attestation, certificat médical… Cochez au fur et à mesure.",
      h1: 'Checklist du dossier de candidature',
      lead: 'Cochez les documents prêts : la liste est enregistrée sur votre appareil. Les pièces exactes sont toujours fixées par l’avis du concours.',
      keywords: ['dossier concours maroc', 'pièces dossier inscription', 'documents concours'],
    },
    'simulateur-qcm': {
      icon: 'scales', short: 'Simulateur de barème QCM',
      title: 'QCM avec points négatifs : faut-il répondre au hasard ? (simulateur)',
      desc: "Simulateur de barème QCM (+2/−1, +1/−0,25…) : calculez l'espérance de gain d'une réponse au hasard et la meilleure stratégie selon le nombre de propositions éliminées.",
      h1: 'Simulateur de barème QCM : répondre ou s’abstenir ?',
      lead: "Avec des points négatifs, une réponse au hasard peut coûter cher. Indiquez le barème et le nombre de propositions que vous avez éliminées : l'outil vous dit si répondre est rentable.",
      keywords: ['qcm points négatifs', 'barème qcm', 'répondre au hasard qcm', 'stratégie qcm'],
    },
  },
  ar: {
    toolsH: 'أدوات مجانية للتحضير للمباريات', toolsTitle: 'أدوات المترشحين: حساب نقطة الباك، التوجيه، الأجندة، برنامج المراجعة',
    toolsDesc: 'أدوات مجانية للحاصلين على البكالوريا بالمغرب: حساب المعدل ونقطة الانتقاء، التوجيه حسب الشعبة، أجندة المباريات، برنامج المراجعة، لائحة الوثائق ومحاكي سلم التنقيط.',
    toolsLead: 'احسب وتحقق وخطط: كل شيء يعمل في متصفحك بدون تسجيل، وتبقى بياناتك على جهازك.',
    tools: 'أدوات',
    noscript: 'تتطلب هذه الأداة تفعيل JavaScript، ويبقى الشرح أسفله متاحًا.',
    'calcul-note-bac': { icon: 'calc', short: 'حساب نقطة البكالوريا', title: 'حساب معدل البكالوريا ونقطة الانتقاء (75/25)', desc: 'احسب معدلك العام في البكالوريا (25% مراقبة مستمرة، 25% جهوي، 50% وطني) والميزة ونقطة الانتقاء 75/25 لمباريات الطب وENSA وENCG وENSAM وISPITS.', h1: 'حساب معدل البكالوريا ونقطة الانتقاء', lead: 'أدخل نقطك الثلاث: تحسب الأداة المعدل العام والميزة ونقطة الانتقاء المعتمدة في أغلب المدارس، ثم تقارنها بآخر العتبات المعروفة.', keywords: ['حساب معدل الباك', 'نقطة الانتقاء'] },
    'orientation-apres-bac': { icon: 'compass', short: 'التوجيه بعد البكالوريا', title: 'التوجيه بعد البكالوريا: ما المدارس المناسبة لشعبتي ونقطتي؟', desc: 'أدخل شعبتك ونقطة الانتقاء وسنك: تعرض الأداة المباريات والمدارس المتاحة بالمغرب وموقعك من آخر العتبات المعروفة.', h1: 'ما المدارس والمباريات المناسبة لي؟', lead: 'أداة سريعة تتحقق من الشعبة والعتبة الإرشادية لآخر دورة والسن الأقصى المعروف لكل مباراة.', keywords: ['التوجيه بعد الباك'] },
    'calendrier-concours': { icon: 'calendar', short: 'أجندة المباريات', title: 'أجندة المباريات بالمغرب 2026-2027: تواريخ التسجيل والاختبارات', desc: 'آخر آجال التسجيل والاختبارات والفترات المعتادة للمباريات بالمغرب مع العد التنازلي والإضافة إلى المفكرة.', h1: 'أجندة المباريات بالمغرب', lead: 'المواعيد القادمة المؤكدة، ثم الفترات المعتادة لدورة 2027 ومرجعيات دورة 2026.', keywords: ['أجندة المباريات'] },
    'planning-revision': { icon: 'list', short: 'برنامج المراجعة', title: 'برنامج المراجعة للمباريات: خطة أسبوعية', desc: 'أنشئ برنامج مراجعة شخصي حتى يوم المباراة: توزيع المواد حسب نقط ضعفك وامتحانات تجريبية ومراجعة نهائية.', h1: 'إنشاء برنامج المراجعة', lead: 'اختر مباراتك وتاريخ الاختبار والوقت المتاح: تحصل على برنامج أسبوعي قابل للطباعة.', keywords: ['برنامج المراجعة'] },
    'checklist-dossier': { icon: 'check', short: 'لائحة وثائق الملف', title: 'لائحة وثائق ملف الترشيح للمباريات بالمغرب', desc: 'الوثائق المطلوبة عادة في ملفات المباريات والتسجيل بالمغرب: البطاقة الوطنية، كشوف النقط، الصور، الشهادة الطبية…', h1: 'لائحة وثائق ملف الترشيح', lead: 'ضع علامة على الوثائق الجاهزة، وتُحفظ اللائحة على جهازك. الوثائق الدقيقة يحددها إعلان المباراة.', keywords: ['وثائق ملف المباراة'] },
    'simulateur-qcm': { icon: 'scales', short: 'محاكي سلم التنقيط', title: 'الأسئلة متعددة الاختيارات بالتنقيط السلبي: هل تجيب عشوائيًا؟', desc: 'محاكي سلم التنقيط (+2/−1…): احسب الربح المتوقع للإجابة العشوائية وأفضل استراتيجية حسب عدد الاقتراحات المستبعدة.', h1: 'محاكي سلم التنقيط: أجيب أم أمتنع؟', lead: 'مع التنقيط السلبي قد تكلفك الإجابة العشوائية نقطًا. أدخل السلم وعدد الاقتراحات المستبعدة لتعرف هل الإجابة مربحة.', keywords: ['التنقيط السلبي'] },
  },
};

/* ---------------- widget markup per tool ---------------- */
function widget(tool, lang, all, link) {
  const ar = lang === 'ar';
  const bacOptions = BAC.map((b) => html`<option value="${b.id}">${b[lang]}</option>`);
  switch (tool) {
    case 'calcul-note-bac':
      return html`<form class="card" id="tool-note" novalidate>
<div class="form-grid">
<div class="field"><label for="n-reg">${ar ? 'نقطة الامتحان الجهوي (الأولى باك)' : "Note de l'examen régional (1re année bac)"}</label><input id="n-reg" type="number" inputmode="decimal" min="0" max="20" step="0.01" placeholder="ex. 14,50"></div>
<div class="field"><label for="n-cc">${ar ? 'نقطة المراقبة المستمرة (الثانية باك)' : 'Note du contrôle continu (2e année bac)'}</label><input id="n-cc" type="number" inputmode="decimal" min="0" max="20" step="0.01" placeholder="ex. 15"></div>
<div class="field"><label for="n-nat">${ar ? 'نقطة الامتحان الوطني (الثانية باك)' : "Note de l'examen national (2e année bac)"}</label><input id="n-nat" type="number" inputmode="decimal" min="0" max="20" step="0.01" placeholder="ex. 13,75"></div>
<div class="field"><label for="n-bac">${ar ? 'شعبة البكالوريا' : 'Série du bac'}</label><select id="n-bac"><option value="">${ar ? '— اختر —' : '— Choisir —'}</option>${bacOptions}</select></div>
</div>
<div id="note-out" aria-live="polite"></div>
</form>
<details class="card" style="margin-top:14px"><summary><strong>${ar ? 'حساب معدل موزون حسب المواد والمعاملات' : 'Calculer une moyenne pondérée matière par matière'}</strong></summary>
<p class="muted">${ar ? 'أدخل نقطة ومعامل كل مادة كما هي في بيان نقطك (مثلًا لحساب معدل الامتحان الوطني).' : "Saisissez la note et le coefficient de chaque matière tels qu'ils figurent sur votre relevé (par exemple pour retrouver la moyenne de l'examen national)."}</p>
<div id="wavg"></div></details>`;
    case 'orientation-apres-bac':
      return html`<form class="card" id="tool-orient" novalidate>
<div class="form-grid">
<div class="field"><label for="o-bac">${ar ? 'شعبة البكالوريا' : 'Série du bac'}</label><select id="o-bac"><option value="">${ar ? '— اختر —' : '— Choisir —'}</option>${bacOptions}<option value="NONE">${ar ? 'بدون بكالوريا' : 'Je n’ai pas le bac'}</option></select></div>
<div class="field"><label for="o-note">${ar ? 'نقطة الانتقاء (75% وطني + 25% جهوي)' : 'Note de présélection (75 % national + 25 % régional)'}</label><input id="o-note" type="number" inputmode="decimal" min="0" max="20" step="0.01" placeholder="ex. 14,2"><small><a href="${link((ar ? 'ar/' : '') + 'outils/calcul-note-bac/')}">${ar ? 'لا تعرفها؟ احسبها' : 'Vous ne la connaissez pas ? Calculez-la'}</a></small></div>
<div class="field"><label for="o-birth">${ar ? 'تاريخ الازدياد (اختياري)' : 'Date de naissance (facultatif)'}</label><input id="o-birth" type="date"></div>
<div class="field"><label for="o-group">${ar ? 'المجال' : 'Domaine'}</label><select id="o-group"><option value="">${ar ? 'كل المجالات' : 'Tous les domaines'}</option>${GROUPS.map((g) => html`<option value="${g.id}">${g[lang]}</option>`)}</select></div>
</div>
<div id="orient-out" aria-live="polite"><p class="muted">${ar ? 'اختر شعبتك لعرض النتائج.' : 'Choisissez votre série pour afficher les résultats.'}</p></div>
</form>`;
    case 'calendrier-concours':
      return '';
    case 'planning-revision':
      return html`<form class="card" id="tool-plan" novalidate>
<div class="form-grid">
<div class="field"><label for="p-concours">${ar ? 'المباراة' : 'Concours visé'}</label><select id="p-concours">${all.filter((c) => c.practice).map((c) => html`<option value="${c.id}">${(c[lang] || c.fr).short}</option>`)}</select></div>
<div class="field"><label for="p-date">${ar ? 'تاريخ المباراة' : 'Date du concours'}</label><input id="p-date" type="date"></div>
<div class="field"><label for="p-hours">${ar ? 'ساعات المراجعة في اليوم' : 'Heures de révision par jour'}</label><input id="p-hours" type="number" min="0.5" max="12" step="0.5" value="2"></div>
<div class="field"><label for="p-days">${ar ? 'أيام المراجعة في الأسبوع' : 'Jours de révision par semaine'}</label><input id="p-days" type="number" min="1" max="7" step="1" value="6"></div>
</div>
<div id="p-levels"></div>
<div class="btn-row"><button class="btn" type="submit">${icon('list')} ${ar ? 'إنشاء البرنامج' : 'Générer mon planning'}</button><button class="btn ghost" type="button" data-print>${icon('print')} ${ar ? 'طباعة' : 'Imprimer'}</button></div>
<div id="plan-out" aria-live="polite"></div>
</form>`;
    case 'checklist-dossier':
      return html`<div class="card" id="tool-check"><div class="filters"><label for="c-concours" class="label" style="margin:0">${ar ? 'المباراة' : 'Concours'}</label><select id="c-concours"><option value="">${ar ? 'عام' : 'Général'}</option>${all.map((c) => html`<option value="${c.id}">${(c[lang] || c.fr).short}</option>`)}</select><button class="btn sm ghost" type="button" id="c-reset">${ar ? 'إعادة التعيين' : 'Tout décocher'}</button><button class="btn sm ghost" type="button" data-print>${icon('print')} ${ar ? 'طباعة' : 'Imprimer'}</button></div><div id="check-out"></div></div>`;
    case 'simulateur-qcm':
      return html`<form class="card" id="tool-qcm" novalidate>
<div class="form-grid">
<div class="field"><label for="q-good">${ar ? 'نقط الجواب الصحيح' : 'Points pour une bonne réponse'}</label><input id="q-good" type="number" step="0.25" value="2"></div>
<div class="field"><label for="q-bad">${ar ? 'نقط الجواب الخاطئ (سالبة)' : 'Points pour une réponse fausse (négatif)'}</label><input id="q-bad" type="number" step="0.25" value="-1"></div>
<div class="field"><label for="q-blank">${ar ? 'نقط السؤال بدون جواب' : 'Points sans réponse'}</label><input id="q-blank" type="number" step="0.25" value="0"></div>
<div class="field"><label for="q-opts">${ar ? 'عدد الاقتراحات لكل سؤال' : 'Propositions par question'}</label><input id="q-opts" type="number" min="2" max="6" value="4"></div>
</div>
<div class="seg" role="group" aria-label="presets" style="margin-bottom:12px"><button type="button" data-preset="2,-1,0,4">ENSA 2026 (+2/−1)</button><button type="button" data-preset="2,-1,0,4">ENSAM (+2/−1)</button><button type="button" data-preset="1,-1,0,4">TAFEM (−1)</button><button type="button" data-preset="1,0,0,4">${ar ? 'بدون تنقيط سلبي' : 'Sans pénalité'}</button><button type="button" data-preset="1,-0.25,0,5">+1/−0,25 (5)</button></div>
<div id="qcm-out" aria-live="polite"></div>
</form>`;
    default: return '';
  }
}

/* ---------------- explanatory content per tool ---------------- */
const CONTENT = {
  fr: {
    'calcul-note-bac': {
      body: [
        ['h2', 'Comment est calculée la moyenne du bac au Maroc ?'],
        ['p', "La moyenne générale du baccalauréat marocain combine trois notes : **25 % pour l'examen régional** (passé en 1re année du bac), **25 % pour le contrôle continu** de la 2e année et **50 % pour l'examen national** de la 2e année."],
        ['code', 'Moyenne générale = (Régional + Contrôle continu + 2 × National) ÷ 4'],
        ['p', "Exemple : régional 14, contrôle continu 16, national 13 → (14 + 16 + 2 × 13) ÷ 4 = 56 ÷ 4 = **14/20** (mention Bien)."],
        ['h2', 'Note de présélection : la règle des 75/25'],
        ['p', "Les écoles à accès régulé (médecine, pharmacie, dentaire, ENSA, ENSAM, ENCG, ISPITS, ENA, EST…) ne retiennent pas la moyenne générale : elles calculent une **note de présélection = 75 % de l'examen national + 25 % de l'examen régional**. Le contrôle continu n'y entre pas."],
        ['code', 'Note de présélection = 0,75 × National + 0,25 × Régional'],
        ['p', "Avec l'exemple précédent : 0,75 × 13 + 0,25 × 14 = 9,75 + 3,5 = **13,25/20**. On voit qu'un bon contrôle continu améliore la mention, mais pas la présélection."],
        ['h2', 'Mentions du baccalauréat'],
        ['table', [['Moyenne générale', 'Mention'], ['de 10 à moins de 12', 'Passable'], ['de 12 à moins de 14', 'Assez bien'], ['de 14 à moins de 16', 'Bien'], ['16 et plus', 'Très bien']]],
        ['p', "Certaines écoles (écoles militaires, CPGE) exigent une mention minimale, en général « Assez bien », calculée sur la moyenne générale de la session normale."],
      ],
      faq: [
        { q: 'Le contrôle continu compte-t-il pour les concours ?', a: "Pour la présélection des écoles à accès régulé, non : seule la formule 75 % national + 25 % régional est utilisée. Le contrôle continu compte en revanche dans la moyenne générale et donc dans la mention." },
        { q: 'Comment calculer la note de l’examen national ?', a: "C'est la moyenne pondérée des matières passées à l'examen national, avec les coefficients de votre série. Utilisez le calculateur de moyenne pondérée de cette page en recopiant les coefficients de votre relevé." },
        { q: 'La formule 75/25 est-elle la même partout ?', a: "C'est la règle la plus courante (médecine, ENSA, ENSAM, ENCG, ISPITS, ENA…). Certaines écoles appliquent d'autres critères (moyenne générale, notes de matières, mention) : vérifiez l'avis de chaque concours." },
      ],
    },
    'orientation-apres-bac': {
      body: [
        ['h2', 'Comment lire les résultats'],
        ['ul', [
          '**Au-dessus du seuil** : votre note dépasse le dernier seuil de présélection connu pour votre série. Vous seriez probablement convoqué à l’écrit si le seuil restait identique.',
          '**Proche du seuil** : moins d’un point d’écart, tout dépendra du seuil de la nouvelle session.',
          '**Sous le seuil** : la série est acceptée, mais votre note est en dessous du dernier seuil connu.',
          '**Sur dossier / sans seuil publié** : la sélection se fait par classement ou par d’autres critères (CPGE, EST, BTS, OFPPT…).',
          '**Âge** : la limite d’âge connue est vérifiée si vous indiquez votre date de naissance.',
        ]],
        ['p', "Les seuils changent chaque année avec le nombre de candidats et de places : l'outil sert à repérer les pistes réalistes et les écoles à ne pas oublier, pas à prédire une admission."],
        ['h2', 'Et si ma note est juste ?'],
        ['ul', [
          'Multipliez les candidatures : un même bac ouvre souvent 6 à 10 concours différents, avec des calendriers qui se chevauchent peu.',
          'Pensez aux voies sur dossier (CPGE, EST, FST, BTS) et aux filières universitaires à accès ouvert, qui mènent aussi aux écoles via des passerelles (bac+2, bac+3).',
          'Préparez l’écrit : la présélection ne fait que donner accès à l’épreuve, c’est l’écrit qui classe.',
        ]],
      ],
      faq: [
        { q: 'Les seuils affichés sont-ils ceux de cette année ?', a: "Ce sont les derniers seuils publiés ou relayés par des sources datées (la session est indiquée sur chaque fiche). Les seuils de la nouvelle session sont publiés sur Cursus Sup ou sur le site de l'école après les inscriptions." },
        { q: 'J’ai un bac étranger ou une mission : l’outil est-il valable ?', a: "Les conditions pour les bacs étrangers (missions, bacs équivalents) varient : la plupart des écoles appliquent une moyenne générale minimale. Lisez la rubrique « Conditions » de chaque fiche." },
      ],
    },
    'calendrier-concours': {
      body: [
        ['h2', 'Comment fonctionne ce calendrier'],
        ['ul', [
          '**Dates confirmées** : issues des avis officiels ou de la presse pour la session en cours. Le compte à rebours est calculé chaque jour dans votre navigateur.',
          '**Estimations 2027** : la période habituelle de chaque concours, déduite des sessions précédentes. Elle sert à anticiper, pas à remplacer l’avis officiel.',
          '**Repères 2026** : les dates de la dernière session, utiles pour se préparer à l’avance.',
        ]],
        ['p', 'Cliquez sur « Ajouter à mon agenda » pour télécharger un rappel (.ics) compatible avec Google Agenda, Outlook et le calendrier du téléphone.'],
        ['h2', 'Les grandes périodes de l’année'],
        ['table', [['Période', 'Concours habituels'], ['Février – avril', 'CNC (élèves de CPGE), Protection civile, Gendarmerie Royale, École Royale de l’Air'], ['Avril – mai', 'Écoles militaires (ARM, École Royale Navale, santé militaire), Forces Auxiliaires (officiers)'], ['Mai – juillet', 'OFPPT, CPGE, ISCAE, ISIC, BTS'], ['Juin – juillet', 'Cursus Sup : médecine, ENSA, ENSAM, ENCG ; ISPITS, ENA, IAV, ISIT…'], ['Fin juillet – septembre', 'EST, FST, listes d’attente, licences d’éducation (ENS)'], ['Septembre – décembre', 'Police (DGSN), Forces Auxiliaires (mokhaznis), bourse Minhaty']]],
      ],
      faq: [
        { q: 'Quand ont lieu les concours après le bac au Maroc ?', a: "La plupart des écrits post-bac ont lieu dans la seconde moitié de juillet, juste après les résultats du bac, avec des inscriptions entre mi-juin et début juillet. Les écoles militaires recrutent plus tôt (inscriptions entre mars et mai)." },
      ],
    },
    'planning-revision': {
      body: [
        ['h2', 'La méthode utilisée'],
        ['ul', [
          '**Répartition pondérée** : chaque matière du concours reçoit du temps selon son poids dans l’épreuve et votre niveau déclaré (une matière faible reçoit environ deux fois plus de temps qu’une matière forte).',
          '**Trois phases** : consolidation des bases, entraînement intensif sur QCM, puis simulation (examens blancs chronométrés et révision des erreurs) les dernières semaines.',
          '**Révision espacée** : les erreurs sont reprises 1, 3 et 7 jours plus tard, ce qui ancre durablement les notions.',
        ]],
        ['p', 'Le planning est enregistré sur votre appareil. Reprenez-le chaque semaine et ajustez votre niveau par matière à partir de vos résultats dans l’entraînement.'],
      ],
      faq: [
        { q: 'Combien d’heures réviser pour un concours ?', a: "Il n'y a pas de chiffre magique : 1 h 30 à 3 h par jour pendant 6 à 10 semaines est un rythme réaliste pour la plupart des concours post-bac, à condition de faire régulièrement des QCM chronométrés." },
      ],
    },
    'checklist-dossier': {
      body: [
        ['h2', 'Conseils pour un dossier sans erreur'],
        ['ul', [
          'Scannez chaque pièce en PDF lisible (300 dpi), nommée clairement : `cnie-nom-prenom.pdf`, `releve-national-2026.pdf`…',
          'Gardez les originaux et plusieurs copies certifiées conformes (légalisation à la commune) pour les inscriptions administratives.',
          'Vérifiez l’orthographe de votre nom et de votre code Massar : ils doivent être identiques sur toutes les pièces.',
          'Imprimez le reçu de préinscription et la convocation dès leur publication.',
        ]],
      ],
      faq: [
        { q: 'Faut-il légaliser les copies ?', a: "Pour les candidatures en ligne, des scans suffisent en général. Les copies certifiées conformes sont surtout demandées lors de l'inscription administrative après admission. Suivez la liste exacte de l'avis." },
      ],
    },
    'simulateur-qcm': {
      body: [
        ['h2', 'Le calcul derrière le simulateur'],
        ['p', 'Si vous hésitez entre **k** propositions restantes et que vous répondez au hasard parmi elles, vous avez une chance sur k d’avoir juste. Le gain moyen d’une réponse est :'],
        ['code', 'Gain moyen = (1/k) × points bonne réponse + (1 − 1/k) × points mauvaise réponse'],
        ['p', 'Il faut répondre si ce gain moyen dépasse les points d’une question laissée sans réponse (souvent 0).'],
        ['table', [['Barème', '4 propositions (aucune éliminée)', '3 restantes', '2 restantes'], ['+2 / −1 (ENSA 2026)', '−0,25 : s’abstenir', '0 : neutre', '+0,5 : répondre'], ['+1 / −1', '−0,5 : s’abstenir', '−0,33 : s’abstenir', '0 : neutre'], ['+1 / 0', '+0,25 : répondre', '+0,33 : répondre', '+0,5 : répondre']]],
        ['p', "En pratique : sans pénalité, ne laissez jamais de case vide. Avec une pénalité, répondez dès que vous avez éliminé assez de propositions pour que le gain moyen devienne positif."],
      ],
      faq: [
        { q: 'Vaut-il mieux laisser une question vide au concours ENSA ?', a: "Avec le barème +2/−1 publié pour 2026, répondre au hasard entre 4 propositions coûte en moyenne 0,25 point. Après avoir éliminé une proposition, l'espérance est nulle ; après en avoir éliminé deux, répondre rapporte en moyenne 0,5 point." },
      ],
    },
  },
  ar: {
    'calcul-note-bac': {
      body: [
        ['h2', 'كيف يُحسب معدل البكالوريا بالمغرب؟'],
        ['p', 'يجمع المعدل العام ثلاث نقط: **25% للامتحان الجهوي** (السنة الأولى باك)، **25% للمراقبة المستمرة** في السنة الثانية، و**50% للامتحان الوطني**.'],
        ['code', 'المعدل العام = (الجهوي + المراقبة المستمرة + 2 × الوطني) ÷ 4'],
        ['h2', 'نقطة الانتقاء: قاعدة 75/25'],
        ['p', 'تعتمد المؤسسات ذات الاستقطاب المحدود (الطب، ENSA، ENSAM، ENCG، ISPITS…) **نقطة انتقاء = 75% من الوطني + 25% من الجهوي**، ولا تدخل المراقبة المستمرة في الحساب.'],
        ['code', 'نقطة الانتقاء = 0.75 × الوطني + 0.25 × الجهوي'],
        ['table', [['المعدل العام', 'الميزة'], ['من 10 إلى أقل من 12', 'مقبول'], ['من 12 إلى أقل من 14', 'مستحسن'], ['من 14 إلى أقل من 16', 'حسن'], ['16 فما فوق', 'حسن جدًا']]],
      ],
      faq: [{ q: 'هل تحتسب المراقبة المستمرة في الانتقاء؟', a: 'لا بالنسبة لأغلب المؤسسات ذات الاستقطاب المحدود، إذ تعتمد فقط صيغة 75% وطني + 25% جهوي. لكنها تحتسب في المعدل العام وفي الميزة.' }],
    },
    'orientation-apres-bac': {
      body: [
        ['h2', 'كيف تقرأ النتائج'],
        ['ul', ['**فوق العتبة**: نقطتك تتجاوز آخر عتبة معروفة لشعبتك.', '**قريبة من العتبة**: فرق أقل من نقطة.', '**تحت العتبة**: الشعبة مقبولة لكن نقطتك أقل من آخر عتبة معروفة.', '**بالملف**: الانتقاء يتم بالترتيب أو بمعايير أخرى.']],
        ['p', 'تتغير العتبات كل سنة حسب عدد المترشحين والمقاعد، فالأداة تساعد على اكتشاف المسارات الواقعية ولا تتنبأ بالقبول.'],
      ],
      faq: [],
    },
    'calendrier-concours': {
      body: [
        ['h2', 'كيف تعمل هذه الأجندة'],
        ['ul', ['**تواريخ مؤكدة** من الإعلانات الرسمية أو الصحافة للدورة الحالية.', '**تقديرات 2027**: الفترة المعتادة لكل مباراة.', '**مرجعيات 2026**: تواريخ الدورة الماضية.']],
        ['p', 'اضغط على «أضف إلى المفكرة» لتحميل تذكير (.ics) متوافق مع Google Agenda والهاتف.'],
      ],
      faq: [],
    },
    'planning-revision': { body: [['h2', 'الطريقة المعتمدة'], ['ul', ['**توزيع موزون** حسب وزن المادة في الاختبار ومستواك.', '**ثلاث مراحل**: ترسيخ الأساسيات، تمرين مكثف، ثم امتحانات تجريبية.', '**مراجعة متباعدة** للأخطاء بعد 1 و3 و7 أيام.']]], faq: [] },
    'checklist-dossier': { body: [['h2', 'نصائح لملف بدون أخطاء'], ['ul', ['امسح كل وثيقة بصيغة PDF واضحة.', 'احتفظ بالأصول وبنسخ مصادق عليها.', 'تحقق من تطابق اسمك ورمز مسار في كل الوثائق.']]], faq: [] },
    'simulateur-qcm': {
      body: [
        ['h2', 'الحساب وراء المحاكي'],
        ['p', 'إذا ترددت بين **k** اقتراحات وأجبت عشوائيًا، فاحتمال الصواب هو 1/k. الربح المتوسط هو:'],
        ['code', 'الربح المتوسط = (1/k) × نقط الصواب + (1 − 1/k) × نقط الخطأ'],
        ['p', 'تجب إذا كان الربح المتوسط أكبر من نقط السؤال المتروك (غالبًا 0).'],
      ],
      faq: [],
    },
  },
};

function renderContent(items) {
  return items.map(([kind, val]) => {
    if (kind === 'h2') return html`<h2>${val}</h2>`;
    if (kind === 'p') return html`<p>${inline(val)}</p>`;
    if (kind === 'code') return html`<p><code style="display:inline-block;padding:.5em .8em">${val}</code></p>`;
    if (kind === 'ul') return html`<ul>${val.map((li) => html`<li>${inline(li)}</li>`)}</ul>`;
    if (kind === 'table') return html`<div class="table-wrap"><table><thead><tr>${val[0].map((h) => html`<th>${h}</th>`)}</tr></thead><tbody>${val.slice(1).map((r) => html`<tr>${r.map((c, i) => (i ? html`<td>${inline(c)}</td>` : html`<th scope="row">${inline(c)}</th>`))}</tr>`)}</tbody></table></div>`;
    return '';
  });
}

export function buildToolsPages(site, all, lang) {
  const x = COPY[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const pages = [];

  // index
  {
    const p = `${pfx}outils/index.html`;
    const link = linker(p);
    const crumbs = [[pfx, t(lang, 'home')], [`${pfx}outils/`, x.tools]];
    pages.push({
      path: p, lang, title: x.toolsTitle, description: x.toolsDesc, section: 'navTools', alternate: `${lang === 'ar' ? '' : 'ar/'}outils/`,
      jsonld: [breadcrumbLd(site, crumbs)],
      body: html`${breadcrumb(lang, link, crumbs)}<div class="container"><header class="page-head"><span class="eyebrow">${x.tools}</span><h1>${x.toolsH}</h1><p class="lead">${x.toolsLead}</p></header>
<div class="grid cols-3" style="margin-bottom:30px">${TOOLS.map((tool) => html`<a class="card path-card" href="${link(`${pfx}outils/${tool}/`)}"><div class="card-top"><span class="card-ico">${icon(x[tool].icon)}</span><span class="card-title">${x[tool].short}</span></div><p class="card-sub">${x[tool].desc}</p></a>`)}</div></div>`,
    });
  }

  for (const tool of TOOLS) {
    const meta = x[tool];
    const content = CONTENT[lang][tool] || CONTENT.fr[tool];
    const p = `${pfx}outils/${tool}/index.html`;
    const link = linker(p);
    const crumbs = [[pfx, t(lang, 'home')], [`${pfx}outils/`, x.tools], [`${pfx}outils/${tool}/`, meta.short]];
    let extra = '';
    if (tool === 'calendrier-concours') {
      const today = site.updated;
      const upcoming = CALENDAR.filter((e) => e.date && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
      const est = CALENDAR.filter((e) => e.confidence === 'estimation').sort((a, b) => a.month.localeCompare(b.month));
      const past = CALENDAR.filter((e) => e.date && e.date < today).sort((a, b) => a.date.localeCompare(b.date));
      extra = html`<div id="cal-tool">
<div class="filters no-print"><button class="btn sm" type="button" id="ics-all">${icon('calendar')} ${lang === 'ar' ? 'تحميل كل التواريخ (.ics)' : 'Exporter toutes les dates (.ics)'}</button></div>
<h2>${lang === 'ar' ? 'المواعيد القادمة' : 'Prochaines échéances confirmées'}</h2><ul class="deadlines" data-deadlines data-ics>${upcoming.map((e) => deadlineItem(e, lang, link, all))}</ul>
<h2>${lang === 'ar' ? 'الفترات المتوقعة لدورة 2027' : 'Périodes attendues pour la session 2027 (estimations)'}</h2><ul class="deadlines" data-deadlines data-ics>${est.map((e) => deadlineItem(e, lang, link, all))}</ul>
<h2>${lang === 'ar' ? 'مرجعيات دورة 2026' : 'Repères de la session 2026'}</h2><ul class="deadlines" data-deadlines>${past.map((e) => deadlineItem(e, lang, link, all))}</ul>
</div>`;
    }
    const body = html`${breadcrumb(lang, link, crumbs)}
<div class="container">
<header class="page-head"><span class="eyebrow">${x.tools}</span><h1>${meta.h1}</h1><p class="lead">${meta.lead}</p>
<p class="updated"><span>${t(lang, 'updated')} ${formatDate(site.updated, lang)}</span></p></header>
<div class="layout"><div class="prose" style="max-width:none">
<noscript><div class="callout warn">${x.noscript}</div></noscript>
${widget(tool, lang, all, link)}
${extra}
${renderContent(content.body)}
${content.faq && content.faq.length ? html`<section class="faq"><h2>${t(lang, 'faq')}</h2>${content.faq.map((f) => html`<details><summary>${f.q}</summary><div class="faq-a"><p>${inline(f.a)}</p></div></details>`)}</section>` : ''}
<div class="callout warn">${t(lang, 'disclaimerShort')}</div>
</div>
<aside><div class="aside-sticky"><div class="card" style="padding:14px 16px"><strong>${lang === 'ar' ? 'أدوات أخرى' : 'Autres outils'}</strong><ul class="checklist" style="margin:.5em 0 0;font-size:var(--fs-sm)">${TOOLS.filter((o) => o !== tool).map((o) => html`<li><a href="${link(`${pfx}outils/${o}/`)}">${x[o].short}</a></li>`)}</ul></div>
<div class="cta-box no-print"><h3>${lang === 'ar' ? 'تمرّن مجانًا' : "S'entraîner gratuitement"}</h3><p>${lang === 'ar' ? 'أسئلة مصححة وامتحانات تجريبية لكل مباراة.' : 'QCM corrigés et examens blancs pour chaque concours.'}</p><a class="btn sm" href="${link(pfx + 'entrainement/')}">${icon('play')} ${t(lang, 'practice')}</a></div></div></aside>
</div></div>`;
    pages.push({
      path: p, lang, title: meta.title, description: meta.desc, keywords: meta.keywords, section: 'navTools',
      alternate: `${lang === 'ar' ? '' : 'ar/'}outils/${tool}/`,
      jsonld: [breadcrumbLd(site, crumbs), {
        '@context': 'https://schema.org', '@type': 'WebApplication', name: meta.short, url: `${site.siteUrl}/${pfx}outils/${tool}/`,
        applicationCategory: 'EducationalApplication', operatingSystem: 'Web', inLanguage: lang,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'MAD' }, description: meta.desc,
      }, faqLd(content.faq, lang)],
      body,
      scripts: [tool === 'calendrier-concours' ? 'assets/js/echeances.js' : `assets/js/outils/${tool}.js`],
      ogImage: `assets/img/og/outil-${tool}.png`,
    });
  }
  return pages;
}

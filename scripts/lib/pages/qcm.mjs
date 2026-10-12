/* QCM sample pages per subject: crawlable questions with answers and
 * explanations, plus a link to the interactive trainer. */
import { html, raw } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd } from '../layout.mjs';
import { t } from '../strings.mjs';
import { SUBJECTS } from '../../../content/taxonomy.mjs';
import { subjectArt } from '../art.mjs';
import { renderMath, plainMath, hasMath, KATEX_CSS } from '../math.mjs';
import fs from 'node:fs';

const SOURCES = JSON.parse(fs.readFileSync(new URL('../../../content/sources.json', import.meta.url), 'utf8'));

// Past-concours questions show the concours name (source "badge").
const BADGE = new Map((SOURCES.sources || []).filter((s) => s.badge).map((s) => [s.id, s.badge]));

const PER_PAGE = 30;
const DIFF = { fr: { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' }, ar: { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' } };

// Search-result titles per subject (front-loaded keywords, about 60 characters).
const SEO_TITLE = {
  maroc: 'QCM Maroc corrigés : histoire, géographie et institutions',
  culture: 'QCM culture générale corrigés : monde, sciences, arts, sport',
  logique: 'Tests psychotechniques et QCM de logique corrigés',
  calcul: 'QCM calcul et raisonnement numérique corrigés',
  maths: 'QCM mathématiques niveau bac corrigés pour les concours',
  physique: 'QCM physique niveau bac corrigés pour les concours',
  chimie: 'QCM chimie niveau bac corrigés pour les concours',
  svt: 'QCM SVT corrigés : biologie et géologie niveau bac',
  francais: 'QCM français corrigés : grammaire, orthographe, vocabulaire',
  arabe: 'QCM langue arabe corrigés : grammaire, orthographe, rhétorique',
  anglais: 'QCM anglais corrigés : grammaire et vocabulaire',
  economie: 'QCM économie et gestion corrigés (ENCG, ISCAE, douane)',
  sciences: 'QCM sciences, numérique et administration corrigés',
  secourisme: 'QCM secourisme corrigés : premiers secours et incendie',
  architecture: 'QCM architecture et art corrigés (concours ENA)',
  securite: 'QCM institutions de sécurité corrigés (police, gendarmerie, DGAPR)',
  education: 'QCM système éducatif et pédagogie corrigés (concours enseignants)',
};

// Who the subject is for, when it is not a written test of bac-level concours.
const SCOPE = {
  fr: {
    securite: 'Culture générale des concours de niveau bac (police, gendarmerie, forces auxiliaires, protection civile, DGAPR) : les institutions de sécurité, leurs missions et les numéros d’urgence. Aucune question de droit ni de lois : elles ne figurent pas à ces épreuves.',
    education: 'Pour le concours de recrutement des enseignants des académies régionales (après la licence) : système éducatif, pédagogie et sciences de l’éducation. Les questions « système éducatif » aident aussi à préparer l’entretien d’entrée en licence d’éducation.',
  },
  ar: {
    securite: 'ثقافة عامة لمباريات مستوى البكالوريا (الأمن الوطني، الدرك، القوات المساعدة، الوقاية المدنية، إدارة السجون): مؤسسات الأمن ومهامها وأرقام الطوارئ. لا تتضمن أي سؤال في القانون، فهو غير مطلوب في هذه الاختبارات.',
    education: 'لمباراة توظيف الأساتذة بالأكاديميات الجهوية (بعد الإجازة): المنظومة التربوية والبيداغوجيا وعلوم التربية. وتساعد أسئلة «المنظومة التربوية» أيضًا على التحضير لمقابلة ولوج إجازة التربية.',
  },
};

const TXT = {
  fr: {
    qcm: 'QCM corrigés', title: (s) => SEO_TITLE[s.id] || `QCM ${s.short.fr} corrigés pour les concours`,
    desc: (s, n) => `${n} questions corrigées de ${s.fr.toLowerCase()} pour préparer les concours au Maroc, avec réponse et explication détaillée. Entraînez-vous gratuitement.`,
    h1: (s) => `QCM corrigés : ${s.fr}`,
    lead: (n, total) => `${n} questions d'exemple sur ${total} disponibles dans l'entraînement, avec la bonne réponse et une explication. Cliquez sur « Voir la réponse » après avoir réfléchi.`,
    show: 'Voir la réponse et l’explication', answer: 'Bonne réponse', train: 'S’entraîner sur cette matière (chronométré, corrigé)',
    idxTitle: 'QCM corrigés par matière pour les concours au Maroc', idxDesc: 'QCM corrigés gratuits par matière : culture générale, Maroc, logique, calcul, mathématiques, physique, chimie, SVT, français, arabe, anglais, économie, secourisme, institutions de sécurité, pédagogie.',
    idxH1: 'QCM corrigés par matière', idxLead: 'Toutes les questions sont originales, relues et accompagnées d’une explication. Une erreur ? Signalez-la depuis la page contact. Choisissez une matière.',
    notice: 'Questions originales rédigées pour l’entraînement : elles reproduisent le style et le niveau des épreuves, pas des sujets officiels.',
  },
  ar: {
    qcm: 'أسئلة مصححة', title: (s) => `أسئلة مصححة: ${s.ar} — التحضير للمباريات`,
    desc: (s, n) => `${n} سؤالًا مصححًا في ${s.ar} للتحضير للمباريات بالمغرب، مع الجواب والشرح المفصل. تمرّن مجانًا.`,
    h1: (s) => `أسئلة مصححة: ${s.ar}`,
    lead: (n, total) => `${n} سؤالًا نموذجيًا من أصل ${total} متاحة في التمرين، مع الجواب الصحيح والشرح.`,
    show: 'عرض الجواب والشرح', answer: 'الجواب الصحيح', train: 'تمرّن على هذه المادة (موقت ومصحح)',
    idxTitle: 'أسئلة مصححة حسب المادة للتحضير للمباريات بالمغرب', idxDesc: 'أسئلة مصححة مجانية حسب المادة: الثقافة العامة، المغرب، المنطق، الحساب، اللغة العربية، العلوم.',
    idxH1: 'أسئلة مصححة حسب المادة', idxLead: 'كل الأسئلة أصلية ومُراجَعة ومرفقة بشرح. وجدت خطأ؟ أبلغ عنه من صفحة الاتصال. اختر مادة.',
    notice: 'أسئلة أصلية محررة للتمرين: تحاكي أسلوب الاختبارات ومستواها وليست مواضيع رسمية.',
  },
};

/* Site-relative path of the QCM page of a subject for a UI language: Arabic
 * pages exist only for subjects with enough Arabic questions, otherwise the
 * French page is used. */
export function qcmPath(s, lang, banks) {
  const ar = (banks[s.id] || []).filter((q) => q.l10n.ar).length;
  return `${lang === 'ar' && ar >= 15 ? 'ar/' : ''}qcm/${s.slug}/`;
}

/* Picks a representative, stable sample: round-robin over subcategories,
 * mixing difficulties, deterministic so the page does not change between builds. */
function sample(questions, lang, n) {
  const avail = questions.filter((q) => q.l10n[lang]);
  const bySub = new Map();
  for (const q of avail) {
    if (!bySub.has(q.subcategory)) bySub.set(q.subcategory, []);
    bySub.get(q.subcategory).push(q);
  }
  const queues = [...bySub.values()];
  const out = [];
  let i = 0;
  while (out.length < n && queues.some((qq) => qq.length)) {
    const qq = queues[i % queues.length];
    if (qq.length) out.push(qq.shift());
    i++;
  }
  return out;
}

export function buildQcmPages(site, all, lang, banks) {
  const x = TXT[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const pages = [];
  const count = (s, l) => (banks[s.id] || []).filter((q) => q.l10n[l]).length;
  // UI language of the page -> language of the questions shown on it.
  //  FR pages: every subject (the Arabic-language bank is shown in Arabic).
  //  AR pages: only subjects that have Arabic content (no duplicated French pages).
  const pickLang = (s, l) => {
    if (count(s, l) >= 15) return l;
    if (l === 'fr' && count(s, 'ar') >= 15) return 'ar';
    return null;
  };
  const subjects = SUBJECTS.filter((s) => pickLang(s, lang));
  for (const s of subjects) {
    const qs = banks[s.id];
    const useLang = pickLang(s, lang);
    const list = sample(qs, useLang, PER_PAGE);
    const p = `${pfx}qcm/${s.slug}/index.html`;
    const link = linker(p);
    const crumbs = [[pfx, t(lang, 'home')], [`${pfx}qcm/`, x.qcm], [`${pfx}qcm/${s.slug}/`, s[lang]]];
    const otherLang = lang === 'ar' ? 'fr' : 'ar';
    const otherHas = otherLang === 'fr' ? true : pickLang(s, 'ar') === 'ar';
    const body = html`${breadcrumb(lang, link, crumbs)}
<div class="container narrow">
<header class="page-head"><span class="eyebrow">${x.qcm}</span><h1>${x.h1(s)}</h1><p class="lead">${x.lead(list.length, qs.length)}</p>
<a class="btn no-print" href="${link(pfx + 'entrainement/')}#/setup?subject=${s.id}">${icon('play')} ${x.train}</a></header>
<p class="callout info">${x.notice}</p>
${SCOPE[lang][s.id] ? html`<p class="callout warn">${SCOPE[lang][s.id]}</p>` : ''}
<ol class="qcm-list">${list.map((q) => {
  const b = q.l10n[useLang];
  const ql = useLang;
  return html`<li class="qcm-item" lang="${ql}" dir="${ql === 'ar' ? 'rtl' : 'ltr'}">
<div class="meta"><span class="badge">${DIFF[lang][q.difficulty]}</span>${BADGE.has(q.sourceId) ? html` <span class="badge gold">${BADGE.get(q.sourceId)[lang] || BADGE.get(q.sourceId).fr}</span>` : ''}</div>
<div class="q" style="white-space:pre-line">${raw(renderMath(b.text, true))}</div>
<ol class="opts">${b.choices.map((c) => html`<li>${raw(renderMath(c, true))}</li>`)}</ol>
<details><summary>${x.show}</summary><div class="answer"><strong>${x.answer} : ${raw(renderMath(b.choices[b.correctIndex]))}</strong><br>${raw(renderMath(b.explanation))}</div></details>
</li>`;
})}</ol>
<div class="cta-box no-print" style="margin:20px 0 40px"><h3>${x.train}</h3><a class="btn" href="${link(pfx + 'entrainement/')}#/setup?subject=${s.id}">${icon('play')} ${t(lang, 'practice')}</a></div>
</div>`;
    const quizLd = {
      '@context': 'https://schema.org', '@type': 'Quiz', name: x.h1(s), inLanguage: useLang, educationalLevel: 'Baccalauréat',
      about: { '@type': 'Thing', name: s[lang] },
      hasPart: list.slice(0, 20).map((q) => {
        const b = q.l10n[useLang];
        return {
          '@type': 'Question', eduQuestionType: 'Multiple choice', text: plainMath(b.text),
          acceptedAnswer: { '@type': 'Answer', text: plainMath(b.choices[b.correctIndex]) },
          suggestedAnswer: b.choices.filter((_, i) => i !== b.correctIndex).map((c) => ({ '@type': 'Answer', text: plainMath(c) })),
        };
      }),
    };
    pages.push({
      path: p, lang, title: x.title(s), description: x.desc(s, qs.length), section: 'navPractice',
      alternate: otherHas ? `${lang === 'ar' ? '' : 'ar/'}qcm/${s.slug}/` : null,
      jsonld: [breadcrumbLd(site, crumbs), quizLd], body, keywords: [`qcm ${s.fr.toLowerCase()}`],
      // formulas are typeset at build time: only the KaTeX stylesheet is needed
      styles: list.some((q) => { const b = q.l10n[useLang]; return [b.text, b.explanation, ...b.choices].some(hasMath); }) ? [KATEX_CSS] : [],
    });
  }
  // index
  const ip = `${pfx}qcm/index.html`;
  const link = linker(ip);
  const crumbs = [[pfx, t(lang, 'home')], [`${pfx}qcm/`, x.qcm]];
  pages.push({
    path: ip, lang, title: x.idxTitle, description: x.idxDesc, section: 'navPractice', alternate: `${lang === 'ar' ? '' : 'ar/'}qcm/`,
    jsonld: [breadcrumbLd(site, crumbs)],
    body: html`${breadcrumb(lang, link, crumbs)}<div class="container"><header class="page-head"><span class="eyebrow">${x.qcm}</span><h1>${x.idxH1}</h1><p class="lead">${x.idxLead}</p></header>
<div class="grid cols-3" style="margin-bottom:30px">${subjects.map((s) => html`<a class="card path-card ${subjectArt(s.id).cls}" href="${link(`${pfx}qcm/${s.slug}/`)}"><div class="card-top"><span class="card-ico">${subjectArt(s.id).ico}</span><span class="card-title">${s[lang]}</span></div><p class="card-sub">${banks[s.id].length} ${lang === 'ar' ? 'سؤال' : 'questions'}</p></a>`)}</div></div>`,
  });
  return pages;
}

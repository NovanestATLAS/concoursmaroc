/* Blocks driven by src/js/engage.js (website only, never in the Android app):
 * the "Quiz express" played inside a page, the "recently viewed" row and the
 * "what next" links at the end of a fiche. */
import { html } from './html.mjs';
import { icon } from './icons.mjs';
import { SUBJECTS, LEVELS, DEFAULT_LEVEL } from '../../content/taxonomy.mjs';

const TXT = {
  fr: {
    eyebrow: 'Quiz express', h: 'Teste ton niveau en 1 minute', start: 'Lancer le quiz', note: '5 questions corrigées · gratuit · sans inscription',
    lead: 'Choisis une matière, réponds à 5 QCM tirés des épreuves des concours et découvre tout de suite la correction expliquée.',
    mix: 'Mélange', pickLabel: 'Matière du quiz',
    hConcours: (n) => `Teste-toi : 5 QCM du concours ${n}`,
    leadConcours: 'Des questions au niveau de ce concours, avec la correction et l’explication après chaque réponse.',
    noscript: 'Le quiz a besoin de JavaScript. Ouvrez l’entraînement complet :',
  },
  ar: {
    eyebrow: 'اختبار سريع', h: 'اختبر مستواك في دقيقة واحدة', start: 'ابدأ الاختبار', note: '5 أسئلة مصححة · مجانًا · بدون تسجيل',
    lead: 'اختر مادة، أجب عن 5 أسئلة من نوع أسئلة المباريات، واكتشف التصحيح والشرح مباشرة.',
    mix: 'مزيج', pickLabel: 'مادة الاختبار',
    hConcours: (n) => `اختبر نفسك: 5 أسئلة لمباراة ${n}`,
    leadConcours: 'أسئلة في مستوى هذه المباراة، مع التصحيح والشرح بعد كل إجابة.',
    noscript: 'يتطلب الاختبار تفعيل JavaScript. افتح التمرين الكامل:',
  },
};

function labels(ids, lang) {
  const out = {};
  for (const id of ids) {
    const s = SUBJECTS.find((x) => x.id === id);
    if (s) out[id] = (s.short && s.short[lang]) || s[lang];
  }
  return out;
}

/* Subjects that have enough questions for a quiz in this language (else in
   French, which engage.js shows with a "question en français" note). */
export function quizSubjects(ids, lang, banks, min = 10) {
  return ids.filter((id) => {
    const b = banks[id] || [];
    return b.filter((q) => q.l10n[lang]).length >= min || b.filter((q) => q.l10n.fr).length >= min;
  });
}

/* opts: { subjects, pick (show subject buttons), practice, mock, where, title, lead, level } */
export function quizBlock(lang, opts) {
  if (!opts.subjects || !opts.subjects.length) return '';
  const x = TXT[lang] || TXT.fr;
  const lab = labels(opts.subjects, lang);
  const lv = opts.level ? LEVELS.find((l) => l.id === (opts.level || DEFAULT_LEVEL)) : null;
  return html`<section class="qx no-print" data-quiz data-where="${opts.where || 'page'}" data-subjects="${opts.subjects.join(' ')}" data-labels="${JSON.stringify(lab)}"${lv && lv.mix ? html` data-mix="${JSON.stringify(lv.mix)}"` : ''} data-practice="${opts.practice}"${opts.mock ? html` data-mock="${opts.mock}"` : ''} aria-labelledby="qx-h-${opts.where || 'page'}">
<div class="qx-intro" data-quiz-intro>
<div>
<span class="eyebrow">${x.eyebrow}</span>
<h2 id="qx-h-${opts.where || 'page'}">${opts.title || x.h}</h2>
<p class="qx-lead">${opts.lead || x.lead}</p>
${opts.pick && opts.subjects.length > 1 ? html`<div class="qx-pick" role="group" aria-label="${x.pickLabel}"><button type="button" data-quiz-subject="*" aria-pressed="true">${x.mix}</button>${opts.subjects.map((id) => html`<button type="button" data-quiz-subject="${id}" aria-pressed="false">${lab[id]}</button>`)}</div>` : ''}
</div>
<div class="qx-go"><button class="btn" type="button" data-quiz-start>${icon('play')} ${x.start}</button><small>${x.note}</small></div>
</div>
<div class="qx-stage" data-quiz-stage aria-live="polite" hidden></div>
<noscript><p>${x.noscript} <a href="${opts.practice}">${opts.practice}</a></p></noscript>
</section>`;
}

export function quizTitle(lang, short) { return (TXT[lang] || TXT.fr).hConcours(short); }
export function quizLead(lang) { return (TXT[lang] || TXT.fr).leadConcours; }

/* Row of recently viewed fiches, filled by engage.js (hidden when empty). */
export function recentRow() {
  return html`<div class="recent-row" data-recent hidden></div>`;
}

const NEXT = {
  fr: {
    h: 'Et maintenant ?',
    practice: ['Je m’entraîne sur ce concours', 'QCM corrigés au niveau du concours'],
    mock: ['Je passe un examen blanc', 'Chronométré, au barème du concours'],
    calendar: ['Je note les dates', 'Calendrier et rappels dans mon agenda'],
    note: ['Je calcule ma note', 'Présélection 75/25 et mention'],
    orient: ['Je vérifie mon éligibilité', 'Les écoles accessibles avec ma série'],
    all: ['Je compare avec d’autres concours', '33 fiches, par domaine'],
  },
  ar: {
    h: 'ماذا بعد؟',
    practice: ['أتمرن على هذه المباراة', 'أسئلة مصححة في مستوى المباراة'],
    mock: ['أجتاز امتحانًا تجريبيًا', 'موقت وبسلم تنقيط المباراة'],
    calendar: ['أسجل التواريخ', 'الأجندة والتذكير في مفكرتي'],
    note: ['أحسب نقطتي', 'نقطة الانتقاء 75/25 والميزة'],
    orient: ['أتحقق من أهليتي', 'المدارس المتاحة حسب شعبتي'],
    all: ['أقارن مع مباريات أخرى', '33 بطاقة حسب المجال'],
  },
};

/* "What next" links at the end of a fiche (all pages but the app). */
export function nextSteps(lang, link, items) {
  const x = NEXT[lang] || NEXT.fr;
  return html`<nav class="next-steps no-print" aria-labelledby="ns-h"><h2 id="ns-h">${x.h}</h2><ul>
${items.map(([key, href, ic]) => html`<li><a href="${href}"><span class="ns-ico">${icon(ic)}</span><span>${x[key][0]}<small>${x[key][1]}</small></span></a></li>`)}
</ul></nav>`;
}

/* "Partager sur WhatsApp" (wa.me link, no API key): the most used channel in
   Morocco. The shared address carries utm_source=whatsapp so GA4 counts the
   visits it brings. Website only. */
export function waShare(lang, url, text, campaign) {
  const u = `${url}${url.includes('?') ? '&' : '?'}utm_source=whatsapp&utm_medium=partage&utm_campaign=${campaign}`;
  const href = `https://wa.me/?text=${encodeURIComponent(`${text}\n${u}`)}`;
  return html`<a class="btn sm wa no-print" href="${href}" target="_blank" rel="noopener" data-wa="${campaign}">${icon('chat')} WhatsApp</a>`;
}

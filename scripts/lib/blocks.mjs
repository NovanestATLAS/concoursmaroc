/* Renders authored content blocks into HTML.
 * Block shapes: {p}, {h3}, {ul}, {ol}, {steps}, {checklist}, {table:{head,rows}},
 * {callout:'info'|'warn'|'ok'|'bad', text}, {seuils:true}, {practice:true}, {html}.
 * Authored text supports **bold**, *italic*, `code` and [links](url); links
 * written as (@/path/) are resolved to the same-language page. */
import { html, raw, inline, esc } from './html.mjs';
import { icon } from './icons.mjs';
import { BAC_SHORT, LEVELS, DEFAULT_LEVEL } from '../../content/taxonomy.mjs';
import { practiceLine } from './app-funnel.mjs';

export function makeText(ctx) {
  const prefix = ctx.lang === 'ar' ? 'ar/' : '';
  return (s) => {
    if (s == null) return raw('');
    const resolved = String(s).replace(/\]\(@\/([^)]*)\)/g, (m, p) => `](${ctx.link(prefix + p)})`);
    return inline(resolved);
  };
}

const LABELS = {
  fr: {
    serie: 'Série du bac', seuil: 'Seuil', session: 'Session', formula75: 'Note de présélection = 75 % examen national + 25 % examen régional.',
    noSeuil: "Pas de seuil national publié : la sélection se fait sur dossier, au classement des moyennes.",
    practiceTitle: 'Entraînez-vous maintenant', practiceText: 'QCM corrigés et examen blanc chronométré adaptés à ce concours, gratuits et utilisables hors ligne.',
    practiceBtn: "Commencer l'entraînement", mockBtn: "Passer l'examen blanc",
    level: 'Niveau des questions', mix: (b, i, a) => `${b} % débutant, ${i} % intermédiaire, ${a} % avancé`,
  },
  ar: {
    serie: 'شعبة البكالوريا', seuil: 'العتبة', session: 'الدورة', formula75: 'نقطة الانتقاء = 75% الامتحان الوطني + 25% الامتحان الجهوي.',
    noSeuil: 'لا توجد عتبة وطنية منشورة: يتم الانتقاء بناءً على الملف وترتيب المعدلات.',
    practiceTitle: 'تمرّن الآن', practiceText: 'أسئلة مصححة وامتحان تجريبي موقت ملائم لهذه المباراة، مجانًا وبدون إنترنت.',
    practiceBtn: 'ابدأ التمرين', mockBtn: 'اجتز الامتحان التجريبي',
    level: 'مستوى الأسئلة', mix: (b, i, a) => `${b}% مبتدئ، ${i}% متوسط، ${a}% متقدم`,
  },
};

/* "Niveau des questions : Sélectif (15 % débutant, …)", one entry per track
 * when the grades of the concours differ. */
function levelText(practice, lang, lab) {
  const one = (id) => {
    const lv = LEVELS.find((l) => l.id === id) || LEVELS.find((l) => l.id === DEFAULT_LEVEL);
    const pc = (x) => Math.round(x * 100);
    return `${lv[lang] || lv.fr} (${lab.mix(pc(lv.mix.beginner), pc(lv.mix.intermediate), pc(lv.mix.advanced))})`;
  };
  const sep = lang === 'ar' ? ': ' : ' : ';
  const tracks = practice.tracks || [];
  const body = tracks.length
    ? tracks.map((tr) => `${(lang === 'ar' && tr.ar) || tr.fr}${sep}${one(tr.difficulty)}`).join(' · ')
    : one(practice.difficulty);
  return `${lab.level}${tracks.length ? ' — ' : sep}${body}`;
}

export function renderBlocks(blocks, ctx) {
  const T = makeText(ctx);
  const lab = LABELS[ctx.lang] || LABELS.fr;
  return (blocks || []).map((b) => {
    if (b.p) return html`<p>${T(b.p)}</p>`;
    if (b.h3) return html`<h3${b.id ? raw(` id="${esc(b.id)}"`) : ''}>${T(b.h3)}</h3>`;
    if (b.ul) return html`<ul>${b.ul.map((li) => html`<li>${T(li)}</li>`)}</ul>`;
    if (b.ol) return html`<ol>${b.ol.map((li) => html`<li>${T(li)}</li>`)}</ol>`;
    if (b.steps) return html`<ol class="steps">${b.steps.map((li) => html`<li>${T(li)}</li>`)}</ol>`;
    if (b.checklist) return html`<ul class="checklist">${b.checklist.map((li) => html`<li>${T(li)}</li>`)}</ul>`;
    if (b.callout) return html`<div class="callout ${b.callout}">${T(b.text)}</div>`;
    if (b.table) {
      return html`<div class="table-wrap"><table>
<thead><tr>${b.table.head.map((h) => html`<th scope="col">${T(h)}</th>`)}</tr></thead>
<tbody>${b.table.rows.map((r) => html`<tr>${r.map((c, i) => (i === 0 ? html`<th scope="row">${T(c)}</th>` : html`<td>${T(c)}</td>`))}</tr>`)}</tbody>
</table></div>`;
    }
    if (b.seuils) {
      const s = ctx.concours.seuils;
      if (!s || !s.rows || !s.rows.length) {
        if (s && s.note) return html`<div class="callout info">${T(s.note[ctx.lang] || s.note.fr)}</div>`;
        return html`<p class="muted">${lab.noSeuil}</p>`;
      }
      return html`<div class="table-wrap"><table>
<thead><tr><th scope="col">${lab.serie}</th><th scope="col">${lab.seuil} (${lab.session} ${s.year})</th></tr></thead>
<tbody>${s.rows.map(([code, val, note]) => html`<tr><th scope="row">${(BAC_SHORT[code] && BAC_SHORT[code][ctx.lang]) || code}</th><td>${typeof val === 'number' ? `${String(val).replace('.', ctx.lang === 'ar' ? '.' : ',')}/20` : val}${note ? html` <small class="muted">${note[ctx.lang] || note.fr || note}</small>` : ''}</td></tr>`)}</tbody>
</table></div>
${s.formula === '75/25' ? html`<p class="muted"><small>${lab.formula75}</small></p>` : ''}
${s.note ? html`<p class="muted"><small>${T(s.note[ctx.lang] || s.note.fr)}</small></p>` : ''}`;
    }
    if (b.practice) {
      const id = ctx.concours.id;
      const base = ctx.link((ctx.lang === 'ar' ? 'ar/' : '') + 'entrainement/');
      return html`<div class="cta-box no-print" style="margin:1.2em 0">
<h3>${lab.practiceTitle}</h3><p>${lab.practiceText}</p>
${ctx.concours.practice ? html`<p class="muted"><small>${levelText(ctx.concours.practice, ctx.lang, lab)}</small></p>` : ''}
<div class="btn-row"><a class="btn" href="${base}?concours=${id}">${icon('play')} ${lab.practiceBtn}</a>
<a class="btn ghost" href="${base}?concours=${id}#/mock">${icon('clock')} ${lab.mockBtn}</a></div>
${ctx.site ? practiceLine(ctx.site, ctx.lang) : ''}</div>`;
    }
    if (b.html) return raw(b.html);
    return '';
  });
}

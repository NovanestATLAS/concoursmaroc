/* Mathematical notation in the question banks: LaTeX between dollar signs,
 * e.g. "Que vaut $\lim_{x \to 0} \frac{\sin 3x}{x}$ ?".
 * - renderMath: HTML for the static QCM pages (typeset at build time, so
 *   these pages only need the KaTeX stylesheet and fonts, no script);
 * - checkMath: throws on an unbalanced "$" or a formula KaTeX cannot read,
 *   so a typo stops the build instead of reaching a candidate;
 * - plainMath: readable text for structured data and descriptions.
 * The trainer typesets the same notation in the browser (src/js/entrainement/math.js). */
import { createRequire } from 'node:module';
import { esc } from './html.mjs';

const require = createRequire(import.meta.url);
const katex = require('../../src/vendor/katex/katex.min.js');

const RE = /\$([^$]+)\$/g;

export const KATEX_CSS = 'assets/vendor/katex/katex.min.css';

export function hasMath(s) { return typeof s === 'string' && s.includes('$'); }

export function renderMath(s) {
  const str = s == null ? '' : String(s);
  if (!hasMath(str)) return esc(str);
  let out = '';
  let last = 0;
  for (const m of str.matchAll(RE)) {
    out += esc(str.slice(last, m.index));
    out += `<span class="math" dir="ltr">${katex.renderToString(m[1], { throwOnError: false })}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(str.slice(last));
}

export function checkMath(s, where) {
  if (!hasMath(s)) return;
  if ((s.match(/\$/g) || []).length % 2) throw new Error(`${where}: unbalanced "$" in ${JSON.stringify(s.slice(0, 80))}`);
  for (const m of s.matchAll(RE)) {
    try { katex.renderToString(m[1], { throwOnError: true }); } catch (e) {
      throw new Error(`${where}: invalid formula $${m[1]}$ — ${e.message.split('\n')[0]}`);
    }
  }
}

export function plainMath(s) {
  if (!hasMath(s)) return s;
  return String(s).replace(RE, (m, tex) => {
    let t = tex.replace(/\\left|\\right|\\displaystyle|\\[,;!]/g, ' ').replace(/\\mathrm\{d\}/g, 'd');
    for (let i = 0; i < 8; i++) {
      const before = t;
      t = t.replace(/\\(?:mathbb|mathrm|text|operatorname|mathbf)\{([^{}]*)\}/g, '$1')
        .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
        .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
        .replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/_\{([^{}]*)\}/g, '_$1');
      if (t === before) break;
    }
    return t.replace(/\\to/g, '→').replace(/\\pm/g, '±').replace(/\\infty/g, '∞').replace(/\\times|\\cdot/g, '×')
      .replace(/\\leq?/g, '≤').replace(/\\geq?/g, '≥').replace(/\\neq/g, '≠').replace(/\\int/g, '∫').replace(/\\sum/g, 'Σ')
      .replace(/\\pi/g, 'π').replace(/\\([A-Za-z]+)/g, '$1').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  });
}

/* Every text field of every question goes through checkMath. */
export function checkBanks(banks) {
  let formulas = 0;
  for (const qs of Object.values(banks)) {
    for (const q of qs) {
      for (const [l, b] of Object.entries(q.l10n)) {
        for (const s of [b.text, b.correction, b.explanation, ...b.choices]) {
          checkMath(s, `${q.id} [${l}]`);
          if (hasMath(s)) formulas += (s.match(RE) || []).length;
        }
      }
    }
  }
  return formulas;
}

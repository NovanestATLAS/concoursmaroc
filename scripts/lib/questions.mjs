/* Question banks: legacy JSON banks + compact text banks (*.txt).
 *
 * Text format (one file per subject, e.g. content/questions/maths.txt):
 *
 *   @category maths
 *   @source src-general            (default source id, optional)
 *
 *   [MAT-001] suites | intermediate
 *   Q: Question text (may continue on following lines)
 *   * correct choice
 *   - wrong choice
 *   - wrong choice
 *   - wrong choice
 *   C: one-line correction
 *   E: detailed explanation (may continue on following lines)
 *   S: src-xyz                     (optional source id for this question)
 *   AR:                            (optional Arabic version, same keys follow)
 *
 * Four choices (five for questions in the medicine concours format) and exactly
 * one "*" per language block; every language has the same number of choices.
 * Choices are shuffled at build time (same permutation for every language,
 * stable per question id), so the order in the source does not matter.
 * Add the flag "keep" to the header line to keep the source order, e.g.
 *   [MAT-002] suites | beginner | keep
 */
import fs from 'node:fs';
import path from 'node:path';

const DIFFS = ['beginner', 'intermediate', 'advanced'];

export function parseTxtBank(text, file) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const defaults = { category: null, source: 'src-general', difficulty: 'intermediate' };
  const out = [];
  let q = null;
  let lang = 'fr';
  let field = null;

  const err = (n, msg) => { throw new Error(`${file}:${n + 1}: ${msg}`); };
  const block = () => {
    if (!q.l10n[lang]) q.l10n[lang] = { text: '', choices: [], correctIndex: -1, correction: '', explanation: '' };
    return q.l10n[lang];
  };

  lines.forEach((raw, n) => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { field = null; return; }
    if (/^#/.test(line) && !q) return;
    if (/^#\s/.test(line)) return;
    const dir = line.match(/^@(\w+)\s+(.+)$/);
    if (dir) { defaults[dir[1]] = dir[2].trim(); return; }
    const head = line.match(/^\[([A-Z0-9][A-Z0-9-]*)\]\s*(.*)$/);
    if (head) {
      if (q) out.push(q);
      const parts = head[2].split('|').map((s) => s.trim()).filter(Boolean);
      const diff = parts.find((p) => DIFFS.includes(p)) || defaults.difficulty;
      const sub = parts.find((p) => !DIFFS.includes(p) && !/^(ts|keep)$/i.test(p)) || 'general';
      q = {
        id: head[1], category: defaults.category, subcategory: sub, difficulty: diff,
        sourceId: defaults.source, timeSensitive: parts.some((p) => /^ts$/i.test(p)),
        keepOrder: parts.some((p) => /^keep$/i.test(p)),
        l10n: {}, _line: n + 1,
      };
      lang = 'fr';
      field = null;
      return;
    }
    if (!q) err(n, `content outside a question: "${line.slice(0, 40)}"`);
    if (/^AR:\s*$/.test(line)) { lang = 'ar'; field = null; return; }
    if (/^EN:\s*$/.test(line)) { lang = 'en'; field = null; return; }
    let m;
    if ((m = line.match(/^Q:\s?(.*)$/))) { block().text = m[1]; field = 'text'; return; }
    if ((m = line.match(/^C:\s?(.*)$/))) { block().correction = m[1]; field = 'correction'; return; }
    if ((m = line.match(/^E:\s?(.*)$/))) { block().explanation = m[1]; field = 'explanation'; return; }
    if ((m = line.match(/^S:\s?(.*)$/))) { q.sourceId = m[1].trim(); field = null; return; }
    if ((m = line.match(/^([*-]) (.*)$/))) {
      const b = block();
      if (m[1] === '*') {
        if (b.correctIndex !== -1) err(n, `${q.id}: two correct answers`);
        b.correctIndex = b.choices.length;
      }
      b.choices.push(m[2].trim());
      field = 'choice';
      return;
    }
    // continuation line
    const b = block();
    if (field === 'text' || field === 'explanation' || field === 'correction') b[field] += '\n' + line.trim();
    else if (field === 'choice') b.choices[b.choices.length - 1] += ' ' + line.trim();
    else err(n, `${q.id}: unexpected line "${line.slice(0, 50)}"`);
  });
  if (q) out.push(q);

  return out.map((qq) => finalize(qq, file));
}

function finalize(q, file) {
  const langs = Object.keys(q.l10n);
  if (!langs.length) throw new Error(`${file}: ${q.id} has no content`);
  for (const l of langs) {
    const b = q.l10n[l];
    const where = `${file}: ${q.id} [${l}]`;
    if (!b.text) throw new Error(`${where}: missing Q:`);
    if (b.choices.length !== 4 && b.choices.length !== 5) throw new Error(`${where}: needs 4 or 5 choices, found ${b.choices.length}`);
    if (b.correctIndex < 0) throw new Error(`${where}: no correct choice marked with "*"`);
    if (new Set(b.choices.map((c) => c.toLowerCase())).size !== b.choices.length) throw new Error(`${where}: duplicate choices`);
    if (!b.correction) throw new Error(`${where}: missing C:`);
    if (!b.explanation) throw new Error(`${where}: missing E:`);
  }
  const base = q.l10n.fr || q.l10n[langs[0]];
  if (langs.some((l) => q.l10n[l].choices.length !== base.choices.length)) throw new Error(`${file}: ${q.id}: every language needs the same number of choices`);
  delete q._line;
  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory,
    difficulty: q.difficulty,
    sourceId: q.sourceId,
    correctIndex: base.correctIndex,
    timeSensitive: q.timeSensitive,
    keepOrder: q.keepOrder,
    languages: langs.sort(),
    l10n: q.l10n,
  };
}

export function validateQuestion(q, file) {
  const where = `${file}: ${q.id}`;
  if (!q.id || !q.category) throw new Error(`${where}: missing id/category`);
  if (!DIFFS.includes(q.difficulty)) throw new Error(`${where}: bad difficulty ${q.difficulty}`);
  for (const l of Object.keys(q.l10n || {})) {
    const b = q.l10n[l];
    if (!Array.isArray(b.choices) || (b.choices.length !== 4 && b.choices.length !== 5)) throw new Error(`${where} [${l}]: 4 or 5 choices required`);
    if (!(b.correctIndex >= 0 && b.correctIndex < b.choices.length)) throw new Error(`${where} [${l}]: bad correctIndex`);
    if (new Set(b.choices.map((c) => String(c).toLowerCase())).size !== b.choices.length) throw new Error(`${where} [${l}]: duplicate choices`);
    if (!b.text || !b.correction || !b.explanation) throw new Error(`${where} [${l}]: text/correction/explanation required`);
  }
}

/* Stable pseudo-random permutation of the n choices, seeded by the id
   (FNV-1a + mulberry32), applied identically to every language block. */
function seededOrder(id, n) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const rand = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

export function shuffleChoices(q) {
  const { keepOrder, ...rest } = q;
  if (keepOrder) return rest;
  const base0 = q.l10n.fr || q.l10n[Object.keys(q.l10n)[0]];
  const order = seededOrder(q.id, base0.choices.length);
  const l10n = {};
  for (const [l, b] of Object.entries(q.l10n)) {
    l10n[l] = { ...b, choices: order.map((i) => b.choices[i]), correctIndex: order.indexOf(b.correctIndex) };
  }
  const base = l10n.fr || l10n[Object.keys(l10n)[0]];
  return { ...rest, l10n, correctIndex: base.correctIndex };
}

/* Returns { subjectId: [questions] } merging *.json (legacy) and *.txt banks. */
export function loadQuestionBanks(dir) {
  const banks = {};
  const ids = new Set();
  const files = fs.readdirSync(dir).filter((f) => /\.(json|txt)$/.test(f)).sort();
  for (const f of files) {
    const full = path.join(dir, f);
    let qs;
    if (f.endsWith('.json')) {
      const doc = JSON.parse(fs.readFileSync(full, 'utf8'));
      qs = (doc.questions || []).map((q) => {
        const { exams, contentVersion, verifiedOn, ...rest } = q; // drop legacy per-exam tags
        return rest;
      });
    } else {
      qs = parseTxtBank(fs.readFileSync(full, 'utf8'), `content/questions/${f}`);
    }
    for (const q of qs) {
      if (!q.category) throw new Error(`${f}: ${q.id} has no category (add "@category …")`);
      validateQuestion(q, f);
      if (ids.has(q.id)) throw new Error(`${f}: duplicate question id ${q.id}`);
      ids.add(q.id);
      (banks[q.category] = banks[q.category] || []).push(shuffleChoices(q));
    }
  }
  return banks;
}

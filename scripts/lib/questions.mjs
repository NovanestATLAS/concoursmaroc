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
 * Exactly four choices and exactly one "*" per language block.
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
      const sub = parts.find((p) => !DIFFS.includes(p) && !/^ts$/i.test(p)) || 'general';
      q = {
        id: head[1], category: defaults.category, subcategory: sub, difficulty: diff,
        sourceId: defaults.source, timeSensitive: parts.some((p) => /^ts$/i.test(p)),
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
    if (b.choices.length !== 4) throw new Error(`${where}: needs exactly 4 choices, found ${b.choices.length}`);
    if (b.correctIndex < 0) throw new Error(`${where}: no correct choice marked with "*"`);
    if (new Set(b.choices.map((c) => c.toLowerCase())).size !== 4) throw new Error(`${where}: duplicate choices`);
    if (!b.correction) throw new Error(`${where}: missing C:`);
    if (!b.explanation) throw new Error(`${where}: missing E:`);
  }
  const base = q.l10n.fr || q.l10n[langs[0]];
  delete q._line;
  return {
    id: q.id,
    category: q.category,
    subcategory: q.subcategory,
    difficulty: q.difficulty,
    sourceId: q.sourceId,
    correctIndex: base.correctIndex,
    timeSensitive: q.timeSensitive,
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
    if (!Array.isArray(b.choices) || b.choices.length !== 4) throw new Error(`${where} [${l}]: 4 choices required`);
    if (!(b.correctIndex >= 0 && b.correctIndex < 4)) throw new Error(`${where} [${l}]: bad correctIndex`);
    if (new Set(b.choices.map((c) => String(c).toLowerCase())).size !== 4) throw new Error(`${where} [${l}]: duplicate choices`);
    if (!b.text || !b.correction || !b.explanation) throw new Error(`${where} [${l}]: text/correction/explanation required`);
  }
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
      (banks[q.category] = banks[q.category] || []).push(q);
    }
  }
  return banks;
}

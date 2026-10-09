/* Minimal Markdown → HTML for the guides (no dependency).
 * Supports: front matter (--- key: value ---), #/##/### headings (ids added),
 * paragraphs, - and 1. lists, > blockquote, | tables |, ::: info/warn/ok
 * callouts, [[practice:id]] call-to-action, inline **bold** *italic* `code`
 * [links](url) and (@/path/) same-language links. */
import { inline, slugify, esc } from './html.mjs';

export function parseFrontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    else v = v.replace(/^["']|["']$/g, '');
    meta[kv[1]] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

export function markdown(src, opts = {}) {
  const resolve = opts.resolve || ((s) => s);
  const T = (s) => inline(resolve(s)).toString();
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const toc = [];
  let i = 0;
  const usedIds = new Set();
  const uniqueId = (text) => {
    let id = slugify(text) || 'section';
    let k = 2;
    while (usedIds.has(id)) id = `${slugify(text)}-${k++}`;
    usedIds.add(id);
    return id;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      const level = m[1].length;
      const text = m[2].trim();
      if (level === 1) { i++; continue; } // the page H1 comes from front matter
      const id = uniqueId(text);
      if (level === 2) toc.push({ id, text });
      out.push(`<h${level} id="${id}">${T(text)}</h${level}>`);
      i++; continue;
    }
    if ((m = line.match(/^:::\s*(info|warn|ok|bad)\s*$/))) {
      const kind = m[1];
      const buf = [];
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<div class="callout ${kind}">${markdown(buf.join('\n'), opts).html}</div>`);
      continue;
    }
    if ((m = line.match(/^\[\[practice:([a-z0-9-]+)\]\]$/))) {
      out.push(opts.practice ? opts.practice(m[1]) : '');
      i++; continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(1).filter((r) => !/^\|(\s*:?-+:?\s*\|)+\s*$/.test(r));
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th scope="col">${T(h)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${cells(r).map((c, j) => (j === 0 ? `<th scope="row">${T(c)}</th>` : `<td>${T(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote class="callout info">${markdown(buf.join('\n'), opts).html}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      const cls = items.every((x) => /^\[ \]/.test(x)) ? ' class="checklist"' : '';
      out.push(`<ul${cls}>${items.map((x) => `<li>${T(x.replace(/^\[ \]\s*/, ''))}</li>`).join('')}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && (/^\s*\d+[.)]\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      out.push(`<ol class="steps">${items.map((x) => `<li>${T(x)}</li>`).join('')}</ol>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|:::|\||>|\s*[-*]\s+|\s*\d+[.)]\s+|\[\[)/.test(lines[i])) buf.push(lines[i++].trim());
    out.push(`<p>${T(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}

export { esc };

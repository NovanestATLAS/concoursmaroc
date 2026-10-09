/* Tiny HTML templating: tagged templates that escape every interpolated value
 * unless it was explicitly produced by html`` or raw(). Zero dependencies. */

export class Raw {
  constructor(s) { this.s = String(s); }
  toString() { return this.s; }
}

export const raw = (s) => new Raw(s == null ? '' : s);

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render(v) {
  if (v === null || v === undefined || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
}

export function html(strings, ...values) {
  let out = '';
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += render(values[i]);
  }
  return new Raw(out);
}

/* Inline formatting for authored strings: **bold**, *italic*, [text](url),
 * `code`. Input is escaped first, so authored content can never inject tags. */
export function inline(text) {
  if (text instanceof Raw) return text;
  let s = esc(text == null ? '' : text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const ext = /^https?:\/\//.test(url);
    return `<a href="${url}"${ext ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
  });
  return new Raw(s);
}

export function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/* Picks the localized value of a {fr, ar} object, falling back to French. */
export function L(obj, lang) {
  if (obj == null) return '';
  if (typeof obj === 'string' || Array.isArray(obj)) return obj;
  if (obj[lang] !== undefined && obj[lang] !== null && obj[lang] !== '') return obj[lang];
  return obj.fr !== undefined ? obj.fr : '';
}

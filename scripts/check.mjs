#!/usr/bin/env node
/* Concours Maroc — quality checks on the built site (docs/) and the content.
 *
 *   node scripts/check.mjs
 *
 * Fails (exit 1) on: broken internal links or assets, pages without title,
 * description, canonical or a single <h1>, duplicate titles, sitemap entries
 * without a page, unknown question source ids, malformed calendar dates.
 * Titles over 60 characters, descriptions over 160 and skipped heading levels
 * are errors on indexable pages. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import site from '../content/site.mjs';
import { CALENDAR } from '../content/calendar.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

if (!fs.existsSync(path.join(DOCS, 'index.html'))) {
  console.error('docs/ is empty: run "npm run build" first.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
}
const files = walk(DOCS);
const rel = (f) => path.relative(DOCS, f).split(path.sep).join('/');
const htmlFiles = files.filter((f) => f.endsWith('.html'));

/* ---------------------------------------------------------------- links */
const BASE = new URL(site.siteUrl + '/').pathname; // e.g. "/concoursmaroc/"
function targetExists(fromFile, url) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean) return true; // same-page anchor or query only
  let p;
  try { p = decodeURIComponent(clean); } catch (e) { p = clean; }
  // Root-relative links (404 page) are resolved against the site base path.
  if (p.startsWith('/')) {
    if (!p.startsWith(BASE)) return false;
    p = p.slice(BASE.length);
    fromFile = path.join(DOCS, 'index.html');
  }
  const abs = path.resolve(path.dirname(fromFile), p);
  if (!abs.startsWith(DOCS)) return false;
  if (p.endsWith('/')) return fs.existsSync(path.join(abs, 'index.html'));
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return true;
  return fs.existsSync(path.join(abs, 'index.html'));
}

const titles = new Map();
const descriptions = new Map();
let linkCount = 0;
for (const f of htmlFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const r = rel(f);
  const attrs = [...src.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const u of attrs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(u)) continue;
    linkCount++;
    if (!targetExists(f, u)) err(`${r}: broken link → ${u}`);
  }
  // srcset / manifest / icons referenced in <link> are covered by href above.
  if (r === '404.html' || r === 'offline.html') continue;
  const title = (src.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (src.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canonical = (src.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const h1 = (src.match(/<h1[\s>]/g) || []).length;
  const noindex = /<meta name="robots" content="noindex/.test(src);
  if (!/<html lang="(fr|ar)"/.test(src)) err(`${r}: missing <html lang>`);
  if (!title) err(`${r}: missing <title>`);
  if (!desc) err(`${r}: missing meta description`);
  if (!canonical && !noindex) err(`${r}: missing canonical`);
  if (h1 !== 1) err(`${r}: ${h1} <h1> elements (expected 1)`);
  // heading order: no level skipped (h1 -> h3) in the page
  {
    let prev = 0;
    for (const m of src.matchAll(/<h([1-6])[\s>]/g)) {
      const lv = Number(m[1]);
      if (prev && lv > prev + 1) { err(`${r}: heading h${prev} followed by h${lv}`); break; }
      prev = lv;
    }
  }
  if (title) {
    if (titles.has(title)) err(`${r}: duplicate <title> with ${titles.get(title)}`);
    titles.set(title, r);
    // search results show about 60 characters (entities such as &amp; count as one)
    const tlen = title.replace(/&(?:#\d+|\w+);/g, '_').length;
    if (tlen > 60 && !noindex) err(`${r}: title over 60 characters (${tlen}): ${title}`);
  }
  if (desc) {
    if (descriptions.has(desc)) warn(`${r}: same description as ${descriptions.get(desc)}`);
    descriptions.set(desc, r);
    const dlen = desc.replace(/&(?:#\d+|\w+);/g, '_').length;
    if (dlen > 160 && !noindex) err(`${r}: description over 160 characters (${dlen})`);
    if (desc.length < 50) warn(`${r}: short description (${desc.length} chars)`);
  }
  if (canonical && !canonical.startsWith(site.siteUrl)) err(`${r}: canonical outside siteUrl (${canonical})`);
}

/* ---------------------------------------------------------------- sitemap */
const sitemap = fs.readFileSync(path.join(DOCS, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  if (!loc.startsWith(site.siteUrl + '/')) { err(`sitemap: ${loc} outside siteUrl`); continue; }
  const p = loc.slice(site.siteUrl.length + 1);
  const file = path.join(DOCS, p.endsWith('/') || p === '' ? path.join(p, 'index.html') : p);
  if (!fs.existsSync(file)) err(`sitemap: no page for ${loc}`);
}
if (!locs.length) err('sitemap.xml has no <loc> entries');

/* ---------------------------------------------------------------- content */
const sources = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/sources.json'), 'utf8'));
const sourceIds = new Set((sources.sources || sources).map((s) => s.id));
const manifest = JSON.parse(fs.readFileSync(path.join(DOCS, 'data/manifest.json'), 'utf8'));
let qCount = 0;
for (const c of manifest.categories) {
  const bank = JSON.parse(fs.readFileSync(path.join(DOCS, 'data', c.file), 'utf8'));
  for (const q of bank.questions) {
    qCount++;
    if (!sourceIds.has(q.sourceId)) err(`question ${q.id}: unknown sourceId "${q.sourceId}"`);
  }
}
// Practice profiles: every subject has a bank, every level is defined.
const concoursDoc = JSON.parse(fs.readFileSync(path.join(DOCS, 'data/concours.json'), 'utf8'));
const levelIds = new Set((concoursDoc.levels || []).map((l) => l.id));
for (const l of concoursDoc.levels || []) {
  const sum = l.mix.beginner + l.mix.intermediate + l.mix.advanced;
  if (Math.abs(sum - 1) > 1e-9) err(`level ${l.id}: mix adds up to ${sum}, not 1`);
}
const bankIds = new Set(manifest.categories.map((c) => c.id));
for (const c of concoursDoc.concours) {
  if (!levelIds.has(c.difficulty)) err(`concours ${c.id}: unknown difficulty "${c.difficulty}"`);
  for (const tr of c.tracks || []) if (!levelIds.has(tr.difficulty)) err(`concours ${c.id}: track ${tr.id} has unknown difficulty "${tr.difficulty}"`);
  for (const s of c.subjects) if (!bankIds.has(s)) err(`concours ${c.id}: subject "${s}" has no question bank`);
  for (const sec of (c.mock && c.mock.sections) || []) {
    for (const s of sec.subjects) if (!bankIds.has(s)) err(`concours ${c.id}: mock subject "${s}" has no question bank`);
  }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
for (const e of CALENDAR) {
  if (!e.id || !e.type) err(`calendar: entry without id/type (${JSON.stringify(e).slice(0, 80)})`);
  if (e.date && !ISO.test(e.date)) err(`calendar ${e.id}: bad date ${e.date}`);
  if (e.start && !ISO.test(e.start)) err(`calendar ${e.id}: bad start ${e.start}`);
  if (e.month && !/^\d{4}-\d{2}$/.test(e.month)) err(`calendar ${e.id}: bad month ${e.month}`);
  if (!e.date && !e.month) err(`calendar ${e.id}: needs date or month`);
}

/* ------------------------------------------------- live content of the app */
// What the installed Android apps download (src/app/js/live.js): every pack of
// the manifest present and intact, every page of the registry in its pack.
{
  const LIVE = path.join(DOCS, 'app/live');
  const mf = path.join(LIVE, 'manifest.json');
  if (!fs.existsSync(mf)) err('app/live/manifest.json missing (npm run build)');
  else {
    const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
    if (m.format !== 1) err(`app/live: unknown format ${m.format}`);
    if (!Number.isInteger(m.shell) || m.shell < 1) err('app/live: shell must be a positive integer');
    if (m.updated !== site.updated) err(`app/live: updated ${m.updated} instead of ${site.updated}`);
    if (typeof m.version !== 'string' || !m.version.startsWith(site.updated)) err(`app/live: bad version ${m.version}`);
    const contents = {};
    const listed = new Set();
    for (const [name, p] of Object.entries(m.packs || {})) {
      const f = path.join(LIVE, p.file);
      listed.add(p.file);
      if (!fs.existsSync(f)) { err(`app/live: pack ${name} missing (${p.file})`); continue; }
      const buf = fs.readFileSync(f);
      if (crypto.createHash('sha256').update(buf).digest('hex') !== p.sha256) err(`app/live: pack ${name} does not match its sha256`);
      if (buf.length !== p.bytes) err(`app/live: pack ${name} is ${buf.length} bytes, manifest says ${p.bytes}`);
      try {
        contents[name] = JSON.parse(buf.toString('utf8'));
        if (Object.keys(contents[name]).length !== p.files) err(`app/live: pack ${name} holds ${Object.keys(contents[name]).length} files, manifest says ${p.files}`);
      } catch (e) { err(`app/live: pack ${name} is not valid JSON`); }
      if (!Array.isArray(p.prefixes) || !p.prefixes.length) err(`app/live: pack ${name} without prefixes`);
    }
    for (const f of fs.existsSync(path.join(LIVE, 'packs')) ? fs.readdirSync(path.join(LIVE, 'packs')) : []) {
      if (!listed.has(`packs/${f}`)) err(`app/live: stray pack packs/${f}`);
    }
    const packOf = (rel) => {
      let best = null;
      let len = -1;
      for (const [name, p] of Object.entries(m.packs || {})) {
        for (const pre of p.prefixes || []) {
          const hit = pre.endsWith('/') ? rel.startsWith(pre) : rel === pre;
          if (hit && pre.length > len) { best = name; len = pre.length; }
        }
      }
      return best;
    };
    const regText = contents.core && contents.core['data/pages.json'];
    if (!regText) err('app/live: data/pages.json missing from the core pack');
    else {
      const reg = JSON.parse(regText);
      const needs = new Set(m.needs || []);
      for (const [key, e] of Object.entries(reg.pages || {})) {
        const name = packOf(e.f);
        if (!name || !contents[name] || !(e.f in contents[name])) err(`app/live: page ${key || '(accueil)'} → ${e.f} not in its pack`);
        for (const sc of e.s || []) if (!needs.has(sc)) err(`app/live: script ${sc} of ${key} missing from needs`);
      }
      if (!contents.core['css/app.css']) err('app/live: css/app.css missing from the core pack');
    }
  }
}

/* ---------------------------------------------------------------- report */
for (const w of warnings) console.warn('warn  ' + w);
for (const e of errors) console.error('error ' + e);
console.log(`Checked ${htmlFiles.length} pages, ${linkCount} internal links, ${locs.length} sitemap URLs, ${qCount} questions: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);

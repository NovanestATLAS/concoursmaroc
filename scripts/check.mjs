#!/usr/bin/env node
/* Concours Maroc — quality checks on the built site (docs/) and the content.
 *
 *   node scripts/check.mjs
 *
 * Fails (exit 1) on: broken internal links or assets, pages without title,
 * description, canonical or a single <h1>, duplicate titles, sitemap entries
 * without a page, unknown question source ids, malformed calendar dates.
 * Warnings (long titles/descriptions) are printed but do not fail. */
import fs from 'node:fs';
import path from 'node:path';
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
  if (title) {
    if (titles.has(title)) err(`${r}: duplicate <title> with ${titles.get(title)}`);
    titles.set(title, r);
    if (title.length > 70) warn(`${r}: long title (${title.length} chars): ${title}`);
  }
  if (desc) {
    if (descriptions.has(desc)) warn(`${r}: same description as ${descriptions.get(desc)}`);
    descriptions.set(desc, r);
    if (desc.length > 185) warn(`${r}: long description (${desc.length} chars)`);
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
const ISO = /^\d{4}-\d{2}-\d{2}$/;
for (const e of CALENDAR) {
  if (!e.id || !e.type) err(`calendar: entry without id/type (${JSON.stringify(e).slice(0, 80)})`);
  if (e.date && !ISO.test(e.date)) err(`calendar ${e.id}: bad date ${e.date}`);
  if (e.start && !ISO.test(e.start)) err(`calendar ${e.id}: bad start ${e.start}`);
  if (e.month && !/^\d{4}-\d{2}$/.test(e.month)) err(`calendar ${e.id}: bad month ${e.month}`);
  if (!e.date && !e.month) err(`calendar ${e.id}: needs date or month`);
}

/* ---------------------------------------------------------------- report */
for (const w of warnings) console.warn('warn  ' + w);
for (const e of errors) console.error('error ' + e);
console.log(`Checked ${htmlFiles.length} pages, ${linkCount} internal links, ${locs.length} sitemap URLs, ${qCount} questions: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);

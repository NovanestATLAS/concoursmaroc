#!/usr/bin/env node
/* Concours Maroc — static site generator (zero dependencies, Node >= 18).
 *
 *   node scripts/build.mjs          build everything into docs/
 *   node scripts/build.mjs --check  build into a temp dir and fail if docs/ is stale
 *
 * Sources: content/ (guides, concours, questions), src/ (css, js, i18n, img).
 * Output:  docs/ — served as-is by GitHub Pages ("Deploy from a branch", /docs).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

import site from '../content/site.mjs';
import { layout } from './lib/layout.mjs';
import { buildGuide, buildDirectory, guidePath } from './lib/pages/concours.mjs';
import { buildHome } from './lib/pages/home.mjs';
import { buildToolsPages } from './lib/pages/tools.mjs';
import { buildPracticePage } from './lib/pages/practice.mjs';
import { buildQcmPages } from './lib/pages/qcm.mjs';
import { buildGuidesPages } from './lib/pages/guides.mjs';
import { buildStaticPages } from './lib/pages/static.mjs';
import { loadQuestionBanks } from './lib/questions.mjs';
import { sitemapXml, robotsTxt, manifestJson } from './lib/seo.mjs';
import { GROUPS, SUBJECTS, BAC } from '../content/taxonomy.mjs';
import { CALENDAR } from '../content/calendar.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const OUT = CHECK ? fs.mkdtempSync(path.join(os.tmpdir(), 'cm-build-')) : path.join(ROOT, 'docs');

function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
  }
}

async function loadConcours() {
  const dir = path.join(ROOT, 'content/concours');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort();
  const list = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(dir, f)).href);
    const c = mod.default;
    if (!c || !c.id) throw new Error(`content/concours/${f}: missing default export or id`);
    if (`${c.id}.mjs` !== f) throw new Error(`content/concours/${f}: id "${c.id}" must match the file name`);
    list.push(c);
  }
  return list.sort((a, b) => a.order - b.order);
}

function footerLinks(all) {
  const pick = (lang, level, n) => all.filter((c) => c[lang] && (Array.isArray(level) ? level.includes(c.level) : c.level === level))
    .slice(0, n).map((c) => [guidePath(c, lang), c[lang].short]);
  const tools = (lang) => {
    const p = lang === 'ar' ? 'ar/' : '';
    const L = lang === 'ar'
      ? ['حاسبة نقطة البكالوريا', 'التوجيه بعد البكالوريا', 'أجندة المباريات', 'برنامج المراجعة', 'لائحة الوثائق', 'محاكي سلم التنقيط']
      : ['Calcul note du bac', 'Orientation après le bac', 'Calendrier des concours', 'Planning de révision', 'Checklist du dossier', 'Simulateur de barème QCM'];
    return ['calcul-note-bac', 'orientation-apres-bac', 'calendrier-concours', 'planning-revision', 'checklist-dossier', 'simulateur-qcm']
      .map((s, i) => [`${p}outils/${s}/`, L[i]]);
  };
  return {
    fr: { postbac: pick('fr', ['postbac', 'bac2'], 9), niveauBac: pick('fr', 'bac', 8), tools: tools('fr') },
    ar: { postbac: pick('ar', ['postbac', 'bac2'], 9), niveauBac: pick('ar', 'bac', 8), tools: tools('ar') },
  };
}

function stripTags(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

async function main() {
  const t0 = Date.now();
  if (!CHECK && fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // Cache-busting token for CSS/JS URLs (changes whenever an asset changes).
  const ah = crypto.createHash('sha256');
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full); else ah.update(fs.readFileSync(full));
    }
  })(path.join(ROOT, 'src'));
  site.assetVersion = ah.digest('hex').slice(0, 10);

  const all = await loadConcours();
  const banks = loadQuestionBanks(path.join(ROOT, 'content/questions'));
  const links = footerLinks(all);
  const pages = [];
  const add = (p) => { if (p) pages.push(p); };

  for (const lang of site.languages) {
    add(buildHome(site, all, lang, banks));
    add(buildDirectory(site, all, lang));
    for (const c of all) add(buildGuide(site, c, lang, all));
    buildToolsPages(site, all, lang).forEach(add);
    add(buildPracticePage(site, all, lang, banks));
    buildQcmPages(site, all, lang, banks).forEach(add);
    (await buildGuidesPages(site, all, lang, ROOT)).forEach(add);
    buildStaticPages(site, all, lang, banks).forEach(add);
  }

  // Render pages
  const seen = new Set();
  for (const p of pages) {
    if (seen.has(p.path)) throw new Error(`Duplicate page path: ${p.path}`);
    seen.add(p.path);
    write(p.path, layout(site, p, links));
  }

  // Static assets
  copyDir(path.join(ROOT, 'src/css'), path.join(OUT, 'assets/css'));
  copyDir(path.join(ROOT, 'src/js'), path.join(OUT, 'assets/js'));
  copyDir(path.join(ROOT, 'src/img'), path.join(OUT, 'assets/img'));
  copyDir(path.join(ROOT, 'src/root'), OUT); // favicon, icons, etc.

  // Data for the practice app and the tools
  const practiceConcours = all.filter((c) => c.practice).map((c) => ({
    id: c.id, group: c.group, level: c.level, icon: c.icon,
    name: { fr: c.fr.name, ar: (c.ar || c.fr).name }, short: { fr: c.fr.short, ar: (c.ar || c.fr).short },
    subjects: c.practice.subjects, mock: c.practice.mock || null,
    guide: { fr: guidePath(c, 'fr'), ar: c.ar ? guidePath(c, 'ar') : guidePath(c, 'fr') },
  }));
  // Where candidates register (platform field, else the "Inscription" fact of the guide).
  const platformOf = (c) => {
    if (c.platform) return c.platform.label;
    const f = (c.fr.facts || []).find(([k]) => /^(Inscription|Candidature|Plateforme)$/.test(k));
    return f ? f[1] : null;
  };
  const toolsConcours = all.map((c) => ({
    id: c.id, group: c.group, level: c.level, type: c.type, bac: c.bac || [], seuils: c.seuils || null, age: c.age || null,
    noBac: !!c.noBac, name: { fr: c.fr.name, ar: (c.ar || c.fr).name }, short: { fr: c.fr.short, ar: (c.ar || c.fr).short },
    guide: { fr: guidePath(c, 'fr'), ar: c.ar ? guidePath(c, 'ar') : guidePath(c, 'fr') },
    practice: c.practice ? { subjects: c.practice.subjects } : null,
    platform: platformOf(c),
    calendar: c.calendar || [],
  }));
  write('data/concours.json', JSON.stringify({ updated: site.updated, groups: GROUPS, subjects: SUBJECTS, bac: BAC, concours: practiceConcours }));
  write('data/outils.json', JSON.stringify({ updated: site.updated, session: site.session, nextSession: site.nextSession, groups: GROUPS, bac: BAC, concours: toolsConcours, calendar: CALENDAR }));
  const manifest = { contentVersion: `2.0.0-${site.updated}`, updated: site.updated, totalQuestions: 0, categories: [] };
  for (const s of SUBJECTS) {
    const qs = banks[s.id] || [];
    if (!qs.length) continue;
    write(`data/questions/${s.id}.json`, JSON.stringify({ category: s.id, count: qs.length, questions: qs }));
    const langs = new Set();
    qs.forEach((q) => (q.languages || []).forEach((l) => langs.add(l)));
    manifest.categories.push({ id: s.id, file: `questions/${s.id}.json`, labels: { fr: s.fr, ar: s.ar }, short: s.short, count: qs.length, languages: [...langs].sort() });
    manifest.totalQuestions += qs.length;
  }
  write('data/manifest.json', JSON.stringify(manifest));
  write('data/sources.json', fs.readFileSync(path.join(ROOT, 'content/sources.json'), 'utf8'));
  copyDir(path.join(ROOT, 'src/i18n'), path.join(OUT, 'data/i18n'));

  // Search index (per language)
  for (const lang of site.languages) {
    const idx = pages.filter((p) => p.lang === lang && !p.noindex && !p.noSearch).map((p) => ({
      u: p.path.replace(/index\.html$/, ''),
      t: p.searchTitle || p.title,
      d: (p.description || '').slice(0, 150),
      k: p.keywords ? p.keywords.join(' ') : '',
      g: p.searchGroup || '',
    }));
    write(`assets/search-${lang}.json`, JSON.stringify(idx));
  }

  // SEO files
  write('sitemap.xml', sitemapXml(site, pages));
  write('robots.txt', robotsTxt(site));
  write('manifest.webmanifest', manifestJson(site));
  write('.nojekyll', '');
  if (site.customDomain) write('CNAME', `${site.customDomain}\n`);
  if (site.adsenseClient) write('ads.txt', `google.com, ${site.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);

  // Service worker: precache the shell, version = hash of every output file.
  const hash = crypto.createHash('sha256');
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else { files.push(path.relative(OUT, full).split(path.sep).join('/')); hash.update(fs.readFileSync(full)); }
    }
  })(OUT);
  const version = hash.digest('hex').slice(0, 12);
  const precache = files.filter((f) => /^(assets\/(css|js)\/|data\/(manifest|concours|outils|sources)\.json|data\/i18n\/|favicon\.svg|manifest\.webmanifest|entrainement\/index\.html|ar\/entrainement\/index\.html|index\.html|ar\/index\.html|offline\.html)/.test(f));
  const sw = fs.readFileSync(path.join(ROOT, 'src/sw.template.js'), 'utf8')
    .replace('__VERSION__', version)
    .replace('__PRECACHE__', JSON.stringify(precache));
  write('sw.js', sw);

  if (CHECK) {
    const stale = compareDirs(OUT, path.join(ROOT, 'docs'));
    fs.rmSync(OUT, { recursive: true, force: true });
    if (stale.length) {
      console.error(`docs/ is out of date (${stale.length} files differ), run "npm run build":\n  ` + stale.slice(0, 20).join('\n  '));
      process.exit(1);
    }
    console.log('docs/ is up to date.');
    return;
  }
  console.log(`Built ${pages.length} pages, ${manifest.totalQuestions} questions in ${Date.now() - t0} ms → docs/`);
}

function compareDirs(a, b) {
  const list = (dir) => {
    const out = [];
    (function walk(d) {
      if (!fs.existsSync(d)) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full); else out.push(path.relative(dir, full));
      }
    })(dir);
    return out.sort();
  };
  const la = list(a), lb = list(b);
  const diff = new Set();
  const sb = new Set(lb);
  for (const f of la) {
    if (!sb.has(f)) { diff.add(f); continue; }
    if (!fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f)))) diff.add(f);
  }
  const sa = new Set(la);
  for (const f of lb) if (!sa.has(f)) diff.add(f);
  return [...diff];
}

main().catch((e) => { console.error(e); process.exit(1); });

export { stripTags };

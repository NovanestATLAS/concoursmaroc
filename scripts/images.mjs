#!/usr/bin/env node
/* Concours Maroc — generates the image assets committed in src/:
 *   src/root/favicon.svg, favicon-32.png, apple-touch-icon.png
 *   src/img/concours-maroc-icon-192.png, -512.png, -maskable-512.png, -logo-512.png
 *   src/img/og/*.png  (1200×630 share images: site, each concours, each tool)
 *
 *   npm run images
 *
 * Needs Playwright (Chromium). It is NOT needed to build the site: the
 * generated files are committed and simply copied by scripts/build.mjs.
 * If Playwright is installed elsewhere, point PLAYWRIGHT_MODULE to it. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { logo } from './lib/icons.mjs';
import { GROUPS } from '../content/taxonomy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pw;
try {
  pw = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
} catch (e) {
  console.error('Playwright is required for this script: npm i -D playwright (or set PLAYWRIGHT_MODULE).');
  process.exit(1);
}
const chromium = pw.chromium || (pw.default && pw.default.chromium);

const out = (rel) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };

// ------------------------------------------------------------ the mark
const inner = String(logo(512)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const svgFile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${inner}</svg>\n`;
fs.writeFileSync(out('src/root/favicon.svg'), svgFile);
// Maskable: full-bleed background, mark inside the 80 % safe zone.
const markOnly = inner.replace(/<rect width="512" height="512" rx="112" fill="#0d2620"\/>/, '');
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0d2620"/><g transform="translate(64 64) scale(.75)">${markOnly}</g></svg>`;

// ------------------------------------------------------------ data
const concours = [];
for (const f of fs.readdirSync(path.join(ROOT, 'content/concours')).filter((x) => x.endsWith('.mjs')).sort()) {
  concours.push((await import(pathToFileURL(path.join(ROOT, 'content/concours', f)).href)).default);
}
let questions = 0;
try { questions = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/manifest.json'), 'utf8')).totalQuestions; } catch (e) { /* not built yet */ }
const LEVEL = { postbac: 'Après le bac', bac: 'Niveau bac ou sans bac', bac2: 'Après bac+2', bac3: 'Après bac+3' };
const TOOLS = [
  ['calcul-note-bac', 'Calcul de la note du bac', 'Moyenne générale, mention et note de présélection 75/25', 'حساب نقطة البكالوريا'],
  ['orientation-apres-bac', 'Orientation après le bac', 'Les écoles accessibles selon votre série, votre note et votre âge', 'التوجيه بعد البكالوريا'],
  ['calendrier-concours', 'Calendrier des concours', 'Dates d’inscription et d’épreuves, avec rappel dans votre agenda', 'أجندة المباريات'],
  ['planning-revision', 'Planning de révision', 'Un programme semaine par semaine jusqu’au jour du concours', 'برنامج المراجعة'],
  ['checklist-dossier', 'Checklist du dossier', 'Toutes les pièces à préparer pour votre candidature', 'لائحة وثائق الملف'],
  ['simulateur-qcm', 'Simulateur de barème QCM', 'Répondre ou s’abstenir avec des points négatifs ?', 'محاكي سلم التنقيط'],
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STAR = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path fill="none" stroke="#1f5a47" stroke-width="2" d="M60 14 70 40 96 30 86 56 112 60 86 64 96 90 70 80 60 106 50 80 24 90 34 64 8 60 34 56 24 30 50 40Z"/></svg>');

function og({ eyebrow, title, subtitle, arabic, chips }) {
  const size = title.length > 30 ? 66 : title.length > 20 ? 78 : 96;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;font-family:Inter,'DejaVu Sans',sans-serif;color:#f4f6f3;
    background:#0d2620 url("data:image/svg+xml,${STAR}") 0 0/120px 120px;}
  .wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;
    background:linear-gradient(100deg,rgba(13,38,32,.97) 0%,rgba(13,38,32,.93) 58%,rgba(13,38,32,.55) 100%)}
  .brand{display:flex;align-items:center;gap:16px;font-weight:800;font-size:30px;letter-spacing:.2px}
  .brand b{color:#d9ab3e}
  .eyebrow{margin-top:46px;font-size:24px;font-weight:700;color:#d9ab3e;text-transform:uppercase;letter-spacing:2px}
  h1{margin-top:12px;font-size:${size}px;line-height:1.04;font-weight:850;max-width:960px}
  .sub{margin-top:20px;font-size:32px;line-height:1.3;color:#cfe3da;max-width:900px}
  .ar{margin-top:14px;font-family:'DejaVu Sans',sans-serif;font-size:28px;color:#9cc8b6;direction:rtl;text-align:left;unicode-bidi:plaintext}
  .chips{margin-top:auto;display:flex;gap:12px;flex-wrap:wrap}
  .chip{padding:10px 20px;border-radius:999px;background:#0b6e4f;font-size:24px;font-weight:700}
  .chip.gold{background:#d9ab3e;color:#0d2620}
  .star{position:absolute;right:-90px;top:120px;width:520px;height:520px;opacity:.9}
  </style></head><body>
  <svg class="star" viewBox="0 0 512 512"><path fill="#0b6e4f" d="M256 60 292 148 380 112 344 200 432 236 344 272 380 360 292 324 256 412 220 324 132 360 168 272 80 236 168 200 132 112 220 148Z"/><path fill="none" stroke="#d9ab3e" stroke-width="10" d="M256 110 282 174 346 148 320 212 384 236 320 260 346 324 282 298 256 362 230 298 166 324 192 260 128 236 192 212 166 148 230 174Z"/></svg>
  <div class="wrap">
    <div class="brand">${logo(58)}<span>Concours <b>Maroc</b></span></div>
    <div class="eyebrow">${esc(eyebrow)}</div>
    <h1>${esc(title)}</h1>
    <div class="sub">${esc(subtitle)}</div>
    ${arabic ? `<div class="ar">${esc(arabic)}</div>` : ''}
    <div class="chips">${chips.map((c, i) => `<span class="chip${i === 0 ? ' gold' : ''}">${esc(c)}</span>`).join('')}</div>
  </div></body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function svgPng(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: out(file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
await svgPng(svgFile, 32, 'src/root/favicon-32.png');
await svgPng(svgFile.replace('rx="112"', 'rx="0"'), 180, 'src/root/apple-touch-icon.png');
await svgPng(svgFile, 192, 'src/img/concours-maroc-icon-192.png');
await svgPng(svgFile, 512, 'src/img/concours-maroc-icon-512.png');
await svgPng(svgFile, 512, 'src/img/concours-maroc-logo-512.png');
await svgPng(maskable, 512, 'src/img/concours-maroc-icon-maskable-512.png');

async function shot(html, file) {
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: out(file) });
}
await shot(og({
  eyebrow: 'Guide gratuit',
  title: 'Les concours après le bac au Maroc',
  subtitle: 'Conditions, seuils, épreuves et QCM corrigés',
  arabic: 'دليل المباريات بعد البكالوريا بالمغرب',
  chips: [`${concours.length} concours détaillés`, questions ? `${questions} QCM corrigés` : 'QCM corrigés', 'Outils gratuits'],
}), 'src/img/og/concours-maroc.png');

for (const c of concours) {
  const g = GROUPS.find((x) => x.id === c.group);
  const tagline = (c.fr.title || '').split(/\s:\s/)[1] || c.fr.description || '';
  await shot(og({
    eyebrow: g ? g.fr : 'Concours',
    title: c.fr.short,
    subtitle: tagline.charAt(0).toUpperCase() + tagline.slice(1),
    arabic: c.ar ? (c.ar.short !== c.fr.short ? c.ar.short : c.ar.name) : '',
    chips: [LEVEL[c.level] || 'Concours', 'Conditions et épreuves', c.practice ? 'QCM d’entraînement' : 'Guide pratique'],
  }), `src/img/og/concours-${c.id}.png`);
}
for (const [id, title, sub, ar] of TOOLS) {
  await shot(og({ eyebrow: 'Outil gratuit', title, subtitle: sub, arabic: ar, chips: ['Sans inscription', 'Données sur votre appareil'] }), `src/img/og/outil-${id}.png`);
}
await browser.close();

// Share images: 128-colour palette PNGs are 4 to 5 times lighter and visually identical.
try {
  const { execFileSync } = await import('node:child_process');
  const dir = path.join(ROOT, 'src/img/og');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.png'))) {
    execFileSync('convert', [path.join(dir, f), '-dither', 'None', '-colors', '128', `PNG8:${path.join(dir, f)}`]);
  }
} catch (e) { console.warn('ImageMagick "convert" not found: share images left uncompressed.'); }
console.log(`Images written: 6 icons, ${concours.length + TOOLS.length + 1} share images.`);

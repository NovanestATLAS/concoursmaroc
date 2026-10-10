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

import { logo, MARK } from './lib/icons.mjs';
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
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a37b0"/><stop offset="1" stop-color="#101a3d"/></linearGradient></defs><rect width="512" height="512" fill="url(#m)"/><g transform="translate(64 64) scale(.75)"><path fill="#f5a524" d="${MARK.star}"/><path fill="none" stroke="#101a3d" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" d="${MARK.check}"/></g></svg>`;
// The site fonts, embedded so that the share images use them too.
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'src/fonts', f)).toString('base64')}`;
const FONTS = `@font-face{font-family:"CM Sans";src:url(${font('plus-jakarta-sans-latin-wght-normal.woff2')}) format("woff2");font-weight:200 800}
@font-face{font-family:"CM Sans";src:url(${font('readex-pro-arabic-wght-normal.woff2')}) format("woff2");font-weight:160 700;unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC}`;

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
const PATTERN = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'><g fill='none' stroke='#FFFFFF' stroke-opacity='.07' stroke-width='1.2'><path d='M22 22h28v28H22z'/><path d='M36 16.2 55.8 36 36 55.8 16.2 36z'/><path d='M36 16.2V0M55.8 36H72M36 55.8V72M16.2 36H0M22 22 0 0M50 22 72 0M50 50l22 22M22 50 0 72'/></g></svg>");

function og({ eyebrow, title, subtitle, arabic, chips }) {
  const size = title.length > 30 ? 64 : title.length > 20 ? 76 : 92;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${FONTS}
  *{box-sizing:border-box;margin:0}
  body{width:1200px;height:630px;overflow:hidden;font-family:"CM Sans",'DejaVu Sans',sans-serif;color:#fff;
    background:radial-gradient(620px 420px at 92% 8%,rgba(58,73,214,.6),transparent 70%),radial-gradient(520px 360px at 0% 100%,rgba(245,165,36,.16),transparent 70%),url("data:image/svg+xml,${PATTERN}") 0 0/72px 72px,linear-gradient(160deg,#0b1229 0%,#101a3d 55%,#172456 100%)}
  .wrap{position:absolute;inset:0;padding:60px 72px;display:flex;flex-direction:column}
  .brand{display:flex;align-items:center;gap:16px;font-weight:800;font-size:30px;letter-spacing:-.3px}
  .brand b{color:#f5a524}
  .eyebrow{margin-top:44px;font-size:22px;font-weight:750;color:#ffc266;text-transform:uppercase;letter-spacing:3px;display:flex;align-items:center;gap:12px}
  .eyebrow i{width:16px;height:16px;background:#f5a524;clip-path:polygon(50% 0%,61.7% 21.7%,85.4% 14.6%,78.3% 38.3%,100% 50%,78.3% 61.7%,85.4% 85.4%,61.7% 78.3%,50% 100%,38.3% 78.3%,14.6% 85.4%,21.7% 61.7%,0% 50%,21.7% 38.3%,14.6% 14.6%,38.3% 21.7%)}
  h1{margin-top:14px;font-size:${size}px;line-height:1.06;font-weight:800;letter-spacing:-1.5px;max-width:900px}
  .sub{margin-top:20px;font-size:30px;line-height:1.35;color:#c9d2ea;max-width:860px}
  .ar{margin-top:14px;font-size:30px;color:#aeb9d9;direction:rtl;text-align:left;unicode-bidi:plaintext;font-weight:500}
  .chips{margin-top:auto;display:flex;gap:12px;flex-wrap:wrap}
  .chip{padding:10px 20px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);font-size:22px;font-weight:700}
  .chip.gold{background:#f5a524;border-color:#f5a524;color:#0b1229}
  .art{position:absolute;right:-120px;top:96px;width:560px;height:560px}
  </style></head><body>
  <svg class="art" viewBox="0 0 512 512"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5a524" stop-opacity=".95"/><stop offset="1" stop-color="#f5a524" stop-opacity=".55"/></linearGradient></defs><path fill="url(#a)" d="${MARK.star}"/><path fill="none" stroke="#101a3d" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" d="${MARK.check}" opacity=".9"/><path fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3" transform="translate(256 256) scale(1.22) translate(-256 -256)" d="${MARK.star}"/></svg>
  <div class="wrap">
    <div class="brand">${logo(58)}<span>Concours <b>Maroc</b></span></div>
    <div class="eyebrow"><i></i>${esc(eyebrow)}</div>
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
await svgPng(svgFile.replace('rx="116"', 'rx="0"'), 180, 'src/root/apple-touch-icon.png');
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

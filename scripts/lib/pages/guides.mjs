/* Long-form guides written in Markdown: content/guides/<slug>.<lang>.md */
import fs from 'node:fs';
import path from 'node:path';
import { html, raw } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd, faqLd } from '../layout.mjs';
import { parseFrontMatter, markdown } from '../markdown.mjs';
import { t, formatDate } from '../strings.mjs';
import { hue } from '../art.mjs';
import { appLive, asideCard, inlineCard } from '../app-funnel.mjs';

const TXT = {
  fr: { guides: 'Guides', h1: 'Guides pratiques pour réussir son orientation et ses concours', lead: 'Méthodes, démarches et conseils concrets, de la candidature au jour du concours.',
    title: 'Guides pratiques : orientation après le bac, Cursus Sup, bourses, QCM', desc: "Guides gratuits pour les bacheliers marocains : orientation après le bac, Cursus Sup, bourse Minhaty, réussir un QCM, tests psychotechniques, oral et épreuves sportives.",
    read: 'Lire le guide', practiceTitle: 'Passez à la pratique', practiceText: 'Des QCM corrigés et un examen blanc adaptés à ce concours.', practiceBtn: "S'entraîner" },
  ar: { guides: 'أدلة', h1: 'أدلة عملية لإنجاح التوجيه والمباريات', lead: 'طرق ومساطر ونصائح عملية، من الترشيح إلى يوم المباراة.',
    title: 'أدلة عملية: التوجيه بعد البكالوريا، Cursus Sup، المنح، الأسئلة متعددة الاختيارات', desc: 'أدلة مجانية للحاصلين على البكالوريا بالمغرب: التوجيه، منصة Cursus Sup، منحة منحتي، النجاح في الأسئلة متعددة الاختيارات، الاختبارات السيكوتقنية والشفوية والرياضية.',
    read: 'اقرأ الدليل', practiceTitle: 'انتقل إلى التطبيق', practiceText: 'أسئلة مصححة وامتحان تجريبي ملائم لهذه المباراة.', practiceBtn: 'تمرّن' },
};

export function loadGuides(root, lang) {
  const dir = path.join(root, 'content/guides');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(`.${lang}.md`)).map((f) => {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const { meta, body } = parseFrontMatter(src);
    const slug = f.replace(`.${lang}.md`, '');
    const other = lang === 'ar' ? 'fr' : 'ar';
    return { slug, lang, meta, body, hasAlt: fs.existsSync(path.join(dir, `${slug}.${other}.md`)) };
  }).sort((a, b) => Number(a.meta.order || 99) - Number(b.meta.order || 99));
}

export async function buildGuidesPages(site, all, lang, root) {
  const x = TXT[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const guides = loadGuides(root, lang);
  const pages = [];
  for (const g of guides) {
    const p = `${pfx}guides/${g.slug}/index.html`;
    const link = linker(p);
    const resolve = (s) => String(s).replace(/\]\(@\/([^)]*)\)/g, (m, q) => `](${link(pfx + q)})`);
    const practice = (id) => html`<div class="cta-box no-print" style="margin:1.2em 0"><h3>${x.practiceTitle}</h3><p>${x.practiceText}</p><a class="btn" href="${link(pfx + 'entrainement/')}?concours=${id}">${icon('play')} ${x.practiceBtn}</a></div>`.toString();
    const md = markdown(g.body, { resolve, practice });
    const faq = parseFaq(g.meta, g.body);
    const crumbs = [[pfx, t(lang, 'home')], [`${pfx}guides/`, x.guides], [`${pfx}guides/${g.slug}/`, g.meta.short || g.meta.title]];
    const updated = g.meta.updated || site.updated;
    const body = html`${breadcrumb(lang, link, crumbs)}
<article class="container">
<header class="page-head${appLive(site) ? ' with-app' : ''}"><span class="eyebrow">${x.guides}</span><h1>${g.meta.h1 || g.meta.title}</h1>
${g.meta.lead ? html`<p class="lead">${g.meta.lead}</p>` : ''}
<p class="updated"><span>${t(lang, 'updated')} ${formatDate(updated, lang)}</span></p>
${asideCard(site, lang, link, { campaign: 'guide-entete', cls: 'head-app' })}</header>
<div class="layout"><div class="prose">${raw(md.html)}
${inlineCard(site, lang, link, { campaign: 'guide-contenu', mobileOnly: true, qr: false })}</div>
<aside><div class="aside-sticky">${md.toc.length > 2 ? html`<nav class="toc"><details open><summary><strong>${t(lang, 'toc')}</strong></summary><ol>${md.toc.map((h) => html`<li><a href="#${h.id}">${h.text.replace(/\*\*/g, '')}</a></li>`)}</ol></details></nav>` : ''}
<div class="cta-box no-print"><h3>${lang === 'ar' ? 'كل المباريات' : 'Tous les concours'}</h3><p>${lang === 'ar' ? 'الشروط والعتبات والاختبارات لكل مباراة.' : 'Conditions, seuils et épreuves de chaque concours.'}</p><a class="btn sm" href="${link(pfx + 'concours/')}">${t(lang, 'allConcours')}</a></div>
</div></aside></div></article>`;
    pages.push({
      path: p, lang, title: g.meta.title, description: g.meta.description, keywords: g.meta.keywords || [],
      alternate: g.hasAlt ? `${lang === 'ar' ? '' : 'ar/'}guides/${g.slug}/` : null,
      section: 'navGuides', type: 'article', updated, ogImage: g.meta.og || undefined,
      jsonld: [breadcrumbLd(site, crumbs), {
        '@context': 'https://schema.org', '@type': 'Article', headline: g.meta.h1 || g.meta.title, description: g.meta.description,
        inLanguage: lang, dateModified: updated, datePublished: g.meta.published || '2026-10-09',
        author: { '@type': 'Organization', name: 'Concours Maroc' },
        publisher: { '@type': 'Organization', name: 'Concours Maroc', logo: { '@type': 'ImageObject', url: `${site.siteUrl}/assets/img/concours-maroc-logo-512.png` } },
        mainEntityOfPage: `${site.siteUrl}/${pfx}guides/${g.slug}/`,
      }, faq.length ? faqLd(faq, lang) : null],
      body,
    });
  }

  // index
  const ip = `${pfx}guides/index.html`;
  const link = linker(ip);
  const crumbs = [[pfx, t(lang, 'home')], [`${pfx}guides/`, x.guides]];
  pages.push({
    path: ip, lang, title: x.title, description: x.desc, section: 'navGuides',
    alternate: `${lang === 'ar' ? '' : 'ar/'}guides/`,
    jsonld: [breadcrumbLd(site, crumbs)],
    body: html`${breadcrumb(lang, link, crumbs)}<div class="container"><header class="page-head"><span class="eyebrow">${x.guides}</span><h1>${x.h1}</h1><p class="lead">${x.lead}</p></header>
<div class="grid cols-3" style="margin-bottom:30px">${guides.map((g, i) => html`<a class="card path-card guide-card ${hue(i)}" href="${link(`${pfx}guides/${g.slug}/`)}"><div class="cover">${icon(g.meta.icon || 'book')}</div><div class="g-body"><span class="card-title">${g.meta.short || g.meta.title}</span><p class="card-sub">${g.meta.description}</p></div></a>`)}</div></div>`,
  });
  return pages;
}

/* FAQ for structured data: "## FAQ" section with "### question" + paragraph. */
function parseFaq(meta, body) {
  const m = body.split(/\n## (?:FAQ|Questions fréquentes|أسئلة شائعة)\s*\n/)[1];
  if (!m) return [];
  const out = [];
  const parts = ('\n' + m.split(/\n## /)[0]).split(/\n### /);
  for (const part of parts.slice(1)) {
    const [q, ...rest] = part.split('\n');
    const a = rest.join(' ').split(/\n## /)[0].trim();
    if (q && a) out.push({ q: q.trim(), a });
  }
  return out;
}

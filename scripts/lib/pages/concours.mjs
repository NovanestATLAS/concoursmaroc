/* Concours guide pages and the concours directory. */
import { html, raw, L, esc } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd, faqLd, practiceHref } from '../layout.mjs';
import { renderBlocks, makeText } from '../blocks.mjs';
import { t, formatDate } from '../strings.mjs';
import { GROUPS, BAC, BAC_SHORT } from '../../../content/taxonomy.mjs';

export function guidePath(c, lang) {
  return `${lang === 'ar' ? 'ar/' : ''}concours/${c.id}/`;
}

const TXT = {
  fr: {
    concours: 'Concours', postbac: 'Après le bac', bacLevel: 'Niveau bac / sans bac', bac2: 'Après bac+2', bac3: 'Après bac+3',
    public: 'Public', militaire: 'Militaire', paramilitaire: 'Paramilitaire', semipublic: 'Semi-public', prive: 'Privé',
    eligible: 'Bacs acceptés', officialLinks: 'Liens officiels', practiceAside: "S'entraîner pour ce concours",
    practiceAsideText: 'QCM corrigés, examen blanc chronométré, suivi de vos points faibles.',
    tools: 'Outils utiles', toolNote: 'Calculer ma note de présélection', toolOrient: 'Vérifier mon éligibilité', toolCal: 'Dates et rappels', toolPlan: 'Planning de révision',
    sourcesIntro: "Informations recoupées à partir des avis officiels et de sources publiques datées. En cas de différence, l'avis officiel de la session prime.",
    print: 'Imprimer', share: 'Partager',
    dirTitle: 'Tous les concours au Maroc après le bac : guide complet',
    dirDesc: "Liste des concours et écoles accessibles après le bac ou avec le niveau bac au Maroc : conditions, seuils, épreuves, calendrier et entraînement, par domaine et par série de bac.",
    dirH1: 'Concours et écoles au Maroc',
    dirLead: "Choisissez un domaine ou filtrez par série de bac : chaque fiche détaille les conditions, la sélection, les épreuves, le calendrier et propose un entraînement adapté.",
    filterSearch: 'Filtrer par nom (ex. ENSA, police, infirmier)', filterBac: 'Ma série de bac', filterAll: 'Toutes les séries',
    filterLevel: 'Niveau', levelAll: 'Tous les niveaux', count: 'concours', none: 'Aucun concours ne correspond à ces filtres.',
    seuilLabel: 'Seuil', ageLabel: 'Âge',
  },
  ar: {
    concours: 'المباريات', postbac: 'بعد البكالوريا', bacLevel: 'مستوى البكالوريا / بدون باك', bac2: 'بعد باك+2', bac3: 'بعد باك+3',
    public: 'عمومي', militaire: 'عسكري', paramilitaire: 'شبه عسكري', semipublic: 'شبه عمومي', prive: 'خاص',
    eligible: 'الشعب المقبولة', officialLinks: 'روابط رسمية', practiceAside: 'تمرّن لهذه المباراة',
    practiceAsideText: 'أسئلة مصححة، امتحان تجريبي موقت، وتتبع نقط ضعفك.',
    tools: 'أدوات مفيدة', toolNote: 'احسب نقطة الانتقاء', toolOrient: 'تحقق من أهليتك', toolCal: 'التواريخ والتذكير', toolPlan: 'برنامج المراجعة',
    sourcesIntro: 'معلومات مستقاة من الإعلانات الرسمية ومصادر عمومية مؤرخة. عند الاختلاف، يُعتمد الإعلان الرسمي للدورة.',
    print: 'طباعة', share: 'مشاركة',
    dirTitle: 'جميع المباريات بالمغرب بعد البكالوريا: دليل شامل',
    dirDesc: 'لائحة المباريات والمدارس المتاحة بعد البكالوريا أو بمستوى البكالوريا بالمغرب: الشروط، العتبات، الاختبارات، الأجندة والتمرين، حسب المجال وشعبة البكالوريا.',
    dirH1: 'المباريات والمدارس بالمغرب',
    dirLead: 'اختر مجالًا أو صفِّ حسب شعبة البكالوريا: كل بطاقة تشرح الشروط والانتقاء والاختبارات والأجندة وتقترح تمارين ملائمة.',
    filterSearch: 'ابحث بالاسم (مثلًا: الطب، الشرطة، ENSA)', filterBac: 'شعبتي', filterAll: 'جميع الشعب',
    filterLevel: 'المستوى', levelAll: 'كل المستويات', count: 'مباراة', none: 'لا توجد مباراة مطابقة.',
    seuilLabel: 'العتبة', ageLabel: 'السن',
  },
};

function levelLabel(c, lang) {
  const x = TXT[lang];
  return c.level === 'bac' ? x.bacLevel : c.level === 'bac2' ? x.bac2 : c.level === 'bac3' ? x.bac3 : x.postbac;
}

function typeLabel(c, lang) {
  const x = TXT[lang];
  return x[(c.type || 'public').replace('-', '')] || x.public;
}

export function concoursCard(c, lang, link) {
  const d = c[lang] || c.fr;
  const seuil = c.seuils && c.seuils.rows && c.seuils.rows.length
    ? c.seuils.rows.map((r) => r[1]).filter((v) => typeof v === 'number') : [];
  const minSeuil = seuil.length ? Math.min(...seuil) : null;
  return html`<a class="card path-card" href="${link(guidePath(c, lang))}" data-concours="${c.id}" data-bac="${(c.bac || []).join(' ')}" data-level="${c.level}" data-group="${c.group}" data-name="${(d.short + ' ' + d.name + ' ' + (d.keywords || []).join(' ')).toLowerCase()}">
<div class="card-top"><span class="card-ico">${icon(c.icon || 'star')}</span><span class="card-title">${d.short}</span></div>
<p class="card-sub">${d.name}</p>
<div class="card-meta"><span class="badge green">${levelLabel(c, lang)}</span><span class="badge">${typeLabel(c, lang)}</span>${minSeuil ? html`<span class="badge gold">${TXT[lang].seuilLabel} ≥ ${String(minSeuil).replace('.', ',')}/20</span>` : ''}${c.age && c.age.max ? html`<span class="badge blue">${TXT[lang].ageLabel} ≤ ${c.age.max}</span>` : ''}</div>
</a>`;
}

export function buildGuide(site, c, lang, all) {
  const d = c[lang];
  if (!d) return null;
  const path = guidePath(c, lang) + 'index.html';
  const link = linker(path);
  const ctx = { lang, link, concours: c, site };
  const T = makeText(ctx);
  const x = TXT[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const crumbs = [[pfx, t(lang, 'home')], [`${pfx}concours/`, x.concours], [guidePath(c, lang), d.short]];
  const sections = d.sections || [];
  const updated = c.updated || site.updated;
  const related = (c.related || []).map((id) => all.find((o) => o.id === id)).filter((o) => o && o[lang]);

  const toc = html`<nav class="toc" aria-label="${t(lang, 'toc')}"><details open><summary><strong>${t(lang, 'toc')}</strong></summary><ol>
${sections.map((s) => html`<li><a href="#${s.id}">${s.h}</a></li>`)}
${d.faq && d.faq.length ? html`<li><a href="#faq">${t(lang, 'faq')}</a></li>` : ''}
<li><a href="#sources">${t(lang, 'sources')}</a></li></ol></details></nav>`;

  const aside = html`<aside><div class="aside-sticky">
${toc}
${c.practice ? html`<div class="cta-box no-print"><h3>${x.practiceAside}</h3><p>${x.practiceAsideText}</p>
<div class="btn-row"><a class="btn sm" href="${practiceHref(link, pfx, '', c.id)}">${icon('play')} ${t(lang, 'practice')}</a><a class="btn sm ghost" href="${practiceHref(link, pfx, 'mock', c.id)}">${icon('clock')} ${t(lang, 'mock')}</a></div></div>` : ''}
<div class="card" style="padding:14px 16px"><strong>${x.tools}</strong><ul class="checklist" style="margin:.5em 0 0;font-size:var(--fs-sm)">
<li><a href="${link(pfx + 'outils/calcul-note-bac/')}">${x.toolNote}</a></li>
<li><a href="${link(pfx + 'outils/orientation-apres-bac/')}?concours=${c.id}">${x.toolOrient}</a></li>
<li><a href="${link(pfx + 'outils/calendrier-concours/')}">${x.toolCal}</a></li>
<li><a href="${link(pfx + 'outils/planning-revision/')}?concours=${c.id}">${x.toolPlan}</a></li></ul></div>
</div></aside>`;

  const body = html`${breadcrumb(lang, link, crumbs)}
<article class="container">
<header class="page-head">
<span class="eyebrow">${(GROUPS.find((g) => g.id === c.group) || {})[lang] || ''} · ${levelLabel(c, lang)}</span>
<h1>${d.title}</h1>
<p class="lead">${T(d.intro)}</p>
<p class="updated"><span>${t(lang, 'updated')} ${formatDate(updated, lang)}</span><span>· ${t(lang, 'checkedFor')} ${site.session}</span>
<button class="btn sm quiet no-print" type="button" data-print>${icon('print')} ${x.print}</button>
<button class="btn sm quiet no-print" type="button" data-share>${icon('share')} ${x.share}</button></p>
${d.facts && d.facts.length ? html`<div class="facts">${d.facts.map(([k, v]) => html`<div class="fact"><div class="f-lab">${k}</div><div class="f-val">${T(v)}</div></div>`)}</div>` : ''}
</header>
<div class="layout">
<div class="prose">
<div class="callout warn"><strong class="c-title">${lang === 'ar' ? 'تنبيه' : 'À vérifier'}</strong>${t(lang, 'disclaimerShort')}</div>
${sections.map((s) => html`<section id="${s.id}"><h2>${s.h}</h2>${renderBlocks(s.blocks, ctx)}</section>`)}
${d.faq && d.faq.length ? html`<section id="faq" class="faq"><h2>${t(lang, 'faq')}</h2>${d.faq.map((f) => html`<details><summary>${f.q}</summary><div class="faq-a"><p>${T(f.a)}</p></div></details>`)}</section>` : ''}
<section id="sources"><h2>${t(lang, 'sources')}</h2>
<p class="muted"><small>${x.sourcesIntro}</small></p>
${c.official && c.official.length ? html`<h3>${x.officialLinks}</h3><ul class="sources">${c.official.map((o) => html`<li><a href="${o.url}" rel="noopener" target="_blank">${o.label}</a></li>`)}</ul>` : ''}
${c.sources && c.sources.length ? html`<ul class="sources">${c.sources.map((s) => html`<li><a href="${s.url}" rel="noopener nofollow" target="_blank">${s.title}</a>${s.date ? html` <small class="muted">(${s.date})</small>` : ''}</li>`)}</ul>` : ''}
</section>
${related.length ? html`<section class="no-print"><h2>${t(lang, 'related')}</h2><div class="grid cols-2">${related.map((r) => concoursCard(r, lang, link))}</div></section>` : ''}
</div>
${aside}
</div>
</article>`;

  const url = `${site.siteUrl}/${guidePath(c, lang)}`;
  const jsonld = [
    breadcrumbLd(site, crumbs),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: d.title,
      description: d.description,
      inLanguage: lang,
      dateModified: updated,
      datePublished: c.published || '2026-10-09',
      mainEntityOfPage: url,
      image: `${site.siteUrl}/assets/img/og/concours-${c.id}.png`,
      author: { '@type': 'Organization', name: 'Concours Maroc', url: `${site.siteUrl}/` },
      publisher: { '@type': 'Organization', name: 'Concours Maroc', logo: { '@type': 'ImageObject', url: `${site.siteUrl}/assets/img/concours-maroc-logo-512.png` } },
      about: { '@type': 'EducationalOccupationalProgram', name: d.name, provider: { '@type': 'Organization', name: d.short } },
    },
    faqLd(d.faq, lang),
  ];

  return {
    path,
    lang,
    title: d.title,
    description: d.description,
    alternate: c[lang === 'ar' ? 'fr' : 'ar'] ? guidePath(c, lang === 'ar' ? 'fr' : 'ar') : null,
    section: 'navConcours',
    type: 'article',
    updated,
    ogImage: `assets/img/og/concours-${c.id}.png`,
    jsonld,
    body,
  };
}

export function buildDirectory(site, all, lang) {
  const x = TXT[lang];
  const pfx = lang === 'ar' ? 'ar/' : '';
  const path = `${pfx}concours/index.html`;
  const link = linker(path);
  const crumbs = [[pfx, t(lang, 'home')], [`${pfx}concours/`, x.concours]];
  const list = all.filter((c) => c[lang]).sort((a, b) => a.order - b.order);
  const body = html`${breadcrumb(lang, link, crumbs)}
<div class="container">
<header class="page-head"><span class="eyebrow">${x.concours}</span><h1>${x.dirH1}</h1><p class="lead">${x.dirLead}</p></header>
<div class="filters no-print" id="dir-filters">
<label class="visually-hidden" for="f-q">${x.filterSearch}</label><input type="search" id="f-q" placeholder="${x.filterSearch}">
<label class="visually-hidden" for="f-bac">${x.filterBac}</label><select id="f-bac"><option value="">${x.filterBac} : ${x.filterAll}</option>${BAC.map((b) => html`<option value="${b.id}">${b[lang]}</option>`)}</select>
<label class="visually-hidden" for="f-level">${x.filterLevel}</label><select id="f-level"><option value="">${x.levelAll}</option><option value="postbac">${x.postbac}</option><option value="bac">${x.bacLevel}</option><option value="bac2">${x.bac2}</option><option value="bac3">${x.bac3}</option></select>
<span class="muted" id="f-count" aria-live="polite"></span>
</div>
${GROUPS.map((g) => {
  const items = list.filter((c) => c.group === g.id);
  if (!items.length) return '';
  return html`<section class="section" data-group-section="${g.id}" style="padding-top:8px"><div class="section-head"><h2 id="${g.id}" class="group-title" data-group="${g.id}"><span class="g-ico">${icon(g.icon)}</span><span>${g[lang + 'Long']}</span><span class="g-count">${items.length}</span></h2></div><div class="grid cols-3">${items.map((c) => concoursCard(c, lang, link))}</div></section>`;
})}
<p class="muted" id="f-none" hidden>${x.none}</p>
</div>`;
  const jsonld = [
    breadcrumbLd(site, crumbs),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: x.dirH1,
      itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: `${site.siteUrl}/${guidePath(c, lang)}`, name: c[lang].title })),
    },
  ];
  return {
    path, lang, title: x.dirTitle, description: x.dirDesc,
    alternate: `${lang === 'ar' ? '' : 'ar/'}concours/`, section: 'navConcours', jsonld, body,
    scripts: ['assets/js/annuaire.js'],
  };
}

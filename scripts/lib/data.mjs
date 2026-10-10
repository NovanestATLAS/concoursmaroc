/* JSON data shared by the website build (docs/) and the Android app build
 * (www/): concours lists for the trainer and the tools, question banks,
 * manifest and search indexes. Returns { 'relative/path': content }. */
import fs from 'node:fs';
import path from 'node:path';
import { guidePath } from './pages/concours.mjs';
import { GROUPS, SUBJECTS, BAC } from '../../content/taxonomy.mjs';
import { CALENDAR } from '../../content/calendar.mjs';

// Where candidates register (platform field, else the "Inscription" fact of the guide).
function platformOf(c) {
  if (c.platform) return c.platform.label;
  const f = (c.fr.facts || []).find(([k]) => /^(Inscription|Candidature|Plateforme)$/.test(k));
  return f ? f[1] : null;
}

export function dataFiles(site, all, banks, root) {
  const files = {};
  const practiceConcours = all.filter((c) => c.practice).map((c) => ({
    id: c.id, group: c.group, level: c.level, icon: c.icon,
    name: { fr: c.fr.name, ar: (c.ar || c.fr).name }, short: { fr: c.fr.short, ar: (c.ar || c.fr).short },
    subjects: c.practice.subjects, mock: c.practice.mock || null,
    guide: { fr: guidePath(c, 'fr'), ar: c.ar ? guidePath(c, 'ar') : guidePath(c, 'fr') },
  }));
  const toolsConcours = all.map((c) => ({
    id: c.id, group: c.group, level: c.level, type: c.type, bac: c.bac || [], seuils: c.seuils || null, age: c.age || null,
    noBac: !!c.noBac, name: { fr: c.fr.name, ar: (c.ar || c.fr).name }, short: { fr: c.fr.short, ar: (c.ar || c.fr).short },
    guide: { fr: guidePath(c, 'fr'), ar: c.ar ? guidePath(c, 'ar') : guidePath(c, 'fr') },
    practice: c.practice ? { subjects: c.practice.subjects } : null,
    platform: platformOf(c),
    calendar: c.calendar || [],
  }));
  files['data/concours.json'] = JSON.stringify({ updated: site.updated, groups: GROUPS, subjects: SUBJECTS, bac: BAC, concours: practiceConcours });
  files['data/outils.json'] = JSON.stringify({ updated: site.updated, session: site.session, nextSession: site.nextSession, groups: GROUPS, bac: BAC, concours: toolsConcours, calendar: CALENDAR });
  const manifest = { contentVersion: `2.0.0-${site.updated}`, updated: site.updated, totalQuestions: 0, categories: [] };
  for (const s of SUBJECTS) {
    const qs = banks[s.id] || [];
    if (!qs.length) continue;
    files[`data/questions/${s.id}.json`] = JSON.stringify({ category: s.id, count: qs.length, questions: qs });
    const langs = new Set();
    qs.forEach((q) => (q.languages || []).forEach((l) => langs.add(l)));
    manifest.categories.push({ id: s.id, file: `questions/${s.id}.json`, labels: { fr: s.fr, ar: s.ar }, short: s.short, count: qs.length, languages: [...langs].sort() });
    manifest.totalQuestions += qs.length;
  }
  files['data/manifest.json'] = JSON.stringify(manifest);
  files['data/sources.json'] = fs.readFileSync(path.join(root, 'content/sources.json'), 'utf8');
  return { files, manifest };
}

/* Search index of one language: url, title, description, keywords, group. */
export function searchIndex(pages, lang) {
  return JSON.stringify(pages.filter((p) => p.lang === lang && !p.noindex && !p.noSearch).map((p) => ({
    u: p.path.replace(/index\.html$/, ''),
    t: p.searchTitle || p.title,
    d: (p.description || '').slice(0, 150),
    k: p.keywords ? p.keywords.join(' ') : '',
    g: p.searchGroup || '',
  })));
}

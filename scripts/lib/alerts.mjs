/* Alerts by notification (website only): data file read by the API
 * (push/api.mjs) and the bell buttons driven by src/js/alertes.js. */
import { html } from './html.mjs';
import { icon } from './icons.mjs';
import { linkMode } from './layout.mjs';
import { CALENDAR } from '../../content/calendar.mjs';

export function alertsOn(site) {
  return !!site.pushAlerts && linkMode() !== 'app';
}

/* Topics that are not a concours: dates of the bac and of the Minhaty grant. */
const EXTRA = {
  bac: { fr: 'Bac 2027', ar: 'بكالوريا 2027', u: { fr: 'outils/calcul-note-bac/', ar: 'ar/outils/calcul-note-bac/' }, guide: 'outils/calcul-note-bac/' },
  minhaty: { fr: 'Bourse Minhaty', ar: 'منحة منحتي', u: { fr: 'guides/bourse-minhaty-logement/', ar: 'ar/guides/bourse-minhaty-logement/' }, guide: 'guides/bourse-minhaty-logement/' },
};

function topicOf(e) {
  if (e.concours) return e.concours;
  const hit = Object.entries(EXTRA).find(([, x]) => x.guide === e.guide);
  return hit ? hit[0] : null;
}

/* docs/data/alertes.json */
export function alertsData(site, all) {
  const topics = {};
  for (const c of all) {
    topics[c.id] = {
      fr: c.fr.short, ar: (c.ar || c.fr).short,
      u: { fr: `concours/${c.id}/`, ar: c.ar ? `ar/concours/${c.id}/` : `concours/${c.id}/` },
    };
  }
  for (const [id, x] of Object.entries(EXTRA)) topics[id] = { fr: x.fr, ar: x.ar, u: x.u };
  const events = CALENDAR.map((e) => ({
    id: e.id, topic: topicOf(e), type: e.type, conf: e.confidence,
    ...(e.start ? { s: e.start } : {}), ...(e.date ? { d: e.date } : {}), ...(e.month ? { m: e.month } : {}),
    fr: e.fr, ar: e.ar || e.fr,
  })).filter((e) => e.topic && topics[e.topic]);
  return JSON.stringify({
    site: site.siteUrl, updated: site.updated,
    calendar: { fr: 'outils/calendrier-concours/', ar: 'ar/outils/calendrier-concours/' },
    topics, events,
  });
}

const TXT = {
  fr: {
    off: 'M’alerter des dates', on: 'Alertes activées',
    line: 'Une notification sur ton téléphone avant chaque date limite et chaque épreuve de ce concours. Gratuit, sans inscription.',
    boxH: 'Alertes concours sur ton téléphone',
    boxP: 'Choisis tes concours : tu reçois une notification à l’ouverture des inscriptions, avant chaque date limite et chaque épreuve, et dès qu’une nouvelle date est annoncée. Gratuit, sans compte, désactivable en un geste.',
    soon: 'Dates à venir', others: 'Autres concours',
    homeLink: 'Recevoir les alertes',
  },
  ar: {
    off: 'نبّهني بالمواعيد', on: 'التنبيهات مفعّلة',
    line: 'إشعار على هاتفك قبل كل آخر أجل وكل اختبار في هذه المباراة. مجانًا وبدون تسجيل.',
    boxH: 'تنبيهات المباريات على هاتفك',
    boxP: 'اختر مبارياتك: تتوصل بإشعار عند فتح التسجيل، وقبل كل آخر أجل وكل اختبار، وفور الإعلان عن تاريخ جديد. مجانًا، بدون حساب، ويمكن إيقافه بلمسة.',
    soon: 'مواعيد قادمة', others: 'مباريات أخرى',
    homeLink: 'توصل بالتنبيهات',
  },
};

export function alertButton(site, lang, topic, name, cls = 'btn sm') {
  if (!alertsOn(site)) return '';
  const x = TXT[lang] || TXT.fr;
  return html`<button class="${cls} alert-btn no-print" type="button" data-alert="${topic}" data-label="${name}" aria-pressed="false">${icon('bell')}<span class="ab-off">${x.off}</span><span class="ab-on">${x.on}</span></button>`;
}

/* Under the dates of a fiche ("En bref"). */
export function alertLine(site, lang, topic, name) {
  if (!alertsOn(site)) return '';
  const x = TXT[lang] || TXT.fr;
  return html`<div class="alert-line no-print">${alertButton(site, lang, topic, name)}<small>${x.line}</small></div>`;
}

/* Calendar page: one chip per concours, those with dates to come first. */
export function alertBox(site, lang, all) {
  if (!alertsOn(site)) return '';
  const x = TXT[lang] || TXT.fr;
  const today = site.updated;
  const upcoming = new Set(CALENDAR.filter((e) => (e.date && e.date >= today) || e.confidence === 'estimation').map(topicOf).filter(Boolean));
  const items = [
    ...all.filter((c) => c[lang] || c.fr).map((c) => [c.id, (c[lang] || c.fr).short]),
    ...Object.entries(EXTRA).map(([id, e]) => [id, e[lang]]),
  ];
  const chip = ([id, label]) => html`<button class="alert-chip" type="button" data-alert="${id}" data-label="${label}" aria-pressed="false">${icon('bell')}<span>${label}</span></button>`;
  const soon = items.filter(([id]) => upcoming.has(id));
  const rest = items.filter(([id]) => !upcoming.has(id));
  return html`<section class="alert-box no-print" id="alertes" aria-labelledby="alertes-h">
<div class="alb-head"><span class="alb-ico">${icon('bell')}</span><div><h2 id="alertes-h">${x.boxH}</h2><p>${x.boxP}</p></div></div>
<p class="alb-sub">${x.soon}</p><div class="alert-chips">${soon.map(chip)}</div>
<details class="alb-more"><summary>${x.others} (${rest.length})</summary><div class="alert-chips">${rest.map(chip)}</div></details>
</section>`;
}

export function alertHomeLink(site, lang, link) {
  if (!alertsOn(site)) return '';
  const x = TXT[lang] || TXT.fr;
  return html`<a class="more-link alert-home" href="${link((lang === 'ar' ? 'ar/' : '') + 'outils/calendrier-concours/')}#alertes">${icon('bell')} ${x.homeLink}</a>`;
}

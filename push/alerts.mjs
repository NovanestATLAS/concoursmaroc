/* Which reminders are due on a given day, and their text (FR / AR).
 * Pure functions on data/alertes.json (written by the build from
 * content/calendar.mjs), shared by the API and the tests. */

const MONTHS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'],
};

export function fmtDate(iso, lang) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[lang === 'ar' ? 'ar' : 'fr'][m - 1]}`;
}

/* Today in Morocco (date and hour), whatever the server's time zone. */
export function moroccoNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const g = (t) => (parts.find((p) => p.type === t) || {}).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: Number(g('hour')) % 24 };
}

const utc = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const daysBetween = (from, to) => Math.round((utc(to) - utc(from)) / 864e5);

/* Date an event is "about": the opening of a window or of an exam period. */
export function mainDate(e) { return e.s || e.d || null; }

/* Reminders due on `today`. fresh: ids of events announced since the last
   run ("nouvelle date"). Estimates (month only) never trigger a reminder. */
export function dueToday(data, today, fresh = []) {
  const out = [];
  const freshSet = new Set(fresh);
  for (const e of data.events) {
    if (!e.d || e.conf === 'estimation') continue;
    const dd = daysBetween(today, e.d);
    const ds = e.s ? daysBetween(today, e.s) : null;
    let kind = null;
    let days = dd;
    if (e.type === 'deadline') {
      if (ds === 0 && dd > 0) kind = 'open';
      else if (dd === 7 || dd === 2) kind = 'deadline';
      else if (dd === 0) kind = 'lastday';
    } else if (e.type === 'inscription') {
      if (ds === 0 && dd > 0) kind = 'open';
      else if (dd === 3) kind = 'closing';
      else if (dd === 0) kind = 'lastday';
    } else if (e.type === 'ecrit') {
      const d0 = ds !== null ? ds : dd;
      days = d0;
      if (d0 === 7) kind = 'exam';
      else if (d0 === 1) kind = 'tomorrow';
    } else if (e.type === 'resultats') {
      if (dd === 0) kind = 'results';
    }
    if (!kind && freshSet.has(e.id) && mainDate(e) >= today) { kind = 'new'; days = daysBetween(today, mainDate(e)); }
    if (kind) out.push({ id: e.id, topic: e.topic, kind, days, e });
  }
  // most urgent first
  return out.sort((a, b) => a.days - b.days);
}

const T = {
  fr: {
    open: (n) => `📝 ${n} : les inscriptions sont ouvertes`,
    deadline: (n, d) => `⏳ ${n} : plus que ${d} jours`,
    lastday: (n) => `⏰ ${n} : dernier jour !`,
    closing: (n) => `⏳ ${n} : inscriptions closes dans 3 jours`,
    exam: (n) => `📅 ${n} : épreuve dans 7 jours`,
    tomorrow: (n) => `📅 ${n} : c’est demain !`,
    results: (n) => `📣 ${n} : résultats attendus aujourd’hui`,
    new: (n) => `🆕 ${n} : nouvelle date annoncée`,
    until: (d) => `jusqu’au ${d}`,
    tipExam: 'Entraîne-toi avec un examen blanc.',
    tipTomorrow: 'Bonne chance ! Revois les derniers QCM.',
    tipDeadline: 'Prépare ton dossier.',
    many: (k) => `🔔 ${k} rappels pour tes concours`,
    confirmT: '🔔 Alertes activées',
    confirmB: (list) => `Tu seras prévenu(e) avant les dates importantes : ${list}.`,
    next: (txt, d) => ` Prochaine date : ${txt} (${d}).`,
  },
  ar: {
    open: (n) => `📝 ${n}: فُتح باب التسجيل`,
    deadline: (n, d) => `⏳ ${n}: بقي ${d === 2 ? 'يومان' : `${d} أيام`}`,
    lastday: (n) => `⏰ ${n}: اليوم آخر أجل!`,
    closing: (n) => `⏳ ${n}: يُغلق التسجيل بعد 3 أيام`,
    exam: (n) => `📅 ${n}: الاختبار بعد 7 أيام`,
    tomorrow: (n) => `📅 ${n}: الاختبار غدًا!`,
    results: (n) => `📣 ${n}: النتائج متوقعة اليوم`,
    new: (n) => `🆕 ${n}: تاريخ جديد`,
    until: (d) => `إلى غاية ${d}`,
    tipExam: 'تمرّن بامتحان تجريبي.',
    tipTomorrow: 'بالتوفيق! راجع آخر الأسئلة.',
    tipDeadline: 'حضّر ملفك.',
    many: (k) => `🔔 ${k} تذكيرات لمبارياتك`,
    confirmT: '🔔 تم تفعيل التنبيهات',
    confirmB: (list) => `سنخبرك قبل المواعيد المهمة: ${list}.`,
    next: (txt, d) => ` الموعد القادم: ${txt} (${d}).`,
  },
};

function link(data, path, campaign) {
  return `${data.site}/${path}?utm_source=push&utm_medium=notification&utm_campaign=${campaign}`;
}

function topicName(data, topic, lang) {
  const t = data.topics[topic];
  return t ? (t[lang] || t.fr) : 'Concours Maroc';
}

function oneTitle(d, lang, data) {
  const x = T[lang];
  const n = topicName(data, d.topic, lang);
  return d.kind === 'deadline' ? x.deadline(n, d.days) : x[d.kind](n);
}

function oneBody(d, lang) {
  const x = T[lang];
  const e = d.e;
  const txt = e[lang] || e.fr;
  const sep = lang === 'ar' ? ' — ' : ' — ';
  if (d.kind === 'open' || d.kind === 'closing') return `${txt}${sep}${x.until(fmtDate(e.d, lang))}.`;
  if (d.kind === 'exam') return `${txt}${sep}${fmtDate(mainDate(e), lang)}. ${x.tipExam}`;
  if (d.kind === 'tomorrow') return `${txt}. ${x.tipTomorrow}`;
  if (d.kind === 'deadline') return `${txt}${sep}${fmtDate(e.d, lang)}. ${x.tipDeadline}`;
  if (d.kind === 'new') return `${txt}${sep}${fmtDate(mainDate(e), lang)}.`;
  return `${txt}.`;
}

/* One notification per subscriber per day: the reminder itself, or a
   summary when several are due for the concours they follow. */
export function buildMessage(due, lang, data) {
  lang = lang === 'ar' ? 'ar' : 'fr';
  const x = T[lang];
  const urgent = due.some((d) => d.kind === 'lastday' || d.kind === 'tomorrow');
  if (due.length === 1) {
    const d = due[0];
    const t = data.topics[d.topic];
    return {
      title: oneTitle(d, lang, data), body: oneBody(d, lang), lang,
      url: link(data, t ? t.u[lang] || t.u.fr : (lang === 'ar' ? 'ar/' : ''), d.kind),
      tag: `cm-${d.id}`, ttl: urgent ? 12 * 3600 : 24 * 3600,
    };
  }
  return {
    title: x.many(due.length),
    body: due.slice(0, 3).map((d) => oneTitle(d, lang, data).replace(/^\S+\s/, '')).join(' · '),
    lang,
    url: link(data, data.calendar[lang] || data.calendar.fr, 'resume'),
    tag: 'cm-resume', ttl: urgent ? 12 * 3600 : 24 * 3600,
  };
}

/* Confirmation sent when someone turns alerts on (proves it works, and says
   what comes next). */
export function confirmMessage(topics, lang, data, today) {
  lang = lang === 'ar' ? 'ar' : 'fr';
  const x = T[lang];
  const names = topics.map((t) => topicName(data, t, lang));
  const list = names.slice(0, 3).join(lang === 'ar' ? '، ' : ', ') + (names.length > 3 ? '…' : '');
  const next = data.events
    .filter((e) => topics.includes(e.topic) && e.d && e.conf !== 'estimation' && mainDate(e) >= today)
    .sort((a, b) => mainDate(a).localeCompare(mainDate(b)))[0];
  const first = data.topics[topics[0]];
  return {
    title: x.confirmT,
    body: x.confirmB(list) + (next ? x.next(next[lang] || next.fr, fmtDate(mainDate(next), lang)) : ''),
    lang,
    url: link(data, first ? first.u[lang] || first.u.fr : (lang === 'ar' ? 'ar/' : ''), 'confirmation'),
    tag: 'cm-confirm', ttl: 3600,
  };
}

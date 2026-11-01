/* Alerts API, served by Cloudflare Pages Functions under /api/push/
 * (functions/api/push/[[path]].js). Storage: the Workers KV namespace bound
 * as PUSH in the Pages project settings.
 *
 *   GET  /api/push/key          public VAPID key (created on first call)
 *   POST /api/push/subscribe    { sub, topics, lang, key } -> saves, sends a confirmation
 *   POST /api/push/unsubscribe  { endpoint }
 *   POST /api/push/renew        { old, sub } (service worker, pushsubscriptionchange)
 *   POST /api/push/run          sends the day's reminders, 20 subscribers per call;
 *                               called in a loop by .github/workflows/alertes-push.yml
 *   GET  /api/push/status       configuration and last run (for the workflow)
 *
 * No secret to configure: the VAPID private key is generated and kept in KV;
 * /run is safe to call by anyone (one job per day, Moroccan daytime only,
 * every reminder computed from the public calendar). */
import { generateVapidKeys, createSender, unb64u } from './webpush.mjs';
import { moroccoNow, dueToday, mainDate, buildMessage, confirmMessage } from './alerts.mjs';

const BATCH = 20;          // pushes per /run call (Workers Free: 50 subrequests, 10 ms CPU)
const SUBJECT = 'https://www.maroc-concour.com/contact/';
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra },
  });
}

async function body(request) {
  const text = await request.text();
  if (text.length > 6000) throw Object.assign(new Error('too-large'), { status: 413 });
  try { return JSON.parse(text || '{}'); } catch (e) { throw Object.assign(new Error('bad-json'), { status: 400 }); }
}

function validEndpoint(endpoint, env) {
  try {
    const u = new URL(endpoint);
    if (env.PUSH_ALLOW_TEST === '1' && u.hostname === '127.0.0.1') return true;
    return u.protocol === 'https:' && endpoint.length < 800 && PUSH_HOSTS.some((re) => re.test(u.hostname));
  } catch (e) { return false; }
}

function validSub(sub, env) {
  if (!sub || typeof sub !== 'object' || !sub.keys) return false;
  if (!validEndpoint(sub.endpoint, env)) return false;
  try {
    const p = unb64u(sub.keys.p256dh);
    const a = unb64u(sub.keys.auth);
    return p.length === 65 && p[0] === 4 && a.length >= 16 && a.length <= 32;
  } catch (e) { return false; }
}

async function subId(endpoint) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)));
  return 'sub:' + Array.from(h.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadData(env, request) {
  const res = await env.ASSETS.fetch(new URL('/data/alertes.json', request.url));
  if (!res.ok) throw new Error('alertes.json ' + res.status);
  return res.json();
}

async function vapidKeys(env, create) {
  let v = await env.PUSH.get('cfg:vapid', 'json');
  if (!v && create) {
    v = await generateVapidKeys();
    await env.PUSH.put('cfg:vapid', JSON.stringify(v));
  }
  return v;
}

/* Record kept for each subscription; also stored as KV metadata (up to 1 KB)
   so that a run reads the subscribers with list() alone. */
async function saveSub(env, key, rec) {
  const meta = JSON.stringify(rec);
  await env.PUSH.put(key, JSON.stringify(rec), meta.length <= 1000 ? { metadata: rec } : {});
}

function testOverride(env, url) {
  if (env.PUSH_ALLOW_TEST !== '1') return null;
  const today = url.searchParams.get('today');
  return today ? { date: today, hour: Number(url.searchParams.get('hour') || 10) } : null;
}

async function routeKey(env) {
  const v = await vapidKeys(env, true);
  return json({ key: v.publicKey }, 200, { 'cache-control': 'public, max-age=3600' });
}

async function routeSubscribe(request, env) {
  const b = await body(request);
  const sub = b.sub;
  if (!validSub(sub, env)) return json({ error: 'bad-subscription' }, 400);
  const data = await loadData(env, request);
  const topics = [...new Set((Array.isArray(b.topics) ? b.topics : []).filter((t) => typeof t === 'string' && data.topics[t]))].slice(0, 40);
  const lang = b.lang === 'ar' ? 'ar' : 'fr';
  const key = await subId(sub.endpoint);
  if (!topics.length) {
    await env.PUSH.delete(key);
    return json({ ok: true, topics: [] });
  }
  const vapid = await vapidKeys(env, true);
  if (b.key && b.key !== vapid.publicKey) return json({ error: 'key-changed', key: vapid.publicKey }, 409);
  const prev = await env.PUSH.get(key, 'json');
  const rec = { e: sub.endpoint, p: sub.keys.p256dh, a: sub.keys.auth, t: topics, l: lang };
  const added = topics.filter((t) => !(prev && prev.t || []).includes(t));
  let test = null;
  if (added.length && b.confirm !== false) {
    // confirmation notification: proves the subscription works end to end
    const today = (testOverride(env, new URL(request.url)) || moroccoNow()).date;
    const msg = confirmMessage(added, lang, data, today);
    const send = createSender(vapid, SUBJECT);
    test = await send({ endpoint: rec.e, keys: { p256dh: rec.p, auth: rec.a } }, msg, { ttl: msg.ttl, urgency: 'high' });
    if (test.gone) { await env.PUSH.delete(key); return json({ error: 'gone' }, 410); }
    // 401/403: subscription made with another VAPID key
    if (test.status === 401 || test.status === 403) return json({ error: 'key-changed', key: vapid.publicKey }, 409);
  }
  await saveSub(env, key, rec);
  return json({ ok: true, topics, test: test ? test.status : null });
}

async function routeUnsubscribe(request, env) {
  const b = await body(request);
  if (!b.endpoint || typeof b.endpoint !== 'string') return json({ error: 'bad-request' }, 400);
  await env.PUSH.delete(await subId(b.endpoint));
  return json({ ok: true });
}

async function routeRenew(request, env) {
  const b = await body(request);
  if (!validSub(b.sub, env) || typeof b.old !== 'string') return json({ error: 'bad-request' }, 400);
  const oldKey = await subId(b.old);
  const prev = await env.PUSH.get(oldKey, 'json');
  if (!prev) return json({ error: 'unknown' }, 404);
  await saveSub(env, await subId(b.sub.endpoint), { ...prev, e: b.sub.endpoint, p: b.sub.keys.p256dh, a: b.sub.keys.auth });
  if (oldKey !== await subId(b.sub.endpoint)) await env.PUSH.delete(oldKey);
  return json({ ok: true });
}

async function pool(items, size, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const n = i++; await fn(items[n]); }
  });
  await Promise.all(workers);
}

async function routeRun(request, env) {
  const url = new URL(request.url);
  const { date: today, hour } = testOverride(env, url) || moroccoNow();
  if (hour < 8 || hour >= 22) return json({ done: true, today, skipped: 'night' });
  const jobKey = 'job:' + today;
  let job = await env.PUSH.get(jobKey, 'json');
  if (job && job.done) return json({ done: true, today, due: job.due, sent: job.sent, failed: job.failed, removed: job.removed });
  const data = await loadData(env, request);
  if (!job) {
    // events published since the previous run are announced as "nouvelle date";
    // the very first run only records what exists
    const known = await env.PUSH.get('cfg:known', 'json');
    const ids = data.events.map((e) => e.id);
    const fresh = known ? data.events.filter((e) => !known.includes(e.id) && e.d && e.conf !== 'estimation' && mainDate(e) >= today).map((e) => e.id) : [];
    await env.PUSH.put('cfg:known', JSON.stringify([...new Set([...(known || []), ...ids])]));
    job = { today, cursor: null, fresh, due: 0, sent: 0, failed: 0, removed: 0, started: new Date().toISOString() };
  }
  const due = dueToday(data, today, job.fresh);
  job.due = due.length;
  if (!due.length) {
    job.done = true;
    await env.PUSH.put(jobKey, JSON.stringify(job), { expirationTtl: 8 * 86400 });
    return json({ done: true, today, due: 0, sent: 0 });
  }
  const topics = new Set(due.map((d) => d.topic));
  const list = await env.PUSH.list({ prefix: 'sub:', limit: BATCH, ...(job.cursor ? { cursor: job.cursor } : {}) });
  const vapid = await vapidKeys(env, false);
  if (!vapid) return json({ error: 'no-key' }, 500);
  const send = createSender(vapid, SUBJECT);
  const errors = [];
  await pool(list.keys, 6, async (k) => {
    let rec = k.metadata && k.metadata.e ? k.metadata : null;
    if (!rec) rec = await env.PUSH.get(k.name, 'json');
    if (!rec || !Array.isArray(rec.t) || !rec.t.some((t) => topics.has(t))) return;
    const mine = due.filter((d) => rec.t.includes(d.topic));
    const msg = buildMessage(mine, rec.l, data);
    const r = await send({ endpoint: rec.e, keys: { p256dh: rec.p, auth: rec.a } }, msg, { ttl: msg.ttl, topic: 'cmdaily' });
    if (r.ok) job.sent++;
    else if (r.gone) { await env.PUSH.delete(k.name); job.removed++; }
    else { job.failed++; if (errors.length < 3) errors.push(`${r.status} ${r.error || ''}`.trim()); }
  });
  job.cursor = list.list_complete ? null : list.cursor;
  job.done = !!list.list_complete;
  job.updated = new Date().toISOString();
  await env.PUSH.put(jobKey, JSON.stringify(job), { expirationTtl: 8 * 86400 });
  return json({ done: job.done, today, due: due.length, sent: job.sent, failed: job.failed, removed: job.removed, errors });
}

async function routeStatus(env, request) {
  const v = await vapidKeys(env, false);
  const { date: today } = testOverride(env, new URL(request.url)) || moroccoNow();
  let subscribers = 0;
  let cursor;
  for (let i = 0; i < 5; i++) {
    const l = await env.PUSH.list({ prefix: 'sub:', limit: 1000, ...(cursor ? { cursor } : {}) });
    subscribers += l.keys.length;
    if (l.list_complete) break;
    cursor = l.cursor;
  }
  const job = await env.PUSH.get('job:' + today, 'json');
  const data = await loadData(env, request);
  return json({ configured: true, key: !!v, subscribers, today, dueToday: dueToday(data, today, job ? job.fresh : []).map((d) => `${d.kind}:${d.id}`), job });
}

export async function handle(context) {
  const { request, env, params } = context;
  const route = [].concat(params && params.path || []).join('/');
  const m = request.method;
  if (!env.PUSH) return json({ error: 'not-configured', hint: 'Bind a KV namespace as PUSH in the Pages project settings, then redeploy.' }, 503);
  try {
    if (route === 'key' && m === 'GET') return await routeKey(env);
    if (route === 'subscribe' && m === 'POST') return await routeSubscribe(request, env);
    if (route === 'unsubscribe' && m === 'POST') return await routeUnsubscribe(request, env);
    if (route === 'renew' && m === 'POST') return await routeRenew(request, env);
    if (route === 'run' && m === 'POST') return await routeRun(request, env);
    if (route === 'status' && m === 'GET') return await routeStatus(env, request);
    return json({ error: 'not-found' }, 404);
  } catch (e) {
    return json({ error: e.status ? e.message : 'server', detail: String(e && e.message || e).slice(0, 160) }, e.status || 500);
  }
}

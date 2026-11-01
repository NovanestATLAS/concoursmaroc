/* Web Push on WebCrypto only (Cloudflare Workers / Pages Functions, Node 20+):
 *   - VAPID authentication (RFC 8292): ES256 JWT signed with the site's key;
 *   - message encryption "aes128gcm" (RFC 8291 + RFC 8188), one record.
 * No dependency, no paid service: messages go straight to the browser's push
 * service (Google FCM for Chrome/Android, Mozilla, Apple, Microsoft). */

const te = new TextEncoder();

export function b64u(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function unb64u(str) {
  const s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/* VAPID key pair: the public key (uncompressed P-256 point, base64url) is
   given to browsers as applicationServerKey; the private key never leaves
   the server's storage. */
export async function generateVapidKeys() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const privateJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  return { publicKey: b64u(raw), privateJwk };
}

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

/* Encrypts a payload for one subscription (keys from PushSubscription.toJSON()). */
export async function encryptPayload(payload, p256dh, auth) {
  const uaPublic = unb64u(p256dh);
  const authSecret = unb64u(auth);
  if (uaPublic.length !== 65 || uaPublic[0] !== 4 || authSecret.length < 16) throw new Error('bad-subscription-keys');
  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));
  const ikm = await hkdf(authSecret, ecdh, concat(te.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const plain = concat(te.encode(payload), new Uint8Array([2])); // 0x02: last (and only) record
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, plain));
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = 65;
  header.set(asPublic, 21);
  return concat(header, cipher);
}

/* Returns send(subscription, payloadObject, { ttl, urgency, topic }).
   The signing key and one JWT per push service are reused within a run. */
export function createSender(vapid, subject) {
  let signKey = null;
  const jwts = new Map();
  async function authorization(endpoint) {
    const aud = new URL(endpoint).origin;
    const cached = jwts.get(aud);
    if (cached) return cached;
    if (!signKey) signKey = await crypto.subtle.importKey('jwk', vapid.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const head = b64u(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const claims = b64u(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signKey, te.encode(`${head}.${claims}`));
    const value = `vapid t=${head}.${claims}.${b64u(sig)}, k=${vapid.publicKey}`;
    jwts.set(aud, value);
    return value;
  }
  return async function send(sub, payload, { ttl = 86400, urgency = 'normal', topic } = {}) {
    const body = await encryptPayload(JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth);
    const headers = {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: urgency,
      Authorization: await authorization(sub.endpoint),
    };
    if (topic) headers.Topic = topic;
    let res;
    try {
      res = await fetch(sub.endpoint, { method: 'POST', headers, body });
    } catch (e) {
      return { ok: false, status: 0, gone: false, error: String(e && e.message || e).slice(0, 120) };
    }
    const text = await res.text().catch(() => '');
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      // the browser unsubscribed or the subscription expired: forget it
      gone: res.status === 404 || res.status === 410,
      error: res.status >= 300 ? text.slice(0, 200) : '',
    };
  };
}

/* Monetag on the website (never in the Android app: the app only reuses page
 * bodies, and this code lives in the <head> written by layout.mjs).
 *
 * Only two formats are ever loaded, In-Page Push and Vignette Banner, from the
 * tags pasted in content/site.mjs (monetag.inPagePush / monetag.vignette).
 * Both Monetag tag styles are read:
 *   <script>(function(s){s.dataset.zone='123',s.src='https://x.com/vignette.min.js'})(…)</script>
 *   <script src="https://x.com/tag.min.js" data-zone="123" async></script>
 *   <script>(function(d,z,s){s.src='https://'+d+'/400/'+z;…})('x.com',123,document.createElement('script'))</script>
 * The tag is not copied as is: one small inline script decides, page by page,
 * whether a format may load, then adds the script with the same src and zone
 * (both stay readable in the page source for the Monetag installation check).
 *
 * Rules, all in the browser (no cookie, no server):
 *   - no Monetag at all without localStorage/sessionStorage (no cap = no ad);
 *   - Vignette: never on the first page of a visit (a visitor from Google
 *     reads the page first), then at most once every vignetteHours per browser;
 *   - one Monetag format per page view (never a vignette and an In-Page Push together);
 *   - In-Page Push on phones only (≤ 920 px): Monetag shows it along the top edge,
 *     over the header buttons; on wider screens it would sit top-right, over the
 *     header's "Télécharger l'app" link. Never while the Android app banner and
 *     its Install button are at the top of the page;
 *   - none on the pages of PAGES_WITHOUT (practice and timed simulator, app
 *     download page, contact, legal and privacy pages) or with page.noAds. */
import { raw, esc } from './html.mjs';
import { appLive } from './app-funnel.mjs';

const PAGES_WITHOUT = /^(ar\/)?(entrainement|application|app|contact|confidentialite|mentions-legales|a-propos|sources|outils\/simulateur-qcm)\//;

/* Tag (string) or { src, zone } -> { s: src, z: zone|null }, or null when empty. */
export function parseMonetagTag(value, label) {
  if (!value) return null;
  if (typeof value === 'object') {
    if (!/^https:\/\//.test(value.src || '')) throw new Error(`monetag.${label}: src must be an https URL`);
    return { s: value.src, z: value.zone ? String(value.zone) : null };
  }
  const tag = String(value).trim();
  if (!tag) return null;
  if (/serviceWorker|sw\.js|MultiTag/i.test(tag)) {
    throw new Error(`monetag.${label}: this tag installs a service worker or is a MultiTag. Use only In-Page Push and Vignette Banner zones (the site's docs/sw.js runs the concours alerts).`);
  }
  let m;
  // s.dataset.zone='123', s.src='https://…'
  const zone = (m = tag.match(/dataset\.zone\s*=\s*['"]?(\d+)/)) ? m[1] : (m = tag.match(/data-zone=["']?(\d+)/)) ? m[1] : null;
  const src = (m = tag.match(/\.src\s*=\s*['"](https:\/\/[^'"]+)['"]/)) ? m[1] : (m = tag.match(/<script[^>]*\ssrc=["'](https:\/\/[^"']+)["']/)) ? m[1] : null;
  if (src) return { s: src, z: zone };
  // Older style: s.src='https://'+d+'/400/'+z … ('domain.com',1234567,document.createElement('script'))
  const path = tag.match(/['"]https:\/\/['"]\s*\+\s*d\s*\+\s*['"](\/[\w/-]*\/)['"]\s*\+\s*z/);
  const args = tag.match(/\(\s*['"]([a-z0-9.-]+\.[a-z]{2,})['"]\s*,\s*(\d+)\s*,\s*document\.createElement/i);
  if (path && args) return { s: `https://${args[1]}${path[1]}${args[2]}`, z: null };
  throw new Error(`monetag.${label}: could not read the src and zone of this tag. Paste the whole <script>…</script> from the Monetag dashboard.`);
}

export function monetagVerification(site) {
  const v = String((site.monetag && site.monetag.verification) || '').trim();
  if (!v) return '';
  const m = v.match(/content=["']([^"']+)["']/);
  return m ? m[1] : v;
}

export function monetagEnabled(site) {
  const m = site.monetag || {};
  return !!(parseMonetagTag(m.inPagePush, 'inPagePush') || parseMonetagTag(m.vignette, 'vignette'));
}

export function monetagHead(site, page) {
  const m = site.monetag || {};
  const verification = monetagVerification(site);
  const meta = verification ? `<meta name="monetag" content="${esc(verification)}">` : '';
  const p = parseMonetagTag(m.inPagePush, 'inPagePush');
  const v = parseMonetagTag(m.vignette, 'vignette');
  if ((!p && !v) || page.noAds || page.noMonetag || PAGES_WITHOUT.test(page.path || '')) return raw(meta);
  const cfg = JSON.stringify({ p, v, h: Number(m.vignetteHours) || 12, b: !!(appLive(site) && !page.noAppBanner) }).replace(/</g, '\\u003c');
  // Runs after the theme script of the head, which sets is-android / appbanner-off on <html>.
  const js = `(function(M){var d=document.documentElement,ls,ss,now=Date.now();try{ls=localStorage;ss=sessionStorage;ls.getItem('x')}catch(e){return}
function add(t){var s=document.createElement('script');if(t.z)s.dataset.zone=t.z;s.src=t.s;s.async=true;s.setAttribute('data-cfasync','false');d.appendChild(s)}
try{var pv=(+ss.getItem('cm.ads.pv')||0)+1;ss.setItem('cm.ads.pv',pv);
if(M.v&&pv>1&&now-(+ls.getItem('cm.ads.vignette')||0)>=M.h*36e5){ls.setItem('cm.ads.vignette',now);d.setAttribute('data-ad','vignette');add(M.v);return}
var banner=M.b&&d.classList.contains('is-android')&&!d.classList.contains('appbanner-off');
if(M.p&&!banner&&matchMedia('(max-width: 920px)').matches){d.setAttribute('data-ad','inpagepush');add(M.p)}}catch(e){}})(${cfg});`;
  return raw(`${meta}<script data-cfasync="false">${js}</script>`);
}

/* Extra ads.txt lines from the dashboard (one seller per line). */
export function monetagAdsTxt(site) {
  const lines = (site.monetag && site.monetag.adsTxt) || [];
  return lines.map((l) => String(l).trim()).filter(Boolean);
}

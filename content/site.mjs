/* Global site configuration.
 *
 * Domain: `siteUrl` is the public address (canonical URLs, sitemap, hreflang
 * and Open Graph follow it). The site is served by Cloudflare Pages; the DNS
 * and the root -> www redirect are described in README.md. `customDomain` is
 * still written to docs/CNAME, which Cloudflare ignores.
 */
export default {
  name: 'Concours Maroc',
  // Public address of the site, without trailing slash.
  siteUrl: 'https://www.maroc-concour.com',
  // Host name for the GitHub Pages custom domain ('' = none).
  customDomain: 'www.maroc-concour.com',
  defaultLang: 'fr',
  languages: ['fr', 'ar'],
  // Editorial date shown on pages and used as <lastmod> in the sitemap.
  updated: '2026-11-09',
  // Academic year the guides were last checked against.
  session: '2026',
  nextSession: '2027',
  repoUrl: 'https://github.com/NovanestATLAS/concoursmaroc',
  // Optional public contact address. Empty = contact goes through GitHub issues.
  contactEmail: '',
  // Contact form (/contact/): access key from https://web3forms.com (free).
  // Messages go to the email address the key was created with; that address
  // never appears in the site. Empty = the form is shown switched off.
  contactKey: 'd5dd4775-3f49-4699-8e24-f912ad749d75',
  themeColor: '#101a3d',
  // Android app: 'soon' shows "bientôt sur Google Play" (application/ page,
  // home page and footer badge); 'live' turns on the whole funnel to Google
  // Play (header button, Android banner, home band, cards on the pages, end
  // of quiz), see scripts/lib/pages/app-landing.mjs. Every store link carries
  // a campaign (utm_campaign = where it was clicked), read in the Play
  // Console (acquisition reports) and sent to GA4 as "app_store_click".
  androidApp: { status: 'live', id: 'com.novanest.concoursmaroc', since: '2026-10-30' },
  // IndexNow (Bing, Yandex, Seznam, Naver…): the build publishes <key>.txt and
  // .github/workflows/indexnow.yml submits the pages changed by each push.
  indexNowKey: '6255d51ee7beda0ba731f342d1450979',
  // Alerts by notification (website): bell buttons on the fiches, the
  // calendar and the home page; served by Cloudflare Pages Functions
  // (functions/, push/) with a KV namespace bound as PUSH. See README.md.
  pushAlerts: true,

  // ---- services you will add later (leave empty until then) ----
  // Google Search Console HTML-tag verification code (content="..." value only).
  googleSiteVerification: '',
  // Google Analytics 4 measurement ID, e.g. 'G-XXXXXXXXXX' (Admin → Data streams →
  // Web). When set, every page of the website gets the tag and the trainer sends
  // events (select_concours, quiz_start, quiz_complete, search); the Android app
  // never loads it.
  ga4: 'G-11QRJ1VXW0',
  // Google AdSense publisher ID, e.g. 'ca-pub-1234567890123456'.
  // When set, the AdSense script is added to every content page and ads.txt is generated.
  adsenseClient: 'ca-pub-3709043100488694',
  // Monetag (website only, never in the Android app): In-Page Push and Vignette
  // Banner zones only. Paste each value exactly as the Monetag dashboard gives it
  // (scripts/lib/monetag.mjs reads both tag styles); an empty value loads nothing.
  // Never paste a MultiTag, OnClick/Popunder, Direct Link or Push Notifications
  // tag: the build refuses tags that install a service worker (it would replace
  // docs/sw.js and break the concours alerts). Rules applied on the site: the
  // vignette never on the first page of a visit and at most once every
  // vignetteHours per browser, one Monetag format per page, In-Page Push on phones
  // only and never with the app banner, none on practice, legal and app pages.
  monetag: {
    // Sites → Add site → verification "Insert code": the <meta name="monetag" …> tag or its content value.
    verification: '',
    // Sites → Add zone → In-Page Push → Get tag.
    inPagePush: ``,
    // Sites → Add zone → Vignette Banner → Get tag.
    vignette: ``,
    vignetteHours: 12,
    // Extra ads.txt lines, if the Monetag dashboard asks for them.
    adsTxt: [],
  },
};

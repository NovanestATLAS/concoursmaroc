/* Global site configuration.
 *
 * Domain: `siteUrl` is the public address and `customDomain` the host that
 * GitHub Pages serves (the build writes it to docs/CNAME). Changing them is
 * enough: canonical URLs, sitemap, hreflang and Open Graph follow. The DNS
 * side is described in README.md.
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
  updated: '2026-10-19',
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
  // home page and footer badge); 'live' turns them into Google Play links.
  androidApp: { status: 'soon', id: 'com.novanest.concoursmaroc' },
  // IndexNow (Bing, Yandex, Seznam, Naver…): the build publishes <key>.txt and
  // .github/workflows/indexnow.yml submits the pages changed by each push.
  indexNowKey: '6255d51ee7beda0ba731f342d1450979',

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
};

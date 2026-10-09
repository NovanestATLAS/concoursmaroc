/* Global site configuration.
 *
 * When you buy the domain:
 *   1. set `siteUrl` to the final address (e.g. 'https://concoursmaroc.com')
 *   2. set `customDomain` to the bare host (e.g. 'concoursmaroc.com') — the build
 *      then writes docs/CNAME, which GitHub Pages needs
 *   3. run `npm run build`, commit, push
 * Everything else (canonical URLs, sitemap, hreflang, Open Graph) follows.
 */
export default {
  name: 'Concours Maroc',
  // Public address of the site, without trailing slash.
  siteUrl: 'https://novanestatlas.github.io/concoursmaroc',
  // Bare host name for GitHub Pages custom domains ('' = none yet).
  customDomain: '',
  defaultLang: 'fr',
  languages: ['fr', 'ar'],
  // Editorial date shown on pages and used as <lastmod> in the sitemap.
  updated: '2026-10-09',
  // Academic year the guides were last checked against.
  session: '2026',
  nextSession: '2027',
  repoUrl: 'https://github.com/NovanestATLAS/concoursmaroc',
  // Optional public contact address. Empty = contact goes through GitHub issues.
  contactEmail: '',
  themeColor: '#0b6e4f',

  // ---- services you will add later (leave empty until then) ----
  // Google Search Console HTML-tag verification code (content="..." value only).
  googleSiteVerification: '',
  // Google Analytics 4 measurement ID, e.g. 'G-XXXXXXXXXX'.
  ga4: '',
  // Google AdSense publisher ID, e.g. 'ca-pub-1234567890123456'.
  // When set, the AdSense script is added to every page and ads.txt is generated.
  adsenseClient: '',
};

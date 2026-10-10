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

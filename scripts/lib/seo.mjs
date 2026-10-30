/* sitemap.xml, robots.txt, web app manifest. */

function abs(site, p) {
  return `${site.siteUrl}/${String(p).replace(/^\//, '').replace(/index\.html$/, '')}`;
}

export function sitemapXml(site, pages) {
  const byPath = new Map(pages.map((p) => [p.path.replace(/index\.html$/, ''), p]));
  const rows = pages.filter((p) => !p.noindex).map((p) => {
    const self = p.path.replace(/index\.html$/, '');
    const alt = p.alternate && byPath.has(p.alternate) ? p.alternate : null;
    const prio = self === '' || self === 'ar/' ? '1.0' : /^(ar\/)?concours\//.test(self) ? '0.9' : /^(ar\/)?(outils|entrainement)\//.test(self) ? '0.8' : '0.6';
    let links = '';
    if (alt) {
      const fr = p.lang === 'fr' ? self : alt;
      const ar = p.lang === 'ar' ? self : alt;
      links = `\n    <xhtml:link rel="alternate" hreflang="fr" href="${abs(site, fr)}"/>\n    <xhtml:link rel="alternate" hreflang="ar" href="${abs(site, ar)}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(site, fr)}"/>`;
    }
    return `  <url>\n    <loc>${abs(site, self)}</loc>\n    <lastmod>${p.updated || site.updated}</lastmod>\n    <priority>${prio}</priority>${links}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(site) {
  return `User-agent: *\nAllow: /\nDisallow: /data/questions/\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`;
}

export function manifestJson(site) {
  return JSON.stringify({
    name: 'Concours Maroc — guide et entraînement aux concours',
    short_name: 'Concours Maroc',
    description: 'Guide des concours au Maroc après le bac, QCM corrigés et outils de préparation, utilisables hors ligne.',
    lang: 'fr',
    dir: 'ltr',
    start_url: './entrainement/?source=pwa',
    scope: './',
    display: 'standalone',
    background_color: '#f5f7fb',
    theme_color: site.themeColor,
    icons: [
      { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: 'assets/img/concours-maroc-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'assets/img/concours-maroc-icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'assets/img/concours-maroc-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // The Android app is preferred to installing the website: Chrome then
    // offers the Google Play app instead of "Install app" for the site.
    ...(site.androidApp && site.androidApp.status === 'live' ? {
      related_applications: [{ platform: 'play', url: `https://play.google.com/store/apps/details?id=${site.androidApp.id}`, id: site.androidApp.id }],
      prefer_related_applications: true,
    } : {}),
    shortcuts: [
      { name: 'Entraînement', url: './entrainement/' },
      { name: 'Calendrier des concours', url: './outils/calendrier-concours/' },
      { name: 'Calcul de la note du bac', url: './outils/calcul-note-bac/' },
    ],
  }, null, 2);
}

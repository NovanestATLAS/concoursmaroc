# CLAUDE.md – Concours Maroc (www.maroc-concour.com)

Permanent rules for every session. The README explains the features in detail; read the section you touch.

## What this is
- Free bilingual (French / Arabic) guide to the concours and orientation after the bac in Morocco: concours pages,
  corrected MCQs, mock exams, tools, guides, date alerts. The same content ships as an Android app (Cordova).
- Static site generator in plain Node, no framework: `content/` (data and Markdown) + `scripts/lib/` (templates)
  + `src/` (CSS, JS, images, fonts) → `docs/` (built site, committed).
- Hosting: Cloudflare Pages project `concoursmaroc`, production branch `claude/concoursmaroc-github-site-x6v5br`,
  publishes `docs/` as is (no build command). Push alerts run on Pages Functions (`functions/`, `push/`) with the
  Workers KV binding `PUSH`. No paid service, no secret in the repo.

## Done means
- `npm run build` then `npm run check` with 0 errors and 0 warnings, and `docs/` committed with the source change.
- Nothing is done until the built page has been looked at (mobile 390 px and desktop), in French and in Arabic.

## Accuracy
- Dates, thresholds, fees and conditions come only from official sources listed in `content/sources.json`.
  Never invent a date: an unconfirmed date is `confidence: 'estimation'` with a month only, and it never triggers
  a push alert.
- MCQs are our own; every question has a valid `sourceId`. Never copy questions from other sites or books.
- We are not a government site: no official seals or logos, no wording that implies we are the ministry or a school.

## SEO (enforced by `scripts/check.mjs`)
- One `<h1>`, no skipped heading levels, full title ≤ 60 characters (the " | Concours Maroc" suffix counts),
  meta description ≤ 160, unique titles, self canonical on www.maroc-concour.com, `hreflang` fr/ar pairs,
  every sitemap URL has a page, no broken internal link.
- Structured data stays truthful: Article, FAQ, Quiz, BreadcrumbList, Organization, WebSite. No fake ratings.
- Changing a published URL needs a redirect.

## Bilingual
- Every user-facing string exists in French and Arabic (`strings.mjs`, `fr`/`ar` fields). Arabic pages are
  `dir="rtl"`; check the layout in RTL after any CSS change.

## Performance and accessibility
- Small vanilla JS modules, loaded only where used (KaTeX only when a formula appears). No new framework.
- Images: WebP or AVIF, `srcset`, explicit `width`/`height`, `loading="lazy"` below the fold, alt text in both
  languages. Photos only under a free licence (CC0, public domain, CC BY, CC BY-SA, Unsplash or Pexels licence),
  each listed with author, licence and source on the credits page. No identifiable faces without a model
  release, no public figures.
- WCAG AA contrast in light and dark themes, visible focus, 24 px minimum tap targets.
- Site-only features (`src/js/engage.js`, push alerts, Android banner) never appear in the Android app build.

## Working style
- Keep commits focused, explain the why in the message. Prefer extending `scripts/lib/` helpers over copying HTML.
- Do not add backend services, databases, analytics beyond GA4, or heavy dependencies.

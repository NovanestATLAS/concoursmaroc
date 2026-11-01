/* Responsive photo with its short credit (content/photos.mjs). */
import { html } from './html.mjs';
import { PHOTOS } from '../../content/photos.mjs';

export function photo(id, lang, link, { cls = 'cover', sizes = '(min-width: 1180px) 1140px, 100vw', priority = false, decorative = false } = {}) {
  const p = PHOTOS[id];
  if (!p) return '';
  const src = (w) => link(`assets/img/photos/${id}-${w}.webp`);
  const credit = lang === 'ar' ? 'صورة' : 'Photo';
  return html`<figure class="photo ${cls}" style="--pos:${p.position}"><img src="${src(800)}" srcset="${p.widths.map((w) => `${src(w)} ${w}w`).join(', ')}" sizes="${sizes}" width="${p.width}" height="${p.height}" alt="${decorative ? '' : p[lang] || p.fr}" ${priority ? html`fetchpriority="high" ` : html`loading="lazy" `}decoding="async"><figcaption class="photo-credit" dir="ltr">${credit} : ${p.author} · ${p.license}</figcaption></figure>`;
}

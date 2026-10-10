/* SVG icon paths (24×24 viewBox), shared by the static pages. */
import { raw } from './html.mjs';

export const PATHS = {
  play: 'M8 5v14l11-7z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16m1 3h-2v6l5 3 1-1.7-4-2.3z',
  star: 'M12 2l2.5 6.5L21 9.5l-5 4.3 1.6 6.7L12 17l-5.6 3.5L8 13.8l-5-4.3 6.5-1z',
  target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12m0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  chart: 'M4 20h16v2H4zM6 10h3v8H6zm5-6h3v14h-3zm5 3h3v11h-3z',
  book: 'M6 2h11a3 3 0 0 1 3 3v16H7a3 3 0 0 1-3-3V5a3 3 0 0 1 2-2.8zM7 19h11v-3H7a1 1 0 0 0 0 3z',
  gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m9 4-2-.6a7 7 0 0 0-.6-1.5l1-1.8-1.5-1.5-1.8 1a7 7 0 0 0-1.5-.6L14 5h-2l-.6 2a7 7 0 0 0-1.5.6l-1.8-1L6.6 8.1l1 1.8a7 7 0 0 0-.6 1.5L5 12v2l2 .6a7 7 0 0 0 .6 1.5l-1 1.8 1.5 1.5 1.8-1a7 7 0 0 0 1.5.6L12 21h2l.6-2a7 7 0 0 0 1.5-.6l1.8 1 1.5-1.5-1-1.8a7 7 0 0 0 .6-1.5L21 14z',
  back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z',
  chev: 'M9 6l6 6-6 6z',
  search: 'M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2m0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  moon: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M11 1h2v3h-2zm0 19h2v3h-2zM3.5 4.9l1.4-1.4 2.1 2.1-1.4 1.4zm12.9 12.9 1.4-1.4 2.1 2.1-1.4 1.4zM1 11h3v2H1zm19 0h3v2h-3zM4.9 20.5l-1.4-1.4 2.1-2.1 1.4 1.4zM17.8 7.6l-1.4-1.4 2.1-2.1 1.4 1.4z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 5 5h-5zM8 13h8v2H8zm0 4h8v2H8z',
  shield: 'M12 2l8 3v7c0 5-3.5 8.6-8 10-4.5-1.4-8-5-8-10V5z',
  health: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
  gear2: 'M3 17h18v2H3zm2-4h3v3H5zm5-6h3v9h-3zm5 3h3v6h-3z',
  building: 'M3 21V7l9-5 9 5v14h-6v-6H9v6zm6-10h2V9H9zm4 0h2V9h-2z',
  briefcase: 'M9 3h6a2 2 0 0 1 2 2v2h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1h4V5a2 2 0 0 1 2-2m0 4h6V5H9z',
  compass: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m4 6-2.5 5.5L8 16l2.5-5.5z',
  leaf: 'M21 3S11 2 6.5 6.5C3 10 4 15 4 15l-2 2 1.4 1.4 2-2s5 1 8.5-2.5C18.5 9.5 21 3 21 3z',
  pen: 'M3 17.3V21h3.7L17.8 9.9l-3.7-3.7zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7z',
  medal: 'M7 2h10l-3 7h-4zm5 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12m0 3-1.2 2.4-2.6.4 1.9 1.8-.5 2.6 2.4-1.2 2.4 1.2-.5-2.6 1.9-1.8-2.6-.4z',
  code: 'M8.6 16.6 4 12l4.6-4.6L7.2 6 1.2 12l6 6zm6.8 0L20 12l-4.6-4.6L16.8 6l6 6-6 6z',
  wrench: 'M22.7 19 13.6 9.9a6 6 0 0 0-7.7-7.7L9.7 6 6 9.7 2.1 5.9a6 6 0 0 0 7.7 7.7l9.1 9.1a1 1 0 0 0 1.4 0l2.3-2.3a1 1 0 0 0 0-1.4z',
  calendar: 'M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1h3zm-2 8v10h14V10zm2 2h4v4H7z',
  calc: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m1 3v4h10V5zm0 7v2h2v-2zm4 0v2h2v-2zm4 0v6h2v-6zm-8 4v2h2v-2zm4 0v2h2v-2z',
  list: 'M4 5h2v2H4zm4 0h12v2H8zm-4 6h2v2H4zm4 0h12v2H8zm-4 6h2v2H4zm4 0h12v2H8z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  map: 'M15 4 9 2 3 4v18l6-2 6 2 6-2V2zm-1 15.6-4-1.3V4.4l4 1.3z',
  scales: 'M12 2 9 5H5v2h1l-3 7a4 4 0 0 0 7 0L7 7h4v13H7v2h10v-2h-4V7h4l-3 7a4 4 0 0 0 7 0l-3-7h1V5h-4z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  anchor: 'M12 2a3 3 0 0 1 1 5.8V9h3v2h-3v8.9A7 7 0 0 0 19 13h-2l3-3 3 3h-2a9 9 0 0 1-18 0H1l3-3 3 3H5a7 7 0 0 0 6 6.9V11H8V9h3V7.8A3 3 0 0 1 12 2m0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  fire: 'M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.4-2-1-3 2 1 4 3 4 6a6 6 0 1 1-12 0c0-5 5-7 6-12z',
  bulb: 'M9 21h6v-1H9zm3-19a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z',
  share: 'M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7c0 .3 0 .5.1.8L8.4 11.2a3 3 0 1 0 0 3.6l6.7 3.4A3 3 0 1 0 18 16z',
  print: 'M6 2h12v5H6zM4 8h16a2 2 0 0 1 2 2v6h-4v4H6v-4H2v-6a2 2 0 0 1 2-2m4 7v3h8v-3z',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m1 15h-2v-6h2zm0-8h-2V7h2z',
  sigma: 'M5 3h14v4h-2V5H8.4l5.2 7-5.2 7H17v-2h2v4H5v-1.6L11 12 5 4.6z',
  bolt: 'M13 2 4 14h6.5L9.5 22 20 9h-6.5z',
  flask: 'M9 2h6v2h-1v5.4l5.6 9.4A1.5 1.5 0 0 1 18.3 21H5.7a1.5 1.5 0 0 1-1.3-2.2L10 9.4V4H9z',
  phone: 'M8 1h8a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2m0 3v15h8V4z',
  arrow: 'M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z',
};

export function icon(name, cls) {
  const d = PATHS[name] || PATHS.star;
  return raw(`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"${cls ? ` class="${cls}"` : ''}><path d="${d}"/></svg>`);
}

/* Brand mark: a saffron eight-point zellij star carrying a check mark, on a
   Majorelle-to-night-blue tile (the seal of a concours passed). */
export const MARK = {
  star: 'M324 92 352 160 420 188 392 256 420 324 352 352 324 420 256 392 188 420 160 352 92 324 120 256 92 188 160 160 188 92 256 120Z',
  check: 'M178 262 232 316 340 204',
};
export function logo(size = 34) {
  return raw(`<svg viewBox="0 0 512 512" width="${size}" height="${size}" aria-hidden="true" focusable="false"><defs><linearGradient id="cm-logo-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a37b0"/><stop offset="1" stop-color="#101a3d"/></linearGradient></defs><rect width="512" height="512" rx="116" fill="url(#cm-logo-bg)"/><path fill="#f5a524" d="${MARK.star}"/><path fill="none" stroke="#101a3d" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" d="${MARK.check}"/></svg>`);
}

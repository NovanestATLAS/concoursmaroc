/* Colours and pictograms shared by the page templates (see the hue-* and
   data-group rules in src/css/concours-maroc.css). */
import { html } from './html.mjs';
import { icon } from './icons.mjs';

const HUES = ['blue', 'violet', 'rose', 'amber', 'cyan', 'terra', 'indigo', 'slate'];

/* CSS class giving a tile its colour; cycles through the palette. */
export function hue(i) { return `hue-${HUES[((i % HUES.length) + HUES.length) % HUES.length]}`; }

/* Practice subjects: [icon name or text glyph, hue]. */
const SUBJECT_ART = {
  maroc: ['map', 'terra'], culture: ['book', 'amber'], logique: ['bulb', 'violet'], calcul: ['calc', 'blue'],
  maths: ['sigma', 'indigo'], physique: ['bolt', 'amber'], chimie: ['flask', 'rose'], svt: ['leaf', 'cyan'],
  francais: ['Fr', 'blue'], arabe: ['ع', 'terra'], anglais: ['En', 'violet'], economie: ['chart', 'cyan'],
  sciences: ['gear', 'slate'], secourisme: ['health', 'rose'], architecture: ['building', 'terra'],
};

export function subjectArt(id) {
  const [pic, h] = SUBJECT_ART[id] || ['doc', 'indigo'];
  const glyph = !/^[a-z]/.test(pic) || pic.length <= 2;
  return { cls: `hue-${h}`, ico: glyph ? html`<span aria-hidden="true">${pic}</span>` : icon(pic) };
}

/* Concours Maroc — practice app: mathematical notation.
 *
 * Formulas are written in LaTeX between dollar signs in the question banks,
 * e.g. "Que vaut $\lim_{x \to 0} \frac{\sin 3x}{x}$ ?". They are drawn with
 * KaTeX (vendor/katex, loaded before this file) and read aloud in words.
 * Text without "$" is shown as plain text, so the other banks are unchanged.
 */
(function (global) {
  'use strict';

  var RE = /\$([^$]+)\$/g;

  function has(s) { return typeof s === 'string' && s.indexOf('$') !== -1; }

  /* Fills el with text in which $...$ segments are typeset; safe for any
     text (no HTML is interpreted outside KaTeX's own output). */
  function set(el, s) {
    s = s == null ? '' : String(s);
    while (el.firstChild) el.removeChild(el.firstChild);
    if (!has(s)) { el.textContent = s; return el; }
    var last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s))) {
      if (m.index > last) el.appendChild(document.createTextNode(s.slice(last, m.index)));
      var span = document.createElement('span');
      span.className = 'math';
      span.setAttribute('dir', 'ltr');
      if (global.katex) {
        try { global.katex.render(m[1], span, { throwOnError: false }); } catch (e) { span.textContent = plainTex(m[1]); }
      } else {
        span.textContent = plainTex(m[1]);
      }
      el.appendChild(span);
      last = RE.lastIndex;
    }
    if (last < s.length) el.appendChild(document.createTextNode(s.slice(last)));
    return el;
  }

  // ---------------------------------------------------------------- words
  var GREEK = { alpha: 'alpha', beta: 'bêta', gamma: 'gamma', delta: 'delta', Delta: 'delta', epsilon: 'epsilon', varepsilon: 'epsilon',
    theta: 'thêta', lambda: 'lambda', mu: 'mu', pi: 'pi', rho: 'rhô', sigma: 'sigma', Sigma: 'sigma', tau: 'tau', varphi: 'phi', phi: 'phi', omega: 'oméga', Omega: 'oméga' };
  // Structures (innermost first, repeated until nothing changes), then symbols.
  var STRUCT = [
    [/\\left|\\right|\\,|\;|\\!|\\quad|\\displaystyle/g, ' '],
    [/\\mathrm\{d\}/g, 'd'],
    [/\\(?:mathbb|mathrm|text|operatorname|mathbf|vec|overrightarrow)\{([^{}]*)\}/g, '$1'],
    [/\\lim_\{([^{}]*)\}/g, ' limite quand $1, de '],
    [/\\int_\{([^{}]*)\}\^\{([^{}]*)\}/g, ' intégrale de $1 à $2 de '],
    [/\\sum_\{([^{}]*)\}\^\{([^{}]*)\}/g, ' somme pour $1 jusqu’à $2 de '],
    [/\\prod_\{([^{}]*)\}\^\{([^{}]*)\}/g, ' produit pour $1 jusqu’à $2 de '],
    [/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, ' racine $1-ième de $2 '],
    [/\\sqrt\{([^{}]*)\}/g, ' racine carrée de $1 '],
    [/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, ' $1 sur $2 '],
    [/\^\{2\}|\^2(?![0-9])/g, ' au carré '],
    [/\^\{3\}|\^3(?![0-9])/g, ' au cube '],
    [/\^\{([^{}]*)\}/g, ' puissance $1 '],
    [/_\{([^{}]*)\}/g, ' indice $1 ']
  ];
  var SYMBOLS = [
    [/\^(\S)/g, ' puissance $1 '],
    [/_(\S)/g, ' $1 '],
    [/\\int/g, ' intégrale de '], [/\\sum/g, ' somme de '], [/\\lim/g, ' limite de '],
    [/\\ln/g, ' l n '], [/\\log/g, ' log '], [/\\exp/g, ' exponentielle '],
    [/\\arctan/g, ' arc tangente '], [/\\sin/g, ' sinus '], [/\\cos/g, ' cosinus '], [/\\tan/g, ' tangente '],
    [/\+\s*\\infty/g, ' plus l’infini '], [/-\s*\\infty/g, ' moins l’infini '], [/\\infty/g, ' l’infini '],
    [/\\longrightarrow|\\rightarrow|\\to/g, ' tend vers '],
    [/\\leqslant|\\leq|\\le/g, ' inférieur ou égal à '], [/\\geqslant|\\geq|\\ge/g, ' supérieur ou égal à '],
    [/\\neq/g, ' différent de '], [/\\approx/g, ' environ '], [/\\times|\\cdot/g, ' fois '], [/\\pm/g, ' plus ou moins '],
    [/\\Rightarrow/g, ' implique '], [/\\Leftrightarrow|\\iff/g, ' équivaut à '], [/\\in/g, ' appartient à '],
    [/\\%/g, ' pour cent '], [/\\circ/g, ' degrés '],
    [/\\([A-Za-z]+)/g, function (m, w) { return ' ' + (GREEK[w] || w) + ' '; }],
    [/</g, ' inférieur à '], [/>/g, ' supérieur à '], [/=/g, ' égale '], [/\+/g, ' plus '], [/[-−]/g, ' moins '],
    [/[{}]/g, ' '],
    [/\s+/g, ' ']
  ];
  function wordsTex(tex) {
    var s = tex, before;
    for (var pass = 0; pass < 8; pass++) {
      before = s;
      STRUCT.forEach(function (r) { s = s.replace(r[0], r[1]); });
      if (s === before) break;
    }
    SYMBOLS.forEach(function (r) { s = s.replace(r[0], r[1]); });
    return s.trim();
  }
  function plainTex(tex) {
    var s = tex.replace(/\\left|\\right|\\displaystyle|\\[,;!]/g, ' ').replace(/\\mathrm\{d\}/g, 'd'), before;
    for (var pass = 0; pass < 8; pass++) {
      before = s;
      s = s.replace(/\\(?:mathbb|mathrm|text|operatorname|mathbf)\{([^{}]*)\}/g, '$1')
        .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
        .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
        .replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/_\{([^{}]*)\}/g, '_$1');
      if (s === before) break;
    }
    return s.replace(/\\to/g, '→').replace(/\\pm/g, '±').replace(/\\infty/g, '∞').replace(/\\times|\\cdot/g, '×')
      .replace(/\\leq?/g, '≤').replace(/\\geq?/g, '≥').replace(/\\neq/g, '≠').replace(/\\int/g, '∫').replace(/\\sum/g, 'Σ')
      .replace(/\\pi/g, 'π').replace(/\\([A-Za-z]+)/g, '$1').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  }

  /* Text for speech synthesis: formulas in words (French). */
  function speech(s) {
    if (!has(s)) return s == null ? '' : String(s);
    return String(s).replace(RE, function (m, tex) { return ' ' + wordsTex(tex) + ' '; }).replace(/\s+/g, ' ').trim();
  }
  /* Readable text without KaTeX (fallback, copy, titles). */
  function plain(s) {
    if (!has(s)) return s == null ? '' : String(s);
    return String(s).replace(RE, function (m, tex) { return plainTex(tex); });
  }

  global.CM = global.CM || {};
  global.CM.math = { has: has, set: set, speech: speech, plain: plain };
})(window);

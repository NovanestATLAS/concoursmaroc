/* Tool: negative-marking QCM simulator. Expected gain of answering at
 * random among k remaining choices, the resulting strategy, and an
 * expected-grade estimator. Requires commun.js. */
(function () {
  'use strict';
  var C = window.CMT;
  var form = document.getElementById('tool-qcm');
  if (!C || !form) return;
  var out = document.getElementById('qcm-out');
  var tr = C.tr;
  var el = C.el;
  var F = {
    good: document.getElementById('q-good'),
    bad: document.getElementById('q-bad'),
    blank: document.getElementById('q-blank'),
    opts: document.getElementById('q-opts')
  };
  var EPS = 1e-9;
  var est = C.store.get('qcm-est', { n: '40', sure: '20', two: '6', blind: '4' });

  function expected(k, g, b) { return g / k + b * (k - 1) / k; }

  function decision(e, blank) {
    if (e > blank + EPS) return ['green', tr('Répondre', 'أجب')];
    if (e < blank - EPS) return ['red', tr('S’abstenir', 'امتنع')];
    return ['gold', tr('Neutre', 'محايد')];
  }

  function estimator(g, b, blank, opts) {
    var wrap = el('div', { class: 'card', style: 'margin-top:16px' });
    wrap.appendChild(el('h3', { style: 'margin-top:0', text: tr('Estimer ma note avec ce barème', 'تقدير نقطتي بهذا السلم') }));
    var fields = [
      ['n', tr('Nombre de questions', 'عدد الأسئلة')],
      ['sure', tr('Réponses dont je suis sûr(e)', 'أجوبة متأكد منها')],
      ['two', tr('Hésitations entre 2 propositions', 'تردد بين اقتراحين')],
      ['blind', tr('Questions où je n’ai aucune idée', 'أسئلة بدون أي فكرة')]
    ];
    var grid = el('div', { class: 'form-grid' });
    var inputs = {};
    fields.forEach(function (f) {
      var inp = el('input', { id: 'est-' + f[0], type: 'number', min: '0', step: '1', inputmode: 'numeric', value: est[f[0]] });
      inputs[f[0]] = inp;
      grid.appendChild(el('div', { class: 'field' }, [el('label', { for: 'est-' + f[0], text: f[1] }), inp]));
    });
    var res = el('div', { 'aria-live': 'polite' });
    function calc() {
      Object.keys(inputs).forEach(function (k) { est[k] = inputs[k].value; });
      C.store.set('qcm-est', est);
      var n = Math.max(0, Math.floor(C.num(est.n) || 0));
      var sure = Math.max(0, Math.floor(C.num(est.sure) || 0));
      var two = Math.max(0, Math.floor(C.num(est.two) || 0));
      var blind = Math.max(0, Math.floor(C.num(est.blind) || 0));
      C.clear(res);
      if (!n || sure + two + blind > n || !(g > 0)) {
        res.appendChild(el('p', { class: 'muted', text: tr('Le total des trois catégories ne doit pas dépasser le nombre de questions.', 'يجب ألا يتجاوز مجموع الفئات الثلاث عدد الأسئلة.') }));
        return;
      }
      var rest = n - sure - two - blind;
      var max = n * g;
      var e2 = Math.max(expected(2, g, b), blank);
      var eb = Math.max(expected(opts, g, b), blank);
      var best = sure * g + two * e2 + blind * eb + rest * blank;
      var allBlank = sure * g + (two + blind + rest) * blank;
      var allGuess = sure * g + two * expected(2, g, b) + blind * expected(opts, g, b) + rest * blank;
      function line(label, pts) {
        return el('li', null, [label + ' : ', el('strong', { text: C.fmt(pts, 2) + ' / ' + C.fmt(max, 2) + tr(' points', ' نقطة') + ' ≈ ' + C.fmt(Math.max(0, pts) / max * 20, 2) + '/20' })]);
      }
      res.appendChild(el('ul', { class: 'checklist' }, [
        line(tr('Meilleure stratégie (répondre seulement quand c’est rentable)', 'أفضل استراتيجية (الإجابة فقط عندما تكون مربحة)'), best),
        line(tr('Tout laisser en blanc sauf les réponses sûres', 'ترك كل شيء فارغًا باستثناء الأجوبة المؤكدة'), allBlank),
        line(tr('Tout tenter, même au hasard', 'محاولة كل الأسئلة ولو عشوائيًا'), allGuess)
      ]));
      res.appendChild(el('p', { class: 'muted', style: 'font-size:var(--fs-sm)', text: tr('Ce sont des moyennes : le hasard peut faire mieux ou moins bien. Une « réponse sûre » fausse coûte aussi des points.', 'هذه متوسطات: قد تكون النتيجة أفضل أو أسوأ بسبب الحظ، والجواب «المؤكد» الخاطئ يكلف بدوره نقطًا.') }));
    }
    grid.addEventListener('input', calc);
    wrap.appendChild(grid);
    wrap.appendChild(res);
    calc();
    return wrap;
  }

  function render() {
    var g = C.num(F.good.value), b = C.num(F.bad.value), blank = C.num(F.blank.value), opts = Math.round(C.num(F.opts.value));
    if (!isFinite(blank)) blank = 0;
    C.clear(out);
    if (!(g > 0) || !isFinite(b) || !(opts >= 2 && opts <= 6)) {
      out.appendChild(el('p', { class: 'muted', text: tr('Indiquez un barème valide : points positifs pour une bonne réponse, 2 à 6 propositions.', 'أدخل سلمًا صحيحًا: نقط موجبة للجواب الصحيح ومن 2 إلى 6 اقتراحات.') }));
      return;
    }
    if (b > 0) b = -b; // a penalty typed without the minus sign
    C.store.set('qcm', { good: F.good.value, bad: String(b), blank: F.blank.value, opts: F.opts.value });
    var tbody = el('tbody');
    var threshold = null;
    for (var k = opts; k >= 2; k--) {
      var e = expected(k, g, b);
      var d = decision(e, blank);
      if (threshold === null && e > blank + EPS) threshold = k;
      tbody.appendChild(el('tr', null, [
        el('th', { scope: 'row', text: k + (k === opts ? tr(' (aucune éliminée)', ' (بدون استبعاد)') : tr(' (' + (opts - k) + ' éliminée' + (opts - k > 1 ? 's' : '') + ')', ' (استبعاد ' + (opts - k) + ')')) }),
        el('td', { text: '1/' + k }),
        el('td', { text: C.signed(e, 3) }),
        el('td', null, [el('span', { class: 'badge ' + d[0], text: d[1] })])
      ]));
    }
    var verdict;
    if (threshold === opts) verdict = tr('Répondez toujours, même au hasard : une réponse rapporte en moyenne plus qu’une case vide.', 'أجب دائمًا ولو عشوائيًا: الجواب يربح في المتوسط أكثر من ترك السؤال فارغًا.');
    else if (threshold) verdict = tr('Répondez dès qu’il ne reste que ' + threshold + ' proposition' + (threshold > 1 ? 's' : '') + ' possibles (après avoir éliminé les autres) ; sinon, laissez la question vide.', 'أجب عندما لا يبقى إلا ' + threshold + ' اقتراحات ممكنة بعد استبعاد الباقي، وإلا فاترك السؤال فارغًا.');
    else verdict = tr('Avec ce barème, ne répondez que lorsque vous êtes sûr(e) : même entre deux propositions, répondre au hasard fait perdre des points en moyenne.', 'بهذا السلم، لا تجب إلا إذا كنت متأكدًا: حتى بين اقتراحين، تخسر الإجابة العشوائية نقطًا في المتوسط.');
    out.appendChild(el('div', { class: 'result-box' }, [
      el('div', { class: 'muted', text: tr('Stratégie conseillée', 'الاستراتيجية الموصى بها') }),
      el('p', { style: 'margin:.3em 0 0;font-weight:700', text: verdict })
    ]));
    out.appendChild(el('div', { class: 'table-wrap' }, [el('table', null, [
      el('thead', null, [el('tr', null, [
        el('th', { text: tr('Propositions restantes', 'الاقتراحات المتبقية') }),
        el('th', { text: tr('Chance d’avoir juste', 'احتمال الصواب') }),
        el('th', { text: tr('Gain moyen par réponse', 'الربح المتوسط للجواب') }),
        el('th', { text: tr('Décision', 'القرار') })
      ])]),
      tbody
    ])]));
    out.appendChild(estimator(g, b, blank, opts));
  }

  Array.prototype.forEach.call(form.querySelectorAll('[data-preset]'), function (btn) {
    btn.addEventListener('click', function () {
      var p = btn.getAttribute('data-preset').split(',');
      F.good.value = p[0]; F.bad.value = p[1]; F.blank.value = p[2]; F.opts.value = p[3];
      Array.prototype.forEach.call(form.querySelectorAll('[data-preset]'), function (o) { o.setAttribute('aria-pressed', o === btn ? 'true' : 'false'); });
      render();
    });
  });
  var saved = C.store.get('qcm', null);
  if (saved) { F.good.value = saved.good; F.bad.value = saved.bad; F.blank.value = saved.blank; F.opts.value = saved.opts; }
  form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
  form.addEventListener('input', function (e) {
    if (e.target && e.target.id && e.target.id.indexOf('est-') === 0) return;
    Array.prototype.forEach.call(form.querySelectorAll('[data-preset]'), function (o) { o.setAttribute('aria-pressed', 'false'); });
    render();
  });
  render();
})();

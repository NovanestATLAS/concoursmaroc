/* Tool: bac average, mention and pre-selection grade (75 % national +
 * 25 % regional), compared with the latest known thresholds; plus a
 * weighted-average calculator. Requires commun.js. */
(function () {
  'use strict';
  var C = window.CMT;
  var form = document.getElementById('tool-note');
  if (!C || !form) return;
  var out = document.getElementById('note-out');
  var tr = C.tr;
  var el = C.el;
  var F = {
    reg: document.getElementById('n-reg'),
    cc: document.getElementById('n-cc'),
    nat: document.getElementById('n-nat'),
    bac: document.getElementById('n-bac')
  };
  var data = null;

  var MENTIONS = [
    { min: 16, fr: 'Très bien', ar: 'حسن جدًا' },
    { min: 14, fr: 'Bien', ar: 'حسن' },
    { min: 12, fr: 'Assez bien', ar: 'مستحسن' },
    { min: 10, fr: 'Passable', ar: 'مقبول' }
  ];
  function mention(m) {
    for (var i = 0; i < MENTIONS.length; i++) if (m >= MENTIONS[i].min) return MENTIONS[i];
    return null;
  }

  function read(input) {
    var v = C.num(input.value);
    var bad = input.value !== '' && !(v >= 0 && v <= 20);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return bad ? NaN : v;
  }

  function box(label, value, sub, extra) {
    return el('div', { class: 'result-box' }, [
      el('div', { class: 'muted', text: label }),
      el('div', { class: 'big', text: value }),
      sub ? el('p', { style: 'margin:.3em 0 0', text: sub }) : null,
      extra || null
    ]);
  }

  function meter(v) {
    var cls = v >= 12 ? '' : v >= 10 ? ' warn' : ' bad';
    var m = el('div', { class: 'meter' + cls, role: 'presentation' });
    m.appendChild(el('i', { style: 'width:' + Math.max(0, Math.min(100, v * 5)) + '%' }));
    return m;
  }

  function thresholdsFor(bac) {
    if (!data || !bac) return [];
    var rows = [];
    data.concours.forEach(function (c) {
      var s = c.seuils;
      if (!s || s.formula !== '75/25' || !s.rows) return;
      s.rows.forEach(function (r) { if (r[0] === bac && typeof r[1] === 'number') rows.push({ c: c, seuil: r[1], year: s.year }); });
    });
    return rows.sort(function (a, b) { return b.seuil - a.seuil; });
  }

  function seuilTable(bac, pre) {
    var rows = thresholdsFor(bac);
    if (!rows.length) {
      return el('p', { class: 'muted', text: tr('Aucun seuil 75/25 publié dans nos fiches pour cette série. Consultez l’outil d’orientation pour les écoles accessibles.', 'لا توجد عتبات 75/25 منشورة في بطاقاتنا لهذه الشعبة. استعمل أداة التوجيه لمعرفة المدارس المتاحة.') });
    }
    var tbody = el('tbody');
    rows.forEach(function (r) {
      var gap = pre - r.seuil;
      var status = gap >= 0 ? ['green', tr('Au-dessus', 'فوق العتبة')] : gap >= -1 ? ['gold', tr('Proche', 'قريبة')] : ['red', tr('En dessous', 'تحت العتبة')];
      tbody.appendChild(el('tr', null, [
        el('th', { scope: 'row' }, [el('a', { href: C.guideHref(r.c), text: C.L(r.c.short) })]),
        el('td', { text: C.fmt(r.seuil) + ' (' + r.year + ')' }),
        el('td', { text: C.signed(gap) }),
        el('td', null, [el('span', { class: 'badge ' + status[0], text: status[1] })])
      ]));
    });
    var wrap = el('div', { class: 'table-wrap' }, [el('table', null, [
      el('thead', null, [el('tr', null, [
        el('th', { text: tr('Concours', 'المباراة') }),
        el('th', { text: tr('Dernier seuil connu', 'آخر عتبة معروفة') }),
        el('th', { text: tr('Écart', 'الفرق') }),
        el('th', { text: tr('Statut', 'الوضعية') })
      ])]),
      tbody
    ])]);
    return el('div', null, [
      el('h3', { text: tr('Comparaison avec les derniers seuils de présélection', 'مقارنة مع آخر عتبات الانتقاء') }),
      wrap,
      el('p', { class: 'muted', style: 'font-size:var(--fs-sm)', text: tr('Les seuils changent chaque année : ils indiquent une tendance, pas une garantie de convocation.', 'تتغير العتبات كل سنة: هي مؤشر وليست ضمانًا للاستدعاء.') })
    ]);
  }

  /* Before the national exam: national grade needed for each target. */
  function neededTable(reg, cc, bac) {
    var items = [];
    if (isFinite(reg) && isFinite(cc)) {
      MENTIONS.slice().reverse().forEach(function (m) {
        var need = (4 * m.min - reg - cc) / 2;
        items.push([tr('Moyenne ', 'معدل ') + C.fmt(m.min) + ' — ' + C.L(m), need]);
      });
    }
    thresholdsFor(bac).forEach(function (r) {
      items.push([tr('Présélection ', 'انتقاء ') + C.L(r.c.short) + ' (' + C.fmt(r.seuil) + ')', (r.seuil - 0.25 * reg) / 0.75]);
    });
    if (!items.length) return null;
    var ul = el('ul', { class: 'checklist' });
    items.forEach(function (it) {
      var need = it[1];
      var txt = need <= 0 ? tr('déjà atteint', 'محقق مسبقًا') : need > 20 ? tr('hors de portée (plus de 20)', 'غير ممكن (أكثر من 20)') : C.fmt(Math.ceil(need * 100) / 100) + '/20';
      ul.appendChild(el('li', null, [it[0] + ' : ', el('strong', { text: txt })]));
    });
    return el('div', { class: 'card', style: 'margin-top:14px' }, [
      el('h3', { style: 'margin-top:0', text: tr('Quelle note viser à l’examen national ?', 'ما النقطة المطلوبة في الامتحان الوطني؟') }),
      el('p', { class: 'muted', text: tr('Note nationale minimale pour chaque objectif, avec vos notes actuelles :', 'النقطة الدنيا في الوطني لكل هدف حسب نقطك الحالية:') }),
      ul
    ]);
  }

  /* The "change" event fired when a field loses focus must not rebuild the
     results under a finger that is tapping one of their links: re-render
     only when an input really changed. */
  var lastSig = null;
  function signature() { return [F.reg.value, F.cc.value, F.nat.value, F.bac.value].join('|'); }
  function update() { if (signature() !== lastSig) render(); }

  function render() {
    lastSig = signature();
    var reg = read(F.reg), cc = read(F.cc), nat = read(F.nat), bac = F.bac.value;
    C.store.set('note', { reg: F.reg.value, cc: F.cc.value, nat: F.nat.value, bac: bac });
    C.clear(out);
    if (!isFinite(reg) && !isFinite(cc) && !isFinite(nat)) {
      out.appendChild(el('p', { class: 'muted', text: tr('Saisissez au moins la note régionale et la note nationale (sur 20).', 'أدخل على الأقل نقطة الجهوي ونقطة الوطني (على 20).') }));
      return;
    }
    var grid = el('div', { class: 'grid cols-2' });
    if (isFinite(reg) && isFinite(cc) && isFinite(nat)) {
      var m = (reg + cc + 2 * nat) / 4;
      var men = mention(m);
      grid.appendChild(box(tr('Moyenne générale du bac', 'المعدل العام للبكالوريا'), C.fmt(m) + '/20',
        men ? tr('Mention : ', 'الميزة: ') + C.L(men) : tr('Moins de 10/20 : bac non obtenu à la session normale (renseignez-vous sur la session de rattrapage).', 'أقل من 10/20: لم يتم الحصول على البكالوريا في الدورة العادية (استفسر عن الدورة الاستدراكية).'),
        meter(m)));
    }
    var pre = NaN;
    if (isFinite(reg) && isFinite(nat)) {
      pre = 0.75 * nat + 0.25 * reg;
      grid.appendChild(box(tr('Note de présélection (75/25)', 'نقطة الانتقاء (75/25)'), C.fmt(pre) + '/20',
        C.fmt(0.75) + ' × ' + C.fmt(nat) + ' + ' + C.fmt(0.25) + ' × ' + C.fmt(reg) + ' = ' + C.fmt(pre), meter(pre)));
      C.store.set('preselection', { bac: bac, note: Math.round(pre * 100) / 100 });
    }
    if (grid.childNodes.length) out.appendChild(grid);

    if (isFinite(pre) && bac) out.appendChild(seuilTable(bac, pre));
    else if (isFinite(pre)) out.appendChild(el('p', { class: 'muted', text: tr('Choisissez votre série pour comparer votre note aux derniers seuils connus.', 'اختر شعبتك لمقارنة نقطتك بآخر العتبات المعروفة.') }));

    if (!isFinite(nat) && isFinite(reg)) {
      var need = neededTable(reg, cc, bac);
      if (need) out.appendChild(need);
    }

    var q = '?' + (bac ? 'bac=' + encodeURIComponent(bac) + '&' : '') + (isFinite(pre) ? 'note=' + (Math.round(pre * 100) / 100) : '');
    out.appendChild(el('div', { class: 'btn-row no-print', style: 'margin-top:14px' }, [
      el('a', { class: 'btn', href: C.ROOT + (C.AR ? 'ar/' : '') + 'outils/orientation-apres-bac/' + q.replace(/[&?]$/, ''), text: tr('Voir les écoles accessibles', 'عرض المدارس المتاحة') }),
      el('a', { class: 'btn ghost', href: C.ROOT + (C.AR ? 'ar/' : '') + 'entrainement/', text: tr('S’entraîner aux concours', 'التمرن على المباريات') })
    ]));
  }

  /* ------------------------------------------------ weighted average */
  function weighted() {
    var host = document.getElementById('wavg');
    if (!host) return;
    var rows = C.store.get('wavg', null) || [['', '', ''], ['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
    var list = el('div');
    var res = el('p', { 'aria-live': 'polite', style: 'font-weight:700' });

    function save() {
      var vals = Array.prototype.map.call(list.children, function (r) {
        return Array.prototype.map.call(r.querySelectorAll('input'), function (i) { return i.value; });
      });
      C.store.set('wavg', vals);
      return vals;
    }
    function compute() {
      var vals = save();
      var sum = 0, coefs = 0, bad = false;
      vals.forEach(function (v) {
        var n = C.num(v[1]), k = C.num(v[2]);
        if (v[1] === '' && v[2] === '') return;
        if (!(n >= 0 && n <= 20) || !(k > 0)) { bad = true; return; }
        sum += n * k; coefs += k;
      });
      C.clear(res);
      if (!coefs) { res.textContent = tr('Saisissez une note et un coefficient par ligne.', 'أدخل نقطة ومعاملًا في كل سطر.'); return; }
      var avg = sum / coefs;
      res.appendChild(document.createTextNode(tr('Moyenne pondérée : ', 'المعدل الموزون: ') + C.fmt(avg) + '/20 (' + tr('total des coefficients : ', 'مجموع المعاملات: ') + C.fmt(coefs) + ')'));
      if (bad) res.appendChild(el('span', { class: 'badge red', style: 'margin-inline-start:8px', text: tr('ligne incomplète ignorée', 'تم تجاهل سطر ناقص') }));
      res.appendChild(document.createTextNode(' '));
      res.appendChild(el('button', { class: 'btn sm ghost', type: 'button', text: tr('Utiliser comme note nationale', 'استعمالها كنقطة الوطني'),
        onclick: function () { F.nat.value = String(Math.round(avg * 100) / 100); render(); F.nat.focus(); } }));
    }
    function addRow(v) {
      v = v || ['', '', ''];
      var row = el('div', { class: 'wavg-row' }, [
        el('input', { type: 'text', value: v[0], placeholder: tr('Matière', 'المادة'), 'aria-label': tr('Matière', 'المادة') }),
        el('input', { type: 'number', inputmode: 'decimal', min: '0', max: '20', step: '0.01', value: v[1], placeholder: tr('Note', 'النقطة'), 'aria-label': tr('Note sur 20', 'النقطة على 20') }),
        el('input', { type: 'number', inputmode: 'decimal', min: '0', step: '0.5', value: v[2], placeholder: tr('Coef.', 'المعامل'), 'aria-label': tr('Coefficient', 'المعامل') }),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': tr('Supprimer la ligne', 'حذف السطر'), text: '×', onclick: function () { row.remove(); compute(); } })
      ]);
      row.addEventListener('input', compute);
      list.appendChild(row);
    }
    rows.forEach(addRow);
    host.appendChild(list);
    host.appendChild(el('div', { class: 'btn-row', style: 'margin-top:8px' }, [
      el('button', { class: 'btn sm', type: 'button', text: tr('+ Ajouter une matière', '+ إضافة مادة'), onclick: function () { addRow(); compute(); } }),
      el('button', { class: 'btn sm ghost', type: 'button', text: tr('Tout effacer', 'مسح الكل'), onclick: function () { C.clear(list); for (var i = 0; i < 5; i++) addRow(); compute(); } })
    ]));
    host.appendChild(res);
    compute();
  }

  // Restore previous inputs.
  var saved = C.store.get('note', null);
  if (saved) {
    F.reg.value = saved.reg || '';
    F.cc.value = saved.cc || '';
    F.nat.value = saved.nat || '';
    if (saved.bac) F.bac.value = saved.bac;
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  weighted();
  render();
  C.data('outils').then(function (d) { data = d; render(); }).catch(function (err) { if (window.console) console.error(err); });
})();

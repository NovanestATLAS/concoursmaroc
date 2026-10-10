/* Tool: which concours and schools are open to me? Filters every guide by
 * bac series, compares the pre-selection grade with the latest known
 * threshold and checks the age limit at the reference date of the next
 * session. Requires commun.js and data/outils.json. */
(function () {
  'use strict';
  var C = window.CMT;
  var form = document.getElementById('tool-orient');
  if (!C || !form) return;
  var out = document.getElementById('orient-out');
  var tr = C.tr;
  var el = C.el;
  var F = {
    bac: document.getElementById('o-bac'),
    note: document.getElementById('o-note'),
    birth: document.getElementById('o-birth'),
    group: document.getElementById('o-group')
  };
  var data = null;

  var RANK = { above: 0, close: 1, nobac: 2, info: 2, open: 3, below: 4 };

  function groupLabel(id) {
    var g = (data.groups || []).filter(function (x) { return x.id === id; })[0];
    return g ? C.L(g) : '';
  }

  function upcoming(c, type) {
    var today = C.today();
    return data.calendar.filter(function (e) {
      return e.concours === c.id && e.date && e.date >= today && e.confidence !== 'estimation' && (!type || e.type === type);
    }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0] || null;
  }

  /* Reference date of the age limit for the next session of a concours. */
  function refDate(c) {
    var a = c.age;
    if (!a || !a.ref) return null;
    if (a.ref === 'exam') {
      var ev = upcoming(c, 'ecrit');
      if (ev) return C.parseDate(ev.start || ev.date);
      var month = C.today().slice(0, 7);
      var est = data.calendar.filter(function (e) { return e.concours === c.id && e.month && e.month >= month; })
        .sort(function (x, y) { return x.month.localeCompare(y.month); })[0];
      return C.parseDate(est ? est.month + '-15' : data.nextSession + '-07-15');
    }
    var m = /^(\d\d)-(\d\d)(\+1)?$/.exec(a.ref);
    if (!m) return null;
    var next = upcoming(c, null);
    var year = (next ? Number(next.date.slice(0, 4)) : Number(data.nextSession)) + (m[3] ? 1 : 0);
    return new Date(year, Number(m[1]) - 1, Number(m[2]));
  }

  function ageBadge(c, birth) {
    if (!c.age) return null;
    var limits = (c.age.min ? c.age.min + ' – ' : tr('max. ', 'حد أقصى ')) + (c.age.max || '') + tr(' ans', ' سنة');
    if (!birth) return { cls: '', text: tr('Âge : ', 'السن: ') + limits };
    var at = refDate(c);
    if (!at) return { cls: '', text: tr('Âge : ', 'السن: ') + limits };
    var age = C.ageAt(birth, at);
    var when = C.dateLabel(at, { day: 'numeric', month: 'short', year: 'numeric' });
    if (c.age.min && age < c.age.min) return { cls: 'red', bad: true, text: tr('Trop jeune : ', 'سن غير كافٍ: ') + age + tr(' ans au ', ' سنة في ') + when + ' (min. ' + c.age.min + ')' };
    if (c.age.max && age > c.age.max) return { cls: 'red', bad: true, text: tr('Limite d’âge dépassée : ', 'تجاوز السن الأقصى: ') + age + tr(' ans au ', ' سنة في ') + when + ' (max. ' + c.age.max + ')' };
    return { cls: 'green', text: tr('Âge compatible : ', 'السن مناسب: ') + age + tr(' ans au ', ' سنة في ') + when };
  }

  function selection(c, bac, note) {
    if (c.noBac && bac === 'NONE') return { kind: 'nobac', cls: 'green', text: tr('Bac non exigé', 'البكالوريا غير مشترطة') };
    var s = c.seuils;
    if (!s) return { kind: 'open', cls: '', text: c.noBac ? tr('Bac non exigé (accessible aussi aux bacheliers)', 'البكالوريا غير مشترطة (متاح أيضًا للحاصلين عليها)') : tr('Sans seuil publié : concours, dossier ou inscription', 'بدون عتبة منشورة: مباراة أو ملف أو تسجيل') };
    if (s.formula === 'mention') return { kind: 'info', cls: 'blue', text: tr('Mention « Assez bien » exigée (moyenne générale ≥ 12)', 'ميزة «مستحسن» مطلوبة (معدل عام ≥ 12)') };
    if (s.formula !== '75/25') return { kind: 'info', cls: 'blue', text: tr('Sélection sur dossier ou classement', 'انتقاء بالملف أو بالترتيب') };
    var row = (s.rows || []).filter(function (r) { return r[0] === bac && typeof r[1] === 'number'; })[0];
    if (!row) return { kind: 'info', cls: 'blue', text: tr('Présélection 75/25 — seuil non publié pour votre série', 'انتقاء 75/25 — عتبة غير منشورة لشعبتك') };
    var seuil = row[1];
    var label = C.fmt(seuil) + ' (' + s.year + ')';
    if (!isFinite(note)) return { kind: 'info', cls: '', text: tr('Dernier seuil connu : ', 'آخر عتبة معروفة: ') + label };
    var gap = note - seuil;
    if (gap >= 0) return { kind: 'above', cls: 'green', text: tr('Au-dessus du dernier seuil : ', 'فوق آخر عتبة: ') + label };
    if (gap >= -1) return { kind: 'close', cls: 'gold', text: tr('Proche du seuil : ', 'قريبة من العتبة: ') + label + ' (' + C.signed(gap) + ')' };
    return { kind: 'below', cls: 'red', text: tr('Sous le dernier seuil : ', 'تحت آخر عتبة: ') + label + ' (' + C.signed(gap) + ')' };
  }

  function card(c, sel, age) {
    var badges = el('div', { class: 'card-meta' }, [
      el('span', { class: 'badge', text: groupLabel(c.group) }),
      sel ? el('span', { class: 'badge ' + sel.cls, text: sel.text }) : null,
      age ? el('span', { class: 'badge ' + age.cls, text: age.text }) : null
    ]);
    var links = el('div', { class: 'btn-row', style: 'margin-top:10px' }, [
      el('a', { class: 'btn sm', href: C.guideHref(c), text: tr('Lire la fiche', 'قراءة البطاقة') }),
      c.practice ? el('a', { class: 'btn sm ghost', href: C.practiceHref(c.id), text: tr('S’entraîner', 'التمرن') }) : null
    ]);
    return el('div', { class: 'card orient-card' + (((sel && sel.kind === 'below') || (age && age.bad)) ? ' dim' : '') }, [
      el('a', { class: 'card-title', href: C.guideHref(c), text: C.L(c.name) }),
      badges,
      links
    ]);
  }

  /* Same guard as the grade calculator: a blur "change" must not rebuild
     the cards while one of their links is being tapped. */
  var lastSig = null;
  function signature() { return [F.bac.value, F.note.value, F.birth.value, F.group.value].join('|'); }
  function update() { if (signature() !== lastSig) render(); }

  function render() {
    if (!data) return;
    lastSig = signature();
    var bac = F.bac.value;
    var note = C.num(F.note.value);
    if (F.note.value !== '' && !(note >= 0 && note <= 20)) { note = NaN; F.note.setAttribute('aria-invalid', 'true'); } else F.note.setAttribute('aria-invalid', 'false');
    var noteField = F.note.closest ? F.note.closest('.field') : null;
    if (noteField) noteField.hidden = bac === 'NONE';
    var birth = F.birth.value || '';
    var group = F.group.value;
    C.store.set('orient', { bac: bac, note: F.note.value, birth: birth, group: group });
    C.clear(out);
    if (!bac) {
      out.appendChild(el('p', { class: 'muted', text: tr('Choisissez votre série pour afficher les résultats.', 'اختر شعبتك لعرض النتائج.') }));
      return;
    }
    var open = [], later = [], closed = [], check = [];
    data.concours.forEach(function (c) {
      if (group && c.group !== group) return;
      if (c.level === 'bac2' || c.level === 'bac3') { later.push(c); return; }
      if (bac === 'NONE') { if (c.noBac) open.push(c); else closed.push(c); return; }
      if (c.noBac || (c.bac && c.bac.indexOf(bac) !== -1)) open.push(c);
      else if (!c.bac || !c.bac.length) check.push(c);
      else closed.push(c);
    });
    var items = open.map(function (c) { return { c: c, sel: selection(c, bac, note), age: ageBadge(c, birth) }; });
    items.sort(function (a, b) {
      var ra = (a.age && a.age.bad ? 10 : 0) + RANK[a.sel.kind], rb = (b.age && b.age.bad ? 10 : 0) + RANK[b.sel.kind];
      return ra - rb;
    });
    var above = items.filter(function (i) { return i.sel.kind === 'above'; }).length;
    var summary = items.length + tr(' concours et formations accessibles', ' مباراة ومسارًا متاحًا') +
      (bac === 'NONE' ? tr(' sans le bac', ' بدون بكالوريا') : tr(' avec votre série', ' بشعبتك')) +
      (isFinite(note) && bac !== 'NONE' ? tr(', dont ', '، منها ') + above + tr(' où votre note dépasse le dernier seuil connu.', ' تتجاوز فيها نقطتك آخر عتبة معروفة.') : '.');
    out.appendChild(el('p', { class: 'result-line', text: summary }));
    var list = el('div', { class: 'grid cols-2 orient-list' });
    items.forEach(function (i) { list.appendChild(card(i.c, i.sel, i.age)); });
    out.appendChild(list);

    if (check.length) {
      out.appendChild(el('h3', { text: tr('Conditions de série à vérifier', 'شروط الشعبة للتحقق') }));
      var l2 = el('div', { class: 'grid cols-2 orient-list' });
      check.forEach(function (c) { l2.appendChild(card(c, { kind: 'info', cls: 'blue', text: tr('Séries acceptées : voir la fiche', 'الشعب المقبولة: انظر البطاقة') }, ageBadge(c, birth))); });
      out.appendChild(l2);
    }
    if (bac === 'NONE') {
      out.appendChild(el('div', { class: 'callout info' }, [
        tr('Sans le bac, vous pouvez aussi le repasser en candidat libre. Lisez notre guide ', 'بدون بكالوريا يمكنك أيضًا اجتيازها كمترشح حر. اقرأ دليل '),
        el('a', { href: C.ROOT + (C.AR ? 'ar/' : '') + 'guides/concours-sans-bac-niveau-bac/', text: tr('concours sans le bac', 'المباريات بدون بكالوريا') }),
        '.'
      ]));
    }
    if (later.length) {
      var d = el('details', { class: 'card', style: 'margin-top:16px' }, [el('summary', null, [el('strong', { text: tr('Plus tard : concours après bac+2 ou bac+3 (', 'لاحقًا: مباريات بعد باك+2 أو باك+3 (') + later.length + ')' })])]);
      var ul = el('ul');
      later.forEach(function (c) { ul.appendChild(el('li', null, [el('a', { href: C.guideHref(c), text: C.L(c.name) })])); });
      d.appendChild(ul);
      out.appendChild(d);
    }
    if (closed.length && bac !== 'NONE') {
      var d2 = el('details', { class: 'card', style: 'margin-top:12px' }, [el('summary', null, [el('strong', { text: tr('Non accessibles avec votre série (', 'غير متاحة لشعبتك (') + closed.length + ')' })])]);
      var ul2 = el('ul');
      closed.forEach(function (c) { ul2.appendChild(el('li', null, [el('a', { href: C.guideHref(c), text: C.L(c.name) })])); });
      d2.appendChild(ul2);
      out.appendChild(d2);
    }
  }

  // Prefill: URL (?bac=SM&note=14.2) > last visit > grade calculator.
  var saved = C.store.get('orient', null) || {};
  var pre = C.store.get('preselection', null) || {};
  var qb = C.param('bac'), qn = C.param('note');
  F.bac.value = qb || saved.bac || pre.bac || '';
  F.note.value = qn || saved.note || (pre.note !== undefined ? String(pre.note) : '');
  F.birth.value = saved.birth || '';
  F.group.value = saved.group || '';

  form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  C.data('outils').then(function (d) { data = d; render(); }).catch(function (err) { C.fail(out, err); });
})();

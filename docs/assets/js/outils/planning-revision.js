/* Tool: week-by-week revision plan until the exam date. Time is split by
 * the weight of each subject in the concours (mock exam sections) and by
 * the level the candidate declares; three phases (basics, timed practice,
 * mock exams). Requires commun.js, data/concours.json and data/outils.json. */
(function () {
  'use strict';
  var C = window.CMT;
  var form = document.getElementById('tool-plan');
  if (!C || !form) return;
  var out = document.getElementById('plan-out');
  var levelsHost = document.getElementById('p-levels');
  var tr = C.tr;
  var el = C.el;
  var F = {
    concours: document.getElementById('p-concours'),
    date: document.getElementById('p-date'),
    hours: document.getElementById('p-hours'),
    days: document.getElementById('p-days')
  };
  var practice = null;
  var tools = null;
  var dateHint = null;
  var dateTouched = false;

  var LEVELS = [
    { id: 'weak', factor: 2, fr: 'À renforcer', ar: 'ضعيف' },
    { id: 'avg', factor: 1.4, fr: 'Moyen', ar: 'متوسط' },
    { id: 'good', factor: 1, fr: 'Bon', ar: 'جيد' }
  ];
  var PHASES = {
    base: { cls: 'blue', fr: 'Bases', ar: 'الأساسيات',
      tasks: [['Revoir les cours et les fiches des chapitres les plus fréquents', 'مراجعة الدروس والملخصات للمحاور الأكثر تكرارًا'],
        ['20 QCM par matière en mode entraînement, sans chronomètre', '20 سؤالًا لكل مادة في وضع التمرين بدون توقيت'],
        ['Noter ses erreurs : elles reviennent 1, 3 puis 7 jours plus tard', 'تسجيل الأخطاء: تعود بعد 1 و3 ثم 7 أيام']] },
    train: { cls: 'gold', fr: 'Entraînement intensif', ar: 'تمرين مكثف',
      tasks: [['Séries chronométrées de 20 à 30 QCM', 'سلاسل موقتة من 20 إلى 30 سؤالًا'],
        ['Deux sessions « points faibles » par semaine', 'حصتان أسبوعيًا لنقط الضعف'],
        ['Le défi du jour, chaque jour (10 questions)', 'تحدي اليوم يوميًا (10 أسئلة)']] },
    mock: { cls: 'green', fr: 'Examens blancs', ar: 'امتحانات تجريبية',
      tasks: [['Un à deux examens blancs chronométrés au barème du concours', 'امتحان تجريبي أو اثنان موقتان بسلم تنقيط المباراة'],
        ['Analyser ses erreurs et ses réponses au hasard (points négatifs)', 'تحليل الأخطاء والإجابات العشوائية (التنقيط السلبي)'],
        ['Revoir ses fiches et la liste de ses erreurs', 'مراجعة الملخصات ولائحة الأخطاء']] }
  };

  function concoursById(id) { return practice.concours.filter(function (c) { return c.id === id; })[0] || null; }
  function subjectLabel(id) {
    var s = practice.subjects.filter(function (x) { return x.id === id; })[0];
    return s ? C.L(s.short) : id;
  }

  /* Subjects of the concours with their weight in the written exam. */
  function subjectShares(c) {
    var subjects = c.subjects.slice();
    var shares = {};
    if (c.mock && c.mock.sections && c.mock.sections.length) {
      var total = c.mock.sections.reduce(function (a, s) { return a + s.count; }, 0);
      c.mock.sections.forEach(function (s) {
        s.subjects.forEach(function (id) {
          if (subjects.indexOf(id) === -1) subjects.push(id);
          shares[id] = (shares[id] || 0) + s.count / total / s.subjects.length;
        });
      });
      var avg = 1 / subjects.length;
      subjects.forEach(function (id) { if (!shares[id]) shares[id] = avg / 2; });
    } else {
      subjects.forEach(function (id) { shares[id] = 1 / subjects.length; });
    }
    return subjects.map(function (id) { return { id: id, share: shares[id] }; });
  }

  function suggestedDate(id) {
    var today = C.today();
    var cal = tools.calendar.filter(function (e) { return e.concours === id; });
    var ev = cal.filter(function (e) { return e.type === 'ecrit' && e.date && (e.start || e.date) >= today; })
      .sort(function (a, b) { return (a.start || a.date).localeCompare(b.start || b.date); })[0];
    if (ev) return { date: ev.start || ev.date, est: false };
    var month = today.slice(0, 7);
    var est = cal.filter(function (e) { return e.month && e.month >= month && (e.type === 'ecrit' || e.type === 'inscription'); })
      .sort(function (a, b) { return a.month.localeCompare(b.month); });
    var pick = est.filter(function (e) { return e.type === 'ecrit'; })[0] || est[0];
    if (pick) return { date: pick.month + (pick.type === 'ecrit' ? '-15' : '-28'), est: true };
    return null;
  }

  function renderLevels() {
    var c = concoursById(F.concours.value);
    C.clear(levelsHost);
    if (!c) return;
    var saved = (C.store.get('plan-levels', {}) || {})[c.id] || {};
    var grid = el('div', { class: 'form-grid' });
    subjectShares(c).forEach(function (s) {
      var sel = el('select', { id: 'lvl-' + s.id, 'data-subject': s.id });
      LEVELS.forEach(function (l) { sel.appendChild(el('option', { value: l.id, text: C.L(l) })); });
      sel.value = saved[s.id] || 'avg';
      grid.appendChild(el('div', { class: 'field' }, [el('label', { for: 'lvl-' + s.id, text: tr('Niveau en ', 'المستوى في ') + subjectLabel(s.id) }), sel]));
    });
    levelsHost.appendChild(el('p', { class: 'label', style: 'font-weight:700;margin:4px 0 8px', text: tr('Votre niveau par matière', 'مستواك في كل مادة') }));
    levelsHost.appendChild(grid);
  }

  function updateDate(force) {
    var c = concoursById(F.concours.value);
    if (!c) return;
    var s = suggestedDate(c.id);
    if (!dateHint) {
      dateHint = el('small');
      F.date.parentNode.appendChild(dateHint);
    }
    if (s && (force || !F.date.value)) {
      F.date.value = s.date;
      dateHint.textContent = s.est ? tr('Date indicative : période habituelle du concours (à confirmer par l’avis).', 'تاريخ تقريبي: الفترة المعتادة للمباراة (يؤكده الإعلان).') : tr('Date annoncée pour la prochaine épreuve.', 'التاريخ المعلن للاختبار المقبل.');
    } else if (!s && force) {
      dateHint.textContent = tr('Aucune date connue : indiquez la date de votre épreuve.', 'لا يوجد تاريخ معروف: أدخل تاريخ اختبارك.');
    }
  }

  function levelsOf(c) {
    var map = {};
    Array.prototype.forEach.call(levelsHost.querySelectorAll('select[data-subject]'), function (s) { map[s.getAttribute('data-subject')] = s.value; });
    var all = C.store.get('plan-levels', {}) || {};
    all[c.id] = map;
    C.store.set('plan-levels', all);
    return map;
  }

  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function shortDate(d) { return C.dateLabel(d, { day: 'numeric', month: 'short' }); }
  function half(x) { return Math.round(x * 2) / 2; }

  function generate() {
    var c = concoursById(F.concours.value);
    C.clear(out);
    if (!c) return;
    var hours = C.num(F.hours.value), perWeek = C.num(F.days.value);
    if (!(hours > 0)) hours = 2;
    if (!(perWeek >= 1 && perWeek <= 7)) perWeek = 6;
    var today = C.parseDate(C.today());
    var end = F.date.value ? C.parseDate(F.date.value) : addDays(today, 56);
    var totalDays = Math.round((end - today) / 86400000);
    C.store.set('plan', { concours: c.id, date: F.date.value, hours: F.hours.value, days: F.days.value });
    if (totalDays < 3) {
      out.appendChild(el('div', { class: 'callout warn', text: tr('Choisissez une date d’épreuve au moins 3 jours après aujourd’hui.', 'اختر تاريخ اختبار بعد 3 أيام على الأقل من اليوم.') }));
      return;
    }
    var levels = levelsOf(c);
    var weights = subjectShares(c).map(function (s) {
      var l = LEVELS.filter(function (x) { return x.id === (levels[s.id] || 'avg'); })[0];
      return { id: s.id, w: s.share * l.factor };
    });
    var sum = weights.reduce(function (a, s) { return a + s.w; }, 0);
    weights.forEach(function (s) { s.w = s.w / sum; });
    weights.sort(function (a, b) { return b.w - a.w; });

    var weeks = Math.ceil(totalDays / 7);
    var pMock = weeks >= 3 ? Math.max(1, Math.round(weeks * 0.2)) : 1;
    var pBase = weeks >= 3 ? Math.max(1, Math.round(weeks * 0.4)) : 0;
    var pTrain = Math.max(0, weeks - pMock - pBase);
    if (weeks >= 3 && pTrain < 1) { pTrain = 1; pBase = weeks - pTrain - pMock; }
    var totalHours = 0;

    var list = el('div', { class: 'plan-weeks' });
    for (var i = 0; i < weeks; i++) {
      var from = addDays(today, i * 7);
      var to = addDays(today, Math.min(i * 7 + 6, totalDays));
      var daysThisWeek = Math.min(7, totalDays - i * 7 + 1);
      var weekHours = hours * perWeek * Math.min(1, daysThisWeek / 7);
      var phase = i < pBase ? 'base' : i < pBase + pTrain ? 'train' : 'mock';
      var P = PHASES[phase];
      var chips = el('div', { class: 'chips' });
      weights.forEach(function (s) {
        var h = half(weekHours * s.w);
        if (h >= 0.5) chips.appendChild(el('span', { class: 'chip', text: subjectLabel(s.id) + ' · ' + C.fmt(h, 1) + ' h' }));
      });
      totalHours += weekHours;
      var tasks = el('ul', { class: 'checklist' });
      P.tasks.forEach(function (t) { tasks.appendChild(el('li', { text: C.tr(t[0], t[1]) })); });
      if (i === weeks - 1) tasks.appendChild(el('li', null, [el('strong', { text: tr('Dernière ligne droite : ', 'المرحلة الأخيرة: ') }), tr('alléger le rythme, dormir suffisamment, préparer convocation, CNIE et matériel.', 'خفف الإيقاع، ونم جيدًا، وحضّر الاستدعاء والبطاقة الوطنية والأدوات.')]));
      var link = phase === 'mock'
        ? el('a', { class: 'btn sm no-print', href: C.practiceHref(c.id) + '#/mock', text: tr('Lancer un examen blanc', 'بدء امتحان تجريبي') })
        : el('a', { class: 'btn sm ghost no-print', href: C.practiceHref(c.id), text: tr('Ouvrir l’entraînement', 'فتح التمرين') });
      list.appendChild(el('section', { class: 'card plan-week' }, [
        el('div', { class: 'plan-head' }, [
          el('strong', { text: tr('Semaine ', 'الأسبوع ') + (i + 1) }),
          el('span', { class: 'muted', text: shortDate(from) + ' → ' + shortDate(to) }),
          el('span', { class: 'badge ' + P.cls, text: C.L(P) }),
          el('span', { class: 'muted', text: '≈ ' + C.fmt(half(weekHours), 1) + ' h' })
        ]),
        chips,
        tasks,
        link
      ]));
    }

    var bars = el('div', { class: 'plan-bars' });
    weights.forEach(function (s) {
      var m = el('div', { class: 'meter' });
      m.appendChild(el('i', { style: 'width:' + Math.round(s.w * 100) + '%' }));
      bars.appendChild(el('div', null, [el('div', { class: 'plan-bar-label' }, [el('span', { text: subjectLabel(s.id) }), el('span', { text: Math.round(s.w * 100) + ' %' })]), m]));
    });
    out.appendChild(el('div', { class: 'result-box' }, [
      el('div', { class: 'muted', text: C.L(c.short) + ' · ' + C.dateLabel(end) }),
      el('div', { class: 'big', text: weeks + tr(' semaines', ' أسابيع') }),
      el('p', { style: 'margin:.3em 0 .8em', text: '≈ ' + Math.round(totalHours) + tr(' heures de révision au total, réparties ainsi :', ' ساعة من المراجعة في المجموع، موزعة كالتالي:') }),
      bars
    ]));
    out.appendChild(list);
  }

  Promise.all([C.data('concours'), C.data('outils')]).then(function (res) {
    practice = res[0];
    tools = res[1];
    var saved = C.store.get('plan', null);
    var wanted = C.param('concours');
    if (wanted && concoursById(wanted)) F.concours.value = wanted;
    else if (saved && concoursById(saved.concours)) F.concours.value = saved.concours;
    if (saved && saved.concours === F.concours.value) {
      if (saved.date) F.date.value = saved.date;
      if (saved.hours) F.hours.value = saved.hours;
      if (saved.days) F.days.value = saved.days;
    }
    renderLevels();
    updateDate(false);
    if (saved && saved.concours === F.concours.value) generate();
  }).catch(function (err) { C.fail(out, err); });

  F.concours.addEventListener('change', function () { renderLevels(); updateDate(!dateTouched); C.clear(out); });
  F.date.addEventListener('input', function () { dateTouched = true; if (dateHint) dateHint.textContent = ''; });
  form.addEventListener('submit', function (e) { e.preventDefault(); generate(); });
})();

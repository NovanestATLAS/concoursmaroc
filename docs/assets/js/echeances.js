/* Deadlines widget: hides past dates, shows a live countdown and offers
 * .ics calendar downloads. Shared by the home page and the calendar tool. */
(function () {
  'use strict';
  var LANG = document.documentElement.getAttribute('data-lang') || 'fr';
  var T = LANG === 'ar'
    ? { today: 'اليوم', tomorrow: 'غدًا', inDays: 'بعد {n} يومًا', ongoing: 'جارٍ حتى {d}', past: 'انتهى', est: 'تقدير', add: 'أضف إلى المفكرة' }
    : { today: "Aujourd'hui", tomorrow: 'Demain', inDays: 'Dans {n} jours', ongoing: "En cours jusqu'au {d}", past: 'Passé', est: 'Estimation', add: 'Ajouter à mon agenda' };

  /* Arabic number agreement: 2 -> dual, 3 to 10 -> plural, otherwise singular accusative. */
  function inDays(n) {
    if (LANG === 'ar') return n === 2 ? 'بعد يومين' : n <= 10 ? 'بعد ' + n + ' أيام' : 'بعد ' + n + ' يومًا';
    return T.inDays.replace('{n}', n);
  }
  function parse(d) { var p = d.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2] || 1); }
  function daysUntil(d) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((parse(d) - now) / 86400000);
  }
  function fmt(d) {
    try { return parse(d).toLocaleDateString(LANG === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long' }); } catch (e) { return d; }
  }
  function icsEscape(s) { return String(s).replace(/[\\,;]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); }
  function icsDate(d) { return d.replace(/-/g, ''); }
  function nextDay(d) { var x = parse(d); x.setDate(x.getDate() + 1); return x.getFullYear() + ('0' + (x.getMonth() + 1)).slice(-2) + ('0' + x.getDate()).slice(-2); }
  function vevent(li) {
    var date = li.getAttribute('data-date');
    var month = li.getAttribute('data-month');
    var title = (li.querySelector('.d-main a, .d-main strong') || {}).textContent || 'Concours';
    var link = li.querySelector('.d-main a');
    var day = date || (month ? month + '-01' : null);
    if (!day) return '';
    return ['BEGIN:VEVENT',
      'UID:' + li.getAttribute('data-id') + '@concoursmaroc',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
      'DTSTART;VALUE=DATE:' + icsDate(day),
      'DTEND;VALUE=DATE:' + nextDay(day),
      'SUMMARY:' + icsEscape((month && !date ? '(' + T.est + ') ' : '') + title),
      link ? 'URL:' + link.href : '',
      'DESCRIPTION:' + icsEscape((LANG === 'ar' ? 'تحقق من الإعلان الرسمي. ' : "Vérifiez l'avis officiel. ") + (link ? link.href : '')),
      'BEGIN:VALARM', 'TRIGGER:-P3D', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(title), 'END:VALARM',
      'END:VEVENT'].filter(Boolean).join('\r\n');
  }
  function download(name, events) {
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Concours Maroc//Calendrier//FR', 'CALSCALE:GREGORIAN'].concat(events).concat(['END:VCALENDAR']).join('\r\n');
    var blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-deadlines]')).forEach(function (list) {
    var limit = parseInt(list.getAttribute('data-limit') || '0', 10);
    var withIcs = list.hasAttribute('data-ics');
    var shown = 0;
    Array.prototype.slice.call(list.children).forEach(function (li) {
      var date = li.getAttribute('data-date');
      var start = li.getAttribute('data-start');
      var left = li.querySelector('[data-left]');
      if (date) {
        var n = daysUntil(date);
        var started = start ? daysUntil(start) <= 0 : true;
        if (n < 0) {
          if (limit) { li.hidden = true; return; }
          li.classList.add('past');
          if (left) left.textContent = T.past;
        } else if (left) {
          left.textContent = start && started && n > 0 ? T.ongoing.replace('{d}', fmt(date)) : n === 0 ? T.today : n === 1 ? T.tomorrow : inDays(n);
          if (n <= 7) li.classList.add('soon');
        }
      } else if (left) {
        left.textContent = T.est;
      }
      if (limit && shown >= limit) { li.hidden = true; return; }
      shown++;
      if (withIcs && !li.classList.contains('past')) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn sm quiet no-print';
        b.textContent = T.add;
        b.style.marginTop = '6px';
        b.addEventListener('click', function () { download(li.getAttribute('data-id') + '.ics', [vevent(li)]); });
        li.querySelector('.d-main').appendChild(b);
      }
    });
  });

  var all = document.getElementById('ics-all');
  if (all) {
    all.addEventListener('click', function () {
      var events = Array.prototype.slice.call(document.querySelectorAll('[data-deadlines] > li:not(.past)')).map(vevent).filter(Boolean);
      download('concours-maroc-calendrier.ics', events);
    });
  }
})();

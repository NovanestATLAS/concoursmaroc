/* Tool: application-file checklist. The list adapts to the concours
 * (military, security, health, architecture, no-bac, bac+2/+3 tracks);
 * ticks are saved per concours on the device. Requires commun.js and
 * data/outils.json. Exact documents are always set by the official notice. */
(function () {
  'use strict';
  var C = window.CMT;
  var host = document.getElementById('tool-check');
  if (!C || !host) return;
  var out = document.getElementById('check-out');
  var select = document.getElementById('c-concours');
  var reset = document.getElementById('c-reset');
  var tr = C.tr;
  var el = C.el;
  var data = null;

  function I(id, fr, ar) { return { id: id, fr: fr, ar: ar }; }

  var BASE = [
    I('cnie', 'CNIE (carte nationale d’identité électronique) en cours de validité — scan recto verso', 'البطاقة الوطنية للتعريف الإلكترونية سارية المفعول — نسخة من الوجهين'),
    I('massar', 'Code Massar et mot de passe (pour les plateformes en ligne)', 'رمز مسار وكلمة المرور (للمنصات الإلكترونية)'),
    I('photos', 'Photos d’identité récentes (fichier numérique et quelques tirages)', 'صور شمسية حديثة (نسخة رقمية وبعض النسخ الورقية)'),
    I('contact', 'Adresse e-mail personnelle et numéro de téléphone actifs', 'بريد إلكتروني شخصي ورقم هاتف مفعّلان'),
    I('recu', 'Reçu ou numéro de préinscription imprimé et conservé', 'وصل أو رقم التسجيل القبلي مطبوعًا ومحفوظًا')
  ];
  var BAC_DOCS = [
    I('releve-reg', 'Relevé de notes de l’examen régional (1re année bac)', 'بيان نقط الامتحان الجهوي (الأولى باك)'),
    I('releve-nat', 'Relevé de notes du baccalauréat (examen national et moyenne générale)', 'بيان نقط البكالوريا (الامتحان الوطني والمعدل العام)')
  ];
  var NO_BAC = [
    I('niveau', 'Dernier bulletin ou attestation du niveau scolaire exigé (ou diplôme de qualification)', 'آخر بيان نقط أو شهادة المستوى الدراسي المطلوب (أو دبلوم التأهيل)')
  ];
  var HIGHER = [
    I('releves-sup', 'Relevés de notes et attestations des études supérieures (CPGE, licence…)', 'كشوف النقط وشهادات الدراسات العليا (الأقسام التحضيرية، الإجازة…)'),
    I('diplomes', 'Copies des diplômes exigés (bac, DEUG, licence…)', 'نسخ من الشهادات المطلوبة (البكالوريا، الدبلومات الجامعية…)')
  ];
  var GROUP = {
    militaire: [
      I('casier', 'Fiche anthropométrique (casier judiciaire) récente', 'بطاقة السوابق (Fiche anthropométrique) حديثة'),
      I('residence', 'Certificat de résidence', 'شهادة السكنى'),
      I('celibat', 'Attestation de célibat ou de situation familiale (si demandée)', 'شهادة العزوبة أو الحالة العائلية (إذا طُلبت)'),
      I('physique', 'Conditions de taille, de vue et d’aptitude physique de l’avis vérifiées', 'التحقق من شروط القامة والبصر واللياقة البدنية في الإعلان'),
      I('sport', 'Tenue et chaussures de sport pour les épreuves physiques', 'ملابس وأحذية رياضية للاختبارات البدنية')
    ],
    securite: [
      I('casier', 'Fiche anthropométrique (casier judiciaire) récente', 'بطاقة السوابق (Fiche anthropométrique) حديثة'),
      I('residence', 'Certificat de résidence', 'شهادة السكنى'),
      I('physique', 'Conditions de taille, de vue et d’aptitude physique de l’avis vérifiées', 'التحقق من شروط القامة والبصر واللياقة البدنية في الإعلان'),
      I('sport', 'Tenue et chaussures de sport pour les épreuves physiques', 'ملابس وأحذية رياضية للاختبارات البدنية'),
      I('permis', 'Permis de conduire, si l’avis l’exige', 'رخصة السياقة إذا اشترطها الإعلان')
    ],
    sante: [
      I('vaccins', 'Carnet de vaccination (peut être demandé à l’inscription administrative)', 'دفتر التلقيح (قد يُطلب عند التسجيل الإداري)')
    ],
    'architecture-arts': [
      I('dessin', 'Matériel de dessin pour l’épreuve : crayons HB et 2B, gomme, taille-crayon, règle', 'أدوات الرسم للاختبار: أقلام HB و2B، ممحاة، مبراة، مسطرة'),
      I('portfolio', 'Travaux personnels ou portfolio, seulement si l’avis le demande', 'أعمال شخصية أو ملف أعمال، فقط إذا طلبه الإعلان')
    ]
  };
  var BY_ID = {
    'fonction-publique': [
      I('cv', 'CV à jour et lettre de motivation (si demandés)', 'سيرة ذاتية محينة ورسالة تحفيز (إذا طُلبتا)'),
      I('diplomes-poste', 'Copies des diplômes exigés par le poste', 'نسخ من الشهادات المطلوبة للمنصب')
    ],
    universite: [
      I('pre-inscription', 'Préinscription en ligne sur le portail de l’université choisie', 'التسجيل القبلي عبر بوابة الجامعة المختارة')
    ]
  };
  var ADMIN = [
    I('bac-original', 'Original du bac ou attestation de réussite, et copies certifiées conformes', 'أصل شهادة البكالوريا أو شهادة النجاح مع نسخ مصادق عليها'),
    I('naissance', 'Extrait d’acte de naissance', 'نسخة موجزة من رسم الولادة'),
    I('medical', 'Certificat médical d’aptitude, si demandé', 'شهادة طبية تثبت الأهلية إذا طُلبت'),
    I('enveloppes', 'Enveloppes timbrées à votre adresse, si l’avis le demande', 'أظرفة متنبرة تحمل عنوانك إذا طلبها الإعلان')
  ];
  var DAY = [
    I('convocation', 'Convocation imprimée', 'الاستدعاء مطبوعًا'),
    I('cnie-j', 'CNIE originale', 'البطاقة الوطنية الأصلية'),
    I('stylos', 'Plusieurs stylos (bleu ou noir), crayon, gomme et règle', 'عدة أقلام (زرقاء أو سوداء)، قلم رصاص، ممحاة ومسطرة'),
    I('montre', 'Montre simple : téléphone et montre connectée sont interdits en salle', 'ساعة عادية: الهاتف والساعة الذكية ممنوعان داخل القاعة'),
    I('trajet', 'Trajet repéré à l’avance ; arriver au moins 45 minutes avant l’heure', 'معرفة الطريق مسبقًا والوصول قبل الموعد بـ45 دقيقة على الأقل')
  ];

  function sections(c) {
    var app = BASE.slice();
    if (!c) app = app.concat(BAC_DOCS);
    else if (c.level === 'bac2' || c.level === 'bac3') app = app.concat(HIGHER);
    else if (c.noBac) app = app.concat(NO_BAC);
    else app = app.concat(BAC_DOCS);
    if (c && GROUP[c.group]) app = app.concat(GROUP[c.group]);
    if (c && BY_ID[c.id]) app = app.concat(BY_ID[c.id]);
    var seen = {};
    app = app.filter(function (i) { if (seen[i.id]) return false; seen[i.id] = true; return true; });
    return [
      { title: tr('Candidature', 'الترشيح'), items: app },
      { title: tr('Inscription après admission', 'التسجيل بعد القبول'), items: c && c.noBac ? ADMIN.filter(function (i) { return i.id !== 'bac-original'; }) : ADMIN },
      { title: tr('Le jour de l’épreuve', 'يوم الاختبار'), items: DAY }
    ];
  }

  function key() { return 'check.' + (select.value || 'general'); }

  function render() {
    var c = data && select.value ? data.concours.filter(function (x) { return x.id === select.value; })[0] : null;
    var done = C.store.get(key(), []) || [];
    C.clear(out);
    var total = 0, ticked = 0;
    var progress = el('p', { class: 'result-line', 'aria-live': 'polite' });
    var meter = el('div', { class: 'meter' });
    var bar = el('i', { style: 'width:0%' });
    meter.appendChild(bar);
    out.appendChild(progress);
    out.appendChild(meter);
    if (c) {
      var info = el('div', { class: 'callout info' }, [
        el('strong', { text: C.L(c.name) }), el('br'),
        c.platform ? tr('Inscription : ', 'التسجيل: ') + c.platform + ' · ' : '',
        el('a', { href: C.guideHref(c), text: tr('Conditions et calendrier dans la fiche', 'الشروط والأجندة في البطاقة') })
      ]);
      out.appendChild(info);
    }
    function update() {
      ticked = (C.store.get(key(), []) || []).length;
      progress.textContent = ticked + ' / ' + total + tr(' éléments prêts', ' عناصر جاهزة');
      bar.style.width = (total ? Math.round(ticked / total * 100) : 0) + '%';
    }
    sections(c).forEach(function (sec, si) {
      out.appendChild(el('h3', { text: sec.title }));
      var ul = el('ul', { class: 'check-items' });
      sec.items.forEach(function (it) {
        total++;
        var id = 'chk-' + si + '-' + it.id;
        var box = el('input', { type: 'checkbox', id: id, value: it.id });
        box.checked = done.indexOf(it.id) !== -1;
        box.addEventListener('change', function () {
          var list = C.store.get(key(), []) || [];
          var pos = list.indexOf(it.id);
          if (box.checked && pos === -1) list.push(it.id);
          if (!box.checked && pos !== -1) list.splice(pos, 1);
          C.store.set(key(), list);
          Array.prototype.forEach.call(out.querySelectorAll('input[value="' + it.id + '"]'), function (other) { other.checked = box.checked; });
          update();
        });
        ul.appendChild(el('li', null, [box, el('label', { for: id, text: C.L(it) })]));
      });
      out.appendChild(ul);
    });
    // The same document can appear in two sections: count it once.
    var ids = {};
    Array.prototype.forEach.call(out.querySelectorAll('input[type="checkbox"]'), function (b) { ids[b.value] = true; });
    total = Object.keys(ids).length;
    out.appendChild(el('p', { class: 'muted', style: 'font-size:var(--fs-sm)', text: tr('Liste indicative : la liste exacte des pièces est fixée par l’avis officiel de chaque concours.', 'لائحة إرشادية: اللائحة الدقيقة للوثائق يحددها الإعلان الرسمي لكل مباراة.') }));
    update();
  }

  reset.addEventListener('click', function () { C.store.set(key(), []); render(); });
  select.addEventListener('change', function () { C.store.set('check-last', select.value); render(); });

  var wanted = C.param('concours');
  var last = C.store.get('check-last', '');
  C.data('outils').then(function (d) {
    data = d;
    if (wanted && d.concours.some(function (c) { return c.id === wanted; })) select.value = wanted;
    else if (last) select.value = last;
    render();
  }).catch(function (err) { C.fail(out, err); });
})();

export default {
  id: 'medecine',
  order: 10,
  group: 'sante',
  level: 'postbac',
  type: 'public',
  icon: 'health',
  bac: ['SM', 'PC', 'SVT', 'AGRO'],
  seuils: {
    year: '2026',
    formula: '75/25',
    rows: [['SM', 12], ['PC', 12], ['SVT', 12], ['AGRO', 12, { fr: '(série sciences expérimentales, selon l’avis)', ar: '(حسب الإعلان)' }]],
    note: { fr: 'Seuil relayé pour 2025 et 2026 : 12/20 (13/20 en 2024).', ar: 'العتبة المتداولة لدورتي 2025 و2026: 12/20 (13/20 سنة 2024).' },
  },
  age: null,
  practice: {
    subjects: ['svt', 'physique', 'chimie', 'maths'],
    mock: {
      minutes: 120,
      sections: [
        { subjects: ['svt'], count: 14 },
        { subjects: ['physique'], count: 14 },
        { subjects: ['chimie'], count: 14 },
        { subjects: ['maths'], count: 14 },
      ],
      scoring: { correct: 1, wrong: 0, blank: 0 },
      eliminatory: 3,
      official: false,
    },
    difficulty: 'tres-selectif',
  },
  related: ['ispits', 'erssm', 'ensa', 'iav-apesa'],
  official: [
    { label: 'Cursus Sup — inscription au concours commun', url: 'https://www.cursussup.gov.ma' },
    { label: "Ministère de l'Enseignement supérieur (MESRSI)", url: 'https://www.enssup.gov.ma' },
  ],
  sources: [
    { title: 'SNRTnews — Concours de médecine 2025-2026 : seuil, conditions d’accès, calendrier', url: 'https://snrtnews.com/fr/article/concours-de-medecine-2025-2026-seuil-conditions-dacces-calendrier-ce-quil-faut-retenir', date: '2025' },
    { title: 'Dreamjob — Résultats de présélection médecine FMP/FMD 2026-2027 (Cursus Sup)', url: 'https://www.dreamjob.ma/orientation/resultats-preselection-concours-medecine-fmp-fmd-2026-2027-sur-cursussup-gov-ma/', date: '2026-07' },
    { title: 'Tawjihplus — Concours FMP/FMD 2026 (places, seuils)', url: 'https://tawjihplus.net/FMPD?lang=fr', date: '2026' },
    { title: 'Concoursmedecine.ma — Concours médecine 2026 : dates et seuils', url: 'https://concoursmedecine.ma/actualites/concours-medecine-2026/', date: '2026' },
    { title: 'Le Matin — Réforme : diplôme de médecine en 6 ans au lieu de 7 (2022)', url: 'https://lematin.ma/express/2022/enseignement-superieur-lexecutif-veut-ramener-diplome-medecine-6-ans-lieu-7/372190.html', date: '2022' },
  ],
  calendar: [
    { key: 'inscription', month: [6, 7], last: '2026-06-19/2026-07-10' },
    { key: 'ecrit', month: [7], last: '2026-07-18' },
  ],
  fr: {
    short: 'Médecine, pharmacie, dentaire',
    name: 'Facultés de Médecine, de Pharmacie et de Médecine Dentaire (FMP, FMD)',
    title: 'Concours médecine 2027 au Maroc : seuil, épreuves, places et préparation',
    description: 'Concours commun d’accès aux facultés publiques de médecine, pharmacie et médecine dentaire : bacs acceptés, seuil 75/25, QCM SVT-physique-chimie-maths, note éliminatoire, places et calendrier.',
    keywords: ['concours medecine', 'seuil medecine', 'concours fmp', 'concours pharmacie', 'concours medecine dentaire', 'fmd', 'qcm medecine'],
    intro: "L'accès en 1re année des facultés publiques de **médecine, de pharmacie et de médecine dentaire** passe par un **concours commun national**, organisé via la plateforme Cursus Sup : présélection sur les notes du bac (seuil relayé à **12/20** en 2025 et 2026), puis une épreuve écrite en QCM portant sur **SVT, physique, chimie et mathématiques**.",
    facts: [
      ['Formations', 'Doctorat en médecine, en pharmacie, en médecine dentaire'],
      ['Bacs acceptés', 'Sciences maths (A/B) et sciences expérimentales'],
      ['Seuil relayé', '12/20 (75 % national + 25 % régional)'],
      ['Épreuve', 'QCM : SVT, physique, chimie, maths (coef. 1)'],
      ['Note éliminatoire', 'Moins de 3/20 dans une matière'],
      ['Inscription', 'Cursus Sup, mi-juin à début juillet'],
    ],
    sections: [
      {
        id: 'facultes',
        h: 'Les facultés concernées',
        blocks: [
          { p: "Le concours commun classe les candidats pour l'ensemble des facultés publiques : les facultés de médecine et de pharmacie (FMP) des grandes villes universitaires (notamment Rabat, Casablanca, Fès, Marrakech, Oujda, Agadir, Tanger, Kénitra et Laâyoune, ainsi que les facultés ouvertes plus récemment) et les facultés de médecine dentaire (FMD). Le choix de la faculté et de la filière (médecine, pharmacie, dentaire) se fait par ordre de préférence lors de l'inscription." },
          { callout: 'info', text: "Les facultés privées et semi-publiques (universités de sciences de la santé) organisent leurs **propres concours**, avec des frais de scolarité : ils ne passent pas par le concours commun public." },
        ],
      },
      {
        id: 'conditions',
        h: "Conditions d'accès",
        blocks: [
          { ul: [
            "Être titulaire du baccalauréat de l'année en **sciences mathématiques (A ou B)** ou en **sciences expérimentales** (PC, SVT, et selon l'avis les autres options), ou d'un diplôme équivalent.",
            "Avoir une note de présélection au moins égale au **seuil fixé par le ministère** (12/20 relayé pour 2025 et 2026).",
            "S'inscrire sur **Cursus Sup** dans les délais et classer ses choix (filière et faculté).",
          ] },
          { callout: 'info', text: "Note de présélection = **75 % examen national + 25 % examen régional**. Calculez la vôtre avec le [calculateur](@/outils/calcul-note-bac/)." },
        ],
      },
      { id: 'seuils', h: 'Seuil de présélection', blocks: [ { seuils: true }, { p: "Le seuil sert uniquement à être convoqué à l'écrit. Le classement final se fait sur la note de l'épreuve écrite, dans la limite des places de chaque faculté et filière." } ] },
      {
        id: 'epreuves',
        h: "L'épreuve écrite",
        blocks: [
          { p: "D'après les éditions récentes relayées par plusieurs sources, l'épreuve écrite est un **questionnaire à choix multiples d'une durée totale de 2 heures**, portant sur quatre matières de **coefficient 1** chacune, avec une seule bonne réponse par question." },
          { table: {
            head: ['Matière', 'Format indiqué', 'À retenir'],
            rows: [
              ['SVT', 'QCM (≈ 14 questions)', 'Consommation de la matière organique, ATP et muscle, information génétique, génétique humaine et des populations, immunologie, géologie'],
              ['Physique', 'QCM (≈ 14 questions)', 'Ondes, décroissance radioactive, RC/RL/RLC, mécanique de Newton, oscillateurs'],
              ['Chimie', 'QCM (≈ 14 questions)', 'Cinétique, équilibres, acides-bases, piles et électrolyse, estérification'],
              ['Mathématiques', 'QCM (≈ 14 questions)', 'Suites, fonctions, logarithme et exponentielle, intégrales, complexes, probabilités'],
            ],
          } },
          { callout: 'warn', text: "**Note éliminatoire** : une note inférieure à **3/20 dans une seule matière** élimine le candidat. Ne négligez aucune des quatre matières, même celle où vous êtes le plus faible." },
          { p: "Le nombre exact de questions, la durée et l'existence éventuelle de points négatifs sont précisés dans les consignes de chaque session : lisez-les sur votre convocation." },
        ],
      },
      {
        id: 'places',
        h: 'Places et candidats',
        blocks: [
          { p: "Le nombre de places a fortement augmenté depuis la réforme de 2022, qui visait à former davantage de médecins. Pour 2022-2023, la note ministérielle prévoyait **3 489 places en médecine, 435 en pharmacie et 355 en médecine dentaire**. Des sites d'orientation ont ensuite relayé **6 511 places pour 2025-2026** et **7 340 places pour 2026-2027 (dont environ 5 790 en médecine)**, chiffres à confirmer dans la note officielle de chaque session." },
          { p: "Les candidats convoqués à l'écrit se comptent en dizaines de milliers : la concurrence se joue sur l'épreuve écrite." },
        ],
      },
      {
        id: 'etudes',
        h: 'Durée des études',
        blocks: [
          { p: "La réforme lancée en 2022 a ramené la formation du **doctorat en médecine de 7 à 6 ans** ; les cursus de pharmacie et de médecine dentaire ont aussi été réorganisés. Vérifiez la durée en vigueur pour votre promotion auprès de la faculté." },
        ],
      },
      {
        id: 'calendrier',
        h: 'Calendrier habituel',
        blocks: [
          { table: {
            head: ['Étape', 'Période habituelle', 'Repère session 2026'],
            rows: [
              ['Inscriptions Cursus Sup', 'Mi-juin à début juillet', '19 juin – 10 juillet 2026 (relayé)'],
              ['Listes de présélection', 'Mi-juillet', 'À partir de mi-juillet 2026'],
              ['Épreuve écrite', 'Seconde quinzaine de juillet', 'Samedi 18 juillet 2026 (relayé)'],
              ['Résultats et inscriptions', 'Fin juillet – août', 'Ex. FMPD Kénitra : inscriptions 28, 29 et 31 juillet ; liste d’attente le 4 août 2026'],
            ],
          } },
        ],
      },
      {
        id: 'preparation',
        h: 'Comment se préparer',
        blocks: [
          { ul: [
            "Révisez en priorité **la SVT et la chimie** : ce sont les matières où les candidats perdent le plus de points, alors que leurs questions sont souvent proches du cours.",
            "Sécurisez le minimum dans chaque matière pour éviter la note éliminatoire.",
            "Travaillez la vitesse : environ 2 minutes par question, calculs sans calculatrice.",
            "Refaites des QCM chronométrés de 56 questions en 2 heures, en conditions réelles.",
            "Gardez du temps pour le bac : la présélection dépend d'abord de votre note nationale.",
          ] },
          { practice: true },
        ],
      },
    ],
    faq: [
      { q: 'Quel est le seuil du concours de médecine ?', a: "Le seuil relayé pour les sessions 2025 et 2026 est de 12/20, calculé avec 75 % de la note de l'examen national et 25 % de celle de l'examen régional (il était de 13/20 en 2024). Le seuil officiel est publié chaque année sur Cursus Sup." },
      { q: 'Quelles matières au concours de médecine ?', a: 'Quatre matières de coefficient 1 : sciences de la vie et de la Terre, physique, chimie et mathématiques, sous forme de QCM.' },
      { q: 'Y a-t-il une note éliminatoire ?', a: 'Oui : une note inférieure à 3/20 dans une matière est éliminatoire selon les règles relayées pour les dernières sessions.' },
      { q: 'Un bac sciences agronomiques peut-il passer le concours ?', a: "Le concours est ouvert aux bacs sciences mathématiques et sciences expérimentales. Les options exactes acceptées sont fixées par la note ministérielle de chaque session : vérifiez-la sur Cursus Sup." },
      { q: 'Combien y a-t-il de places en médecine ?', a: "Des sources spécialisées ont relayé 7 340 places pour 2026-2027 (dont environ 5 790 en médecine) contre 6 511 en 2025-2026. Les chiffres officiels figurent dans la note ministérielle de la session." },
    ],
  },
  ar: {
    short: 'الطب والصيدلة وطب الأسنان',
    name: 'كليات الطب والصيدلة وكليات طب الأسنان',
    title: 'مباراة الطب 2027 بالمغرب: العتبة والاختبارات والمقاعد والتحضير',
    description: 'المباراة المشتركة لولوج كليات الطب والصيدلة وطب الأسنان العمومية: الشعب المقبولة، عتبة 75/25، أسئلة متعددة الاختيارات في علوم الحياة والأرض والفيزياء والكيمياء والرياضيات، النقطة الموجبة للرسوب، المقاعد والأجندة.',
    keywords: ['مباراة الطب', 'عتبة الطب', 'كلية الطب والصيدلة', 'مباراة طب الأسنان'],
    intro: 'يتم الولوج إلى السنة الأولى بكليات **الطب والصيدلة وطب الأسنان** العمومية عبر **مباراة وطنية مشتركة** بمنصة Cursus Sup: انتقاء أولي على أساس نقط البكالوريا (عتبة متداولة **12/20** في 2025 و2026)، ثم اختبار كتابي على شكل أسئلة متعددة الاختيارات في **علوم الحياة والأرض والفيزياء والكيمياء والرياضيات**.',
    facts: [
      ['التكوين', 'دكتوراه في الطب، الصيدلة، طب الأسنان'],
      ['الشعب', 'العلوم الرياضية والعلوم التجريبية'],
      ['العتبة', '12/20 (75% وطني + 25% جهوي)'],
      ['الاختبار', 'أسئلة متعددة الاختيارات في 4 مواد (معامل 1)'],
      ['نقطة إقصائية', 'أقل من 3/20 في مادة'],
      ['التسجيل', 'Cursus Sup، منتصف يونيو إلى بداية يوليوز'],
    ],
    sections: [
      { id: 'conditions', h: 'شروط الولوج', blocks: [
        { ul: ['الحصول على بكالوريا السنة الجارية في **العلوم الرياضية (أ أو ب)** أو **العلوم التجريبية**، أو شهادة معادلة.', 'الحصول على نقطة انتقاء تساوي على الأقل **العتبة المحددة** (12/20 حسب المتداول في 2025 و2026).', 'التسجيل في **Cursus Sup** داخل الآجال وترتيب الاختيارات.'] },
        { callout: 'info', text: 'نقطة الانتقاء = **75% الامتحان الوطني + 25% الامتحان الجهوي**. احسبها عبر [الحاسبة](@/outils/calcul-note-bac/).' },
      ] },
      { id: 'seuils', h: 'عتبة الانتقاء', blocks: [ { seuils: true } ] },
      { id: 'epreuves', h: 'الاختبار الكتابي', blocks: [
        { p: 'حسب الدورات الأخيرة، الاختبار عبارة عن **أسئلة متعددة الاختيارات مدتها ساعتان**، في أربع مواد **بمعامل 1** لكل منها، مع جواب صحيح واحد لكل سؤال.' },
        { callout: 'warn', text: '**نقطة إقصائية**: الحصول على أقل من **3/20 في مادة واحدة** يؤدي إلى الإقصاء.' },
      ] },
      { id: 'places', h: 'المقاعد', blocks: [ { p: 'ارتفع عدد المقاعد بعد إصلاح 2022. تداولت مواقع متخصصة **6511 مقعدًا لموسم 2025-2026** و**7340 مقعدًا لموسم 2026-2027**، وهي أرقام يجب تأكيدها في المذكرة الوزارية.' } ] },
      { id: 'calendrier', h: 'الأجندة المعتادة', blocks: [ { table: { head: ['المرحلة', 'الفترة المعتادة', 'مرجع 2026'], rows: [['التسجيل', 'منتصف يونيو – بداية يوليوز', '19 يونيو – 10 يوليوز 2026'], ['الاختبار الكتابي', 'النصف الثاني من يوليوز', 'السبت 18 يوليوز 2026'], ['النتائج والتسجيل', 'أواخر يوليوز – غشت', 'حسب الكلية']] } } ] },
      { id: 'preparation', h: 'كيف تستعد', blocks: [
        { ul: ['راجع أولًا **علوم الحياة والأرض والكيمياء**.', 'احرص على الحد الأدنى في كل مادة لتفادي النقطة الإقصائية.', 'تمرّن على السرعة: حوالي دقيقتين لكل سؤال.', 'أنجز امتحانات تجريبية من 56 سؤالًا في ساعتين.'] },
        { practice: true },
      ] },
    ],
    faq: [
      { q: 'ما هي عتبة مباراة الطب؟', a: 'العتبة المتداولة لدورتي 2025 و2026 هي 12/20، محسوبة بـ75% من الوطني و25% من الجهوي (13/20 سنة 2024).' },
      { q: 'ما هي مواد مباراة الطب؟', a: 'أربع مواد بمعامل 1: علوم الحياة والأرض، الفيزياء، الكيمياء والرياضيات.' },
      { q: 'هل توجد نقطة إقصائية؟', a: 'نعم، الحصول على أقل من 3/20 في مادة يؤدي إلى الإقصاء.' },
    ],
  },
};

export default {
  id: 'ensam',
  order: 22,
  group: 'ingenierie',
  level: 'postbac',
  type: 'public',
  icon: 'gear2',
  bac: ['SM', 'PC', 'SVT', 'STE', 'STM', 'PRO'],
  seuils: {
    year: '2024',
    formula: '75/25',
    rows: [['SM', 12.25], ['STE', 12.25], ['STM', 12.25], ['PC', 16.17], ['SVT', 16.17], ['PRO', 16.17]],
    note: { fr: 'Seuils 2024 relayés (2023 : 12,25 et 16,25 ; 2022 : 12,90 et 16,50, bac étranger 14).', ar: 'عتبات 2024 المتداولة (2023: 12.25 و16.25؛ 2022: 12.90 و16.50، البكالوريا الأجنبية 14).' },
  },
  age: null,
  practice: {
    subjects: ['maths', 'physique', 'chimie'],
    mock: {
      minutes: 210,
      sections: [
        { subjects: ['maths'], count: 30 },
        { subjects: ['physique', 'chimie'], count: 30 },
      ],
      scoring: { correct: 2, wrong: -1, blank: 0 },
      official: false,
    },
    difficulty: 'selectif',
  },
  related: ['ensa', 'cpge', 'est', 'fst'],
  official: [
    { label: 'Cursus Sup — candidature ENSAM', url: 'https://www.cursussup.gov.ma' },
    { label: "Ministère de l'Enseignement supérieur (MESRSI)", url: 'https://www.enssup.gov.ma' },
  ],
  sources: [
    { title: 'Tawjihnet — Présélection ENSAM Meknès, Casablanca, Rabat 2026-2027 (format de l’épreuve)', url: 'https://www.tawjihnet.net/preselection-ensam-meknes-casa-rabat-2026-2027/', date: '2026-07' },
    { title: 'Orientation Chabab — Résultats de présélection ENSAM 2026/2027 (places par école)', url: 'https://orientation-chabab.com/actualite/resultats-preselection-ensam-cursussup', date: '2026-07' },
    { title: 'Tawjihnet — Seuils ENSAM 2022, 2023, 2024', url: 'https://www.tawjihnet.net/preselection-ensam-meknes-casa-rabat-2025-2026/amp/', date: '2025' },
  ],
  fr: {
    short: 'ENSAM',
    name: "Écoles Nationales Supérieures d'Arts et Métiers (ENSAM Meknès, Casablanca, Rabat)",
    title: 'Concours ENSAM 2027 : seuils, épreuve maths-physique, places et préparation',
    description: "Concours d'accès aux ENSAM de Meknès, Casablanca et Rabat : bacs acceptés, seuils de présélection, épreuve QCM maths-physique (60 questions), barème, places et calendrier.",
    keywords: ['concours ensam', 'seuil ensam', 'ensam meknes', 'ensam casablanca', 'ensam rabat', 'arts et métiers maroc'],
    intro: "Les trois **ENSAM** (Meknès, Casablanca, Rabat) forment en 5 ans des **ingénieurs d'État** en génie mécanique, industriel, électrique, informatique et énergétique. Le recrutement post-bac se fait par **concours commun** : présélection 75/25 sur le bac, puis un **QCM de mathématiques et de physique**.",
    facts: [
      ['Diplôme', "Ingénieur d'État (bac+5)"],
      ['Écoles', 'Meknès, Casablanca, Rabat'],
      ['Places 2026', '1 080 (500 Meknès, 300 Rabat, 280 Casa) — relayé'],
      ['Épreuve 2026', '60 QCM maths + physique en 3 h 30 (relayé)'],
      ['Barème relayé', '+2 / −1 / 0'],
      ['Inscription', 'Cursus Sup (juin–juillet)'],
    ],
    sections: [
      {
        id: 'conditions',
        h: "Conditions d'accès",
        blocks: [
          { ul: [
            "Bac de l'année en **sciences mathématiques A ou B**, **sciences physiques**, **SVT**, **sciences et technologies** (électriques ou mécaniques) ou certains bacs professionnels.",
            'Note de présélection (75 % national + 25 % régional) supérieure ou égale au seuil de sa série.',
            'Inscription sur Cursus Sup dans les délais.',
          ] },
          { p: "Le nombre de candidats présélectionnés est fixé à environ **quatre fois le nombre de places**, ce qui explique les seuils élevés des séries PC et SVT." },
        ],
      },
      { id: 'seuils', h: 'Seuils de présélection', blocks: [ { seuils: true } ] },
      {
        id: 'epreuves',
        h: 'Épreuve écrite',
        blocks: [
          { table: {
            head: ['Élément', 'Session 2026 (selon les informations relayées)'],
            rows: [
              ['Date', 'Vendredi 24 juillet 2026'],
              ['Durée', '3 h 30 pour les deux matières'],
              ['Questions', '60 QCM : Q1–Q30 mathématiques, Q31–Q60 physique'],
              ['Barème', '+2 bonne réponse, −1 réponse fausse, 0 sans réponse'],
            ],
          } },
          { callout: 'info', text: "Le barème et le format sont confirmés chaque année dans la convocation : relisez-la la veille. Testez votre stratégie de réponse avec le [simulateur de barème](@/outils/simulateur-qcm/)." },
        ],
      },
      {
        id: 'places',
        h: 'Places',
        blocks: [ { p: "Pour 2026-2027, **1 080 places** en 1re année ont été relayées : **500 à Meknès, 300 à Rabat et 280 à Casablanca**. L'ENSAM recrute aussi en cycle ingénieur (bac+2) via le CNC et des concours sur titre." } ],
      },
      {
        id: 'calendrier',
        h: 'Calendrier habituel',
        blocks: [ { table: { head: ['Étape', 'Période', 'Repère 2026'], rows: [['Inscriptions', 'Mi-juin – début juillet', 'Juin–juillet 2026'], ['Convocations', 'Mi-juillet', 'Dès le 16 juillet 2026'], ['Écrit', 'Fin juillet', '24 juillet 2026'], ['Résultats', 'Fin juillet – août', 'Été 2026']] } } ],
      },
      {
        id: 'preparation',
        h: 'Conseils',
        blocks: [
          { ul: [
            '60 questions en 210 minutes : environ 3 min 30 par question, à gérer sans calculatrice.',
            'Priorité à la mécanique (Newton, oscillateurs), à l’électricité (RC, RL, RLC) et à l’analyse (fonctions, intégrales, suites).',
            'Avec −1 par erreur, ne répondez au hasard qu’après avoir éliminé au moins deux propositions.',
          ] },
          { practice: true },
        ],
      },
    ],
    faq: [
      { q: 'Quel est le seuil ENSAM ?', a: 'En 2024, les seuils relayés étaient de 12,25/20 pour les sciences mathématiques et les bacs techniques, et de 16,17/20 pour les sciences physiques, la SVT et les bacs professionnels.' },
      { q: 'Combien de places à l’ENSAM ?', a: '1 080 places en première année ont été relayées pour 2026-2027 : 500 à Meknès, 300 à Rabat et 280 à Casablanca.' },
      { q: 'Quelle différence entre ENSA et ENSAM ?', a: "Les deux forment des ingénieurs d'État en 5 ans. Les ENSAM, héritières des écoles d'arts et métiers, sont davantage orientées génie mécanique, industriel et énergétique ; les concours et les barèmes sont distincts." },
    ],
  },
  ar: {
    short: 'ENSAM',
    name: 'المدارس الوطنية العليا للفنون والمهن (مكناس، الدار البيضاء، الرباط)',
    title: 'مباراة ENSAM 2027: العتبات واختبار الرياضيات والفيزياء والمقاعد',
    description: 'مباراة ولوج المدارس الوطنية العليا للفنون والمهن بمكناس والدار البيضاء والرباط: الشعب، العتبات، اختبار من 60 سؤالًا، سلم التنقيط والمقاعد.',
    keywords: ['مباراة ENSAM', 'الفنون والمهن'],
    intro: 'تكوّن المدارس الوطنية العليا للفنون والمهن **ENSAM** الثلاث (مكناس، الدار البيضاء، الرباط) في 5 سنوات **مهندسي الدولة** في الهندسة الميكانيكية والصناعية والكهربائية والمعلوماتية والطاقية. ويتم الولوج بعد البكالوريا عبر **مباراة مشتركة**: انتقاء أولي 75/25 على أساس البكالوريا، ثم **أسئلة متعددة الاختيارات في الرياضيات والفيزياء**.',
    facts: [
      ['الدبلوم', 'مهندس دولة (باك+5)'],
      ['المدارس', 'مكناس، الدار البيضاء، الرباط'],
      ['مقاعد 2026', '1080 (500 مكناس، 300 الرباط، 280 الدار البيضاء) — متداول'],
      ['اختبار 2026', '60 سؤالًا في الرياضيات والفيزياء في 3 ساعات ونصف (متداول)'],
      ['سلم التنقيط المتداول', '+2 / −1 / 0'],
      ['التسجيل', 'Cursus Sup (يونيو–يوليوز)'],
    ],
    sections: [
      {
        id: 'conditions',
        h: 'شروط الولوج',
        blocks: [
          { ul: [
            'بكالوريا السنة الجارية في **العلوم الرياضية أ أو ب** أو **العلوم الفيزيائية** أو **علوم الحياة والأرض** أو **العلوم والتكنولوجيات** (الكهربائية أو الميكانيكية) أو بعض شعب البكالوريا المهنية.',
            'نقطة انتقاء (75% وطني + 25% جهوي) تساوي عتبة الشعبة أو تفوقها.',
            'التسجيل على Cursus Sup داخل الآجال.',
          ] },
          { p: 'يُحدَّد عدد المترشحين المنتقين في حوالي **أربعة أضعاف عدد المقاعد**، وهو ما يفسر ارتفاع عتبات شعبتي العلوم الفيزيائية وعلوم الحياة والأرض.' },
        ],
      },
      { id: 'seuils', h: 'عتبات الانتقاء الأولي', blocks: [ { seuils: true } ] },
      {
        id: 'epreuves',
        h: 'الاختبار الكتابي',
        blocks: [
          { table: {
            head: ['العنصر', 'دورة 2026 (حسب المعطيات المتداولة)'],
            rows: [
              ['التاريخ', 'الجمعة 24 يوليوز 2026'],
              ['المدة', '3 ساعات ونصف للمادتين'],
              ['الأسئلة', '60 سؤالًا متعدد الاختيارات: Q1–Q30 رياضيات، Q31–Q60 فيزياء'],
              ['سلم التنقيط', '+2 للجواب الصحيح، −1 للجواب الخاطئ، 0 بدون جواب'],
            ],
          } },
          { callout: 'info', text: 'يُؤكَّد سلم التنقيط والشكل كل سنة في الاستدعاء: أعد قراءته في اليوم السابق. واختبر استراتيجيتك في الإجابة عبر [محاكي سلم التنقيط](@/outils/simulateur-qcm/).' },
        ],
      },
      {
        id: 'places',
        h: 'المقاعد',
        blocks: [ { p: 'بالنسبة لموسم 2026-2027، تم تداول **1080 مقعدًا** في السنة الأولى: **500 بمكناس و300 بالرباط و280 بالدار البيضاء**. وتستقبل ENSAM أيضًا في سلك المهندس (باك+2) عبر المباراة الوطنية المشتركة CNC ومباريات على أساس الشهادة.' } ],
      },
      {
        id: 'calendrier',
        h: 'الأجندة المعتادة',
        blocks: [ { table: { head: ['المرحلة', 'الفترة', 'مرجع 2026'], rows: [['التسجيل', 'منتصف يونيو – بداية يوليوز', 'يونيو–يوليوز 2026'], ['الاستدعاءات', 'منتصف يوليوز', 'ابتداءً من 16 يوليوز 2026'], ['الاختبار الكتابي', 'أواخر يوليوز', '24 يوليوز 2026'], ['النتائج', 'أواخر يوليوز – غشت', 'صيف 2026']] } } ],
      },
      {
        id: 'preparation',
        h: 'نصائح',
        blocks: [
          { ul: [
            '60 سؤالًا في 210 دقائق: حوالي 3 دقائق ونصف لكل سؤال، يجب تدبيرها بدون آلة حاسبة.',
            'الأولوية للميكانيك (نيوتن، المتذبذبات)، والكهرباء (RC، RL، RLC) والتحليل (الدوال، التكاملات، المتتاليات).',
            'مع خصم −1 عن كل خطأ، لا تجب عشوائيًا إلا بعد استبعاد اقتراحين على الأقل.',
          ] },
          { practice: true },
        ],
      },
    ],
    faq: [
      { q: 'ما هي عتبة ENSAM؟', a: 'في 2024، كانت العتبات المتداولة 12.25/20 للعلوم الرياضية والشعب التقنية، و16.17/20 للعلوم الفيزيائية وعلوم الحياة والأرض والبكالوريا المهنية.' },
      { q: 'كم عدد المقاعد في ENSAM؟', a: 'تم تداول 1080 مقعدًا في السنة الأولى بالنسبة لموسم 2026-2027: 500 بمكناس و300 بالرباط و280 بالدار البيضاء.' },
      { q: 'ما الفرق بين ENSA وENSAM؟', a: 'كلتاهما تكوّن مهندسي الدولة في 5 سنوات. والمدارس الوطنية العليا للفنون والمهن، وريثة مدارس الفنون والمهن، أكثر توجهًا نحو الهندسة الميكانيكية والصناعية والطاقية؛ والمباريات وسلالم التنقيط مختلفة.' },
    ],
  },
};

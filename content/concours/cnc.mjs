export default {
  id: 'cnc',
  order: 26,
  group: 'ingenierie',
  level: 'bac2',
  type: 'public',
  icon: 'gear2',
  bac: [],
  seuils: null,
  age: { max: 24, ref: '12-31', at: { fr: 'moins de 25 ans au 31 décembre de l’année du concours', ar: 'أقل من 25 سنة في 31 دجنبر من سنة المباراة' } },
  practice: null,
  related: ['cpge', 'ensa', 'ensam', 'iscae'],
  official: [
    { label: 'Portail des CPGE et du CNC', url: 'https://www.cpge.ac.ma' },
    { label: 'INSEA (présidence du CNC 2026)', url: 'https://insea.ac.ma' },
  ],
  sources: [
    { title: 'INSEA — Notice du CNC 2026 (PDF)', url: 'https://insea.ac.ma/files/Notice_CNC_VFinale_03_02_2026.pdf', date: '2026-02' },
    { title: '9rayti — Concours National Commun CNC 2026 : inscriptions', url: 'https://www.9rayti.com/concoursa/concours-national-commun-cnc-2026-les-inscriptions-sont-ouvertes', date: '2026-02' },
    { title: 'Dreamjob — Places CNC 2025 par école', url: 'https://www.dreamjob.ma/orientation/inscription-concours-cnc-2025/', date: '2025' },
  ],
  fr: {
    short: 'CNC (après prépa)',
    name: "Concours National Commun d'accès aux écoles d'ingénieurs (CNC)",
    title: 'CNC Maroc 2027 : écoles, épreuves, places et calendrier',
    description: "Le CNC permet aux élèves de CPGE (MP, PSI, TSI) d'intégrer les grandes écoles d'ingénieurs marocaines : conditions, épreuves écrites et TIPE, écoles et places, calendrier.",
    keywords: ['cnc maroc', 'concours national commun', 'cnc 2027', 'écoles ingénieurs maroc', 'tipe'],
    intro: "Le **Concours National Commun (CNC)** clôt les deux années de classes préparatoires scientifiques. Il donne accès aux **grandes écoles d'ingénieurs** publiques (EMI, EHTP, ENSIAS, INPT, INSEA, ENSMR, ENSAM, ENSA en cycle ingénieur…) selon le rang obtenu.",
    facts: [
      ['Public', 'Élèves de CPGE MP, PSI, TSI'],
      ['Inscription 2026', '3 février – 3 mars 2026 (frais 500 MAD)'],
      ['Épreuves', 'Écrits par filière + oral du TIPE'],
      ['Limite', 'Moins de 25 ans au 31 décembre ; 3 passages au plus'],
      ['Présidence 2026', 'INSEA'],
    ],
    sections: [
      {
        id: 'conditions',
        h: 'Conditions',
        blocks: [ { ul: ['Être inscrit en 2e année de CPGE scientifique (MP, PSI ou TSI) ou remplir les conditions de la notice.', 'Avoir **moins de 25 ans au 31 décembre** de l’année du concours (notice 2026).', 'Ne pas avoir déjà passé le CNC **trois fois**.'] } ],
      },
      {
        id: 'epreuves',
        h: 'Épreuves',
        blocks: [
          { p: "Les **épreuves d'admissibilité** sont des écrits propres à chaque filière : mathématiques, physique, chimie, sciences industrielles (selon la filière), informatique, français et anglais. L'**épreuve d'admission** est unique : la présentation des **Travaux d'Initiative Personnelle Encadrés (TIPE)**." },
          { p: "Le classement final permet de choisir son école et sa filière d'ingénieur selon les places offertes." },
        ],
      },
      {
        id: 'ecoles',
        h: 'Écoles et places',
        blocks: [
          { table: { head: ['École (exemples)', 'Places 2025 (relayées)'], rows: [['EMI — École Mohammadia d’Ingénieurs', '548'], ['EHTP — École Hassania des Travaux Publics', '300'], ['ENSMR — École Nationale Supérieure des Mines de Rabat', '300'], ['ENSIAS — informatique et analyse des systèmes', '281']] } },
          { p: "D'autres écoles recrutent via le CNC : INPT, INSEA, ENSAM et ENSA (cycle ingénieur), ENSEM, IAV Hassan II, etc. Les places de chaque session sont listées dans la notice officielle." },
        ],
      },
      {
        id: 'calendrier',
        h: 'Calendrier',
        blocks: [ { table: { head: ['Étape', 'Période habituelle', 'Repère 2026'], rows: [['Inscriptions', 'Février – mars', '3 février – 3 mars 2026'], ['Écrits', 'Mai', 'Mai 2026'], ['Oraux (TIPE)', 'Juin – juillet', 'Été 2026'], ['Choix des écoles', 'Juillet – août', 'Été 2026']] } } ],
      },
    ],
    faq: [
      { q: 'Combien de fois peut-on passer le CNC ?', a: 'Trois fois au maximum, selon la notice 2026, avec une limite d’âge de moins de 25 ans au 31 décembre.' },
      { q: 'Le CNC est-il un QCM ?', a: "Non : ce sont des épreuves écrites rédigées de plusieurs heures par matière, suivies de l'oral du TIPE." },
    ],
  },
  ar: {
    short: 'المباراة الوطنية المشتركة CNC',
    name: 'المباراة الوطنية المشتركة لولوج مدارس المهندسين (CNC)',
    title: 'المباراة الوطنية المشتركة CNC 2027: المدارس والاختبارات والمقاعد',
    description: 'تتيح المباراة الوطنية المشتركة لتلاميذ الأقسام التحضيرية (MP وPSI وTSI) ولوج مدارس المهندسين: الشروط، الاختبارات الكتابية وTIPE، المدارس والمقاعد والأجندة.',
    keywords: ['المباراة الوطنية المشتركة', 'CNC'],
    intro: 'تختتم **المباراة الوطنية المشتركة** سنتي الأقسام التحضيرية العلمية، وتتيح ولوج **مدارس المهندسين** العمومية حسب الرتبة.',
    facts: [['الفئة', 'تلاميذ MP وPSI وTSI'], ['التسجيل 2026', '3 فبراير – 3 مارس 2026'], ['الاختبارات', 'كتابية + TIPE'], ['السن', 'أقل من 25 سنة في 31 دجنبر']],
    sections: [
      { id: 'epreuves', h: 'الاختبارات', blocks: [ { p: 'اختبارات كتابية حسب المسلك (الرياضيات، الفيزياء، الكيمياء، المعلوميات، الفرنسية، الإنجليزية) ثم اختبار شفوي واحد: **TIPE**.' } ] },
      { id: 'ecoles', h: 'المدارس', blocks: [ { p: 'من بينها: EMI (548 مقعدًا سنة 2025)، EHTP (300)، ENSMR (300)، ENSIAS (281)، إضافة إلى INPT وINSEA وغيرها.' } ] },
    ],
    faq: [ { q: 'كم مرة يمكن اجتياز المباراة؟', a: 'ثلاث مرات على الأكثر حسب نشرة 2026.' } ],
  },
};

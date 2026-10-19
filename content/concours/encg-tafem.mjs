export default {
  id: 'encg-tafem',
  order: 40,
  group: 'commerce',
  level: 'postbac',
  type: 'public',
  icon: 'briefcase',
  bac: ['SM', 'PC', 'SVT', 'ECO', 'SGC'],
  seuils: {
    year: '2025',
    formula: '75/25',
    rows: [['ECO', 12], ['SM', 12], ['PC', 14], ['SVT', 14]],
    note: { fr: "Seuils 2025-2026 relayés par des sites d'orientation. Le seuil des autres séries éventuellement acceptées est publié sur Cursus Sup.", ar: 'عتبات 2025-2026 حسب مواقع التوجيه.' },
  },
  age: null,
  practice: {
    subjects: ['logique', 'calcul', 'francais', 'culture', 'maroc', 'economie'],
    // Format of the 2024 and 2025 papers without the reading-memory part
    // (texts read then answered from memory), which a question bank cannot simulate:
    // reasoning 20 q (50 min), general knowledge 30 q (20 min), French 30 q (20 min).
    mock: {
      minutes: 90,
      sections: [
        { subjects: ['logique', 'calcul'], count: 20 },
        { subjects: ['culture', 'maroc', 'economie'], count: 30 },
        { subjects: ['francais'], count: 30 },
      ],
      scoring: { correct: 1, wrong: 0, blank: 0 },
      official: false,
    },
    difficulty: 'selectif',
  },
  related: ['iscae', 'cpge', 'ena-architecture', 'universite'],
  official: [
    { label: 'Cursus Sup — inscription TAFEM', url: 'https://www.cursussup.gov.ma' },
    { label: "Ministère de l'Enseignement supérieur (MESRSI)", url: 'https://www.enssup.gov.ma' },
  ],
  sources: [
    { title: '9rayti — TAFEM ENCG : résultats de présélection et seuils 2025-2026', url: 'https://www.9rayti.com/concoursa/tafem-encg-resultats-de-preselection-et-seuils-officiels-2025-2026', date: '2025-07' },
    { title: 'Tawjihnet — Présélection et seuils ENCG TAFEM 2025-2026', url: 'https://www.tawjihnet.net/preselection-seuil-encg-tafem-cursussup-2025-2026/', date: '2025-07' },
    { title: 'ENCG Casablanca — Avis aux candidats TAFEM 2026 (test le lundi 20 juillet 2026)', url: 'https://encgcasa.ma/documents/516/avis_aux_candidats_TAFEM_2026.pdf', date: '2026-07' },
    { title: 'Dreamjob — Résultats définitifs ENCG TAFEM 2026-2027 (liste des écoles)', url: 'https://www.dreamjob.ma/orientation/resultats-definitifs-concours-encg-tafem-2026-2027-sur-cursussup-gov-ma/', date: '2026-08' },
    { title: 'Université Moulay Ismaïl — Diplôme des ENCG (DENCG), 5 ans', url: 'https://testumi.umi.ac.ma/wp-content/uploads/2024/12/Diplome-des-Ecoles-Nationales-de-Commerce-et-de-Gestion-%E2%80%93-DENCG.pdf', date: '2024' },
  ],
  fr: {
    short: 'ENCG (TAFEM)',
    name: 'Écoles Nationales de Commerce et de Gestion (ENCG) — concours TAFEM',
    title: 'Concours ENCG (TAFEM) 2027 : seuils, épreuve, écoles et préparation',
    description: "Concours TAFEM d'accès aux ENCG : bacs acceptés, seuils de présélection (éco 12, SM 12, PC/SVT 14), contenu du test (logique, maths, français, culture générale), écoles et calendrier.",
    keywords: ['tafem', 'concours encg', 'seuil encg', 'encg maroc', 'test tafem', 'école de commerce maroc'],
    intro: "Les **ENCG** forment en **5 ans** aux métiers du commerce, de la gestion, de la finance et du marketing. L'accès en 1re année se fait par le **TAFEM** (Test d'Admission en Formation en Management), **commun à toutes les ENCG** : présélection 75/25 sur le bac puis un **test écrit en QCM**.",
    facts: [
      ['Diplôme', 'Diplôme des ENCG (bac+5)'],
      ['Écoles', '11 ENCG (liste 2026)'],
      ['Bacs', 'Éco, gestion comptable, SM, PC, SVT'],
      ['Seuils 2025', 'Éco 12 · SM 12 · PC/SVT 14'],
      ['Épreuve', 'TAFEM : 100 QCM en 4 parties'],
      ['Inscription', 'Cursus Sup (juin–juillet)'],
    ],
    sections: [
      { id: 'ecoles', h: 'Les ENCG', blocks: [ { p: 'La liste publiée avec les résultats 2026-2027 comprend les ENCG d’**Agadir, Casablanca, Settat, El Jadida, Fès, Kénitra, Marrakech, Meknès, Oujda, Tanger et Dakhla**. Le même TAFEM sert pour toutes ; le classement et les vœux déterminent l’école d’affectation.' } ] },
      { id: 'conditions', h: "Conditions d'accès", blocks: [ { ul: ['Bac de l’année en **sciences économiques**, **sciences de gestion comptable**, **sciences mathématiques**, **sciences physiques** ou **SVT** (autres séries selon l’avis).', 'Note de présélection (75 % national + 25 % régional) au moins égale au seuil de la série.', 'Inscription sur **Cursus Sup** et classement des ENCG.'] } ] },
      { id: 'seuils', h: 'Seuils de présélection', blocks: [ { seuils: true } ] },
      { id: 'epreuve', h: 'Le test TAFEM', blocks: [
        { p: "Le TAFEM est un **QCM d'aptitudes de 100 questions** à quatre propositions (A à D), distribué en cahiers successifs : on n'ouvre une partie que lorsque l'examinateur l'annonce. Les sujets des sessions 2024 et 2025 suivent ce découpage :" },
        { table: { head: ['Partie', 'Questions', 'Durée indiquée', 'Ce qui est évalué'], rows: [['Compréhension et mémorisation', '20', '15 à 20 min de lecture, puis 15 min de questions', 'Deux articles de presse récents (climat, numérique, économie) à lire, puis questions de mémoire sur les chiffres, dates et noms, sans le texte'], ['Logique et raisonnement', '20', '50 à 60 min', 'Problèmes (âges, partages, vitesses, pourcentages), suites, codes à déchiffrer, logique des propositions, suffisance des données'], ['Culture générale', '30', '20 min', 'Maroc (institutions, histoire, économie, sport), actualité internationale, sciences, arts et littérature'], ['Langue française', '30', '20 min', 'Vocabulaire et antonymes, accords du participe passé, conjugaison, pronoms, discours indirect, voix passive, orthographe']] } },
        { callout: 'info', text: "L'examen blanc du site reprend les trois dernières parties (80 questions en 90 minutes). La partie mémorisation se travaille en lisant un article de presse pendant 15 minutes, puis en répondant de mémoire à des questions sur ses chiffres et ses noms." },
        { callout: 'warn', text: "Plusieurs sources de préparation signalent une **pénalité pour les réponses fausses** : elle n'est pas écrite sur les sujets publiés. Lisez la consigne de votre session avant de répondre au hasard." },
      ] },
      { id: 'calendrier', h: 'Calendrier habituel', blocks: [ { table: { head: ['Étape', 'Période', 'Repère'], rows: [['Inscriptions Cursus Sup', 'Mi-juin – début juillet', 'Juin–juillet 2026'], ['Seuils et convocations', 'Mi-juillet', '14 juillet 2026 annoncé pour les seuils'], ['TAFEM', 'Seconde quinzaine de juillet', 'Lundi 20 juillet 2026'], ['Résultats', 'Fin juillet – août', 'Été 2026']] } } ] },
      { id: 'preparation', h: 'Conseils', blocks: [ { ul: ['Travaillez la rapidité : beaucoup de questions courtes, peu de temps par question.', 'Révisez les pourcentages, les règles de trois et la lecture de tableaux.', 'Lisez l’actualité économique marocaine (inflation, croissance, grands projets) quelques semaines avant.', 'Entraînez la mémoire de travail avec des exercices de mémorisation de listes.'] }, { practice: true } ] },
    ],
    faq: [
      { q: 'Quel est le seuil ENCG ?', a: 'Pour 2025-2026, les seuils relayés étaient de 12/20 pour les sciences économiques et les sciences mathématiques, et de 14/20 pour les sciences physiques et la SVT (75 % national + 25 % régional).' },
      { q: 'Que contient le TAFEM ?', a: 'Aux sessions 2024 et 2025 : 100 questions à quatre propositions, en quatre parties : compréhension et mémorisation de deux articles (20 questions), logique et raisonnement (20), culture générale (30) et langue française (30).' },
      { q: 'Combien d’années dure l’ENCG ?', a: 'Cinq ans : trois années de tronc commun puis deux années de spécialisation en commerce ou en gestion, sanctionnées par le diplôme des ENCG.' },
    ],
  },
  ar: {
    short: 'ENCG (TAFEM)',
    name: 'المدارس الوطنية للتجارة والتسيير (ENCG) — مباراة TAFEM',
    title: 'مباراة ENCG (TAFEM) 2027: العتبات والاختبار والمدارس',
    description: 'مباراة TAFEM لولوج المدارس الوطنية للتجارة والتسيير: الشعب المقبولة، العتبات، محتوى الاختبار، المدارس والأجندة.',
    keywords: ['مباراة ENCG', 'TAFEM', 'المدرسة الوطنية للتجارة والتسيير'],
    intro: 'تكوّن **المدارس الوطنية للتجارة والتسيير** في **5 سنوات**. يتم الولوج عبر **اختبار TAFEM المشترك**: انتقاء أولي 75/25 ثم **اختبار كتابي** على شكل أسئلة متعددة الاختيارات.',
    facts: [['الدبلوم', 'دبلوم ENCG (باك+5)'], ['المدارس', '11 مدرسة'], ['عتبات 2025', 'اقتصاد 12 · رياضيات 12 · فيزياء/علوم الحياة 14']],
    sections: [
      { id: 'conditions', h: 'شروط الولوج', blocks: [ { ul: ['بكالوريا السنة الجارية: علوم اقتصادية، تدبير محاسباتي، علوم رياضية، علوم فيزيائية أو علوم الحياة والأرض.', 'نقطة انتقاء تساوي العتبة على الأقل.', 'التسجيل في Cursus Sup.'] } ] },
      { id: 'seuils', h: 'العتبات', blocks: [ { seuils: true } ] },
      { id: 'epreuve', h: 'اختبار TAFEM', blocks: [ { p: 'في دورتي 2024 و2025: 100 سؤال بأربعة اختيارات في أربعة أجزاء: فهم وتذكر مقالين صحفيين (20 سؤالًا)، المنطق والاستدلال (20)، الثقافة العامة (30) واللغة الفرنسية (30).' }, { practice: true } ] },
    ],
    faq: [ { q: 'ما هي عتبة ENCG؟', a: 'لموسم 2025-2026: 12/20 للعلوم الاقتصادية والرياضية و14/20 للعلوم الفيزيائية وعلوم الحياة والأرض.' } ],
  },
};

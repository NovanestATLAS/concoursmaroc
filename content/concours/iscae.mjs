export default {
  id: 'iscae',
  order: 42,
  group: 'commerce',
  level: 'postbac',
  type: 'public',
  icon: 'briefcase',
  bac: ['SM', 'PC', 'SVT', 'ECO', 'SGC'],
  seuils: { year: '2026', formula: null, rows: [], note: { fr: 'Présélection sur dossier selon les notes du bac ; pas de seuil national publié.', ar: 'انتقاء أولي بالملف حسب نقط البكالوريا؛ لا توجد عتبة وطنية منشورة.' } },
  age: { max: 21, ref: '12-31', at: { fr: 'au 31 décembre de l’année du concours (licence)', ar: 'في 31 دجنبر من سنة المباراة (الإجازة)' } },
  practice: {
    subjects: ['maths', 'anglais', 'culture', 'maroc', 'francais', 'economie'],
    // 2025 written tests: maths 2 h (coef. 2), English 1 h (coef. 1) and general
    // culture in French 1 h 30 (coef. 1, written essay, not a QCM). The mock covers
    // the two QCM papers with the scoring printed on the published maths paper.
    mock: { minutes: 180, sections: [{ subjects: ['maths'], count: 20 }, { subjects: ['anglais'], count: 20 }], scoring: { correct: 2, wrong: -1, blank: 0 }, official: false },
    difficulty: 'selectif',
  },
  related: ['encg-tafem', 'cpge', 'universite'],
  official: [{ label: 'Groupe ISCAE', url: 'https://www.iscae.ma' }],
  sources: [
    { title: 'Dreamjob — Inscription concours ISCAE 2026/2027', url: 'https://www.dreamjob.ma/etudiants/concours-iscae/', date: '2026-06' },
    { title: 'Capmission — Tout savoir sur le concours ISCAE', url: 'https://www.capmission.ma/concours-iscae', date: '2026' },
    { title: 'Tawjihnet — Concours licence ISCAE Casablanca 2026-2027', url: 'https://www.tawjihnet.net/bac-concours-licence-iscae-casablanca-2026-2027/', date: '2026-06' },
  ],
  fr: {
    short: 'ISCAE',
    name: "Institut Supérieur de Commerce et d'Administration des Entreprises (ISCAE Casablanca et Rabat)",
    title: 'Concours ISCAE 2027 : licence post-bac, conditions, épreuves et Grande École',
    description: "Accès à l'ISCAE après le bac (licence en gestion à Casablanca et Rabat) : bacs acceptés, âge maximum 21 ans, présélection, épreuves (maths, anglais, culture générale), entretiens et voie Grande École.",
    keywords: ['concours iscae', 'iscae licence', 'iscae casablanca', 'iscae rabat', 'école de commerce publique'],
    intro: "L'**ISCAE**, grande école publique de management, propose une **licence en gestion accessible après le bac** (Casablanca et Rabat) et un **Programme Grande École** accessible après deux années de prépa (ECS/ECT) ou un bac+2/3. Le concours licence combine **présélection, écrits et entretiens**.",
    facts: [['Voie post-bac', 'Licence en gestion'], ['Bacs', 'Économiques ou scientifiques'], ['Âge', '21 ans au plus au 31 décembre'], ['Épreuves', 'Maths (2 h, coef. 2), anglais (1 h), culture générale (1 h 30) + entretiens'], ['Préinscription 2026', '3 – 22 juin 2026 (relayé)']],
    sections: [
      { id: 'conditions', h: 'Conditions (licence)', blocks: [ { ul: ['Être en terminale ou titulaire du bac en série **économique ou scientifique** (les bacs lettres ne sont pas acceptés selon les guides).', 'Avoir **21 ans au plus au 31 décembre** de l’année du concours.', 'Se préinscrire en ligne et payer les frais de dossier (montant indiqué dans l’avis).'] } ] },
      { id: 'epreuves', h: 'Épreuves', blocks: [ { steps: ['**Présélection** sur les notes du baccalauréat.', '**Écrits** (session 2025, ISCAE Casablanca) : mathématiques, anglais et culture générale en langue française.', '**Entretiens** en français et en anglais pour les admissibles.'] }, { table: { head: ['Épreuve écrite', 'Durée', 'Coefficient', 'Format des sujets publiés'], rows: [['Mathématiques', '2 h', '2', '20 questions indépendantes à choix unique, sans calculatrice ; barème +2 / −1 / 0 ; suites, limites, intégrales, étude de fonctions, probabilités, systèmes'], ['Anglais', '1 h', '1', 'QCM : compréhension de textes, vocabulaire et grammaire (structure)'], ['Culture générale (en français)', '1 h 30', '1', 'Dissertation à partir d’un texte : argumentation et qualité de l’expression écrite']] } }, { p: "En 2025, les écrits ont eu lieu le 11 juillet ; en 2026, des sites spécialisés ont relayé une présélection publiée vers le 7 juillet et des écrits le 13 juillet. L'examen blanc du site reprend les deux épreuves en QCM (maths et anglais) avec le barème +2 / −1." } ] },
      { id: 'grande-ecole', h: 'Programme Grande École', blocks: [ { p: "Le PGE recrute surtout après les classes préparatoires économiques et commerciales (**ECS, ECT**) via le concours commun des écoles de management, et sur titre après un bac+2 ou bac+3. Voir notre guide [CPGE](@/concours/cpge/)." } ] },
      { id: 'preparation', h: 'Préparation', blocks: [ { ul: ['Anglais : grammaire, vocabulaire des affaires, compréhension écrite.', 'Maths : pourcentages, suites, probabilités, fonctions usuelles.', 'Entretien : savoir présenter son projet et suivre l’actualité économique.'] }, { practice: true } ] },
    ],
    faq: [ { q: 'Peut-on entrer à l’ISCAE après le bac ?', a: "Oui, par le concours d'accès à la licence en gestion (Casablanca et Rabat), ouvert aux bacheliers économiques et scientifiques de 21 ans au plus au 31 décembre." } ],
  },
  ar: {
    short: 'ISCAE',
    name: 'المعهد العالي للتجارة وإدارة المقاولات (ISCAE)',
    title: 'مباراة ISCAE 2027: الإجازة بعد البكالوريا، الشروط والاختبارات',
    description: 'ولوج المعهد العالي للتجارة وإدارة المقاولات بعد البكالوريا: الشعب، السن الأقصى 21 سنة، الانتقاء، الاختبارات والمقابلات.',
    keywords: ['ISCAE', 'المعهد العالي للتجارة وإدارة المقاولات'],
    intro: 'يقترح **ISCAE**، وهو مدرسة عمومية كبرى للتدبير، **إجازة في التسيير متاحة بعد البكالوريا** (الدار البيضاء والرباط) و**برنامج المدرسة الكبرى** المتاح بعد سنتين من الأقسام التحضيرية (ECS/ECT) أو بعد باك+2/3. وتجمع مباراة الإجازة بين **الانتقاء الأولي والاختبارات الكتابية والمقابلات**.',
    facts: [['المسلك بعد البكالوريا', 'إجازة في التسيير'], ['الشعب', 'اقتصادية أو علمية'], ['السن', '21 سنة على الأكثر في 31 دجنبر'], ['الاختبارات', 'رياضيات (ساعتان، المعامل 2)، إنجليزية (ساعة واحدة)، ثقافة عامة (ساعة ونصف) + مقابلات'], ['التسجيل القبلي 2026', '3 – 22 يونيو 2026 (متداول)']],
    sections: [
      { id: 'conditions', h: 'الشروط (الإجازة)', blocks: [ { ul: ['أن يكون المترشح في السنة النهائية أو حاصلًا على البكالوريا في شعبة **اقتصادية أو علمية** (شعب الآداب غير مقبولة حسب الأدلة).', 'ألا يتجاوز السن **21 سنة في 31 دجنبر** من سنة المباراة.', 'التسجيل القبلي عبر الإنترنت وأداء رسوم الملف (المبلغ مذكور في الإعلان).'] } ] },
      { id: 'epreuves', h: 'الاختبارات', blocks: [ { steps: ['**الانتقاء الأولي** على أساس نقط البكالوريا.', '**الاختبارات الكتابية** (دورة 2025، ISCAE الدار البيضاء): الرياضيات، الإنجليزية والثقافة العامة باللغة الفرنسية.', '**مقابلات** بالفرنسية والإنجليزية للمقبولين في الاختبار الكتابي.'] }, { table: { head: ['الاختبار الكتابي', 'المدة', 'المعامل', 'شكل المواضيع المنشورة'], rows: [['الرياضيات', 'ساعتان', '2', '20 سؤالًا مستقلًا بجواب واحد، بدون آلة حاسبة؛ سلم التنقيط +2 / −1 / 0؛ المتتاليات، النهايات، التكاملات، دراسة الدوال، الاحتمالات، النظمات'], ['الإنجليزية', 'ساعة واحدة', '1', 'أسئلة متعددة الاختيارات: فهم النصوص، المفردات والقواعد (البنية)'], ['الثقافة العامة (بالفرنسية)', 'ساعة ونصف', '1', 'إنشاء انطلاقًا من نص: الحجاج وجودة التعبير الكتابي']] } }, { p: 'في 2025 أُجريت الاختبارات الكتابية يوم 11 يوليوز؛ وفي 2026 تداولت مواقع متخصصة نشر نتائج الانتقاء الأولي في حدود 7 يوليوز وإجراء الاختبارات الكتابية يوم 13 يوليوز. ويعتمد الامتحان التجريبي في الموقع الاختبارين على شكل أسئلة متعددة الاختيارات (الرياضيات والإنجليزية) بسلم التنقيط +2 / −1.' } ] },
      { id: 'grande-ecole', h: 'برنامج المدرسة الكبرى', blocks: [ { p: 'يستقبل برنامج المدرسة الكبرى (PGE) أساسًا خريجي الأقسام التحضيرية الاقتصادية والتجارية (**ECS، ECT**) عبر المباراة المشتركة لمدارس التدبير، وكذا على أساس الشهادة بعد باك+2 أو باك+3. اطلع على دليلنا حول [الأقسام التحضيرية CPGE](@/concours/cpge/).' } ] },
      { id: 'preparation', h: 'التحضير', blocks: [ { ul: ['الإنجليزية: القواعد، مفردات عالم الأعمال، فهم المكتوب.', 'الرياضيات: النسب المئوية، المتتاليات، الاحتمالات، الدوال الاعتيادية.', 'المقابلة: القدرة على تقديم مشروعك وتتبع المستجدات الاقتصادية.'] }, { practice: true } ] },
    ],
    faq: [ { q: 'هل يمكن ولوج ISCAE بعد البكالوريا؟', a: 'نعم، عبر مباراة ولوج الإجازة في التسيير (الدار البيضاء والرباط)، المفتوحة في وجه حاملي البكالوريا الاقتصادية والعلمية الذين لا يتجاوز سنهم 21 سنة في 31 دجنبر.' } ],
  },
};

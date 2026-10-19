export default {
  id: 'ispits',
  order: 12,
  group: 'sante',
  level: 'postbac',
  type: 'public',
  icon: 'health',
  bac: ['SM', 'PC', 'SVT', 'AGRO', 'LET'],
  seuils: {
    year: '2026',
    formula: '75/25',
    rows: [],
    note: { fr: "Aucun seuil officiel publié : selon des sites d'orientation, les seuils varient selon la filière (souvent 13 à 15/20 pour les spécialités les plus demandées).", ar: 'لا توجد عتبة رسمية منشورة: تختلف العتبات حسب التخصص (غالبًا بين 13 و15/20 للتخصصات الأكثر طلبًا حسب مواقع التوجيه).' },
  },
  age: null,
  practice: {
    subjects: ['svt', 'chimie', 'physique', 'francais', 'culture'],
    mock: {
      minutes: 60,
      sections: [
        { subjects: ['svt'], count: 15 },
        { subjects: ['chimie', 'physique'], count: 15 },
        { subjects: ['francais'], count: 10 },
      ],
      scoring: { correct: 1, wrong: 0, blank: 0 },
      official: false,
    },
    difficulty: 'selectif',
  },
  related: ['medecine', 'erssm', 'est', 'ofppt'],
  official: [
    { label: 'Plateforme de préinscription ISPITS (Ministère de la Santé)', url: 'https://ispits.sante.gov.ma' },
    { label: 'Ministère de la Santé et de la Protection sociale', url: 'https://www.sante.gov.ma' },
  ],
  sources: [
    { title: 'Orientation Chabab — Concours ISPITS 2026-2027 : dates, conditions, lien officiel', url: 'https://orientation-chabab.com/actualite/inscription-concours-ispits', date: '2026-07' },
    { title: 'E-Tawjihi — Concours ISPITS 2026-2027 : filières et répartition des instituts', url: 'https://e-tawjihi.ma/annonces-concours/74-concours-ispits-2026-2027-inscription-conditions-filieres-et-repartition-des-instituts-institut-superieur-des-profession', date: '2026-07' },
    { title: 'Dreamjob — Inscription concours ISPITS 2026/2027', url: 'https://www.dreamjob.ma/orientation/inscription-concours-ispits-2026-2027/', date: '2026-07' },
  ],
  fr: {
    short: 'ISPITS (infirmiers)',
    name: 'Instituts Supérieurs des Professions Infirmières et Techniques de Santé (ISPITS)',
    title: 'Concours ISPITS 2027 : infirmier, sage-femme — conditions et épreuves',
    description: "Concours d'accès aux ISPITS : filières (infirmier polyvalent, sage-femme, kinésithérapie, radiologie…), bacs acceptés, présélection 75/25, épreuves, nombre de places et calendrier.",
    keywords: ['concours ispits', 'ispits', 'concours infirmier maroc', 'sage femme', 'kinésithérapie', 'ispits sante gov ma'],
    intro: "Les **ISPITS** forment en 3 ans (licence) les infirmiers, sages-femmes et techniciens de santé du secteur public. Le concours, ouvert aux bacheliers de l'année et de l'année précédente, combine une **présélection sur les notes du bac (75 % national + 25 % régional)** et une **épreuve écrite** ; près de **5 000 places** ont été annoncées pour 2026.",
    facts: [
      ['Diplôme', 'Licence (bac+3) en sciences infirmières et techniques de santé'],
      ['Bacs', 'Scientifiques ; Lettres pour certaines filières'],
      ['Présélection', '75 % national + 25 % régional'],
      ['Places 2026', '4 985 (relayé)'],
      ['Écrit 2026', '25 et 26 juillet 2026'],
      ['Inscription', 'ispits.sante.gov.ma'],
    ],
    sections: [
      {
        id: 'filieres',
        h: 'Filières proposées',
        blocks: [
          { table: {
            head: ['Domaine', 'Exemples de filières et options'],
            rows: [
              ['Soins infirmiers', 'Infirmier polyvalent, anesthésie-réanimation, santé mentale et psychiatrie, soins en néonatologie et pédiatrie, urgences et soins intensifs'],
              ['Sage-femme', 'Suivi de la grossesse, accouchement, santé maternelle et néonatale'],
              ['Techniques de santé', 'Kinésithérapie, imagerie médicale (radiologie), laboratoire, nutrition-diététique, orthophonie, orthoptie, psychomotricité…'],
              ['Action sociale', 'Assistant social (selon les instituts)'],
            ],
          } },
          { p: "Les filières et les places varient d'un institut à l'autre (Rabat, Casablanca, Fès, Marrakech, Agadir, Oujda, Tanger, Meknès, Béni Mellal, Laâyoune et d'autres villes). La liste de chaque session est publiée avec l'avis du concours." },
        ],
      },
      {
        id: 'conditions',
        h: "Conditions d'accès",
        blocks: [
          { ul: [
            "Être titulaire du baccalauréat de l'**année en cours ou de l'année précédente** (sessions 2025 ou 2026 pour le concours 2026).",
            "Avoir une série compatible avec la filière : bacs **scientifiques** (SVT, PC, SM, sciences agronomiques) pour la plupart des filières ; le bac **Lettres** est accepté pour certaines options (orthophonie, psychomotricité, assistant social) selon l'avis.",
            "Se préinscrire en ligne sur **ispits.sante.gov.ma** et imprimer le formulaire de préinscription.",
          ] },
        ],
      },
      { id: 'seuils', h: 'Présélection et seuils', blocks: [ { seuils: true }, { p: "La présélection classe les candidats selon la note 75 % national + 25 % régional, filière par filière. Seuls les présélectionnés passent l'écrit." } ] },
      {
        id: 'epreuves',
        h: 'Épreuves',
        blocks: [
          { p: "Les candidats présélectionnés passent une **épreuve écrite** portant sur les connaissances scientifiques du bac (biologie, physique-chimie) et, selon les filières, sur la langue et la culture générale. Les modalités exactes (nombre de questions, durée, coefficients) figurent dans l'avis de la session." },
          { callout: 'warn', text: "Le jour de l'écrit, la **CNIE** et le **formulaire de préinscription** sont obligatoires." },
        ],
      },
      {
        id: 'places',
        h: 'Places et débouchés',
        blocks: [
          { p: "Pour la session 2026, **4 985 places** ont été annoncées, réparties entre les instituts, filières et spécialités accréditées. Les lauréats travaillent dans les hôpitaux et centres de santé publics ou privés ; l'accès à l'emploi public se fait ensuite par concours de recrutement." },
        ],
      },
      {
        id: 'calendrier',
        h: 'Calendrier habituel',
        blocks: [
          { table: { head: ['Étape', 'Période habituelle', 'Repère 2026'], rows: [['Préinscription en ligne', 'Début juillet', 'Début juillet 2026'], ['Listes de présélection', 'Mi-juillet', 'Mi-juillet 2026'], ['Épreuve écrite', 'Fin juillet', '25 et 26 juillet 2026, à partir de 8 h 30'], ['Résultats', 'Août', 'Août 2026']] } },
        ],
      },
      {
        id: 'preparation',
        h: 'Conseils',
        blocks: [
          { ul: [
            'Classez soigneusement vos choix de filières et de villes : les seuils diffèrent fortement entre infirmier polyvalent, sage-femme ou kinésithérapie.',
            'Révisez la biologie humaine (immunologie, génétique, physiologie) et les bases de chimie : ce sont les points forts du programme.',
            'Entraînez-vous à la lecture rapide de consignes en français.',
          ] },
          { practice: true },
        ],
      },
    ],
    faq: [
      { q: 'Quels bacs sont acceptés à l’ISPITS ?', a: "Les bacs scientifiques pour la plupart des filières ; le bac Lettres pour certaines options (orthophonie, psychomotricité, assistant social), selon l'avis de chaque session." },
      { q: 'Combien de places à l’ISPITS ?', a: '4 985 places ont été annoncées pour la session 2026, réparties entre instituts et filières.' },
      { q: 'Peut-on candidater avec le bac de l’année précédente ?', a: "Oui, l'avis 2026 était ouvert aux bacheliers 2025 et 2026. Vérifiez la condition dans l'avis de votre session." },
    ],
  },
  ar: {
    short: 'ISPITS (التمريض)',
    name: 'المعاهد العليا للمهن التمريضية وتقنيات الصحة (ISPITS)',
    title: 'مباراة ISPITS 2027: التمريض والقبالة وتقنيات الصحة — الشروط والاختبارات',
    description: 'مباراة ولوج المعاهد العليا للمهن التمريضية وتقنيات الصحة: التخصصات، الشعب المقبولة، الانتقاء 75/25، الاختبارات، عدد المقاعد والأجندة.',
    keywords: ['مباراة التمريض', 'ISPITS', 'معاهد المهن التمريضية'],
    intro: 'تكوّن **المعاهد العليا للمهن التمريضية وتقنيات الصحة (ISPITS)** في 3 سنوات (إجازة) الممرضين والقابلات وتقنيي الصحة للقطاع العمومي. وتجمع المباراة، المفتوحة لحاملي بكالوريا السنة الجارية والسنة السابقة، بين **انتقاء أولي على أساس نقط البكالوريا (75% وطني + 25% جهوي)** و**اختبار كتابي**؛ وقد أُعلن عن حوالي **5000 مقعد** لدورة 2026.',
    facts: [
      ['الدبلوم', 'إجازة (باك+3) في علوم التمريض وتقنيات الصحة'],
      ['الشعب', 'علمية؛ الآداب لبعض التخصصات'],
      ['الانتقاء الأولي', '75% وطني + 25% جهوي'],
      ['مقاعد 2026', '4985 (متداول)'],
      ['الاختبار الكتابي 2026', '25 و26 يوليوز 2026'],
      ['التسجيل', 'ispits.sante.gov.ma'],
    ],
    sections: [
      {
        id: 'filieres',
        h: 'التخصصات المقترحة',
        blocks: [
          { table: {
            head: ['المجال', 'أمثلة على التخصصات والخيارات'],
            rows: [
              ['العلاجات التمريضية', 'ممرض متعدد الاختصاصات، التخدير والإنعاش، الصحة النفسية والطب النفسي، علاجات حديثي الولادة وطب الأطفال، المستعجلات والعناية المركزة'],
              ['القبالة', 'تتبع الحمل، الولادة، صحة الأم والمولود'],
              ['تقنيات الصحة', 'الترويض الطبي، التصوير الطبي (الأشعة)، المختبر، التغذية والحمية، تقويم النطق، تقويم البصر، العلاج النفسي الحركي…'],
              ['العمل الاجتماعي', 'مساعد اجتماعي (حسب المعاهد)'],
            ],
          } },
          { p: 'تختلف التخصصات والمقاعد من معهد إلى آخر (الرباط، الدار البيضاء، فاس، مراكش، أكادير، وجدة، طنجة، مكناس، بني ملال، العيون ومدن أخرى). وتُنشر لائحة كل دورة مع إعلان المباراة.' },
        ],
      },
      {
        id: 'conditions',
        h: 'شروط الولوج',
        blocks: [
          { ul: [
            'الحصول على البكالوريا **للسنة الجارية أو السنة السابقة** (دورتا 2025 أو 2026 بالنسبة لمباراة 2026).',
            'شعبة ملائمة للتخصص: البكالوريا **العلمية** (علوم الحياة والأرض، العلوم الفيزيائية، العلوم الرياضية، العلوم الزراعية) لأغلب التخصصات؛ وتُقبل بكالوريا **الآداب** لبعض الخيارات (تقويم النطق، العلاج النفسي الحركي، المساعدة الاجتماعية) حسب الإعلان.',
            'التسجيل القبلي عبر الإنترنت على **ispits.sante.gov.ma** وطباعة استمارة التسجيل القبلي.',
          ] },
        ],
      },
      { id: 'seuils', h: 'الانتقاء الأولي والعتبات', blocks: [ { seuils: true }, { p: 'يرتب الانتقاء الأولي المترشحين حسب نقطة 75% وطني + 25% جهوي، تخصصًا تخصصًا. ولا يجتاز الاختبار الكتابي إلا المنتقون.' } ] },
      {
        id: 'epreuves',
        h: 'الاختبارات',
        blocks: [
          { p: 'يجتاز المترشحون المنتقون **اختبارًا كتابيًا** يتناول المعارف العلمية للبكالوريا (البيولوجيا، الفيزياء والكيمياء)، وحسب التخصصات، اللغة والثقافة العامة. وترد الكيفيات الدقيقة (عدد الأسئلة، المدة، المعاملات) في إعلان الدورة.' },
          { callout: 'warn', text: 'يوم الاختبار الكتابي، **البطاقة الوطنية للتعريف الإلكترونية** و**استمارة التسجيل القبلي** إلزاميتان.' },
        ],
      },
      {
        id: 'places',
        h: 'المقاعد والآفاق',
        blocks: [
          { p: 'بالنسبة لدورة 2026، أُعلن عن **4985 مقعدًا**، موزعة بين المعاهد والمسالك والتخصصات المعتمدة. ويشتغل الخريجون في المستشفيات والمراكز الصحية العمومية أو الخاصة؛ ويتم الولوج إلى الوظيفة العمومية بعد ذلك عبر مباريات التوظيف.' },
        ],
      },
      {
        id: 'calendrier',
        h: 'الأجندة المعتادة',
        blocks: [
          { table: { head: ['المرحلة', 'الفترة المعتادة', 'مرجع 2026'], rows: [['التسجيل القبلي عبر الإنترنت', 'بداية يوليوز', 'بداية يوليوز 2026'], ['لوائح الانتقاء الأولي', 'منتصف يوليوز', 'منتصف يوليوز 2026'], ['الاختبار الكتابي', 'أواخر يوليوز', '25 و26 يوليوز 2026، ابتداءً من الساعة 8:30'], ['النتائج', 'غشت', 'غشت 2026']] } },
        ],
      },
      {
        id: 'preparation',
        h: 'نصائح',
        blocks: [
          { ul: [
            'رتّب اختياراتك من التخصصات والمدن بعناية: فالعتبات تختلف كثيرًا بين الممرض متعدد الاختصاصات والقبالة والترويض الطبي.',
            'راجع البيولوجيا البشرية (المناعة، الوراثة، الفيزيولوجيا) وأساسيات الكيمياء: فهي النقاط الأساسية في المقرر.',
            'تمرّن على القراءة السريعة للتعليمات باللغة الفرنسية.',
          ] },
          { practice: true },
        ],
      },
    ],
    faq: [
      { q: 'ما هي الشعب المقبولة في ISPITS؟', a: 'الشعب العلمية لأغلب التخصصات؛ وبكالوريا الآداب لبعض الخيارات (تقويم النطق، العلاج النفسي الحركي، المساعدة الاجتماعية)، حسب إعلان كل دورة.' },
      { q: 'كم عدد المقاعد في ISPITS؟', a: 'أُعلن عن 4985 مقعدًا لدورة 2026، موزعة بين المعاهد والتخصصات.' },
      { q: 'هل يمكن الترشح ببكالوريا السنة السابقة؟', a: 'نعم، كان إعلان 2026 مفتوحًا لحاملي بكالوريا 2025 و2026. تحقق من هذا الشرط في إعلان دورتك.' },
    ],
  },
};

export default {
  id: 'cpge',
  order: 24,
  group: 'ingenierie',
  level: 'postbac',
  type: 'public',
  icon: 'book',
  bac: ['SM', 'PC', 'STE', 'STM', 'ECO', 'SGC'],
  seuils: { year: '2026', formula: null, rows: [], note: { fr: "Pas de seuil national : admission sur dossier, au classement des moyennes et selon les quotas de places par série fixés chaque année.", ar: 'لا توجد عتبة وطنية: القبول بالملف حسب ترتيب المعدلات وحصص المقاعد حسب الشعب.' } },
  age: { max: 21, ref: '12-31', at: { fr: 'au 31 décembre de l’année d’entrée (selon les guides)', ar: 'في 31 دجنبر من سنة الولوج' } },
  practice: {
    subjects: ['maths', 'physique', 'chimie'],
    mock: { minutes: 90, sections: [{ subjects: ['maths'], count: 20 }, { subjects: ['physique', 'chimie'], count: 15 }], scoring: { correct: 1, wrong: 0, blank: 0 }, official: false },
  },
  related: ['cnc', 'ensa', 'ensam', 'iscae'],
  official: [
    { label: 'Portail des CPGE (inscription et listes)', url: 'https://www.cpge.ac.ma' },
    { label: "Ministère de l'Éducation nationale", url: 'https://www.men.gov.ma' },
  ],
  sources: [
    { title: 'cpge.ac.ma — Accès aux CPGE publiques', url: 'https://www.cpge.ac.ma/cpgepages/cont/accescpgepublics.aspx', date: '2026' },
    { title: 'E-Tawjihi — Résultats CPGE 2026-2027 : listes principales', url: 'https://e-tawjihi.ma/annonces-concours/70-resultats-cpge-2026-2027-publication-des-listes-principales-au-maroc-classes-preparatoires-grandes-ecoles', date: '2026-06' },
    { title: 'Bacguide — CPGE et CNC : intégrer une école d’ingénieurs', url: 'https://bacguide.ma/fr/cnc-cpge-maroc/', date: '2026' },
  ],
  fr: {
    short: 'CPGE (classes prépas)',
    name: 'Classes Préparatoires aux Grandes Écoles (CPGE)',
    title: 'CPGE Maroc 2027 : filières, conditions et inscription',
    description: "Classes préparatoires au Maroc : filières MPSI, PCSI, TSI, ECS et ECT, bacs acceptés, conditions de mention et d'âge, inscription sur cpge.ac.ma, listes d'attente et concours CNC/CNAEM.",
    keywords: ['cpge maroc', 'classes préparatoires', 'inscription cpge', 'mpsi', 'pcsi', 'tsi', 'ecs', 'ect', 'cpge.ac.ma'],
    intro: "Les **CPGE** préparent en deux ans aux concours des grandes écoles d'ingénieurs (via le **CNC**) et de commerce (via le **CNAEM**). L'admission se fait **sur dossier**, sans concours, au classement des moyennes du bac et selon des quotas par série, sur la plateforme **cpge.ac.ma**.",
    facts: [
      ['Durée', '2 ans, puis concours des grandes écoles'],
      ['Filières 1re année', 'MPSI, PCSI, TSI, ECS, ECT'],
      ['Sélection', 'Sur dossier (moyennes du bac)'],
      ['Mention', '« Assez bien » minimum, sauf SM, STE, STM (selon les guides)'],
      ['Âge', '21 ans au plus au 31 décembre (selon les guides)'],
      ['Inscription', 'cpge.ac.ma (juin)'],
    ],
    sections: [
      {
        id: 'filieres',
        h: 'Les filières et leurs débouchés',
        blocks: [
          { table: {
            head: ['1re année → 2e année', 'Bacs prioritaires', 'Concours de sortie'],
            rows: [
              ['MPSI → MP (ou PSI)', 'Sciences mathématiques (et une part de PC)', 'CNC : écoles d’ingénieurs (EMI, EHTP, ENSIAS, INPT, INSEA, ENSMR…)'],
              ['PCSI → PSI', 'Sciences physiques, sciences mathématiques', 'CNC'],
              ['TSI → TSI', 'Sciences et technologies électriques et mécaniques', 'CNC'],
              ['ECS', 'Sciences mathématiques', 'CNAEM : écoles de commerce et de management (ISCAE, ENCG en admission parallèle…)'],
              ['ECT', 'Sciences économiques, gestion comptable', 'CNAEM'],
            ],
          } },
          { p: "Les CPGE publiques sont réparties dans des lycées de nombreuses villes (internat possible selon les centres). Des CPGE privées existent aussi, avec frais de scolarité." },
        ],
      },
      {
        id: 'conditions',
        h: "Conditions d'admission",
        blocks: [
          { ul: [
            "Être bachelier de l'année dans une série correspondant à la filière demandée.",
            "Selon les guides publiés pour 2026 : mention **« Assez bien » au minimum**, sauf pour les bacs **SM, STE et STM**, et âge de **21 ans au plus au 31 décembre**.",
            'Classement sur la moyenne du bac et répartition des places par série selon les pourcentages fixés par la note ministérielle (ex. MPSI majoritairement réservée aux bacs SM).',
          ] },
          { callout: 'info', text: "Les CPGE n'ont **pas de seuil national unique** : chaque centre classe ses candidats. Les « seuils par ville » qui circulent sur internet sont des estimations." },
        ],
      },
      {
        id: 'procedure',
        h: 'Procédure et calendrier',
        blocks: [
          { steps: [
            "**Candidature en ligne** sur cpge.ac.ma juste après les résultats du bac (juin) : choix de la filière et des centres par ordre de préférence.",
            '**Listes principales** publiées fin juin (le 25 juin en 2026).',
            "**Confirmation et inscription** dans le centre d'affectation dans les délais indiqués.",
            "**Listes d'attente** et phase de sélection en présentiel en septembre, pour les places restantes (une centaine de places par an toutes filières confondues selon le portail officiel).",
          ] },
        ],
      },
      {
        id: 'reussir',
        h: 'Réussir en prépa',
        blocks: [
          { ul: [
            "Le rythme est intense : devoirs surveillés hebdomadaires, colles (interrogations orales) et programme dense.",
            "Les deux années préparent aux écrits du **CNC** (maths, physique, chimie, informatique, français, anglais) puis à l'oral du **TIPE**.",
            "Préparez l'été précédant l'entrée : révisez l'analyse (fonctions, suites, intégrales), les nombres complexes et la mécanique.",
          ] },
          { practice: true },
        ],
      },
    ],
    faq: [
      { q: 'Y a-t-il un concours pour entrer en CPGE ?', a: "Non. L'admission en CPGE publique se fait sur dossier, au classement des moyennes du bac, avec des quotas par série. Le concours vient à la fin des deux années (CNC ou CNAEM)." },
      { q: 'Quelle mention faut-il pour la prépa ?', a: "Les guides 2026 indiquent une mention « Assez bien » minimum, sauf pour les bacs sciences mathématiques, STE et STM. Vérifiez la note ministérielle publiée sur cpge.ac.ma." },
      { q: 'Peut-on intégrer une prépa avec un bac SVT ?', a: "Les filières MPSI, PCSI et TSI sont réservées en priorité aux bacs SM, PC et techniques. Pour un bac SVT, les voies les plus adaptées sont la médecine, les ENSA, l'IAV ou les FST." },
    ],
  },
  ar: {
    short: 'الأقسام التحضيرية',
    name: 'الأقسام التحضيرية للمدارس العليا (CPGE)',
    title: 'الأقسام التحضيرية بالمغرب 2027: المسالك والشروط والترشيح',
    description: 'الأقسام التحضيرية للمدارس العليا: مسالك MPSI وPCSI وTSI وECS وECT، الشعب المقبولة، شروط الميزة والسن، الترشيح عبر cpge.ac.ma ولوائح الانتظار.',
    keywords: ['الأقسام التحضيرية', 'CPGE'],
    intro: 'تحضّر **الأقسام التحضيرية** في سنتين لمباريات مدارس المهندسين (عبر **المباراة الوطنية المشتركة CNC**) ومدارس التسيير (عبر **CNAEM**). يتم القبول **بالملف** حسب ترتيب معدلات البكالوريا وحصص المقاعد، عبر منصة **cpge.ac.ma**.',
    facts: [['المدة', 'سنتان ثم مباريات المدارس الكبرى'], ['المسالك', 'MPSI، PCSI، TSI، ECS، ECT'], ['الانتقاء', 'بالملف'], ['الميزة', '«مستحسن» على الأقل باستثناء ع. رياضية والتقنية (حسب الأدلة)'], ['التسجيل', 'cpge.ac.ma (يونيو)']],
    sections: [
      { id: 'conditions', h: 'شروط القبول', blocks: [ { ul: ['الحصول على بكالوريا السنة الجارية في شعبة ملائمة للمسلك.', 'حسب أدلة 2026: ميزة **مستحسن** على الأقل باستثناء شعب العلوم الرياضية والعلوم والتكنولوجيات، وسن **21 سنة على الأكثر في 31 دجنبر**.', 'ترتيب حسب المعدل وتوزيع المقاعد حسب الشعب.'] } ] },
      { id: 'procedure', h: 'المسطرة والأجندة', blocks: [ { steps: ['**الترشيح الإلكتروني** على cpge.ac.ma بعد نتائج البكالوريا (يونيو).', '**اللوائح الرئيسية** في أواخر يونيو.', '**التسجيل** بمركز التعيين.', '**لوائح الانتظار** وانتقاء حضوري في شتنبر.'] } ] },
      { id: 'reussir', h: 'النجاح في الأقسام التحضيرية', blocks: [ { practice: true } ] },
    ],
    faq: [ { q: 'هل توجد مباراة لولوج الأقسام التحضيرية؟', a: 'لا، القبول بالملف حسب ترتيب معدلات البكالوريا. المباراة تأتي بعد السنتين (CNC أو CNAEM).' } ],
  },
};

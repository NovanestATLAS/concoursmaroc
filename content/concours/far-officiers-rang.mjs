export default {
  id: 'far-officiers-rang',
  order: 78,
  group: 'militaire',
  level: 'postbac',
  type: 'militaire',
  icon: 'anchor',
  bac: ['SM', 'PC', 'SVT', 'AGRO', 'STE', 'STM'],
  bacNote: { fr: 'Bac d’une filière scientifique (sessions 2024, 2025 ou 2026 pour le concours 2026)', ar: 'بكالوريا شعبة علمية (دورات 2024 أو 2025 أو 2026 لمباراة 2026)' },
  seuils: { year: '2026', formula: 'moyenne', rows: [], note: { fr: 'Présélection sur la moyenne générale du bac ; voie ISTA : sur la moyenne des deux années de formation.', ar: 'انتقاء أولي على المعدل العام للبكالوريا؛ مسلك ISTA: على معدل سنتي التكوين.' } },
  age: { min: 18, max: 23, ref: '08-16', at: { fr: 'au 16 août de l’année du concours', ar: 'في 16 غشت من سنة المباراة' } },
  height: { m: 1.70, f: 1.60 },
  practice: {
    subjects: ['logique', 'maths', 'physique', 'francais', 'culture'],
    // Psychotechnical tests and interview: no written knowledge exam (indicative format).
    mock: { minutes: 35, sections: [{ subjects: ['logique'], count: 20 }, { subjects: ['maroc', 'culture'], count: 10 }], scoring: { correct: 1, wrong: 0, blank: 0 }, official: false },
    difficulty: 'standard',
  },
  related: ['ern', 'era', 'arm', 'gendarmerie'],
  official: [{ label: 'Portail de recrutement des Forces Armées Royales', url: 'https://recrutement.far.ma' }],
  sources: [
    { title: 'Etudiant.ma — Concours d’accès au cycle des élèves officiers du rang de la Marine Royale 2026-2027', url: 'https://www.etudiant.ma/concours/concours-daccs-au-cycle-des-lves-officiers-du-rang-de-la-marine-royale-2026-2027', date: '2026' },
    { title: '9rayti — Concours Marine Royale 2026 : élèves officiers du rang (ISTA)', url: 'https://www.9rayti.com/concoursa/concours-marine-royale-2026-admission-des-eleves-officiers-du-rang-ista', date: '2026' },
    { title: 'Dreamjob.ma — Concours de recrutement officiers du rang FAR 2026', url: 'https://www.dreamjob.ma/emploi-public/concours-de-recrutement-officiers-du-rang-far-2026/', date: '2026' }
  ],
  fr: {
    short: 'Officiers du rang FAR (Marine – CIMR, Air)',
    name: 'Élèves officiers du rang des FAR (ODR) — Marine Royale (CIMR), Forces Royales Air, Armée de Terre',
    title: 'Concours officiers du rang FAR 2027 : Marine Royale (CIMR), Forces Royales Air — conditions',
    description: 'Concours des élèves officiers du rang (ODR) des Forces Armées Royales : Marine Royale (Centre d’Instruction de la Marine Royale, CIMR), Forces Royales Air et Armée de Terre. Bac scientifique, 18–23 ans, taille, présélection, inscription sur recrutement.far.ma.',
    keywords: ['officiers du rang', 'odr', 'cimr', 'centre d instruction de la marine royale', 'marine royale', 'forces royales air', 'aviation', 'armée de l air', 'école royale de l air', 'sous-officiers', 'far', 'recrutement far', 'ista'],
    intro: "Les **Forces Armées Royales** recrutent chaque année des **élèves officiers du rang** (« ODR ») pour la **Marine Royale** — formés au **Centre d’Instruction de la Marine Royale (CIMR)** à Casablanca —, les **Forces Royales Air** et l’**Armée de Terre**. Ce concours est distinct de ceux des écoles d’officiers ([École Royale Navale](@/concours/ern/), [École Royale de l’Air](@/concours/era/), [ARM Meknès](@/concours/arm/)) : il est ouvert aux bacheliers **scientifiques de 18 à 23 ans**.",
    facts: [['Bac', 'Filière scientifique (sessions 2024 à 2026)'], ['Âge', '18 à 23 ans au 16 août 2026'], ['Taille', '1,70 m (garçons) · 1,60 m (filles)'], ['Inscription', 'En ligne sur recrutement.far.ma'], ['Candidature 2026', 'Jusqu’au 29 mai 2026']],
    sections: [
      { id: 'conditions', h: 'Conditions', blocks: [ { ul: ['Nationalité marocaine, célibataire, sans antécédents judiciaires.', '**18 à 23 ans au 16 août** de l’année du concours (avis 2026).', '**Baccalauréat d’une filière scientifique**, sessions 2024, 2025 ou 2026 pour le concours 2026.', 'Taille minimale **1,70 m** (garçons) et **1,60 m** (filles) ; aptitude physique, et pour la Marine Royale **aptitude au service en milieu maritime**.', 'Voie **ISTA** : la Marine Royale et l’Armée de Terre ouvrent aussi un concours aux lauréats des ISTA, présélectionnés sur la moyenne de leurs deux années de formation.'] } ] },
      { id: 'epreuves', h: 'Sélection', blocks: [ { steps: ['Inscription en ligne sur **recrutement.far.ma** (une seule candidature par voie, dans les délais de l’avis).', 'Présélection sur la **moyenne générale du bac**.', 'Concours : examens médicaux, épreuves physiques et psychotechniques, puis entretien, selon l’avis de chaque armée.'] }, { practice: true } ] },
      { id: 'calendrier', h: 'Calendrier', blocks: [ { p: 'En 2026, l’inscription était ouverte **jusqu’au 29 mai 2026**, en même temps que les concours des écoles d’officiers. Le prochain avis est attendu au printemps 2027 : seul l’avis publié sur recrutement.far.ma fait foi (dates, filières, nombre de places, centre de formation).' } ] },
    ],
    faq: [
      { q: 'Quelle différence entre officier du rang et élève officier ?', a: 'Les écoles d’officiers (École Royale Navale, École Royale de l’Air, ARM) recrutent des bacheliers de 18 à 20–22 ans pour des cycles d’officiers ; le concours des officiers du rang est une voie distincte, ouverte aux bacheliers scientifiques de 18 à 23 ans, avec sa propre formation (au CIMR pour la Marine Royale).' },
      { q: 'Où s’inscrire ?', a: 'Uniquement en ligne, sur le portail officiel recrutement.far.ma, pendant la période indiquée par l’avis.' },
    ],
  },
  ar: {
    short: 'الضباط الصف بالقوات المسلحة الملكية (البحرية، الجو)',
    name: 'التلاميذ ضباط الصف بالقوات المسلحة الملكية — البحرية الملكية (CIMR)، القوات الملكية الجوية، القوات البرية',
    title: 'مباراة ضباط الصف بالقوات المسلحة الملكية 2027: البحرية الملكية والقوات الجوية — الشروط',
    description: 'مباراة ولوج سلك التلاميذ ضباط الصف بالقوات المسلحة الملكية: البحرية الملكية (مركز تكوين البحرية الملكية CIMR)، القوات الملكية الجوية والقوات البرية. بكالوريا علمية، 18–23 سنة، القامة، الانتقاء، التسجيل عبر recrutement.far.ma.',
    keywords: ['ضباط الصف', 'البحرية الملكية', 'القوات الملكية الجوية', 'القوات المسلحة الملكية', 'مركز تكوين البحرية الملكية', 'التجنيد'],
    intro: 'تنظم **القوات المسلحة الملكية** كل سنة مباراة **التلاميذ ضباط الصف** لفائدة **البحرية الملكية** — بمركز تكوين البحرية الملكية (CIMR) بالدار البيضاء — و**القوات الملكية الجوية** و**القوات البرية**، لحاملي **بكالوريا علمية** من **18 إلى 23 سنة**. وهي مباراة مختلفة عن مباريات مدارس الضباط (المدرسة الملكية البحرية، المدرسة الملكية الجوية، الأكاديمية الملكية العسكرية).',
    facts: [['البكالوريا', 'شعبة علمية (دورات 2024 إلى 2026)'], ['السن', '18 إلى 23 سنة في 16 غشت 2026'], ['القامة', '1.70 م (ذكور) · 1.60 م (إناث)'], ['التسجيل', 'عبر recrutement.far.ma']],
    sections: [
      { id: 'conditions', h: 'الشروط', blocks: [ { ul: ['الجنسية المغربية، أعزب/عزباء، دون سوابق قضائية.', 'من 18 إلى 23 سنة في 16 غشت من سنة المباراة.', 'بكالوريا شعبة علمية (دورات 2024 أو 2025 أو 2026 لمباراة 2026).', 'القامة 1.70 م للذكور و1.60 م للإناث، واللياقة البدنية، والقدرة على العمل في الوسط البحري بالنسبة للبحرية الملكية.'] } ] },
      { id: 'epreuves', h: 'الانتقاء', blocks: [ { steps: ['التسجيل عبر الإنترنت في recrutement.far.ma داخل الآجال.', 'انتقاء أولي على المعدل العام للبكالوريا.', 'فحوص طبية واختبارات بدنية وسيكوتقنية ثم مقابلة حسب إعلان كل قوة.'] }, { practice: true } ] },
    ],
    faq: [],
  },
};

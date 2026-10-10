/* Shared vocabularies: concours groups, bac series, practice subjects. */

export const GROUPS = [
  { id: 'sante', icon: 'health', fr: 'Santé', ar: 'الصحة', frLong: 'Médecine, pharmacie et santé', arLong: 'الطب والصيدلة والصحة' },
  { id: 'ingenierie', icon: 'gear2', fr: 'Ingénierie et sciences', ar: 'الهندسة والعلوم', frLong: 'Écoles d’ingénieurs, prépas et technologie', arLong: 'مدارس المهندسين والأقسام التحضيرية والتكنولوجيا' },
  { id: 'commerce', icon: 'briefcase', fr: 'Commerce et gestion', ar: 'التجارة والتسيير', frLong: 'Écoles de commerce et de management', arLong: 'مدارس التجارة والتسيير' },
  { id: 'architecture-arts', icon: 'building', fr: 'Architecture, arts et médias', ar: 'الهندسة المعمارية والفنون والإعلام', frLong: 'Architecture, journalisme, cinéma, théâtre, tourisme', arLong: 'الهندسة المعمارية، الصحافة، السينما، المسرح، السياحة' },
  { id: 'enseignement', icon: 'book', fr: 'Enseignement', ar: 'التربية والتعليم', frLong: 'Devenir enseignant', arLong: 'مهن التدريس' },
  { id: 'militaire', icon: 'medal', fr: 'Écoles militaires', ar: 'المدارس العسكرية', frLong: 'Officiers des Forces Armées Royales', arLong: 'ضباط القوات المسلحة الملكية' },
  { id: 'securite', icon: 'shield', fr: 'Sécurité et fonction publique', ar: 'الأمن والوظيفة العمومية', frLong: 'Police, gendarmerie, forces auxiliaires, protection civile, administration', arLong: 'الشرطة، الدرك، القوات المساعدة، الوقاية المدنية، الإدارة' },
  { id: 'formation', icon: 'wrench', fr: 'Formation professionnelle et numérique', ar: 'التكوين المهني والرقمي', frLong: 'OFPPT, BTS, écoles du numérique, université', arLong: 'مكتب التكوين المهني، شهادة التقني العالي، مدارس الرقميات، الجامعة' },
];

/* Bac series codes used by the orientation tools. */
export const BAC = [
  { id: 'SM', fr: 'Sciences Mathématiques (A/B)', ar: 'العلوم الرياضية (أ/ب)' },
  { id: 'PC', fr: 'Sciences Physiques (PC)', ar: 'العلوم الفيزيائية' },
  { id: 'SVT', fr: 'Sciences de la Vie et de la Terre (SVT)', ar: 'علوم الحياة والأرض' },
  { id: 'AGRO', fr: 'Sciences Agronomiques', ar: 'العلوم الزراعية' },
  { id: 'STE', fr: 'Sciences et Technologies Électriques (STE)', ar: 'العلوم والتكنولوجيات الكهربائية' },
  { id: 'STM', fr: 'Sciences et Technologies Mécaniques (STM)', ar: 'العلوم والتكنولوجيات الميكانيكية' },
  { id: 'ECO', fr: 'Sciences Économiques', ar: 'العلوم الاقتصادية' },
  { id: 'SGC', fr: 'Sciences de Gestion Comptable', ar: 'علوم التدبير المحاسباتي' },
  { id: 'LET', fr: 'Lettres', ar: 'الآداب' },
  { id: 'SH', fr: 'Sciences Humaines', ar: 'العلوم الإنسانية' },
  { id: 'ORIG', fr: 'Enseignement originel', ar: 'التعليم الأصيل' },
  { id: 'ARTS', fr: 'Arts appliqués', ar: 'الفنون التطبيقية' },
  { id: 'PRO', fr: 'Bac professionnel', ar: 'البكالوريا المهنية' },
];

export const BAC_SHORT = {
  SM: { fr: 'SM A/B', ar: 'ع. رياضية' },
  PC: { fr: 'PC', ar: 'ع. فيزيائية' },
  SVT: { fr: 'SVT', ar: 'ع. الحياة والأرض' },
  AGRO: { fr: 'Agronomie', ar: 'ع. زراعية' },
  STE: { fr: 'STE', ar: 'ع.ت. كهربائية' },
  STM: { fr: 'STM', ar: 'ع.ت. ميكانيكية' },
  ECO: { fr: 'Éco', ar: 'ع. اقتصادية' },
  SGC: { fr: 'Gestion comptable', ar: 'تدبير محاسباتي' },
  LET: { fr: 'Lettres', ar: 'آداب' },
  SH: { fr: 'Sciences humaines', ar: 'علوم إنسانية' },
  ORIG: { fr: 'Originel', ar: 'أصيل' },
  ARTS: { fr: 'Arts appliqués', ar: 'فنون تطبيقية' },
  PRO: { fr: 'Bac pro', ar: 'باك مهني' },
};

/* Practice subjects (question banks). `bank` = file under data/questions. */
export const SUBJECTS = [
  { id: 'maroc', fr: 'Maroc : histoire, géographie, institutions', ar: 'المغرب: التاريخ والجغرافيا والمؤسسات', short: { fr: 'Maroc', ar: 'المغرب' }, slug: 'culture-generale-maroc' },
  { id: 'culture', fr: 'Culture générale et actualité du monde', ar: 'الثقافة العامة', short: { fr: 'Culture générale', ar: 'ثقافة عامة' }, slug: 'culture-generale' },
  { id: 'logique', fr: 'Logique et tests psychotechniques', ar: 'المنطق والاختبارات السيكوتقنية', short: { fr: 'Logique', ar: 'المنطق' }, slug: 'tests-psychotechniques-logique' },
  { id: 'calcul', fr: 'Raisonnement numérique et calcul', ar: 'الاستدلال العددي والحساب', short: { fr: 'Calcul', ar: 'الحساب' }, slug: 'calcul-raisonnement-numerique' },
  { id: 'maths', fr: 'Mathématiques (niveau bac)', ar: 'الرياضيات (مستوى البكالوريا)', short: { fr: 'Maths', ar: 'الرياضيات' }, slug: 'mathematiques-bac' },
  { id: 'physique', fr: 'Physique (niveau bac)', ar: 'الفيزياء (مستوى البكالوريا)', short: { fr: 'Physique', ar: 'الفيزياء' }, slug: 'physique-bac' },
  { id: 'chimie', fr: 'Chimie (niveau bac)', ar: 'الكيمياء (مستوى البكالوريا)', short: { fr: 'Chimie', ar: 'الكيمياء' }, slug: 'chimie-bac' },
  { id: 'svt', fr: 'SVT : biologie et géologie (niveau bac)', ar: 'علوم الحياة والأرض (مستوى البكالوريا)', short: { fr: 'SVT', ar: 'ع. الحياة والأرض' }, slug: 'svt-biologie' },
  { id: 'francais', fr: 'Langue française', ar: 'اللغة الفرنسية', short: { fr: 'Français', ar: 'الفرنسية' }, slug: 'francais' },
  { id: 'arabe', fr: 'Langue arabe', ar: 'اللغة العربية', short: { fr: 'Arabe', ar: 'العربية' }, slug: 'langue-arabe' },
  { id: 'anglais', fr: 'Anglais', ar: 'اللغة الإنجليزية', short: { fr: 'Anglais', ar: 'الإنجليزية' }, slug: 'anglais' },
  { id: 'economie', fr: 'Économie et gestion', ar: 'الاقتصاد والتسيير', short: { fr: 'Éco-gestion', ar: 'الاقتصاد' }, slug: 'economie-gestion' },
  { id: 'sciences', fr: 'Sciences générales, numérique et administration', ar: 'العلوم العامة والرقميات والإدارة', short: { fr: 'Sciences & admin.', ar: 'علوم وإدارة' }, slug: 'sciences-numerique-administration' },
  { id: 'secourisme', fr: 'Secourisme et sécurité', ar: 'الإسعافات الأولية والسلامة', short: { fr: 'Secourisme', ar: 'الإسعاف' }, slug: 'secourisme-premiers-secours' },
  { id: 'architecture', fr: 'Architecture, art et perception', ar: 'الهندسة المعمارية والفن والإدراك', short: { fr: 'Archi & art', ar: 'معمار وفن' }, slug: 'architecture-art' },
  { id: 'securite', fr: 'Sécurité, institutions et citoyenneté', ar: 'الأمن والمؤسسات والمواطنة', short: { fr: 'Sécurité & citoyenneté', ar: 'الأمن والمواطنة' }, slug: 'securite-citoyennete' },
  { id: 'defense', fr: 'Défense et culture militaire', ar: 'الدفاع والثقافة العسكرية', short: { fr: 'Culture militaire', ar: 'الثقافة العسكرية' }, slug: 'culture-militaire-far' },
  { id: 'education', fr: 'Système éducatif et pédagogie', ar: 'المنظومة التربوية والبيداغوجيا', short: { fr: 'Éducation & pédagogie', ar: 'التربية والبيداغوجيا' }, slug: 'systeme-educatif-pedagogie' },
];

export const LANGUAGE_SUBJECTS = ['francais', 'arabe', 'anglais'];

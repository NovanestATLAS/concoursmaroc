export default {
  id: 'ensa',
  order: 20,
  group: 'ingenierie',
  level: 'postbac',
  type: 'public',
  icon: 'gear2',
  bac: ['SM', 'PC', 'SVT', 'STE', 'STM', 'PRO'],
  seuils: {
    year: '2025',
    formula: '75/25',
    rows: [['SM', 12], ['PC', 14], ['SVT', 15], ['STE', 15], ['STM', 15], ['PRO', 15]],
  },
  age: null,
  platform: { label: 'cursussup.gov.ma', url: 'https://www.cursussup.gov.ma' },
  practice: {
    subjects: ['maths', 'physique', 'chimie'],
    mock: {
      minutes: 180,
      sections: [
        { subjects: ['maths'], count: 20 },
        { subjects: ['physique', 'chimie'], count: 20 },
      ],
      scoring: { correct: 2, wrong: -1, blank: 0 },
      official: true,
    },
    difficulty: 'selectif',
  },
  related: ['ensam', 'cpge', 'fst', 'est', 'medecine'],
  official: [
    { label: 'Cursus Sup — plateforme nationale des candidatures', url: 'https://www.cursussup.gov.ma' },
    { label: "Ministère de l'Enseignement supérieur (MESRSI)", url: 'https://www.enssup.gov.ma' },
  ],
  sources: [
    { title: 'ENSA Kénitra — Avis aux candidats convoqués au concours d’accès aux ENSA 2026-2027 (consignes, barème)', url: 'https://ensa.uit.ac.ma/avis-aux-candidats-convoques-au-concours-dacces-aux-ensa-26-27-ensa-kenitra/', date: '2026-07' },
    { title: 'ENSA Marrakech — Consignes du concours commun du réseau des ENSA 2026-2027 (PDF)', url: 'https://ensa-marrakech.uca.ma/wp-content/uploads/2026/07/Consignes_2026_2027.pdf', date: '2026-07' },
    { title: 'ENSA Béni Mellal — Concours commun du réseau des ENSA 2026/2027', url: 'https://ensabm.usms.ac.ma/concours-commun-du-reseau-des-ensas-au-titre-delannee-universitaire-2026-2027/', date: '2026-07' },
    { title: 'Tawjihnet — Seuils de présélection ENSA 2025-2026', url: 'https://www.tawjihnet.net/bac-preselection-ensa-maroc-2025-2026/', date: '2025-07' },
  ],
  calendar: [
    { key: 'inscription', month: [6, 7], last: '2026-07' },
    { key: 'ecrit', month: [7], last: '2026-07-22' },
    { key: 'resultats', month: [7, 8], last: '2026-07' },
  ],
  fr: {
    short: 'ENSA',
    name: 'Écoles Nationales des Sciences Appliquées (ENSA)',
    title: 'Concours ENSA 2027 : seuils, épreuves, barème et préparation',
    description: "Concours commun des 13 ENSA du Maroc : bacs acceptés, seuils de présélection, format QCM (maths, physique-chimie), barème, calendrier et QCM d'entraînement corrigés.",
    keywords: ['concours ensa', 'seuil ensa', 'ensa maroc', 'concours commun ensa', 'qcm ensa', 'ensa cursussup', 'école ingénieur post bac'],
    intro: "Les ENSA forment des **ingénieurs d'État en 5 ans** juste après le bac : 2 années de cycle préparatoire intégré, puis 3 années de cycle ingénieur. L'accès en 1re année se fait par un **concours commun national** organisé pour les 13 écoles du réseau, avec une présélection sur les notes du bac puis une épreuve écrite en QCM.",
    facts: [
      ['Diplôme', "Ingénieur d'État (bac+5)"],
      ['Écoles', '13 ENSA publiques'],
      ['Bacs acceptés', 'SM, PC, SVT, STE, STM (+ certains bacs pro)'],
      ['Sélection', 'Présélection (notes du bac) + QCM écrit'],
      ['Épreuve 2026', '40 QCM en 3 h, sans calculatrice'],
      ['Inscription', 'Cursus Sup (juin–juillet)'],
    ],
    sections: [
      {
        id: 'ecoles',
        h: 'Les 13 ENSA du réseau',
        blocks: [
          { p: "Le réseau compte 13 écoles rattachées aux universités publiques. Un seul concours permet de classer ses vœux entre toutes les ENSA ; l'affectation dépend du rang obtenu et des places de chaque école." },
          { ul: ['ENSA Tanger, ENSA Tétouan, ENSA Al Hoceima', 'ENSA Oujda, ENSA Fès, ENSA Kénitra', 'ENSA Khouribga, ENSA Béni Mellal, ENSA Berrechid, ENSA El Jadida', 'ENSA Safi, ENSA Marrakech, ENSA Agadir'] },
          { p: "Les filières du cycle ingénieur (génie informatique, génie civil, génie électrique, génie industriel, réseaux et télécoms, data, etc.) varient d'une école à l'autre : comparez-les avant de classer vos choix." },
        ],
      },
      {
        id: 'conditions',
        h: "Conditions d'accès",
        blocks: [
          { ul: [
            "Être titulaire d'un baccalauréat de l'année (la session est précisée dans l'avis) dans une série scientifique ou technique : **Sciences Mathématiques A ou B, Sciences Physiques, SVT, STE, STM**, et certains bacs professionnels.",
            "Avoir une moyenne de présélection au moins égale au **seuil fixé pour sa série** (voir ci-dessous).",
            "S'inscrire dans les délais sur la plateforme nationale **Cursus Sup** et classer ses écoles par ordre de préférence.",
          ] },
          { callout: 'info', text: "La moyenne de présélection se calcule ainsi : **75 % de la note de l'examen national + 25 % de la note de l'examen régional**. Le contrôle continu n'entre pas dans ce calcul. Utilisez notre [calculateur de note de présélection](@/outils/calcul-note-bac/)." },
        ],
      },
      {
        id: 'seuils',
        h: 'Seuils de présélection',
        blocks: [
          { seuils: true },
          { p: "Le seuil est la note minimale pour être convoqué à l'écrit ; il ne garantit pas l'admission. Il est fixé chaque année selon le nombre de candidats et de places : un seuil peut monter ou baisser d'une session à l'autre." },
        ],
      },
      {
        id: 'epreuves',
        h: 'Déroulement et épreuves du concours',
        blocks: [
          { steps: [
            "**Inscription sur Cursus Sup** : création du compte, saisie des notes du bac, choix et classement des ENSA.",
            "**Présélection** : la liste des candidats convoqués est publiée sur Cursus Sup avec la convocation à imprimer.",
            "**Épreuve écrite (QCM)** : d'après les consignes 2026, deux épreuves en **3 heures au total** : 20 questions de mathématiques (Q1 à Q20) et 20 questions de physique-chimie (Q21 à Q40), de coefficient 1 chacune.",
            "**Classement et affectation** : selon le score et vos vœux, avec liste principale puis listes d'attente.",
          ] },
          { table: {
            head: ['Élément', 'Session 2026 (consignes officielles)'],
            rows: [
              ['Durée', '3 heures pour les deux épreuves'],
              ['Questions', '40 QCM : 20 maths + 20 physique-chimie'],
              ['Barème indiqué', '+2 bonne réponse, −1 réponse fausse, 0 sans réponse'],
              ['Calculatrice', 'Interdite'],
              ['À apporter', 'Convocation + CNIE ou passeport originaux'],
              ['Arrivée', 'Environ 1 h 30 avant le début'],
            ],
          } },
          { callout: 'warn', text: "Avec un barème négatif, répondre au hasard fait perdre des points en moyenne. Ne répondez que si vous avez éliminé au moins une ou deux propositions. Testez votre stratégie avec le [simulateur de barème QCM](@/outils/simulateur-qcm/)." },
        ],
      },
      {
        id: 'programme',
        h: 'Programme à réviser',
        blocks: [
          { p: "Le QCM porte sur le programme de 2e année du bac (sciences mathématiques et sciences expérimentales). Les questions demandent surtout de la rapidité de calcul sans calculatrice et une bonne maîtrise des méthodes classiques." },
          { table: {
            head: ['Matière', 'Chapitres les plus utiles'],
            rows: [
              ['Mathématiques', 'Limites et continuité, dérivation, études de fonctions, logarithme et exponentielle, suites, intégrales, nombres complexes, probabilités, équations différentielles, géométrie dans l’espace'],
              ['Physique', 'Ondes, décroissance radioactive, dipôles RC et RL, circuit RLC, lois de Newton, chute libre et projectiles, oscillateurs, satellites'],
              ['Chimie', 'Cinétique, équilibre et taux d’avancement, acides-bases et pH, dosages, piles et électrolyse, estérification-hydrolyse'],
            ],
          } },
        ],
      },
      {
        id: 'places',
        h: 'Places et nombre de candidats',
        blocks: [
          { p: "Le nombre de places est publié chaque année par école et par filière de bac. Pour la session 2026-2027, des sites d'orientation ont relayé un total d'environ **4 390 places** pour l'ensemble du réseau (chiffre non confirmé par un communiqué officiel). Les candidats inscrits se comptent en dizaines de milliers, d'où des seuils élevés pour les bacs PC et SVT." },
        ],
      },
      {
        id: 'calendrier',
        h: 'Calendrier habituel',
        blocks: [
          { table: {
            head: ['Étape', 'Période habituelle', 'Repère session 2026'],
            rows: [
              ['Inscriptions Cursus Sup', 'Mi-juin à début juillet', 'Juin–juillet 2026'],
              ['Résultats de présélection', 'Mi-juillet', 'Mi-juillet 2026'],
              ['Épreuve écrite', 'Fin juillet', 'Mercredi 22 juillet 2026, 9 h'],
              ['Résultats et inscriptions', 'Fin juillet – septembre', 'Inscription des admis au 1er choix : 28, 29 et 31 juillet 2026'],
            ],
          } },
          { p: "Pour la session 2027, attendez-vous à un calendrier proche. Activez un rappel depuis notre [calendrier des concours](@/outils/calendrier-concours/)." },
        ],
      },
      {
        id: 'preparation',
        h: 'Conseils de préparation',
        blocks: [
          { ul: [
            "Révisez le programme de 2e bac en priorité : un QCM ENSA ne demande pas de notions hors programme.",
            "Entraînez-vous **sans calculatrice** : calcul mental, fractions, puissances, valeurs usuelles (ln 2 ≈ 0,69 ; √2 ≈ 1,41 ; e ≈ 2,72).",
            "Chronométrez-vous : 40 questions en 180 minutes laissent environ 4 min 30 par question, relecture comprise.",
            "Faites au moins 3 examens blancs complets dans les conditions réelles avec le barème +2/−1.",
            "Préparez la vérification des réponses par élimination : ordres de grandeur, unités, cas particuliers (n = 0, x = 0).",
          ] },
          { practice: true },
        ],
      },
      {
        id: 'autres-voies',
        h: 'Autres voies pour entrer dans une ENSA',
        blocks: [
          { p: "Le cycle ingénieur des ENSA (3e année) recrute aussi des étudiants de niveau bac+2 : élèves des classes préparatoires via le **Concours National Commun (CNC)** et titulaires de DEUG, DUT ou diplômes équivalents via des concours sur titre propres à chaque école. Voir nos guides [CPGE](@/concours/cpge/) et [CNC](@/concours/cnc/)." },
        ],
      },
    ],
    faq: [
      { q: 'Quel est le seuil ENSA ?', a: "Pour la session 2025, les seuils relayés étaient de 12/20 pour SM, 14/20 pour PC, 15/20 pour SVT et 15/20 pour les bacs techniques et professionnels, calculés avec 75 % de la note nationale et 25 % de la note régionale. Les seuils de chaque nouvelle session sont publiés sur Cursus Sup." },
      { q: 'La calculatrice est-elle autorisée au concours ENSA ?', a: "Non. Les consignes 2026 interdisent la calculatrice pour les deux épreuves, ainsi que les téléphones et objets connectés." },
      { q: 'Y a-t-il des points négatifs au QCM ENSA ?', a: "Oui selon les consignes publiées en 2026 : +2 points pour une bonne réponse, −1 pour une réponse fausse et 0 sans réponse. Vérifiez toujours le barème dans les consignes de votre session." },
      { q: 'Un bac SVT peut-il intégrer une ENSA ?', a: "Oui, le bac SVT est accepté, mais avec un seuil de présélection plus élevé (15/20 en 2025). L'écrit porte sur les mathématiques et la physique-chimie : un candidat SVT doit renforcer ces deux matières." },
      { q: 'Combien de temps durent les études à l’ENSA ?', a: "Cinq ans : deux années de cycle préparatoire intégré puis trois années de cycle ingénieur, sanctionnées par le diplôme d'ingénieur d'État." },
    ],
  },
  ar: {
    short: 'ENSA',
    name: 'المدارس الوطنية للعلوم التطبيقية (ENSA)',
    title: 'مباراة ENSA 2027: العتبات والاختبارات وسلم التنقيط والتحضير',
    description: 'المباراة المشتركة لولوج 13 مدرسة وطنية للعلوم التطبيقية بالمغرب: الشعب المقبولة، عتبات الانتقاء، صيغة الأسئلة متعددة الاختيارات، سلم التنقيط، الأجندة وتمارين مصححة.',
    keywords: ['مباراة ENSA', 'عتبة ENSA', 'المدارس الوطنية للعلوم التطبيقية', 'مباراة الهندسة بعد البكالوريا'],
    intro: 'تكوّن المدارس الوطنية للعلوم التطبيقية **مهندسي الدولة في 5 سنوات** مباشرة بعد البكالوريا: سنتان من السلك التحضيري المندمج ثم ثلاث سنوات من سلك المهندس. يتم الولوج إلى السنة الأولى عبر **مباراة وطنية مشتركة** للمدارس الـ13، تبدأ بانتقاء أولي على أساس نقط البكالوريا ثم اختبار كتابي على شكل أسئلة متعددة الاختيارات.',
    facts: [
      ['الدبلوم', 'مهندس دولة (باك+5)'],
      ['المدارس', '13 مدرسة عمومية'],
      ['الشعب المقبولة', 'ع. رياضية، ع. فيزيائية، ع. الحياة والأرض، ع.ت. كهربائية، ع.ت. ميكانيكية (+ بعض شعب البكالوريا المهنية)'],
      ['الانتقاء', 'انتقاء أولي (نقط الباك) + اختبار كتابي'],
      ['اختبار 2026', '40 سؤالًا في 3 ساعات بدون آلة حاسبة'],
      ['التسجيل', 'منصة Cursus Sup (يونيو–يوليوز)'],
    ],
    sections: [
      {
        id: 'ecoles',
        h: 'المدارس الـ13 للشبكة',
        blocks: [
          { p: 'تضم الشبكة 13 مدرسة تابعة للجامعات العمومية. تتيح مباراة واحدة ترتيب الاختيارات بين جميع المدارس، ويتم التعيين حسب الرتبة المحصل عليها والمقاعد المتوفرة في كل مدرسة.' },
          { ul: ['طنجة، تطوان، الحسيمة', 'وجدة، فاس، القنيطرة', 'خريبكة، بني ملال، برشيد، الجديدة', 'آسفي، مراكش، أكادير'] },
          { p: 'تختلف مسالك سلك المهندس (هندسة المعلوميات، الهندسة المدنية، الهندسة الكهربائية، الهندسة الصناعية، الشبكات والاتصالات، البيانات، إلخ) من مدرسة إلى أخرى: قارن بينها قبل ترتيب اختياراتك.' },
        ],
      },
      {
        id: 'conditions',
        h: 'شروط الولوج',
        blocks: [
          { ul: [
            'الحصول على البكالوريا (الدورة المحددة في الإعلان) في شعبة علمية أو تقنية: **العلوم الرياضية أ أو ب، العلوم الفيزيائية، علوم الحياة والأرض، العلوم والتكنولوجيات الكهربائية أو الميكانيكية**، وبعض شعب البكالوريا المهنية.',
            'الحصول على معدل انتقاء يساوي على الأقل **العتبة المحددة لشعبته** (انظر أدناه).',
            'التسجيل داخل الآجال على المنصة الوطنية **Cursus Sup** وترتيب المدارس حسب الأفضلية.',
          ] },
          { callout: 'info', text: 'يُحسب معدل الانتقاء كالتالي: **75% من نقطة الامتحان الوطني + 25% من نقطة الامتحان الجهوي**، ولا تدخل المراقبة المستمرة في الحساب. استعمل [حاسبة نقطة الانتقاء](@/outils/calcul-note-bac/).' },
        ],
      },
      { id: 'seuils', h: 'عتبات الانتقاء', blocks: [ { seuils: true }, { p: 'العتبة هي النقطة الدنيا للاستدعاء إلى الاختبار الكتابي، ولا تضمن القبول. وتُحدَّد كل سنة حسب عدد المترشحين والمقاعد: فقد ترتفع العتبة أو تنخفض من دورة إلى أخرى.' } ] },
      {
        id: 'epreuves',
        h: 'مراحل المباراة والاختبارات',
        blocks: [
          { steps: [
            '**التسجيل في Cursus Sup**: إنشاء الحساب، إدخال نقط البكالوريا، واختيار المدارس وترتيبها.',
            '**الانتقاء الأولي**: تُنشر لائحة المترشحين المستدعين على Cursus Sup مع الاستدعاء الذي يجب طباعته.',
            '**الاختبار الكتابي (أسئلة متعددة الاختيارات)**: حسب تعليمات 2026، اختباران مدتهما **3 ساعات إجمالًا**: 20 سؤالًا في الرياضيات (Q1 إلى Q20) و20 سؤالًا في الفيزياء والكيمياء (Q21 إلى Q40)، بمعامل 1 لكل منهما.',
            '**الترتيب والتعيين**: حسب النتيجة والاختيارات، مع لائحة رئيسية ثم لوائح انتظار.',
          ] },
          { table: {
            head: ['العنصر', 'دورة 2026 (التعليمات الرسمية)'],
            rows: [
              ['المدة', '3 ساعات للاختبارين'],
              ['الأسئلة', '40 سؤالًا: 20 رياضيات + 20 فيزياء وكيمياء'],
              ['سلم التنقيط المشار إليه', '+2 للجواب الصحيح، −1 للجواب الخاطئ، 0 بدون جواب'],
              ['الآلة الحاسبة', 'ممنوعة'],
              ['الوثائق', 'الاستدعاء + البطاقة الوطنية أو جواز السفر (الأصل)'],
              ['الحضور', 'حوالي ساعة ونصف قبل البداية'],
            ],
          } },
          { callout: 'warn', text: 'مع التنقيط السلبي، الإجابة العشوائية تُفقد النقط في المتوسط. لا تجب إلا إذا استبعدت اقتراحًا أو اقتراحين على الأقل. واختبر استراتيجيتك عبر [محاكي سلم التنقيط](@/outils/simulateur-qcm/).' },
        ],
      },
      {
        id: 'programme',
        h: 'المقرر الذي يجب مراجعته',
        blocks: [
          { p: 'تشمل الأسئلة مقرر السنة الثانية بكالوريا (العلوم الرياضية والعلوم التجريبية). وتتطلب الأسئلة أساسًا سرعة في الحساب بدون آلة حاسبة وتمكنًا جيدًا من الطرق الكلاسيكية.' },
          { table: {
            head: ['المادة', 'الفصول الأكثر فائدة'],
            rows: [
              ['الرياضيات', 'النهايات والاتصال، الاشتقاق، دراسة الدوال، اللوغاريتم والأسية، المتتاليات، التكاملات، الأعداد العقدية، الاحتمالات، المعادلات التفاضلية، الهندسة الفضائية'],
              ['الفيزياء', 'الموجات، التناقص الإشعاعي، ثنائيا القطب RC وRL، الدارة RLC، قوانين نيوتن، السقوط الحر والمقذوفات، المتذبذبات، الأقمار الاصطناعية'],
              ['الكيمياء', 'الحركية، التوازن ونسبة التقدم، الأحماض والقواعد وpH، المعايرات، الأعمدة والتحليل الكهربائي، الأسترة والحلمأة'],
            ],
          } },
        ],
      },
      { id: 'places', h: 'المقاعد وعدد المترشحين', blocks: [ { p: 'يُنشر عدد المقاعد كل سنة حسب المدرسة وحسب شعبة البكالوريا. بالنسبة لدورة 2026-2027، تداولت مواقع التوجيه ما مجموعه حوالي **4390 مقعدًا** في مجموع الشبكة (رقم لم يؤكده بلاغ رسمي). ويُعد المترشحون المسجلون بعشرات الآلاف، ومن هنا ارتفاع العتبات بالنسبة لشعبتي العلوم الفيزيائية وعلوم الحياة والأرض.' } ] },
      {
        id: 'calendrier',
        h: 'الأجندة المعتادة',
        blocks: [
          { table: {
            head: ['المرحلة', 'الفترة المعتادة', 'مرجع دورة 2026'],
            rows: [
              ['التسجيل في Cursus Sup', 'منتصف يونيو إلى بداية يوليوز', 'يونيو–يوليوز 2026'],
              ['نتائج الانتقاء الأولي', 'منتصف يوليوز', 'منتصف يوليوز 2026'],
              ['الاختبار الكتابي', 'أواخر يوليوز', 'الأربعاء 22 يوليوز 2026، الساعة 9'],
              ['النتائج والتسجيل', 'أواخر يوليوز – شتنبر', 'تسجيل المقبولين في الاختيار الأول: 28 و29 و31 يوليوز 2026'],
            ],
          } },
          { p: 'بالنسبة لدورة 2027، توقّع أجندة قريبة من هذه. فعّل تذكيرًا عبر [أجندة المباريات](@/outils/calendrier-concours/).' },
        ],
      },
      {
        id: 'preparation',
        h: 'نصائح للتحضير',
        blocks: [
          { ul: [
            'راجع مقرر الثانية باك أولًا، فالمباراة لا تتضمن مفاهيم خارج المقرر.',
            'تمرّن **بدون آلة حاسبة**: الحساب الذهني والكسور والقوى والقيم المعتادة (ln 2 ≈ 0.69؛ √2 ≈ 1.41؛ e ≈ 2.72).',
            'وقّت نفسك: 40 سؤالًا في 180 دقيقة، أي حوالي 4 دقائق ونصف لكل سؤال، بما في ذلك المراجعة.',
            'أنجز على الأقل 3 امتحانات تجريبية كاملة في ظروف حقيقية بسلم التنقيط +2/−1.',
            'حضّر التحقق من الأجوبة بالاستبعاد: رتب المقادير، الوحدات، الحالات الخاصة (n = 0، x = 0).',
          ] },
          { practice: true },
        ],
      },
      {
        id: 'autres-voies',
        h: 'مسالك أخرى لولوج ENSA',
        blocks: [
          { p: 'يستقبل سلك المهندس بالمدارس الوطنية للعلوم التطبيقية (السنة الثالثة) أيضًا طلبة من مستوى باك+2: تلاميذ الأقسام التحضيرية عبر **المباراة الوطنية المشتركة (CNC)**، وحاملي DEUG أو DUT أو الشهادات المعادلة عبر مباريات على أساس الشهادة خاصة بكل مدرسة. اطلع على دليلينا حول [الأقسام التحضيرية CPGE](@/concours/cpge/) و[المباراة الوطنية المشتركة CNC](@/concours/cnc/).' },
        ],
      },
    ],
    faq: [
      { q: 'ما هي عتبة ENSA؟', a: 'بالنسبة لدورة 2025 كانت العتبات المتداولة: 12/20 للعلوم الرياضية، 14/20 للعلوم الفيزيائية، 15/20 لعلوم الحياة والأرض و15/20 للشعب التقنية والمهنية، محسوبة بـ75% من الوطني و25% من الجهوي. وتُنشر عتبات كل دورة جديدة على Cursus Sup.' },
      { q: 'هل الآلة الحاسبة مسموح بها؟', a: 'لا، تعليمات 2026 تمنع الآلة الحاسبة في الاختبارين، وكذا الهواتف والأجهزة المتصلة.' },
      { q: 'هل يوجد تنقيط سلبي؟', a: 'نعم حسب التعليمات المنشورة في 2026: +2 للجواب الصحيح و−1 للخاطئ و0 بدون جواب. تحقق دائمًا من سلم التنقيط في تعليمات دورتك.' },
      { q: 'هل يمكن لحامل بكالوريا علوم الحياة والأرض ولوج ENSA؟', a: 'نعم، بكالوريا علوم الحياة والأرض مقبولة، لكن بعتبة انتقاء أعلى (15/20 في 2025). ويتناول الاختبار الكتابي الرياضيات والفيزياء والكيمياء: لذا يجب على مترشح علوم الحياة والأرض تعزيز هاتين المادتين.' },
      { q: 'كم تدوم الدراسة في ENSA؟', a: 'خمس سنوات: سنتان من السلك التحضيري المندمج ثم ثلاث سنوات من سلك المهندس، تُتوَّج بدبلوم مهندس الدولة.' },
    ],
  },
};

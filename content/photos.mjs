/* Real photos (Wikimedia Commons, free licences allowing commercial use and changes: CC0, CC BY, CC BY-SA).
 * Cropped/resized to WebP in src/img/photos/<id>-<width>.webp. Short credit on each photo, full credits with
 * links on the « Mentions légales » page. No public figures, no logos or official emblems used as decoration. */
export const PHOTOS = {
  'cm-amphitheatre': { fr: "Amphithéâtre vide de la Faculté des sciences Ben M'sik, Université Hassan II de Casablanca", ar: "مدرج فارغ بكلية العلوم بنمسيك، جامعة الحسن الثاني بالدار البيضاء", width: 800, height: 600, widths: [480, 800, 1200], position: '50% 60%',
    author: "Anass Sedrati", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:Amphitheater_2_in_Ben_M%27sik_Faculty_of_Science_-_University_Hassan_II_Casablanca.jpg" },
  'cm-stethoscope': { fr: "Stéthoscope posé sur un clavier et un tracé d'électrocardiogramme", ar: "سماعة طبية فوق لوحة مفاتيح وشريط تخطيط القلب", width: 800, height: 522, widths: [480, 800], position: '55% 45%',
    author: "Ivan2010", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:Instrumentos_medicos_de_uso_en_Cardiolog%C3%ADa.jpg" },
  'cm-oscilloscope': { fr: "Oscilloscope, multimètre et alimentation sur un banc d'électronique", ar: "راسم إشارات ومقياس متعدد ومزود طاقة على طاولة إلكترونيات", width: 800, height: 658, widths: [480, 800], position: '50% 35%',
    author: "Radarvector", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:Keysight_InfiniiVision_DSOX_4024A_and_digital_multimeter_and_power_supply_in_laboratory_use.jpg" },
  'cm-salle-de-cours': { fr: "Salle de cours d'une école de commerce, tables en arc de cercle", ar: "قاعة دروس بمدرسة للتجارة بطاولات على شكل قوس", width: 800, height: 600, widths: [480, 800], position: '50% 60%',
    author: "Canadian2006", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:Edwards_School_of_Business_classroom_2016.jpg" },
  'cm-zellige': { fr: "Mosaïque de zellige de la médersa Ben Youssef à Marrakech", ar: "زليج مدرسة ابن يوسف بمراكش", width: 800, height: 372, widths: [480, 800], position: '50% 50%',
    author: "Elena Tatiana Chis", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:Medina_of_Marrakesh_Medersa_Ben_Youssef_mosaique_detail.jpg" },
  'cm-salle-de-classe': { fr: "Salle de classe ancienne avec des pupitres en bois en gradins", ar: "قسم دراسي قديم بمقاعد خشبية متدرجة", width: 800, height: 667, widths: [480, 800], position: '50% 55%',
    author: "Paul Shreeve", license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: "https://commons.wikimedia.org/wiki/File:Gallery_Classroom,_British_Schools_Museum,_Hitchin_-_geograph.org.uk_-_2261646.jpg" },
  'cm-piste-athletisme': { fr: "Piste d'athlétisme et ses couloirs numérotés", ar: "مضمار ألعاب القوى بممراته المرقمة", width: 800, height: 600, widths: [480, 800], position: '50% 70%',
    author: "Richard Webb", license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: "https://commons.wikimedia.org/wiki/File:Running_track,_Meadowbank_-_geograph.org.uk_-_7657324.jpg" },
  'cm-protection-civile': { fr: "Camion de pompiers de la Protection civile marocaine", ar: "شاحنة إطفاء تابعة للوقاية المدنية المغربية", width: 800, height: 412, widths: [480, 800], position: '40% 55%',
    author: "NorthAfricanArmsDealer", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:Moroccan_Civil_Protection_Fire_Truck.jpg" },
  'cm-salle-informatique': { fr: "Salle informatique avec des rangées d'ordinateurs", ar: "قاعة إعلاميات بصفوف من الحواسيب", width: 800, height: 450, widths: [480, 800], position: '50% 55%',
    author: "RitwickSingh", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:COMPUTER_LAB_IMUV.jpg" },
  'cm-universite-mohammed-v': { fr: "Bâtiment de la présidence de l'Université Mohammed V de Rabat", ar: "بناية رئاسة جامعة محمد الخامس بالرباط", width: 800, height: 600, widths: [480, 800], position: '50% 45%',
    author: "Ou hany", license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: "https://commons.wikimedia.org/wiki/File:%D8%AC%D8%A7%D9%85%D8%B9%D8%A9_%D9%85%D8%AD%D9%85%D8%AF_%D8%A7%D9%84%D8%AE%D8%A7%D9%85%D8%B3_(_%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2%D9%8A%D8%A9)_%D8%A7%D9%84%D8%B1%D8%A8%D8%A7%D8%B7.jpg" },
  'cm-entretien': { fr: "Entretien autour d'une table : un candidat face à une recruteuse", ar: "مقابلة حول طاولة: مترشح أمام مسؤولة توظيف", width: 800, height: 524, widths: [480, 800], position: '50% 40%',
    author: "Amtec Photos", license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: "https://commons.wikimedia.org/wiki/File:Young_Man_on_a_Job_Interview_(26931177139).jpg" },
};

/* Cover photo of each concours page, by group (content/taxonomy.mjs GROUPS). */
export const GROUP_PHOTOS = {
  sante: 'cm-stethoscope', ingenierie: 'cm-oscilloscope', commerce: 'cm-salle-de-cours', 'architecture-arts': 'cm-zellige',
  enseignement: 'cm-salle-de-classe', militaire: 'cm-piste-athletisme', securite: 'cm-protection-civile', formation: 'cm-salle-informatique',
};

/* Cover photo of a guide, by slug (content/guides/<slug>.<lang>.md). */
export const GUIDE_PHOTOS = {
  'orientation-apres-bac-maroc': 'cm-universite-mohammed-v', 'bourse-minhaty-logement': 'cm-universite-mohammed-v',
  'cursus-sup-inscription': 'cm-salle-informatique', 'concours-sans-bac-niveau-bac': 'cm-salle-informatique',
  'reussir-qcm-concours': 'cm-amphitheatre', 'tests-psychotechniques': 'cm-salle-de-classe',
  'entretien-oral': 'cm-entretien', 'epreuves-sportives-concours': 'cm-piste-athletisme',
};

/* Dim background of the home page hero. */
export const HOME_PHOTO = 'cm-amphitheatre';

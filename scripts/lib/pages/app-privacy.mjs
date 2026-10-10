/* Privacy policy of the Android app. Shown inside the app (it replaces the
   website's policy there) and published on the website at
   application/confidentialite/, the public address that Google Play asks for. */
import { html, inline } from '../html.mjs';
import { formatDate } from '../strings.mjs';

const P = (s) => html`<p>${inline(s)}</p>`;
const H2 = (s) => html`<h2>${s}</h2>`;

export function appPrivacyTitle(lang) {
  return lang === 'ar' ? 'سياسة خصوصية التطبيق' : 'Politique de confidentialité de l’application';
}

/* Body of the policy; link() resolves site paths for the current page. */
export function appPrivacyContent(site, lang, link) {
  const ar = lang === 'ar';
  const pfx = ar ? 'ar/' : '';
  const updated = formatDate(site.updated, lang);
  return ar ? html`
${P(`آخر تحديث: ${updated}.`)}
${H2('لا حساب ولا معطيات تعريفية')}${P('لا يطلب التطبيق إنشاء حساب، ولا يجمع اسمك أو بريدك الإلكتروني أو رقم هاتفك أو موقعك الجغرافي.')}
${H2('المعطيات المحفوظة على هاتفك')}${P('يُحفظ تقدمك (النتائج، الإحصائيات، المفضلة، الملاحظات، الجلسة الجارية، برنامج المراجعة، لائحة الوثائق، الإعدادات) فقط في التخزين المحلي للتطبيق على هاتفك، ولا يُرسل إلى أي خادم. يمكنك تصديره أو استيراده أو حذفه من إعدادات التمرين، كما يحذفه إلغاء تثبيت التطبيق.')}
${H2('الإعلانات (Google AdMob)')}${P('التطبيق مجاني وقد يعرض إعلانات تقدمها Google AdMob، خارج شاشات الأسئلة. قد تجمع AdMob وتعالج معلومات مثل المعرف الإعلاني للجهاز وعنوان IP ومعلومات تقنية عن الجهاز والتفاعل مع الإعلانات، من أجل عرض الإعلانات وقياس أدائها ومحاربة الاحتيال. عندما يفرض القانون ذلك، يُعرض عليك نموذج موافقة من Google، ويمكنك تعديل اختياراتك في أي وقت من إعدادات التطبيق، كما يمكنك إعادة تعيين المعرف الإعلاني أو حذفه من إعدادات Google في أندرويد.')}
${P('للمزيد: [كيف تستعمل Google المعلومات المستقاة من التطبيقات](https://policies.google.com/technologies/partner-sites) و[سياسة خصوصية Google](https://policies.google.com/privacy).')}
${H2('القراءة بصوت مرتفع')}${P('تعتمد قراءة الأسئلة على محرك النطق المثبت على هاتفك (مثل Google). حسب المحرك والأصوات المثبتة، قد يعمل بدون إنترنت أو يستعمل الاتصال؛ تخضع هذه الخدمة لسياسة خصوصية مزودها.')}
${H2('الروابط الخارجية')}${P('تُفتح روابط المواقع الرسمية في متصفحك، وتخضع لسياسات الخصوصية الخاصة بها.')}
${H2('الفئة المستهدفة')}${P('التطبيق موجه لتلاميذ الثانوي والحاصلين على البكالوريا والمترشحين للمباريات، وليس موجهًا للأطفال دون 13 سنة.')}
${H2('حقوقك')}${P(`وفقًا للقانون 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي، يمكنك التواصل معنا لأي سؤال عبر [صفحة الاتصال](${link(pfx + 'contact/')}).`)}`
    : html`
${P(`Dernière mise à jour : ${updated}.`)}
${H2('Aucun compte, aucune donnée d’identité')}${P("L'application ne demande **aucun compte** et ne collecte ni votre nom, ni votre adresse e-mail, ni votre numéro de téléphone, ni votre position.")}
${H2('Données enregistrées sur votre téléphone')}${P("Votre progression (scores, statistiques, favoris, notes, session en cours, planning de révision, checklist, réglages) est enregistrée **uniquement dans le stockage local de l'application**, sur votre téléphone. Elle n'est envoyée à aucun serveur. Vous pouvez l'exporter, l'importer ou l'effacer depuis les réglages de l'entraînement ; la désinstallation de l'application la supprime aussi.")}
${H2('Publicité (Google AdMob)')}${P("L'application est gratuite et peut afficher des annonces fournies par **Google AdMob**, jamais pendant une question. AdMob peut collecter et traiter des informations telles que l'identifiant publicitaire de l'appareil, l'adresse IP, des informations techniques sur l'appareil et vos interactions avec les annonces, afin de diffuser les annonces, mesurer leurs performances et lutter contre la fraude. Lorsque la réglementation l'exige, un formulaire de consentement de Google vous est présenté ; vous pouvez modifier vos choix à tout moment dans les paramètres de l'application, et réinitialiser ou supprimer votre identifiant publicitaire dans les réglages Google d'Android.")}
${P('En savoir plus : [comment Google utilise les informations des applications partenaires](https://policies.google.com/technologies/partner-sites) et [règles de confidentialité de Google](https://policies.google.com/privacy).')}
${H2('Lecture à voix haute')}${P("La lecture des questions utilise le moteur de synthèse vocale installé sur votre téléphone (par exemple celui de Google). Selon le moteur et les voix installées, il fonctionne hors ligne ou utilise une connexion ; sa propre politique de confidentialité s'applique.")}
${H2('Liens externes')}${P("Les liens vers les sites officiels s'ouvrent dans votre navigateur ; leurs propres règles de confidentialité s'appliquent.")}
${H2('Public visé')}${P("L'application s'adresse aux lycéens, aux bacheliers et aux candidats aux concours. Elle n'est pas destinée aux enfants de moins de 13 ans.")}
${H2('Vos droits')}${P(`Conformément à la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, vous pouvez nous contacter pour toute question via la [page contact](${link(pfx + 'contact/')}).`)}`;
}

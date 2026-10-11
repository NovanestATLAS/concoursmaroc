/* About, sources, contact, privacy, legal notice, 404 and offline pages. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { html, inline } from '../html.mjs';
import { icon } from '../icons.mjs';
import { linker, breadcrumb, breadcrumbLd, basePath } from '../layout.mjs';
import { t, formatDate } from '../strings.mjs';
import { guidePath } from './concours.mjs';
import { appPrivacyTitle, appPrivacyContent } from './app-privacy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function simplePage(site, lang, slug, title, description, blocks, extra = {}) {
  const pfx = lang === 'ar' ? 'ar/' : '';
  const p = `${pfx}${slug}/index.html`;
  const link = linker(p);
  const crumbs = [[pfx, t(lang, 'home')], [`${pfx}${slug}/`, extra.crumb || title]];
  return {
    path: p, lang, title, description, alternate: `${lang === 'ar' ? '' : 'ar/'}${slug}/`,
    jsonld: [breadcrumbLd(site, crumbs)], noSearch: extra.noSearch,
    body: html`${breadcrumb(lang, link, crumbs)}<div class="container narrow" style="padding-bottom:40px"><header class="page-head"><h1>${extra.h1 || title}</h1>${extra.lead ? html`<p class="lead">${extra.lead}</p>` : ''}</header>
${blocks(link, pfx)}</div>`,
  };
}

const P = (s) => html`<p>${inline(s)}</p>`;
const UL = (a) => html`<ul>${a.map((s) => html`<li>${inline(s)}</li>`)}</ul>`;
const H2 = (s) => html`<h2>${s}</h2>`;

export function buildStaticPages(site, all, lang, banks) {
  const ar = lang === 'ar';
  const pages = [];
  const repoIssues = `${site.repoUrl}/issues`;
  const nq = Object.values(banks).reduce((s, b) => s + b.length, 0);

  pages.push(simplePage(site, lang, 'a-propos',
    ar ? 'من نحن ومنهجيتنا' : 'À propos de Concours Maroc et méthode de vérification',
    ar ? 'Concours Maroc دليل مستقل ومجاني للمباريات بالمغرب: كيف نجمع المعلومات ونتحقق منها ونحدّثها.' : "Concours Maroc est un guide indépendant et gratuit des concours au Maroc : comment les informations sont collectées, vérifiées, datées et mises à jour.",
    (link, pfx) => ar ? html`${P('Concours Maroc دليل مستقل ومجاني يساعد الحاصلين على البكالوريا والمترشحين بمستوى البكالوريا على فهم المباريات والتحضير لها.')}
${H2('منهجيتنا')}${UL(['نعتمد أولًا الإعلانات الرسمية للمؤسسات والمنصات الحكومية (Cursus Sup، بوابات التوظيف…).', 'كل معلومة غير مؤكدة رسميًا يُشار إليها بوضوح مع مصدرها وتاريخها.', 'الأسئلة التدريبية أصلية ومتحقق منها، وتحاكي أسلوب الاختبارات دون نسخ مواضيع رسمية.', 'نراجع الصفحات قبل كل دورة ونحدث تاريخ آخر تحقق.'])}
${H2('استقلالية')}${P('الموقع غير تابع لأي إدارة أو مؤسسة مذكورة. الإعلان الرسمي لكل دورة هو المرجع الوحيد.')}`
      : html`${P("Concours Maroc est un guide **indépendant et gratuit** pour les bacheliers et les candidats de niveau bac qui préparent un concours au Maroc. Il réunit, pour chaque concours, les conditions d'accès, le mode de sélection, les épreuves, le nombre de places connu et le calendrier, avec un entraînement adapté.")}
${H2('Notre méthode')}${UL([
  "**Sources primaires d'abord** : avis officiels des établissements, plateformes publiques (Cursus Sup, portails de recrutement) et textes publiés.",
  '**Information datée et sourcée** : chaque fiche indique la session vérifiée et liste ses sources. Un chiffre relayé uniquement par la presse ou des sites spécialisés est signalé comme tel.',
  "**Questions originales** : les " + nq + " questions d'entraînement sont rédigées et relues pour le site ; elles reproduisent le niveau et le style des épreuves sans copier de sujets officiels.",
  "**Mise à jour par session** : les fiches sont revues avant chaque campagne d'inscription. Les dates à venir sont distinguées des estimations.",
])}
${H2('Indépendance')}${P("Concours Maroc n'est affilié à aucune administration, force de sécurité, institution militaire ou établissement cité. Les noms des concours ne sont utilisés que pour décrire le contenu. **Seul l'avis officiel de chaque session fait foi.**")}
${H2('Signaler une erreur')}${P(`Une date a changé, un seuil est publié ? Signalez-le depuis la page [contact](@contact). Chaque correction vérifiée est intégrée rapidement.`.replace('@contact', link(pfx + 'contact/')))}`,
    { crumb: ar ? 'من نحن' : 'À propos' }));

  pages.push(simplePage(site, lang, 'contact',
    ar ? 'اتصل بنا وصحّح معلومة' : 'Contact et signalement d’erreur',
    ar ? 'راسل Concours Maroc لتصحيح معلومة أو اقتراح مباراة.' : 'Contacter Concours Maroc : signaler une erreur, une nouvelle date ou proposer un concours à ajouter.',
    () => html`${P(ar ? 'لتصحيح معلومة أو اقتراح إضافة، يرجى ذكر الصفحة المعنية والمصدر الرسمي (رابط الإعلان).' : "Pour signaler une erreur ou proposer un ajout, indiquez la page concernée et, si possible, le lien vers l'avis officiel.")}
<div class="btn-row">${site.contactEmail ? html`<a class="btn" href="mailto:${site.contactEmail}">${icon('pen')} ${site.contactEmail}</a>` : ''}<a class="btn ghost" href="${repoIssues}" rel="noopener" target="_blank">${icon('doc')} ${ar ? 'فتح بلاغ على GitHub' : 'Ouvrir un signalement sur GitHub'}</a></div>
${P(ar ? 'لا نجيب عن طلبات النتائج الفردية: النتائج تُنشر فقط على المنصات الرسمية.' : "Nous ne pouvons pas répondre aux questions sur un dossier individuel : les résultats sont publiés uniquement par les plateformes officielles.")}`,
    { crumb: ar ? 'اتصل بنا' : 'Contact' }));

  pages.push(simplePage(site, lang, 'confidentialite',
    ar ? 'سياسة الخصوصية' : 'Politique de confidentialité',
    ar ? 'كيف يتعامل Concours Maroc مع بياناتك: لا حساب، والتقدم محفوظ على جهازك فقط.' : 'Comment Concours Maroc traite vos données : pas de compte, progression enregistrée uniquement sur votre appareil.',
    (link, pfx) => ar ? html`${P('لا يطلب الموقع إنشاء حساب ولا يجمع هويتك. يُحفظ تقدمك في التمرين (النتائج، المفضلة، الملاحظات، البرنامج) في المتصفح على جهازك فقط عبر localStorage، ويمكنك حذفه من الإعدادات.')}
${site.adsenseClient ? html`${H2('الإعلانات (Google AdSense)')}${P('يعرض الموقع إعلانات تقدمها Google AdSense لتمويل تشغيله. يستعمل مزودون خارجيون، من بينهم Google، ملفات تعريف الارتباط لعرض إعلانات بناءً على زياراتك السابقة لهذا الموقع أو لمواقع أخرى. وتتيح ملفات تعريف الارتباط الإعلانية لـ Google وشركائها عرض إعلانات بناءً على زياراتك لهذا الموقع و/أو لمواقع أخرى على الإنترنت. وقد تستعمل شبكات إعلانية أخرى معتمدة من Google ملفات تعريف الارتباط بدورها.')}
${P('يمكنك إيقاف الإعلانات المخصصة من [إعدادات الإعلانات في Google](https://www.google.com/settings/ads)، أو إيقاف ملفات تعريف الارتباط الخاصة بالمزودين الآخرين عبر [www.aboutads.info](https://www.aboutads.info/choices). عندما يفرض القانون ذلك، يُعرض عليك طلب موافقة من Google. للمزيد: [كيف تستعمل Google المعلومات المستقاة من المواقع الشريكة](https://policies.google.com/technologies/partner-sites).')}` : ''}
${H2('قياس الزيارات')}${P(site.ga4 ? 'يستعمل الموقع Google Analytics 4 لقياس عدد الزيارات والصفحات الأكثر استعمالًا بشكل مجمّع (عبر ملفات تعريف الارتباط). لا يحتفظ Google Analytics 4 بعناوين IP، ولا تُرسل إليه هويتك ولا أجوبتك. يمكنك رفض هذا القياس عبر [إضافة إلغاء الاشتراك في Google Analytics](https://tools.google.com/dlpage/gaoptout).' : 'لا يستعمل الموقع حاليًا أي أداة لقياس الزيارات، وستُحدَّث هذه الصفحة إن تغير ذلك.')}
${H2('تطبيق أندرويد')}${P(`لتطبيق Concours Maroc على أندرويد [سياسة خصوصية خاصة به](${link(pfx + 'application/confidentialite/')}) (الإعلانات والموافقة والقراءة بصوت مرتفع).`)}
${H2('حقوقك')}${P('وفقًا للقانون 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي، يمكنك التواصل معنا عبر صفحة الاتصال.')}`
      : html`${P("Concours Maroc ne demande **aucun compte** et ne collecte pas votre identité. Votre progression d'entraînement (scores, favoris, notes, planning, checklist) est enregistrée **uniquement dans votre navigateur** (localStorage). Vous pouvez l'exporter ou l'effacer à tout moment depuis les réglages de l'entraînement.")}
${site.adsenseClient ? html`${H2('Publicité (Google AdSense)')}${P("Le site affiche des annonces fournies par **Google AdSense** pour financer son fonctionnement. Des fournisseurs tiers, dont Google, utilisent des cookies pour diffuser des annonces en fonction de vos visites précédentes sur ce site ou sur d'autres sites. Grâce aux cookies publicitaires, Google et ses partenaires adaptent les annonces à vos visites sur ce site et/ou sur d'autres sites Internet. D'autres réseaux publicitaires certifiés par Google peuvent aussi utiliser des cookies.")}
${P("Vous pouvez désactiver la publicité personnalisée dans les [paramètres des annonces Google](https://www.google.com/settings/ads), ou refuser les cookies d'autres fournisseurs sur [www.aboutads.info](https://www.aboutads.info/choices). Lorsque la réglementation l'exige, un formulaire de consentement de Google vous est présenté. En savoir plus : [comment Google utilise les informations des sites partenaires](https://policies.google.com/technologies/partner-sites).")}` : ''}
${H2('Mesure d’audience')}${P(site.ga4 ? "Le site utilise **Google Analytics 4** pour mesurer sa fréquentation de façon agrégée : pages vues, concours préparés, séances lancées et terminées (cookies de mesure). Google Analytics 4 ne conserve pas les adresses IP ; ni votre identité ni vos réponses ne lui sont envoyées. Vous pouvez refuser cette mesure avec le [module de désactivation de Google Analytics](https://tools.google.com/dlpage/gaoptout)." : "Le site n'utilise actuellement aucun outil de mesure d'audience ; cette page sera mise à jour si cela change.")}
${H2('Hébergement')}${P("Le site est hébergé par GitHub Pages (GitHub, Inc.), qui peut conserver des journaux techniques (adresse IP) pour des raisons de sécurité.")}
${H2('Application Android')}${P(`L'application Android Concours Maroc a sa propre [politique de confidentialité](${link(pfx + 'application/confidentialite/')}) (publicité, consentement, lecture à voix haute).`)}
${H2('Vos droits')}${P("Conformément à la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, vous pouvez nous contacter pour toute question via la page contact.")}`,
    { crumb: ar ? 'الخصوصية' : 'Confidentialité' }));

  pages.push(simplePage(site, lang, 'application/confidentialite',
    appPrivacyTitle(lang),
    ar ? 'سياسة خصوصية تطبيق Concours Maroc على أندرويد: بدون حساب، تقدم محفوظ على الهاتف، إعلانات Google AdMob وطلب الموافقة.' : "Confidentialité de l'application Android Concours Maroc : pas de compte, progression gardée sur le téléphone, publicité Google AdMob et consentement.",
    (link) => appPrivacyContent(site, lang, link),
    { crumb: ar ? 'خصوصية التطبيق' : 'Application' }));

  pages.push(simplePage(site, lang, 'mentions-legales',
    ar ? 'إشعار قانوني' : 'Mentions légales',
    ar ? 'إشعار قانوني لموقع Concours Maroc.' : 'Mentions légales du site Concours Maroc : éditeur, hébergement, responsabilité et propriété intellectuelle.',
    () => ar ? html`${H2('الناشر')}${P('Concours Maroc، مشروع تحريري مستقل.')}${H2('الاستضافة')}${P('GitHub Pages — GitHub, Inc.')}${H2('المسؤولية')}${P('المعلومات مقدمة للإرشاد فقط. الإعلان الرسمي لكل دورة هو المرجع الوحيد.')}`
      : html`${H2('Éditeur')}${P('Concours Maroc — projet éditorial indépendant. Contact : voir la page contact.')}
${H2('Hébergement')}${P('GitHub Pages — GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.')}
${H2('Responsabilité')}${P("Les informations sont fournies à titre indicatif et vérifiées avec soin, mais les conditions, dates et formats des concours évoluent. **Seul l'avis officiel publié par l'organisme organisateur fait foi.** Concours Maroc ne peut être tenu responsable d'une décision prise sur la seule base du site.")}
${H2('Propriété intellectuelle')}${P("Les textes, questions d'entraînement, outils et visuels du site sont des créations originales. Aucun logo ni emblème officiel n'est utilisé. Les marques et noms d'établissements cités appartiennent à leurs titulaires.")}`,
    { crumb: ar ? 'إشعار قانوني' : 'Mentions légales' }));

  // Sources page: every external source cited by the guides + question sources
  const qs = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/sources.json'), 'utf8'));
  pages.push(simplePage(site, lang, 'sources',
    ar ? 'المصادر المعتمدة' : 'Sources utilisées par Concours Maroc',
    ar ? 'لائحة المصادر الرسمية والمراجع المستعملة في الأدلة والأسئلة.' : 'Liste des sources officielles et références utilisées pour les fiches concours et les questions d’entraînement, avec dates de consultation.',
    (link, pfx) => html`${all.filter((c) => (c.sources || []).length || (c.official || []).length).map((c) => html`<h2><a href="${link(guidePath(c, lang))}">${(c[lang] || c.fr).short}</a></h2><ul class="sources">${[...(c.official || []).map((o) => ({ title: o.label, url: o.url })), ...(c.sources || [])].map((s) => html`<li><a href="${s.url}" rel="noopener nofollow" target="_blank">${s.title}</a>${s.date ? html` <small class="muted">(${s.date})</small>` : ''}</li>`)}</ul>`)}
<h2>${ar ? 'مصادر الأسئلة' : "Sources des questions d'entraînement"}</h2><ul class="sources">${qs.sources.map((s) => html`<li>${s.url ? html`<a href="${s.url}" rel="noopener nofollow" target="_blank">${s.title}</a>` : s.title} <small class="muted">— ${s.org}</small></li>`)}</ul>`,
    { crumb: ar ? 'المصادر' : 'Sources' }));

  // 404 + offline (FR only; GitHub Pages serves /404.html)
  if (!ar) {
    const link = linker('404.html');
    const B = basePath(site);
    pages.push({
      path: '404.html', lang, title: 'Page introuvable', description: 'Cette page n’existe pas ou a été déplacée.', noindex: true, noSearch: true, noAds: true, absolute: true,
      body: html`<div class="container narrow" style="padding:50px 20px 60px;text-align:center"><div class="state"><div class="st-star" style="width:56px;height:56px;margin:0 auto 16px;background:var(--accent);clip-path:var(--star)"></div></div>
<h1>Page introuvable</h1><p class="lead">La page demandée n’existe pas ou a changé d’adresse. Essayez la recherche ou l’un de ces liens.</p>
<div class="btn-row" style="justify-content:center"><a class="btn" href="${B}">Accueil</a><a class="btn ghost" href="${B}concours/">Tous les concours</a><a class="btn ghost" href="${B}entrainement/">Entraînement</a></div>
<p class="muted" style="margin-top:20px" lang="ar" dir="rtl">الصفحة غير موجودة. <a href="${B}ar/">العودة إلى الرئيسية</a></p></div>`,
    });
    pages.push({
      path: 'offline.html', lang, title: 'Hors ligne', description: 'Vous êtes hors ligne.', noindex: true, noSearch: true, noAds: true,
      body: html`<div class="container narrow" style="padding:50px 20px;text-align:center"><h1>Vous êtes hors ligne</h1><p class="lead">Cette page n'a pas encore été enregistrée sur votre appareil. L'entraînement reste disponible s'il a déjà été ouvert une fois.</p><a class="btn" href="${link('entrainement/')}">Ouvrir l'entraînement</a></div>`,
    });
  }
  return pages;
}

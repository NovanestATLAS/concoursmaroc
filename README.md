# Concours Maroc

Guide gratuit et bilingue (français / arabe) des concours et de l'orientation après le bac au Maroc :
conditions d'accès, seuils, épreuves, calendrier, QCM corrigés, examens blancs et outils pratiques.

Site statique, sans base de données ni serveur : il est hébergé gratuitement par **Cloudflare Pages**
(dépôt GitHub privé, déploiement automatique à chaque commit).
Le même contenu est aussi empaqueté en **application Android** (Apache Cordova), publiée sur Google Play :
<https://play.google.com/store/apps/details?id=com.novanest.concoursmaroc>. Le site sert d'entonnoir vers
l'application : voir « Entonnoir vers l'application » plus bas.

## Ce que contient le site

| Rubrique | Contenu |
|---|---|
| Fiches concours (`/concours/`) | 33 fiches en français et en arabe : médecine, ISPITS, ENSA, ENSAM, CPGE, CNC, IAV, FST, EST, BTS, ENCG, ISCAE, ENA, ISIC, ISMAC/ISADAC, ISIT, ENS, concours de l’enseignement primaire (CRMEF), écoles militaires, police, gendarmerie, Forces Auxiliaires, Protection civile, DGAPR, douane, fonction publique, OFPPT, 1337, université |
| Entraînement (`/entrainement/`) | 2 308 QCM corrigés dans 18 matières (dont près de 600 en SVT, physique, chimie et maths sur le programme de 2e année bac, au format à 5 propositions des concours de médecine), tirés au niveau du concours choisi (accessible, standard, sélectif, très sélectif ; par grade pour la police et les forces auxiliaires), examen blanc au barème du concours, révisions espacées, défi du jour, favoris, statistiques ; le bouton retour du navigateur et du téléphone fonctionne |
| QCM corrigés (`/qcm/`) | Pages d'exemples par matière, avec réponses et explications (indexables par Google) |
| Outils (`/outils/`) | Calcul de la note du bac et de la présélection 75/25, orientation selon la série, calendrier avec rappels, planning de révision, checklist du dossier, simulateur de barème QCM |
| Guides (`/guides/`) | Orientation après le bac, Cursus Sup, bourse Minhaty, réussir un QCM, concours sans le bac, épreuves sportives, tests psychotechniques, entretien oral |

SEO : URL lisibles, titres et descriptions uniques, `hreflang` fr/ar, données structurées (Article, FAQ, Quiz,
fil d'Ariane…), `sitemap.xml`, `robots.txt`, images de partage par page, pages rapides et utilisables hors ligne.

## Orientation et engagement des visiteurs

`src/js/engage.js` et `scripts/lib/engage.mjs` (site et application Android ; dans l'application, pas de barre « Sur cette page ») :

- **Accueil** : une recherche et quatre entrées claires dans le hero (« J'ai mon bac », « Niveau bac ou sans bac »,
  « Je m'entraîne », « Je calcule ma note ») ; échéances limitées à 2 sur téléphone ; domaines en une ligne de liens.
- **Quiz express** : 5 QCM corrigés joués dans la page (accueil, chaque fiche concours au niveau du concours, fin des
  guides). Les banques sont chargées à la demande, KaTeX seulement si une formule apparaît ; les questions déjà vues
  sont évitées. Événements GA4 : `quiz_express_start`, `quiz_express_complete` (`placement`, `score`).
- **Reprendre** : l'accueil propose les dernières fiches consultées (stockées sur l'appareil).
- **Pages longues** (fiches, guides) : barre « Sur cette page » sous l'en-tête (section en cours, sommaire en un geste)
  et progression de lecture ; section en cours surlignée dans le sommaire de côté.
- **Fin de fiche** : bloc « Et maintenant ? » (entraînement, examen blanc, dates, éligibilité, note, autres concours).
- Le bandeau Android n'apparaît qu'à partir de la 3e page vue : une première visite reste sur le site.

## Alertes par notification (push)

Un bouton 🔔 « M'alerter des dates » sur chaque fiche (en-tête et section « Dates »), un panneau de choix des
concours en haut du [calendrier](https://www.maroc-concour.com/outils/calendrier-concours/#alertes) et un lien sous
les échéances de l'accueil. Gratuit, sans compte, sans service payant.

**Ce que reçoit l'abonné** (une notification par jour au plus, regroupée si plusieurs rappels tombent le même jour) :

| Moment | Événements du calendrier (`content/calendar.mjs`) |
|---|---|
| Ouverture des inscriptions | `inscription` et `deadline` avec une date de début (`start`) |
| J-7, J-2 et le jour même | date limite (`deadline`) ; J-3 et le dernier jour pour `inscription` |
| J-7 et la veille | épreuves (`ecrit`, à partir de `start` s'il existe) |
| Le jour même | résultats (`resultats`) |
| Le lendemain de sa publication | toute **nouvelle date** ajoutée au calendrier (hors estimations) |

Les estimations (`confidence: 'estimation'`, mois seul) ne déclenchent jamais de rappel. Ajouter une date au
calendrier suffit : elle est annoncée aux abonnés du concours le lendemain matin.

**Fonctionnement**

- Navigateur : `src/js/alertes.js` (permission demandée seulement après un geste, abonnement via `sw.js`),
  service worker `src/sw.template.js` (affichage, clic, renouvellement de l'abonnement).
- Serveur : **Cloudflare Pages Functions** (`functions/api/push/[[path]].js` → `push/api.mjs`), Web Push
  standard (VAPID + chiffrement aes128gcm, `push/webpush.mjs`, sans dépendance). Données lues dans
  `docs/data/alertes.json` (généré par le build). `docs/_routes.json` limite les Functions à `/api/*`.
- Stockage : un namespace **Workers KV** lié au projet Pages sous le nom **`PUSH`** (abonnements, clé VAPID créée
  au premier appel et jamais exposée, état de la tournée du jour). Aucun secret à configurer.
- Envoi : `.github/workflows/alertes-push.yml` appelle `/api/push/run` chaque jour à 10 h 17 (heure du Maroc),
  20 abonnés par appel, jusqu'à la fin. Lancement manuel possible (mode `status` pour voir l'état). La route
  n'envoie qu'une tournée par jour et seulement entre 8 h et 22 h.
- Abonnements expirés (réponse 404/410 du service de notifications) : supprimés automatiquement.
- Interrupteur : `pushAlerts` dans `content/site.mjs`. Jamais affiché dans l'application Android, qui a ses
  propres alertes.

**Mise en place (une fois, tableau de bord Cloudflare)** : *Storage & databases → Workers KV → Create* (nom
`concoursmaroc-push`), puis *Workers & Pages → concoursmaroc → Settings → Bindings → Add → KV namespace*, nom de
variable `PUSH`, et redéployer (*Deployments → … → Retry deployment*). Tant que le KV n'est pas lié, l'API répond
503 et le bouton indique que les alertes arrivent bientôt.

**Tests** : `push/api.mjs` se teste hors ligne (KV simulé et faux service de notifications qui vérifie VAPID et
déchiffre chaque message), et `wrangler pages dev docs --kv PUSH` fait tourner le site et l'API sur le moteur
de Cloudflare.

## Mise en ligne (Cloudflare Pages)

Le site est servi par **Cloudflare Pages**, projet `concoursmaroc`, relié à ce dépôt GitHub :

- branche de production : `claude/concoursmaroc-github-site-x6v5br` (branche par défaut du dépôt) ;
- aucune commande de build (le dossier est déjà construit) ; dossier publié : **`docs`** ;
- chaque commit sur cette branche met le site à jour en une minute environ ;
- aperçus des autres branches désactivés (rien n'est publié hors de la branche de production).

Avant chaque commit : `npm run build`, puis `npm run check` (0 erreur attendue), et commitez `docs/`.

`docs/_headers` (généré par le build) règle la mise en cache des fichiers sur Cloudflare.

## Nom de domaine : www.maroc-concour.com

Le domaine `maroc-concour.com` est enregistré chez **Spaceship** ; ses serveurs de noms sont ceux de
**Cloudflare** (`lennon.ns.cloudflare.com`, `sneh.ns.cloudflare.com`), où se gèrent les DNS.

- `www.maroc-concour.com` et `maroc-concour.com` sont des domaines personnalisés du projet Pages.
- Règle de redirection Cloudflare (Rules → Redirect Rules) : `maroc-concour.com/*` → `https://www.maroc-concour.com/…`
  en 301, avec la query string : une seule adresse pour Google.
- `content/site.mjs` : `siteUrl: 'https://www.maroc-concour.com'` (URL canoniques, sitemap, hreflang).
  `customDomain` écrit encore `docs/CNAME`, sans effet sur Cloudflare.
- Les enregistrements TXT `google-site-verification` (Search Console) sont dans les DNS Cloudflare.

## Entonnoir vers l'application (Google Play)

Avec `androidApp: { status: 'live', … }` dans `content/site.mjs`, toutes les pages du **site** (jamais
l'application elle-même) mènent à la fiche Google Play :

| Emplacement | Campagne (`utm_campaign`) |
|---|---|
| Bouton « Télécharger l'app » de l'en-tête (premier lien du menu sur téléphone) | `header` |
| Bandeau Android au-dessus de l'en-tête (téléphones Android, fermé 14 jours par ×) | `banner` |
| Accueil : pastille « Nouveau » du hero (60 jours après `since`), bouton du hero, bandeau avec capture et code QR, question de la FAQ | `accueil-hero`, `accueil-bandeau` |
| Fiches concours : carte à droite du titre (ordinateur, avec code QR), ligne sous « Entraînez-vous maintenant », carte après « En bref » (téléphone) | `fiche-entete`, `fiche-entrainement`, `fiche-contenu` |
| Guides, outils, calendrier (« Ne ratez plus aucune date »), annuaire des concours, pages QCM (après la 10e question) | `guide-entete`, `guide-contenu`, `outil-entete`, `outil-…`, `calendrier`, `annuaire`, `qcm` |
| Entraînement : bandeau sous l'entraînement et carte sur l'écran de résultats | `entrainement`, `resultats` |
| Page `application/` (présentation, captures, code QR, FAQ) et pied de page | `page-application`, `page-application-bas`, `footer` |
| Code QR (`src/img/app/qr-google-play.svg`) | `qr-code` (`utm_medium=qr`) |

- Chaque lien porte `referrer=utm_source=maroc-concour.com&utm_medium=website&utm_campaign=…&utm_content=fr|ar` :
  les installations par campagne se lisent dans la Play Console (rapports d'acquisition).
- Google Analytics 4 reçoit l'événement **`app_store_click`** (`placement`, `page_lang`) à chaque clic.
- Les liens sont masqués sur iPhone et iPad, et ne déclenchent pas d'annonce « vignette » AdSense.
- Le manifeste web préfère l'application (`prefer_related_applications`) : Chrome propose l'application de
  Google Play plutôt que d'installer le site.
- Textes et blocs : `scripts/lib/app-funnel.mjs` ; page de présentation : `scripts/lib/pages/app-landing.mjs`.
- Images (icône, captures, code QR, image de partage) : `python3 scripts/app-assets.py`, à relancer seulement
  si le zip Google Play ou le nom du paquet change (Pillow, OpenCV et Playwright ; inutile pour construire le site).

## Google Search Console, Analytics et AdSense

Tout se règle dans `content/site.mjs`, puis `npm run build` :

| Champ | Effet |
|---|---|
| `googleSiteVerification` | Ajoute la balise de vérification Search Console. Déclarez ensuite `sitemap.xml` dans la Search Console. |
| `ga4` | Ajoute Google Analytics 4 (identifiant `G-XXXXXXXXXX`) sur toutes les pages du site, jamais dans l’application Android. L’entraînement envoie aussi les événements `select_concours`, `quiz_start`, `quiz_complete` (mode, concours, score) et la recherche du site l’événement `search` ; la politique de confidentialité se met à jour toute seule. |
| `adsenseClient` | Ajoute le script AdSense (identifiant `ca-pub-…`) sur les pages de contenu (pas sur 404 ni hors ligne), génère `ads.txt` (et `app-ads.txt`, le même éditeur servant l’application Android via AdMob) et complète la politique de confidentialité. |

AdSense est configuré avec `ca-pub-3709043100488694`. Après validation du site par Google, activez les annonces
automatiques dans AdSense, ainsi que le message de consentement (Confidentialité et messages → Réglementations
européennes) pour les visiteurs de l'Espace économique européen, du Royaume-Uni et de la Suisse.

## Application Android (Cordova)

`cordova/www_concours_maroc.zip` est le dossier `www/` de l'application, généré à partir du site :
mêmes fiches, guides, outils et 2 308 questions, en français et en arabe, utilisables hors ligne, avec
barre d'onglets, bouton Retour Android, lecture à voix haute (cordova-plugin-tts-advanced) et
publicité AdMob (admob-plus-cordova, consentement UMP). Il garde la structure du premier `www/`
(`index.html`, `css/`, `js/`, `data/`, `i18n/`, `img/`, `fonts/`) et ajoute `pages/`.

- [`cordova/LISEZMOI-ANDROID.md`](cordova/LISEZMOI-ANDROID.md) : remplacer le `www/` du projet Cordova,
  plate-forme cordova-android 15 (API 36), plugins, identifiants AdMob, test et publication sur Google Play ;
- [`cordova/config.xml.exemple`](cordova/config.xml.exemple) : réglages à reporter dans `config.xml` ;
- [`cordova/package.json.exemple`](cordova/package.json.exemple) : plate-forme et les 5 plugins du projet Cordova (avec `local-plugins/`)
  (`npm install` puis `cordova prepare android`) ;
- `cordova/res/` : icônes (classiques et adaptatives) et écran de démarrage, à copier à la racine du
  projet Cordova ;
- [`cordova/FICHE-PLAY-STORE.md`](cordova/FICHE-PLAY-STORE.md) : fiche Google Play prête à copier (nom,
  descriptions en français et en arabe, sécurité des données, classification) ;
- `cordova/concours_maroc_play_store.zip` : tout pour la Play Console en un fichier (icône 512 px,
  bandeaux 1024 × 500, 8 captures par langue, textes de la fiche, `res/` et icône source) ;
- politique de confidentialité de l'application, à indiquer sur Google Play :
  `https://novanestatlas.github.io/concours-privacy.html` (même contenu que
  `https://www.maroc-concour.com/application/confidentialite/`, affichée dans l'application).

Après une modification du contenu, `npm run build:app` régénère `dist/cordova/www/` et le zip de `cordova/`
(en mode test : blocs d'annonces de démonstration de Google). Les identifiants AdMob de production restent hors
du dépôt public, dans `cordova/admob.local.json` (modèle : `admob.local.exemple.json`) ; le build produit alors
aussi `dist/cordova/production/www_concours_maroc.zip`.

## Travailler sur le site

Prérequis : Node.js 18 ou plus récent. Aucune dépendance à installer pour construire le site.

```bash
npm run build    # génère le site dans docs/
npm run serve    # aperçu local sur http://localhost:8080
npm run check    # vérifie liens, SEO, questions, et que docs/ est à jour
npm run images   # régénère icônes et images de partage (nécessite Playwright)
npm run build:app  # génère le www/ de l'application Android et cordova/www_concours_maroc.zip
```

Après toute modification de `content/` ou de `src/`, lancez `npm run build` et committez aussi le dossier `docs/`.

### Organisation du dépôt

```
content/
  site.mjs            réglages globaux (adresse, domaine, services)
  concours/*.mjs      une fiche par concours (FR + AR) : conditions, seuils, épreuves, examen blanc
  questions/          banques de QCM (.txt au format compact, .json historiques)
  guides/*.fr.md      guides en Markdown (version arabe : *.ar.md)
  calendar.mjs        dates des concours (officiel / annoncé / estimation)
  sources.json        sources citées
  taxonomy.mjs        domaines, séries du bac, matières
scripts/              générateur du site (build.mjs), de l'appli (build-app.mjs), vérifications (check.mjs), images
src/                  CSS, JavaScript (entraînement, outils), textes de l'application, images
src/app/              coquille de l'application Android (routeur, bouton Retour, synthèse vocale, AdMob)
src/img/app/          icône, captures et code QR de l'application, pour l'entonnoir du site
scripts/lib/app-funnel.mjs   blocs du site qui mènent à Google Play (en-tête, bandeau, cartes, accueil)
docs/                 site généré, publié par Cloudflare Pages (ne pas modifier à la main)
cordova/              www de l'application (zip), exemple de config.xml, notice Android, icônes (res/), fiche et zip Google Play
```

### Ajouter des questions

Dans un fichier `content/questions/<matière>.txt` :

```
[MAT-086] suites | intermediate
Q: Que vaut la somme 1 + 3 + 5 + … + 19 ?
* 100
- 90
- 110
- 81
C: La somme vaut 100.
E: C'est la somme des 10 premiers nombres impairs, qui vaut 10² = 100.
```

Quatre propositions exactement, une seule bonne réponse marquée `*` (l'ordre est mélangé automatiquement),
une correction `C:` et une explication `E:`. Une version arabe peut suivre après une ligne `AR:`.
Le build refuse toute question mal formée.

### Mettre à jour pour une nouvelle session

1. Mettez à jour les dates dans `content/calendar.mjs` et les seuils dans `content/concours/*.mjs`.
   Une nouvelle date reçoit `added: 'AAAA-MM-JJ'` (jour de sa mise en ligne) : les listes d'échéances
   (accueil, calendrier) l'affichent avec un badge « Nouveau » pendant 21 jours. Une date confirmée prend un
   nouvel `id` (pas celui de l'estimation qu'elle remplace), pour que les abonnés aux alertes soient prévenus.
2. Changez `updated`, `session` et `nextSession` dans `content/site.mjs`.
3. `npm run build`, `npm run check`, commit.

## Avertissement

Site indépendant, non affilié aux administrations et établissements cités. Les informations proviennent des avis
officiels et de sources datées citées sur chaque fiche ; seul l'avis officiel de chaque concours fait foi.
Les QCM sont des questions originales d'entraînement, pas des sujets officiels.

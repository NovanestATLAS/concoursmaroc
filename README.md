# Concours Maroc

Guide gratuit et bilingue (français / arabe) des concours et de l'orientation après le bac au Maroc :
conditions d'accès, seuils, épreuves, calendrier, QCM corrigés, examens blancs et outils pratiques.

Site statique, sans base de données ni serveur : il est hébergé gratuitement par **GitHub Pages**.
Le même contenu est aussi empaqueté en **application Android** (Apache Cordova) : voir plus bas.

## Ce que contient le site

| Rubrique | Contenu |
|---|---|
| Fiches concours (`/concours/`) | 31 fiches en français et en arabe : médecine, ISPITS, ENSA, ENSAM, CPGE, CNC, IAV, FST, EST, BTS, ENCG, ISCAE, ENA, ISIC, ISMAC/ISADAC, ISIT, ENS, écoles militaires, police, gendarmerie, Forces Auxiliaires, Protection civile, DGAPR, douane, fonction publique, OFPPT, 1337, université |
| Entraînement (`/entrainement/`) | 960 QCM corrigés dans 15 matières, examen blanc au barème du concours choisi, révisions espacées, défi du jour, favoris, statistiques ; le bouton retour du navigateur et du téléphone fonctionne |
| QCM corrigés (`/qcm/`) | Pages d'exemples par matière, avec réponses et explications (indexables par Google) |
| Outils (`/outils/`) | Calcul de la note du bac et de la présélection 75/25, orientation selon la série, calendrier avec rappels, planning de révision, checklist du dossier, simulateur de barème QCM |
| Guides (`/guides/`) | Orientation après le bac, Cursus Sup, bourse Minhaty, réussir un QCM, concours sans le bac, épreuves sportives, tests psychotechniques, entretien oral |

SEO : URL lisibles, titres et descriptions uniques, `hreflang` fr/ar, données structurées (Article, FAQ, Quiz,
fil d'Ariane…), `sitemap.xml`, `robots.txt`, images de partage par page, pages rapides et utilisables hors ligne.

## Mettre le site en ligne (GitHub Pages)

1. Sur GitHub, ouvrez **Settings → Pages**.
2. Dans **Build and deployment**, choisissez **Source : Deploy from a branch**.
3. Choisissez la branche qui contient le site (aujourd'hui `claude/concoursmaroc-github-site-x6v5br`, branche par défaut du dépôt) et le dossier **`/docs`**, puis **Save**.
4. Après une à deux minutes, le site est en ligne à l'adresse
   **https://www.maroc-concour.com/** (l'ancienne adresse
   `novanestatlas.github.io/concoursmaroc/` y redirige automatiquement).

Chaque nouveau commit sur cette branche met le site à jour automatiquement.

## Nom de domaine : www.maroc-concour.com

Le domaine `maroc-concour.com` est enregistré chez Spaceship.

- Dans `content/site.mjs` : `siteUrl: 'https://www.maroc-concour.com'` et
  `customDomain: 'www.maroc-concour.com'` ; le build écrit `docs/CNAME`, que GitHub Pages lit.
- DNS chez Spaceship (serveurs de noms Spaceship par défaut) :
  - `A` pour `@` vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153` et `185.199.111.153` ;
  - `AAAA` pour `@` vers `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` et `2606:50c0:8003::153` ;
  - `CNAME` pour `www` vers `novanestatlas.github.io`.
- `maroc-concour.com` (sans www) redirige vers `www.maroc-concour.com`.
- Dans **Settings → Pages**, cochez **Enforce HTTPS** dès que GitHub a émis le certificat
  (de quelques minutes à 24 h après la configuration DNS).

Pour changer de domaine plus tard : modifiez ces deux valeurs, `npm run build`, commit, puis adaptez les DNS.

## Google Search Console, Analytics et AdSense

Tout se règle dans `content/site.mjs`, puis `npm run build` :

| Champ | Effet |
|---|---|
| `googleSiteVerification` | Ajoute la balise de vérification Search Console. Déclarez ensuite `sitemap.xml` dans la Search Console. |
| `ga4` | Ajoute Google Analytics 4 (identifiant `G-XXXXXXXXXX`). |
| `adsenseClient` | Ajoute le script AdSense (identifiant `ca-pub-…`) sur les pages de contenu (pas sur 404 ni hors ligne), génère `ads.txt` (et `app-ads.txt`, le même éditeur servant l’application Android via AdMob) et complète la politique de confidentialité. |

AdSense est configuré avec `ca-pub-3709043100488694`. Après validation du site par Google, activez les annonces
automatiques dans AdSense, ainsi que le message de consentement (Confidentialité et messages → Réglementations
européennes) pour les visiteurs de l'Espace économique européen, du Royaume-Uni et de la Suisse.

## Application Android (Cordova)

`cordova/www_concours_maroc.zip` est le dossier `www/` de l'application, généré à partir du site :
mêmes fiches, guides, outils et 960 questions, en français et en arabe, utilisables hors ligne, avec
barre d'onglets, bouton Retour Android, lecture à voix haute (cordova-plugin-tts-advanced) et
publicité AdMob (admob-plus-cordova, consentement UMP). Il garde la structure du premier `www/`
(`index.html`, `css/`, `js/`, `data/`, `i18n/`, `img/`, `fonts/`) et ajoute `pages/`.

- [`cordova/LISEZMOI-ANDROID.md`](cordova/LISEZMOI-ANDROID.md) : remplacer le `www/` du projet Cordova,
  plate-forme cordova-android 15 (API 36), plugins, identifiants AdMob, test et publication sur Google Play ;
- [`cordova/config.xml.exemple`](cordova/config.xml.exemple) : réglages à reporter dans `config.xml` ;
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
docs/                 site généré, publié par GitHub Pages (ne pas modifier à la main)
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
2. Changez `updated`, `session` et `nextSession` dans `content/site.mjs`.
3. `npm run build`, `npm run check`, commit.

## Avertissement

Site indépendant, non affilié aux administrations et établissements cités. Les informations proviennent des avis
officiels et de sources datées citées sur chaque fiche ; seul l'avis officiel de chaque concours fait foi.
Les QCM sont des questions originales d'entraînement, pas des sujets officiels.

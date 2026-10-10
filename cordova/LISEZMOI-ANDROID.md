# Concours Maroc — construire l’APK Android avec Cordova

`www_concours_maroc.zip` contient le dossier `www/` de l’application, généré
à partir du site (`npm run build:app`). Il remplace le dossier `www/` de la
première version dans votre projet Cordova.

Versions vérifiées le 10/10/2026 : Cordova CLI 13.0.0, cordova-android 15.1.0,
admob-plus-cordova 2.0.0-alpha.19, cordova-plugin-consent 3.0.0-alpha.9,
cordova-plugin-tts-advanced 0.5.3.

## 1. Ce qui change par rapport à la première version

| | Première version | Cette version |
|---|---|---|
| Contenu | 500 questions, 6 matières | tout le site : 31 fiches concours, guides, outils, 960 questions, examens blancs (FR et AR) |
| Navigation | écrans de l’entraînement | barre d’onglets, menu, recherche, bouton Retour qui remonte l’historique puis quitte après deux appuis |
| Structure de `www/` | `index.html`, `css/app.css`, `js/`, `data/`, `i18n/`, `img/`, `fonts/` | les mêmes dossiers, plus `pages/` (une page HTML par page du site) et `js/outils/` |
| Progression enregistrée | clés `cm.v1.*` | les mêmes clés et les mêmes identifiants de questions : rien n’est perdu à la mise à jour |
| Plugins | AdMob Plus, consentement, synthèse vocale | les mêmes |

Rien n’est chargé depuis Internet : tout fonctionne hors ligne, sauf les
publicités et les liens vers les sites officiels (ouverts dans le navigateur).

## 2. Prérequis

- Node.js 20.17 ou plus récent (ou 22.9+) et `npm install -g cordova@13`
- JDK 17
- Android Studio avec le SDK Android 36 (plate-forme et Build-Tools 36.0.0)

## 3. Remplacer le dossier www

```sh
cd mon-projet-cordova
mv www www-v1                      # garde l'ancienne version de côté
unzip /chemin/vers/www_concours_maroc.zip   # crée le nouveau dossier www/
```

Fusionnez ensuite `config.xml.exemple` dans votre `config.xml`. Les lignes
indispensables y sont marquées ★ :

- `GradlePluginKotlinEnabled` : AdMob Plus et le plugin de consentement
  sont écrits en Kotlin et ne compilent pas sans elle ;
- le bloc `<queries>` `TTS_SERVICE` : sans lui, la lecture à voix haute ne
  trouve aucun moteur vocal depuis Android 11 ;
- les `allow-intent` : ouverture des liens externes ;
- `scheme` et `hostname` : gardez ceux de la première version, sinon la
  progression enregistrée sur les téléphones n’est plus retrouvée.

## 4. Plate-forme Android et plugins

Google Play exige depuis le 31 août 2026 que les nouvelles applications et
les mises à jour ciblent l’API 36 : il faut **cordova-android 15**. La 15.1.0
corrige en plus le bouton Retour (événement `backbutton` absent au premier
appui et avec le geste Retour), dont dépend l’application.

```sh
cordova platform remove android
cordova platform add android@15.1.0

cordova plugin add cordova-plugin-tts-advanced@0.5.3
cordova plugin add cordova-plugin-consent@3.0.0-alpha.9
cordova plugin add admob-plus-cordova@2.0.0-alpha.19 --save \
  --variable APP_ID_ANDROID=ca-app-pub-3940256099942544~3347511713
```

L’identifiant ci-dessus est l’**App ID de test** de Google. Avant de publier,
remplacez-le par le vôtre (retirez le plugin, puis ajoutez-le à nouveau avec
votre `APP_ID_ANDROID`).

Plugin facultatif : `cordova plugin add cordova-plugin-x-socialsharing@6.0.4`
pour le bouton Partager natif (sinon le lien de la page du site est copié).
Plus nécessaires : `cordova-plugin-statusbar` (cordova-android 15 gère la
barre d’état lui-même) et `cordova-plugin-inappbrowser`.

## 5. Publicité (AdMob)

Tous les réglages sont dans `www/js/ads-config.js`. Tant qu’il n’est pas
modifié, seuls les blocs d’annonces de test de Google sont utilisés.

Avant la publication :

1. créez l’application et ses blocs d’annonces dans AdMob ;
2. mettez leurs identifiants dans `ids` et passez `testMode` à `false` ;
3. installez le plugin avec votre App ID (étape 4).

Règles appliquées par l’application : jamais de publicité pendant une
question, première session sans publicité, au plus un interstitiel par
session terminée (après les résultats, au moins 10 réponses et 3 minutes
d’écart).

**Bannières et cordova-android 15.** AdMob Plus 2.0.0-alpha.19 affiche ses
bannières en déplaçant la WebView dans un `LinearLayout`. cordova-android 15
place la WebView dans un `FrameLayout` avec des marges pour les barres
système, et relit ces marges en `FrameLayout.LayoutParams` à chaque
changement (clavier, rotation) : une fois déplacée, la page passe sous la
barre d’état et l’application risque de planter dès l’ouverture du clavier.
Avec `banner: 'auto'` (par défaut), les bannières sont donc désactivées à
partir de cordova-android 15 ; les interstitiels, plein écran, ne sont pas
concernés. `banner: true` les force : testez alors sur un vrai téléphone,
clavier ouvert et après une rotation.

Le formulaire de consentement de Google (UMP) s’affiche quand la
réglementation l’exige ; l’élève peut revoir ses choix dans
Menu → Paramètres.

## 6. Tester puis publier

```sh
cordova run android                       # téléphone branché, mode débogage USB
cordova build android --release -- --packageType=bundle   # .aab pour Google Play
```

La signature se configure avec un fichier `build.json` ou les options
`--keystore`, `--alias`, `--storePassword` et `--password`. Gardez la clé de
signature en lieu sûr : sans elle, plus aucune mise à jour n’est possible.

À vérifier sur le téléphone :

- bouton et geste Retour : page précédente, puis accueil, puis
  « Appuyez encore sur Retour pour quitter » ;
- passage en arabe (menu → العربية) : mise en page de droite à gauche ;
- lecture à voix haute (bouton haut-parleur d’une question) et choix des
  voix dans Paramètres ;
- mode avion : toutes les pages, l’entraînement et les outils restent
  disponibles.

Fiche Google Play :

- politique de confidentialité :
  <https://novanestatlas.github.io/concoursmaroc/application/confidentialite/>
  (en arabe : `…/ar/application/confidentialite/`) ;
- section « Sécurité des données » : aucune donnée personnelle collectée par
  l’application elle-même ; déclarez celles du SDK Google Mobile Ads
  (identifiant publicitaire, adresse IP, interactions avec les annonces) ;
- public cible : 13 ans et plus.

## 7. Régénérer le dossier www

Après une modification du contenu (fiches, questions, guides) :

```sh
npm run build:app
```

Le dossier est écrit dans `dist/cordova/www/` et le zip copié dans
`cordova/www_concours_maroc.zip`.

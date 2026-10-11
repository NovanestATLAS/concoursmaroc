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
| Contenu | 500 questions, 6 matières | tout le site : 31 fiches concours, guides, outils, 1 044 questions, examens blancs (FR et AR) |
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

### Icône et écran de démarrage

Copiez le dossier `res/` de ce dépôt (`cordova/res/`) à la racine du projet
Cordova, à côté de `config.xml`, puis reprenez les lignes `<icon>` et les deux
préférences `AndroidWindowSplashScreen…` de `config.xml.exemple` :

| Fichiers | Rôle |
|---|---|
| `res/icon/android/{densité}.png` (36 à 192 px) | icône classique, Android 7 |
| `res/icon/android/{densité}-foreground.png` et `-background.png` (81 à 432 px) | icône adaptative, Android 8 et plus : le téléphone la découpe en cercle, carré arrondi… ; le dessin reste dans la zone sûre de 66 dp |
| `res/screen/android/splash-icon.png` (1152 px) | écran de démarrage, Android 12 et plus, sur le fond `#F9F7F4` (la couleur de l’icône) |

Le visuel est l’icône fournie par l’éditeur, sans la mosquée, en carré plein
(Google Play et Android appliquent eux-mêmes l’arrondi). L’icône 512 px, le
bandeau 1024 × 500 et les captures pour la fiche Google Play sont dans
`concours_maroc_play_store.zip`, avec le texte de la fiche
(`FICHE-PLAY-STORE.md`).

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
  --variable APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN
cordova plugin add cordova-launch-review@4.2.0
cordova plugin add ./local-plugins/cordova-plugin-play-update
```

Les deux derniers plugins servent à Google Play :

- **cordova-launch-review** : la fenêtre d’avis de Google Play (API In-App
  Review), demandée après une session réussie (≥ 60 %), à partir de la
  4e session et du 3e jour d’utilisation, au plus une fois tous les 90 jours.
  Google décide lui-même de l’afficher. Bouton « Noter l’application » dans
  les paramètres.
- **cordova-plugin-play-update** (dossier `local-plugins/` de ce dépôt, à
  copier à la racine du projet) : quand une version plus récente est publiée
  sur Google Play, une fenêtre propose « Mettre à jour » (écran de mise à jour
  de Google Play) ou « Plus tard » (3 jours). Bouton « Rechercher une mise à
  jour » dans les paramètres. Il utilise la bibliothèque officielle
  `com.google.android.play:app-update` ; l’ancien plugin `cordova-in-app-update`
  n’est pas utilisable (il impose `compileSdkVersion 28`).

Ces deux fonctions n’agissent que sur une application installée depuis
Google Play (test interne compris), pas sur un APK installé à la main.

Plus simple : copiez `package.json.exemple` sous le nom `package.json` à la
racine du projet (mettez-y votre App ID AdMob), puis `npm install` et
`cordova prepare android` installent d’un coup la plate-forme et les cinq
plugins aux bonnes versions (copiez aussi le dossier `local-plugins/`). Vérifié le 10/10/2026 avec Cordova 13 : projet
`com.novanest.concoursmaroc`, API 36, icônes adaptatives et écran de
démarrage générés, un seul `APPLICATION_ID` dans le manifeste.

Mettez directement l’**App ID** de votre application AdMob (celui avec un
`~`), dès la première installation : Google l’autorise aussi pendant les
tests. Changer d’App ID plus tard demande la procédure de la section 8,
sinon la compilation échoue sur un `APPLICATION_ID` en double.

Plugin facultatif : `cordova plugin add cordova-plugin-x-socialsharing@6.0.4`
pour le bouton Partager natif (sinon le lien de la page du site est copié).
Plus nécessaires : `cordova-plugin-statusbar` (cordova-android 15 gère la
barre d’état lui-même) et `cordova-plugin-inappbrowser`.

## 5. Publicité (AdMob)

Tous les réglages sont dans `www/js/ads-config.js` :

- `testMode: true` : blocs d’annonces de démonstration de Google, quels que
  soient les identifiants indiqués (aucune vraie annonce) ;
- `testMode: false` : vos blocs d’annonces (`ids`).

Le zip du dépôt GitHub est en mode test : vos identifiants n’y figurent pas,
le dépôt étant public. La version de production se génère avec vos blocs
d’annonces : copiez `admob.local.exemple.json` en `admob.local.json` (ignoré
par git), remplissez-le, puis `npm run build:app` écrit
`dist/cordova/production/www_concours_maroc.zip`.

Formats utilisés : bannière (voir ci-dessous) et interstitiel. Aucun écran ne
propose encore de récompense : un bloc « interstitiel avec récompense » peut
être indiqué (`rewardedInterstitial`) mais n’est pas demandé.

Avant d’ouvrir une version de production sur votre téléphone, déclarez-le
comme appareil de test dans AdMob (Paramètres → Appareils de test, avec
l’identifiant publicitaire du téléphone) et ne cliquez jamais sur vos propres
annonces.

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

Fiche Google Play : textes prêts à copier (nom, descriptions courte et
complète en français et en arabe), réponses « Sécurité des données » et
réglages dans [`FICHE-PLAY-STORE.md`](FICHE-PLAY-STORE.md). En bref :

- politique de confidentialité :
  <https://novanestatlas.github.io/concours-privacy.html> (même contenu que
  <https://www.maroc-concour.com/application/confidentialite/>, affichée
  dans l’application) ;
- site web du développeur : <https://novanestatlas.github.io/> (il porte le
  fichier `app-ads.txt` de toutes les applications Novanest ATLAS) ;
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

## 8. Dépannage

**`Element meta-data#com.google.android.gms.ads.APPLICATION_ID … duplicated`**
(tâche `processDebugMainManifest`). Le manifeste Android contient deux App ID
AdMob, en général l’App ID de test et le vôtre : le plugin a été installé
deux fois avec des valeurs différentes, ou le `config.xml` ajoute lui-même
cette balise. Dans le dossier du projet Cordova (invite de commandes) :

1. ouvrez `config.xml` et supprimez tout bloc `<config-file>` ou
   `<edit-config>` qui contient `com.google.android.gms.ads.APPLICATION_ID`
   (le plugin l’ajoute lui-même) ;
2. dans `config.xml` et `package.json`, la variable `APP_ID_ANDROID`
   d’`admob-plus-cordova` doit valoir votre App ID partout ;
3. `cordova plugin ls` : un seul plugin AdMob (`admob-plus-cordova`) ; retirez
   les autres avec `cordova plugin rm <nom> --save` ;
4. repartez d’une plate-forme propre :

   ```bat
   cordova plugin rm admob-plus-cordova --save
   cordova platform rm android
   rmdir /s /q platforms
   rmdir /s /q plugins
   cordova platform add android@15.1.0
   cordova plugin add admob-plus-cordova@2.0.0-alpha.19 --save --variable APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN
   cordova build android
   ```

Si un script `.bat` recrée le projet à chaque compilation, faites ces
corrections dans le script et les fichiers qu’il copie.

# Concours Maroc — construire l’APK Android avec Cordova

`www_concours_maroc.zip` contient le dossier `www/` de l’application, généré
à partir du site (`npm run build:app`). Il remplace le dossier `www/` de la
première version dans votre projet Cordova.

Versions vérifiées le 10/10/2026 : Cordova CLI 13.0.0, cordova-android 15.1.0,
admob-plus-cordova 2.0.0-alpha.19, cordova-plugin-consent 3.0.0-alpha.9,
cordova-plugin-tts-advanced 0.5.3. Ajoutés le 19/10/2026 : plugin local
cordova-plugin-system-insets (bannière), cordova-plugin-firebase-analytics
9.0.0, cordova-plugin-firebase-messaging 9.2.0, cordova-plugin-firebase-config
9.0.0.

## 1. Ce qui change par rapport à la première version

| | Première version | Cette version |
|---|---|---|
| Contenu | 500 questions, 6 matières | tout le site : 33 fiches concours, guides, outils, 2 308 questions, examens blancs (FR et AR) |
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
cordova plugin add ./local-plugins/cordova-plugin-system-insets

# Firebase (section 6) : google-services.json doit être à la racine du projet
cordova plugin add cordova-plugin-firebase-analytics@9.0.0 \
  --variable AUTOMATIC_SCREEN_REPORTING_ENABLED=false
cordova plugin add cordova-plugin-firebase-messaging@9.2.0
cordova plugin add cordova-plugin-firebase-config@9.0.0
```

**cordova-plugin-system-insets** (dossier `local-plugins/`, comme le suivant)
mesure la barre de navigation d’Android : c’est lui qui permet d’afficher la
bannière publicitaire avec cordova-android 15 (section 5).

Deux plugins servent à Google Play :

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

En plus de la fenêtre d’avis de Google, un message « Votre avis compte »
(bouton « Noter sur Google Play », qui ouvre la fiche de l’application)
apparaît au plus deux fois, à partir de la 8e session réussie et du 5e jour,
jamais moins de 30 jours après une fenêtre d’avis, avec « Ne plus demander ».
Il ne pose aucune question sur l’avis de l’élève et envoie tout le monde vers
la même page (règles de Google Play : pas de filtrage des avis, pas de
récompense).

Ces deux fonctions n’agissent que sur une application installée depuis
Google Play (test interne compris), pas sur un APK installé à la main.

Plus simple : copiez `package.json.exemple` sous le nom `package.json` à la
racine du projet (mettez-y votre App ID AdMob), puis `npm install` et
`cordova prepare android` installent d’un coup la plate-forme et les neuf
plugins aux bonnes versions (copiez aussi le dossier `local-plugins/` et
`google-services.json`). Vérifié le 10/10/2026 avec Cordova 13 : projet
`com.novanest.concoursmaroc`, API 36, icônes adaptatives et écran de
démarrage générés, un seul `APPLICATION_ID` dans le manifeste.

Mettez directement l’**App ID** de votre application AdMob (celui avec un
`~`), dès la première installation : Google l’autorise aussi pendant les
tests. Changer d’App ID plus tard demande la procédure de la section 10,
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

**Bannière.** AdMob Plus 2.0.0-alpha.19 a deux façons d’afficher une
bannière. Par défaut, il déplace la WebView dans un `LinearLayout`, ce que
cordova-android 15 ne supporte pas (la page passe sous la barre d’état et
l’application plante à l’ouverture du clavier) : c’est pour cela que la
bannière n’apparaissait pas dans la version précédente, elle était coupée à
partir de cordova-android 15. L’application utilise maintenant l’autre façon
(option `offset` d’AdMob Plus) : la bannière est posée par-dessus la fenêtre,
exactement sur le bord bas de la page, juste au-dessus de la barre de
navigation, et la page garde libre en bas la hauteur de l’annonce (rien
n’est caché, la barre d’onglets remonte au-dessus). La hauteur de la barre de
navigation est mesurée par le plugin local **cordova-plugin-system-insets** :
il doit être installé, sinon la bannière reste coupée avec cordova-android 15.
Pendant que le clavier est ouvert, ou si le téléphone tourne, la bannière se
masque puis revient d’elle-même. Taille : bannière adaptative ancrée (toute
la largeur). Réglage dans `ads-config.js` : `banner: false` la coupe.

Le formulaire de consentement de Google (UMP) s’affiche quand la
réglementation l’exige (utilisateurs de l’Espace économique européen, du
Royaume-Uni…) ; aucune annonce n’est demandée avant sa réponse. Dans ce cas,
le bouton « Modifier mes choix de confidentialité » apparaît dans
Menu → Paramètres. (La version précédente appelait une fonction absente du
plugin, `loadAndShowFormIfRequired` au lieu de `loadAndShowIfRequired` : le
formulaire ne pouvait pas s’afficher. C’est corrigé.)

## 6. Firebase : statistiques, alertes et annonces

Trois plugins (versions vérifiées le 19/10/2026), chacun facultatif :
l’application fonctionne sans eux et n’active que ce qui est installé.

| Plugin | Fonction dans l’application |
|---|---|
| `cordova-plugin-firebase-analytics@9.0.0` | Statistiques d’utilisation (Google Analytics for Firebase) : pages ouvertes et événements de l’entraînement (`select_concours`, `quiz_start`, `quiz_complete`, `search`), sans donnée personnelle. Interrupteur « Statistiques d’utilisation » dans les paramètres. |
| `cordova-plugin-firebase-messaging@9.2.0` | Notifications « Alertes concours » : l’élève les active dans les paramètres (Android 13+ demande l’autorisation), l’application s’abonne aux sujets `concours` et `concours_fr` ou `concours_ar`. |
| `cordova-plugin-firebase-config@9.0.0` | Remote Config : clé `annonce` pour la fenêtre d’annonce (ci-dessous). |

Mise en place :

1. [console.firebase.google.com](https://console.firebase.google.com) →
   Créer un projet (« Concours Maroc ») ; Google Analytics : activé, compte
   Analytics existant ou nouveau.
2. Ajouter une application **Android**, nom de package
   `com.novanest.concoursmaroc` (celui du `config.xml`). L’empreinte SHA-1
   n’est pas nécessaire pour ces trois fonctions.
3. Télécharger **google-services.json** et le poser à la racine du projet
   Cordova (à côté de `config.xml`). Le `config.xml.exemple` contient déjà la
   ligne `<resource-file src="google-services.json" …>` qui le copie dans
   l’application, ainsi que l’icône des notifications
   (`res/notification/`, à copier avec `res/`).
4. Installer les plugins (section 4), puis `cordova build android`.
5. Vérifier : Firebase → Analytics → **DebugView** après
   `adb shell setprop debug.firebase.analytics.app com.novanest.concoursmaroc`,
   ou le mode développeur (section 7).

Envoyer une alerte : Firebase → **Messaging** → Nouvelle campagne →
Notification ; Cible : **Sujet** `concours_fr` (élèves en français),
`concours_ar` (en arabe) ou `concours` (tous). Pour ouvrir une page de
l’application quand l’élève touche la notification, ajouter dans « Options
supplémentaires » → Données personnalisées la clé `route` avec l’adresse de
la page sans le domaine, par exemple `concours/police-dgsn/` ou
`ar/outils/calendrier-concours/`.

Annonce (fenêtre affichée une fois au démarrage, jamais pendant une
question, jamais au premier lancement) : deux sources possibles.

- **Sans Firebase** : `content/app-annonce.json` dans ce dépôt (un exemple y
  figure). Après `npm run build` et la mise en ligne du site, l’application
  lit `https://www.maroc-concour.com/app/annonce.json`.
- **Avec Firebase** : Remote Config → paramètre `annonce`, type JSON, même
  format ; il est prioritaire sur le fichier du site.

```json
{ "annonces": [ { "id": "2026-11-dgsn-ecrit", "from": "2026-11-10", "until": "2026-11-22",
  "fr": { "title": "Police : écrit le 22 novembre", "body": "Révisez avec l’examen blanc police.", "cta": "S’entraîner" },
  "ar": { "title": "الأمن الوطني: الكتابي يوم 22 نونبر", "body": "راجع بالامتحان التجريبي.", "cta": "تمرن" },
  "route": "entrainement/" } ] }
```

Changer l’`id` à chaque nouvelle annonce (chaque id ne s’affiche qu’une
fois). `url` (lien https) peut remplacer `route`.

Fiche Google Play → **Sécurité des données** : avec Firebase, déclarer en
plus « Activité dans les applications » (interactions, pages) et
« Identifiants de l’appareil » collectés pour les statistiques, non
partagés, chiffrés en transit, collecte facultative (interrupteur dans les
paramètres). La politique de confidentialité de l’application mentionne déjà
Firebase.

## 7. Mode développeur

Menu → Paramètres → toucher **six fois** le titre « À propos » (ou la ligne
« Version du contenu »). Un bouton « Mode développeur » apparaît alors dans
cette carte. L’écran :

- **Tout tester** vérifie chaque fonction et affiche ✓ (fonctionne), ✗
  (échec, avec la raison) ou – (plugin absent de cette version) : stockage,
  données, banques de questions, recherche, formules, navigation, réseau,
  lecture à voix haute, AdMob, consentement, bannière, mesure de l’écran,
  avis et mises à jour Google Play, Firebase Analytics, Messaging et Remote
  Config, annonces, barre d’état ; « Copier le rapport » copie le tout (JSON)
  pour me l’envoyer ;
- boutons de test : bannière (afficher/masquer), interstitiel et vidéo
  récompensée (en mode test seulement, pour ne jamais cliquer sur une vraie
  annonce), formulaire de confidentialité, remise à zéro du consentement et
  des plafonds, voix française et arabe, carte d’avis Google, message « Votre
  avis compte », fenêtre de mise à jour, recherche de mise à jour, événement
  Firebase, jeton de notification, Remote Config, aperçu d’annonce ;
- journal des erreurs et avertissements depuis le démarrage.

« Désactiver le mode développeur » en bas de l’écran le cache de nouveau.

## 8. Tester puis publier

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

## 9. Régénérer le dossier www

Après une modification du contenu (fiches, questions, guides) :

```sh
npm run build:app
```

Le dossier est écrit dans `dist/cordova/www/` et le zip copié dans
`cordova/www_concours_maroc.zip`.

## 10. Dépannage

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

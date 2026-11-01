@echo off
REM ==========================================================================
REM  Concours Maroc - plugins Cordova (Android), invite de commandes Windows.
REM  A lancer depuis le dossier du projet Cordova (celui qui contient
REM  config.xml), apres y avoir copie le dossier local-plugins.
REM  Un plugin deja installe est seulement signale : on peut relancer ce
REM  fichier sans risque. Versions verifiees : voir LISEZMOI-ANDROID.md.
REM ==========================================================================

REM App ID AdMob (avec un ~), utilise seulement si admob-plus-cordova n'est
REM pas encore installe : AdMob > Applications > Parametres de l'application.
set ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN

if not exist config.xml goto :noproject
if not exist local-plugins\cordova-plugin-system-insets\plugin.xml goto :nolocal
if not exist local-plugins\cordova-plugin-play-update\plugin.xml goto :nolocal

call cordova plugin add cordova-plugin-tts-advanced@0.5.3
call cordova plugin add cordova-plugin-consent@3.0.0-alpha.9

cordova plugin ls | findstr /i /c:"admob-plus-cordova" >nul
if not errorlevel 1 goto :admobok
if "%ADMOB_APP_ID%"=="ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN" goto :noappid
call cordova plugin add admob-plus-cordova@2.0.0-alpha.19 --save --variable APP_ID_ANDROID=%ADMOB_APP_ID%
goto :admobdone
:admobok
echo admob-plus-cordova deja installe : son App ID est conserve.
:admobdone

REM Avis Google Play, mises a jour Google Play, position de la banniere
call cordova plugin add cordova-launch-review@4.2.0
call cordova plugin add .\local-plugins\cordova-plugin-play-update
call cordova plugin add .\local-plugins\cordova-plugin-system-insets

REM Firebase (facultatif) : seulement avec google-services.json
if not exist google-services.json goto :nofirebase
call cordova plugin add cordova-plugin-firebase-analytics@9.0.0 --variable AUTOMATIC_SCREEN_REPORTING_ENABLED=false
call cordova plugin add cordova-plugin-firebase-messaging@9.2.0
call cordova plugin add cordova-plugin-firebase-config@9.0.0
goto :list
:nofirebase
echo Pas de google-services.json : plugins Firebase non ajoutes - facultatifs.

:list
echo.
call cordova plugin ls
echo.
echo Termine. Pensez a augmenter version dans config.xml avant l'envoi sur Google Play.
goto :eof

:noproject
echo Lancez ce fichier depuis le dossier du projet Cordova : config.xml introuvable ici.
exit /b 1
:nolocal
echo Copiez d'abord le dossier local-plugins a la racine du projet Cordova.
exit /b 1
:noappid
echo admob-plus-cordova n'est pas installe : indiquez votre App ID AdMob dans ADMOB_APP_ID en haut de ce fichier.
exit /b 1

/* Concours Maroc (Android app) — AdMob configuration.
 *
 * While testing, keep this file as it is: Google's official demo ad units are
 * used (https://developers.google.com/admob/android/test-ads) and no real
 * impression is ever counted.
 *
 * Before publishing on Google Play:
 *   1. create the app and its ad units in AdMob;
 *   2. put the ad unit identifiers below and set testMode to false;
 *   3. declare the AdMob *App ID* when installing the plugin:
 *        cordova plugin add admob-plus-cordova --save \
 *          --variable APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN
 *   4. never click on your own ads.
 */
window.CM_ADS_CONFIG = {
  testMode: true,
  ids: {
    // banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN',
    // interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN',
    // rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN'
  },
  // Placement rules (same defaults as before).
  minQuestionsBeforeInterstitial: 10,
  minGapMs: 180000,
  freeFirstSession: true,
  // Banners: 'auto' shows them up to cordova-android 14 and turns them off
  // from cordova-android 15, whose layout admob-plus-cordova 2.0.0-alpha.19
  // breaks (see js/ads-service.js). true forces them: test on a phone first,
  // with the keyboard open and after a rotation. false: never.
  banner: 'auto'
};

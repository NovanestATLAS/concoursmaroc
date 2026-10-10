/* Concours Maroc (Android app) — AdMob configuration.
 *
 * testMode: true  -> Google's demo ad units, whatever `ids` lists: no real
 *                    ad is ever requested (https://developers.google.com/admob/android/test-ads).
 * testMode: false -> the units in `ids`; a format without a unit is never
 *                    requested.
 *
 * Production units are not committed to the public repository: put them in
 * cordova/admob.local.json (see admob.local.exemple.json) and run
 * `npm run build:app`, which writes them here in a separate production zip.
 * The AdMob *App ID* is not set here but when installing the plugin:
 *   cordova plugin add admob-plus-cordova --save \
 *     --variable APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN
 * Never click on your own ads; declare your phone as a test device in AdMob.
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

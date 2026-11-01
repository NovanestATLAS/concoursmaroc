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
    // rewardedInterstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN'
  },
  // Banner on every screen, questions included, right under the tab bar.
  // 'auto': drawn over the bottom of the page with the local plugin
  // cordova-plugin-system-insets (needed from cordova-android 15), or under
  // the page up to cordova-android 14. true forces the second way, false
  // turns banners off.
  banner: 'auto',
  // Interstitials, never while a question is on screen nor over a dialog:
  //  - at the end of a set of at least `setQuestions` questions, unless the
  //    previous interstitial closed less than `minGapMs` ago;
  //  - otherwise at the first screen change once `maxGapMs` of use have
  //    passed since the previous one (or since the app was opened).
  setQuestions: 10,
  minGapMs: 180000,   // 3 minutes
  maxGapMs: 240000    // 4 minutes
};

/* Google Play in-app updates.
 *   PlayUpdate.check()          -> Promise<{ availability, versionCode, stalenessDays, priority, immediate, flexible }>
 *        availability: 'available' | 'not_available' | 'in_progress' | 'unknown'
 *   PlayUpdate.start('immediate'|'flexible') -> Promise<'accepted'|'cancelled'|'failed'>
 *   PlayUpdate.openStore()      -> opens the app's page in the Play Store
 */
var exec = require('cordova/exec');

function call(action, args) {
  return new Promise(function (resolve, reject) {
    exec(resolve, reject, 'PlayUpdate', action, args || []);
  });
}

module.exports = {
  check: function () { return call('check'); },
  start: function (type) { return call('start', [type === 'flexible' ? 'flexible' : 'immediate']); },
  openStore: function () { return call('openStore'); }
};

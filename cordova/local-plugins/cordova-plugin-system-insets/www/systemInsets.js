/* SystemInsets.get() -> Promise of
 *   { density, top, bottom, left, right,   // system bars + cutout, px
 *     ime, imeVisible,                      // keyboard height, px
 *     below,                                // px between the WebView and the bottom of the window
 *     contentHeight, webViewHeight }        // px
 */
var exec = require('cordova/exec');

exports.get = function () {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject, 'SystemInsets', 'get', []);
    });
};

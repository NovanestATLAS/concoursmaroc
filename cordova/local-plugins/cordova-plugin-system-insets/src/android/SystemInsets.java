package com.novanest.systeminsets;

import android.app.Activity;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Measures, in physical pixels, the system bars and the space left under the
 * Cordova WebView. cordova-android 15 draws the app edge to edge and keeps
 * the WebView above the navigation bar with a bottom margin; "below" is that
 * margin as seen on screen (navigation bar, or keyboard while it is open), so
 * an overlay banner placed "below" pixels above the bottom of the window sits
 * exactly on the bottom edge of the WebView, never under the navigation bar.
 */
public class SystemInsets extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callback) {
        if (!"get".equals(action)) return false;
        final Activity activity = cordova.getActivity();
        activity.runOnUiThread(() -> {
            try {
                callback.success(measure(activity));
            } catch (Exception e) {
                callback.error(String.valueOf(e.getMessage()));
            }
        });
        return true;
    }

    private JSONObject measure(Activity activity) throws JSONException {
        JSONObject out = new JSONObject();
        out.put("density", activity.getResources().getDisplayMetrics().density);

        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(activity.getWindow().getDecorView());
        if (insets != null) {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            out.put("top", bars.top);
            out.put("bottom", bars.bottom);
            out.put("left", bars.left);
            out.put("right", bars.right);
            out.put("ime", insets.getInsets(WindowInsetsCompat.Type.ime()).bottom);
            out.put("imeVisible", insets.isVisible(WindowInsetsCompat.Type.ime()));
        }

        View content = activity.findViewById(android.R.id.content);
        View web = webView != null ? webView.getView() : null;
        if (content != null && web != null) {
            int[] c = new int[2];
            int[] w = new int[2];
            content.getLocationInWindow(c);
            web.getLocationInWindow(w);
            int below = (c[1] + content.getHeight()) - (w[1] + web.getHeight());
            out.put("below", Math.max(0, below));
            out.put("contentHeight", content.getHeight());
            out.put("webViewHeight", web.getHeight());
        }
        return out;
    }
}

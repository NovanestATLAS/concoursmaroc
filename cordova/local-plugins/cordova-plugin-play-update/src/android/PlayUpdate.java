package com.novanest.playupdate;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Google Play in-app updates for Cordova.
 * check: is a newer version published on Google Play?
 * start: opens Google Play's own update screen (immediate: full screen,
 * the app restarts updated; flexible: download in the background, then the
 * app is restarted to install it).
 */
public class PlayUpdate extends CordovaPlugin {
    private static final int REQUEST_CODE = 0x5055; // "PU"
    private AppUpdateManager manager;
    private CallbackContext pending;
    private com.google.android.play.core.install.InstallStateUpdatedListener flexibleListener;

    private AppUpdateManager manager() {
        if (manager == null) manager = AppUpdateManagerFactory.create(cordova.getContext());
        return manager;
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callback) throws JSONException {
        switch (action) {
            case "check":
                check(callback);
                return true;
            case "start":
                start(args.optString(0, "immediate"), callback);
                return true;
            case "openStore":
                openStore(callback);
                return true;
            default:
                return false;
        }
    }

    private void check(final CallbackContext callback) {
        manager().getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                try {
                    JSONObject o = new JSONObject();
                    int a = info.updateAvailability();
                    o.put("availability",
                        a == UpdateAvailability.UPDATE_AVAILABLE ? "available"
                        : a == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS ? "in_progress"
                        : a == UpdateAvailability.UPDATE_NOT_AVAILABLE ? "not_available" : "unknown");
                    o.put("versionCode", info.availableVersionCode());
                    Integer stale = info.clientVersionStalenessDays();
                    o.put("stalenessDays", stale == null ? -1 : stale);
                    o.put("priority", info.updatePriority());
                    o.put("immediate", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
                    o.put("flexible", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE));
                    o.put("downloaded", info.installStatus() == InstallStatus.DOWNLOADED);
                    callback.success(o);
                } catch (JSONException e) {
                    callback.error(e.getMessage());
                }
            })
            .addOnFailureListener(e -> callback.error(String.valueOf(e.getMessage())));
    }

    private void start(final String kind, final CallbackContext callback) {
        final int type = "flexible".equals(kind) ? AppUpdateType.FLEXIBLE : AppUpdateType.IMMEDIATE;
        manager().getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                // a flexible update already downloaded: install it now
                if (info.installStatus() == InstallStatus.DOWNLOADED) {
                    manager().completeUpdate();
                    callback.success("accepted");
                    return;
                }
                boolean ok = (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                        || info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS)
                        && info.isUpdateTypeAllowed(type);
                if (!ok) {
                    callback.error("not_allowed");
                    return;
                }
                if (type == AppUpdateType.FLEXIBLE) listenFlexible();
                launch(info, type, callback);
            })
            .addOnFailureListener(e -> callback.error(String.valueOf(e.getMessage())));
    }

    @SuppressWarnings("deprecation")
    private void launch(final AppUpdateInfo info, final int type, final CallbackContext callback) {
        final Activity activity = cordova.getActivity();
        activity.runOnUiThread(() -> {
            try {
                pending = callback;
                cordova.setActivityResultCallback(this);
                boolean started = manager().startUpdateFlowForResult(
                        info, activity, AppUpdateOptions.newBuilder(type).build(), REQUEST_CODE);
                if (!started) {
                    pending = null;
                    callback.error("failed");
                }
            } catch (Exception e) {
                pending = null;
                callback.error(String.valueOf(e.getMessage()));
            }
        });
    }

    /* Flexible flow: once Google Play has downloaded the update, install it. */
    private void listenFlexible() {
        if (flexibleListener != null) return;
        flexibleListener = state -> {
            if (state.installStatus() == InstallStatus.DOWNLOADED) {
                manager().unregisterListener(flexibleListener);
                flexibleListener = null;
                manager().completeUpdate();
            }
        };
        manager().registerListener(flexibleListener);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        if (requestCode != REQUEST_CODE || pending == null) return;
        CallbackContext cb = pending;
        pending = null;
        if (resultCode == Activity.RESULT_OK) cb.success("accepted");
        else if (resultCode == Activity.RESULT_CANCELED) cb.success("cancelled");
        else cb.success("failed");
    }

    private void openStore(final CallbackContext callback) {
        String pkg = cordova.getActivity().getPackageName();
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            cordova.getActivity().startActivity(intent);
        } catch (ActivityNotFoundException e) {
            cordova.getActivity().startActivity(new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=" + pkg)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
        callback.success();
    }

    @Override
    public void onDestroy() {
        if (flexibleListener != null && manager != null) manager.unregisterListener(flexibleListener);
        super.onDestroy();
    }
}

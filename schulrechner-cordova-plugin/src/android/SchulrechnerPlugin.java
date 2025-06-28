package com.schulrechner.plugin;

import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebSettings;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;

public class SchulrechnerPlugin extends CordovaPlugin {
    private static final String LOG_TAG = "SchulrechnerPlugin";

    @Override
    public void initialize(final CordovaInterface cordova, final CordovaWebView webView) {
        super.initialize(cordova, webView);

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    WebView wv = (WebView) webView.getEngine().getView();
                    WebSettings ws = wv.getSettings();

                    Log.w(LOG_TAG, "[ResetFontSize][loaded] getTextZoom: " + ws.getTextZoom());
                    ws.setTextZoom(100);
                    Log.w(LOG_TAG, "[ResetFontSize][updated] getTextZoom: " + ws.getTextZoom());
                } catch (Exception e) {
                    Log.e(LOG_TAG, "Error setting WebView text zoom", e);
                }
            }
        });
    }
}

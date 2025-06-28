package com.schulrechner.plugin;

import android.webkit.WebView;
import android.webkit.WebSettings;

import org.apache.cordova.*;
import org.json.JSONArray;

public class SchulrechnerPlugin extends CordovaPlugin {
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        WebView view = (WebView) webView.getEngine().getView();
        WebSettings settings = view.getSettings();
        settings.setTextSize(WebSettings.TextSize.NORMAL);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        return false; // no JS bridge needed
    }
}

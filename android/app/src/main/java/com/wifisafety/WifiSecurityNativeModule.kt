package com.wifisafety

import android.content.Context
import android.net.ConnectivityManager
import android.net.wifi.WifiInfo
import com.facebook.react.bridge.*

class WifiSecurityNativeModule(ctx: ReactApplicationContext)
  : ReactContextBaseJavaModule(ctx) {

  override fun getName() = "WifiSecurityNative"

  @ReactMethod
  fun getCurrentSecurity(promise: Promise) {
    val cm = reactApplicationContext
      .getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val caps = cm.getNetworkCapabilities(cm.activeNetwork)
    val wifi = caps?.transportInfo as? WifiInfo

    if (wifi == null) {
      promise.resolve(result("UNKNOWN", null))
      return
    }

    val sec = when (wifi.currentSecurityType) {
      WifiInfo.SECURITY_TYPE_OPEN -> "OPEN"
      WifiInfo.SECURITY_TYPE_WEP -> "WEP"
      WifiInfo.SECURITY_TYPE_PSK,
      WifiInfo.SECURITY_TYPE_SAE -> "WPA_PERSONAL"
      WifiInfo.SECURITY_TYPE_EAP,
      WifiInfo.SECURITY_TYPE_EAP_WPA3_ENTERPRISE -> "WPA_ENTERPRISE"
      else -> "UNKNOWN"
    }

    promise.resolve(result(sec, wifi.ssid))
  }

  private fun result(sec: String, ssid: String?): WritableMap {
    val m = Arguments.createMap()
    m.putString("platform", "android")
    m.putString("securityType", sec)
    if (ssid != null) m.putString("ssid", ssid.replace("\"", ""))
    return m
  }
}

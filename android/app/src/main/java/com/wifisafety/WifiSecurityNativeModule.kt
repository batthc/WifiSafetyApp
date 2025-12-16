package com.wifisafety

import android.content.Context
import android.net.ConnectivityManager
import android.net.wifi.WifiInfo
import com.facebook.react.bridge.*

class WifiSecurityNativeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "WifiSecurityNative"

  @ReactMethod
  fun getCurrentSecurity(promise: Promise) {
    try {
      val cm = reactApplicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
      val network = cm.activeNetwork
      if (network == null) {
        promise.resolve(result("UNKNOWN", null, null))
        return
      }

      val caps = cm.getNetworkCapabilities(network)
      val wifiInfo = caps?.transportInfo as? WifiInfo
      if (wifiInfo == null) {
        promise.resolve(result("UNKNOWN", null, null))
        return
      }

      val ssid = wifiInfo.ssid?.replace("\"", "")
      val bssid = wifiInfo.bssid

      val security = try {
        when (wifiInfo.currentSecurityType) {
          WifiInfo.SECURITY_TYPE_OPEN -> "OPEN"
          WifiInfo.SECURITY_TYPE_WEP -> "WEP"
          WifiInfo.SECURITY_TYPE_PSK,
          WifiInfo.SECURITY_TYPE_SAE -> "WPA_PERSONAL"
          WifiInfo.SECURITY_TYPE_EAP,
          WifiInfo.SECURITY_TYPE_EAP_WPA3_ENTERPRISE -> "WPA_ENTERPRISE"
          else -> "UNKNOWN"
        }
      } catch (t: Throwable) {
        "UNKNOWN"
      }

      promise.resolve(result(security, ssid, bssid))
    } catch (e: Throwable) {
      promise.reject("ERR_WIFI_SECURITY", e)
    }
  }

  private fun result(security: String, ssid: String?, bssid: String?): WritableMap {
    val map = Arguments.createMap()
    map.putString("platform", "android")
    map.putString("securityType", security)
    if (ssid != null) map.putString("ssid", ssid)
    if (bssid != null) map.putString("bssid", bssid)
    return map
  }
}
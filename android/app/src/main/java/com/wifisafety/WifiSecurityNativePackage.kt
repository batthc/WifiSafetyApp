package com.wifisafety

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

class WifiSecurityNativePackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext) =
    listOf(WifiSecurityNativeModule(ctx))
  override fun createViewManagers(ctx: ReactApplicationContext) =
    emptyList<ViewManager<*, *>>()
}

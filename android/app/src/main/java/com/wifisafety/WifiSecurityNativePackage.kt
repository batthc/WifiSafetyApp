package com.wifisafety

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class WifiSecurityNativePackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> {
    return listOf(WifiSecurityNativeModule(ctx))
  }

  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}

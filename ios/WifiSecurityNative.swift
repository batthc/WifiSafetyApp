import Foundation
import NetworkExtension

@objc(WifiSecurityNative)
class WifiSecurityNative: NSObject {

  // React Native Promise method
  @objc
  func getCurrentSecurity(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {

    // Best-effort: may return nil depending on entitlements / OS conditions
    NEHotspotNetwork.fetchCurrent { network in
      guard let n = network else {
        resolve([
          "platform": "ios",
          "securityType": "UNKNOWN"
        ])
        return
      }

      let sec: String

      // Note: enum cases vary by iOS SDK; adjust if Xcode complains.
      switch n.securityType {
      case .open:
        sec = "OPEN"

      // Personal (PSK) security: WPA/WPA2/WPA3
      case .wpa, .wpa2, .wpa3:
        sec = "WPA_PERSONAL"

      // Enterprise security
      case .wpaEnterprise, .wpa2Enterprise, .wpa3Enterprise:
        sec = "WPA_ENTERPRISE"

      default:
        sec = "UNKNOWN"
      }

      var out: [String: Any] = [
        "platform": "ios",
        "securityType": sec
      ]

      // SSID/BSSID may be empty depending on restrictions
      out["ssid"] = n.ssid
      out["bssid"] = n.bssid

      resolve(out)
    }
  }

  // RN module setup
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

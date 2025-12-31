import Foundation
import NetworkExtension

@objc(WifiSecurityNative)
class WifiSecurityNative: NSObject {

  @objc
  func getCurrentSecurity(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {

    NEHotspotNetwork.fetchCurrent { network in
      guard let n = network else {
        resolve([
          "platform": "ios",
          "securityType": "UNKNOWN"
        ])
        return
      }

      let sec: String
      switch n.securityType {
      case .open:
        sec = "OPEN"
      case .wpa, .wpa2, .wpa3:
        sec = "WPA_PERSONAL"
      case .wpaEnterprise, .wpa2Enterprise, .wpa3Enterprise:
        sec = "WPA_ENTERPRISE"
      default:
        sec = "UNKNOWN"
      }

      var out: [String: Any] = [
        "platform": "ios",
        "securityType": sec
      ]
      out["ssid"] = n.ssid
      out["bssid"] = n.bssid

      resolve(out)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}

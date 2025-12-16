import { NativeModules, Platform } from "react-native";

export type SecurityType =
  | "OPEN"
  | "WEP"
  | "WPA_PERSONAL"
  | "WPA_ENTERPRISE"
  | "UNKNOWN";

export type WifiSecurityResult = {
  platform: "android" | "ios";
  securityType: SecurityType;
  ssid?: string;
  bssid?: string;
};

const { WifiSecurityNative } = NativeModules;

export async function getCurrentSecurity(): Promise<WifiSecurityResult> {
    if (!WifiSecurityNative) {
        return { platform: Platform.OS as any, securityType: "UNKNOWN" };
    }
    return WifiSecurityNative.getCurrentSecurity();
};
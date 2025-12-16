import { PermissionsAndroid, Platform } from "react-native";

export async function ensureWifiPermissions(): Promise<boolean> {
  
  if (Platform.OS !== "android") return true;

  const fineLocation = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Location permission required",
      message:
        "Android needs this permission to read Wi-Fi security details (SSID/encryption type).",
      buttonPositive: "OK",
    }
  );

  return fineLocation === PermissionsAndroid.RESULTS.GRANTED;
}
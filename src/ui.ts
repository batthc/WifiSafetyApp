import { SecurityType } from "./WifiSecurity";

export function prettySecurity(s: SecurityType) {
  switch (s) {
    case "OPEN": return "Open (no password)";
    case "WEP": return "WEP (unsafe)";
    case "WPA_PERSONAL": return "WPA / WPA2 / WPA3";
    case "WPA_ENTERPRISE": return "WPA Enterprise";
    default: return "Unknown";
  }
}

export function riskLabel(s: SecurityType) {
  if (s === "OPEN" || s === "WEP") return "HIGH RISK";
  if (s === "UNKNOWN") return "UNKNOWN";
  return "LOWER RISK";
}

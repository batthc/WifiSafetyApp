import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View, Pressable, Platform } from "react-native";
import { ensureWifiPermissions } from "./src/permissions";
import { getCurrentSecurity, WifiSecurityResult } from "./src/WifiSecurity";
import { prettySecurity, riskLabel } from "./src/ui";
import { postScan, HealthResult } from "./src/api";

export default function App() {
  const [wifi, setWifi] = useState<WifiSecurityResult | null>(null);
  const [backend, setBackend] = useState<HealthResult | null>(null);
  const [scoreText, setScoreText] = useState<string>("");

  async function runScan() {
    setScoreText("");

    // Android needs runtime location permission before Wi-Fi details are available
    if (Platform.OS === "android") {
      await ensureWifiPermissions();
    }

    // Calls native module through JS bridge (Android Kotlin / iOS Swift)
    const w = await getCurrentSecurity();
    setWifi(w);

    // Sends scan payload to your AWS backend for scoring
    try {
      const resp = await postScan({
        device_id: "android-dev-12345678",
        network: {
          ssid: w.ssid ?? "UNKNOWN",
          bssid: w.bssid ?? null,
          country: "CA",
          security: w.securityType,
        },
        checks: {
          client_isolation: null,
          arp_anomaly: false,
          dns_anomaly: false,
          tls_intercept: false,
          captive_portal: false,
        },
        client: { platform: Platform.OS, app_version: "0.1.0" },
      });

      setScoreText(
        `Score: ${resp.score} (${resp.risk_label})\nReasons: ${resp.top_reasons
          .map((r) => r.code)
          .join(", ")}`
      );
    } catch (e: any) {
      setScoreText(`Backend error: ${e?.message ?? String(e)}`);
    }
  }

  async function checkBackend() {
    try {
      const h = await (await import("./src/api")).getHealth();
      setBackend(h);
    } catch (e: any) {
      setBackend({ ok: false, detail: e?.message ?? String(e) });
    }
  }

  useEffect(() => {
    checkBackend();
    runScan();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>NetGuardian</Text>

      <View style={{ marginTop: 12 }}>
        <Text style={{ opacity: 0.7 }}>
          Backend:{" "}
          {backend
            ? backend.ok
              ? "OK"
              : `ERROR (${backend.detail ?? "unknown"})`
            : "checking..."}
        </Text>
      </View>

      <View style={{ marginTop: 20, padding: 16, borderWidth: 1, borderRadius: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Wi-Fi Encryption</Text>

        {wifi ? (
          <>
            <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "700" }}>
              {riskLabel(wifi.securityType)}
            </Text>
            <Text style={{ marginTop: 8 }}>
              Encryption: {prettySecurity(wifi.securityType)}
            </Text>
            <Text style={{ marginTop: 6 }}>SSID: {wifi.ssid ?? "N/A"}</Text>
            <Text style={{ marginTop: 6 }}>BSSID: {wifi.bssid ?? "N/A"}</Text>

            {Platform.OS === "android" && (
              <Text style={{ marginTop: 10, opacity: 0.7 }}>
                Emulator often reports OPEN/UNKNOWN because it isn’t real Wi-Fi hardware.
              </Text>
            )}
          </>
        ) : (
          <Text style={{ marginTop: 10 }}>Scanning…</Text>
        )}
      </View>

      <View style={{ marginTop: 18, padding: 16, borderWidth: 1, borderRadius: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Backend Score</Text>
        <Text style={{ marginTop: 10 }}>{scoreText || "—"}</Text>
      </View>

      <Pressable
        onPress={() => {
          checkBackend();
          runScan();
        }}
        style={{ marginTop: 20, padding: 12, borderWidth: 1, borderRadius: 10 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "700" }}>Re-scan</Text>
      </Pressable>
    </SafeAreaView>
  );
}

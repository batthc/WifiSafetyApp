import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View, Pressable, Platform } from "react-native";
import { ensureWifiPermissions } from "./src/permissions";
import { getCurrentSecurity, WifiSecurityResult } from "./src/WifiSecurity";
import { prettySecurity, riskLabel } from "./src/ui";

export default function App() {
  const [res, setRes] = useState<WifiSecurityResult | null>(null);

  async function run() {
    if (Platform.OS === "android") {
      await ensureWifiPermissions();
    }
    const r = await getCurrentSecurity();
    setRes(r);
  }

  useEffect(() => {
    run();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Wi-Fi Safety</Text>

      <View style={{ marginTop: 24 }}>
        {res ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              {riskLabel(res.securityType)}
            </Text>
            <Text style={{ marginTop: 8 }}>
              Encryption: {prettySecurity(res.securityType)}
            </Text>
            <Text>SSID: {res.ssid ?? "N/A"}</Text>
          </>
        ) : (
          <Text>Scanning…</Text>
        )}
      </View>

      <Pressable
        onPress={run}
        style={{ marginTop: 24, padding: 12, borderWidth: 1, borderRadius: 10 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "700" }}>
          Re-scan
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

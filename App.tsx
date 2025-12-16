import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ensureWifiPermissions } from "./src/permissions";
import { getCurrentSecurity, WifiSecurityResult } from "./src/WifiSecurity";

export default function App() {
  const [res, setRes] = useState<WifiSecurityResult | null>(null);

  useEffect(() => {
    (async () => {
      const ok = await ensureWifiPermissions();

      if (!ok) {
        console.log("User denied location permission");
      }

      const r = await getCurrentSecurity();
      console.log("Wi-Fi security:", r);
      setRes(r);
    })();
  }, []);

  return (
    <View style={{ padding: 32 }}>
      <Text style={{ fontSize: 18 }}>Wi-Fi Security</Text>
      <Text>{res ? JSON.stringify(res, null, 2) : "Loading..."}</Text>
    </View>
  );
}
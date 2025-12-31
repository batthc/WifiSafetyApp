export const API_BASE = "https://knwpbiz6la.execute-api.ca-central-1.amazonaws.com";

export type HealthResult = { ok: boolean; detail?: string };

export async function getHealth(): Promise<HealthResult> {
  const res = await fetch(`${API_BASE}/health`);
  const text = await res.text();
  if (!res.ok) return { ok: false, detail: text };
  return { ok: true };
}

export type ScanPayload = {
  device_id: string;
  network: {
    ssid: string;
    bssid: string | null;
    country: string | null;
    security: string | null;
  };
  checks: {
    client_isolation: boolean | null;
    arp_anomaly: boolean | null;
    dns_anomaly: boolean | null;
    tls_intercept: boolean | null;
    captive_portal: boolean | null;
  };
  client?: { platform?: string | null; app_version?: string | null };
};

export async function postScan(payload: ScanPayload): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

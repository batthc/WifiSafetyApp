#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./test_scan.sh <API_BASE_URL>"
  exit 1
fi

API="$1"

echo "Health:"
curl -s "$API/health"
echo
echo

echo "Scan:"
curl -s -X POST "$API/v1/scans" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id":"dev-12345678",
    "network":{"ssid":"CafeWiFi","bssid":"aa:bb:cc:dd:ee:ff","country":"CA","security":"OPEN"},
    "checks":{"client_isolation":false,"arp_anomaly":true,"dns_anomaly":false,"tls_intercept":false,"captive_portal":true},
    "client":{"platform":"android","app_version":"0.1.0"}
  }'
echo

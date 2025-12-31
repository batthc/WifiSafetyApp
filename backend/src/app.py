from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Literal, Optional

import boto3
from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel, Field

app = FastAPI(title="NetGuardian API", version="0.1.0")
handler = Mangum(app)

dynamodb = boto3.resource("dynamodb")
secrets = boto3.client("secretsmanager")

SCANS_TABLE = os.environ["SCANS_TABLE"]
REPUTATION_TABLE = os.environ["REPUTATION_TABLE"]
HMAC_SECRET_ID = os.environ["HMAC_SECRET_ID"]

_cached_hmac_secret: Optional[bytes] = None


def get_hmac_secret() -> bytes:
  global _cached_hmac_secret
  if _cached_hmac_secret is not None:
    return _cached_hmac_secret

  resp = secrets.get_secret_value(SecretId=HMAC_SECRET_ID)
  secret_str = resp.get("SecretString")
  if not secret_str:
    raise RuntimeError("SecretString missing in Secrets Manager secret")

  _cached_hmac_secret = secret_str.encode("utf-8")
  return _cached_hmac_secret


class NetworkInfo(BaseModel):
  ssid: str = Field(min_length=1, max_length=64)
  bssid: Optional[str] = Field(default=None, max_length=32)
  country: Optional[str] = Field(default=None, max_length=8)
  security: Optional[str] = Field(default=None, max_length=32)


class Checks(BaseModel):
  client_isolation: Optional[bool] = None
  arp_anomaly: Optional[bool] = None
  dns_anomaly: Optional[bool] = None
  tls_intercept: Optional[bool] = None
  captive_portal: Optional[bool] = None


class ClientMeta(BaseModel):
  platform: Optional[str] = None
  app_version: Optional[str] = None


class ScanRequest(BaseModel):
  device_id: str = Field(min_length=8, max_length=128)
  network: NetworkInfo
  checks: Checks
  client: Optional[ClientMeta] = None


class ScanResponse(BaseModel):
  fingerprint: str
  score: int
  risk_label: Literal["LOW", "MEDIUM", "HIGH"]
  top_reasons: list[dict]
  advice: list[str]
  reputation: dict


def hmac_fingerprint(ssid: str, bssid: Optional[str], country: Optional[str]) -> str:
  secret = get_hmac_secret()
  data = f"{ssid.strip().lower()}|{(bssid or '').strip().lower()}|{(country or '').strip().upper()}"
  digest = hmac.new(secret, data.encode("utf-8"), hashlib.sha256).digest()
  return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def compute_score(req: ScanRequest, rep_seen: int, rep_high_rate: float):
  score = 100
  reasons = []

  sec = (req.network.security or "").upper()
  if sec == "OPEN":
    score -= 40
    reasons.append({"code": "OPEN_WIFI", "impact": -40})
  elif sec == "WEP":
    score -= 40
    reasons.append({"code": "WEP_WIFI", "impact": -40})

  c = req.checks
  if c.client_isolation is False:
    score -= 15
    reasons.append({"code": "NO_CLIENT_ISOLATION", "impact": -15})
  if c.arp_anomaly:
    score -= 25
    reasons.append({"code": "ARP_SPOOF_SIGNALS", "impact": -25})
  if c.dns_anomaly:
    score -= 20
    reasons.append({"code": "DNS_ANOMALY", "impact": -20})
  if c.tls_intercept:
    score -= 35
    reasons.append({"code": "TLS_INTERCEPT", "impact": -35})
  if c.captive_portal and sec == "OPEN":
    score -= 5
    reasons.append({"code": "CAPTIVE_PORTAL_ON_OPEN_WIFI", "impact": -5})

  if rep_seen >= 30 and rep_high_rate >= 0.30:
    score -= 10
    reasons.append({"code": "BAD_REPUTATION", "impact": -10})

  score = max(0, min(100, score))
  if score >= 80:
    label = "LOW"
  elif score >= 50:
    label = "MEDIUM"
  else:
    label = "HIGH"

  reasons = sorted(reasons, key=lambda r: r["impact"])[:3]

  if label == "HIGH":
    advice = [
      "Avoid logging into banking/email/work accounts on this Wi-Fi.",
      "Use a VPN or switch to mobile hotspot if possible.",
      "Avoid entering passwords; prefer HTTPS-only browsing.",
    ]
  elif label == "MEDIUM":
    advice = [
      "Use a VPN before sensitive logins.",
      "Avoid financial activity unless you trust the network.",
    ]
  else:
    advice = ["Lower risk based on checks. Still prefer HTTPS; VPN is optional."]

  return score, label, reasons, advice


def get_rep(fingerprint: str):
  table = dynamodb.Table(REPUTATION_TABLE)
  item = table.get_item(Key={"fingerprint": fingerprint}).get("Item")
  if not item:
    return 0, 0.0
  seen = int(item.get("seen", 0))
  high = int(item.get("high", 0))
  high_rate = (high / seen) if seen > 0 else 0.0
  return seen, high_rate


def update_rep(fingerprint: str, label: str):
  table = dynamodb.Table(REPUTATION_TABLE)
  is_high = 1 if label == "HIGH" else 0
  table.update_item(
    Key={"fingerprint": fingerprint},
    UpdateExpression="ADD seen :one, high :high",
    ExpressionAttributeValues={":one": 1, ":high": is_high},
  )


@app.get("/health")
def health():
  return {"ok": True}


@app.post("/v1/scans", response_model=ScanResponse)
def post_scan(req: ScanRequest):
  try:
    fp = hmac_fingerprint(req.network.ssid, req.network.bssid, req.network.country)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"fingerprint_error: {e}")

  seen, high_rate = get_rep(fp)
  score, label, reasons, advice = compute_score(req, rep_seen=seen, rep_high_rate=high_rate)

  scans = dynamodb.Table(SCANS_TABLE)
  now = int(time.time())
  scans.put_item(Item={
    "device_id": req.device_id,
    "ts": now,
    "fingerprint": fp,
    "score": score,
    "risk_label": label,
    "network": json.loads(req.network.model_dump_json()),
    "checks": json.loads(req.checks.model_dump_json()),
    "client": json.loads(req.client.model_dump_json()) if req.client else {},
  })

  update_rep(fp, label)

  return ScanResponse(
    fingerprint=fp,
    score=score,
    risk_label=label,
    top_reasons=reasons,
    advice=advice,
    reputation={"seen_count": seen, "high_risk_rate": round(high_rate, 3)},
  )

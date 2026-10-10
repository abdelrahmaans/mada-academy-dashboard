#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?Set API_BASE_URL including /api/v1}"
: "${STAFF_PHONE:?Set STAFF_PHONE in the secret manager}"
: "${STAFF_PASSWORD:?Set STAFF_PASSWORD in the secret manager}"
: "${PAYMENT_ID:?Set PAYMENT_ID for an existing staging payment}"
: "${EVIDENCE_FILE:?Set EVIDENCE_FILE to a local PDF/JPG/PNG fixture}"

API_BASE_URL="${API_BASE_URL%/}"
login=$(curl --fail --silent --show-error -X POST "$API_BASE_URL/auth/login" -H 'content-type: application/json' --data "$(python3 - <<'PY'
import json, os
print(json.dumps({'phone': os.environ['STAFF_PHONE'], 'password': os.environ['STAFF_PASSWORD'], 'accountType': 'staff'}))
PY
)")
token=$(printf '%s' "$login" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["accessToken"])')

upload=$(curl --fail --silent --show-error -X POST "$API_BASE_URL/finance/payments/$PAYMENT_ID/evidence" -H "authorization: Bearer $token" -F "file=@$EVIDENCE_FILE")
printf '%s' "$upload" | python3 -c 'import json,sys; d=json.load(sys.stdin).get("data",{}); assert d.get("status") == "ATTACHED" and d.get("fileName"), "evidence attachment response invalid"'
curl --fail --silent --show-error "$API_BASE_URL/finance/payments/$PAYMENT_ID/evidence" -H "authorization: Bearer $token" -o "${EVIDENCE_FILE}.downloaded"
test -s "${EVIDENCE_FILE}.downloaded"
rm -f "${EVIDENCE_FILE}.downloaded"
echo "PASS: private evidence upload/download completed against staging"

#!/usr/bin/env bash
set -euo pipefail
: "${API_BASE_URL:?Set API_BASE_URL including /api/v1}"
: "${STAFF_PHONE:?Set STAFF_PHONE in the secret manager}"
: "${STAFF_PASSWORD:?Set STAFF_PASSWORD in the secret manager}"
: "${PAYMENT_ID:?Set PAYMENT_ID for an existing staging payment}"
: "${EVIDENCE_FILE:?Set EVIDENCE_FILE to a local PDF/JPG/PNG fixture}"
[[ -f "$EVIDENCE_FILE" ]] || { echo "FAIL: EVIDENCE_FILE does not exist: $EVIDENCE_FILE" >&2; exit 1; }
API_BASE_URL="${API_BASE_URL%/}"
CURL=(curl --fail --silent --show-error --connect-timeout "${CURL_CONNECT_TIMEOUT_SECONDS:-10}" --max-time "${CURL_MAX_TIME_SECONDS:-60}")
if [[ "${ALLOW_INSECURE_HTTP:-0}" != "1" && "$API_BASE_URL" != https://* && "$API_BASE_URL" != http://127.0.0.1:* && "$API_BASE_URL" != http://localhost:* ]]; then
  echo "FAIL: refusing non-HTTPS target; set ALLOW_INSECURE_HTTP=1 only for local testing" >&2
  exit 1
fi
login=$(python3 - "$STAFF_PHONE" "$STAFF_PASSWORD" <<'PY' | "${CURL[@]}" -X POST "$API_BASE_URL/auth/login" -H 'content-type: application/json' --data-binary @-
import json, sys
print(json.dumps({'phone': sys.argv[1], 'password': sys.argv[2], 'accountType': 'staff'}))
PY
)
token=$(printf '%s' "$login" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["accessToken"])')
headers=(-H "authorization: Bearer $token")
evidence_url="$API_BASE_URL/finance/payments/$PAYMENT_ID/evidence"
upload=$("${CURL[@]}" -X POST "$evidence_url" "${headers[@]}" -F "file=@$EVIDENCE_FILE")
printf '%s' "$upload" | python3 -c 'import json,sys; d=json.load(sys.stdin).get("data",{}); assert d.get("status") == "ATTACHED" and d.get("fileName"), "evidence attachment response invalid"'
downloaded_file=$(mktemp); downloaded_headers=$(mktemp)
cleanup() { rm -f "$downloaded_file" "$downloaded_headers"; }
trap cleanup EXIT
"${CURL[@]}" -D "$downloaded_headers" "$evidence_url" "${headers[@]}" -o "$downloaded_file"
cmp --silent "$EVIDENCE_FILE" "$downloaded_file" || { echo "FAIL: downloaded evidence differs byte-for-byte" >&2; exit 1; }
content_type=$(awk 'tolower($1) == "content-type:" { sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]*\r$/, ""); print; exit }' "$downloaded_headers")
case "$content_type" in application/pdf|image/jpeg|image/png) ;; *) echo "FAIL: unexpected Content-Type: $content_type" >&2; exit 1 ;; esac
if grep -Eiq 'public(url|_url)|signed(url|_url)' <<< "$upload"; then
  echo "FAIL: upload response exposed a public or signed object URL" >&2
  exit 1
fi
echo "PASS: private evidence upload/download, byte comparison, MIME validation, and no public URL exposure"

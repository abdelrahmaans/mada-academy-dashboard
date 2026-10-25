#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?Set API_BASE_URL, for example https://api.example.com/api/v1}"
: "${STAFF_PHONE:?Set STAFF_PHONE in the shell or secret manager}"
: "${STAFF_PASSWORD:?Set STAFF_PASSWORD in the shell or secret manager}"
API_BASE_URL="${API_BASE_URL%/}"
CURL=(curl --fail --silent --show-error --connect-timeout "${CURL_CONNECT_TIMEOUT_SECONDS:-10}" --max-time "${CURL_MAX_TIME_SECONDS:-60}")

if [[ "${ALLOW_INSECURE_HTTP:-0}" != "1" && "$API_BASE_URL" != https://* && "$API_BASE_URL" != http://127.0.0.1:* && "$API_BASE_URL" != http://localhost:* ]]; then
  printf 'Refusing non-HTTPS staging URL: %s\nSet ALLOW_INSECURE_HTTP=1 only for an explicitly local/test target.\n' "$API_BASE_URL" >&2
  exit 1
fi

json_get() {
  JSON_PATH="$1" python3 -c '
import json, os, sys
value = json.load(sys.stdin)
for part in os.environ["JSON_PATH"].split("."):
    value = value[int(part)] if part.isdigit() else value[part]
print(value)
'
}

login() {
  local account_type="$1" phone="$2" password="$3"
  python3 - "$account_type" "$phone" "$password" <<'PY' | "${CURL[@]}" -X POST "$API_BASE_URL/auth/login" -H 'content-type: application/json' --data-binary @-
import json, sys
print(json.dumps({"phone": sys.argv[2], "password": sys.argv[3], "accountType": sys.argv[1]}))
PY
}

printf 'Checking health: %s/health\n' "$API_BASE_URL"
health_response="$("${CURL[@]}" "$API_BASE_URL/health")"
printf '%s' "$health_response" | python3 -c 'import json,sys; value=json.load(sys.stdin); assert value.get("status") in ("ok", "healthy", "OK"), "health response is not healthy"'
staff_login="$(login staff "$STAFF_PHONE" "$STAFF_PASSWORD")"
staff_token="$(printf '%s' "$staff_login" | json_get data.accessToken)"
staff_headers=(-H "authorization: Bearer $staff_token")
"${CURL[@]}" "$API_BASE_URL/me" "${staff_headers[@]}" >/dev/null
"${CURL[@]}" "$API_BASE_URL/finance/invoices" "${staff_headers[@]}" >/dev/null

if [[ -n "${PAYMENT_ID:-}" || -n "${EVIDENCE_FILE:-}" ]]; then
  : "${PAYMENT_ID:?Set PAYMENT_ID when running the private-evidence smoke}"
  : "${EVIDENCE_FILE:?Set EVIDENCE_FILE when running the private-evidence smoke}"
  [[ -f "$EVIDENCE_FILE" ]] || { printf 'EVIDENCE_FILE does not exist: %s\n' "$EVIDENCE_FILE" >&2; exit 1; }
  evidence_url="$API_BASE_URL/finance/payments/$PAYMENT_ID/evidence"
  evidence_upload="$("${CURL[@]}" -X POST "$evidence_url" "${staff_headers[@]}" -F "file=@$EVIDENCE_FILE")"
  printf '%s' "$evidence_upload" | python3 -c 'import json,sys; value=json.load(sys.stdin); assert value.get("data",{}).get("status") == "ATTACHED", "Evidence upload did not return ATTACHED"'
  downloaded_file="$(mktemp)"; downloaded_headers="$(mktemp)"
  cleanup() { rm -f "$downloaded_file" "$downloaded_headers"; }
  trap cleanup EXIT
  "${CURL[@]}" -D "$downloaded_headers" -o "$downloaded_file" "$evidence_url" "${staff_headers[@]}"
  cmp --silent "$EVIDENCE_FILE" "$downloaded_file" || { printf 'Downloaded evidence differs from uploaded file\n' >&2; exit 1; }
  downloaded_type="$(awk 'tolower($1) == "content-type:" { sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]*\r$/, ""); print; exit }' "$downloaded_headers")"
  case "$downloaded_type" in application/pdf|image/jpeg|image/png) ;; *) printf 'Unexpected evidence Content-Type: %s\n' "$downloaded_type" >&2; exit 1 ;; esac
  printf 'PASS: authenticated private-evidence upload/download and byte-for-byte verification\n'
fi

if [[ -n "${PARENT_PHONE:-}" || -n "${PARENT_PASSWORD:-}" ]]; then
  : "${PARENT_PHONE:?Set PARENT_PHONE when running the parent smoke}"
  : "${PARENT_PASSWORD:?Set PARENT_PASSWORD when running the parent smoke}"
  parent_login="$(login parent "$PARENT_PHONE" "$PARENT_PASSWORD")"
  parent_token="$(printf '%s' "$parent_login" | json_get data.accessToken)"
  "${CURL[@]}" "$API_BASE_URL/consumer/invoices" -H "authorization: Bearer $parent_token" >/dev/null
fi
printf 'PASS: health, staff login, /me, finance invoices'
if [[ -n "${PARENT_PHONE:-}" ]]; then printf ', and parent consumer invoices'; fi
printf '\n'

#!/usr/bin/env bash
set -euo pipefail

: "${API_BASE_URL:?Set API_BASE_URL, for example https://api.example.com/api/v1}"
: "${STAFF_PHONE:?Set STAFF_PHONE in the shell or secret manager}"
: "${STAFF_PASSWORD:?Set STAFF_PASSWORD in the shell or secret manager}"

API_BASE_URL="${API_BASE_URL%/}"
json_get() {
  JSON_PATH="$1" python3 -c '
import json, os, sys
value = json.load(sys.stdin)
for part in os.environ["JSON_PATH"].split("."):
    value = value[int(part)] if part.isdigit() else value[part]
print(value)
'
}

printf 'Checking health: %s/health\n' "$API_BASE_URL"
curl --fail --silent --show-error "$API_BASE_URL/health" >/dev/null

staff_login="$(curl --fail --silent --show-error -X POST "$API_BASE_URL/auth/login" \
  -H 'content-type: application/json' \
  --data "$(python3 - <<'PY'
import json, os
print(json.dumps({"phone": os.environ["STAFF_PHONE"], "password": os.environ["STAFF_PASSWORD"], "accountType": "staff"}))
PY
)")"
staff_token="$(printf '%s' "$staff_login" | json_get data.accessToken)"

curl --fail --silent --show-error "$API_BASE_URL/me" \
  -H "authorization: Bearer $staff_token" >/dev/null
curl --fail --silent --show-error "$API_BASE_URL/finance/invoices" \
  -H "authorization: Bearer $staff_token" >/dev/null

if [[ -n "${PARENT_PHONE:-}" && -n "${PARENT_PASSWORD:-}" ]]; then
  parent_login="$(curl --fail --silent --show-error -X POST "$API_BASE_URL/auth/login" \
    -H 'content-type: application/json' \
    --data "$(python3 - <<'PY'
import json, os
print(json.dumps({"phone": os.environ["PARENT_PHONE"], "password": os.environ["PARENT_PASSWORD"], "accountType": "parent"}))
PY
)")"
  parent_token="$(printf '%s' "$parent_login" | json_get data.accessToken)"
  curl --fail --silent --show-error "$API_BASE_URL/consumer/invoices" \
    -H "authorization: Bearer $parent_token" >/dev/null
fi

printf 'PASS: health, staff login, /me, finance invoices'
if [[ -n "${PARENT_PHONE:-}" && -n "${PARENT_PASSWORD:-}" ]]; then
  printf ', and parent consumer invoices'
fi
printf '\n'

#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL before seeding}"
export DOTNET_CLI_HOME="${DOTNET_CLI_HOME:-$HOME}"
export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Development}"
export ASPNETCORE_URLS="${ASPNETCORE_URLS:-http://127.0.0.1:4199}"
if [[ "$ASPNETCORE_ENVIRONMENT" != "Development" ]]; then
  echo "Refusing to seed demo accounts outside Development (current: $ASPNETCORE_ENVIRONMENT)." >&2
  exit 2
fi

MADA_SEED_DEMO_DATA=true dotnet run \
  --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj \
  --no-build \
  >/tmp/mada-demo-seed.log 2>&1 &
pid=$!
cleanup() { kill "$pid" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS "${ASPNETCORE_URLS}/api/v1/health" >/dev/null; then
    echo "Demo data seeded successfully."
    echo "R05 secretary: secretary@mada.demo (Main), secretary.helio@mada.demo (Heliopolis)"
    echo "R06 accountant: accountant@mada.demo (Main), accountant.helio@mada.demo (Heliopolis)"
    echo "Demo-only password: Mada@2026"
    exit 0
  fi
  sleep 1
done

cat /tmp/mada-demo-seed.log
exit 1

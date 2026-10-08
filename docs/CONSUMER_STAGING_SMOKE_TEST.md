# Consumer / Staging Smoke Test — R08/R09

## Local-only execution path

This path does not deploy anything and does not require Supabase or production secrets.

### Terminal 1 — API with seeded InMemory data

```bash
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$PATH"
cd backend/MadaAcademy.Api
ASPNETCORE_ENVIRONMENT=Development \
MADA_DATABASE_MODE=memory \
MADA_SEED_DEMO_DATA=true \
ASPNETCORE_URLS=http://127.0.0.1:5180 \
DOTNET_ENVIRONMENT=Development \
dotnet run --no-launch-profile
```

Health check:

```bash
curl -fsS http://127.0.0.1:5180/api/v1/health
```

### Terminal 2 — React frontend against the local API

```bash
cd /path/to/mada-academy-dashboard
VITE_API_URL=http://127.0.0.1:5180/api/v1 pnpm dev --host 0.0.0.0
```

Open the Vite URL shown in the terminal, then execute the R08 and R09 flows above. The local seeded API accepts password login with the controlled demo accounts and keeps all data in the process-local InMemory store.

### API preflight without browser

```bash
curl -fsS -X POST http://127.0.0.1:5180/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+201000000011","password":"Mada@2026","accountType":"parent"}'
```

Use the returned access token as `Authorization: Bearer <token>` for `/api/v1/consumer/me/students` and `/api/v1/consumer/me/sessions` before opening the browser.

## Automated browser E2E

The repository now includes Playwright coverage in `e2e/critical-flows.spec.ts`:

- **R06:** authenticated LIVE FinanceDesk surface and finance summary (no demo banner).
- **R08:** Family Portal linked-child scope; session/invoice records are filtered to returned linked children; session/invoice partial failures preserve available child data; empty/error states do not fall back to demo fixtures.
- **R09:** Student Portal self-scope; session records are filtered to the linked student; profile/session partial failures and empty-link states do not fall back to demo fixtures.
- Route guards, role isolation, logout, plus the existing Finance and Instructor critical flows.

Run it locally with:

```bash
pnpm e2e
```

The Playwright config starts the seeded InMemory API and Vite automatically and uses the system Chromium binary. Latest local branch verification: **17/17 passed** (`test/consumer-scope-partial-failures`). These browser checks validate frontend behavior only; the backend consumer authorization and tenant/link queries remain the security authority. A live authenticated staging click-through is still a separate release gate.

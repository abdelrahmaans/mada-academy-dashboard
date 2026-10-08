# Mada Academy Dashboard

Arabic-first, RTL academy management system for academy operations, finance, evaluation workflows, and linked family/student portals.

## Repository map

| Area | Location | Responsibility |
|---|---|---|
| Frontend | [`client/`](client/README.md) | React + Vite application, routes, role surfaces, shared UI |
| Backend | [`backend/`](backend/README.md) | ASP.NET Core API, authorization, persistence, migrations |
| Shared | [`shared/`](shared/README.md) | Cross-layer constants and shared contracts |
| Browser tests | [`e2e/`](e2e/README.md) | Playwright critical flows |
| Scripts | [`scripts/`](scripts/README.md) | Local/staging operational scripts |
| Database support | [`supabase/`](supabase/README.md) | Database/storage migrations only |
| CI | [`.github/`](.github/README.md) | GitHub Actions workflows |
| Product docs | [`docs/`](docs/README.md) | Contracts, acceptance evidence, runbooks, and plans |
| Agent workspace | [`.agent/`](.agent/README.md) | Canonical handoff, status, plan, and working rules |

## Start here

1. Read [`.agent/AGENT_HANDOFF.md`](.agent/AGENT_HANDOFF.md).
2. Read [`.agent/PROJECT_STATUS.md`](.agent/PROJECT_STATUS.md).
3. Read [`.agent/NEXT_PHASE_PLAN.md`](.agent/NEXT_PHASE_PLAN.md).
4. Read the relevant API contract in [`backend/`](backend/README.md) and tests before editing.

## Development commands

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm e2e

export DOTNET_ROOT=/home/ubuntu/.dotnet
export PATH=/home/ubuntu/.dotnet:/home/ubuntu/.dotnet/tools:$PATH
dotnet test backend/MadaAcademy.sln --configuration Release
git diff --check
```

Use a disposable PostgreSQL database for integration tests. Never commit secrets, `.env` files, tokens, OTPs, payment evidence, or database dumps.

## Architectural guardrails

- Preserve Arabic labels, RTL layout, responsive behavior, and the Mada design system.
- Backend authorization is authoritative; frontend guards are navigation only.
- Preserve academy/tenant, branch, and consumer-link isolation in every API query and mutation.
- Consumer evaluation data is visible only after publication.
- LIVE surfaces must not silently fall back to demo data.
- Do not deploy or change production infrastructure unless explicitly requested.

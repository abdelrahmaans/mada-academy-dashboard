# Mada Academy — Documentation Index

**Last reviewed:** 4 October 2026  
**Repository truth:** `main` after PR #42 (`ecf23be`)

## How to read the documentation

Use the documents in this order:

1. **Current product/status truth** — [PROJECT_STATUS.md](PROJECT_STATUS.md)
2. **Current next actions and release sequence** — [NEXT_PHASE_PLAN.md](NEXT_PHASE_PLAN.md)
3. **Chronological delivery history** — [MADA_MASTER.md](MADA_MASTER.md)
4. **Production gate and deployment procedure** — [FINANCE_RELEASE_GATE.md](FINANCE_RELEASE_GATE.md) and [PRE_PRODUCTION_RUNBOOK.md](PRE_PRODUCTION_RUNBOOK.md)
5. **UI/route/role review** — [UI_FLOW_REVIEW_STATUS.md](UI_FLOW_REVIEW_STATUS.md)
6. **Consumer acceptance and local E2E** — [CONSUMER_FINAL_ACCEPTANCE.md](CONSUMER_FINAL_ACCEPTANCE.md) and [CONSUMER_STAGING_SMOKE_TEST.md](CONSUMER_STAGING_SMOKE_TEST.md)
7. **Finance product contract** — [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md)
8. **OTP limitations and future pilot** — [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md)

## Backend documentation

| Document | Use it for | Status |
|---|---|---|
| [backend/README.md](backend/README.md) | Local backend orientation | Current |
| [backend/DATABASE_STATUS.md](backend/DATABASE_STATUS.md) | PostgreSQL, migrations, seed and local verification | Current |
| [backend/PERSISTENCE_STATUS.md](backend/PERSISTENCE_STATUS.md) | Short persistence milestone notes | Historical summary |
| [backend/ROLES_PERMISSIONS_API_CONTRACT.md](backend/ROLES_PERMISSIONS_API_CONTRACT.md) | Auth, role and membership endpoints | Contract |
| [backend/PASSWORD_AUTH_CONTRACT.md](backend/PASSWORD_AUTH_CONTRACT.md) | Password login and password rules | Contract |
| [backend/OPERATIONS_API_CONTRACT.md](backend/OPERATIONS_API_CONTRACT.md) | Students, sessions and attendance | Contract |
| [backend/SESSION_LIFECYCLE_API_CONTRACT.md](backend/SESSION_LIFECYCLE_API_CONTRACT.md) | Scheduling/workflow lifecycle | Contract; consumer notification note is historical |
| [backend/ACADEMY_BOOTSTRAP_API_CONTRACT.md](backend/ACADEMY_BOOTSTRAP_API_CONTRACT.md) | Academy bootstrap and `/me` | Contract |
| [BACKEND_STATUS.md](BACKEND_STATUS.md) | Chronological backend delivery log and current handoff | Historical log + current handoff |
| [docs/backend-technical-roadmap.md](docs/backend-technical-roadmap.md) | Target architecture and deferred roadmap | Target architecture |

## Rules for future updates

- Update `PROJECT_STATUS.md` and `NEXT_PHASE_PLAN.md` whenever the current truth or next milestone changes.
- Append delivery history to `MADA_MASTER.md`; do not use it as the only current status source.
- Mark old counts, PR numbers, branches, URLs and “next step” statements as historical instead of silently leaving them as current truth.
- Contracts describe intended API behavior; verify implementation against the source and tests before marking an item as implemented.
- Never put secrets, service-role keys, real passwords or private tokens in Markdown.

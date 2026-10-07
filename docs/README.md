# Project Documentation

This folder contains product, API-adjacent, acceptance, security, finance, deployment, and UX documentation. Current implementation truth is maintained in [`.agent/PROJECT_STATUS.md`](../.agent/PROJECT_STATUS.md); current priorities are in [`.agent/NEXT_PHASE_PLAN.md`](../.agent/NEXT_PHASE_PLAN.md).

## Categories

- **Acceptance and LIVE boundaries:** `LIVE_ACCEPTANCE_EVIDENCE.md`, `CONSUMER_FINAL_ACCEPTANCE.md`, `UI_FLOW_REVIEW_STATUS.md`
- **Product plans:** `IMPLEMENTATION_PLAN.md`, `INVOICES_PAYMENTS_MVP_PLAN.md`, `OTP_MVP_TEMPORARY_PLAN.md`
- **Operations and release:** `PRE_PRODUCTION_RUNBOOK.md`, `FINANCE_RELEASE_GATE.md`, `CONSUMER_STAGING_SMOKE_TEST.md`, `DISTRIBUTED_RATE_LIMIT_DECISION.md`
- **Role inventory and UX:** `R00_PLATFORM_ADMIN_INVENTORY.md`, `UI_UX_AUDIT_NOTES.md`, `UI_UX_AUDIT_ROLES_2026-10-05.md`

## Rules

- Treat the `.agent/` status and plan files as canonical; do not create competing copies here.
- Keep historical or proposed behavior clearly labeled and do not describe preview/demo surfaces as LIVE.
- Link to backend contracts in [`../backend/`](../backend/README.md) rather than copying API definitions into multiple files.

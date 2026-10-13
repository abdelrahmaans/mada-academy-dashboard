# Project Documentation

This folder contains product, API-adjacent, acceptance, security, finance, deployment, and UX documentation. Current implementation truth is maintained in [`.agent/PROJECT_STATUS.md`](../.agent/PROJECT_STATUS.md); current priorities are in [`.agent/NEXT_PHASE_PLAN.md`](../.agent/NEXT_PHASE_PLAN.md).

## Categories

- **Acceptance and LIVE boundaries:** `LIVE_ACCEPTANCE_EVIDENCE.md`, `CONSUMER_FINAL_ACCEPTANCE.md`, `UI_FLOW_REVIEW_STATUS.md`
- **Product plans:** `IMPLEMENTATION_PLAN.md`, `INVOICES_PAYMENTS_MVP_PLAN.md`, `OTP_MVP_TEMPORARY_PLAN.md`
- **Operations and release:** `PRE_PRODUCTION_RUNBOOK.md`, `FINANCE_RELEASE_GATE.md`, `CONSUMER_STAGING_SMOKE_TEST.md`, `DISTRIBUTED_RATE_LIMIT_DECISION.md`
- **Role inventory and UX:** `R00_PLATFORM_ADMIN_INVENTORY.md`, `UI_UX_AUDIT_NOTES.md`, `UI_UX_AUDIT_ROLES_2026-10-05.md`
- **Mobile UX handoff:** [`mobile-ux/UX_HANDOFF_AR.md`](mobile-ux/UX_HANDOFF_AR.md) — R04 mobile navigation, screen behavior, visual tokens, API mapping, and implementation sequence.
- **Mobile foundation rules:** [`mobile-ux/MOBILE_FOUNDATION_RULES_AR.md`](mobile-ux/MOBILE_FOUNDATION_RULES_AR.md) — binding Cairo/Inter typography, design-token parity, code structure, auth/RBAC, data honesty, and acceptance rules.
- **Mobile screen/API/permission matrix:** [`mobile-ux/MOBILE_SCREEN_API_PERMISSION_MATRIX_AR.md`](mobile-ux/MOBILE_SCREEN_API_PERMISSION_MATRIX_AR.md) — per-screen endpoints, mobile visibility rules, Backend authorization/scope, implementation status, and remaining gaps.
- **Mobile app starter:** [`../apps/mobile/README.md`](../apps/mobile/README.md) — Expo workspace commands, role/auth rules, and SDK references.

## Rules

- Treat the `.agent/` status and plan files as canonical; do not create competing copies here.
- Keep historical or proposed behavior clearly labeled and do not describe preview/demo surfaces as LIVE.
- Link to backend contracts in [`../backend/`](../backend/README.md) rather than copying API definitions into multiple files.

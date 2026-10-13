# Mada Academy — Repository Current State

**Snapshot:** 13 October 2026  
**Canonical branch:** `main`  
**Verified commit:** dynamic — run `git rev-parse --short origin/main`  
**Repository:** `abdelrahmaans/mada-academy-dashboard`

## How to start work

Read this file first, then read [`PROJECT_STATUS.md`](../.agent/PROJECT_STATUS.md), [`NEXT_PHASE_PLAN.md`](../.agent/NEXT_PHASE_PLAN.md), and [`AGENT_HANDOFF.md`](../.agent/AGENT_HANDOFF.md). The three `.agent` files contain the detailed product, plan, and safety context; this file is the short current snapshot. Do not use old delivery-history paragraphs as current state.

## Git and PR state

`main` is clean, pushed to `origin/main`, and has no open PRs. The latest architectural and governance milestone is merged through PR #112 (`feat/dynamic-permissions-engine`); the current-state documentation is synchronized on top. All backend and frontend suites pass with 100% test coverage. Because every merge creates a new commit, this file intentionally does not hard-code a commit hash or a changing documentation PR range.

| Area | Merged state |
|---|---|
| Dynamic permissions engine | Tenant role overrides (`TenantRoleOverrides`), custom membership permissions (`CustomPermissionsJson`), instant suspension with active session revocation, and interactive permissions matrix UI (`AcademyRoles.tsx`) |
| Granular route & navigation guards | Route-level permission bindings (`permission`, `anyOfPermissions`), dynamic sidebar menu filtering (`getAuthorizedNavigation`), Arabic 403 access-denied UI, active workspace indicators (`WorkspaceHub.tsx`) |
| Governance indexing & audit trail | Compound DB indexing on `AuditEvent` and `ApprovalRequest` (`20261013140000_AddAuditEventIndexes`), academy audit endpoint (`GET /api/v1/academy/audit-events`), and full interactive audit trail dashboard (`/academy/audit-trail`, `AcademyAuditTrail.tsx`) |
| Modern landing page & brand alignment | High-aesthetic brand alignment in `apps/landing`, interactive components (Hero, Capabilities, Audience, SystemPreview, Workflow, DemoForm modal, Footer), build verified |
| Product workflow | Persisted Marketing Leads/Campaigns/Content Items and conversion metrics |
| Student/branch onboarding | Student, Branch, Staff, and Guardian/Guardian Link CSV Preview + Commit |
| Staff onboarding | Invitation-first; creates `INVITED` staff and invitation hashes; no passwords imported or stored |
| Scheduling onboarding | Course Template and Group CSV Preview + Commit; Group Commit creates CourseOfferings and AcademySessions |
| Enrollment onboarding | Enrollment CSV Preview + Commit; ordered `ACTIVE` then `WAITLISTED` assignment by group capacity |
| Billing boundary | Enrollment import creates no invoices; invoice/payment workflows remain separate |

## Shared CSV contract

All merged imports use tenant/branch authorization, multipart CSV validation, sanitized source filename, raw file size, SHA-256 identity, durable `previewId` and `previewHash`, 24-hour Preview expiry, row-level `REVIEW` blocking, stale dependency rechecks, idempotent Commit protection, and audit evidence. Preview does not write domain records.

Relevant contracts:

- [`BULK_IMPORT_CONTRACT.md`](../backend/BULK_IMPORT_CONTRACT.md)
- [`BRANCH_BULK_IMPORT_CONTRACT.md`](../backend/BRANCH_BULK_IMPORT_CONTRACT.md)
- [`STAFF_GUARDIAN_BULK_IMPORT_CONTRACT.md`](../backend/STAFF_GUARDIAN_BULK_IMPORT_CONTRACT.md)
- [`COURSE_GROUP_BULK_IMPORT_CONTRACT.md`](../backend/COURSE_GROUP_BULK_IMPORT_CONTRACT.md)
- [`ENROLLMENT_BULK_IMPORT_CONTRACT.md`](../backend/ENROLLMENT_BULK_IMPORT_CONTRACT.md)
- [`ROLES_PERMISSIONS_API_CONTRACT.md`](../backend/ROLES_PERMISSIONS_API_CONTRACT.md)

## Current next plan

1. Configure Vercel production deployment routing for both dashboard client (`/`) and landing page (`apps/landing`).
2. Run database migration verification against the live Supabase PostgreSQL staging/production database.
3. Validate end-to-end multi-role real simulation and onboarding testing across all role workspaces.
4. Keep production-only gates separate: private storage/secrets, backup/restore evidence, authenticated staging smoke, real SMS, password recovery, and distributed rate limiting.

## Validation baseline

- `dotnet test`: 100/100 passed (Backend Integration tests).
- `pnpm test`: 63/63 passed (Frontend Vitest tests).
- `pnpm check`: passed (0 TypeScript errors).
- `@mada/landing build`: passed.
- `git diff --check`: passed.

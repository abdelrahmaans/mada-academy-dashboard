# Mada Academy — Repository Current State

**Snapshot:** 25 October 2026<br/>
**Canonical branch:** `main` (active dev on `dev`)<br/>
**Verified commit:** dynamic — run `git rev-parse --short origin/dev`<br/>
**Repository:** `abdelrahmaans/mada-academy-dashboard`

## How to start work

Read this file first, then read [`PROJECT_STATUS.md`](../.agent/PROJECT_STATUS.md), [`NEXT_PHASE_PLAN.md`](../.agent/NEXT_PHASE_PLAN.md), and [`AGENT_HANDOFF.md`](../.agent/AGENT_HANDOFF.md). The three `.agent` files contain the detailed product, plan, and safety context; this file is the short current snapshot. Do not use old delivery-history paragraphs as current state.

## Git and PR state

`main` is clean, pushed to `origin/main`. Active hardening, contract expansions, and architectural verification are progressing on `dev`. All backend and frontend suites pass with 100% test coverage.

| Area | Merged / Active State |
|---|---|
| **Active Student Billing Meter & Plan Limits Contract** | `GET /api/v1/academy/billing-meter` calculating active students, branch usage, and staff counts against Starter/Growth/Enterprise plan limits. Non-destructive operational warnings, live billing widget in Executive Dashboard (`BillingMeterWidget.tsx`), and platform admin plan upgrade endpoint (`PATCH /api/v1/platform/academies/{id}/plan`) with audit event `PLATFORM_TENANT_PLAN_CHANGED`. |
| **Waitlist Promotion & Direct Invoice Flow** | Policy-driven enrollment activation (`ActivateWaitlistRequest`) allowing optional invoice generation upon promotion. Automatically calculates tuition, binds invoice lines to course templates, logs audit events, and updates UI (`WaitlistManagementView.tsx` & `Classes.tsx`). |
| **Playwright E2E Suite (100% Green)** | 18 critical MVP journey tests passing locally (`e2e/critical-flows.spec.ts`) covering multi-role authentication (R04, R06, R08, R09), finance desk accounting, family portal child scoping, student self-scoping, route access guards, and mock network failure boundaries. |
| **Architecture Modularization & Refactoring** | Complete decomposition of 12 monolithic surfaces into domain-scoped subviews, tabs, and modals:<br>• **Classes.tsx**: Modularized into `ClassesTopbar.tsx`, `ClassesHeader.tsx`, `ClassesStatsCards.tsx`, and `ClassesComponents.test.ts` in `client/src/components/classes/`, along with existing `ClassesCatalogPanel.tsx`, `ClassesCreateDialogs.tsx`, and `ClassesDetailDialogs.tsx`.<br>• **FinanceDeskViews.tsx**: Decomposed from 2,579 lines (123KB) down to 24 lines across 6 modular views in `client/src/components/finance/` (`FinanceOverviewView`, `FinanceCollectionsView`, `FinanceExpensesView`, `FinanceReportsView`, `FinanceShiftsView`, `FinancePayrollView`, `FinanceShared.tsx`, and `FinanceDeskTypes.ts`).<br>• **PlatformConsoleLive.tsx**: Modularized into 11 modals in `PlatformConsoleModals.tsx` and 7 feature tabs (`Overview`, `Academies`, `Billing`, `Leads`, `Support`, `System`, and `Components`).<br>• **SecretaryDeskLive.tsx**: Slashed by 59% (1,371 lines down to 563 lines) across `SecretaryDeskModals.tsx` and 5 tabs (`Pipeline`, `Registration`, `Followups`, `Freezes`, `Shifts`).<br>• **FamilyPortal.tsx**: Slashed by 69% (1,093 down to 336 lines) via `FamilyPortalTypes.ts` and `FamilyPortalSubViews.tsx`.<br>• **AcademyRoles.tsx**: Slashed by 60% via `AcademyRolesMatrixTab.tsx`, `AcademyRolesMembersTab.tsx`, and `AcademyRolesModals.tsx`.<br>• **Schedule.tsx & ScheduleViews.tsx**: Extracted `ScheduleTypes.ts`, completely severing circular dependencies.<br>• **InstructorDeskLive.tsx**: Slashed from 926 down to 597 lines via 4 subviews in `client/src/components/instructor/` (`InstructorSessionsView`, `InstructorSupervisionView`, `InstructorAttendanceView`, `InstructorEvaluationsView`).<br>• **ReportsLive.tsx**: Slashed by 52% (938 down to 451 lines) via 5 tab components in `client/src/components/reports/` (`ReportsOverviewTab`, `ReportsExpensesTab`, `ReportsRetentionRadarTab`, `ReportsCoursesTab`, `ReportsInstructorsTab`).<br>• **Approvals, Competitions, Students**: Extracted modals, seed mappers, and domain contracts (`ApprovalsTypes.ts`, `CompetitionsModals.tsx`, `StudentsModals.tsx`, `StudentsTypes.ts`, `ClassesTypes.ts`). |
| **Dynamic permissions engine** | Tenant role overrides (`TenantRoleOverrides`), custom membership permissions (`CustomPermissionsJson`), instant suspension with active session revocation, and interactive permissions matrix UI (`AcademyRoles.tsx`). |
| **Granular route & navigation guards** | Route-level permission bindings (`permission`, `anyOfPermissions`), dynamic sidebar menu filtering (`getAuthorizedNavigation`), Arabic 403 access-denied UI, active workspace indicators (`WorkspaceHub.tsx`). |
| **Governance indexing & audit trail** | Compound DB indexing on `AuditEvent` and `ApprovalRequest` (`20261013140000_AddAuditEventIndexes`), academy audit endpoint (`GET /api/v1/academy/audit-events`), and full interactive audit trail dashboard (`/academy/audit-trail`, `AcademyAuditTrail.tsx`). |
| **Modern landing page & brand alignment** | High-aesthetic brand alignment in `apps/landing`, interactive components (Hero, Capabilities, Audience, SystemPreview, Workflow, DemoForm modal, Footer), build verified. |
| **Product workflow** | Persisted Marketing Leads/Campaigns/Content Items and conversion metrics. |
| **Student/branch onboarding** | Student, Branch, Staff, and Guardian/Guardian Link CSV Preview + Commit. |
| **Staff onboarding** | Invitation-first; creates `INVITED` staff and invitation hashes; no passwords imported or stored. |
| **Scheduling onboarding** | Course Template and Group CSV Preview + Commit; Group Commit creates CourseOfferings and AcademySessions. |
| **Enrollment onboarding** | Enrollment CSV Preview + Commit; ordered `ACTIVE` then `WAITLISTED` assignment by group capacity. |
| **Billing boundary** | Enrollment import creates no invoices; invoice/payment workflows remain separate. |

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

1. **Multi-Role Real Simulation:** Execute `verify_flow.ps1` end-to-end to validate all 10 roles (R00 - R09) against the live seeded database.
2. **Merge & Staging Deployment:** Merge `dev` into `main` and verify production deployment routing on Vercel (`/` for dashboard and `apps/landing`) and Railway/Render for the .NET API.
3. **Supabase Pro Infrastructure Gate:** Configure automated daily backups and Point-In-Time Recovery (PITR) when live paying customers are onboarded ($0 SaaS policy until commercial launch).
4. **Production Readiness:** Keep production-only gates separate: private storage/secrets, backup/restore evidence, authenticated staging smoke, real SMS OTP, password recovery, and distributed rate limiting.

## Validation baseline

- `dotnet test` (InMemory): **114/114 passed** (100% Backend Integration tests).
- `dotnet build`: **0 warnings, 0 errors** (.NET 10).
- `pnpm test`: **70/70 passed** (10 test suites, Vitest unit/integration tests).
- `pnpm check`: **0 TypeScript errors** (`tsc --noEmit`).
- `pnpm lint`: **0 errors** (ESLint 9 Flat Config).
- `pnpm build`: **Passed in 7.88s** (clean chunk splitting with zero circular dependencies).
- `playwright`: **18/18 passed (56.5s)** in `e2e/critical-flows.spec.ts` (100% passing across all critical MVP journeys).
- `@mada/landing build`: **Passed in 2.56s**.
- `git diff --check`: **Clean**.

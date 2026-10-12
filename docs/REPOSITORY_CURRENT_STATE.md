# Mada Academy — Repository Current State

**Snapshot:** 11 October 2026  
**Canonical branch:** `main`  
**Verified commit:** dynamic — run `git rev-parse --short origin/main`  
**Repository:** `abdelrahmaans/mada-academy-dashboard`

## How to start work

Read this file first, then read [`PROJECT_STATUS.md`](../.agent/PROJECT_STATUS.md), [`NEXT_PHASE_PLAN.md`](../.agent/NEXT_PHASE_PLAN.md), and [`AGENT_HANDOFF.md`](../.agent/AGENT_HANDOFF.md). The three `.agent` files contain the detailed product, plan, and safety context; this file is the short current snapshot. Do not use old delivery-history paragraphs as current state.

## Git and PR state

`main` is clean, pushed to `origin/main`, and has no open PRs. The SaaS onboarding functional delivery is merged through PR #106; the current-state documentation is synchronized on top. PRs #104, #105, and #106 passed Backend Integration, Playwright, Angular R08 Playwright, and Vercel checks before merge. Because every merge creates a new commit, this file intentionally does not hard-code a commit hash or a changing documentation PR range.

| Area | Merged state |
|---|---|
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

## Current next plan

1. Add backend integration coverage for the full CSV chain, especially ordered capacity assignment, stale capacity rejection, duplicate protection, and branch scope.
2. Add operational UX for Preview row review, Commit results, created IDs, ACTIVE/WAITLISTED counts, and waitlist promotion visibility.
3. Implement the SaaS trial workspace using real academy data with non-destructive plan limits.
4. Complete active-student, branch, and staff/instructor metering contracts and warning states before paid enforcement.
5. Keep production-only gates separate: private storage/secrets, backup/restore evidence, authenticated staging smoke, real SMS, password recovery, and distributed rate limiting.

## Validation baseline

- `pnpm test`: 58/58.
- `pnpm check`: passed.
- `git diff --check`: passed on the latest slices.
- Backend Integration, Playwright, Angular R08 Playwright, and Vercel checks passed for PR #106.
- The Sandbox does not include the .NET SDK; backend validation is therefore confirmed through GitHub CI.

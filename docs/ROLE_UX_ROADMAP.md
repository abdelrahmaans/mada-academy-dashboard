# Mada Academy — role UI/UX roadmap

**Status:** Active — frontend/prototype phase; backend, authentication, and persistence are intentionally deferred.
**Repository:** [`abdelrahmaans/mada-academy-dashboard`](https://github.com/abdelrahmaans/mada-academy-dashboard) (`main`) — React + TypeScript + Vite + Wouter.
**Current baseline reviewed:** `9cca718` — `feat: apply business rules across role workflows`.
**Business references:** shared project file `Mada Academy — Permission Matrix & Shared UI Components.md` and `Mada Academy — Master Brand, UX & Business Plan.md`.

## Operating agreement

1. The immediate goal is to finish role-specific screens and make their navigation/scope understandable as one coherent dashboard experience.
2. Every fixture and local interaction must be labeled as demo/local. A toast, local state update, or route switch is not a saved record, approval, login, or permission check.
3. Do not start API/database/auth implementation in this phase. Do not treat UI hiding as future authorization. After role UX is reviewed, the next phase must define server-side tenant/branch scoping, permission contracts, audit events, and auth before integration work.
4. Do not work on the public marketing landing page in this milestone. The Angular public-site repository is separate and is not the target for dashboard role UX.
5. Update this roadmap after each role UI milestone: mark coverage accurately, note changed routes/components, and name the next role slice.

## Role inventory and observed coverage

The role set below is taken from the approved architecture/permission matrix. Coverage describes the checked dashboard repo, not authorization enforcement.

| ID  | Role                   | Current UI coverage                                          | Main UX gap to address                                                                                          |
| --- | ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| R00 | Platform Super Admin   | Partial (`/platform-console`; demo UI)                       | Complete platform-level review, academy management flows, and distinction from branch administration            |
| R01 | Academy Owner          | Partial (`/academy-owner`)                                   | Unify all-academy scope and first actions; avoid branch accountant/report labels leaking into the owner view    |
| R02 | Branch Admin / Manager | Partial (`/`, `/approvals`, `/team`, `/finance`, `/reports`) | Keep every screen scoped to one branch; surface day, approvals, team, concise finance, and reports consistently |
| R03 | Head of Instructors    | Partial (`/head-instructors`)                                | Scope team/student/schedule views; add clear attendance/evaluation review states without branch-finance actions |
| R04 | Instructor             | Partial (`/instructor`)                                      | Make today's sessions and session students primary; align schedule/student paths to instructor scope            |
| R05 | Secretary              | Partial (`/secretary`)                                       | Connect enrollment, family/sibling linking, discount rules, lead follow-up, and pending escalation states       |
| R06 | Accountant             | Partial (`/finance`)                                         | Keep single-branch scope; add correction request/reason states, financial review queue, and payroll surface     |
| R07 | Media Manager          | Absent                                                       | Create internal campaigns/content/leads workspace; this is not a public marketing page                          |
| R08 | Parent                 | Absent                                                       | Create a family surface with child switcher, attendance, schedule, evaluations, and child invoices              |
| R09 | Student                | Absent                                                       | Create a read-focused student surface for schedule, progress, evaluations, and achievements                     |

## Implementation order

1. **Shared foundation + R00 first slice:** reusable RTL `RoleDashboardShell` and `RoleScopeCard`; a `/platform-console` overview with all-platform scope, demo metrics, searchable/filterable academies, responsive list/table, and an in-memory create preview.
2. **R01–R02:** reconcile owner-versus-branch scope and align manager first-screen actions across home, approvals, team, finance, and reports.
3. **R03–R06:** scope instructor/head/secretary/accountant screens and complete local prototype workflow states for sessions, enrollment, finance corrections, approvals, and next actions.
4. **R07:** internal campaigns/content/leads screens, explicitly separated from public site work.
5. **R08–R09:** parent and student surfaces with family-child/student-only scope and age-appropriate read views.
6. **Cross-role polish:** responsive desktop/mobile checks, navigation consistency, empty/loading/error/locked states, keyboard/accessibility review, typecheck/build, and updated roadmap.
7. **Only after role UX is complete and approved:** design auth/API/schema and server-side tenant/branch enforcement; integrate one workflow at a time with audit/history.

## Current milestone

- Added a reusable demo role shell and scope card for the platform workspace.
- Added `/platform-console` for R00 with local-only academy records, branch/users/pending-setup metrics, search/status filters, mobile cards, details, and a non-persistent create preview.
- Added an internal link from the branch dashboard. The role selector is only a prototype route switcher and does not authenticate or authorize.
- `pnpm check`, `pnpm build`, and Prettier validation pass. Desktop (1440px) and mobile (390px) screenshots were reviewed; search, status filtering, details, and local-only create interactions were verified. Browser console reported no runtime errors; pushed to `main` at `f62748f`.
- The successful build still reports pre-existing non-blocking warnings: unset Vite analytics endpoint/site ID, the analytics script is not a module, and pnpm ignores legacy `package.json` override/patch keys. These are outside this UI-only slice and were not changed.

## Acceptance criteria for each role

- The first screen answers: **what is my scope, what needs attention, and what are my 2–4 primary actions?**
- Navigation and content match that role's matrix; sibling roles do not inherit irrelevant financial or administrative actions.
- Desktop tables have usable mobile-card alternatives; controls and dialogs are keyboard-accessible and clearly labeled.
- Empty, loading, error, locked, pending, success, and next-action states are understandable where applicable.
- Demo actions explain exactly what changes locally and that no server save/approval/auth is occurring.
- The roadmap and project status are updated to distinguish designed UI from integrated behavior.

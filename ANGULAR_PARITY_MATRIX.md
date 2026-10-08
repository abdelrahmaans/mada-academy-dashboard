# Angular Closure / Parity Matrix — Mada Academy

**Snapshot:** 8 October 2026  
**Baseline:** `main` at `c2d9954`  
**Purpose:** final closure record for Angular role surfaces. This matrix records the Angular scope; React remains the reference client and backend authorization remains the security boundary.

## Status legend

- **Accepted** — implemented on `main`, backed by the documented API contract, and covered by relevant unit/component or E2E checks.
- **Preview / out of scope** — intentionally not claimed as LIVE parity for the MVP.
- **Production gate open** — code parity is accepted locally, but deployment/storage/staging evidence is still required.

| Role | Angular route | Surface and accepted boundary | Scope/security checks | Status | Remaining work |
|---|---|---|---|---|---|
| R00 Platform Admin | None | No Angular platform-console parity claim. The backend LIVE inventory and authorization checklist remain the source of truth. | Backend role/policy, tenant-paired lookups, reason requirements, audit writes, and privacy assertions are documented separately in `R00_PLATFORM_ADMIN_INVENTORY.md`. | Preview / out of scope | Reopen only for a separately approved Angular platform-support slice. |
| R01 Academy Owner | None | No dedicated Angular owner dashboard is claimed. Shared auth/workspace is foundation only, not role parity. | Backend authorization remains authoritative; no frontend route is treated as an R01 security boundary. | Preview / out of scope | Define an R01 contract and acceptance slice before implementation. |
| R02 Branch Manager | `/` | Branch dashboard with scoped students/sessions/classes/schedule/approvals; optional endpoint failures remain isolated and LIVE surfaces never silently use demo data. | Route policy requires `R02_BRANCH_MANAGER` and `branch.read`; API derives tenant/branch scope from the authenticated context. | **Accepted** | Production staging acceptance remains open. |
| R03 Head Instructor | `/head-instructors` | Branch-scoped groups, instructors, sessions, evaluation review/publish flow, and explicit optional-warning states. | Route policy requires R03 permissions; client does not submit a branch selector; backend reapplies scope. | **Accepted** | Unsupported mastery/checkpoint analytics remain out of scope. |
| R04 Instructor | `/instructor` | Assigned sessions, attendance, evaluation drafts/submission, session completion, and substitution requests. | Assigned-session and write permissions are advisory on the client; backend assignment, tenant, branch, and action authorization are authoritative. | **Accepted** | Broader instructor analytics remain out of scope. |
| R05 Secretary | `/secretary` | Student enrollment/registration, linked consumer lookup/invitations, and scoped invoice/payment workflows allowed by permission. | Route requires student/invoice read permissions; backend enforces branch scope and does not grant broad `finance.write` implicitly. | **Accepted** | Production evidence/storage and staging acceptance remain open. |
| R06 Accountant | `/finance` | Scoped invoice/payment/expense/report reads plus invoice creation, payment recording, expense decisions, payment evidence, single-flight guards, and partial-failure handling. | Separate read/write/upload policies; integer piastres validation is client-side assistance only; backend owns tenant/branch, ownership, audit, and append-only rules. | **Accepted; production gate open** | Private-storage secret injection, authenticated storage smoke, backup/restore evidence, and staging acceptance. |
| R07 Marketing Manager | None | No live Angular marketing desk. Marketing remains an explicitly labeled Preview/local surface and is not represented as LIVE parity. | No production campaign/lead authorization is implied by Angular navigation metadata. | Preview / out of scope | Product decision: implement live APIs or keep Preview outside MVP. |
| R08 Guardian | `/family-portal` | Child switching, read-only linked invoices, sessions, and published evaluations only; loading/error/empty states never fall back to demo data. | Backend linked-student scope is authoritative; unrelated child records must not be returned. | **Accepted** | Evidence deployment and any additional finance UX remain outside this slice. |
| R09 Student | `/student-portal` | Self/linked student profile, sessions, and published evaluations only; profile remains available when session loading fails. | Backend self/linked scope and publication state are authoritative; no client selector expands access. | **Accepted** | Broader learning/progress surfaces remain intentionally limited. |

## Cross-cutting closure checks

- Arabic-first labels, RTL layout, responsive Mada visual system, `OnPush`, signals, and lazy route loading are preserved.
- LIVE failures expose `loading/error/forbidden/empty` states and do not silently replace API data with demo data.
- Frontend guards are advisory. Every sensitive read/mutation/upload must be re-authorized and scoped by the backend.
- Consumer surfaces are restricted to linked/self records and published evaluations.
- Finance writes are append-only and audit-trailed; payment recording is independent from evidence upload.
- Local Angular unit/component tests, production build, and the dedicated Angular Finance/R08/R09 Playwright coverage are green on the merged baseline. Deployment and storage evidence are not inferred from local tests.

## Explicit non-claims

This matrix does not claim Angular parity for every React route, every R00/R01 administrative workflow, Marketing R07, unsupported analytics, direct online payments, production object storage, or deployed staging. Those require separate contracts, authorization review, and acceptance evidence before being marked **Accepted**.

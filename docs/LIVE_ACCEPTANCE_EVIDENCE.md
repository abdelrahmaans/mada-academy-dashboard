# Mada Academy — LIVE acceptance evidence

**Date:** 4 October 2026  
**Scope:** R01 Academy Owner, R03 Head Instructors, R04 Instructor  
**Environment:** local API with InMemory data; no production or staging claims

## Acceptance rule

> A surface is marked LIVE only when its displayed values come from an implemented API contract, its role and tenant/branch scope are enforced by the backend, and failure states do not substitute fixtures or demo values.

## R01 — Executive dashboard

| Evidence           | Endpoint / behavior                                                     | Role and scope                                                           | Test/evidence                                                            |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Summary metrics    | `GET /api/v1/academy/executive-summary`                                 | R01 only; current tenant; optional selected branch must belong to tenant | `ExecutiveSummary_AggregatesOnlyTenantDataWithinSelectedPeriodAndBranch` |
| Activity feed      | `GET /api/v1/academy/executive-activity`                                | R01 only; tenant and branch filtering; global tenant events allowed      | `ExecutiveActivity_CombinesAuditAndDecisionsWithinTenantBranchAndPeriod` |
| Read-only boundary | POST to summary is rejected                                             | No mutation is exposed by this surface                                   | `ExecutiveSummary_IsReadOnlyAndOnlyAvailableToAcademyOwner`              |
| Failure behavior   | Report source errors show an explicit Arabic error and no demo fallback | Applies to summary and activity                                          | `liveSurfaceAcceptance.test.ts` — `executiveFailureMessage`              |
| Empty behavior     | Empty alerts, branches, and activity render explicit empty copy         | No fabricated counts                                                     | `ExecutiveDashboardLive.tsx` empty states                                |

## R03 — Head Instructors

| Evidence               | API behavior                                                                            | Acceptance rule                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Core data              | Groups, assigned instructors, and sessions are required for the live overview           | Any core failure keeps the surface in error state; it does not render fixtures |
| Optional data          | Evaluation summary and unread notifications are optional                                | Their failure keeps core data visible and shows a warning plus retry           |
| Evaluation publication | Review queue uses persisted evaluation workflow; consumers only see `PUBLISHED` results | Backend authorization remains authoritative                                    |
| Scope                  | The account must be `R03_HEAD_INSTRUCTORS` with an assigned branch                      | Missing branch is an explicit error, not a demo branch                         |

Automated evidence: `mergeR03LiveResults` and `liveSurfaceAcceptance.test.ts` cover optional failures, core failures, fallback counts, and warning copy. The component visibly labels the surface `LIVE` and explicitly states that unsupported mastery/checkpoint analytics are not shown.

## R04 — Instructor

| Evidence           | API behavior                                                                   | Acceptance rule                                                                                             |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Assigned sessions  | `listSessions` uses the instructor session scope                               | Only sessions assigned to the authenticated instructor are displayed                                        |
| Attendance         | Read/write attendance endpoints are tied to the selected assigned session      | No branch-wide or tenant-wide attendance is inferred in the client                                          |
| Evaluations        | Draft/save/submit uses the selected session and linked students                | Publication remains a reviewer/backend decision; the instructor surface does not expose consumer visibility |
| Non-live analytics | No mastery/checkpoint analytics are presented as operational values            | Broader analytics remain outside the current live contract                                                  |
| Failure/retry      | Sessions, attendance, and evaluations have separate loading/error/retry states | A failed read does not render demo data                                                                     |

Browser evidence: `critical-flows.spec.ts` covers the R04 completed-session disabled state and the attendance loading → error → retry flow. The retry action re-fetches the selected session without changing the scope or inserting fixture students.

## Verification commands

```bash
pnpm check
pnpm test
pnpm build
pnpm e2e
export DOTNET_ROOT=/home/ubuntu/.dotnet
export PATH="$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH"
dotnet test backend/MadaAcademy.Api.IntegrationTests/MadaAcademy.Api.IntegrationTests.csproj --configuration Release --filter 'FullyQualifiedName~ExecutiveDashboardApiTests|FullyQualifiedName~EvaluationReviewApiTests|FullyQualifiedName~OperationalReportApiTests'
git diff --check
```

## Remaining evidence gaps

- Run the same acceptance checklist against deployed staging with PostgreSQL and production-like secrets.
- Capture R01 report-source acceptance evidence from a controlled staging dataset.
- Add component/browser-level tests for R04 mutation pending/disabled states; the current local E2E focuses on finance and consumer journeys.
- R07 Marketing remains `PREVIEW/LOCAL` and is not included in this LIVE acceptance.

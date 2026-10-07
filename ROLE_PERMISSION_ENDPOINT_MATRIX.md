# Mada Academy — Role × Permission × Endpoint Matrix

**Date:** 2026-10-07  
**Source of truth:** backend endpoint guards, JWT scope queries, `RoleCatalog.cs`, API contracts, and integration tests.  
**Frontend status:** Angular is currently wired for auth, R02 dashboard, and the R03 data-access slice only. `Pending` in this document means the Angular feature/client method is not implemented yet; it does not mean that the backend endpoint is missing.

> **Security rule:** Angular guards and this matrix are client navigation policy only. Backend `RequireAuthorization`, role checks, tenant/branch filters, linked-record checks, assignment checks, and publication checks remain authoritative.

## 1. Role catalog and declared permissions

The following table is the permission catalog declared by backend `RoleCatalog`. `R00` is included for completeness although it is not assignable through the academy-owner role-management endpoint.

| Role | Label             | Backend scope                                      | Declared permission keys                                                                                                                                                                                               |
| ---- | ----------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R00  | Platform Admin    | Platform                                           | `platform.read`, `academy.create`, `academy.read`                                                                                                                                                                      |
| R01  | Academy Owner     | Tenant / all academy branches                      | `academy.read`, `academy.update`, `branch.read`, `branch.create`, `classrooms.manage`, `staff.read`, `staff.invite`, `roles.read`, `roles.manage`, `finance.expenses.read`, `finance.expenses.approve`, `reports.read` |
| R02  | Branch Manager    | One branch                                         | `branch.read`, `students.read`, `students.create`, `sessions.read`, `sessions.create`, `attendance.read`, `attendance.write`, `finance.expenses.read`, `finance.expenses.approve`                                      |
| R03  | Head Instructors  | One branch plus active assigned supervision groups | `branch.read`, `sessions.read`, `attendance.read`, `attendance.write`, `evaluations.write`, `evaluations.review`, `staff.read`                                                                                         |
| R04  | Instructor        | One branch plus assigned sessions/students         | `sessions.assigned.read`, `attendance.read`, `attendance.write`, `evaluations.write`                                                                                                                                   |
| R05  | Secretary         | One branch                                         | `branch.read`, `students.read`, `students.create`, `sessions.read`, `staff.read`                                                                                                                                       |
| R06  | Accountant        | One branch                                         | `branch.read`, `finance.read`, `finance.expenses.read`, `finance.expenses.write`, `finance.expenses.approve`, `reports.read`                                                                                           |
| R07  | Marketing Manager | One branch                                         | `branch.read`, `marketing.read`, `marketing.write`, `reports.read`                                                                                                                                                     |
| R08  | Parent / Guardian | Linked children only                               | Consumer portal scope is enforced by linked student/guardian records; no staff permission keys.                                                                                                                        |
| R09  | Student           | Own linked student record only                     | Consumer portal scope is enforced by the authenticated student link; no staff permission keys.                                                                                                                         |

## 2. Endpoint matrix

### Legend

- **Y**: endpoint is intended/allowed for that role group, subject to the row's scope condition.
- **N**: backend should reject the role or the endpoint is outside its role surface.
- **JWT/record**: role alone is insufficient; JWT tenant/branch, active assignment, assigned instructor, consumer link, or record ownership must also pass.
- **Angular**: current Angular data-access status: `Live`, `Partial`, or `Pending`.

### 2.1 Authentication, identity, platform, and academy administration

| Method and endpoint                                                  | Permission / backend policy                                            | R00 | R01 | R02 | R03 | R04 | R05 | R06 | R07 | R08 | R09 | Angular |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | ------- |
| `POST /auth/otp/send`                                                | Public auth flow; account type and rate limit apply                    |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Pending |
| `POST /auth/otp/verify`                                              | Public auth flow; only active account/membership can verify            |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Pending |
| `POST /auth/login`                                                   | Public password auth; account type and lockout apply                   |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Live    |
| `POST /auth/refresh`                                                 | Authenticated refresh lifecycle; active membership required            |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Live    |
| `POST /auth/logout`                                                  | Authenticated refresh-session revocation                               |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Live    |
| `GET /me`                                                            | Authenticated identity; returns role, scope, branches, and permissions |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Live    |
| `POST /platform/academies`                                           | `platform-admin`; creates academy/owner/branch                         |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /platform/overview`                                             | `platform-admin`                                                       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /platform/academies`                                            | `platform-admin`                                                       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /platform/roles`                                                | `platform-admin`                                                       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PATCH /platform/academies/{tenantId}/status`                        | `platform-admin`; tenant mutation and session revocation               |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /platform/academies/{tenantId}/members`                         | `platform-admin`; tenant selected by platform path and rechecked       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PATCH /platform/academies/{tenantId}/members/{membershipId}/status` | `platform-admin`; audit/session behavior applies                       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `POST /platform/academies/{tenantId}/users/{userId}/sessions/revoke` | `platform-admin`                                                       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /platform/academies/{tenantId}/activity`                        | `platform-admin`                                                       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /platform/activity`                                             | `platform-admin`                                                       |   Y |   N |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /academy/roles`                                                 | `academy-owner` policy                                                 |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /academy/members`                                               | `academy-owner`; tenant scope                                          |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `POST /academy/members`                                              | `academy-owner`; invites active staff membership                       |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PUT /academy/members/{membershipId}/role`                           | `academy-owner`; active branch ownership and self-role restrictions    |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PATCH /academy/members/{membershipId}/status`                       | `academy-owner`; status mutation and audit                             |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /academy/branches`                                              | `academy-owner`; tenant scope                                          |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `POST /academy/branches`                                             | `academy-owner`; creates branch in current tenant                      |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PUT /academy/branches/{branchId}`                                   | `academy-owner`; branch ownership check                                |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PATCH /academy/branches/{branchId}/status`                          | `academy-owner`; branch status mutation                                |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /academy/classrooms`                                            | `academy-owner`; optional branch filter must remain tenant-scoped      |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `POST /academy/classrooms`                                           | `academy-owner`; branch must belong to tenant                          |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PUT /academy/classrooms/{classroomId}`                              | `academy-owner`; branch/tenant ownership                               |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PATCH /academy/classrooms/{classroomId}/status`                     | `academy-owner`; branch/tenant ownership                               |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /academy/classrooms/{classroomId}/resources`                    | `academy-owner`; classroom ownership                                   |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `POST /academy/classrooms/{classroomId}/resources`                   | `academy-owner`; classroom ownership                                   |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `PUT /academy/classrooms/{classroomId}/resources/{resourceId}`       | `academy-owner`; classroom/resource ownership                          |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |
| `DELETE /academy/classrooms/{classroomId}/resources/{resourceId}`    | `academy-owner`; classroom/resource ownership                          |   N |   Y |   N |   N |   N |   N |   N |   N |   N |   N | Pending |

### 2.2 Academy scope, dashboard, students, sessions, and attendance

| Method and endpoint                    | Permission / backend policy                                                                    | R00 | R01 | R02 |   R03 | R04 | R05 | R06 | R07 | R08 | R09 | Angular     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | --: | --: | --: | ----: | --: | --: | --: | --: | --: | --: | ----------- |
| `GET /tenants/{tenantId}/scope-check`  | Staff scope check; R00 is platform-wide, tenant/branch roles must match JWT scope              |   Y |   Y |   Y |     Y |   Y |   Y |   Y |   Y |   N |   N | Pending     |
| `GET /dashboard/summary`               | Current implementation allows R01/R02; R02 result is branch-scoped                             |   N |   Y |   Y |     N |   N |   N |   N |   N |   N |   N | Live R02    |
| `POST /scheduling/check-conflict`      | `staff`; request branch must be inside JWT scope                                               |   N |   Y |   Y |     Y |   Y |   Y |   Y |   Y |   N |   N | Pending     |
| `GET /students`                        | `staff` endpoint with tenant/branch query scope; no narrow role gate in current implementation | N\* |   Y |   Y |     Y |   Y |   Y |   Y |   Y |   N |   N | Pending     |
| `GET /sessions`                        | `staff`; R04 self-assigned, R03 active supervised groups, other staff scope                    | N\* |   Y |   Y |     Y |   Y |   Y |   Y |   Y |   N |   N | Partial R03 |
| `GET /sessions/{sessionId}`            | `staff`; record must be inside role/assignment scope                                           | N\* |   Y |   Y |     Y |   Y |   Y |   Y |   Y |   N |   N | Pending     |
| `GET /sessions/{sessionId}/attendance` | `staff`; record scope and R03 assignment `CanReadAttendance` apply                             | N\* |   Y |   Y |     Y |   Y |   Y |   Y |   Y |   N |   N | Pending     |
| `PUT /sessions/{sessionId}/attendance` | Current code `CanWriteAttendance` is R02 or R04; assigned/session scope applies                |   N |   N |   Y | N\*\* |   Y |   N |   N |   N |   N |   N | Pending     |
| `POST /sessions/{sessionId}/complete`  | Current code requires R04 and assigned instructor                                              |   N |   N |   N |     N |   Y |   N |   N |   N |   N |   N | Pending     |
| `GET /reports/operational`             | R01/R02/R06; branch filter cannot widen scope                                                  |   N |   Y |   Y |     N |   N |   Y |   N |   N |   N |   N | Pending     |
| `GET /reports/operational.csv`         | Same R01/R02/R06 policy as operational report                                                  |   N |   Y |   Y |     N |   N |   Y |   N |   N |   N |   N | Pending     |
| `GET /academy/executive-summary`       | `academy-owner`; tenant scope                                                                  |   N |   Y |   N |     N |   N |   N |   N |   N |   N |   N | Pending     |
| `GET /academy/executive-activity`      | `academy-owner`; tenant scope                                                                  |   N |   Y |   N |     N |   N |   N |   N |   N |   N |   N | Pending     |

`*` R00 is shown as `N*` where the implementation is a `staff` group rather than a dedicated platform role check; verify whether platform staff should consume the operational endpoint before exposing it in Angular.  
`**` The declared catalog contains `attendance.write` for R03, but the current backend implementation excludes R03 from `CanWriteAttendance`; this is a contract mismatch requiring an explicit product decision and integration test before changing.

### 2.3 Scheduling, groups, supervision, and evaluations

| Method and endpoint                                           | Permission / backend policy                                                     | R00 | R01 | R02 | R03 | R04 | R05 | R06 | R07 | R08 | R09 | Angular          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | ---------------- |
| `GET /scheduling/course-templates`                            | `CanManageScheduling`: R01/R02                                                  |   N |   Y |   Y |   N |   N |   N |   N |   N |   N |   N | Pending          |
| `POST /scheduling/course-templates`                           | `CanManageScheduling`: R01/R02                                                  |   N |   Y |   Y |   N |   N |   N |   N |   N |   N |   N | Pending          |
| `GET /scheduling/groups`                                      | `CanReadScheduling`: R01/R02/R03; R03 active supervision assignment filter      |   N |   Y |   Y |   Y |   N |   N |   N |   N |   N |   N | Live R03         |
| `POST /scheduling/groups`                                     | `CanManageScheduling`: R01/R02                                                  |   N |   Y |   Y |   N |   N |   N |   N |   N |   N |   N | Pending          |
| `GET /scheduling/instructors`                                 | `CanReadScheduling`: R01/R02/R03; branch scope                                  |   N |   Y |   Y |   Y |   N |   N |   N |   N |   N |   N | Live R03         |
| `POST /scheduling/sessions`                                   | `CanManageScheduling`: R01/R02; request branch scope                            |   N |   Y |   Y |   N |   N |   N |   N |   N |   N |   N | Pending          |
| `POST /scheduling/session-requests`                           | Managers or instructors: R01/R02/R03/R04; branch and actor rules                |   N |   Y |   Y |   Y |   Y |   N |   N |   N |   N |   N | Pending          |
| `POST /scheduling/sessions/{sessionId}/substitution-requests` | Instructor role R03/R04; assigned/target session rules                          |   N |   N |   N |   Y |   Y |   N |   N |   N |   N |   N | Pending          |
| `GET /scheduling/approvals`                                   | `CanDecide`: R00/R01/R02/R03; tenant/branch scope                               |   Y |   Y |   Y |   Y |   N |   N |   N |   N |   N |   N | Pending          |
| `POST /scheduling/approvals/{approvalId}/proposals`           | Instructor proposal flow; actor and session constraints apply                   |   N |   N |   N |   Y |   Y |   N |   N |   N |   N |   N | Pending          |
| `POST /scheduling/approvals/{approvalId}/decision`            | `CanDecide`: R00/R01/R02/R03; state transition and scope                        |   Y |   Y |   Y |   Y |   N |   N |   N |   N |   N |   N | Pending          |
| `GET /supervision/branch-groups`                              | R02 only; branch scope                                                          |   N |   N |   Y |   N |   N |   N |   N |   N |   N |   N | Pending          |
| `POST /supervision/assignments`                               | R02 only; supervisor, group, branch, and permissions validated                  |   N |   N |   Y |   N |   N |   N |   N |   N |   N |   N | Pending          |
| `DELETE /supervision/assignments/{assignmentId}`              | R02 only; branch ownership and audit behavior                                   |   N |   N |   Y |   N |   N |   N |   N |   N |   N |   N | Pending          |
| `GET /supervision/my-groups`                                  | R03 only; active assignment scope                                               |   N |   N |   N |   Y |   N |   N |   N |   N |   N |   N | Pending          |
| `GET /scheduling/sessions/{sessionId}/evaluations`            | R03/R04; R03 assignment and R04 instructor ownership                            |   N |   N |   N |   Y |   Y |   N |   N |   N |   N |   N | Pending          |
| `PUT /scheduling/sessions/{sessionId}/evaluations`            | R03/R04; evaluator ownership/assignment and editable status                     |   N |   N |   N |   Y |   Y |   N |   N |   N |   N |   N | Pending          |
| `POST /scheduling/sessions/{sessionId}/evaluations/submit`    | R03/R04; evaluator ownership/assignment                                         |   N |   N |   N |   Y |   Y |   N |   N |   N |   N |   N | Pending          |
| `GET /scheduling/evaluation-reviews`                          | R03 only; active `CanReviewEvaluations` assignment                              |   N |   N |   N |   Y |   N |   N |   N |   N |   N |   N | Live data-access |
| `GET /scheduling/evaluation-status-summary`                   | R03 only; active `CanReviewEvaluations` assignment                              |   N |   N |   N |   Y |   N |   N |   N |   N |   N |   N | Live R03         |
| `POST /scheduling/evaluation-reviews/{evaluationId}/decision` | R03 only; submitted state, assignment, branch, audit, notification, publication |   N |   N |   N |   Y |   N |   N |   N |   N |   N |   N | Live data-access |
| `GET /scheduling/notifications`                               | Authenticated actor; recipient is the JWT subject                               |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   N |   N | Live R03         |
| `POST /scheduling/notifications/{notificationId}/read`        | Authenticated actor; notification recipient must be JWT subject                 |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   N |   N | Live R03         |
| `GET /scheduling/classrooms`                                  | Staff endpoint; branch/tenant scope must be rechecked                           | N\* |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   N |   N | Pending          |

### 2.4 Finance and expense endpoints

| Method and endpoint                                         | Permission / backend policy                                                 | R00 | R01 | R02 | R03 | R04 | R05 | R06 | R07 | R08 | R09 | Angular |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | ------- |
| `GET /finance/invoices`                                     | R05/R06; branch/tenant ownership                                            |   N |   N |   N |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `GET /finance/invoices/{invoiceId}`                         | R05/R06; invoice ownership                                                  |   N |   N |   N |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `POST /finance/invoices`                                    | R05/R06; student/enrollment branch ownership                                |   N |   N |   N |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `POST /finance/invoices/{invoiceId}/payments`               | R05/R06; invoice ownership, append-only payment and audit rules             |   N |   N |   N |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `POST /finance/payments/{paymentId}/evidence`               | R05/R06; payment ownership and evidence audit                               |   N |   N |   N |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `GET /finance/payments/{paymentId}/evidence`                | R05/R06 staff ownership; consumer access only through linked consumer rules |   N |   N |   N |   N |   N |   Y |   Y | Y\* | Y\* | Y\* | Pending |
| `GET /finance/reports/summary`                              | R01/R02/R06; tenant/branch scope                                            |   N |   Y |   Y |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `GET /finance/reports/summary.csv`                          | R01/R02/R06; same scope as report                                           |   N |   Y |   Y |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `GET /finance/expenses`                                     | R01/R02/R06                                                                 |   N |   Y |   Y |   N |   N |   N |   Y |   N |   N |   N | Pending |
| `GET /finance/expenses/{expenseId}`                         | R01/R02/R06                                                                 |   N |   Y |   Y |   N |   N |   N |   Y |   N |   N |   N | Pending |
| `POST /finance/expenses`                                    | R06 only; expense ownership and audit                                       |   N |   N |   N |   N |   N |   N |   Y |   N |   N |   N | Pending |
| `POST /finance/expenses/{expenseId}/approve`                | R01/R02/R06; approval scope and audit                                       |   N |   Y |   Y |   N |   N |   N |   Y |   N |   N |   N | Pending |
| `POST /finance/expenses/{expenseId}/reject`                 | R01/R02/R06; approval scope and audit                                       |   N |   Y |   Y |   N |   N |   N |   Y |   N |   N |   N | Pending |
| `POST /finance/expenses/{expenseId}/evidence`               | R06 only; evidence ownership                                                |   N |   N |   N |   N |   N |   N |   Y |   N |   N |   N | Pending |
| `GET /finance/expenses/{expenseId}/evidence`                | R01/R02/R06 read policy; ownership                                          |   N |   Y |   Y |   N |   N |   N |   Y |   N |   N |   N | Pending |
| `GET /finance/invoice-corrections`                          | R05/R06 read policy                                                         |   N |   N |   N |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `POST /finance/invoices/{invoiceId}/correction-requests`    | R05/R06 request policy; invoice ownership                                   |   N |   N |   N |   N |   N |   Y |   Y |   N |   N |   N | Pending |
| `POST /finance/invoice-corrections/{correctionId}/decision` | R01/R02 decision policy; audit                                              |   N |   Y |   Y |   N |   N |   N |   N |   N |   N |   N | Pending |
| `GET /consumer/invoices`                                    | Consumer policy; linked parent/student invoice scope                        |   N |   N |   N |   N |   N |   N |   N |   N |   Y |   Y | Pending |

`*` Consumer evidence behavior must be verified against the payment/student link in the finance implementation before exposing a direct Angular consumer download route. Do not infer permission from the `staff` evidence writer policy.

### 2.5 Consumer identity and invitations

| Method and endpoint                                      | Permission / backend policy                                      | R00 | R01 | R02 | R03 | R04 | R05 | R06 | R07 | R08 | R09 | Angular |
| -------------------------------------------------------- | ---------------------------------------------------------------- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | ------- |
| `GET /students/{studentId}/consumer-links`               | Staff link management: R01/R02/R05; student must be in scope     |   N |   Y |   Y |   N |   N |   Y |   N |   N |   N |   N | Pending |
| `GET /students/{studentId}/consumer-accounts`            | Staff link management + lookup rate limit: R01/R02/R05           |   N |   Y |   Y |   N |   N |   Y |   N |   N |   N |   N | Pending |
| `POST /students/{studentId}/consumer-invitations`        | Staff link management: R01/R02/R05                               |   N |   Y |   Y |   N |   N |   Y |   N |   N |   N |   N | Pending |
| `POST /consumer-invitations/preview`                     | Public invitation token preview; rate limited                    |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Pending |
| `POST /consumer-invitations/resend-code`                 | Public invitation flow; rate limited                             |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Pending |
| `POST /consumer-invitations/accept`                      | Public invitation flow; rate limited and token-bound             |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y |   Y | Pending |
| `POST /students/{studentId}/student-account`             | R01/R02/R05; link ownership and student scope                    |   N |   Y |   Y |   N |   N |   Y |   N |   N |   N |   N | Pending |
| `DELETE /students/{studentId}/student-account`           | R01/R02/R05; link ownership and audit                            |   N |   Y |   Y |   N |   N |   Y |   N |   N |   N |   N | Pending |
| `POST /students/{studentId}/guardians`                   | R01/R02/R05; linked-record ownership                             |   N |   Y |   Y |   N |   N |   Y |   N |   N |   N |   N | Pending |
| `DELETE /students/{studentId}/guardians/{userAccountId}` | R01/R02/R05; linked-record ownership                             |   N |   Y |   Y |   N |   N |   Y |   N |   N |   N |   N | Pending |
| `GET /consumer/me/students`                              | Consumer JWT; linked parent children or own student record       |   N |   N |   N |   N |   N |   N |   N |   N |   Y |   Y | Pending |
| `GET /consumer/me/sessions`                              | Consumer JWT; linked records and published evaluation visibility |   N |   N |   N |   N |   N |   N |   N |   N |   Y |   Y | Pending |

## 3. Role-centric endpoint summary

This is the implementation order for Angular. A role appears in a row only when there is an existing backend surface worth wiring; conditional scope still applies.

| Role                  | Angular endpoint groups to implement                                                                                                                                                | Current Angular state                    | Main scope/security tests required                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| R00 Platform Admin    | platform overview, academies, platform roles, academy/member status, session revocation, activity, academy bootstrap                                                                | Pending                                  | cross-tenant platform access, tenant status revokes sessions, no academy-owner mutation leakage       |
| R01 Academy Owner     | `/me`, academy roles/members, branches, classrooms/resources, course templates, groups/sessions, executive reports, finance reports/expense approvals, invoice correction decisions | `/me` only                               | tenant isolation, cannot mutate own owner role, branch ownership, audit events                        |
| R02 Branch Manager    | dashboard summary, students, scheduling CRUD, sessions, attendance, supervision assignment management, reports, expense approvals, invoice correction decisions                     | Dashboard Live                           | branch isolation, no cross-branch writes, supervision target branch, attendance write rules           |
| R03 Head Instructors  | supervised groups/instructors/sessions, assigned attendance reads, evaluation write/review, notifications, active supervision group scope                                           | Dashboard/data-access Live               | assignment start/end, `CanReadAttendance`, `CanReviewEvaluations`, published-only consumer visibility |
| R04 Instructor        | assigned sessions, attendance read/write, session completion, evaluation read/write/submit, substitution/proposal flows                                                             | Pending                                  | only assigned instructor, enrolled students, completed/published state transitions                    |
| R05 Secretary         | students, staff read, scheduling read, invoices/payments/evidence, invoice correction requests, consumer links/invitations                                                          | Pending                                  | branch ownership, financial invoice ownership, consumer link ownership, audit                         |
| R06 Accountant        | invoices/payments/evidence, finance reports, expenses CRUD/evidence/approval, invoice correction requests                                                                           | Pending                                  | branch-scoped finance, append-only payments, over-collection, evidence ownership, audit               |
| R07 Marketing Manager | branch read and any future marketing endpoints; reports only where backend permits                                                                                                  | Pending / Marketing not fully API-backed | do not expose placeholder marketing as LIVE, branch isolation                                         |
| R08 Parent            | linked students, consumer sessions, consumer invoices, published evaluations only                                                                                                   | Pending                                  | guardian link only, no sibling/other-tenant leakage, unpublished evaluations hidden                   |
| R09 Student           | own consumer profile/sessions/invoices where contract permits                                                                                                                       | Pending                                  | self-scope only, no parent/other-student leakage, unpublished evaluations hidden                      |

## 4. Contract gaps and required decisions

### 4.1 R03 attendance write mismatch

`RoleCatalog` declares `attendance.write` for R03, but `OperationalEndpoints.CanWriteAttendance` currently returns true only for R02 and R04. The matrix intentionally records the backend behavior as authoritative and marks R03 attendance mutation as denied. Product must choose one of these explicit outcomes:

1. Keep R03 read-only for attendance and remove `attendance.write` from the role catalog, or
2. Allow R03 writes only for active supervised groups with a dedicated backend test and assignment check.

Angular must not enable a write button based on the catalog until this is resolved.

### 4.2 Broad `staff` endpoint policies

Several GET endpoints are grouped under `RequireAuthorization("staff")` and do not have a narrow role predicate. The matrix marks their actual current backend exposure and flags them for review. If the intended product policy is permission-based, move the authorization decision into a shared backend policy/helper rather than relying on Angular route data.

### 4.3 R00 platform role versus academy operational routes

Some operational endpoints accept any `staff` token. R00 is not shown as an ordinary academy operator in the role summaries. Decide whether platform admins should receive read-only operational access or be explicitly denied outside `/platform/*`.

### 4.4 R07 marketing surface

The role and permission catalog contains `marketing.read` and `marketing.write`, but the backend marketing vertical is not fully API-backed. Angular must keep Marketing marked as `Pending` or `DEMO`; do not manufacture endpoints or treat static screens as LIVE.

## 5. Angular implementation contract

Every future Angular feature should provide these files:

```text
features/<feature>/
├── models/<feature>.models.ts
├── data-access/<feature>-api.service.ts
├── data-access/<feature>-data.service.ts
├── pages/<feature>-page.ts
└── pages/<feature>-page.spec.ts
```

Each route must declare a policy from the backend catalog:

```ts
{
  path: 'feature',
  canActivate: [authGuard, authorizationGuard],
  data: {
    authorization: {
      roles: ['R03_HEAD_INSTRUCTORS'],
      permissions: ['evaluations.review'],
    },
  },
}
```

The client must never send `tenantId` or `branchId` to widen a query. A client-selected branch filter is allowed only when the backend contract explicitly supports it and still enforces the JWT scope. Every mutation requires a backend integration test for an allowed role, a denied role, same-tenant wrong-branch data, and cross-tenant data.

## 6. Acceptance checklist

- [ ] Every Angular route has a role/permission policy or is explicitly public/auth-only.
- [ ] Every Angular API method has a typed request/response contract.
- [ ] Every endpoint group has a backend integration test for allow/deny and scope boundaries.
- [ ] R03 attendance-write mismatch is resolved before exposing mutation UI.
- [ ] R08/R09 consumer records are link-scoped and published-evaluation rules are tested.
- [ ] Finance endpoints preserve ownership, append-only payment behavior, evidence rules, and audit events.
- [ ] Marketing remains clearly marked `Pending`/`DEMO` until its API contract is complete.
- [ ] Angular E2E covers login, `/me`, one representative endpoint group per role, and a denied cross-role navigation.
- [ ] The matrix is updated whenever backend authorization or an endpoint contract changes.

# Consumer Acceptance Smoke Test — R08/R09

**Scope:** Core MVP consumer acceptance only. Finance deployment and API deployment are intentionally out of scope for this phase.

## Current state

- The seeded core graph is available after `DemoDataSeeder` runs.
- The API journey is covered by `P1CoreJourneyApiTests`.
- A real browser click-through is **not yet claimed complete** because there is no deployed API URL in the current repository.
- Do not run this against production data. The credentials below are development/demo-only and must not be reused in a deployed environment.

## Controlled demo accounts

| Role | Phone | Password | Expected scope |
|---|---|---|---|
| R08 Parent | `+201000000011` | `Mada@2026` | Youssef Ahmed only |
| R09 Student | `+201000000012` | `Mada@2026` | Lina Omar only |

The accounts are created by the development/demo seeder. If the database already contains `mada-demo-academy`, rerun the seeder to repair the core graph before testing.

## Preconditions

- API is running with the development seed enabled.
- Frontend has `VITE_API_URL` pointing to that API's `/api/v1` base.
- Database migrations have been applied.
- No real student, parent, or financial data is used.

## R08 Parent flow

1. Open `/login`.
2. Sign in with the R08 phone and password above.
3. Confirm the app routes to `/family-portal`.
4. Confirm the linked-student list contains **Youssef Ahmed**.
5. Confirm **Lina Omar** and the Heliopolis student are not visible.
6. Open the sessions/attendance area.
7. Confirm Youssef's completed session is visible with attendance and the published score `88`.
8. Confirm the published evaluation note is visible.
9. Refresh the page and confirm the same live data remains.
10. Simulate or observe an invoice/session failure: the failure must show an explicit error/retry state and must not remove the linked child or replace data with demo fixtures.

## R09 Student flow

1. Log out.
2. Sign in with the R09 phone and password above.
3. Confirm the app routes to `/student-portal`.
4. Confirm the linked-student list contains **Lina Omar** only.
5. Confirm **Youssef Ahmed** and the Heliopolis student are not visible.
6. Confirm Lina's session appears after the seeded P1 journey publishes the evaluation.
7. Confirm Lina sees only her own score/session data.
8. Refresh the page and confirm the profile remains visible if sessions fail.
9. Confirm a session failure produces an explicit warning/toast/retry state and never falls back to demo sessions.

## API assertions behind the click-through

The browser test is accepted only when these scoped API behaviors also hold:

- `GET /api/v1/consumer/me/students` returns one linked student per account.
- `GET /api/v1/consumer/me/sessions` returns only records derived from the account's active link.
- A parent cannot request an unlinked student with `?studentId=...`.
- A student cannot request another student's sessions with `?studentId=...`.
- A branch-scoped staff account cannot inspect consumer links for a student in another branch.
- Published evaluations expose `score` and `notes`; draft/submitted evaluations do not.
- Live route failures remain errors/empty states and never initialize demo fixtures.

## Exit criteria

Mark this phase complete only after:

- [ ] R08 browser click-through completed against a controlled non-production API.
- [ ] R09 browser click-through completed against the same controlled API.
- [ ] Scope checks above passed.
- [ ] Refresh and partial-failure behavior observed.
- [ ] Evidence recorded with timestamp, API/frontend URLs, and test-data identifiers.

Until a controlled API URL exists, the phase status is **prepared and automation-verified, awaiting manual click-through**.

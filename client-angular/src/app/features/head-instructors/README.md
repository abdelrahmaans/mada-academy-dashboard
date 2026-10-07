# R03 Head Instructors feature

This feature is the Angular LIVE parity slice for `R03_HEAD_INSTRUCTORS` at `/head-instructors`.

## Architecture

- `models/`: readonly domain contracts owned by this feature; no template-shaped DTOs.
- `data-access/head-instructors-api.service.ts`: one typed method per existing backend endpoint. It never accepts a client-selected branch scope for reads; branch scope is derived from JWT claims by the API.
- `data-access/head-instructors-data.service.ts`: orchestration boundary. Groups, instructors, and sessions are core sources loaded concurrently. Evaluation summary and unread notifications are optional sources that degrade to explicit warnings without erasing core data.
- `pages/`: standalone `OnPush` page. Mutable UI state is held in signals; counts and lists are computed, not duplicated state. The route is lazy-loaded.

## Scope and LIVE rules

- The backend remains authoritative for tenant, branch, role, supervision assignment, and publication rules.
- The UI does not send `tenantId` or `branchId` to widen a query and does not treat sidebar/guard state as authorization.
- No demo fallback is used for core failures, empty data, evaluation failures, or notification failures.
- Consumer evaluation visibility remains a backend publication rule; the page only displays staff-facing status counts.

## Tests

The feature tests cover endpoint URLs and query boundaries, core/optional failure behavior, and the page role boundary. The whole Angular suite and production build must remain green before opening a PR.

# Angular dashboard features

## R02 branch dashboard

`pages/branch-dashboard-page` is the first LIVE-parity slice after the Angular auth shell. It calls only `GET /api/v1/dashboard/summary`; tenant and branch scope come from the backend JWT claims and are never supplied by the client.

The page is intentionally limited to `R02_BRANCH_MANAGER`. Other authenticated roles see a locked state and do not issue a dashboard request. Loading, API error, retry, and empty upcoming-session states are explicit; no demo fallback is shown.

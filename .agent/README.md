# Agent Workspace

This directory is the single source of truth for agent handoff and project planning. Keep operational knowledge here instead of adding new status files to the repository root.

## Canonical files

| File | Purpose | Update rule |
|---|---|---|
| [`AGENT_HANDOFF.md`](AGENT_HANDOFF.md) | Architecture, role boundaries, security rules, and safe workflow | Update when architecture or non-negotiable rules change |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Verified product state, LIVE/DEMO boundaries, and known gaps | Update only when implementation truth or verified evidence changes |
| [`NEXT_PHASE_PLAN.md`](NEXT_PHASE_PLAN.md) | Ordered work plan and acceptance criteria | Update when priorities, completion, or blockers change |
| [`WORKING_AGREEMENT.md`](WORKING_AGREEMENT.md) | Repository organization conventions for future work | Update when the development workflow changes |

## Agent workflow

1. Read `AGENT_HANDOFF.md`, `PROJECT_STATUS.md`, and `NEXT_PHASE_PLAN.md`.
2. Identify the smallest safe change and read its frontend page, API client, backend endpoint/entity, authorization rule, contract, and tests.
3. Preserve routing, API contracts, tenant/branch isolation, consumer-link scope, and LIVE/DEMO boundaries.
4. Add or update tests for behavior or authorization changes.
5. Run the relevant checks, `git diff --check`, and the broader validation commands when practical.
6. Update status/plan only when the verified project truth changed.
7. Work on a focused branch and open a PR against `main`.

## Document locations

- Product and operational documentation: [`../docs/`](../docs/README.md)
- Backend API contracts: [`../backend/`](../backend/README.md)
- Frontend architecture: [`../client/`](../client/README.md)

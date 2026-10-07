# Mada Academy — Angular client

This is the **parallel Angular frontend**. The React app in `../client/` remains the production/reference client while Angular foundations and feature parity are reviewed. The current shared UI gallery contains static visual examples only; this package has no operational API calls and is not a live portal.

## Requirements and commands

- Node.js `^20.19.0 || ^22.12.0 || >=24.0.0` (Angular 21 requirement); use a currently supported LTS release.
- pnpm `10.4.1` (repository baseline).

```bash
cd client-angular
pnpm install --frozen-lockfile
pnpm start       # http://localhost:4200
pnpm build       # production build
pnpm test        # Vitest
```

The R03 Angular-to-backend E2E scenario is kept at the repository root because it starts both the seeded API and the Angular dev server. From the repository root, run `pnpm e2e:angular-r03`. It logs in as the seeded `R03_HEAD_INSTRUCTORS` account, loads the typed R03 resources, checks that the backend returns the role/branch scope, verifies that the client does not send `branchId`, and renders `/head-instructors` through the real HTTP path. The scenario requires the .NET SDK and Chromium.

Keep this package and lockfile isolated from the React root. Root `pnpm check/test/build/e2e` continue to target React only.

## Vercel deployment

The Vercel project for this client must use `client-angular` as its **Root Directory**. The root `../vercel.json` belongs to the React/Vite application and must not be used for this project. The package-local [`vercel.json`](./vercel.json) defines the Angular build, using `pnpm install --frozen-lockfile`, `pnpm build`, and `dist/mada-academy-angular` as the output directory. SPA rewrites are kept in that package-local configuration.

From the repository root, the R09 E2E suite runs with `pnpm e2e:angular-r09`; it requires the .NET SDK and Chromium.

## Shared UI preview

Run `pnpm start`, then open `/shared-components` to inspect the reusable Mada sidebar, buttons, cards, badges, page header, feedback states, and display-scope card. The gallery uses illustrative R02 labels/counts and never calls the API. Review the source React surfaces and read [`src/app/shared/README.md`](src/app/shared/README.md) before reusing a component. This menu is not an authorization control.

## Read before implementation

Read [`../ANGULAR_FRONTEND_GUIDE.md`](../ANGULAR_FRONTEND_GUIDE.md) for architecture, security, API contracts, role matrix, React/Angular parity workflow, and acceptance gates. The root `AGENT_HANDOFF.md`, `PROJECT_STATUS.md`, and `NEXT_PHASE_PLAN.md` remain product truth.

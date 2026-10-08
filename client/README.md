# Frontend

React + Vite + TypeScript frontend. Runtime source remains under `src/` so the existing Vite root, aliases, lazy route imports, and deployment output stay unchanged.

## Source map

- `src/App.tsx` — route table, providers, and global API feedback bridge
- `src/pages/` — route-level screens and LIVE/preview page shells
- `src/components/` — shared UI, role shells, dialogs, and view components
- `src/contexts/` — auth, theme, and role-scope providers
- `src/hooks/` — reusable React hooks
- `src/lib/` — API client, authorization helpers, scope rules, and frontend tests
- `src/styles/` and `src/index.css` — shared RTL/responsive styles and design tokens
- `public/` — static assets served by Vite

## Routing and security

Routes are defined in `src/App.tsx`; role navigation is in `src/lib/roleNavigation.ts` and frontend access checks are in `src/lib/routeAccess.ts`. These are UX/navigation boundaries only. Backend authorization remains authoritative.

Preserve Arabic-first labels, RTL layout, role-specific surfaces, LIVE/DEMO boundaries, and API error/loading/empty states when changing a page.

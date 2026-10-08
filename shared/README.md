# Shared Code

`shared/` contains small cross-layer constants that are imported by the frontend and can be consumed by tooling. Keep this directory dependency-light and free of browser, server, database, or role-specific behavior.

The TypeScript alias `@shared/*` is configured in `tsconfig.json` and `vite.config.ts`.

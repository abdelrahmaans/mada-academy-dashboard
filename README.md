# Mada Academy Dashboard

Arabic-first RTL prototype for role-specific academy operations, built with React, TypeScript, Vite, and Wouter.

## Current phase

This repository is the frontend role-UI/UX workstream. Demo records and local interactions are not persisted. Authentication, API/database integration, and server-side permission enforcement are deferred until role experiences have been designed and reviewed.

Start with [the role UI/UX roadmap](docs/ROLE_UX_ROADMAP.md) and follow the repository instructions in [AGENTS.md](AGENTS.md). Do not confuse this dashboard repo with the separate Angular public marketing-site repository; public landing-page work is outside the current role UI phase.

## Development

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Validation:

```bash
pnpm check
pnpm build
```

The `/platform-console` route is a UI-only preview for R00 Platform Super Admin. The role selector in that shell switches between demo screens; it is not an authentication or authorization mechanism.

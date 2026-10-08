# Browser Tests

Playwright tests for critical authenticated and anonymous journeys live in `critical-flows.spec.ts`.

Run from the repository root:

```bash
pnpm e2e
```

Keep these tests focused on user-visible routing, role access, scope isolation, and critical LIVE workflows. Do not put unit-level logic here; use the relevant `client/src/**/*.test.ts` or backend integration test project instead.

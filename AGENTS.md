# Mada Academy Dashboard — contributor instructions

## Source of truth and repository boundary

- This repository is the role-based dashboard prototype: React 19, TypeScript, Vite, Wouter, and RTL styles.
- For role UI/UX tasks, work here: `abdelrahmaans/mada-academy-dashboard`.
- Do not redirect dashboard work to the separate Angular public-site repository `abdelrahmaans/mada-academy` unless the user explicitly asks for that site.
- Read `docs/ROLE_UX_ROADMAP.md` before starting a role-related change and update its status after each completed UI milestone.
- The shared Mada project UX and permission matrix documents remain the business baseline; keep role names, scope, and first-screen actions aligned with them.

## Delivery phase

- Current phase: complete and connect role-specific UI/UX across R00–R09.
- Use local fixtures and label them `DEMO`/`بيانات محلية`; never imply that browser state is saved or that an approval was enforced.
- Do not add login/authentication, API clients, database schema, server persistence, role guards, or external integrations until the role UI/UX milestone is explicitly complete and the user authorizes the next phase.
- Role preview selectors are navigation aids for the prototype only. They are not authentication, authorization, or security boundaries.
- Do not build or modify a public marketing landing page as part of this role-dashboard work.

## UX and implementation rules

- Design each role's first screen for its actual scope and primary actions; do not make one generic dashboard and merely hide menu items.
- Preserve the hierarchy: Platform → Academy/Tenant → Branch → Role → user-specific scope.
- Use RTL, the existing Cairo/Inter typography and Mada design tokens, responsive layouts, and clear empty/loading/error/locked states.
- Every action in demo UI must clearly communicate whether it is local-only, unavailable, or merely a preview. Avoid dead buttons; use a useful explanation for unavailable workflows.
- Prefer shared components for role shell, scope cards, navigation, page headers, metric cards, responsive tables, status badges, detail dialogs, and next-action/approval states.
- Keep changes small enough to verify. Before a commit, run `pnpm check` and `pnpm build`, inspect `git diff --check`, and review all changed files.

## Git hygiene

- Never print or commit secrets, `.env` files, credentials, or generated `dist/` artifacts.
- Do not overwrite existing user changes. Confirm repository status before editing and before committing.
- Keep the roadmap and code accurate about what is implemented versus still a local demo.

# Repository Working Agreement

## Placement rules

- Keep the repository root limited to entry-point files, package/build configuration, and the main README.
- Put agent-controlled state and plans in `.agent/`.
- Put product, acceptance, security, finance, deployment, and UX documentation in `docs/`.
- Keep frontend runtime code in `client/`; organize it by responsibility (`pages`, `components`, `contexts`, `hooks`, `lib`, and `styles`).
- Keep backend runtime code in `backend/MadaAcademy.Api/`; organize it by API module, auth, persistence, and storage.
- Keep browser journeys in `e2e/`, reusable operational commands in `scripts/`, shared code in `shared/`, and database migrations in `supabase/`.
- Keep API contracts next to the backend they describe; link to them from `docs/` when needed.

## Naming rules

- Use descriptive Markdown filenames in `SCREAMING_SNAKE_CASE` for project-level docs.
- Use `README.md` for folder entry points.
- Do not duplicate status or plan files. Link to the canonical `.agent/` files instead.
- Do not move runtime source solely for visual grouping when doing so would change imports, namespaces, route chunks, or build configuration without a clear benefit.

## Change rules

- Preserve existing routes and public API contracts unless the task explicitly changes them.
- Do not place secrets, credentials, OTPs, payment evidence, database dumps, or `.env` files in the repository.
- Run focused tests first, then the relevant full checks, and always run `git diff --check`.

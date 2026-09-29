

## PostgreSQL local setup

PostgreSQL 16 is now the active local persistence target. See [`DATABASE_STATUS.md`](./DATABASE_STATUS.md) for the migration, seed, and test-account commands. Use `backend/scripts/apply-migrations.sh` and `backend/scripts/seed-demo.sh`; both require `DATABASE_URL` and never embed production secrets.

## React integration

React uses `VITE_API_URL` and `client/src/lib/apiClient.ts`. In local development it defaults to `http://127.0.0.1:4191/api/v1`; for a public preview set `VITE_API_URL` to the public HTTPS API base before starting Vite. The `/workspace` page contains the first live auth/data connection card.

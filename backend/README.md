

## PostgreSQL local setup

PostgreSQL 16 is now the active local persistence target. See [`DATABASE_STATUS.md`](./DATABASE_STATUS.md) for the migration, seed, and test-account commands. Use `backend/scripts/apply-migrations.sh` and `backend/scripts/seed-demo.sh`; both require `DATABASE_URL` and never embed production secrets.

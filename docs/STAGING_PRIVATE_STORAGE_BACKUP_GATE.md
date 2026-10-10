# Staging / Private Storage / Backup Gate

## What is closed in code

- Production private evidence storage fails closed when durable storage is not configured.
- Supabase private-object adapter uses server-only credentials and never exposes public object URLs.
- Evidence access remains behind authenticated, tenant/branch-scoped API routes.
- A staging smoke test now covers private upload and download: `scripts/private-storage-smoke.sh`.
- A restore verification gate now creates a custom PostgreSQL dump and restores it into an isolated database: `scripts/backup-restore-verify.sh`.
- Marketing R07 now uses the persisted `/api/v1/leads` workflow instead of local preview data.

## What remains externally blocked

These items cannot be honestly marked complete from the repository without the target deployment secrets and isolated infrastructure:

1. Inject `SUPABASE_SERVICE_ROLE_KEY` into the staging API secret manager.
2. Run `scripts/private-storage-smoke.sh` against a real staging payment and record the result.
3. Provide an independent backup target for private Storage objects; a database dump does not include Storage API objects.
4. Provide a staging PostgreSQL connection and isolated restore database, then run `scripts/backup-restore-verify.sh`.
5. Run `scripts/staging-smoke.sh` against the deployed API and record the commit SHA, API URL, frontend URL, and timestamp.

## Required evidence before production approval

| Gate | Command / evidence | Status |
|---|---|---|
| API staging | `scripts/staging-smoke.sh` | Open: environment required |
| Private evidence | `scripts/private-storage-smoke.sh` | Open: server secret + fixture required |
| Database backup/restore | `scripts/backup-restore-verify.sh` | Open: pg tools + isolated DB required |
| Storage-object backup | Provider job/log + sample restore | Open: independent durable target required |
| Marketing workflow | R07 creates/lists/updates persisted Leads | Closed in code; verify in staging |

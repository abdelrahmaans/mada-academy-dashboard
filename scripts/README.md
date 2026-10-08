# Operational Scripts

Scripts in this folder automate repeatable repository or staging checks. They must remain safe to run against controlled non-production environments.

- `staging-smoke.sh` — authenticated staging smoke flow; requires explicitly configured non-production environment variables.

Do not add credentials or production endpoints to scripts. See [`../docs/PRE_PRODUCTION_RUNBOOK.md`](../docs/PRE_PRODUCTION_RUNBOOK.md) before using staging tooling.

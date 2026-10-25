#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to the staging PostgreSQL connection string}"
: "${BACKUP_FILE:?Set BACKUP_FILE to a temporary backup path}"
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to an isolated restore database}"
command -v pg_dump >/dev/null || { echo "FAIL: pg_dump is required" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "FAIL: pg_restore is required" >&2; exit 1; }
command -v psql >/dev/null || { echo "FAIL: psql is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "FAIL: sha256sum is required" >&2; exit 1; }
if [[ "$DATABASE_URL" == "$RESTORE_DATABASE_URL" ]]; then
  echo "FAIL: source and restore database URLs are identical; refusing destructive restore" >&2
  exit 1
fi
: "${RESTORE_DATABASE_ISOLATED_CONFIRM:?Set RESTORE_DATABASE_ISOLATED_CONFIRM=YES after confirming the restore target is isolated}"
[[ "$RESTORE_DATABASE_ISOLATED_CONFIRM" == YES ]] || { echo "FAIL: RESTORE_DATABASE_ISOLATED_CONFIRM must equal YES" >&2; exit 1; }
umask 077
mkdir -p "$(dirname "$BACKUP_FILE")"
rm -f "$BACKUP_FILE" "$BACKUP_FILE.sha256"
echo "Creating compressed backup: $BACKUP_FILE"
pg_dump --format=custom --no-owner --no-acl --file="$BACKUP_FILE" "$DATABASE_URL"
test -s "$BACKUP_FILE"
sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
pg_restore --list "$BACKUP_FILE" | grep -qE 'TABLE|SCHEMA' || { echo "FAIL: backup archive contains no schema/table entries" >&2; exit 1; }
echo "Restoring into isolated database and checking connectivity"
pg_restore --exit-on-error --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" "$BACKUP_FILE"
psql "$RESTORE_DATABASE_URL" -Atqc 'select 1' | grep -qx '1'
restored_tables="$(psql "$RESTORE_DATABASE_URL" -Atqc "select count(*) from information_schema.tables where table_schema = 'public'")"
[[ "$restored_tables" =~ ^[0-9]+$ && "$restored_tables" -gt 0 ]] || { echo "FAIL: restored database has no public tables" >&2; exit 1; }
echo "PASS: backup created, checksum recorded, archive inspected, and restored into an isolated database"
echo "Backup checksum: $(cut -d' ' -f1 "$BACKUP_FILE.sha256")"
echo "Restored public tables: $restored_tables"

#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to the staging PostgreSQL connection string}"
: "${BACKUP_FILE:?Set BACKUP_FILE to a temporary backup path}"
: "${RESTORE_DATABASE_URL:?Set RESTORE_DATABASE_URL to an isolated restore database}"

command -v pg_dump >/dev/null || { echo "FAIL: pg_dump is required" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "FAIL: pg_restore is required" >&2; exit 1; }
command -v psql >/dev/null || { echo "FAIL: psql is required" >&2; exit 1; }

umask 077
mkdir -p "$(dirname "$BACKUP_FILE")"
rm -f "$BACKUP_FILE"
echo "Creating compressed backup: $BACKUP_FILE"
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > "$BACKUP_FILE"
test -s "$BACKUP_FILE"

echo "Restoring into isolated database and checking connectivity"
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" "$BACKUP_FILE"
psql "$RESTORE_DATABASE_URL" -Atqc 'select 1' | grep -qx '1'

echo "PASS: backup created and restored into an isolated database"

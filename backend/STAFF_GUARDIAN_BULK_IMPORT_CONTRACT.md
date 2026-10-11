# Staff and Guardian CSV Bulk Import Contract

## Staff

- `POST /api/v1/imports/staff/csv/preview`
- `POST /api/v1/imports/staff/commit`
- Scope: `R01_ACADEMY_OWNER`.
- CSV header: `fullName,email,phone,roleCode,branchId`.
- Staff onboarding is **invitation-first**: commit creates an `INVITED` staff account, active membership, and a pending invitation hash. No password is accepted, returned, or stored in Preview/audit.
- Assignable roles and active branches are validated before commit.

## Guardians and links

- `POST /api/v1/imports/guardians/csv/preview`
- `POST /api/v1/imports/guardians/commit`
- Scope: academy owner, branch manager, or secretary; branch-scoped users can only import students in their branch.
- CSV header: `studentId,phone,displayName,relationship,email`.
- Commit creates a parent account, `R08_PARENT` membership, and `GuardianStudentLink` for each valid row.

## Shared safety contract

Both imports accept `.csv` multipart uploads up to 5 MB and 1000 rows. Each Preview stores the sanitized file name, byte size, raw-content SHA-256, upload time, and 24-hour expiry. Commit requires the same `previewId`, Preview hash, and source-file identity, rejects expired or stale previews, blocks `REVIEW` rows, is idempotent, and records an audit event. CSV data is never written during Preview.

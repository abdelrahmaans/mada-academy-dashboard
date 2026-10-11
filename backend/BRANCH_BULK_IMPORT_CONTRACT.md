# Branch Bulk Import Contract

## Endpoints

- `POST /api/v1/imports/branches/csv/preview` — `multipart/form-data`, field `file`.
- `POST /api/v1/imports/branches/commit` — JSON `{ previewId, previewHash, sourceFile }`.

Both endpoints require `R01_ACADEMY_OWNER`. CSV is limited to 5 MB and 1000 rows, with the header:

```csv
name,code
Nasr City,NASR_CITY
```

## Identity and expiry

The preview stores `sourceFile.name`, sanitized with `Path.GetFileName`, raw byte `size`, raw-content SHA-256 `hash`, `uploadedAt`, and `expiresAt` 24 hours later. Commit must send the same name, size, and hash. Expired previews return `PREVIEW_EXPIRED`; changed file identity returns `SOURCE_FILE_MISMATCH`.

## Safety rules

- Branch codes are normalized to uppercase and validated against the existing tenant and the current batch.
- Existing or duplicate codes become `REVIEW` and block commit.
- Commit rechecks codes after preview and records `BULK_IMPORT_BRANCH_COMMITTED` audit evidence.
- No branch is created until hash, source identity, expiry, review state, tenant scope, and stale-data checks pass.

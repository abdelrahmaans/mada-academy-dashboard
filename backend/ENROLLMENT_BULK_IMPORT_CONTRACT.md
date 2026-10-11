# Enrollment CSV Bulk Import Contract

## Endpoints

- `POST /api/v1/imports/enrollments/csv/preview`
- `POST /api/v1/imports/enrollments/commit`

Allowed roles are `R02_BRANCH_MANAGER` and `R05_SECRETARY`. Branch-scoped users can import only students and groups in their authenticated branch.

## CSV schema

```csv
studentId,courseOfferingId,finalPricePiastres
```

The preview validates that the student and group are active, belong to the same academy and branch, and that the price is non-negative. Existing `ACTIVE` or `WAITLISTED` registrations and duplicate rows in the same batch are marked `REVIEW`.

## Capacity behavior

Rows are evaluated in CSV order against the current active count for each group. A row is assigned `ACTIVE` while the group has a seat; after capacity is reached, subsequent valid rows are assigned `WAITLISTED`. The Preview returns the assigned status per row. Commit rechecks the same capacity sequence and rejects the entire Preview with `PREVIEW_STALE` if a student, group, duplicate registration, or capacity changed after Preview.

`WAITLISTED` rows do not create invoices. They can later be promoted through the existing enrollment activation endpoint after a seat becomes available. No invoice is created by this MVP import for either status.

## Safety contract

The import accepts CSV files up to 5 MB and 1000 rows. Preview stores the sanitized filename, raw size, SHA-256, upload time, and 24-hour expiry. Commit requires the matching `previewId`, Preview hash, and source-file identity, blocks `REVIEW` rows, rejects stale data and duplicate commits, writes enrollments atomically, and records audit evidence. Preview never writes an enrollment.

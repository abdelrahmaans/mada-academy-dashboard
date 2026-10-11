# Course Templates and Groups CSV Bulk Import Contract

## Course Templates

`POST /api/v1/imports/course-templates/csv/preview` and `POST /api/v1/imports/course-templates/commit` require academy-owner or branch-manager scheduling write access. The CSV header is:

```csv
name,track,type,ageGroup,level,totalSessions,sessionDurationHours,basePricePiastres
```

Preview validates duplicate names, numeric values, and tenant scope. Commit creates `CourseTemplate` records in `DRAFT` status only after source identity, expiry, review, and stale-name checks pass.

## Groups

`POST /api/v1/imports/groups/csv/preview` and `POST /api/v1/imports/groups/commit` use this header:

```csv
branchId,courseTemplateId,instructorId,classroomId,startDate,endDate,daysOfWeek,startTime,durationMinutes,maxStudents
```

`daysOfWeek` is a pipe-separated list using .NET day numbers (`0` Sunday through `6` Saturday). Preview validates the active branch, template, instructor membership, classroom capacity, date range, and schedule. Commit rechecks all dependencies, creates `CourseOffering`, and generates scheduled `AcademySession` rows for every selected day.

## Shared import safety

Both imports accept CSV files up to 5 MB and 1000 rows. The durable Preview stores sanitized filename, raw byte size, SHA-256, upload time, and a 24-hour expiry. Commit requires the same `previewId`, Preview hash, and source-file identity, blocks `REVIEW` rows, rejects stale dependencies and duplicate commits, and records audit evidence. No template, group, or session is written during Preview.

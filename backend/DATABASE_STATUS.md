# Mada Academy — PostgreSQL Database Status

## Current state

- PostgreSQL **16.15** is installed and running locally on port `5432`.
- Database: `mada_academy`.
- Application role: `mada_app`.
- Provider: PostgreSQL through EF Core/Npgsql.
- All three migrations are applied:
  - `InitialIdentityAndGovernance`
  - `AddOtpIdentityFields`
  - `AddSchedulingAndStudentCore`
- Demo seed is implemented in `Persistence/Seeding/DemoDataSeeder.cs` and is idempotent by tenant slug.

## Run the backend against PostgreSQL

```bash
export DATABASE_URL='Host=127.0.0.1;Port=5432;Database=mada_academy;Username=mada_app;Password=<local-password>'
export MADA_JWT_SIGNING_KEY='a-local-development-secret-with-at-least-32-characters'
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://127.0.0.1:4191

dotnet run --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj
```

Never commit a real production connection string or JWT secret. Use deployment secret storage in production.

## Apply migrations and seed

From the repository root:

```bash
export DATABASE_URL='Host=127.0.0.1;Port=5432;Database=mada_academy;Username=mada_app;Password=<local-password>'
./backend/scripts/apply-migrations.sh
./backend/scripts/seed-demo.sh
```

The application also supports opt-in startup behavior:

```bash
MADA_APPLY_MIGRATIONS=true dotnet run --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj
MADA_SEED_DEMO_DATA=true dotnet run --project backend/MadaAcademy.Api/MadaAcademy.Api.csproj
```

These flags are intentionally opt-in; migrations are not run automatically on every production startup.

## Seeded test data

| Entity | Count |
|---|---:|
| Tenant | 1 |
| Branches | 2 |
| Staff accounts | 7 |
| Memberships / roles | 7 |
| Classrooms | 2 |
| Course templates | 1 |
| Course offerings | 1 |
| Sessions | 3 |
| Kits | 1 |
| Students | 6 |
| Enrollments | 4 |
| Attendance records | 3 |

Seeded staff phones use the development OTP code `000000` when `TestOtpCode` is configured in Development:

```text
+201000000001  R00_PLATFORM_ADMIN
+201000000002  R01_ACADEMY_OWNER
+201000000003  R02_BRANCH_MANAGER
+201000000004  R03_HEAD_INSTRUCTORS
+201000000005  R05_SECRETARY
+201000000006  R06_ACCOUNTANT
+201000000007  R07_MEDIA_MANAGER
```

## Verified against the real database

The PostgreSQL-backed API was smoke-tested successfully for:

- `/api/v1/health` → `200`.
- OTP verify → JWT issuance.
- `/api/v1/me` → `200`.
- Matching tenant scope → `200`.
- Different tenant scope → `403`.
- Refresh token → `200`.
- Unauthenticated `/api/v1/me` → `401`.

The scheduling conflict request must use a manager or head-instructor account; the owner account is correctly rejected by the role policy.

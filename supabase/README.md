# Supabase Migrations

This folder contains SQL migrations for private storage/database support that is external to the ASP.NET EF Core migration set.

- Keep migrations append-only and review tenant/branch/privacy implications before adding one.
- Never commit service keys, private URLs, database dumps, or production credentials.
- Backend relational schema migrations remain under `backend/MadaAcademy.Api/Persistence/Migrations/`.

# Backend-Only Workstream — Start Here

## Current scope

This workstream is intentionally **backend-only**. Do not start frontend, mobile, branding, or UI implementation in this phase. The backend is being rebuilt and organized around .NET, PostgreSQL, explicit domain rules, and stable API contracts.

The repository already contains a working backend under `backend/MadaAcademy.Api/`. That code is the current functional baseline and must not be deleted or casually rewritten. The new `backend/rebuild-scaffold/` is the target organization for the next architecture phase.

## Canonical files

- [Backend Plan](.agent/BACKEND_PLAN.md): the ordered implementation plan and current phase.
- [Backend Agent Log](.agent/BACKEND_AGENT_LOG.md): the durable, append-only record of what any agent changed.
- [Backend Working Rules](.agent/BACKEND_WORKING_RULES.md): mandatory rules for backend changes.
- [Backend Target Structure](backend/TARGET_STRUCTURE.md): the intended .NET solution and dependency boundaries.
- [Backend Folder Map](backend/FOLDER_STRUCTURE.md): where models, relationships, operations, reusable code, and tests belong.
- [Backend README](backend/README.md): current backend runtime and contracts.

## First implementation sequence

1. Freeze and document the current API/data behavior.
2. Approve the backend domain dictionary and ownership boundaries.
3. Create the .NET projects under the target structure.
4. Move shared primitives and value objects first.
5. Implement tenancy, identity, membership, roles, permissions, and scope.
6. Implement students, guardians, courses, groups, and enrollments.
7. Implement scheduling, sessions, conflicts, rooms, and substitutions.
8. Implement attendance, evaluation lifecycle, review, and publication.
9. Implement invoices, payments, evidence, expenses, approvals, and reconciliation.
10. Implement imports, reporting queries, outbox, jobs, and operational hardening.
11. Retire or adapt the old runtime only after contract and migration evidence exists.

## What is not allowed yet

- Frontend changes as part of this workstream.
- Mobile implementation.
- UI-driven domain decisions.
- Direct migration of old handlers without rule extraction.
- New endpoints without a documented use case and permission contract.
- New entities without ownership, relations, indexes, lifecycle, audit, and migration notes.

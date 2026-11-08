# Decision Log

## ADR-000 — Temporary identity

**Status:** PROPOSED  
**Decision:** Use `Academy Ops Platform` as an internal placeholder.  
**Reason:** The final product name and logo have not been approved.  
**Impact:** All brand and namespace usage must remain replaceable.

## ADR-001 — Modular monolith first

**Status:** PROPOSED  
**Decision:** Build the .NET backend as a modular monolith with strong module boundaries.  
**Reason:** Core academy, scheduling, learning, and finance workflows require transactional consistency.  
**Revisit when:** Independent scaling or ownership boundaries become measurable.

## ADR-002 — Backend authority

**Status:** PROPOSED  
**Decision:** ASP.NET Core owns authorization, scope, business rules, state transitions, and financial invariants.  
**Reason:** Frontend checks are not security boundaries.

## ADR-003 — .NET baseline

**Status:** PROPOSED  
**Decision:** Use .NET 10 LTS and the latest supported patch.  
**Reason:** It is the active LTS baseline at the review date and supports current API/OpenAPI capabilities.

## ADR-004 — Angular baseline

**Status:** PROPOSED  
**Decision:** Use Angular 22 for the new implementation. Keep Angular 21 as a compatibility option only if required by the existing reference client.  
**Reason:** Angular 22 is active while Angular 21 is LTS at the review date.

## ADR-005 — Mobile

**Status:** PROPOSED  
**Decision:** Responsive Angular first, Capacitor packaging when native distribution is required.  
**Reason:** Share domain/API logic while allowing native capabilities behind adapters.

## ADR-006 — R03 attendance write access

**Status:** BLOCKED  
**Decision needed:** Confirm whether Head Instructors may record or correct attendance.  
**Owner:** Product Owner.  
**Required evidence:** updated role matrix, UI action state, backend allow/deny tests, audit policy.

## ADR-007 — Marketing scope

**Status:** BLOCKED  
**Decision needed:** Define whether Marketing is live in MVP or remains preview.  
**Required evidence:** lead lifecycle, consent, dedupe, ownership, campaign model, reporting, and endpoint contract.

## ADR-008 — Canonical frontend client

**Status:** BLOCKED  
**Decision needed:** Confirm Angular as the only production client and define the migration/archive plan for React and the reference Angular client.

## ADR-009 — Rubric model

**Status:** BLOCKED  
**Decision needed:** Confirm whether evaluations remain score/notes or become rubric/mastery/checkpoint based.

## ADR-010 — Recurrence and timezone

**Status:** BLOCKED  
**Decision needed:** Define timezone ownership, daylight saving behavior, holidays, exceptions, and edit scope for recurring sessions.

## ADR-011 — Financial correction

**Status:** PROPOSED  
**Decision:** Payments are append-only; corrections/refunds require explicit governed workflows.  
**Reason:** Preserve auditability and prevent balance manipulation.

## ADR-012 — Design system

**Status:** PROPOSED  
**Decision:** Use a brand-neutral token system until the final name/logo/colors are approved.  
**Reason:** Prevent temporary branding from leaking into product architecture.

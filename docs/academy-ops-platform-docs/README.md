# Academy Ops Platform — Project Documentation Pack

> **Temporary project name:** `Academy Ops Platform`
>
> This is an internal working name only. It is not the final product name, legal name, domain, logo, or brand identity. When the name is approved, update the canonical value in `00-governance/project-identity.md`, then propagate it through source namespaces, package names, API metadata, deployment names, documentation titles, and brand assets.

## Purpose

This documentation pack defines the product, business model, domain logic, engineering standards, architecture, backend, Angular frontend, mobile readiness, design system, operations, security, and delivery rules for rebuilding the academy management platform.

The product is an **academy operating system**. It must make every role faster and safer by presenting the right context, the right actions, the right data, and the right permissions at the right time.

## Non-negotiable principles

1. The backend is the final authority for identity, authorization, tenant scope, data access, and business rules.
2. The UI must expose clear actions, not force users to understand database structures.
3. Every consequential operation has an explicit lifecycle, permission check, audit record, and recovery path.
4. No role receives broad access by accident. Access is granted by role, permission, scope, relationship, and state.
5. Live data must never silently fall back to demo data after an API failure.
6. Angular is the target frontend. The codebase must be mobile-ready from day one and packageable for iOS/Android through a web-native approach.
7. The project name and logo are placeholders until formally approved.
8. A decision is not considered implemented until it has code, tests, documentation, and an acceptance record.

## Reading order

1. [Project Identity](00-governance/project-identity.md)
2. [Delivery Rules](00-governance/working-rules.md)
3. [Product Charter](01-product/product-charter.md)
4. [Roles and Action Model](01-product/roles-and-action-model.md)
5. [Business Operating Model](02-business/business-operating-model.md)
6. [Domain Model](03-domain/domain-model.md)
7. [Rules and State Transitions](03-domain/rules-and-state-transitions.md)
8. [Target Architecture](04-architecture/target-architecture.md)
9. [Technology Stack](04-architecture/technology-stack.md)
10. [Patterns and SOLID](04-architecture/patterns-and-solid.md)
11. [Backend Blueprint](05-backend/backend-blueprint.md)
12. [API and Contracts](05-backend/api-contracts.md)
13. [Angular Frontend Architecture](06-frontend-angular/frontend-architecture.md)
14. [Guards, Interceptors and Services](06-frontend-angular/guards-interceptors-services.md)
15. [Design System](07-design-system/design-system.md)
16. [Mobile Readiness](08-mobile/mobile-readiness.md)
17. [Quality and Security](09-quality-security/quality-security.md)
18. [Operations and Delivery](10-operations/operations.md)
19. [Decision Log](11-decisions/decision-log.md)
20. [System Diagrams](12-diagrams/system-context.mmd)

## Status vocabulary

- `PROPOSED`: recommended but not approved.
- `APPROVED`: binding product/architecture decision.
- `IMPLEMENTED`: present in code and covered by tests.
- `PARTIAL`: some behavior exists but the contract is incomplete.
- `PREVIEW`: useful UI/product exploration, not production behavior.
- `BLOCKED`: cannot be released until a named decision or dependency is resolved.
- `DEPRECATED`: retained only for migration or historical context.

## Change control

Any change to roles, permissions, entity relationships, state transitions, API contracts, money rules, tenant isolation, mobile behavior, or brand identity must update the relevant document and the decision log before implementation is merged.

## Current technology baseline

The current recommended baseline is .NET 10 LTS for the backend and Angular 22 for a new frontend project, with Angular 21 allowed only when compatibility with the existing reference client requires it. At the review date, .NET 10 is an active LTS release and Angular 22 is the active Angular release; exact patch versions must be pinned in the repository lockfiles and updated through the dependency policy. See [Technology Stack](04-architecture/technology-stack.md).

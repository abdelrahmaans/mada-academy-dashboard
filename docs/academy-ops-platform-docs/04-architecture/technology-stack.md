# Technology Stack

## Version policy

Pin exact versions in the repository. Update dependencies monthly for security patches and review major upgrades through a decision record.

## Backend baseline

| Area | Choice | Rule |
|---|---|---|
| Runtime | .NET 10 LTS | Use the latest supported patch; .NET 10 is active LTS with support listed through November 14, 2028 at the review date. [1] |
| Web API | ASP.NET Core 10 | Minimal APIs or endpoint groups behind application handlers; use typed results and OpenAPI metadata. |
| ORM | EF Core 10 | PostgreSQL provider; migrations reviewed and tested against PostgreSQL. |
| Database | PostgreSQL 16+ | Exact supported version pinned by deployment; use relational constraints and transaction semantics. |
| API schema | OpenAPI 3.1 | .NET 10 supports generating OpenAPI 3.1 documents. [2] |
| Validation | FluentValidation or an equivalent application validation boundary | Keep transport validation and domain invariants separate. ASP.NET Core 10 also provides source-generated validation support. [2] |
| Authentication | ASP.NET Core authentication with short-lived access tokens and persisted refresh sessions | Add MFA/passkeys later through an explicit security decision. |
| Background work | Hosted worker initially; durable queue/outbox store for production | No important event may depend on an in-memory queue. |
| Storage | S3-compatible abstraction; Supabase adapter allowed | Private buckets, server-side credentials, streaming, hash and lifecycle controls. |
| Observability | OpenTelemetry-compatible traces, metrics, logs | Correlation IDs and PII redaction are mandatory. |
| Testing | xUnit/NUnit, WebApplicationFactory, Testcontainers PostgreSQL, contract tests | In-memory database is not sufficient evidence. |
| Packaging | Docker multi-stage image | Non-root runtime, health/readiness, immutable image tags. |

## Frontend baseline

| Area | Choice | Rule |
|---|---|---|
| Framework | Angular 22 for a new implementation; Angular 21 only for reference-client compatibility | Angular 22 is the active release at the review date; Angular 21 is in LTS. [3] |
| Architecture | Standalone components and feature-based routing | Do not use a new NgModule-centered architecture. |
| State | Signals for local/derived UI state; RxJS for async streams and transport | Keep writable state private and expose read-only state. [4] |
| Rendering | OnPush-compatible components and zoneless-ready patterns | Avoid hidden side effects in template evaluation. |
| Forms | Typed reactive forms | Validate at client and server; preserve server field errors. |
| HTTP | Typed API clients generated from OpenAPI where possible | Keep interceptors cross-cutting, not feature logic. |
| UI | Internal design system with accessible headless primitives | Avoid coupling domain features to a vendor UI library. |
| Testing | Vitest or Jest for unit/component; Playwright for E2E; axe for accessibility | Every role workflow has a browser acceptance path. |
| Build | Angular CLI with locked package manager and CI cache | CI must build landing, web app, and mobile shell if shipped. |

## Mobile strategy

Use a responsive Angular web application first. Package the same frontend through Capacitor when native distribution is required. Capacitor documents Angular packaging for iOS, Android, and PWAs. [5]

Rules:

- Do not fork business logic for mobile.
- Keep domain services and API contracts shared.
- Use mobile-specific layouts only where task transformation is required.
- Introduce native plugins behind adapters.
- Test permissions, deep links, push notifications, camera/file access, and offline states as separate mobile concerns.

## Security baseline

Use OWASP ASVS 5.0 as the application security verification baseline. It provides requirements for secure development and testing of web application controls. [6]

## Accessibility baseline

Target WCAG 2.2 AA. WCAG 2.2 adds criteria relevant to focus visibility, target size, accessible authentication, dragging, redundant entry, and status messages. [7]

## Dependency rules

- No unpinned major version ranges in production-critical packages.
- No package with a known critical vulnerability.
- Dependabot/Renovate or an equivalent update process.
- Lockfile changes are reviewed.
- No direct provider SDK import from Domain/Application.
- No frontend secret may be treated as confidential.

## References

[1]: https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core ".NET Support Policy"
[2]: https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0 "What's New in ASP.NET Core 10"
[3]: https://angular.dev/reference/releases "Angular Versioning and Releases"
[4]: https://angular.dev/guide/signals "Angular Signals"
[5]: https://capacitorjs.com/solution/angular "Angular and Capacitor"
[6]: https://owasp.org/projects/asvs "OWASP Application Security Verification Standard"
[7]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines 2.2"

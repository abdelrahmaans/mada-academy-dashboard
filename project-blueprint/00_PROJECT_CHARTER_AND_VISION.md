# Project Charter & Strategic Vision
**Document ID:** `PLN-00-CHARTER`  
**Temporary Working Codename:** `Project Apex` (Placeholder: To be updated upon brand finalization)  
**Temporary Brand Asset:** `[ASSET: BRAND_LOGO_PLACEHOLDER_V1]` (SVG/Vector placeholder reserved)  
**Status:** Canonical Reference Blueprint  
**Language:** English  

---

## 1. Executive Summary & Purpose

`Project Apex` is an enterprise-grade, multi-tenant Educational Enterprise Resource Planning (ERP) platform and Academy Operating System. It is engineered from the ground up to replace fragmented administrative tools with a unified, real-time operating system governing educational institutions, training academies, and multi-branch tutoring networks.

The platform provides complete domain governance across:
* Multi-branch operations and physical facility allocation.
* Course template catalogs, flexible schedule matrixing, and offering lifecycle.
* Student acquisition CRM, pipeline conversions, and guardian-student links.
* Complex educational financial lifecycle: Master commitment invoices, installment schedules, cash-drawer shift reconciliations, and vendor expense approvals.
* Universal staff compensation and automated payroll engine (Hourly, Fixed, Revenue Percentage, Flat-Per-Course).
* Quality gates and pedagogical evaluation publishing workflows.
* Dynamic multi-level Role-Based Access Control (RBAC) with real-time tenant override capabilities.

---

## 2. Core Architectural & Usability Tenets

### Tenet 1: Role-Centered Cognitive Simplicity (Action-Oriented Cockpits)
Every operational role (R00 through R09) must experience an interface that removes unnecessary noise. Users are not confronted with complex, dense forms unless required; instead, their primary workspace surfaces:
1. **Immediate Action Items:** Urgent items requiring user input (e.g., today's attendance, pending evaluations, uncollected installments, cash handover).
2. **One-Click Primary Workflows:** Quick registration, fast attendance toggle, one-click replacement instructor proposal.
3. **Role-Tailored KPI Surface:** Focused indicators tracking personal or branch performance metrics without cognitive overload.

### Tenet 2: Absolute Administrative Sovereignty (Granular RBAC)
While individual roles enjoy an uncluttered workspace, the **Academy Owner (Admin)** possesses total governance:
* Any specific menu item, dashboard tab, or individual action button (e.g., "Apply Discount", "Record Cash", "Freeze Subscription") can be granted or revoked per role or per user on the fly.
* Changes reflect immediately across both Backend authorization middleware and Frontend dynamic navigation rendering.

### Tenet 3: Strict Audit Integrity & Zero Hard-Deletes
* In an enterprise ERP, financial transactions, session logs, and attendance states are never deleted (`Hard Delete is forbidden`).
* Every critical transition generates an immutable `AuditEvent` and `StateTransitionEvent` capturing user identity, timestamp, IP address, justification, and state payload diff.

### Tenet 4: Mobile-First & Cross-Platform Readiness
* The backend is engineered as an **API-First engine** with OpenAPI / Swagger specifications.
* The system is prepared to serve Angular Web Clients, native/cross-platform Mobile Apps (Flutter / React Native / iOS / Android), and external webhook integrations with identical security guarantees.

---

## 3. Brand & Naming Placeholders

> **Important Operational Note:**  
> The name `Project Apex` is strictly a temporary internal codename.  
> The brand assets and naming tokens are centralized in the configuration layer:
> * `APP_CONFIG.BRAND_NAME`: `"Project Apex (Temporary)"`
> * `APP_CONFIG.LOGO_URL`: `"/assets/branding/logo-placeholder.svg"`
> * `APP_CONFIG.FAVICON_URL`: `"/assets/branding/favicon-placeholder.ico"`  
> When the official commercial brand and vector logos are finalized by the stakeholders, changing these central tokens will propagate instantly across all frontend suites, mobile wrappers, and generated transaction templates (invoices, receipts, certificates).

---

## 4. Key Stakeholders & Domain Personas

1. **Platform Super-Admin (R00):** SaaS infrastructure owner overseeing tenant health, subscription plans, quotas, and tier enforcement.
2. **Academy Owner (R01):** Business owner reviewing multi-branch P&L, approving strategic budgets, and customizing academy permissions.
3. **Branch Operations Manager (R02):** Orchestrator of room scheduling, staff assignments, daily operations, and branch-level approvals.
4. **Head Instructor / Academic Supervisor (R03):** Quality gatekeeper auditing curricula, supervising instructors, and approving evaluations for publication.
5. **Instructor / Educator (R04):** Classroom leader focused exclusively on session execution, rapid attendance taking, and student assessment rubrics.
6. **Reception & Secretary (R05):** Front-desk lead engine managing trial sessions, rapid enrollments, guardian follow-ups, and daily cash-drawer shifts.
7. **Financial Accountant (R06):** Chief treasurer verifying bank transfers, managing installment aging schedules, auditing cash shifts, and running monthly payroll.
8. **Marketing & Growth Specialist (R07):** Campaign manager driving customer acquisition funnels, trial conversions, and content scheduling.
9. **Guardian / Parent (R08):** Consumer client monitoring children's educational progress, attendance records, and managing installment payments.
10. **Student (R09):** Primary learner reviewing timetable, learning materials, published evaluations, badges, and competitive achievements.


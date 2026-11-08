# Roles and Action Model

## Role workspace principle

Each role receives a workspace designed around its real operating job. The role should not have to navigate the entire database to find what it needs.

Every workspace contains:

1. Active context.
2. Priority actions.
3. Exceptions and blockers.
4. Recent work.
5. Relevant records.
6. Permission-aware actions.
7. A path to history and audit.

## Role workspaces

### R00 — Platform Administrator

**Scope:** platform-wide.  
**Primary jobs:** manage academy lifecycle, platform settings, tenant status, support-safe diagnostics, and session revocation.

**Actions:** create academy, suspend/reactivate academy, review platform activity, revoke sessions, inspect masked metadata, manage platform policies.

**Must not automatically receive:** detailed academy student data, grades, private finance evidence, or unrestricted operational access.

### R01 — Academy Owner

**Scope:** tenant and all authorized branches.  
**Primary jobs:** understand performance, manage branches, assign leaders, approve sensitive academy actions, and review finance/executive reports.

**Actions:** manage branches, classrooms, roles, memberships, executive reports, expense decisions, invoice corrections, operational policies.

### R02 — Branch Manager

**Scope:** assigned branch.  
**Primary jobs:** run the branch day to day.

**Actions:** manage students, groups, schedule, rooms, attendance exceptions, supervision assignments, branch approvals, expenses, and branch reports.

### R03 — Head Instructor

**Scope:** branch and explicitly supervised groups.  
**Primary jobs:** support instructors, review evaluations, maintain academic standards, and monitor group progress.

**Actions:** view supervised groups, review evaluations, request changes, publish evaluations, inspect assigned attendance where allowed.

**Open decision:** whether R03 may write attendance. The role must not receive this permission until the decision is approved and tested.

### R04 — Instructor

**Scope:** assigned sessions/groups.  
**Primary jobs:** deliver sessions and record learning operations.

**Actions:** view assigned sessions, record attendance, complete sessions, write/submit evaluations, request substitution, view assigned students.

### R05 — Secretary / Reception

**Scope:** branch.  
**Primary jobs:** manage front-desk flow and student administration.

**Actions:** register students, manage leads, link guardians, view/create invoices according to policy, follow up, handle freeze requests, and close operational shifts.

### R06 — Accountant

**Scope:** branch.  
**Primary jobs:** maintain financial accuracy.

**Actions:** create/record invoices and payments, attach evidence, reconcile, manage expenses, approve or reject governed items, produce financial reports.

### R07 — Marketing / Media

**Scope:** branch.  
**Primary jobs:** manage lead acquisition and campaigns.

**Status:** product scope must be decided. No surface may be labeled live until the API, lifecycle, ownership, consent, audit, and deduplication rules are complete.

### R08 — Parent / Guardian

**Scope:** linked family relationships.  
**Primary jobs:** understand child schedules, attendance, published evaluations, invoices, and approved requests.

**Must not receive:** unrelated children, private staff notes, unpublished evaluations, or cross-academy data.

### R09 — Student

**Scope:** self.  
**Primary jobs:** see personal schedule, learning progress, published outcomes, and required actions.

## Permission model

Access is evaluated as:

```text
Actor
+ AccountType
+ Membership
+ Role
+ Permission
+ TenantScope
+ BranchScope
+ ResourceRelationship
+ LifecycleState
+ PublicationState
= Effective Access
```

## Permission UX

The product must support:

- Role presets.
- Scoped overrides.
- Temporary access with start/end dates.
- Direct versus inherited access.
- Access preview.
- “Why can I do this?” explanation.
- “Why can’t I do this?” explanation.
- Approval-required actions.
- Audit history.
- Bulk selection with mixed-permission handling.

## Permission states

- `AVAILABLE`: action can be executed.
- `NOT_AUTHORIZED`: user lacks permission.
- `OUT_OF_SCOPE`: record is outside tenant/branch/assignment relationship.
- `PENDING_APPROVAL`: user may request but not commit.
- `LOCKED`: lifecycle prevents changes.
- `CONFIGURATION_REQUIRED`: organization has not configured the capability.
- `DISABLED`: product capability is intentionally unavailable.

Never collapse these states into one generic disabled button.

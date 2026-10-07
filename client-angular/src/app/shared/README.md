# Shared UI and utilities

Put only genuinely reusable, presentation-level components, pipes, directives, and small utilities here. Keep domain requests and permissions in feature/core layers. Use semantic HTML, accessible labels/focus states, logical CSS properties (`margin-inline`, `inset-inline`), responsive layouts, and Arabic-first copy. Avoid importing React components or copying legacy UI wholesale.

## Component library

All components below are standalone, strict-TypeScript, `OnPush`, and styled from React sources. Import only what a page uses from `src/app/shared/components` (or its explicit files):

| Component                       | Purpose / public inputs                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MadaSidebar`                   | Role-configurable dark sidebar: sections, academy/role identity, brand variant, help copy, utility navigation/actions, mobile `open`/`closed`. Nav contents are supplied by the feature/layout. |
| `MadaButton`                    | Native button with `primary`, `secondary`, `danger`, `ghost` variants; `default`, `compact`, `icon` sizes; `disabled`, `loading`, `type`, `ariaLabel`, and `clicked` output.                    |
| `MadaCard`                      | `panel`, `tile`, or `flat` surface; default/compact/no padding; projected content.                                                                                                              |
| `MadaBadge` / `MadaStatusBadge` | Semantic status tones; status badge translates common statuses to Arabic and accepts `labelOverride`.                                                                                           |
| `MadaPageHeader`                | Required title with optional eyebrow/description and a `[madaPageActions]` projection slot.                                                                                                     |
| `MadaFeedbackState`             | Loading/empty/error/locked/success messages; error retry is an explicit output, never an implicit request.                                                                                      |
| `MadaScopeCard`                 | Displays caller-supplied scope copy and optional preview marker; it does not discover identity, choose branches, or authorize a request.                                                        |

Example role configuration (the menu is display-only):

```ts
const sections: readonly MadaSidebarSection[] = [
  {
    label: 'القائمة الرئيسية',
    ariaLabel: 'القائمة الرئيسية',
    items: [
      { path: '/', label: 'الرئيسية', icon: 'layout-dashboard', exact: true },
      { path: '/students', label: 'الطلاب', icon: 'users' },
    ],
  },
];
```

```html
<mada-sidebar
  [sections]="sections"
  [open]="menuOpen()"
  ariaLabel="تنقل مدير الفرع"
  roleLabel="مدير الفرع"
  roleCode="R02"
  homePath="/"
  (closed)="closeMenu()"
  (itemActivated)="handleSidebarAction($event)"
/>
```

For commands such as logout, pass an `{ actionId, label, icon }` utility item and handle `(itemActivated)` in the owning authenticated layout. Do not represent actions as fake routes, and keep the real logout/API operation in the auth boundary.

## Boundaries and fidelity

The visual source of truth is `client/src/index.css`, `client/src/components/MadaTheme.css`, `client/src/components/RoleFoundation.css`, `client/src/components/BranchManagerSidebar.tsx` + its CSS, and the R01/R03 sidebar implementations. The common sidebar mirrors the R02 staff surface by default; configure `brandVariant` and `academyIcon` for role-specific marks, and send section data from a role-specific layout. Do not give the generic component ownership of auth, logout, permission decisions, tenant/branch scope, or API calls. A menu item being present/hidden never replaces backend authorization. Consumer portal sidebars have a distinct React surface and must be parity-checked before reusing this staff theme.

The larger responsive sidebar stylesheet stays beside its component but is imported once from `src/styles.scss` as global Mada UI CSS; its selectors are component-prefixed. This keeps the style out of Angular's per-component stylesheet budget without moving presentation rules into domain/layout code.

The visual smoke-test page is `/shared-components`. It is an explicitly non-LIVE, static R02 illustration; it must not be treated as an operational route. Review it at desktop, tablet, and mobile widths when changing shared styles.

Icons use the same Lucide family as React through the official standalone [`@lucide/angular` package](https://lucide.dev/guide/angular/) (ISC, pinned in `package.json`). Only app-config-registered icons are available to the dynamic sidebar; add to that registry and tests together when a new icon is introduced.

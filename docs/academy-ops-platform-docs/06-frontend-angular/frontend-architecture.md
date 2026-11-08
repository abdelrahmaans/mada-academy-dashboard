# Angular Frontend Architecture

## Application shape

Use a standalone Angular application with strict TypeScript, feature routes, route-level lazy loading, typed reactive forms, signals for local and derived state, and RxJS for asynchronous streams.

## Source layout

```text
src/app/
├── app.config.ts
├── app.routes.ts
├── core/
│   ├── auth/
│   ├── http/
│   ├── routing/
│   ├── context/
│   ├── errors/
│   ├── telemetry/
│   └── config/
├── layout/
│   ├── app-shell/
│   ├── global-header/
│   ├── sidebar/
│   ├── scope-context-bar/
│   └── mobile-navigation/
├── shared/
│   ├── ui/
│   ├── forms/
│   ├── data-display/
│   ├── feedback/
│   ├── overlay/
│   ├── formatting/
│   └── testing/
├── features/
│   ├── platform/
│   ├── academy/
│   ├── students/
│   ├── enrollment/
│   ├── scheduling/
│   ├── attendance/
│   ├── evaluations/
│   ├── finance/
│   ├── communications/
│   ├── reports/
│   ├── imports/
│   ├── family/
│   └── student/
└── brand/
    ├── brand.config.ts
    └── brand.tokens.css
```

## Feature boundary

Every feature owns:

```text
features/<feature>/
├── data-access/
│   ├── <feature>.api.ts
│   ├── <feature>.models.ts
│   └── <feature>.store.ts
├── pages/
├── components/
├── dialogs/
├── forms/
├── routes.ts
└── tests/
```

## Component responsibilities

- Page components coordinate route data and feature actions.
- Smart feature components load/store feature state.
- Presentational components receive inputs and emit outputs.
- Shared components do not import feature services.
- Forms do not decide authorization.
- Templates do not call APIs.

## State rules

Use signals for:

- Local form/view state.
- Selected context.
- Derived filtered lists.
- Loading/status flags.

Use RxJS for:

- HTTP streams.
- WebSocket/SSE streams.
- Cancellation and retry.
- Debounced search.
- Cross-feature event streams.

Expose read-only signals from stores. Keep writable signals private.

## Routing

Every operational route declares:

- Auth requirement.
- Required roles/permissions.
- Scope level.
- Feature mode.
- Required context.
- Canonical landing behavior.

Static component galleries and previews must not be reachable from operational navigation unless explicitly marked.

## Data loading

Each page models:

```text
idle → loading → loaded
             ↘ partial
             ↘ empty
             ↘ forbidden
             ↘ error → retrying
```

When optional requests fail, preserve core data and expose a warning. When a mutation fails, preserve user input and show a recoverable error.

## Mobile transformation

- Desktop table → focused list/card/detail drawer.
- Desktop calendar grid → agenda/day timeline.
- Desktop modal → full-screen mobile task.
- Dense toolbar → filter sheet.
- Multi-column action row → sticky primary action.

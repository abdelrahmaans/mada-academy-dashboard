# Design System

## Design direction

The visual system should communicate operational trust: calm surfaces, strong hierarchy, clear status, controlled density, and minimal decorative noise.

The temporary direction is neutral and brand-independent until the logo/name are approved.

## Token layers

### Primitive tokens

- Color scales.
- Spacing scale.
- Type scale.
- Radius.
- Shadow/elevation.
- Breakpoints.
- Motion.
- Z-index.

### Semantic tokens

- `surface.page`
- `surface.card`
- `surface.elevated`
- `text.primary`
- `text.secondary`
- `border.default`
- `focus.ring`
- `status.success`
- `status.warning`
- `status.danger`
- `status.info`
- `status.pending`
- `status.disabled`
- `action.primary`
- `action.secondary`
- `selection.background`

Components use semantic tokens, never raw hex values.

## Temporary palette proposal

These are design-system placeholders, not final brand colors:

```text
Ink / navigation: #102A43
Primary action:   #0F766E
Accent:           #2563EB
Canvas:           #F5F7FA
Surface:          #FFFFFF
Text:             #17202A
Muted:            #62748A
Success:          #15803D
Warning:          #B45309
Danger:           #B42318
Focus:            #7C3AED
```

The palette must be re-evaluated for contrast and logo compatibility before production.

## Typography

- Arabic-first font family must be selected and licensed.
- Minimum body text must remain readable at desktop and mobile.
- Do not use tiny text to solve density.
- Numeric values, IDs, phone numbers, emails, and codes use bidi isolation.
- Headings express task hierarchy, not decoration.

## Core components

### Shell

Global header, tenant switcher, branch/term context, sidebar, breadcrumbs, page header, command bar, mobile navigation.

### Data

Data table, responsive list, filter toolbar, filter chip, saved view, pagination, sort state, expandable row, column selector, bulk action bar.

### Forms

Text input, select, combobox, date/time input, money input, file input, reason field, stepper, review screen, unsaved-change guard.

### Workflow

Status badge, approval card, decision dialog, audit timeline, transition history, conflict panel, async job card, retry action.

### Feedback

Loading skeleton, first-use empty, genuine empty, no results, forbidden, configuration required, validation error, conflict, partial warning, success, destructive confirmation.

## Component state contract

Every interactive component should specify:

- Default.
- Hover.
- Focus.
- Active.
- Selected.
- Disabled.
- Loading.
- Error.
- Success.
- Read-only.
- Permission denied.
- Mobile transformation.

## RTL rules

- Use logical CSS properties.
- Choose one drawer side for navigation and document it.
- Use `dir="rtl"` for product content.
- Use `dir="ltr"` or `bdi` for machine values.
- Do not mirror icons whose meaning is directional unless the icon itself requires it.
- Test mixed Arabic/English data and numbers.
- Do not rely on browser auto-direction for IDs or codes.

## Accessibility target

Target WCAG 2.2 AA. Focus must not be obscured, actions must have sufficient target size, status changes must be announced, and authentication must not require inaccessible cognitive steps.

## UI acceptance

A new screen is not accepted until it has:

- Desktop layout.
- Tablet layout.
- Mobile layout.
- Loading/empty/error/forbidden states.
- Keyboard path.
- Screen-reader labels.
- Focus behavior.
- RTL and mixed-direction test.
- Permission-aware action states.
- No raw status codes shown to users.

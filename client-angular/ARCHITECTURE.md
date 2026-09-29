# Angular Shell Architecture

## Current scope

`client-angular` هو مسار Angular standalone الجديد، منفصل مؤقتًا عن `client/` React حتى نقدر نقارن الواجهتين بدون تعطيل الـprototype الحالي.

## Boundaries

- `src/app/core/role-registry.ts`: contract presentation للرولز والتنقل.
- `src/app/core/role-session.service.ts`: role preview state مؤقت.
- `src/app/layout/sidebar/`: Sidebar responsive واحد مشترك.
- `src/app/app.component.*`: App Shell والـtopbar وrouter outlet.
- `src/app/surface.component.ts`: placeholder surfaces لا تمثل persistence.

## Security rule

Angular Router وrole preview لا يمثلان authorization. عند ربط الـAPI، نضيف `HttpClient` interceptors وroute guards للـUX، بينما الحماية الملزمة تكون في ASP.NET Core Policies وTenant/Branch/Family handlers.

## Migration rule

لا ننقل كل React دفعة واحدة. ننقل vertical slice كاملًا: screen + API contract + loading/error/empty/locked states + policy tests، ثم نكرر على الدور التالي.

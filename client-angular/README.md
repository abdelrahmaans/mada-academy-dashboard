# Mada Academy Angular App

Angular standalone app داخل نفس الريبو، تمهيدًا لنقل الـFrontend من React إلى Angular.

## Current scope

- Angular 20 standalone setup.
- Typed `ROLE_DEFINITIONS` لـR00–R09 مطابق للـregistry الحالي.
- App Shell responsive.
- Sidebar desktop/mobile.
- Role Preview switcher لتبديل الـnavigation أثناء المراجعة.
- Feature surfaces كاملة لكل الـroutes الأساسية مع metrics، tables، workflows، portal views، search، وaction feedback.

> الـRole Preview metadata للعرض فقط. Authorization الحقيقي سيكون في ASP.NET Core Policies وTenant/Branch scope.

## Run

```bash
pnpm install
pnpm start
```

## Validate

```bash
pnpm check
pnpm build
```

## Migration rule

لا نضيف persistence أو auth وهمي إلى Angular قبل تثبيت أول vertical slice: `Auth → ASP.NET Core API → R00/R01 shell`. React يظل مرجعًا بصريًا مؤقتًا إلى أن تنتقل الشاشات وتنجح مقارنة الـroutes والـsidebar والـresponsive behavior.

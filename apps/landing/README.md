# Mada Academy Landing

Landing مستقلة داخل نفس الـmonorepo، وتستخدم نفس `packages/mada-tokens` وهوية الداشبورد. الإرسال لا يذهب إلى خدمة منفصلة: النماذج تستدعي `POST /api/v1/public/leads` داخل ASP.NET Backend الحالي، ثم تظهر السجلات في Marketing Desk عبر جدول `Leads`.

## التشغيل

```bash
pnpm install
MADA_PUBLIC_LEAD_TENANT_ID=<tenant-guid> \
MADA_PUBLIC_LEAD_BRANCH_ID=<branch-guid> \
MADA_CORS_ORIGINS=http://localhost:3001 \
VITE_API_URL=http://127.0.0.1:4191/api/v1 \
VITE_DASHBOARD_URL=http://localhost:4173/login \
pnpm --filter @mada/landing dev
```

المسار الافتراضي هو `http://localhost:3001`. في بيئة النشر يجب ضبط `MADA_PUBLIC_LEAD_TENANT_ID` و`MADA_PUBLIC_LEAD_BRANCH_ID` على tenant/branch المقصودين، وإضافة origin اللاندينج إلى `MADA_CORS_ORIGINS`، وضبط `VITE_DASHBOARD_URL` على شاشة دخول الداشبورد. الـBackend يطبق حدًا قدره 10 طلبات لكل IP في الدقيقة على المسار العام.

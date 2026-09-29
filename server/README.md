# Mada Academy Backend Foundation

هذا المجلد هو **Modular Monolith** داخل نفس الريبو، وليس Microservices مبكرة.

## القواعد

- كل API تحت `/api/v1`.
- كل endpoint خاص يمر عبر `requireAuth` ثم role/scope/tenant guards.
- `RoleScopeContext` في العميل للعرض فقط؛ القرار الأمني هنا في الخادم.
- `AuditService` هو boundary واحد؛ لا يكتب أي module إلى جدول audit مباشرة.
- انتقالات الحالات تمر عبر `assertTransition` ولا تُعدل status مباشرة.
- `DevAuditSink` مؤقت للاختبارات/التطوير فقط. قبل الإنتاج يُستبدل بـPostgres/Prisma adapter.

## الحدود القادمة

`auth`, `tenancy`, `users`, `scheduling`, `attendance`, `finance`, `family-access`, `leads`, `notifications`, `storage` كل منها يملك routes/services/repositories الخاصة به. لا تستورد modules بعضها بعضًا إلا عبر service contract واضح.

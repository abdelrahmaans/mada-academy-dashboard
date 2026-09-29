

## Authentication الآن

العقود الحالية هي `POST /api/v1/auth/otp/send`, `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/refresh`, و`POST /api/v1/auth/logout`. الـOTP delivery حاليًا adapter development (`development://otp`) ولا يجب اعتباره SMS production؛ قبل production يتم توصيل provider حقيقي مع rate limiting موزع.

JWT validation server-side مفعّل، ولا تعتمد الصلاحيات على إخفاء عناصر Angular أو React. الـtenant/branch claims والـscope check جزء من كل vertical slice.

## Sequence implementation order

```text
auth + tenancy
→ scheduling ConflictService + Serializable session transaction
→ attendance/evaluation/card job
→ substitutes + notifications
→ finance discounts/payroll
→ family access
→ gamification
```

الـdatabase migrations تُنشأ من `Persistence/Migrations` ولا تُطبّق تلقائيًا في startup قبل إضافة deploy migration gate.

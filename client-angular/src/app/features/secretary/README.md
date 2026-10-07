# Angular R05 — Secretary

هذه أول شريحة تشغيلية لـR05 داخل Angular، وليست استبدالًا لواجهة React المرجعية.

## النطاق الحالي

- قراءة طلاب الفرع من `GET /api/v1/students`.
- قراءة فواتير الفرع من `GET /api/v1/finance/invoices`.
- قراءة روابط الطالب من `GET /api/v1/students/{studentId}/consumer-links`.
- البحث المقنّع عن حساب parent/student موجود.
- ربط حساب موجود أو إنشاء دعوة consumer جديدة.
- الحالات الصريحة للتحميل والفشل والفراغ والنجاح.

## حدود الأمان

- لا يرسل Angular `tenantId` أو `branchId`؛ backend يستخرج scope من JWT ويعيد فرضه على كل query/mutation.
- lookup يعرض `maskedPhone` فقط.
- route محمي بـ`R05_SECRETARY` وبصلاحيات قراءة الطلاب والفواتير، لكن backend authorization هو الحد الأمني النهائي.
- لا تعرض الصفحة رمز OTP أو `debugAcceptUrl` حتى لو أعاده Development API.
- المصروفات والتقارير واعتماد التصحيحات خارج صلاحية R05 ولا توجد لها طلبات من هذه الصفحة.

## الاختبارات

`secretary-api.service.spec.ts` يثبت endpoint paths، envelope/payload، وعدم إرسال claims نطاق من العميل. يلزم backend integration وE2E لاحقًا قبل إعلان تكافؤ R05 الكامل.

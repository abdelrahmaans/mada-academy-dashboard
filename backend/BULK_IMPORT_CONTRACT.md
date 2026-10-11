# Bulk Import Contract — MVP

## الهدف

إدخال بيانات الأكاديمية الحقيقية دفعة واحدة بدل إنشاء الطلاب أو الموظفين يدويًا. الـPreview لا يكتب أي بيانات؛ هو مرحلة إلزامية قبل الـcommit.

## المرحلة المنفذة

### `POST /api/v1/imports/students/preview`

الأدوار المسموحة: `R01_ACADEMY_OWNER`، `R02_BRANCH_MANAGER`، `R05_SECRETARY`.

```json
{
  "rows": [
    {
      "fullName": "Ali Hassan",
      "dateOfBirth": "2014-05-12",
      "branchId": "guid-optional-for-branch-scoped-users"
    }
  ]
}
```

القواعد الحالية:

- الحد الأقصى للـpreview هو 1000 صف.
- الـtenant والـbranch scope يأتيان من الـclaims؛ لا يمكن لحساب فرع معاينة فرع آخر.
- `fullName` مطلوب وبحد أقصى 160 حرفًا.
- تاريخ الميلاد لا يمكن أن يكون في المستقبل.
- الطالب الموجود بالفعل بنفس الفرع + الاسم + تاريخ الميلاد يظهر `REVIEW` ولا يتم إنشاء نسخة صامتة.
- التكرار داخل نفس الملف يظهر `REVIEW`.
- الصف الصحيح يظهر `CREATE`.
- الاستجابة تحتوي على `createCount` و`reviewCount` وأخطاء كل صف.
- `mode = PREVIEW_ONLY` تعني أن العملية لم تكتب أي student أو account أو link.
- الاستجابة تحتوي على `previewId` عشوائي و`previewHash` SHA-256 للصفوف canonicalized.

### `POST /api/v1/imports/students/commit`

```json
{
  "previewId": "guid",
  "previewHash": "sha256-lowercase-hex"
}
```

الـcommit:

- يقرأ الـPreview المخزن durable داخل سجل audit خاص بالـimport؛ لا يعتمد على ذاكرة العملية.
- يرفض `PREVIEW_HASH_MISMATCH` إذا تم تغيير الـhash أو إرسال preview غير تابع لنفس الأكاديمية.
- يرفض `PREVIEW_REQUIRES_REVIEW` إذا كان أي صف في المعاينة يحتاج مراجعة.
- يعيد فحص الفروع والتكرار الحالي قبل أي كتابة، ويرفض `PREVIEW_STALE` إذا تغيرت البيانات منذ المعاينة.
- ينشئ الطلاب ثم يسجل `BULK_IMPORT_STUDENT_COMMITTED`.
- يمنع إعادة اعتماد نفس `previewId` باستخدام `PREVIEW_ALREADY_COMMITTED`.
- لا ينشئ أو يعدل guardians/staff/groups بعد؛ هذه مراحل منفصلة بنفس نمط preview ثم commit.

### `POST /api/v1/imports/students/csv/preview`

يقبل `multipart/form-data` بالحقل `file` فقط، وبحد أقصى 5 MB وامتداد `.csv`. الأعمدة المطلوبة:

```csv
fullName,dateOfBirth,branchId
Ali Hassan,2014-05-12,
```

قواعد هوية الملف:

- `sourceFile.name` هو اسم الملف بعد إزالة أي path.
- `sourceFile.size` هو الحجم بالـbytes.
- `sourceFile.hash` هو SHA-256 لمحتوى الملف الخام بصيغة lowercase hex.
- `sourceFile.uploadedAt` و`sourceFile.expiresAt` يحددان نافذة صلاحية قدرها 24 ساعة.
- الـPreview يحفظ هوية الملف داخل audit durable؛ لا تعتمد عملية commit على وجود الملف في ذاكرة التطبيق.
- عند commit لPreview مصدره CSV يجب إرسال `sourceFile` نفسه؛ تغيير الاسم أو الحجم أو الـhash يؤدي إلى `SOURCE_FILE_MISMATCH`.
- بعد `expiresAt` يرفض النظام الاعتماد بـ`PREVIEW_EXPIRED` ويجب رفع الملف من جديد.

تم تنفيذ commit الطلاب بالـ`previewId` والـ`previewHash` وCSV source identity/expiry. ستستخدم guardians/staff/branches/groups نفس العقد مع schema خاص بكل قسم.

سيكون لكل صف قرار واضح:

- `CREATE`: إنشاء السجل.
- `UPDATE`: تحديث سجل موجود بعد matching صريح.
- `SKIP`: تجاهل الصف عمدًا.
- `REVIEW`: لا يسمح بالكتابة حتى يتم حل المشكلة.

لن نستخدم الاسم وحده كمفتاح تحديث. قبل commit الطلاب/أولياء الأمور نحتاج إضافة phone/email أو external reference في عقد البيانات حتى يكون matching قابلًا للاعتماد.

## ترتيب الكيانات

1. Branches.
2. Staff/instructors and memberships.
3. Students.
4. Guardians and guardian-student links.
5. Course templates and groups.
6. Enrollments.

كل مرحلة تحفظ audit summary: عدد الصفوف، create/update/skip/review، actor، tenant، وقت التنفيذ، وملخص الأخطاء. لا يوجد auto-delete للبيانات القديمة أثناء import.

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

## قواعد الـcommit القادمة

الـcommit سيكون endpoint منفصلًا، وسيحتاج العميل إلى إرسال `previewId` أو hash للملف الناتج عن الـPreview حتى لا يتم اعتماد ملف تغير بعد مراجعته.

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

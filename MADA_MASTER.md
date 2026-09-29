
### 29 سبتمبر 2026 — Workspace Hub / Role Walkthrough Entry Point

تم إنشاء مدخل واحد للمعاينة حتى يستطيع المستخدم متابعة كل النظام من رابط واحد ثم فتح كل Role بالـURL فقط.

- أضيف route جديد: `/workspace`.
- أضيفت `client/src/pages/WorkspaceHub.tsx` كـHub مركزي يعرض شجرة `R00 → R09` في ثلاث طبقات:
  - طبقة الإدارة والمنصة: R00/R01/R02.
  - طبقة التشغيل الأكاديمي: R03/R04/R05/R06.
  - طبقة التسويق والمستهلك: R07/R08/R09.
- كل بطاقة Role تسحب label/scope/identity/navigation من `ROLE_DEFINITIONS` بدل تكرار metadata.
- كل بطاقة تحتوي زر فتح الـhome path وروابط كل navigation surfaces التابعة للدور.
- كل المسارات القديمة ظلت متاحة بدون تغيير.

#### URL الرئيسي للمتابعة

`https://4173-ijm6jc75l307tqg7lv96y-ec94301a.sg2.manus.computer/workspace`

طريقة الاستخدام: افتح `/workspace`، اختار role، ثم غيّر آخر جزء في الـURL أو استخدم روابط البطاقة. مثال: `/executive-dashboard` ثم `/academy-owner` ثم `/reports`.

#### التحقق

- `pnpm check`: نجح.
- `pnpm build`: نجح.
- `git diff --check`: نجح.
- `/workspace` و`/` وكل المسارات الرئيسية المختبرة أعادت HTTP 200 محليًا.
- تحذيرات build غير المانعة كما هي: analytics env/module وpnpm legacy configuration.


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


### 29 سبتمبر 2026 — Shared Mada Theme + Scroll System Pass

تم توحيد الطبقة البصرية لكل الـroles على مرجعية واجهة المدربين، بدون تغيير الـroutes أو الـpermissions أو الـbackend:

- إضافة `client/src/components/MadaTheme.css` كطبقة shared تُحمّل بعد `index.css`.
- اعتماد palette موحدة: `#14243a` للنص الأساسي، Teal Mada `#0d9488` للأفعال والـactive states، أسطح بيضاء، page background فاتح، borders هادئة وradius موحد.
- توحيد sidebar treatment لكل `app-shell` و`*-desk-shell` وportals على gradient الكحلي الخاص بواجهة المدربين.
- توحيد panels/cards والـinputs والـselects والـtextareas والـprimary/secondary actions والـfocus ring.
- توحيد active navigation على Teal Mada بدل اختلافات Marketing/Executive/Finance القديمة.
- إضافة scroll system عام: thin scrollbars، thumb متناسق مع الثيم، hover state، dark-sidebar scrollbar، و`scrollbar-gutter` و`overscroll-behavior` للقوائم والجداول الأفقية.
- احترام `prefers-reduced-motion` وإبقاء responsive paddings للشاشات الصغيرة.

#### التحقق

- `pnpm check`: نجح.
- `pnpm build`: نجح.
- `git diff --check`: نجح.
- Runtime smoke: `/`, `/instructor`, `/instructor-desk`, `/marketing-desk`, `/family-portal`, `/student-portal`, `/workspace` أعادت HTTP 200.
- التحذيرات الموجودة مسبقًا: analytics env variables وpnpm legacy configuration، بدون أخطاء TypeScript أو build.

#### المتبقي

- مراجعة بصرية تفاعلية على كل role في المتصفح بعد اختيار المستخدم للـscreens الأكثر أهمية.
- لا يوجد تغيير backend/API؛ هذه طبقة UI/UX فقط.

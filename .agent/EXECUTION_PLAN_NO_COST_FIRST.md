# خطة التنفيذ — No-Cost First

**التاريخ:** 11 أكتوبر 2026  
**الفرع المرجعي:** `main`  
**الهدف:** تثبيت صحة الصلاحيات والـLIVE/DEMO والتنقل والاختبارات محليًا أولًا، وتأجيل أي بند يحتاج اشتراكًا أو أسرار staging أو بنية إنتاجية مدفوعة.

## القرار التنفيذي

ننفذ الآن كل ما يمكن إنجازه داخل الكود والاختبارات والتوثيق بدون شراء خدمة أو تفعيل اشتراك. لا نعتبر أي بوابة إنتاج مغلقة اعتمادًا على اختبارات محلية فقط.

### مؤجل حاليًا بسبب التكلفة أو الحاجة لبيئة خارجية

- مزود SMS إنتاجي.
- Password recovery المعتمد على Email/SMS.
- Private Storage production secrets وauthenticated staging smoke.
- Backup/restore الحقيقي لملفات Storage objects.
- Staging acceptance على API/frontend منشورين.
- Shared/distributed rate limiter إذا احتجنا أكثر من instance.
- Consumer upload لملفات إثبات الدفع، إلى أن تُحسم بوابة التخزين الخاصة.
- النشر الخارجي على Facebook/Google Ads وأي social integrations.
- SaaS billing واشتراكات الأكاديميات.
- فرض حدود اشتراك إنتاجية على الفروع والـstaff قبل تثبيت نموذج التجربة والـmetering.

---

# المرحلة 0 — تثبيت الحقيقة والتوثيق

**المدة التقديرية:** نصف يوم إلى يوم  
**التكلفة:** صفر  
**الهدف:** منع العمل على معلومات قديمة أو ادعاءات غير دقيقة.

## المهام

1. تحديث `.agent/PROJECT_STATUS.md` و`.agent/NEXT_PHASE_PLAN.md`:
   - PR #99 و#97 و#96 مدموجة.
   - Marketing migration مدموجة في الكود.
   - private storage/staging/backup ما زالت بوابات خارجية.
   - إزالة الإشارات القديمة التي تقول إن #96 أو #99 ما زالت معلقة.
2. تحديث قائمة الـlegacy sidebar imports بعد فحص الحالة الحالية، وعدم تسجيل `R01AcademySidebar` أو `R03HeadInstructorsSidebar` كحقيقة حالية بدون import فعلي.
3. تثبيت أسماء ومسارات العملاء:
   - React: `/instructor-desk`, `/secretary-desk`, `/finance-desk`.
   - Angular parallel client: `/instructor`, `/secretary`, `/finance`.
4. اعتماد هذا المستند كخطة العمل الحالية، مع إبقاء `main` نظيفًا قبل بدء أي feature.

## معيار القبول

- لا يوجد تعارض بين `git log` وملفات `.agent/`.
- كل بند موصوف بواحد من: `LIVE`, `LOCAL`, `PREVIEW`, `DEFERRED`, `PRODUCTION GATE OPEN`.
- لا توجد قائمة legacy files قديمة غير مدعومة بفحص فعلي.

---

# المرحلة 1 — Authorization Contract بلا تكلفة

**المدة التقديرية:** 1–2 يوم  
**التكلفة:** صفر  
**الأولوية:** P0/P1

## 1.1 حسم R03 و`attendance.write`

المشكلة الحالية: Role Catalog يعلن `attendance.write` لـR03، بينما authorization mapping الفعلي يقصرها على R02 وR04.

### القرار المقترح

- R03 يراجع ويعتمد التقييمات، لكنه لا يعدل حضور الطلاب مباشرة.
- إزالة `attendance.write` من R03 في الـcatalog إذا كان هذا هو القرار المنتج.
- إضافة اختبار authorization يثبت أن:
  - R03 ينجح في evaluation review/publish.
  - R03 لا يكتب attendance.
  - R02/R04 يكتبان attendance حسب scope.

> إذا كان المنتج يريد أن يعتمد R03 الحضور، نفتح قرارًا منفصلًا قبل تعديل policy؛ لا نمنح الصلاحية لمجرد تطابق الـcatalog.

## 1.2 تثبيت R05 المالي

إضافة/تأكيد اختبارات تثبت أن R05 يستطيع فقط العمليات المعتمدة له:

- إنشاء فاتورة داخل فرعه.
- تسجيل دفعة داخل فرعه.
- لا يستطيع قراءة أو تنفيذ صلاحيات المحاسب الأوسع بدون permission.
- لا يستطيع الوصول إلى Tenant أو Branch آخر.

يجب عدم إضافة `finance.write` العام إلى R05.

## 1.3 اختبار route × role

إنشاء contract test أو جدول اختبار موحد يثبت:

- كل `homePath` يفتح صفحة صحيحة.
- كل sidebar link ظاهر مسموح للدور.
- Access Denied يعرض عودة صحيحة إلى `homePath`.
- `/finance` وlegacy routes تتحول للمسار التشغيلي الصحيح بدل إنشاء سطح جديد.
- R09 fallback يستخدم `R09_STUDENT` بشكل موحد.

## معيار القبول

- لا يوجد role يعلن permission لا يستطيع استعمالها أو permission حساسة غير مغطاة باختبار.
- لا يوجد رابط ظاهر يقود إلى Access Denied للدور الصحيح.
- نجاح `pnpm check`, `pnpm test`, `pnpm build`, و`git diff --check`.

---

# المرحلة 2 — LIVE/DEMO Truthfulness

**المدة التقديرية:** 1–2 يوم  
**التكلفة:** صفر  
**الأولوية:** P0/P1

## 2.1 R02 Branch Operations

لا نحاول تحويل كل الصفحة إلى LIVE الآن إذا كان ذلك يحتاج backend جديدًا. بدلًا من ذلك:

- إبقاء الصفحة `PREVIEW / DEMO` بشكل واضح.
- منع أي success message يوحي بأن التعديل حُفظ في الخادم.
- تعطيل أو وسم الأفعال المحلية بوضوح.
- إضافة CTA أو رسالة صريحة: `هذه الوظيفة تحتاج ربط API ولم تُفعّل بعد`.
- فصل أي panel LIVE فعلي عن panels المحلية.

## 2.2 R07 Marketing

الكود persisted محليًا، لذلك:

- إزالة أي copy يقول إن النشر الخارجي تم.
- تسمية الحالة: `Workflow tracking` وليس `Social publishing`.
- إبقاء metrics كـlead/conversion metrics داخلية.
- عدم ادعاء engagement أو ROI خارجي.
- تحديث docs باسم migration الصحيح:
  `20261010111953_AddPersistedMarketingWorkflow`.

## 2.3 R01/R03/R04/R05/R06

- التأكد من أن LIVE لا يبدأ ببيانات seeded Demo أثناء التحميل.
- إظهار `loading/error/empty` قبل عرض أرقام صفرية.
- مراجعة labels والـscope والـrole identity.
- إزالة أي toast نجاح لعملية لا تملك persistence حقيقية.
- توحيد logout الحقيقي وعدم إبقاء logout تجريبي بجانبه.

## معيار القبول

- لا توجد عملية Demo تظهر كعملية محفوظة.
- كل CTA إما ينفذ API أو يشرح بوضوح أنه Preview/غير متاح.
- كل surface LIVE يملك loading/error/empty واضحًا.

---

# المرحلة 3 — إصلاحات UI/UX منخفضة المخاطر

**المدة التقديرية:** 2–3 أيام  
**التكلفة:** صفر  
**الأولوية:** P1/P2

## التنفيذ بالترتيب

1. توحيد mobile drawer في Family/Student/R02:
   - `aria-expanded` و`aria-controls`.
   - Escape للإغلاق.
   - إعادة focus إلى زر فتح القائمة.
   - RTL logical properties.
2. توحيد dialogs الرئيسية:
   - عنوان مرتبط.
   - `role="dialog"` و`aria-modal`.
   - close label.
   - pending/disabled state.
   - منع تكرار submit.
3. إضافة dirty-form guard للفورمات التي تفقد draft عند تغيير session/student/tab.
4. تحسين empty/loading/error states في Approvals وSchedule وMarketing وR09 activity.
5. إضافة `aria-current`, `aria-selected`, `aria-pressed` حسب نوع العنصر.
6. إضافة scroll hint للجداول العريضة على الهاتف.
7. رفع النصوص التشغيلية الصغيرة جدًا من 7–10px إلى حد قابل للقراءة دون إعادة تصميم كامل.

## معيار القبول

- keyboard walkthrough للـdrawers والـdialogs الأساسية.
- لا توجد عمليات مالية أو إدارية تتكرر بالنقر السريع.
- تجربة 360px و768px في RTL بدون فقدان navigation أو تغطية المحتوى.

---

# المرحلة 4 — Technical Debt يمكن إنجازه محليًا

**المدة التقديرية:** 2–4 أيام  
**التكلفة:** صفر  
**الأولوية:** P2، بعد إغلاق المراحل السابقة

## المهام

- تقسيم `InstructorDesk` إلى data-access / orchestration / views / dialogs.
- عدم إعادة فتح page decomposition لا تقدم خفضًا واضحًا للحجم؛ نركز على boundaries عالية القيمة.
- استخراج helpers مشتركة لـloading/error/empty/status.
- تثبيت route registry كمصدر واحد للـlabels وhome/back paths.
- مراجعة `RoleScopeCard` وrole identity وbranch display.
- إضافة contract tests لحالات 401/403/503 وsession expiry.
- تحديث runbooks والـdocs بعد كل تغير مثبت فقط.

## معيار القبول

- لا تغيير في API contracts أو security boundaries.
- اختبارات قائمة ومضافة تمر.
- لا regression في React أو Angular parallel client.

---

# المرحلة 5 — مراجعة محلية نهائية قبل دفع أي تكلفة

**المدة التقديرية:** نصف يوم إلى يوم  
**التكلفة:** صفر

## الفحوصات

```bash
pnpm check
pnpm test
pnpm build
pnpm build:landing
pnpm check:landing
pnpm e2e
pnpm e2e:angular-r03
pnpm e2e:angular-r04
pnpm e2e:angular-r06
pnpm e2e:angular-r08
pnpm e2e:angular-r09
git diff --check
```

كما يجب تشغيل فحوصات backend المتاحة عندما تتوفر .NET/PostgreSQL محليًا أو في CI:

```bash
dotnet test backend/MadaAcademy.sln --configuration Release
```

## مخرج المرحلة

قرار واضح لكل بند:

- `Closed locally`.
- `Needs product decision`.
- `Deferred — paid/external environment`.
- `Not supported by current MVP`.

---

# المرحلة المؤجلة — Paid / External Gates

هذه البنود لا نبدأها الآن، ولا نعتبرها مغلقة محليًا.

## Gate A — Production Private Storage

**يحتاج:** secrets وبيئة staging، وقد يحتاج خطة تخزين مدفوعة.

- اختيار Supabase Storage أو S3-compatible provider.
- حقن server-only credentials.
- authenticated upload/download smoke.
- MIME/signature/size verification.
- tenant/branch/consumer-link authorization.
- عدم استخدام public URLs.

## Gate B — Backup/Restore

**يحتاج:** storage/backup infrastructure وربما اشتراك مدفوع.

- backup قاعدة البيانات.
- backup مستقل لملفات Storage.
- restore إلى بيئة معزولة.
- reconciliation للفواتير والمدفوعات والمرفقات.
- audit trail verification.

## Gate C — Staging Acceptance

**يحتاج:** deployment فعلي وsecrets وdatabase/storage staging.

- API/frontend deployment.
- Finance smoke.
- R08/R09 smoke.
- tenant/branch isolation.
- 401/403/session expiry.
- migration application verification.

## Gate D — Real SMS + Password Recovery

**يحتاج:** مزود SMS أو قناة recovery بديلة وتكلفة تشغيلية.

- OTP delivery.
- invitation resend/cooldown.
- forgot/reset password.
- rate limits وaudit.
- failure/retry behavior.

## Gate E — Distributed Rate Limiter

**يحتاج:** أكثر من instance أو deployment موزع.

- Redis/shared limiter أو بديل مكافئ.
- two-instance/load evidence.
- proxy/IP configuration.
- لا نفتح horizontal scaling قبل إغلاق البوابة.

## Gate F — Consumer Payment Evidence

**يحتاج:** Gate A أولًا.

- ولي الأمر يرفع evidence.
- الملف مربوط بالطفل/الفاتورة الصحيحة.
- review/accept/reject workflow.
- private download authorization.
- audit and retention policy.

## Gate G — External Marketing Integrations

**يحتاج:** product decision، API credentials، وتكلفة/اشتراكات القنوات.

- Facebook/Instagram/Google Ads integrations.
- content publishing.
- engagement ingestion.
- external attribution وROI.

---

# ترتيب الـPRs المقترح

1. **PR-A — docs truth sync + authorization decisions**
2. **PR-B — route/role contract tests + R05 finance scope tests**
3. **PR-C — R02/R07 LIVE/DEMO boundary cleanup**
4. **PR-D — drawers/dialogs/accessibility + loading states**
5. **PR-E — InstructorDesk decomposition and shared feedback primitives**
6. **PR-F — final local validation and release-readiness report**

كل PR صغير ومركز، ويجب أن يمر على `main` عبر checks قبل بدء الـPR التالي.

# تعريف الانتهاء

لا نعلن أن النظام Production-ready إلا بعد إغلاق Gates A–C على الأقل، وإثبات الـrate-limit strategy للتشغيل الفعلي. أما الـSMS/password recovery وexternal marketing فهي product/operational decisions منفصلة وليست شرطًا لإغلاق الكود المحلي الحالي.

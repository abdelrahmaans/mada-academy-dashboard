# خطة المرحلة القادمة — Mada Academy

**تاريخ اللقطة:** 7 أكتوبر 2026
**قاعدة العمل الحالية:** `main` بعد دمج PR #88؛ آخر commit موثق هو `78546db`، وفرع العمل الجديد هو `feat/angular-r06-finance-read`.
**الحالة:** P1/P2 consumer acceptance وFinance code/local acceptance وموجة التقسيم الأولى مغلقة. اختبارات frontend الحرجة، refresh-token reuse، فصل auth endpoints، وجرد R00 مع contract/tests مغلقة؛ وتظل private-storage/backup-restore/staging بوابات بيئية منفصلة.

## قرار التنفيذ الحالي

1. **تم إغلاق شريحة P2 source acceptance:** تقارير التشغيل، عزل النطاق، حماية LIVE، وحالات R08/R09 الجزئية مثبتة؛ أُغلق R08 عبر PR #88 وأصبح R09 مغلقًا ضمن خط الدمج السابق.
2. **تم دمج P1 core journey:** الـseeder repairable، وحسابات R04/R08/R09 وروابطهم واختبارات الرحلة موجودة في `main`.
3. **تم تنفيذ local browser/API E2E:** `pnpm e2e` يمر بـ **7/7** ويغطي R06/R08/R09 ودورة الفاتورة/الدفع/الإثبات.
4. **تم تجهيز بيئة النشر داخل الريبو:** Dockerfile، production env template، staging smoke script، وrunbook.
5. **المرحلة Angular التالية:** R06-A قراءة البيانات المالية فقط؛ لا تشمل mutations أو رفع الإثباتات. بوابات Finance production (secret injection، private-storage smoke، backup/restore، وstaging smoke) تبقى منفصلة ولا تعتبر مكتملة محليًا.

## نتيجة acceptance الحالية

- R01/R02: تم منع فتح مسارات demo القديمة عند وجود جلسة LIVE.
- R03/R04/R05: مسارات Head Instructors، Instructor، وSecretary تستخدم LIVE أو تُحوّل إلى الـdesk الحي عند وجود جلسة.
- R06/R08/R09: حالات `loading/error/forbidden/empty` لا تستبدل بيانات LIVE ببيانات DEMO، والبوابات تعرض نطاق الحساب/الروابط فقط.
- Approvals: تم فصل موافقات التشغيل عن ملحقات Finance؛ فشل أو منع endpoint اختياري لا يمسح موافقات الجلسات المتاحة لدور R02.
- Classes: تم فصل الكورسات والمجموعات الأساسية عن بيانات القاعات والمدربين والطلاب الاختيارية؛ فشل endpoint مساعد لا يحول شاشة التشغيل كلها إلى حالة فارغة.
- Schedule: تم فصل الجلسات الأساسية عن بيانات القاعات والمدربين الاختيارية؛ فشل endpoint مساعد لا يمسح الجدول الحي.
- AcademyClassrooms: تم فصل القاعات عن قائمة الفروع؛ كما أصبحت أخطاء موارد القاعة حالة واضحة مع إعادة محاولة بدل عرض قائمة فارغة مضللة.
- BranchOperations: تم منع redirect الخاطئ إلى HomeLive؛ المسار يعرض صفحة إدارة التشغيل نفسها، مع بقاء محتوى التشغيل الحالي محليًا/توضيحيًا إلى أن يُربط بعقد API مكتمل.
- AcademyBranches: تمت مراجعة التحميل؛ لا يوجد fallback تجريبي، وrefresh الفاشل يحافظ على آخر قائمة محملة بدل استبدالها بقائمة فارغة، لذلك لا يلزم تغيير إضافي حاليًا.
- HeadInstructors: تم فصل endpoints الأساسية للمجموعات والمدربين والجلسات عن ملخص التقييمات والتنبيهات الاختيارية؛ فشل الملحقات يعرض تحذيرًا واضحًا مع إبقاء بيانات R03 الحية الأساسية بدل إسقاط اللوحة كلها.
- **Angular R03 (فرع `feat/angular-r03-head-instructors`):** أضيفت route lazy على `/head-instructors` بواجهة signals/OnPush. طبقة `data-access` تفصل `HeadInstructorsApiService` عن orchestration `HeadInstructorsDataService`، وتطلب المجموعات/المدربين/الجلسات بالتوازي، وتفشل aggregate عند فشل core، بينما تعزل التقييمات والتنبيهات كـoptional warnings. لا يرسل العميل `branchId`؛ endpoint يقرأ branch من JWT ويعيد تطبيق scope في backend، مع اختبار صريح لذلك.
- PlatformConsoleLive: تم فصل تحميل مؤشرات المنصة وقائمة الأكاديميات وتعريفات الأدوار؛ فشل endpoint منفرد يعرض البيانات المتاحة مع تحذير، وفشل التحميل/الدعم يظهر أيضًا عبر toast، بينما نجاح التحديث يعطي toast نجاح.
- AcademyRoles: تم فصل الصلاحيات والأعضاء عن lookup الفروع؛ فشل الفروع لا يمنع إدارة الأعضاء، ويظهر كتحذير وtoast خطأ، بينما retry الناجح يعطي toast نجاح.
- AcademicProgramsLive: تم فصل مجموعات البرامج عن الجلسات؛ فشل قراءة أحدهما لا يمسح البيانات الأخرى، ويظهر warning وtoast خطأ، بينما زر التحديث الناجح يعطي toast نجاح.
- ExecutiveDashboardLive: فشل تقرير R01 أو سجل التدقيق يظهر كـtoast وخطأ داخل الصفحة، مع إعادة محاولة لسجل التدقيق، ونجاح التحديث اليدوي يعطي toast نجاح؛ لا يتم عرض بدائل تجريبية.
- API feedback interceptor: تم توحيد بث أخطاء API من `apiClient`، والجسر العام يعرض toast واحدًا لـ401، وtoast صلاحية لـ403، وtoast خطأ خادم لـ5xx؛ اختبارات interceptor الفعلية تغطي 403 و500، وأخطاء النطاق/العملية تظل محلية عندما تحتاج رسالة وسياقًا خاصًا.
- FamilyPortal: تم فصل تحميل الأطفال والجلسات عن endpoint الفواتير؛ فشل الفواتير يعرض حالة مستقلة وtoast وRetry، ويحافظ على بيانات الأطفال والجلسات، كما لا تعرض بطاقة الطفل حالة فواتير مضللة أثناء التحميل أو الفشل.
- StudentPortal: تم فصل ملف الطالب عن الجلسات باستخدام `Promise.allSettled`؛ فشل الجلسات يحافظ على ملف الطالب ويعرض warning وtoast وRetry، وفشل الملف الأساسي يعرض error وRetry، مع منع Demo fallback في LIVE.
- Consumer final acceptance: اكتملت مراجعة R08/R09 وتوثقت في `CONSUMER_FINAL_ACCEPTANCE.md`; تم التأكد من عزل Demo، حالات empty/error/loading، Toast وRetry، وفصل البيانات الأساسية عن الفواتير/الجلسات الاختيارية.
- **الفجوة التالية المثبتة:** production evidence/storage and staging acceptance؛ الـlocal API preflight والـbrowser E2E أُنجزا بالفعل.
- التحقق المحلي: Finance/Invoice correction **11/11**، InMemory backend **54/54**، browser/API E2E **7/7**، Vitest **18/18**، `pnpm check`، `pnpm build`، و`git diff --check` ناجحة.
- **Finance frontend follow-up (6 أكتوبر، فرع `fix/finance-payment-single-flight`):** Vitest **52/52** (بينها 4 اختبارات لحالات الانتظار/التعطيل)، `pnpm check`، `pnpm build`، Playwright **11/11**، و`git diff --check` ناجحة؛ لم يتغير backend.
- التحقق عبر GitHub: PR #41 وPR #42 مرّا بـ **4/4 checks ناجحة** لكل PR.

## الخطة التالية بعد إغلاق R08 وR09

### R06-A — Angular Finance read parity

- بناء feature Angular مستقلة لـFinanceDesk فوق العقود والـendpoints الحالية، دون API بديل أو تغيير backend.
- قراءة الفواتير والمدفوعات والمصروفات والتقارير المسموح بها حسب role/permission ونطاق الأكاديمية/الفرع الذي يفرضه الخادم.
- تغطية `loading/error/forbidden/empty` وpartial failure دون Demo fallback، مع الحفاظ على RTL وتصميم Mada.
- مراجعة صفحة React المرجعية، عميل API، endpoints، الكيانات، authorization matrix، واختبارات backend قبل تعديل الكود.
- إضافة unit/component tests للقراءة وحالات الفشل والنطاق؛ لا تبدأ mutations أو evidence upload قبل قبول R06-A.
- معيار القبول: `client-angular` tests/build، اختبارات API policy، E2E قراءة Finance، و`git diff --check` ناجحة.

## الأعمال المتبقية بعد R06-A

1. **اختبارات frontend لـFinance mutations — مكتملة محليًا على `fix/finance-payment-single-flight`:** تغطي دقة المبالغ/over-collection، pending وsingle-flight، disabled states للفواتير والمدفوعات والمصروفات والقرارات، رفع الإثبات، وتحرير الحالة بعد الفشل مع إبقاء المدخلات.
2. اختبارات frontend لعزل family/student scope، partial failure، وغياب Demo fallback في LIVE.
3. اختبار backend لإعادة استخدام refresh token بعد rotation، مع التحقق من reuse detection/revocation.
4. نقل endpoints الـauth من `Program.cs` إلى module مستقل دون تغيير العقود أو سياسات rate limiting.
5. جرد R00 Platform Admin وتصنيف كل action إلى `LIVE` أو `PREVIEW` أو `NOT AVAILABLE` مع authorization/audit checklist في [R00_PLATFORM_ADMIN_INVENTORY.md](R00_PLATFORM_ADMIN_INVENTORY.md) **مغلق**.
6. إغلاق R00 follow-ups: contract alignment، اختبارات bootstrap/reactivation/protected-R00/R00 assignment، response-shape privacy assertions، وإزالة `academy.archive` من advertised permissions **مغلق**.
7. Production readiness: CORS production enforcement **مطبق ومختبر داخل الكود**، وتم تنفيذ single-instance startup guard موثق في [DISTRIBUTED_RATE_LIMIT_DECISION.md](DISTRIBUTED_RATE_LIMIT_DECISION.md)؛ المتبقي shared-limiter/two-instance evidence قبل التوسع الأفقي، ثم private storage smoke، backup/restore، وstaging acceptance.

## الهدف

تحويل التحصيل المالي من واجهة demo إلى vertical slice حقيقية ومحدودة وآمنة تشمل: إنشاء فواتير داخلية للطلاب، تسجيل دفعات خارج التطبيق، رفع/عرض إثبات الدفع، وربط بيانات الأسرة والطالب بحساباتهما فقط. ويُدرس OTP مؤقت مساعد لمسار الدعوات في pilot صغير إلى أن يجهز مزود SMS.

## المتطلبات التي أوضحها المستخدم

- السكرتير أو المحاسب يجهز بيانات الفاتورة للاشتراك أو أي بند آخر.
- طرق التحصيل المرئية: كاش، Visa، InstaPay، Vodafone Cash.
- العمليات تُسجل حتى إذا لم يرفق المستند بعد؛ يجب تمييز العملية ذات المرفق من العملية التي لا تملك مرفقًا.
- بوابة الأسرة تقرأ فواتير أطفال الحساب المرتبط فقط.
- المستخدم يسمح بمسار OTP مؤقت في البداية، ثم استبداله/استكماله بمزود فعلي لاحقًا.

تفاصيل نموذج الفاتورة، endpoints، data model، الواجهات والاختبارات في [INVOICES_PAYMENTS_MVP_PLAN.md](INVOICES_PAYMENTS_MVP_PLAN.md). تفاصيل حد الأمان المؤقت في [OTP_MVP_TEMPORARY_PLAN.md](OTP_MVP_TEMPORARY_PLAN.md).

## مراحل التنفيذ

### 0. تثبيت العقود والتهيئة

- توحيد مفاتيح الصلاحيات على مستوى دقيق: مقترح `invoices.read`, `invoices.create`, `payments.create`, `payments.evidence.read/write`; لا تمنح R05 كامل `finance.write` تلقائيًا.
- اعتماد نطاق R05/R06، وسياسة قراءة R01/R02 للتقارير، وفروع المستخدم الفعلية من `/me`.
- حسم مكان تخزين خاص دائم للمرفقات بحسب استضافة الـAPI؛ الخدمة غير موجودة الآن.
- تحديد إتاحة المرفقات للعميل: المقترح أن يرى حالة الإثبات ويفتحه فقط إذا كان مرتبطًا بفاتورة طفله.

### 1. نموذج البيانات وAPI الفواتير والتحصيل

- إضافة كيانات ومهاجرة PostgreSQL للفواتير والبنود والدفعات وmetadata المرفقات.
- إنشاء رقم فاتورة فريد من الخادم؛ الربط بطالب/فرع/أكاديمية والتسجيل اختياري.
- دعم عدة دفعات للفاتورة وحساب الرصيد/الحالة من سجل الدفعات.
- جعل إضافة الدفعة atomic مع فحص الرصيد لتفادي التزامن/التجاوز؛ لا تعدّل أو تحذف حركة مالية بصمت.
- استخدام integer piastres في API/DB وعرض جنيه مصري في UI.
- قصر نقاط الكتابة على role+scope داخل API، وليس عن طريق إخفاء أزرار الواجهة فقط.

### 2. إثبات الدفع الخاص

- كتابة عقد تخزين server-side خاص ودائم، والتحقق من MIME/signature والحجم، وتوليد object key عشوائي.
- إنشاء العملية أولاً وإرفاق الإثبات في خطوة تالية؛ فشل رفع الملف لا يفقد الحركة، بل يتركها بحالة «لم يرفق بعد».
- مسارات تنزيل مصادق عليها تعيد تطبيق tenant/branch أو consumer-link checks؛ ممنوع URL عام أو path من المستخدم.
- لا تفعّل رفع إثباتات حقيقية قبل التأكد من persistence/backups على بيئة الاستضافة المقصودة.

### 3. واجهة الموظفين

- ربط FinanceDesk بـAPI وإزالة الفواتير/المجاميع التجريبية في LIVE.
- السماح لـR05 بإنشاء الفاتورة وتسجيل التحصيل ضمن فرعه حسب permissions الجديدة؛ وإبقاء تقارير المحاسب R06 بصلاحيات أوسع وفق القرار.
- نموذج الفاتورة: الطالب، وصف/بنود، مبلغ، تاريخ استحقاق، تسجيل اختياري.
- نموذج التحصيل: المبلغ، التاريخ، الطريقة الأربع، مرجع/ملاحظة، ثم رفع إثبات اختياري.
- عرض الدفعات كسجل append-only مع badge «مرفق» أو «لم يرفق بعد» وفلاتر للعمليات الناقصة.

### 4. واجهة الأسرة والطالب

- إضافة قراءة مالية LIVE من API مستقل، وإزالة رسالة «غير متاح» فقط بعد توافر endpoint.
- إرجاع بيانات الطلاب المرتبطين بالحساب فقط، مع المبلغ والإجمالي والمدفوع والمتبقي والاستحقاق وسجل الطرق/التواريخ وحالة المرفق.
- لا تعتمد على UUID من المتصفح دون إعادة التحقق من `GuardianStudentLink` أو `StudentAccountLink` في الخادم.
- إبقاء بوابة الأسرة والطالب خالية من الأرقام التجريبية عند غياب بيانات فعلية أو فشل API.

### 5. OTP المؤقت — مسار منفصل ومحدود

- النظام الحالي يولد OTP في Development فقط ويغلق الإرسال في البيئات الأخرى؛ لا تغيّر الإنتاج إلى Development.
- المقترح: وضع **staff-assisted manual delivery** خلف feature flag مغلق افتراضيًا، pilot صغير/allowlist فقط، رمز عشوائي يعرض مرة واحدة لموظف مخول عبر API staff-only، سجل تدقيق دون الرمز، اتصال/تسليم يدوي للمستخدم، مع نفس مدة الانتهاء ومحاولات التحقق والـrate limits الحالية.
- لا يوجد كود ثابت، ولا إرجاع للرمز من endpoint عام، ولا تسجيله في logs. يجب توضيح أن هذا pilot أقل ضمانًا من رسالة SMS خاصة لأن الموظف يرى الرمز.
- عند تجهيز SMS provider حقيقي: إغلاق manual mode، ربط `ISmsMessageSender`، واختباره دون تغيير عقد قبول الدعوة.
- التفاصيل التنفيذية في `OTP_MVP_TEMPORARY_PLAN.md`؛ هذا المسار أيضًا غير منفذ حاليًا.

## المشاكل والموانع المفتوحة

| المشكلة | الحالة الحالية | ما يلزم قبل الإطلاق |
|---|---|---|
| Private evidence storage | Adapter موجود، لكن الإنتاج fail-closed حتى تُحقن secrets وتنجح اختبارات staging | server-only Supabase secret + authenticated upload/download smoke |
| Backup/restore | bucket خاص موجود؛ النسخ المستقل للـobjects غير مثبت | backup schedule مستقل وrestore test موثق |
| Deployment/staging | Dockerfile وrunbook وsmoke script جاهزة؛ لا يوجد deployment مقبول بعد | نشر API/frontend وتشغيل smoke على بيئة controlled |
| Marketing R07 | ما زال Preview/local في أجزاء من الواجهة | API حقيقية أو إبقاؤه معلنًا خارج MVP |
| Identity | SMS production وpassword recovery غير منفذين | اختيار SMS provider وتنفيذ recovery لاحقًا؛ لا يوقف local MVP |
| Finance corrections/refunds | خارج Finance slice الحالية | قرار reversal/audit قبل إضافة workflow |

## الخطة الاختبارية ومعايير القبول

- اختبارات PostgreSQL 16 للمهاجرات والعلاقات وunique invoice numbers وتزامن تسجيل دفعات متنافسة.
- اختبارات InMemory + PostgreSQL لدور R05/R06 ولرفض cross-tenant/branch والتجاوز عن الرصيد.
- اختبارات R08/R09 للعزل بواسطة consumer links، بما في ذلك تنزيل المرفق من طالب غير مرتبط (403/404 دون تسريب).
- اختبارات طرق الدفع الأربع، دفعة بلا مرفق، رفع إثبات صحيح/مرفوض النوع والحجم، وفشل الرفع مع بقاء الحركة.
- React/Vitest/typecheck/build والتحقق يدويًا أن LIVE لا يعرض fixtures.
- OTP tests للـfeature flag، السماح/المنع حسب البيئة/allowlist، عدم تسريب الرمز في public response/logs، الانتهاء والـattempt limits، والتدقيق.
- مراجعة EF snapshot و`dotnet ef migrations has-pending-model-changes`، ثم CI وPR مستقل قبل الدمج.

## خارج المرحلة الأولى

- معالجة الأموال أو خصم البطاقات/المحافظ، والتحقق البنكي الآلي.
- إنشاء فواتير ضريبية رسمية أو ضريبة/دفتر أستاذ.
- المصروفات، الموافقات المالية المتقدمة، الإلغاء/الاسترداد، reconciliation وتقارير مالية موسعة.
- إطلاق SMS واسع النطاق قبل اختيار المزود وإعداد أسراره على الخادم.

## 2026-10-04 — UI / Flow / Architecture Review Pack

تمت مراجعة الأدوار R00–R09 والصفحات والـactions والـrouting والـauth والـCSS. أُغلقت في هذا الفرع حماية المسارات حسب الدور، منع DEMO من الظهور داخل LIVE shells، طبقة CSS مشتركة RTL/responsive، تصميم Academy Bootstrap، وE2E للعزل وإعادة التوجيه والخروج.

**الترتيب التالي قبل production:**

1. مراجعة/دمج PR الخاص بهذه الحزمة بعد نجاح CI وE2E.
2. تشغيل staging API/frontend ثم `scripts/staging-smoke.sh` مع server-only storage secret.
3. إغلاق الأدلة التشغيلية: private bucket upload/download، backup/restore، secrets، وstaging acceptance.
4. قرار منتج صريح بشأن R07 Marketing: API حقيقية أو إبقاؤه Preview معلنًا خارج MVP.
5. إصلاح Finance mutation pending states واسم ملف evidence قبل الإطلاق المالي النهائي.

## Angular frontend — parallel foundation (7 October 2026)

- أُنشئ `client-angular/` كتطبيق مستقل للتأسيس باستخدام Angular 21.2، standalone، strict TypeScript، SCSS، Vitest، وzoneless.
- React في `client/` يظل المرجع والمصدر التشغيلي؛ Angular يملك auth shell محدودًا (`/login` و`/workspace`) وأول شريحة LIVE parity لـR02 على `/` متصلة بـ`/dashboard/summary`، ولا يحتوي تكافؤًا تشغيليًا كاملًا، ولا يتغير النشر أو البنية الإنتاجية.
- يحدد [`ANGULAR_FRONTEND_GUIDE.md`](ANGULAR_FRONTEND_GUIDE.md) الهيكل، إشارات الحالة وOnPush، العربية/RTL، عقود auth الحالية، حدود R00–R09، استراتيجية التكافؤ والأمن.
- أول تنفيذ وظيفي لاحق يتطلب اختيار شريحة صغيرة ومصفوفة تتبع React↔Angular؛ أي تغييرات تفويض/API تتطلب اختبارات backend integration، ولا تعتبر route guards حدًا أمنيًا.

### Angular shared UI foundation — 7 October 2026 (PR #79, open)

- تمت إضافة مكتبة عرضية أولية في `client-angular/src/app/shared/components/`: sidebar يقبل تنقل الأدوار وإجراءات parent events، button، card، badge/status badge، page header، feedback states، وscope card.
- تمت مطابقة السطح الداكن الافتراضي للـsidebar مع R02 React وإبقاء إعداد brand/academy role-specific؛ معاينة `/shared-components` ثابتة وتعلن أنها غير LIVE، وتستخدم labels/counts توضيحية فقط.
- الاختبارات تشمل المكونات والـmobile close والـactive route وevents والـRTL/preview؛ لا توجد API/auth/backend/production تغييرات.
- الاستمرار على فرع Angular المستقل `feat/angular-foundation` ومراجعة [PR #79](https://github.com/abdelrahmaans/mada-academy-dashboard/pull/79). React في `client/` و`main` يظلان المصدر المرجعي. الخطوة التالية التشغيلية تُختار منفصلة وفق مصفوفة التكافؤ، ولا تستنتج صلاحيات من عناصر القائمة.

### Angular auth shell — 7 October 2026 (follow-up branch)

- أضيف `core/auth` و`core/http`: عقد typed، `HttpClient`، interceptor للتفويض، refresh single-flight، structured API errors، وguard عرضي يعيد غير المصادق إلى `/login`.
- access token يبقى في الذاكرة، وrefresh token في `sessionStorage`؛ فشل التجديد يمسح الجلسة، ولا تُعتبر route guards حدًا أمنيًا.
- `/login` يطابق copy وRTL وresponsive surface في React، و`/workspace` يعرض identity/scope من backend دون بيانات demo أو صلاحيات مستنتجة من الواجهة.
- اختبارات Angular تغطي login payload، validation، `/me`، refresh rotation/concurrency، 401 retry، وguard؛ لا توجد تغييرات backend أو عقد مشتركة.

### Angular R02 branch dashboard — follow-up on `feat/angular-auth-shell`

- أضيف `features/dashboard` بواجهة Dashboard مدير الفرع مطابقة للسطح LIVE في React: scope card، مؤشرات الطلاب/التسجيلات/الجلسات، الجلسات القادمة، وروابط التشغيل.
- مصدر البيانات الوحيد هو `GET /api/v1/dashboard/summary`; لا يرسل العميل `tenantId` أو `branchId`، ويعتمد على عزل claims الذي يفرضه backend.
- الأدوار المصادق عليها غير R02 ترى locked state ولا تطلق طلب Dashboard. حالات loading/error/retry/empty واضحة ولا يوجد fallback إلى demo data.
- اختبار data access يغطي envelope والـURL وعدم توسيع النطاق. الخطوة التالية: مصفوفة parity ثم شريحة دور مستقلة (R01 أو R03) بعقدها واختباراتها، لا توسيع هذه الصفحة عشوائيًا.

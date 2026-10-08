# تقرير تدقيق UI/UX للأدوار R00–R09

**التاريخ:** 2026-10-05  
**النطاق:** دمج نتائج الفحص المستقلة لمساحات الأدوار في Mada Academy، مع إعطاء الأولوية لمشاكل **no-page / redirect / sidebar** قبل بقية ملاحظات الواجهة.

> هذا التقرير يدمج النتائج المعطاة فقط. لا يضيف سلوكًا أو ملفات غير مذكورة في نتائج الفحص. مصطلح **LIVE** يعني السطح المتصل/المحمي بالجلسة، و**DEMO** يعني المعاينة أو البيانات المحلية حيث ورد ذلك في الفحص.

## 1. الملخص التنفيذي

المنتج يملك معظم المسارات الأساسية وصفحات فعلية، لكن التجربة غير متماسكة عند الانتقال بين الأدوار أو بين LIVE وDEMO. أخطر المشكلات ليست جمالية؛ بل تتعلق بإمكانية الوصول إلى الصفحة الصحيحة، وبأن التنقل الظاهر يقود المستخدم إلى مسار محمي بدور آخر أو إلى قشرة لا تمثل دوره.

### الخلاصة حسب الأولوية

1. **P0 — إصلاح قبل أي تحسين بصري:**
   - R01 لا يصل إلى صفحة `AcademyOwner` الفعلية: وجود الجلسة يعيد التوجيه إلى `/executive-dashboard`، كما أن مسارات العودة من الفروع/الأدوار/القاعات تعود إلى المسار نفسه وتسبب bounce.
   - R02 لا يصل إلى صفحة `BranchOperations` الفعلية: وجود الجلسة يعيدها إلى `HomeLive`.
   - R06 يرى مسارات عودة وsidebars بهوية R02؛ `/` و`/students` و`/schedule` و`/classes` وغيرها غير مسموحة له، فتؤدي إلى Access Denied.

2. **P1 — النمط المشترك الأوسع:** القشرة (sidebar/topbar/logout/scope) ليست مكوّنًا موحدًا عبر LIVE وDEMO أو بين صفحات الدور الواحد. توجد صفحات LIVE بلا sidebar/topbar، وصفحات تستخدم قشرة دور آخر، وصفحات تعرض زر logout تجريبيًا فوق زر حقيقي.

3. **P1 — عقد الصلاحيات والتنقل غير موحد:** `App.tsx` و`ROLE_DEFINITIONS` وsidebars المحلية لا تبدو كمصدر واحد. النتيجة روابط مرئية تنتهي عمدًا بمنع وصول، أو روابط معاينة تعد بـPreview لكنها تفتح مسار صلاحية حقيقي.

4. **P1 — صدق وضع البيانات:** بعض الأسطح تعرض «بيانات حية من الخادم» ثم تعرض disclaimer ثابتًا بأن البيانات توضيحية، أو تعرض seeded DEMO لحظيًا قبل اكتمال التحميل. كما أن بعض النماذج تعرض اختيارات لا تُحفظ فعليًا.

5. **P2 — قابلية القراءة والوصولية:** أحجام كثيرة بين 7–10px، جداول بعروض دنيا كبيرة على الهاتف دون إشارة تمرير كافية، dialogs دون focus trap/Escape/restore focus، وأزرار/تبويبات أيقونية أو نشطة بصريًا فقط.

**التقدير العام:** لا توجد حالة P0 عامة في R00 وR03–R05 وR07–R09 بحسب النتائج المعطاة، لكن وجود P0 في R01 وR02 وR06 يمنع اعتبار منظومة الأدوار جاهزة للتشغيل المتسق. الأولوية الصحيحة هي تثبيت عقد المسارات والصلاحيات والقشرة المشتركة، ثم تصحيح حقيقة LIVE/DEMO، ثم تحسين الوصولية والاستجابة.

## 2. المشاكل المشتركة أولًا: no-page / redirect / sidebar

### 2.1 no-page أو الصفحة الصحيحة غير قابلة للوصول

| الأولوية | الدور | المسار/الملف | المشكلة العملية | الأثر |
|---|---|---|---|---|
| **P0** | R01 مسؤول الأكاديمية | `client/src/pages/AcademyOwner.tsx` | عند وجود session يعيد المكوّن التوجيه فورًا إلى `/executive-dashboard`؛ لذلك لا تظهر صفحة R01 الفعلية للحساب المصادق. | المستخدم يرى صفحة مختلفة عن الصفحة التي فتحها، ومساحات الفروع/الأدوار/القاعات لا تملك home مستقرة. |
| **P0** | R01 مسؤول الأكاديمية | `client/src/pages/AcademyBranches.tsx`; `AcademyRoles.tsx`; `AcademyClassrooms.tsx`; `AcademyOwner.tsx` | أزرار العودة تذهب إلى `/academy-owner`، وهذا المسار يعيد R01 إلى `/executive-dashboard` بدل العودة لمساحة الإدارة. زر العودة في `AcademyOwner` يذهب إلى `/` المحمي لـR02. | bounce أو Access Denied داخل flow أساسي. |
| **P0** | R02 مدير الفرع | `client/src/pages/BranchOperations.tsx` | عند وجود session يعيد الشرط الصفحة إلى `HomeLive`، فلا تُعرض إدارة التشغيل الفعلية. | `/branch-operations` يفتح ملخص التشغيل بدل الشاشة المطلوبة؛ الصفحة العملية غير قابلة للوصول في السيناريو الواقعي. |
| **P0** | R06 الحسابات | `client/src/pages/ReportsLive.tsx` | زر «العودة إلى لوحة الدور» يستخدم `navigate("/")` لغير R01، بينما `/` مسموح لـR02 فقط. | عودة المحاسب إلى Access Denied. |
| **P0** | R06 الحسابات | `client/src/components/BranchManagerSidebar.tsx` | `ReportsLive` يعرض sidebar بهوية R02 وروابط `/`, `/students`, `/schedule`, `/classes`, `/branch-operations`. | معظم التنقل الأساسي للمحاسب ينتهي في مسار غير مسموح. |
| **P0** | R06 الحسابات | `client/src/pages/Approvals.tsx` | sidebar وbreadcrumb يوجهان «الرئيسية» إلى `/` ويعرضان مسارات R02 مثل الطلاب والجدول والفصول والفريق. | صفحة الموافقات موجودة، لكن لا يمكن إكمال التنقل منها بشكل موثوق. |

### 2.2 sidebar/topbar أو القشرة ليست قشرة الدور

| الدور/النطاق | الملفات | النمط المشترك |
|---|---|---|
| R00 | `PlatformConsole.css`; `PlatformConsoleLive.css`; `PlatformConsole.tsx`; `PlatformConsoleLive.tsx` | LIVE وDEMO بقشرتين مختلفتين؛ topbar LIVE غير sticky، وزرا معاينة R01/R02 يفتحان مسارات صلاحية حقيقية لا Preview. |
| R01 | `ExecutiveDashboardLive.tsx`; `RoleDashboardShell.tsx`; `roleNavigation.ts`; `AcademyBranches.tsx`; `AcademyRoles.tsx`; `AcademyClassrooms.tsx` | LIVE بلا sidebar/topbar فعليين، وصفحات الإدارة لا تمرر `demo={false}`، والصفحات الثلاث بلا CSS خاص يجعلها تسقط إلى default browser layout. |
| R02 | `Students.tsx`; `Classes.tsx`; `Schedule.tsx`; `BranchManagerSidebar.tsx`; `RoleDashboardShell.tsx` | بعض الصفحات تبني shell يدويًا، وبعضها يستخدم shell آخر؛ روابط `/finance` غير مسموحة، وlogout تجريبي لا ينفذ logout. |
| R03 | `HeadInstructorsLive.tsx`; `AcademicProgramsLive.tsx`; `Schedule.tsx`; `roleNavigation.ts` | LIVE بلا sidebar/topbar، و`Schedule` يعرض هوية مدير الفرع وروابط غير مسموحة لـR03؛ `AcademicPrograms` تستخدم label «مشرف البرامج» بدل «رئيس المدربين». |
| R04 | `InstructorDesk.tsx`; `InstructorDeskLive.tsx`; `RoleDashboardShell.tsx`; `roleNavigation.ts` | DEMO يرسم shell كاملًا وLIVE يرسم main فقط؛ sidebar يحتوي رابط `/head-instructors` المحمي لـR03. |
| R05 | `SecretaryDeskLive.tsx`; `SecretaryDesk.tsx`; `Students.tsx`; `Schedule.tsx` | Secretary LIVE بلا sidebar/topbar، وStudents/Schedule تعرضان shell وهوية مدير الفرع وروابط خارج R05؛ توجد حالات logout مكررة. |
| R06 | `ReportsLive.tsx`; `Approvals.tsx`; `BranchManagerSidebar.tsx` | استخدام قشرة R02 للمحاسب، وApprovals بقشرة legacy مستقلة وهوية ثابتة غير صحيحة. |
| R07 | `MarketingDesk.tsx`; `RoleDashboardShell.tsx`; `SessionLogoutButton.tsx`; `WorkspaceHub.tsx` | زر logout محلي تجريبي بجانب الزر الذي يحقنه shell، وشارة DEMO في الموضع نفسه تقريبًا؛ mobile menu مخفي بقاعدة CSS متأخرة؛ WorkspaceHub يعد بـPreview لكنه يمرر إلى routes محمية. |
| R08 | `FamilyPortal.tsx`; `index.css`; `RoleDashboardShell.tsx` | البوابة تستخدم `RoleScopeProvider` بدل shell المشترك، والsidebar/topbar غير ثابتين، وdrawer mobile يستخدم موضعًا وحركة physical left رغم RTL. |
| R09 | `StudentPortal.tsx`; `RoleDashboardShell.tsx`; `ProtectedRoute.tsx`; `roleNavigation.ts` | shell طالب مستقل رغم دعم shell الموحد لـR09، وfallback بعد Access Denied قد يعيد الطالب إلى `/workspace` بسبب الفرق بين `R09_STUDENT` و`R09`. |

## 3. جدول حالة R00–R09

| ID | الدور | الدرجة | الحالة |
|---|---|---:|---|
| R00 | منصة الإدارة | 7.4/10 | الأساس يعمل ولا P0؛ P1 في اختلاف LIVE/DEMO وروابط معاينة R01/R02 المحمية. |
| R01 | مسؤول الأكاديمية | 4/10 | **P0:** no-page/redirect في `/academy-owner`؛ LIVE يحمل DEMO وصفحات الإدارة بلا CSS خاص. غير جاهز. |
| R02 | مدير الفرع | 55/100 | **P0:** `/branch-operations` يفتح `HomeLive` بدل الصفحة؛ shell والتنقل والصلاحيات متضاربة. |
| R03 | رئيس المدربين | 64/100 | لا P0 من نوع no-page؛ P1 في غياب shell LIVE، هوية Schedule، الروابط غير المسموحة وتضارب LIVE/DEMO. |
| R04 | المدرب | 62/100 | لا P0؛ P1 في اختلاف shell ورابط `/head-instructors` غير المسموح وخلط نطاق AcademicPrograms. |
| R05 | السكرتارية | 8.8/10 | **مكتمل:** مسار Leads حي بالكامل (CRUD، تحويل لطالب، إصدار فواتير، تسجيل فوري) مع لوحة مؤشرات حية ومتابعات WhatsApp. |
| R06 | الحسابات (المحاسب) | 5.5/10 | **P0:** العودة وsidebars تقود إلى مسارات R02/مسارات مرفوضة؛ Approvals تعرض صفرًا قبل انتهاء التحميل. |
| R07 | التسويق | 6.5/10 | لا P0؛ P1 في scope الفروع، mobile drawer، النماذج غير المحفوظة، logout وPreview. |
| R08 | ولي الأمر | 8.5/10 | **مكتمل:** ربط حي بـ `/api/v1/consumer/me/*`، منع أخطاء 403، زر تبديل مباشر لحساب العرض، وعرض الفواتير والأبناء بأمان. |
| R09 | الطالب | 8.5/10 | **مكتمل:** ربط حي بالجلسات والواجبات والحضور، زر تبديل مباشر لحساب العرض الحي دون أخطاء صلاحيات للموظفين. |

## 4. Findings حسب الأولوية

### P0 — حواجز تشغيلية

#### P0.1 — R01: الصفحة الرئيسية للدور لا تُعرض

- **الملفات:** `client/src/pages/AcademyOwner.tsx`؛ `client/src/pages/ExecutiveDashboard.tsx`؛ `client/src/App.tsx`.
- **المشكلة:** وجود session في `AcademyOwner` يؤدي إلى redirect فوري إلى `/executive-dashboard` رغم أن `/academy-owner` محمي أصلًا لـR01.
- **الإصلاح المطلوب:** إزالة redirect من الصفحة، أو جعل `/academy-owner` alias صريحًا لمسار واحد، مع destination ثابت للعودة لا يعتمد على `/` المحمي لـR02.

#### P0.2 — R01: مسارات الفروع والأدوار والقاعات لا تملك back-flow مستقرًا

- **الملفات:** `client/src/pages/AcademyBranches.tsx`؛ `AcademyRoles.tsx`؛ `AcademyClassrooms.tsx`؛ `AcademyOwner.tsx`.
- **المشكلة:** العودة إلى `/academy-owner` تعيد R01 إلى `/executive-dashboard`، والعودة من AcademyOwner إلى `/` تؤدي إلى منع وصول.
- **الإصلاح المطلوب:** تعريف `homePath` واحد لـR01 واستخدامه في كل أزرار العودة والـbreadcrumbs.

#### P0.3 — R02: `BranchOperations` تعيد المستخدم إلى `HomeLive`

- **الملف:** `client/src/pages/BranchOperations.tsx`.
- **المشكلة:** عند وجود session لا تُعرض صفحة التشغيل، ومع غياب session تمنعها `ProtectedRoute`؛ لذلك لا يوجد سيناريو واقعي يرى الصفحة الفعلية.
- **الإصلاح المطلوب:** إزالة إعادة `HomeLive`، وإظهار سطح التشغيل الموثق داخل الصفحة نفسها مع loading/error واضحين وفحص الدور.

#### P0.4 — R06: عودة وsidebar خارج الصلاحية

- **الملفات:** `client/src/pages/ReportsLive.tsx`؛ `client/src/components/BranchManagerSidebar.tsx`؛ `client/src/pages/Approvals.tsx`.
- **المشكلة:** استخدام `/` وsidebars R02 في مساحات R06 يحول النقرات الطبيعية إلى Access Denied.
- **الإصلاح المطلوب:** `homePath=/finance-desk` أو lookup من role definition، sidebar R06 فعلي، و`Approvals` داخل نفس عقد التنقل.

### P1 — مشاكل تؤثر على إكمال المهمة والثقة

#### P1.1 — مصدر واحد للقشرة والتنقل

- **R00:** `PlatformConsole.css` و`PlatformConsoleLive.css` — اختلاف أبعاد/ألوان sidebar/topbar وغياب sticky في LIVE.
- **R01:** `ExecutiveDashboardLive.tsx` و`RoleDashboardShell.tsx` — LIVE بلا sidebar/topbar؛ `AcademyBranches.tsx` و`AcademyRoles.tsx` و`AcademyClassrooms.tsx` بلا selectors CSS خاصة.
- **R02:** `Students.tsx` و`Classes.tsx` و`Schedule.tsx` — shells يدوية بدل `RoleDashboardShell`، و`BranchManagerSidebar.tsx` لا يطابق `ROLE_DEFINITIONS.R02`.
- **R03:** `HeadInstructorsLive.tsx` و`AcademicProgramsLive.tsx` و`Schedule.tsx` — LIVE بلا shell، وSchedule بقشرة وهوية R02.
- **R04:** `InstructorDesk.tsx` و`InstructorDeskLive.tsx` — تبدل جذري بين shell DEMO وLIVE، مع logout مكرر في DEMO.
- **R05:** `SecretaryDeskLive.tsx` و`Students.tsx` و`Schedule.tsx` — LIVE منفرد وlegacy shell بهوية مدير الفرع.
- **R06:** `ReportsLive.tsx` و`Approvals.tsx` و`BranchManagerSidebar.tsx` — قشرة R02 وlegacy shell بدل R06.
- **R08/R09:** `FamilyPortal.tsx` و`StudentPortal.tsx` — استثناءات shell لا توفر نفس metadata/logout/contract الموحد.
- **التوصية المشتركة:** بناء `AppShell/RoleDashboardShell` فعلي يضم sidebar وtopbar وscope وlogout وmode indicator، مع variant للدور، وتغذية عناصر التنقل من registry واحد.

#### P1.2 — روابط ظاهرة تنتهي بصلاحية مرفوضة

- **الملفات:** `PlatformConsole.tsx`؛ `Students.tsx`؛ `Classes.tsx`؛ `Schedule.tsx`؛ `Home.tsx`؛ `Schedule.tsx` في R03؛ `InstructorDesk.tsx`؛ `SecretaryDesk.tsx`؛ `WorkspaceHub.tsx`؛ `ReportsLive.tsx`؛ `Approvals.tsx`.
- **الأنماط:** `/finance` ظاهر لـR02، `/head-instructors` ظاهر لـR04، روابط R02 ظاهرة لـR03/R05/R06، وروابط الأدوار الأخرى ظاهرة في WorkspaceHub وPlatformConsole.
- **التوصية:** عدم عرض CTA لا يمر بحارس الدور؛ استخدام `roleNavigation` مشتق من `App.tsx`/role registry، أو تسمية واضحة إذا كان المقصود فتح مسار يتطلب صلاحية وليس Preview.

#### P1.3 — خلط LIVE وDEMO والبيانات المحلية

- **R01:** `ExecutiveDashboardLive.tsx` و`AcademyBranches.tsx` و`AcademyRoles.tsx` و`AcademyClassrooms.tsx` و`RoleDashboardShell.tsx` — surfaces متصلة بالbackend تعرض `data-demo=true` لأن `demo` الافتراضي true.
- **R03/R05:** `Schedule.tsx` و`ScheduleViews.tsx` — عنوان LIVE يقابله disclaimer ثابت بأن البيانات توضيحية؛ R05 يبدأ بـ`seededSessions` قبل تحميل LIVE.
- **R07:** `MarketingDeskViews.tsx` و`MarketingDesk.tsx` — حقول الهدف/النوع/المنصة يختارها المستخدم ولا تدخل في الحفظ، ثم يظهر toast نجاح.
- **التوصية:** جعل `liveMode` و`demo` مصدرًا واحدًا للحالة والنصوص، ومنع seeded data من الظهور أثناء تحميل LIVE، وإما حفظ كل اختيار عبر API أو إزالة الحقول غير المدعومة.

#### P1.4 — scope/هوية الدور غير صحيحة

- **R06:** `ReportsLive.tsx` و`BranchManagerSidebar.tsx` — المحاسب يظهر كـ«مدير الفرع · R02».
- **R03:** `AcademicPrograms.tsx` — «مشرف البرامج» بدل «رئيس المدربين».
- **R05:** `Students.tsx` و`Schedule.tsx` — profile ثابت «مدير الفرع» رغم السماح بـR05.
- **R07:** `MarketingDesk.tsx` — يبدأ branch selector بـ«كل الفروع» رغم أن R07 branch-scoped.
- **R09:** `ProtectedRoute.tsx` و`roleNavigation.ts` و`App.tsx` — `R09_STUDENT` لا يطابق مفتاح `R09` في fallback.
- **التوصية:** تطبيع role code وscope من AuthMe/API، وعدم استخدام labels أو فروع ثابتة خارج تعريف الدور.

#### P1.5 — تدفقات البيانات/الحالة التي قد توحي بنتيجة خاطئة

- **R06:** `Approvals.tsx` — لا loading state؛ requests/notifications تُفرغ قبل `Promise.allSettled` ويظهر «لا توجد طلبات» وإحصاءات صفرية.
- **R08:** `FamilyPortal.tsx` — attendance يحسب من كل الجلسات بينما label يقول آخر 8؛ و`supportRequested` boolean واحد يؤثر على كل الأطفال.
- **R01:** `AcademyRoles.tsx` — password غير داخل شرط التحقق رغم أن التدفق يعد بتسجيل دخول.
- **R05:** `Schedule.tsx` — لا loading/empty state مستقل للـsessions.
- **التوصية:** حالات تحميل/فراغ/خطأ صريحة، وبيانات محسوبة من نفس المجموعة المعروضة، وحالات keyed بالطفل/الفاتورة عند الحاجة.

### P2 — قابلية الاستخدام والوصولية والقراءة

#### P2.1 — Typography والقراءة العربية

- **الملفات المتكررة:** `client/src/index.css`؛ `PlatformConsole.css`؛ `ExecutiveDashboardLive.css`؛ `HeadInstructorsLive.css`؛ `AcademicProgramsLive.css`؛ `InstructorDeskLive.css`؛ `ReportsLive.css`؛ `RoleFoundation.css`؛ `role-surfaces.css`.
- **النمط:** نصوص تشغيلية وlabels وmetadata بين 7–10px، وحقول نموذج/نصوص جداول صغيرة على الهاتف.
- **التوصية:** body/controls غالبًا 12–14px، inputs 14–16px، وترك 8–10px للـmetadata غير الحرج فقط؛ اختبار zoom 200% وشاشات 320–390px.

#### P2.2 — الجداول والـmobile overflow

- **الملفات:** `PlatformConsoleLive.css`؛ `HeadInstructorsLive.css`؛ `AcademicProgramsLive.css`؛ `InstructorDeskLive.css`؛ `ReportsLive.css`؛ `index.css` لجدول Schedule وMarketing.
- **النمط:** min-width بين نحو 560 و856px مع overflow أفقي؛ أحيانًا بلا swipe hint أو scroll-shadow أو بديل cards.
- **التوصية:** cards/stacking حيث يمكن، تثبيت عمود الاسم عند الحاجة، وإضافة hint/scroll shadow واضح مع اختبار RTL على 360 و390px.

#### P2.3 — Dialog وkeyboard management

- **الملفات:** `AcademyBranches.tsx`؛ `AcademyRoles.tsx`؛ `AcademyClassrooms.tsx`؛ `BranchOperations.tsx`؛ `Classes.tsx`؛ `ScheduleViews.tsx`؛ `HeadInstructors.tsx`؛ `InstructorDesk.tsx`؛ `Students.tsx`؛ `FinanceDeskDialogs.tsx`.
- **النمط:** بعض dialogs تملك semantics أساسية لكن دون focus trap أو Escape أو restore focus أو منع scroll الخلفية؛ أزرار X بلا label في مواضع متعددة. في R04 لا توجد loading/disabled state لطلب المدرب البديل.
- **التوصية:** Dialog primitive موحد: initial focus، trap، Escape، restore focus، `aria-describedby`، منع الخلفية، وحالة submitting/فشل داخل الحوار.

#### P2.4 — ARIA وحالة التنقل

- **الملفات:** `PlatformConsoleLive.tsx`؛ `AcademicPrograms.tsx`؛ `HeadInstructors.tsx`؛ `InstructorDeskLive.tsx`؛ `MarketingDesk.tsx`؛ `FamilyPortal.tsx`؛ `StudentPortal.tsx`؛ `ChildrenSwitcher.tsx`.
- **النمط:** tabs/nav تعتمد على class active فقط، icon-only buttons بلا `aria-label`، ولا `aria-current`/`aria-selected`/`aria-pressed` للحالة النشطة أو الطفل المحدد.
- **التوصية:** اعتماد patterns صحيحة للتبويبات أو `aria-current` للتنقل، وتسمية كل icon button والبحث والـdrawer، وإعلان تغيّر القسم/الحالة عبر `aria-live` عند ملاءمة ذلك.

#### P2.5 — Empty/loading/error feedback

- **الملفات:** `PlatformConsoleLive.tsx`؛ `PlatformConsole.tsx`؛ `MarketingDeskViews.tsx`؛ `SecretaryPreviewViews.tsx`؛ `StudentPortal.tsx`؛ `ProtectedRoute.tsx`.
- **النمط:** قوائم تستخدم `map` فقط فتظهر مساحة بيضاء عند الفراغ/عدم تطابق البحث؛ activity في R00 يعتمد على toast عند الفشل؛ بطاقة نشاط R09 فارغة بلا تفسير؛ loading مرئي بلا `role=status`/`aria-live`.
- **التوصية:** حالات inline موحدة للتحميل والخطأ والفراغ/no-results مع زر retry أو clear filter، وإضافة semantics للإعلان.

#### P2.6 — mobile drawer وlogout الثابت

- **الملفات:** `BranchManagerSidebar.tsx`؛ `MarketingDesk.tsx`؛ `FamilyPortal.tsx`؛ `RoleFoundation.css`؛ `RoleDashboardShell.css`.
- **النمط:** drawers دون Escape/focus management، mobile menu في Marketing مخفي بقاعدة CSS متأخرة، RTL FamilyPortal يستخدم جهة left، وشارة DEMO قد تتداخل مع logout.
- **التوصية:** drawer موحد بـ`aria-expanded/controls` وEscape وrestore focus، logical properties لـRTL، ومناطق ثابتة غير متداخلة للـmode badge/logout.

## 5. Quick wins قابلة للتنفيذ

1. **تثبيت homePath والصلاحيات:** عرّف helper واحدًا من `ROLE_DEFINITIONS` واستخدمه في كل back/breadcrumb/Access Denied؛ ابدأ بـR01 وR06.
2. **إزالة redirectات الصفحات الرئيسية:** احذف redirect الجلسة من `AcademyOwner` و`BranchOperations`، ولا تجعل صفحة محمية تعيد إلى صفحة دور آخر.
3. **تصفية الروابط حسب الدور:** أخفِ `/finance` و`/head-instructors` وروابط R02/R01 غير المسموحة، وامنع sidebars المحلية من إعادة تعريف قائمة مستقلة.
4. **إنشاء shell واحد فعلي:** ضمّن sidebar/topbar وscope وlogout وmode marker في variant لكل دور؛ طبّقه أولًا على R01/R02/R03/R04/R05/R06 حيث الفروقات أشد.
5. **إصلاح LIVE/DEMO indicator:** مرّر `demo={false}` لكل surface backend، واجعل النصوص والـdisclaimers مشروطة بـ`liveMode`.
6. **توحيد logout:** إزالة toast logout التجريبي في `Classes.tsx` و`Schedule.tsx` و`MarketingDesk.tsx` وSecretary preview، والإبقاء على handler حقيقي واحد يعيد إلى `/login`.
7. **إضافة loading/empty states السريعة:** `Approvals` قبل empty state، `Schedule` قبل seeded data، activity في R00، قوائم Marketing/Secretary، وبطاقة نشاط R09.
8. **إصلاح validation المباشر:** إضافة `password.trim()` في `AcademyRoles`، validation inline للـreason في R00، وتعطيل submit أثناء الحفظ.
9. **تحسين ARIA قليل المخاطر:** `aria-label` للأزرار الأيقونية، `aria-current` للتنقل، `aria-selected` للتبويبات، و`aria-pressed` لاختيار الطفل.
10. **إصلاح mobile الواضح:** إظهار Marketing menu داخل breakpoint، تصحيح RTL drawer في FamilyPortal، وإضافة swipe hint للجداول.
11. **رفع الحد الأدنى للنصوص:** استبدال الأحجام التشغيلية 7–10px تدريجيًا بـ11–12px على الأقل ثم اختبار zoom 200%.
12. **إضافة اختبارات route smoke:** لكل دور: فتح home، فتح كل navigation item، back، Access Denied recovery، logout، وفتح/إغلاق drawer/dialog.

## 6. Gaps تحتاج Backend / Product

هذه النقاط لا يكفي حلها بتعديل CSS أو route فقط، وتحتاج قرارًا أو عقدًا من المنتج/الخلفية:

| المجال | الفجوة | القرار/الدعم المطلوب |
|---|---|---|
| **Role & scope contract** | اختلاف `R09_STUDENT` مقابل `R09`، وظهور R06 كـR02، وR07 «كل الفروع» رغم branch scope. | عقد موحد لـ`roleCode`, `roleLabel`, `scope`, `homePath` من AuthMe/API، مع mapping رسمي إن لزم. |
| **Navigation authorization** | وجود مسارات في `App.tsx` و`ROLE_DEFINITIONS` وsidebars لا تتطابق. | تحديد مصدر الحقيقة: route registry يعرّف path والroles وlabel وhomePath، وتُبنى منه القوائم والحماية. |
| **LIVE vs DEMO** | بعض الأسطح تعرض بيانات محلية أو disclaimer توضيحيًا داخل LIVE. | تعريف contract يحدد مصدر البيانات، وحالة loading، وما الذي يُسمح بتنفيذه في preview؛ منع mutation الحقيقية من surfaces تحمل `data-demo=true`. |
| **R01 management APIs** | صفحات الفروع/الأدوار/القاعات تعرض mutations بينما mode/identity غير واضحان. | تأكيد endpoints والنطاقات والصلاحيات، ثم ربط UI بحالة نجاح/فشل حقيقية لا toast فقط. |
| **R06 approvals** | لا يمكن التمييز من الواجهة بين صفر حقيقي، loading، وفشل endpoint. | API responses منفصلة أو status موحد يوضح loading/error/empty، مع تحديد ما إذا كانت الملحقات فشلًا جزئيًا. |
| **R07 campaign/content forms** | الهدف والنوع والمنصة لا تُحفظ فعليًا رغم ظهورها كنماذج. | إما دعم الحقول في API/model، أو حذفها/تعطيلها حتى لا توحي بنجاح غير حقيقي. |
| **R08 invoice support** | زر المراجعة في DEMO يحاكي الطلب، وstate واحد يؤثر على عدة أطفال. | تصميم تدفق invoice/child keyed، endpoint وحالات submitting/success/error، وتحديد ما إذا كان DEMO يسمح بمحاكاة صريحة فقط. |
| **R08 attendance** | تعريف «آخر 8 جلسات» غير مضمون من API أو ترتيب الجلسات. | API/selector يعيد أحدث 8 بترتيب صريح، ويُستخدم في المؤشر والقائمة والlabel نفسه. |
| **R09 help** | «محتاج مساعدة» يعرض toast بلا قناة أو وجهة فعلية. | قرار منتج حول ticket/contact route أو تغيير copy إلى رسالة معلوماتية فقط. |
| **Support / escalation** | روابط «تصعيد» في R05/R00 وبعض المعاينات تذهب إلى أدوار أخرى أو Access Denied. | تحديد destination حقيقي للتذكرة/المساندة أو اعتماد `/workspace` كمعاينة منفصلة عن route صلاحية. |
| **Performance/loading contract** | R05 قد يعرض seeded sessions قبل API، وR06 يعرض أرقامًا صفرية قبل التحميل. | حالات API واضحة (`idle/loading/success/empty/error`) وبدء الحالة الحية فارغة أو skeleton لا ببيانات DEMO. |

## 7. ترتيب الإصلاح المقترح

### المرحلة 0 — عقد المسارات والصلاحيات (P0، قبل UI)

1. إصلاح `AcademyOwner` و`BranchOperations` بحيث تعرضان صفحتهما الفعلية.
2. تعريف homePath رسمي لكل دور، وإصلاح العودة في R01 وR06.
3. بناء مصفوفة route × role من `App.tsx` و`roleNavigation.ts` وإزالة كل رابط مرئي لا يمر بها.
4. إضافة اختبار smoke آلي أو يدوي موثق لكل home/back/sidebar/Access Denied.

### المرحلة 1 — shell والتنقل المشترك (P1)

1. تنفيذ shell موحد يدعم sidebar/topbar/scope/logout/mode marker.
2. تطبيقه على R01 ثم R02 ثم R03–R06؛ هذه الأدوار لديها أكبر فجوة بين LIVE وDEMO أو قشرة الدور.
3. جعل sidebars مشتقة من registry واحد، وإزالة shells اليدوية أو توثيق استثناء رسمي.
4. توحيد labels: «أدمن منصة مدى · R00»، «رئيس المدربين · R03»، «مدير الفرع · R02»، «المحاسب · R06» وغيرها من تعريف الدور الفعلي.

### المرحلة 2 — صدق البيانات والتدفقات (P1)

1. تصحيح `demo={false}` في كل surface backend وربط disclaimers بـ`liveMode`.
2. إضافة loading/error/empty قبل عرض أي أرقام أو قوائم.
3. إصلاح validation والحفظ الفعلي في R01/R07، وحالات keyed للفواتير في R08.
4. تطبيع role/scope من AuthMe وحسم ما إذا كانت preview routes sandbox أم routes محمية فعلية.

### المرحلة 3 — mobile والـresponsive (P2)

1. إصلاح Marketing menu وFamily RTL drawer وdrawers R02.
2. إضافة scroll hints أو cards للجداول ذات min-width الكبيرة.
3. اختبار 320 و360 و375 و390 و768px في RTL مع عدم تغطية logout أو المحتوى.

### المرحلة 4 — الوصولية والقراءة (P2)

1. Dialog primitive موحد مع focus trap/Escape/restore focus.
2. ARIA للتبويبات والتنقل والأزرار الأيقونية واختيار الطفل.
3. رفع typography والتباين، ثم اختبار keyboard وscreen reader وzoom 200%.

### المرحلة 5 — التحقق النهائي

- إعادة فحص TypeScript/build.
- اختبار كل route بدور صحيح ودور غير صحيح.
- اختبار LIVE وDEMO منفصلين للتأكد من عدم اختلاط البيانات أو الشارات.
- مراجعة بصريّة موحدة للـshell، ثم إغلاق P1 قبل قبول P2.

## 8. معيار القبول المقترح

يُعتبر الدور جاهزًا عندما:

- يفتح `homePath` الخاص به صفحة فعلية دون redirect مفاجئ أو bounce.
- كل عنصر ظاهر في sidebar يفتح مسارًا مسموحًا لذلك الدور، أو يحمل وصفًا صريحًا بأنه Preview منفصل.
- LIVE لا يحمل `data-demo=true` ولا يعرض seeded data أو disclaimer متناقضًا.
- shell وlogout وscope وrole label متسقة داخل الدور وبين صفحاته.
- كل loading/empty/error حالة مفهومة داخل الصفحة وليست toast فقط.
- dialogs قابلة للاستخدام بلوحة المفاتيح، والتبويبات والأزرار الأيقونية معلنة لقارئات الشاشة.
- لا يقل النص التشغيلي الأساسي عن الحد القابل للقراءة على الهاتف، والجداول لا تبدو كمحتوى مقطوع دون إشارة تمرير.


## 9. حالة التنفيذ بعد آخر تحديث

**آخر commit مرفوع:** `7c351ec style: compact role scope context`  
**حالة الريبو:** `main` مطابق لـ`origin/main` والـworking tree نظيف.

### تم إغلاقه منذ إصدار التقرير الأول

- **R01:** إزالة redirect من `AcademyOwner` وإصلاح العودة إلى لوحة الإدارة التنفيذية.
- **R02:** إزالة إعادة التوجيه من `BranchOperations` إلى `HomeLive` حتى يصبح مسار إدارة التشغيل قابلًا للوصول.
- **R06:** إضافة تنقل role-aware في `BranchManagerSidebar`، وإصلاح عودة التقارير إلى `/finance-desk`، وإخفاء روابط R02 من شاشة الموافقات للمحاسب.
- **R09:** تطبيع role fallback داخل `ProtectedRoute` حتى تعود حالة الرفض إلى `/student-portal`.
- **كل الأدوار:** ربط `PageHeader` بالـshared header layout وتحسين بطاقة الهيدر.
- **كل الأدوار:** تصغير `RoleScopeCard` وتحويله إلى شريط context مختصر لا ينافس عنوان الصفحة.

### خطة المرور التنفيذية على كل رول

سيتم تنفيذ المراجعة على شكل موجات، وكل رول لا يُعتبر مكتملًا إلا بعد اجتياز نفس العقد:

1. **R00 — أدمن المنصة:** توحيد LIVE/DEMO header وsidebar، مراجعة preview links، حالات loading/empty، وصحة إجراءات tenant/support.
2. **R01 — مسؤول الأكاديمية:** تطبيق shell موحد، إضافة CSS للـbranches/roles/classrooms، تصحيح `demo` وdialogs وvalidation.
3. **R02 — مدير الفرع:** توحيد shell في Home/Students/Classes/Schedule/BranchOperations، إزالة الروابط غير المسموحة، وتحويل logout إلى سلوك حقيقي.
4. **R03 — رئيس المدربين:** shell وrole label صحيحان، تنظيف Schedule من هوية R02، وفصل LIVE عن DEMO.
5. **R04 — المدرب:** توحيد LIVE/DEMO، إزالة رابط R03 غير المسموح، وتحسين substitution dialog والتبويبات.
6. **R05 — السكرتارية:** shell موحد، هوية R05 صحيحة في Students/Schedule، وحالات loading/empty للجدول والمتابعات.
7. **R06 — الحسابات:** تثبيت shell المالي في Finance/Reports/Approvals، مراجعة loading والـapproval flow والجداول mobile.
8. **R07 — التسويق:** إصلاح mobile drawer، scope الفروع، وضوح PREVIEW، وربط أو إزالة الحقول التي لا تُحفظ.
9. **R08 — ولي الأمر:** تثبيت consumer shell وRTL drawer، توحيد آخر 8 جلسات، وتحسين invoice review state.
10. **R09 — الطالب:** توحيد shell أو توثيق ConsumerShell، إصلاح tabs/ARIA وempty state وmobile readability.

### معيار قبول موحّد لكل رول

- `homePath` يفتح الصفحة الصحيحة دون bounce أو Access Denied غير متوقع.
- كل رابط ظاهر في الـsidebar مسموح للدور أو موسوم بوضوح كـPreview منفصل.
- shell/header/sidebar/topbar/scope/logout موحد داخل صفحات الدور.
- LIVE لا يعرض seeded DEMO أو disclaimer متناقضًا.
- loading/error/empty states واضحة داخل الصفحة.
- الأزرار والـdialogs والتبويبات قابلة للاستخدام بالكيبورد ومعلنة لـARIA.
- العرض يعمل على 320–390px وdesktop بدون قص أو overflow مضلل.
- `pnpm check` و`pnpm test` و`pnpm build` و`git diff --check` ناجحة قبل كل موجة دمج.

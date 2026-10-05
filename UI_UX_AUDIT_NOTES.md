# تقرير مراجعة UI/UX — Mada Academy

**تاريخ التقرير:** 2026-10-05  
**نطاق المراجعة:** shell العام، التنقل والصلاحيات، تدفقات الدخول والدعوات، الأدوار R00–R09، النوافذ والنماذج والإشعارات، responsive وaccessibility، والفرق بين Preview/DEMO وLIVE.  
**مصدر النتائج:** نتائج مراجعات مصدرية متعددة للملفات المذكورة في كل مجموعة.  
**حالة التنفيذ:** تم تنفيذ حزمة quick wins منخفضة المخاطر بعد المراجعة، مع إبقاء الفجوات التي تحتاج قرارًا منتجيًا/Backend موثقة كعناصر متابعة. تم التحقق عبر TypeScript، والاختبارات، وproduction build.

### Quick wins المنفذة في هذه الجولة

- إصلاح mobile drawer في FamilyPortal وStudentPortal بإضافة حالة `sidebar-open` المتسقة، مع `aria-expanded` و`aria-controls`.
- إضافة شاشة `auth-locked-page` مصممة مع زر رجوع وخيار Workspace بدل dead end بصري.
- إضافة foundation CSS موحد لـ`DecisionDialog` والحوارات المشتركة: overlay/card/close/focus/spacing/responsive.
- إضافة semantics واضحة لنافذة القرار والحوارات المالية: `role=dialog`، `aria-modal`، labels/descriptions، required validation، وتعطيل الإجراء عند عدم وجود بيانات.
- إضافة field label وrequired state لسبب رفض المصروف، وخيار «لا يوجد طلاب متاحون» عند غياب قائمة الطلاب.

### التحقق بعد التنفيذ

- `pnpm run check` ناجح.
- `pnpm run test` ناجح: **7 test files / 24 tests**.
- `pnpm run build` ناجح، وحزمة CSS الرئيسية **527.32KB**.

---

## 1. الملخص التنفيذي

المشروع يملك أساسًا جيدًا نسبيًا: اتجاه RTL واضح، هوية teal/navy متكررة، حراسة مسارات موجودة، حالات loading/error/forbidden في أجزاء من التطبيق، ووجود مكونات مشتركة مثل `RoleDashboardShell` و`RoleScopeCard` و`FeedbackStates`. لكن هذه المكونات لا تعمل بعد كمصدر حقيقة واحد فعليًا. فالـshell العام يوفر سياقًا وزر خروج أكثر مما يوفر تخطيطًا موحدًا، و`roleNavigation` موصوف صراحة بأنه registry للعرض فقط، بينما السايدبار والتخطيط والـlogout والحالات موزعة يدويًا بين الصفحات.

أعلى خطر تجربة مستخدم هو **الانفصال بين ما يظهر للمستخدم وما يستطيع فعله فعليًا**:

1. **خلل P0 في mobile FamilyPortal وStudentPortal:** React يضيف `open` إلى `aside`، بينما CSS ينتظر `sidebar-open` على parent؛ لذلك لا تفتح القائمة ولا يظهر scrim على الشاشات الصغيرة.
2. **روابط غير مسموحة تظهر للمستخدم:** Home وبعض الشاشات تعرض روابط R00/R01/Finance لمستخدمين لا تسمح لهم route guards بالوصول، فينتهي النقر إلى شاشة رفض أو dead end.
3. **التجربة LIVE لا تطابق Preview في عدة أدوار:** R02 لا يصل إلى العمليات الحية، R03/R04/R05 يفقدون التنقل أو الوظائف الأساسية بعد تسجيل الدخول، وR01 لديه redirect loop محتمل وواجهات إدارة بلا CSS خاص.
4. **أفعال حساسة تبدو مكتملة لكنها محلية أو toast-only:** logout تجريبي بجوار logout حقيقي، handoff والتسجيلات والتسليم المالي والتسويق والتشغيل، والتصدير/الإعدادات في عدة صفحات.
5. **نوافذ وحوارات غير موحدة أو غير قابلة للوصول:** `DecisionDialog` يفتقد CSS مباشرًا للأصناف الأساسية، وحوارات مالية وإدارية كثيرة بلا `role=dialog`، أو focus trap، أو Escape، أو focus return، أو scroll lock.
6. **الصلاحيات والـscope لا ينعكسان دائمًا على UI:** `financeAccess` يعتمد على role string أكثر من permissions، بعض الشاشات تستخدم أول فرع تلقائيًا، وR07 يسمح باختيار فروع خارج النطاق المعلن.
7. **لغة بصرية متشعبة:** `index.css` و`MadaTheme.css` و`role-surfaces.css` تتداخل، مع selectors واسعة وhex literals كثيرة، وأحجام نص تصل إلى 7–10px في أسطح تشغيلية ومالية.

النتيجة العامة: **الأساس الأمني للخادم موجود، لكن عقد تجربة الاستخدام بين المسار والصلاحية والحالة والبيانات غير مستقر**. الأولوية ليست إعادة تصميم شاملة؛ الأولوية هي تثبيت navigation/identity/scope، إصلاح mobile drawer، منع dead ends، ثم توحيد feedback/dialogs والتعامل مع live mutations قبل تحسينات بصرية ثانوية.

---

## 2. ما تم إصلاحه فورًا مقابل ما يحتاج قرارًا

### 2.1 ما يمكن إصلاحه فورًا — quick wins واضحة وقليلة المخاطر

لم تُنفّذ هذه البنود في الكود ضمن هذه المراجعة، لكنها محددة ولا تحتاج قرارًا منتجيًا كبيرًا:

- توحيد class عقدة mobile drawer: إما إضافة `sidebar-open` إلى parent أو جعل CSS يتعامل مع `aside.open`، مع اختبار Family/Student.
- إزالة أزرار logout التجريبية من الصفحات التي يحقن فيها `SessionLogoutButton`، أو ربطها بنفس `AuthContext.logout` وredirect إلى `/login`.
- إضافة CSS فعلي لـ`auth-locked-page` مع أزرار «رجوع»، «الصفحة الرئيسية المسموحة»، و«العودة إلى Workspace».
- إخفاء روابط R00/R01/Finance غير المسموحة من Home وR02، وإبقاء `ProtectedRoute` كدفاع ثانٍ لا كوسيلة اكتشاف للخطأ.
- تمرير `demo={false}` إلى صفحات R01/R02/R03/R05/R06 الحية، وعدم إظهار DEMO على عمليات API.
- عدم تحويل المستخدم غير المصرح به في FinanceDesk إلى R06 شكليًا؛ عرض دوره الحقيقي أو شاشة رفض محايدة.
- ترجمة enums الظاهرة (`PRESENT`, `LATE`, `ABSENT`, `EXCUSED`, `ACTIVE`, `COMPLETED`...) إلى labels عربية من helper مشترك.
- إضافة `aria-label` للأزرار الأيقونية، و`aria-expanded`/`aria-controls` لأزرار drawers، و`aria-selected`/`aria-controls` للتبويبات.
- تعطيل أزرار mutations أثناء الطلب وإضافة state محلي `saving/submitting` لمنع double-submit.
- إصلاح عدادات وتقارير ثابتة أو تسميتها صراحة Demo، بما في ذلك عداد التنبيهات في ExecutiveDashboard وتصدير approval.
- إضافة حالة `غير متاح` بدل عرض `0` عندما يفشل endpoint اختياري في PlatformConsoleLive.
- إضافة تأكيد موحد قبل الإيقاف والحذف، حتى قبل اكتمال Dialog primitive النهائي.

### 2.2 ما يحتاج قرارًا منتجيًا/هندسيًا قبل التنفيذ

- **نموذج التنقل:** هل يكون shell واحدًا عالميًا لكل الأدوار مع عناصر role/permission-aware، أم shells محددة لكل role لكنها تستخدم primitive ومصدر بيانات مشترك؟ التوصية: primitive واحد + shells role-specific خفيفة، لا نسخ sidebar يدوي.
- **حدود Preview مقابل LIVE:** هل Preview مساحة مستقلة للتوضيح، أم يمكنه محاكاة نفس المسارات؟ يجب اختيار سياسة واحدة، مع label واضح وعدم مزج روابط live محمية داخل Demo.
- **سياسة scope متعدد الفروع:** هل المستخدم يرى roll-up لكل الفروع المصرح بها أم فرعًا واحدًا قابلًا للاختيار؟ يجب أن يحدد ذلك backend وUI، لا أن يختار الواجهة `branches[0]` بصمت.
- **تعريف capabilities:** هل permissions الواردة من `AuthMe` تتغلب على defaults الدور دائمًا، أم تستخدم defaults كfallback؟ يجب اعتماد contract موحد قبل ربط كل CTA به.
- **مصير الوظائف غير الموصولة:** lead handoff، curriculum، operations، invoice correction، evidence upload، achievements، support/notifications. إما تنفيذها end-to-end، أو عرضها disabled مع سبب وخطوة تالية.
- **مسار R01:** إزالة redirect AcademyOwner أو تحويله إلى وجهة حية حقيقية، وتحديد هل AcademyBootstrap wizard فعلي متعدد الخطوات أم نموذج صفحة واحدة.
- **المحتوى المالي والتخزين:** لا ينبغي تسمية رفع الإثبات live قبل اجتياز بوابة التخزين وstaging وPostgreSQL وbackup/restore المذكورة في `FINANCE_RELEASE_GATE.md`.
- **معايير typography:** اعتماد حد أدنى للنصوص التشغيلية العربية، وخطة تحميل Cairo/Inter أو fallback رسمي، قبل إعادة ضبط كل CSS.

---

## 3. المصفوفة الموحدة للأدوار والصفحات

> **التصنيف:** P0 = كسر أساسي/دخول أو إجراء لا يمكن استخدامه، P1 = عائق شديد أو تناقض مؤثر، P2 = مشكلة متوسطة أو اكتمال/تحسين مهم.

| الدور/السطح | الصفحات/المسارات | الحالة الحالية | أعلى المشاكل | الأولوية والقرار |
|---|---|---|---|---|
| **Global shell** | `App.tsx`, `RoleDashboardShell`, `roleNavigation`, `routeAccess`, `RoleScopeCard` | حراسة مسارات موجودة، لكن التنقل والـshell مكرران | لا sidebar مشترك فعلي؛ role registry لا يربط route/permission؛ logout مكرر؛ permissions لا تنعكس دائمًا على العرض | **P0/P1**: اعتماد navigation contract وshell مشترك |
| **Entry/Auth** | Login، ConsumerInvitationAccept، WorkspaceHub، ProtectedRoute | حراسة الدور موجودة، لكن recovery ورفض الصلاحية ناقصان | auth-locked بلا CSS؛ Workspace يعرض كل الأدوار؛ token الدعوة يحذف من hash؛ loading/retry/expiry غير مكتملة | **P1**: توحيد حالات auth ورفض الوصول |
| **R00 platform admin** | PlatformConsole، PlatformConsoleLive، AcademyBootstrap | مساران متوازيان DEMO/LIVE وهوية بصرية مختلفة | Dialog إنشاء غير قابل للفتح؛ صفحات Academy* بلا CSS؛ audit platform-wide مفقود؛ live/preview navigation مختلف | **P1/High**: توحيد R00 قبل التوسع |
| **R01 academy owner** | AcademyOwner، ExecutiveDashboard، ExecutiveDashboardLive، AcademyRoles/Branches/Classrooms، Students/Team | مسارات منفصلة وscope غير ثابت | حلقة AcademyOwner ↔ ExecutiveDashboard؛ LIVE يظهر DEMO؛ إدارة R01 بلا CSS؛ Students/Team يعرضان branch manager ثابتًا؛ live mutations كأنها Demo | **Critical**: إصلاح routing/scope/shell أولًا |
| **R02 branch manager** | Home/HomeLive، BranchOperations، Approvals، Reports/ReportsLive | Preview غني، LIVE ناقص | لا sidebar في HomeLive/ReportsLive؛ `/branch-operations` يعيد HomeLive للمستخدم المصادق؛ operations محلية؛ approvals export وتصريحات غير متسقة | **Critical**: جعل المسار الحي قابلًا للوصول وصادقًا |
| **R03 head instructors/programs** | HeadInstructors، HeadInstructorsLive، AcademicPrograms، AcademicProgramsLive | App guard صحيح، LIVE بلا تنقل وبوظائف أقل | لا sidebar؛ لا parity للفريق/الجلسات/الحضور/curriculum/progress؛ roleLabel وscope مختلفان؛ status خام | **P1/High**: R03 shell ومسار fallback واضح |
| **R04 instructor** | InstructorDesk، InstructorDeskLive | التحقق من session/branch جيد نسبيًا | Preview وLIVE shell مختلفان؛ R04 link إلى R03 ممنوع؛ فقدان draft عند تغيير session/student/tab؛ lateMinutes ناقص في Preview | **P1**: dirty guard وshell parity |
| **R05 secretary** | SecretaryDesk، SecretaryDeskLive، EnrollmentHandoff | LIVE يتجنب بيانات وهمية لكنه يخفي المكتب الأساسي | inbox/leads/followups غير متاحة؛ fallback إلى أول branch؛ تصعيد إلى R01 ممنوع؛ handoff toast-only ولا يعتمد على نجاح التسجيل | **P1/High**: flow registration stateful أو إعلان عدم التوفر |
| **R06 finance** | FinanceDesk، FinanceDeskViews/Dialogs، InvoiceCorrectionDialog، BillingSummary/PaymentStatus | أساس مالي واضح، لكن mutations وscope غير مكتملين | double-submit؛ identity R06 مزيفة عند forbidden؛ correction dead end؛ evidence 503 مفاجئ؛ فرع واحد مع عنوان يوحي بكل الفروع | **P0/P1**: منع التكرار وتعريف scope والجاهزية |
| **R07 marketing** | MarketingDesk، MarketingDeskViews، CampaignWorkflow، MarketingLeadHandoff | Preview محلي وموسوم جزئيًا | يسمح بكل الفروع رغم branch scope؛ KPI ثابت؛ handoff بلا lead id؛ campaign workflow بصري فقط؛ actions محلية | **Critical**: scope وtruthfulness قبل تجميل الواجهة |
| **R08 family** | FamilyPortal، invoices، attendance، ChildrenSwitcher | لا ثغرة صلاحيات مثبتة؛ LIVE محدود | drawer class mismatch؛ support/notifications placeholders؛ supportRequested عام لكل الأطفال؛ حالات attendance غير متسقة؛ review invoice ليس API-backed | **P0 للـdrawer، P1 للـsupport/data semantics** |
| **R09 student** | StudentPortal، progress/attendance | الحراسة مناسبة، LIVE يعرض الجلسات | drawer class mismatch؛ raw statuses؛ CANCELLED تُعامل كقادمة؛ achievements Demo فقط؛ tabs/child state لا تحفظ في URL | **P0/P1**: drawer/status semantics |
| **Shared popups/forms** | DecisionDialog، Classes*Dialogs، FinanceDeskDialogs، notification/audit/workflow | مكونات موجودة لكن contract غير موحد | DecisionDialog classes بلا CSS؛ no focus/Escape/scroll lock؛ reject expense flow معطل قبل فتحه؛ placeholders في audit؛ retry يعيد تحميل الصفحة | **P0/P1**: Dialog/feedback primitive |

### ملاحظات cross-role على المصفوفة

- `RoleDashboardShell` لا يعني حاليًا وجود navigation؛ هو أقرب إلى provider/metadata wrapper مع logout. يجب عدم افتراض أن استخدامه يحقق shell كاملًا.
- تكرار `/finance` و`/finance-desk`، وروابط `/team` التي لا تعني دائمًا «لوحة مدير الفرع»، مثالان على حاجة route registry واحد بمسميات ووصف وجهة واضح.
- كل مسار LIVE يجب أن يحدد صراحة: `loading`, `empty`, `error`, `stale`, `forbidden`, `success`, و`demo/live`. وجود toast فقط لا يحقق هذا العقد.

---

## 4. المشاكل المشتركة مرتبة حسب الأولوية

### P0 — إصلاح قبل أي إطلاق أو اختبار قبول نهائي

1. **Mobile drawer في FamilyPortal وStudentPortal لا يفتح:** عدم تطابق `open`/`sidebar-open` يترك المستخدم عالقًا خارج التنقل.
2. **R02 operations غير قابلة للوصول في session:** `BranchOperations` يعيد `HomeLive` للمستخدم المصادق، مع عدم وجود بديل صريح.
3. **DecisionDialog بلا CSS أساسي:** لا يوجد ضمان overlay/card/close styling فعلي.
4. **مسار AcademyOwner/ExecutiveDashboard معرض لحلقة redirect:** رابط تشغيل الأكاديمية لا يصل إلى سطح واضح.
5. **منع double-submit في المالية:** payment/invoice/expense/approval/evidence buttons تبدأ async requests بلا submitting state.

### P1 — إصلاح قبل pilot أو قبل توسيع الأدوار

1. **Navigation لا يشتق من role + permissions:** روابط محمية تظهر ثم تفشل؛ هذا يشمل Home وWorkspace وR02 وApprovals وFinance.
2. **logout حقيقي وتجريبي في الشاشة نفسها:** affordance متناقض وثقة منخفضة.
3. **R01/R02/R03/R04/R05 LIVE يفقدون shell أو الوظائف الأساسية:** لا parity ولا fallback صريح.
4. **صلاحيات الواجهة لا تقرأ permissions بشكل كافٍ:** `financeAccess` وrouteAccess قد يسمحان بظهور actions قبل رفض API.
5. **scope branch غير موثوق:** fallback إلى أول فرع، اختيار كل الفروع، أو عرض scope عام دون اسم الفرع.
6. **forms/dialogs بدون semantics وإدارة focus:** finance/admin/approval/evaluation dialogs، وإغلاق قد يفقد إدخالًا غير محفوظ.
7. **Live operations وhandoffs محلية أو toast-only:** لا رقم عملية، لا حفظ، لا retry، ولا حالة success قابلة للتحقق.
8. **صفحات AcademyRoles/Branches/Classrooms بلا CSS خاص:** layout وresponsive وmodal تعتمد browser defaults.
9. **Preview وLIVE يخلطان بيانات ووعودًا مختلفة:** badge DEMO لا يكفي عندما تكون أزرار الإنتاج أو روابط محمية ظاهرة.
10. **حالات أوصاف متناقضة:** Approvals تقول إن المصروفات غير مدعومة بينما تعرضها وتسمح بقراراتها؛ Finance evidence لا تميز CASH؛ reports/export labels غير صحيحة.

### P2 — بعد تثبيت الوظائف الأساسية

1. توحيد tokens وتقليل selectors العامة مثل `[class*="-card"]` و`[class*="-panel"]`.
2. رفع أحجام النصوص الصغيرة، خصوصًا 7–10px في الجداول وmetadata والتنقل.
3. توحيد status map والألوان والأيقونات والـlocale للأرقام والتواريخ.
4. إضافة horizontal-scroll hints أو mobile cards للجداول العريضة.
5. حفظ tab/child/filters في URL عند الحاجة إلى deep link.
6. إضافة last-updated وstale indicators للتقارير والبيانات الحية.
7. استبدال `window.confirm` و`window.prompt` بمكونات موحدة.
8. إزالة الأزرار التي تعرض toast «قيد التجهيز» أو تحويلها إلى disabled مع سبب وخطوة تالية.

---

## 5. قائمة popups/forms ومراجعة الحالة

| المكوّن/النموذج | المشكلة | المطلوب |
|---|---|---|
| `DecisionDialog` | الأصناف الأساسية بلا CSS؛ رفض expense لا يفتح مسار السبب بوضوح؛ لا focus/Escape | استخدام Dialog primitive؛ فتح rejection mode أولًا؛ validation وpending/error |
| `FinanceDeskDialogs` | لا `role=dialog`/`aria-modal`/labelledby؛ لا Escape أو focus trap؛ scroll lock غير واضح | primitive موحد، labels مرتبطة، focus return، منع الإغلاق غير المقصود |
| `InvoiceCorrectionDialog` | موجود بلا trigger فعلي؛ يعد بمسار تصحيح لكنه غير محفوظ/مرتبط بـApprovals | ربطه من invoice row أو حذف الوعد؛ API-backed ticket/id وحالة متابعة |
| Academy Roles modal | password ليست required في المعنى البرمجي؛ validation عام؛ overlay بلا semantics/CSS خاص | `required`, `minLength`, inline errors، busy state، Dialog accessible |
| Academy Branches/Classrooms overlays | إيقاف/حذف بلا تأكيد؛ notes/status state غير مستخدم؛ CSS مفقود | confirmation يصف الأثر، fields كاملة، saving/error/empty states |
| `AcademyBootstrap` | Flow من أربع خطوات بينما form 1/1؛ CTA النجاح يعيد Workspace بدل login المسؤول | قرار wizard حقيقي أو إزالة stepper؛ success CTA واضح |
| Consumer invitation | preview loading غير ظاهر؛ expiration ثابت؛ resend بلا cooldown؛ token يختفي من hash | loading/error/retry، countdown من API، cooldown، recovery/طلب دعوة جديدة |
| Home student/session dialog | validation غير مرتبطة بالحقول؛ focus management ناقص | inline validation، `aria-invalid`, `aria-describedby`, Escape/focus return |
| R02 Session/Decision dialogs | لا dirty guard كامل؛ success transient؛ scroll/focus contract ناقص | تحذير حفظ، pending state، result summary، Dialog primitive |
| R03 evaluation modal/queue | Escape/focus trap ناقص؛ `window.confirm` للنشر؛ textarea label غير مرتبط | confirmation موحد، keyboard behavior، label/error semantics |
| R04 attendance/evaluation | تغيير session/student/tab يمسح draft دون تحذير | dirty guards للحضور والتقييم، حفظ/متابعة/إلغاء |
| R06 expense prompt | `window.prompt` غير منسجم ولا يعرض context أو validation | سبب رفض داخل Dialog، required، loading/error |
| NotificationCenter | لا close-on-Escape/outside، mark-one-read غير واضح، unread count لا يعلن على الزر | popover/dialog semantics، count في label الزر، actions واضحة |
| Classes create/edit | required markers بلا constraints؛ أيام المجموعة بلا minimum؛ close يمسح البيانات | field errors، اختيار يوم واحد على الأقل، confirm dirty close، disabled أثناء save |
| Shared ErrorState | retry الافتراضي reload للصفحة ويفقد السياق | retry callback endpoint-specific مع بقاء filters/input |

**قاعدة عامة للنوافذ:** كل popup يجب أن يملك عنوانًا مرتبطًا، وصفًا عند الحاجة، `role=dialog`, `aria-modal=true`, focus trap/return، Escape policy، scroll lock، زر close مع `aria-label`، backdrop policy معلنة، وحالة busy تمنع الإغلاق أو التكرار عند الحفظ.

---

## 6. gaps وظيفية يجب ألا تغطيها الواجهة برسالة نجاح محلية

### التشغيل والتنقل

- لا يوجد مصدر واحد يطابق كل sidebar link مع `APP_ROUTES` وrole/permission.
- R02 operations live غير موجودة في flow المصادق؛ R03 live يفتقد team/session/attendance؛ R05 live يفتقد leads/followups/registration.
- R04 لا يملك وصولًا صحيحًا إلى «رئيس المدربين»؛ R05 يصعّد إلى R01 غير المسموح؛ بعض CTAs تذهب إلى `/team` مع label مختلف.
- Workspace Hub يعرض أدوارًا كثيرة للمستخدم المصادق دون توضيح هل هي preview غير تفاعلية أم مساحات فعلية.

### البيانات والنطاق

- `financeAccess` لا يدمج `AuthMe.permissions` بشكل كافٍ مع role defaults.
- R07 يعرض/يتيح فروعًا خارج scope، وR06 يعرض أول فرع مع عنوان يوحي بكل الفروع، وR01/R02 يخلطان tenant/branch chrome.
- التقارير والفلاتر في Reports وMarketing لا تغير المصدر الفعلي؛ بعض KPI والصفوف ثابتة أو محسوبة من بيانات غير مفلترة.
- حالات `CANCELLED`, `EXCUSED`, `UNMARKED` وقواعد الحضور ليست موحدة بين family/student.
- `BillingSummary` و`PaymentStatus` موجودان لكن غير مدمجين في المسار المالي المرئي.

### mutations وhandoffs

- التسجيل، lead handoff، campaign/content lifecycle، branch operations، Team actions، invoice correction، payment evidence، وبعض export actions لا تملك حفظًا خادميًا أو نتيجة تتبع.
- لا توجد حماية موحدة من التكرار، ولا reconciliation/refetch بعد mutation، ولا رقم طلب/تذكرة عند النجاح.
- رفع evidence قد يفشل بـ503 وفق بوابة الإصدار، لكن الواجهة لا تعرض readiness أو next step قبل العملية.
- academy classroom resources لا تسمح بتحرير notes/status رغم وجود state/API.

### المحتوى والوعود

- Preview يعرض curriculum/achievements/support/notifications/operations ثم تختفي في LIVE أو تتحول إلى toast.
- أزرار «تصدير»، «تصفية»، «فتح الوحدات»، «مراجعة الملف»، «الإعدادات»، «طلب تصحيح» تبدو تنفيذية بينما لا تفعل ما يوحي به label.
- `ApprovalCard` يعرض fallback data تبدو كسجل تدقيق حقيقي عند غياب بيانات الخادم.

---

## 7. خطة إصلاح مرحلية

### المرحلة 0 — تثبيت المخاطر (1–3 أيام)

**هدفها:** منع dead ends والكوارث الوظيفية دون إعادة هيكلة شاملة.

- إصلاح drawer class في Family/Student، واختبار 360/768px.
- إزالة/ربط logout التجريبي.
- إخفاء الروابط غير المسموحة من Home/R02/Workspace أو فصلها كـPreview واضح.
- إصلاح `auth-locked-page` وواجهة forbidden قابلة للعودة.
- منع double-submit في كل mutations المالية والحساسة.
- إيقاف/وسم الأفعال التي لا تحفظ بياناتها بدل إظهار success مضلل.
- إزالة fallback role R06 في حالة forbidden، ومنع fallback branch الصامت.
- وضع CSS مؤقت آمن لـDecisionDialog أو استخدام primitive الموجود.

**مخرج القبول:** لا يوجد زر أساسي يذهب إلى رفض غير مفهوم، ولا عملية مالية تبدأ مرتين بالنقر المتكرر، والقائمة تفتح على الهاتف.

### المرحلة 1 — عقد shell والتنقل والصلاحيات (أسبوع)

- تعريف route registry واحد: `path`, `label`, `roles`, `permission`, `scope`, `mode`, `featureState`.
- بناء `AppShell/RoleSidebar` مشترك يقرأ session role/permissions/scope ويحسب active item.
- تحديد سياسة hide مقابل disabled: الروابط غير المسموحة تُخفى عادة، والوظائف المعروفة غير المتاحة تظهر disabled مع سبب.
- ربط `financeCapabilities` بالـpermissions مع role defaults معلنة.
- توحيد `RoleScopeCard`, role label, branch name, user/session identity.
- ربط R00–R09 بوجهات صحيحة، خصوصًا AcademyOwner، branch operations، R03/R04، secretary escalation، finance route names.
- فصل Preview navigation عن production navigation بوضوح.

**مخرج القبول:** contract test يثبت أن كل link ظاهر موجود في App routes ومسموح للدور/permission، وأن route غير المسموح لا يظهر في sidebar.

### المرحلة 2 — LIVE truthfulness وscope (1–2 أسبوع)

- R02: تنفيذ operations live أو route صريحة «غير متاح حاليًا» مع CTA.
- R03: إضافة navigation fallback وربط head instructors/programs والوظائف المتاحة؛ تسمية curriculum/progress غير المتاحة صراحة.
- R04: shell موحد وdirty guards للحضور والتقييم.
- R05: registration stateful وhandoff بعد نجاح API فقط، مع branch guard.
- R06: تحديد roll-up/branch selector، filters، evidence policy، correction trigger، mutation states.
- R07: تثبيت branch scope، ربط KPI بالstate/filter، handoff بـlead id، workflow حقيقي أو disabled واضح.
- R08/R09: status mapping، invoice review API-backed، support/notifications destinations، CANCELLED/EXCUSED semantics.
- R01/R00: إزالة loop، CSS management، وتمييز live/preview.

**مخرج القبول:** كل CTA live إما ينفذ mutation قابلة للتتبع أو يشرح بوضوح لماذا هو غير متاح؛ كل قيمة scope معروضة من session/contract لا من fallback صامت.

### المرحلة 3 — primitives وaccessibility (أسبوع)

- اعتماد Dialog/Popover/Feedback/Status/Loading/Empty/Error primitives.
- تطبيق focus trap/return، Escape، scroll lock، `aria-live`, `aria-invalid`, `aria-describedby`.
- توحيد tabs إلى `tablist/tab/tabpanel` مع keyboard arrow behavior.
- إضافة dirty-form confirmation وpending/disabled states.
- إضافة retry endpoint-specific وstale timestamp.

**مخرج القبول:** keyboard-only walkthrough لكل popup/form رئيسي، وaxe/manual checks دون أخطاء حرجة في landmarks/labels/focus.

### المرحلة 4 — design system والأداء البصري (بعد استقرار الوظائف)

- استخراج tokens موحدة للخط، الألوان، الحدود، radius، shadow، spacing، breakpoints.
- تقليل cascade العام والـselectors wildcard؛ تعيين classes semantic.
- رفع النصوص التشغيلية والـmetadata الصغيرة إلى أحجام مقروءة، مع اختبار Cairo fallback.
- توحيد locale `ar-EG` أو سياسة رقمية معلنة.
- تحويل الجداول العريضة إلى cards/accordion أو إضافة scroll hint وsticky key column.

**مخرج القبول:** لا توجد عائلة shell مغايرة بلا سبب منتجي، ولا قيم 7–9px في نص تشغيلي أساسي، ولا اختلاف غير موثق بين live/preview في palette أو status.

### المرحلة 5 — الاختبارات والقبول

- contract tests للتنقل والصلاحيات والـscope.
- integration tests للـmutations ومنع double-submit وrefetch/rollback.
- E2E لكل role في preview وLIVE، بما في ذلك session expiry و401/403/503.
- visual regression للـshell والdialogs والبوابات عند 360/480/768/1024/1440px.
- accessibility regression: keyboard, screen reader labels, focus, contrast, reduced motion.

---

## 8. ملاحظات اختبارات responsive/accessibility

### نقاط responsive إلزامية

- **360px RTL:** Family/Student drawer، Home/R02 sidebar، Finance forms، invitation، Academy modals، R04 attendance/evaluation.
- **480–560px:** Login/invitation validation، R01 forms، marketing lead handoff، approval decision modal.
- **680–768px:** breakpoint transitions، tables، sticky headers، sidebar/scrim، R03/R04 tabs.
- **820–900px:** Login/Workspace، R01 dashboards، R02 reports، dialogs التي تتحول من desktop إلى stack.
- **1024px وما فوق:** sidebar width، fixed logout، app-shell grid، عدم تغطية المحتوى.

### حالات يجب اختبارها في كل شاشة حية

1. session loading ثم success.
2. 401 مع session reset وredirect إلى login مع return path.
3. 403/role forbidden مع رسالة مفهومة وبدائل.
4. endpoint failure جزئي مع retry أو stale data label.
5. empty list الحقيقي، وليس `0` مضللًا.
6. mutation pending، النقر المتكرر، failure، success، ثم refetch.
7. بيانات كثيرة جدًا، أسماء عربية طويلة، branch names متعددة، وRTL text wrapping.
8. Preview/LIVE label عند وجود session أو غيابها.

### اختبارات keyboard وscreen reader

- ترتيب Tab منطقي من menu button إلى drawer ثم المحتوى ثم close/return.
- `aria-expanded` و`aria-controls` يتغيران مع drawer، وEscape يغلقه ويعيد focus إلى الزر.
- كل icon-only button له accessible name، وكل status له نص لا يعتمد على اللون وحده.
- dialogs تعلن العنوان والوصف، تحبس focus، تمنع الوصول إلى الخلفية، وتعيد focus بعد الإغلاق.
- tabs تستخدم `aria-selected`, `aria-controls`, `role=tabpanel`, وkeyboard arrows أو semantics buttons واضحة.
- الحقول المطلوبة تملك `label`, `id`, `aria-invalid`, `aria-describedby` ورسالة خطأ مرتبطة.
- `aria-live` للحالات success/error/loading المهمة، مع عدم الاعتماد على toast وحده.
- زر logout يعلن busy/failure ولا يكرر الطلب.
- الجداول تملك caption/headers أو بديل cards على الهاتف؛ scroll container له hint مرئي.

### اختبارات بصرية ودلالية

- تحقق contrast للنصوص muted والحالات amber/danger/teal.
- تحقق أن status labels العربية موحدة، ولا تعرض API enums خامًا.
- تحقق من أن DEMO لا يظهر على LIVE وأن LIVE لا يستخدم fallback copy أو بيانات placeholder.
- تحقق من عدم اختفاء status badge على mobile في R08/R09.
- تحقق من اتجاه drawer في RTL؛ القرار يجب أن يكون موحدًا ومقصودًا (يمين أو يسار) لا نتيجة `inset` متناقضة.
- تحقق من عدم تغطية fixed logout أو dialogs للمحتوى/keyboard.

---

## 9. قائمة الأولويات التنفيذية المختصرة

1. إصلاح Family/Student mobile drawer.
2. منع R02 operations وR01 AcademyOwner من dead ends/loops.
3. بناء navigation contract وsidebar role/permission-aware.
4. إزالة logout التجريبي والهوية R06 المزيفة.
5. تثبيت Dialog/Feedback primitive مع CSS وaccessibility.
6. منع double-submit وإظهار mutation states في المالية والاعتمادات.
7. توحيد branch/tenant scope ومصدر permissions.
8. فصل Preview عن LIVE وإكمال/تعطيل الوظائف المعلنة بصدق.
9. إصلاح CSS المفقود لصفحات Academy* وتوحيد shells الأساسية.
10. بعد ذلك فقط: tokens، typography، الجداول، والـvisual polish.

---

## 10. الخلاصة

المشكلة المركزية ليست غياب المكونات، بل **غياب العقد الموحد بينها**: route لا يرتبط دائمًا بعنصر navigation مناسب، role لا يساوي permissions الفعلية في العرض، scope لا يعرض دائمًا الفرع المقصود، وbutton لا يوضح هل هو live mutation أم demo feedback. لذلك ينبغي إدارة الإصلاح كبرنامج تثبيت تجربة وتشغيل، لا كإعادة تنسيق CSS فقط.

إذا نُفذت المرحلة 0 ثم المرحلة 1، سيختفي الجزء الأكبر من dead ends والمفارقات الأكثر ضررًا. بعدها يمكن إكمال LIVE لكل role، ثم تطبيق primitive وdesign tokens؛ وهذا الترتيب يقلل إعادة العمل ويحافظ على backend كمرجع الصلاحية دون جعل المستخدم يكتشف حدود النظام بالنقر على روابط ممنوعة.

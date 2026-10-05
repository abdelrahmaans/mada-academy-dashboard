# Mada Academy — خطة التنفيذ المعدلة

**التاريخ:** 4 أكتوبر 2026
**القرار الحالي:** ضوابط P0 الأساسية منفذة محليًا، بينما تظل جاهزية التشغيل الموزع والإطلاق العام مشروطة بمراجعة البنية التحتية والـCORS/storage/staging.

## 1. نطاق المرحلة الحالية

### داخل التنفيذ الآن

1. إدخال Playwright E2E إلى CI.
2. تثبيت حدود LIVE/DEMO للأدوار R00/R01/R03/R04/R07.
3. حسم وضع Marketing كـPreview خارج الـMVP حاليًا.
4. توثيق حدود Platform Admin وعدم الإعلان عن capabilities غير مثبتة.
5. توسيع اختبارات Invoice Correction الحالية، بدون فتح Refund/Cancel كامل.
6. زيادة تغطية Frontend للسلوك الحرج.
7. جرد وتنظيف الكود القديم والتوثيق المكرر بحذر.
8. تقسيم الصفحات الضخمة تدريجيًا بدون إعادة كتابة architecture.
9. مراجعة CORS configuration والتأكد من توثيق شرط origins في الإنتاج، بدون اعتبارها مسار إطلاق P0 الآن.

### P0 auth hardening — منفذ محليًا

- تم تنفيذ rate limiting على password login حسب IP، وعلى OTP/الدعوات الحساسة وبحث حسابات المستهلك.
- تم تنفيذ persisted account lockout بعد محاولات الفشل.
- تمت إضافة integration coverage للـ429 والـlockout والـreset-on-success.
- تم ضبط forwarded headers بحيث لا تُقبل إلا من `MADA_TRUSTED_PROXIES`.
- ما زال يلزم قبل الإطلاق العام اختبار distributed behavior ومراجعة lockout/DoS وإعدادات البنية الأفقية.

> تنفيذ الحماية محليًا لا يعني اعتبار النظام Production-ready؛ تبقى اختبارات النشر والتشغيل الموزع وCORS/storage/staging gates مطلوبة.

---

## 2. قرارات المنتج

### 2.1 R07 Marketing

**القرار الحالي المقترح:** إبقاء Marketing خارج الـMVP كـ`PREVIEW / LOCAL`، وعدم بناء API حقيقية في هذه المرحلة.

السبب:

- `MarketingDesk.tsx` يعتمد على fixtures وlocal state للحملات والـleads.
- تحويله إلى LIVE يحتاج قرارات مستقلة حول مصادر الـleads، lifecycle، deduplication، handoff، الصلاحيات، والتدقيق.
- بناء API الآن سيضيف vertical slice جديدًا ويشتت العمل عن تثبيت الأسطح الحالية.

الإجراءات:

- تثبيت banner واضح بالعربي والإنجليزية أن البيانات محلية ولا تُحفظ.
- إبقاء الصفحة خارج أي route معلن كـLIVE capability.
- عدم إضافة mutations أو API جزئية تعطي انطباعًا مضللًا بأن Marketing أصبحت حية.
- تحديث `PROJECT_STATUS.md` و`NEXT_PHASE_PLAN.md` فقط لتسجيل القرار الحالي.
- إنشاء backlog منفصل بعنوان Marketing API Phase بدل خلطه مع هذه المرحلة.

**شرط فتح Marketing لاحقًا:** contract، entities/migrations، branch/tenant authorization، audit، API tests، UI tests، وقرار معتمد لمصدر الـleads.

### 2.2 R00 Platform Admin

تم تنفيذ جرد R00 في [R00_PLATFORM_ADMIN_INVENTORY.md](R00_PLATFORM_ADMIN_INVENTORY.md). الموجود حاليًا هو live platform support محدود ومحدد النطاق، وليس full platform administration.

الإجراءات:

- [x] جرد كل action في Platform Console وتصنيفه إلى `LIVE` أو `PREVIEW` أو `NOT AVAILABLE`.
- [x] إزالة أو عدم عرض أزرار توحي بعمليات غير محفوظة أو غير مدعومة.
- [x] الحفاظ على البيانات المتاحة عند فشل endpoint اختياري مع warning واضح.
- [x] توثيق authorization، tenant isolation، masking، والتدقيق في acceptance checklist.
- [ ] إصلاح drift في عقد Academy Bootstrap: العقد يقول إن كلمة مرور المالك لا تُحفظ، بينما التنفيذ والواجهة يستخدمان كلمة مرور.
- [ ] إضافة اختبارات bootstrap، reactivation، حماية عضوية R00، ورفض R00 assignment قبل إعلان R00 acceptance-complete.
- [ ] إزالة `academy.archive` من advertised permissions حتى يتوفر workflow حقيقي أو فتح change مستقل له.

### 2.3 Finance

يوجد حاليًا Invoice Correction request بصيغة maker-checker مع approval وaudit واختبارات عزل. لكنه ليس workflow كاملًا لـ:

- إلغاء فاتورة.
- Refund/reversal.
- تصحيح موسع لكل الحالات المالية.

**قرار المرحلة:** لا نفتح Cancel/Refund الآن. نوسع اختبارات correction الحالية ونثبت حدودها في التوثيق.

---

## 3. الأولوية الأولى — Playwright في CI

### الهدف

ضمان أن الرحلات الحرجة لا تبقى محلية فقط، خصوصًا:

- Login/anonymous redirect.
- Role isolation.
- Logout.
- Finance invoice/payment/evidence.
- Family linked scope.
- Student self-scope.

### التنفيذ

إضافة workflow مستقل مثل:

`.github/workflows/e2e.yml`

يعمل على Pull Request وpush إلى `main`، ويقوم بـ:

1. Checkout.
2. Node 22 + pnpm.
3. .NET 10.
4. `pnpm install --frozen-lockfile`.
5. تشغيل `pnpm e2e` مع `webServer` الموجود في `playwright.config.ts`.
6. حفظ `playwright-report` وscreenshots وtraces عند الفشل.
7. تحديد timeout وconcurrency.
8. عدم استخدام credentials حقيقية.

### معايير القبول

- تعديل frontend في PR يشغل E2E تلقائيًا.
- فشل route isolation أو Finance flow يفشل الـworkflow.
- artifacts متاحة عند الفشل.
- لا توجد مشكلة startup race بين API وVite.
- `pnpm e2e` يظل ناجحًا محليًا.
- لا يتم ربط الاختبار بصفحة GitHub Pages أو production.

---

## 4. الأولوية الثانية — LIVE/DEMO truth

### 4.1 جرد موحد

ننشئ جدولًا داخليًا لكل route/section:

| Surface | الحالة | مصدر البيانات | Mutations | ملاحظات |
|---|---|---|---|---|
| R00 Platform | LIVE جزئي | API المتاح | محدودة | full support غير مثبت |
| R01 Executive | LIVE جزئي | reports/audit API | حسب العقد | يحتاج acceptance evidence |
| R03 Head Instructors | LIVE + optional | core API + optional endpoints | حسب الصلاحية | بعض المؤشرات Preview |
| R04 Instructor | LIVE core + Preview metrics | assigned sessions/evaluations | حسب assignment | analytics ليست كلها حية |
| R07 Marketing | PREVIEW/LOCAL | fixtures/local state | محلية فقط | خارج MVP |

### 4.2 R01 Executive Reports

- تحديد endpoints التي تمثل acceptance evidence النهائي.
- إضافة integration assertions للـtenant/branch scope.
- تغطية loading/error/retry/empty.
- التأكد من عدم fallback إلى demo عند فشل التقرير أو audit.
- إضافة checklist قبول يوضح endpoint والنتيجة المتوقعة والدور المستخدم.

### 4.3 R03/R04

- فصل core metrics عن preview metrics في model/components.
- أي metric بلا API حقيقية يظهر `PREVIEW` أو يزال من LIVE surface.
- منع fixtures من الظهور كأرقام تشغيلية فعلية.
- إضافة tests لفشل optional endpoint مع بقاء core data ظاهرًا.
- إبقاء تحليلات المدرب الواسعة خارج هذه المرحلة؛ المسارات الحية الأساسية هي assigned sessions/attendance/evaluation.

### 4.4 R07

- إبقاء preview واضحًا.
- منع إنشاء حملة أو تغيير lead من الادعاء بأنه محفوظ على الخادم.
- عدم إضافة API نصف مكتملة.

---

## 5. الأولوية الثالثة — Finance Correction coverage

توسيع `InvoiceCorrectionApiTests` بدون إضافة refund/cancel:

- الصلاحيات الفعلية لـR05/R06.
- maker لا يقرر طلبه إذا كان ذلك ممنوعًا.
- duplicate decision.
- invalid state transition.
- correction تحت المبلغ المدفوع.
- correction في نفس الفرع فقط.
- cross-tenant/cross-branch.
- audit event وstate transition.
- بقاء الفاتورة immutable قبل الموافقة.
- عدم كشف correction internals للمستهلكين.

**Definition of Done:** contract والاختبارات يوضحان أن correction الحالي approval workflow محدود، وأن cancel/refund خارج النطاق.

---

## 6. الأولوية الرابعة — Frontend critical test coverage

الحالة الحالية: 5 ملفات اختبار و18 test مقابل حجم كبير من الواجهة. لا نحتاج اختبار كل JSX، بل حماية السلوك المؤثر.

الترتيب:

1. `apiClient`:
   - 401 refresh/logout.
   - 403/5xx toast bridge.
   - network failure.
2. `ProtectedRoute` وrole navigation:
   - unauthenticated redirect.
   - منع role من السطح الخطأ.
3. Finance:
   - mutation loading/disabled.
   - over-collection/error preservation.
   - evidence attached/not attached.
4. Family/Student:
   - linked scope فقط.
   - partial failure لا يمسح البيانات الأساسية.
   - no demo fallback في LIVE.
5. R01/R03/R04:
   - optional endpoint failure.
   - preview metric label.
   - empty/error/retry.

نستخرج pure functions/hooks عند الحاجة قبل اختبار components الضخمة.

---

## 7. الأولوية الخامسة — Legacy cleanup والتوثيق

### 7.1 `server/` — مكتمل

تم التحقق من عدم وجود imports أو references تشغيلية في package scripts وVite وCI، ثم حذف Node scaffold القديم بعد نجاح build/tests/E2E. الـbackend الفعلي هو ASP.NET Core في `backend/`.

### 7.2 صفحات Demo/Legacy — مكتمل

مثل:

- `Finance.tsx`
- `Secretary.tsx`
- `Instructor.tsx`

تم تأكيد أن البدائل LIVE تغطي المسارات المصادق عليها، مع إبقاء legacy URLs كتحويلات محمية إلى desks الحية، ثم حذف صفحات `Finance.tsx` و`Secretary.tsx` و`Instructor.tsx`.

### 7.3 `client-angular/` — مكتمل

تم حذف عميل Angular المرجعي بعد التأكد من أنه غير مستخدم في CI أو routes أو build، وإزالة أوامر Angular من package scripts. React + Vite هو العميل الوحيد المدعوم.

### 7.4 Markdown duplication — تمت المراجعة

لا نحذف ملفات بالاسم فقط. نحدد:

- `PROJECT_STATUS.md`: مصدر حقيقة الحالة.
- `NEXT_PHASE_PLAN.md`: مصدر خطة التنفيذ.
- API contracts: مستقلة.
- runbooks/release gates: مستقلة.
- acceptance docs: تبقى فقط إذا فيها evidence غير مكرر.

تمت مراجعة ملفات Markdown في الجذر: ملفات الحالة، الخطة، العقود، runbooks، وacceptance evidence ما زالت مستخدمة أو مرجعًا تشغيليًا، لذلك لم يتم حذفها بالاسم فقط. أي دمج لاحق للتوثيق يكون في PR docs مستقل مع تحديث كل الروابط.

---

## 8. الأولوية السادسة — تقسيم الصفحات الضخمة

الصفحات التي دخلت موجة التقسيم الأولى:

1. `HeadInstructors.tsx` — merged in PR #55
2. `Schedule.tsx` — merged in PR #56
3. `PlatformConsole.tsx` — merged in PR #58
4. `MarketingDesk.tsx` and legacy components — merged in PR #62
5. `Classes.tsx` — merged in PR #63
6. `Team.tsx` — merged in PR #64

Students (#57), Approvals (#59), and Instructor Desk (#60) were closed because their proposed extractions did not materially shrink the original page. Reopen only with a smaller, higher-value boundary.

### طريقة التنفيذ

- صفحة واحدة في كل PR قدر الإمكان.
- استخراج types/constants.
- استخراج API/data hooks.
- استخراج forms/tables/sections.
- إبقاء route component مسؤولًا عن orchestration فقط.
- عدم تغيير labels أو visual system في نفس refactor إلا للضرورة.
- عدم تغيير routes أو authorization.

### بعد كل extraction

- `pnpm check`
- `pnpm test`
- `pnpm build`
- `pnpm e2e` إذا كانت الصفحة ضمن رحلة حرجة
- `git diff --check`

الهدف تقليل التعقيد وقابلية المراجعة، وليس الوصول إلى عدد أسطر مصطنع.

---

## 9. CORS configuration review

في Development فقط يسمح الكود بـAny Origin إذا لم تكن `MADA_CORS_ORIGINS` مضبوطة؛ أما Production فيرفض startup عند غياب origins الصريحة أو استخدام `*`.

ضمن هذه المرحلة:

- [x] مراجعة وتوثيق أن origins يجب أن تكون محددة في الإنتاج.
- [x] إضافة configuration test يفشل startup configuration عند غياب origins أو استخدام wildcard.
- [x] منع `*` في production configuration.
- [x] التأكد من أن `AllowAnyHeader/AllowAnyMethod` لا تعني فتح origins.
- تم تنفيذ rate limiting وlockout وtrusted proxy handling في مسار auth مستقل؛ هذا القسم يركز فقط على origins ورفض wildcard في Production.

---

## 10. P0 auth hardening — منفذ محليًا، مع بوابات إطلاق مفتوحة

تم تنفيذ وتغطية الضوابط التالية:

- rate limiting حسب عنوان العميل لتسجيل الدخول، وواجهات OTP/الدعوات الحساسة، وبحث حسابات المستهلك.
- persisted failed-login count و`LockedUntil` مع reset بعد النجاح.
- `429` ورسائل فشل لا تكشف وجود الحساب.
- integration tests للـlockout والـrate limit.
- معالجة `X-Forwarded-For` و`X-Forwarded-Proto` فقط من عناوين proxy مضبوطة في `MADA_TRUSTED_PROXIES`.

تبقى قبل الإطلاق العام:

- اختبار distributed behavior أو استخدام limiter مشترك عند تشغيل أكثر من instance؛ limiter الحالي in-memory لكل instance.
- مراجعة تشغيلية لقيم proxy الموثوقة، ومراقبة/استجابة lockout حتى لا يتحول إلى DoS على حساب معروف.

لا يتم اعتبار النظام Production-ready قبل إغلاق بوابات التشغيل الموزع وCORS/storage/staging.

---

## 11. ترتيب الـPRs المعدل

### مكتمل — CI، الأمن، والتنظيف والتقسيم الأول

- Playwright CI وإصلاح startup؛ `pnpm e2e` يمر في PRs التقسيم.
- PR #61: forwarded headers، limits للـlogin/refresh/OTP/invitations/consumer lookup، واختبارات invitation/lookup/OTP.
- PR #62: إزالة `Map.tsx` و`ManusDialog.tsx` وتقسيم Marketing.
- PRs #55، #56، #58، #63، #64: تقسيم Head Instructors وSchedule وPlatform Console وClasses وTeam.

### المرحلة التالية — جودة الواجهة والأمن المعماري

1. إضافة اختبارات frontend لـFinance mutations.
2. إضافة اختبارات frontend لعزل family/student scope وحالات partial failure/no-demo fallback.
3. إضافة backend test لإعادة استخدام refresh token بعد rotation (reuse detection/revocation).
4. نقل endpoints الخاصة بـauth من `Program.cs` إلى module مستقل مع الحفاظ على العقود والـrate-limit policies.
5. جرد R00 Platform Admin وتصنيف كل action إلى `LIVE` أو `PREVIEW` أو `NOT AVAILABLE` مع اختبار الصلاحيات والتدقيق قبل أي mutation جديدة.

### مؤجل — جاهزية الإنتاج

- CORS production enforcement، distributed rate limiting، private storage smoke، backup/restore، وstaging acceptance.

---

## 12. Definition of Done

- كل behavior أو authorization change له tests.
- `pnpm check` ناجح.
- `pnpm test` ناجح.
- `pnpm build` ناجح.
- `pnpm e2e` ناجح محليًا.
- Playwright يعمل على PR داخل CI.
- Backend integration tests ناجحة.
- `git diff --check` ناجح.
- لا توجد secrets أو `.env` أو بيانات حقيقية.
- لا تظهر fixtures على أنها LIVE.
- كل API mutation يحترم tenant/branch/consumer scope.
- التوثيق يعكس الحقيقة ولا يعلن Preview كميزة مكتملة.
- لا يتم اعتبار النظام Production-ready قبل إثبات distributed rate limiting وضبط proxy وCORS/storage/staging gates.

## 13. نقطة البداية العملية

نبدأ بـ:

1. Frontend finance mutation tests.
2. Frontend family/student scope tests.
3. Backend refresh-token reuse test.
4. Auth endpoint module extraction.
5. R00 Platform Admin inventory and acceptance checklist.
6. بعد ذلك نغلق بوابات CORS/distributed limiter/storage/backup/staging للإطلاق.

Rate Limiting وAccount Lockout منفذان محليًا؛ المتبقي هو إثبات التشغيل الموزع، ضبط proxy الموثوق، ومراجعة lockout كخطر DoS تشغيلي قبل الإطلاق العام.

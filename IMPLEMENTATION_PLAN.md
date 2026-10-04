# Mada Academy — خطة التنفيذ المعدلة

**التاريخ:** 4 أكتوبر 2026
**القرار الحالي:** تأجيل P0 الأمني والتنفيذي مؤقتًا، والعمل على تحسينات الجودة، والـCI، وحدود LIVE/DEMO، والاختبارات، والصيانة.

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

### P0 auth hardening — منفذ في هذه الدفعة

- تم تنفيذ rate limiting على password login حسب IP.
- تم تنفيذ persisted account lockout بعد محاولات الفشل.
- تمت إضافة integration coverage للـ429 والـlockout والـreset-on-success.
- ما زال يلزم قبل الإطلاق العام اختبار distributed behavior ومراجعة إعدادات البنية الأفقية.

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

الموجود حاليًا هو shell وoverview وقراءات محدودة، وليس full platform administration/support مثبتًا بالكامل كـLIVE API.

الإجراءات:

- جرد كل action في Platform Console وتصنيفه:
  - `LIVE`
  - `PREVIEW`
  - `NOT AVAILABLE`
- إزالة أو وسم أي زر يوحي بعملية غير محفوظة أو غير مدعومة.
- الحفاظ على البيانات المتاحة عند فشل endpoint اختياري مع warning واضح.
- عدم إضافة mutations جديدة قبل وجود contract وصلاحيات واختبارات.
- إضافة acceptance checklist لمسارات R00 الحالية.

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

الحالة الحالية: 3 ملفات اختبار وحوالي 13 test مقابل حجم كبير من الواجهة. لا نحتاج اختبار كل JSX، بل حماية السلوك المؤثر.

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

الصفحات المرشحة:

1. `HeadInstructors.tsx`
2. `Secretary.tsx`
3. `Classes.tsx`
4. `FinanceDesk.tsx`

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

الكود يسمح بـAny Origin إذا لم تكن `MADA_CORS_ORIGINS` مضبوطة، وهذا يجب ألا يحدث في Production.

ضمن هذه المرحلة:

- مراجعة وتوثيق أن origins يجب أن تكون محددة في الإنتاج.
- إضافة configuration test أو startup warning واضح.
- منع `*` في production configuration.
- التأكد من أن `AllowAnyHeader/AllowAnyMethod` لا تعني فتح origins.
- تم تنفيذ rate limiting وlockout في مسار auth مستقل؛ هذا القسم يركز فقط على origins ورفض wildcard في Production.

---

## 10. P0 المؤجل — Release blocker لاحقًا

عند فتح مسار الأمان لاحقًا ننفذ:

- Rate limit لـpassword login حسب IP وphone/accountType.
- persisted failed-login count و`LockedUntil`.
- `429` و`Retry-After`.
- رسائل فشل موحدة لمنع user enumeration.
- reset بعد النجاح.
- integration tests للـlockout والـrate limit.
- مراجعة distributed behavior قبل horizontal scaling.

**لا يتم إعلان النظام جاهزًا لإطلاق عام قبل إغلاق هذا القسم.**

---

## 11. ترتيب الـPRs المعدل

### PR-1 — Playwright CI

Workflow + artifacts + startup stabilization، بدون product changes.

### PR-2 — LIVE/DEMO boundaries

R07 explicit Preview، R00 capability labels، R01 acceptance evidence، R03/R04 metric cleanup، مع الاختبارات اللازمة.

### PR-3 — Finance correction coverage

توسيع الاختبارات والتوثيق فقط، بدون refund/cancel.

### PR-4 — Frontend critical coverage

اختبارات السلوك الحرج واستخراج pure logic عند الحاجة.

### PR-5 — CORS configuration hardening

تثبيت شرط origins المحددة في Production مع tests/docs، بدون تنفيذ P0 auth hardening.

### PR-6 — Legacy cleanup

حذف `server/` أو الصفحات التي ثبت عدم استخدامها، كل مجموعة في PR صغير.

### PR-7 — Page decomposition

Refactor تدريجي للصفحات الكبيرة، صفحة واحدة لكل PR عند الإمكان.

### لاحقًا — P0 Security PR

Rate limiting وaccount lockout قبل أي إطلاق عام.

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
- لا يتم اعتبار النظام Production-ready مع بقاء P0 الأمني مؤجلًا.

## 13. نقطة البداية العملية

نبدأ بـ:

1. PR-1: Playwright CI.
2. جرد LIVE/DEMO للأدوار R00/R01/R03/R04/R07.
3. PR-2: تثبيت الحدود والعلامات والـacceptance evidence.
4. PR-3: توسيع Finance correction tests.
5. PR-4: Frontend critical coverage.
6. PR-5: CORS configuration review.
7. PR-6 ثم PR-7 للتنظيف والتقسيم.

أما Rate Limiting وAccount Lockout فهما **مؤجلان عمدًا** كمسار P0 مستقل وشرط قبل الإطلاق العام.

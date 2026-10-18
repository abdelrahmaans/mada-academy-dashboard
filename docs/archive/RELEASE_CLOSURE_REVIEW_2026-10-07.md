# Mada Academy — تقرير مراجعة إغلاق الإصدار

**التاريخ:** 7 أكتوبر 2026  
**المستودع:** `abdelrahmaans/mada-academy-dashboard`  
**مرجع الإصدار القابل للإطلاق:** `main` عند `a6c43ed`  
**نطاق المراجعة:** حالة الكود، الاختبارات، الفروع وPRs، الحدود LIVE/DEMO، وبوابات ما قبل الإنتاج.

## 1. الحكم التنفيذي

### القرار

**الإصدار ليس Production Ready بعد.**

الجزء البرمجي المحلي للـMVP مقبول بدرجة جيدة، و`main` لديه CI أخضر، لكن بوابات تشغيلية إلزامية ما زالت مفتوحة:

1. حقن أسرار الإنتاج في بيئة الاستضافة دون تخزينها في Git.
2. اختبار رفع/تنزيل إثبات مالي مصادق عليه ضد التخزين الخاص الفعلي.
3. وضع وتنفيذ backup/restore دائم لقاعدة البيانات وملفات التخزين.
4. تشغيل PostgreSQL integration suite على قاعدة staging المستهدفة.
5. تشغيل staging smoke للـAPI والواجهة المنشورين.
6. تسوية PRs والفروع المفتوحة، خصوصًا ما يخص Angular وR04، قبل إعلان baseline نهائي.

يمكن إغلاق **مرحلة code/local acceptance**، لكن لا ينبغي إعلان إغلاق **الإصدار الإنتاجي** قبل إغلاق البنود أعلاه وتسجيل أدلتها في `FINANCE_RELEASE_GATE.md`.

## 2. الحالة المثبتة

| المجال | الحالة | الدليل |
|---|---|---|
| `main` | محدث على `origin/main` عند `a6c43ed` | `PROJECT_STATUS.md` وGitHub |
| CI على `main` | أخضر بالكامل | TypeScript/unit/build، Playwright، deploy، PostgreSQL/backend |
| React frontend | أخضر محليًا: **54/54**، `pnpm check`، `pnpm build` | تحقق هذه المراجعة على فرع العمل الحالي |
| Angular الحالي | أخضر محليًا: **48/48**، `pnpm build` | تحقق هذه المراجعة على فرع Angular الحالي |
| Browser/API E2E | **7/7** مثبتة في baseline/CI | `PROJECT_STATUS.md`، `NEXT_PHASE_PLAN.md`، CI على `main` |
| Finance local acceptance | مكتمل | `FINANCE_RELEASE_GATE.md` |
| Backend refresh rotation | اختبار replay موجود ومندمج في PR #69 | `InMemoryApiTests.cs` وGitHub |
| Auth module extraction | منفذ ومندمج في PR #68 | `Modules/Identity/AuthEndpoints.cs` |
| R00 security follow-ups | مكتملة | PRs #70 و#72 و`R00_PLATFORM_ADMIN_INVENTORY.md` |
| Rate-limit topology guard | مطبق ومندمج | PR #73 و`DISTRIBUTED_RATE_LIMIT_DECISION.md` |
| PostgreSQL migrations | موجودة ومغطاة في CI | `DATABASE_STATUS.md` وworkflow backend |

## 3. بوابات P0 قبل الإنتاج

هذه البنود تمنع إعلان الإصدار Production Ready، وليست تحسينات اختيارية.

### 3.1 الأسرار وبيئة الاستضافة

**المطلوب:** إعداد هذه القيم في secret manager الخاص بالاستضافة، وليس في Git أو الواجهة:

- `ASPNETCORE_ENVIRONMENT=Production`
- `MADA_FRONTEND_URL`
- `DATABASE_URL`
- `MADA_JWT_SIGNING_KEY` بطول عشوائي لا يقل عن 32 حرفًا
- `MADA_PRIVATE_STORAGE_MODE=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `SUPABASE_STORAGE_BUCKET=private-evidence`
- `MADA_RATE_LIMIT_MODE=single-instance`
- `MADA_RATE_LIMIT_EXPECTED_INSTANCES=1`

**معيار الإغلاق:** إثبات secret injection في بيئة staging، دون كشف القيم في logs أو browser bundle أو Git.

### 3.2 التخزين الخاص وإثباتات الدفع

البنية البرمجية fail-closed عند غياب التخزين الإنتاجي، وهذا صحيح أمنيًا. لكن لا توجد بعد أدلة staging مكتملة.

**المطلوب:**

- تأكيد أن bucket `private-evidence` خاص.
- اختبار PDF/JPG/PNG وحد 10 MiB.
- رفع مصادق عليه بحساب موظف.
- تنزيل مصادق عليه من خلال API فقط.
- التأكد أن فرعًا آخر أو consumer غير مرتبط يحصل على `404/403`.
- التأكد من عدم وجود public object URL.
- توثيق retention/deletion policy.

**معيار الإغلاق:** تسجيل النتيجة والبيئة والتاريخ والـrequest/response codes في `FINANCE_RELEASE_GATE.md` دون تسجيل أسرار أو tokens.

### 3.3 النسخ الاحتياطي والاستعادة

يوضح المستند الحالي أن Supabase Free لا يضمن automatic database backups، كما أن database backup لا يشمل ملفات Storage API.

**المطلوب قبل قبول بيانات مالية حقيقية:**

- تحديد backup target مستقل ودائم لقاعدة البيانات.
- تحديد backup/copy schedule لملفات `private-evidence`.
- تحديد retention وaccess control وrotation.
- تنفيذ restore test واحد على الأقل.
- حفظ evidence قابلة للتدقيق للنتيجة.

**معيار الإغلاق:** restore ناجح موثق، وليس مجرد وجود bucket أو backup يدوي غير مجرب.

### 3.4 PostgreSQL وstaging smoke

**المطلوب:**

1. تشغيل migrations على قاعدة staging المستهدفة.
2. تشغيل backend integration suite ضد PostgreSQL المستهدف.
3. تشغيل `scripts/staging-smoke.sh` باستخدام حسابات staging مضبوطة.
4. تشغيل frontend production build مع `VITE_API_URL` يشير إلى API HTTPS الحقيقي.
5. تشغيل browser acceptance على staging.

**المسارات المرجعية:**

- `PRE_PRODUCTION_RUNBOOK.md`
- `CONSUMER_STAGING_SMOKE_TEST.md`
- `scripts/staging-smoke.sh`
- `FINANCE_RELEASE_GATE.md`

## 4. الفروع وPull Requests التي يجب تسويتها

GitHub يعرض حاليًا PRs مفتوحة مرتبطة بالمشروع. لا ينبغي إغلاق الإصدار مع ترك قرار baseline غامضًا:

| PR | الموضوع | الإجراء المطلوب قبل الإغلاق |
|---:|---|---|
| #74 | private-storage staging smoke | مراجعة/دمج إذا كانت أدلة staging جزءًا من الإصدار، أو إبقاؤه مفتوحًا كـrelease gate واضح |
| #76 | R04 assigned-group supervision | مراجعة backend authorization والاختبارات ثم merge أو تأجيل موثق |
| #78 | consumer partial-failure coverage | مراجعة ثم merge إذا كانت اختبارات القبول النهائية مطلوبة في `main` |
| #79 | Angular foundation | لا يدمج إلى production client قبل قرار رسمي بشأن Angular parallel track |
| #80 | Angular auth shell | نفس القرار؛ لا يعتبر LIVE replacement تلقائيًا |
| #81 | repository organization | merge بعد التأكد من عدم تغيير source of truth أو حذف handoff مطلوب |
| #82 | Family Portal scope tests | مراجعة وmerge إذا لم تكن التغطية مكافئة بالفعل في `main` |
| #83 | Student Portal scope tests | مراجعة وmerge إذا لم تكن التغطية مكافئة بالفعل في `main` |
| #84 | refresh replay detection | مراجعة وmerge إذا لم تكن مكافئة للاختبار الموجود في PR #69 |

### فرع العمل الحالي

بيئة المراجعة ليست `main`، بل:

```text
feat/angular-r04-instructor-work
```

وهي مبنية على `origin/feat/angular-r04-instructor`، وبها تغييرات غير ملتزمة تشمل:

- Angular R04 instructor workspace وتحديث endpoint policies.
- اختبارات consumer scope.
- تحديثات critical E2E.
- إعداد Playwright لـAngular R04.
- تعديل `package.json`.

**الإجراء الإلزامي:** قبل أي release merge، يجب إما:

1. تحويل هذه التغييرات إلى commit/PR مستقل بمراجعة واختبارات واضحة، أو
2. حفظها كعمل غير مكتمل خارج release branch، أو
3. التخلص منها فقط بعد تأكيد أنها غير مطلوبة.

لا يجوز دمج working tree غير المراجع مباشرة في `main`.

## 5. حدود المنتج التي يجب تثبيتها في release notes

هذه ليست bugs مخفية، لكنها حدود يجب ألا يوحي الإصدار بعكسها:

- **Marketing R07:** ما زال Preview/local وليس vertical slice API مكتملًا.
- **R02 Branch Operations:** أجزاء من الشاشة ما زالت Preview/محلية؛ لا تُعامل كبيانات تشغيل حية.
- **R04 Instructor:** التحليلات الأوسع والأسطح غير الأساسية خارج LIVE contract.
- **R00 Platform Admin:** لا يوجد archive/delete أو billing أو دعم مالي/طلابي/consumer تفصيلي كامل.
- **R08/R09:** البيانات تقتصر على linked records وpublished evaluations والبيانات التشغيلية المستمرة.
- **Password recovery:** غير منفذ.
- **Production SMS:** غير مهيأ؛ Development OTP لا يجوز تشغيله في الإنتاج.
- **Real payment processing / official tax invoicing:** خارج MVP.
- **Horizontal scaling:** غير مسموح حاليًا؛ limiter in-memory ومقيد بsingle instance إلى أن يكتمل قرار shared limiter والدليل ثنائي النسخ.
- **Angular:** عميل parallel/non-LIVE وليس بديلًا كاملًا لعميل React المرجعي.

يجب أن تظهر هذه الحدود في release notes وعمليات الدعم، لا أن تُخفى خلف route guards أو تسميات عامة.

## 6. التحقق الأمني المطلوب في آخر release pass

قبل tag أو production deploy:

- [ ] تأكيد أن backend authorization هو مصدر القرار النهائي لكل role/scope.
- [ ] مراجعة tenant/branch filters في كل mutation وfinancial read جديد منذ آخر merge.
- [ ] مراجعة consumer links وpublished-only evaluation visibility.
- [ ] مراجعة invoice/payment ownership وappend-only/audit behavior.
- [ ] تشغيل secret scan على diff وrepository history ذات الصلة.
- [ ] التأكد من عدم وجود `.env` حقيقي أو tokens أو OTPs أو database dumps في commit.
- [ ] التأكد من `MADA_TRUSTED_PROXIES` وعدم الوثوق العشوائي بـ`X-Forwarded-For`.
- [ ] التأكد من عدم تشغيل `MADA_SEED_DEMO_DATA` أو Development OTP في Production.
- [ ] التأكد من أن CORS production لا يستخدم `AllowAnyOrigin`.
- [ ] التأكد من أن evidence download يمر عبر API authorization ولا يعيد public URL.
- [ ] مراجعة audit trail للعمليات المالية والإدارية الحساسة.

## 7. فجوات التوثيق

يوجد تفاوت بين بعض لقطات الحالة في المستندات وبين الحالة الفعلية الحديثة:

- `PROJECT_STATUS.md` و`NEXT_PHASE_PLAN.md` يحملان تواريخ وcommits مختلفة عن فرع المراجعة الحالي.
- بنود refresh-token test وauth module extraction معلنة أحيانًا كخطة، مع أنها مدمجة فعليًا في PRs #69 و#68.
- أرقام Vitest قديمة في بعض المواضع؛ التحقق الحالي على working tree أعطى 54 اختبارًا، بينما الوثائق تذكر 24 أو 18 في لقطات أقدم.
- Angular R04 موجود في فرع العمل الحالي وليس في `main`.

**المطلوب:** بعد تثبيت release baseline، تحديث `PROJECT_STATUS.md` و`NEXT_PHASE_PLAN.md` مرة واحدة من commit موحد، مع فصل:

1. `main` production baseline.
2. Angular parallel track.
3. operational gates المفتوحة.
4. local-only evidence مقابل staging/production evidence.

## 8. نتائج الاختبارات في هذه المراجعة

### نجحت

- React/Vitest: **54/54**.
- React TypeScript check: **PASS**.
- React production build: **PASS**.
- Angular tests: **48/48**.
- Angular production build: **PASS**.
- `git diff --check`: **PASS**.
- GitHub checks على `main` commit `a6c43ed`: جميعها `success`، وتشمل backend/PostgreSQL وPlaywright وfrontend وdeploy.

### لم تُنفذ محليًا

- Backend .NET tests وlocal API/E2E في هذه الـsandbox، لأن `dotnet` runtime غير موجود في البيئة الحالية.
- هذه ليست علامة فشل في المشروع؛ backend وPostgreSQL checks ناجحة على GitHub لـ`main`، لكن يجب عدم وصف التحقق المحلي بأنه كامل.

## 9. ترتيب التنفيذ المقترح للإغلاق

### P0 — قبل أي إعلان إنتاجي

1. تثبيت release baseline وقرار Angular/PRs المفتوحة.
2. تجهيز secrets وPostgreSQL على staging.
3. تشغيل storage upload/download smoke مع authorization.
4. إغلاق backup/restore evidence لقاعدة البيانات وملفات التخزين.
5. تشغيل PostgreSQL integration suite على staging.
6. تشغيل `staging-smoke.sh` ثم browser acceptance على staging.
7. تحديث `FINANCE_RELEASE_GATE.md` بالنتائج.

### P1 — قبل tag النهائي أو بالتوازي مع P0

1. تحديث source-of-truth docs والأرقام والتواريخ.
2. تنفيذ security checklist الأخيرة.
3. إعلان الحدود LIVE/DEMO والميزات خارج MVP.
4. تثبيت single-instance deployment وعدم horizontal scaling.
5. إنشاء rollback plan وmigration/restore owner.

### P2 — بعد إغلاق MVP، لا تمنع الإصدار إذا كانت الحدود معلنة

1. Production SMS provider.
2. Password recovery.
3. Marketing APIs.
4. Expanded instructor analytics.
5. Invoice cancellation/correction/refund expansion.
6. Shared distributed limiter إذا أصبح التوسع الأفقي مطلوبًا.
7. قرار رسمي بشأن انتقال Angular من parallel/non-LIVE إلى production client.

## 10. تعريف الإغلاق النهائي

لا يُغلق الإصدار كـProduction Ready إلا عند تحقق كل ما يلي:

- [ ] release commit معروف على `main` ولا توجد تغييرات غير ملتزمة.
- [ ] كل PRs الداخلة في النطاق مدمجة أو مؤجلة بقرار موثق.
- [ ] CI الأخضر على release commit.
- [ ] PostgreSQL staging migrations/integration ناجحة.
- [ ] server-only secrets مضبوطة ومراجعة.
- [ ] private evidence smoke ناجح مع 403/404 لعزل branch/consumer.
- [ ] backup/restore ناجح وموثق.
- [ ] staging API/frontend smoke ناجح.
- [ ] لا توجد Demo fallbacks في authenticated LIVE routes ضمن النطاق المعلن.
- [ ] release notes تصف بوضوح ما هو LIVE وما هو PREVIEW وما هو NOT AVAILABLE.
- [ ] owner واضح للمراقبة، rollback، استعادة البيانات، وتدوير الأسرار.

**الخلاصة:** المشروع جاهز لإغلاق مرحلة التطوير والقبول المحلي، لكنه يحتاج إغلاق بوابات التشغيل والـstaging قبل إصدار إنتاجي رسمي.

# دليل واجهة Mada Academy المبنية بـAngular

> هذا المستند هو مرجع تأسيس نسخة Angular الموازية. لا يغيّر هذا العمل الواجهة القائمة: React في `client/` يظل المصدر المرجعي والنسخة المعتمدة حتى مرور Angular بمراجعة التكافؤ والقبول.

## 1. حالة المشروع والنطاق

أنشئ `client-angular/` كتطبيق مستقل من Angular CLI. يحتوي التأسيس التقني على standalone routing، عرض عربي RTL، إشارات (signals)، OnPush، وVitest، ومكتبة UI في `src/app/shared/components/`. أضيف auth shell أولي (`/login` و`/workspace`) ثم أول شريحة LIVE parity لـR02 على `/`: لوحة مدير الفرع تقرأ `GET /dashboard/summary` فقط وتعرض loading/error/empty صريحة. لا تعرض Angular كواجهة LIVE كاملة ولا تملأه ببيانات demo توحي بأنها فعلية.

الـbackend المشترك هو ASP.NET Core 10 مع PostgreSQL وEF Core وJWT. لا تنشأ قاعدة بيانات ثانية ولا API بديلة للنسخة Angular. أي إضافة/تغيير على عقد الـAPI يخضع لمراجعة الخادم والعميلين React وAngular والاختبارات ذات الصلة.

## 2. التشغيل والإصدارات

يتطلب Angular 21 Node وفق المجال `^20.19.0 || ^22.12.0 || >=24.0.0`؛ اختير Angular CLI 21.2.25 لأن إصدار Angular 22 المتاح وقت التأسيس يطلب Node 22.22.3+، في حين أن بيئة التأسيس كانت Node 22.13.0. يعتمد مجلد Angular على pnpm 10.4.1 وقفل مستقل.

```bash
# React — من جذر المستودع
pnpm dev
pnpm check && pnpm test && pnpm build
pnpm e2e

# Angular — مجلد مستقل
cd client-angular
pnpm install --frozen-lockfile
pnpm start       # localhost:4200
pnpm build
pnpm test
```

لا تستبدل أوامر React في الجذر، ولا تضف Angular إلى pipeline/نشر الإنتاج أو تغيّر إعداد Vercel/Pages ضمن التأسيس.

## 3. الهيكل المعماري المستهدف

```text
client-angular/
├── public/
├── src/
│   ├── app/
│   │   ├── core/          # إعداد البيئة، API، الجلسة، guards/interceptors، أخطاء
│   │   ├── layout/        # أغلفة التنقل لكل سطح/نطاق؛ دون صلاحيات أمنية
│   │   ├── shared/        # عناصر UI/أنماط/أدوات مشتركة فعلًا
│   │   ├── features/      # مجالات العمل؛ لكل مجال data-access/models/pages/ui
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/      # إعداد عام غير سري؛ لا أسرار أو مفاتيح خاصة
│   ├── styles.scss        # tokens عامة وRTL
│   └── index.html         # lang=ar وdir=rtl
├── angular.json
├── package.json
└── pnpm-lock.yaml
```

التنظيم حسب المجال لا حسب نسخ الشاشات. المرشحون: `identity`, `academy`, `operations`, `scheduling`, `evaluations`, `finance`, `consumers`, `marketing`. داخل المجال استخدم `data-access` لعقود/طلبات المجال، `models` للأنواع، `pages` للشاشات، و`ui` لعناصر المجال. ضع فقط العناصر القابلة لإعادة الاستخدام فعلًا في `shared/`، وأبقِ منطق المجال خارج القالب والمكونات العامة.

### Shared UI الحالية (كلها عرضية وغير حية)

`src/app/shared/components/` يصدّر `MadaSidebar`، `MadaButton`، `MadaCard`، `MadaBadge`/`MadaStatusBadge`، `MadaPageHeader`، `MadaFeedbackState`، و`MadaScopeCard`. كل مكوّن standalone و`OnPush` ويستخدم Inputs/Outputs صريحة؛ تفاصيل الواجهة في [`src/app/shared/README.md`](client-angular/src/app/shared/README.md)، ومعاينة العناصر الثابتة على `/shared-components`. الـsidebar يستقبل قوائم role-specific من المستهلك، وأوامر مثل الخروج تخرج كـevent؛ لا يقرر صلاحيات أو scope ولا ينفذ logout/API. حتى الآن معاينة R02 فقط، وأسطح R08/R09 مختلفة وتتطلب مطابقة مستقلة قبل إعادة استخدام المظهر.

استخدم standalone components وtyped reactive forms عند وجود نماذج، route-level lazy loading للمناطق الكبيرة، وفصل التحميل والخطأ والفراغ والـforbidden بدل إظهار قوائم فارغة مضللة. لا تستنسخ شجرة React أو مكوناتها حرفيًا؛ حافظ على سلوك المنتج وعلامته، لا على قيود تقنية قديمة.

## 4. Signals واكتشاف التغييرات

- `ChangeDetectionStrategy.OnPush` افتراضي لكل component؛ عند إنشاء مكوّن جديد أضف اختبارًا يثبت أهم السلوك.
- استخدم `signal` للحالة المحلية القابلة للتغيير، و`computed` للمشتقات النقية. لا تخزن قيمًا مشتقة كحالة ثانية.
- استخدم `input()`/`output()` أو واجهات input/output المعيارية للإصدارة عند ملاءمتها؛ حافظ على واجهات component صغيرة ومكتوبة الأنواع.
- استخدم RxJS لحدود الـasync/stream/interoperability (HTTP، إلغاء/دمج الطلبات) ثم حوّل الحالة إلى signals عند حد UI عند الحاجة. لا تحوّل كل stream إلى signal دون سبب.
- لا تستخدم `effect()` لمزامنة قيم مشتقة أو كبديل لتدفق البيانات أحادي الاتجاه؛ احصره في أثر جانبي مشروع وموثق.
- التطبيق مولد بوضع zoneless؛ لا تضف `zone.js` أو تعتمد على كشف تغييرات ضمني. تحديثات UI يجب أن تمر من notifications المدعومة مثل signals، أحداث القوالب، AsyncPipe أو API Angular المناسبة.
- اختبر التحميل المتزامن، التكرار، التنقل أثناء الطلب، والأخطاء؛ امنع stale responses وتكرار mutation باستخدام إلغاء/منع الازدواج حسب الحالة.

## 5. العربية والتصميم وإمكانية الوصول

العربية وRTL افتراضيان (`lang="ar"`, `dir="rtl"`) في المستند والتخطيط. اكتب CSS بمنطق الاتجاه (`margin-inline`, `padding-inline`, `inset-inline`) بدل left/right، واختبر العرض على الهاتف وسطح المكتب. ابدأ من لوحة Mada في `client/src/components/MadaTheme.css`: الحبر `#14243a`، خلفية الصفحة `#f4f7fa`، الأبيض، وteal `#0d9488`، مع الحدود والظلال والزوايا المتناسقة. هذه قيم مرجعية لا تبرر إعادة بناء الـdesign system من الصفر.

حافظ على التسميات العربية، والأسطح المختلفة حسب الدور، والتباين والتركيز المرئي ووسوم الحقول الدلالية. لا تستخدم لونًا وحده لبيان الحالة. لا تجعل التصميم RTL يعني عكس بيانات الهاتف/المبالغ/المراجع الرقمية؛ استخدم `dir="ltr"` موضعيًا عند اللزوم.

## 6. واجهة الـAPI والمصادقة

العقود المرجعية الحالية تشمل [`backend/PASSWORD_AUTH_CONTRACT.md`](backend/PASSWORD_AUTH_CONTRACT.md)، [`backend/ROLES_PERMISSIONS_API_CONTRACT.md`](backend/ROLES_PERMISSIONS_API_CONTRACT.md)، [`backend/OPERATIONS_API_CONTRACT.md`](backend/OPERATIONS_API_CONTRACT.md)، [`backend/SESSION_LIFECYCLE_API_CONTRACT.md`](backend/SESSION_LIFECYCLE_API_CONTRACT.md)، وعقود التمويل/التهيئة المناسبة. عميل React الحالي `client/src/lib/apiClient.ts` يوضح envelope الأنواع والطلبات، لكنه ليس بديلًا عن عقد الخادم واختباراته.

عقد الدخول الحالي: `POST /api/v1/auth/login` بجسم `{ phone, password, accountType }`، وقيم نوع الحساب المدعومة `staff|parent|student`. الاستجابة الناجحة مغلفة بـ`data` وتحوي access/refresh tokens. الخادم يطبق lockout بعد خمس محاولات فاشلة افتراضيًا وحدًا لعدد الطلبات؛ الخطأ غير الصحيح `401`، والقفل `429` مع `LOGIN_LOCKED`. التجديد على `POST /api/v1/auth/refresh`، والخروج `POST /api/v1/auth/logout` ويتطلب تفويضًا. اختبارات الخادم المرجعية: `PasswordLoginSecurityApiTests.cs` و`P1CoreJourneyApiTests.cs`، واختبارات واجهة React ذات الصلة `client/src/lib/apiClient.interceptor.test.ts` و`client/src/components/ProtectedRoute.test.ts`.

تنفيذ auth الحالي يستخدم `HttpClient` وinterceptor typed: access token يبقى في الذاكرة، وrefresh token في `sessionStorage` باسم خاص بالعميل، مع refresh واحد مشترك عند تزامن 401 ثم إعادة محاولة واحدة للطلب الأصلي. يتم مسح الجلسة عند فشل refresh، ولا تُرسل بيانات login/refresh إلى interceptor التفويض. هذا يقلل بقاء التوكن على القرص لكنه لا يلغي مخاطر XSS؛ لا تحفظ كلمات المرور أو OTP أو الأسرار، ولا تسجل token في logs. استخدم `Authorization: Bearer` حيث يتطلب العقد، وحافظ على structured errors (`status`, `code`, `message`) وإعادة محاولة محدودة؛ لا تجعل guard بديلًا عن رفض API.

## 7. حدود الصلاحيات ونطاقات البيانات

الخادم هو مصدر التفويض النهائي. لا تقبل `tenantId`, `branchId`, role أو permissions من URL أو local storage كحقيقة، ولا تبنِ استعلامات أو mutations Angular على نطاق يختاره العميل دون أن يعيد الخادم فرضه. كل endpoint يجب أن يتحقق من ملكية/ارتباط كل سجل ذي صلة بنطاق الهوية المصادق عليها.

| الدور                 | نطاق العرض المعتمد                                                                     |
| --------------------- | -------------------------------------------------------------------------------------- |
| R00 Platform Admin    | دعم المنصة ضمن صلاحياته الموثقة فقط؛ لا توحي بدعم archive/delete أو billing غير المتاح |
| R01 Academy Owner     | الأكاديمية/tenant                                                                      |
| R02 Branch Manager    | الفرع                                                                                  |
| R03 Head Instructors  | الفرع/الفريق المكلّف                                                                   |
| R04 Instructor        | الجلسات والطلاب المعيّنون                                                              |
| R05 Secretary         | عمليات فرعه والصلاحيات الدقيقة الممنوحة؛ ليس لديه `finance.write` واسع افتراضيًا       |
| R06 Accountant        | مالية الفرع وفق صلاحيات API                                                            |
| R07 Marketing Manager | الفرع؛ بعض التسويق Preview وغير مربوط كليًا بـAPI                                      |
| R08 Parent/Guardian   | الأطفال المرتبطون بحساب ولي الأمر فقط                                                  |
| R09 Student           | حساب الطالب المرتبط به فقط                                                             |

لا تعرض نتائج التقييمات لـR08/R09 إلا بعد `PUBLISHED`. أبقِ حالات LIVE منفصلة عن DEMO: لا تعرض بيانات demo عند فشل طلب أو في غياب بيانات فعلية، ولا تقدّم Marketing كواجهة LIVE كاملة. إخفاء زر أو منع route ليس صلاحية أمنية.

المالية سجلات مقيدة بالأكاديمية/الفرع، وتظل ملكية الفاتورة/الدفعة وسلوك append-only والتدقيق وقواعد إثبات الدفع كما في العقود والاختبارات. الطرق المعروضة تسجيل مدفوعات خارجية؛ المنتج لا يعالج البطاقات أو المحافظ. لا ترفع أو تكشف ملفًا ماليًا دون إعادة فحص النطاق والربط على الخادم.

## 8. العمل المتوازي مع React

React يبقى المرجع العملي والمصدر عند أي التباس، وAngular مشروع موازي مستقل لا تعديل لنفس الملفات ولا استبدال تدريجي صامت. لكل شريحة ترحيل: (1) اختر سلوكًا موثقًا وميز LIVE/DEMO، (2) اقرأ الصفحة وAPI client والendpoint والكيان وسياسة التفويض والاختبارات قبل التنفيذ، (3) أعد تنفيذ السلوك في Angular على العقد القائم، (4) أضف اختبارات Angular وابقِ backend integration/E2E مرجع الأمن، (5) طابق حالات التحميل/الخطأ/الفراغ/المنع وواجهة الجوال والعربية، ثم (6) وثّق أي اختلاف مقصود.

أنشئ مصفوفة تتبع لاحقًا لكل مسار: route/role، مصدر React، endpoints، LIVE/DEMO، حدود النطاق، تغطية الاختبار، وحالة التكافؤ (`Not started / In progress / Accepted`). لا تحوّل المشروع كله دفعة واحدة؛ اختَر شريحة صغيرة، منخفضة المخاطر وواضحة القبول. تغيير مشترك في API يجب ألا يمرر أحد العميلين إلى endpoint أضعف أو يوسع الوصول.

## 9. الاختبار والقبول وPull Request

لكل سلوك Angular جديد: unit/component tests على Vitest تشمل success/error/loading/empty حيث تنطبق، وkeyboard/RTL responsive check للمسارات المرئية. تغييرات API أو التفويض تتطلب اختبارات backend integration لكل دور/فرع/tenant أو link boundary؛ لا تكتف باختبار guard. شغّل React tests/build إذا لمس التغيير ملفات React أو العقد المشترك، وإلا لا تنسب فشلها أو نجاحها إلى Angular.

قبل فتح PR: ثبّت القفل (`pnpm-lock.yaml`)، شغّل `cd client-angular && pnpm test && pnpm build`، ثم من الجذر أوامر React المناسبة، و`git diff --check`. الـPR المقترح لهذا التأسيس موجّه إلى `main`، محدود بملفات الوثائق والواجهة الجديدة، ولا ينشر التطبيق أو يغيّر production infrastructure. لا تضع أسرارًا أو ملفات `.env` أو بيانات حقيقية في Git.

## 10. الوضع الحالي والخطوة التالية

المرحلة الحالية تتضمن auth shell، لوحة R02 الأولى، مكتبة shared UI واختبارات API/refresh/guard/login، لكنها لا تستبدل React ولا تعني قبول التكافؤ الكامل. لا تُضاف طلبات Dashboard للأدوار غير R02، ولا تُرسل `tenantId` أو`branchId` من العميل؛ يفرض backend النطاق من JWT. الخطوة التالية هي مصفوفة تكافؤ React↔Angular وإضافة أدوار منفصلة بعد مراجعة عقودها. مرجع الحالة والخطة التفصيلية يظل [`PROJECT_STATUS.md`](PROJECT_STATUS.md) و[`NEXT_PHASE_PLAN.md`](NEXT_PHASE_PLAN.md).

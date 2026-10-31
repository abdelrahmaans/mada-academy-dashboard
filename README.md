# نظام مدى لإدارة الأكاديميات (Mada Academy Operating System)

نظام تشغيل وإدارة سحابي متكامل ومخصص للأكاديميات التعليمية والرياضية؛ مبني بمعمارية عربية أصيلة تدعم اتجاه اليمين لليسار (`RTL`) كأساس، مع نظام عزل صارم لتعدد المستأجرين (Multi-Tenancy) وحوكمة دقيقة لـ **10 أدوار تشغيلية متخصصة (R00 إلى R09)**.

---

## 🌟 أبرز مميزات النظام

1. **واجهات عربية متطورة أصيلة (Arabic-First RTL):** تصميم مريح وواضح بدون تعريب سطحي أو تشوهات واجهة.
2. **استراكتشر موحد وخالٍ من التكرار (Zero-Duplication Architecture):** استخدام أشرطة تنقل مخصصة لكل دور (`BranchManagerSidebar`, `R01AcademySidebar`, `R03HeadInstructorsSidebar`, `RoleSidebar`) ومكون غلاف موحد (`RoleDashboardShell`).
3. **تزامن التبويبات مع الـ URL Hash:** دعم التنقل المباشر، والروابط العميقة (Deep Links)، وحفظ حالة التبويب عند التحديث أو استخدام زري الرجوع والتقدم في المتصفح.
4. **عزل صارم للبيانات (Multi-Tenancy Guardrails):** لا يمكن لأي مستخدم أو فرع الوصول لبيانات أكاديمية أو فرع آخر، والـ Backend هو المرجع النهائي لفرض الصلاحيات.
5. **معمارية Monorepo حديثة:** تجمع بين تطبيق الداشبورد (React)، وصفحة الهبوط (Landing)، وتطبيق السيرفر (.NET 10 Web API)، وحزم التصميم المشتركة.

---

## 👥 مصفوفة الأدوار الـ 10 (10 Enterprise Roles)

| الدور | المسمى الوظيفي | المسار الأساسي | نطاق الصلاحية (Scope) | المسؤوليات التشغيلية الرئيسية |
|---|---|---|---|---|
| **R00** | **مسؤول المنصة** | `/platform-console` | `platform` | إدارة الأكاديميات، ترقية الباقات، تمديد الفترات التجريبية، ودفتر فوترة المنصة. |
| **R01** | **مالك الأكاديمية** | `/executive-dashboard` | `tenant` | المؤشرات التنفيذية، P&L متعدد الفروع، إدارة الفروع، وتصدير تقارير مجلس الإدارة. |
| **R02** | **مدير الفرع** | `/` | `branch` | غرفة عمليات الفرع اليومية، الجداول، المجموعات، الطلاب، واعتماد القرارات والمصروفات. |
| **R03** | **رئيس المدربين** | `/head-instructors` | `branch` | الإشراف الأكاديمي، اعتماد تقييمات الطلاب قبل النشر، إدارة المناهج، وبنك المعايير. |
| **R04** | **المدرب** | `/instructor-desk` | `assigned` | حصص اليوم المسندة، تسجيل حضور الطلاب، تقييم الطلاب وفق المعايير، وطلب البدلاء. |
| **R05** | **السكرتارية والاستقبال** | `/secretary-desk` | `branch` | مسار الـ Leads، التسجيل الفوري للطلاب، المتابعات العاجلة، التجميد، وتقفيل ورديات الكاش. |
| **R06** | **المحاسب المالي** | `/finance-desk` | `branch` | التحصيل والفواتير، قيود المصروفات، مطابقة ورديات الكاش، وأتعاب المدربين بالحصة. |
| **R07** | **مسؤول التسويق** | `/marketing-desk` | `branch` | استقطاب الـ Leads، إطلاق ومتابعة الحملات الإعلانية، وتقويم نشر المحتوى. |
| **R08** | **ولي الأمر** | `/family-portal` | `family` | متابعة الأطفال المرتبطين، الحضور والغياب، التقييمات المعتمدة، الفواتير، وطلب التجميد. |
| **R09** | **الطالب** | `/student-portal` | `self` | رحلة التعلم الشخصية، مواعيد الحصص القادمة، الشارات، ونقاط التقدم المكتسبة. |

---

## 📂 هيكل المجلدات المنظم (Repository Directory Tree)

```text
.
├── apps/
│   └── landing/                 # صفحة الهبوط والتسويق واستقبال طلبات الـ Demo
├── backend/
│   ├── MadaAcademy.Api/         # تطبيق .NET 10 Web API الرئيسي
│   ├── MadaAcademy.Api.IntegrationTests/ # اختبارات التكامل والتحقق من قواعد البيانات
│   ├── MadaAcademy.sln          # Solution الباك إند
│   └── scripts/                 # سكربتات التهيئة والترحيل لقواعد البيانات
├── client/                      # داشبورد العمليات الأساسي (React 19 + Vite + TypeScript)
│   ├── src/
│   │   ├── components/          # المكونات المشتركة، السايدبارز، والموديولات المستقلة
│   │   ├── contexts/            # إدارة الحالة (AuthContext, RoleScopeContext)
│   │   ├── lib/                 # عميل الـ API، الصلاحيات، ودوال التحقق
│   │   ├── pages/               # شاشات ومسارات الأدوار
│   │   └── styles/              # تنسيقات ومحددات الثيم الموحد
├── client-angular/              # نسخة موازية بإطار Angular للتوافق المؤسسي
├── docs/                        # مركز التوثيق الفني الشامل ومصفوفات الصلاحيات
│   ├── archive/                 # الخطط والتقارير التاريخية المؤرشفة
│   ├── ARCHITECTURE_AND_MONOREPO.md
│   ├── ROLES_AND_WORKFLOWS.md
│   ├── ROLE_PERMISSION_ENDPOINT_MATRIX.md
│   └── README.md
├── packages/
│   └── mada-tokens/             # حزمة رموز التصميم المشتركة (Design Tokens)
├── shared/                      # ثوابت مشتركة بين الفرونت والباك إند
├── supabase/                    # تهجيرات وسياسات قاعدة بيانات PostgreSQL
├── e2e/                         # اختبارات الأتمتة الشاملة عبر Playwright
└── scripts/                     # سكربتات التشغيل والبناء المحلية
```

---

## 🚀 البدء والتشغيل المحلي (Quickstart Commands)

### 1. تثبيت الاعتماديات (Dependencies)
```bash
# تثبيت كل حزم الـ Monorepo بواسطة pnpm
pnpm install
```

### 2. تشغيل الواجهة الأمامية (Frontend Dashboard)
```bash
# تشغيل خادم التطوير لداشبورد العمليات (يعمل على http://localhost:5173)
pnpm dev

# تشغيل صفحة الهبوط والتسويق (Landing Page)
pnpm dev:landing
```

### 3. تشغيل واختبار الباك إند (.NET 10 API)
```bash
# استعادة وبناء مشروع الباك إند
pnpm backend:restore
pnpm backend:build

# تشغيل اختبارات التكامل للباك إند
pnpm backend:test
```

### 4. الفحص وضمان الجودة (Code Quality & Testing)
```bash
# فحص الأنواع الصارمة في TypeScript (بدون توليد ملفات)
pnpm check

# تشغيل اختبارات الواجهة الأمامية عبر Vitest
pnpm test

# بناء حزمة الإنتاج للواجهة
pnpm build
```

---

## 🔒 ضوابط الأمان وحماية البيانات (Security Guardrails)

* **الـ Backend هو الحاكم المطلق:** حراس الصلاحيات في الفرونت إند هي لتسهيل تجربة المستخدم فقط؛ كل Request يُفحص بالتوكن المشفر للتأكد من انتمائه للأكاديمية والفرع المطلوب.
* **سرية تقييمات الطلاب:** لا تظهر بطاقات تقييم المدربين للأسرة أو الطالب نهائياً إلا بعد اعتمادها صراحة وتغيير حالتها إلى `PUBLISHED` من قِبل رئيس المدربين (R03).
* **حماية النقدية والعمليات المالية:** الفواتير المحصلة لا يمكن تعديلها، والمصروفات تتطلب اعتماداً مسبقاً، وإغلاق وردية كاش الاستقبال يتطلب تدقيقاً ومطابقة من المحاسب المالي (R06).
* **الحسابات العائلية:** لا يمكن لأي ولي أمر أو طالب الاستعلام عن بيانات حسابات أخرى أو الوصول لبيانات طلاب خارج نطاق العائلة المحدد.

---

## 📚 التوثيق المفصل
للاطلاع على أدلة العمليات والـ API والـ Runbooks المفصلة، تفضل بزيارة [**مركز التوثيق الفني (docs/README.md)**](docs/README.md).


## Backend-only rebuild workstream

The current active rebuilding plan is backend-only and uses .NET as the first implementation stream. Start with [`BACKEND_START_HERE.md`](BACKEND_START_HERE.md), then follow the living plan in [`.agent/BACKEND_PLAN.md`](.agent/BACKEND_PLAN.md). The durable agent history is [`.agent/BACKEND_AGENT_LOG.md`](.agent/BACKEND_AGENT_LOG.md), and the target .NET structure is documented in [`backend/TARGET_STRUCTURE.md`](backend/TARGET_STRUCTURE.md).

Frontend and mobile work are intentionally deferred until the backend contracts, domain rules, authorization model, persistence model, and acceptance evidence are stable.

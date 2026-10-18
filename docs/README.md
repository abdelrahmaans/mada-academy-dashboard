# مركز التوثيق الفني لنظام مدى (Mada Documentation Hub)

مرحباً بك في مركز التوثيق الفني الشامل لمشروع **Mada Academy Dashboard**. تم تنظيم هذا المجلد ليكون المرجع الأساسي للمطورين وفرق العمليات والمنتج.

---

## 📚 الفهرس الرئيسي للوثائق الحية (Active Documentation)

### 1. معمارية النظام والأدوار (Architecture & RBAC)
* 📖 [**دليل الأدوار وسير العمل (ROLES_AND_WORKFLOWS.md)**](./ROLES_AND_WORKFLOWS.md): الدليل المحدث الشامل للأدوار الـ 10 (R00 - R09) والموديولات الخمسة لكل دور، وحدود الصلاحيات، والتزامن مع الـ URL Hash.
* 📖 [**معمارية المونوريبو والتقنيات (ARCHITECTURE_AND_MONOREPO.md)**](./ARCHITECTURE_AND_MONOREPO.md): الهيكل الشامل للمشروع (React 19 + .NET 10 + PostgreSQL + Packages)، ونظام التصميم المشترك.
* 📊 [**مصفوفة الصلاحيات ونقاط الاتصال (ROLE_PERMISSION_ENDPOINT_MATRIX.md)**](./ROLE_PERMISSION_ENDPOINT_MATRIX.md): مخطط وتفصيل كل Permission وما يطابقه من Endpoints وسلوكيات في الباك إند.

### 2. البنية التحتية والتشغيل (DevOps & Runbooks)
* 🚀 [**دليل النشر السحابي (CLOUD_DEPLOYMENT_GUIDE.md)**](./CLOUD_DEPLOYMENT_GUIDE.md): تعليمات النشر على المنصات السحابية (Railway, Render, Docker Compose, Supabase).
* ⚙️ [**دليل ما قبل الإنتاج (PRE_PRODUCTION_RUNBOOK.md)**](./PRE_PRODUCTION_RUNBOOK.md): قائمة التحقق وخطوات التأكد قبل إطلاق بيئة الإنتاج الحية.
* 🛡️ [**بوابة إطلاق المالية (FINANCE_RELEASE_GATE.md)**](./FINANCE_RELEASE_GATE.md): معايير قبول المعاملات المالية والفواتير وضوابط منع التلاعب.

### 3. التطبيقات التابعة والموازية (Apps & Parity)
* 🌐 [**توثيق صفحة الهبوط (LANDING_MONOREPO.md)**](./LANDING_MONOREPO.md): معمارية وتكامل تطبيق صفحة الهبوط في `apps/landing`.
* 🅰️ **توثيق نسخة Angular المؤسسية**: موجودة داخل مجلد `client-angular/docs/` للمقارنة والتكامل المؤسسي.

---

## 🗄️ الأرشيف التاريخي (Documentation Archive)

تم أرشفة مسودات المراحل الأولى، وخطط الـ MVP المبكرة، وسجلات التدقيق القديمة داخل مجلد [`docs/archive/`](./archive/) للحفاظ على نظافة التوثيق الحي وعدم تشتيت المطورين:
* `docs/archive/OTP_MVP_TEMPORARY_PLAN.md`
* `docs/archive/INVOICES_PAYMENTS_MVP_PLAN.md`
* `docs/archive/MADA_PRODUCT_STATE_AND_PLAN_2026-10-10.md`
* `docs/archive/RELEASE_CLOSURE_REVIEW_2026-10-07.md`
* `docs/archive/UI_UX_AUDIT_ROLES_2026-10-05.md`

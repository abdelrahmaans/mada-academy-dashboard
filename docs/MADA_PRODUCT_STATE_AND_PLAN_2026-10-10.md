

## تحديث التنفيذ بتاريخ 10 أكتوبر 2026

تم تنفيذ هذا التحديث على الفرع `feat/unified-role-shell-marketing-live` بعد snapshot التحليل أعلاه:

- أضيف `backPath` وhelpers (`getRoleHomePath` / `getRoleBackPath`) إلى role navigation registry، وأصبح الـshell يعلن `data-role-home` و`data-role-back`.
- شاشة R07 لم تعد تستخدم `CAMPAIGNS` و`CONTENT` و`INITIAL_LEADS` كحقيقة تشغيلية؛ أصبحت تقرأ وتكتب الـLeads من `/api/v1/leads`، وتدعم إنشاء Lead وتغيير حالته وقياس active/interested/registered.
- R07 يستخدم `RoleSidebar` المشترك بدل sidebar خاص بالصفحة، لذلك أصبح navigation/home الخاصان به مشتقين من registry واحد.
- أضيفت بوابة `scripts/private-storage-smoke.sh` لرفع/تنزيل إثبات خاص عبر staging، وبوابة `scripts/backup-restore-verify.sh` لإنشاء dump واستعادته في قاعدة معزولة.
- أضيف `docs/STAGING_PRIVATE_STORAGE_BACKUP_GATE.md` لتحديد ما أغلقناه في الكود وما يظل متوقفًا على أسرار staging، قاعدة PostgreSQL معزولة، ونسخ Storage objects مستقلًا.

التحقق بعد التنفيذ: `pnpm check`، `pnpm test` (**54/54**) و`pnpm build` نجحت. لم يتم الادعاء بإغلاق staging أو backup/restore الحقيقيين لأن أدوات PostgreSQL وأسرار البيئة غير متاحة في الـSandbox الحالي.

## تحديث تنفيذي لاحق — Marketing workflow وtruth sync

تمت إضافة `MarketingCampaign` و`MarketingContentItem` مع tenant/branch scope وstatus workflow وAPI endpoints تحت `/api/v1/marketing/*`. كما تمت إضافة `CampaignId` إلى Lead لربط مصدر الحملة بعدد الـLeads والتحويلات المسجلة. شاشة Marketing لم تعد تعرض Campaigns/Content كبيانات ثابتة؛ أصبحت تحمل وتحفظ وتغير الحالة من الـAPI وتعرض metrics الحملة.

أضيفت migration `20261010150000_AddMarketingWorkflow`، لكن تشغيلها في staging يحتاج deployment فعلي وتفعيل `MADA_APPLY_MIGRATIONS` بطريقة مضبوطة. وتم تصحيح ملفات `.agent/` لتطابق main بعد دمج PR #96. ما يزال إغلاق private storage وbackup/restore وstaging acceptance متوقفًا على أسرار staging وقاعدة/تخزين معزولين؛ scripts المحلية ليست دليل إغلاق بيئي.

ما تبقى في shell هو تنظيف wrappers قديمة محددة في بعض صفحات LIVE التي ما زالت تستورد `R01AcademySidebar` أو `R03HeadInstructorsSidebar`، مع الحفاظ على registry المركزي كمصدر الحقيقة.

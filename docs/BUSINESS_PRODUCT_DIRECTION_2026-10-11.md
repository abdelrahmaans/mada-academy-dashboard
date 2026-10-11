# اتجاه البيزنس والمنتج — Mada Academy

**التاريخ:** 11 أكتوبر 2026  
**السوق الأول:** الأكاديميات التعليمية في مصر  
**النموذج:** SaaS شهري متعدد الأكاديميات  
**حالة الوثيقة:** مرجع المنتج الحي — آخر تحديث بعد قرارات 11 أكتوبر 2026

## القرار الاستراتيجي

Mada ليست LMS فقط، وليست برنامج حسابات فقط. التموضع الأقوى هو:

> **نظام تشغيل الأكاديمية**: منصة واحدة تحول الـlead إلى طالب مسجل، ثم تدير الجروب والمدرب والحضور والتقييم والفاتورة والمتابعة مع ولي الأمر.

هذا التموضع أقرب إلى ما تفعله منصات إدارة الأكاديميات عالميًا: دورة الطالب والتشغيل والـbilling والتواصل في نظام واحد، مع اختلاف المنتجات في عمق الـLMS أو المحاسبة أو الاتصالات. Teachworks وTutorCruncher يربطان الجلسات والفوترة والتواصل، بينما Classcard وJackrabbit يركزان على التسجيل والجدولة والحضور والمدفوعات والبوابة، وClasster/Moodle Workplace يضيفان هيكلًا مؤسسيًا وترحيل بيانات وصلاحيات أوسع [1] [2] [3] [4] [5] [6].

## قرارات المنتج التي تم تثبيتها

### 1. العميل والدفع

- العميل هو **الأكاديمية**، وليس الطالب الفرد.
- المنتج SaaS باشتراك شهري.
- توجد تجربة مجانية في البداية.
- توجد خطط اشتراك متعددة.
- التسعير يجب أن يعكس حجم الأكاديمية: عدد الفروع، الـstaff، والطلاب، مع عدم جعل الحساب معقدًا للعميل.
- عدد الفروع جزء صريح من الاشتراك، والموظفون والمدربون يدخلون في حدود الخطة.
- الخطة الأساسية لا تضمن كل الـfeatures؛ مصفوفة الخطط تحدد ما هو Core وما هو Growth/Pro.
- نحتاج إلى **bulk onboarding** لأن الأكاديمية لن تدخل كل مستخدم يدويًا.
- التجربة تستخدم بيانات الأكاديمية الحقيقية وتمنحها وصولًا فعليًا، ثم يبدأ الاشتراك بعد انتهاء التجربة بموافقة واضحة.
- الشريحة الأولى: أكاديميات الأطفال Programming وRobotics وSTEM وLanguages، حضوريًا أو أونلاين، وكل نموذج يعتمد على جروبات ومدربين.

### تعريف الطالب النشط

الطالب النشط في التسعير والتشغيل هو الطالب الذي لديه **تسجيل `ACTIVE` في جروب قائم** داخل الأكاديمية. وجود سجل طالب فقط لا يجعله Active Student.

- طالب داخل جروب حالي يدخل في المقياس.
- طالب على قائمة انتظار لا يدخل حتى يتحول تسجيله إلى `ACTIVE`.
- طالب أنهى الجروب/البرنامج لا يدخل، مع الاحتفاظ بتاريخه.
- طالب قادم من Marketing ولم يتحول إلى enrollment يظل Lead.
- طالب على hold يحتاج حالة تشغيل مستقلة ولا يدخل في Active Student.

حالات التسجيل الأساسية:

```text
WAITLISTED → ACTIVE → COMPLETED
                    ↘ ON_HOLD / CANCELLED
```

### 2. R03 — Supervisor read-only

R03 هو Supervisor فقط:

- يرى الحضور والغياب للمجموعات التي يشرف عليها.
- يرى هل المدرب سجل الحضور أو لم يسجله.
- لا يعدل الحضور.
- لا ينفذ أعمال R02 أو R04.
- يمكنه لاحقًا إضافة note/comment إيجابي للمدرب المسؤول عن الجروب.
- الـcomment يجب أن يكون مرتبطًا بـgroup/session/instructor، وله audit trail، وليس رسالة عامة بلا سياق.

بناءً على ذلك تم تعديل الكود ليكون R03 **read-only** للحضور، ويقرأ فقط الجروبات ذات الـactive supervision assignment. لا يملك R03 `attendance.write`.

### 3. الفواتير والتحصيل

التوزيع التجاري المطلوب:

- السكرتير ينشئ الفاتورة ويسجل عملية الدفع.
- المحاسب يستطيع المراجعة والتعديل قبل الاعتماد.
- مدير الفرع يستطيع التعديل والاعتماد حسب نطاق الفرع.
- بعد الاعتماد تصبح الفاتورة مرئية للجهات المعنية.
- الدفع في الـMVP **تسجيل عملية دفع خارجية**، وليس معالجة إلكترونية داخل Mada.
- لاحقًا نضيف payment gateway لولي الأمر، ثم دفع الأكاديمية لاشتراك Mada.
- إثبات الدفع يمكن أن يكون اختياريًا في البداية، لكن تصميم invoice/payment يجب أن يسمح بإرفاق evidence لاحقًا.
- الخصومات والإضافات والأقساط والـrefunds يجب أن تكون حركات أو بنودًا موثقة داخل نفس دورة الفاتورة، وليس تعديلًا صامتًا للرقم النهائي.

### 4. ولي الأمر والطالب

- ولي الأمر يستطيع رفع ticket للأكاديمية.
- لا نضع payment evidence upload كشرط للـMVP.
- الطالب يرى:
  - تقييماته.
  - الحضور.
  - leaderboard الخاص بالجروب.
  - المهام/tasks عند توفرها.
- السكرتير يربط الطالب بولي الأمر وقت التسجيل.

### 5. التواصل

- القناة المرغوبة: WhatsApp.
- Email هو fallback عملي قليل التكلفة.
- SMS غير مطلوب كبداية.
- لا نفترض أن WhatsApp API مجاني: Meta تحاسب الرسائل المسلّمة حسب السوق وفئة الرسالة، وبعض رسائل الخدمة مجانية، بينما marketing/authentication/utility لها قواعد وأسعار مختلفة [7].
- رسائل WhatsApp خارج نافذة خدمة العميل تحتاج templates معتمدة؛ Meta تراجع القالب، ولا يمكن إرسال القالب إلا بعد أن تكون حالته `APPROVED` [8].

### 6. التخزين

- رفع الملفات ليس MVP blocker.
- نحتاج private storage عندما نبدأ بإثباتات الدفع أو ملفات رسمية.
- الاحتفاظ بالبيانات يجب أن يكون حسب قيمة البيانات، وليس إلى الأبد تلقائيًا.
- يجب أن نضع retention policy قابلة للتنفيذ: ما الذي نحذفه، متى، ومن يملك قرار الاسترجاع.
- مزود التخزين المقترح حسب قرار المنتج: Supabase، لكن يجب التحقق من التكلفة والـregion والنسخ الاحتياطي قبل الالتزام.

### 7. التسويق

R07 ليس مجرد منشئ محتوى. المطلوب:

- متابعة الـleads.
- تحويل lead إلى تسجيل.
- إرسال lead أو حالة معينة للسكرتير.
- تجميع الجروبات والاهتمام بها.
- متابعة social activity.
- معرفة أي قناة جلبت lead أو تسجيلًا.

الـMVP يجب أن يركز على **Lead-to-enrollment workflow**. النشر المباشر على Facebook/Instagram وقياس engagement المتقدم يأتي بعد إثبات دورة الـlead داخل الأكاديمية.

---

# نموذج الـMVP المقترح

## النواة التي يجب أن تعتمد عليها الأكاديمية

### A. Academy setup

- إنشاء Academy.
- إضافة الفروع.
- استيراد الطلاب وأولياء الأمور والموظفين من CSV/Excel.
- معاينة ومطابقة الحقول قبل الحفظ.
- كشف التكرارات.
- تقرير أخطاء قابل للتنزيل.
- دعوة المستخدمين على دفعات.
- اختيار خطة وتجربة مجانية.

الاستيراد الجماعي والترحيل ليسا تحسينًا ثانويًا. هما من الأنماط المتكررة في المنتجات العالمية؛ Teachworks وTutorCruncher يذكران Excel/CSV، وJackrabbit يقدم basic import مجانيًا ويذكر قيودًا واضحة على إنشاء سجلات جديدة، بينما Classter يركز على matching التاريخي أثناء onboarding [1] [2] [4] [5].

### B. Operations

- Students.
- Guardians.
- Leads.
- Branches.
- Groups/classes.
- Instructors.
- Schedule.
- Attendance.
- Evaluation and publication.
- Tasks.
- Group leaderboard.

### C. Roles

| الدور | الوظيفة الأساسية في MVP | النطاق |
|---|---|---|
| R00 | إدارة الأكاديميات والدعم العام | Platform |
| R01 | إدارة الأكاديمية والفروع والفريق | Tenant |
| R02 | تشغيل الفرع والاعتمادات | Branch |
| R03 | متابعة المدربين والجروبات والحضور والتقييمات | Assigned supervision groups، read-only للحضور |
| R04 | تنفيذ الجلسة والحضور والتقييم | Assigned sessions |
| R05 | التسجيل، الطلاب، إنشاء الفواتير، تسجيل الدفع، leads | Branch |
| R06 | مراجعة واعتماد ومتابعة المالية | Branch |
| R07 | leads، الحملات، المحتوى، المتابعة | Branch |
| R08 | متابعة الأبناء، الفواتير، التذاكر | Linked children |
| R09 | التقييمات، الحضور، tasks، leaderboard | Own student |

الصلاحيات يجب أن تكون أقل صلاحية افتراضيًا، مع نطاق الفرع والجروب والطالب. المنتجات العالمية تذهب من أدوار جاهزة إلى صلاحيات حسب المهمة أو الموقع أو الفئة؛ TutorCruncher وJackrabbit مثالان واضحان على ذلك [2] [5].

### D. Billing workflow

الحالة المقترحة:

```text
DRAFT → PENDING_REVIEW → APPROVED → ISSUED → PARTIALLY_PAID → PAID
                         ↘ REJECTED / NEEDS_CORRECTION
```

- R05 ينشئ Draft ويسجل payment record.
- R02 أو R06 يراجع ويعدل ويعتمد حسب القرار النهائي.
- R08 يرى الفاتورة بعد `ISSUED` أو حسب policy الأكاديمية.
- كل تعديل بعد الاعتماد يمر عبر correction/adjustment، وليس overwrite.
- لا نضيف refund كامل قبل تعريف سياسة refund والـaudit.

المنتجات العالمية تربط الفاتورة بالتسجيل أو الدرس أو الباقة، وتدعم recurring billing أو payment plans أو auto-draft بدرجات مختلفة [1] [2] [4] [5]. Mada تحتاج أولًا إلى دورة فاتورة واضحة محليًا، ثم تضيف recurring gateway بعد إثبات الاستخدام.

### E. Communication MVP

نبدأ بدون تكامل WhatsApp مدفوع:

1. Notification center داخل Mada.
2. Email templates عند توفر مزود مجاني أو SMTP مناسب.
3. Ticket بين ولي الأمر والأكاديمية.
4. سجل للرسائل: recipient، template، status، actor، reason.
5. تصميم provider abstraction من البداية حتى نضيف WhatsApp دون تغيير domain model.
6. عدم إرسال bulk messages بلا consent أو opt-out.

عند إضافة WhatsApp:

- نستخدم templates للرسائل خارج customer-service context.
- نحتفظ بحالة القالب: `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `PAUSED`.
- نحتفظ بالـdelivery status والـfailure reason.
- نضع budget cap لكل أكاديمية.
- لا نعد العميل بأن القناة مجانية.

### F. R03 positive coaching note

هذه ميزة مفيدة للمنتج وليست مجرد comment box:

```text
Supervisor → Group/Session → Instructor → Note → Optional follow-up
```

الحالات المقترحة:

- `DRAFT`
- `VISIBLE_TO_INSTRUCTOR`
- `ACKNOWLEDGED`
- `ARCHIVED`

يجب أن يدعم:

- نصًا قصيرًا واضحًا.
- نوع الملاحظة: positive / follow-up / concern.
- صلاحية رؤية المدرب والمشرف ومدير الفرع فقط.
- عدم تعديل الملاحظة بعد acknowledgment بدون audit.
- عدم استخدام الميزة كبديل لتقييم رسمي أو عقوبة.

---

# Packaging والتسعير المقترح

لا أنصح بتثبيت أسعار نهائية قبل معرفة تكلفة onboarding، الدعم، الرسائل، والتخزين. لكن أنصح بثلاثة مستويات واضحة:

## الخطة الأساسية — Academy Core

للأكاديمية الصغيرة:

- فرع واحد أو عدد فروع محدود.
- عدد طلاب محدد.
- عدد staff محدد.
- students، groups، schedule، attendance، evaluations.
- basic invoices.
- import محدود.
- email/in-app notifications.

## الخطة النامية — Academy Growth

للأكاديمية التي لديها تشغيل حقيقي:

- فروع متعددة.
- staff وطلاب أكثر.
- R02/R03/R04/R05/R06/R07.
- leads وcampaign tracking.
- approvals.
- invoices/payments workflow.
- bulk import.
- reports.
- parent tickets.
- onboarding call أو migration assistance محدودة.

## الخطة المتقدمة — Academy Pro

تُفتح بعد إثبات الطلب:

- فروع كثيرة.
- custom roles.
- advanced reports.
- WhatsApp provider.
- payment gateway.
- branded parent experience.
- API/integrations.
- priority support.
- migration service.

## مقياس التسعير

أقترح اختبار مقياسين في الـpilot بدل اتخاذ قرار نهائي:

- **Primary:** active students وفق التعريف أعلاه.
- **Secondary:** branches، لأن عدد الفروع جزء صريح من الاشتراك.
- **Staff capacity:** الموظفون والمدربون يدخلون في حدود الخطة؛ أولياء الأمور والطلاب ليسوا staff seats.

لا نبدأ بتسعير يجمع الطلاب والموظفين والفروع والرسائل في فاتورة معقدة. العميل يريد أن يعرف: “أنا هدفع كام لما الأكاديمية تكبر؟”

يمكن الاحتفاظ بحدود داخلية لحماية التكلفة، لكن عرض السعر الخارجي يجب أن يكون بسيطًا.

## التجربة المجانية

نبدأ بـ:

- 14 يومًا أو 21 يومًا كتجربة أولية قابلة للاختبار.
- بلا بطاقة في البداية.
- بيانات حقيقية للأكاديمية مع عزل tenant وصلاحيات حقيقية.
- Import كامل أو batch onboarding متفق عليه، وليس Demo data فقط.
- للأكاديمية حرية تشغيل النظام خلال التجربة، ثم يبدأ الاشتراك بعد موافقة واضحة.
- إكمال أول flow داخل المنتج: إنشاء فرع → استيراد طلاب → إنشاء group → تعيين instructor → تسجيل حضور → إصدار invoice.
- إظهار progress checklist.
- عدم تحويل العميل تلقائيًا إلى مدفوع دون موافقة واضحة.

المدة ليست “حقيقة عالمية”؛ المنتجات تختلف من 7 أيام إلى 30 يومًا أو أكثر. Teachworks يوثق 21 يومًا، TutorCruncher أسبوعين، Classcard سبعة أيام بلا بطاقة، وJackrabbit ثلاثين يومًا [1] [2] [3] [5]. لذلك نختبر conversion بدل تقليد رقم.

---

# Payments: مسار عملي لمصر

في مرحلة الـMVP نسجل الدفع الخارجي فقط. عندما نبدأ الدفع الإلكتروني، نحتاج بوابة تدعم العملاء المصريين واشتراك Mada نفسه.

Paymob تعرض بطاقات، المحافظ، payment links، installment، kiosk payments، وتعرض على صفحتها سعرًا إرشاديًا قدره 2.75% + 3 جنيه لكل card charge؛ يجب اعتبار السعر مادة تجارية قابلة للتغيير وتأكيده مع الحساب الفعلي [9].

Fawry Accept توثق البطاقات، Fawry reference code، mobile wallets، installments، recurring payments، card tokenization، split payment، reconciliation، والتسجيل المحلي. هذه القدرات تجعلها مرشحًا قويًا للتحقق عندما نحتاج تحصيلًا محليًا واشتراكًا متكررًا، لكن القرار يجب أن يعتمد على العقد، التسوية، الـrefund، والدعم الفعلي [10].

الترتيب الصحيح:

1. Payment abstraction داخل Mada.
2. Fake/test provider.
3. تسجيل external payment يدويًا.
4. Provider واحد للأكاديميات بعد التحقق التجاري.
5. Provider/flow لولي الأمر.
6. Recurring billing لاشتراك Mada.
7. Reconciliation وwebhooks وrefund policy.

لا نخزن card details داخل Mada. لا نعتمد على screenshots كبديل عن webhook أو reconciliation.

---

# WhatsApp: القرار العملي

WhatsApp مناسب للسوق، لكنه ليس “مجانيًا تلقائيًا”. Meta تحاسب الرسائل المسلّمة حسب السوق وفئة الرسالة؛ service messages غير محاسبة، وبعض utility messages في سياق الرد لها معاملة مختلفة، بينما الأسعار تختلف حسب category/market [7].

التنفيذ المهني:

- Email وin-app أولًا.
- WhatsApp كـprovider مستقل.
- Templates للـattendance alerts، invoice ready، payment reminder، ticket update.
- opt-in وتسجيل consent.
- template approval workflow.
- delivery receipts.
- retry محدود.
- cost ledger لكل أكاديمية.
- منع التسويق الجماعي من قناة تشغيلية بدون consent.

لن نعتمد على SMS في البداية. إذا كان WhatsApp غير متاح أو مكلفًا، يظل النظام مفيدًا عبر email/in-app/tickets.

---

# ما نؤجله بوضوح

- WhatsApp production sending.
- Payment gateway الحقيقي.
- دفع الاشتراكات تلقائيًا.
- Private evidence storage production.
- Refunds المعقدة.
- SSO.
- Social publishing المباشر.
- Advanced marketing attribution.
- multi-country currencies/taxes.
- advanced LMS authoring.
- enterprise custom integrations.

هذه ليست نواقص في الرؤية؛ هي حماية للـMVP من التوسع المبكر.

---

# المقاييس التي يجب أن نتابعها من أول Pilot

## Activation

- نسبة الأكاديميات التي أكملت setup.
- الزمن من إنشاء الحساب إلى أول group.
- الزمن إلى أول attendance.
- الزمن إلى أول invoice.
- نسبة استيراد البيانات الناجح من أول محاولة.

## Usage

- عدد الأكاديميات النشطة أسبوعيًا.
- عدد الفروع النشطة.
- عدد الجروبات النشطة.
- نسبة الجلسات التي سجل لها حضور.
- نسبة التقييمات المنشورة.
- عدد tickets التي تم حلها.

## Business

- Trial-to-paid conversion.
- عدد الطلاب النشطين لكل أكاديمية.
- نسبة الأكاديميات التي تستخدم أكثر من role.
- churn خلال أول 90 يومًا.
- متوسط زمن الدعم/onboarding.
- تكلفة تشغيل الأكاديمية الواحدة.
- تكلفة الرسائل والـstorage لكل أكاديمية.

## North Star Metric المقترحة

> **عدد الجروبات النشطة التي أغلقت جلساتها بتسجيل حضور وتقييم خلال الأسبوع.**

هذا المقياس يربط القيمة الحقيقية لـMada بالتشغيل، وليس بعدد الحسابات المنشأة فقط.

---

# أسئلة ما زالت تحتاج قرارًا قبل التسعير النهائي

1. ما الحد الرقمي لكل خطة من active students والفروع والموظفين/المدربين؟
2. هل R02 وR06 وR07 متاحون في الخطة الأساسية أم Growth فقط؟
3. ما الحد الأقصى المقبول لمدة onboarding اليدوي من فريق Mada؟
4. هل الـticket بين ولي الأمر والأكاديمية يحتاج SLA وحالات تصعيد؟
5. هل leaderboard اختياري لكل أكاديمية أم جزء ثابت من المنتج؟
6. ما سياسة حذف بيانات الأكاديمية بعد انتهاء التجربة أو الاشتراك؟

# الخطوة التالية المقترحة

بعد تثبيت قرار R03 read-only، لا نبدأ بـWhatsApp أو الدفع الحقيقي. الخطوة التالية بدون تكلفة هي:

1. بناء **Bulk Import Contract**.
2. بناء **Trial/Academy Onboarding Flow**.
3. إنهاء **Invoice approval state machine** حسب R05/R02/R06.
4. إضافة **R03 Supervisor Notes**.
5. استكمال **Lead-to-enrollment workflow**.
6. إضافة **product analytics events** للـactivation والـNorth Star Metric.

هذه الخطوات تجعل النسخة المجانية قابلة للاستخدام، وتجهز architecture للمدفوعات وWhatsApp بدون دفع تكاليف الآن.

## تحديث التنفيذ — 11 أكتوبر 2026

تم تنفيذ أول جزء من الاتجاه الجديد: عند امتلاء الجروب يستطيع تحويل الـLead إلى طالب بتسجيل `WAITLISTED`، ويظل خارج مقياس Active Students، ولا تصدر له فاتورة تسجيل قبل توفر مكان. تظهر الحالة في Secretary Desk. ما زال تفعيل/ترقية التسجيل من `WAITLISTED` إلى `ACTIVE` جزءًا من الشريحة التالية.

---

## References

[1]: https://www.teachworks.com/pricing "Teachworks pricing"
[2]: https://tutorcruncher.com/pricing/gb "TutorCruncher pricing"
[3]: https://www.classcardapp.com/pricing "Classcard pricing"
[4]: https://www.classter.com/pricing/ "Classter pricing"
[5]: https://www.jackrabbitclass.com/pricing/ "Jackrabbit Class pricing"
[6]: https://moodle.com/products/workplace/ "Moodle Workplace"
[7]: https://whatsappbusiness.com/products/platform-pricing/ "WhatsApp Business Platform pricing"
[8]: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview "WhatsApp template fundamentals"
[9]: https://paymob.com/en/online-payment "Paymob online payment"
[10]: https://www.fawry.com/business/acceptance/online-checkout/ "Fawry Accept online checkout"

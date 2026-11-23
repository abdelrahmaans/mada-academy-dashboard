import { useCallback, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "ar";

export const messages = {
  en: {
    brand: "Mada",
    brandTagline: "Academy operations, made clear.",
    switchTo: "العربية",
    nav: { overview: "Overview", roles: "For every role", features: "Capabilities", pricing: "Pricing", faq: "FAQ" },
    headerCta: "Open Mada",
    hero: {
      eyebrow: "ACADEMY OPERATIONS OS",
      title: "Run every academy day from one clear view.",
      body: "Mada brings branches, students, schedules, attendance, and operational finance into one focused workspace—so your team can move with confidence.",
      primary: "See Mada in action",
      secondary: "Explore capabilities",
      login: "Open the live product",
      note: "Built for multi-branch academies",
      note2: "Clear roles. Protected data.",
      dashboard: "Executive overview",
      live: "Live and connected",
      students: "Active students",
      collected: "Collection rate",
      next: "Next session",
      branch: "North branch · 4:00 PM",
    },
    metrics: [
      ["-65%", "Less admin scheduling time", "Replace scattered sheets with one operating rhythm."],
      ["0%", "Treasury leakage", "Every receipt and operational payment stays traceable."],
      ["9 roles", "Purpose-built views", "Owners, managers, finance, instructors, and families."],
      ["99.9%", "Cloud-ready uptime", "Secure access for the workday, wherever your team is."],
    ],
    roles: {
      eyebrow: "DESIGNED AROUND YOUR TEAM",
      title: "One system. The right view for every role.",
      body: "Give each person the context they need—without exposing the work that does not belong to them.",
      items: [
        ["Owner", "See the whole operation", "Compare branches, revenue, capacity, and team performance from one live view."],
        ["Branch manager", "Keep the day moving", "Coordinate rooms, attendance, schedules, and local expenses without the noise."],
        ["Finance", "Make every number count", "Track receipts, collections, approvals, and instructor payouts with confidence."],
        ["Instructor", "Focus on teaching", "Record attendance, assessments, and notes from a fast mobile-friendly view."],
        ["Families", "Stay in the loop", "Give parents and students clear schedules, attendance, and progress updates."],
      ],
    },
    preview: {
      eyebrow: "LIVE OS SIMULATION",
      title: "A calmer command center for the day-to-day.",
      body: "Switch branches, review attendance, and spot the next decision without opening five different sheets.",
      open: "Open the live product",
      overview: "Executive overview",
      branches: "Branches",
      finance: "Collections",
      alerts: "Alerts",
      total: "Total students",
      attendance: "Average attendance",
      revenue: "Collected this month",
      status: "On track",
      branchNames: ["All branches", "Nasr City", "Maadi", "Zayed"],
    },
    features: {
      eyebrow: "CORE CAPABILITIES",
      title: "The operating foundation your academy can grow on.",
      body: "Mada replaces operational fragmentation with one structured, role-aware workspace.",
      items: [
        ["Branch control", "Run one location or a growing network with clean scopes, shared visibility, and a smooth branch switcher."],
        ["Student records", "Keep enrollment, groups, guardians, and academic history organized from first registration onward."],
        ["Schedules & attendance", "Prevent room conflicts and capture attendance quickly from desktop, tablet, or phone."],
        ["Progress tracking", "Use consistent assessments and useful reports to make student progress visible."],
        ["Operational finance", "Record collections, receipts, expenses, and approvals without pretending to be a payment gateway."],
        ["Scoped access", "Protect sensitive data with permissions that match each person’s actual responsibility."],
      ],
    },
    pricing: {
      eyebrow: "SIMPLE, TRANSPARENT PRICING",
      title: "Start focused. Grow without changing your foundation.",
      body: "Choose the operating scope that fits today, then move up when your academy is ready.",
      monthly: "Monthly",
      annual: "Annual",
      save: "Save 2 months",
      perMonth: "/ month",
      choose: "Talk through this plan",
      plans: [
        ["Launch", "For a focused single-branch operation", "From $49", ["One branch workspace", "Up to 150 active students", "Attendance and core records", "Operational finance basics"]],
        ["Growth", "For teams coordinating multiple branches", "From $95", ["Up to 3 branches", "Unlimited staff accounts", "Collections and approvals", "Instructor payout tracking", "Migration and onboarding support"]],
        ["Scale", "For larger networks with higher control needs", "Custom", ["Unlimited branches and students", "Dedicated workspace options", "Advanced audit visibility", "API and reporting support", "Priority account guidance"]],
      ],
    },
    workflow: {
      eyebrow: "A SIMPLE START",
      title: "From setup to a better operating rhythm.",
      steps: [["01", "Set your structure", "Add branches, rooms, teams, and access scopes."], ["02", "Bring in your data", "Add students, groups, and schedules in one organized place."], ["03", "Run the day", "Capture attendance, assessments, collections, and notes as work happens."], ["04", "See what matters", "Review clear reports and make the next decision with confidence."]],
    },
    faq: {
      eyebrow: "CLEAR ANSWERS",
      title: "Questions worth asking before you switch.",
      items: [["Can we import our current Excel data?", "Yes. Mada is designed to help teams organize existing student, group, and operational records during onboarding."], ["Does Mada process online payments?", "No. Mada records operational finance, collections, receipts, and approvals. It is not an online payment gateway."], ["Can each branch have different access?", "Yes. Roles and branch scopes are designed to keep people focused on the data they are responsible for."], ["Does it work on phones and tablets?", "Yes. The operational views are responsive, with quick attendance and review flows for mobile teams."], ["How do we get started?", "Open the live product for a direct look, or request a walkthrough and the team will help map your current workflow."]],
      contact: "Still have a question? Talk to an advisor",
    },
    demo: {
      eyebrow: "REQUEST A WALKTHROUGH",
      title: "See what a clearer operating day feels like.",
      body: "Tell us a little about your academy and we will follow up with a focused walkthrough.",
      name: "Full name", academy: "Academy name", email: "Work email", phone: "Phone", branches: "Branches", need: "Main operational priority", submit: "Request my walkthrough", sending: "Sending request…", success: "Request received", successBody: "Thanks. A Mada operations advisor will follow up shortly.", reset: "Send another request", required: "Required", branchOptions: ["1 branch", "2–3 branches", "4–10 branches", "10+ branches"], needOptions: ["Branch and schedule coordination", "Attendance and progress tracking", "Collections and operational finance", "Role-based access", "Something else"], privacy: "Your details are private and used only to coordinate this walkthrough.", error: "Please check the required fields and try again.",
    },
    footer: { body: "A focused operating system for academies that want clarity across every branch and every day.", product: "Product", company: "Company", contact: "Contact", login: "Product login", demo: "Request a walkthrough", rights: "© 2026 Mada. All rights reserved." },
  },
  ar: {
    brand: "مدى", brandTagline: "تشغيل الأكاديمية، بوضوح.", switchTo: "English",
    nav: { overview: "نظرة عامة", roles: "لكل دور", features: "القدرات", pricing: "الأسعار", faq: "الأسئلة الشائعة" }, headerCta: "افتح مدى",
    hero: { eyebrow: "نظام تشغيل الأكاديميات", title: "أدر كل يوم في أكاديميتك من رؤية واحدة واضحة.", body: "يجمع مدى الفروع والطلاب والجداول والحضور والعمليات المالية في مساحة عمل واحدة، لتتحرك فرقك بثقة ووضوح.", primary: "شاهد مدى أثناء العمل", secondary: "استكشف القدرات", login: "افتح النظام الفعلي", note: "مصمم للأكاديميات متعددة الفروع", note2: "أدوار واضحة. بيانات محمية.", dashboard: "نظرة تنفيذية", live: "مباشر ومترابط", students: "الطلاب النشطون", collected: "نسبة التحصيل", next: "الجلسة القادمة", branch: "فرع الشمال · 4:00 م" },
    metrics: [["-65%", "وقت أقل في جدولة الإدارة", "استبدل الجداول المتفرقة بإيقاع تشغيل واحد."], ["0%", "تسريب في الخزينة", "كل إيصال ومصروف تشغيلي قابل للتتبع."], ["9 أدوار", "شاشات مصممة لكل دور", "للمالك والمدير والمالية والمدرب والأسرة."], ["99.9%", "جاهزية سحابية", "وصول آمن لفريقك أينما يعمل."]],
    roles: { eyebrow: "مصمم حول فريقك", title: "نظام واحد. الرؤية المناسبة لكل دور.", body: "امنح كل شخص السياق الذي يحتاجه، من دون كشف ما لا يخصه.", items: [["المالك", "رؤية العملية كاملة", "قارن الفروع والإيرادات والطاقة وأداء الفريق من شاشة حية واحدة."], ["مدير الفرع", "حافظ على سير اليوم", "نسّق القاعات والحضور والجداول والمصروفات المحلية بلا تعقيد."], ["المالية", "اجعل كل رقم محسوباً", "تابع الإيصالات والتحصيلات والاعتمادات ومستحقات المدربين بثقة."], ["المدرب", "ركز على التعليم", "سجل الحضور والتقييمات والملاحظات من واجهة سريعة مناسبة للهاتف."], ["الأسرة", "ابقَ على اطلاع", "امنح أولياء الأمور والطلاب جداول واضحة ومتابعة للحضور والتقدم."]] },
    preview: { eyebrow: "محاكاة مباشرة للنظام", title: "مركز قيادة أهدأ للتشغيل اليومي.", body: "بدّل بين الفروع، راجع الحضور، واكتشف القرار التالي من دون فتح خمس جداول مختلفة.", open: "افتح النظام الفعلي", overview: "النظرة التنفيذية", branches: "الفروع", finance: "التحصيل", alerts: "التنبيهات", total: "إجمالي الطلاب", attendance: "متوسط الحضور", revenue: "التحصيل هذا الشهر", status: "على المسار", branchNames: ["كل الفروع", "مدينة نصر", "المعادي", "الشيخ زايد"] },
    features: { eyebrow: "القدرات الأساسية", title: "أساس تشغيلي تنمو عليه أكاديميتك.", body: "يستبدل مدى تشتت العمليات بمساحة عمل منظمة وواعية بالصلاحيات.", items: [["إدارة الفروع", "أدر فرعاً واحداً أو شبكة متنامية بصلاحيات واضحة ورؤية موحدة وتبديل سلس بين الفروع."], ["سجلات الطلاب", "نظم التسجيل والمجموعات وأولياء الأمور والسجل الأكاديمي من أول خطوة."], ["الجداول والحضور", "امنع تعارض القاعات وسجل الحضور بسرعة من الكمبيوتر أو التابلت أو الهاتف."], ["متابعة التقدم", "استخدم تقييمات متسقة وتقارير مفيدة لجعل تقدم الطالب واضحاً."], ["المالية التشغيلية", "سجل التحصيلات والإيصالات والمصروفات والاعتمادات من دون ادعاء أنه بوابة دفع."], ["صلاحيات محددة", "احمِ البيانات الحساسة بصلاحيات تطابق مسؤولية كل مستخدم."]] },
    pricing: { eyebrow: "أسعار بسيطة وواضحة", title: "ابدأ بتركيز، وانمُ دون تغيير أساسك.", body: "اختر نطاق التشغيل المناسب اليوم، وانتقل للخطة الأكبر عندما تصبح أكاديميتك جاهزة.", monthly: "شهري", annual: "سنوي", save: "وفر شهرين", perMonth: "/ شهرياً", choose: "ناقش هذه الخطة", plans: [["الانطلاق", "لتشغيل مركز بفرع واحد", "يبدأ من $49", ["مساحة عمل لفرع واحد", "حتى 150 طالباً نشطاً", "السجلات والحضور الأساسي", "أساسيات المالية التشغيلية"]], ["النمو", "لفرق تنسق عدة فروع", "يبدأ من $95", ["حتى 3 فروع", "حسابات موظفين غير محدودة", "التحصيل والاعتمادات", "متابعة مستحقات المدربين", "دعم النقل والتجهيز"]], ["التوسع", "للشبكات الأكبر واحتياجات التحكم", "مخصص", ["فروع وطلاب غير محدودين", "خيارات مساحة مخصصة", "رؤية تدقيق متقدمة", "دعم الربط والتقارير", "إرشاد أولوية للحساب"]]] },
    workflow: { eyebrow: "بداية بسيطة", title: "من الإعداد إلى إيقاع تشغيل أفضل.", steps: [["01", "اضبط الهيكل", "أضف الفروع والقاعات والفرق ونطاقات الوصول."], ["02", "أدخل بياناتك", "أضف الطلاب والمجموعات والجداول في مكان منظم."], ["03", "شغّل يومك", "سجل الحضور والتقييمات والتحصيلات والملاحظات أثناء العمل."], ["04", "رَ ما يهم", "راجع تقارير واضحة واتخذ القرار التالي بثقة."]] },
    faq: { eyebrow: "إجابات واضحة", title: "أسئلة مهمة قبل الانتقال.", items: [["هل يمكن استيراد بيانات Excel الحالية؟", "نعم. صُمم مدى لمساعدة الفرق على تنظيم سجلات الطلاب والمجموعات والعمليات الحالية أثناء التجهيز."], ["هل يعالج مدى المدفوعات الإلكترونية؟", "لا. يسجل مدى المالية التشغيلية والتحصيلات والإيصالات والاعتمادات، ولا يعمل كبوابة دفع إلكتروني."], ["هل يمكن تخصيص صلاحيات مختلفة لكل فرع؟", "نعم. الأدوار ونطاقات الفروع مصممة لإبقاء كل شخص مركزاً على البيانات التي تقع ضمن مسؤوليته."], ["هل يعمل على الهاتف والتابلت؟", "نعم. الواجهات متجاوبة وتوفر مسارات سريعة للحضور والمراجعة للفرق المتنقلة."], ["كيف نبدأ؟", "افتح النظام الفعلي لإلقاء نظرة مباشرة، أو اطلب جلسة تعريفية وسنساعدك في رسم سير العمل الحالي."]], contact: "لديك سؤال آخر؟ تحدث مع مستشار" },
    demo: { eyebrow: "اطلب جلسة تعريفية", title: "اكتشف كيف يبدو يوم تشغيل أكثر وضوحاً.", body: "أخبرنا قليلاً عن أكاديميتك وسنتواصل معك بجلسة تعريفية مركزة.", name: "الاسم الكامل", academy: "اسم الأكاديمية", email: "البريد الإلكتروني للعمل", phone: "رقم الهاتف", branches: "عدد الفروع", need: "الأولوية التشغيلية", submit: "اطلب جلستي التعريفية", sending: "جارٍ إرسال الطلب…", success: "تم استلام طلبك", successBody: "شكراً لك. سيتواصل معك مستشار عمليات مدى قريباً.", reset: "إرسال طلب آخر", required: "مطلوب", branchOptions: ["فرع واحد", "من 2 إلى 3 فروع", "من 4 إلى 10 فروع", "أكثر من 10 فروع"], needOptions: ["تنسيق الفروع والجداول", "متابعة الحضور والتقدم", "التحصيل والمالية التشغيلية", "الصلاحيات حسب الدور", "احتياج آخر"], privacy: "بياناتك سرية وتستخدم فقط لتنسيق الجلسة التعريفية.", error: "يرجى مراجعة الحقول المطلوبة والمحاولة مرة أخرى." },
    footer: { body: "نظام تشغيل مركز للأكاديميات التي تريد وضوحاً في كل فرع وكل يوم.", product: "المنتج", company: "الشركة", contact: "تواصل", login: "تسجيل دخول المنتج", demo: "اطلب جلسة تعريفية", rights: "© 2026 مدى. جميع الحقوق محفوظة." },
  },
} as const;

export type Copy = (typeof messages)[Locale];

export function useI18n() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ar";
    return window.localStorage.getItem("mada-locale") === "en" ? "en" : "ar";
  });
  const copy = useMemo(() => messages[locale], [locale]);
  const toggleLocale = useCallback(() => setLocale((current) => (current === "en" ? "ar" : "en")), []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("lang-ar", locale === "ar");
    document.body.classList.toggle("lang-en", locale === "en");
    document.title = locale === "ar" ? "مدى — تشغيل الأكاديميات بوضوح" : "Mada — Academy operations, made clear";
    document.querySelector('meta[name="description"]')?.setAttribute("content", locale === "ar" ? "مدى هو نظام تشغيل واضح لإدارة الأكاديميات وفروعها وفرقها." : "Mada is a clear operating system for academies, branches, and teams.");
    window.localStorage.setItem("mada-locale", locale);
  }, [locale]);
  return { locale, copy, toggleLocale };
}

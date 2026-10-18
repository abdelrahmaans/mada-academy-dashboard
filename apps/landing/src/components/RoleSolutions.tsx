import React, { useState } from 'react';
import { 
  Building2, 
  Receipt, 
  UserCheck, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  ArrowLeft, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  FileSpreadsheet,
  Wallet,
  CalendarCheck,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface RoleTab {
  id: string;
  title: string;
  subtitle: string;
  roleCode: string;
  icon: React.ElementType;
  tagline: string;
  description: string;
  beforeVsAfter: {
    before: string;
    after: string;
  };
  features: string[];
  metrics: {
    label: string;
    value: string;
  }[];
  mockup: {
    deskName: string;
    headerBadge: string;
    primaryStat: string;
    statSubtext: string;
    rows: {
      name: string;
      meta: string;
      status: string;
      statusClass: string;
    }[];
  };
}

const ROLES_DATA: RoleTab[] = [
  {
    id: 'owner',
    title: 'مالك الأكاديمية والمدير',
    subtitle: 'رؤية مركزية لكل الفروع',
    roleCode: 'R01 / R02',
    icon: Building2,
    tagline: 'قرارات مبنية على بيانات حية وليست توقعات شفوية',
    description: 'تحكم مركزي كامل في جميع الفروع، الإيرادات المجمعة، نسب إشغال القاعات، وأداء الطاقم التعليمي والإداري من شاشة واحدة لحظية.',
    beforeVsAfter: {
      before: 'الاتصال اليومي بالسكرتارية لمعرفة الدخل وجمع ملفات Excel مبعثرة لكل فرع.',
      after: 'لوحة قيادة مركزية توضح صافي الإيراد، نسبة التحصيل، ونشاط الفروع بنقرة واحدة.'
    },
    features: [
      'مقارنة أداء الفروع وحجم الاشتراكات الشهرية في رسم بياني موحد',
      'صلاحيات صارمة تضمن عدم اطلاع موظف فرع على بيانات الفروع الأخرى',
      'سجل تدقيق كامل (Audit Log) يسجل كل حركة مالية أو تعديل بيانات بالتاريخ والوقت',
      'تصدير كشوف الحساب والتقارير التنفيذية بصيغة Excel و PDF بضغطة زر'
    ],
    metrics: [
      { label: 'توفير في المتابعة اليومية', value: '-80%' },
      { label: 'دقة التقارير المالية', value: '100%' },
      { label: 'فروع في حساب واحد', value: 'غير محدود' }
    ],
    mockup: {
      deskName: 'لوحة القيادة التنفيذية للفرع الرئيسي',
      headerBadge: 'مباشر · 3 فروع نشطة',
      primaryStat: 'EGP 342,500',
      statSubtext: 'إجمالي الإيراد الشهري (+24% عن الشهر السابق)',
      rows: [
        { name: 'فرع مدينة نصر', meta: '420 طالب · 14 قاعة', status: 'إشغال 92%', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { name: 'فرع المعادي', meta: '290 طالب · 8 قاعات', status: 'إشغال 85%', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { name: 'فرع التجمع الخامس', meta: '360 طالب · 11 قاعة', status: 'إشغال 88%', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      ]
    }
  },
  {
    id: 'accountant',
    title: 'المحاسب وأمين الصندوق',
    subtitle: 'انضباط الخزينة والإيصالات',
    roleCode: 'R06 Accountant',
    icon: Receipt,
    tagline: 'صفر عجز في الخزينة ومطابقة إلكترونية لكل مليم',
    description: 'دورة مالية مغلقة تحمي الأكاديمية من التسريب المالي؛ ربط كل قسط بإيصال تحويل أو سند قبض رسمي لا يقبل التعديل العشوائي.',
    beforeVsAfter: {
      before: 'فقدان إيصالات التحويل البنكي وتراكم الديون على الطلاب دون إنذارات واضحة.',
      after: 'أرشفة سحابية فورية لكل إيصال دفع، ومطابقة يومية لرصيد الخزينة بنقرة واحدة.'
    },
    features: [
      'اعتماد إيصالات الدفع والتحويلات المصرفية مع فحص المستند المرفق (PDF/صور)',
      'سندات قبض وصرف مرقمة تلقائياً وتمنع التلاعب المالي',
      'متابعة المتأخرات والأقساط المستحقة وتنبيه السكرتارية والطلاب آلياً',
      'حساب رواتب ونسب المدربين تلقائياً بناءً على الحصص الفعلية المنفذة'
    ],
    metrics: [
      { label: 'تسريب مالي في الخزائن', value: '0%' },
      { label: 'وقت تسوية الحسابات', value: '-70%' },
      { label: 'دقة احتساب الرواتب', value: '100%' }
    ],
    mockup: {
      deskName: 'مكتب الإدارة المالية والخزينة',
      headerBadge: 'سندات اليوم · 28 عملية',
      primaryStat: 'EGP 48,200',
      statSubtext: 'متحصلات الخزينة اليوم (مطابقة للرصيد الفعلي)',
      rows: [
        { name: 'سند قبض #REC-4821', meta: 'سداد قسط دبلومة البرمجة · أنس إبراهيم', status: 'معتمد ومؤرشف', statusClass: 'bg-teal-50 text-teal-700 border-teal-200' },
        { name: 'تحويل بنكي فودافون كاش', meta: 'إيصال دفع #VOD-9201 · فرع نصر', status: 'بانتظار المراجعة', statusClass: 'bg-amber-50 text-amber-700 border-amber-200' },
        { name: 'إذن صرف أجر مدرب', meta: 'د. سامي مراد · 12 ساعة معتمدة', status: 'تم الصرف', statusClass: 'bg-slate-100 text-slate-700 border-slate-200' }
      ]
    }
  },
  {
    id: 'secretary',
    title: 'موظف الاستقبال والسكرتارية',
    subtitle: 'سرعة التسجيل وخدمة العملاء',
    roleCode: 'R05 Secretary',
    icon: UserCheck,
    tagline: 'تسجيل الطلاب وتوزيع المجموعات في 30 ثانية',
    description: 'واجهة سريعة مصممة لضغط الاستقبال اليومي؛ تسكين الطلاب في المجموعات المناسبة، إصدار أرقام القيد، وإدارة قوائم الانتظار بسلاسة.',
    beforeVsAfter: {
      before: 'طوابير تسجيل وازدحام وتكرار تسجيل نفس الطالب في مجموعات متضاربة.',
      after: 'واجهة إدخال ذكية تكشف تضارب المواعيد والقاعات وتصدر كارنيه القيد فوراً.'
    },
    features: [
      'تسجيل بيانات الطالب والربط التلقائي بولي الأمر في استمارة واحدة',
      'منع التضارب بين جداول الطلاب والقاعات الدراسية تلقائياً',
      'إدارة قوائم الانتظار (Waitlist) والتصعيد التلقائي عند شغر مقعد',
      'طباعة بطاقات القيد والكارنيهات مع QR Code للتحقق السريع'
    ],
    metrics: [
      { label: 'سرعة تسجيل الطالب الجديد', value: '30 ثانية' },
      { label: 'أخطاء تضارب القاعات', value: '0%' },
      { label: 'رضا أولياء الأمور الجدد', value: '98%' }
    ],
    mockup: {
      deskName: 'مكتب الاستقبال وشؤون الطلاب',
      headerBadge: 'تسجيل الفوج الصيفي · نشط',
      primaryStat: '48 طالب جديد',
      statSubtext: 'تم تسكينهم اليوم في 6 مسارات تعليمية',
      rows: [
        { name: 'مريم طارق العوضي', meta: 'مستوى تأسيس اللغات · القاعة B2', status: 'تم التسكين والكارنيه', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { name: 'عمر خالد الدسوقي', meta: 'كورس الذكاء الاصطناعي · مجموعة الأحد', status: 'قائمة انتظار #1', statusClass: 'bg-purple-50 text-purple-700 border-purple-200' },
        { name: 'ياسين أحمد رضوان', meta: 'تجديد اشتراك شهري · فرع المعادي', status: 'تم التجديد', statusClass: 'bg-teal-50 text-teal-700 border-teal-200' }
      ]
    }
  },
  {
    id: 'instructor',
    title: 'المدرب ورئيس القسم',
    subtitle: 'حضور ودرجات بدون أوراق',
    roleCode: 'R03 / R04',
    icon: GraduationCap,
    tagline: 'التركيز على التدريس وترك الروتين الإداري للسيستم',
    description: 'مسرد رقمي للمدرب يتيح رصد الحضور بنقرة زر، تقييم مستوى الطلاب، تسجيل ملحوظات الأداء، ومتابعة ساعات العمل وحساب الأجر بدقة.',
    beforeVsAfter: {
      before: 'كشوف حضور ورقية مفقودة وضياع أجر الحصص الإضافية لعدم توثيقها.',
      after: 'رصد فوري من الهاتف أو التابلت وحساب فوري لساعات العمل ونسب المدرب.'
    },
    features: [
      'رصد حضور وغياب الطلاب بنقرة واحدة مع إرسال إشعار فوري لولي الأمر',
      'إدخال نتائج الاختبارات الدورية والواجبات مع تعليق تربوي وتوجيهي',
      'جدول أسبوعي تفاعلي يوضح القاعات وأوقات الحصص وتفاصيل المجموعات',
      'كشف حساب مستحقات المدرب الشفاف يوضح كل حصة تم تنفيذها'
    ],
    metrics: [
      { label: 'وقت رصد الحضور للحصة', value: '15 ثانية' },
      { label: 'استغناء كامل عن الورق', value: '100%' },
      { label: 'شفافية حساب الساعات', value: '100%' }
    ],
    mockup: {
      deskName: 'بوابة المحاضر والمدرب',
      headerBadge: 'الحصة الحالية · قاعة 4A',
      primaryStat: '18 / 20 حاضر',
      statSubtext: 'محاضرة الخوارزميات والهياكل (الأحد 04:00 م)',
      rows: [
        { name: 'كشف درجات الاختبار النصفي', meta: '24 طالب · متوسط الدرجات 88%', status: 'تم الاعتماد وإرسال التقرير', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { name: 'غياب بدون إذن', meta: 'الطالب: زياد حسام · تم إشعار ولي الأمر', status: 'تنبيه آلي مرسل', statusClass: 'bg-rose-50 text-rose-700 border-rose-200' },
        { name: 'ساعات العمل المعتمدة هذا الشهر', meta: '44 ساعة تدريبية موثقة', status: 'EGP 13,200 مستحق', statusClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
      ]
    }
  },
  {
    id: 'parent',
    title: 'الطالب وولي الأمر',
    subtitle: 'متابعة لحظية وثقة مطلقة',
    roleCode: 'R08 / R09',
    icon: Users,
    tagline: 'ولي الأمر شريك دائم في مسيرة نجاح أبنائه',
    description: 'بوابة سهلة وبسيطة تتيح لولي الأمر متابعة حضور ودرجات ومواعيد جميع أبنائه في شاشة واحدة، وسداد الأقساط أونلاين بدون عناء.',
    beforeVsAfter: {
      before: 'السؤال المتكرر عبر الهاتف والواتساب عن مواعيد الحصص ومستوى الطالب.',
      after: 'إشعارات لحظية بالحضور وتقرير دوري للدرجات وسندات السداد من الهاتف.'
    },
    features: [
      'حساب موحد لولي الأمر يجمع كل أبنائه حتى لو كانوا في فروع أو مراحل مختلفة',
      'كشف الحضور والغياب اليومي مع توقيت الدخول والخروج بدقة',
      'تقارير درجات واختبارات تفاعلية توضح نقاط القوة ونقاط التحسين',
      'جدول الحصص القادمة وروابط البث أو موقع القاعة على الخريطة'
    ],
    metrics: [
      { label: 'مكالمات استفسار وتأكيد', value: '-85%' },
      { label: 'التزام الطلاب بالحضور', value: '+40%' },
      { label: 'سهولة الاستخدام للأهل', value: 'بسيط 100%' }
    ],
    mockup: {
      deskName: 'بوابة ولي الأمر (تطبيق الجوال)',
      headerBadge: 'الأبناء المسجلين · 2 طلاب',
      primaryStat: 'نسبة الحضور 96%',
      statSubtext: 'أداء متميز للفصل الدراسي الأول',
      rows: [
        { name: 'نور الدين أحمد (الصف الثاني)', meta: 'حضور اليوم في الموعد · تقييم ممتاز', status: 'حاضر ✓', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { name: 'حبيبة أحمد (دبلومة الروبوتات)', meta: 'قسط شهر نوفمبر مستحق خلال 5 أيام', status: 'إشعار سداد متاح', statusClass: 'bg-amber-50 text-amber-700 border-amber-200' },
        { name: 'تقرير التقييم الشهري الجديد', meta: 'تقييم المدرب: تقدم ملحوظ في المشاركة', status: 'عرض التقرير', statusClass: 'bg-teal-50 text-teal-700 border-teal-200' }
      ]
    }
  }
];

export const RoleSolutions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('owner');
  const activeRole = ROLES_DATA.find((r) => r.id === activeTab) || ROLES_DATA[0];
  const IconComponent = activeRole.icon;

  return (
    <section id="roles" className="py-20 lg:py-28 bg-[#F4F7FA] border-b border-[#14243A]/10 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#14243A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-xs font-bold text-[#0D9488]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>حلول مفصلة لكل فرد في منظومتك</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14243A] tracking-tight">
            نظام واحد، شاشات مخصصة <br />
            لكل دور في الأكاديمية
          </h2>
          <p className="text-base sm:text-lg text-[#14243A]/70 leading-relaxed font-normal">
            صُمم "مدى أكاديمي" ليفهم طبيعة مهام كل شخص؛ فلا يرى المحاسب شاشات التدريس، ولا يتشتت المدرب بالماليات، ويحصل المالك على الصورة الكاملة لحظياً.
          </p>
        </div>

        {/* Roles Tab Selector Buttons */}
        <div className="flex items-center justify-start lg:justify-center gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-10">
          {ROLES_DATA.map((role) => {
            const TabIcon = role.icon;
            const isActive = activeTab === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setActiveTab(role.id)}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#14243A] text-white border-[#14243A] shadow-md shadow-[#14243A]/15 scale-[1.02]'
                    : 'bg-white text-[#14243A]/75 border-[#14243A]/10 hover:bg-white hover:text-[#14243A] hover:border-[#14243A]/25'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-[#0D9488]' : 'text-[#14243A]/50'}`} />
                <span>{role.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-white/15 text-teal-300' : 'bg-[#14243A]/5 text-[#14243A]/60'
                }`}>
                  {role.roleCode}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Role Content Card */}
        <div className="bg-white rounded-3xl border border-[#14243A]/10 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 p-6 sm:p-10 lg:p-12 items-center">
            
            {/* Right Column (in RTL): Copy, Value Props, and Metrics */}
            <div className="lg:col-span-6 space-y-6 text-right">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center font-bold">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0D9488] uppercase tracking-wider font-mono">
                    {activeRole.roleCode}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#14243A]">
                    {activeRole.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#14243A]/10 space-y-2">
                <div className="text-xs font-bold text-[#14243A]/50 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>التحول التشغيلي المباشر</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-rose-50/70 border border-rose-200/60 p-2.5 rounded-xl text-rose-900">
                    <span className="font-bold block text-rose-700 mb-0.5">قبل مدى:</span>
                    {activeRole.beforeVsAfter.before}
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200/60 p-2.5 rounded-xl text-emerald-900">
                    <span className="font-bold block text-emerald-700 mb-0.5">مع مدى:</span>
                    {activeRole.beforeVsAfter.after}
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#14243A]/75 leading-relaxed font-normal">
                {activeRole.description}
              </p>

              {/* Feature Points */}
              <div className="space-y-3 pt-2">
                {activeRole.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#14243A]/85">
                    <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Quantitative Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#14243A]/10">
                {activeRole.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-[#F8FAFC] p-3 rounded-xl border border-[#14243A]/5 text-center">
                    <div className="text-lg sm:text-xl font-black text-[#14243A] font-mono">
                      {metric.value}
                    </div>
                    <div className="text-[11px] font-medium text-[#14243A]/60 mt-0.5">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Left Column (in RTL): Ultra Realistic UI Mockup Card */}
            <div className="lg:col-span-6">
              <div className="bg-[#14243A] rounded-2xl p-4 sm:p-6 text-white shadow-2xl border border-white/10 relative overflow-hidden">
                
                {/* Mockup Top Window Bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="text-xs font-mono text-white/60 flex items-center gap-2">
                    <span>{activeRole.mockup.deskName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-ping" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0D9488]/20 text-teal-300 border border-[#0D9488]/30">
                    {activeRole.mockup.headerBadge}
                  </span>
                </div>

                {/* Primary Metric Showcase in Mockup */}
                <div className="bg-white/5 rounded-xl p-4 mb-5 border border-white/10">
                  <div className="text-xs text-white/60 mb-1 font-medium">المؤشر الرئيسي الآن</div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {activeRole.mockup.primaryStat}
                  </div>
                  <div className="text-xs text-teal-300/90 mt-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{activeRole.mockup.statSubtext}</span>
                  </div>
                </div>

                {/* Live Activity Rows */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider font-mono">
                    سجلات المعاملات الحية
                  </div>
                  {activeRole.mockup.rows.map((row, idx) => (
                    <div 
                      key={idx}
                      className="bg-white/95 rounded-xl p-3.5 flex items-center justify-between gap-3 text-right text-[#14243A] shadow-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs sm:text-sm font-bold text-[#14243A]">
                          {row.name}
                        </div>
                        <div className="text-[11px] text-[#14243A]/60">
                          {row.meta}
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${row.statusClass}`}>
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Trust Stamp */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>صلاحية وصول مشفرة (JWT + Role RBAC)</span>
                  </div>
                  <span className="font-mono text-teal-300">v2.4 Live</span>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

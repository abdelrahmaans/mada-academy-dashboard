import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ArrowLeft, 
  Building2, 
  Zap, 
  Headphones, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';

type Currency = 'EGP' | 'SAR' | 'USD';

interface PlanPricing {
  monthly: number;
  annualMonthly: number;
  formatted: {
    monthly: string;
    annual: string;
    currencySymbol: string;
  };
}

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  isPopular?: boolean;
  pricing: Record<Currency, PlanPricing>;
  features: {
    text: string;
    included: boolean;
    highlight?: boolean;
  }[];
  ctaText: string;
  ctaSubtext: string;
  customPricing?: boolean;
}

const PLANS_DATA: Plan[] = [
  {
    id: 'starter',
    name: 'الانطلاق',
    subtitle: 'للأكاديميات الصغيرة التي تبدأ بفرع واحد وتحتاج أساساً منظماً لإدارة الطلاب والحضور والتحصيل',
    badge: 'للأكاديميات الصغيرة',
    pricing: {
      EGP: {
        monthly: 950,
        annualMonthly: 760,
        formatted: { monthly: '950', annual: '760', currencySymbol: 'ج.م' }
      },
      SAR: {
        monthly: 180,
        annualMonthly: 145,
        formatted: { monthly: '180', annual: '145', currencySymbol: 'ر.س' }
      },
      USD: {
        monthly: 49,
        annualMonthly: 39,
        formatted: { monthly: '49', annual: '39', currencySymbol: '$' }
      }
    },
    features: [
      { text: 'حتى 200 طالب نشط', included: true, highlight: true },
      { text: 'فرع واحد وحتى 4 قاعات تدريسية', included: true },
      { text: '5 حسابات للفريق من موظفين ومدربين', included: true },
      { text: 'إدارة بيانات الطلاب والمجموعات', included: true },
      { text: 'تسجيل الحضور والغياب والدرجات', included: true },
      { text: 'سندات قبض وصرف أساسية', included: true },
      { text: 'تصدير بيانات الطلاب والتقارير إلى Excel', included: true },
      { text: 'بوابة الطالب وولي الأمر', included: false },
      { text: 'أرشفة إيصالات التحويلات والمستندات', included: false },
      { text: 'احتساب رواتب ونسب المدربين آلياً', included: false },
      { text: 'إدارة أكثر من فرع في حساب موحّد', included: false }
    ],
    ctaText: 'ابدأ بالباقة الأساسية',
    ctaSubtext: 'اشتراك مرن لفريقك الصغير — وترقية سهلة عند التوسع'
  },
  {
    id: 'growth',
    name: 'النمو',
    subtitle: 'للأكاديميات التي تدير أكثر من فريق أو فرع وتحتاج تشغيلًا موحدًا وقرارات مبنية على بيانات',
    badge: 'الأكثر طلباً — موصى بها',
    isPopular: true,
    pricing: {
      EGP: {
        monthly: 2400,
        annualMonthly: 1900,
        formatted: { monthly: '2,400', annual: '1,900', currencySymbol: 'ج.م' }
      },
      SAR: {
        monthly: 450,
        annualMonthly: 360,
        formatted: { monthly: '450', annual: '360', currencySymbol: 'ر.س' }
      },
      USD: {
        monthly: 119,
        annualMonthly: 95,
        formatted: { monthly: '119', annual: '95', currencySymbol: '$' }
      }
    },
    features: [
      { text: 'حتى 750 طالباً نشطاً', included: true, highlight: true },
      { text: 'حتى 3 فروع في حساب موحّد', included: true, highlight: true },
      { text: 'حسابات متعددة للموظفين والمدربين', included: true },
      { text: 'بوابة مستقلة للطالب وولي الأمر', included: true, highlight: true },
      { text: 'اعتماد وأرشفة الإيصالات والتحويلات', included: true, highlight: true },
      { text: 'احتساب رواتب ونسب وساعات المدربين آلياً', included: true },
      { text: 'منع تعارض الجداول والقاعات', included: true },
      { text: 'إشعارات الحصص والأقساط المستحقة', included: true },
      { text: 'جلسة تهيئة مباشرة لفريق العمل', included: true, highlight: true },
      { text: 'نقل بيانات الطلاب من Excel مرة واحدة', included: true }
    ],
    ctaText: 'ابدأ تجربة النمو 14 يوماً',
    ctaSubtext: '14 يوماً مجاناً بدون بطاقة — اختر الاستمرار أو الباقة المناسبة بعدها'
  },
  {
    id: 'enterprise',
    name: 'المؤسسات',
    subtitle: 'للشبكات والمؤسسات التي تحتاج توسعاً كبيراً وربطاً مخصصاً وأعلى مستوى من الدعم والأمان',
    badge: 'للتوسع المؤسسي',
    pricing: {
      EGP: {
        monthly: 5900,
        annualMonthly: 4700,
        formatted: { monthly: '5,900', annual: '4,700', currencySymbol: 'ج.م' }
      },
      SAR: {
        monthly: 1100,
        annualMonthly: 890,
        formatted: { monthly: '1,100', annual: '890', currencySymbol: 'ر.س' }
      },
      USD: {
        monthly: 299,
        annualMonthly: 239,
        formatted: { monthly: '299', annual: '239', currencySymbol: '$' }
      }
    },
    features: [
      { text: 'طلاب ومدربون حسب حجم المؤسسة', included: true, highlight: true },
      { text: 'فروع وقاعات قابلة للتوسع حسب الاتفاق', included: true, highlight: true },
      { text: 'نطاق ودومين خاص باسم الأكاديمية', included: true, highlight: true },
      { text: 'بيئة استضافة مخصصة ومعزولة', included: true },
      { text: 'ربط API مع أنظمة ERP والفوترة', included: true },
      { text: 'سجل تدقيق وأمان متقدم', included: true },
      { text: 'مدير حساب ودعم أولوية', included: true },
      { text: 'اتفاقية مستوى خدمة وتقارير مخصصة', included: true },
      { text: 'نسخ احتياطي واسترجاع مخصصان', included: true },
      { text: 'تخصيص الشعار والألوان والتقارير', included: true }
    ],
    ctaText: 'تحدث مع مستشار مدى',
    ctaSubtext: 'سعر مخصص حسب عدد الفروع والربط المطلوب',
    customPricing: true
  }
];

interface PricingSectionProps {
  onSelectPlan?: (planId: string) => void;
  onScrollToDemo: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan, onScrollToDemo }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<Currency>('EGP');
  const [showComparison, setShowComparison] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);

  const handleChoosePlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
    onScrollToDemo();
  };

  const togglePlanFeatures = (planId: string) => {
    setExpandedPlans((current) => (
      current.includes(planId)
        ? current.filter((id) => id !== planId)
        : [...current, planId]
    ));
  };

  return (
    <section id="pricing" dir="rtl" className="py-20 lg:py-28 bg-white border-b border-[#14243A]/10 relative overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#0D9488]/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-xs font-bold text-[#0D9488]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خطط واضحة لكل مرحلة من مراحل نمو أكاديميتك</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14243A] tracking-tight">
            ابدأ بالحجم المناسب <br />
            وتوسّع بدون إعادة بناء نظامك
          </h2>

          <p className="text-base sm:text-lg text-[#14243A]/70 leading-relaxed font-normal">
            ادفع مقابل ما تحتاجه اليوم، ثم انتقل إلى إمكانات أوسع عندما تكبر الأكاديمية. الأسعار واضحة، والترقية سهلة، ولا توجد رسوم تأسيس.
          </p>

          {/* Currency Selector */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-xs font-bold text-[#14243A]/60 ml-2">العملة:</span>
            {(['EGP', 'SAR', 'USD'] as Currency[]).map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  currency === cur
                    ? 'bg-[#14243A] text-white border-[#14243A] shadow-xs'
                    : 'bg-white text-[#14243A]/70 border-[#14243A]/15 hover:bg-[#F8FAFC]'
                }`}
              >
                {cur === 'EGP' ? 'جنيه مصري (EGP)' : cur === 'SAR' ? 'ريال سعودي (SAR)' : 'دولار أمريكي (USD)'}
              </button>
            ))}
          </div>

          {/* Billing Switch: Monthly vs Annual */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="bg-[#F4F7FA] p-1.5 rounded-2xl border border-[#14243A]/10 inline-flex items-center gap-2">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  !isAnnual 
                    ? 'bg-white text-[#14243A] shadow-sm' 
                    : 'text-[#14243A]/60 hover:text-[#14243A]'
                }`}
              >
                الدفع الشهري
              </button>

              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  isAnnual 
                    ? 'bg-[#0D9488] text-white shadow-sm' 
                    : 'text-[#14243A]/60 hover:text-[#14243A]'
                }`}
              >
                <span>الدفع السنوي</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isAnnual ? 'bg-white text-[#0D9488]' : 'bg-[#0D9488]/15 text-[#0D9488]'
                }`}>
                  وفّر قيمة شهرين (20%)
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {PLANS_DATA.map((plan) => {
            const priceInfo = plan.pricing[currency];
            const currentPrice = isAnnual ? priceInfo.formatted.annual : priceInfo.formatted.monthly;
            const includedFeatures = plan.features.filter((feature) => feature.included);
            const excludedFeatures = plan.features.filter((feature) => !feature.included);
            const isExpanded = expandedPlans.includes(plan.id);
            const visibleFeatures = isExpanded ? includedFeatures : includedFeatures.slice(0, 7);
            const hiddenFeatureCount = includedFeatures.length - visibleFeatures.length;

            return (
              <div
                key={plan.id}
                className={`relative h-full rounded-3xl p-6 sm:p-8 flex flex-col transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-white border-2 border-[#0D9488] shadow-2xl shadow-[#0D9488]/15 lg:-translate-y-2'
                    : 'bg-[#F8FAFC] border border-[#14243A]/10 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular Pill */}
                {plan.badge && (
                  <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-[#0D9488] text-white text-xs font-black shadow-sm tracking-wide">
                    {plan.badge}
                  </div>
                )}

                <div>
                  {/* Plan Name & Target */}
                  <div className="text-right space-y-2 pb-6 border-b border-[#14243A]/10">
                    <h3 className="text-2xl font-black text-[#14243A]">
                      {plan.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed min-h-[40px]">
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="py-6 text-right">
                    <div className={`flex items-baseline gap-2 ${plan.customPricing ? 'items-center' : ''}`}>
                      <span className={`${plan.customPricing ? 'text-3xl sm:text-4xl leading-tight' : 'text-4xl sm:text-5xl'} font-black text-[#14243A] ${plan.customPricing ? '' : 'font-mono'} tracking-tight`}>
                        {plan.customPricing ? 'حسب الاحتياج' : currentPrice}
                      </span>
                      {!plan.customPricing && (
                        <span className="text-sm font-bold text-[#14243A]/60">
                          {priceInfo.formatted.currencySymbol} / شهرياً
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#14243A]/50 mt-1.5 font-medium">
                      {plan.customPricing
                        ? 'نحدد السعر بعد معرفة عدد الفروع واحتياجات التشغيل والربط'
                        : isAnnual
                          ? 'يتم السداد سنوياً مع توفير قيمة شهرين'
                          : 'اشتراك شهري مرن، يمكنك الإلغاء في أي وقت'}
                    </div>
                    {plan.id === 'growth' && (
                      <div className="inline-flex mt-3 items-center rounded-full bg-[#0D9488]/10 px-3 py-1 text-[11px] font-black text-[#0D9488] text-right">
                        تجربة مجانية 14 يوماً بدون بطاقة — لا يبدأ أي اشتراك تلقائياً
                      </div>
                    )}
                  </div>

                  {/* Feature List */}
                  <div className="flex-1 space-y-3.5 py-4 text-right">
                    <div className="text-xs font-bold text-[#14243A]/60 uppercase tracking-wider mb-2">
                      المزايا المتاحة في هذه الباقة:
                    </div>

                    {visibleFeatures.map((feat, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed ${feat.highlight ? 'font-bold text-[#14243A]' : 'text-[#14243A]/85'}`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <div className="w-4 h-4 rounded-full bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                        <span>{feat.text}</span>
                      </div>
                    ))}

                    {(hiddenFeatureCount > 0 || (isExpanded && excludedFeatures.length > 0)) && (
                      <div className="mt-5 pt-4 border-t border-[#14243A]/10">
                        {hiddenFeatureCount > 0 && !isExpanded && (
                          <p className="text-[11px] text-[#14243A]/45">
                            + {hiddenFeatureCount} مزايا إضافية مشمولة في هذه الباقة
                          </p>
                        )}
                        {isExpanded && excludedFeatures.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-[#14243A]/45 mb-2">
                              مزايا متاحة عند الترقية:
                            </div>
                            <div className="space-y-2">
                              {excludedFeatures.map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed text-[#14243A]/45">
                                  <span className="mt-0.5 shrink-0">—</span>
                                  <span>{feat.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(includedFeatures.length > 7 || excludedFeatures.length > 0) && (
                      <button
                        type="button"
                        onClick={() => togglePlanFeatures(plan.id)}
                        className="mt-3 text-xs font-bold text-[#0D9488] hover:text-[#0B7D72] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]/40 rounded-md"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? 'إخفاء التفاصيل' : 'عرض كل مزايا الباقة'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-8 text-center space-y-2">
                  <button
                    onClick={() => handleChoosePlan(plan.id)}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 ${
                      plan.isPopular
                        ? 'bg-[#0D9488] hover:bg-[#0B7D72] text-white shadow-[#0D9488]/25'
                        : 'bg-[#14243A] hover:bg-[#1C3250] text-white'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-[#14243A]/55">
                    {plan.ctaSubtext}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Confidence & Guarantees Banner (TutorBird Style) */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-[#F8FAFC] border border-[#14243A]/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
            
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#14243A]">ابدأ بدون رسوم تأسيس</h4>
                <p className="text-xs text-[#14243A]/65 leading-relaxed">
                  لا تدفع أي رسوم لإعداد الحساب. ابدأ بالبيانات الأساسية، ثم أضف ما تحتاجه مع نمو فريقك وفروعك.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#14243A]">مساعدة في نقل البيانات</h4>
                <p className="text-xs text-[#14243A]/65 leading-relaxed">
                  نقل بيانات الطلاب من Excel متاح ضمن باقة النمو، حتى يبدأ فريقك على نظام مرتب من اليوم الأول.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#14243A]">تهيئة ودعم واضح</h4>
                <p className="text-xs text-[#14243A]/65 leading-relaxed">
                  جلسة تهيئة لفريق العمل في باقة النمو، مع قنوات دعم تساعدك على تشغيل النظام بثقة.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Comparison Accordion Toggle */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#14243A]/80 hover:text-[#0D9488] py-2 px-4 rounded-xl hover:bg-[#F4F7FA] transition-all"
          >
            <span>{showComparison ? 'إخفاء مقارنة الباقات' : 'قارن الباقات بالتفصيل قبل الاختيار'}</span>
            {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Full Comparison Table */}
        {showComparison && (
          <div className="mt-6 bg-white rounded-3xl border border-[#14243A]/10 shadow-lg overflow-x-auto text-right">
            <table className="w-full text-xs sm:text-sm min-w-[650px]">
              <thead>
                <tr className="bg-[#14243A] text-white">
                  <th className="py-4 px-6 text-right font-bold">الميزة والمواصفة</th>
                  <th className="py-4 px-4 text-center font-bold">الانطلاق</th>
                  <th className="py-4 px-4 text-center font-bold text-teal-300">النمو ★</th>
                  <th className="py-4 px-4 text-center font-bold">المؤسسات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14243A]/10 text-[#14243A]/80">
                <tr>
                  <td className="py-3.5 px-6 font-semibold">عدد الطلاب النشطين المسموح به</td>
                  <td className="py-3.5 px-4 text-center font-mono">200 طالب</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0D9488]">750 طالباً</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold">حسب الاتفاق</td>
                </tr>
                <tr className="bg-[#F8FAFC]">
                  <td className="py-3.5 px-6 font-semibold">عدد الفروع المدارة في حساب واحد</td>
                  <td className="py-3.5 px-4 text-center font-mono">فرع واحد</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0D9488]">حتى 3 فروع</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold">قابل للتوسع</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold">بوابات الطالب وولي الأمر</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕ غير متاحة</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ مشمولة</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ مشمولة مع تخصيص</td>
                </tr>
                <tr className="bg-[#F8FAFC]">
                  <td className="py-3.5 px-6 font-semibold">أرشفة إيصالات التحويل البنكي وسندات القبض</td>
                  <td className="py-3.5 px-4 text-center">سندات أساسية</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ أرشفة مستندات وصور</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ حسب الباقة المخصصة</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold">حساب رواتب وحصص المدربين التلقائي</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ مشمول آلياً</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ حسب نطاق المشروع</td>
                </tr>
                <tr className="bg-[#F8FAFC]">
                  <td className="py-3.5 px-6 font-semibold">تخصيص دومين ونطاق خاص (Custom Domain)</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕ (متاح كإضافة)</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ ضمن العرض المخصص</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold">نوع الدعم الفني وسرعة الاستجابة</td>
                  <td className="py-3.5 px-4 text-center">بريد + واتساب عادي</td>
                  <td className="py-3.5 px-4 text-center text-[#0D9488] font-bold">أولوية عالية ومكالمات</td>
                  <td className="py-3.5 px-4 text-center font-bold">مدير حساب ودعم أولوية</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </section>
  );
};

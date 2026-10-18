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
}

const PLANS_DATA: Plan[] = [
  {
    id: 'starter',
    name: 'الانطلاق (Starter)',
    subtitle: 'للمراكز الناشئة والمعلمين المستقلين لبدء التشغيل المنظم فوراً',
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
      { text: 'حتى 150 طالب نشط', included: true, highlight: true },
      { text: 'فرع واحد + حتى 4 قاعات تدريسية', included: true },
      { text: '5 حسابات موظفين ومدربين', included: true },
      { text: 'رصد الحضور والغياب وكشوف الدرجات', included: true },
      { text: 'سندات قبض وصرف أساسية للخزينة', included: true },
      { text: 'تصدير كشوف الطلاب والماليات لـ Excel', included: true },
      { text: 'بوابة ولي الأمر والطالب التفاعلية', included: false },
      { text: 'أرشفة إيصالات التحويل البنكي المشفرة', included: false },
      { text: 'حساب رواتب ونسب المدربين آلياً', included: false },
      { text: 'تعدد الفروع والربط المالي الموحد', included: false }
    ],
    ctaText: 'ابدأ بالانطلاق',
    ctaSubtext: 'تجربة مجانية 14 يوماً بدون بطاقة'
  },
  {
    id: 'growth',
    name: 'النمو (Growth)',
    subtitle: 'الخيار الأقوى للأكاديميات المتوسعة التي تبحث عن أتمتة تشغيلية ومالية شاملة',
    badge: 'الأكثر طلباً بين الأكاديميات',
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
      { text: 'حتى 650 طالب نشط', included: true, highlight: true },
      { text: 'حتى 3 فروع تدريبية في حساب موحد', included: true, highlight: true },
      { text: 'حسابات موظفين ومدربين غير محدودة', included: true },
      { text: 'بوابات مستقلة للطلاب وأولياء الأمور (R08 & R09)', included: true, highlight: true },
      { text: 'دورة اعتماد الإيصالات وسندات التحويل البنكي', included: true, highlight: true },
      { text: 'حساب رواتب ونسب وساعات المدربين آلياً', included: true },
      { text: 'منع تضارب المواعيد والقاعات بذكاء', included: true },
      { text: 'إشعارات آلية بمواعيد الحصص والأقساط المستحقة', included: true },
      { text: 'جلسة تدريب حية لفريق العمل مع مهندس متخصص', included: true, highlight: true },
      { text: 'نقل بيانات الطلاب من Excel بمعرفتنا مجاناً', included: true }
    ],
    ctaText: 'اختر باقة النمو الأقوى',
    ctaSubtext: 'شاملة كل البوابات وميزة الفروع'
  },
  {
    id: 'enterprise',
    name: 'المؤسسات (Enterprise)',
    subtitle: 'لسلاسل المعاهد والمؤسسات الكبرى الراغبة في استضافة خاصة ودعم VIP',
    badge: 'أعلى مستوى أمان وربط',
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
      { text: 'عدد غير محدود من الطلاب والمدربين', included: true, highlight: true },
      { text: 'عدد فروع وقاعات غير محدود بكل الصلاحيات', included: true, highlight: true },
      { text: 'نطاق خاص ودومين باسم أكاديميتك (Custom Domain)', included: true, highlight: true },
      { text: 'سيرفر وقاعدة بيانات مخصصة معزولة بالكامل', included: true },
      { text: 'ربط مباشر API مع أنظمة الـ ERP والفوترة الإلكترونية', included: true },
      { text: 'سجل تدقيق أمني متقدم (Audit Logs & IP Security)', included: true },
      { text: 'مدير حساب مخصص (Account Manager) ودعم VIP على مدار الساعة', included: true },
      { text: 'اتفاقية مستوى خدمة رسمية (99.95% SLA) وفواتير ضريبية', included: true },
      { text: 'نسخ احتياطي مخصص كل ساعة واسترجاع فوري', included: true },
      { text: 'تخصيص مظهر التقارير والشعار والألوان لهوية الأكاديمية', included: true }
    ],
    ctaText: 'تحدث مع مستشار الحلول',
    ctaSubtext: 'عقود مخصصة وسيرفرات خاصة'
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

  const handleChoosePlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
    onScrollToDemo();
  };

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-white border-b border-[#14243A]/10 relative overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#0D9488]/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-xs font-bold text-[#0D9488]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تسعير واضح وعادل بدون أي رسوم خفية</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14243A] tracking-tight">
            استثمار يبدأ صغيراً <br />
            وينمو بنمو أكاديميتك
          </h2>

          <p className="text-base sm:text-lg text-[#14243A]/70 leading-relaxed font-normal">
            لا توجد مصاريف تثبيت، لا توجد عمولات على عمليات الدفع، ولا توجد قيود مفاجئة. اختر الخطة المناسبة لحجمك الآن ورقّي متى شئت.
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
                  وفر شهرين (20%)
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

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
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
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-[#14243A] font-mono tracking-tight">
                        {currentPrice}
                      </span>
                      <span className="text-sm font-bold text-[#14243A]/60">
                        {priceInfo.formatted.currencySymbol} / شهرياً
                      </span>
                    </div>

                    <div className="text-xs text-[#14243A]/50 mt-1.5 font-medium">
                      {isAnnual ? 'يتم سداد الاشتراك سنوياً بخصم شهرين مجاناً' : 'اشتراك شهري مرن، يمكنك الإلغاء في أي وقت'}
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-3.5 py-4 text-right">
                    <div className="text-xs font-bold text-[#14243A]/60 uppercase tracking-wider mb-2">
                      ما تتضمنه هذه الباقة:
                    </div>

                    {plan.features.map((feat, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2.5 text-xs sm:text-sm ${
                          feat.included 
                            ? feat.highlight ? 'font-bold text-[#14243A]' : 'text-[#14243A]/85' 
                            : 'text-[#14243A]/30 line-through'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {feat.included ? (
                            <div className="w-4 h-4 rounded-full bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-[#14243A]/10 text-[#14243A]/40 flex items-center justify-center text-[10px]">
                              ✕
                            </div>
                          )}
                        </div>
                        <span>{feat.text}</span>
                      </div>
                    ))}
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
                <h4 className="text-sm font-bold text-[#14243A]">ضمان استرداد 30 يوماً</h4>
                <p className="text-xs text-[#14243A]/65 leading-relaxed">
                  إذا لم يلبِّ النظام احتياجات أكاديميتك بالكامل خلال أول شهر، سنعيد لك كامل المبلغ فوراً بدون أي تعقيد.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#14243A]">نقل مجاني للبيانات الحالية</h4>
                <p className="text-xs text-[#14243A]/65 leading-relaxed">
                  فريقنا التقني سيتولى رفع بيانات طلابك ومدربيك من ملفات Excel السابقة مجاناً لتنطلق بدون مجهود.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#14243A]">تدريب الطاقم ودعم متواصل</h4>
                <p className="text-xs text-[#14243A]/65 leading-relaxed">
                  جلسة Onboarding مخصصة لسكرتارية ومحاسبي الأكاديمية مع دعم مستمر عبر الواتساب والمكالمات.
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
            <span>{showComparison ? 'إخفاء جدول المقارنة التفصيلي' : 'عرض جدول مقارنة المزايا الشامل لجميع الباقات'}</span>
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
                  <th className="py-4 px-4 text-center font-bold">الانطلاق (Starter)</th>
                  <th className="py-4 px-4 text-center font-bold text-teal-300">النمو (Growth) ★</th>
                  <th className="py-4 px-4 text-center font-bold">المؤسسات (Enterprise)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14243A]/10 text-[#14243A]/80">
                <tr>
                  <td className="py-3.5 px-6 font-semibold">عدد الطلاب النشطين المسموح به</td>
                  <td className="py-3.5 px-4 text-center font-mono">150 طالب</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0D9488]">650 طالب</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold">غير محدود</td>
                </tr>
                <tr className="bg-[#F8FAFC]">
                  <td className="py-3.5 px-6 font-semibold">عدد الفروع المدارة في حساب واحد</td>
                  <td className="py-3.5 px-4 text-center font-mono">فرع 1</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0D9488]">حتى 3 فروع</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold">غير محدود</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold">بوابات الطلاب وأولياء الأمور (R08 & R09)</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕ غير متاحة</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ كاملة</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ كاملة مع تطبيق ويب</td>
                </tr>
                <tr className="bg-[#F8FAFC]">
                  <td className="py-3.5 px-6 font-semibold">أرشفة إيصالات التحويل البنكي وسندات القبض</td>
                  <td className="py-3.5 px-4 text-center">سندات نصية فقط</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ أرشفة مستندات وصور</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ سحابة خاصة معزولة</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold">حساب رواتب وحصص المدربين التلقائي</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ مفعل آلياً</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ مفعل + ربط بنكي</td>
                </tr>
                <tr className="bg-[#F8FAFC]">
                  <td className="py-3.5 px-6 font-semibold">تخصيص دومين ونطاق خاص (Custom Domain)</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕</td>
                  <td className="py-3.5 px-4 text-center text-rose-500 font-bold">✕ (متاح كإضافة)</td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">✓ مجاناً باسم أكاديميتك</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-semibold">نوع الدعم الفني وسرعة الاستجابة</td>
                  <td className="py-3.5 px-4 text-center">بريد + واتساب عادي</td>
                  <td className="py-3.5 px-4 text-center text-[#0D9488] font-bold">أولوية عالية ومكالمات</td>
                  <td className="py-3.5 px-4 text-center font-bold">مدير حساب خاص 24/7 VIP</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </section>
  );
};

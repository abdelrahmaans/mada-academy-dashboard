import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'البيانات والبدء',
    question: 'هل يمكننا استيراد بيانات الطلاب والمدربين الحالية من ملفات Excel السابقة؟',
    answer: 'نعم بكل تأكيد وبسهولة تامة. يدعم النظام قوالب استيراد قياسية لملفات Excel، كما يقوم مهندس الدعم الفني المخصص لأكاديميتك بمساعدتك في تنظيف ورفع كافة بياناتك التاريخية والطلاب المشتركين مجاناً أثناء جلسة التجهيز (Onboarding) لتنطلق بدون أي انقطاع.'
  },
  {
    category: 'المالية والأمان',
    question: 'كيف يضمن النظام منع التسريب المالي والتلاعب في الخزينة؟',
    answer: 'صُمم النظام وفق أفضل الممارسات المحاسبية عبر "دورة مالية مغلقة". كل عملية دفع تتطلب مستنداً رسمياً وسند قبض برقم تسلسلي مشفر، مع إمكانية إلزام السكرتارية برفع صورة إيصال التحويل البنكي أو المحفظة الإلكترونية. كما أن النظام يمنع حذف أو تعديل السندات المعتمدة، ويسجل كل حركة بالثانية واسم المستخدم في سجل الرقابة المالي (Audit Trail).'
  },
  {
    category: 'الفروع والنمو',
    question: 'لدينا عدة فروع وقاعات تدريبية، كيف يدير النظام الفروع دون تداخل؟',
    answer: 'النظام مبني على معمارية سحابية متعددة المستويات (Multi-Branch Architecture). يُحدد لكل موظف ومدرب فرعه وصلاحياته بدقة فلا يرى سوى بيانات طلابه وقاعاته، بينما يملك المالك والمدير العام (Owner Desk) نظرة شمولية عليا تمكنه من التنقل الفوري بين الفروع ومقارنة إيراداتها ونسب إشغالها في شاشة واحدة.'
  },
  {
    category: 'الأجهزة والاستخدام',
    question: 'هل يحتاج النظام لأجهزة كمبيوتر خاصة أم يعمل على الموبايل والتابلت؟',
    answer: 'يعمل النظام سحابياً بنسبة 100% عبر أي متصفح ويب حديث دون الحاجة لتثبيت برامج معقدة. واجهات المدربين ورصد الحضور وبوابات أولياء الأمور مهيأة بالكامل للعمل بكفاءة فائقة على شاشات الجوال والتابلت، بينما تحظى مكاتب السكرتارية والمحاسبين بواجهات كمبيوتر سريعة تدعم الطباعة الفورية للكارنيهات والسندات.'
  },
  {
    category: 'الأمان والنسخ الاحتياطي',
    question: 'أين تُحفظ بيانات الأكاديمية وكيف يتم تأمينها ضد التلف أو الضياع؟',
    answer: 'تُستضاف قاعدة البيانات والمستندات على خوادم سحابية عالمية مشفرة بأعلى معايير الحماية (AES-256 و SSL/TLS)، مع تشغيل نسخ احتياطي آلي دوري يومي وساعي، مما يضمن استعادة البيانات بالكامل إلى أي دقيقة سابقة في حال حدوث أي خطأ بشري.'
  },
  {
    category: 'الاشتراك والدعم',
    question: 'ما هي مدة التجربة وما هو الضمان المقدم بعد الاشتراك؟',
    answer: 'نوفر تجربة مجانية كاملة المزايا لمدة 14 يوماً بدون اشتراط أي بيانات دفع بنكية. وعند بدء الاشتراك المدفوع، نلتزم بضمان استرداد كامل لقيمة الاشتراك خلال 30 يوماً إذا لم تجد النظام ملائماً لأسلوب عملك، بدون شروط تعجيزية وبكل شفافية.'
  }
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-[#F4F7FA] border-b border-[#14243A]/10 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-xs font-bold text-[#0D9488]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>إجابات واضحة ومباشرة</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#14243A] tracking-tight">
            الأسئلة الشائعة التي تهم <br />
            أصحاب ومدراء الأكاديميات
          </h2>

          <p className="text-base text-[#14243A]/70 font-normal">
            كل ما تحتاج لمعرفته حول طريقة عمل النظام، الأمان المالي، والدعم المستمر لفريقك.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl transition-all duration-200 border ${
                  isOpen 
                    ? 'bg-white border-[#0D9488]/40 shadow-md shadow-[#0D9488]/5' 
                    : 'bg-white/80 border-[#14243A]/10 hover:border-[#14243A]/20'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full py-5 px-6 sm:px-7 text-right flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488] shrink-0" />
                    <span className="text-base sm:text-lg font-bold text-[#14243A]">
                      {item.question}
                    </span>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'bg-[#0D9488] text-white rotate-180' : 'bg-[#14243A]/5 text-[#14243A]/60'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 sm:px-7 pb-6 pt-1 text-right border-t border-[#14243A]/5">
                    <p className="text-sm sm:text-base text-[#14243A]/75 leading-relaxed font-normal">
                      {item.answer}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#0D9488] font-mono">
                      <span>تصنيف: {item.category}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions CTA */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-white border border-[#14243A]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-right">
            <h4 className="text-sm font-bold text-[#14243A]">لديك استفسار خاص بطبيعة عمل أكاديميتك؟</h4>
            <p className="text-xs text-[#14243A]/60 mt-0.5">فريقنا الاستشاري متواجد للإجابة على جميع التساؤلات الفنية والتشغيلية.</p>
          </div>
          <a
            href="https://wa.me/201016629737?text=مرحباً، لدي استفسار حول نظام مدى أكاديمي"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-5 rounded-xl bg-[#0D9488] hover:bg-[#0B7D72] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تحدث مع مستشارنا عبر واتساب</span>
          </a>
        </div>

      </div>
    </section>
  );
};

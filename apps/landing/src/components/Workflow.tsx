import React from 'react';

export const Workflow: React.FC = () => {
  const steps = [
    {
      num: 1,
      title: 'إعداد الفروع',
      desc: 'أضف فروعك وأقسامك وحدد مسؤولي كل نطاق.',
      detail: 'إعداد البنية التحتية التشغيلية مرة واحدة بدقة لمنع التضارب مستقبلاً.'
    },
    {
      num: 2,
      title: 'إدخال البيانات',
      desc: 'أضف الطلاب والمجموعات والجداول بسهولة.',
      detail: 'تسكين المجموعات ومطابقة القاعات وتعيين أوقات الحصص للمدربين.'
    },
    {
      num: 3,
      title: 'المتابعة اليومية',
      desc: 'تتبع الحضور والتقييمات والفواتير لحظياً.',
      detail: 'رصد الحضور الفوري من الجوال وتوثيق تقييمات المهارات والأعذار بنقرة واحدة.'
    },
    {
      num: 4,
      title: 'تقارير واضحة',
      desc: 'راجع أداء كل فرع واتخذ قرارات مدروسة.',
      detail: 'قيد المقبوضات والمصروفات التشغيلية واستخراج تقارير أداء موحدة للإدارة.'
    }
  ];

  return (
    <section id="workflow" className="py-20 lg:py-28 bg-white border-b border-[#14243A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching Screenshot 5 */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-5xl font-black text-[#14243A] tracking-tight mb-4">
            كيف تعمل مدى أكاديمي؟
          </h2>
          <p className="text-base sm:text-lg text-[#14243A]/70 leading-relaxed font-normal">
            رحلة مبسطة من الإعداد إلى التشغيل اليومي.
          </p>
        </div>

        {/* Horizontal Numbered Timeline matching Screenshot 5 */}
        <div className="relative">
          
          {/* Connecting line behind circles on desktop */}
          <div className="hidden lg:block absolute top-8 left-16 right-16 h-0.5 bg-[#14243A]/10 -z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 relative z-10">
            {steps.map((step) => (
              <div 
                key={step.num}
                className="flex flex-col items-center text-center group"
              >
                {/* Step Circle with Number */}
                <div className="w-16 h-16 rounded-full bg-white border-2 border-[#0D9488]/30 group-hover:border-[#0D9488] shadow-md flex items-center justify-center text-xl font-black text-[#0D9488] font-en mb-6 group-hover:scale-110 group-hover:bg-[#0D9488]/5 transition-all duration-300">
                  {step.num}
                </div>

                {/* Step Title matching Screenshot 5 */}
                <h3 className="text-lg font-bold text-[#14243A] mb-2">
                  {step.title}
                </h3>

                {/* Step Description matching Screenshot 5 */}
                <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed max-w-xs">
                  {step.desc}
                </p>

                {/* Operational note */}
                <div className="mt-4 pt-3 border-t border-[#14243A]/5 text-[11px] text-[#14243A]/50 max-w-xs">
                  {step.detail}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

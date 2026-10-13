import React, { useState } from 'react';
import { Landmark, UserCheck, Presentation, Users2, ShieldAlert, Check, ChevronDown, ChevronUp } from 'lucide-react';

export const Audience: React.FC = () => {
  const [showDetailedPermissions, setShowDetailedPermissions] = useState(false);

  const roles = [
    {
      title: 'المالك',
      roleBadge: 'نطاق استراتيجي شامل',
      icon: Landmark,
      colorBg: 'bg-[#0D9488]/10',
      colorText: 'text-[#0D9488]',
      desc: 'رؤية شاملة لأداء جميع الفروع والفئات في لوحة واحدة.',
      fullDesc: 'تدقيق مؤشرات الالتزام، متابعة قيود الإيرادات والمصروفات التشغيلية لكل فرع، واتخاذ قرارات التوسع بثقة.',
      permissions: [
        'لوحة معلومات موحدة لكافة الفروع',
        'متابعة القيود المالية التشغيلية المجمعة',
        'إدارة وتعيين صلاحيات مديري الفروع',
        'تصدير التقارير الإدارية والتشغيلية'
      ]
    },
    {
      title: 'مسؤول الفرع',
      roleBadge: 'نطاق الفرع المخصص',
      icon: UserCheck,
      colorBg: 'bg-[#D49A2D]/15',
      colorText: 'text-[#D49A2D]',
      desc: 'إدارة العمليات اليومية والفريق التابع للفرع دون تشتت.',
      fullDesc: 'إحكام السيطرة اليومية: جداول القاعات، الحضور اليومي، التزام المدربين، وقيد المصروفات المحلية.',
      permissions: [
        'إدارة قاعات ومجموعات الفرع المعين فقط',
        'اعتماد كشوف الحضور والانصراف اليومية',
        'معالجة تعارض مواعيد المدربين والقاعات',
        'تسجيل المصروفات ومستلزمات الفرع'
      ]
    },
    {
      title: 'المعلمون والعمليات',
      roleBadge: 'المجموعات المسندة',
      icon: Presentation,
      colorBg: 'bg-[#3B82F6]/10',
      colorText: 'text-[#3B82F6]',
      desc: 'تسجيل الحضور والتقييمات ومتابعة المجموعات بسهولة.',
      fullDesc: 'واجهة سريعة وخالية من التعقيد. تحضير بنقرات سريعة وتدوين ملاحظات السلوك وتقييم المهارات دون سجلات مالية.',
      permissions: [
        'الوصول فقط للطلاب والمجموعات المسندة',
        'رصد الحضور الفوري من الجوال أو التابلت',
        'تقييم الطلاب عبر مصفوفة المعايير (Rubric)',
        'حجب تام لبيانات الإيرادات والرسوم'
      ]
    },
    {
      title: 'العائلات والطلاب',
      roleBadge: 'بوابة المتابعة الخاصة',
      icon: Users2,
      colorBg: 'bg-[#0D9488]/10',
      colorText: 'text-[#0D9488]',
      desc: 'الاطلاع على الجداول والتقدم المالي والأكاديمي بكل شفافية.',
      fullDesc: 'بوابة شفافة تتيح استعراض المواعيد وكشف حضور المتدرب وتقارير تقدمه المهاري مع حماية قصوى للخصوصية.',
      permissions: [
        'استعراض جدول الحصص والقاعات الخاصة',
        'الاطلاع على سجل الحضور والغياب المعتمد',
        'استعراض تقارير التقييم الدوري والمهارات',
        'حماية قصوى للخصوصية وعزل تام للبيانات'
      ]
    }
  ];

  return (
    <section id="audience" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-[#14243A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching Screenshot 4 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-[#14243A] tracking-tight mb-4">
            من يستفيد من مدى أكاديمي؟
          </h2>
          <p className="text-base sm:text-lg text-[#14243A]/70 leading-relaxed font-normal">
            منصة صُممت لخدمة جميع أطراف العملية التعليمية والإدارية.
          </p>
        </div>

        {/* 4 Cards in Horizontal Grid matching Screenshot 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-8 bg-white rounded-2xl border border-[#14243A]/10 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center justify-between"
              >
                <div className="w-full flex flex-col items-center">
                  
                  {/* Circular Icon Container matching Screenshot 4 */}
                  <div className={`w-16 h-16 rounded-full ${item.colorBg} flex items-center justify-center ${item.colorText} mb-6 shadow-xs`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#14243A] mb-3">
                    {item.title}
                  </h3>

                  {/* Short summary text matching Screenshot 4 */}
                  <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>

                {/* Optional expanded permissions */}
                {showDetailedPermissions && (
                  <div className="w-full pt-4 mt-2 border-t border-[#14243A]/10 text-right space-y-2">
                    <div className="text-[11px] font-bold text-[#14243A]/80 mb-2">
                      الصلاحيات المحددة:
                    </div>
                    {item.permissions.map((perm) => (
                      <div key={perm} className="flex items-start gap-1.5 text-xs text-[#14243A]/75">
                        <Check className="w-3.5 h-3.5 text-[#0D9488] shrink-0 mt-0.5" />
                        <span className="leading-tight">{perm}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footnote matching Screenshot 4 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#14243A]/60 font-semibold inline-block bg-white/80 px-4 py-2 rounded-full border border-[#14243A]/5 shadow-xs">
            * كل دور يرى فقط البيانات المصرح له بها ضمن نطاقه.
          </p>
        </div>

        {/* Detailed Permissions Matrix Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowDetailedPermissions(!showDetailedPermissions)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:text-[#0B7D72] py-1.5 px-3 rounded-lg hover:bg-[#0D9488]/10 transition-colors"
          >
            <span>{showDetailedPermissions ? 'إخفاء تفاصيل الصلاحيات الدقيقة' : 'استعراض مصفوفة الصلاحيات التفصيلية لكل دور'}</span>
            {showDetailedPermissions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Scoped Security Callout Banner */}
        <div className="mt-10 p-5 bg-[#14243A] text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[#0D9488] shrink-0">
              <ShieldAlert className="w-6 h-6 text-[#0D9488]" />
            </div>
            <div className="text-right">
              <h4 className="text-sm font-bold text-white">
                مبدأ عزل الصلاحيات: خصوصية تامة وحماية صارمة للبيانات
              </h4>
              <p className="text-xs text-white/70 mt-0.5">
                لا اختلاط في الصلاحيات: لا يطّلع المعلم على الأرقام المالية، ولا يرى مدير الفرع عمليات الفروع المجاورة.
              </p>
            </div>
          </div>
          <div className="font-en text-xs text-[#0D9488] bg-white/10 px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap self-end sm:self-auto">
            STRICT SCOPED ACCESS
          </div>
        </div>

      </div>
    </section>
  );
};

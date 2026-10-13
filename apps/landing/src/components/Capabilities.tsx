import React from 'react';
import { 
  Building2, 
  Users, 
  CalendarCheck, 
  FileCheck2, 
  Receipt, 
  ShieldCheck
} from 'lucide-react';

export const Capabilities: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white border-b border-[#14243A]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16 text-right">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488] mb-3">
            <span>القدرات التشغيلية الأساسية</span>
            <span aria-hidden="true" className="text-[#14243A]/30">·</span>
            <span className="font-en text-[#14243A]/60">CORE CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#14243A] tracking-tight leading-tight mb-4">
            ست ركائز لإحكام تشغيل الأكاديمية وفروعها
          </h2>
          <p className="text-base text-[#14243A]/75 leading-relaxed font-normal">
            صُمم النظام لتفكيك الفوضى التشغيلية الناتجة عن تعدد الجداول وسجلات الحضور الورقية وتشتت الفروع، مع ضبط القيود المالية وتحديد صلاحيات كل مسؤول بدقة.
          </p>
        </div>

        {/* 6 Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* 01. Branch Scope */}
          <div className="p-7 rounded-2xl border border-[#14243A]/10 bg-[#F8FAFC] hover:bg-white hover:shadow-lg hover:border-[#0D9488]/30 transition-all flex flex-col justify-between text-right group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-en text-xs font-black text-[#14243A]/40 group-hover:text-[#0D9488] transition-colors">01</span>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#14243A]/10 flex items-center justify-center text-[#0D9488] shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#14243A] mb-3">
                نطاق الفروع والتوسع المؤسسي
              </h3>
              <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed mb-6">
                هيكلة مركزية تدعم تشغيل فرع واحد أو شبكة فروع متعددة. تخصيص قاعات ومعامل كل فرع، وتحديد طاقمه الإداري مع إمكانية التبديل السلس بين الفروع وفق الامتيازات.
              </p>
            </div>
            
            <div className="pt-4 border-t border-[#14243A]/10 space-y-2 text-xs text-[#14243A]/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>عزل مرافق وقاعات كل فرع تشغيليًا</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>تجميع مركزي للمعلومات في لوحة المالك</span>
              </div>
            </div>
          </div>

          {/* 02. Student & Group Records */}
          <div className="p-7 rounded-2xl border border-[#14243A]/10 bg-[#F8FAFC] hover:bg-white hover:shadow-lg hover:border-[#0D9488]/30 transition-all flex flex-col justify-between text-right group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-en text-xs font-black text-[#14243A]/40 group-hover:text-[#0D9488] transition-colors">02</span>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#14243A]/10 flex items-center justify-center text-[#0D9488] shadow-xs group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#14243A] mb-3">
                سجلات الطلاب والمجموعات
              </h3>
              <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed mb-6">
                تنظيم الطلاب داخل مجموعات وصفوف محددة الطاقة الاستيعابية. تتبع السجل الأكاديمي، معلومات ولي الأمر، حالة التسجيل والانسحاب، وتوزيع الطلاب على المجموعات المناسبة.
              </p>
            </div>

            <div className="pt-4 border-t border-[#14243A]/10 space-y-2 text-xs text-[#14243A]/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>قوائم فصول متوازنة تمنع التجاوز السعوي</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>أرشيف منظم لسجل الطالب عبر الفصول</span>
              </div>
            </div>
          </div>

          {/* 03. Schedules & Attendance */}
          <div className="p-7 rounded-2xl border border-[#14243A]/10 bg-[#F8FAFC] hover:bg-white hover:shadow-lg hover:border-[#0D9488]/30 transition-all flex flex-col justify-between text-right group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-en text-xs font-black text-[#14243A]/40 group-hover:text-[#0D9488] transition-colors">03</span>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#14243A]/10 flex items-center justify-center text-[#0D9488] shadow-xs group-hover:scale-105 transition-transform">
                  <CalendarCheck className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#14243A] mb-3">
                الجداول والحضور والانصراف
              </h3>
              <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed mb-6">
                جدولة أسبوعية وفصلية دقيقة للقاعات والمدربين تمنع التضارب الزمني. رصد فوري للحضور (حاضر، متأخر، معتذر، غائب) مع توثيق وقت التحضير وملاحظة المدرب لكل حصة.
              </p>
            </div>

            <div className="pt-4 border-t border-[#14243A]/10 space-y-2 text-xs text-[#14243A]/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>تحضير سريع عبر الأجهزة اللوحية والمحمولة</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>سجل تدقيق زمني يوضح من قام بالتحضير وموعده</span>
              </div>
            </div>
          </div>

          {/* 04. Assessments & Progress Tracking */}
          <div className="p-7 rounded-2xl border border-[#14243A]/10 bg-[#F8FAFC] hover:bg-white hover:shadow-lg hover:border-[#0D9488]/30 transition-all flex flex-col justify-between text-right group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-en text-xs font-black text-[#14243A]/40 group-hover:text-[#0D9488] transition-colors">04</span>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#14243A]/10 flex items-center justify-center text-[#0D9488] shadow-xs group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#14243A] mb-3">
                التقييمات ومتابعة التقدم
              </h3>
              <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed mb-6">
                مصفوفات تقييم مهارية (Rubrics) قابلة للتخصيص بحسب طبيعة برامج الأكاديمية (مهارية، علمية، رياضية، لغوية). رصد درجات وملاحظات نوعية تعكس التطور الحقيقي للمتدرب.
              </p>
            </div>

            <div className="pt-4 border-t border-[#14243A]/10 space-y-2 text-xs text-[#14243A]/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>معايير محددة خالية من التقييم العشوائي</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>تقارير تقييم رسمية جاهزة للطباعة والتصدير</span>
              </div>
            </div>
          </div>

          {/* 05. Operational Finance Records */}
          <div className="p-7 rounded-2xl border border-[#14243A]/10 bg-[#F8FAFC] hover:bg-white hover:shadow-lg hover:border-[#D49A2D]/30 transition-all flex flex-col justify-between text-right group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-en text-xs font-black text-[#14243A]/40 group-hover:text-[#D49A2D] transition-colors">05</span>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#14243A]/10 flex items-center justify-center text-[#D49A2D] shadow-xs group-hover:scale-105 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#14243A] mb-3">
                قيود الفواتير والمصروفات التشغيلية
              </h3>
              <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed mb-4">
                تسجيل ومطابقة فواتير الاشتراكات، توثيق مقبوضات الطلاب المحولة بنكيًا، وقيد المصروفات والمشتريات التشغيلية لكل فرع لحصر تكاليف ونفقات التشغيل بدقة تامة.
              </p>
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed mb-4">
                <strong>توضيح:</strong> نظام مدى يسجل القيود والمدفوعات والمصروفات التشغيلية، ولا يعمل كبوابة دفع إلكتروني.
              </div>
            </div>

            <div className="pt-4 border-t border-[#14243A]/10 space-y-2 text-xs text-[#14243A]/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D49A2D]" />
                <span>إثبات سداد الاشتراكات وربطها بملف الطالب</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D49A2D]" />
                <span>قيد مصروفات الفروع والخامات التدريبية</span>
              </div>
            </div>
          </div>

          {/* 06. Role-Based Scoped Views */}
          <div className="p-7 rounded-2xl border border-[#14243A]/10 bg-[#F8FAFC] hover:bg-white hover:shadow-lg hover:border-[#0D9488]/30 transition-all flex flex-col justify-between text-right group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-en text-xs font-black text-[#14243A]/40 group-hover:text-[#0D9488] transition-colors">06</span>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#14243A]/10 flex items-center justify-center text-[#0D9488] shadow-xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#14243A] mb-3">
                صلاحيات مخصصة لكل دور
              </h3>
              <p className="text-xs sm:text-sm text-[#14243A]/70 leading-relaxed mb-6">
                كل مستخدم يرى فقط النطاق المصرح له به. لا يمكن لمدرب الاطلاع على السجلات المالية، ولا يرى مدير الفرع عمليات الفروع الأخرى، مع حماية بيانات الطلاب وخصوصيتهم.
              </p>
            </div>

            <div className="pt-4 border-t border-[#14243A]/10 space-y-2 text-xs text-[#14243A]/80 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>فصل صارم بين الشؤون التعليمية والمالية</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>سجلات تدقيق للوصول والتعديلات الحساسة</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

import React from 'react';
import { ShieldCheck, TrendingDown, Clock, Zap, Building, Users2, Award } from 'lucide-react';

export const TrustMetrics: React.FC = () => {
  return (
    <section className="py-12 bg-[#14243A] text-white border-y border-white/10 relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-center text-center">
          
          <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-3xl sm:text-5xl font-black text-teal-400 font-mono tracking-tight">
              -65%
            </div>
            <div className="text-xs sm:text-sm font-bold text-white/90">
              توفير في وقت الجداول الإدارية
            </div>
            <div className="text-[11px] text-white/50">
              استبدال شيتات Excel اليدوية بأتمتة كاملة
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-3xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
              0%
            </div>
            <div className="text-xs sm:text-sm font-bold text-white/90">
              تسريب أو عجز في الخزينة
            </div>
            <div className="text-[11px] text-white/50">
              بفضل مطابقة إيصالات الدفع والتحويلات
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-3xl sm:text-5xl font-black text-teal-300 font-mono tracking-tight">
              9 أدوار
            </div>
            <div className="text-xs sm:text-sm font-bold text-white/90">
              شاشات مخصصة لكل موظف
            </div>
            <div className="text-[11px] text-white/50">
              من المالك والمحاسب للمدرب وولي الأمر
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-3xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
              99.9%
            </div>
            <div className="text-xs sm:text-sm font-bold text-white/90">
              جاهزية سحابية واستقرار تشغيل
            </div>
            <div className="text-[11px] text-white/50">
              سيرفرات سحابية آمنة ونسخ احتياطي فوري
            </div>
          </div>

        </div>

        {/* Operational Scope Badges Strip */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-400" />
            <span>معمارية فروع متقدمة Multi-Branch</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>عزل تام للبيانات وحماية مشفرة</span>
          </div>
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-amber-400" />
            <span>بوابة موحدة للأسرة ومتابعة الأبناء</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-300" />
            <span>متوافق مع المعايير المحاسبية العربية</span>
          </div>
        </div>

      </div>
    </section>
  );
};

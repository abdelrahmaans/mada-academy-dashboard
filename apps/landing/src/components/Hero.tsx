import React from 'react';
import { ArrowLeft, ArrowDown, Users, PieChart, Calendar, Receipt, Sparkles, Building2, ShieldCheck } from 'lucide-react';
import { DASHBOARD_LIVE_DEMO } from '../lib/publicApi';

interface HeroProps {
  onScrollToDemo: () => void;
  onScrollToPreview: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToDemo, onScrollToPreview }) => {
  return (
    <section className="relative pt-12 sm:pt-20 pb-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#F4F7FA] via-white to-[#F4F7FA] border-b border-[#14243A]/10">
      {/* Subtle ambient light glow in background */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#14243A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Right Column (in RTL): Editorial Copy Block matching Screenshot 1 */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* Pill Badge matching Screenshot 1 */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-xs font-bold text-[#0D9488]">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
              <span className="font-en uppercase tracking-wider">ENTERPRISE MANAGEMENT SAAS</span>
            </div>

            {/* Main Headline matching Screenshot 1 */}
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black text-[#14243A] tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              شغّل أكاديميتك <br className="hidden sm:inline" />
              من مساحة واحدة.
            </h1>

            {/* Subtitle matching Screenshot 1 */}
            <p className="text-base sm:text-lg text-[#14243A]/75 leading-relaxed font-normal max-w-xl">
              مدى أكاديمي هو نظام تشغيل للأكاديميات ذات الفروع المتعددة. أدر الطلاب، الجداول، الحسابات المالية، والتقييمات بنظرة شاملة ودقيقة.
            </p>

            {/* Action CTAs matching Screenshot 1 */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onScrollToDemo}
                className="py-3.5 px-7 text-sm font-bold text-white bg-[#14243A] hover:bg-[#1C3250] active:scale-[0.98] transition-all rounded-xl shadow-md hover:shadow-lg flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <span>اطلب عرضاً للنظام</span>
              </button>

              <a
                href="#features"
                className="py-3.5 px-6 text-sm font-bold text-[#14243A] bg-white border border-[#14243A]/15 hover:bg-[#F4F7FA] hover:border-[#14243A]/30 transition-all rounded-xl shadow-xs flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <span>استكشف المزايا</span>
                <ArrowLeft className="w-4 h-4 text-[#0D9488]" />
              </a>

              <button
                onClick={onScrollToPreview}
                className="py-3.5 px-4 text-xs font-bold text-[#0D9488] hover:text-[#0B7D72] hover:bg-[#0D9488]/10 transition-colors rounded-xl flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>معاينة الواجهة الحية</span>
              </button>

              <a
                href={DASHBOARD_LIVE_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-4 text-xs font-bold text-[#14243A]/80 hover:text-[#14243A] hover:bg-[#14243A]/5 transition-colors rounded-xl flex items-center gap-1.5 border border-[#14243A]/10"
              >
                <span>دخول النظام الفعلي</span>
                <span className="text-[10px] text-[#0D9488] font-mono">↗</span>
              </a>
            </div>

            {/* Scope / Identity Clarity Badges */}
            <div className="pt-6 border-t border-[#14243A]/10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-[#14243A]/70">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>مخصص لإدارة الأكاديميات والفروع</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D49A2D]" />
                <span>نظام تشغيل B2B داخلي للمؤسسات</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14243A]" />
                <span>بيانات معزولة وصلاحيات محكمة</span>
              </div>
            </div>

          </div>

          {/* Left Column (in RTL): The Signature Floating Visual Mockup from Screenshot 1 */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Preview Container */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-[#14243A]/10 relative z-10 transition-transform hover:-translate-y-1 duration-300">
                
                {/* Top Bar of the Mockup Card */}
                <div className="flex items-center justify-between pb-6 border-b border-[#14243A]/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0D9488]/20 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                    </span>
                    <span className="text-[11px] font-semibold text-[#0D9488]">مباشر ومترابط</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-extrabold text-[#14243A]">نظرة عامة على الفروع</span>
                    <div className="w-7 h-7 rounded-lg bg-[#14243A]/5 flex items-center justify-center text-[#14243A]">
                      <PieChart className="w-4 h-4 text-[#14243A]" />
                    </div>
                  </div>
                </div>

                {/* The 2 Stat Cards inside matching Screenshot 1 */}
                <div className="grid grid-cols-2 gap-4 my-6">
                  
                  {/* Card 1: إجمالي الطلاب */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#14243A]/5 space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#14243A]/70">إجمالي الطلاب</span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-black text-[#14243A] font-en tracking-tight">
                      2,482
                    </div>

                    <div className="text-[11px] font-bold text-[#0D9488] bg-[#0D9488]/10 inline-block px-2 py-0.5 rounded-md">
                      +12% هذا الشهر
                    </div>
                  </div>

                  {/* Card 2: سجل المدفوعات */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#14243A]/5 space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-lg bg-[#D49A2D]/15 text-[#D49A2D] flex items-center justify-center">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-[#14243A]/70">سجل المدفوعات</span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-black text-[#14243A] font-en tracking-tight">
                      92%
                    </div>

                    <div className="text-[11px] font-medium text-[#14243A]/60">
                      تسجيل مالي دقيق
                    </div>
                  </div>

                </div>

                {/* Progress bar line from screenshot */}
                <div className="space-y-1.5 pt-2">
                  <div className="w-full bg-[#14243A]/5 h-2 rounded-full overflow-hidden flex">
                    <div className="w-3/4 bg-gradient-to-l from-[#0D9488] to-[#14243A] h-full rounded-full" />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#14243A]/50">
                    <span>نسبة اكتمال الجلسات المقررة</span>
                    <span className="font-en font-bold text-[#0D9488]">75%</span>
                  </div>
                </div>

              </div>

              {/* Overlapping Floating Badge from Screenshot 1 */}
              <div className="absolute -bottom-6 -left-2 sm:-left-4 z-20 bg-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-[#14243A]/10 flex items-center gap-3 animate-pulse-subtle">
                <div className="text-right">
                  <div className="text-[10px] text-[#14243A]/60 font-semibold">الجلسة القادمة</div>
                  <div className="text-xs sm:text-sm font-extrabold text-[#14243A]">فرع الشمال - 4:00 م</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#D49A2D] text-white flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

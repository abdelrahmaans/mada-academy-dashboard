import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  BookOpen,
  Receipt,
  ExternalLink,
  Wallet,
  GraduationCap,
  Sparkles,
  BarChart3,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { DASHBOARD_URL, DASHBOARD_LIVE_DEMO } from '../lib/publicApi';

export const SystemPreview: React.FC = () => {
  // Main view mode: 'executive_r01' (real project executive view) vs 'operations_sim' (interactive operations)
  const [viewMode, setViewMode] = useState<'executive_r01' | 'operations_sim'>('executive_r01');

  // Executive R01 state
  const [executiveBranch, setExecutiveBranch] = useState<'ALL' | 'maadi' | 'nasr_city' | 'tagamoa'>('ALL');
  const [executivePeriod, setExecutivePeriod] = useState<'current' | 'previous'>('current');

  // Interactive Ops state
  const [selectedBranch, setSelectedBranch] = useState<'riyadh' | 'jeddah' | 'khobar'>('riyadh');
  const [activeTab, setActiveTab] = useState<'attendance' | 'schedule' | 'groups' | 'evaluations' | 'finance'>('attendance');
  const [roleView, setRoleView] = useState<'owner' | 'branch_mgr' | 'instructor'>('owner');

  // Attendance mock data with interactive status toggling
  const [attendanceList, setAttendanceList] = useState([
    { id: 1, name: 'سعد بن عبد الرحمن العتيبي', group: 'روبوتكس - مستوى 2', status: 'present', time: '16:32', note: 'مكتمل الحضور' },
    { id: 2, name: 'ليان بنت فيصل الشمري', group: 'روبوتكس - مستوى 2', status: 'present', time: '16:35', note: 'مكتمل الحضور' },
    { id: 3, name: 'عمر بن خالد الدوسري', group: 'روبوتكس - مستوى 2', status: 'late', time: '16:48', note: 'تأخر 15 دقيقة مع عذر' },
    { id: 4, name: 'فاطمة بنت أحمد القحطاني', group: 'روبوتكس - مستوى 2', status: 'excused', time: '-', note: 'إشعار مسبق من ولي الأمر' },
    { id: 5, name: 'تركي بن عبد العزيز السبيعي', group: 'روبوتكس - مستوى 2', status: 'absent', time: '-', note: 'غير مسجل' }
  ]);

  const toggleAttendanceStatus = (id: number, newStatus: string) => {
    setAttendanceList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  return (
    <div id="preview" className="w-full bg-white rounded-3xl border border-[#14243A]/10 shadow-xl overflow-hidden text-[#14243A]">
      
      {/* Super Top Banner: Mode Switcher & Real Project Connector */}
      <div className="bg-[#0B1522] text-white px-4 sm:px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        
        {/* Toggle between Real Executive Dashboard and Daily Operations */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60 hidden sm:inline">طريقة العرض:</span>
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('executive_r01')}
              className={`py-1.5 px-3.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
                viewMode === 'executive_r01'
                  ? 'bg-[#0D9488] text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>لوحة القيادة التنفيذية (منظور المالك R01)</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">فعلي</span>
            </button>

            <button
              onClick={() => setViewMode('operations_sim')}
              className={`py-1.5 px-3.5 rounded-lg transition-all font-bold flex items-center gap-1.5 ${
                viewMode === 'operations_sim'
                  ? 'bg-[#0D9488] text-white shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>محاكي العمليات اليومية</span>
            </button>
          </div>
        </div>

        {/* Real Project Link Button */}
        <div className="flex items-center gap-3">
          <a
            href={DASHBOARD_LIVE_DEMO}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3.5 text-xs font-bold text-white bg-gradient-to-r from-[#0D9488] to-[#0A7268] hover:from-[#0E9F92] hover:to-[#0D8277] active:scale-[0.98] transition-all rounded-lg flex items-center gap-1.5 shadow-sm border border-teal-400/30"
          >
            <span>فتح لوحة التحكم الفعلية</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: REAL PROJECT EXECUTIVE DASHBOARD (R01_ACADEMY_OWNER)
          Matches client/src/pages/ExecutiveDashboardLive.tsx 1-to-1
         ========================================================================= */}
      {viewMode === 'executive_r01' && (
        <div className="bg-[#F8FAFC]">
          
          {/* Top Control Bar of the Real Dashboard */}
          <div className="p-4 sm:p-6 bg-white border-b border-[#14243A]/10 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#14243A] text-white flex items-center justify-center font-bold">
                R01
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-[#14243A]">لوحة القيادة التنفيذية الموحدة</h3>
                  <span className="text-[10px] font-bold bg-[#0D9488]/10 text-[#0D9488] px-2 py-0.5 rounded-full border border-[#0D9488]/20">
                    نطاق المالك والمدير العام
                  </span>
                </div>
                <p className="text-xs text-[#14243A]/60">
                  متابعة الأداء التشغيلي والمالي المباشر عبر شبكة فروع الأكاديمية
                </p>
              </div>
            </div>

            {/* Branch and Period Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Branch filter */}
              <div className="flex items-center gap-1.5 bg-[#F4F7FA] p-1 rounded-xl border border-[#14243A]/10 text-xs">
                <span className="text-[#14243A]/50 px-2 font-medium">الفرع:</span>
                <button
                  onClick={() => setExecutiveBranch('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    executiveBranch === 'ALL' ? 'bg-white text-[#14243A] shadow-xs' : 'text-[#14243A]/70'
                  }`}
                >
                  كافة الفروع (مجمّع)
                </button>
                <button
                  onClick={() => setExecutiveBranch('maadi')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    executiveBranch === 'maadi' ? 'bg-white text-[#14243A] shadow-xs' : 'text-[#14243A]/70'
                  }`}
                >
                  فرع المعادي
                </button>
                <button
                  onClick={() => setExecutiveBranch('nasr_city')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    executiveBranch === 'nasr_city' ? 'bg-white text-[#14243A] shadow-xs' : 'text-[#14243A]/70'
                  }`}
                >
                  مدينة نصر
                </button>
                <button
                  onClick={() => setExecutiveBranch('tagamoa')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    executiveBranch === 'tagamoa' ? 'bg-white text-[#14243A] shadow-xs' : 'text-[#14243A]/70'
                  }`}
                >
                  التجمع
                </button>
              </div>

              {/* Period */}
              <div className="flex items-center gap-1 bg-[#F4F7FA] p-1 rounded-xl border border-[#14243A]/10 text-xs">
                <button
                  onClick={() => setExecutivePeriod('current')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    executivePeriod === 'current' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-[#14243A]/70'
                  }`}
                >
                  الشهر الحالي
                </button>
                <button
                  onClick={() => setExecutivePeriod('previous')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    executivePeriod === 'previous' ? 'bg-[#0D9488] text-white shadow-xs' : 'text-[#14243A]/70'
                  }`}
                >
                  الشهر السابق
                </button>
              </div>

            </div>

          </div>

          {/* Scope Card / Notice from real project */}
          <div className="p-4 sm:p-6 space-y-6">
            
            <div className="bg-[#14243A] text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#0D9488]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">صلاحية الإدارة العليا المعتمدة (Executive Governance)</h4>
                  <p className="text-[11px] text-white/70">
                    النطاق الحالي: {executiveBranch === 'ALL' ? 'الشبكة الموحدة لكافة الفروع' : executiveBranch === 'maadi' ? 'فرع المعادي' : executiveBranch === 'nasr_city' ? 'فرع مدينة نصر' : 'فرع التجمع الخامس'} · البيانات مسترجعة لحظياً عبر خادم API المعتمد.
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-[#0D9488] font-mono bg-white/10 px-3 py-1 rounded-lg font-bold self-end sm:self-auto">
                SCOPE: MADA-HQ-2026
              </div>
            </div>

            {/* KPI Cards Grid from real ExecutiveDashboardLive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-right">
              
              {/* KPI 1: طلاب نشطون */}
              <div className="p-4 bg-white rounded-2xl border border-[#14243A]/10 shadow-xs hover:border-[#0D9488]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#14243A]/60">طلاب نشطون</span>
                </div>
                <div className="text-2xl font-black text-[#14243A] font-en">
                  {executiveBranch === 'ALL' ? '1,280' : executiveBranch === 'maadi' ? '460' : executiveBranch === 'nasr_city' ? '510' : '310'}
                </div>
                <p className="text-[10px] text-[#14243A]/50 mt-1 font-medium">من سجلات الطلاب النشطة</p>
              </div>

              {/* KPI 2: الجلسات */}
              <div className="p-4 bg-white rounded-2xl border border-[#14243A]/10 shadow-xs hover:border-[#3B82F6]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#14243A]/60">الجلسات</span>
                </div>
                <div className="text-2xl font-black text-[#14243A] font-en">
                  {executiveBranch === 'ALL' ? '342' : '114'}
                </div>
                <p className="text-[10px] text-[#0D9488] mt-1 font-bold">310 مكتملة في الفترة</p>
              </div>

              {/* KPI 3: الحضور */}
              <div className="p-4 bg-white rounded-2xl border border-[#14243A]/10 shadow-xs hover:border-[#8B5CF6]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#14243A]/60">نسبة الحضور</span>
                </div>
                <div className="text-2xl font-black text-[#14243A] font-en">
                  94.2%
                </div>
                <p className="text-[10px] text-[#14243A]/50 mt-1 font-medium">1,840 علامة مسجلة</p>
              </div>

              {/* KPI 4: التحصيل */}
              <div className="p-4 bg-white rounded-2xl border border-[#14243A]/10 shadow-xs hover:border-[#D49A2D]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#D49A2D]/15 text-[#D49A2D] flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#14243A]/60">التحصيل المالي</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#14243A] font-en">
                  {executiveBranch === 'ALL' ? '184,500 ج.م' : '62,000 ج.م'}
                </div>
                <p className="text-[10px] text-[#14243A]/50 mt-1 font-medium">حسب الدفعات المستلمة</p>
              </div>

              {/* KPI 5: مصروفات معتمدة */}
              <div className="p-4 bg-white rounded-2xl border border-[#14243A]/10 shadow-xs hover:border-[#3B82F6]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#14243A]/60">مصروفات معتمدة</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#14243A] font-en">
                  {executiveBranch === 'ALL' ? '42,300 ج.م' : '14,100 ج.م'}
                </div>
                <p className="text-[10px] text-[#14243A]/50 mt-1 font-medium">تشغيل الفروع ومستلزماتها</p>
              </div>

              {/* KPI 6: صافي الحركة */}
              <div className="p-4 bg-white rounded-2xl border border-[#14243A]/10 shadow-xs hover:border-[#0D9488]/40 transition-colors bg-gradient-to-b from-white to-[#0D9488]/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488]/15 text-[#0D9488] flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-[#0D9488]">صافي الحركة</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#0D9488] font-en">
                  {executiveBranch === 'ALL' ? '+142,200 ج.م' : '+47,900 ج.م'}
                </div>
                <p className="text-[10px] text-[#0D9488]/80 mt-1 font-bold">التحصيل ناقص المصروفات</p>
              </div>

            </div>

            {/* Support Summary Strip from real project */}
            <div className="p-3 bg-white rounded-xl border border-[#14243A]/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-6">
                <span>إجمالي التسجيلات النشطة للفترة: <strong className="font-en text-[#14243A]">1,190</strong></span>
                <span className="text-[#14243A]/30">·</span>
                <span>الموافقات الإدارية المعلقة: <strong className="text-amber-600 font-en">4 طلبات</strong></span>
              </div>
              <div className="text-[11px] text-[#0D9488] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                <span>مزامنة سحابية حية مع قاعدة البيانات</span>
              </div>
            </div>

            {/* Recent Executive Activity Feed */}
            <div className="bg-white rounded-2xl border border-[#14243A]/10 p-5 shadow-xs text-right">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#14243A]/10">
                <span className="text-xs font-bold text-[#14243A]">سجل الأنشطة التنفيذية المباشرة (Live Audit Log)</span>
                <span className="text-[11px] font-en text-[#14243A]/50">UPDATED: REALTIME</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                    <span className="font-bold text-[#14243A]">اعتماد مصروف تشغيلي: أدوات معمل الروبوت</span>
                    <span className="text-[#14243A]/50">· فرع المعادي</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-en font-bold text-[#14243A]">1,200 ج.م</span>
                    <span className="text-[10px] text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded font-bold">معتمد</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                    <span className="font-bold text-[#14243A]">تسجيل دفعة اشتراك: الطالب يوسف النجار</span>
                    <span className="text-[#14243A]/50">· مسار الذكاء الاصطناعي</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-en font-bold text-[#14243A]">3,500 ج.م</span>
                    <span className="text-[10px] text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded font-bold">محصل</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#D49A2D]" />
                    <span className="font-bold text-[#14243A]">إتمام جلسة تدريبية وتوثيق حضور 18 طالباً</span>
                    <span className="text-[#14243A]/50">· فرع مدينة نصر</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#14243A]/60">100% نسبة الحضور</span>
                    <span className="text-[10px] text-[#D49A2D] bg-[#D49A2D]/15 px-2 py-0.5 rounded font-bold">مكتمل</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct jump to live project */}
            <div className="p-4 bg-gradient-to-r from-[#14243A] to-[#1C3250] rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-right">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0D9488]" />
                  <span>تريد تجربة هذه الشاشة بكامل تفاصيلها وبياناتها الحية؟</span>
                </h4>
                <p className="text-xs text-white/70 mt-1">
                  لوحة التحكم الفعلية تعمل الآن ومتاحة للدخول التفاعلي عبر شاشات المشرفين والمديرين.
                </p>
              </div>

              <a
                href={DASHBOARD_LIVE_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-[#0D9488] hover:bg-[#0B7D72] text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center gap-2 whitespace-nowrap shadow-md"
              >
                <span>دخول لوحة التحكم المباشرة</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: INTERACTIVE DAILY OPERATIONS SIMULATOR
          Features attendance status toggle, schedule, cohorts, rubric, and finance
         ========================================================================= */}
      {viewMode === 'operations_sim' && (
        <div>
          {/* Top Application Bar */}
          <div className="bg-[#14243A] text-white px-4 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/10 py-1.5 px-3 rounded-lg text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>نطاق الفرع:</span>
              </div>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setSelectedBranch('riyadh')}
                  className={`py-1 px-3 rounded-lg transition-colors font-medium ${
                    selectedBranch === 'riyadh' ? 'bg-[#0D9488] text-white font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  الرياض - النرجس
                </button>
                <button
                  onClick={() => setSelectedBranch('jeddah')}
                  className={`py-1 px-3 rounded-lg transition-colors font-medium ${
                    selectedBranch === 'jeddah' ? 'bg-[#0D9488] text-white font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  جدة - الروضة
                </button>
                <button
                  onClick={() => setSelectedBranch('khobar')}
                  className={`py-1 px-3 rounded-lg transition-colors font-medium ${
                    selectedBranch === 'khobar' ? 'bg-[#0D9488] text-white font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  الخبر - الكورنيش
                </button>
              </div>
            </div>

            {/* Role Scoped View Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/60 hidden sm:inline">معاينة منظور الدور:</span>
              <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => {
                    setRoleView('owner');
                    if (activeTab === 'finance') setActiveTab('finance');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${roleView === 'owner' ? 'bg-white text-[#14243A] font-bold shadow-xs' : 'text-white/70 hover:text-white'}`}
                  title="رؤية شاملة لكافة الفروع والعمليات"
                >
                  المالك
                </button>
                <button
                  onClick={() => {
                    setRoleView('branch_mgr');
                    if (activeTab === 'finance') setActiveTab('finance');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${roleView === 'branch_mgr' ? 'bg-white text-[#14243A] font-bold shadow-xs' : 'text-white/70 hover:text-white'}`}
                  title="نطاق الفرع المحدد فقط"
                >
                  مدير الفرع
                </button>
                <button
                  onClick={() => {
                    setRoleView('instructor');
                    if (activeTab === 'finance') setActiveTab('attendance');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${roleView === 'instructor' ? 'bg-white text-[#14243A] font-bold shadow-xs' : 'text-white/70 hover:text-white'}`}
                  title="المجموعات المسندة للمعلم فقط"
                >
                  المعلم
                </button>
              </div>
            </div>
          </div>

          {/* Workspace Scope Banner */}
          <div className="bg-[#F4F7FA] border-b border-[#14243A]/10 px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-[#14243A]/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span className="font-medium">
                {roleView === 'owner' && 'منظور المالك: استعراض تشغيلي موحد لكافة العمليات والقاعات والحسابات المالية.'}
                {roleView === 'branch_mgr' && 'منظور مدير الفرع: يقتصر الوصول على كشوف وقاعات فرع ' + (selectedBranch === 'riyadh' ? 'الرياض' : selectedBranch === 'jeddah' ? 'جدة' : 'الخبر')}
                {roleView === 'instructor' && 'منظور المعلم: محصور في كشف الحضور وتقييمات المجموعات المسندة فقط (حجب السجلات المالية).'}
              </span>
            </div>
            <div className="font-en text-[11px] text-[#14243A]/50 font-semibold">
              TERMS: Q1 2026/2027 · SCOPE ID: MD-{selectedBranch.toUpperCase()}-09
            </div>
          </div>

          {/* Feature Navigation Tabs */}
          <div className="border-b border-[#14243A]/10 px-4 sm:px-6 bg-white overflow-x-auto">
            <div className="flex items-center gap-1.5 sm:gap-3 py-2.5 min-w-max">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'attendance'
                    ? 'bg-[#14243A] text-white shadow-xs'
                    : 'text-[#14243A]/70 hover:bg-[#F4F7FA] hover:text-[#14243A]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>كشف الحضور الفوري</span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'schedule'
                    ? 'bg-[#14243A] text-white shadow-xs'
                    : 'text-[#14243A]/70 hover:bg-[#F4F7FA] hover:text-[#14243A]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>جدول القاعات والحصص</span>
              </button>

              <button
                onClick={() => setActiveTab('groups')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'groups'
                    ? 'bg-[#14243A] text-white shadow-xs'
                    : 'text-[#14243A]/70 hover:bg-[#F4F7FA] hover:text-[#14243A]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>المجموعات وسجلات الطلاب</span>
              </button>

              <button
                onClick={() => setActiveTab('evaluations')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'evaluations'
                    ? 'bg-[#14243A] text-white shadow-xs'
                    : 'text-[#14243A]/70 hover:bg-[#F4F7FA] hover:text-[#14243A]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>التقييمات والمعايير</span>
              </button>

              {roleView !== 'instructor' ? (
                <button
                  onClick={() => setActiveTab('finance')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'finance'
                      ? 'bg-[#14243A] text-white shadow-xs'
                      : 'text-[#14243A]/70 hover:bg-[#F4F7FA] hover:text-[#14243A]'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 text-[#D49A2D]" />
                  <span>القيود المالية التشغيلية</span>
                </button>
              ) : (
                <span className="py-2 px-3 text-xs text-[#14243A]/40 italic cursor-not-allowed select-none">
                  المالية (صلاحية محجوبة عن المعلم)
                </span>
              )}
            </div>
          </div>

          {/* Tab Contents */}
          <div className="p-4 sm:p-6 bg-[#FAFCFD]">

            {/* VIEW 1: ATTENDANCE ROLL-CALL */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#14243A]/10 text-xs">
                  <div>
                    <span className="font-bold text-[#14243A]">المجموعة: </span>
                    <span className="font-en text-[#14243A]/80 font-semibold">ROB-204</span>
                    <span className="text-[#14243A]/40 mx-2">·</span>
                    <span>المسار: الروبوت والذكاء الاصطناعي - قاعة الخوارزمي</span>
                    <span className="text-[#14243A]/40 mx-2">·</span>
                    <span>المدرب: م. طارق الصالح</span>
                  </div>
                  <div className="text-[#14243A]/70 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>جلسة اليوم: 04:30 م - 06:00 م</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[#14243A]/10 text-[#14243A]/60 pb-2">
                        <th className="py-2.5 font-bold">اسم الطالب</th>
                        <th className="py-2.5 font-bold">المجموعة</th>
                        <th className="py-2.5 font-bold">وقت الرصد</th>
                        <th className="py-2.5 font-bold">ملاحظات التحضير</th>
                        <th className="py-2.5 font-bold text-center">حالة الحضور اليومية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14243A]/5">
                      {attendanceList.map((student) => (
                        <tr key={student.id} className="hover:bg-white transition-colors">
                          <td className="py-3 font-bold text-[#14243A]">{student.name}</td>
                          <td className="py-3 text-[#14243A]/70">{student.group}</td>
                          <td className="py-3 font-en text-[#14243A]/60 font-semibold">{student.time}</td>
                          <td className="py-3 text-[#14243A]/60">{student.note}</td>
                          <td className="py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleAttendanceStatus(student.id, 'present')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                                  student.status === 'present'
                                    ? 'bg-[#0D9488] text-white shadow-xs'
                                    : 'bg-[#F4F7FA] text-[#14243A]/60 hover:text-[#14243A]'
                                }`}
                              >
                                حاضر
                              </button>
                              <button
                                onClick={() => toggleAttendanceStatus(student.id, 'late')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                                  student.status === 'late'
                                    ? 'bg-[#D49A2D] text-white shadow-xs'
                                    : 'bg-[#F4F7FA] text-[#14243A]/60 hover:text-[#14243A]'
                                }`}
                              >
                                متأخر
                              </button>
                              <button
                                onClick={() => toggleAttendanceStatus(student.id, 'excused')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                                  student.status === 'excused'
                                    ? 'bg-[#14243A] text-white shadow-xs'
                                    : 'bg-[#F4F7FA] text-[#14243A]/60 hover:text-[#14243A]'
                                }`}
                              >
                                معتذر
                              </button>
                              <button
                                onClick={() => toggleAttendanceStatus(student.id, 'absent')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                                  student.status === 'absent'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'bg-[#F4F7FA] text-[#14243A]/60 hover:text-[#14243A]'
                                }`}
                              >
                                غائب
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-[#14243A]/10 flex flex-wrap items-center justify-between text-[11px] text-[#14243A]/70 font-medium">
                  <div className="flex items-center gap-3">
                    <span>إجمالي المجموعة: 5 طلاب</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#0D9488] font-bold">نسبة الحضور المرصودة: 60% حاضر</span>
                    <span aria-hidden="true">·</span>
                    <span>1 متأخر</span>
                    <span aria-hidden="true">·</span>
                    <span>1 بعذر</span>
                  </div>
                  <div className="font-en text-[#14243A]/40 font-semibold">
                    AUDIT LOG: UPDATED BY INSTRUCTOR #T-4401
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: SCHEDULE */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#14243A]/10 text-xs">
                  <span className="font-bold text-[#14243A]">جدول القاعات التشغيلي - فرع {selectedBranch === 'riyadh' ? 'الرياض' : selectedBranch === 'jeddah' ? 'جدة' : 'الخبر'}</span>
                  <span className="text-[#14243A]/60 font-en font-bold">TODAY: SUNDAY SCHEDULE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-[#14243A]/10 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#14243A]">معمل البرمجة (A1)</span>
                      <span className="text-[#0D9488] font-bold text-[11px] bg-[#0D9488]/10 px-2 py-0.5 rounded-md">حصة جارية الآن</span>
                    </div>
                    <div className="text-xs space-y-1 text-[#14243A]/75">
                      <p className="font-bold text-[#14243A]">تطوير الويب - دفعة الواعدين</p>
                      <p className="font-en text-[#14243A]/60 font-semibold">04:00 PM - 05:30 PM</p>
                      <p className="text-[11px]">المدرّب: أ. فيصل الدوسري · 14 طالبًا</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#14243A]/10 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#14243A]">قاعة الخوارزمي (B2)</span>
                      <span className="text-[#D49A2D] font-bold text-[11px] bg-[#D49A2D]/15 px-2 py-0.5 rounded-md">تبدأ بعد 30 دقيقة</span>
                    </div>
                    <div className="text-xs space-y-1 text-[#14243A]/75">
                      <p className="font-bold text-[#14243A]">الرياضيات التطبيقية - المستوى المتقدم</p>
                      <p className="font-en text-[#14243A]/60 font-semibold">05:30 PM - 07:00 PM</p>
                      <p className="text-[11px]">المدرّب: د. منى النجار · 12 طالبًا</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#14243A]/10 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#14243A]">معمل الروبوت والميكانيكا</span>
                      <span className="text-[#14243A]/50 text-[11px] bg-[#14243A]/5 px-2 py-0.5 rounded-md font-semibold">مكتملة</span>
                    </div>
                    <div className="text-xs space-y-1 text-[#14243A]/75">
                      <p className="font-bold text-[#14243A]">هندسة الروبوت - تمهيدي</p>
                      <p className="font-en text-[#14243A]/60 font-semibold">02:30 PM - 04:00 PM</p>
                      <p className="text-[11px]">المدرّب: م. طارق الصالح · تم اعتماد الكشف</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#14243A]/10 text-xs">
                  <p className="font-bold text-[#14243A] mb-1">تنبيه تعارض القاعات والتجهيزات:</p>
                  <p className="text-[#14243A]/70 text-[11px] leading-relaxed">
                    النظام يتحقق آليًا من عدم حجز قاعة لأكثر من مجموعة في نفس التوقيت، مع تثبيت جدول المعلم وسعته المعتمدة لمنع الازدواجية عبر الفروع.
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 3: GROUPS */}
            {activeTab === 'groups' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#14243A]/10 text-xs">
                  <span className="font-bold text-[#14243A]">المجموعات النشطة والطاقة الاستيعابية</span>
                  <span className="text-[#14243A]/60 text-[11px] font-medium">فرز حسب المستوى والقاعة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-white rounded-xl border border-[#14243A]/10 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#14243A]">مجموعة البرمجة الإثرائية (PY-101)</span>
                      <span className="font-en text-[#0D9488] font-bold text-[11px] bg-[#0D9488]/10 px-2 py-0.5 rounded">12 / 12 طالب (مكتملة)</span>
                    </div>
                    <div className="text-[11px] text-[#14243A]/70 space-y-1">
                      <p>الفئة العمرية: 14 - 17 سنة · الفصل: الأول</p>
                      <p>المشرف: م. فيصل الدوسري · القاعة: معمل 1</p>
                    </div>
                    <div className="w-full bg-[#F4F7FA] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0D9488] h-full w-full" />
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-[#14243A]/10 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#14243A]">مجموعة تصميم النماذج (UX-201)</span>
                      <span className="font-en text-[#D49A2D] font-bold text-[11px] bg-[#D49A2D]/15 px-2 py-0.5 rounded">8 / 10 طلاب (متاح مقعدان)</span>
                    </div>
                    <div className="text-[11px] text-[#14243A]/70 space-y-1">
                      <p>الفئة العمرية: 15 - 18 سنة · الفصل: الأول</p>
                      <p>المشرفة: أ. ريم الدوسري · القاعة: قاعة الابتكار</p>
                    </div>
                    <div className="w-full bg-[#F4F7FA] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#D49A2D] h-full w-[80%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: EVALUATIONS */}
            {activeTab === 'evaluations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#14243A]/10 text-xs">
                  <div>
                    <span className="font-bold text-[#14243A]">مصفوفة معايير التقييم الأكاديمي: </span>
                    <span className="text-[#14243A]/70">نموذج معتمد لدورات الروبوت التطبيقي</span>
                  </div>
                  <span className="font-en text-[11px] text-[#14243A]/50 font-bold">RUBRIC-STANDARD-V2</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#14243A]/10 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                    <div>
                      <p className="font-bold text-[#14243A]">المعيار 1: التحليل المنطقي وخوارزمية الحركة</p>
                      <p className="text-[11px] text-[#14243A]/60 mt-0.5">قدرة الطالب على بناء خطوات الحل البرمجي قبل كتابة الكود</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2.5 py-1 bg-[#0D9488]/10 text-[#0D9488] font-bold text-[11px] rounded-md">
                        متقدم (4/4)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#14243A]/10 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                    <div>
                      <p className="font-bold text-[#14243A]">المعيار 2: التوصيل الفيزيائي للمستشعرات</p>
                      <p className="text-[11px] text-[#14243A]/60 mt-0.5">الدقة في توصيل أسلاك الحساسات والمحركات على لوحة التحكم</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2.5 py-1 bg-[#14243A]/10 text-[#14243A] font-bold text-[11px] rounded-md">
                        كفء (3/4)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#14243A]/10 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                    <div>
                      <p className="font-bold text-[#14243A]">المعيار 3: العمل التشاركي وتوثيق المشروع</p>
                      <p className="text-[11px] text-[#14243A]/60 mt-0.5">الالتزام بدور الفريق وتدوين الملاحظات الفنية بملف الإنجاز</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2.5 py-1 bg-[#0D9488]/10 text-[#0D9488] font-bold text-[11px] rounded-md">
                        متقدم (4/4)
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[11px] text-[#14243A]/60 font-medium">
                  * التقييمات تراكمية وتصدر تقرير تقدم فصلي رسمي يمكن تصديره ومشاركته مع ولي الأمر وفق الصلاحية.
                </p>
              </div>
            )}

            {/* VIEW 5: FINANCE */}
            {activeTab === 'finance' && roleView !== 'instructor' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#14243A]/10 text-xs">
                  <div>
                    <span className="font-bold text-[#14243A]">سجل القيود والمقبوضات والمصروفات التشغيلية</span>
                    <span className="text-[#14243A]/40 mx-2">·</span>
                    <span className="text-[#14243A]/70">توثيق القيود الداخلية للفروع</span>
                  </div>
                  <span className="text-[11px] text-[#0D9488] font-bold bg-[#0D9488]/10 px-2.5 py-0.5 rounded-md">
                    تمت مطابقة قيود اليوم
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[#14243A]/10 text-[#14243A]/60 pb-2">
                        <th className="py-2.5 font-bold">رقم القيد</th>
                        <th className="py-2.5 font-bold">البيان التشغيلي</th>
                        <th className="py-2.5 font-bold">النوع</th>
                        <th className="py-2.5 font-bold font-en">المبلغ (SAR)</th>
                        <th className="py-2.5 font-bold">حالة القيد والتسوية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14243A]/5">
                      <tr className="hover:bg-white transition-colors">
                        <td className="py-3 font-en text-[#14243A]/80 font-bold">TX-2026-881</td>
                        <td className="py-3 text-[#14243A] font-medium">قيد سداد اشتراك فصل دراسي - الطالب: سعد العتيبي</td>
                        <td className="py-3 text-[#0D9488] font-bold">إيراد اشتراك</td>
                        <td className="py-3 font-en font-black text-[#14243A] tabular-nums">2,450.00</td>
                        <td className="py-3 text-[#0D9488] font-semibold">مسجل ومطابق بالحساب البنكي</td>
                      </tr>
                      <tr className="hover:bg-white transition-colors">
                        <td className="py-3 font-en text-[#14243A]/80 font-bold">TX-2026-882</td>
                        <td className="py-3 text-[#14243A] font-medium">شراء حقائب إلكترونية لمعمل الروبوت - فرع الرياض</td>
                        <td className="py-3 text-[#D49A2D] font-bold">مصروف تشغيلي</td>
                        <td className="py-3 font-en font-black text-[#14243A] tabular-nums">1,120.00</td>
                        <td className="py-3 text-[#14243A]/70">معتمد ومرفق الفاتورة الضريبية</td>
                      </tr>
                      <tr className="hover:bg-white transition-colors">
                        <td className="py-3 font-en text-[#14243A]/80 font-bold">TX-2026-883</td>
                        <td className="py-3 text-[#14243A] font-medium">دفعة رسوم مجدولة - الطالبة: ليان الشمري</td>
                        <td className="py-3 text-[#0D9488] font-bold">إيراد اشتراك</td>
                        <td className="py-3 font-en font-black text-[#14243A] tabular-nums">1,200.00</td>
                        <td className="py-3 text-[#0D9488] font-semibold">مسجل ومطابق</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-[#F4F7FA] border border-[#14243A]/10 rounded-xl text-[11px] text-[#14243A]/80 flex items-start gap-2.5">
                  <Receipt className="w-4 h-4 text-[#D49A2D] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#14243A]">توضيح تشغيلي مهم: </span>
                    <span>
                      نظام مدى يسجل القيود والمدفوعات والمصروفات التشغيلية لضبط الحسابات الداخلية ودفاتر الأكاديمية، ولا يعمل كبوابة دفع إلكتروني أو وسيط مالي خارجي.
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

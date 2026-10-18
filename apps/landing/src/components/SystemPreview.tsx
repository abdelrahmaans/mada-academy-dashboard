import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  BarChart3, 
  Bell, 
  LayoutDashboard, 
  CalendarDays, 
  MapPin, 
  ShieldCheck, 
  ChevronLeft, 
  GraduationCap, 
  ArrowUpRight,
  Lock,
  Sparkles
} from 'lucide-react';
import { DASHBOARD_LIVE_DEMO } from '../lib/publicApi';

type ViewMode = 'overview' | 'branches' | 'alerts' | 'pnl';

interface BranchData {
  name: string;
  manager: string;
  students: number;
  instructors: number;
  attendance: number;
  capacity: number;
  leads: number;
  tickets: number;
  collected: number;
  expenses: number;
  trend: number;
  health: 'good' | 'watch';
}

const ALL_BRANCHES: BranchData[] = [
  { 
    name: 'مدينة نصر', 
    manager: 'أحمد محمود', 
    students: 248, 
    instructors: 9, 
    attendance: 86, 
    capacity: 78, 
    leads: 12, 
    tickets: 2, 
    collected: 128500, 
    expenses: 38500, 
    trend: 5.6, 
    health: 'good' 
  },
  { 
    name: 'المعادي', 
    manager: 'سارة كمال', 
    students: 186, 
    instructors: 7, 
    attendance: 91, 
    capacity: 69, 
    leads: 8, 
    tickets: 1, 
    collected: 101200, 
    expenses: 29400, 
    trend: 3.1, 
    health: 'good' 
  },
  { 
    name: 'الشيخ زايد', 
    manager: 'يوسف عماد', 
    students: 121, 
    instructors: 5, 
    attendance: 81, 
    capacity: 57, 
    leads: 5, 
    tickets: 3, 
    collected: 72400, 
    expenses: 31800, 
    trend: -2.4, 
    health: 'watch' 
  },
];

const ALERTS_DATA = [
  { 
    id: 'AL-1', 
    type: 'urgent', 
    title: 'انخفاض الحضور في الشيخ زايد', 
    detail: '81% هذا الشهر · أقل من هدف الأكاديمية 85%', 
    branch: 'الشيخ زايد', 
    action: 'فتح المتابعة' 
  },
  { 
    id: 'AL-2', 
    type: 'finance', 
    title: '3 تذاكر مالية تحتاج تصعيداً', 
    detail: 'تذاكر تشغيلية وحسابات من فرع الشيخ زايد', 
    branch: 'الشيخ زايد', 
    action: 'مراجعة التذاكر' 
  },
  { 
    id: 'AL-3', 
    type: 'growth', 
    title: 'فرصة نمو في مدينة نصر', 
    detail: '12 Lead نشطاً وطاقة تشغيلية 78%', 
    branch: 'مدينة نصر', 
    action: 'فتح تقرير النمو' 
  },
  { 
    id: 'AL-4', 
    type: 'academic', 
    title: 'المعادي يتصدر الحضور', 
    detail: '91% حضور مع 186 طالباً نشطاً', 
    branch: 'المعادي', 
    action: 'عرض التفاصيل' 
  },
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export const SystemPreview: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  const [selectedBranch, setSelectedBranch] = useState<string>('كل الفروع');
  const [selectedMonth, setSelectedMonth] = useState<string>('سبتمبر 2026');

  // Filter branches according to selected branch
  const scopedBranches = useMemo(() => {
    if (selectedBranch === 'كل الفروع') return ALL_BRANCHES;
    return ALL_BRANCHES.filter((b) => b.name === selectedBranch);
  }, [selectedBranch]);

  // Aggregated totals
  const totalStudents = scopedBranches.reduce((acc, b) => acc + b.students, 0);
  const avgAttendance = Math.round(
    scopedBranches.reduce((acc, b) => acc + b.attendance, 0) / (scopedBranches.length || 1)
  );
  const totalCollected = scopedBranches.reduce((acc, b) => acc + b.collected, 0);
  const totalExpenses = scopedBranches.reduce((acc, b) => acc + b.expenses, 0);
  const totalLeads = scopedBranches.reduce((acc, b) => acc + b.leads, 0);
  const totalTickets = scopedBranches.reduce((acc, b) => acc + b.tickets, 0);

  return (
    <div className="w-full bg-white rounded-3xl border border-[#14243A]/15 shadow-2xl overflow-hidden text-[#14243A]">
      
      {/* 1. Browser OS Window Bar */}
      <div className="bg-[#0B1522] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 text-xs">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
        </div>

        {/* Browser URL Bar */}
        <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-white/70 text-[11px] font-mono border border-white/10 max-w-md w-full justify-center">
          <Lock className="w-3 h-3 text-[#0D9488]" />
          <span>app.mada-academy.com/executive-dashboard</span>
          <span className="text-teal-400 font-bold ml-1">· Live R01</span>
        </div>

        {/* Real App Launch CTA */}
        <a
          href={DASHBOARD_LIVE_DEMO}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-white bg-[#0D9488] hover:bg-[#0B7D72] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span>فتح النظام الفعلي</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 2. Main Shell Layout: Authentic Sidebar + Main Panel (RTL) */}
      <div className="flex flex-col lg:flex-row min-h-[640px] text-right">
        
        {/* Authentic Right Sidebar (Matching client/src/pages/ExecutiveDashboard.tsx) */}
        <aside className="w-full lg:w-64 bg-[#0B1522] text-white p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-white/10 shrink-0">
          
          <div className="space-y-6">
            {/* Brand Logo & Role Code */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>مَـدَى</span>
                  <span className="text-[10px] font-bold bg-[#0D9488] text-white px-2 py-0.5 rounded-md">
                    R01
                  </span>
                </div>
                <div className="text-[11px] text-white/60">
                  الإدارة التنفيذية والمالك
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Academy Switcher (Tenant Scope) */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0D9488]/20 text-teal-300 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">أكاديمية مدى الدولية</div>
                <div className="text-[10px] text-white/50 truncate">مسؤول الأكاديمية · Tenant</div>
              </div>
            </div>

            {/* Primary Navigation Links (Matching Real Dashboard) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-2">
                لوحة الإدارة
              </div>

              <button
                onClick={() => setActiveView('overview')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'overview'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>الملخص التنفيذي</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('branches')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'branches'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4" />
                  <span>مقارنة الفروع</span>
                </div>
                <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded">3</span>
              </button>

              <button
                onClick={() => setActiveView('pnl')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'pnl'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>الأرباح والتحصيل</span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('alerts')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'alerts'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4" />
                  <span>التنبيهات والقرارات</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded-full">
                  {ALERTS_DATA.length}
                </span>
              </button>
            </div>

            {/* Quick System Links */}
            <div className="space-y-1 pt-4 border-t border-white/10 hidden sm:block">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-2">
                روابط الإدارة
              </div>
              <div className="text-xs text-white/60 p-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-white/40" />
                <span>شؤون الطلاب والتسجيل</span>
              </div>
              <div className="text-xs text-white/60 p-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-white/40" />
                <span>المالية والتحصيل</span>
              </div>
            </div>

          </div>

          {/* Sidebar Bottom Security Stamp */}
          <div className="pt-4 border-t border-white/10 text-[10px] text-white/40 flex items-center justify-between">
            <span>نطاق الأكاديمية فقط</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          </div>

        </aside>

        {/* Authentic Main Workspace Panel */}
        <main className="flex-1 bg-[#F4F7FA] p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Topbar: Filters & Scope Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#14243A]/10">
              
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Branch selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#14243A]/10 text-xs font-bold shadow-xs">
                  <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span className="text-[#14243A]/50 font-normal">الفرع:</span>
                  <select 
                    value={selectedBranch} 
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="bg-transparent text-[#14243A] font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="كل الفروع">كل الفروع (مجمّع)</option>
                    <option value="مدينة نصر">فرع مدينة نصر</option>
                    <option value="المعادي">فرع المعادي</option>
                    <option value="الشيخ زايد">فرع الشيخ زايد</option>
                  </select>
                </div>

                {/* Month selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#14243A]/10 text-xs font-bold shadow-xs">
                  <CalendarDays className="w-3.5 h-3.5 text-[#0D9488]" />
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-[#14243A] font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="سبتمبر 2026">سبتمبر 2026</option>
                    <option value="أغسطس 2026">أغسطس 2026</option>
                    <option value="يوليو 2026">يوليو 2026</option>
                  </select>
                </div>

              </div>

              {/* Scope Badge */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D9488] bg-[#0D9488]/10 border border-[#0D9488]/20 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>نطاق الأكاديمية فقط · Tenant Scope</span>
              </div>

            </div>

            {/* Page Header (Eyebrow + Title) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D9488]">
                <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                <span>الإدارة التنفيذية · R01</span>
                <span className="text-[#14243A]/30">·</span>
                <span className="text-[#14243A]/60 font-mono">{selectedMonth} · {selectedBranch}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#14243A]">
                {activeView === 'overview' && 'لوحة الإدارة التنفيذية'}
                {activeView === 'branches' && 'مقارنة أداء الفروع'}
                {activeView === 'pnl' && 'الأرباح واستبقاء الطلاب'}
                {activeView === 'alerts' && 'مركز التنبيهات والقرارات'}
              </h3>
              <p className="text-xs sm:text-sm text-[#14243A]/65">
                {activeView === 'overview' && 'رؤية واحدة لأداء الأكاديمية، الفروع، النمو، التشغيل، والماليات.'}
                {activeView === 'branches' && 'قارن أداء الفروع بالمؤشرات نفسها دون فقدان سياق كل فرع.'}
                {activeView === 'pnl' && 'تحليلات الأرباح والخسائر لكل فرع، اقتصاديات الوحدة، والتحصيل.'}
                {activeView === 'alerts' && 'رتّب التنبيهات حسب الأثر المالي والتشغيلي واتخذ القرار فوراً.'}
              </p>
            </div>

            {/* ================= VIEW 1: OVERVIEW ================= */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                
                {/* 4 Authentic KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  
                  {/* KPI 1: طلاب نشطون */}
                  <div className="bg-white p-4 rounded-2xl border border-[#14243A]/10 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#14243A]/60">طلاب نشطون</span>
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#14243A] font-mono">
                      {totalStudents}
                    </div>
                    <div className="text-[11px] text-[#14243A]/50 mt-1">
                      عبر نطاق {selectedBranch}
                    </div>
                  </div>

                  {/* KPI 2: متوسط الحضور */}
                  <div className="bg-white p-4 rounded-2xl border border-[#14243A]/10 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#14243A]/60">متوسط الحضور</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                      {avgAttendance}%
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-1">
                      هدف الأكاديمية 85% ✓
                    </div>
                  </div>

                  {/* KPI 3: التحصيل المالي */}
                  <div className="bg-white p-4 rounded-2xl border border-[#14243A]/10 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#14243A]/60">إجمالي التحصيل</span>
                      <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#14243A] font-mono">
                      {formatMoney(totalCollected)} <span className="text-xs font-sans text-[#14243A]/60">ج.م</span>
                    </div>
                    <div className="text-[11px] text-[#14243A]/50 mt-1">
                      هذا الشهر (صافي: {formatMoney(totalCollected - totalExpenses)} ج.م)
                    </div>
                  </div>

                  {/* KPI 4: Leads نشطة */}
                  <div className="bg-white p-4 rounded-2xl border border-[#14243A]/10 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#14243A]/60">Leads نشطة</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
                      {totalLeads}
                    </div>
                    <div className="text-[11px] text-[#14243A]/50 mt-1">
                      بانتظار التحويل والتسكين
                    </div>
                  </div>

                </div>

                {/* 2 Grid Panels: نبض الفروع + قرارات اليوم */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Panel A: نبض الفروع */}
                  <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-[#14243A]/10 shadow-xs">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#14243A]/10">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#0D9488]" />
                        <h4 className="text-sm font-bold text-[#14243A]">نبض الفروع التشغيلي</h4>
                      </div>
                      <button 
                        onClick={() => setActiveView('branches')}
                        className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                      >
                        <span>مقارنة كاملة</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {scopedBranches.map((branch) => (
                        <div 
                          key={branch.name}
                          className="p-3 rounded-xl bg-[#F8FAFC] border border-[#14243A]/5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-[#14243A]">{branch.name}</div>
                              <div className="text-[#14243A]/50 text-[11px]">{branch.manager} · {branch.students} طالب</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Attendance Progress bar */}
                            <div className="hidden sm:block text-left w-24">
                              <div className="text-[10px] text-[#14243A]/60 mb-0.5">حضور {branch.attendance}%</div>
                              <div className="w-full bg-[#14243A]/10 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${branch.attendance >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${branch.attendance}%` }} 
                                />
                              </div>
                            </div>

                            <div className="text-left font-mono font-bold text-[#14243A]">
                              {formatMoney(branch.collected)} <span className="text-[10px] text-[#14243A]/50">ج.م</span>
                            </div>

                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              branch.trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {branch.trend > 0 ? `+${branch.trend}%` : `${branch.trend}%`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel B: قرارات اليوم */}
                  <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-[#14243A]/10 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#14243A]/10">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <h4 className="text-sm font-bold text-[#14243A]">قرارات اليوم العاجلة</h4>
                        </div>
                        <span className="text-xs font-bold text-[#14243A]/50">{ALERTS_DATA.length} عناصر</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs">
                          <div className="font-bold text-amber-900 flex items-center justify-between">
                            <span>فرع يحتاج متابعة تشغيلية</span>
                            <span className="text-[10px] bg-amber-200/60 px-1.5 rounded text-amber-800">عاجل</span>
                          </div>
                          <div className="text-amber-800/80 text-[11px] mt-0.5">
                            الشيخ زايد · الحضور 81% (أقل من هدف الأكاديمية) و 3 تذاكر مفتوحة
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs">
                          <div className="font-bold text-emerald-900">
                            أفضل أداء أكاديمي هذا الشهر
                          </div>
                          <div className="text-emerald-800/80 text-[11px] mt-0.5">
                            فرع المعادي · حضور 91% مع 186 طالباً مسجلاً ونمو 3.1%
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-200/60 text-xs">
                          <div className="font-bold text-violet-900">
                            صافي الحركة المالية المعتمدة
                          </div>
                          <div className="text-violet-800/80 text-[11px] mt-0.5">
                            {formatMoney(totalCollected - totalExpenses)} ج.م متوفرة بعد تسوية رواتب ومصروفات الفروع
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#14243A]/10 mt-3 flex items-center justify-between text-xs">
                      <span className="text-[#14243A]/60">التنبيهات محدثة لحظياً</span>
                      <button 
                        onClick={() => setActiveView('alerts')}
                        className="font-bold text-[#0D9488] hover:underline"
                      >
                        عرض كل التنبيهات
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ================= VIEW 2: BRANCH COMPARISON ================= */}
            {activeView === 'branches' && (
              <div className="bg-white rounded-2xl border border-[#14243A]/10 shadow-xs overflow-x-auto">
                <table className="w-full text-xs text-right min-w-[550px]">
                  <thead>
                    <tr className="bg-[#14243A] text-white">
                      <th className="py-3 px-4 font-bold">الفرع والمدير</th>
                      <th className="py-3 px-3 font-bold text-center">الطلاب</th>
                      <th className="py-3 px-3 font-bold text-center">الحضور</th>
                      <th className="py-3 px-3 font-bold text-center">الطاقة</th>
                      <th className="py-3 px-3 font-bold text-center">Leads</th>
                      <th className="py-3 px-4 font-bold text-left">التحصيل</th>
                      <th className="py-3 px-4 font-bold text-left text-teal-300">الصافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14243A]/10">
                    {scopedBranches.map((b) => (
                      <tr key={b.name} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-bold">
                          <div>{b.name}</div>
                          <div className="text-[11px] text-[#14243A]/50 font-normal">{b.manager}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">{b.students}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">{b.attendance}%</td>
                        <td className="py-3 px-3 text-center font-mono">{b.capacity}%</td>
                        <td className="py-3 px-3 text-center font-mono text-amber-700 font-bold">{b.leads}</td>
                        <td className="py-3 px-4 text-left font-mono font-bold">{formatMoney(b.collected)} ج.م</td>
                        <td className="py-3 px-4 text-left font-mono font-bold text-teal-700">{formatMoney(b.collected - b.expenses)} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ================= VIEW 3: ALERTS & DECISIONS ================= */}
            {activeView === 'alerts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ALERTS_DATA.map((alert) => (
                  <div key={alert.id} className="bg-white p-4 rounded-2xl border border-[#14243A]/10 shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-[#0D9488] font-bold">{alert.id} · {alert.branch}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {alert.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#14243A]">{alert.title}</h4>
                      <p className="text-xs text-[#14243A]/70 mt-1">{alert.detail}</p>
                    </div>
                    <button className="py-2 px-3 rounded-lg bg-[#14243A] hover:bg-[#1C3250] text-white text-xs font-bold transition-all flex items-center justify-between">
                      <span>{alert.action}</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ================= VIEW 4: PNL & CASH FLOW ================= */}
            {activeView === 'pnl' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#14243A]/10 shadow-xs">
                  <div className="text-xs text-[#14243A]/60 font-bold">إجمالي الإيرادات المحصلة</div>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                    {formatMoney(totalCollected)} ج.م
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-2">إيصالات معتمدة من الخزينة</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#14243A]/10 shadow-xs">
                  <div className="text-xs text-[#14243A]/60 font-bold">المصروفات ورواتب المدربين</div>
                  <div className="text-2xl font-black text-rose-700 font-mono mt-1">
                    {formatMoney(totalExpenses)} ج.م
                  </div>
                  <div className="text-[11px] text-rose-600 mt-2">أجور الحصص المنفذة والإيجارات</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#14243A]/10 shadow-xs">
                  <div className="text-xs text-[#14243A]/60 font-bold">صافي الأرباح التشغيلية</div>
                  <div className="text-2xl font-black text-teal-700 font-mono mt-1">
                    {formatMoney(totalCollected - totalExpenses)} ج.م
                  </div>
                  <div className="text-[11px] text-teal-600 mt-2">هامش ربح تشغيلي +67%</div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Live Notice */}
          <div className="mt-6 pt-4 border-t border-[#14243A]/10 flex flex-wrap items-center justify-between text-xs text-[#14243A]/60 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>واجهة مطابقة للوحة التحكم الفعلية للعميل مع صلاحية الإدارة R01</span>
            </div>
            <span className="font-mono text-[#0D9488]">Mada Core Engine v2.4</span>
          </div>

        </main>

      </div>

    </div>
  );
};

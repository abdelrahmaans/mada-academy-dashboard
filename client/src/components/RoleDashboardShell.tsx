import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLocation } from "wouter";

export type RoleNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type RoleDashboardShellProps = {
  roleCode: string;
  roleName: string;
  userName: string;
  scopeLabel: string;
  navItems: RoleNavigationItem[];
  children: ReactNode;
};

const rolePreviews = [
  { label: "مدير المنصة · R00", path: "/platform-console" },
  { label: "مالك الأكاديمية · R01", path: "/academy-owner" },
  { label: "مدير الفرع · R02", path: "/" },
  { label: "رئيس المدربين · R03", path: "/head-instructors" },
  { label: "المدرب · R04", path: "/instructor" },
  { label: "السكرتارية · R05", path: "/secretary" },
  { label: "المحاسب · R06", path: "/finance" },
];

export function RoleScopeCard({
  scope,
  description,
}: {
  scope: string;
  description: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm">
          <ShieldCheck size={19} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold text-teal-800">نطاق الدور</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{scope}</p>
          <p className="mt-1 text-xs leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-[11px] font-bold text-teal-800">
        <ShieldCheck size={13} aria-hidden="true" />
        معاينة UI فقط
      </span>
    </section>
  );
}

export default function RoleDashboardShell({
  roleCode,
  roleName,
  userName,
  scopeLabel,
  navItems,
  children,
}: RoleDashboardShellProps) {
  const [path, navigate] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900" dir="rtl">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={closeMobileNav}
        />
      )}
      <div className="min-h-screen lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
        <aside
          id="role-dashboard-sidebar"
          className={`fixed inset-y-0 right-0 z-50 flex w-[276px] flex-col border-l border-white/10 bg-[#101c31] px-4 pb-4 pt-5 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${mobileNavOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-300/20">
                <Building2 size={21} aria-hidden="true" />
              </span>
              <div>
                <p className="text-lg font-extrabold tracking-tight">مدى</p>
                <p className="text-[10px] text-slate-400">منصة الأكاديميات</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 lg:hidden"
              onClick={closeMobileNav}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-100">
                {roleName}
              </span>
              <span className="rounded-full bg-teal-400/15 px-2 py-1 text-[10px] font-extrabold text-teal-200">
                {roleCode}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              نطاق العرض
            </p>
            <p className="mt-0.5 text-sm font-bold text-white">{scopeLabel}</p>
          </div>

          <p className="mb-2 mt-7 px-3 text-[10px] font-bold tracking-wide text-slate-400">
            مساحة العمل
          </p>
          <nav aria-label={`تنقل ${roleName}`} className="grid gap-1.5">
            {navItems.map(item => {
              const active = path === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-right text-sm font-semibold transition ${active ? "bg-teal-600 text-white shadow-lg shadow-teal-950/20" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}
                  onClick={() => {
                    navigate(item.href);
                    closeMobileNav();
                  }}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.035] p-3 text-[11px] leading-5 text-slate-400">
            هذه مساحة معاينة للأدوار. اختيار الدور هنا لا ينفّذ تسجيل دخول أو
            يفرض صلاحيات.
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-3 flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-300 hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowRight size={15} aria-hidden="true" />
            معاينة لوحة الفرع
          </button>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex min-h-[70px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-sm shadow-slate-900/[0.02] backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="فتح القائمة"
                aria-controls="role-dashboard-sidebar"
                aria-expanded={mobileNavOpen}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu size={19} />
              </button>
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 sm:flex">
                <Building2
                  size={15}
                  className="text-teal-700"
                  aria-hidden="true"
                />
                {scopeLabel}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-extrabold text-amber-800 ring-1 ring-amber-200 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                DEMO · بيانات محلية
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <label className="hidden items-center gap-2 text-[11px] font-semibold text-slate-500 md:flex">
                معاينة الدور
                <span className="relative">
                  <select
                    aria-label="تبديل معاينة الدور"
                    value={
                      rolePreviews.some(item => item.path === path)
                        ? path
                        : "/platform-console"
                    }
                    onChange={event => navigate(event.target.value)}
                    className="h-10 min-w-48 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  >
                    {rolePreviews.map(item => (
                      <option key={item.path} value={item.path}>
                        {item.label}
                      </option>
                    ))}
                    <option value="__future_roles" disabled>
                      R07–R09 · قيد التصميم
                    </option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                </span>
              </label>
              <div className="hidden h-8 w-px bg-slate-200 sm:block" />
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-xs font-extrabold text-teal-800 ring-1 ring-teal-100">
                  {userName.slice(0, 1)}
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-xs font-bold text-slate-800">
                    {userName}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {roleName} · معاينة
                  </span>
                </span>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, LogIn, Home, KeyRound, ShieldAlert, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearTokens } from "@/lib/apiClient";
import { ROLE_DEFINITIONS, type RoleCode } from "@/lib/roleNavigation";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

type SessionMetadata = {
  hasToken: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  roleCode: string | null;
  roleLabel: string | null;
  accountType: string | null;
  userId: string | null;
  tenantId: string | null;
  branchId: string | null;
};

function getSessionMetadata(): SessionMetadata {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("mada.accessToken") : null;
    if (!token) {
      return {
        hasToken: false,
        isExpired: false,
        expiresAt: null,
        roleCode: null,
        roleLabel: null,
        accountType: null,
        userId: null,
        tenantId: null,
        branchId: null,
      };
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        hasToken: true,
        isExpired: true,
        expiresAt: null,
        roleCode: null,
        roleLabel: null,
        accountType: null,
        userId: null,
        tenantId: null,
        branchId: null,
      };
    }
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp ? Number(payload.exp) * 1000 : null;
    const isExpired = exp ? Date.now() >= exp : false;
    const expiresAt = exp
      ? new Date(exp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
      : null;
    const rawRole = (payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]) as string | undefined;

    let roleLabel = null;
    if (rawRole) {
      const normalizedRole = rawRole.startsWith("R0") ? rawRole.slice(0, 3) : rawRole;
      roleLabel = ROLE_DEFINITIONS[normalizedRole as RoleCode]?.label || rawRole;
    }

    return {
      hasToken: true,
      isExpired,
      expiresAt,
      roleCode: rawRole || null,
      roleLabel,
      accountType: payload.accountType || null,
      userId: payload.sub || null,
      tenantId: payload.tenantId || null,
      branchId: payload.branchId || null,
    };
  } catch {
    return {
      hasToken: false,
      isExpired: false,
      expiresAt: null,
      roleCode: null,
      roleLabel: null,
      accountType: null,
      userId: null,
      tenantId: null,
      branchId: null,
    };
  }
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleGoToLogin = () => {
    clearTokens();
    try {
      localStorage.removeItem("mada_auth_token");
      sessionStorage.clear();
    } catch {}
    window.location.href = "/login";
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    const session = getSessionMetadata();
    const roleCode = session.roleCode;
    if (roleCode === "R06" || roleCode?.startsWith("R06")) {
      window.location.href = "/finance-desk";
      return;
    }
    if (roleCode === "R05" || roleCode?.startsWith("R05")) {
      window.location.href = "/secretary-desk";
      return;
    }
    if (roleCode === "R04" || roleCode?.startsWith("R04")) {
      window.location.href = "/instructor-desk";
      return;
    }
    if (roleCode === "R03" || roleCode?.startsWith("R03")) {
      window.location.href = "/head-instructors";
      return;
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const session = getSessionMetadata();

      return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-slate-50 text-slate-800" dir="rtl">
          <div className="flex flex-col items-center w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5 shadow-sm">
              <ShieldAlert size={34} />
            </div>

            {/* Title & Explanation */}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center">
              تعذر إكمال عرض الصفحة
            </h1>
            <p className="text-sm text-slate-500 mb-6 text-center leading-relaxed max-w-md">
              واجهت الواجهة استثناءً مؤقتاً أثناء معالجة البيانات. تم إيقاف المكون بأمان لحماية الجلسة والبيانات.
            </p>

            {/* Auth / Session Card - Only details shown */}
            <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 mb-6 text-right">
              <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-200 text-slate-800 font-semibold text-sm">
                <KeyRound size={17} className="text-teal-600" />
                <span>حالة المصادقة وجلسة العمل (Auth Session)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-xs font-medium">حالة الجلسة:</span>
                  {!session.hasToken ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      غير مسجل (لا يوجد رمز دخول)
                    </span>
                  ) : session.isExpired ? (
                    <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      منتهية الصلاحية — يلزم إعادة الدخول
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      جلسة نشطة ومصرح بها
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-xs font-medium">الدور المصرح به:</span>
                  <span className="font-semibold text-slate-800">
                    {session.roleLabel || session.roleCode || "غير محدد"}
                  </span>
                </div>

                {session.accountType && (
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-xs font-medium">نوع الحساب:</span>
                    <span className="font-medium text-slate-700">
                      {session.accountType === "staff" ? "فريق العمل (Staff)" : session.accountType === "parent" ? "ولي أمر" : session.accountType}
                    </span>
                  </div>
                )}

                {session.expiresAt && (
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-xs font-medium">توقيت الصلاحية:</span>
                    <span className="font-mono text-xs text-slate-600">
                      حتى {session.expiresAt}
                    </span>
                  </div>
                )}

                {session.tenantId && (
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-slate-400 text-xs font-medium">معرف الأكاديمية (Tenant):</span>
                    <span className="font-mono text-xs text-slate-600 truncate">
                      {session.tenantId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Return to Login & Reload Page */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleGoToLogin}
                className={cn(
                  "w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md",
                  "bg-teal-600 text-white hover:bg-teal-700 active:scale-98 cursor-pointer"
                )}
              >
                <LogIn size={17} />
                <span>تسجيل الدخول من جديد (حماية الجلسة)</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className={cn(
                  "w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all",
                  "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-98 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                <span>إعادة تحميل</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className={cn(
                  "w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all",
                  "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:scale-98 cursor-pointer"
                )}
              >
                <Home size={16} />
                <span>مساحتي الرئيسية</span>
              </button>
            </div>

            {/* Discreet collapsible for dev investigation - hidden/closed by default */}
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <details className="w-full mt-6 text-xs text-slate-400 border-t border-slate-200/80 pt-3">
                <summary className="cursor-pointer hover:text-slate-600 font-medium select-none flex items-center gap-1">
                  <ChevronDown size={14} />
                  <span>تفاصيل تقنية (للمطورين فقط)</span>
                </summary>
                <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed" dir="ltr">
                  <div className="text-rose-400 font-bold mb-1">{this.state.error.name}: {this.state.error.message}</div>
                  <pre className="whitespace-pre-wrap opacity-75">{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


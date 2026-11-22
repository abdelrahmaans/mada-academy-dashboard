import { Component, type ReactNode } from "react";
import { RefreshCw, Home, LogIn, ChevronDown } from "lucide-react";
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

function isChunkLoadError(error: Error | null): boolean {
  if (!error?.message) return false;
  return (
    error.message.includes("Failed to fetch dynamically imported module") ||
    error.message.includes("Importing a module script failed") ||
    error.message.includes("error loading dynamically imported module") ||
    error.message.includes("Loading chunk")
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // If a new version was deployed to Vercel and old chunks are missing, automatically reload
    if (isChunkLoadError(error)) {
      const key = "mada_last_chunk_reload";
      const lastReload = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - lastReload > 8000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem("mada_last_chunk_reload");
      sessionStorage.removeItem("mada_chunk_reload");
    } catch {}
    window.location.reload();
  };

  handleGoHome = () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("mada.accessToken") : null;
      if (token) {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const rawRole = (payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]) as string | undefined;
          if (rawRole) {
            const normalized = rawRole.startsWith("R0") ? rawRole.slice(0, 3) : rawRole;
            const def = ROLE_DEFINITIONS[normalized as RoleCode];
            if (def?.homePath) {
              window.location.href = def.homePath;
              return;
            }
          }
        }
      }
    } catch {}
    window.location.href = "/";
  };

  handleGoToLogin = () => {
    clearTokens();
    try {
      localStorage.removeItem("mada_auth_token");
      sessionStorage.clear();
    } catch {}
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      const isChunk = isChunkLoadError(this.state.error);

      return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-slate-50 text-slate-800" dir="rtl">
          <div className="flex flex-col items-center w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-8 text-center">
            {/* Friendly Calm Icon */}
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-5 shadow-sm">
              <RefreshCw size={28} className={isChunk ? "animate-spin" : ""} style={{ animationDuration: "3s" }} />
            </div>

            {/* Title & Clear Explanation */}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              {isChunk ? "يتوفر تحديث جديد للمنصة" : "تعذر عرض الصفحة مؤقتاً"}
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-sm">
              {isChunk
                ? "تم نشر إصدار محدث من المنظومة على الخادم. انقر على الزر أدناه لتحديث الصفحة ومتابعة عملك بأحدث الميزات."
                : "حدث استثناء مؤقت أثناء تحميل الصفحة. بياناتك وحسابك في أمان تام، ويمكنك إعادة تحميل الصفحة أو العودة للرئيسية."}
            </p>

            {/* Clear, Logical Action Buttons */}
            <div className="flex flex-col gap-2.5 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md",
                  "bg-gradient-to-r from-teal-700 to-teal-600 text-white hover:from-teal-800 hover:to-teal-700 active:scale-98 cursor-pointer"
                )}
              >
                <RefreshCw size={16} />
                <span>تحديث الصفحة ومتابعة العمل</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                  "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:scale-98 cursor-pointer"
                )}
              >
                <Home size={15} />
                <span>العودة للمساحة الرئيسية</span>
              </button>
            </div>

            {/* Subtle Sign-out link */}
            <div className="mt-5 pt-4 border-t border-slate-100 w-full flex items-center justify-center">
              <button
                type="button"
                onClick={this.handleGoToLogin}
                className="text-xs text-slate-500 hover:text-teal-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <LogIn size={13} />
                <span>تسجيل الدخول بحساب آخر</span>
              </button>
            </div>

            {/* Collapsed technical details for development / support (Closed by default) */}
            {Boolean(this.state.error) && !isChunk && (
              <details className="w-full mt-4 text-xs text-slate-400 text-right pt-2" dir="ltr">
                <summary className="cursor-pointer hover:text-slate-600 font-mono text-[11px] select-none flex items-center gap-1" dir="rtl">
                  <ChevronDown size={13} />
                  <span>تفاصيل فنية للدعم</span>
                </summary>
                <div className="mt-2 p-2.5 bg-slate-100 text-slate-700 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed text-left border border-slate-200">
                  <div className="font-bold text-rose-600">{this.state.error?.name}: {this.state.error?.message}</div>
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

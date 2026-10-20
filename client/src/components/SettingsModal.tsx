import { useState, useEffect } from "react";
import {
  Building2,
  Clock,
  KeyRound,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sun,
  User,
  X,
  MapPin,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { clearTokens, refreshAccessToken } from "@/lib/apiClient";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ROLE_DEFINITIONS, type RoleCode } from "@/lib/roleNavigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsModal({ open, onClose }: Props) {
  const { me, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const getExpirationInfo = () => {
    try {
      const token = localStorage.getItem("mada.accessToken");
      if (token) {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            const expMs = payload.exp * 1000;
            const isExpired = Date.now() >= expMs;
            const timeStr = new Date(expMs).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return { timeStr, isExpired };
          }
        }
      }
    } catch {}
    return { timeStr: "غير محدد", isExpired: false };
  };

  const [sessionInfo, setSessionInfo] = useState(getExpirationInfo);

  useEffect(() => {
    if (open) {
      setSessionInfo(getExpirationInfo());
    }
  }, [open]);

  if (!open) return null;

  const roleCode = me?.role?.match(/^R\d+/)?.[0] as RoleCode | undefined;
  const roleDef = roleCode ? ROLE_DEFINITIONS[roleCode] : undefined;
  const roleLabel = roleDef?.label ?? me?.roleLabel ?? me?.role ?? "المستخدم";
  const userName = me?.user?.displayName || "المستخدم";
  const userInitials = userName.slice(0, 2);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const ok = await refreshAccessToken();
      if (ok) {
        setSessionInfo(getExpirationInfo());
        toast.success("تم تجديد الجلسة وتحديث التوكن بنجاح!");
      } else {
        toast.error("انتهت صلاحية جلسة العمل، يلزم إعادة تسجيل الدخول.");
        clearTokens();
        onClose();
        navigate("/login");
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم لتجديد الجلسة.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      clearTokens();
      try {
        localStorage.removeItem("mada_auth_token");
        sessionStorage.clear();
      } catch {}
      toast.success("تم تسجيل الخروج بنجاح");
      onClose();
      navigate("/login");
    } catch {
      clearTokens();
      onClose();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm"
      dir="rtl"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Header with Title & Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <Settings size={20} />
            </span>
            <div>
              <h2 id="settings-modal-title" className="text-base font-extrabold text-slate-800 m-0">
                إعدادات الحساب وتفضيلات النظام
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                إدارة الجلسة الحالية، تخصيص المظهر، ومراجعة بيانات الدور المصرح
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
            aria-label="إغلاق نافذة الإعدادات"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Card 1: User Profile & Role Overview */}
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userInitials}
                </span>
                <div>
                  <strong className="text-slate-900 text-sm block leading-tight">{userName}</strong>
                  <span className="text-xs text-slate-500 font-mono">{me?.user?.phone || "—"}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <ShieldCheck size={13} />
                {roleLabel} {roleCode ? `(${roleCode})` : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                <Building2 size={15} className="text-slate-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] block">الأكاديمية:</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {me?.academy?.name || "أكاديمية مدى"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200/80">
                <MapPin size={15} className="text-slate-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] block">الفرع الرئيسي:</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {me?.branches?.[0]?.name || "الفرع المصرح"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Session Security & Refresh Token */}
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <KeyRound size={16} className="text-emerald-600" />
                <span>أمان الجلسة والتوكن (Session Security)</span>
              </div>
              {sessionInfo.isExpired ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  منتهية الصلاحية
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  جلسة نشطة ومؤمنة
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Clock size={16} className="text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10.5px]">توقيت الصلاحية الحالي:</span>
                  <strong className="text-slate-800 font-mono text-xs">
                    حتى {sessionInfo.timeStr}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                <span>{refreshing ? "جارٍ التجديد…" : "تجديد التوكن الآن"}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 m-0 leading-relaxed">
              * يقوم تجديد التوكن بتمديد وقت الجلسة فوراً دون الحاجة لإعادة كتابة كلمة المرور أو مقاطعة عملك.
            </p>
          </div>

          {/* Card 3: Appearance & Display Preferences */}
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Sun size={16} className="text-amber-500" />
              <span>تفضيلات المظهر والعرض</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer font-bold ${
                  theme === "light"
                    ? "bg-white border-teal-500 text-teal-800 shadow-sm ring-2 ring-teal-500/10"
                    : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                <Sun size={16} className={theme === "light" ? "text-amber-500" : "text-slate-400"} />
                <span>الوضع الفاتح</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer font-bold ${
                  theme === "dark"
                    ? "bg-slate-900 border-teal-500 text-teal-300 shadow-sm ring-2 ring-teal-500/10"
                    : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                <Moon size={16} className={theme === "dark" ? "text-teal-400" : "text-slate-400"} />
                <span>الوضع الداكن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Secure Logout Action */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-98 transition-all cursor-pointer disabled:opacity-60 shadow-xs"
          >
            <LogOut size={15} />
            <span>{loggingOut ? "جارٍ تسجيل الخروج وتأمين الجلسة…" : "تسجيل الخروج من الحساب"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition-all cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}

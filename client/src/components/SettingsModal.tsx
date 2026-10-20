import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  KeyRound,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  User,
  X,
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

  if (!open) return null;

  const roleCode = me?.role?.match(/^R\d+/)?.[0] as RoleCode | undefined;
  const roleDef = roleCode ? ROLE_DEFINITIONS[roleCode] : undefined;
  const roleLabel = roleDef?.label ?? me?.roleLabel ?? me?.role ?? "المستخدم";

  // Calculate token expiration string
  let expiresAtText = "جلسة نشطة";
  try {
    const token = localStorage.getItem("mada.accessToken");
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp) {
          expiresAtText = new Date(payload.exp * 1000).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
    }
  } catch {
    // fallback
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const ok = await refreshAccessToken();
      if (ok) {
        toast.success("تم تجديد الجلسة وتحديث التوكن بنجاح!");
      } else {
        toast.error("انتهت صلاحية جلسة العمل، يلزم تسجيل الدخول مجدداً.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <Settings size={20} />
            </span>
            <div>
              <h2 id="settings-dialog-title" className="text-base font-bold text-slate-800 m-0">
                إعدادات الحساب وتفضيلات النظام
              </h2>
              <p className="text-xs text-slate-500 m-0">إدارة الجلسة وتخصيص المظهر وتفاصيل الصلاحيات</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* 1. Profile & Role Identity */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                <User size={16} className="text-teal-600" />
                <span>بيانات الحساب والدور</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100/70 text-teal-800 border border-teal-200">
                {roleLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">اسم المستخدم:</span>
                <strong className="text-slate-800">{me?.user?.displayName || "المستخدم"}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">رقم الهاتف:</span>
                <span className="text-slate-700 font-mono">{me?.user?.phone || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الأكاديمية:</span>
                <span className="text-slate-700 truncate block">{me?.academy?.name || "أكاديمية مدى"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">الفرع الرئيسي:</span>
                <span className="text-slate-700 truncate block">{me?.branches?.[0]?.name || "الفرع المصرح"}</span>
              </div>
            </div>
          </div>

          {/* 2. Session Management & Refresh Token */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                <KeyRound size={16} className="text-emerald-600" />
                <span>جلسة العمل وصلاحية التوكن</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                جلسة نشطة
              </span>
            </div>

            <div className="flex items-center justify-between text-xs bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={15} className="text-slate-400" />
                <span>صلاحية التوكن الحالية: حتى <strong>{expiresAtText}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                <span>{refreshing ? "جارٍ التحديث…" : "تجديد التوكن"}</span>
              </button>
            </div>
          </div>

          {/* 3. Appearance / Theme */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
              <Sun size={16} className="text-amber-500" />
              <span>المظهر والعرض</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer font-medium ${
                  theme === "light"
                    ? "bg-teal-50 border-teal-500 text-teal-800 font-bold shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Sun size={15} />
                <span>الوضع الفاتح</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer font-medium ${
                  theme === "dark"
                    ? "bg-teal-900/30 border-teal-500 text-teal-300 font-bold shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Moon size={15} />
                <span>الوضع الداكن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
          >
            <LogOut size={15} />
            <span>{loggingOut ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج من الحساب"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

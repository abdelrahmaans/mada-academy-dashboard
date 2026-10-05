import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Home, LayoutGrid, LogOut, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { isRouteAllowed } from "@/lib/routeAccess";
import { ROLE_DEFINITIONS } from "@/lib/roleNavigation";

export default function ProtectedRoute({ children, roles, permission }: { children: ReactNode; roles?: string[]; permission?: string }) {
  const { me, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !me) navigate("/login");
  }, [loading, me, navigate]);

  if (loading) return <div className="route-loading">جارٍ التحقق من الجلسة…</div>;
  if (!me) return null;
  if (!isRouteAllowed(me, roles, permission)) {
    const roleDefinition = ROLE_DEFINITIONS[me.role as keyof typeof ROLE_DEFINITIONS];
    const homePath = roleDefinition?.homePath ?? "/workspace";
    const roleLabel = roleDefinition?.label ?? me.roleLabel ?? "حسابك";
    const signOut = async () => {
      setLoggingOut(true);
      try {
        await logout();
        navigate("/login");
      } finally {
        setLoggingOut(false);
      }
    };

    return (
      <main className="auth-locked-page" dir="rtl">
        <section aria-labelledby="auth-locked-title">
          <div className="auth-locked-page-brand">
            <span className="auth-locked-page-logo">مدى</span>
            <span>مساحة العمل</span>
          </div>
          <div className="auth-locked-page-mark" aria-hidden="true"><ShieldAlert size={30} /></div>
          <span className="auth-locked-page-code">{me.role} · {roleLabel}</span>
          <h1 id="auth-locked-title">المسار ده مش متاح لحسابك</h1>
          <p>أنت داخل بحساب <strong>{roleLabel}</strong>، لكن الصفحة الحالية خارج نطاق الصلاحيات. تقدر ترجع لمساحتك الرئيسية أو تختار مساحة العمل لاستكشاف المسارات المتاحة.</p>
          <div className="auth-locked-page-actions">
            <button type="button" className="auth-locked-primary" onClick={() => navigate(homePath)}>
              <Home size={17} /> مساحتي الرئيسية
            </button>
            <button type="button" onClick={() => navigate("/workspace")}>
              <LayoutGrid size={17} /> مساحة العمل
            </button>
            <button type="button" onClick={() => window.history.length > 1 ? window.history.back() : navigate(homePath)}>
              <ArrowRight size={17} /> رجوع
            </button>
          </div>
          <button type="button" className="auth-locked-logout" onClick={() => void signOut()} disabled={loggingOut}>
            <LogOut size={16} /> {loggingOut ? "جارٍ تسجيل الخروج…" : "تسجيل الدخول بحساب آخر"}
          </button>
          <small className="auth-locked-page-hint">لو شايف إن الوصول ده المفروض يكون متاح، راجع مسؤول الأكاديمية للتأكد من الدور والصلاحيات.</small>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}

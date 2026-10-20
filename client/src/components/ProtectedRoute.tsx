import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Home, LogOut, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { isRouteAllowed } from "@/lib/routeAccess";
import { ROLE_DEFINITIONS } from "@/lib/roleNavigation";
import "./RoleFoundation.css";

export type ProtectedRouteProps = {
  children: ReactNode;
  roles?: readonly string[] | string[];
  permission?: string;
  anyOfPermissions?: readonly string[] | string[];
};

export default function ProtectedRoute({
  children,
  roles,
  permission,
  anyOfPermissions,
}: ProtectedRouteProps) {
  const { me, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !me) navigate("/login");
  }, [loading, me, navigate]);

  if (loading) return <div className="route-loading">جارٍ التحقق من الجلسة…</div>;
  if (!me) return null;

  if (!isRouteAllowed(me, roles, permission, anyOfPermissions)) {
    const normalizedRole = me.role.match(/^R\d+/)?.[0] ?? me.role;
    const roleDefinition = ROLE_DEFINITIONS[normalizedRole as keyof typeof ROLE_DEFINITIONS];
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
            <span>بوابة الأكاديمية الذكية</span>
          </div>

          <div className="auth-locked-page-mark" aria-hidden="true">
            <ShieldAlert size={32} />
          </div>

          <span className="auth-locked-page-code">
            {me.role} · {roleLabel}
          </span>

          <h1 id="auth-locked-title">المسار غير مصرح لحسابك</h1>

          <p>
            أنت مسجل حاليًا بحساب <strong>{roleLabel}</strong>. تتطلب هذه الصفحة صلاحيات تشغيلية مخصصة لأدوار أخرى. لحماية البيانات والنظام، يمكنك العودة لمساحتك الخاصة أو تسجيل الدخول بحساب مصرح له.
          </p>

          <div className="auth-locked-page-actions">
            <button
              type="button"
              className="auth-locked-primary"
              onClick={() => navigate(homePath)}
            >
              <Home size={17} /> العودة لمساحتي الرئيسية
            </button>
            <button
              type="button"
              className="auth-locked-secondary"
              onClick={() => (window.history.length > 1 ? window.history.back() : navigate(homePath))}
            >
              <ArrowRight size={17} /> الرجوع للصفحة السابقة
            </button>
          </div>

          <button
            type="button"
            className="auth-locked-logout-btn"
            onClick={() => void signOut()}
            disabled={loggingOut}
          >
            <LogOut size={16} /> {loggingOut ? "جارٍ تسجيل الخروج وتأمين الجلسة…" : "تسجيل الدخول من جديد (حماية الجلسة)"}
          </button>

          <small className="auth-locked-page-hint">
            إذا كنت تعتقد أن هذا الوصول يجب أن يكون متاحًا لك، يُرجى مراجعة مسؤول الأكاديمية لتعديل مصفوفة الصلاحيات.
          </small>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

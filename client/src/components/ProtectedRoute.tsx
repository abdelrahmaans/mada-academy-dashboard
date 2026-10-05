import { useEffect, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { isRouteAllowed } from "@/lib/routeAccess";

export default function ProtectedRoute({ children, roles, permission }: { children: ReactNode; roles?: string[]; permission?: string }) {
  const { me, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !me) navigate("/login");
  }, [loading, me, navigate]);

  if (loading) return <div className="route-loading">جارٍ التحقق من الجلسة…</div>;
  if (!me) return null;
  if (!isRouteAllowed(me, roles, permission)) {
    return <main className="auth-locked-page" dir="rtl"><section><ShieldAlert size={30} /><h1>الوصول غير متاح</h1><p>هذه الشاشة خارج نطاق دورك أو الصلاحيات الممنوحة لحسابك. اختر مسارًا متاحًا بدل أن تبقى في صفحة مرفوضة.</p><div className="auth-locked-page-actions"><button onClick={() => window.history.length > 1 ? window.history.back() : navigate("/workspace")}>العودة</button><button onClick={() => navigate("/workspace")}>مساحة العمل</button></div></section></main>;
  }
  return <>{children}</>;
}

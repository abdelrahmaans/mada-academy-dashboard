import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import HomeLive from "./HomeLive";

export default function Home() {
  const { me, loading, error } = useAuth();
  if (loading) {
    return (
      <main className="r02-home-auth-state" dir="rtl" role="status">
        جارٍ التحقق من الجلسة وتحميل لوحة الفرع…
      </main>
    );
  }
  if (apiClient.hasSession()) {
    if (me?.role === "R02_BRANCH_MANAGER") return <HomeLive me={me} />;
    return (
      <main className="r02-home-auth-state r02-home-auth-error" dir="rtl" role="alert">
        هذه اللوحة متاحة لمدير الفرع فقط. استخدم مساحة الدور المرتبط بحسابك.
      </main>
    );
  }
  if (error) {
    return (
      <main className="r02-home-auth-state r02-home-auth-error" dir="rtl" role="alert">
        انتهت الجلسة أو تعذر التحقق منها. سجّل الدخول مجددًا لعرض بيانات حقيقية؛ لن نعرض بيانات تجريبية بدلًا منها.
      </main>
    );
  }
  return (
    <main className="r02-home-auth-state r02-home-auth-error" dir="rtl" role="alert">
      سجّل الدخول لفتح مساحة مدير الفرع.
    </main>
  );
}

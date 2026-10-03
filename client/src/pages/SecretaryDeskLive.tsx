import { ArrowUpLeft, CircleAlert, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import "./SecretaryDeskLive.css";

export default function SecretaryDeskLive() {
  const { me } = useAuth();
  const [, navigate] = useLocation();

  if (!me || me.role !== "R05_SECRETARY") {
    return (
      <main className="secretary-live-denied" role="alert" dir="rtl">
        <h1>مساحة السكرتارية غير متاحة لهذا الحساب</h1>
        <p>سجّل الدخول بحساب R05 أو ارجع إلى مساحة العمل الخاصة بدورك.</p>
        <button type="button" onClick={() => navigate("/workspace")}>
          العودة إلى مساحة العمل
        </button>
      </main>
    );
  }

  const branchName =
    me.branches?.find(branch => branch.id === me.branchId)?.name ??
    me.branches?.[0]?.name ??
    "الفرع المصرح به";

  return (
    <RoleDashboardShell
      className="app-shell secretary-live-shell"
      roleCode="R05"
      roleLabel={me.roleLabel ?? "السكرتارية"}
      scopeLevel="branch"
      scopeLabel={`فرع ${branchName}`}
      tenantName={me.academy?.name}
      branchName={branchName}
      demo={false}
    >
      <main className="secretary-live-workspace" dir="rtl">
        <header className="secretary-live-header">
          <span className="secretary-live-badge">LIVE · R05</span>
          <h1>مكتب السكرتارية</h1>
          <p>
            مساحة عمل مرتبطة بحسابك ونطاق الفرع: <strong>{branchName}</strong>.
            لا تظهر فيها سجلات معاينة.
          </p>
        </header>

        <section
          className="secretary-live-card"
          aria-labelledby="secretary-finance-title"
        >
          <span className="secretary-live-icon">
            <Wallet size={22} />
          </span>
          <div className="secretary-live-card-copy">
            <span className="secretary-live-card-kicker">
              العمليات المالية المسموحة
            </span>
            <h2 id="secretary-finance-title">التحصيل والفواتير</h2>
            <p>
              اعرض فواتير هذا الفرع، أنشئ فاتورة، وسجّل دفعة أو إثباتها.
              التقارير والمصروفات غير متاحة لدور السكرتارية.
            </p>
          </div>
          <button type="button" onClick={() => navigate("/finance-desk")}>
            فتح التحصيل <ArrowUpLeft size={17} />
          </button>
        </section>

        <section className="secretary-live-notice" role="status">
          <CircleAlert size={19} />
          <div>
            <h2>متابعة الاستفسارات والتسجيلات</h2>
            <p>
              لا توجد حاليًا خدمة API حية لصندوق العملاء المحتملين في هذا
              المسار؛ لذلك أخفينا بيانات المعاينة بدل عرضها كأنها سجلات محفوظة.
            </p>
          </div>
        </section>
      </main>
    </RoleDashboardShell>
  );
}

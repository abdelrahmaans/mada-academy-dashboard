import { useEffect, useState } from "react";
import { ArrowUpLeft, Database, ExternalLink, Layers3, LogOut, ShieldCheck, Users } from "lucide-react";
import { Link } from "wouter";
import { ROLE_DEFINITIONS, type RoleDefinition } from "@/lib/roleNavigation";
import { apiClient, type DashboardSummary } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_ORDER = ["R00", "R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09"] as const;
const ANGULAR_PREVIEW_URL = "https://4300-ikmfmvmdte3kxlh25o9sc-ec94301a.sg2.manus.computer";
const GROUPS = [
  { title: "طبقة الإدارة والمنصة", description: "منصة مدى، الأكاديمية، والفروع", roles: ["R00", "R01", "R02"] },
  { title: "طبقة التشغيل الأكاديمي", description: "الجودة، الجلسات، التسجيل، والمالية", roles: ["R03", "R04", "R05", "R06"] },
  { title: "طبقة التسويق والمستهلك", description: "الحملات والأسرة والطالب", roles: ["R07", "R08", "R09"] },
] as const;

function RoleCard({ role }: { role: RoleDefinition }) {
  return (
    <article className="workspace-role-card">
      <div className="workspace-role-card-head">
        <span className={`workspace-role-code ${role.identityKind}`}>{role.code}</span>
        <span className="workspace-role-kind">{role.identityKind === "staff" ? "Staff" : "Consumer"}</span>
      </div>
      <h3>{role.label}</h3>
      <p>{role.defaultScopeLabel}</p>
      <div className="workspace-role-scope"><ShieldCheck size={13} /> {role.scopeLevel}</div>
      <Link href={role.homePath} className="workspace-role-open">
        افتح المساحة <ArrowUpLeft size={15} />
      </Link>
      <div className="workspace-role-links">
        {role.navigation.map(item => <Link key={item.path} href={item.path}>{item.label}</Link>)}
      </div>
    </article>
  );
}

function BackendConnectionCard() {
  const auth = useAuth();
  const [phone, setPhone] = useState("+201000000002");
  const [code, setCode] = useState("000000");
  const [otpHint, setOtpHint] = useState<string>();
  const [summary, setSummary] = useState<DashboardSummary>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth.connected) return;
    void apiClient.dashboardSummary().then(setSummary).catch(() => setSummary(undefined));
  }, [auth.connected]);

  const connect = async () => {
    setBusy(true);
    try {
      const hint = await auth.sendOtp(phone);
      setOtpHint(hint ? `Development OTP: ${hint}` : "تم إرسال OTP");
    } catch {
      setOtpHint("تعذر الوصول إلى الـBackend. تأكد أن API يعمل على port 4191.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try { await auth.loginWithOtp(phone, code); }
    catch { /* AuthContext exposes the error below. */ }
    finally { setBusy(false); }
  };

  return (
    <section className="workspace-backend-card" aria-label="اتصال React بالـBackend">
      <div className="workspace-backend-heading"><span className="workspace-backend-icon"><Database size={17} /></span><div><strong>React ↔ ASP.NET Core ↔ PostgreSQL</strong><span>{apiClient.baseUrl}</span></div><span className={`workspace-backend-status ${auth.connected ? "online" : "offline"}`}>{auth.connected ? "CONNECTED" : "DEMO MODE"}</span></div>
      {!auth.connected ? (
        <div className="workspace-backend-login"><p>اربط الـWorkspace بالـJWT الحقيقي لمشاهدة بيانات الـdatabase بدل الـfixtures.</p><div className="workspace-backend-fields"><input value={phone} onChange={event => setPhone(event.target.value)} aria-label="رقم الهاتف" placeholder="Phone" /><input value={code} onChange={event => setCode(event.target.value)} aria-label="OTP" placeholder="OTP" /><button type="button" onClick={connect} disabled={busy}>إرسال OTP</button><button type="button" onClick={verify} disabled={busy}>دخول</button></div>{otpHint && <small>{otpHint}</small>}{auth.error && <small className="workspace-backend-error">{auth.error}</small>}</div>
      ) : (
        <div className="workspace-backend-live"><div><strong>{auth.me?.role}</strong><span>{auth.me?.scopeLevel} · tenant {auth.me?.tenantId.slice(0, 8)}</span></div>{summary && <div className="workspace-backend-metrics"><span><b>{summary.students}</b> طلاب</span><span><b>{summary.upcomingSessions}</b> جلسات قادمة</span><span><b>{summary.completedSessions}</b> مكتملة</span></div>}<button type="button" onClick={() => void auth.logout()}><LogOut size={14} /> خروج</button></div>
      )}
    </section>
  );
}

export default function WorkspaceHub() {
  return (
    <main className="workspace-hub" dir="rtl">
      <header className="workspace-hub-hero">
        <div>
          <span className="workspace-hub-kicker"><Layers3 size={14} /> Mada Academy Workspace</span>
          <h1>غرفة متابعة كل الأدوار</h1>
          <p>اختار أي Role أو غيّر الـURL مباشرة. كل بطاقة تفتح الـsurface الحقيقية الخاصة بالدور.</p>
        </div>
        <div className="workspace-hub-summary"><strong>R00 → R09</strong><span>10 Role surfaces</span><a className="workspace-engine-link" href={ANGULAR_PREVIEW_URL} target="_blank" rel="noreferrer"><ExternalLink size={13} /> جرّب Angular Preview</a></div>
      </header>
      <section className="workspace-hub-howto">
        <div><Users size={17} /><strong>طريقة الاستخدام</strong></div>
        <p>ابدأ من أي بطاقة، ثم استخدم روابط الـnavigation داخل الدور. للتنقل المباشر غيّر آخر جزء في الرابط إلى المسار الظاهر داخل البطاقة، مثل <code>/executive-dashboard</code> أو <code>/student-portal</code>.</p>
      </section>
      <BackendConnectionCard />
      <section className="workspace-tree" aria-label="شجرة الأدوار">
        {GROUPS.map(group => <div className="workspace-group" key={group.title}>
          <div className="workspace-group-heading"><div><h2>{group.title}</h2><p>{group.description}</p></div><span>{group.roles.length} roles</span></div>
          <div className="workspace-role-grid">{group.roles.map(code => <RoleCard key={code} role={ROLE_DEFINITIONS[code]} />)}</div>
        </div>)}
      </section>
      <footer className="workspace-hub-footer"><span>React هو الـdefault frontend الحالي · backend authorization will be enforced server-side.</span><span className="workspace-engine-footer"><a href={ANGULAR_PREVIEW_URL} target="_blank" rel="noreferrer">فتح نسخة Angular</a><Link href="/">العودة لملخص التشغيل <ArrowUpLeft size={13} /></Link></span></footer>
    </main>
  );
}

export { ROLE_ORDER };

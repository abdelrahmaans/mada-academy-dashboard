import { useState } from "react";
import { ArrowUpLeft, Building2, ExternalLink, Layers3, PlayCircle, ShieldCheck, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ROLE_DEFINITIONS, type RoleDefinition } from "@/lib/roleNavigation";
import type { RoleCode } from "@/contexts/RoleScopeContext";

const ROLE_ORDER: RoleCode[] = ["R00", "R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09"];
const ANGULAR_PREVIEW_URL = "https://4300-ikmfmvmdte3kxlh25o9sc-ec94301a.sg2.manus.computer";
const GROUPS = [
  { title: "طبقة الإدارة والمنصة", description: "منصة مدى، الأكاديمية، والفروع", roles: ["R00", "R01", "R02"] as RoleCode[] },
  { title: "طبقة التشغيل الأكاديمي", description: "الجودة، الجلسات، التسجيل، والمالية", roles: ["R03", "R04", "R05", "R06"] as RoleCode[] },
  { title: "طبقة التسويق والمستهلك", description: "الحملات والأسرة والطالب", roles: ["R07", "R08", "R09"] as RoleCode[] },
];

function RoleCard({ role }: { role: RoleDefinition }) {
  return (
    <article className="workspace-role-card">
      <div className="workspace-role-card-head"><span className={`workspace-role-code ${role.identityKind}`}>{role.code}</span><span className="workspace-role-kind">{role.identityKind === "staff" ? "Staff" : "Consumer"}</span></div>
      <h3>{role.label}</h3><p>{role.defaultScopeLabel}</p>
      <div className="workspace-role-scope"><ShieldCheck size={13} /> {role.scopeLevel}</div>
      <Link href={role.homePath} className="workspace-role-open">افتح المساحة <ArrowUpLeft size={15} /></Link>
      <div className="workspace-role-links">{role.navigation.map(item => <Link key={item.path} href={item.path}>{item.label}</Link>)}</div>
    </article>
  );
}

function DemoRolePlayground() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<RoleCode>("R02");
  const role = ROLE_DEFINITIONS[selectedRole];

  return (
    <section className="workspace-demo-card" aria-label="تجربة الأدوار المؤقتة">
      <div className="workspace-demo-heading"><span className="workspace-demo-icon"><PlayCircle size={18} /></span><div><strong>Demo Role Mode · بدون Login حاليًا</strong><span>اختبر الـRole والـScope والـnavigation قبل ربط الـBackend</span></div><span className="workspace-demo-status">FRONTEND FIRST</span></div>
      <div className="workspace-demo-controls"><label><span>اختار الدور</span><select value={selectedRole} onChange={event => setSelectedRole(event.target.value as RoleCode)}>{ROLE_ORDER.map(code => <option key={code} value={code}>{code} · {ROLE_DEFINITIONS[code].label}</option>)}</select></label><div className="workspace-demo-scope"><ShieldCheck size={14} /><span><b>{role.scopeLevel}</b> · {role.defaultScopeLabel}</span></div><button type="button" onClick={() => setLocation(role.homePath)}>فتح الـWorkspace <ArrowUpLeft size={14} /></button></div>
      <small>البيانات الحالية توضيحية ومحلية داخل الواجهة. Authentication وAPI integration مؤجلان بعد تثبيت كل الصفحات والرولز.</small>
    </section>
  );
}

export default function WorkspaceHub() {
  return (
    <main className="workspace-hub" dir="rtl">
      <header className="workspace-hub-hero"><div><span className="workspace-hub-kicker"><Layers3 size={14} /> Mada Academy Workspace</span><h1>غرفة متابعة كل الأدوار</h1><p>اختبر كل Role من شجرته الحقيقية، راجع الـscope والصفحات، ثم انتقل بين الأسطح قبل تشغيل الدخول والـBackend.</p></div><div className="workspace-hub-summary"><strong>R00 → R09</strong><span>10 Role surfaces</span><a className="workspace-engine-link" href={ANGULAR_PREVIEW_URL} target="_blank" rel="noreferrer"><ExternalLink size={13} /> جرّب Angular Preview</a></div></header>
      <section className="workspace-hub-howto"><div><Users size={17} /><strong>طريقة الاستخدام</strong></div><p>اختار الدور من الـPlayground أو افتح أي بطاقة. كل صفحة تعرض الـscope الخاص بها وروابط الـnavigation المسموحة لهذا الدور فقط.</p><Link href="/platform/academies/new" className="workspace-bootstrap-link"><Building2 size={14} /> إنشاء أكاديمية جديدة</Link></section>
      <DemoRolePlayground />
      <section className="workspace-tree" aria-label="شجرة الأدوار">{GROUPS.map(group => <div className="workspace-group" key={group.title}><div className="workspace-group-heading"><div><h2>{group.title}</h2><p>{group.description}</p></div><span>{group.roles.length} roles</span></div><div className="workspace-role-grid">{group.roles.map(code => <RoleCard key={code} role={ROLE_DEFINITIONS[code]} />)}</div></div>)}</section>
      <footer className="workspace-hub-footer"><span>Demo Role Mode هو الوضع الافتراضي · Login وBackend بعد تثبيت الـFrontend.</span><span className="workspace-engine-footer"><a href={ANGULAR_PREVIEW_URL} target="_blank" rel="noreferrer">فتح نسخة Angular</a><Link href="/">العودة لملخص التشغيل <ArrowUpLeft size={13} /></Link></span></footer>
    </main>
  );
}

export { ROLE_ORDER };

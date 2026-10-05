import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, KeyRound, LoaderCircle, Plus, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import R01AcademySidebar, { R01MobileMenuButton } from "@/components/R01AcademySidebar";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type AcademyBranch, type AcademyMember, type AcademyRoleDefinition } from "@/lib/apiClient";

const roleLabel = (roles: AcademyRoleDefinition[], code: string) => roles.find(role => role.code === code)?.label ?? code;
const isBranchRole = (roles: AcademyRoleDefinition[], code: string) => roles.find(role => role.code === code)?.scopeLevel === "BRANCH";

export default function AcademyRoles() {
  const { me } = useAuth();
  const [, navigate] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [roles, setRoles] = useState<AcademyRoleDefinition[]>([]);
  const [branches, setBranches] = useState<AcademyBranch[]>([]);
  const [members, setMembers] = useState<AcademyMember[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({ fullName: "", email: "", phone: "", password: "", roleCode: "R04_INSTRUCTOR", branchId: "" });

  const selectedMemberRecord = members.find(member => member.membershipId === selectedMember) ?? null;
  const selectedRoleDefinition = roles.find(role => role.code === (selectedMemberRecord?.roleCode ?? selectedRole));

  const load = async (notifySuccess = false) => {
    setLoading(true); setError(null); setWarning(null);
    try {
      const [roleResult, memberResult, branchResult] = await Promise.allSettled([apiClient.academyRoles(), apiClient.academyMembers(), apiClient.academyBranches()]);
      if (roleResult.status === "rejected" || memberResult.status === "rejected") throw new Error("تعذر تحميل الصلاحيات أو أعضاء الأكاديمية.");
      setRoles(roleResult.value.roles);
      setMembers(memberResult.value.items);
      if (branchResult.status === "fulfilled") {
        setBranches(branchResult.value.items.filter(branch => branch.status === "ACTIVE"));
        if (notifySuccess) toast.success("تم تحديث الصلاحيات والأعضاء");
      } else {
        const message = "تم تحميل الأعضاء والصلاحيات، لكن قائمة الفروع غير متاحة مؤقتًا.";
        setWarning(message);
        toast.error(message);
      }
    }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : "تعذر تحميل الصلاحيات والأعضاء.";
      setError(message);
      toast.error(message);
    }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const changeRole = async (member: AcademyMember, roleCode: string) => {
    const branchId = isBranchRole(roles, roleCode) ? member.branch?.id ?? branches[0]?.id : undefined;
    if (isBranchRole(roles, roleCode) && !branchId) { toast.error("لا يوجد فرع متاح لهذا الدور."); return; }
    setSaving(true);
    try { await apiClient.changeAcademyMemberRole(member.membershipId, { roleCode, branchId }); setMembers(current => current.map(item => item.membershipId === member.membershipId ? { ...item, roleCode, scopeLevel: roles.find(role => role.code === roleCode)?.scopeLevel ?? item.scopeLevel, branch: branchId ? branches.find(branch => branch.id === branchId) ?? item.branch : null } : item)); toast.success("تم تحديث الدور والنطاق"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تحديث الدور."); }
    finally { setSaving(false); }
  };
  const changeMemberBranch = async (member: AcademyMember, branchId: string) => {
    setSaving(true);
    try { await apiClient.changeAcademyMemberRole(member.membershipId, { roleCode: member.roleCode, branchId }); setMembers(current => current.map(item => item.membershipId === member.membershipId ? { ...item, branch: branches.find(branch => branch.id === branchId) ?? item.branch } : item)); toast.success("تم نقل المستخدم إلى الفرع"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تغيير فرع المستخدم."); }
    finally { setSaving(false); }
  };
  const changeStatus = async (member: AcademyMember) => {
    const status = member.membershipStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setSaving(true);
    try { await apiClient.changeAcademyMemberStatus(member.membershipId, status); setMembers(current => current.map(item => item.membershipId === member.membershipId ? { ...item, membershipStatus: status, userStatus: status } : item)); toast.success(status === "ACTIVE" ? "تم تفعيل العضو" : "تم إيقاف العضو"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تحديث حالة العضو."); }
    finally { setSaving(false); }
  };
  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMember.fullName || !newMember.email || !newMember.phone || (isBranchRole(roles, newMember.roleCode) && !newMember.branchId)) { toast.error("أكمل بيانات العضو والفرع المطلوب."); return; }
    setSaving(true);
    try { const created = await apiClient.addAcademyMember({ ...newMember, branchId: newMember.branchId || undefined }); setMembers(current => [created, ...current]); setNewMember({ fullName: "", email: "", phone: "", password: "", roleCode: "R04_INSTRUCTOR", branchId: branches[0]?.id ?? "" }); setShowAdd(false); toast.success("تمت إضافة العضو بالصلاحية المحددة"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر إضافة العضو."); }
    finally { setSaving(false); }
  };

  const activeMembers = useMemo(() => members.filter(member => member.membershipStatus === "ACTIVE").length, [members]);

  return <RoleDashboardShell className="academy-owner-shell academy-roles-shell" roleCode="R01" roleLabel="مسؤول الأكاديمية" scopeLevel="tenant" scopeLabel="كل فروع الأكاديمية" tenantName={me?.academy?.name ?? "الأكاديمية"}>
    <R01AcademySidebar activePath="/academy/roles" mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    <main className="academy-owner-main academy-roles-page" dir="rtl">
      <header className="academy-owner-topbar academy-roles-topbar"><div><R01MobileMenuButton onOpen={() => setMobileNavOpen(true)} /></div><span><ShieldCheck size={15} /> R01 · صلاحيات الأكاديمية</span></header>
      <div className="academy-owner-content academy-roles-content"><PageHeader className="academy-roles-header" eyebrow={<span><i /> GOVERNANCE · صلاحيات ونطاق</span>} title="إدارة المستخدمين والصلاحيات" description="أضف مستخدمي الأكاديمية، حدّد دور كل شخص، وثبّت الفرع الذي يعمل داخله بدون تجاوز نطاق R00." actions={<button className="academy-roles-add-button" onClick={() => setShowAdd(true)}><UserPlus size={16} /> إضافة مستخدم</button>} />
        <div className="academy-roles-scope"><ShieldCheck size={16} /><span><strong>نطاقك الحالي:</strong> {me?.academy?.name ?? "الأكاديمية"} · كل الفروع · لا يمكنك منح صلاحية مسؤول المنصة R00.</span></div>
        {error && <div className="academy-roles-error">{error}<button onClick={() => void load(true)}>إعادة المحاولة</button></div>}
        {warning && !error && <div className="academy-roles-error">{warning}<button onClick={() => void load(true)}>إعادة المحاولة</button></div>}
        {loading ? <div className="academy-roles-loading"><LoaderCircle className="spin" size={22} /> جارٍ تحميل أعضاء الأكاديمية والصلاحيات…</div> : <>
          <section className="academy-roles-metrics"><Metric icon={<Users size={17} />} label="أعضاء الأكاديمية" value={members.length} /><Metric icon={<CheckCircle2 size={17} />} label="أعضاء نشطون" value={activeMembers} /><Metric icon={<KeyRound size={17} />} label="أدوار قابلة للتعيين" value={roles.filter(role => role.assignableByAcademyOwner).length} /><Metric icon={<Building2 size={17} />} label="الفروع المتاحة" value={branches.length} /></section>
          <div className="academy-roles-grid"><section className="academy-roles-panel academy-roles-members"><PanelTitle icon={<Users size={17} />} title="أعضاء الأكاديمية" note={`${members.length} حساب`} />{members.length === 0 ? <Empty text="لا يوجد أعضاء بعد." /> : <div className="academy-member-list">{members.map(member => <article className={selectedMember === member.membershipId ? "academy-member selected" : "academy-member"} key={member.membershipId} onClick={() => { setSelectedMember(member.membershipId); setSelectedRole(member.roleCode); }}><span className="academy-member-avatar">{(member.name ?? "؟").slice(0, 1)}</span><span className="academy-member-copy"><strong>{member.name ?? "بدون اسم"}</strong><small><bdi dir="ltr">{member.email}</bdi> · {member.branch?.name ?? "نطاق الأكاديمية"}</small></span><span className={`academy-member-status ${member.membershipStatus.toLowerCase()}`}>{member.membershipStatus === "ACTIVE" ? "نشط" : member.membershipStatus === "SUSPENDED" ? "موقوف" : member.membershipStatus}</span><span className="academy-member-role">{roleLabel(roles, member.roleCode)}</span></article>)}</div>}</section>
            <aside className="academy-roles-panel academy-role-detail"><PanelTitle icon={<KeyRound size={17} />} title="الدور والصلاحيات" note={selectedMemberRecord?.name ?? "اختر عضوًا"} />{selectedMemberRecord && selectedRoleDefinition ? <><div className="academy-role-detail-user"><span className="academy-member-avatar large">{(selectedMemberRecord.name ?? "؟").slice(0, 1)}</span><div><strong>{selectedMemberRecord.name}</strong><small>{selectedRoleDefinition.label} · {selectedMemberRecord.scopeLevel === "BRANCH" ? selectedMemberRecord.branch?.name ?? "فرع غير محدد" : "كل فروع الأكاديمية"}</small></div></div><label className="academy-role-select"><span>الدور</span><select value={selectedRole} onChange={event => { setSelectedRole(event.target.value); void changeRole(selectedMemberRecord, event.target.value); }} disabled={saving || selectedMemberRecord.userId === me?.id}>{roles.filter(role => role.assignableByAcademyOwner).map(role => <option key={role.code} value={role.code}>{role.label}</option>)}</select></label>{selectedRoleDefinition.scopeLevel === "BRANCH" && <label className="academy-role-select"><span>الفرع المرتبط</span><select value={selectedMemberRecord.branch?.id ?? ""} onChange={event => void changeMemberBranch(selectedMemberRecord, event.target.value)} disabled={saving || selectedMemberRecord.userId === me?.id}><option value="">اختر الفرع</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select></label>}<div className="academy-permission-heading"><strong>الصلاحيات الناتجة</strong><small>{selectedRoleDefinition.permissions.length} صلاحية · {selectedRoleDefinition.description}</small></div><div className="academy-permission-chips">{selectedRoleDefinition.permissions.map(permission => <span key={permission}>{permission}</span>)}</div>{selectedMemberRecord.userId !== me?.id && <button className="academy-member-status-button" onClick={() => void changeStatus(selectedMemberRecord)} disabled={saving}>{selectedMemberRecord.membershipStatus === "ACTIVE" ? "إيقاف العضو مؤقتًا" : "إعادة تفعيل العضو"}</button>}</> : <Empty text="اختار عضوًا لمراجعة دوره وصلاحياته." />}</aside></div>
          <section className="academy-roles-panel academy-role-catalog"><PanelTitle icon={<ShieldCheck size={17} />} title="كتالوج الأدوار" note="الصلاحيات معرفة من الـbackend" /><div className="academy-role-catalog-grid">{roles.map(role => <button key={role.code} className={selectedRole === role.code ? "academy-role-card selected" : "academy-role-card"} onClick={() => setSelectedRole(role.code)}><span><strong>{role.label}</strong><small>{role.code} · {role.scopeLevel === "BRANCH" ? "نطاق فرع" : "نطاق أكاديمية"}</small></span><p>{role.description}</p><b>{role.permissions.length} صلاحية</b></button>)}</div></section>
        </>}</div>
    </main>
    {showAdd && <div className="academy-add-overlay"><form className="academy-add-modal" onSubmit={addMember}><header><div><span><UserPlus size={17} /></span><h2>إضافة عضو للأكاديمية</h2></div><button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button></header><p>سيتمكن العضو من الدخول برقم الهاتف وكلمة المرور بعد الحفظ.</p><label>الاسم بالكامل<input value={newMember.fullName} onChange={event => setNewMember({ ...newMember, fullName: event.target.value })} /></label><label>البريد الإلكتروني<input dir="ltr" type="email" value={newMember.email} onChange={event => setNewMember({ ...newMember, email: event.target.value })} /></label><label>رقم الهاتف<input dir="ltr" type="tel" value={newMember.phone} onChange={event => setNewMember({ ...newMember, phone: event.target.value })} /></label><label>كلمة المرور<input dir="ltr" type="password" minLength={8} value={newMember.password} onChange={event => setNewMember({ ...newMember, password: event.target.value })} placeholder="8 أحرف على الأقل" /></label><label>الدور<select value={newMember.roleCode} onChange={event => setNewMember({ ...newMember, roleCode: event.target.value })}>{roles.filter(role => role.assignableByAcademyOwner).map(role => <option key={role.code} value={role.code}>{role.label}</option>)}</select></label>{isBranchRole(roles, newMember.roleCode) && <label>الفرع<select value={newMember.branchId} onChange={event => setNewMember({ ...newMember, branchId: event.target.value })}><option value="">اختر الفرع</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>}<footer><button type="button" onClick={() => setShowAdd(false)}>إلغاء</button><button className="primary" disabled={saving}><Plus size={15} /> إضافة العضو</button></footer></form></div>}
  </RoleDashboardShell>;
}

function PanelTitle({ icon, title, note }: { icon: React.ReactNode; title: string; note: string }) { return <div className="academy-roles-panel-title"><div><span>{icon}</span><h2>{title}</h2></div><small>{note}</small></div>; }
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="academy-role-metric"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }
function Empty({ text }: { text: string }) { return <div className="academy-roles-empty"><Users size={22} /><span>{text}</span></div>; }

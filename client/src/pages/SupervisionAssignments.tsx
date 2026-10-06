import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Eye, RefreshCw, ShieldCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import BranchManagerSidebar from "@/components/BranchManagerSidebar";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { apiClient, type AcademyMember, type BranchSupervisionGroup } from "@/lib/apiClient";
import "./SupervisionAssignments.css";

export default function SupervisionAssignments() {
  const [groups, setGroups] = useState<BranchSupervisionGroup[]>([]);
  const [members, setMembers] = useState<AcademyMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [canReadAttendance, setCanReadAttendance] = useState(false);
  const [canReviewEvaluations, setCanReviewEvaluations] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [groupResult, memberResult] = await Promise.all([apiClient.branchSupervisionGroups(), apiClient.academyMembers()]);
      setGroups(groupResult.items); setMembers(memberResult.items.filter(member => member.membershipStatus === "ACTIVE" && (member.roleCode === "R03_HEAD_INSTRUCTORS" || member.roleCode === "R04_INSTRUCTOR")));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل مجموعات الفرع."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const targetGroup = useMemo(() => groups.find(group => group.id === selectedGroup), [groups, selectedGroup]);
  const availableMembers = members.filter(member => !targetGroup?.assignments.some(assignment => assignment.supervisorUserId === member.userId));

  const grant = async () => {
    if (!selectedGroup || !selectedMember || (!canReadAttendance && !canReviewEvaluations)) return;
    setSaving(true);
    try {
      await apiClient.grantGroupSupervision({ supervisorUserId: selectedMember, courseOfferingId: selectedGroup, canReadAttendance, canReviewEvaluations, endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : undefined });
      toast.success("تم منح صلاحية متابعة المجموعة"); setSelectedMember(""); setEndsAt(""); setCanReadAttendance(false); setCanReviewEvaluations(false); await load();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر منح الصلاحية."); }
    finally { setSaving(false); }
  };

  const revoke = async (assignmentId: string) => {
    try { await apiClient.revokeGroupSupervision(assignmentId); toast.success("تم سحب صلاحية المتابعة"); await load(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر سحب الصلاحية."); }
  };

  return <RoleDashboardShell className="app-shell supervision-assignments-shell" showSessionLogout={false} roleCode="R02" roleLabel="مدير الفرع" scopeLevel="branch" scopeLabel="فرع واحد" demo={false}>
    <BranchManagerSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    <main className="main-panel" dir="rtl"><RoleSurfaceTopbar onMenu={() => setMobileOpen(true)} scopeLabel="نطاق الفرع" roleLabel="مدير الفرع" />
      <div className="workspace supervision-assignments-page">
        <header className="supervision-heading"><div><span className="supervision-kicker"><ShieldCheck size={15} /> صلاحيات المتابعة</span><h1>إدارة متابعة المجموعات</h1><p>عيّن المدرب أو مشرف المدربين لمتابعة مجموعات محددة داخل فرعك فقط.</p></div><button className="button button-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> تحديث</button></header>
        <section className="supervision-policy"><ShieldCheck size={17} /><span><strong>المدير يحدد النطاق:</strong> لا يغيّر التكليف دور المستخدم ولا يمنحه صلاحيات خارج المجموعة أو وصولًا ماليًا. قراءة الحضور للعرض فقط ولا تسمح بتعديله أو إتمام الجلسة؛ وصلاحية مراجعة التقييمات تسمح بنشرها أو إرجاعها للمدرب.</span></section>
        <section className="supervision-grant-card"><div className="supervision-card-title"><UserPlus size={18} /><div><h2>منح متابعة جديدة</h2><p>اختر المجموعة والعضو، ثم فعّل الصلاحيات المطلوبة صراحةً. لا تُمنح أي صلاحية تلقائيًا.</p></div></div><div className="supervision-form"><label>المجموعة<select value={selectedGroup} onChange={event => { setSelectedGroup(event.target.value); setSelectedMember(""); }}><option value="">اختر المجموعة</option>{groups.map(group => <option key={group.id} value={group.id}>{group.courseName} · {group.instructorName ?? "بدون مدرب"}</option>)}</select></label><label>المدرب / المشرف<select value={selectedMember} onChange={event => setSelectedMember(event.target.value)} disabled={!selectedGroup}><option value="">اختر العضو</option>{availableMembers.map(member => <option key={member.userId} value={member.userId}>{member.name} · {member.roleCode === "R04_INSTRUCTOR" ? "مدرب" : "مشرف مدربين"}</option>)}</select></label><label>تنتهي في (اختياري)<input type="date" value={endsAt} onChange={event => setEndsAt(event.target.value)} /></label><div className="supervision-checks"><label><input type="checkbox" checked={canReadAttendance} onChange={event => setCanReadAttendance(event.target.checked)} /> قراءة الجلسات والحضور (بدون تعديل)</label><label><input type="checkbox" checked={canReviewEvaluations} onChange={event => setCanReviewEvaluations(event.target.checked)} /> مراجعة التقييمات ونشرها أو إرجاعها</label></div><button className="button button-primary" onClick={() => void grant()} disabled={saving || !selectedGroup || !selectedMember || (!canReadAttendance && !canReviewEvaluations)}><CheckCircle2 size={15} /> {saving ? "جارٍ الحفظ…" : "منح الصلاحية"}</button></div></section>
        {loading && <p className="supervision-state">جارٍ تحميل مجموعات الفرع…</p>}
        {!loading && error && <section className="supervision-state supervision-error">{error}<button className="button button-secondary" onClick={() => void load()}>إعادة المحاولة</button></section>}
        {!loading && !error && <section className="supervision-groups"><div className="supervision-section-heading"><div><h2>مجموعات الفرع</h2><p>{groups.length} مجموعة · يظهر لكل مجموعة من لديه صلاحية متابعة.</p></div><BookOpen size={21} /></div>{groups.length === 0 ? <p className="supervision-state">لا توجد مجموعات متاحة لهذا الفرع.</p> : groups.map(group => <article className="supervision-group" key={group.id}><div className="supervision-group-main"><span className="supervision-group-icon"><BookOpen size={18} /></span><div><strong>{group.courseName}</strong><span>{group.instructorName ?? "بدون مدرب"} · {group.enrolledStudents} / {group.maxStudents} طالب</span></div></div><div className="supervision-assignees">{group.assignments.length === 0 ? <span className="supervision-muted">لا يوجد مشرف مكلّف</span> : group.assignments.map(assignment => <div className="supervision-assignee" key={assignment.assignmentId}><span><strong>{assignment.supervisorName ?? "عضو"}</strong><small>{assignment.canReadAttendance ? "قراءة الحضور" : ""}{assignment.canReadAttendance && assignment.canReviewEvaluations ? " · " : ""}{assignment.canReviewEvaluations ? "مراجعة + نشر/إرجاع التقييمات" : ""}</small></span><button type="button" aria-label="سحب الصلاحية" onClick={() => void revoke(assignment.assignmentId)}><X size={15} /></button></div>)}</div></article>)}</section>}
      </div>
    </main>
  </RoleDashboardShell>;
}

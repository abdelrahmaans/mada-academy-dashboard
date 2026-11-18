import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
  Eye,
  ClipboardList,
  Award,
  Calendar,
  AlertCircle,
  Users,
  Check,
} from "lucide-react";
import { toast } from "sonner";
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
  const [canReadEvaluations, setCanReadEvaluations] = useState(false);
  const [canDecideEvaluations, setCanDecideEvaluations] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const groupPromise = apiClient.branchSupervisionGroups();
      const teamPromise = apiClient
        .branchTeam()
        .then(res =>
          res.items.map(m => ({
            userId: m.userId,
            name: m.name,
            roleCode: m.roleCode,
            membershipStatus: m.status,
          }))
        )
        .catch(async () => {
          const res = await apiClient.academyMembers().catch(() => ({ items: [], total: 0 }));
          return res.items.map(m => ({
            userId: m.userId,
            name: m.name,
            roleCode: m.roleCode,
            membershipStatus: m.membershipStatus,
          }));
        });

      const [groupResult, rawMembers] = await Promise.all([groupPromise, teamPromise]);
      setGroups(groupResult.items || []);
      setMembers(
        (rawMembers as AcademyMember[]).filter(
          member =>
            (member.membershipStatus === "ACTIVE" || (member as any).status === "ACTIVE") &&
            (member.roleCode === "R03_HEAD_INSTRUCTORS" || member.roleCode === "R04_INSTRUCTOR")
        )
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل مجموعات الفرع.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const targetGroup = useMemo(
    () => groups.find(group => group.id === selectedGroup),
    [groups, selectedGroup]
  );

  const availableMembers = members.filter(
    member => !targetGroup?.assignments.some(assignment => assignment.supervisorUserId === member.userId)
  );

  const hasAtLeastOnePermission = canReadAttendance || canReadEvaluations || canDecideEvaluations;
  const isFormValid = Boolean(selectedGroup && selectedMember && hasAtLeastOnePermission);

  const grant = async () => {
    if (!isFormValid) return;
    setSaving(true);
    try {
      await apiClient.grantGroupSupervision({
        supervisorUserId: selectedMember,
        courseOfferingId: selectedGroup,
        canReadAttendance,
        canReadEvaluations,
        canDecideEvaluations,
        endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : undefined,
      });
      toast.success("تم منح صلاحية متابعة المجموعة بنجاح ✓");
      setSelectedMember("");
      setEndsAt("");
      setCanReadAttendance(false);
      setCanReadEvaluations(false);
      setCanDecideEvaluations(false);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر منح الصلاحية.");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (assignmentId: string, supervisorName?: string) => {
    try {
      await apiClient.revokeGroupSupervision(assignmentId);
      toast.success(`تم سحب صلاحية المتابعة ${supervisorName ? `عن ${supervisorName}` : ""} بنجاح`);
      await load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر سحب الصلاحية.");
    }
  };

  return (
    <RoleDashboardShell
      className="app-shell supervision-assignments-shell"
      roleCode="R02"
      roleLabel="مدير الفرع"
      scopeLevel="branch"
      scopeLabel="فرع واحد"
      demo={false}
      mobileOpen={mobileOpen}
      onCloseMobile={() => setMobileOpen(false)}
    >
      <main className="main-panel" dir="rtl">
        <RoleSurfaceTopbar onMenu={() => setMobileOpen(true)} scopeLabel="نطاق الفرع" roleLabel="مدير الفرع" />
        <div className="workspace supervision-assignments-page">
          {/* Header */}
          <header className="supervision-heading">
            <div>
              <span className="supervision-kicker">
                <ShieldCheck size={16} /> الحوكمة وتفويض الصلاحيات
              </span>
              <h1>إدارة متابعة وإشراف المجموعات</h1>
              <p>تكليف المدربين ومشرفي المدربين بمتابعة مجموعات محددة داخل نطاق فرعك فقط، مع التحكم الكامل بالصلاحيات.</p>
            </div>
            <button
              className="button button-secondary"
              onClick={() => void load()}
              disabled={loading}
              title="تحديث البيانات"
            >
              <RefreshCw size={15} className={loading ? "spinning" : ""} />
              <span>تحديث البيانات</span>
            </button>
          </header>

          {/* Policy Banner */}
          <section className="supervision-policy">
            <ShieldCheck size={20} />
            <div>
              <strong>ضوابط الصلاحيات والإشراف (Role Governance):</strong>
              <span>
                التكليف محدد بالمجموعة فقط ولا يمنح أي وصول مالي أو صلاحيات إدارية خارجها. قراءة الحضور للعرض فقط دون
                تعديل، ومراجعة التقييمات لا تعني نشرها. النشر للأسرة أو الإرجاع للمدرب يتطلب صلاحية قرار صريحة.
              </span>
            </div>
          </section>

          {/* Grant Supervision Form Card */}
          <section className="supervision-grant-card">
            <div className="supervision-card-header">
              <div className="supervision-card-icon">
                <UserPlus size={22} />
              </div>
              <div className="supervision-card-titles">
                <h2>منح صلاحية متابعة جديدة</h2>
                <p>اختر المجموعة والعضو، ثم فعّل الصلاحيات المطلوبة صراحةً. لا تُمنح أي صلاحية تلقائياً.</p>
              </div>
            </div>

            <div className="supervision-form-wrap">
              {/* Top 3 Inputs Row */}
              <div className="supervision-inputs-grid">
                <div className="supervision-field">
                  <label htmlFor="select-group">
                    <BookOpen size={14} />
                    <span>المجموعة الدراسية (الجروب) *</span>
                  </label>
                  <select
                    id="select-group"
                    value={selectedGroup}
                    onChange={event => {
                      setSelectedGroup(event.target.value);
                      setSelectedMember("");
                    }}
                  >
                    <option value="">-- اختر المجموعة من القائمة --</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.courseName} · {group.instructorName ? `المدرب: ${group.instructorName}` : "بدون مدرب"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="supervision-field">
                  <label htmlFor="select-member">
                    <Users size={14} />
                    <span>المدرب أو المشرف الأكاديمي *</span>
                  </label>
                  <select
                    id="select-member"
                    value={selectedMember}
                    onChange={event => setSelectedMember(event.target.value)}
                    disabled={!selectedGroup}
                  >
                    <option value="">
                      {!selectedGroup ? "-- اختر المجموعة أولاً --" : "-- اختر العضو المصرح له --"}
                    </option>
                    {availableMembers.map(member => (
                      <option key={member.userId} value={member.userId}>
                        {member.name} ({member.roleCode === "R04_INSTRUCTOR" ? "مدرب" : "مشرف مدربين R03"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="supervision-field">
                  <label htmlFor="ends-at">
                    <Calendar size={14} />
                    <span>تاريخ انتهاء التكليف (اختياري)</span>
                  </label>
                  <input
                    id="ends-at"
                    type="date"
                    value={endsAt}
                    onChange={event => setEndsAt(event.target.value)}
                  />
                </div>
              </div>

              {/* Permissions Section */}
              <div className="supervision-perms-container">
                <div className="supervision-perms-head">
                  <span className="perms-title">
                    <ShieldCheck size={16} />
                    <span>الصلاحيات الممنوحة للمشرف (حدد واحدة على الأقل) *</span>
                  </span>
                  {!hasAtLeastOnePermission && selectedMember && (
                    <span className="perms-warning">
                      <AlertCircle size={13} />
                      <span>يرجى اختيار صلاحية واحدة على الأقل للمتابعة</span>
                    </span>
                  )}
                </div>

                <div className="supervision-perms-grid">
                  {/* Card 1: Attendance */}
                  <div
                    className={`supervision-perm-tile ${canReadAttendance ? "is-active" : ""}`}
                    onClick={() => setCanReadAttendance(prev => !prev)}
                  >
                    <div className="perm-tile-check">
                      <input
                        type="checkbox"
                        checked={canReadAttendance}
                        onChange={e => setCanReadAttendance(e.target.checked)}
                        onClick={e => e.stopPropagation()}
                        aria-label="قراءة الجلسات والحضور"
                      />
                    </div>
                    <div className="perm-tile-icon blue">
                      <Eye size={18} />
                    </div>
                    <div className="perm-tile-content">
                      <strong>قراءة الجلسات والحضور</strong>
                      <p>الاطلاع على كشف الحضور والغياب للمجموعة دون إمكانية التعديل أو التحضير.</p>
                    </div>
                  </div>

                  {/* Card 2: Evaluations Read */}
                  <div
                    className={`supervision-perm-tile ${canReadEvaluations ? "is-active" : ""}`}
                    onClick={() => setCanReadEvaluations(prev => !prev)}
                  >
                    <div className="perm-tile-check">
                      <input
                        type="checkbox"
                        checked={canReadEvaluations}
                        onChange={e => setCanReadEvaluations(e.target.checked)}
                        onClick={e => e.stopPropagation()}
                        aria-label="قراءة طابور التقييمات"
                      />
                    </div>
                    <div className="perm-tile-icon amber">
                      <ClipboardList size={18} />
                    </div>
                    <div className="perm-tile-content">
                      <strong>قراءة طابور التقييمات</strong>
                      <p>متابعة تقييمات الطلاب وحالتها للتوجيه الأكاديمي الداخلي (بدون حق النشر).</p>
                    </div>
                  </div>

                  {/* Card 3: Evaluations Decision */}
                  <div
                    className={`supervision-perm-tile ${canDecideEvaluations ? "is-active" : ""}`}
                    onClick={() => setCanDecideEvaluations(prev => !prev)}
                  >
                    <div className="perm-tile-check">
                      <input
                        type="checkbox"
                        checked={canDecideEvaluations}
                        onChange={e => setCanDecideEvaluations(e.target.checked)}
                        onClick={e => e.stopPropagation()}
                        aria-label="اتخاذ قرار نشر أو إرجاع التقييم"
                      />
                    </div>
                    <div className="perm-tile-icon teal">
                      <Award size={18} />
                    </div>
                    <div className="perm-tile-content">
                      <strong>اتخاذ قرار: اعتماد أو إرجاع</strong>
                      <p>صلاحية نشر التقييمات لأولياء الأمور أو إرجاعها للمدرب لإعادة التعديل.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="supervision-form-footer">
                <div className="footer-status-hint">
                  {isFormValid ? (
                    <span className="hint-success">
                      <Check size={14} /> بيانات التكليف مكتملة وجاهزة للمنح.
                    </span>
                  ) : (
                    <span className="hint-muted">
                      اختر المجموعة، العضو المصرح له، وحدد صلاحية واحدة على الأقل.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="button button-primary supervision-submit-btn"
                  onClick={() => void grant()}
                  disabled={saving || !isFormValid}
                >
                  <CheckCircle2 size={16} />
                  <span>{saving ? "جارٍ منح الصلاحية…" : "منح وتفعيل الصلاحية ✓"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Groups Supervision List */}
          {loading && <p className="supervision-state">جارٍ تحميل مجموعات الفرع…</p>}

          {!loading && error && (
            <section className="supervision-state supervision-error">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button className="button button-secondary" onClick={() => void load()}>
                إعادة المحاولة
              </button>
            </section>
          )}

          {!loading && !error && (
            <section className="supervision-groups">
              <div className="supervision-section-heading">
                <div className="section-title-wrap">
                  <div className="section-icon">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2>مجموعات الفرع والمشرفون المكلّفون</h2>
                    <p>إجمالي {groups.length} مجموعة مسجلة بالفرع مع بيان المشرفين والصلاحيات الممنوحة لهم.</p>
                  </div>
                </div>
              </div>

              {groups.length === 0 ? (
                <div className="supervision-empty-groups">
                  <BookOpen size={36} color="#94a3b8" />
                  <h4>لا توجد مجموعات متاحة لهذا الفرع</h4>
                  <p>تأكد من وجود مجموعات نشطة في جدول الفرع لإسناد المتابعة إليها.</p>
                </div>
              ) : (
                <div className="supervision-groups-list">
                  {groups.map(group => (
                    <article className="supervision-group-card" key={group.id}>
                      <div className="supervision-group-info">
                        <div className="group-info-icon">
                          <BookOpen size={18} />
                        </div>
                        <div className="group-info-meta">
                          <strong>{group.courseName}</strong>
                          <span>
                            {group.instructorName ? `المدرب الأساسي: ${group.instructorName}` : "بدون مدرب مسند"} ·{" "}
                            {group.enrolledStudents} / {group.maxStudents} طالب مسجل
                          </span>
                        </div>
                      </div>

                      <div className="supervision-assignees-container">
                        {group.assignments.length === 0 ? (
                          <span className="supervision-no-assignee">لا يوجد مشرف مكلّف حالياً</span>
                        ) : (
                          group.assignments.map(assignment => (
                            <div className="supervision-assignee-pill" key={assignment.assignmentId}>
                              <div className="assignee-details">
                                <span className="assignee-name">{assignment.supervisorName ?? "عضو"}</span>
                                <div className="assignee-badges">
                                  {assignment.canReadAttendance && (
                                    <span className="perm-mini-badge blue">حضور</span>
                                  )}
                                  {assignment.canReadEvaluations && (
                                    <span className="perm-mini-badge amber">تقييمات</span>
                                  )}
                                  {assignment.canDecideEvaluations && (
                                    <span className="perm-mini-badge teal">قرار نشر</span>
                                  )}
                                  {assignment.endsAt && (
                                    <span className="perm-mini-badge gray">
                                      حتى {new Date(assignment.endsAt).toLocaleDateString("ar-EG")}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="assignee-revoke-btn"
                                aria-label="سحب الصلاحية"
                                title={`سحب صلاحية المتابعة عن ${assignment.supervisorName ?? "العضو"}`}
                                onClick={() => void revoke(assignment.assignmentId, assignment.supervisorName ?? undefined)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </RoleDashboardShell>
  );
}

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  type RoleInfo,
  type RoleCode,
  type StaffMember,
  ROLE_BY_CODE,
  ROLES,
  STATUS_LABELS,
} from "@/components/TeamModels";

type Setter<T> = Dispatch<SetStateAction<T>>;

export type TeamManagementViewsProps = {
  branch: string;
  branchStaff: StaffMember[];
  instructorCount: number;
  activeCount: number;
  adminCount: number;
  roleCounts: Map<RoleCode, number>;
  openRole: (role: RoleInfo) => void;
  filteredStaff: StaffMember[];
  query: string;
  setQuery: Setter<string>;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  toggleStatus: (member: StaffMember) => void;
  dialog: "add" | "role" | "delete" | "reset-password" | null;
  setDialog: Setter<"add" | "role" | "delete" | "reset-password" | null>;
  name: string;
  setName: Setter<string>;
  phone: string;
  setPhone: Setter<string>;
  tempPassword?: string;
  setTempPassword?: Setter<string>;
  submittingStaff?: boolean;
  newRole: RoleCode;
  setNewRole: (value: RoleCode) => void;
  supervisorId: string;
  setSupervisorId: Setter<string>;
  activeInstructorHeads: StaffMember[];
  submitStaff: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteMember?: (member: StaffMember) => void;
  onResetPassword?: (member: StaffMember) => void;
  memberToDelete?: StaffMember | null;
  onConfirmDelete?: () => void;
  memberToReset?: StaffMember | null;
  resetNewPass?: string;
  setResetNewPass?: Setter<string>;
  resetConfirmPass?: string;
  setResetConfirmPass?: Setter<string>;
  resetError?: string | null;
  actionSubmitting?: boolean;
  onConfirmResetPassword?: (event: FormEvent<HTMLFormElement>) => void;
  selectedRole: RoleInfo;
  navigate: (path: string) => void;
};

export function TeamManagementViews({
  branch,
  branchStaff,
  instructorCount,
  activeCount,
  adminCount,
  roleCounts,
  openRole,
  filteredStaff,
  query,
  setQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  toggleStatus,
  dialog,
  setDialog,
  name,
  setName,
  phone,
  setPhone,
  tempPassword = "",
  setTempPassword,
  submittingStaff = false,
  newRole,
  setNewRole,
  supervisorId,
  setSupervisorId,
  activeInstructorHeads,
  submitStaff,
  onDeleteMember,
  onResetPassword,
  memberToDelete,
  onConfirmDelete,
  memberToReset,
  resetNewPass = "",
  setResetNewPass,
  resetConfirmPass = "",
  setResetConfirmPass,
  resetError,
  actionSubmitting = false,
  onConfirmResetPassword,
  selectedRole,
  navigate,
}: TeamManagementViewsProps) {
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);

  return (
    <>
      <section
        className="finance-stats-grid team-stats"
        aria-label="ملخص فريق الفرع"
      >
        <article className="finance-stat">
          <span className="finance-stat-icon icon-teal">
            <Users size={18} />
          </span>
          <span className="finance-stat-label">أعضاء الفريق بالفرع</span>
          <div>
            <strong>{branchStaff.length + 1}</strong>
            <small>بما فيهم مدير الفرع</small>
          </div>
          <small>نطاق العرض الحالي: {branch}</small>
        </article>
        <article className="finance-stat">
          <span className="finance-stat-icon icon-blue">
            <GraduationCap size={18} />
          </span>
          <span className="finance-stat-label">الإشراف والتدريب</span>
          <div>
            <strong>{instructorCount}</strong>
            <small>رئيس مدربين ومدربون</small>
          </div>
          <small>موزعون على الجداول الأكاديمية</small>
        </article>
        <article className="finance-stat">
          <span className="finance-stat-icon icon-amber">
            <CheckCircle2 size={18} />
          </span>
          <span className="finance-stat-label">حسابات نشطة</span>
          <div>
            <strong>{activeCount + 1}</strong>
            <small>حسابات فعالة بالفرع</small>
          </div>
          <small>حسابات مفعلة بالفرع</small>
        </article>
        <article className="finance-stat">
          <span className="finance-stat-icon icon-violet">
            <Clock3 size={18} />
          </span>
          <span className="finance-stat-label">أدوار تشغيلية مساندة</span>
          <div>
            <strong>{adminCount}</strong>
            <small>سكرتارية · مالية · تسويق</small>
          </div>
          <small>منفصلة عن صلاحيات المدرب</small>
        </article>
      </section>

      <section className="panel team-table-panel">
        <div className="team-table-heading">
          <div className="panel-title-group">
            <span className="panel-icon panel-icon-teal">
              <UserCog size={18} />
            </span>
            <div>
              <h2>حسابات الفريق</h2>
              <p>الأعضاء المرتبطون بفرع {branch}</p>
            </div>
          </div>
          <span className="team-table-total">{filteredStaff.length} عضو</span>
        </div>
        <div className="team-toolbar">
          <label className="team-search">
            <Search size={16} />
            <input
              aria-label="بحث في الفريق"
              placeholder="ابحث بالاسم أو الهاتف أو الدور..."
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="تصفية حسب الدور"
            value={roleFilter}
            onChange={event => setRoleFilter(event.target.value)}
          >
            <option value="all">كل الأدوار</option>
            {ROLES.filter(role => role.assignable).map(role => (
              <option key={role.code} value={role.code}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            aria-label="تصفية حسب الحالة"
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="on_leave">إجازة</option>
            <option value="terminated">موقوف</option>
          </select>
        </div>
        <div className="team-table-wrap">
          <table className="team-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الدور</th>
                <th>الفرع</th>
                <th>الحالة</th>
                <th>تاريخ الانضمام</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length ? (
                filteredStaff.map(member => {
                  const role = ROLE_BY_CODE[member.role];
                  const RoleIcon = role.icon;
                  return (
                    <tr
                      key={member.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedMember(member)}
                    >
                      <td>
                        <div className="team-member-cell">
                          <span className="team-avatar">
                            {member.name.slice(0, 1)}
                          </span>
                          <span>
                            <strong>{member.name}</strong>
                            <small dir="ltr">{member.phone}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="team-role-chip">
                          <RoleIcon size={14} />
                          {role.name}
                        </span>
                      </td>
                      <td>{member.branch}</td>
                      <td>
                        <span className={`team-status status-${member.status}`}>
                          <i />
                          {STATUS_LABELS[member.status]}
                        </span>
                      </td>
                      <td>{member.joined}</td>
                      <td>
                        <div
                          style={{ display: "flex", gap: "6px", alignItems: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="team-row-action"
                            style={{
                              background: "#f0fdfa",
                              color: "#0f766e",
                              borderColor: "#ccfbf1",
                              fontWeight: 700,
                            }}
                            onClick={() => setSelectedMember(member)}
                          >
                            عرض المهام
                          </button>
                          <button
                            type="button"
                            className="team-row-action"
                            style={{
                              background: member.status === "active" ? "#fef2f2" : "#f0fdf4",
                              color: member.status === "active" ? "#b91c1c" : "#15803d",
                              borderColor: member.status === "active" ? "#fecaca" : "#bbf7d0",
                            }}
                            onClick={() => {
                              toggleStatus(member);
                              if (selectedMember && selectedMember.id === member.id) {
                                setSelectedMember({
                                  ...selectedMember,
                                  status: member.status === "active" ? "on_leave" : "active",
                                });
                              }
                            }}
                          >
                            {member.status === "active" ? "إيقاف الحساب" : "تفعيل الحساب"}
                          </button>
                          {onResetPassword && (
                            <button
                              type="button"
                              className="team-row-action"
                              style={{
                                background: "#fffbeb",
                                color: "#b45309",
                                borderColor: "#fde68a",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              onClick={() => onResetPassword(member)}
                              title="إعادة تعيين كلمة مرور مؤقتة للعضو"
                            >
                              <KeyRound size={12} />
                              <span>كلمة سر</span>
                            </button>
                          )}
                          {onDeleteMember && (
                            <button
                              type="button"
                              className="team-row-action"
                              style={{
                                background: "#fff1f2",
                                color: "#e11d48",
                                borderColor: "#fecdd3",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              onClick={() => onDeleteMember(member)}
                              title="مسح حساب العضو من الفرع"
                            >
                              <Trash2 size={12} />
                              <span>مسح</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="team-empty">
                      <Search size={20} />
                      <strong>لا توجد نتائج مطابقة</strong>
                      <span>جرّب تغيير كلمة البحث أو خيارات التصفية.</span>
                      <button
                        className="text-link"
                        onClick={() => {
                          setQuery("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                        }}
                      >
                        إعادة تعيين الفلاتر
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="team-table-footer">
          <span>
            بيانات عرض تجريبية · {filteredStaff.length} من {branchStaff.length}{" "}
            حساب
          </span>
          <span>
            <ArrowDownLeft size={13} /> كل إجراء محلي وغير محفوظ
          </span>
        </div>
      </section>
      <div className="finance-footer-note">
        <span>
          <AlertCircle size={14} />
        </span>
        <p>
          إضافة عضو هنا لا تنشئ بيانات دخول ولا ترسل OTP. تسجيل الدخول، تعيين
          الصلاحيات الفعلية، وعزل البيانات حسب الفرع تحتاج ربط خدمة الهوية
          والـBackend.
        </p>
      </div>
      {dialog === "add" && (
        <div
          className="dialog-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="dialog-card team-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-dialog-title"
          >
            <button
              className="dialog-close"
              aria-label="إغلاق"
              onClick={() => setDialog(null)}
            >
              <X size={17} />
            </button>
            <div className="team-dialog-icon">
              <UserPlus size={20} />
            </div>
            <div className="team-dialog-heading">
              <h2 id="team-dialog-title">إضافة حساب موظف للفرع</h2>
              <p>إنشاء حساب معتمد لأحد أعضاء الفريق وتعيين كلمة المرور المؤقتة للدخول.</p>
            </div>
            <form className="finance-form" onSubmit={submitStaff}>
              <label>
                الاسم الكامل
                <input
                  autoFocus
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="مثال: مريم أحمد حسن"
                  required
                />
              </label>
              <label>
                رقم الموبايل
                <input
                  dir="ltr"
                  inputMode="tel"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="01xxxxxxxxx"
                  required
                />
              </label>
              <label>
                <span>كلمة المرور المؤقتة للحساب <b>*</b></span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={tempPassword}
                      onChange={event => setTempPassword?.(event.target.value)}
                      placeholder="أدخل كلمة مرور مؤقتة (مثال: Mada@2026!)"
                      required
                      style={{ paddingLeft: "36px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                      title={showPassword ? "إخفاء" : "إظهار"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ whiteSpace: "nowrap", padding: "8px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    onClick={() => {
                      const generated = `Mada@${Math.floor(1000 + Math.random() * 9000)}!`;
                      setTempPassword?.(generated);
                      setShowPassword(true);
                      toast.info(`تم توليد كلمة سر مؤقتة: ${generated}`);
                    }}
                  >
                    <KeyRound size={14} />
                    <span>توليد تلقائي</span>
                  </button>
                </div>
                <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                  سيُطلب من الموظف تغيير كلمة المرور فور أول تسجيل دخول.
                </small>
              </label>
              <div className="finance-form-row">
                <label>
                  الدور
                  <select
                    value={newRole}
                    onChange={event => {
                      const role = event.target.value as StaffMember["role"];
                      setNewRole(role);
                      if (role === "R04" && !supervisorId)
                        setSupervisorId(activeInstructorHeads[0]?.id ?? "");
                    }}
                  >
                    {ROLES.filter(role => role.assignable).map(role => (
                      <option key={role.code} value={role.code}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="assigned-branch-field">
                  <span>الفرع</span>
                  <strong>{branch}</strong>
                  <small>الحساب الجديد يُضاف لفرعك الحالي</small>
                </div>
              </div>
              {newRole === "R04" && (
                <label className="team-supervisor-field">
                  المشرف الأكاديمي المباشر
                  <select
                    value={supervisorId}
                    onChange={event => setSupervisorId(event.target.value)}
                  >
                    <option value="">مدير الفرع المباشر (إشراف الفرع العام)</option>
                    {activeInstructorHeads.map(head => (
                      <option key={head.id} value={head.id}>
                        {head.name} (رئيس مدربين)
                      </option>
                    ))}
                  </select>
                  <small>
                    وفق هيكلية الإشراف الأكاديمي ومتابعة جلسات التدريب.
                  </small>
                </label>
              )}
              <div className="team-role-preview">
                <span
                  className={`team-role-icon role-${ROLE_BY_CODE[newRole].tone}`}
                >
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <strong>نطاق دور {ROLE_BY_CODE[newRole].name}</strong>
                  <small>{ROLE_BY_CODE[newRole].scope.join(" · ")}</small>
                  <small className="team-setup-hint">
                    {newRole === "R04"
                      ? "اربط المدرب برئيس مدربين نشط في نفس الفرع قبل التفعيل."
                      : newRole === "R05"
                        ? "جهّز قائمة التسجيل ومتابعة أولياء الأمور للحساب."
                        : newRole === "R06"
                          ? "النطاق المالي منفصل عن التسجيل والتقييم الأكاديمي."
                          : newRole === "R03"
                            ? "يظهر هذا الدور كمشرف أكاديمي قابل للربط بالمدربين."
                            : "النطاق إرشادي؛ التفعيل الحقيقي يحتاج خدمة الهوية والصلاحيات."}
                  </small>
                </div>
              </div>
              <div className="dialog-info" style={{ background: "#f0fdfa", color: "#0f766e", border: "1px solid #ccfbf1" }}>
                <ShieldCheck size={16} color="#0d9488" />
                <span>
                  الحساب يُنشأ مباشرة في قاعدة بيانات الفرع، ويسمع فوراً لدى مالك الأكاديمية (Academy Owner) في سجل الحسابات والحوكمة.
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setDialog(null)}
                  disabled={submittingStaff}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary" disabled={submittingStaff}>
                  {submittingStaff ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>{submittingStaff ? "جارٍ إنشاء الحساب..." : "إنشاء وتفعيل الحساب"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {dialog === "delete" && memberToDelete && (
        <div
          className="dialog-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="dialog-card team-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            style={{ maxWidth: "460px" }}
          >
            <button
              className="dialog-close"
              aria-label="إغلاق"
              onClick={() => setDialog(null)}
            >
              <X size={17} />
            </button>
            <div className="team-dialog-icon" style={{ background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" }}>
              <Trash2 size={22} />
            </div>
            <div className="team-dialog-heading">
              <h2 id="delete-dialog-title" style={{ color: "#9f1239" }}>تأكيد مسح حساب الموظف</h2>
              <p>هل أنت متأكد من مسح حساب هذا العضو وإلغاء صلاحياته من الفرع؟</p>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", margin: "14px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{memberToDelete.name}</span>
                <span className="team-role-chip" style={{ fontSize: "11px" }}>
                  {ROLE_BY_CODE[memberToDelete.role].name}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "12px" }}>
                <span dir="ltr">📱 {memberToDelete.phone}</span>
                <span>🏢 {memberToDelete.branch}</span>
              </div>
            </div>

            <div className="dialog-info" style={{ background: "#fff1f2", color: "#9f1239", border: "1px solid #fecdd3", margin: "0 0 16px" }}>
              <AlertCircle size={16} color="#e11d48" />
              <span>
                سيتم إيقاف صلاحيات الدخول لهذا الحساب وحذفه من قائمة فريق الفرع فور التأكيد.
              </span>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setDialog(null)}
                disabled={actionSubmitting}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="button"
                style={{
                  background: "#e11d48",
                  color: "#ffffff",
                  border: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={onConfirmDelete}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>{actionSubmitting ? "جارٍ المسح..." : "تأكيد مسح الحساب"}</span>
              </button>
            </div>
          </section>
        </div>
      )}
      {dialog === "reset-password" && memberToReset && (
        <div
          className="dialog-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="dialog-card team-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            style={{ maxWidth: "480px" }}
          >
            <button
              className="dialog-close"
              aria-label="إغلاق"
              onClick={() => setDialog(null)}
            >
              <X size={17} />
            </button>
            <div className="team-dialog-icon" style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
              <KeyRound size={22} />
            </div>
            <div className="team-dialog-heading">
              <h2 id="reset-dialog-title">تعيين وتفعيل كلمة سر مؤقتة</h2>
              <p>تعيين كلمة سر مؤقتة جديدة للموظف {memberToReset.name} ({ROLE_BY_CODE[memberToReset.role].name}).</p>
            </div>

            {resetError && (
              <div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
                {resetError}
              </div>
            )}

            <form className="finance-form" onSubmit={onConfirmResetPassword}>
              <label>
                <span>كلمة المرور المؤقتة الجديدة <b>*</b></span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type={showResetPass ? "text" : "password"}
                      dir="ltr"
                      value={resetNewPass}
                      onChange={e => setResetNewPass?.(e.target.value)}
                      placeholder="أدخل كلمة مرور مؤقتة (مثال: Mada@2026!)"
                      required
                      style={{ paddingLeft: "36px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPass(p => !p)}
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                      }}
                      title={showResetPass ? "إخفاء" : "إظهار"}
                    >
                      {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ whiteSpace: "nowrap", padding: "8px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    onClick={() => {
                      const generated = `Mada@${Math.floor(1000 + Math.random() * 9000)}!`;
                      setResetNewPass?.(generated);
                      setResetConfirmPass?.(generated);
                      setShowResetPass(true);
                      toast.info(`تم توليد كلمة سر مؤقتة: ${generated}`);
                    }}
                  >
                    <KeyRound size={14} />
                    <span>توليد تلقائي</span>
                  </button>
                </div>
              </label>

              <label>
                <span>تأكيد كلمة المرور المؤقتة <b>*</b></span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showResetPass ? "text" : "password"}
                    dir="ltr"
                    value={resetConfirmPass}
                    onChange={e => setResetConfirmPass?.(e.target.value)}
                    placeholder="أعد إدخال نفس كلمة المرور للتأكيد"
                    required
                  />
                </div>
                <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                  التأكيد يضمن صحة كلمة السر وتفعيلها فوراً للحساب وإنهاء الجلسات السابقة.
                </small>
              </label>

              <div className="dialog-info" style={{ background: "#f0fdfa", color: "#0f766e", border: "1px solid #ccfbf1", margin: "10px 0 16px" }}>
                <ShieldCheck size={16} color="#0d9488" />
                <span>
                  بالضغط على "تأكيد وتفعيل"، سيتم تفعيل كلمة المرور فوراً وطلب تغييرها من الموظف عند أول تسجيل دخول.
                </span>
              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setDialog(null)}
                  disabled={actionSubmitting}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{actionSubmitting ? "جارٍ التفعيل..." : "تأكيد وتفعيل كلمة السر"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {dialog === "role" && (
        <div
          className="dialog-overlay"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDialog(null);
          }}
        >
          <section
            className="dialog-card team-dialog team-role-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-dialog-title"
          >
            <button
              className="dialog-close"
              aria-label="إغلاق"
              onClick={() => setDialog(null)}
            >
              <X size={17} />
            </button>
            <div className={`team-role-icon role-${selectedRole.tone}`}>
              <selectedRole.icon size={20} />
            </div>
            <div className="team-dialog-heading">
              <span className="team-role-code">{selectedRole.code}</span>
              <h2 id="role-dialog-title">{selectedRole.name}</h2>
              <p>
                {selectedRole.english} · {selectedRole.description}
              </p>
            </div>
            <div className="role-scope-list">
              <strong>نطاقات العمل الموضحة</strong>
              {selectedRole.scope.map(item => (
                <span key={item}>
                  <CheckCircle2 size={15} />
                  {item}
                </span>
              ))}
            </div>
            {selectedRole.code === "R04" && (
              <button
                className="instructor-preview-link"
                onClick={() => navigate("/instructor")}
              >
                <GraduationCap size={16} />
                معاينة مساحة المدرب
                <ChevronLeft size={14} />
              </button>
            )}
            {selectedRole.code === "R05" && (
              <button
                className="instructor-preview-link secretary-preview-link"
                onClick={() => navigate("/secretary")}
              >
                <Users size={16} />
                معاينة مساحة السكرتارية
                <ChevronLeft size={14} />
              </button>
            )}
            {selectedRole.code === "R03" && (
              <button
                className="instructor-preview-link academic-preview-link"
                onClick={() => navigate("/head-instructors")}
              >
                <GraduationCap size={16} />
                معاينة مساحة رئيس المدربين
                <ChevronLeft size={14} />
              </button>
            )}
            <div className="dialog-info">
              <AlertCircle size={15} />
              <span>
                {selectedRole.assignable
                  ? "نطاق توضيحي؛ الصلاحيات النهائية تعتمد بعد إعداد مصفوفة الوصول وربط الـBackend."
                  : "دور الحساب الحالي للمدير؛ لا يمكن إنشاء مدير فرع آخر من نموذج الفريق التجريبي."}
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="button button-primary"
                onClick={() => setDialog(null)}
              >
                تم
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedMember && (
        <div
          className="dialog-backdrop"
          onClick={() => setSelectedMember(null)}
          role="dialog"
          aria-modal="true"
        >
          <section
            className="dialog-card"
            style={{ maxWidth: "520px", borderRadius: "18px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-heading">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="panel-icon panel-icon-teal" style={{ width: "38px", height: "38px" }}>
                  <UserCog size={20} />
                </span>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>
                    ملف العضو: {selectedMember.name}
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {ROLE_BY_CODE[selectedMember.role].name} · {selectedMember.branch}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button dialog-close"
                onClick={() => setSelectedMember(null)}
                aria-label="إغلاق النافذة"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "16px 20px", display: "grid", gap: "14px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>
                    حالة الحساب:
                  </small>
                  <span
                    className={`team-status status-${selectedMember.status}`}
                    style={{ marginTop: "4px", display: "inline-flex" }}
                  >
                    <i />
                    {STATUS_LABELS[selectedMember.status]}
                  </span>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>
                    رقم الهاتف:
                  </small>
                  <strong style={{ fontSize: "13px", color: "#0f172a", direction: "ltr", display: "inline-block", marginTop: "4px" }}>
                    {selectedMember.phone}
                  </strong>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>
                    تاريخ الانضمام:
                  </small>
                  <span style={{ fontSize: "12px", color: "#334155" }}>
                    {selectedMember.joined}
                  </span>
                </div>
                <div>
                  <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>
                    كود المعرف:
                  </small>
                  <span
                    title={selectedMember.id}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#0f766e",
                      background: "#f0fdfa",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #ccfbf1",
                      display: "inline-block",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      navigator.clipboard?.writeText(selectedMember.id);
                      toast.success("تم نسخ كود المعرف");
                    }}
                  >
                    {selectedMember.id.startsWith("USR-") ? selectedMember.id : `عضو #${selectedMember.id.slice(-4)}`}
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f766e", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <BookOpen size={15} />
                  المهام والمجموعات المسندة (ماسك إيه حالياً):
                </h4>
                <div style={{ display: "grid", gap: "6px" }}>
                  {(selectedMember.assignedWork && selectedMember.assignedWork.length > 0
                    ? selectedMember.assignedWork
                    : [
                        "مسؤول عن الحصص والمجموعات المعتمدة داخل الفرع",
                        "متابعة الطلاب وتسجيل الحضور والتقييمات",
                      ]
                  ).map((task, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        padding: "8px 12px",
                        background: "#f0fdfa",
                        border: "1px solid #ccfbf1",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        color: "#115e59",
                      }}
                    >
                      <CheckCircle2 size={15} style={{ color: "#0d9488", flexShrink: 0, marginTop: "2px" }} />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: selectedMember.status === "active" ? "#fffbeb" : "#f0fdf4",
                  border: selectedMember.status === "active" ? "1px solid #fef3c7" : "1px solid #bbf7d0",
                  fontSize: "12px",
                  color: selectedMember.status === "active" ? "#b45309" : "#15803d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span>
                  {selectedMember.status === "active"
                    ? "الحساب نشط حالياً وله وصول للفرع."
                    : "الحساب موقوف / مجمد مؤقتاً ولا يمكنه تسجيل الدخول."}
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      background: selectedMember.status === "active" ? "#dc2626" : "#0d9488",
                      color: "#ffffff",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => {
                      toggleStatus(selectedMember);
                      setSelectedMember({
                        ...selectedMember,
                        status: selectedMember.status === "active" ? "on_leave" : "active",
                      });
                    }}
                  >
                    {selectedMember.status === "active" ? "إيقاف الحساب الآن" : "إعادة تفعيل الحساب"}
                  </button>
                  {onResetPassword && (
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "1px solid #fde68a",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                        background: "#fffbeb",
                        color: "#b45309",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      onClick={() => onResetPassword(selectedMember)}
                    >
                      <KeyRound size={13} />
                      <span>تعيين كلمة سر مؤقتة</span>
                    </button>
                  )}
                  {onDeleteMember && (
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "1px solid #fecdd3",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                        background: "#fff1f2",
                        color: "#e11d48",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      onClick={() => {
                        const target = selectedMember;
                        setSelectedMember(null);
                        onDeleteMember(target);
                      }}
                    >
                      <Trash2 size={13} />
                      <span>مسح الحساب</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="dialog-actions" style={{ padding: "12px 20px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedMember(null)}
              >
                إغلاق
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

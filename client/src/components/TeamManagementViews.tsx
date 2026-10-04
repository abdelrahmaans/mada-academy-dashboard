import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  GraduationCap,
  Search,
  ShieldCheck,
  UserPlus,
  UserCog,
  Users,
  X,
} from "lucide-react";
import type {
  RoleInfo,
  RoleCode,
  StaffMember,
  StaffStatus,
} from "@/components/TeamModels";
import { ROLE_BY_CODE, ROLES, STATUS_LABELS } from "@/components/TeamModels";

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
  dialog: "add" | "role" | null;
  setDialog: Setter<"add" | "role" | null>;
  name: string;
  setName: Setter<string>;
  phone: string;
  setPhone: Setter<string>;
  newRole: RoleCode;
  setNewRole: (value: RoleCode) => void;
  supervisorId: string;
  setSupervisorId: Setter<string>;
  activeInstructorHeads: StaffMember[];
  submitStaff: (event: FormEvent<HTMLFormElement>) => void;
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
  newRole,
  setNewRole,
  supervisorId,
  setSupervisorId,
  activeInstructorHeads,
  submitStaff,
  selectedRole,
  navigate,
}: TeamManagementViewsProps) {
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
          <small>التغيير هنا تجريبي فقط</small>
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

      <section className="team-role-section">
        <div className="team-section-heading">
          <div>
            <div className="team-kicker">الأدوار على مستوى الفرع</div>
            <h2>كل دور له مساحة عمل مختلفة</h2>
            <p>نظرة مختصرة على الأدوار المعتمدة في هيكل الأكاديمية.</p>
          </div>
          <span className="team-role-count">6 أدوار</span>
        </div>
        <div className="team-role-grid">
          {ROLES.map(role => {
            const Icon = role.icon;
            return (
              <button
                key={role.code}
                className="team-role-card"
                onClick={() => openRole(role)}
              >
                <span className={`team-role-icon role-${role.tone}`}>
                  <Icon size={18} />
                </span>
                <span className="team-role-copy">
                  <strong>{role.name}</strong>
                  <small>{role.english}</small>
                  <span>{role.description}</span>
                </span>
                <span className="team-role-number">
                  {roleCounts.get(role.code) ?? 0}
                </span>
                <ChevronLeft size={15} className="team-role-arrow" />
              </button>
            );
          })}
        </div>
        <p className="team-permission-note">
          <ShieldCheck size={15} /> نطاقات الأدوار إرشادية حسب المستندات
          الحالية؛ مصفوفة الصلاحيات الدقيقة تُعتمد في مرحلة عقود الـAPI.
        </p>
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
                    <tr key={member.id}>
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
                        <button
                          className="team-row-action"
                          onClick={() => toggleStatus(member)}
                        >
                          {member.status === "active" ? "إيقاف مؤقت" : "تفعيل"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="team-empty">
                      <Search size={20} />
                      <strong>مفيش نتائج مطابقة</strong>
                      <span>جرّب تغيير كلمة البحث أو الفلاتر.</span>
                      <button
                        className="text-link"
                        onClick={() => {
                          setQuery("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                        }}
                      >
                        مسح الفلاتر
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
              <h2 id="team-dialog-title">إضافة حساب موظف</h2>
              <p>أضف بيانات عضو جديد إلى قائمة الفريق التجريبية.</p>
            </div>
            <form className="finance-form" onSubmit={submitStaff}>
              <label>
                الاسم الكامل
                <input
                  autoFocus
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="مثال: مريم أحمد حسن"
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
                />
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
                  المشرف الأكاديمي <b>*</b>
                  <select
                    required
                    value={supervisorId}
                    onChange={event => setSupervisorId(event.target.value)}
                    disabled={activeInstructorHeads.length === 0}
                  >
                    {activeInstructorHeads.length === 0 ? (
                      <option value="">لا يوجد رئيس مدربين نشط في الفرع</option>
                    ) : (
                      activeInstructorHeads.map(head => (
                        <option key={head.id} value={head.id}>
                          {head.name}
                        </option>
                      ))
                    )}
                  </select>
                  <small>
                    وفق علاقة المشرف المباشر للكوتش في مخطط البيانات.
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
              <div className="dialog-info">
                <AlertCircle size={15} />
                <span>
                  لن يتم إنشاء حساب دخول حقيقي أو إرسال OTP من هذه المعاينة.
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setDialog(null)}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Check size={16} /> إضافة للعرض
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
    </>
  );
}

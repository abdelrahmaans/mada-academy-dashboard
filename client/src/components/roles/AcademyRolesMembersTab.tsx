import React from "react";
import {
  KeyRound,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import type {
  AcademyBranch,
  AcademyMember,
  AcademyRoleDefinition,
} from "@/lib/apiClient";
import {
  Empty,
  PanelTitle,
  isBranchRole,
  roleLabel,
} from "@/pages/AcademyRolesTypes";

export function AcademyRolesMembersTab({
  filteredMembers,
  members,
  roles,
  branches,
  selectedMemberId,
  selectedMemberRecord,
  memberSearch,
  setMemberSearch,
  memberBranchFilter,
  setMemberBranchFilter,
  memberStatusFilter,
  setMemberStatusFilter,
  onSelectMember,
  onChangeRole,
  onChangeMemberBranch,
  onOpenCustomization,
  onResetMemberPermissions,
  onChangeStatus,
  saving,
  currentUserId,
}: {
  filteredMembers: AcademyMember[];
  members: AcademyMember[];
  roles: AcademyRoleDefinition[];
  branches: AcademyBranch[];
  selectedMemberId: string | null;
  selectedMemberRecord: AcademyMember | null;
  memberSearch: string;
  setMemberSearch: (val: string) => void;
  memberBranchFilter: string;
  setMemberBranchFilter: (val: string) => void;
  memberStatusFilter: "ALL" | "ACTIVE" | "SUSPENDED";
  setMemberStatusFilter: (val: "ALL" | "ACTIVE" | "SUSPENDED") => void;
  onSelectMember: (memberId: string, roleCode: string) => void;
  onChangeRole: (member: AcademyMember, roleCode: string) => void;
  onChangeMemberBranch: (member: AcademyMember, branchId: string) => void;
  onOpenCustomization: (member: AcademyMember) => void;
  onResetMemberPermissions: (member: AcademyMember) => void;
  onChangeStatus: (member: AcademyMember) => void;
  saving: boolean;
  currentUserId?: string;
}) {
  return (
    <div className="academy-roles-grid">
      {/* Members Column */}
      <section className="academy-roles-panel academy-roles-members">
        <PanelTitle
          icon={<Users size={17} />}
          title="أعضاء الأكاديمية"
          note={`${filteredMembers.length} من أصل ${members.length}`}
        />

        {/* Filters Toolbar */}
        <div className="academy-members-filterbar">
          <div className="filter-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد أو الهاتف…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
            {memberSearch && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setMemberSearch("")}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="filter-selects-row">
            <select
              value={memberBranchFilter}
              onChange={(e) => setMemberBranchFilter(e.target.value)}
            >
              <option value="">جميع الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={memberStatusFilter}
              onChange={(e) =>
                setMemberStatusFilter(e.target.value as "ALL" | "ACTIVE" | "SUSPENDED")
              }
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">النشط فقط</option>
              <option value="SUSPENDED">الموقوف فقط</option>
            </select>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <Empty text="لا يوجد أعضاء يطابقون شروط البحث الحالية." />
        ) : (
          <div className="academy-member-list">
            {filteredMembers.map((member) => (
              <article
                key={member.membershipId}
                className={`academy-member ${
                  selectedMemberId === member.membershipId ? "selected" : ""
                }`}
                onClick={() => onSelectMember(member.membershipId, member.roleCode)}
              >
                <span className="academy-member-avatar">
                  {(member.name ?? "؟").slice(0, 1)}
                </span>
                <div className="academy-member-copy">
                  <div className="member-name-row">
                    <strong>{member.name ?? "بدون اسم"}</strong>
                    {member.hasCustomPermissions && (
                      <span className="custom-perm-tag" title="لديه صلاحيات مخصصة فرديًا">
                        مخصص فرديًا
                      </span>
                    )}
                  </div>
                  <small>
                    <bdi dir="ltr">{member.email}</bdi> ·{" "}
                    {member.branch?.name ?? "نطاق الأكاديمية"}
                  </small>
                </div>
                <span
                  className={`academy-member-status ${member.membershipStatus.toLowerCase()}`}
                >
                  {member.membershipStatus === "ACTIVE"
                    ? "نشط"
                    : member.membershipStatus === "SUSPENDED"
                    ? "موقوف"
                    : member.membershipStatus}
                </span>
                <span className="academy-member-role">
                  {roleLabel(roles, member.roleCode)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Selected Member Detail */}
      <aside className="academy-roles-panel academy-role-detail">
        <PanelTitle
          icon={<KeyRound size={17} />}
          title="ملف العضو والصلاحيات"
          note={selectedMemberRecord?.name ?? "اختر عضوًا للمعاينة"}
        />

        {selectedMemberRecord ? (
          <div className="member-detail-container">
            <div className="academy-role-detail-user">
              <span className="academy-member-avatar large">
                {(selectedMemberRecord.name ?? "؟").slice(0, 1)}
              </span>
              <div>
                <strong>{selectedMemberRecord.name}</strong>
                <p className="user-contact">
                  <bdi dir="ltr">{selectedMemberRecord.email}</bdi> ·{" "}
                  <bdi dir="ltr">{selectedMemberRecord.phone}</bdi>
                </p>
                <small>
                  {roleLabel(roles, selectedMemberRecord.roleCode)} ·{" "}
                  {selectedMemberRecord.scopeLevel === "BRANCH"
                    ? selectedMemberRecord.branch?.name ?? "فرع غير محدد"
                    : "كل فروع الأكاديمية"}
                </small>
              </div>
            </div>

            {/* Controls */}
            <div className="member-quick-controls">
              <label className="academy-role-select">
                <span>الدور الوظيفي</span>
                <select
                  value={selectedMemberRecord.roleCode}
                  onChange={(e) => void onChangeRole(selectedMemberRecord, e.target.value)}
                  disabled={saving || selectedMemberRecord.userId === currentUserId}
                >
                  {roles
                    .filter((r) => r.assignableByAcademyOwner)
                    .map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.label}
                      </option>
                    ))}
                </select>
              </label>

              {isBranchRole(roles, selectedMemberRecord.roleCode) && (
                <label className="academy-role-select">
                  <span>الفرع المرتبط</span>
                  <select
                    value={selectedMemberRecord.branch?.id ?? ""}
                    onChange={(e) =>
                      void onChangeMemberBranch(selectedMemberRecord, e.target.value)
                    }
                    disabled={saving || selectedMemberRecord.userId === currentUserId}
                  >
                    <option value="">اختر الفرع</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {/* Custom Permissions Status Callout */}
            <div className="member-perms-status-card">
              <div className="status-header">
                <div>
                  <h4>صلاحيات المستخدم الحالية</h4>
                  <p>
                    {selectedMemberRecord.hasCustomPermissions ? (
                      <span className="text-warning">
                        لديه مصفوفة صلاحيات مخصصة فرديًا تختلف عن دور{" "}
                        {roleLabel(roles, selectedMemberRecord.roleCode)}.
                      </span>
                    ) : (
                      <span className="text-muted">
                        يتبع الصلاحيات القياسية لدور{" "}
                        {roleLabel(roles, selectedMemberRecord.roleCode)}.
                      </span>
                    )}
                  </p>
                </div>
                <div className="status-actions">
                  {selectedMemberRecord.userId !== currentUserId && (
                    <button
                      type="button"
                      className="btn-custom-perm"
                      onClick={() => onOpenCustomization(selectedMemberRecord)}
                      disabled={saving}
                    >
                      <SlidersHorizontal size={14} /> تخصيص فردي
                    </button>
                  )}
                  {selectedMemberRecord.hasCustomPermissions &&
                    selectedMemberRecord.userId !== currentUserId && (
                      <button
                        type="button"
                        className="btn-reset-member-perm"
                        onClick={() => void onResetMemberPermissions(selectedMemberRecord)}
                        disabled={saving}
                        title="إلغاء التخصيص والعودة لافتراضي الدور"
                      >
                        <RotateCcw size={14} /> استعادة الدور
                      </button>
                    )}
                </div>
              </div>

              <div className="academy-permission-chips">
                {(
                  selectedMemberRecord.effectivePermissions ??
                  roles.find((r) => r.code === selectedMemberRecord.roleCode)?.permissions ??
                  []
                ).map((perm) => (
                  <span key={perm} className="perm-chip">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {/* Suspension / Activation Control */}
            {selectedMemberRecord.userId !== currentUserId && (
              <div className="member-danger-zone">
                <button
                  type="button"
                  className={`academy-member-status-button ${
                    selectedMemberRecord.membershipStatus === "ACTIVE"
                      ? "btn-suspend"
                      : "btn-activate"
                  }`}
                  onClick={() => void onChangeStatus(selectedMemberRecord)}
                  disabled={saving}
                >
                  {selectedMemberRecord.membershipStatus === "ACTIVE" ? (
                    <>
                      <UserMinus size={15} /> إيقاف الحساب وسحب الجلسات فورًا
                    </>
                  ) : (
                    <>
                      <UserCheck size={15} /> إعادة تفعيل الحساب
                    </>
                  )}
                </button>
                <small className="suspend-note">
                  {selectedMemberRecord.membershipStatus === "ACTIVE"
                    ? "سيؤدي الإيقاف إلى منع الدخول فورًا وإلغاء صلاحيات الـBearer Token."
                    : "سيمكن للعضو تسجيل الدخول بعد إعادة التفعيل."}
                </small>
              </div>
            )}
          </div>
        ) : (
          <Empty text="اختر عضوًا من القائمة لمراجعة بياناته أو تعديل صلاحياته." />
        )}
      </aside>
    </div>
  );
}

import React from "react";
import {
  Check,
  Info,
  LoaderCircle,
  Plus,
  SlidersHorizontal,
  UserPlus,
  X,
} from "lucide-react";
import type {
  AcademyBranch,
  AcademyMember,
  AcademyRoleDefinition,
  PermissionDetail,
} from "@/lib/apiClient";
import {
  isBranchRole,
  roleLabel,
  type NewMemberForm,
} from "@/pages/AcademyRolesTypes";

export function AddMemberModal({
  isOpen,
  onClose,
  newMember,
  setNewMember,
  onSubmit,
  roles,
  branches,
  saving,
}: {
  isOpen: boolean;
  onClose: () => void;
  newMember: NewMemberForm;
  setNewMember: React.Dispatch<React.SetStateAction<NewMemberForm>>;
  onSubmit: (event: React.FormEvent) => void;
  roles: AcademyRoleDefinition[];
  branches: AcademyBranch[];
  saving: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="academy-add-overlay">
      <form className="academy-add-modal" onSubmit={onSubmit}>
        <header>
          <div>
            <span>
              <UserPlus size={18} />
            </span>
            <h2>إضافة عضو جديد للفريق</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <p>سيتمكن الموظف أو المدرب من الدخول برقم هاتفه وكلمة المرور فور الحفظ.</p>

        <label>
          الاسم الكامل
          <input
            required
            value={newMember.fullName}
            onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
            placeholder="مثال: أحمد مصطفى"
          />
        </label>

        <label>
          البريد الإلكتروني
          <input
            dir="ltr"
            type="email"
            required
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            placeholder="user@example.com"
          />
        </label>

        <label>
          رقم الهاتف
          <input
            dir="ltr"
            type="tel"
            required
            value={newMember.phone}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
            placeholder="010XXXXXXXX"
          />
        </label>

        <label>
          كلمة المرور المؤقتة
          <input
            dir="ltr"
            type="password"
            minLength={8}
            required
            value={newMember.password}
            onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
            placeholder="8 أحرف أو أرقام على الأقل"
          />
        </label>

        <label>
          الدور الوظيفي
          <select
            value={newMember.roleCode}
            onChange={(e) => setNewMember({ ...newMember, roleCode: e.target.value })}
          >
            {roles
              .filter((r) => r.assignableByAcademyOwner)
              .map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} ({r.code})
                </option>
              ))}
          </select>
        </label>

        {isBranchRole(roles, newMember.roleCode) && (
          <label>
            الفرع التابع له
            <select
              required
              value={newMember.branchId}
              onChange={(e) => setNewMember({ ...newMember, branchId: e.target.value })}
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

        <footer>
          <button type="button" onClick={onClose}>
            إلغاء
          </button>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}
            إضافة العضو وتفعيل الحساب
          </button>
        </footer>
      </form>
    </div>
  );
}

export function CustomizeMemberModal({
  member,
  onClose,
  roles,
  categorizedPermissions,
  memberDraftPermissions,
  onTogglePermission,
  onSave,
  saving,
}: {
  member: AcademyMember | null;
  onClose: () => void;
  roles: AcademyRoleDefinition[];
  categorizedPermissions: { category: string; items: PermissionDetail[] }[];
  memberDraftPermissions: string[];
  onTogglePermission: (permCode: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!member) return null;

  return (
    <div className="academy-add-overlay">
      <div className="academy-member-perm-modal">
        <header>
          <div>
            <span>
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h2>تخصيص صلاحيات: {member.name}</h2>
              <small>
                الدور الحالي: {roleLabel(roles, member.roleCode)} · {member.email}
              </small>
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="modal-scroll-content">
          <div className="modal-info-alert">
            <Info size={16} />
            <span>
              هذه الصلاحيات ستكون خاصة بهذا المستخدم فقط، وستتجاوز الصلاحيات الافتراضية لدوره.
            </span>
          </div>

          <div className="matrix-categories-grid">
            {categorizedPermissions.map(({ category, items }) => {
              return (
                <div key={category} className="category-matrix-card">
                  <header className="category-card-header">
                    <h4>{category}</h4>
                    <small>
                      {items.filter((i) => memberDraftPermissions.includes(i.code)).length} من{" "}
                      {items.length}
                    </small>
                  </header>

                  <div className="permission-items-list">
                    {items.map((perm) => {
                      const checked = memberDraftPermissions.includes(perm.code);
                      return (
                        <label
                          key={perm.code}
                          className={`permission-item-row ${checked ? "checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onTogglePermission(perm.code)}
                          />
                          <div className="perm-item-copy">
                            <div className="perm-label-code">
                              <strong>{perm.label}</strong>
                              <code>{perm.code}</code>
                            </div>
                            <small>{perm.description}</small>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer>
          <button type="button" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="primary"
            type="button"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
            حفظ الصلاحيات الفردية
          </button>
        </footer>
      </div>
    </div>
  );
}

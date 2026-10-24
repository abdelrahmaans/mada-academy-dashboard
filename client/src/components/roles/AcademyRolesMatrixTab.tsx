import React from "react";
import { Check, LoaderCircle, RotateCcw } from "lucide-react";
import type {
  AcademyRoleDefinition,
  PermissionDetail,
} from "@/lib/apiClient";

export function AcademyRolesMatrixTab({
  roles,
  selectedRoleCode,
  setSelectedRoleCode,
  roleDrafts,
  activeRoleDefinition,
  hasRoleChanges,
  saving,
  categorizedPermissions,
  onToggleRolePermission,
  onToggleCategoryPermissions,
  onSaveRolePermissions,
  onResetRolePermissions,
}: {
  roles: AcademyRoleDefinition[];
  selectedRoleCode: string;
  setSelectedRoleCode: (code: string) => void;
  roleDrafts: Record<string, string[]>;
  activeRoleDefinition?: AcademyRoleDefinition;
  hasRoleChanges: boolean;
  saving: boolean;
  categorizedPermissions: { category: string; items: PermissionDetail[] }[];
  onToggleRolePermission: (permCode: string) => void;
  onToggleCategoryPermissions: (items: PermissionDetail[]) => void;
  onSaveRolePermissions: () => void;
  onResetRolePermissions: () => void;
}) {
  return (
    <div className="academy-matrix-layout">
      {/* Role Selector Cards Row */}
      <div className="role-selector-ribbon">
        {roles
          .filter((r) => r.assignableByAcademyOwner)
          .map((role) => {
            const isSelected = selectedRoleCode === role.code;
            const draftCount = (roleDrafts[role.code] ?? role.permissions).length;
            return (
              <button
                type="button"
                key={role.code}
                className={`role-ribbon-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedRoleCode(role.code)}
              >
                <div className="ribbon-card-header">
                  <strong>{role.label}</strong>
                  {role.isCustomized ? (
                    <span className="custom-badge">مخصص</span>
                  ) : (
                    <span className="default-badge">افتراضي</span>
                  )}
                </div>
                <small>{role.scopeLevel === "BRANCH" ? "نطاق فرع" : "نطاق أكاديمية"}</small>
                <div className="ribbon-card-footer">
                  <span>{draftCount} صلاحية نشطة</span>
                </div>
              </button>
            );
          })}
      </div>

      {/* Active Role Control Bar */}
      {activeRoleDefinition && (
        <div className="role-matrix-banner">
          <div className="banner-info">
            <h3>
              تخصيص صلاحيات دور: <span>{activeRoleDefinition.label}</span>
            </h3>
            <p>{activeRoleDefinition.description}</p>
          </div>

          <div className="banner-actions">
            {activeRoleDefinition.isCustomized && (
              <button
                type="button"
                className="btn-outline-reset"
                onClick={onResetRolePermissions}
                disabled={saving}
              >
                <RotateCcw size={14} /> استعادة الافتراضي للنظام
              </button>
            )}
            <button
              type="button"
              className={`btn-primary-save ${hasRoleChanges ? "highlight" : ""}`}
              onClick={onSaveRolePermissions}
              disabled={saving || !hasRoleChanges}
            >
              {saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
              {hasRoleChanges ? "حفظ التعديلات على الدور" : "الصلاحيات محفوظة"}
            </button>
          </div>
        </div>
      )}

      {/* Categorized Permissions Checkbox Grid */}
      <div className="matrix-categories-grid">
        {categorizedPermissions.map(({ category, items }) => {
          const currentDraft = roleDrafts[selectedRoleCode] ?? [];
          const selectedCount = items.filter((i) => currentDraft.includes(i.code)).length;
          const allSelected = selectedCount === items.length;

          return (
            <div key={category} className="category-matrix-card">
              <header className="category-card-header">
                <div>
                  <h4>{category}</h4>
                  <small>
                    {selectedCount} من {items.length} مفعلة
                  </small>
                </div>
                <button
                  type="button"
                  className="category-toggle-all"
                  onClick={() => onToggleCategoryPermissions(items)}
                >
                  {allSelected ? "إلغاء التحديد" : "تحديد الكل"}
                </button>
              </header>

              <div className="permission-items-list">
                {items.map((perm) => {
                  const checked = currentDraft.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      className={`permission-item-row ${checked ? "checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleRolePermission(perm.code)}
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
  );
}

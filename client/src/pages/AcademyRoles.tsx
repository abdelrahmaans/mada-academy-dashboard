import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type AcademyBranch,
  type AcademyMember,
  type AcademyRoleDefinition,
  type PermissionDetail,
} from "@/lib/apiClient";
import "./AcademyRoles.css";
import {
  Metric,
  isBranchRole,
  type NewMemberForm,
  type RoleTab,
} from "./AcademyRolesTypes";
import {
  AddMemberModal,
  CustomizeMemberModal,
} from "@/components/roles/AcademyRolesModals";
import { AcademyRolesMembersTab } from "@/components/roles/AcademyRolesMembersTab";
import { AcademyRolesMatrixTab } from "@/components/roles/AcademyRolesMatrixTab";

export default function AcademyRoles() {
  const { me } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RoleTab>("members");

  const [roles, setRoles] = useState<AcademyRoleDefinition[]>([]);
  const [permissionDetails, setPermissionDetails] = useState<PermissionDetail[]>([]);
  const [branches, setBranches] = useState<AcademyBranch[]>([]);
  const [members, setMembers] = useState<AcademyMember[]>([]);

  // Selection state
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("R02_BRANCH_MANAGER");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Search & Filter state
  const [memberSearch, setMemberSearch] = useState("");
  const [memberBranchFilter, setMemberBranchFilter] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  // Draft permissions state for Role Matrix
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string[]>>({});

  // Individual member custom permissions modal
  const [customizingMember, setCustomizingMember] = useState<AcademyMember | null>(null);
  const [memberDraftPermissions, setMemberDraftPermissions] = useState<string[]>([]);

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newMember, setNewMember] = useState<NewMemberForm>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleCode: "R04_INSTRUCTOR",
    branchId: "",
  });

  const loadData = useCallback(async (notifySuccess = false) => {
    setLoading(true);
    setError(null);
    try {
      const [roleRes, memberRes, branchRes] = await Promise.allSettled([
        apiClient.academyRoles(),
        apiClient.academyMembers(),
        apiClient.academyBranches(),
      ]);

      if (roleRes.status === "rejected" || memberRes.status === "rejected") {
        throw new Error("تعذر تحميل الصلاحيات أو أعضاء الأكاديمية.");
      }

      setRoles(roleRes.value.roles);
      if (roleRes.value.permissionDetails) {
        setPermissionDetails(roleRes.value.permissionDetails);
      }
      setMembers(memberRes.value.items);

      // Initialize drafts for assignable roles
      const initialDrafts: Record<string, string[]> = {};
      for (const r of roleRes.value.roles) {
        initialDrafts[r.code] = [...r.permissions];
      }
      setRoleDrafts(initialDrafts);

      if (branchRes.status === "fulfilled") {
        const activeBranches = branchRes.value.items.filter((b) => b.status === "ACTIVE");
        setBranches(activeBranches);
        if (activeBranches[0]) {
          setNewMember((prev) => (!prev.branchId ? { ...prev, branchId: activeBranches[0].id } : prev));
        }
      }

      if (notifySuccess) toast.success("تم تحديث البيانات بنجاح");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر تحميل البيانات.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const query = memberSearch.trim().toLowerCase();
      const matchSearch =
        !query ||
        (member.name?.toLowerCase().includes(query) ?? false) ||
        member.email.toLowerCase().includes(query) ||
        member.phone.includes(query);

      const matchBranch = !memberBranchFilter || member.branch?.id === memberBranchFilter;
      const matchStatus =
        memberStatusFilter === "ALL" || member.membershipStatus === memberStatusFilter;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [members, memberSearch, memberBranchFilter, memberStatusFilter]);

  const selectedMemberRecord = useMemo(
    () => members.find((m) => m.membershipId === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const activeRoleDefinition = useMemo(
    () => roles.find((r) => r.code === selectedRoleCode) ?? roles[0],
    [roles, selectedRoleCode]
  );

  // Group permission details by category
  const categorizedPermissions = useMemo(() => {
    const map = new Map<string, PermissionDetail[]>();
    for (const item of permissionDetails) {
      const cat = item.category || "عام";
      const existing = map.get(cat);
      if (existing) {
        existing.push(item);
      } else {
        map.set(cat, [item]);
      }
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [permissionDetails]);

  // Check if role draft has pending changes
  const hasRoleChanges = useMemo(() => {
    if (!activeRoleDefinition) return false;
    const currentDraft = roleDrafts[selectedRoleCode] ?? [];
    const saved = activeRoleDefinition.permissions ?? [];
    if (currentDraft.length !== saved.length) return true;
    const currentSet = new Set(currentDraft);
    return saved.some((p) => !currentSet.has(p));
  }, [roleDrafts, selectedRoleCode, activeRoleDefinition]);

  // Toggle permission in role draft
  const toggleRolePermission = (permCode: string) => {
    if (!activeRoleDefinition?.assignableByAcademyOwner) return;
    setRoleDrafts((prev) => {
      const current = prev[selectedRoleCode] ?? [];
      const next = current.includes(permCode)
        ? current.filter((p) => p !== permCode)
        : [...current, permCode];
      return { ...prev, [selectedRoleCode]: next };
    });
  };

  // Toggle all permissions in a category for current role
  const toggleCategoryPermissions = (items: PermissionDetail[]) => {
    if (!activeRoleDefinition?.assignableByAcademyOwner) return;
    const itemCodes = items.map((i) => i.code);
    const current = roleDrafts[selectedRoleCode] ?? [];
    const allSelected = itemCodes.every((c) => current.includes(c));

    setRoleDrafts((prev) => {
      let next: string[];
      if (allSelected) {
        next = current.filter((p) => !itemCodes.includes(p));
      } else {
        next = Array.from(new Set([...current, ...itemCodes]));
      }
      return { ...prev, [selectedRoleCode]: next };
    });
  };

  // Save role permissions
  const saveRolePermissions = async () => {
    if (!activeRoleDefinition) return;
    const draft = roleDrafts[selectedRoleCode] ?? [];
    setSaving(true);
    try {
      const res = await apiClient.updateRolePermissions(selectedRoleCode, draft);
      setRoles((prev) =>
        prev.map((r) =>
          r.code === selectedRoleCode
            ? { ...r, permissions: res.permissions, isCustomized: res.isCustomized }
            : r
        )
      );
      // Also update members with this role that don't have custom individual overrides
      setMembers((prev) =>
        prev.map((m) =>
          m.roleCode === selectedRoleCode && !m.hasCustomPermissions
            ? { ...m, effectivePermissions: res.permissions }
            : m
        )
      );
      toast.success(`تم حفظ صلاحيات دور "${activeRoleDefinition.label}" بنجاح`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ صلاحيات الدور.");
    } finally {
      setSaving(false);
    }
  };

  // Reset role permissions
  const resetRolePermissions = async () => {
    if (!activeRoleDefinition) return;
    setSaving(true);
    try {
      const res = await apiClient.resetRolePermissions(selectedRoleCode);
      setRoles((prev) =>
        prev.map((r) =>
          r.code === selectedRoleCode
            ? { ...r, permissions: res.permissions, isCustomized: false }
            : r
        )
      );
      setRoleDrafts((prev) => ({ ...prev, [selectedRoleCode]: [...res.permissions] }));
      setMembers((prev) =>
        prev.map((m) =>
          m.roleCode === selectedRoleCode && !m.hasCustomPermissions
            ? { ...m, effectivePermissions: res.permissions }
            : m
        )
      );
      toast.success(`تمت استعادة الصلاحيات القياسية لدور "${activeRoleDefinition.label}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر استعادة صلاحيات الدور.");
    } finally {
      setSaving(false);
    }
  };

  // Open member customization modal
  const openMemberCustomization = (member: AcademyMember) => {
    setCustomizingMember(member);
    const initial =
      member.customPermissions && member.customPermissions.length > 0
        ? [...member.customPermissions]
        : [...(member.effectivePermissions ?? roles.find((r) => r.code === member.roleCode)?.permissions ?? [])];
    setMemberDraftPermissions(initial);
  };

  // Toggle permission for individual member
  const toggleMemberPermission = (permCode: string) => {
    setMemberDraftPermissions((prev) =>
      prev.includes(permCode) ? prev.filter((p) => p !== permCode) : [...prev, permCode]
    );
  };

  // Save individual member permissions
  const saveMemberPermissions = async () => {
    if (!customizingMember) return;
    setSaving(true);
    try {
      const res = await apiClient.updateMemberPermissions(
        customizingMember.membershipId,
        memberDraftPermissions
      );
      setMembers((prev) =>
        prev.map((m) =>
          m.membershipId === customizingMember.membershipId
            ? {
                ...m,
                customPermissions: res.customPermissions,
                effectivePermissions: res.effectivePermissions,
                hasCustomPermissions: true,
              }
            : m
        )
      );
      setCustomizingMember(null);
      toast.success(`تم تخصيص الصلاحيات الفردية للمستخدم ${customizingMember.name ?? ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ الصلاحيات المخصصة.");
    } finally {
      setSaving(false);
    }
  };

  // Reset individual member permissions
  const resetMemberPermissions = async (member: AcademyMember) => {
    setSaving(true);
    try {
      const res = await apiClient.resetMemberPermissions(member.membershipId);
      setMembers((prev) =>
        prev.map((m) =>
          m.membershipId === member.membershipId
            ? {
                ...m,
                customPermissions: null,
                effectivePermissions: res.effectivePermissions,
                hasCustomPermissions: false,
              }
            : m
        )
      );
      if (customizingMember?.membershipId === member.membershipId) {
        setCustomizingMember(null);
      }
      toast.success(`تمت استعادة صلاحيات الدور الافتراضية للمستخدم ${member.name ?? ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر استعادة صلاحيات العضو.");
    } finally {
      setSaving(false);
    }
  };

  // Change member role
  const changeRole = async (member: AcademyMember, roleCode: string) => {
    const branchId = isBranchRole(roles, roleCode)
      ? member.branch?.id ?? branches[0]?.id
      : undefined;
    if (isBranchRole(roles, roleCode) && !branchId) {
      toast.error("لا يوجد فرع متاح لهذا الدور.");
      return;
    }
    setSaving(true);
    try {
      await apiClient.changeAcademyMemberRole(member.membershipId, { roleCode, branchId });
      const targetRole = roles.find((r) => r.code === roleCode);
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === member.membershipId
            ? {
                ...item,
                roleCode,
                scopeLevel: targetRole?.scopeLevel ?? item.scopeLevel,
                effectivePermissions: targetRole?.permissions ?? item.effectivePermissions,
                branch: branchId ? branches.find((b) => b.id === branchId) ?? item.branch : null,
              }
            : item
        )
      );
      toast.success("تم تحديث الدور والنطاق");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تحديث الدور.");
    } finally {
      setSaving(false);
    }
  };

  // Change member branch
  const changeMemberBranch = async (member: AcademyMember, branchId: string) => {
    setSaving(true);
    try {
      await apiClient.changeAcademyMemberRole(member.membershipId, {
        roleCode: member.roleCode,
        branchId,
      });
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === member.membershipId
            ? { ...item, branch: branches.find((b) => b.id === branchId) ?? item.branch }
            : item
        )
      );
      toast.success("تم نقل المستخدم إلى الفرع");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تغيير فرع المستخدم.");
    } finally {
      setSaving(false);
    }
  };

  // Change member status (active / suspended) with immediate session revocation
  const changeStatus = async (member: AcademyMember) => {
    const status = member.membershipStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setSaving(true);
    try {
      await apiClient.changeAcademyMemberStatus(member.membershipId, status);
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === member.membershipId
            ? { ...item, membershipStatus: status, userStatus: status }
            : item
        )
      );
      toast.success(
        status === "ACTIVE"
          ? "تم تفعيل حساب العضو بنجاح"
          : "تم إيقاف العضو وسحب صلاحيات الدخول فورًا"
      );
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر تحديث حالة العضو.");
    } finally {
      setSaving(false);
    }
  };

  // Add new member
  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !newMember.fullName ||
      !newMember.email ||
      !newMember.phone ||
      (isBranchRole(roles, newMember.roleCode) && !newMember.branchId)
    ) {
      toast.error("أكمل بيانات العضو والفرع المطلوب.");
      return;
    }
    if (!newMember.password || newMember.password.trim().length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    setSaving(true);
    try {
      const created = await apiClient.addAcademyMember({
        ...newMember,
        branchId: newMember.branchId || undefined,
      });
      setMembers((current) => [created, ...current]);
      setNewMember({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        roleCode: "R04_INSTRUCTOR",
        branchId: branches[0]?.id ?? "",
      });
      setShowAddModal(false);
      toast.success("تمت إضافة العضو وتفعيل حسابه");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "تعذر إضافة العضو.");
    } finally {
      setSaving(false);
    }
  };

  const activeMembersCount = useMemo(
    () => members.filter((m) => m.membershipStatus === "ACTIVE").length,
    [members]
  );

  return (
    <RoleDashboardShell
      className="app-shell academy-roles-shell"
      roleCode="R01"
      roleLabel="مسؤول الأكاديمية"
      scopeLevel="tenant"
      scopeLabel="كل فروع الأكاديمية"
      tenantName={me?.academy?.name ?? "الأكاديمية"}
      demo={false}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel academy-roles-page" dir="rtl">
        <RoleSurfaceTopbar onMenu={() => setMobileNavOpen(true)} scopeLabel="كل فروع الأكاديمية" />

        <div className="workspace academy-roles-content">
          <PageHeader
            className="academy-roles-header"
            eyebrow={<span><i /> GOVERNANCE · الحوكمة والصلاحيات</span>}
            title="إدارة المستخدمين ومصفوفة الصلاحيات"
            description="تحكم كامل في أعضاء الأكاديمية وفروعهم، مع محرك ديناميكي لتخصيص صلاحيات الأدوار أو الأفراد بدقة وأمان."
            actions={
              <div className="academy-header-actions">
                <button
                  type="button"
                  className="academy-roles-add-button"
                  onClick={() => setShowAddModal(true)}
                >
                  <UserPlus size={16} /> إضافة مستخدم
                </button>
              </div>
            }
          />

          <div className="academy-roles-scope">
            <ShieldCheck size={16} />
            <span>
              <strong>نطاق الأكاديمية:</strong> {me?.academy?.name ?? "الأكاديمية"} · جميع الفروع المعتمدة · لا يمكن منح صلاحية مسؤول المنصة R00 أو إقفال حساب المالك.
            </span>
          </div>

          {error && (
            <div className="academy-roles-error">
              <span>{error}</span>
              <button type="button" onClick={() => void loadData(true)}>إعادة المحاولة</button>
            </div>
          )}

          {loading ? (
            <div className="academy-roles-loading">
              <LoaderCircle className="spin" size={24} />
              <span>جارٍ تحميل أعضاء الأكاديمية ومصفوفة الصلاحيات…</span>
            </div>
          ) : (
            <>
              {/* Metrics Header */}
              <section className="academy-roles-metrics">
                <Metric icon={<Users size={18} />} label="إجمالي الفريق" value={members.length} />
                <Metric icon={<CheckCircle2 size={18} />} label="حسابات نشطة" value={activeMembersCount} />
                <Metric
                  icon={<KeyRound size={18} />}
                  label="أدوار قابلة للتخصيص"
                  value={roles.filter((r) => r.assignableByAcademyOwner).length}
                />
                <Metric icon={<Building2 size={18} />} label="الفروع الفعالة" value={branches.length} />
              </section>

              {/* Navigation Tabs */}
              <div className="academy-roles-tabs">
                <button
                  type="button"
                  className={`academy-tab-btn ${activeTab === "members" ? "active" : ""}`}
                  onClick={() => setActiveTab("members")}
                >
                  <Users size={16} />
                  <span>فريق العمل والتخصيص الفردي</span>
                  <span className="tab-badge">{members.length}</span>
                </button>
                <button
                  type="button"
                  className={`academy-tab-btn ${activeTab === "matrix" ? "active" : ""}`}
                  onClick={() => setActiveTab("matrix")}
                >
                  <SlidersHorizontal size={16} />
                  <span>مصفوفة صلاحيات الأدوار</span>
                  <span className="tab-badge secondary">ديناميكي</span>
                </button>
              </div>

              {/* TAB 1: MEMBERS MANAGEMENT */}
              {activeTab === "members" && (
                <AcademyRolesMembersTab
                  filteredMembers={filteredMembers}
                  members={members}
                  roles={roles}
                  branches={branches}
                  selectedMemberId={selectedMemberId}
                  selectedMemberRecord={selectedMemberRecord}
                  memberSearch={memberSearch}
                  setMemberSearch={setMemberSearch}
                  memberBranchFilter={memberBranchFilter}
                  setMemberBranchFilter={setMemberBranchFilter}
                  memberStatusFilter={memberStatusFilter}
                  setMemberStatusFilter={setMemberStatusFilter}
                  onSelectMember={(id, roleCode) => {
                    setSelectedMemberId(id);
                    setSelectedRoleCode(roleCode);
                  }}
                  onChangeRole={changeRole}
                  onChangeMemberBranch={changeMemberBranch}
                  onOpenCustomization={openMemberCustomization}
                  onResetMemberPermissions={resetMemberPermissions}
                  onChangeStatus={changeStatus}
                  saving={saving}
                  currentUserId={me?.id}
                />
              )}

              {/* TAB 2: ROLE PERMISSIONS MATRIX */}
              {activeTab === "matrix" && (
                <AcademyRolesMatrixTab
                  roles={roles}
                  selectedRoleCode={selectedRoleCode}
                  setSelectedRoleCode={setSelectedRoleCode}
                  roleDrafts={roleDrafts}
                  activeRoleDefinition={activeRoleDefinition}
                  hasRoleChanges={hasRoleChanges}
                  saving={saving}
                  categorizedPermissions={categorizedPermissions}
                  onToggleRolePermission={toggleRolePermission}
                  onToggleCategoryPermissions={toggleCategoryPermissions}
                  onSaveRolePermissions={() => void saveRolePermissions()}
                  onResetRolePermissions={() => void resetRolePermissions()}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL 1: ADD NEW MEMBER */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        newMember={newMember}
        setNewMember={setNewMember}
        onSubmit={addMember}
        roles={roles}
        branches={branches}
        saving={saving}
      />

      {/* MODAL 2: CUSTOMIZE INDIVIDUAL MEMBER PERMISSIONS */}
      <CustomizeMemberModal
        member={customizingMember}
        onClose={() => setCustomizingMember(null)}
        roles={roles}
        categorizedPermissions={categorizedPermissions}
        memberDraftPermissions={memberDraftPermissions}
        onTogglePermission={toggleMemberPermission}
        onSave={() => void saveMemberPermissions()}
        saving={saving}
      />
    </RoleDashboardShell>
  );
}

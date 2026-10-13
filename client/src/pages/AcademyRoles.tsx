import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Filter,
  Info,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import R01AcademySidebar from "@/components/R01AcademySidebar";
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

const roleLabel = (roles: AcademyRoleDefinition[], code: string) =>
  roles.find((role) => role.code === code)?.label ?? code;

const isBranchRole = (roles: AcademyRoleDefinition[], code: string) =>
  roles.find((role) => role.code === code)?.scopeLevel === "BRANCH";

export default function AcademyRoles() {
  const { me } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "matrix">("members");

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

  const [newMember, setNewMember] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    roleCode: "R04_INSTRUCTOR",
    branchId: "",
  });

  const loadData = async (notifySuccess = false) => {
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
        if (!newMember.branchId && activeBranches[0]) {
          setNewMember((prev) => ({ ...prev, branchId: activeBranches[0].id }));
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
  };

  useEffect(() => {
    void loadData();
  }, []);

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
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
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
      toast.success(`تمت استعادة الصلاحيات الافتراضية لدور "${activeRoleDefinition.label}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر استعادة الافتراضي.");
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
      showSessionLogout={false}
      roleCode="R01"
      roleLabel="مسؤول الأكاديمية"
      scopeLevel="tenant"
      scopeLabel="كل فروع الأكاديمية"
      tenantName={me?.academy?.name ?? "الأكاديمية"}
      demo={false}
    >
      <R01AcademySidebar
        activePath="/academy/roles"
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

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
              <button onClick={() => void loadData(true)}>إعادة المحاولة</button>
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
                  className={`academy-tab-btn ${activeTab === "members" ? "active" : ""}`}
                  onClick={() => setActiveTab("members")}
                >
                  <Users size={16} />
                  <span>فريق العمل والتخصيص الفردي</span>
                  <span className="tab-badge">{members.length}</span>
                </button>
                <button
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
                          <button className="clear-btn" onClick={() => setMemberSearch("")}>
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
                            className={`academy-member ${selectedMemberId === member.membershipId ? "selected" : ""}`}
                            onClick={() => {
                              setSelectedMemberId(member.membershipId);
                              setSelectedRoleCode(member.roleCode);
                            }}
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
                                <bdi dir="ltr">{member.email}</bdi> · {member.branch?.name ?? "نطاق الأكاديمية"}
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
                              onChange={(e) => void changeRole(selectedMemberRecord, e.target.value)}
                              disabled={saving || selectedMemberRecord.userId === me?.id}
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
                                  void changeMemberBranch(selectedMemberRecord, e.target.value)
                                }
                                disabled={saving || selectedMemberRecord.userId === me?.id}
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
                                    لديه مصفوفة صلاحيات مخصصة فرديًا تختلف عن دور {roleLabel(roles, selectedMemberRecord.roleCode)}.
                                  </span>
                                ) : (
                                  <span className="text-muted">
                                    يتبع الصلاحيات القياسية لدور {roleLabel(roles, selectedMemberRecord.roleCode)}.
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="status-actions">
                              {selectedMemberRecord.userId !== me?.id && (
                                <button
                                  className="btn-custom-perm"
                                  onClick={() => openMemberCustomization(selectedMemberRecord)}
                                  disabled={saving}
                                >
                                  <SlidersHorizontal size={14} /> تخصيص فردي
                                </button>
                              )}
                              {selectedMemberRecord.hasCustomPermissions && selectedMemberRecord.userId !== me?.id && (
                                <button
                                  className="btn-reset-member-perm"
                                  onClick={() => void resetMemberPermissions(selectedMemberRecord)}
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
                        {selectedMemberRecord.userId !== me?.id && (
                          <div className="member-danger-zone">
                            <button
                              className={`academy-member-status-button ${
                                selectedMemberRecord.membershipStatus === "ACTIVE"
                                  ? "btn-suspend"
                                  : "btn-activate"
                              }`}
                              onClick={() => void changeStatus(selectedMemberRecord)}
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
              )}

              {/* TAB 2: ROLE PERMISSIONS MATRIX */}
              {activeTab === "matrix" && (
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
                            className="btn-outline-reset"
                            onClick={() => void resetRolePermissions()}
                            disabled={saving}
                          >
                            <RotateCcw size={14} /> استعادة الافتراضي للنظام
                          </button>
                        )}
                        <button
                          className={`btn-primary-save ${hasRoleChanges ? "highlight" : ""}`}
                          onClick={() => void saveRolePermissions()}
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
                              onClick={() => toggleCategoryPermissions(items)}
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
                                    onChange={() => toggleRolePermission(perm.code)}
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
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL 1: ADD NEW MEMBER */}
      {showAddModal && (
        <div className="academy-add-overlay">
          <form className="academy-add-modal" onSubmit={addMember}>
            <header>
              <div>
                <span><UserPlus size={18} /></span>
                <h2>إضافة عضو جديد للفريق</h2>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)}>
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
              <button type="button" onClick={() => setShowAddModal(false)}>
                إلغاء
              </button>
              <button className="primary" type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}
                إضافة العضو وتفعيل الحساب
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* MODAL 2: CUSTOMIZE INDIVIDUAL MEMBER PERMISSIONS */}
      {customizingMember && (
        <div className="academy-add-overlay">
          <div className="academy-member-perm-modal">
            <header>
              <div>
                <span><SlidersHorizontal size={18} /></span>
                <div>
                  <h2>تخصيص صلاحيات: {customizingMember.name}</h2>
                  <small>
                    الدور الحالي: {roleLabel(roles, customizingMember.roleCode)} · {customizingMember.email}
                  </small>
                </div>
              </div>
              <button type="button" onClick={() => setCustomizingMember(null)}>
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
                                onChange={() => toggleMemberPermission(perm.code)}
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
              <button type="button" onClick={() => setCustomizingMember(null)}>
                إلغاء
              </button>
              <button
                className="primary"
                type="button"
                onClick={() => void saveMemberPermissions()}
                disabled={saving}
              >
                {saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
                حفظ الصلاحيات الفردية
              </button>
            </footer>
          </div>
        </div>
      )}
    </RoleDashboardShell>
  );
}

function PanelTitle({
  icon,
  title,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <div className="academy-roles-panel-title">
      <div>
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <small>{note}</small>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="academy-role-metric">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="academy-roles-empty">
      <Users size={22} />
      <span>{text}</span>
    </div>
  );
}

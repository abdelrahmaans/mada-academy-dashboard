import { useEffect, useState, type ReactNode } from "react";
import {
  Award,
  Calendar,
  ChevronLeft,
  CircleAlert,
  Clock,
  Compass,
  Cpu,
  GraduationCap,
  Medal,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import BranchManagerSidebar from "@/components/BranchManagerSidebar";
import R01AcademySidebar from "@/components/R01AcademySidebar";
import { useAuth } from "@/contexts/AuthContext";
import type { RoleCode } from "@/lib/roleNavigation";
import {
  apiClient,
  type AuthMe,
  type CompetitionDetailItem,
  type CompetitionSummaryItem,
  type CompetitionTeamItem,
  type HallOfFameCardItem,
  type StudentRecord,
} from "@/lib/apiClient";
import "./CompetitionsLive.css";

type TabType = "TOURNAMENTS" | "TEAMS" | "HALL_OF_FAME";

export default function CompetitionsLive({ me }: { me?: AuthMe }) {
  const { me: authMe } = useAuth();
  const currentMe = me || authMe;
  const isOwner = Boolean(currentMe?.role?.startsWith("R01"));
  const [activeTab, setActiveTab] = useState<TabType>("TOURNAMENTS");
  const [competitions, setCompetitions] = useState<CompetitionSummaryItem[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [teams, setTeams] = useState<CompetitionTeamItem[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCompModal, setShowCompModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);

  const [activeTeamForMember, setActiveTeamForMember] = useState<CompetitionTeamItem | null>(null);
  const [activeTeamForAward, setActiveTeamForAward] = useState<CompetitionTeamItem | null>(null);

  // Form states
  const [newCompName, setNewCompName] = useState("");
  const [newCompOrganizer, setNewCompOrganizer] = useState("");
  const [newCompTrack, setNewCompTrack] = useState("robotics");
  const [newCompSeason, setNewCompSeason] = useState("2026/2027");
  const [newCompLocation, setNewCompLocation] = useState("");

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamProject, setNewTeamProject] = useState("");

  const [memberStudentId, setMemberStudentId] = useState("");
  const [memberRole, setMemberRole] = useState("LEAD_PROGRAMMER");

  const [awardTitle, setAwardTitle] = useState("");
  const [awardRank, setAwardRank] = useState<number>(1);

  // Students list for member assignment
  const [studentsList, setStudentsList] = useState<Array<{ id: string; fullName: string }>>([]);

  const isBranchManager = currentMe?.role === "R02_BRANCH_MANAGER";
  const isInstructor = currentMe?.role === "R04_INSTRUCTOR" || currentMe?.role === "R03_HEAD_INSTRUCTORS";

  const loadData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const [compsRes, hofRes] = await Promise.all([
        apiClient.competitions(),
        apiClient.hallOfFame()
      ]);

      setCompetitions(compsRes);
      setHallOfFame(hofRes);

      const compId = selectedCompId || (compsRes.length > 0 ? compsRes[0].id : null);
      if (compId) {
        setSelectedCompId(compId);
        const teamsRes = await apiClient.competitionTeams(compId);
        setTeams(teamsRes);
      }

      // Load students for selector
      try {
        const studRes = await apiClient.listStudents();
        setStudentsList((studRes.items || []).map((s: StudentRecord) => ({ id: s.id, fullName: s.fullName })));
      } catch {
        // Fallback
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات البطولات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [selectedCompId]);

  const handleSelectComp = async (id: string) => {
    setSelectedCompId(id);
    try {
      const teamsRes = await apiClient.competitionTeams(id);
      setTeams(teamsRes);
    } catch {
      toast.error("تعذر تحميل فرق هذه البطولة");
    }
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompOrganizer.trim()) {
      toast.error("يرجى ملء اسم البطولة والجهة المنظمة");
      return;
    }
    try {
      await apiClient.createCompetition({
        name: newCompName.trim(),
        organizer: newCompOrganizer.trim(),
        track: newCompTrack,
        season: newCompSeason,
        location: newCompLocation.trim() || undefined
      });
      toast.success("تم إدراج البطولة بنجاح في جدول الأكاديمية!");
      setShowCompModal(false);
      setNewCompName("");
      setNewCompOrganizer("");
      void loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل إنشاء البطولة");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompId) {
      toast.error("يرجى اختيار بطولة أولاً");
      return;
    }
    if (!newTeamName.trim()) {
      toast.error("يرجى إدخال اسم الفريق");
      return;
    }
    try {
      await apiClient.createCompetitionTeam(selectedCompId, {
        name: newTeamName.trim(),
        projectTitle: newTeamProject.trim() || undefined
      });
      toast.success("تم تشكيل الفريق وبدء مرحلة الإعداد!");
      setShowTeamModal(false);
      setNewTeamName("");
      setNewTeamProject("");
      const teamsRes = await apiClient.competitionTeams(selectedCompId);
      setTeams(teamsRes);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل تشكيل الفريق");
    }
  };

  const handleUpdateStatus = async (teamId: string, status: string) => {
    try {
      await apiClient.updateCompetitionTeamStatus(teamId, status);
      toast.success(`تم تحديث حالة الفريق إلى: ${status}`);
      if (selectedCompId) {
        const teamsRes = await apiClient.competitionTeams(selectedCompId);
        setTeams(teamsRes);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "تعذر تحديث حالة الفريق");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForMember) return;
    if (!memberStudentId) {
      toast.error("يرجى اختيار الطالب");
      return;
    }
    try {
      await apiClient.addCompetitionTeamMember(activeTeamForMember.id, {
        studentId: memberStudentId,
        roleInTeam: memberRole
      });
      toast.success("تم تسجيل الطالب في الفريق بنجاح!");
      setShowMemberModal(false);
      setMemberStudentId("");
      if (selectedCompId) {
        const teamsRes = await apiClient.competitionTeams(selectedCompId);
        setTeams(teamsRes);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل إضافة الطالب للفريق");
    }
  };

  const handleRecordAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForAward) return;
    if (!awardTitle.trim()) {
      toast.error("يرجى كتابة عنوان الجائزة");
      return;
    }
    try {
      await apiClient.createCompetitionAward({
        teamId: activeTeamForAward.id,
        title: awardTitle.trim(),
        rank: awardRank,
        isPublishedToHallOfFame: true
      });
      toast.success("مبروك! تم تتويج الفريق وتوثيق الإنجاز في لوحة الشرف!");
      setShowAwardModal(false);
      setAwardTitle("");
      void loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل تسجيل الجائزة");
    }
  };

  const userRoleCode = currentMe?.role ? (currentMe.role.replace(/_.*$/, "") as RoleCode) : (isOwner ? "R01" : "R02");
  const roleLabel = currentMe?.roleLabel ?? (isOwner ? "مسؤول الأكاديمية" : "إدارة الفرع");
  const branchName = currentMe?.branches?.[0]?.name ?? "الفرع الحالي";

  return (
    <RoleDashboardShell
      roleCode={userRoleCode}
      roleLabel={roleLabel}
      scopeLevel={isOwner ? "tenant" : "branch"}
      scopeLabel={branchName}
    >
      <div className="comp-workspace" dir="rtl">
        {/* Topbar */}
        <RoleSurfaceTopbar
          onMenu={() => {}}
          scopeLabel={branchName}
          roleLabel={roleLabel}
        />

        <RoleScopeCard />

        {/* Hero Banner */}
        <div className="comp-hero-banner">
          <div className="comp-hero-text">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Trophy size={20} color="#f59e0b" />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#fcd34d", textTransform: "uppercase" }}>
                مسار التميز والابتكار التنافسي
              </span>
            </div>
            <h1>معسكرات البطولات ولوحة الشرف الذهبية (Hall of Fame)</h1>
            <p>
              ربط مباشر بين تدريب الطلاب على الحقائب المتقدمة (EV3, SPIKE, Arduino, AI) وتجهيز فرق الأكاديمية
              للمنافسة الوطنية والدولية، مع توثيق إنجازات وجوائز أبطال الأكاديمية ونشرها في لوحة الشرف.
            </p>
          </div>
          <div className="comp-hero-actions">
            <button
              type="button"
              className="comp-btn-primary"
              onClick={() => setShowCompModal(true)}
            >
              <Plus size={16} />
              <span>إدراج بطولة جديدة</span>
            </button>
            <button
              type="button"
              className="comp-btn-secondary"
              onClick={() => void loadData()}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="comp-stats-ribbon">
          <div className="comp-stat-card">
            <div className="comp-stat-icon comp-stat-icon-amber">
              <Trophy size={22} />
            </div>
            <div className="comp-stat-meta">
              <span>البطولات المسجلة</span>
              <strong>{competitions.length} بطولة</strong>
            </div>
          </div>
          <div className="comp-stat-card">
            <div className="comp-stat-icon comp-stat-icon-teal">
              <Users size={22} />
            </div>
            <div className="comp-stat-meta">
              <span>الفرق التنافسية</span>
              <strong>{teams.length} فريق</strong>
            </div>
          </div>
          <div className="comp-stat-card">
            <div className="comp-stat-icon comp-stat-icon-blue">
              <Medal size={22} />
            </div>
            <div className="comp-stat-meta">
              <span>أوسمة لوحة الشرف</span>
              <strong>{hallOfFame.length} تكريم</strong>
            </div>
          </div>
          <div className="comp-stat-card">
            <div className="comp-stat-icon comp-stat-icon-purple">
              <Rocket size={22} />
            </div>
            <div className="comp-stat-meta">
              <span>معسكرات التدريب (Bootcamp)</span>
              <strong>{teams.filter(t => t.status === "BOOTCAMP").length} فريق نشط</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="comp-tabs-bar">
          <button
            type="button"
            className={`comp-tab-btn ${activeTab === "TOURNAMENTS" ? "active" : ""}`}
            onClick={() => setActiveTab("TOURNAMENTS")}
          >
            <Compass size={16} />
            <span>البطولات والمسابقات الرسمية</span>
            <span className="comp-tab-pill">{competitions.length}</span>
          </button>
          <button
            type="button"
            className={`comp-tab-btn ${activeTab === "TEAMS" ? "active" : ""}`}
            onClick={() => setActiveTab("TEAMS")}
          >
            <Users size={16} />
            <span>فرق الأكاديمية ومعسكرات التدريب</span>
            <span className="comp-tab-pill">{teams.length}</span>
          </button>
          <button
            type="button"
            className={`comp-tab-btn ${activeTab === "HALL_OF_FAME" ? "active" : ""}`}
            onClick={() => setActiveTab("HALL_OF_FAME")}
          >
            <Sparkles size={16} color="#d97706" />
            <span>لوحة الشرف الذهبية (Hall of Fame)</span>
            <span className="comp-tab-pill">{hallOfFame.length}</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="reports-live-policy reports-live-error" role="alert">
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: TOURNAMENTS */}
        {activeTab === "TOURNAMENTS" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
                  دليل المسابقات والفعاليات
                </h2>
                <small style={{ color: "#64748b" }}>
                  اختر أي بطولة لاستعراض فرقها وإضافة معسكرات التدريب الخاصة بها
                </small>
              </div>
              <button
                type="button"
                className="comp-btn-primary"
                onClick={() => setShowCompModal(true)}
              >
                <Plus size={15} />
                <span>تسجيل بطولة</span>
              </button>
            </div>

            {competitions.length === 0 ? (
              <div className="reports-live-state">
                <Trophy size={36} color="#cbd5e1" />
                <p>لا توجد بطولات مسجلة حاليًا. انقر على "إدراج بطولة جديدة" للبدء.</p>
              </div>
            ) : (
              <div className="comp-cards-grid">
                {competitions.map(c => {
                  const isSelected = c.id === selectedCompId;
                  return (
                    <div
                      key={c.id}
                      className="tournament-card"
                      style={{ cursor: "pointer", borderColor: isSelected ? "#0d9488" : undefined, borderWidth: isSelected ? "2px" : "1px" }}
                      onClick={() => handleSelectComp(c.id)}
                    >
                      <div className={`tournament-track-stripe track-${c.track}`} />
                      <div className="tournament-card-header">
                        <div>
                          <h3>{c.name}</h3>
                          <span className="tournament-organizer">{c.organizer} · الموسم {c.season}</span>
                        </div>
                        <span className={`tournament-track-badge track-${c.track}`}>
                          {c.track === "robotics" ? "روبوتكس" : c.track === "ai" ? "ذكاء اصطناعي" : "برمجة"}
                        </span>
                      </div>

                      <div className="tournament-details-row">
                        <div className="tournament-detail-item">
                          <small>الفئة العمرية</small>
                          <strong>{c.ageMin} - {c.ageMax} سنة</strong>
                        </div>
                        <div className="tournament-detail-item">
                          <small>الفرق المشكلة</small>
                          <strong>{c.teamsCount} فرق</strong>
                        </div>
                        <div className="tournament-detail-item">
                          <small>موعد الفعالية</small>
                          <strong>{c.eventDate ?? "غير محدد"}</strong>
                        </div>
                        <div className="tournament-detail-item">
                          <small>الجوائز الموثقة</small>
                          <strong style={{ color: "#d97706" }}>{c.awardsCount} أوسمة</strong>
                        </div>
                      </div>

                      <div className="tournament-card-footer">
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          المقر: {c.location ?? "محلي / إقليمي"}
                        </span>
                        <button
                          type="button"
                          className="comp-btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px", color: "#0d9488", borderColor: "#99f6e4", background: "#f0fdfa" }}
                          onClick={e => {
                            e.stopPropagation();
                            handleSelectComp(c.id);
                            setActiveTab("TEAMS");
                          }}
                        >
                          <span>عرض الفرق</span>
                          <ChevronLeft size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEAMS & BOOTCAMP TRACKER */}
        {activeTab === "TEAMS" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
                  فرق الأكاديمية المشاركة في: {competitions.find(c => c.id === selectedCompId)?.name ?? "البطولة المحددة"}
                </h2>
                <small style={{ color: "#64748b" }}>
                  متابعة تشكيل الفرق، الأدوار التخصصية لكل طالب، وحالة المعسكر التدريبي المكثف
                </small>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  className="comp-form-select"
                  value={selectedCompId ?? ""}
                  onChange={e => handleSelectComp(e.target.value)}
                >
                  {competitions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="comp-btn-primary"
                  onClick={() => setShowTeamModal(true)}
                >
                  <Plus size={15} />
                  <span>تشكيل فريق جديد</span>
                </button>
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="reports-live-state">
                <Users size={36} color="#cbd5e1" />
                <p>لا توجد فرق مسجلة في هذه البطولة بعد. اضغط "تشكيل فريق جديد" للبدء.</p>
              </div>
            ) : (
              <div className="comp-cards-grid">
                {teams.map(team => (
                  <div key={team.id} className="comp-team-card">
                    <div className="comp-team-header">
                      <div>
                        <h4>{team.name}</h4>
                        <small style={{ color: "#64748b" }}>الفرع: {team.branchName} · المدرب: {team.coachName}</small>
                      </div>
                      <span className={`team-status-badge team-status-${team.status.toLowerCase()}`}>
                        {team.status === "FORMING" ? "قيد التشكيل" :
                         team.status === "BOOTCAMP" ? "معسكر تدريب مكثف ⚡" :
                         team.status === "READY" ? "جاهز للمنافسة ✅" :
                         team.status === "COMPETING" ? "يشارك في البطولة 🚀" :
                         team.status === "AWARDED" ? "متوج بالجوائز 🏆" : team.status}
                      </span>
                    </div>

                    {team.projectTitle && (
                      <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", borderRight: "3px solid #0d9488" }}>
                        <strong style={{ color: "#0f172a" }}>المشروع: </strong>
                        <span style={{ color: "#475569" }}>{team.projectTitle}</span>
                        {team.kitCode && (
                          <div style={{ marginTop: "4px", color: "#64748b", fontSize: "11px" }}>
                            الحقيبة المسندة: <strong>{team.kitCode}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Team Roster */}
                    <div className="team-roster">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                          قائمة أعضاء الفريق ({team.members.length})
                        </span>
                        <button
                          type="button"
                          style={{ border: "none", background: "none", color: "#0d9488", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          onClick={() => {
                            setActiveTeamForMember(team);
                            setShowMemberModal(true);
                          }}
                        >
                          <UserPlus size={13} />
                          <span>إضافة طالب</span>
                        </button>
                      </div>

                      {team.members.length === 0 ? (
                        <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", padding: "8px" }}>
                          لم يتم ضم طلاب للفريق بعد.
                        </div>
                      ) : (
                        team.members.map(m => (
                          <div key={m.id} className="team-member-item">
                            <div className="team-member-info">
                              <GraduationCap size={14} color="#64748b" />
                              <strong style={{ color: "#1e293b" }}>{m.studentName}</strong>
                            </div>
                            <span className={`team-member-role ${
                              m.roleInTeam === "TEAM_CAPTAIN" ? "role-captain" :
                              m.roleInTeam === "LEAD_PROGRAMMER" ? "role-programmer" :
                              m.roleInTeam === "MECHANICAL_BUILDER" ? "role-builder" : "role-researcher"
                            }`}>
                              {m.roleInTeam === "TEAM_CAPTAIN" ? "كابتن الفريق" :
                               m.roleInTeam === "LEAD_PROGRAMMER" ? "مبرمج رئيسي" :
                               m.roleInTeam === "MECHANICAL_BUILDER" ? "بناء وميكانيكا" :
                               m.roleInTeam === "RESEARCHER_PRESENTER" ? "عرض وبحث" : m.roleInTeam}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick actions for team */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {team.status !== "BOOTCAMP" && (
                          <button
                            type="button"
                            className="comp-btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", color: "#b45309", borderColor: "#fde68a", background: "#fffbeb" }}
                            onClick={() => handleUpdateStatus(team.id, "BOOTCAMP")}
                          >
                            <span>بدء المعسكر</span>
                          </button>
                        )}
                        {team.status === "BOOTCAMP" && (
                          <button
                            type="button"
                            className="comp-btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}
                            onClick={() => handleUpdateStatus(team.id, "READY")}
                          >
                            <span>جاهز للمسابقة</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className="comp-btn-primary"
                        style={{ padding: "5px 10px", fontSize: "11px", background: "#f59e0b" }}
                        onClick={() => {
                          setActiveTeamForAward(team);
                          setShowAwardModal(true);
                        }}
                      >
                        <Trophy size={13} />
                        <span>توثيق جائزة</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HALL OF FAME */}
        {activeTab === "HALL_OF_FAME" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: "800", margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={20} color="#d97706" />
                  لوحة الشرف والإنجازات الذهبية (Hall of Fame)
                </h2>
                <small style={{ color: "#64748b" }}>
                  سجل التتويج التاريخي لفرق الأكاديمية في البطولات الرسمية لتعزيز الفخر والتسويق
                </small>
              </div>
            </div>

            {hallOfFame.length === 0 ? (
              <div className="reports-live-state">
                <Trophy size={42} color="#f59e0b" />
                <p>لم تُسجل أي جوائز في لوحة الشرف بعد. عندما يفوز أي فريق يمكنك توثيق الإنجاز من تبويب الفرق.</p>
              </div>
            ) : (
              <div className="hof-cards-grid">
                {hallOfFame.map(award => (
                  <div key={award.id} className="hof-card">
                    <div className="hof-card-glow" />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span className="hof-trophy-badge">
                        {award.rank === 1 ? "🥇 المركز الأول (Champion)" :
                         award.rank === 2 ? "🥈 المركز الثاني" :
                         award.rank === 3 ? "🥉 المركز الثالث" : "🏆 وسام تميز خاص"}
                      </span>
                      <small style={{ color: "#94a3b8", fontSize: "11px" }}>{award.awardDate}</small>
                    </div>

                    <h3 className="hof-award-title">{award.title}</h3>

                    <div className="hof-team-summary">
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#64748b" }}>الفريق:</span>
                        <strong style={{ color: "#0f172a" }}>{award.teamName}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#64748b" }}>البطولة:</span>
                        <span style={{ color: "#334155", fontWeight: "600" }}>{award.competitionName} ({award.organizer})</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#64748b" }}>الفرع والمدرب:</span>
                        <span style={{ color: "#334155" }}>{award.branchName} · كوتش {award.coachName}</span>
                      </div>
                      {award.projectTitle && (
                        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed #e2e8f0", fontSize: "11px", color: "#475569" }}>
                          مشروع الابتكار: <strong>{award.projectTitle}</strong>
                        </div>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>
                        أبطال الفريق المكرمون:
                      </span>
                      <div className="hof-students-tags">
                        {award.studentNames.map((st, idx) => (
                          <span key={idx} className="hof-student-pill">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: CREATE COMPETITION */}
        {showCompModal && (
          <div className="comp-modal-overlay">
            <div className="comp-modal">
              <div className="comp-modal-header">
                <h3>إدراج مسابقة / بطولة رسمية جديدة</h3>
                <button type="button" className="icon-button" onClick={() => setShowCompModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCompetition} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="comp-form-group">
                  <label>اسم البطولة / المسابقة</label>
                  <input
                    type="text"
                    className="comp-form-input"
                    placeholder="مثال: First LEGO League Egypt 2026"
                    value={newCompName}
                    onChange={e => setNewCompName(e.target.value)}
                    required
                  />
                </div>

                <div className="comp-form-group">
                  <label>الجهة المنظمة</label>
                  <input
                    type="text"
                    className="comp-form-input"
                    placeholder="مثال: جمعية مصر للثقافة / IEEE Egypt"
                    value={newCompOrganizer}
                    onChange={e => setNewCompOrganizer(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="comp-form-group">
                    <label>المسار</label>
                    <select
                      className="comp-form-select"
                      value={newCompTrack}
                      onChange={e => setNewCompTrack(e.target.value)}
                    >
                      <option value="robotics">روبوتكس وميكانيكا (Robotics)</option>
                      <option value="ai">ذكاء اصطناعي (AI)</option>
                      <option value="programming">برمجة وهاكاثون (Coding)</option>
                    </select>
                  </div>

                  <div className="comp-form-group">
                    <label>الموسم</label>
                    <input
                      type="text"
                      className="comp-form-input"
                      value={newCompSeason}
                      onChange={e => setNewCompSeason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="comp-form-group">
                  <label>مكان الفعالية</label>
                  <input
                    type="text"
                    className="comp-form-input"
                    placeholder="مثال: الصالة المغطاة - استاد القاهرة الدولي"
                    value={newCompLocation}
                    onChange={e => setNewCompLocation(e.target.value)}
                  />
                </div>

                <div className="comp-modal-actions">
                  <button type="button" className="comp-btn-secondary" style={{ color: "#334155", borderColor: "#cbd5e1" }} onClick={() => setShowCompModal(false)}>
                    إلغاء
                  </button>
                  <button type="submit" className="comp-btn-primary">
                    حفظ وإدراج البطولة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE TEAM */}
        {showTeamModal && (
          <div className="comp-modal-overlay">
            <div className="comp-modal">
              <div className="comp-modal-header">
                <h3>تشكيل فريق وبدء الإعداد</h3>
                <button type="button" className="icon-button" onClick={() => setShowTeamModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="comp-form-group">
                  <label>اسم الفريق التنافسي</label>
                  <input
                    type="text"
                    className="comp-form-input"
                    placeholder="مثال: RoboTitans Dokki / CyberNinjas"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    required
                  />
                </div>

                <div className="comp-form-group">
                  <label>فكرة / عنوان مشروع الابتكار (Innovation Project)</label>
                  <input
                    type="text"
                    className="comp-form-input"
                    placeholder="مثال: روبوت ذاتي القيادة لتنظيف المسطحات المائية"
                    value={newTeamProject}
                    onChange={e => setNewTeamProject(e.target.value)}
                  />
                </div>

                <div className="comp-modal-actions">
                  <button type="button" className="comp-btn-secondary" style={{ color: "#334155", borderColor: "#cbd5e1" }} onClick={() => setShowTeamModal(false)}>
                    إلغاء
                  </button>
                  <button type="submit" className="comp-btn-primary">
                    تشكيل الفريق
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD STUDENT MEMBER */}
        {showMemberModal && activeTeamForMember && (
          <div className="comp-modal-overlay">
            <div className="comp-modal">
              <div className="comp-modal-header">
                <h3>إضافة طالب لفريق: {activeTeamForMember.name}</h3>
                <button type="button" className="icon-button" onClick={() => setShowMemberModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddMember} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="comp-form-group">
                  <label>اختر الطالب</label>
                  <select
                    className="comp-form-select"
                    value={memberStudentId}
                    onChange={e => setMemberStudentId(e.target.value)}
                    required
                  >
                    <option value="">-- اختر من طلاب الأكاديمية --</option>
                    {studentsList.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="comp-form-group">
                  <label>الدور التخصصي في الفريق</label>
                  <select
                    className="comp-form-select"
                    value={memberRole}
                    onChange={e => setMemberRole(e.target.value)}
                  >
                    <option value="TEAM_CAPTAIN">كابتن وقائد الفريق (Team Captain)</option>
                    <option value="LEAD_PROGRAMMER">المبرمج الرئيسي (Lead Programmer)</option>
                    <option value="MECHANICAL_BUILDER">مهندس البناء والميكانيكا (Mechanical Builder)</option>
                    <option value="RESEARCHER_PRESENTER">باحث وعارض المشروع (Researcher & Presenter)</option>
                    <option value="STRATEGIST">مخطط الاستراتيجية والمناورات (Strategist)</option>
                  </select>
                </div>

                <div className="comp-modal-actions">
                  <button type="button" className="comp-btn-secondary" style={{ color: "#334155", borderColor: "#cbd5e1" }} onClick={() => setShowMemberModal(false)}>
                    إلغاء
                  </button>
                  <button type="submit" className="comp-btn-primary">
                    ضم الطالب للفريق
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RECORD AWARD */}
        {showAwardModal && activeTeamForAward && (
          <div className="comp-modal-overlay">
            <div className="comp-modal">
              <div className="comp-modal-header">
                <h3>توثيق جائزة ونشر في لوحة الشرف 🏆</h3>
                <button type="button" className="icon-button" onClick={() => setShowAwardModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRecordAward} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="comp-form-group">
                  <label>الفريق المكرم</label>
                  <input
                    type="text"
                    className="comp-form-input"
                    value={activeTeamForAward.name}
                    disabled
                  />
                </div>

                <div className="comp-form-group">
                  <label>عنوان الجائزة / التكريم</label>
                  <input
                    type="text"
                    className="comp-form-input"
                    placeholder="مثال: المركز الأول جمهورية - أفضل تصميم روبوت وأداء ميكانيكي"
                    value={awardTitle}
                    onChange={e => setAwardTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="comp-form-group">
                  <label>الترتيب التنافسي</label>
                  <select
                    className="comp-form-select"
                    value={awardRank}
                    onChange={e => setAwardRank(Number(e.target.value))}
                  >
                    <option value="1">المركز الأول 🥇 (Champion)</option>
                    <option value="2">المركز الثاني 🥈 (Runner Up)</option>
                    <option value="3">المركز الثالث 🥉</option>
                    <option value="4">جائزة تميز خاصة / أفضل ابتكار 🏆</option>
                  </select>
                </div>

                <div className="comp-modal-actions">
                  <button type="button" className="comp-btn-secondary" style={{ color: "#334155", borderColor: "#cbd5e1" }} onClick={() => setShowAwardModal(false)}>
                    إلغاء
                  </button>
                  <button type="submit" className="comp-btn-primary">
                    نشر وتتويج في لوحة الشرف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleDashboardShell>
  );
}

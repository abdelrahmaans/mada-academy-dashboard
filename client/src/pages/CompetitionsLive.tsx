import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  ChevronLeft,
  CircleAlert,
  Compass,
  GraduationCap,
  Medal,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  X,
  Share2,
  DollarSign,
  Award,
  Calendar,
  Layers,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import RoleSurfaceTopbar from "@/components/RoleSurfaceTopbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiClient,
  type AuthMe,
  type CompetitionSummaryItem,
  type CompetitionTeamItem,
  type HallOfFameCardItem,
  type StudentRecord,
} from "@/lib/apiClient";
import type { RoleCode } from "@/contexts/RoleScopeContext";
import { getRoleDefinition } from "@/lib/roleNavigation";
import "./CompetitionsLive.css";
import {
  CreateCompetitionModal,
  CreateTeamModal,
  AddTeamMemberModal,
  RecordAwardModal,
  CompetitionsSocialCardModal,
} from "@/components/competitions/CompetitionsModals";
import { SubmitProjectArchiveModal } from "@/components/competitions/SubmitProjectArchiveModal";
import { ProjectArchiveTabView } from "@/components/competitions/ProjectArchiveTabView";
import { CompetitionDetailsHubModal } from "@/components/competitions/CompetitionDetailsHubModal";
import { PostCompetitionReviewModal } from "@/components/competitions/PostCompetitionReviewModal";
import { getArchivedProjects } from "@/lib/projectArchiveStorage";

type TabType = "TOURNAMENTS" | "TEAMS" | "HALL_OF_FAME" | "PROJECTS_ARCHIVE";

const ROLE_CODE_BY_ROLE: Record<string, RoleCode> = {
  R01_ACADEMY_OWNER: "R01",
  R02_BRANCH_MANAGER: "R02",
  R03_HEAD_INSTRUCTORS: "R03",
  R04_INSTRUCTOR: "R04",
  R05_SECRETARY: "R05",
};

export default function CompetitionsLive({ me: propMe }: { me?: AuthMe } = {}) {
  const { me: authMe } = useAuth();
  const me = propMe || authMe;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("TOURNAMENTS");
  const [competitions, setCompetitions] = useState<CompetitionSummaryItem[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [teams, setTeams] = useState<CompetitionTeamItem[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameCardItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showCompModal, setShowCompModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [hubComp, setHubComp] = useState<CompetitionSummaryItem | null>(null);
  const [showPostCompModal, setShowPostCompModal] = useState(false);

  const [activeTeamForMember, setActiveTeamForMember] = useState<CompetitionTeamItem | null>(null);
  const [activeTeamForAward, setActiveTeamForAward] = useState<CompetitionTeamItem | null>(null);

  // Form states
  const [newCompName, setNewCompName] = useState("");
  const [newCompOrganizer, setNewCompOrganizer] = useState("");
  const [newCompTrack, setNewCompTrack] = useState("robotics");
  const [newCompSeason, setNewCompSeason] = useState("2026/2027");
  const [newCompLocation, setNewCompLocation] = useState("");
  const [newCompEventDate, setNewCompEventDate] = useState("");
  const [newCompLevel, setNewCompLevel] = useState("NATIONAL");
  const [newCompAgeGroup, setNewCompAgeGroup] = useState("8 - 15 سنة");

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamProject, setNewTeamProject] = useState("");
  const [teamCoachId, setTeamCoachId] = useState("");
  const [teamKitType, setTeamKitType] = useState("SPIKE_PRIME");
  const [teamBootcampDate, setTeamBootcampDate] = useState("");
  const [teamTrainingFee, setTeamTrainingFee] = useState<number>(1500);
  const [teamInstallments, setTeamInstallments] = useState<Array<{ name: string; amount: number; dueDate?: string }>>([
    { name: "دفعة التسجيل الأولى", amount: 750, dueDate: "" },
    { name: "دفعة التصفيات النهائية", amount: 750, dueDate: "" },
  ]);

  const [memberStudentId, setMemberStudentId] = useState("");
  const [memberRole, setMemberRole] = useState("LEAD_PROGRAMMER");

  const [awardTitle, setAwardTitle] = useState("");
  const [awardRank, setAwardRank] = useState<number>(1);
  const [awardKind, setAwardKind] = useState("CHAMPION_1ST");
  const [awardCashPrize, setAwardCashPrize] = useState<number>(0);

  // Social Share Modal
  const [selectedAwardForShare, setSelectedAwardForShare] = useState<HallOfFameCardItem | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);

  // Coaches list
  const [coachesList, setCoachesList] = useState<Array<{ id: string; fullName: string }>>([
    { id: "coach-ahmed", fullName: "كوتش أحمد محمود (مدينة نصر)" },
    { id: "coach-sara", fullName: "كوتش سارة كمال (المعادي)" },
    { id: "coach-youssef", fullName: "كوتش يوسف عماد (الشيخ زايد)" },
  ]);

  // Students list for member assignment
  const [studentsList, setStudentsList] = useState<Array<{ id: string; fullName: string }>>([]);

  const roleCode = ROLE_CODE_BY_ROLE[me?.role ?? ""] ?? (me?.role?.startsWith("R01") ? "R01" : "R02");
  const roleDefinition = getRoleDefinition(roleCode);

  const tenantId = me?.academy?.id || me?.tenantId || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const branchId = me?.branchId || me?.branches?.[0]?.id;
  const branchName = me?.branches?.[0]?.name || "الفرع الرئيسي";

  const [archiveProjectsCount, setArchiveProjectsCount] = useState(() => getArchivedProjects(tenantId, branchId).length);

  const isOwner = me?.role === "R01_ACADEMY_OWNER" || Boolean(me?.role?.startsWith("R01"));
  const isBranchManager = me?.role === "R02_BRANCH_MANAGER";
  const isInstructor = me?.role === "R04_INSTRUCTOR" || me?.role === "R03_HEAD_INSTRUCTORS";

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const localCompKey = `mada_competitions_${tenantId}`;
      const localHofKey = `mada_hof_${tenantId}`;

      let compsRes: CompetitionSummaryItem[] = [];
      try {
        compsRes = await apiClient.competitions();
      } catch {
        compsRes = [];
      }

      // Merge tenant local backup
      try {
        const cached = localStorage.getItem(localCompKey);
        if (cached) {
          const parsed: CompetitionSummaryItem[] = JSON.parse(cached);
          const serverIds = new Set(compsRes.map(c => c.id));
          const extras = parsed.filter(p => !serverIds.has(p.id));
          compsRes = [...extras, ...compsRes];
        }
      } catch {}

      let hofRes: HallOfFameCardItem[] = [];
      try {
        hofRes = await apiClient.hallOfFame();
      } catch {
        hofRes = [];
      }

      try {
        const cachedHof = localStorage.getItem(localHofKey);
        if (cachedHof) {
          const parsedHof: HallOfFameCardItem[] = JSON.parse(cachedHof);
          const serverHofIds = new Set(hofRes.map(h => h.id));
          const extrasHof = parsedHof.filter(p => !serverHofIds.has(p.id));
          hofRes = [...extrasHof, ...hofRes];
        }
      } catch {}

      setCompetitions(compsRes);
      setHallOfFame(hofRes);

      const compId = selectedCompId || (compsRes.length > 0 ? compsRes[0].id : null);
      if (compId) {
        setSelectedCompId(compId);
        let teamsRes: CompetitionTeamItem[] = [];
        try {
          teamsRes = await apiClient.competitionTeams(compId);
        } catch {
          teamsRes = [];
        }
        try {
          const cachedTeams = localStorage.getItem(`mada_teams_${compId}`);
          if (cachedTeams) {
            const parsedTeams: CompetitionTeamItem[] = JSON.parse(cachedTeams);
            const serverTeamIds = new Set(teamsRes.map(t => t.id));
            const extrasTeams = parsedTeams.filter(t => !serverTeamIds.has(t.id));
            teamsRes = [...extrasTeams, ...teamsRes];
          }
        } catch {}
        setTeams(teamsRes);
      } else {
        setTeams([]);
      }

      // Load dynamic coaches from branch team or academy members
      try {
        let coaches: Array<{ id: string; fullName: string }> = [];
        if (branchId) {
          const teamRes = await apiClient.branchTeam(branchId).catch(() => null);
          if (teamRes?.items && teamRes.items.length > 0) {
            coaches = teamRes.items
              .filter(m => ["R03", "R04", "R02"].some(code => m.roleCode.startsWith(code)))
              .map(m => ({
                id: m.userId || m.membershipId,
                fullName: `${m.name} (${m.roleCode.startsWith("R03") ? "رئيس مدربين" : m.roleCode.startsWith("R02") ? "مدير فرع" : "مدرب"})`,
              }));
          }
        }
        if (coaches.length === 0) {
          const membersRes = await apiClient.academyMembers().catch(() => null);
          if (membersRes?.items && membersRes.items.length > 0) {
            coaches = membersRes.items
              .filter(m => ["R03", "R04", "R02"].some(code => m.roleCode.startsWith(code)))
              .map(m => ({
                id: m.userId || m.membershipId,
                fullName: `${m.name} (${m.roleCode.startsWith("R03") ? "رئيس مدربين" : m.roleCode.startsWith("R02") ? "مدير فرع" : "مدرب"})`,
              }));
          }
        }
        if (coaches.length === 0 && me?.user?.displayName) {
          coaches = [{ id: me.user.id || "current-coach", fullName: `${me.user.displayName} (المدرب المعتمد)` }];
        }
        if (coaches.length > 0) {
          setCoachesList(coaches);
          setTeamCoachId(prev => prev || coaches[0].id);
        }
      } catch {}

      // Load real students
      try {
        const studRes = await apiClient.listStudents().catch(() => null);
        if (studRes?.items && studRes.items.length > 0) {
          setStudentsList(studRes.items.map((s: StudentRecord) => ({ id: s.id, fullName: s.fullName })));
        }
      } catch {}

      setArchiveProjectsCount(getArchivedProjects(tenantId, branchId).length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات البطولات");
    } finally {
      setRefreshing(false);
    }
  }, [tenantId, branchId, selectedCompId, me?.user?.displayName, me?.user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
      const created = await apiClient.createCompetition({
        name: newCompName.trim(),
        organizer: newCompOrganizer.trim(),
        track: newCompTrack,
        season: newCompSeason,
        location: newCompLocation.trim() || undefined,
        eventDate: newCompEventDate || undefined,
      });

      // Backup into tenant storage
      try {
        const localCompKey = `mada_competitions_${tenantId}`;
        const current = JSON.parse(localStorage.getItem(localCompKey) || "[]");
        const summaryItem: CompetitionSummaryItem = {
          id: created.id,
          name: created.name,
          organizer: created.organizer,
          season: created.season,
          track: created.track,
          ageMin: created.ageMin,
          ageMax: created.ageMax,
          registrationDeadline: created.registrationDeadline,
          eventDate: created.eventDate,
          location: created.location,
          status: created.status,
          teamsCount: 0,
          awardsCount: 0,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(localCompKey, JSON.stringify([summaryItem, ...current]));
      } catch {}

      toast.success("تم إدراج البطولة بنجاح في جدول الأكاديمية!");
      setShowCompModal(false);
      setNewCompName("");
      setNewCompOrganizer("");
      setNewCompLocation("");
      setNewCompEventDate("");
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
      const selectedCoach = coachesList.find((c) => c.id === teamCoachId);
      const res = await apiClient.createCompetitionTeam(selectedCompId, {
        name: newTeamName.trim(),
        projectTitle: newTeamProject.trim() || undefined,
        coachInstructorId: teamCoachId || undefined,
      });

      const kitDisplay =
        teamKitType === "SPIKE_PRIME"
          ? "LEGO SPIKE Prime 🤖"
          : teamKitType === "EV3"
          ? "LEGO EV3"
          : teamKitType === "ARDUINO_IOT"
          ? "Arduino & IoT ⚡"
          : teamKitType === "RASPBERRY_AI"
          ? "Raspberry Pi & AI 🧠"
          : "برمجيات ومحاكاة 💻";

      const enrichedTeam: CompetitionTeamItem = {
        ...res,
        coachName: selectedCoach
          ? selectedCoach.fullName.replace("كوتش ", "")
          : res.coachName || "كوتش معتمد",
        kitCode: kitDisplay,
        status: "BOOTCAMP",
        trainingFee: teamTrainingFee,
        bootcampStartDate: teamBootcampDate || new Date().toISOString().slice(0, 10),
        installments: teamInstallments,
      };

      // Backup into local storage
      try {
        const teamKey = `mada_teams_${selectedCompId}`;
        const currentTeams = JSON.parse(localStorage.getItem(teamKey) || "[]");
        localStorage.setItem(teamKey, JSON.stringify([enrichedTeam, ...currentTeams.filter((t: any) => t.id !== enrichedTeam.id)]));
      } catch {}

      setTeams((prev) => [enrichedTeam, ...prev.filter((t) => t.id !== res.id)]);
      toast.success("تم تشكيل الفريق واعتماد معسكر التدريب المكثف (Bootcamp) بنجاح!");
      setShowTeamModal(false);
      setNewTeamName("");
      setNewTeamProject("");
      setTeamBootcampDate("");
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
        roleInTeam: memberRole,
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
        isPublishedToHallOfFame: true,
      });

      const currentComp = competitions.find((c) => c.id === selectedCompId);
      const newAwardCard: HallOfFameCardItem = {
        id: `award-${Date.now()}`,
        title: awardTitle.trim(),
        rank: awardRank,
        awardKind,
        cashPrize: awardCashPrize > 0 ? awardCashPrize : undefined,
        awardDate: new Date().toISOString().slice(0, 10),
        competitionName: currentComp?.name ?? "بطولة رسمية",
        organizer: currentComp?.organizer ?? "الاتحاد المصري للروبوتات",
        season: currentComp?.season ?? "2026/2027",
        track: currentComp?.track ?? "robotics",
        teamName: activeTeamForAward.name,
        projectTitle: activeTeamForAward.projectTitle,
        coachName: activeTeamForAward.coachName,
        branchName: activeTeamForAward.branchName || "فرع الأكاديمية",
        studentNames:
          activeTeamForAward.members && activeTeamForAward.members.length > 0
            ? activeTeamForAward.members.map((m) => m.studentName)
            : ["عمر طارق حسام", "يوسف حسام علي", "مريم حسام الدين"],
        certificateUrl: null,
        photosJson: null,
      };

      // Backup into local storage for Hall of Fame
      try {
        const localHofKey = `mada_hof_${tenantId}`;
        const currentHof = JSON.parse(localStorage.getItem(localHofKey) || "[]");
        localStorage.setItem(localHofKey, JSON.stringify([newAwardCard, ...currentHof]));
      } catch {}

      setHallOfFame((prev) => [newAwardCard, ...prev]);
      toast.success("مبروك! تم تتويج الفريق وتوثيق الإنجاز في لوحة الشرف 🏆");
      setShowAwardModal(false);
      setAwardTitle("");
      setAwardCashPrize(0);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "فشل تسجيل الجائزة");
    }
  };

  return (
    <RoleDashboardShell
      className="app-shell comp-live-shell"
      roleCode={roleCode}
      roleLabel={me?.roleLabel ?? roleDefinition.label}
      scopeLevel={roleDefinition.scopeLevel}
      scopeLabel={me?.scopeLevel === "tenant" ? roleDefinition.defaultScopeLabel : (me?.branches?.[0]?.name ?? roleDefinition.defaultScopeLabel)}
      tenantName={me?.academy?.name}
      branchName={me?.branches?.[0]?.name}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
      demo={false}
    >
      <main className="main-panel comp-main-panel" dir="rtl">
        {/* Topbar */}
        <RoleSurfaceTopbar
          roleLabel={me?.roleLabel ?? roleDefinition.label}
          scopeLabel={me?.scopeLevel === "tenant" ? roleDefinition.defaultScopeLabel : (me?.branches?.[0]?.name ?? roleDefinition.defaultScopeLabel)}
          onMenu={() => setMobileNavOpen(true)}
        />

        <div className="workspace comp-workspace">
          <div className="comp-scope-container">
            <RoleScopeCard compact />
          </div>

        {/* Header Section */}
        <header className="comp-page-header">
          <div className="comp-header-content">
            <div className="comp-header-eyebrow">
              <Trophy size={14} />
              <span>المسار التنافسي والبطولات · تجهيز وتأهيل الفرق للمسابقات</span>
            </div>
            <h1 className="comp-header-title">البطولات ومشاريع الفرق</h1>
            <p className="comp-header-description">
              دليل المسابقات والفعاليات الرسمية، تشكيل فرق الأكاديمية وإدارة معسكرات التدريب (Bootcamp)، وتوثيق الإنجازات في لوحة الشرف وأرشيف المشاريع.
            </p>
          </div>
          <div className="comp-header-actions">
            <button
              type="button"
              className="comp-header-btn-refresh"
              onClick={() => void loadData()}
              disabled={refreshing}
              title="تحديث البيانات"
            >
              <RefreshCw size={14} className={refreshing ? "spin" : ""} />
              <span>تحديث البيانات</span>
            </button>
            <button
              type="button"
              className="comp-header-btn-secondary"
              onClick={() => setShowProjectModal(true)}
            >
              <Archive size={15} />
              <span>توثيق مشروع للأرشيف</span>
            </button>
            <button
              type="button"
              className="comp-header-btn-primary"
              onClick={() => setShowCompModal(true)}
            >
              <Plus size={16} />
              <span>+ إدراج بطولة جديدة</span>
            </button>
          </div>
        </header>

        {/* Stats Ribbon */}
        <div className="comp-stats-ribbon">
          <div className="comp-stat-card">
            <div className="comp-stat-meta">
              <span>البطولات المعتمدة</span>
              <strong>{competitions.length} بطولة</strong>
            </div>
            <div className="comp-stat-icon comp-stat-icon-amber">
              <Trophy size={20} />
            </div>
          </div>
          <div className="comp-stat-card">
            <div className="comp-stat-meta">
              <span>الفرق التنافسية</span>
              <strong>{teams.length} فريق</strong>
            </div>
            <div className="comp-stat-icon comp-stat-icon-teal">
              <Users size={20} />
            </div>
          </div>
          <div className="comp-stat-card">
            <div className="comp-stat-meta">
              <span>معسكرات التدريب (Bootcamp)</span>
              <strong>{teams.filter(t => t.status === "BOOTCAMP").length} فريق نشط</strong>
            </div>
            <div className="comp-stat-icon comp-stat-icon-purple">
              <Rocket size={20} />
            </div>
          </div>
          <div className="comp-stat-card">
            <div className="comp-stat-meta">
              <span>أوسمة لوحة الشرف</span>
              <strong>{hallOfFame.length} تكريم</strong>
            </div>
            <div className="comp-stat-icon comp-stat-icon-blue">
              <Medal size={20} />
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
            <Compass size={15} />
            <span>دليل البطولات</span>
            <span className="comp-tab-pill">{competitions.length}</span>
          </button>
          <button
            type="button"
            className={`comp-tab-btn ${activeTab === "TEAMS" ? "active" : ""}`}
            onClick={() => setActiveTab("TEAMS")}
          >
            <Users size={15} />
            <span>فرق ومعسكرات الأكاديمية</span>
            <span className="comp-tab-pill">{teams.length}</span>
          </button>
          <button
            type="button"
            className={`comp-tab-btn ${activeTab === "HALL_OF_FAME" ? "active" : ""}`}
            onClick={() => setActiveTab("HALL_OF_FAME")}
          >
            <Sparkles size={15} color="#d97706" />
            <span>لوحة الشرف الذهبية</span>
            <span className="comp-tab-pill">{hallOfFame.length}</span>
          </button>
          <button
            type="button"
            className={`comp-tab-btn ${activeTab === "PROJECTS_ARCHIVE" ? "active" : ""}`}
            onClick={() => setActiveTab("PROJECTS_ARCHIVE")}
          >
            <Archive size={15} color="#0f766e" />
            <span>أرشيف المشاريع (Drive)</span>
            <span className="comp-tab-pill">{archiveProjectsCount}</span>
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
            <div className="comp-section-header">
              <div className="comp-section-info">
                <h2>دليل المسابقات والفعاليات الرسمية</h2>
                <small>اختر أي بطولة لاستعراض فرقها وإدارة معسكرات التدريب الخاصة بها</small>
              </div>
              <span className="comp-section-badge">
                {competitions.length} بطولات مدرجة
              </span>
            </div>

            {competitions.length === 0 ? (
              <div className="comp-empty-state">
                <div className="comp-empty-icon amber">
                  <Trophy size={32} />
                </div>
                <h3>لا توجد بطولات أو مسابقات مسجلة حاليًا</h3>
                <p>
                  ابدأ بإدراج بطولات أو فعاليات تنافسية معتمدة لربط فرق الأكاديمية ومعسكرات التدريب وتوثيق الإنجازات.
                </p>
                <button
                  type="button"
                  className="comp-empty-action"
                  onClick={() => setShowCompModal(true)}
                >
                  <Plus size={16} />
                  <span>إدراج بطولة جديدة الآن</span>
                </button>
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
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="comp-btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "11px", color: "#b45309", borderColor: "#fde68a", background: "#fffbeb" }}
                            onClick={e => {
                              e.stopPropagation();
                              handleSelectComp(c.id);
                              setHubComp(c);
                            }}
                            title="عرض تفاصيل البطولة والفرق وهاب النتائج"
                          >
                            <span>هاب البطولة</span>
                          </button>
                          <button
                            type="button"
                            className="comp-btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "11px", color: "#0d9488", borderColor: "#99f6e4", background: "#f0fdfa" }}
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
            {/* Enhanced Toolbar */}
            <div className="comp-teams-toolbar">
              <div className="comp-teams-toolbar-info">
                <h2>
                  فرق الأكاديمية ومعسكرات التدريب (Bootcamp) ·{" "}
                  {competitions.find((c) => c.id === selectedCompId)?.name ?? "البطولة المحددة"}
                </h2>
                <p>
                  إدارة الفرق التنافسية، الحقائب التدريبية (Kits)، أقساط ورسوم المعسكر، واعتماد
                  الجاهزية والمشاركة الرسمية
                </p>
              </div>

              <div className="comp-teams-toolbar-actions">
                <label className="comp-select-label">
                  <span>البطولة:</span>
                  <select
                    className="comp-form-select"
                    value={selectedCompId ?? ""}
                    onChange={(e) => handleSelectComp(e.target.value)}
                    style={{ minWidth: "220px" }}
                  >
                    {competitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="comp-btn-secondary"
                  style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => setShowPostCompModal(true)}
                  title="توثيق نتائج ومراكز ما بعد المسابقة والتحليل الفني"
                >
                  <Trophy size={15} />
                  <span>نتائج وتحليل ما بعد المسابقة 🏆</span>
                </button>

                <button
                  type="button"
                  className="comp-btn-primary"
                  onClick={() => setShowTeamModal(true)}
                >
                  <Plus size={16} />
                  <span>تشكيل فريق ومعسكر جديد</span>
                </button>
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="comp-empty-state">
                <div className="comp-empty-icon">
                  <Users size={32} />
                </div>
                <h3>لا توجد فرق مسجلة في هذه البطولة بعد</h3>
                <p>
                  اضغط على زر "تشكيل فريق ومعسكر جديد" لتحديد اسم الفريق، المشروع، المدرب، والحقيبة
                  المستخدمة.
                </p>
                <button
                  type="button"
                  className="comp-empty-action"
                  onClick={() => setShowTeamModal(true)}
                >
                  <Plus size={16} />
                  <span>بدء تشكيل الفريق الآن</span>
                </button>
              </div>
            ) : (
              <div className="comp-cards-grid">
                {teams.map(team => (
                  <div key={team.id} className="comp-team-card">
                    <div className="comp-team-header">
                      <div>
                        <h4>{team.name}</h4>
                        <small style={{ color: "#64748b" }}>الفرع: {team.branchName || "الفرع الرئيسي"} · المدرب: كوتش {team.coachName}</small>
                      </div>
                      <span className={`team-status-badge team-status-${team.status.toLowerCase()}`}>
                        {team.status === "FORMING" ? "قيد التشكيل" :
                         team.status === "BOOTCAMP" ? "معسكر تدريب مكثف ⚡" :
                         team.status === "READY" ? "جاهز للمنافسة ✅" :
                         team.status === "COMPETING" ? "يشارك في البطولة 🚀" :
                         team.status === "AWARDED" ? "متوج بالجوائز 🏆" : team.status}
                      </span>
                    </div>

                    {/* Bootcamp Strip: Kit, Fee, Sync */}
                    <div className="comp-team-bootcamp-strip">
                      <span className="comp-badge-kit">
                        <Cpu size={12} /> {team.kitCode || "LEGO SPIKE Prime 🤖"}
                      </span>
                      <span className="comp-badge-fee">
                        <DollarSign size={12} /> رسوم المعسكر: {(team.trainingFee ?? 1500).toLocaleString()} ج.م
                      </span>
                      <span className="comp-badge-sync">
                        <Award size={12} /> معسكر مسابقة 🏆 (مربوط بالأكاديمية)
                      </span>
                    </div>

                    {team.projectTitle && (
                      <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", borderRight: "3px solid #0d9488" }}>
                        <strong style={{ color: "#0f172a" }}>فكرة المشروع: </strong>
                        <span style={{ color: "#475569" }}>{team.projectTitle}</span>
                      </div>
                    )}

                    {/* Team Roster */}
                    <div className="team-roster">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                          أعضاء الفريق المتدربون ({team.members.length})
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
                          لم يتم ضم طلاب بعد؛ اضغط "إضافة طالب" لضم أعضاء الفريق وتوزيع أدوارهم.
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
                            <span>بدء المعسكر ⚡</span>
                          </button>
                        )}
                        {team.status === "BOOTCAMP" && (
                          <button
                            type="button"
                            className="comp-btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", color: "#15803d", borderColor: "#bbf7d0", background: "#f0fdf4" }}
                            onClick={() => handleUpdateStatus(team.id, "READY")}
                          >
                            <span>اعتماد الجاهزية ✅</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className="comp-btn-primary"
                        style={{ padding: "5px 12px", fontSize: "11px", background: "#f59e0b" }}
                        onClick={() => {
                          setActiveTeamForAward(team);
                          setShowAwardModal(true);
                        }}
                      >
                        <Trophy size={13} />
                        <span>توثيق جائزة وتتويج</span>
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
            <div className="comp-section-header">
              <div className="comp-section-info">
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={20} color="#d97706" />
                  <span>لوحة الشرف والإنجازات الذهبية (Hall of Fame)</span>
                </h2>
                <small>
                  سجل التتويج التاريخي لفرق الأكاديمية والجوائز التخصصية للمشاركة والتسويق وفخر الأهالي
                </small>
              </div>
              <span className="comp-section-badge comp-section-badge-gold">
                {hallOfFame.length} تكريم موثق
              </span>
            </div>

            {hallOfFame.length === 0 ? (
              <div className="comp-empty-state">
                <div className="comp-empty-icon amber">
                  <Sparkles size={32} />
                </div>
                <h3>لوحة الشرف الذهبية خالية حتى الآن</h3>
                <p>
                  لم تُسجل أي جوائز أو أوسمة تتويج بعد. عندما يفوز أي فريق يمكنك توثيق المركز والجائزة وتكريم الطلاب هنا.
                </p>
                <button
                  type="button"
                  className="comp-empty-action"
                  style={{ background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" }}
                  onClick={() => {
                    if (teams.length > 0) {
                      setActiveTeamForAward(teams[0]);
                      setShowAwardModal(true);
                    } else {
                      setActiveTab("TEAMS");
                    }
                  }}
                >
                  <Trophy size={16} />
                  <span>{teams.length > 0 ? "توثيق تكريم جديد" : "الانتقال لتشكيل الفرق أولاً"}</span>
                </button>
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
                      {award.cashPrize && award.cashPrize > 0 && (
                        <div style={{ marginTop: "6px" }}>
                          <span className="hof-cash-prize">
                            <DollarSign size={12} /> قيمة الجائزة المالية: {award.cashPrize.toLocaleString()} ج.م
                          </span>
                        </div>
                      )}
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

                    {/* Social Media Share Button */}
                    <button
                      type="button"
                      className="hof-share-btn"
                      onClick={() => {
                        setSelectedAwardForShare(award);
                        setShowSocialModal(true);
                      }}
                    >
                      <Share2 size={14} />
                      <span>مشاركة الإنجاز / كارت السوشيال ميديا 📸</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROJECTS ARCHIVE */}
        {activeTab === "PROJECTS_ARCHIVE" && (
          <ProjectArchiveTabView
            onOpenSubmitModal={() => setShowProjectModal(true)}
            canSubmit={true}
            tenantId={tenantId}
            branchId={branchId}
          />
        )}

        {/* MODALS */}
        <CreateCompetitionModal
          isOpen={showCompModal}
          onClose={() => setShowCompModal(false)}
          name={newCompName}
          setName={setNewCompName}
          organizer={newCompOrganizer}
          setOrganizer={setNewCompOrganizer}
          track={newCompTrack}
          setTrack={setNewCompTrack}
          season={newCompSeason}
          setSeason={setNewCompSeason}
          location={newCompLocation}
          setLocation={setNewCompLocation}
          eventDate={newCompEventDate}
          setEventDate={setNewCompEventDate}
          level={newCompLevel}
          setLevel={setNewCompLevel}
          ageGroup={newCompAgeGroup}
          setAgeGroup={setNewCompAgeGroup}
          onSubmit={handleCreateCompetition}
        />

        <CreateTeamModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          name={newTeamName}
          setName={setNewTeamName}
          project={newTeamProject}
          setProject={setNewTeamProject}
          coachId={teamCoachId}
          setCoachId={setTeamCoachId}
          kitType={teamKitType}
          setKitType={setTeamKitType}
          bootcampDate={teamBootcampDate}
          setBootcampDate={setTeamBootcampDate}
          trainingFee={teamTrainingFee}
          setTrainingFee={setTeamTrainingFee}
          installments={teamInstallments}
          setInstallments={setTeamInstallments}
          coachesList={coachesList}
          onSubmit={handleCreateTeam}
        />

        <AddTeamMemberModal
          isOpen={showMemberModal}
          team={activeTeamForMember}
          onClose={() => setShowMemberModal(false)}
          studentId={memberStudentId}
          setStudentId={setMemberStudentId}
          role={memberRole}
          setRole={setMemberRole}
          studentsList={studentsList}
          onSubmit={handleAddMember}
        />

        <RecordAwardModal
          isOpen={showAwardModal}
          team={activeTeamForAward}
          onClose={() => setShowAwardModal(false)}
          title={awardTitle}
          setTitle={setAwardTitle}
          rank={awardRank}
          setRank={setAwardRank}
          awardKind={awardKind}
          setAwardKind={setAwardKind}
          cashPrize={awardCashPrize}
          setCashPrize={setAwardCashPrize}
          onSubmit={handleRecordAward}
        />

        <CompetitionsSocialCardModal
          isOpen={showSocialModal}
          award={selectedAwardForShare}
          onClose={() => setShowSocialModal(false)}
        />

        <SubmitProjectArchiveModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onSuccess={() => {
            setArchiveProjectsCount(getArchivedProjects(tenantId, branchId).length);
          }}
          tenantId={tenantId}
          defaultBranchName={branchName}
          defaultBranchId={branchId || "branch-main"}
          defaultCoachName={me?.user?.displayName || "كوتش الأكاديمية"}
          defaultCoachRole={roleDefinition.label}
          competitionsList={competitions.map((c) => ({ id: c.id, name: c.name }))}
          availableStudents={studentsList}
        />

        <CompetitionDetailsHubModal
          isOpen={Boolean(hubComp)}
          competition={hubComp}
          teams={teams}
          onClose={() => setHubComp(null)}
          onCreateTeam={() => setShowTeamModal(true)}
          onPostCompetitionReview={() => setShowPostCompModal(true)}
          onArchiveProject={() => setShowProjectModal(true)}
        />

        <PostCompetitionReviewModal
          isOpen={showPostCompModal}
          competition={competitions.find((c) => c.id === selectedCompId) || competitions[0] || null}
          teams={teams}
          onClose={() => setShowPostCompModal(false)}
          onSuccess={() => {
            setArchiveProjectsCount(getArchivedProjects().length);
            void loadData();
          }}
        />
        </div>
      </main>
    </RoleDashboardShell>
  );
}

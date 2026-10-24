import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Clock3,
  MapPin,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  apiClient,
  type SchedulingClassroom,
  type SchedulingInstructor,
  type SessionRecord,
} from "@/lib/apiClient";
import {
  ScheduleCalendar,
  ScheduleDetailsDialog,
  ScheduleFormDialog,
} from "@/components/ScheduleViews";
import { getRoleDefinition, type RoleCode } from "@/lib/roleNavigation";

import {
  type SessionStatus,
  type SessionType,
  type Session,
  type SessionTemplate,
  type SessionForm,
  type ScheduleDay,
  type ScheduleFilterTab,
  sessionFromApi,
  DAY_NAMES,
  BRANCHES,
  INSTRUCTORS,
  ROOMS,
  BASE_DATE,
  FIRST_HOUR,
  LAST_HOUR,
  HOUR_HEIGHT,
  TEMPLATES,
  STATUS_LABELS,
  TYPE_LABELS,
  toISODate,
  fromISODate,
  addDays,
  formatDate,
  minutesFromTime,
  timeLabel,
  seededSessions,
} from "./ScheduleTypes";

export type {
  SessionStatus,
  SessionType,
  Session,
  SessionTemplate,
  SessionForm,
  ScheduleDay,
  ScheduleFilterTab,
};

export {
  sessionFromApi,
  DAY_NAMES,
  BRANCHES,
  INSTRUCTORS,
  ROOMS,
  BASE_DATE,
  FIRST_HOUR,
  LAST_HOUR,
  HOUR_HEIGHT,
  TEMPLATES,
  STATUS_LABELS,
  TYPE_LABELS,
  toISODate,
  fromISODate,
  addDays,
  formatDate,
  minutesFromTime,
  timeLabel,
  seededSessions,
};


function SchedulePage() {
  const [, navigate] = useLocation();
  const { me } = useAuth();
  const [liveMode, setLiveMode] = useState(() => apiClient.hasSession());
  const [loading, setLoading] = useState(() => apiClient.hasSession());
  const [sessions, setSessions] = useState<Session[]>(() => apiClient.hasSession() ? [] : seededSessions());
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("كل الفروع");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [view, setView] = useState<"week" | "day">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 780px)").matches
      ? "day"
      : "week"
  );
  const [statusFilter, setStatusFilter] = useState<"all" | SessionStatus>(
    "all"
  );
  const [instructorFilter, setInstructorFilter] = useState("الكل");
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsSession, setDetailsSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [liveClassrooms, setLiveClassrooms] = useState<SchedulingClassroom[]>(
    []
  );
  const [liveInstructors, setLiveInstructors] = useState<
    SchedulingInstructor[]
  >([]);
  const [form, setForm] = useState<SessionForm>(() => ({
    date: toISODate(BASE_DATE),
    startTime: "16:00",
    duration: 90,
    title: "",
    level: "المستوى التمهيدي",
    instructor: INSTRUCTORS[0],
    room: ROOMS[0],
    branch: BRANCHES[0],
    type: "regular",
  }));
  useEffect(() => {
    if (!apiClient.hasSession()) {
      setLiveMode(false);
      setLoading(false);
      setSessions(seededSessions());
      return;
    }
    setLiveMode(true);
    setLoading(true);
    setLoadError(null);
    Promise.allSettled([
      apiClient.listSessions(),
      apiClient.schedulingClassrooms(),
      apiClient.schedulingInstructors(),
    ]).then(([sessionResult, classroomResult, instructorResult]) => {
      if (sessionResult.status === "rejected") {
        setLiveClassrooms([]);
        setLiveInstructors([]);
        setSessions([]);
        const cause = sessionResult.reason;
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "تعذر تحميل جلسات الجدول من الخادم."
        );
        return;
      }

      setSessions(sessionResult.value.items.map(sessionFromApi));
      const classrooms =
        classroomResult.status === "fulfilled"
          ? classroomResult.value.items
          : [];
      const instructors =
        instructorResult.status === "fulfilled"
          ? instructorResult.value.items
          : [];
      setLiveClassrooms(classrooms);
      setLiveInstructors(instructors);

      const optionalFailure = [classroomResult, instructorResult].find(
        result => result.status === "rejected"
      );
      if (optionalFailure?.status === "rejected") {
        setLoadError(
          "تم تحميل جلسات الجدول؛ بعض بيانات إنشاء الجلسة غير متاحة لصلاحيات الحساب الحالية."
        );
      }
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const liveBranches = Array.from(
    new Map(
      liveClassrooms.map(room => [room.branchId, room.branchName])
    ).entries()
  ).map(([id, name]) => ({ id, name }));
  const selectedLiveRooms = liveClassrooms.filter(
    room => room.branchId === form.branchId && room.status === "AVAILABLE"
  );

  const weekStart = useMemo(
    () => addDays(BASE_DATE, weekOffset * 7),
    [weekOffset]
  );
  const days = useMemo(
    () =>
      DAY_NAMES.map((name, index) => {
        const date = addDays(weekStart, index);
        return { name, date, iso: toISODate(date), index };
      }),
    [weekStart]
  );
  const visibleDays = view === "day" ? [days[selectedDay]] : days;
  const normalizedQuery = query.trim().toLocaleLowerCase("ar");
  const weekRecords = sessions.filter(session =>
    days.some(day => day.iso === session.date)
  );
  const matchingSessions = useMemo(
    () =>
      weekRecords.filter(session => {
        const textMatch =
          !normalizedQuery ||
          [
            session.title,
            session.level,
            session.instructor,
            session.room,
            session.branch,
            session.startTime,
          ].some(value =>
            value.toLocaleLowerCase("ar").includes(normalizedQuery)
          );
        const branchMatch = branch === "كل الفروع" || session.branch === branch;
        const instructorMatch =
          instructorFilter === "الكل" ||
          session.instructor === instructorFilter;
        const statusMatch =
          statusFilter === "all" || session.status === statusFilter;
        const dayMatch =
          view !== "day" || session.date === days[selectedDay].iso;
        return (
          textMatch && branchMatch && instructorMatch && statusMatch && dayMatch
        );
      }),
    [
      weekRecords,
      normalizedQuery,
      branch,
      instructorFilter,
      statusFilter,
      view,
      days,
      selectedDay,
    ]
  );
  const instructors = useMemo(
    () => [
      "الكل",
      ...Array.from(new Set(weekRecords.map(session => session.instructor))),
    ],
    [weekRecords]
  );
  const todayCount = sessions.filter(
    session => session.date === days[0].iso
  ).length;
  const weekCount = weekRecords.length;
  const reviewCount = weekRecords.filter(
    session => session.status === "pending_approval"
  ).length;
  const roomCount = new Set(weekRecords.map(session => session.room)).size;

  const shiftSelection = (direction: -1 | 1) => {
    if (view === "week") {
      setWeekOffset(offset => offset + direction);
      return;
    }
    if (selectedDay + direction < 0) {
      setWeekOffset(offset => offset - 1);
      setSelectedDay(6);
    } else if (selectedDay + direction > 6) {
      setWeekOffset(offset => offset + 1);
      setSelectedDay(0);
    } else {
      setSelectedDay(day => day + direction);
    }
  };

  const openAddDialog = () => {
    const date = view === "day" ? days[selectedDay].iso : toISODate(weekStart);
    const defaultRoom =
      liveClassrooms.find(room => room.branchName === branch) ??
      liveClassrooms[0];
    const defaultInstructor = liveInstructors[0];
    setEditingId(null);
    setForm({
      date,
      startTime: "16:00",
      duration: 90,
      title: "",
      level: "المستوى التمهيدي",
      instructor: defaultInstructor?.name ?? INSTRUCTORS[0],
      instructorId: defaultInstructor?.id,
      room: defaultRoom?.name ?? ROOMS[0],
      classroomId: defaultRoom?.id,
      branch:
        defaultRoom?.branchName ??
        (branch === "كل الفروع" ? BRANCHES[0] : branch),
      branchId: defaultRoom?.branchId,
      type: "regular",
    });
    setDialogMode("add");
  };

  const openEditDialog = (session: Session) => {
    if (liveMode) {
      toast.info("تعديل الجلسة من الجدول غير متاح عبر الـAPI الحالي", {
        description: "لن يتم حفظ أي تعديل محلي على جلسة خادمية.",
      });
      return;
    }
    setEditingId(session.id);
    setForm({
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
      title: session.title,
      level: session.level,
      instructor: session.instructor,
      room: session.room,
      branch: session.branch,
      type: session.type,
    });
    setDetailsSession(null);
    setDialogMode("edit");
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingId(null);
  };

  const handleSessionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (liveMode) {
      if (dialogMode === "edit") {
        toast.error("لا يتوفر endpoint لتعديل الجلسة بعد.");
        return;
      }
      const liveRoom = liveClassrooms.find(
        room => room.id === form.classroomId
      );
      const liveInstructor = liveInstructors.find(
        instructor => instructor.id === form.instructorId
      );
      if (!liveRoom || !liveInstructor) {
        toast.error("اختر مدربًا وقاعة متاحة من بيانات الأكاديمية الحية.");
        return;
      }
      const startsAt = new Date(`${form.date}T${form.startTime}:00`);
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + Number(form.duration));
      try {
        const response = await apiClient.createSession({
          branchId: liveRoom.branchId,
          classroomId: liveRoom.id,
          instructorId: liveInstructor.id,
          startAt: startsAt.toISOString(),
          endAt: endsAt.toISOString(),
          sessionNumber: 1,
          type: form.type.toUpperCase(),
          notes: form.title.trim(),
        });
        const created: Session = {
          ...form,
          id: response.sessionId,
          title: form.title.trim(),
          instructor: liveInstructor.name ?? liveInstructor.id,
          room: liveRoom.name,
          branch: liveRoom.branchName,
          branchId: liveRoom.branchId,
          classroomId: liveRoom.id,
          instructorId: liveInstructor.id,
          duration: Number(form.duration),
          enrolled: 0,
          capacity: liveRoom.capacity,
          status: "scheduled",
        };
        setSessions(current => [created, ...current]);
        const chosenDate = fromISODate(form.date);
        setWeekOffset(
          Math.floor(
            (chosenDate.getTime() - BASE_DATE.getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        );
        setSelectedDay((chosenDate.getDay() + 1) % 7);
        toast.success("تم حفظ الجلسة على الخادم", {
          description: `رقم الجلسة: ${response.sessionNumber} · ${response.status}`,
        });
        closeDialog();
      } catch (cause) {
        toast.error("تعذر حفظ الجلسة", {
          description:
            cause instanceof Error ? cause.message : "فشل الاتصال بالخادم.",
        });
      }
      return;
    }
    const start = minutesFromTime(form.startTime);
    const end = start + Number(form.duration);
    const conflict = sessions.find(session => {
      if (
        session.id === editingId ||
        session.date !== form.date ||
        session.status === "cancelled"
      )
        return false;
      const sessionStart = minutesFromTime(session.startTime);
      const sessionEnd = sessionStart + session.duration;
      const overlaps = start < sessionEnd && sessionStart < end;
      return (
        overlaps &&
        ((session.room === form.room && session.branch === form.branch) ||
          session.instructor === form.instructor)
      );
    });
    if (conflict) {
      const resource =
        conflict.room === form.room
          ? `قاعة ${form.room}`
          : `جدول الكوتش ${form.instructor}`;
      toast.error("في تعارض محتمل في الجدول", {
        description: `الحصة تتداخل مع «${conflict.title}» في ${resource}. غيّر الوقت أو المورد قبل الحفظ.`,
      });
      return;
    }
    if (dialogMode === "edit" && editingId) {
      setSessions(current =>
        current.map(session =>
          session.id === editingId
            ? { ...session, ...form, duration: Number(form.duration) }
            : session
        )
      );
      toast.success("اتحدّثت بيانات الحصة", {
        description: "التغيير محفوظ محليًا في العرض التجريبي فقط.",
      });
    } else {
      const created: Session = {
        id: `local-${Date.now()}`,
        ...form,
        duration: Number(form.duration),
        enrolled: 0,
        capacity: 16,
        status: "scheduled",
      };
      setSessions(current => [created, ...current]);
      const targetDay = days.find(day => day.iso === form.date);
      const chosenDate = fromISODate(form.date);
      setWeekOffset(
        Math.floor(
          (chosenDate.getTime() - BASE_DATE.getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )
      );
      setSelectedDay(targetDay?.index ?? (chosenDate.getDay() + 1) % 7);
      toast.success("اتضافت الحصة", {
        description: "اتضافت لبيانات العرض التجريبية، من غير حفظ على خادم.",
      });
    }
    closeDialog();
  };

  const cancelSession = (session: Session) => {
    if (liveMode) {
      toast.info("إلغاء الجلسة غير متاح من هذه الشاشة", {
        description:
          "لا يوجد endpoint إلغاء في الـAPI الحالي؛ لم يتغير سجل الخادم.",
      });
      return;
    }
    setSessions(current =>
      current.map(item =>
        item.id === session.id ? { ...item, status: "cancelled" } : item
      )
    );
    setDetailsSession(null);
    toast.success("اتعلّمت الحصة كملغاة", {
      description: "التغيير محلي للعرض التجريبي فقط.",
    });
  };

  const filteredTabs: { key: "all" | SessionStatus; label: string }[] = [
    { key: "all", label: "كل الحصص" },
    { key: "scheduled", label: "قادمة" },
    { key: "pending_approval", label: "تحتاج مراجعة" },
    { key: "completed", label: "مكتملة" },
    { key: "cancelled", label: "ملغاة" },
  ];

  const userRoleCode = me?.role ? (me.role.replace(/_.*$/, "") as RoleCode) : undefined;
  const roleCode: RoleCode = userRoleCode || "R02";
  const roleDefinition = getRoleDefinition(roleCode);

  return (
    <RoleDashboardShell
      className="app-shell schedule-shell"
      roleCode={roleCode}
      roleLabel={me?.roleLabel || roleDefinition.label}
      scopeLevel={roleDefinition.scopeLevel}
      scopeLabel={roleDefinition.defaultScopeLabel}
      tenantName={me?.academy?.name}
      branchName={me?.branchId ? me.branches?.find(branchItem => branchItem.id === me.branchId)?.name : undefined}
      demo={!liveMode}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button mobile-menu-button"
              aria-label="فتح القائمة"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div className="branch-select-wrap">
              <button
                className={`branch-select ${branchMenuOpen ? "is-open" : ""}`}
                aria-expanded={branchMenuOpen}
                onClick={() => setBranchMenuOpen(open => !open)}
              >
                <span className="branch-icon">
                  <MapPin size={17} />
                </span>
                <span>{branch === "كل الفروع" ? branch : `فرع ${branch}`}</span>
                <ChevronDown size={15} />
              </button>
              {branchMenuOpen && (
                <div className="branch-menu">
                  <button
                    className={branch === "كل الفروع" ? "selected" : ""}
                    onClick={() => {
                      setBranch("كل الفروع");
                      setBranchMenuOpen(false);
                    }}
                  >
                    كل الفروع
                  </button>
                  {(liveMode
                    ? liveBranches.map(item => item.name)
                    : BRANCHES
                  ).map(item => (
                    <button
                      className={branch === item ? "selected" : ""}
                      key={item}
                      onClick={() => {
                        setBranch(item);
                        setBranchMenuOpen(false);
                      }}
                    >
                      <MapPin size={15} />
                      فرع {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="top-search">
              <Search size={18} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="ابحث عن حصة أو كوتش..."
                aria-label="ابحث عن حصة أو كوتش"
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="topbar-left">
            <button
              className="icon-button notification-button"
              aria-label="الإشعارات"
              onClick={() => toast("لا توجد إشعارات جديدة")}
            >
              <Bell size={18} />
            </button>
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => toast("إعدادات الحساب قيد التجهيز")}
            >
              <span className="profile-copy">
                <strong>{me?.user?.displayName?.trim() || "أحمد محمود"}</strong>
                <small>{me?.roleLabel || (liveMode ? "مدير الفرع" : "مدير الفرع")}</small>
              </span>
              <span className="profile-avatar">{me?.user?.displayName ? me.user.displayName.trim().slice(0, 2) : "أم"}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="workspace schedule-workspace">
          <div className="students-breadcrumb">
            <button onClick={() => navigate(roleDefinition.backPath)}>الرئيسية</button>
            <ChevronLeft size={13} />
            <span>الجدول</span>
          </div>
          <section className="students-welcome schedule-welcome">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> تخطيط الحصص والفصول
              </div>
              <h1>الجدول</h1>
              <p>نظّم حصص الأسبوع وتابع الكوتشيز والقاعات من شاشة واحدة.</p>
              <div className="students-demo-note" role="status">
                <strong>
                  {liveMode ? "بيانات حية من الخادم" : "DEMO · بيانات توضيحية"}
                </strong>
                <span>
                  {liveMode
                    ? "الحفظ ينشئ جلسة جديدة على الـAPI؛ التعديل والإلغاء غير متاحين من هذه الشاشة."
                    : "الإضافات والتعديلات محلية للعرض التجريبي فقط."}
                </span>
              </div>
              {loadError && (
                <div className="students-demo-note" role="alert">
                  <strong>تعذر تحميل الجدول</strong>
                  <span>{loadError}</span>
                </div>
              )}
            </div>
            <div className="welcome-actions">
              <button
                className="button button-secondary"
                onClick={() =>
                  toast("التصدير متاح بعد ربط بيانات الجدول الحقيقية")
                }
              >
                <ArrowRightLeft size={16} /> مشاركة العرض
              </button>
              <button className="button button-primary" onClick={openAddDialog}>
                <Plus size={18} /> إضافة حصة
              </button>
            </div>
          </section>

          <section className="schedule-stats" aria-label="ملخص الجدول">
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-teal">
                <CalendarDays size={17} />
              </span>
              <div>
                <small>حصص هذا الأسبوع</small>
                <strong>{loading ? "..." : weekCount}</strong>
              </div>
              <span className="schedule-stat-note">
                في {branch === "كل الفروع" ? "كل الفروع" : branch}
              </span>
            </article>
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-blue">
                <Clock3 size={17} />
              </span>
              <div>
                <small>حصص السبت</small>
                <strong>{loading ? "..." : todayCount}</strong>
              </div>
              <span className="schedule-stat-note">26 سبتمبر</span>
            </article>
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-amber">
                <AlertCircle size={17} />
              </span>
              <div>
                <small>تحتاج مراجعة</small>
                <strong>{loading ? "..." : reviewCount}</strong>
              </div>
              <span className="schedule-stat-note">موافقة مطلوبة</span>
            </article>
            <article className="schedule-stat">
              <span className="schedule-stat-icon icon-violet">
                <MapPin size={17} />
              </span>
              <div>
                <small>قاعات مستخدمة</small>
                <strong>{loading ? "..." : roomCount}</strong>
              </div>
              <span className="schedule-stat-note">هذا الأسبوع</span>
            </article>
          </section>

          <ScheduleCalendar
            weekStart={weekStart}
            days={days}
            visibleDays={visibleDays}
            matchingSessions={matchingSessions}
            filteredTabs={filteredTabs}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            instructors={instructors}
            instructorFilter={instructorFilter}
            setInstructorFilter={setInstructorFilter}
            reviewCount={reviewCount}
            view={view}
            setView={setView}
            selectedDay={selectedDay}
            weekOffset={weekOffset}
            shiftSelection={shiftSelection}
            setWeekOffset={setWeekOffset}
            setSelectedDay={setSelectedDay}
            setDetailsSession={setDetailsSession}
            formatDate={formatDate}
            addDays={addDays}
            minutesFromTime={minutesFromTime}
            timeLabel={timeLabel}
            statusLabels={STATUS_LABELS}
            firstHour={FIRST_HOUR}
            lastHour={LAST_HOUR}
            hourHeight={HOUR_HEIGHT}
          />
          <div className="students-demo-note">
            <AlertCircle size={14} />
            <span>
              بيانات الحصص والكوتشيز والقاعات المعروضة توضيحية ومولّدة للعرض
              فقط؛ لا تتصل بقاعدة بيانات. فحص التعارض داخل النموذج محلي ومبدئي.
            </span>
          </div>
          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>واجهة تجريبية — إصدار 0.1</span>
          </footer>
        </div>
      </main>
      {detailsSession && (
        <ScheduleDetailsDialog
          session={detailsSession}
          onClose={() => setDetailsSession(null)}
          onCancel={cancelSession}
          onEdit={openEditDialog}
          statusLabels={STATUS_LABELS}
          dayNames={DAY_NAMES}
          fromISODate={fromISODate}
          formatDate={formatDate}
          timeLabel={timeLabel}
          typeLabels={TYPE_LABELS}
        />
      )}
      {dialogMode && (
        <ScheduleFormDialog
          dialogMode={dialogMode}
          form={form}
          liveMode={liveMode}
          liveBranches={liveBranches}
          liveInstructors={liveInstructors}
          liveClassrooms={liveClassrooms}
          selectedLiveRooms={selectedLiveRooms}
          branchOptions={BRANCHES}
          instructorOptions={INSTRUCTORS}
          roomOptions={ROOMS}
          typeLabels={TYPE_LABELS}
          setForm={setForm}
          onClose={closeDialog}
          onSubmit={handleSessionSubmit}
        />
      )}
    </RoleDashboardShell>
  );
}

export default SchedulePage;

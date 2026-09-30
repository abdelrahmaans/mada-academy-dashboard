import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, ArrowRight, BookOpen, CalendarCheck, CalendarDays, Check, CheckCircle2, ChevronLeft, CircleHelp, Clock3, GraduationCap, LayoutDashboard, LogOut, MapPin, Menu, MessageCircle, Save, Search, Settings, ShieldCheck, Star, Target, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import RoleScopeCard from "@/components/RoleScopeCard";
import StatusBadge from "@/components/StatusBadge";
import { ErrorState, LoadingState } from "@/components/FeedbackStates";
import { apiClient, type AttendanceResponse, type NotificationRecord, type SessionRecord } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

type DeskView = "today" | "attendance" | "evaluation";
type AttendanceStatus = "unmarked" | "present" | "absent" | "late" | "excused";
type SessionStatus = "live" | "upcoming" | "completed";
type Student = { id: string; name: string; initials: string; age: number; parent: string };
type Session = { id: string; branchId?: string; branchName?: string; title: string; level: string; day: string; time: string; room: string; status: SessionStatus; students: Student[]; startAt?: string; endAt?: string };
type Evaluation = { scores: Record<string, number>; comment: string; saved: boolean };

const STUDENTS: Student[] = [
  { id: "ST-0248", name: "ياسين محمد علي", initials: "يع", age: 11, parent: "محمد علي" },
  { id: "ST-0246", name: "عمر خالد إبراهيم", initials: "عإ", age: 13, parent: "نهى إبراهيم" },
  { id: "ST-0244", name: "آدم شريف حسن", initials: "آح", age: 14, parent: "شريف حسن" },
  { id: "ST-0242", name: "سيف مصطفى عادل", initials: "سع", age: 14, parent: "مصطفى عادل" },
  { id: "ST-0240", name: "ملك حسام الدين", initials: "مح", age: 10, parent: "حسام الدين" },
];
const SESSIONS: Session[] = [
  { id: "SES-401", title: "روبوتكس مستوى 2", level: "المستوى المتوسط · 10–12 سنة", day: "اليوم · السبت 26 سبتمبر", time: "12:00 – 01:30 م", room: "معمل 1", status: "live", students: STUDENTS },
  { id: "SES-402", title: "أساسيات تصميم الروبوت", level: "المستوى المتوسط · 10–12 سنة", day: "اليوم · السبت 26 سبتمبر", time: "03:00 – 04:30 م", room: "معمل الروبوتات", status: "upcoming", students: STUDENTS.slice(0, 4) },
  { id: "SES-403", title: "مشروع الحركة الذكية", level: "المستوى المتوسط · 10–12 سنة", day: "غدًا · الأحد 27 سبتمبر", time: "10:00 – 11:30 ص", room: "معمل 2", status: "upcoming", students: STUDENTS.slice(1) },
  { id: "SES-404", title: "روبوتكس مستوى 2", level: "المستوى المتوسط · 10–12 سنة", day: "أمس · الجمعة 25 سبتمبر", time: "04:00 – 05:30 م", room: "معمل 1", status: "completed", students: STUDENTS.slice(0, 4) },
];
const SESSION_STATUS: Record<SessionStatus, string> = { live: "جارية الآن", upcoming: "قادمة", completed: "مكتملة" };
const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = { unmarked: "لم يسجل", present: "حاضر", absent: "غائب", late: "متأخر", excused: "بعذر" };
const RUBRIC = [{ id: "understanding", label: "استيعاب الفكرة", hint: "المفاهيم والخطوات الأساسية" }, { id: "practice", label: "التطبيق العملي", hint: "تنفيذ المهمة واستخدام الأدوات" }, { id: "collaboration", label: "التعاون والمبادرة", hint: "المشاركة والتعاون مع الزملاء" }];
const INITIAL_ATTENDANCE: Record<string, AttendanceStatus> = { "ST-0248": "present", "ST-0246": "present", "ST-0244": "late", "ST-0242": "unmarked", "ST-0240": "unmarked" };
function formatLiveTime(value: string) { return new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function formatLiveDay(value: string) { return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" }).format(new Date(value)); }
function mapLiveAttendanceStatus(status: string): AttendanceStatus { return status === "PRESENT" ? "present" : status === "LATE" ? "late" : status === "ABSENT" ? "absent" : status === "EXCUSED" ? "excused" : "unmarked"; }
function mapLiveSession(record: SessionRecord, attendance: AttendanceResponse): Session {
  const now = Date.now();
  const start = new Date(record.startAt).getTime();
  const end = new Date(record.endAt).getTime();
  const status: SessionStatus = record.status === "COMPLETED" ? "completed" : start <= now && now <= end ? "live" : "upcoming";
  return {
    id: record.id,
    branchId: record.branchId,
    branchName: record.branchName ?? undefined,
    title: record.courseName || `جلسة ${record.sessionNumber || "تشغيلية"}`,
    level: record.notes || "جلسة مسندة من النظام",
    day: formatLiveDay(record.startAt),
    time: `${formatLiveTime(record.startAt)} – ${formatLiveTime(record.endAt)}`,
    room: record.classroomName || `قاعة ${record.classroomId.slice(0, 8)}`,
    status,
    startAt: record.startAt,
    endAt: record.endAt,
    students: attendance.items.map(item => ({ id: item.studentId, name: item.studentName, initials: item.studentName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join(""), age: 0, parent: "بيانات ولي الأمر غير متاحة للمدرب" })),
  };
}

export default function InstructorDesk() {
  const [, navigate] = useLocation();
  const { me, logout } = useAuth();
  const [view, setView] = useState<DeskView>("today");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessions, setSessions] = useState(SESSIONS);
  const [dataMode, setDataMode] = useState<"demo" | "live">(apiClient.hasSession() ? "live" : "demo");
  const [dataLoading, setDataLoading] = useState(apiClient.hasSession());
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState(SESSIONS[0].id);
  const [selectedStudentId, setSelectedStudentId] = useState(STUDENTS[0].id);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [scores, setScores] = useState<Record<string, number>>({ understanding: 4, practice: 4, collaboration: 4 });
  const [comment, setComment] = useState("");
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [substitutionSessionId, setSubstitutionSessionId] = useState<string | null>(null);
  const [substitutionReason, setSubstitutionReason] = useState("");
  const applyAttendance = (response: AttendanceResponse) => {
    setAttendance(Object.fromEntries(response.items.map(item => [item.studentId, mapLiveAttendanceStatus(item.status)])));
  };
  useEffect(() => {
    if (!apiClient.hasSession()) return;
    let cancelled = false;
    setDataLoading(true);
    setSessions([]);
    apiClient.listSessions()
      .then(async response => {
        const loaded = await Promise.all(response.items.map(async record => {
          try {
            const attendanceResponse = await apiClient.getSessionAttendance(record.id);
            return { session: mapLiveSession(record, attendanceResponse), attendanceResponse };
          } catch {
            const emptyAttendance: AttendanceResponse = { sessionId: record.id, sessionStatus: record.status, items: [], total: 0 };
            return { session: mapLiveSession(record, emptyAttendance), attendanceResponse: emptyAttendance };
          }
        }));
        if (cancelled) return;
        const nextSessions = loaded.map(item => item.session);
        setSessions(nextSessions);
        if (nextSessions.length) {
          setSelectedSessionId(nextSessions[0].id);
          setSelectedStudentId(nextSessions[0].students[0]?.id ?? "");
          applyAttendance(loaded[0].attendanceResponse);
        }
        setDataMode("live");
        setDataError(null);
      })
      .catch(error => {
        if (cancelled) return;
        setSessions([]);
        setDataError(error instanceof Error ? error.message : "تعذر تحميل جلسات المدرب");
      })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    apiClient.listNotifications().then(response => { if (!cancelled) setNotifications(response.items); }).catch(() => { if (!cancelled) setNotifications([]); });
    return () => { cancelled = true; };
  }, []);
  const selectedSession = sessions.find(item => item.id === selectedSessionId) ?? sessions[0] ?? SESSIONS[0];
  const selectedStudent = selectedSession.students.find(item => item.id === selectedStudentId) ?? selectedSession.students[0] ?? STUDENTS[0];
  const visibleStudents = useMemo(() => selectedSession.students.filter(item => !query.trim() || `${item.name} ${item.id}`.toLocaleLowerCase("ar").includes(query.trim().toLocaleLowerCase("ar"))), [query, selectedSession]);
  const attendanceStats = useMemo(() => { const statuses = selectedSession.students.map(item => attendance[item.id] ?? "unmarked"); return { present: statuses.filter(status => status === "present").length, late: statuses.filter(status => status === "late").length, absent: statuses.filter(status => status === "absent" || status === "excused").length, unmarked: statuses.filter(status => status === "unmarked").length }; }, [attendance, selectedSession]);
  const selectedEvaluation = evaluations[`${selectedSession.id}:${selectedStudent.id}`];
  const selectView = (next: DeskView) => { setView(next); setMobileOpen(false); setQuery(""); };
  const selectSession = (id: string) => {
    setSelectedSessionId(id);
    setAttendanceSaved(false);
    setView("attendance");
    setQuery("");
    if (dataMode === "live") void apiClient.getSessionAttendance(id).then(applyAttendance).catch(error => setDataError(error instanceof Error ? error.message : "تعذر تحميل الحضور"));
  };
  const changeAttendance = (studentId: string, status: AttendanceStatus) => { setAttendance(current => ({ ...current, [studentId]: status })); setAttendanceSaved(false); };
  const saveAttendance = async (event: FormEvent) => {
    event.preventDefault();
    if (attendanceStats.unmarked > 0) { toast.error("أكمل تسجيل كل الطلاب", { description: `ما زال ${attendanceStats.unmarked} طالب بدون حالة.` }); return; }
    if (dataMode === "live") {
      try {
        const records = selectedSession.students.map(student => {
          const status = attendance[student.id] ?? "unmarked";
          return { studentId: student.id, status: status === "present" ? "PRESENT" : status === "late" ? "LATE" : status === "absent" ? "ABSENT" : "EXCUSED", lateMinutes: status === "late" ? 1 : null } as const;
        });
        const response = await apiClient.upsertSessionAttendance(selectedSession.id, records);
        applyAttendance(response);
        setAttendanceSaved(true);
        toast.success("تم حفظ الحضور في قاعدة البيانات", { description: "تمت إعادة قراءة الحالة من الـAPI الحقيقي." });
      } catch (error) {
        toast.error("تعذر حفظ الحضور", { description: error instanceof Error ? error.message : "حاول مرة أخرى" });
      }
      return;
    }
    setAttendanceSaved(true);
    toast.success("تم حفظ الحضور للمراجعة", { description: "الحفظ محلي في المعاينة فقط." });
  };
  const chooseStudent = (id: string) => { setSelectedStudentId(id); const saved = evaluations[`${selectedSession.id}:${id}`]; setScores(saved?.scores ?? { understanding: 4, practice: 4, collaboration: 4 }); setComment(saved?.comment ?? ""); };
  const saveEvaluation = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) { toast.error("أضف ملاحظة بنّاءة قبل حفظ التقييم", { description: "اذكر ما أتقنه الطالب والخطوة التالية المقترحة." }); return; }
    const key = `${selectedSession.id}:${selectedStudent.id}`;
    if (dataMode === "live") {
      try {
        const score = Math.round(((scores.understanding ?? 0) + (scores.practice ?? 0) + (scores.collaboration ?? 0)) / 3 * 20);
        const notes = `استيعاب الفكرة: ${scores.understanding ?? 0}/5 · التطبيق العملي: ${scores.practice ?? 0}/5 · التعاون: ${scores.collaboration ?? 0}/5\n${comment.trim()}`;
        await apiClient.saveSessionEvaluations(selectedSession.id, [{ studentId: selectedStudent.id, score, notes }]);
        setEvaluations(current => ({ ...current, [key]: { scores, comment: comment.trim(), saved: true } }));
        toast.success("تم حفظ التقييم على الخادم");
      } catch (error) { toast.error("تعذر حفظ التقييم", { description: error instanceof Error ? error.message : "حاول مرة أخرى" }); }
      return;
    }
    setEvaluations(current => ({ ...current, [key]: { scores, comment: comment.trim(), saved: true } }));
    toast.success("تم حفظ التقييم محليًا في بيانات العرض التجريبي.");
  };
  const submitSubstitutionRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!substitutionReason.trim() || !substitutionSessionId) { toast.error("اكتب سبب طلب البديل أولًا."); return; }
    if (dataMode === "live") {
      try {
        await apiClient.requestSubstitution(substitutionSessionId, substitutionReason.trim());
        setSubstitutionSessionId(null); setSubstitutionReason("");
        toast.success("تم إرسال طلب المدرب البديل للمراجعة.");
      } catch (error) { toast.error("تعذر إرسال طلب البديل", { description: error instanceof Error ? error.message : "حاول مرة أخرى" }); }
      return;
    }
    setSubstitutionSessionId(null); setSubstitutionReason("");
    toast.success("تم تسجيل الطلب في العرض التجريبي فقط.");
  };
  const proposeSelfForSubstitution = async (notification: NotificationRecord) => {
    if (!notification.targetId) return;
    try {
      await apiClient.proposeSubstitute(notification.targetId, "متاح لتغطية هذه الجلسة.");
      await apiClient.markNotificationRead(notification.id);
      setNotifications(current => current.map(item => item.id === notification.id ? { ...item, isRead: true } : item));
      toast.success("تم إرسال عرضك لتغطية الجلسة.");
    } catch (error) { toast.error("تعذر إرسال العرض", { description: error instanceof Error ? error.message : "حاول مرة أخرى" }); }
  };
  return <RoleDashboardShell className="app-shell instructor-desk-shell" roleCode="R04" roleLabel="المدرب" scopeLevel="assigned" scopeLabel="الجلسات والطلاب المسندون" tenantName={me?.academy?.name ?? "أكاديمية مدى"} branchName={selectedSession.branchName ?? "نطاق الجلسات المسندة"}>
    {mobileOpen && <button className="mobile-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}><div className="sidebar-top"><button className="instructor-desk-brand" onClick={() => navigate("/instructor")}><strong>مدى</strong><small>مساحة المدرب · R04</small></button><button className="icon-button sidebar-close" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)}><X size={19} /></button></div><div className="academy-switcher"><span className="academy-avatar"><GraduationCap size={20} /></span><span className="academy-meta"><strong>{me?.academy?.name ?? "أكاديمية مدى"}</strong><small>{me?.user?.displayName ?? "المدرب"} · {selectedSession.branchName ?? "نطاق الجلسات المسندة"}</small></span></div><div className="nav-caption">مساحة الحصة</div><nav className="primary-nav"><button className={`nav-link ${view === "today" ? "active" : ""}`} onClick={() => selectView("today")}><LayoutDashboard size={19} /><span>حصصي اليوم</span></button><button className={`nav-link ${view === "attendance" ? "active" : ""}`} onClick={() => selectView("attendance")}><CalendarCheck size={19} /><span>تسجيل الحضور</span><span className="nav-count">{attendanceStats.unmarked}</span></button><button className={`nav-link ${view === "evaluation" ? "active" : ""}`} onClick={() => selectView("evaluation")}><Star size={19} /><span>التقييمات</span><span className="nav-count">{Object.keys(evaluations).length}</span></button></nav><div className="nav-caption nav-caption-spaced">روابط مساعدة</div><nav className="primary-nav"><button className="nav-link" onClick={() => navigate("/head-instructors")}><Users size={19} /><span>رئيس المدربين</span></button><button className="nav-link" onClick={() => navigate("/schedule")}><CalendarDays size={19} /><span>جدول الفرع</span></button></nav><div className="sidebar-spacer" /><div className="sidebar-help"><span className="help-icon"><CircleHelp size={18} /></span><div><strong>تحتاج دعمًا؟</strong><span>اطلب مساعدة من رئيس المدربين</span></div><ChevronLeft size={16} /></div><div className="sidebar-bottom"><button className="nav-link" onClick={() => toast("الإعدادات قيد التجهيز")}><Settings size={19} /><span>الإعدادات</span></button><button className="nav-link" onClick={() => { void logout().then(() => navigate("/login")); }}><LogOut size={19} /><span>تسجيل الخروج</span></button></div></aside>
    <main className="main-panel"><header className="topbar"><div className="topbar-right"><button className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="branch-select assigned-branch"><span className="branch-icon"><MapPin size={17} /></span><span>جلساتي · {selectedSession.branchName ?? "النطاق المصرح به"}</span></div></div><span className="instructor-desk-scope"><ShieldCheck size={14} /> وصول محدود للجلسات المسندة</span></header><div className="workspace instructor-desk-content"><PageHeader className="welcome-row" copyClassName="welcome-copy" actionsClassName="welcome-actions" eyebrow={<span className="eyebrow"><i className="eyebrow-dot" /> مساحة المدرب · R04</span>} title={VIEW_TITLES[view]} description={VIEW_COPY[view]} actions={<span className="instructor-desk-date"><CalendarDays size={14} /> {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>} /><RoleScopeCard className="instructor-desk-scope-card" />{notifications.filter(item => item.type === "SUBSTITUTION_APPROVAL_REQUIRED" && !item.isRead && item.targetId).map(item => <article className="instructor-desk-banner" key={item.id}><ShieldCheck size={15} /><span><strong>{item.title}:</strong> {item.body}</span><button className="desk-primary-action" onClick={() => void proposeSelfForSubstitution(item)}>أنا متاح للتغطية</button></article>)}<div className="instructor-desk-banner"><ShieldCheck size={15} /><span><strong>نطاقك:</strong> تظهر لك الجلسات والطلاب المسندون إليك فقط. لا يمكنك تعديل بيانات التسجيل أو رؤية الماليات.</span></div>{dataLoading && <LoadingState label="جارٍ تحميل الجلسات والحضور من الـAPI…" compact />}{dataError && <ErrorState compact title="تعذر تحميل جلسات المدرب" description={`${dataError} · لم يتم استبدال بيانات الخادم ببيانات تجريبية.`} />}{!dataLoading && !dataError && dataMode === "live" && <div className="role-feedback-state role-feedback-success role-feedback-compact" role="status">الجلسات والحضور LIVE من PostgreSQL · النطاق مأخوذ من حساب المدرب</div>}{!dataLoading && dataMode === "live" && !dataError && sessions.length === 0 && <div className="role-feedback-state role-feedback-compact" role="status">لا توجد جلسات مسندة إلى حسابك حاليًا.</div>}{!dataLoading && (dataMode !== "live" || sessions.length > 0) && view === "today" && <TodayView sessions={sessions} selectedId={selectedSessionId} onOpen={selectSession} onAttendance={() => selectView("attendance")} onEvaluation={() => selectView("evaluation")} onRequestSubstitution={id => setSubstitutionSessionId(id)} attendanceUnmarked={attendanceStats.unmarked} />}{!dataLoading && (dataMode !== "live" || sessions.length > 0) && view === "attendance" && <AttendanceView session={selectedSession} sessions={sessions} selectedId={selectedSessionId} onSession={id => { setSelectedSessionId(id); setAttendanceSaved(false); if (dataMode === "live") void apiClient.getSessionAttendance(id).then(applyAttendance); }} students={visibleStudents} query={query} setQuery={setQuery} attendance={attendance} onStatus={changeAttendance} stats={attendanceStats} saved={attendanceSaved} onSubmit={saveAttendance} onNext={() => selectView("evaluation")} />}{!dataLoading && (dataMode !== "live" || sessions.length > 0) && view === "evaluation" && <EvaluationView session={selectedSession} sessions={sessions} selectedId={selectedSessionId} onSession={id => { setSelectedSessionId(id); chooseStudent(sessions.find(item => item.id === id)?.students[0]?.id ?? ""); }} students={selectedSession.students} selectedStudent={selectedStudent} selectedStudentId={selectedStudent.id} onStudent={chooseStudent} evaluations={evaluations} scores={scores} setScores={setScores} comment={comment} setComment={setComment} onSubmit={saveEvaluation} />} </div></main>{substitutionSessionId && <div className="dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) { setSubstitutionSessionId(null); setSubstitutionReason(""); } }}><section className="student-dialog academic-dialog" role="dialog" aria-modal="true" aria-labelledby="substitution-request-title"><div className="dialog-top"><span className="dialog-mark"><Users size={20} /></span><button className="icon-button" aria-label="إغلاق" onClick={() => { setSubstitutionSessionId(null); setSubstitutionReason(""); }}><X size={18} /></button></div><h2 id="substitution-request-title">طلب مدرب بديل</h2><p>{sessions.find(item => item.id === substitutionSessionId)?.title} · {sessions.find(item => item.id === substitutionSessionId)?.day}</p><form onSubmit={submitSubstitutionRequest}><label className="form-field"><span>سبب طلب البديل <b>*</b></span><textarea required value={substitutionReason} onChange={event => setSubstitutionReason(event.target.value)} rows={4} placeholder="اكتب سبب طلب تغطية الجلسة..." /></label><div className="dialog-info"><ShieldCheck size={15} /><span>سيُرسل الطلب للمراجعة؛ المدرب البديل يتقدم بنفسه عند توفره.</span></div><div className="dialog-actions"><button type="button" className="button button-secondary" onClick={() => { setSubstitutionSessionId(null); setSubstitutionReason(""); }}>إلغاء</button><button type="submit" className="button button-primary">إرسال الطلب</button></div></form></section></div>}</RoleDashboardShell>;
}
const VIEW_TITLES: Record<DeskView, string> = { today: "حصصي اليوم", attendance: "تسجيل الحضور", evaluation: "تقييم الطلاب" };
const VIEW_COPY: Record<DeskView, string> = { today: "ابدأ من الجلسة التالية، ثم أكمل حضور الطلاب والتقييم من نفس مساحة العمل.", attendance: "سجّل حالة كل طالب في الجلسة المختارة، مع تنبيه واضح قبل التأكيد.", evaluation: "اكتب تقييمًا بنّاءً لكل طالب واحفظ البطاقة بعد مراجعة معايير الجلسة." };
function TodayView({ sessions, selectedId, onOpen, onAttendance, onEvaluation, onRequestSubstitution, attendanceUnmarked }: { sessions: Session[]; selectedId: string; onOpen: (id: string) => void; onAttendance: () => void; onEvaluation: () => void; onRequestSubstitution: (id: string) => void; attendanceUnmarked: number }) { return <><section className="instructor-desk-kpis"><Kpi icon={<CalendarCheck size={16} />} label="جلسة جارية" value={sessions.filter(item => item.status === "live").length} hint="تحتاج تركيزك الآن" tone="teal" /><Kpi icon={<Users size={16} />} label="طلاب اليوم" value={sessions.slice(0, 3).reduce((sum, item) => sum + item.students.length, 0)} hint="في جلساتك المسندة" tone="blue" /><Kpi icon={<AlertCircle size={16} />} label="حضور غير مكتمل" value={attendanceUnmarked} hint="في الجلسة الجارية" tone="amber" /><Kpi icon={<Star size={16} />} label="خطوة تالية" value="تقييم" hint="بعد تأكيد الحضور" tone="violet" /></section><section className="instructor-desk-panel"><PanelTitle icon={<CalendarDays size={16} />} title="جلساتك" action={<span className="instructor-desk-context"><ShieldCheck size={13} /> جلسات مسندة فقط</span>} /><div className="desk-session-list">{sessions.map(session => <article className={`desk-session-card ${session.status} ${session.id === selectedId ? "selected" : ""}`} key={session.id}><div className="desk-session-time"><strong>{session.time.split(" – ")[0]}</strong><small>{session.time.split(" – ")[1]}</small></div><div className="desk-session-main"><div><StatusBadge status={session.status === "live" ? "success" : session.status === "completed" ? "info" : "warning"} label={SESSION_STATUS[session.status]} /><small>{session.day}</small></div><h3>{session.title}</h3><p>{session.level} · {session.room}</p><span><Users size={12} /> {session.students.length} طلاب</span></div><div className="desk-session-actions"><button className="desk-secondary-action" onClick={() => onRequestSubstitution(session.id)}>طلب بديل</button><button className={session.status === "live" ? "desk-primary-action" : "desk-secondary-action"} onClick={() => onOpen(session.id)}>{session.status === "completed" ? "فتح التفاصيل" : "فتح الجلسة"}<ChevronLeft size={14} /></button></div></article>)}</div></section><section className="instructor-desk-next"><div><span className="desk-next-icon"><Target size={17} /></span><div><strong>التدفق المقترح للحصة</strong><small>سجّل الحضور أولًا، ثم أضف التقييم قبل إغلاق الجلسة.</small></div></div><div><button className="desk-secondary-action" onClick={onAttendance}><CalendarCheck size={14} /> تسجيل الحضور</button><button className="desk-primary-action" onClick={onEvaluation}><Star size={14} /> إضافة تقييم</button></div></section></>; }
function AttendanceView({ session, sessions, selectedId, onSession, students, query, setQuery, attendance, onStatus, stats, saved, onSubmit, onNext }: { session: Session; sessions: Session[]; selectedId: string; onSession: (id: string) => void; students: Student[]; query: string; setQuery: (value: string) => void; attendance: Record<string, AttendanceStatus>; onStatus: (id: string, status: AttendanceStatus) => void; stats: { present: number; late: number; absent: number; unmarked: number }; saved: boolean; onSubmit: (event: FormEvent) => void; onNext: () => void }) { return <><section className="desk-session-picker"><label><span>الجلسة المختارة</span><select value={selectedId} onChange={event => onSession(event.target.value)}>{sessions.map(item => <option key={item.id} value={item.id}>{item.day} · {item.time} · {item.title}</option>)}</select></label><div><StatusBadge status={session.status === "live" ? "success" : "info"} label={SESSION_STATUS[session.status]} /><small>{session.room} · {session.students.length} طلاب</small></div></section><section className="instructor-desk-kpis attendance-kpis"><Kpi icon={<CheckCircle2 size={16} />} label="حاضر" value={stats.present} hint="تسجيل مكتمل" tone="teal" /><Kpi icon={<Clock3 size={16} />} label="متأخر" value={stats.late} hint="يمكن إضافة الدقائق" tone="blue" /><Kpi icon={<AlertCircle size={16} />} label="غائب/بعذر" value={stats.absent} hint="يظهر في ملخص الجلسة" tone="amber" /><Kpi icon={<Users size={16} />} label="بدون حالة" value={stats.unmarked} hint="مطلوب قبل التأكيد" tone="violet" /></section><form className="instructor-desk-panel attendance-desk-panel" onSubmit={onSubmit}><PanelTitle icon={<CalendarCheck size={16} />} title="كشف الحضور" action={<label className="desk-search"><Search size={13} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن طالب..." /></label>} /><div className="attendance-desk-table-wrap"><table className="attendance-desk-table"><thead><tr><th>الطالب</th><th>الحالة</th><th>ملاحظة التشغيل</th></tr></thead><tbody>{students.map(student => { const status = attendance[student.id] ?? "unmarked"; return <tr key={student.id}><td><span className="desk-student"><i>{student.initials}</i><span><strong>{student.name}</strong><small>{student.age} سنة · {student.id}</small></span></span></td><td><select className={`desk-attendance-select ${status}`} value={status} aria-label={`حالة ${student.name}`} onChange={event => onStatus(student.id, event.target.value as AttendanceStatus)}><option value="unmarked">لم يسجل</option><option value="present">حاضر</option><option value="late">متأخر</option><option value="absent">غائب</option><option value="excused">بعذر</option></select></td><td><span className="desk-muted">{status === "unmarked" ? "بانتظار تسجيلك" : status === "late" ? "أضف دقائق التأخير عند الحاجة" : status === "present" ? "حضور مسجل" : "سيظهر في ملخص الجلسة"}</span></td></tr>; })}</tbody></table></div><div className="desk-form-footer"><span>{saved ? <><CheckCircle2 size={14} /> تم حفظ الحضور ويمكن البدء بالتقييم</> : <><ShieldCheck size={14} /> لن يتم التأكيد قبل اكتمال كل الحالات</>}</span><div><button className="desk-primary-action" type="submit" disabled={stats.unmarked > 0 && !saved}><Save size={14} /> {saved ? "تم تأكيد الحضور" : "حفظ وتأكيد الحضور"}</button>{saved && <button type="button" className="desk-secondary-action" onClick={onNext}><Star size={14} /> ابدأ التقييمات</button>}</div></div>{stats.unmarked > 0 && !saved && <p className="desk-validation"><AlertCircle size={14} /> سجّل حالة {stats.unmarked} طالب قبل تأكيد الحضور.</p>}</form></>; }
function EvaluationView({ session, sessions, selectedId, onSession, students, selectedStudent, selectedStudentId, onStudent, evaluations, scores, setScores, comment, setComment, onSubmit }: { session: Session; sessions: Session[]; selectedId: string; onSession: (id: string) => void; students: Student[]; selectedStudent: Student; selectedStudentId: string; onStudent: (id: string) => void; evaluations: Record<string, Evaluation>; scores: Record<string, number>; setScores: (value: Record<string, number>) => void; comment: string; setComment: (value: string) => void; onSubmit: (event: FormEvent) => void }) { return <><section className="desk-session-picker"><label><span>الجلسة</span><select value={selectedId} onChange={event => onSession(event.target.value)}>{sessions.map(item => <option key={item.id} value={item.id}>{item.day} · {item.title}</option>)}</select></label><div><BookOpen size={14} /><small>{session.level} · التقييم بعد الحضور</small></div></section><div className="evaluation-desk-layout"><section className="instructor-desk-panel evaluation-students"><PanelTitle icon={<Users size={16} />} title="طلاب الجلسة" action={<span>{students.length} طلاب</span>} /><div className="desk-student-list">{students.map(student => { const evaluated = evaluations[`${session.id}:${student.id}`]; return <button className={student.id === selectedStudentId ? "selected" : ""} key={student.id} onClick={() => onStudent(student.id)}><i>{student.initials}</i><span><strong>{student.name}</strong><small>{student.age} سنة</small></span>{evaluated ? <CheckCircle2 size={15} /> : <span className="pending-dot" />}</button>; })}</div></section><form className="instructor-desk-panel evaluation-desk-form" onSubmit={onSubmit}><PanelTitle icon={<Star size={16} />} title="بطاقة تقييم الطالب" action={<span className="instructor-desk-context"><ShieldCheck size={13} /> مراجعة المدرب</span>} /><div className="evaluation-selected-student"><i>{selectedStudent.initials}</i><div><strong>{selectedStudent.name}</strong><small>ولي الأمر: {selectedStudent.parent} · {session.title}</small></div></div><div className="desk-rubric-list">{RUBRIC.map(item => <label key={item.id}><span><strong>{item.label}</strong><small>{item.hint}</small></span><select value={scores[item.id] ?? 4} onChange={event => setScores({ ...scores, [item.id]: Number(event.target.value) })}><option value="1">1 · يحتاج دعم</option><option value="2">2 · بداية</option><option value="3">3 · جيد</option><option value="4">4 · متقدم</option><option value="5">5 · ممتاز</option></select></label>)}</div><label className="desk-comment"><span>ملاحظة بنّاءة</span><textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="ما الذي أتقنه الطالب؟ وما الخطوة التالية؟" rows={4} /></label><div className="desk-form-footer"><span><MessageCircle size={14} /> اكتب ملاحظة يمكن مشاركتها مع ولي الأمر بعد المراجعة.</span><button className="desk-primary-action" type="submit"><Save size={14} /> حفظ التقييم</button></div></form></div></>; }
function Kpi({ icon, label, value, hint, tone }: { icon: ReactNode; label: string; value: ReactNode; hint: string; tone: string }) { return <article className="instructor-desk-kpi"><span className={`instructor-desk-kpi-icon ${tone}`}>{icon}</span><small>{label}</small><strong>{value}</strong><span>{hint}</span></article>; }
function PanelTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) { return <div className="instructor-desk-panel-title"><div><span>{icon}</span><h2>{title}</h2></div>{action}</div>; }

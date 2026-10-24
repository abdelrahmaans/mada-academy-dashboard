/**
 * HeadInstructorsTypes.ts
 * Types, constants, seed data, and helper formatters for Head Instructors (R03) preview surface.
 * Extracted from HeadInstructorsPreview.tsx to reduce file size and decouple data from UI.
 */

export type WorkspaceView =
  | "overview"
  | "team"
  | "sessions"
  | "approvals"
  | "evaluations"
  | "rubrics";

export type SessionStatus =
  | "scheduled"
  | "completed"
  | "pending_approval"
  | "cancelled"
  | "rescheduled";

export type EvaluationCardStatus = "pending" | "generating" | "ready";

export type EvaluationReviewStatus = "pending" | "approved" | "changes_requested";

export type AttendanceEntry = {
  studentId: string;
  student: string;
  status: "present" | "absent" | "late" | "excused";
  lateMinutes?: number;
  note?: string;
};

export type SessionRecord = {
  id: string;
  offeringId: string;
  courseName: string;
  groupName: string;
  date: string;
  dateLabel: string;
  time: string;
  room: string;
  instructor: string;
  status: SessionStatus;
  students: number;
  attendance?: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  attendanceEntries?: AttendanceEntry[];
  instructorNote?: string;
};

export type AttendanceDecision = {
  id: string;
  sessionId: string;
  courseName: string;
  groupName: string;
  instructor: string;
  sessionDate: string;
  actor: string;
  decision: "approved" | "returned";
  note: string;
  decidedAt: string;
};

export type EvaluationRecord = {
  id: string;
  student: string;
  studentId: string;
  courseName: string;
  instructor: string;
  sessionDate: string;
  cardStatus: EvaluationCardStatus;
  scores: { understanding: number; practice: number; collaboration: number };
  comment: string;
};

export type Coach = {
  id: string;
  name: string;
  initials: string;
  role: string;
  phone: string;
  groups: string[];
  sessionsThisWeek: number;
  attendanceRate: number;
  evaluationRate: number;
  status: "active" | "on_leave";
};

export const BRANCH = "مدينة نصر";
export const HEAD_OF_INSTRUCTORS = "مريم حسن";

export const VIEW_NAMES: Record<WorkspaceView, string> = {
  overview: "ملخص الفريق",
  team: "فريق المدربين",
  sessions: "الحصص والحضور",
  approvals: "اعتماد الحضور",
  evaluations: "تقييمات الطلاب",
  rubrics: "بنك معايير التقييم",
};

export const VIEW_VALUES = Object.keys(VIEW_NAMES) as WorkspaceView[];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "مجدولة",
  completed: "مكتملة",
  pending_approval: "تحتاج مراجعة التسجيل",
  cancelled: "ملغاة",
  rescheduled: "أُعيدت جدولتها",
};

export const CARD_STATUS_LABELS: Record<EvaluationCardStatus, string> = {
  pending: "بانتظار الإنشاء",
  generating: "جارٍ تجهيز البطاقة",
  ready: "بطاقة جاهزة",
};

export const RUBRIC = [
  {
    key: "understanding",
    label: "استيعاب الفكرة",
    hint: "المفاهيم والخطوات الأساسية",
  },
  {
    key: "practice",
    label: "التطبيق العملي",
    hint: "تنفيذ المهمة واستخدام الأدوات",
  },
  {
    key: "collaboration",
    label: "التعاون والمبادرة",
    hint: "المشاركة والتعاون مع الزملاء",
  },
] as const;

export const COACHES: Coach[] = [
  {
    id: "USR-0202",
    name: "عمر سامح",
    initials: "عس",
    role: `مدرب · ${BRANCH}`,
    phone: "01123456789",
    groups: ["روبوتكس مستوى 2", "برمجة للمبتدئين", "أساسيات تصميم الروبوت"],
    sessionsThisWeek: 6,
    attendanceRate: 88,
    evaluationRate: 83,
    status: "active",
  },
  {
    id: "USR-0208",
    name: "دينا مصطفى",
    initials: "دم",
    role: `مدربة · ${BRANCH}`,
    phone: "01045678912",
    groups: ["دوائر إلكترونية للمبتدئين", "برمجة ألعاب المستوى الأول"],
    sessionsThisWeek: 5,
    attendanceRate: 92,
    evaluationRate: 86,
    status: "active",
  },
  {
    id: "USR-0209",
    name: "كريم أشرف",
    initials: "كأ",
    role: `مدرب · ${BRANCH}`,
    phone: "01267890123",
    groups: ["روبوتكس متقدم", "أساسيات الذكاء الاصطناعي"],
    sessionsThisWeek: 4,
    attendanceRate: 85,
    evaluationRate: 79,
    status: "active",
  },
];

export const COACH = COACHES[0];

export const SESSIONS: SessionRecord[] = [
  {
    id: "SES-NSR-0926-02",
    offeringId: "GRP-042",
    courseName: "روبوتكس مستوى 2",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "10:00 – 11:30 ص",
    room: "معمل 1",
    instructor: COACH.name,
    status: "completed",
    students: 6,
    attendance: { present: 5, absent: 0, late: 1, excused: 0 },
  },
  {
    id: "SES-NSR-0926-05",
    offeringId: "GRP-041",
    courseName: "برمجة للمبتدئين",
    groupName: "المستوى التأسيسي · 7–9 سنوات",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "12:00 – 01:30 م",
    room: "معمل 2",
    instructor: COACH.name,
    status: "pending_approval",
    students: 8,
    attendance: { present: 7, absent: 1, late: 0, excused: 0 },
    attendanceEntries: [
      { studentId: "ST-0241", student: "آدم رامي", status: "present" },
      { studentId: "ST-0242", student: "جنى حسام", status: "present" },
      { studentId: "ST-0243", student: "سليم تامر", status: "present" },
      { studentId: "ST-0244", student: "نور أحمد", status: "present" },
      { studentId: "ST-0245", student: "ملك شريف", status: "present" },
      { studentId: "ST-0246", student: "عمر خالد", status: "present" },
      { studentId: "ST-0247", student: "فرح إيهاب", status: "present" },
      { studentId: "ST-0249", student: "زياد مصطفى", status: "absent" },
    ],
    instructorNote: "تم تسجيل الغياب بعد التواصل مع المجموعة.",
  },
  {
    id: "SES-NSR-0926-08",
    offeringId: "GRP-043",
    courseName: "أساسيات تصميم الروبوت",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "03:00 – 04:30 م",
    room: "معمل الروبوتات",
    instructor: COACH.name,
    status: "completed",
    students: 6,
    attendance: { present: 5, absent: 1, late: 0, excused: 0 },
  },
  {
    id: "SES-NSR-0927-01",
    offeringId: "GRP-042",
    courseName: "روبوتكس مستوى 2",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-27",
    dateLabel: "الأحد 27 سبتمبر",
    time: "10:00 – 11:30 ص",
    room: "معمل 1",
    instructor: COACH.name,
    status: "scheduled",
    students: 6,
  },
  {
    id: "SES-NSR-0928-04",
    offeringId: "GRP-041",
    courseName: "برمجة للمبتدئين",
    groupName: "المستوى التأسيسي · 7–9 سنوات",
    date: "2026-09-28",
    dateLabel: "الاثنين 28 سبتمبر",
    time: "12:00 – 01:30 م",
    room: "معمل 2",
    instructor: COACH.name,
    status: "scheduled",
    students: 8,
  },
  {
    id: "SES-NSR-0925-03",
    offeringId: "GRP-043",
    courseName: "أساسيات تصميم الروبوت",
    groupName: "المستوى المتوسط · 10–12 سنة",
    date: "2026-09-25",
    dateLabel: "الجمعة 25 سبتمبر",
    time: "04:00 – 05:30 م",
    room: "معمل الروبوتات",
    instructor: COACH.name,
    status: "completed",
    students: 6,
    attendance: { present: 5, absent: 0, late: 0, excused: 1 },
  },
  {
    id: "SES-NSR-0926-11",
    offeringId: "GRP-046",
    courseName: "دوائر إلكترونية للمبتدئين",
    groupName: "المستوى التأسيسي · 9–11 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "01:00 – 02:30 م",
    room: "معمل 3",
    instructor: COACHES[1].name,
    status: "pending_approval",
    students: 7,
    attendance: { present: 5, absent: 1, late: 1, excused: 0 },
    attendanceEntries: [
      { studentId: "ST-0311", student: "ليلى محمود", status: "present" },
      { studentId: "ST-0312", student: "يوسف وائل", status: "present" },
      { studentId: "ST-0313", student: "مريم عادل", status: "present" },
      { studentId: "ST-0314", student: "علي شادي", status: "present" },
      { studentId: "ST-0315", student: "رنا أحمد", status: "present" },
      {
        studentId: "ST-0316",
        student: "كريم سامي",
        status: "late",
        lateMinutes: 12,
      },
      {
        studentId: "ST-0317",
        student: "سيف طارق",
        status: "absent",
        note: "تم التواصل مع ولي الأمر",
      },
    ],
    instructorNote: "تم تسجيل تأخر طالب واحد، مع توثيق الغياب في نهاية الحصة.",
  },
  {
    id: "SES-NSR-0926-12",
    offeringId: "GRP-048",
    courseName: "أساسيات الذكاء الاصطناعي",
    groupName: "المستوى التأسيسي · 12–14 سنة",
    date: "2026-09-26",
    dateLabel: "السبت 26 سبتمبر",
    time: "04:00 – 05:30 م",
    room: "معمل 2",
    instructor: COACHES[2].name,
    status: "pending_approval",
    students: 6,
    attendance: { present: 4, absent: 2, late: 0, excused: 0 },
    attendanceEntries: [
      { studentId: "ST-0321", student: "يحيى حسام", status: "present" },
      { studentId: "ST-0322", student: "تاليا عمرو", status: "present" },
      { studentId: "ST-0323", student: "عمر أسامة", status: "present" },
      { studentId: "ST-0324", student: "نور كريم", status: "present" },
      {
        studentId: "ST-0325",
        student: "مالك محمود",
        status: "absent",
        note: "لم يحضر",
      },
      {
        studentId: "ST-0326",
        student: "جود ياسر",
        status: "absent",
        note: "تم التواصل مع ولي الأمر",
      },
    ],
    instructorNote: "غياب طالبان؛ تم التواصل مع ولي الأمر حسب الإجراء المعتاد.",
  },
  {
    id: "SES-NSR-0925-07",
    offeringId: "GRP-047",
    courseName: "برمجة ألعاب المستوى الأول",
    groupName: "المستوى التأسيسي · 10–12 سنة",
    date: "2026-09-25",
    dateLabel: "الجمعة 25 سبتمبر",
    time: "02:00 – 03:30 م",
    room: "معمل 3",
    instructor: COACHES[1].name,
    status: "completed",
    students: 8,
    attendance: { present: 7, absent: 1, late: 0, excused: 0 },
  },
  {
    id: "SES-NSR-0925-09",
    offeringId: "GRP-047",
    courseName: "روبوتكس متقدم",
    groupName: "المستوى المتقدم · 13–15 سنة",
    date: "2026-09-25",
    dateLabel: "الجمعة 25 سبتمبر",
    time: "05:00 – 06:30 م",
    room: "معمل الروبوتات",
    instructor: COACHES[2].name,
    status: "completed",
    students: 5,
    attendance: { present: 4, absent: 0, late: 1, excused: 0 },
  },
];

export const EVALUATIONS: EvaluationRecord[] = [
  {
    id: "EVAL-2418",
    student: "ياسين محمد علي",
    studentId: "ST-0248",
    courseName: "روبوتكس مستوى 2",
    instructor: COACH.name,
    sessionDate: "2026-09-25",
    cardStatus: "ready",
    scores: { understanding: 4, practice: 5, collaboration: 4 },
    comment: "نفّذ التحدي باستقلالية وشرح فكرته لزميله.",
  },
  {
    id: "EVAL-2417",
    student: "عمر خالد إبراهيم",
    studentId: "ST-0246",
    courseName: "برمجة للمبتدئين",
    instructor: COACH.name,
    sessionDate: "2026-09-25",
    cardStatus: "ready",
    scores: { understanding: 3, practice: 4, collaboration: 4 },
    comment:
      "تقدّم جيد في ترتيب الخطوات، ويستفيد من وقت إضافي في تجربة الحلول.",
  },
  {
    id: "EVAL-2414",
    student: "ملك حسام الدين",
    studentId: "ST-0240",
    courseName: "أساسيات تصميم الروبوت",
    instructor: COACH.name,
    sessionDate: "2026-09-24",
    cardStatus: "pending",
    scores: { understanding: 4, practice: 3, collaboration: 5 },
    comment: "تحتاج متابعة إضافية في توثيق خطوات المشروع.",
  },
  {
    id: "EVAL-2412",
    student: "ليلى أحمد محمود",
    studentId: "ST-0238",
    courseName: "روبوتكس مستوى 2",
    instructor: COACH.name,
    sessionDate: "2026-09-23",
    cardStatus: "generating",
    scores: { understanding: 5, practice: 4, collaboration: 4 },
    comment: "مستوى متميز في تحليل المشكلة وتجربة أكثر من مسار للحل.",
  },
  {
    id: "EVAL-2421",
    student: "كريم سامي",
    studentId: "ST-0316",
    courseName: "دوائر إلكترونية للمبتدئين",
    instructor: COACHES[1].name,
    sessionDate: "2026-09-25",
    cardStatus: "ready",
    scores: { understanding: 4, practice: 4, collaboration: 3 },
    comment:
      "فهم توصيل الدائرة بسرعة، ويحتاج مراجعة ترتيب المكونات قبل التشغيل.",
  },
  {
    id: "EVAL-2422",
    student: "تاليا عمرو",
    studentId: "ST-0322",
    courseName: "أساسيات الذكاء الاصطناعي",
    instructor: COACHES[2].name,
    sessionDate: "2026-09-24",
    cardStatus: "pending",
    scores: { understanding: 3, practice: 4, collaboration: 5 },
    comment: "مشاركة قوية في النقاش؛ نوصي بمتابعة شرح خطوات بناء النموذج.",
  },
  {
    id: "EVAL-2423",
    student: "رنا أحمد",
    studentId: "ST-0315",
    courseName: "برمجة ألعاب المستوى الأول",
    instructor: COACHES[1].name,
    sessionDate: "2026-09-23",
    cardStatus: "generating",
    scores: { understanding: 5, practice: 4, collaboration: 4 },
    comment: "أنجزت حركة الشخصية وربطت الأوامر بتسلسل منطقي.",
  },
  {
    id: "EVAL-2424",
    student: "يحيى حسام",
    studentId: "ST-0321",
    courseName: "روبوتكس متقدم",
    instructor: COACHES[2].name,
    sessionDate: "2026-09-22",
    cardStatus: "ready",
    scores: { understanding: 4, practice: 5, collaboration: 4 },
    comment: "أظهر استقلالية جيدة في اختبار المستشعرات والعمل مع الفريق.",
  },
];

export const ATTENDANCE_TREND = [
  { label: "الأحد", value: 81 },
  { label: "الاثنين", value: 86 },
  { label: "الثلاثاء", value: 84 },
  { label: "الأربعاء", value: 91 },
  { label: "الخميس", value: 88 },
  { label: "الجمعة", value: 82 },
  { label: "السبت", value: 89 },
];

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T12:00:00`));

export const presentRate = (session: SessionRecord) => {
  if (!session.attendance) return null;
  const included = session.students - (session.attendance.excused || 0);
  if (!included) return 0;
  return Math.round(
    ((session.attendance.present + session.attendance.late) / included) * 100
  );
};


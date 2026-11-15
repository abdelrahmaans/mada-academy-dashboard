export type ProjectStudent = {
  studentId: string;
  studentName: string;
  roleInTeam?: string;
};

export type ProjectArchiveItem = {
  id: string;
  competitionId?: string;
  competitionName: string;
  branchId: string;
  branchName: string;
  teamName: string;
  teamBadge: string;
  projectTitle: string;
  projectDescription: string;
  driveUrl: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  students: ProjectStudent[];
  award?: string | null;
  status: "SUBMITTED" | "APPROVED" | "SHOWCASED";
};

const STORAGE_KEY = "mada_academy_projects_archive_v1";

const INITIAL_PROJECTS: ProjectArchiveItem[] = [
  {
    id: "proj-wro-2026-01",
    competitionName: "بطولة الأولمبياد العالمي للروبوت (WRO 2026)",
    branchId: "branch-cairo-nasr",
    branchName: "مدينة نصر",
    teamName: "Mada CyberTitans",
    teamBadge: "🤖",
    projectTitle: "روبوت فرز وفرم النفايات الذكي بالرؤية الحاسوبية",
    projectDescription:
      "تصميم وبرمجة روبوت متحرك يعتمد على كاميرا ذكاء اصطناعي وحساسات ألوان لفرز وتصنيف المخلفات وإعادة تدويرها تلقائياً بسرعة فائقة.",
    driveUrl: "https://drive.google.com/drive/folders/mada-cyber-titans-wro-2026",
    submittedBy: "كوتش أحمد محمود",
    submittedByRole: "المدرب المعتمد",
    submittedAt: "2026-11-10T14:30:00.000Z",
    students: [
      { studentId: "stud-001", studentName: "ياسين محمد علي", roleInTeam: "مبرمج الخوارزميات" },
      { studentId: "stud-002", studentName: "عمر خالد إبراهيم", roleInTeam: "مصمم الميكانيكا" },
      { studentId: "stud-003", studentName: "آدم شريف حسن", roleInTeam: "متحكم الحساسات" },
    ],
    award: "المركز الأول على مستوى الجمهورية 🏆",
    status: "SHOWCASED",
  },
  {
    id: "proj-fll-2026-02",
    competitionName: "مسابقة فيرست ليجو الدولية (FLL SuperPowered)",
    branchId: "branch-cairo-maadi",
    branchName: "المعادي",
    teamName: "EcoRobo Innovators",
    teamBadge: "⚡",
    projectTitle: "شبكة شواحن ذكية للروبوتات تعمل بالطاقة الشمسية",
    projectDescription:
      "ابتكار نموذج مجسم لمحطة شحن ذكية متصلة بإنترنت الأشياء IoT لإمداد الروبوتات بالطاقة النظيفة مع لوحة تحكم سحابية لقياس استهلاك الطاقة.",
    driveUrl: "https://drive.google.com/drive/folders/eco-robo-innovators-fll-2026",
    submittedBy: "كوتش سارة كمال",
    submittedByRole: "المدرب المعتمد",
    submittedAt: "2026-11-08T11:15:00.000Z",
    students: [
      { studentId: "stud-004", studentName: "سيف مصطفى عادل", roleInTeam: "قائد الفريق والبرمجة" },
      { studentId: "stud-005", studentName: "ملك حسام الدين", roleInTeam: "عرض المشروع والبحث" },
    ],
    award: "جائزة أفضل مشروع ابتكاري مبتكر 🥇",
    status: "APPROVED",
  },
  {
    id: "proj-grad-2026-03",
    competitionName: "مشروع تخرج مسار الروبوتكس المتقدم",
    branchId: "branch-giza-sheikh-zayed",
    branchName: "الشيخ زايد",
    teamName: "Smart Rovers Team",
    teamBadge: "🚀",
    projectTitle: "مستكشف الكواكب الصغير المتفادي للعقبات",
    projectDescription:
      "مركبة استكشافية ذكية مزودة بمستشعرات Ultrasonic وجيروسكوب للتنقل الذاتي في التضاريس الوعرة ورسم خرائط رقمية ثلاثية الأبعاد.",
    driveUrl: "https://drive.google.com/drive/folders/smart-rovers-advanced-robotics",
    submittedBy: "كوتش يوسف عماد",
    submittedByRole: "المدرب المعتمد",
    submittedAt: "2026-11-05T16:00:00.000Z",
    students: [
      { studentId: "stud-001", studentName: "ياسين محمد علي", roleInTeam: "برمجة المتحكم" },
      { studentId: "stud-006", studentName: "نور الدين إيهاب", roleInTeam: "الميكانيكا والهيكل" },
    ],
    award: "شهادة تميز بدرجة امتياز مع مرتبة الشرف 🌟",
    status: "APPROVED",
  },
];

let memoryStore: ProjectArchiveItem[] | null = null;

function getStore(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function resetProjectArchiveMemoryStore() {
  memoryStore = null;
  const store = getStore();
  if (store) {
    store.removeItem(STORAGE_KEY);
  }
}

export function getArchivedProjects(): ProjectArchiveItem[] {
  const store = getStore();
  if (!store) {
    if (!memoryStore) {
      memoryStore = [...INITIAL_PROJECTS];
    }
    return memoryStore;
  }

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) {
      store.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_PROJECTS;
  } catch {
    return INITIAL_PROJECTS;
  }
}

export function saveArchivedProject(
  input: Omit<ProjectArchiveItem, "id" | "submittedAt" | "status"> & { status?: ProjectArchiveItem["status"] }
): ProjectArchiveItem {
  const current = getArchivedProjects();
  const newProject: ProjectArchiveItem = {
    ...input,
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    submittedAt: new Date().toISOString(),
    status: input.status || "SUBMITTED",
  };

  const updated = [newProject, ...current];
  const store = getStore();
  if (store) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  } else {
    memoryStore = updated;
  }
  return newProject;
}

export function getStudentProjects(studentIdOrName: string): ProjectArchiveItem[] {
  const all = getArchivedProjects();
  const needle = studentIdOrName.trim().toLowerCase();
  if (!needle) return [];

  return all.filter((proj) =>
    proj.students.some(
      (s) =>
        s.studentId.toLowerCase() === needle ||
        s.studentName.toLowerCase().includes(needle) ||
        needle.includes(s.studentName.toLowerCase())
    )
  );
}

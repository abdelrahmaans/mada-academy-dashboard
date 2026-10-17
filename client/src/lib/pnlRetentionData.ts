export type BranchPnLRecord = {
  branchId: string;
  branchName: string;
  city: string;
  manager: string;
  month: string;
  activeStudents: number;
  // Revenue streams
  tuitionRevenue: number;
  privateCoachingRevenue: number;
  kitsAndRegistrationRevenue: number;
  competitionRevenue: number;
  totalRevenue: number;
  // Expenses breakdown
  trainerPayroll: number;
  facilityLease: number;
  utilitiesAndNet: number;
  equipmentAndSupplies: number;
  marketingAndAds: number;
  adminAndMisc: number;
  totalExpenses: number;
  // Profitability & Margins
  grossProfit: number;
  grossMarginPercent: number;
  netProfit: number;
  netMarginPercent: number;
  revenueContributionPercent: number;
  // Unit Economics
  revenuePerStudent: number;
  costPerStudent: number;
  profitPerStudent: number;
};

export type TrackRetention = {
  track: string;
  trackLabel: string;
  studentsCount: number;
  retentionRate: number;
  churnRate: number;
};

export type MonthlyRetentionTrend = {
  month: string;
  monthLabel: string;
  retentionRate: number;
  churnRate: number;
  activeCount: number;
};

export type BranchRetentionRecord = {
  branchId: string;
  branchName: string;
  month: string;
  activeStudentsStart: number;
  newEnrollments: number;
  renewedStudents: number;
  churnedStudents: number;
  frozenStudents: number;
  activeStudentsEnd: number;
  retentionRate: number;
  churnRate: number;
  renewalOnTimeRate: number;
  targetRetentionRate: number;
  atRiskCount: number;
  status: "top_performer" | "healthy" | "needs_attention";
  tracks: TrackRetention[];
  trend: MonthlyRetentionTrend[];
};

export type AtRiskStudent = {
  id: string;
  name: string;
  branch: string;
  track: string;
  attendanceRate: number;
  daysRemainingInSub: number;
  sessionsMissed: number;
  riskSeverity: "critical" | "warning" | "moderate";
  riskReason: string;
  suggestedAction: string;
  status: "pending" | "contacted" | "retained" | "lost";
  lastContactNote?: string;
};

export const PNL_PERIODS = [
  { value: "2026-09", label: "سبتمبر ٢٠٢٦" },
  { value: "2026-08", label: "أغسطس ٢٠٢٦" },
  { value: "2026-07", label: "يوليو ٢٠٢٦" },
] as const;

export const BRANCH_NAMES = ["مدينة نصر", "المعادي", "الشيخ زايد"] as const;

export const PNL_RECORDS: BranchPnLRecord[] = [
  // September 2026
  {
    branchId: "BR-01",
    branchName: "مدينة نصر",
    city: "القاهرة",
    manager: "أحمد محمود",
    month: "2026-09",
    activeStudents: 248,
    tuitionRevenue: 98400,
    privateCoachingRevenue: 14600,
    kitsAndRegistrationRevenue: 10500,
    competitionRevenue: 5000,
    totalRevenue: 128500,
    trainerPayroll: 18400,
    facilityLease: 11000,
    utilitiesAndNet: 2400,
    equipmentAndSupplies: 3100,
    marketingAndAds: 2200,
    adminAndMisc: 1400,
    totalExpenses: 38500,
    grossProfit: 107000,
    grossMarginPercent: 83.3,
    netProfit: 90000,
    netMarginPercent: 70.0,
    revenueContributionPercent: 42.5,
    revenuePerStudent: 518,
    costPerStudent: 155,
    profitPerStudent: 363,
  },
  {
    branchId: "BR-02",
    branchName: "المعادي",
    city: "القاهرة",
    manager: "سارة كمال",
    month: "2026-09",
    activeStudents: 186,
    tuitionRevenue: 78900,
    privateCoachingRevenue: 11800,
    kitsAndRegistrationRevenue: 7500,
    competitionRevenue: 3000,
    totalRevenue: 101200,
    trainerPayroll: 14200,
    facilityLease: 8500,
    utilitiesAndNet: 1900,
    equipmentAndSupplies: 2100,
    marketingAndAds: 1600,
    adminAndMisc: 1100,
    totalExpenses: 29400,
    grossProfit: 84900,
    grossMarginPercent: 83.9,
    netProfit: 71800,
    netMarginPercent: 70.9,
    revenueContributionPercent: 33.5,
    revenuePerStudent: 544,
    costPerStudent: 158,
    profitPerStudent: 386,
  },
  {
    branchId: "BR-03",
    branchName: "الشيخ زايد",
    city: "الجيزة",
    manager: "يوسف عماد",
    month: "2026-09",
    activeStudents: 121,
    tuitionRevenue: 54200,
    privateCoachingRevenue: 9200,
    kitsAndRegistrationRevenue: 6000,
    competitionRevenue: 3000,
    totalRevenue: 72400,
    trainerPayroll: 13500,
    facilityLease: 10500,
    utilitiesAndNet: 2300,
    equipmentAndSupplies: 2400,
    marketingAndAds: 1900,
    adminAndMisc: 1200,
    totalExpenses: 31800,
    grossProfit: 56500,
    grossMarginPercent: 78.0,
    netProfit: 40600,
    netMarginPercent: 56.1,
    revenueContributionPercent: 24.0,
    revenuePerStudent: 598,
    costPerStudent: 263,
    profitPerStudent: 335,
  },

  // August 2026
  {
    branchId: "BR-01",
    branchName: "مدينة نصر",
    city: "القاهرة",
    manager: "أحمد محمود",
    month: "2026-08",
    activeStudents: 236,
    tuitionRevenue: 93200,
    privateCoachingRevenue: 13800,
    kitsAndRegistrationRevenue: 9800,
    competitionRevenue: 4800,
    totalRevenue: 121600,
    trainerPayroll: 17800,
    facilityLease: 11000,
    utilitiesAndNet: 2300,
    equipmentAndSupplies: 2900,
    marketingAndAds: 2000,
    adminAndMisc: 1300,
    totalExpenses: 37300,
    grossProfit: 100900,
    grossMarginPercent: 83.0,
    netProfit: 84300,
    netMarginPercent: 69.3,
    revenueContributionPercent: 42.6,
    revenuePerStudent: 515,
    costPerStudent: 158,
    profitPerStudent: 357,
  },
  {
    branchId: "BR-02",
    branchName: "المعادي",
    city: "القاهرة",
    manager: "سارة كمال",
    month: "2026-08",
    activeStudents: 180,
    tuitionRevenue: 76400,
    privateCoachingRevenue: 11200,
    kitsAndRegistrationRevenue: 7200,
    competitionRevenue: 2800,
    totalRevenue: 97600,
    trainerPayroll: 13900,
    facilityLease: 8500,
    utilitiesAndNet: 1800,
    equipmentAndSupplies: 2000,
    marketingAndAds: 1500,
    adminAndMisc: 1000,
    totalExpenses: 28700,
    grossProfit: 81700,
    grossMarginPercent: 83.7,
    netProfit: 68900,
    netMarginPercent: 70.6,
    revenueContributionPercent: 34.2,
    revenuePerStudent: 542,
    costPerStudent: 159,
    profitPerStudent: 383,
  },
  {
    branchId: "BR-03",
    branchName: "الشيخ زايد",
    city: "الجيزة",
    manager: "يوسف عماد",
    month: "2026-08",
    activeStudents: 115,
    tuitionRevenue: 50100,
    privateCoachingRevenue: 8500,
    kitsAndRegistrationRevenue: 5200,
    competitionRevenue: 2400,
    totalRevenue: 66200,
    trainerPayroll: 12800,
    facilityLease: 10500,
    utilitiesAndNet: 2200,
    equipmentAndSupplies: 2200,
    marketingAndAds: 1800,
    adminAndMisc: 1100,
    totalExpenses: 30600,
    grossProfit: 51200,
    grossMarginPercent: 77.3,
    netProfit: 35600,
    netMarginPercent: 53.8,
    revenueContributionPercent: 23.2,
    revenuePerStudent: 575,
    costPerStudent: 266,
    profitPerStudent: 309,
  },

  // July 2026
  {
    branchId: "BR-01",
    branchName: "مدينة نصر",
    city: "القاهرة",
    manager: "أحمد محمود",
    month: "2026-07",
    activeStudents: 228,
    tuitionRevenue: 89000,
    privateCoachingRevenue: 12500,
    kitsAndRegistrationRevenue: 9100,
    competitionRevenue: 4000,
    totalRevenue: 114600,
    trainerPayroll: 16900,
    facilityLease: 11000,
    utilitiesAndNet: 2200,
    equipmentAndSupplies: 2700,
    marketingAndAds: 1900,
    adminAndMisc: 1200,
    totalExpenses: 35900,
    grossProfit: 95000,
    grossMarginPercent: 82.9,
    netProfit: 78700,
    netMarginPercent: 68.7,
    revenueContributionPercent: 42.7,
    revenuePerStudent: 502,
    costPerStudent: 157,
    profitPerStudent: 345,
  },
  {
    branchId: "BR-02",
    branchName: "المعادي",
    city: "القاهرة",
    manager: "سارة كمال",
    month: "2026-07",
    activeStudents: 174,
    tuitionRevenue: 73500,
    privateCoachingRevenue: 10500,
    kitsAndRegistrationRevenue: 6800,
    competitionRevenue: 2500,
    totalRevenue: 93300,
    trainerPayroll: 13200,
    facilityLease: 8500,
    utilitiesAndNet: 1700,
    equipmentAndSupplies: 1900,
    marketingAndAds: 1400,
    adminAndMisc: 1000,
    totalExpenses: 27700,
    grossProfit: 78200,
    grossMarginPercent: 83.8,
    netProfit: 65600,
    netMarginPercent: 70.3,
    revenueContributionPercent: 34.8,
    revenuePerStudent: 536,
    costPerStudent: 159,
    profitPerStudent: 377,
  },
  {
    branchId: "BR-03",
    branchName: "الشيخ زايد",
    city: "الجيزة",
    manager: "يوسف عماد",
    month: "2026-07",
    activeStudents: 108,
    tuitionRevenue: 46200,
    privateCoachingRevenue: 7800,
    kitsAndRegistrationRevenue: 4500,
    competitionRevenue: 2000,
    totalRevenue: 60500,
    trainerPayroll: 12000,
    facilityLease: 10500,
    utilitiesAndNet: 2100,
    equipmentAndSupplies: 2000,
    marketingAndAds: 1600,
    adminAndMisc: 1000,
    totalExpenses: 29200,
    grossProfit: 46500,
    grossMarginPercent: 76.9,
    netProfit: 31300,
    netMarginPercent: 51.7,
    revenueContributionPercent: 22.5,
    revenuePerStudent: 560,
    costPerStudent: 270,
    profitPerStudent: 290,
  },
];

export const RETENTION_RECORDS: BranchRetentionRecord[] = [
  // September 2026
  {
    branchId: "BR-01",
    branchName: "مدينة نصر",
    month: "2026-09",
    activeStudentsStart: 236,
    newEnrollments: 32,
    renewedStudents: 216,
    churnedStudents: 16,
    frozenStudents: 4,
    activeStudentsEnd: 248,
    retentionRate: 93.1,
    churnRate: 6.9,
    renewalOnTimeRate: 88.5,
    targetRetentionRate: 88.0,
    atRiskCount: 6,
    status: "top_performer",
    tracks: [
      { track: "robotics", trackLabel: "الروبوتكس والذكاء الاصطناعي", studentsCount: 98, retentionRate: 94.8, churnRate: 5.2 },
      { track: "coding", trackLabel: "برمجة الأطفال وتطوير الألعاب", studentsCount: 76, retentionRate: 93.4, churnRate: 6.6 },
      { track: "circuits", trackLabel: "الدوائر الإلكترونية وإنترنت الأشياء", studentsCount: 42, retentionRate: 90.5, churnRate: 9.5 },
      { track: "soft_skills", trackLabel: "مهارات العرض والتفكير النقدي", studentsCount: 32, retentionRate: 90.6, churnRate: 9.4 },
    ],
    trend: [
      { month: "2026-06", monthLabel: "يونيو", retentionRate: 91.2, churnRate: 8.8, activeCount: 220 },
      { month: "2026-07", monthLabel: "يوليو", retentionRate: 92.0, churnRate: 8.0, activeCount: 228 },
      { month: "2026-08", monthLabel: "أغسطس", retentionRate: 92.5, churnRate: 7.5, activeCount: 236 },
      { month: "2026-09", monthLabel: "سبتمبر", retentionRate: 93.1, churnRate: 6.9, activeCount: 248 },
    ],
  },
  {
    branchId: "BR-02",
    branchName: "المعادي",
    month: "2026-09",
    activeStudentsStart: 180,
    newEnrollments: 22,
    renewedStudents: 164,
    churnedStudents: 13,
    frozenStudents: 3,
    activeStudentsEnd: 186,
    retentionRate: 92.7,
    churnRate: 7.3,
    renewalOnTimeRate: 91.0,
    targetRetentionRate: 88.0,
    atRiskCount: 4,
    status: "healthy",
    tracks: [
      { track: "robotics", trackLabel: "الروبوتكس والذكاء الاصطناعي", studentsCount: 74, retentionRate: 94.6, churnRate: 5.4 },
      { track: "coding", trackLabel: "برمجة الأطفال وتطوير الألعاب", studentsCount: 62, retentionRate: 93.5, churnRate: 6.5 },
      { track: "sports_swimming", trackLabel: "أكاديمية السباحة واللياقة", studentsCount: 32, retentionRate: 87.5, churnRate: 12.5 },
      { track: "circuits", trackLabel: "الدوائر الإلكترونية وإنترنت الأشياء", studentsCount: 18, retentionRate: 88.9, churnRate: 11.1 },
    ],
    trend: [
      { month: "2026-06", monthLabel: "يونيو", retentionRate: 90.0, churnRate: 10.0, activeCount: 168 },
      { month: "2026-07", monthLabel: "يوليو", retentionRate: 91.4, churnRate: 8.6, activeCount: 174 },
      { month: "2026-08", monthLabel: "أغسطس", retentionRate: 92.2, churnRate: 7.8, activeCount: 180 },
      { month: "2026-09", monthLabel: "سبتمبر", retentionRate: 92.7, churnRate: 7.3, activeCount: 186 },
    ],
  },
  {
    branchId: "BR-03",
    branchName: "الشيخ زايد",
    month: "2026-09",
    activeStudentsStart: 115,
    newEnrollments: 24,
    renewedStudents: 97,
    churnedStudents: 16,
    frozenStudents: 2,
    activeStudentsEnd: 121,
    retentionRate: 85.8,
    churnRate: 14.2,
    renewalOnTimeRate: 78.0,
    targetRetentionRate: 88.0,
    atRiskCount: 9,
    status: "needs_attention",
    tracks: [
      { track: "robotics", trackLabel: "الروبوتكس والذكاء الاصطناعي", studentsCount: 48, retentionRate: 89.6, churnRate: 10.4 },
      { track: "coding", trackLabel: "برمجة الأطفال وتطوير الألعاب", studentsCount: 41, retentionRate: 85.4, churnRate: 14.6 },
      { track: "circuits", trackLabel: "الدوائر الإلكترونية وإنترنت الأشياء", studentsCount: 18, retentionRate: 77.8, churnRate: 22.2 },
      { track: "soft_skills", trackLabel: "مهارات العرض والتفكير النقدي", studentsCount: 14, retentionRate: 85.7, churnRate: 14.3 },
    ],
    trend: [
      { month: "2026-06", monthLabel: "يونيو", retentionRate: 87.5, churnRate: 12.5, activeCount: 104 },
      { month: "2026-07", monthLabel: "يوليو", retentionRate: 86.8, churnRate: 13.2, activeCount: 108 },
      { month: "2026-08", monthLabel: "أغسطس", retentionRate: 86.1, churnRate: 13.9, activeCount: 115 },
      { month: "2026-09", monthLabel: "سبتمبر", retentionRate: 85.8, churnRate: 14.2, activeCount: 121 },
    ],
  },
];

export const INITIAL_AT_RISK_STUDENTS: AtRiskStudent[] = [
  {
    id: "ST-0242",
    name: "سيف مصطفى عادل",
    branch: "الشيخ زايد",
    track: "دوائر إلكترونية - مستوى 1",
    attendanceRate: 50.0,
    daysRemainingInSub: 4,
    sessionsMissed: 2,
    riskSeverity: "critical",
    riskReason: "غياب متكرر لآخر حصتين واشتراكه ينتهي خلال 4 أيام بدون حجز دورة تالية.",
    suggestedAction: "اتصال عاجل من مسؤول خدمة العملاء وعرض جلسة تعويضية مجانية.",
    status: "pending",
  },
  {
    id: "ST-0311",
    name: "فاطمة أحمد طارق",
    branch: "الشيخ زايد",
    track: "برمجة Python للأطفال",
    attendanceRate: 58.3,
    daysRemainingInSub: 6,
    sessionsMissed: 2,
    riskSeverity: "critical",
    riskReason: "انخفاض معدل الحضور إلى 58% مع شكوى سابقة من صعوبة المفاهيم.",
    suggestedAction: "جدولة مراجعة فردية مع رئيس المدربين لتشخيص نقطة الصعوبة.",
    status: "pending",
  },
  {
    id: "ST-0198",
    name: "زياد عمرو سالم",
    branch: "الشيخ زايد",
    track: "روبوتكس مستوى 2",
    attendanceRate: 66.7,
    daysRemainingInSub: 3,
    sessionsMissed: 1,
    riskSeverity: "warning",
    riskReason: "انتهاء الباقة خلال 3 أيام وتأخر الأسرة في تأكيد رغبة الاستمرار.",
    suggestedAction: "إرسال رابط تجديد مبكر بخصم 10% قبل بدء الشهر القادم.",
    status: "contacted",
    lastContactNote: "تم التواصل مع والدته، مهتمة ولكن تنتظر معرفة مواعيد السبت.",
  },
  {
    id: "ST-0418",
    name: "مريم حسام فهمي",
    branch: "مدينة نصر",
    track: "برمجة Scratch للمبتدئين",
    attendanceRate: 62.5,
    daysRemainingInSub: 5,
    sessionsMissed: 2,
    riskSeverity: "warning",
    riskReason: "تغيبت عن حصتين بداعي السفر العائلي وشارفت الباقة على الانتهاء.",
    suggestedAction: "تفعيل سياسة تجميد الاشتراك أو تقديم جلستي تعويض.",
    status: "retained",
    lastContactNote: "تم تفعيل جلسة تعويضية وتأكيد تجديد المستوى الثاني.",
  },
  {
    id: "ST-0504",
    name: "كريم وليد عثمان",
    branch: "المعادي",
    track: "أكاديمية السباحة",
    attendanceRate: 60.0,
    daysRemainingInSub: 7,
    sessionsMissed: 1,
    riskSeverity: "moderate",
    riskReason: "طلب الاستفسار عن إمكانية نقل التدريب إلى يوم الجمعة.",
    suggestedAction: "مراجعة الطاقة الاستيعابية لمجموعة الجمعة وإتاحة النقل.",
    status: "pending",
  },
];

const AT_RISK_STORAGE_KEY = "mada_at_risk_students_v1";

export const pnlAndRetentionStorage = {
  getAtRiskStudents(): AtRiskStudent[] {
    try {
      const stored = localStorage.getItem(AT_RISK_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_AT_RISK_STUDENTS;
  },

  updateStudentStatus(id: string, status: AtRiskStudent["status"], note?: string): AtRiskStudent[] {
    const list = this.getAtRiskStudents();
    const updated = list.map(item => item.id === id ? { ...item, status, ...(note ? { lastContactNote: note } : {}) } : item);
    try {
      localStorage.setItem(AT_RISK_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  getPnL(month: string, branchName?: string): { list: BranchPnLRecord[]; totals: BranchPnLRecord } {
    const period = month || "2026-09";
    const matches = PNL_RECORDS.filter(item => item.month === period && (!branchName || branchName === "كل الفروع" || item.branchName === branchName));

    const totalActiveStudents = matches.reduce((sum, item) => sum + item.activeStudents, 0);
    const totalTuition = matches.reduce((sum, item) => sum + item.tuitionRevenue, 0);
    const totalPrivate = matches.reduce((sum, item) => sum + item.privateCoachingRevenue, 0);
    const totalKits = matches.reduce((sum, item) => sum + item.kitsAndRegistrationRevenue, 0);
    const totalCompetitions = matches.reduce((sum, item) => sum + item.competitionRevenue, 0);
    const totalRevenue = matches.reduce((sum, item) => sum + item.totalRevenue, 0);

    const totalPayroll = matches.reduce((sum, item) => sum + item.trainerPayroll, 0);
    const totalLease = matches.reduce((sum, item) => sum + item.facilityLease, 0);
    const totalUtilities = matches.reduce((sum, item) => sum + item.utilitiesAndNet, 0);
    const totalEquipment = matches.reduce((sum, item) => sum + item.equipmentAndSupplies, 0);
    const totalMarketing = matches.reduce((sum, item) => sum + item.marketingAndAds, 0);
    const totalAdmin = matches.reduce((sum, item) => sum + item.adminAndMisc, 0);
    const totalExpenses = matches.reduce((sum, item) => sum + item.totalExpenses, 0);

    const grossProfit = totalRevenue - (totalPayroll + totalEquipment);
    const netProfit = totalRevenue - totalExpenses;
    const grossMarginPercent = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0;
    const netMarginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    const totals: BranchPnLRecord = {
      branchId: "ACADEMY-ALL",
      branchName: "إجمالي الأكاديمية",
      city: "مجمع",
      manager: "الإدارة التنفيذية",
      month: period,
      activeStudents: totalActiveStudents,
      tuitionRevenue: totalTuition,
      privateCoachingRevenue: totalPrivate,
      kitsAndRegistrationRevenue: totalKits,
      competitionRevenue: totalCompetitions,
      totalRevenue,
      trainerPayroll: totalPayroll,
      facilityLease: totalLease,
      utilitiesAndNet: totalUtilities,
      equipmentAndSupplies: totalEquipment,
      marketingAndAds: totalMarketing,
      adminAndMisc: totalAdmin,
      totalExpenses,
      grossProfit,
      grossMarginPercent,
      netProfit,
      netMarginPercent,
      revenueContributionPercent: 100,
      revenuePerStudent: totalActiveStudents > 0 ? Math.round(totalRevenue / totalActiveStudents) : 0,
      costPerStudent: totalActiveStudents > 0 ? Math.round(totalExpenses / totalActiveStudents) : 0,
      profitPerStudent: totalActiveStudents > 0 ? Math.round(netProfit / totalActiveStudents) : 0,
    };

    return { list: matches, totals };
  },

  getRetention(month: string, branchName?: string): { list: BranchRetentionRecord[]; aggregate: { retentionRate: number; churnRate: number; totalStudents: number; totalAtRisk: number } } {
    const period = month || "2026-09";
    const matches = RETENTION_RECORDS.filter(item => item.month === period && (!branchName || branchName === "كل الفروع" || item.branchName === branchName));

    const totalStart = matches.reduce((sum, item) => sum + item.activeStudentsStart, 0);
    const totalRenewed = matches.reduce((sum, item) => sum + item.renewedStudents, 0);
    const totalChurned = matches.reduce((sum, item) => sum + item.churnedStudents, 0);
    const totalEnd = matches.reduce((sum, item) => sum + item.activeStudentsEnd, 0);
    const totalAtRisk = matches.reduce((sum, item) => sum + item.atRiskCount, 0);

    const retentionRate = totalStart > 0 ? Number(((totalRenewed / totalStart) * 100).toFixed(1)) : 0;
    const churnRate = totalStart > 0 ? Number(((totalChurned / totalStart) * 100).toFixed(1)) : 0;

    return {
      list: matches,
      aggregate: {
        retentionRate,
        churnRate,
        totalStudents: totalEnd,
        totalAtRisk,
      },
    };
  },

  downloadCSV(month: string) {
    const { list, totals } = this.getPnL(month);
    const { list: retentionList, aggregate } = this.getRetention(month);

    const rows: (string | number)[][] = [
      ["تقرير الأرباح والخسائر ونسبة الاستبقاء - أكاديمية مدى", month],
      [""],
      ["=== 1. قائمة الأرباح والخسائر (P&L Summary) ==="],
      [
        "الفرع",
        "الطلاب النشطون",
        "إيرادات الاشتراكات",
        "التدريب الخاص",
        "رسوم الحقائب والتسجيل",
        "رسوم البطولات",
        "إجمالي الإيرادات",
        "أجور المدربين",
        "الإيجار",
        "المرافق والإنترنت",
        "المستهلكات والتجهيزات",
        "التسويق",
        "المصروفات الإدارية",
        "إجمالي المصروفات",
        "صافي الربح",
        "هامش الربح %",
        "متوسط إيراد الطالب",
        "تكلفة الطالب",
        "ربح الطالب",
      ],
      ...list.map(b => [
        b.branchName,
        b.activeStudents,
        b.tuitionRevenue,
        b.privateCoachingRevenue,
        b.kitsAndRegistrationRevenue,
        b.competitionRevenue,
        b.totalRevenue,
        b.trainerPayroll,
        b.facilityLease,
        b.utilitiesAndNet,
        b.equipmentAndSupplies,
        b.marketingAndAds,
        b.adminAndMisc,
        b.totalExpenses,
        b.netProfit,
        `${b.netMarginPercent}%`,
        b.revenuePerStudent,
        b.costPerStudent,
        b.profitPerStudent,
      ]),
      [
        totals.branchName,
        totals.activeStudents,
        totals.tuitionRevenue,
        totals.privateCoachingRevenue,
        totals.kitsAndRegistrationRevenue,
        totals.competitionRevenue,
        totals.totalRevenue,
        totals.trainerPayroll,
        totals.facilityLease,
        totals.utilitiesAndNet,
        totals.equipmentAndSupplies,
        totals.marketingAndAds,
        totals.adminAndMisc,
        totals.totalExpenses,
        totals.netProfit,
        `${totals.netMarginPercent}%`,
        totals.revenuePerStudent,
        totals.costPerStudent,
        totals.profitPerStudent,
      ],
      [""],
      ["=== 2. تحليلات استبقاء الطلاب (Retention & Churn) ==="],
      ["الفرع", "الطلاب بداية الشهر", "تسجيلات جديدة", "تجديد في الموعد", "تسرب (عدم تجديد)", "حسابات مجمدة", "الطلاب نهاية الشهر", "معدل الاستبقاء %", "معدل التسرب %", "معرضون للتسرب"],
      ...retentionList.map(r => [
        r.branchName,
        r.activeStudentsStart,
        r.newEnrollments,
        r.renewedStudents,
        r.churnedStudents,
        r.frozenStudents,
        r.activeStudentsEnd,
        `${r.retentionRate}%`,
        `${r.churnRate}%`,
        r.atRiskCount,
      ]),
      ["الإجمالي المجمع", "-", "-", "-", "-", "-", aggregate.totalStudents, `${aggregate.retentionRate}%`, `${aggregate.churnRate}%`, aggregate.totalAtRisk],
    ];

    const csvContent = "\ufeff" + rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mada-academy-pnl-retention-${month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};

export type AuthMe = {
  id: string;
  accountType: string;
  role: string;
  roleLabel?: string;
  tenantId: string;
  branchId?: string | null;
  scopeLevel: string;
  permissions?: string[];
  user?: { id: string; displayName: string | null; email: string | null; phone: string };
  academy?: { id: string; name: string; slug: string; status: string; planCode: string };
  branches?: Array<{ id: string; name: string; code: string; status: string }>;
};

export type PlatformOverview = { academies: number; activeAcademies: number; trialAcademies: number; attentionAcademies: number; staffAccounts: number; activeSessions: number; auditEvents: number };
export type PlatformAcademy = { id: string; name: string; slug: string; status: string; plan: string; createdAt: string; branches: number; users: number; owner: string | null };
export type PlatformAcademiesResponse = { items: PlatformAcademy[]; total: number };
export type PlatformActivity = { id: string; action: string; targetType: string; targetId: string; tenantId: string | null; actorUserId: string | null; reason: string | null; createdAt: string; tenantName: string | null; actorName: string | null };
export type PlatformActivityResponse = { items: PlatformActivity[]; total: number };
export type PlatformMember = { membershipId: string; userId: string; name: string | null; maskedEmail: string | null; maskedPhone: string; roleCode: string; membershipStatus: string; userStatus: string; lastLoginAt: string | null; activeSessions: number; lastSessionAt: string | null; branch: { id: string; name: string; code: string } | null };
export type PlatformRole = { code: string; label: string; scope: string; permissions: string[]; assignmentMode: string; canSelfAssign: boolean };
export type ExecutiveActivityItem = { id: string; source: "AUDIT" | "DECISION"; action: string; targetType: string; targetId: string; branchId: string | null; actorUserId: string | null; actorName: string | null; occurredAt: string; reason: string | null; state: string | null };
export type AcademyAuditEventItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  tenantId: string;
  branchId: string | null;
  actorUserId: string | null;
  actorName: string | null;
  reason: string | null;
  metadataJson: string | null;
  ipAddress: string | null;
  createdAt: string;
};
export type AcademyAuditEventsResponse = {
  items: AcademyAuditEventItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  tenantId: string;
};
export type ExecutiveBranchOption = { id: string; name: string; code: string; status: string };
export type ExecutiveMetrics = {
  activeStudents: number;
  activeEnrollments: number;
  sessions: number;
  completedSessions: number;
  attendedCount: number;
  attendanceMarkedCount: number;
  attendancePercent: number | null;
  collectedPiastres: number;
  approvedExpensesPiastres: number;
  netPiastres: number;
  pendingApprovals: number;
};
export type ExecutiveBranchMetrics = ExecutiveMetrics & {
  branchId: string;
  branchName: string;
  branchCode: string;
  branchStatus: string;
};
export type ExecutiveDashboardReport = {
  tenantId: string;
  from: string | null;
  to: string | null;
  selectedBranchId: string | null;
  availableBranches: ExecutiveBranchOption[];
  summary: ExecutiveMetrics;
  branches: ExecutiveBranchMetrics[];
  branchesWithoutStudentData: number;
  alerts: Array<{ code: string; severity: "warning"; title: string; detail: string; branchId: string | null; branchName: string | null }>;
  dataSources: Record<string, string>;
};

export type BootstrapAcademyInput = {
  name: string;
  slug?: string;
  planCode?: string;
  primaryBranch: { name: string; code: string };
  owner: { fullName: string; phone: string; email: string; password: string };
};

export type BootstrapAcademyResponse = {
  academy: { id: string; name: string; slug: string; status: string; planCode: string };
  primaryBranch: { id: string; tenantId: string; name: string; code: string; status: string };
  owner: { id: string; displayName: string; email: string; phone: string; role: string };
  nextStep: "OWNER_LOGIN_REQUIRED" | string;
};

export type PermissionDetail = {
  code: string;
  label: string;
  category: string;
  description: string;
};

export type AcademyRoleDefinition = {
  code: string;
  label: string;
  scopeLevel: string;
  description: string;
  permissions: string[];
  defaultPermissions?: string[];
  isCustomized?: boolean;
  assignableByAcademyOwner: boolean;
};

export type AcademyMember = {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string;
  phone: string;
  userStatus: string;
  roleCode: string;
  scopeLevel: string;
  membershipStatus: string;
  branch: { id: string; name: string; code: string } | null;
  customPermissions?: string[] | null;
  effectivePermissions?: string[];
  hasCustomPermissions?: boolean;
};

export type AcademyRolesResponse = {
  roles: AcademyRoleDefinition[];
  permissions: string[];
  permissionDetails?: PermissionDetail[];
};
export type AcademyMembersResponse = { items: AcademyMember[]; total: number; tenantId: string };
export type AcademyBranch = {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  status: "ACTIVE" | "INACTIVE" | string;
  membersCount: number;
  studentsCount: number;
  createdAt: string;
};
export type AcademyBranchesResponse = { items: AcademyBranch[]; total: number; tenantId: string };
export type AcademyClassroom = {
  id: string;
  branchId: string;
  branch: { name: string; code: string };
  name: string;
  capacity: number;
  status: "AVAILABLE" | "MAINTENANCE" | "INACTIVE" | string;
  sessionsCount: number;
  offeringsCount: number;
  createdAt: string;
  updatedAt: string;
};
export type AcademyClassroomsResponse = { items: AcademyClassroom[]; total: number; tenantId: string; branchId?: string | null };
export type ClassroomResource = {
  id: string;
  classroomId: string;
  kind: "SEATING" | "EQUIPMENT" | string;
  name: string;
  quantity: number;
  status: "AVAILABLE" | "MAINTENANCE" | "INACTIVE" | string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ClassroomResourcesResponse = { items: ClassroomResource[]; total: number; classroom: { id: string; name: string; branchId: string } };
export type SchedulingClassroom = { id: string; branchId: string; branchName: string; branchCode: string; name: string; capacity: number; status: string };
export type SchedulingClassroomsResponse = { items: SchedulingClassroom[]; total: number; branchId?: string | null };

export type DashboardSummary = {
  students: number;
  activeEnrollments: number;
  upcomingSessions: number;
  completedSessions: number;
  branchCount: number;
  upcoming: Array<{ id: string; sessionNumber: number; startAt: string; status: string }>;
};
export type CourseTemplateRecord = {
  id: string; name: string; track: string; type: string; ageGroup: string; level: string;
  totalSessions: number; sessionDurationHours: number; basePricePiastres: number; status: string;
};
export type CourseTemplatesResponse = { items: CourseTemplateRecord[]; total: number };
export type SchedulingInstructor = { id: string; name: string | null; roleCode: string; branchId: string | null };
export type SchedulingInstructorsResponse = { items: SchedulingInstructor[]; total: number; branchId: string | null };
export type GroupRecord = {
  id: string; courseTemplateId: string; courseName: string; track: string; branchId: string; branchName: string;
  instructorId: string; instructorName: string | null; classroomId: string; classroomName: string;
  startDate: string; endDate: string; weeklyScheduleJson: string; status: string; maxStudents: number; enrolledStudents: number;
};
export type GroupsResponse = { items: GroupRecord[]; total: number };
export type SupervisionAssignment = {
  assignmentId: string;
  supervisorUserId: string;
  supervisorName: string | null;
  canReadAttendance: boolean;
  canReadEvaluations: boolean;
  canDecideEvaluations: boolean;
  startsAt: string | null;
  endsAt: string | null;
  isCurrentlyEffective: boolean;
};
export type BranchSupervisionGroup = {
  id: string;
  courseName: string;
  instructorId: string;
  instructorName: string | null;
  startDate: string;
  endDate: string;
  status: string;
  enrolledStudents: number;
  maxStudents: number;
  assignments: SupervisionAssignment[];
};
export type BranchSupervisionGroupsResponse = { items: BranchSupervisionGroup[]; total: number; branchId: string };
export type MySupervisionGroup = { assignmentId: string; groupId: string; courseName: string; startDate: string; endDate: string; status: string; canReadAttendance: boolean; canReadEvaluations: boolean; canDecideEvaluations: boolean };
export type MySupervisionGroupsResponse = { items: MySupervisionGroup[]; total: number; branchId: string };

export type StudentRecord = {
  id: string;
  branchId: string;
  fullName: string;
  dateOfBirth: string | null;
  status: string;
  activeEnrollmentCount: number;
};

export type StudentListResponse = {
  items: StudentRecord[];
  total: number;
  scopeLevel: string;
  branchId: string | null;
};

export type SessionRecord = {
  id: string;
  branchId: string;
  courseOfferingId: string | null;
  sessionNumber: number;
  startAt: string;
  endAt: string;
  instructorId: string;
  substituteInstructorId?: string | null;
  classroomId: string;
  type: string;
  status: string;
  notes: string | null;
  completedAt: string | null;
  instructorName?: string | null;
  classroomName?: string | null;
  branchName?: string | null;
  courseName?: string | null;
};

export type SessionListResponse = {
  items: SessionRecord[];
  total: number;
  scopeLevel: string;
  branchId: string | null;
};

export type CreateGroupInput = {
  branchId: string; courseTemplateId: string; instructorId: string; classroomId: string;
  startDate: string; endDate: string; daysOfWeek: number[]; startTime: string;
  durationMinutes: number; maxStudents: number; studentIds?: string[];
  finalPricePiastres?: number; notes?: string;
};
export type CreateGroupResponse = { groupId: string; courseTemplateId: string; sessionsCreated: number; studentCount: number; classroomId: string; instructorId: string };
export type ApprovalRequestRecord = { id: string; tenantId: string; branchId: string | null; branchName?: string | null; requestType: string; targetType: string; targetId: string; submittedByRole: string; state: string; reason: string | null; createdAt: string; decidedAt: string | null; decidedByUserId: string | null; proposedInstructorId: string | null; sessionStartAt?: string | null; sessionEndAt?: string | null; sessionNumber?: number | null; courseName?: string | null; instructorName?: string | null };
export type ApprovalListResponse = { items: ApprovalRequestRecord[]; total: number };
export type NotificationRecord = { id: string; tenantId: string; branchId: string | null; recipientUserId: string; type: string; title: string; body: string; targetType: string | null; targetId: string | null; isRead: boolean; createdAt: string };
export type NotificationListResponse = { items: NotificationRecord[]; total: number };

export type AttendanceItem = {
  studentId: string;
  studentName: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | "UNMARKED" | string;
  lateMinutes: number | null;
  updatedAt: string | null;
};

export type AttendanceResponse = {
  sessionId: string;
  sessionStatus: string;
  items: AttendanceItem[];
  total: number;
};
export type SessionCompletionResponse = { sessionId: string; status: string; completedAt: string };

export type AttendanceRecordInput = {
  studentId: string;
  status: Exclude<AttendanceItem["status"], "UNMARKED">;
  lateMinutes?: number | null;
};
export type SessionEvaluationStatus = "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "PUBLISHED";
export type SessionEvaluationRecord = {
  studentId: string; score: number | null; notes: string | null; status: SessionEvaluationStatus;
  reviewNote: string | null; submittedAt: string | null; reviewedAt: string | null;
};
export type SessionEvaluationListResponse = { sessionId: string; items: SessionEvaluationRecord[]; total: number };
export type EvaluationStatusSummary = { branchId: string; counts: Record<SessionEvaluationStatus, number> };
export type EvaluationReviewRecord = {
  id: string; sessionId: string; studentId: string; studentName: string; courseName: string;
  instructorName: string | null; score: number | null; notes: string | null; submittedAt: string | null; sessionDate: string; canDecide: boolean;
};
export type EvaluationReviewQueueResponse = { items: EvaluationReviewRecord[]; total: number };
export type ConsumerStudentRecord = { id: string; name: string; branchId: string; branchName: string | null; relationship: string };
export type ConsumerStudentsResponse = { items: ConsumerStudentRecord[]; total: number };
export type ConsumerSessionRecord = {
  sessionId: string; studentId: string; studentName: string; sessionNumber: number; startAt: string; endAt: string;
  status: string; courseName: string; branchName: string; classroomName: string; attendanceStatus: string;
  score: number | null; notes: string | null;
};
export type ConsumerSessionsResponse = { items: ConsumerSessionRecord[]; total: number };
export type ConsumerLinksResponse = {
  studentId: string;
  studentAccount: { id: string; name: string | null; phone: string; email: string | null } | null;
  guardians: Array<{ id: string; name: string | null; phone: string; email: string | null; relationship: string; status: string }>;
  totalGuardians: number;
};
export type ConsumerAccountLookupRecord = { id: string; name: string | null; accountType: "parent" | "student"; maskedPhone: string };
export type ConsumerAccountLookupResponse = { items: ConsumerAccountLookupRecord[]; total: number };
export type ConsumerInvitationPreview = { accountType: "parent" | "student"; maskedPhone: string; expiresAt: string; otpExpiresAt: string; displayNameRequired: boolean };
export type ConsumerInvitationDelivery = { status?: string; maskedPhone: string; expiresAt?: string; otpExpiresAt: string; delivery: string; developmentCode?: string | null; debugAcceptUrl?: string | null };
export type FinancePayment = { id: string; invoiceId: string; amountPiastres: number; method: string; receivedOn: string; externalReference?: string | null; note?: string | null; createdAt: string; evidenceStatus: string; evidenceFileName?: string | null };
export type FinanceInvoice = { id: string; invoiceNumber: string; tenantId: string; branchId: string; branchName?: string | null; studentId: string; studentName?: string | null; enrollmentId?: string | null; issueDate: string; dueDate: string; totalPiastres: number; paidPiastres: number; remainingPiastres: number; status: string; lines: Array<{ description: string; amountPiastres: number }>; payments: FinancePayment[] };
export type FinanceInvoicesResponse = { items: FinanceInvoice[]; total: number };
export type FinanceExpense = { id: string; tenantId: string; branchId: string; branchName?: string | null; description: string; category: string; amountPiastres: number; spentOn: string; createdAt: string; status: string; createdByUserId: string; approvalRequestId?: string | null; approvalReason?: string | null; decidedAt?: string | null; decidedByUserId?: string | null; evidenceStatus: string; evidenceFileName?: string | null };
export type FinanceExpensesResponse = { items: FinanceExpense[]; total: number };
export type FinanceReport = { from: string | null; to: string | null; totalBilledPiastres: number; totalCollectedPiastres: number; totalOutstandingPiastres: number; approvedExpensesPiastres: number; netPiastres: number; branches: Array<{ branchId: string; branchName: string; invoiceCount: number; collectedPiastres: number; approvedExpensesPiastres: number; netPiastres: number }> };
export type OperationalReport = { from: string | null; to: string | null; branchId: string | null; activeStudents: number; activeEnrollments: number; sessions: number; completedSessions: number; attendanceMarkedCount: number; attendedCount: number; attendancePercent: number | null; invoiceCount: number; totalBilledPiastres: number; totalCollectedPiastres: number; totalOutstandingPiastres: number; paymentsMissingEvidence: number; pendingExpenses: number; approvedExpenses: number; approvedExpensesPiastres: number };
export type InvoiceCorrection = { id: string; tenantId: string; branchId: string; invoiceId: string; invoiceNumber?: string | null; studentName?: string | null; approvalRequestId: string; requestedByUserId: string; currentTotalPiastres: number; currentDueDate: string; proposedTotalPiastres: number; proposedDueDate: string; reason: string; status: string; decidedAt?: string | null; decidedByUserId?: string | null; createdAt: string };
export type InvoiceCorrectionsResponse = { items: InvoiceCorrection[]; total: number };

export type RetentionRadarItem = {
  studentId: string;
  fullName: string;
  branchId: string;
  branchName: string;
  courseOfferingId: string;
  courseName: string;
  totalSessionsMarked: number;
  attendancePercent: number;
  consecutiveAbsences: number;
  averageScore: number | null;
  totalBilledPiastres: number;
  totalPaidPiastres: number;
  outstandingPiastres: number;
  maxOverdueDays: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | string;
  riskFactor: string;
  recommendedAction: string;
};

export type RetentionRadarResponse = {
  summary: {
    totalStudents: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    atRiskPercent: number;
  };
  items: RetentionRadarItem[];
};

export type InstructorScorecardItem = {
  instructorId: string;
  displayName: string;
  branchId: string | null;
  branchName: string;
  assignedSessions: number;
  completedSessions: number;
  completionRate: number;
  substituteCount: number;
  studentAttendanceRate: number;
  averageEvaluationScore: number | null;
  totalEvaluationsCount: number;
};

export type CourseProfitabilityItem = {
  courseOfferingId: string;
  courseName: string;
  track: string;
  branchId: string;
  branchName: string;
  classroomName: string;
  enrolledCount: number;
  capacity: number;
  occupancyPercent: number;
  totalBilledPiastres: number;
  totalCollectedPiastres: number;
  outstandingPiastres: number;
  status: string;
};

export type CashierShiftSummary = {
  date: string;
  tenantId: string;
  branchId: string | null;
  transactionCount: number;
  cashTotalPiastres: number;
  visaTotalPiastres: number;
  instapayTotalPiastres: number;
  vodafoneTotalPiastres: number;
  cashExpensesPiastres: number;
  expectedCashDrawerPiastres: number;
  totalCollectedPiastres: number;
};

export type CloseoutCashierResponse = {
  date: string;
  closedAt: string;
  closedByUserId: string;
  expectedCashPiastres: number;
  countedCashPiastres: number;
  discrepancyPiastres: number;
  status: "BALANCED" | "SURPLUS" | "DEFICIT" | string;
  notes: string | null;
};

export type CompetitionSummaryItem = {
  id: string;
  name: string;
  organizer: string;
  season: string;
  track: string;
  ageMin: number;
  ageMax: number;
  registrationDeadline: string | null;
  eventDate: string | null;
  location: string | null;
  status: string;
  teamsCount: number;
  awardsCount: number;
  createdAt: string;
};

export type CompetitionDetailItem = CompetitionSummaryItem & {
  notes: string | null;
};

export type CompetitionTeamMemberItem = {
  id: string;
  teamId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  roleInTeam: string;
  joinedAt: string;
  status: string;
};

export type CompetitionTeamItem = {
  id: string;
  competitionId: string;
  branchId: string;
  branchName: string;
  name: string;
  coachInstructorId: string;
  coachName: string;
  classroomId: string | null;
  kitId: string | null;
  kitCode: string | null;
  projectTitle: string | null;
  projectDescription: string | null;
  status: string;
  members: CompetitionTeamMemberItem[];
  createdAt: string;
};

export type HallOfFameCardItem = {
  id: string;
  title: string;
  rank: number | null;
  awardDate: string;
  competitionName: string;
  organizer: string;
  season: string;
  track: string;
  teamName: string;
  projectTitle: string | null;
  coachName: string;
  branchName: string;
  studentNames: string[];
  certificateUrl: string | null;
  photosJson: string | null;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly source?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export type ApiErrorEvent = { error: ApiRequestError; path: string; method: string };
type ApiErrorListener = (event: ApiErrorEvent) => void;
const apiErrorListeners = new Set<ApiErrorListener>();
export function subscribeApiErrors(listener: ApiErrorListener) {
  apiErrorListeners.add(listener);
  return () => { apiErrorListeners.delete(listener); };
}
function emitApiError(event: ApiErrorEvent) {
  apiErrorListeners.forEach(listener => listener(event));
}

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

const API_BASE = (import.meta.env.VITE_API_URL || "https://academy-dashboard.runasp.net/api/v1").replace(/\/$/, "");
const ACCESS_KEY = "mada.accessToken";
const REFRESH_KEY = "mada.refreshToken";

let accessToken = localStorage.getItem(ACCESS_KEY);

function saveTokens(tokens: TokenResponse) {
  accessToken = tokens.accessToken;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens() {
  accessToken = null;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    clearTokens();
    return false;
  }
  saveTokens((await response.json()).data as TokenResponse);
  return true;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (cause) {
    const error = new ApiRequestError(cause instanceof Error ? cause.message : "Network request failed", 0);
    emitApiError({ error, path, method: (init.method ?? "GET").toUpperCase() });
    throw error;
  }
  if (response.status === 401 && retry && await refreshAccessToken()) return request<T>(path, init, false);
  if (!response.ok) {
    const body = await response.text();
    let message = response.status === 401 ? "رقم الهاتف أو كلمة المرور غير صحيحة." : body || `API request failed: ${response.status}`;
    let code: string | undefined;
    let source: string | undefined;
    try {
      const payload = JSON.parse(body) as { title?: string; detail?: string; extensions?: { code?: string }; error?: { message?: string; code?: string; source?: string } };
      message = payload.detail || payload.error?.message || payload.title || message;
      code = payload.extensions?.code || payload.error?.code;
      source = payload.error?.source;
    } catch {
      // Keep the raw response when the backend does not return JSON.
    }
    const error = new ApiRequestError(message, response.status, code, source);
    emitApiError({ error, path, method: (init.method ?? "GET").toUpperCase() });
    throw error;
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json();
  return (payload.data ?? payload) as T;
}

export const apiClient = {
  baseUrl: API_BASE,
  hasSession: () => Boolean(accessToken),
  login: async (phone: string, password: string, accountType: "staff" | "parent" | "student" = "staff") => {
    const response = await request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ phone, password, accountType }) }, false);
    saveTokens(response);
    return response;
  },
  sendOtp: (phone: string, accountType: "staff" | "parent" | "student" = "staff") => request<{ expiresAt: string; developmentCode?: string }>("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone, accountType }) }),
  verifyOtp: async (phone: string, code: string, accountType: "staff" | "parent" | "student" = "staff") => {
    const response = await request<TokenResponse>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code, accountType }) }, false);
    saveTokens(response);
    return response;
  },
  acceptConsumerInvitation: async (input: { token: string; code: string; fullName?: string; email?: string; password: string }) => {
    const response = await request<TokenResponse>("/consumer-invitations/accept", { method: "POST", body: JSON.stringify(input) }, false);
    saveTokens(response);
    return response;
  },
  previewConsumerInvitation: (token: string) => request<ConsumerInvitationPreview>("/consumer-invitations/preview", { method: "POST", body: JSON.stringify({ token }) }, false),
  resendConsumerInvitationCode: (token: string) => request<ConsumerInvitationDelivery>("/consumer-invitations/resend-code", { method: "POST", body: JSON.stringify({ token }) }, false),
  me: () => request<AuthMe>("/me"),
  platformOverview: () => request<PlatformOverview>("/platform/overview"),
  platformAcademies: () => request<PlatformAcademiesResponse>("/platform/academies"),
  platformRoles: () => request<{ items: PlatformRole[] }>("/platform/roles"),
  changePlatformAcademyStatus: (tenantId: string, status: "ACTIVE" | "TRIAL" | "SETUP" | "PAUSED", reason: string) => request<{ id: string; status: string; revokedSessions: number }>(`/platform/academies/${tenantId}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) }),
  changePlatformAcademyPlan: async (tenantId: string, planCode: "starter" | "growth" | "enterprise", branchesLimit: number, reason: string) => {
    try {
      return await request<{ tenantId: string; planCode: string; allowedBranches: number }>(`/platform/academies/${tenantId}/plan`, {
        method: "PUT",
        body: JSON.stringify({ planCode, branchesLimit, reason }),
      });
    } catch {
      return platformSaaSStorage.updatePlan(tenantId, planCode, branchesLimit);
    }
  },
  extendPlatformAcademyTrial: async (tenantId: string, daysToAdd = 7, reason: string) => {
    try {
      return await request<{ tenantId: string; newEndDate: string; isTrialExtended: boolean }>(`/platform/academies/${tenantId}/trial/extend`, {
        method: "POST",
        body: JSON.stringify({ daysToAdd, reason }),
      });
    } catch {
      return platformSaaSStorage.extendTrial(tenantId, daysToAdd);
    }
  },
  resetPlatformOwnerPassword: async (tenantId: string, ownerName: string, ownerPhone: string, reason: string) => {
    try {
      return await request<PlatformOwnerResetResult>(`/platform/academies/${tenantId}/owner-reset`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    } catch {
      return platformSaaSStorage.generateOwnerTempPassword(tenantId, ownerName, ownerPhone);
    }
  },
  recordPlatformSubscriptionPayment: async (input: Omit<PlatformPaymentRecord, "id" | "receivedAt">) => {
    try {
      return await request<PlatformPaymentRecord>(`/platform/academies/${input.tenantId}/payments`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch {
      return platformSaaSStorage.recordPayment(input);
    }
  },
  getPlatformPayments: (tenantId?: string) => platformSaaSStorage.getPayments(tenantId),
  getPlatformTenantExtra: (tenantId: string, defaultPlan?: string) => platformSaaSStorage.getTenantExtra(tenantId, defaultPlan),
  platformAcademyMembers: (tenantId: string, search = "") => { const query = new URLSearchParams(); if (search.trim()) query.set("search", search.trim()); const suffix = query.toString() ? `?${query.toString()}` : ""; return request<{ items: PlatformMember[]; total: number; tenantId: string }>(`/platform/academies/${tenantId}/members${suffix}`); },
  changePlatformMemberStatus: (tenantId: string, membershipId: string, status: "ACTIVE" | "REVOKED", reason: string) => request<{ membershipId: string; userId: string; status: string; revokedSessions: number }>(`/platform/academies/${tenantId}/members/${membershipId}/status`, { method: "PATCH", body: JSON.stringify({ status, reason }) }),
  revokePlatformUserSessions: (tenantId: string, userId: string, reason: string) => request<{ userId: string; tenantId: string; revokedCount: number }>(`/platform/academies/${tenantId}/users/${userId}/sessions/revoke`, { method: "POST", body: JSON.stringify({ reason }) }),
  platformAcademyActivity: (tenantId: string) => request<PlatformActivityResponse>(`/platform/academies/${tenantId}/activity`),
  platformActivity: () => request<PlatformActivityResponse>("/platform/activity"),
  bootstrapAcademy: (input: BootstrapAcademyInput) =>
    request<BootstrapAcademyResponse>("/platform/academies", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  academyRoles: () => request<AcademyRolesResponse>("/academy/roles"),
  academyBranches: () => request<AcademyBranchesResponse>("/academy/branches"),
  addAcademyBranch: (input: { name: string; code: string }) =>
    request<AcademyBranch>("/academy/branches", { method: "POST", body: JSON.stringify(input) }),
  updateAcademyBranch: (branchId: string, input: { name: string; code: string }) =>
    request<Pick<AcademyBranch, "id" | "tenantId" | "name" | "code" | "status">>(`/academy/branches/${branchId}`, { method: "PUT", body: JSON.stringify(input) }),
  changeAcademyBranchStatus: (branchId: string, status: "ACTIVE" | "INACTIVE") =>
    request<Pick<AcademyBranch, "id" | "status">>(`/academy/branches/${branchId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  academyClassrooms: (branchId?: string) => request<AcademyClassroomsResponse>(`/academy/classrooms${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`),
  addAcademyClassroom: (input: { branchId: string; name: string; capacity: number }) =>
    request<AcademyClassroom>("/academy/classrooms", { method: "POST", body: JSON.stringify(input) }),
  updateAcademyClassroom: (classroomId: string, input: { name: string; capacity: number }) =>
    request<Pick<AcademyClassroom, "id" | "branchId" | "name" | "capacity" | "status" | "updatedAt">>(`/academy/classrooms/${classroomId}`, { method: "PUT", body: JSON.stringify(input) }),
  changeAcademyClassroomStatus: (classroomId: string, status: "AVAILABLE" | "MAINTENANCE" | "INACTIVE") =>
    request<Pick<AcademyClassroom, "id" | "status" | "updatedAt">>(`/academy/classrooms/${classroomId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  classroomResources: (classroomId: string) => request<ClassroomResourcesResponse>(`/academy/classrooms/${classroomId}/resources`),
  addClassroomResource: (classroomId: string, input: { kind: "SEATING" | "EQUIPMENT"; name: string; quantity: number; status: string; notes?: string }) =>
    request<ClassroomResource>(`/academy/classrooms/${classroomId}/resources`, { method: "POST", body: JSON.stringify(input) }),
  updateClassroomResource: (classroomId: string, resourceId: string, input: { kind: "SEATING" | "EQUIPMENT"; name: string; quantity: number; status: string; notes?: string }) =>
    request<ClassroomResource>(`/academy/classrooms/${classroomId}/resources/${resourceId}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteClassroomResource: (classroomId: string, resourceId: string) => request<void>(`/academy/classrooms/${classroomId}/resources/${resourceId}`, { method: "DELETE" }),
  schedulingClassrooms: (branchId?: string) => request<SchedulingClassroomsResponse>(`/scheduling/classrooms${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`),
  schedulingInstructors: (branchId?: string) => request<SchedulingInstructorsResponse>(`/scheduling/instructors${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`),
  courseTemplates: () => request<CourseTemplatesResponse>("/scheduling/course-templates"),
  createCourseTemplate: (input: Omit<CourseTemplateRecord, "id" | "status">) => request<CourseTemplateRecord>("/scheduling/course-templates", { method: "POST", body: JSON.stringify(input) }),
  listGroups: () => request<GroupsResponse>("/scheduling/groups"),
  branchSupervisionGroups: () => request<BranchSupervisionGroupsResponse>("/supervision/branch-groups"),
  mySupervisionGroups: () => request<MySupervisionGroupsResponse>("/supervision/my-groups"),
  grantGroupSupervision: (input: { supervisorUserId: string; courseOfferingId: string; canReadAttendance: boolean; canReadEvaluations: boolean; canDecideEvaluations: boolean; startsAt?: string; endsAt?: string }) =>
    request<{ assignmentId: string }>("/supervision/assignments", { method: "POST", body: JSON.stringify(input) }),
  revokeGroupSupervision: (assignmentId: string) => request<void>(`/supervision/assignments/${assignmentId}`, { method: "DELETE" }),
  checkSchedulingConflict: (input: { branchId: string; instructorId: string; classroomId: string; startAt: string; endAt: string; studentIds?: string[]; kits?: Array<{ kitId: string; quantity: number }> }) =>
    request<{ hasConflict: boolean; conflicts: { instructorSessions: string[]; classroomSessions: string[]; students: string[]; kits: string[]; branchHours: boolean } }>("/scheduling/check-conflict", { method: "POST", body: JSON.stringify({ ...input, studentIds: input.studentIds ?? [], kits: input.kits ?? [] }) }),
  createGroup: (input: CreateGroupInput) => request<CreateGroupResponse>("/scheduling/groups", { method: "POST", body: JSON.stringify(input) }),
  createSession: (input: { branchId: string; classroomId: string; instructorId: string; startAt: string; endAt: string; sessionNumber: number; courseOfferingId?: string; type?: string; notes?: string; studentIds?: string[]; kits?: Array<{ kitId: string; quantity: number }> }) =>
    request<{ sessionId: string; status: string; sessionNumber: number; startAt: string; endAt: string; classroomId: string; instructorId: string }>("/scheduling/sessions", { method: "POST", body: JSON.stringify(input) }),
  requestSession: (input: { type: "EXTRA" | "MAKEUP"; branchId: string; classroomId: string; startAt: string; endAt: string; sessionNumber: number; studentIds?: string[]; courseOfferingId?: string; instructorId?: string; reason?: string; notes?: string }) =>
    request<{ approvalId: string; sessionId: string; state: string; type?: string }>("/scheduling/session-requests", { method: "POST", body: JSON.stringify(input) }),
  requestSubstitution: (sessionId: string, reason: string) => request<{ approvalId: string; sessionId: string; state: string }>(`/scheduling/sessions/${sessionId}/substitution-requests`, { method: "POST", body: JSON.stringify({ reason }) }),
  proposeSubstitute: (approvalId: string, message?: string) => request<{ approvalId: string; proposedInstructorId: string }>(`/scheduling/approvals/${approvalId}/proposals`, { method: "POST", body: JSON.stringify({ message }) }),
  listApprovals: (state: "ALL" | "PENDING" | "APPROVED" | "REJECTED" = "ALL") => request<ApprovalListResponse>(`/scheduling/approvals?state=${state}`),
  decideApproval: (approvalId: string, input: { decision: "APPROVED" | "REJECTED"; assignedInstructorId?: string; reason?: string }) => request<{ approvalId: string; state: string; sessionId: string; sessionStatus: string; substituteInstructorId: string | null }>(`/scheduling/approvals/${approvalId}/decision`, { method: "POST", body: JSON.stringify(input) }),
  saveSessionEvaluations: (sessionId: string, items: Array<{ studentId: string; score?: number | null; notes?: string }>) => request<{ sessionId: string; saved: number }>(`/scheduling/sessions/${sessionId}/evaluations`, { method: "PUT", body: JSON.stringify({ items }) }),
  listSessionEvaluations: (sessionId: string) => request<SessionEvaluationListResponse>(`/scheduling/sessions/${sessionId}/evaluations`),
  submitSessionEvaluations: (sessionId: string, studentIds: string[]) => request<{ sessionId: string; submitted: number; status: string }>(`/scheduling/sessions/${sessionId}/evaluations/submit`, { method: "POST", body: JSON.stringify({ studentIds }) }),
  listEvaluationReviews: () => request<EvaluationReviewQueueResponse>("/scheduling/evaluation-reviews"),
  evaluationStatusSummary: () => request<EvaluationStatusSummary>("/scheduling/evaluation-status-summary"),
  decideEvaluationReview: (evaluationId: string, input: { decision: "PUBLISH" | "REQUEST_CHANGES"; note?: string }) => request<{ evaluationId: string; sessionId: string; status: string; reviewedAt: string; publishedAt: string | null }>(`/scheduling/evaluation-reviews/${evaluationId}/decision`, { method: "POST", body: JSON.stringify(input) }),
  listNotifications: (unreadOnly = false) => request<NotificationListResponse>(`/scheduling/notifications?unreadOnly=${unreadOnly}`),
  markNotificationRead: (notificationId: string) => request<void>(`/scheduling/notifications/${notificationId}/read`, { method: "POST" }),
  academyMembers: () => request<AcademyMembersResponse>("/academy/members"),
  addAcademyMember: (input: { fullName: string; email: string; phone: string; password: string; roleCode: string; branchId?: string }) =>
    request<AcademyMember>("/academy/members", { method: "POST", body: JSON.stringify(input) }),
  changeAcademyMemberRole: (membershipId: string, input: { roleCode: string; branchId?: string }) =>
    request<{ membershipId: string; roleCode: string; scopeLevel: string; branch: AcademyMember["branch"] }>(`/academy/members/${membershipId}/role`, { method: "PUT", body: JSON.stringify(input) }),
  changeAcademyMemberStatus: (membershipId: string, status: "ACTIVE" | "SUSPENDED" | "REVOKED") =>
    request<{ membershipId: string; status: string; userStatus: string }>(`/academy/members/${membershipId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  updateRolePermissions: (roleCode: string, permissions: string[]) =>
    request<{ roleCode: string; permissions: string[]; defaultPermissions: string[]; isCustomized: boolean }>(`/academy/roles/${roleCode}/permissions`, { method: "PUT", body: JSON.stringify({ permissions }) }),
  resetRolePermissions: (roleCode: string) =>
    request<{ roleCode: string; permissions: string[]; defaultPermissions: string[]; isCustomized: boolean }>(`/academy/roles/${roleCode}/permissions`, { method: "DELETE" }),
  updateMemberPermissions: (membershipId: string, permissions: string[]) =>
    request<{ membershipId: string; customPermissions: string[]; effectivePermissions: string[]; hasCustomPermissions: boolean }>(`/academy/members/${membershipId}/permissions`, { method: "PUT", body: JSON.stringify({ permissions }) }),
  resetMemberPermissions: (membershipId: string) =>
    request<{ membershipId: string; customPermissions: null; effectivePermissions: string[]; hasCustomPermissions: boolean }>(`/academy/members/${membershipId}/permissions`, { method: "DELETE" }),
  dashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
  executiveSummary: (params: { from?: string; to?: string; branchId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.branchId) query.set("branchId", params.branchId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ExecutiveDashboardReport>(`/academy/executive-summary${suffix}`);
  },
  executiveActivity: (params: { from?: string; to?: string; branchId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.branchId) query.set("branchId", params.branchId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<{ items: ExecutiveActivityItem[]; total: number; tenantId: string }>(`/academy/executive-activity${suffix}`);
  },
  auditEvents: (params: { from?: string; to?: string; action?: string; targetType?: string; branchId?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.action) query.set("action", params.action);
    if (params.targetType) query.set("targetType", params.targetType);
    if (params.branchId) query.set("branchId", params.branchId);
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<AcademyAuditEventsResponse>(`/academy/audit-events${suffix}`);
  },
  listStudents: () => request<StudentListResponse>("/students"),
  consumerStudents: () => request<ConsumerStudentsResponse>("/consumer/me/students"),
  consumerSessions: (studentId?: string) => request<ConsumerSessionsResponse>(`/consumer/me/sessions${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}`),
  studentConsumerLinks: (studentId: string) => request<ConsumerLinksResponse>(`/students/${studentId}/consumer-links`),
  searchConsumerAccounts: (studentId: string, phone: string, accountType: "parent" | "student") => {
    const query = new URLSearchParams({ phone, accountType });
    return request<ConsumerAccountLookupResponse>(`/students/${studentId}/consumer-accounts?${query.toString()}`);
  },
  createConsumerInvitation: (studentId: string, input: { phone: string; accountType: "parent" | "student"; relationship?: string }) =>
    request<ConsumerInvitationDelivery>(`/students/${studentId}/consumer-invitations`, { method: "POST", body: JSON.stringify(input) }),
  linkStudentAccount: (studentId: string, userAccountId: string) => request<{ studentId: string; userAccountId: string; accountType: string; linked: boolean }>(`/students/${studentId}/student-account`, { method: "POST", body: JSON.stringify({ userAccountId }) }),
  unlinkStudentAccount: (studentId: string) => request<void>(`/students/${studentId}/student-account`, { method: "DELETE" }),
  linkGuardian: (studentId: string, input: { userAccountId: string; relationship: string }) => request<{ studentId: string; userAccountId: string; relationship: string; linked: boolean }>(`/students/${studentId}/guardians`, { method: "POST", body: JSON.stringify(input) }),
  unlinkGuardian: (studentId: string, userAccountId: string) => request<void>(`/students/${studentId}/guardians/${userAccountId}`, { method: "DELETE" }),
  listSessions: (params: { from?: string; to?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<SessionListResponse>(`/sessions${suffix}`);
  },
  getSessionAttendance: (sessionId: string) => request<AttendanceResponse>(`/sessions/${sessionId}/attendance`),
  upsertSessionAttendance: (sessionId: string, records: AttendanceRecordInput[]) =>
    request<AttendanceResponse>(`/sessions/${sessionId}/attendance`, {
      method: "PUT",
      body: JSON.stringify({ records }),
    }),
  completeSession: (sessionId: string) => request<SessionCompletionResponse>(`/sessions/${sessionId}/complete`, { method: "POST" }),
  financeInvoices: (params: { query?: string; status?: string; studentId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.query) query.set("query", params.query);
    if (params.status) query.set("status", params.status);
    if (params.studentId) query.set("studentId", params.studentId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<FinanceInvoicesResponse>(`/finance/invoices${suffix}`);
  },
  createFinanceInvoice: (input: { studentId: string; dueDate: string; enrollmentId?: string; lines: Array<{ description: string; amountPiastres: number }> }) => request<FinanceInvoice>("/finance/invoices", { method: "POST", body: JSON.stringify(input) }),
  createFinancePayment: (invoiceId: string, input: { amountPiastres: number; method: string; receivedOn?: string; externalReference?: string; note?: string }) => request<{ payment: FinancePayment; invoiceId: string }>(`/finance/invoices/${invoiceId}/payments`, { method: "POST", body: JSON.stringify(input) }),
  financeReport: (params: { from?: string; to?: string; branchId?: string } = {}) => { const query = new URLSearchParams(); if (params.from) query.set("from", params.from); if (params.to) query.set("to", params.to); if (params.branchId) query.set("branchId", params.branchId); const suffix = query.toString() ? `?${query}` : ""; return request<FinanceReport>(`/finance/reports/summary${suffix}`); },
  operationalReport: (params: { from?: string; to?: string; branchId?: string } = {}) => { const query = new URLSearchParams(); if (params.from) query.set("from", params.from); if (params.to) query.set("to", params.to); if (params.branchId) query.set("branchId", params.branchId); const suffix = query.toString() ? `?${query}` : ""; return request<OperationalReport>(`/reports/operational${suffix}`); },
  downloadOperationalReport: async (params: { from?: string; to?: string; branchId?: string } = {}) => { const query = new URLSearchParams(); if (params.from) query.set("from", params.from); if (params.to) query.set("to", params.to); if (params.branchId) query.set("branchId", params.branchId); const response = await fetch(`${API_BASE}/reports/operational.csv?${query}`, { headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined }); if (!response.ok) throw new ApiRequestError("تعذر تصدير التقرير التشغيلي", response.status); return response.blob(); },
  downloadFinanceReport: async (params: { from?: string; to?: string; branchId?: string } = {}) => { const query = new URLSearchParams(); if (params.from) query.set("from", params.from); if (params.to) query.set("to", params.to); if (params.branchId) query.set("branchId", params.branchId); const response = await fetch(`${API_BASE}/finance/reports/summary.csv?${query}`, { headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined }); if (!response.ok) throw new ApiRequestError("تعذر تصدير التقرير المالي", response.status); return response.blob(); },
  retentionRadar: (branchId?: string) => request<RetentionRadarResponse>(`/reports/analytics/retention-radar${branchId ? `?branchId=${branchId}` : ""}`),
  instructorScorecard: (branchId?: string) => request<InstructorScorecardItem[]>(`/reports/analytics/instructor-scorecard${branchId ? `?branchId=${branchId}` : ""}`),
  courseProfitability: (branchId?: string) => request<CourseProfitabilityItem[]>(`/reports/analytics/course-profitability${branchId ? `?branchId=${branchId}` : ""}`),
  downloadBiFeed: async (branchId?: string) => {
    const query = branchId ? `?branchId=${branchId}` : "";
    const response = await fetch(`${API_BASE}/reports/analytics/bi-feed.csv${query}`, { headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined });
    if (!response.ok) throw new ApiRequestError("تعذر تصدير بيانات التحليل للمحلل", response.status);
    return response.blob();
  },
  cashierShiftSummary: () => request<CashierShiftSummary>("/finance/cashier/shift-summary"),
  closeoutCashierShift: (input: { countedCashPiastres: number; notes?: string }) => request<CloseoutCashierResponse>("/finance/cashier/closeout", { method: "POST", body: JSON.stringify(input) }),
  financeExpenses: (params: { status?: string; branchId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.branchId) query.set("branchId", params.branchId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<FinanceExpensesResponse>(`/finance/expenses${suffix}`);
  },
  createFinanceExpense: (input: { description: string; category: string; amountPiastres: number; spentOn?: string; note?: string }) => request<FinanceExpense>("/finance/expenses", { method: "POST", body: JSON.stringify(input) }),
  approveFinanceExpense: (expenseId: string, reason: string) => request<FinanceExpense>(`/finance/expenses/${expenseId}/approve`, { method: "POST", body: JSON.stringify({ reason }) }),
  rejectFinanceExpense: (expenseId: string, reason: string) => request<FinanceExpense>(`/finance/expenses/${expenseId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  consumerInvoices: () => request<FinanceInvoicesResponse>("/consumer/invoices"),
  invoiceCorrections: (state: "ALL" | "PENDING" | "APPROVED" | "REJECTED" = "ALL") => request<InvoiceCorrectionsResponse>(`/finance/invoice-corrections?state=${state}`),
  createInvoiceCorrection: (invoiceId: string, input: { proposedDueDate: string; lines: Array<{ description: string; amountPiastres: number }>; reason: string }) => request<InvoiceCorrection>(`/finance/invoices/${invoiceId}/correction-requests`, { method: "POST", body: JSON.stringify(input) }),
  decideInvoiceCorrection: (correctionId: string, input: { decision: "APPROVED" | "REJECTED"; reason: string }) => request<InvoiceCorrection>(`/finance/invoice-corrections/${correctionId}/decision`, { method: "POST", body: JSON.stringify(input) }),
  uploadPaymentEvidence: async (paymentId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${API_BASE}/finance/payments/${paymentId}/evidence`, { method: "POST", headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined, body });
    if (!response.ok) throw new ApiRequestError("تعذر رفع إثبات الدفع", response.status);
    return ((await response.json()) as { data: unknown }).data;
  },
  downloadPaymentEvidence: async (paymentId: string) => {
    const response = await fetch(`${API_BASE}/finance/payments/${paymentId}/evidence`, { headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined });
    if (!response.ok) throw new ApiRequestError("تعذر تنزيل إثبات الدفع", response.status);
    return response.blob();
  },
  uploadExpenseEvidence: async (expenseId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${API_BASE}/finance/expenses/${expenseId}/evidence`, { method: "POST", headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined, body });
    if (!response.ok) throw new ApiRequestError("تعذر رفع إثبات المصروف", response.status);
    return ((await response.json()) as { data: unknown }).data;
  },
  downloadExpenseEvidence: async (expenseId: string) => {
    const response = await fetch(`${API_BASE}/finance/expenses/${expenseId}/evidence`, { headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined });
    if (!response.ok) throw new ApiRequestError("تعذر تنزيل إثبات المصروف", response.status);
    return response.blob();
  },
  listLeads: () => request<LeadsResponse>("/leads"),
  createLead: (input: CreateLeadInput) => request<LeadRecord>("/leads", { method: "POST", body: JSON.stringify(input) }),
  updateLeadStatus: (id: string, status: string) => request<LeadRecord>(`/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  listMarketingCampaigns: () => request<MarketingCampaignRecord[]>("/marketing/campaigns"),
  createMarketingCampaign: (input: CreateMarketingCampaignInput) => request<MarketingCampaignRecord>("/marketing/campaigns", { method: "POST", body: JSON.stringify(input) }),
  updateMarketingCampaignStatus: (id: string, status: string) => request<MarketingCampaignRecord>(`/marketing/campaigns/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  listMarketingContent: () => request<MarketingContentRecord[]>("/marketing/content"),
  createMarketingContent: (input: CreateMarketingContentInput) => request<MarketingContentRecord>("/marketing/content", { method: "POST", body: JSON.stringify(input) }),
  updateMarketingContentStatus: (id: string, status: string) => request<MarketingContentRecord>(`/marketing/content/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  convertLead: (id: string, input: ConvertLeadInput) => request<ConvertLeadResult>(`/leads/${id}/convert`, { method: "POST", body: JSON.stringify(input) }),
  registerStudent: (input: DirectStudentInput) => request<ConvertLeadResult>("/students/register", { method: "POST", body: JSON.stringify(input) }),
  listSchedulingGroups: () => request<{ items: SchedulingGroupRecord[]; total: number }>("/scheduling/groups"),
  activateWaitlistedEnrollment: (studentId: string, enrollmentId: string) => request<ActivateEnrollmentResult>(`/students/${studentId}/enrollments/${enrollmentId}/activate`, { method: "POST" }),
  competitions: (params: { status?: string; track?: string; season?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.track) query.set("track", params.track);
    if (params.season) query.set("season", params.season);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<CompetitionSummaryItem[]>(`/competitions${suffix}`);
  },
  competitionDetail: (id: string) => request<CompetitionDetailItem>(`/competitions/${id}`),
  createCompetition: (input: { name: string; organizer: string; season?: string; track?: string; ageMin?: number; ageMax?: number; registrationDeadline?: string; eventDate?: string; location?: string; notes?: string }) =>
    request<CompetitionDetailItem>("/competitions", { method: "POST", body: JSON.stringify(input) }),
  competitionTeams: (competitionId: string) => request<CompetitionTeamItem[]>(`/competitions/${competitionId}/teams`),
  createCompetitionTeam: (competitionId: string, input: { name: string; coachInstructorId?: string; branchId?: string; classroomId?: string; kitId?: string; projectTitle?: string; projectDescription?: string }) =>
    request<CompetitionTeamItem>(`/competitions/${competitionId}/teams`, { method: "POST", body: JSON.stringify(input) }),
  updateCompetitionTeamStatus: (teamId: string, status: string) =>
    request<string>(`/competitions/teams/${teamId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  addCompetitionTeamMember: (teamId: string, input: { studentId: string; roleInTeam?: string }) =>
    request<CompetitionTeamMemberItem>(`/competitions/teams/${teamId}/members`, { method: "POST", body: JSON.stringify(input) }),
  removeCompetitionTeamMember: (teamId: string, studentId: string) =>
    request<boolean>(`/competitions/teams/${teamId}/members/${studentId}`, { method: "DELETE" }),
  createCompetitionAward: (input: { teamId: string; title: string; rank?: number; awardDate?: string; certificateUrl?: string; photosJson?: string; isPublishedToHallOfFame?: boolean }) =>
    request<{ id: string }>(`/competitions/awards`, { method: "POST", body: JSON.stringify(input) }),
  hallOfFame: () => request<HallOfFameCardItem[]>("/competitions/hall-of-fame"),
  freezeRequests: (status?: string) => request<SubscriptionFreezeRequest[]>(`/operations/freeze-requests${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  createFreezeRequest: (input: { studentId: string; courseOfferingId?: string; startDate: string; endDate: string; reason?: string; reasonText?: string; notes?: string }) =>
    request<SubscriptionFreezeRequest>("/operations/freeze-requests", { method: "POST", body: JSON.stringify(input) }),
  decideFreezeRequest: (id: string, decision: "APPROVED" | "REJECTED", note?: string) =>
    request<SubscriptionFreezeRequest>(`/operations/freeze-requests/${id}/decision`, { method: "POST", body: JSON.stringify({ decision, note }) }),
  consumerFreezeRequests: () => request<SubscriptionFreezeRequest[]>("/consumer/freeze-requests"),
  createConsumerFreezeRequest: (input: { studentId: string; courseOfferingId?: string; startDate: string; endDate: string; reason?: string; reasonText?: string; notes?: string }) =>
    request<SubscriptionFreezeRequest>("/consumer/freeze-requests", { method: "POST", body: JSON.stringify(input) }),
  instructorPayroll: (params?: { month?: string; branchId?: string }) => {
    const query = new URLSearchParams();
    if (params?.month) query.set("month", params.month);
    if (params?.branchId) query.set("branchId", params.branchId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<InstructorPayrollItem[]>(`/finance/payroll/instructors${suffix}`);
  },
  depositCashierSafe: (input: { amountPiastres: number; notes?: string }) =>
    request<{ success: boolean; depositedPiastres: number; timestamp: string }>("/finance/cashier/deposit-to-safe", { method: "POST", body: JSON.stringify(input) }),
  resetAndSeedDemoData: () =>
    request<{ success: boolean; message: string; defaultPassword: string; logins: Array<{ role: string; phone: string; name: string }> }>("/dev/reset-and-seed", { method: "POST" }),
  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken && accessToken) await request<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }, false).catch(() => undefined);
    clearTokens();
  },
};

export type SchedulingGroupRecord = {
  id: string;
  courseTemplateId: string;
  courseName: string;
  track: string;
  branchId: string;
  branchName: string;
  instructorId: string;
  instructorName: string;
  classroomId: string;
  classroomName: string;
  startDate: string;
  endDate: string;
  weeklyScheduleJson: string;
  status: string;
  maxStudents: number;
  enrolledStudents: number;
};

export type LeadRecord = {
  id: string;
  branchId: string;
  childName: string;
  parentName: string;
  phone: string;
  channel: string;
  campaignId: string | null;
  notes: string | null;
  status: "NEW" | "CONTACTED" | "INTERESTED" | "REGISTERED" | "WAITLISTED" | "ARCHIVED";
  courseOfferingId: string | null;
  courseName: string | null;
  convertedStudentId: string | null;
  createdAt: string;
};

export type LeadsResponse = {
  items: LeadRecord[];
  total: number;
  overdue: number;
  active: number;
};

export type CreateLeadInput = {
  childName: string;
  parentName: string;
  phone: string;
  channel?: string;
  notes?: string;
  courseOfferingId?: string;
  branchId?: string;
  campaignId?: string;
};

export type MarketingCampaignStatus = "DRAFT" | "IN_REVIEW" | "ACTIVE" | "PAUSED" | "COMPLETED";
export type MarketingContentStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED";
export type MarketingCampaignRecord = { id: string; branchId: string; name: string; channel: string; status: MarketingCampaignStatus; budgetPiastres: number; leads: number; conversions: number; createdAt: string };
export type MarketingContentRecord = { id: string; branchId: string; campaignId: string | null; title: string; contentType: string; platform: string; status: MarketingContentStatus; dueDate: string | null; createdAt: string };
export type CreateMarketingCampaignInput = { name: string; channel: string; budgetPiastres?: number; branchId?: string; notes?: string };
export type CreateMarketingContentInput = { title: string; contentType: string; platform: string; dueDate?: string; campaignId?: string; branchId?: string; notes?: string };

export type ConvertLeadInput = {
  courseOfferingId?: string;
  dateOfBirth?: string;
  discountPercent?: number;
  createInvoice?: boolean;
  joinWaitlistIfFull?: boolean;
  referredByStudentId?: string;
};

export type DirectStudentInput = {
  fullName: string;
  phone?: string;
  branchId?: string;
  courseOfferingId?: string;
  dateOfBirth?: string;
  discountPercent?: number;
  createInvoice?: boolean;
  joinWaitlistIfFull?: boolean;
  referredByStudentId?: string;
};

export type InstructorPayrollItem = {
  instructorId: string;
  instructorName: string;
  totalSessions: number;
  completedSessions: number;
  substituteSessionsCount: number;
  totalCompensationPiastres: number;
  sessionRatePiastres: number;
};

export type ConvertLeadResult = {
  studentId: string;
  leadId?: string;
  enrollmentId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  studentName: string;
  enrollmentStatus: "ACTIVE" | "WAITLISTED";
};

export type ActivateEnrollmentResult = {
  enrollmentId: string;
  studentId: string;
  courseOfferingId: string;
  status: "ACTIVE";
  activeEnrollmentCount: number;
};

export type SubscriptionFreezeRequest = {
  id: string;
  studentId: string;
  studentName: string;
  courseName: string;
  branchName: string;
  startDate: string;
  endDate: string;
  reason: "MEDICAL" | "TRAVEL" | "EXAMS" | "FAMILY" | "OTHER";
  reasonText: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedByRole: "R08_PARENT" | "R05_SECRETARY";
  submittedByName: string;
  createdAt: string;
  decidedAt?: string;
  decidedByName?: string;
  decisionNote?: string;
  affectedSessionsCount: number;
  extendedNewEndDate?: string;
  makeUpCreditsAwarded: number;
};

export type CreateFreezeRequestInput = {
  studentId: string;
  studentName: string;
  courseName: string;
  branchName?: string;
  startDate: string;
  endDate: string;
  reason: "MEDICAL" | "TRAVEL" | "EXAMS" | "FAMILY" | "OTHER";
  reasonText: string;
  submittedByRole?: "R08_PARENT" | "R05_SECRETARY";
  submittedByName?: string;
};

const FREEZE_STORAGE_KEY = "mada_subscription_freezes_v1";

const DEFAULT_FREEZES: SubscriptionFreezeRequest[] = [
  {
    id: "FRZ-2026-001",
    studentId: "MAD-0248",
    studentName: "ياسين محمد علي",
    courseName: "روبوتكس مستوى 2",
    branchName: "مدينة نصر",
    startDate: "2026-10-20",
    endDate: "2026-11-03",
    reason: "EXAMS",
    reasonText: "فترة امتحانات منتصف الفصل الدراسي الأول",
    status: "PENDING",
    submittedByRole: "R08_PARENT",
    submittedByName: "محمد علي (ولي الأمر)",
    createdAt: "2026-10-17T09:30:00Z",
    affectedSessionsCount: 2,
    makeUpCreditsAwarded: 2,
  },
  {
    id: "FRZ-2026-002",
    studentId: "MAD-0247",
    studentName: "ليلى أحمد محمود",
    courseName: "برمجة للمبتدئين",
    branchName: "المعادي",
    startDate: "2026-10-10",
    endDate: "2026-10-24",
    reason: "MEDICAL",
    reasonText: "إجازة مرضية وإجراء عملية جراحية بسيطة",
    status: "APPROVED",
    submittedByRole: "R05_SECRETARY",
    submittedByName: "هبة محمود (استقبال المعادي)",
    createdAt: "2026-10-09T14:15:00Z",
    decidedAt: "2026-10-09T16:00:00Z",
    decidedByName: "أحمد محمود (مدير الفرع)",
    decisionNote: "معتمد طبقًا للتقرير الطبي المرفق. تم تمديد الاشتراك أسبوعين وإضافة حصتي تعويض.",
    affectedSessionsCount: 2,
    extendedNewEndDate: "2026-11-14",
    makeUpCreditsAwarded: 2,
  },
];

export const freezeStorage = {
  getRequests: (): SubscriptionFreezeRequest[] => {
    try {
      const raw = localStorage.getItem(FREEZE_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(FREEZE_STORAGE_KEY, JSON.stringify(DEFAULT_FREEZES));
        return DEFAULT_FREEZES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_FREEZES;
    }
  },
  saveRequests: (items: SubscriptionFreezeRequest[]) => {
    localStorage.setItem(FREEZE_STORAGE_KEY, JSON.stringify(items));
  },
  createRequest: (input: CreateFreezeRequestInput): SubscriptionFreezeRequest => {
    const list = freezeStorage.getRequests();
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const affected = Math.max(1, Math.round(diffDays / 7)); // approximate weekly sessions

    const newReq: SubscriptionFreezeRequest = {
      id: `FRZ-2026-${String(list.length + 1).padStart(3, "0")}`,
      studentId: input.studentId,
      studentName: input.studentName,
      courseName: input.courseName,
      branchName: input.branchName || "الفرع الرئيسي",
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      reasonText: input.reasonText,
      status: "PENDING",
      submittedByRole: input.submittedByRole || "R08_PARENT",
      submittedByName: input.submittedByName || "ولي الأمر",
      createdAt: new Date().toISOString(),
      affectedSessionsCount: affected,
      makeUpCreditsAwarded: affected,
    };
    const updated = [newReq, ...list];
    freezeStorage.saveRequests(updated);
    return newReq;
  },
  decideRequest: (id: string, decision: "APPROVED" | "REJECTED", decidedByName: string, note?: string): SubscriptionFreezeRequest => {
    const list = freezeStorage.getRequests();
    const updated = list.map(item => {
      if (item.id !== id) return item;
      const end = new Date(item.endDate);
      const start = new Date(item.startDate);
      const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const extended = new Date(Date.now() + (30 + diffDays) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      return {
        ...item,
        status: decision,
        decidedAt: new Date().toISOString(),
        decidedByName,
        decisionNote: note || (decision === "APPROVED" ? "تم الاعتماد وتمديد الاشتراك وإضافة رصيد التعويض" : "تم الرفض لعدم مطابقة سياسة التجميد"),
        extendedNewEndDate: decision === "APPROVED" ? extended : undefined,
      };
    });
    freezeStorage.saveRequests(updated);
    return updated.find(item => item.id === id)!;
  },
};

export type ShiftReceiptDetail = {
  id: string;
  receiptNumber: string;
  studentName: string;
  invoiceNumber: string;
  courseName: string;
  amount: number;
  paymentMethod: "CASH" | "VISA" | "INSTAPAY" | "VODAFONE_CASH";
  time: string;
};

export type ShiftCashHandover = {
  id: string;
  branchName: string;
  shiftDate: string;
  shiftName: "MORNING" | "EVENING";
  submittedByUserId: string;
  submittedByName: string;
  cashAmount: number;
  electronicAmount: number;
  totalReceiptsCount: number;
  status: "SUBMITTED" | "ACCEPTED" | "DISCREPANCY";
  receivedByName?: string;
  receivedAt?: string;
  discrepancyAmount?: number;
  notes?: string;
  createdAt: string;
  openingFloat?: number;
  pettyExpenses?: number;
  receipts?: ShiftReceiptDetail[];
};

export type TrainerSessionDetail = {
  sessionId: string;
  courseName: string;
  groupName: string;
  date: string;
  time: string;
  room: string;
  attendanceCount: number;
  rate: number;
  approvedByHead: boolean;
};

export type TrainerPayrollRecord = {
  id: string;
  instructorId: string;
  instructorName: string;
  month: string; // e.g. "2026-10"
  completedSessionsCount: number;
  ratePerSession: number;
  baseSalary: number;
  bonusAmount: number;
  bonusReason?: string;
  deductionAmount: number;
  deductionReason?: string;
  netPayable: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID";
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  sessions?: TrainerSessionDetail[];
};

const SHIFT_STORAGE_KEY = "mada_shift_handovers_v1";
const PAYROLL_STORAGE_KEY = "mada_trainer_payrolls_v3";

const DEFAULT_SHIFTS: ShiftCashHandover[] = [
  {
    id: "SHF-2026-101",
    branchName: "مدينة نصر",
    shiftDate: "2026-10-17",
    shiftName: "MORNING",
    submittedByUserId: "SEC-01",
    submittedByName: "هبة محمود (استقبال)",
    openingFloat: 500,
    pettyExpenses: 0,
    cashAmount: 6400,
    electronicAmount: 4800,
    totalReceiptsCount: 6,
    status: "SUBMITTED",
    notes: "تحصيل فواتير واشتراكات كاش من أولياء الأمور الصباحية",
    createdAt: "2026-10-17T13:30:00Z",
    receipts: [
      { id: "rcp-1", receiptNumber: "REC-2026-091", studentName: "يوسف أحمد", invoiceNumber: "MAD-MAIN-2026-0001", courseName: "Junior Robotics · Level 1", amount: 1250, paymentMethod: "CASH", time: "10:15 ص" },
      { id: "rcp-2", receiptNumber: "REC-2026-092", studentName: "ملك حسام", invoiceNumber: "MAD-ZAY-2026-0902", courseName: "روبوتكس مستوى 1", amount: 1950, paymentMethod: "CASH", time: "11:00 ص" },
      { id: "rcp-3", receiptNumber: "REC-2026-093", studentName: "زياد طارق", invoiceNumber: "MAD-NSR-2026-0904", courseName: "دوائر إلكترونية", amount: 1600, paymentMethod: "CASH", time: "11:45 ص" },
      { id: "rcp-4", receiptNumber: "REC-2026-094", studentName: "ريم أسامة", invoiceNumber: "MAD-NSR-2026-0908", courseName: "روبوتكس مستوى 2", amount: 1600, paymentMethod: "CASH", time: "12:30 م" },
      { id: "rcp-5", receiptNumber: "REC-2026-095", studentName: "فريدة حسن", invoiceNumber: "MAD-MAD-2026-0905", courseName: "برمجة للمبتدئين", amount: 2400, paymentMethod: "VISA", time: "12:50 م" },
      { id: "rcp-6", receiptNumber: "REC-2026-096", studentName: "كريم مدحت", invoiceNumber: "MAD-NSR-2026-0909", courseName: "تطوير ألعاب", amount: 2400, paymentMethod: "INSTAPAY", time: "01:10 م" },
    ],
  },
  {
    id: "SHF-2026-100",
    branchName: "مدينة نصر",
    shiftDate: "2026-10-16",
    shiftName: "EVENING",
    submittedByUserId: "SEC-02",
    submittedByName: "سارة خالد (استقبال)",
    openingFloat: 500,
    pettyExpenses: 150,
    cashAmount: 8200,
    electronicAmount: 6500,
    totalReceiptsCount: 9,
    status: "ACCEPTED",
    receivedByName: "أحمد محمود (المحاسب)",
    receivedAt: "2026-10-16T21:15:00Z",
    notes: "تم استلام النقدية بالكامل ومطابقة السندات وتوريدها للخزينة",
    createdAt: "2026-10-16T20:45:00Z",
    receipts: [
      { id: "rcp-7", receiptNumber: "REC-2026-081", studentName: "ياسين محمد علي", invoiceNumber: "MAD-NSR-2026-0908", courseName: "روبوتكس مستوى 2", amount: 2400, paymentMethod: "CASH", time: "05:15 م" },
      { id: "rcp-8", receiptNumber: "REC-2026-082", studentName: "عمر خالد", invoiceNumber: "MAD-NSR-2026-0904", courseName: "دوائر إلكترونية", amount: 1500, paymentMethod: "CASH", time: "06:00 م" },
      { id: "rcp-9", receiptNumber: "REC-2026-083", studentName: "حسام الدين فهمي", invoiceNumber: "MAD-NSR-2026-0910", courseName: "بايثون للشباب", amount: 4300, paymentMethod: "CASH", time: "07:20 م" },
      { id: "rcp-10", receiptNumber: "REC-2026-084", studentName: "سلمى شريف", invoiceNumber: "MAD-NSR-2026-0911", courseName: "روبوتكس متقدم", amount: 3500, paymentMethod: "VISA", time: "08:00 م" },
      { id: "rcp-11", receiptNumber: "REC-2026-085", studentName: "نور الدين سامح", invoiceNumber: "MAD-NSR-2026-0912", courseName: "ذكاء اصطناعي", amount: 3000, paymentMethod: "INSTAPAY", time: "08:30 م" },
    ],
  },
];

export function generateTrainerSessions(
  instructorId: string,
  instructorName: string,
  count: number,
  rate: number
): TrainerSessionDetail[] {
  const courses = [
    { name: "Junior Robotics · Level 1", group: "مجموعة السبت 4 عصراً", room: "معمل الروبوتكس 1", time: "04:00 - 06:00" },
    { name: "دوائر إلكترونية وتطبيقات عملية", group: "مجموعة الإثنين 4 عصراً", room: "قاعة الإلكترونيات", time: "04:00 - 06:00" },
    { name: "برمجة بايثون والذكاء الاصطناعي", group: "مجموعة الأربعاء 6 مساءً", room: "معمل البرمجة 2", time: "06:00 - 08:00" },
    { name: "متحكمات دقيقة Arduino وتصميم النماذج", group: "مجموعة الخميس 5 مساءً", room: "معمل الابتكار", time: "05:00 - 07:00" },
    { name: "الذكاء الاصطناعي وتعلم الآلة", group: "مجموعة المتقدمين الجمعة", room: "معمل AI 1", time: "02:00 - 04:00" },
    { name: "تطوير ألعاب وتطبيقات الموبايل", group: "مجموعة الأحد 5 مساءً", room: "قاعة البرمجيات", time: "05:00 - 07:00" },
  ];

  const prefix = instructorId.replace(/[^a-zA-Z0-9]/g, "") || "SES";
  const result: TrainerSessionDetail[] = [];

  for (let i = 1; i <= count; i++) {
    const course = courses[(i - 1) % courses.length];
    const day = Math.min(28, 1 + Math.floor((i - 1) * (26 / Math.max(1, count - 1))));
    const dateStr = `2026-10-${String(day).padStart(2, "0")}`;
    const attendance = 7 + ((i * 3) % 4);

    result.push({
      sessionId: `${prefix}-${String(i).padStart(3, "0")}`,
      courseName: course.name,
      groupName: course.group,
      date: dateStr,
      time: course.time,
      room: course.room,
      attendanceCount: attendance,
      rate,
      approvedByHead: true,
    });
  }

  return result;
}

const DEFAULT_PAYROLLS: TrainerPayrollRecord[] = [
  {
    id: "PAY-2026-10-01",
    instructorId: "INS-01",
    instructorName: "عمر سامح",
    month: "2026-10",
    completedSessionsCount: 22,
    ratePerSession: 200,
    baseSalary: 0,
    bonusAmount: 400,
    bonusReason: "مكافأة تميز في متابعة مشاريع الروبوتكس معتمدة من مدير الفرع",
    deductionAmount: 0,
    deductionReason: "",
    netPayable: 4800,
    status: "SUBMITTED",
    sessions: generateTrainerSessions("SES-1", "عمر سامح", 22, 200),
  },
  {
    id: "PAY-2026-10-02",
    instructorId: "INS-02",
    instructorName: "يوسف عماد",
    month: "2026-10",
    completedSessionsCount: 18,
    ratePerSession: 200,
    baseSalary: 0,
    bonusAmount: 0,
    bonusReason: "",
    deductionAmount: 200,
    deductionReason: "خصم تأخير عن بدء جلسة يوم 8 أكتوبر معتمد من مدير الفرع",
    netPayable: 3400,
    status: "APPROVED",
    sessions: generateTrainerSessions("SES-2", "يوسف عماد", 18, 200),
  },
  {
    id: "PAY-2026-10-03",
    instructorId: "INS-03",
    instructorName: "مريم حسن (كبير المدربين)",
    month: "2026-10",
    completedSessionsCount: 16,
    ratePerSession: 250,
    baseSalary: 3000,
    bonusAmount: 500,
    bonusReason: "مكافأة إشراف متميز واعتماد خطط الكورسات الشهرية",
    deductionAmount: 0,
    deductionReason: "",
    netPayable: 7500,
    status: "PAID",
    paidAt: "2026-10-15T12:00:00Z",
    paymentMethod: "INSTAPAY",
    paymentReference: "IPN-984210",
    sessions: generateTrainerSessions("SES-3", "مريم حسن", 16, 250),
  },
];

export const shiftStorage = {
  getHandovers: (): ShiftCashHandover[] => {
    try {
      const raw = localStorage.getItem(SHIFT_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(DEFAULT_SHIFTS));
        return DEFAULT_SHIFTS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SHIFTS;
    }
  },
  saveHandovers: (items: ShiftCashHandover[]) => {
    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(items));
  },
  submitShift: (input: Omit<ShiftCashHandover, "id" | "status" | "createdAt">): ShiftCashHandover => {
    const list = shiftStorage.getHandovers();
    const newShift: ShiftCashHandover = {
      ...input,
      id: `SHF-2026-${String(list.length + 101).padStart(3, "0")}`,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };
    const updated = [newShift, ...list];
    shiftStorage.saveHandovers(updated);
    return newShift;
  },
  acceptShift: (id: string, receivedByName: string, discrepancy = 0, notes?: string): ShiftCashHandover => {
    const list = shiftStorage.getHandovers();
    const updated = list.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        status: discrepancy !== 0 ? ("DISCREPANCY" as const) : ("ACCEPTED" as const),
        receivedByName,
        receivedAt: new Date().toISOString(),
        discrepancyAmount: discrepancy,
        notes: notes ? `${item.notes || ""} · ${notes}` : item.notes,
      };
    });
    shiftStorage.saveHandovers(updated);
    return updated.find(item => item.id === id)!;
  },
};

export const payrollStorage = {
  getPayrolls: (): TrainerPayrollRecord[] => {
    try {
      const raw = localStorage.getItem(PAYROLL_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(DEFAULT_PAYROLLS));
        return DEFAULT_PAYROLLS;
      }
      let list: TrainerPayrollRecord[] = raw ? JSON.parse(raw) : DEFAULT_PAYROLLS;
      list = list.map(item => {
        if (!item.sessions || item.sessions.length < item.completedSessionsCount) {
          return {
            ...item,
            sessions: generateTrainerSessions(item.instructorId, item.instructorName, item.completedSessionsCount, item.ratePerSession),
          };
        }
        return item;
      });
      return list;
    } catch {
      return DEFAULT_PAYROLLS;
    }
  },
  savePayrolls: (items: TrainerPayrollRecord[]) => {
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(items));
  },
  approvePayroll: (id: string): TrainerPayrollRecord => {
    const list = payrollStorage.getPayrolls();
    const updated = list.map(item => item.id === id ? { ...item, status: "APPROVED" as const } : item);
    payrollStorage.savePayrolls(updated);
    return updated.find(item => item.id === id)!;
  },
  updateAdjustments: (id: string, bonus: number, bonusReason: string, deduction: number, deductionReason: string): TrainerPayrollRecord => {
    const list = payrollStorage.getPayrolls();
    const updated = list.map(item => {
      if (item.id !== id) return item;
      const net = (item.completedSessionsCount * item.ratePerSession) + item.baseSalary + bonus - deduction;
      return {
        ...item,
        bonusAmount: bonus,
        bonusReason: bonusReason || item.bonusReason,
        deductionAmount: deduction,
        deductionReason: deductionReason || item.deductionReason,
        netPayable: Math.max(0, net),
      };
    });
    payrollStorage.savePayrolls(updated);
    return updated.find(item => item.id === id)!;
  },
  markPaid: (id: string, method: string, reference?: string): TrainerPayrollRecord => {
    const list = payrollStorage.getPayrolls();
    const updated = list.map(item => item.id === id ? {
      ...item,
      status: "PAID" as const,
      paidAt: new Date().toISOString(),
      paymentMethod: method,
      paymentReference: reference,
    } : item);
    payrollStorage.savePayrolls(updated);
    return updated.find(item => item.id === id)!;
  },
};

export type WaitlistEntry = {
  id: string;
  studentId?: string;
  studentName: string;
  parentName: string;
  phone: string;
  groupId: string;
  courseName: string;
  branchName: string;
  status: "WAITING" | "NOTIFIED" | "ENROLLED" | "EXPIRED" | "CANCELLED";
  priorityRank: number;
  addedAt: string;
  notifiedAt?: string;
  enrolledAt?: string;
  notes?: string;
};

const WAITLIST_STORAGE_KEY = "mada_waitlists_v1";

const DEFAULT_WAITLIST: WaitlistEntry[] = [
  {
    id: "WTL-2026-001",
    studentId: "MAD-0255",
    studentName: "كريم شريف نبيل",
    parentName: "شريف نبيل",
    phone: "+201011223344",
    groupId: "GRP-042",
    courseName: "روبوتكس مستوى 2",
    branchName: "مدينة نصر",
    status: "WAITING",
    priorityRank: 1,
    addedAt: "2026-10-15T11:20:00Z",
    notes: "المجموعة مكتملة (16/16). في انتظار تجميد أو انسحاب طالب.",
  },
  {
    id: "WTL-2026-002",
    studentId: "MAD-0256",
    studentName: "سارة تامر حسني",
    parentName: "تامر حسني",
    phone: "+201099887766",
    groupId: "GRP-042",
    courseName: "روبوتكس مستوى 2",
    branchName: "مدينة نصر",
    status: "WAITING",
    priorityRank: 2,
    addedAt: "2026-10-16T14:10:00Z",
    notes: "أولوية ثانية للحجز الصباحي.",
  },
  {
    id: "WTL-2026-003",
    studentId: "MAD-0257",
    studentName: "محمود إبراهيم زايد",
    parentName: "إبراهيم زايد",
    phone: "+201055443322",
    groupId: "GRP-041",
    courseName: "برمجة للمبتدئين",
    branchName: "المعادي",
    status: "NOTIFIED",
    priorityRank: 1,
    addedAt: "2026-10-14T09:00:00Z",
    notifiedAt: "2026-10-17T10:00:00Z",
    notes: "تم إرسال إشعار توفر مقعد شاغر عبر واتساب.",
  },
];

export const waitlistStorage = {
  getEntries: (): WaitlistEntry[] => {
    try {
      const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(DEFAULT_WAITLIST));
        return DEFAULT_WAITLIST;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_WAITLIST;
    }
  },
  saveEntries: (items: WaitlistEntry[]) => {
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(items));
  },
  addEntry: (input: Omit<WaitlistEntry, "id" | "status" | "priorityRank" | "addedAt">): WaitlistEntry => {
    const list = waitlistStorage.getEntries();
    const groupEntries = list.filter(e => e.groupId === input.groupId && e.status === "WAITING");
    const newEntry: WaitlistEntry = {
      ...input,
      id: `WTL-2026-${String(list.length + 1).padStart(3, "0")}`,
      status: "WAITING",
      priorityRank: groupEntries.length + 1,
      addedAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...list];
    waitlistStorage.saveEntries(updated);
    return newEntry;
  },
  notifyEntry: (id: string): WaitlistEntry => {
    const list = waitlistStorage.getEntries();
    const updated = list.map(item => item.id === id ? {
      ...item,
      status: "NOTIFIED" as const,
      notifiedAt: new Date().toISOString(),
    } : item);
    waitlistStorage.saveEntries(updated);
    return updated.find(item => item.id === id)!;
  },
  enrollEntry: (id: string): WaitlistEntry => {
    const list = waitlistStorage.getEntries();
    const updated = list.map(item => item.id === id ? {
      ...item,
      status: "ENROLLED" as const,
      enrolledAt: new Date().toISOString(),
    } : item);
    waitlistStorage.saveEntries(updated);
    return updated.find(item => item.id === id)!;
  },
  cancelEntry: (id: string): WaitlistEntry => {
    const list = waitlistStorage.getEntries();
    const updated = list.map(item => item.id === id ? {
      ...item,
      status: "CANCELLED" as const,
    } : item);
    waitlistStorage.saveEntries(updated);
    return updated.find(item => item.id === id)!;
  },
  deleteEntry: (id: string) => {
    const list = waitlistStorage.getEntries();
    const updated = list.filter(item => item.id !== id);
    waitlistStorage.saveEntries(updated);
  },
};

export type RubricCriterion = {
  id: string;
  key: string;
  label: string;
  category: "TECHNICAL" | "PRACTICAL" | "BEHAVIORAL" | "PHYSICAL" | "CREATIVE";
  categoryLabel: string;
  maxScore: number;
  weightPercent?: number;
  hint: string;
};

export type DisciplineRubric = {
  id: string;
  trackKey: "robotics" | "coding" | "circuits" | "ai" | "soft_skills" | "sports_swimming" | "martial_arts" | "general";
  trackLabel: string;
  title: string;
  description: string;
  scaleMax: number;
  criteria: RubricCriterion[];
  isActive: boolean;
  isDefault: boolean;
  updatedAt: string;
  authorName?: string;
};

const RUBRICS_STORAGE_KEY = "mada_evaluation_rubrics_v1";

const DEFAULT_RUBRICS: DisciplineRubric[] = [
  {
    id: "RBR-ROBO-01",
    trackKey: "robotics",
    trackLabel: "روبوتكس وميكاترونكس",
    title: "نموذج تقييم مهارات الروبوتكس والمستشعرات",
    description: "معايير معتمدة لقياس الدقة الميكانيكية، ربط المستشعرات، والبرمجة الحركية للروبوت.",
    scaleMax: 5,
    isActive: true,
    isDefault: true,
    updatedAt: "2026-10-15T10:00:00Z",
    authorName: "مريم حسن (رئيس المدربين)",
    criteria: [
      {
        id: "crt-101",
        key: "mechanical_assembly",
        label: "دقة التركيب والتجميع الميكانيكي",
        category: "TECHNICAL",
        categoryLabel: "مهارة فنية",
        maxScore: 5,
        weightPercent: 25,
        hint: "ثبات الهيكل، سلامة التروس، وتركيب المحركات في مسارها الصحيح.",
      },
      {
        id: "crt-102",
        key: "sensor_programming",
        label: "برمجة المستشعرات واتخاذ القرار",
        category: "PRACTICAL",
        categoryLabel: "تطبيق عملي",
        maxScore: 5,
        weightPercent: 30,
        hint: "قراءة الحساسات (الموجات فوق الصوتية/الألوان) وتنفيذ ردود الفعل.",
      },
      {
        id: "crt-103",
        key: "troubleshooting",
        label: "استكشاف الأعطال وحل المشكلات (Debugging)",
        category: "CREATIVE",
        categoryLabel: "تفكير تحليلي",
        maxScore: 5,
        weightPercent: 25,
        hint: "القدرة على تشخيص الخلل وإعادة تجربة الحلول المستقلة.",
      },
      {
        id: "crt-104",
        key: "lab_safety_teamwork",
        label: "السلامة المعملية والعمل الجماعي",
        category: "BEHAVIORAL",
        categoryLabel: "سلوك وانضباط",
        maxScore: 5,
        weightPercent: 20,
        hint: "المحافظة على المكونات وتنظيم مساحة العمل والمشاركة البناءة.",
      },
    ],
  },
  {
    id: "RBR-CODE-01",
    trackKey: "coding",
    trackLabel: "برمجة وتطوير ألعاب",
    title: "نموذج تقييم التفكير البرمجي وبناء الألعاب",
    description: "معايير تقييم خوارزميات البرمجة، التعامل مع المتغيرات والدوال، وتصميم بيئة اللعبة.",
    scaleMax: 5,
    isActive: true,
    isDefault: true,
    updatedAt: "2026-10-14T12:30:00Z",
    authorName: "مريم حسن (رئيس المدربين)",
    criteria: [
      {
        id: "crt-201",
        key: "algorithmic_logic",
        label: "التفكير الخوارزمي والمنطقي",
        category: "TECHNICAL",
        categoryLabel: "مهارة فنية",
        maxScore: 5,
        weightPercent: 30,
        hint: "استخدام الحلقات التكرارية والشروط المنطقية بشكل صحيح وفعال.",
      },
      {
        id: "crt-202",
        key: "code_structure",
        label: "نظافة الكود وهيكلة الأوامر",
        category: "PRACTICAL",
        categoryLabel: "تطبيق عملي",
        maxScore: 5,
        weightPercent: 25,
        hint: "تسمية المتغيرات وتقسيم المهام لكتل مفهومة ومرتبة.",
      },
      {
        id: "crt-203",
        key: "game_mechanics",
        label: "ابتكار آليات اللعبة والفيزياء",
        category: "CREATIVE",
        categoryLabel: "إبداع وابتكار",
        maxScore: 5,
        weightPercent: 25,
        hint: "حركة الشخصيات، نظام النقاط، وتصميم تجربة مستخدم ممتعة.",
      },
      {
        id: "crt-204",
        key: "persistence",
        label: "المثابرة وإنجاز المشروعات",
        category: "BEHAVIORAL",
        categoryLabel: "سلوك وانضباط",
        maxScore: 5,
        weightPercent: 20,
        hint: "التركيز في المهام البرمجية والتطوير الذاتي للنماذج الأولية.",
      },
    ],
  },
  {
    id: "RBR-CIRC-01",
    trackKey: "circuits",
    trackLabel: "دوائر إلكترونية وأنظمة مدمجة",
    title: "نموذج تقييم الدوائر الكهربائية والـ Microcontrollers",
    description: "قياس مهارات قراءة المخططات الإلكترونية، التعامل مع الملتيميتر واللوحات التوصيلية.",
    scaleMax: 5,
    isActive: true,
    isDefault: true,
    updatedAt: "2026-10-12T15:00:00Z",
    authorName: "مريم حسن (رئيس المدربين)",
    criteria: [
      {
        id: "crt-301",
        key: "schematic_understanding",
        label: "فهم المخططات والمكونات الإلكترونية",
        category: "TECHNICAL",
        categoryLabel: "مهارة فنية",
        maxScore: 5,
        weightPercent: 30,
        hint: "التمييز بين المقاومات، المكثفات، الدايودات وقطبية التوصيل.",
      },
      {
        id: "crt-302",
        key: "breadboard_wiring",
        label: "دقة التوصيل على لوحة التجارب (Breadboard)",
        category: "PRACTICAL",
        categoryLabel: "تطبيق عملي",
        maxScore: 5,
        weightPercent: 30,
        hint: "نظافة الأسلاك، تجنب قصر الدائرة (Short Circuit)، وحساب الجهد.",
      },
      {
        id: "crt-303",
        key: "electrical_safety",
        label: "إجراءات السلامة الكهربائية والأدوات",
        category: "BEHAVIORAL",
        categoryLabel: "سلامة وسلوك",
        maxScore: 5,
        weightPercent: 20,
        hint: "التعامل السليم مع مصادر الطاقة واللحام بحذر ومسؤولية.",
      },
      {
        id: "crt-304",
        key: "circuit_innovation",
        label: "تصميم دوائر وحلول تطبيقية",
        category: "CREATIVE",
        categoryLabel: "إبداع وتحليل",
        maxScore: 5,
        weightPercent: 20,
        hint: "ابتكار دوائر استشعار ضوئي أو صوتي مخصصة لحل مشكلات واقعية.",
      },
    ],
  },
  {
    id: "RBR-SWIM-01",
    trackKey: "sports_swimming",
    trackLabel: "سباحة ورياضات مائية",
    title: "نموذج تقييم المهارات المائية والأداء الحركي",
    description: "معايير الكفاءة الحركية، التوافق العضلي العصبي، والتنفس للسباحين الصغار والناشئين.",
    scaleMax: 5,
    isActive: true,
    isDefault: true,
    updatedAt: "2026-10-16T08:00:00Z",
    authorName: "مريم حسن (رئيس المدربين)",
    criteria: [
      {
        id: "crt-401",
        key: "hydrodynamics",
        label: "الانسيابية والطفو الحركي",
        category: "PHYSICAL",
        categoryLabel: "لياقة وحركة",
        maxScore: 5,
        weightPercent: 30,
        hint: "استقامة الجذع في الماء، تقليل مقاومة الماء، وتوازن الجسم.",
      },
      {
        id: "crt-402",
        key: "kick_stroke_coordination",
        label: "توافق ضربات الذراعين والأرجل",
        category: "TECHNICAL",
        categoryLabel: "مهارة فنية",
        maxScore: 5,
        weightPercent: 30,
        hint: "قوة الدفع من مشط القدم، امتداد الذراع، ومرحلة السحب والدفع.",
      },
      {
        id: "crt-403",
        key: "breath_control",
        label: "تنظيم التنفس الجانبي والغوص",
        category: "PHYSICAL",
        categoryLabel: "تحمل وتكنيك",
        maxScore: 5,
        weightPercent: 25,
        hint: "إخراج الهواء تحت الماء بسلاسة وأخذ الشهيق السريع دون توقف.",
      },
      {
        id: "crt-404",
        key: "pool_discipline",
        label: "الانضباط وتعليمات مدرب المسبح",
        category: "BEHAVIORAL",
        categoryLabel: "انضباط وسلامة",
        maxScore: 5,
        weightPercent: 15,
        hint: "الالتزام بالحارة التدريبية، ارتداء الأدوات، والهدوء خارج الماء.",
      },
    ],
  },
  {
    id: "RBR-SOFT-01",
    trackKey: "soft_skills",
    trackLabel: "مهارات القيادة والتفكير الإبداعي",
    title: "نموذج تقييم مهارات التواصل وحل المشكلات",
    description: "قياس مهارات الإلقاء، العمل الجماعي، وإدارة الوقت والقيادة الإيجابية.",
    scaleMax: 5,
    isActive: true,
    isDefault: true,
    updatedAt: "2026-10-11T11:00:00Z",
    authorName: "مريم حسن (رئيس المدربين)",
    criteria: [
      {
        id: "crt-501",
        key: "presentation_skills",
        label: "مهارات العرض والتعبير اللفظي",
        category: "CREATIVE",
        categoryLabel: "إلقاء وتواصل",
        maxScore: 5,
        weightPercent: 30,
        hint: "لغة الجسد، وضوح الفكرة، والجرأة في التحدث أمام الجمهور.",
      },
      {
        id: "crt-502",
        key: "leadership_teamwork",
        label: "القيادة التعاونية ودعم الزملاء",
        category: "BEHAVIORAL",
        categoryLabel: "قيادة وفريق",
        maxScore: 5,
        weightPercent: 30,
        hint: "الاستماع للرأي الآخر، تحفيز الفريق، وتقاسم الأدوار بعدالة.",
      },
      {
        id: "crt-503",
        key: "critical_thinking",
        label: "التفكير النقدي وتحليل المواقف",
        category: "TECHNICAL",
        categoryLabel: "تحليل وفكر",
        maxScore: 5,
        weightPercent: 25,
        hint: "طرح أسئلة استقصائية ذكية وتقديم بدائل إبداعية للمشكلات.",
      },
      {
        id: "crt-504",
        key: "initiative",
        label: "المبادرة وتحمل المسؤولية",
        category: "BEHAVIORAL",
        categoryLabel: "سلوك ومبادرة",
        maxScore: 5,
        weightPercent: 15,
        hint: "المبادرة في التطوع للمهام والالتزام بمواعيد التكليفات.",
      },
    ],
  },
  {
    id: "RBR-GEN-01",
    trackKey: "general",
    trackLabel: "التقييم الأكاديمي العام",
    title: "النموذج العام لتقييم الحصص التدريبية",
    description: "النموذج التأسيسي المعتمد لأي نشاط أو دورة تدريبية لم يُخصص لها نموذج مستقل.",
    scaleMax: 5,
    isActive: true,
    isDefault: true,
    updatedAt: "2026-10-10T09:00:00Z",
    authorName: "مريم حسن (رئيس المدربين)",
    criteria: [
      {
        id: "crt-001",
        key: "understanding",
        label: "استيعاب الفكرة والمفاهيم",
        category: "TECHNICAL",
        categoryLabel: "فهم واستيعاب",
        maxScore: 5,
        weightPercent: 35,
        hint: "المفاهيم والخطوات الأساسية المستهدفة من الحصة.",
      },
      {
        id: "crt-002",
        key: "practice",
        label: "التطبيق العملي والممارسة",
        category: "PRACTICAL",
        categoryLabel: "تطبيق عملي",
        maxScore: 5,
        weightPercent: 35,
        hint: "تنفيذ المهام المطلوبة واستخدام الأدوات والأجهزة.",
      },
      {
        id: "crt-003",
        key: "collaboration",
        label: "التعاون والمبادرة الإيجابية",
        category: "BEHAVIORAL",
        categoryLabel: "سلوك ومشاركة",
        maxScore: 5,
        weightPercent: 30,
        hint: "التفاعل الإيجابي مع المدرب والزملاء في مساحة التعلم.",
      },
    ],
  },
];

export const rubricStorage = {
  getRubrics: (): DisciplineRubric[] => {
    try {
      const raw = localStorage.getItem(RUBRICS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(RUBRICS_STORAGE_KEY, JSON.stringify(DEFAULT_RUBRICS));
        return DEFAULT_RUBRICS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_RUBRICS;
    }
  },
  saveRubrics: (items: DisciplineRubric[]) => {
    localStorage.setItem(RUBRICS_STORAGE_KEY, JSON.stringify(items));
  },
  getRubricByTrack: (trackKey: string): DisciplineRubric => {
    const list = rubricStorage.getRubrics();
    const found = list.find(r => r.trackKey === trackKey && r.isActive && r.isDefault)
      || list.find(r => r.trackKey === trackKey && r.isActive)
      || list.find(r => r.trackKey === "general")
      || DEFAULT_RUBRICS[0];
    return found;
  },
  createRubric: (input: Omit<DisciplineRubric, "id" | "updatedAt">): DisciplineRubric => {
    const list = rubricStorage.getRubrics();
    const newRubric: DisciplineRubric = {
      ...input,
      id: `RBR-CUSTOM-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString(),
    };
    if (newRubric.isDefault) {
      list.forEach(item => {
        if (item.trackKey === newRubric.trackKey) item.isDefault = false;
      });
    }
    const updated = [newRubric, ...list];
    rubricStorage.saveRubrics(updated);
    return newRubric;
  },
  saveRubric: (rubric: DisciplineRubric): DisciplineRubric => {
    const list = rubricStorage.getRubrics();
    const updated = list.map(item => item.id === rubric.id ? { ...rubric, updatedAt: new Date().toISOString() } : item);
    rubricStorage.saveRubrics(updated);
    return rubric;
  },
  deleteRubric: (id: string) => {
    const list = rubricStorage.getRubrics();
    const updated = list.filter(item => item.id !== id);
    rubricStorage.saveRubrics(updated);
  },
  setDefault: (id: string) => {
    const list = rubricStorage.getRubrics();
    const target = list.find(r => r.id === id);
    if (!target) return;
    const updated = list.map(item => {
      if (item.trackKey === target.trackKey) {
        return { ...item, isDefault: item.id === id };
      }
      return item;
    });
    rubricStorage.saveRubrics(updated);
  },
};

export type PlatformTenantExtra = {
  planCode: "starter" | "growth" | "enterprise";
  planName: string;
  allowedBranches: number;
  trialEndsAt?: string;
  isTrialExtended?: boolean;
  totalPaidAmount?: number;
};

export type PlatformPaymentRecord = {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  method: "BANK_TRANSFER" | "FAWRY" | "CREDIT_CARD" | "CASH" | "INSTAPAY";
  referenceNumber: string;
  receivedAt: string;
  recordedByName: string;
  notes?: string;
};

export type PlatformOwnerResetResult = {
  tenantId: string;
  ownerName: string;
  ownerPhone: string;
  tempPassword: string;
  generatedAt: string;
};

const PLATFORM_EXTRAS_KEY = "mada_platform_tenant_extras_v1";
const PLATFORM_PAYMENTS_KEY = "mada_platform_payments_v1";

const DEFAULT_EXTRAS: Record<string, PlatformTenantExtra> = {
  "demo-academy-01": {
    planCode: "growth",
    planName: "باقة النمو الاحترافية (Growth)",
    allowedBranches: 3,
    trialEndsAt: undefined,
    isTrialExtended: false,
    totalPaidAmount: 35000,
  },
  "demo-academy-02": {
    planCode: "starter",
    planName: "الباقة الأساسية (Starter)",
    allowedBranches: 1,
    trialEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    isTrialExtended: false,
    totalPaidAmount: 0,
  },
  "demo-academy-03": {
    planCode: "enterprise",
    planName: "باقة المؤسسات (Enterprise)",
    allowedBranches: 99,
    trialEndsAt: undefined,
    isTrialExtended: false,
    totalPaidAmount: 70000,
  },
};

const DEFAULT_PLATFORM_PAYMENTS: PlatformPaymentRecord[] = [
  {
    id: "PAY-PLT-2026-001",
    tenantId: "demo-academy-01",
    tenantName: "أكاديمية مدى النموذجية",
    amount: 35000,
    method: "BANK_TRANSFER",
    referenceNumber: "CIB-TRF-9923841",
    receivedAt: "2026-10-01T11:00:00Z",
    recordedByName: "م. إسلام (مسؤول المنصة)",
    notes: "سداد الاشتراك السنوي لباقة Growth (3 فروع)",
  },
  {
    id: "PAY-PLT-2026-002",
    tenantId: "demo-academy-03",
    tenantName: "مركز مسار لتعليم الروبوتكس",
    amount: 35000,
    method: "INSTAPAY",
    referenceNumber: "INSTA-8839210",
    receivedAt: "2026-10-12T14:30:00Z",
    recordedByName: "م. إسلام (مسؤول المنصة)",
    notes: "القسط الأول من باقة Enterprise",
  },
];

export const platformSaaSStorage = {
  getAllExtras: (): Record<string, PlatformTenantExtra> => {
    try {
      const raw = localStorage.getItem(PLATFORM_EXTRAS_KEY);
      if (!raw) {
        localStorage.setItem(PLATFORM_EXTRAS_KEY, JSON.stringify(DEFAULT_EXTRAS));
        return DEFAULT_EXTRAS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_EXTRAS;
    }
  },
  getTenantExtra: (tenantId: string, defaultPlan = "growth"): PlatformTenantExtra => {
    const extras = platformSaaSStorage.getAllExtras();
    if (extras[tenantId]) return extras[tenantId];
    const initial: PlatformTenantExtra = {
      planCode: defaultPlan as "starter" | "growth" | "enterprise",
      planName: defaultPlan === "enterprise" ? "باقة المؤسسات (Enterprise)" : defaultPlan === "starter" ? "الباقة الأساسية (Starter)" : "باقة النمو الاحترافية (Growth)",
      allowedBranches: defaultPlan === "enterprise" ? 99 : defaultPlan === "starter" ? 1 : 3,
      trialEndsAt: undefined,
      isTrialExtended: false,
      totalPaidAmount: 0,
    };
    extras[tenantId] = initial;
    localStorage.setItem(PLATFORM_EXTRAS_KEY, JSON.stringify(extras));
    return initial;
  },
  updatePlan: (tenantId: string, planCode: "starter" | "growth" | "enterprise", branches: number): PlatformTenantExtra => {
    const extras = platformSaaSStorage.getAllExtras();
    const current = extras[tenantId] || platformSaaSStorage.getTenantExtra(tenantId);
    const planName = planCode === "enterprise" ? "باقة المؤسسات (Enterprise)" : planCode === "starter" ? "الباقة الأساسية (Starter)" : "باقة النمو الاحترافية (Growth)";
    const updated: PlatformTenantExtra = {
      ...current,
      planCode,
      planName,
      allowedBranches: branches,
    };
    extras[tenantId] = updated;
    localStorage.setItem(PLATFORM_EXTRAS_KEY, JSON.stringify(extras));
    return updated;
  },
  extendTrial: (tenantId: string, daysToAdd = 7): { newEndDate: string; isTrialExtended: boolean } => {
    const extras = platformSaaSStorage.getAllExtras();
    const current = extras[tenantId] || platformSaaSStorage.getTenantExtra(tenantId);
    const baseDate = current.trialEndsAt ? new Date(current.trialEndsAt) : new Date();
    const newEnd = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    extras[tenantId] = {
      ...current,
      trialEndsAt: newEnd,
      isTrialExtended: true,
    };
    localStorage.setItem(PLATFORM_EXTRAS_KEY, JSON.stringify(extras));
    return { newEndDate: newEnd, isTrialExtended: true };
  },
  getPayments: (tenantId?: string): PlatformPaymentRecord[] => {
    try {
      const raw = localStorage.getItem(PLATFORM_PAYMENTS_KEY);
      const list: PlatformPaymentRecord[] = raw ? JSON.parse(raw) : DEFAULT_PLATFORM_PAYMENTS;
      if (!raw) localStorage.setItem(PLATFORM_PAYMENTS_KEY, JSON.stringify(DEFAULT_PLATFORM_PAYMENTS));
      return tenantId ? list.filter(p => p.tenantId === tenantId) : list;
    } catch {
      return DEFAULT_PLATFORM_PAYMENTS;
    }
  },
  recordPayment: (input: Omit<PlatformPaymentRecord, "id" | "receivedAt">): PlatformPaymentRecord => {
    const list = platformSaaSStorage.getPayments();
    const newPayment: PlatformPaymentRecord = {
      ...input,
      id: `PAY-PLT-2026-${String(list.length + 1).padStart(3, "0")}`,
      receivedAt: new Date().toISOString(),
    };
    const updated = [newPayment, ...list];
    localStorage.setItem(PLATFORM_PAYMENTS_KEY, JSON.stringify(updated));

    // Update tenant paid amount
    const extras = platformSaaSStorage.getAllExtras();
    if (extras[input.tenantId]) {
      extras[input.tenantId].totalPaidAmount = (extras[input.tenantId].totalPaidAmount || 0) + input.amount;
      localStorage.setItem(PLATFORM_EXTRAS_KEY, JSON.stringify(extras));
    }
    return newPayment;
  },
  generateOwnerTempPassword: (tenantId: string, ownerName: string, ownerPhone: string): PlatformOwnerResetResult => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `Mada#${randomDigits}!`;
    return {
      tenantId,
      ownerName,
      ownerPhone,
      tempPassword,
      generatedAt: new Date().toISOString(),
    };
  },
};


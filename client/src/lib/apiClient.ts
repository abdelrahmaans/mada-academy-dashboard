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

export type AcademyRoleDefinition = {
  code: string;
  label: string;
  scopeLevel: string;
  description: string;
  permissions: string[];
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
};

export type AcademyRolesResponse = { roles: AcademyRoleDefinition[]; permissions: string[] };
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
  instructorName: string | null; score: number | null; notes: string | null; submittedAt: string | null; sessionDate: string;
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
export type InvoiceCorrection = { id: string; tenantId: string; branchId: string; invoiceId: string; invoiceNumber?: string | null; studentName?: string | null; approvalRequestId: string; requestedByUserId: string; currentTotalPiastres: number; currentDueDate: string; proposedTotalPiastres: number; proposedDueDate: string; reason: string; status: string; decidedAt?: string | null; decidedByUserId?: string | null; createdAt: string };
export type InvoiceCorrectionsResponse = { items: InvoiceCorrection[]; total: number };

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

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:4191/api/v1").replace(/\/$/, "");
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
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
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
    throw new ApiRequestError(message, response.status, code, source);
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
  downloadFinanceReport: async (params: { from?: string; to?: string; branchId?: string } = {}) => { const query = new URLSearchParams(); if (params.from) query.set("from", params.from); if (params.to) query.set("to", params.to); if (params.branchId) query.set("branchId", params.branchId); const response = await fetch(`${API_BASE}/finance/reports/summary.csv?${query}`, { headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined }); if (!response.ok) throw new ApiRequestError("تعذر تصدير التقرير المالي", response.status); return response.blob(); },
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
  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken && accessToken) await request<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }, false).catch(() => undefined);
    clearTokens();
  },
};

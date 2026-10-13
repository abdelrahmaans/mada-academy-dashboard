import { clearTokens, readTokens, saveTokens } from "../auth/tokenStore";
import type { AccountType, AuthIdentity, AuthTokens } from "../auth/types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type RequestOptions = { authenticated?: boolean; retryAfterRefresh?: boolean };

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
  substituteInstructorId?: string | null;
};

export type SessionListResponse = {
  items: SessionRecord[];
  total: number;
  scopeLevel: string;
  branchId: string | null;
};

export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "EXCUSED"
  | "UNMARKED";

export type AttendanceItem = {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  lateMinutes: number | null;
  updatedAt: string | null;
};

export type AttendanceResponse = {
  sessionId: string;
  sessionStatus: string;
  items: AttendanceItem[];
  total: number;
};

export type AttendanceRecordInput = {
  studentId: string;
  status: Exclude<AttendanceStatus, "UNMARKED">;
  lateMinutes?: number | null;
};

export type EvaluationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "PUBLISHED";

export type SessionEvaluationRecord = {
  studentId: string;
  score: number | null;
  notes: string | null;
  status: EvaluationStatus;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

export type SessionEvaluationListResponse = {
  sessionId: string;
  items: SessionEvaluationRecord[];
  total: number;
};

export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  targetType: string | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationRecord[];
  total: number;
};

function apiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (!value) {
    throw new ApiRequestError(
      "عنوان API غير مضبوط. انسخ apps/mobile/.env.example إلى .env.local واضبط EXPO_PUBLIC_API_URL.",
      0,
      "API_URL_MISSING"
    );
  }
  return value;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  let payload: unknown;
  if (body) {
    try {
      payload = JSON.parse(body);
    } catch {
      payload = body;
    }
  }
  if (!response.ok) {
    const record =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    const nestedError =
      typeof record.error === "object" && record.error !== null
        ? (record.error as Record<string, unknown>)
        : {};
    const extensions =
      typeof record.extensions === "object" && record.extensions !== null
        ? (record.extensions as Record<string, unknown>)
        : {};
    const status = response.status;
    const codeValue = nestedError.code ?? extensions.code ?? record.code;
    const code = typeof codeValue === "string" ? codeValue : undefined;
    let message =
      typeof nestedError.message === "string"
        ? nestedError.message
        : typeof record.detail === "string"
          ? record.detail
          : typeof record.title === "string"
            ? record.title
            : typeof record.message === "string"
              ? record.message
              : "";
    if (status === 401)
      message =
        "انتهت الجلسة أو بيانات الدخول غير صحيحة. سجّل الدخول مرة أخرى.";
    else if (status === 403)
      message = "هذا الإجراء غير متاح للدور أو النطاق الحالي.";
    else if (status === 429 && code === "LOGIN_LOCKED")
      message =
        "تم إيقاف محاولات الدخول مؤقتًا. حاول لاحقًا أو تواصل مع مسؤول الأكاديمية.";
    else if (!message) message = `تعذر تنفيذ الطلب (HTTP ${status}).`;
    throw new ApiRequestError(message, status, code);
  }
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

async function rawFetch(path: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, init);
  } catch (cause) {
    throw new ApiRequestError(
      cause instanceof Error
        ? `تعذر الاتصال بالخادم: ${cause.message}`
        : "تعذر الاتصال بالخادم.",
      0,
      "NETWORK_ERROR"
    );
  }
  return response;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const { refreshToken } = await readTokens();
    if (!refreshToken) {
      await clearTokens();
      return false;
    }
    const response = await rawFetch("/auth/refresh", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (response.status === 401 || response.status === 403) {
      await clearTokens();
      return false;
    }
    if (!response.ok) await parseResponse(response);
    await saveTokens(await parseResponse<AuthTokens>(response));
    return true;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const authenticated = options.authenticated ?? true;
  const retryAfterRefresh = options.retryAfterRefresh ?? true;
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type"))
    headers.set("content-type", "application/json");
  if (authenticated) {
    const { accessToken } = await readTokens();
    if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  }

  const response = await rawFetch(path, { ...init, headers });
  if (response.status === 401 && authenticated && retryAfterRefresh) {
    const refreshed = await refreshSession();
    if (refreshed)
      return request<T>(path, init, {
        authenticated,
        retryAfterRefresh: false,
      });
  }
  return parseResponse<T>(response);
}

export const apiClient = {
  login: async (phone: string, password: string, accountType: AccountType) => {
    const tokens = await request<AuthTokens>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ phone, password, accountType }),
      },
      { authenticated: false, retryAfterRefresh: false }
    );
    try {
      await saveTokens(tokens);
    } catch (cause) {
      await clearTokens();
      throw cause;
    }
    return tokens;
  },
  me: () => request<AuthIdentity>("/me"),
  listSessions: (
    params: { from?: string; to?: string; status?: string } = {}
  ) => {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.status) query.set("status", params.status);
    const queryString = query.toString();
    const suffix = queryString ? `?${queryString}` : "";
    return request<SessionListResponse>(`/sessions${suffix}`);
  },
  getSession: (sessionId: string) =>
    request<SessionRecord>(`/sessions/${encodeURIComponent(sessionId)}`),
  getSessionAttendance: (sessionId: string) =>
    request<AttendanceResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/attendance`
    ),
  upsertSessionAttendance: (
    sessionId: string,
    records: AttendanceRecordInput[]
  ) =>
    request<AttendanceResponse>(
      `/sessions/${encodeURIComponent(sessionId)}/attendance`,
      { method: "PUT", body: JSON.stringify({ records }) }
    ),
  listSessionEvaluations: (sessionId: string) =>
    request<SessionEvaluationListResponse>(
      `/scheduling/sessions/${encodeURIComponent(sessionId)}/evaluations`
    ),
  saveSessionEvaluations: (
    sessionId: string,
    items: { studentId: string; score: number | null; notes: string }[]
  ) =>
    request<{ sessionId: string; saved: number }>(
      `/scheduling/sessions/${encodeURIComponent(sessionId)}/evaluations`,
      { method: "PUT", body: JSON.stringify({ items }) }
    ),
  submitSessionEvaluations: (sessionId: string, studentIds: string[]) =>
    request<{ sessionId: string; submitted: number; status: string }>(
      `/scheduling/sessions/${encodeURIComponent(sessionId)}/evaluations/submit`,
      { method: "POST", body: JSON.stringify({ studentIds }) }
    ),
  completeSession: (sessionId: string) =>
    request<{ sessionId: string; status: string; completedAt: string }>(
      `/sessions/${encodeURIComponent(sessionId)}/complete`,
      { method: "POST" }
    ),
  listNotifications: (unreadOnly = false) =>
    request<NotificationListResponse>(
      `/scheduling/notifications?unreadOnly=${unreadOnly}`
    ),
  markNotificationRead: (notificationId: string) =>
    request<void>(
      `/scheduling/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: "POST" }
    ),
  logout: async (): Promise<boolean> => {
    let serverRevoked = false;
    try {
      const { refreshToken } = await readTokens();
      if (!refreshToken) return true;
      await request<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      serverRevoked = true;
    } catch {
      // Always clear the device session; the caller can show that remote revocation was not confirmed.
    } finally {
      await clearTokens();
    }
    return serverRevoked;
  },
  clearLocalSession: clearTokens,
};

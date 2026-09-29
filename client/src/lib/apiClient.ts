export type AuthMe = {
  id: string;
  accountType: string;
  role: string;
  tenantId: string;
  branchId?: string;
  scopeLevel: string;
};

export type DashboardSummary = {
  students: number;
  activeEnrollments: number;
  upcomingSessions: number;
  completedSessions: number;
  branchCount: number;
  upcoming: Array<{ id: string; sessionNumber: number; startAt: string; status: string }>;
};

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
    throw new Error(body || `API request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json();
  return (payload.data ?? payload) as T;
}

export const apiClient = {
  baseUrl: API_BASE,
  hasSession: () => Boolean(accessToken),
  sendOtp: (phone: string) => request<{ expiresAt: string; developmentCode?: string }>("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone, accountType: "staff" }) }),
  verifyOtp: async (phone: string, code: string) => {
    const response = await request<TokenResponse>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code, accountType: "staff" }) }, false);
    saveTokens(response);
    return response;
  },
  me: () => request<AuthMe>("/me"),
  dashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken && accessToken) await request<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }, false).catch(() => undefined);
    clearTokens();
  },
};

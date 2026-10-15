const API_BASE = (import.meta.env.VITE_API_URL || "https://academy-dashboard.runasp.net/api/v1").replace(/\/$/, "");
const rawDashboard = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";
export const DASHBOARD_URL = rawDashboard.includes("/login") ? rawDashboard : `${rawDashboard.replace(/\/$/, "")}/login`;
export const DASHBOARD_LIVE_DEMO = import.meta.env.VITE_DASHBOARD_LIVE_DEMO || `${rawDashboard.replace(/\/$/, "")}/workspace`;

type PublicLeadInput = {
  kind: "demo" | "registration";
  name: string;
  email: string;
  phone: string;
  academyName?: string;
  branchCount?: string;
  operationalNeed?: string;
  /** Legacy fields remain accepted for existing preview links during the transition. */
  company?: string;
  teamSize?: string;
  trainingNeed?: string;
  track?: "individual" | "team";
  goal?: string;
};

export async function submitPublicLead(input: PublicLeadInput) {
  const response = await fetch(`${API_BASE}/public/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null) as { data?: unknown; detail?: string; title?: string; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(payload?.detail || payload?.error?.message || payload?.title || "تعذر إرسال الطلب. حاول مرة أخرى.");
  return payload?.data;
}

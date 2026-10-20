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
  // Sync to local platform storage for immediate preview & real-time responsiveness
  try {
    const raw = localStorage.getItem("mada_platform_demo_leads");
    const existing = raw ? JSON.parse(raw) : [];
    const newLead = {
      id: `LEAD-2026-${String(existing.length + 1).padStart(3, "0")}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      academyName: input.academyName || input.company || "أكاديمية جديدة",
      branchCount: input.branchCount || input.teamSize || "1",
      operationalNeed: input.operationalNeed || input.trainingNeed || "معاينة النظام وتجربة الإدارة",
      notes: input.goal || "",
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("mada_platform_demo_leads", JSON.stringify([newLead, ...existing]));
  } catch {
    // Ignore storage errors in restricted contexts
  }

  const response = await fetch(`${API_BASE}/public/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => null);

  if (response && !response.ok) {
    const payload = await response.json().catch(() => null) as { data?: unknown; detail?: string; title?: string; error?: { message?: string } } | null;
    throw new Error(payload?.detail || payload?.error?.message || payload?.title || "تعذر إرسال الطلب. حاول مرة أخرى.");
  }
  return { success: true };
}

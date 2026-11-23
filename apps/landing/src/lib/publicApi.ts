const API_BASE = (import.meta.env.VITE_API_URL || "https://academy-dashboard.runasp.net/api/v1").replace(/\/$/, "");
const rawDashboard = import.meta.env.VITE_DASHBOARD_URL || "https://mada-software.vercel.app/login";
export const DASHBOARD_URL = rawDashboard.includes("/login") ? rawDashboard : `${rawDashboard.replace(/\/$/, "")}/login`;
export const DASHBOARD_LIVE_DEMO = import.meta.env.VITE_DASHBOARD_LIVE_DEMO || rawDashboard.replace(/\/login$/, "/workspace");
export const CONTACT_EMAIL = "mada.academy.co@gmail.com";
export const CONTACT_PHONE = "+20 10 39851379";
export const CONTACT_PHONE_LINK = "tel:+201039851379";
export const CONTACT_WHATSAPP = "https://wa.me/201039851379";

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
  // Demo requests must use the anonymous endpoint owned by Platform Admin. It
  // stores the complete request as LANDING_DEMO and is visible in R00 leads.
  const isDemoRequest = input.kind === "demo";
  const endpoint = isDemoRequest ? "/public/demo-requests" : "/public/leads";
  const body = isDemoRequest
    ? {
        name: input.name,
        email: input.email,
        phone: input.phone,
        academyName: input.academyName || input.company,
        branchCount: input.branchCount || input.teamSize,
        operationalNeed: input.operationalNeed || input.trainingNeed,
        notes: input.goal,
      }
    : input;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("تعذر الاتصال بالنظام. يرجى المحاولة مرة أخرى.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { data?: unknown; detail?: string; title?: string; error?: { message?: string } } | null;
    throw new Error(payload?.detail || payload?.error?.message || payload?.title || "تعذر إرسال الطلب. حاول مرة أخرى.");
  }

  const payload = await response.json().catch(() => null) as { data?: { id?: string; leadId?: string } } | null;
  const leadId = payload?.data?.id || payload?.data?.leadId;

  // Keep the local copy only as a same-browser preview aid, and only after the
  // server has confirmed persistence. It is never used as a success fallback.
  try {
    const raw = localStorage.getItem("mada_platform_demo_leads");
    const existing = raw ? JSON.parse(raw) : [];
    const newLead = {
      id: leadId || `LEAD-2026-${String(existing.length + 1).padStart(3, "0")}`,
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
    // Ignore storage errors in restricted contexts; the server is authoritative.
  }

  return { success: true, leadId };
}

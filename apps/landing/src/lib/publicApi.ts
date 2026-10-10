const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:4191/api/v1").replace(/\/$/, "");
export const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || "/login";

type PublicLeadInput = {
  kind: "demo" | "registration";
  name: string;
  email: string;
  phone: string;
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

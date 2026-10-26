import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Plus,
  Send,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  type CreateSupportTicketInput,
  type TenantSupportTicketItem,
} from "@/lib/apiClient";

export interface ContactSupportModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "TECHNICAL", label: "مشكلة فنية أو عطل", icon: "🔴", desc: "أخطاء في الشاشات، عدم ظهور بيانات، مشاكل تسجيل" },
  { value: "MEETING_REQUEST", label: "طلب ميتنج / اجتماع أونلاين", icon: "📅", desc: "جلسة تدريب لفريق العمل أو نقاش ميزات وتطوير" },
  { value: "FEATURE_SUGGESTION", label: "اقتراح ميزة جديدة", icon: "💡", desc: "أفكار إضافية تود رؤيتها في المنصة مستقبلاً" },
  { value: "BILLING", label: "اشتراكات وترقية فروع", icon: "💳", desc: "توسعة عدد الفروع أو استفسار عن الفاتورة" },
  { value: "GENERAL", label: "استفسار تشغيلي عام", icon: "💬", desc: "أي سؤال يخص إدارة الأكاديمية والعمليات" },
];

const PRIORITIES = [
  { value: "URGENT", label: "عاجل جداً", color: "#dc2626", bg: "#fef2f2" },
  { value: "HIGH", label: "أولوية عالية", color: "#d97706", bg: "#fffbeb" },
  { value: "MEDIUM", label: "أولوية متوسطة", color: "#2563eb", bg: "#eff6ff" },
  { value: "LOW", label: "عادي", color: "#475569", bg: "#f8fafc" },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "تذكرة جديدة 🟡", color: "#b45309", bg: "#fef3c7" },
  IN_PROGRESS: { label: "قيد المتابعة 🔵", color: "#1d4ed8", bg: "#dbeafe" },
  WAITING_CLIENT: { label: "بانتظار ردكم 🟠", color: "#c2410c", bg: "#ffedd5" },
  RESOLVED: { label: "تم الحل ✓", color: "#15803d", bg: "#dcfce7" },
  CANCELLED: { label: "ملغاة", color: "#64748b", bg: "#f1f5f9" },
};

export function ContactSupportModal({ open, onClose }: ContactSupportModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<TenantSupportTicketItem[]>([]);

  // Form State
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("TECHNICAL");
  const [priority, setPriority] = useState("MEDIUM");

  const loadMyTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.listMySupportTickets();
      setMyTickets(res.items);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadMyTickets();
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || subject.trim().length < 3) {
      toast.error("يرجى كتابة عنوان التذكرة (3 أحرف على الأقل)");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      toast.error("يرجى شرح تفاصيل المشكلة أو طلب الميتنج بوضوح");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateSupportTicketInput = {
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      };
      await apiClient.createSupportTicket(payload);
      toast.success("تم إرسال تذكرتك لفريق إدارة المنصة بنجاح! سيتم الرد عليك في أسرع وقت. 🚀");
      setSubject("");
      setDescription("");
      setCategory("TECHNICAL");
      setPriority("MEDIUM");
      await loadMyTickets();
      setActiveTab("history");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إرسال التذكرة حالياً.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(13, 148, 136, 0.25)",
              }}
            >
              <Headphones size={22} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                الدعم الفني وطلب مقابلة مع إدارة المنصة
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                فريق المنصة في خدمتكم دائماً لحل أي عطل تشغيلي أو ترتيب اجتماعات تطويرية.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              padding: "6px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "0 16px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            style={{
              padding: "12px 18px",
              fontSize: "0.86rem",
              fontWeight: 700,
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "new" ? "3px solid #0d9488" : "3px solid transparent",
              color: activeTab === "new" ? "#0d9488" : "#64748b",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={16} /> رفع تذكرة / طلب جديد
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            style={{
              padding: "12px 18px",
              fontSize: "0.86rem",
              fontWeight: 700,
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "history" ? "3px solid #0d9488" : "3px solid transparent",
              color: activeTab === "history" ? "#0d9488" : "#64748b",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Clock size={16} /> سجل تذاكرنا السابقة ({myTickets.length})
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
          {activeTab === "new" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Category picker */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 700, fontSize: "0.84rem", color: "#1e293b" }}>
                  نوع الطلب أو المشكلة
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "8px" }}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.value;
                    return (
                      <div
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          border: `1.5px solid ${isSelected ? "#0d9488" : "#e2e8f0"}`,
                          background: isSelected ? "rgba(13, 148, 136, 0.05)" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: isSelected ? "#0f766e" : "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{cat.icon}</span> {cat.label}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "3px" }}>
                          {cat.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority & Subject */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.82rem", color: "#1e293b" }}>
                    درجة الأهمية
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.82rem", color: "#1e293b" }}>
                    عنوان التذكرة أو الموضوع <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الطلاب لا يستطيعون رؤية الحصص القادمة / طلب موعد ميتنج..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.82rem", color: "#1e293b" }}>
                  تفاصيل المشكلة أو المقابلة المطلوبة <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="اشرح المشكلة بالتفصيل، ما الذي حدث؟ وما الذي كنت تحاول تنفيذه؟ أو حدد الموعد المفضل للميتنج ورقم الهاتف للتنسيق..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.82rem",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Notice */}
              <div
                style={{
                  background: "#f0fdfa",
                  border: "1px solid #ccfbf1",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.78rem",
                  color: "#0f766e",
                }}
              >
                <LifeBuoy size={18} style={{ flexShrink: 0 }} />
                <span>
                  تصل التذكرة مباشرة إلى لوحة تحكم السوبر أدمن (Platform Super Admin)، وسيتم تحديث حالتها فور مراجعتها مع إمكانية إرسال رابط الاجتماع أو الحل هنا.
                </span>
              </div>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "8px 22px",
                    borderRadius: "8px",
                    background: "#0d9488",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)",
                  }}
                >
                  <Send size={15} /> {submitting ? "جارٍ الإرسال..." : "إرسال التذكرة للإدارة"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              {loading ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  جارٍ تحميل سجل التذاكر...
                </div>
              ) : myTickets.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    color: "#94a3b8",
                  }}
                >
                  <MessageSquare size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>لم تقم برفع أي تذاكر دعم سابقة</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    style={{
                      marginTop: "12px",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      background: "#0d9488",
                      color: "#fff",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    رفع تذكرة جديدة الآن
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {myTickets.map((t) => {
                    const st = STATUS_LABELS[t.status] || { label: t.status, color: "#334155", bg: "#f1f5f9" };
                    return (
                      <div
                        key={t.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          background: "#ffffff",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                              {t.subject}
                            </span>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "12px",
                                background: st.bg,
                                color: st.color,
                              }}
                            >
                              {st.label}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {new Date(t.createdAt).toLocaleDateString("ar-EG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
                          {t.description}
                        </p>

                        {/* If Admin scheduled a meeting */}
                        {t.meetingUrl && (
                          <div
                            style={{
                              marginTop: "4px",
                              padding: "10px 14px",
                              borderRadius: "8px",
                              background: "#eef2ff",
                              border: "1px solid #c7d2fe",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Video size={18} style={{ color: "#4f46e5" }} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#312e81" }}>
                                  تم تحديد موعد مقابلة أونلاين من الإدارة!
                                </div>
                                {t.meetingScheduledAt && (
                                  <div style={{ fontSize: "0.74rem", color: "#4338ca" }}>
                                    الموعد: {new Date(t.meetingScheduledAt).toLocaleString("ar-EG")}
                                  </div>
                                )}
                              </div>
                            </div>
                            <a
                              href={t.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                background: "#4f46e5",
                                color: "#ffffff",
                                textDecoration: "none",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                              }}
                            >
                              <ExternalLink size={13} /> انضم للاجتماع
                            </a>
                          </div>
                        )}

                        {/* If Admin resolved with notes */}
                        {t.resolutionNotes && (
                          <div
                            style={{
                              marginTop: "4px",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              fontSize: "0.8rem",
                              color: "#166534",
                            }}
                          >
                            <strong>رد فريق المنصة:</strong> {t.resolutionNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

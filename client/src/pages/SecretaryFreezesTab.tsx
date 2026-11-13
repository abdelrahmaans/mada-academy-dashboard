import React, { useState } from "react";
import { MessageSquare, PhoneCall, Plus, Send, Star, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { type EvaluationReviewRecord, type SubscriptionFreezeRequest } from "@/lib/apiClient";

export interface SecretaryFreezesTabProps {
  serverFreezes: SubscriptionFreezeRequest[];
  evaluationReviews?: EvaluationReviewRecord[];
  onOpenFreezeModal: () => void;
}

export function SecretaryFreezesTab({
  serverFreezes,
  evaluationReviews = [],
  onOpenFreezeModal,
}: SecretaryFreezesTabProps) {
  const allFreezes = serverFreezes;
  const [activeSubTab, setActiveSubTab] = useState<"freezes" | "reviews">("freezes");

  const handleEscalateToManager = (review: EvaluationReviewRecord) => {
    toast.success(`تم رفع طلب مراجعة ${review.studentName} إلى لوحة مدير الفرع للاعتماد.`);
  };

  const handleContactParent = (review: EvaluationReviewRecord, method: "whatsapp" | "call") => {
    if (method === "whatsapp") {
      toast.info(`جارٍ فتح تطبيق واتساب للتواصل مع ولي أمر الطالب ${review.studentName}...`);
    } else {
      toast.info(`جارٍ الاتصال بولي أمر الطالب ${review.studentName}...`);
    }
  };

  return (
    <section className="secretary-panel">
      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("freezes")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: activeSubTab === "freezes" ? "#0f766e" : "#f1f5f9",
            color: activeSubTab === "freezes" ? "#ffffff" : "#475569",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          طلبات تجميد الاشتراكات ({allFreezes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("reviews")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: activeSubTab === "reviews" ? "#0f766e" : "#f1f5f9",
            color: activeSubTab === "reviews" ? "#ffffff" : "#475569",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Star size={16} /> استفسارات ومراجعات التقييم ({evaluationReviews.length})
        </button>
      </div>

      {activeSubTab === "freezes" && (
        <>
          <div
            className="secretary-panel-toolbar"
            style={{
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                طلبات تجميد الاشتراكات والحصص التعويضية
              </h2>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "#64748b",
                  margin: "3px 0 0",
                }}
              >
                تسجيل تجميد فوري للطلاب عبر شباك الاستقبال ومتابعة القرارات
                المعتمدة.
              </p>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={onOpenFreezeModal}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> تسجيل طلب تجميد بالاستقبال
            </button>
          </div>

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {allFreezes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                لا توجد طلبات تجميد مسجلة حالياً.
              </div>
            ) : (
              allFreezes.map((freeze) => {
                const statusBadge =
                  freeze.status === "APPROVED"
                    ? {
                        label: "معتمد · تم التمديد",
                        bg: "rgba(16, 185, 129, 0.12)",
                        color: "#059669",
                      }
                    : freeze.status === "REJECTED"
                    ? {
                        label: "مرفوض",
                        bg: "rgba(239, 68, 68, 0.12)",
                        color: "#dc2626",
                      }
                    : {
                        label: "قيد مراجعة مدير الفرع",
                        bg: "rgba(245, 158, 11, 0.12)",
                        color: "#d97706",
                      };

                return (
                  <article
                    key={freeze.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "16px",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px" }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {freeze.studentName}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          ({freeze.courseName})
                        </span>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: statusBadge.bg,
                            color: statusBadge.color,
                          }}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        مقدم الطلب: {freeze.submittedByName}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: "0.86rem", color: "#334155" }}>
                      <strong>السبب:</strong> {freeze.reasonText}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                        fontSize: "0.82rem",
                        color: "#64748b",
                        borderTop: "1px dashed #e2e8f0",
                        paddingTop: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <span>
                        فترة التجميد: من <b>{freeze.startDate}</b> إلى{" "}
                        <b>{freeze.endDate}</b>
                      </span>
                      <span>
                        رصيد التعويض المتاح: <b>{freeze.makeUpCreditsAwarded} حصص</b>
                      </span>
                      {freeze.extendedNewEndDate && (
                        <span style={{ color: "#059669", fontWeight: 600 }}>
                          الانتهاء الجديد: {freeze.extendedNewEndDate}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      )}

      {activeSubTab === "reviews" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              استفسارات ومراجعات التقييم الأكاديمي
            </h2>
            <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "3px 0 0" }}>
              متابعة طلبات أولياء الأمور حول تقييمات الجلسات والتنسيق بين ولي الأمر والمدرب ومدير الفرع.
            </p>
          </div>

          {evaluationReviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#64748b", background: "#f8fafc", borderRadius: "10px" }}>
              لا توجد طلبات مراجعة تقييم معلقة حالياً.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {evaluationReviews.map((rev) => (
                <article
                  key={rev.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                        {rev.studentName}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        ({rev.courseName})
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: "rgba(245, 158, 11, 0.12)",
                          color: "#d97706",
                        }}
                      >
                        بانتظار مراجعة الإدارة
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      جلسة: {rev.sessionDate}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155", lineHeight: "1.6" }}>
                    <strong>ملاحظة المراجعة:</strong> {rev.notes || "طلب مراجعة حول أداء الطالب في الجلسة."}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      المدرب: <b>{rev.instructorName || "مدرب الورشة"}</b> · الدرجة المسجلة: <b>{rev.score ?? "—"} / 100</b>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleContactParent(rev, "whatsapp")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #10b981",
                          background: "#ecfdf5",
                          color: "#059669",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <MessageSquare size={14} /> واتساب ولي الأمر
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContactParent(rev, "call")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <PhoneCall size={14} /> اتصال
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEscalateToManager(rev)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          background: "#0f766e",
                          color: "#ffffff",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Send size={14} /> رفع لمدير الفرع
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

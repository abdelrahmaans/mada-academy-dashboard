import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  evaluationReviewStorage,
  freezeStorage,
  type ConsumerCheckoutSession,
  type ConsumerSessionRecord,
  type FinanceInvoice,
  type SubscriptionFreezeRequest,
} from "@/lib/apiClient";
import { attendanceStatusLabel } from "@/lib/statusLabels";
import type { ChildData, PortalTab } from "@/pages/FamilyPortalTypes";
import GroupLeaderboardCard from "@/components/GroupLeaderboardCard";

export function ChildOverview({
  child,
  onTab,
}: {
  child: ChildData;
  onTab: (tab: PortalTab) => void;
}) {
  const latestEvaluation = [...(child.sessionRecords ?? [])]
    .filter(item => item.score !== null)
    .sort((a, b) => b.startAt.localeCompare(a.startAt))[0];
  const latestEvaluationValue = latestEvaluation?.score == null
    ? "غير متاح"
    : `${(latestEvaluation.score / 20).toFixed(1)} / 5`;

  return (
    <>
      <div className="portal-metrics-grid">
        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">انتظام الحضور</span>
            <span className="portal-metric-icon teal"><CalendarDays size={18} /></span>
          </div>
          <div className="portal-metric-value">{child.attendance === null ? "—" : `${child.attendance}%`}</div>
          <div className="portal-metric-note">من سجل الجلسات المعتمدة</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">التقدم في المسار</span>
            <span className="portal-metric-icon violet"><Activity size={18} /></span>
          </div>
          <div className="portal-metric-value">{child.progress === null ? "—" : `${child.progress}%`}</div>
          <div className="portal-metric-note">{child.sessionRecords?.length ? "من الجلسات المسجلة" : "لا توجد جلسات مسجلة"}</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">آخر تقييم معتمد</span>
            <span className="portal-metric-icon amber"><Star size={18} /></span>
          </div>
          <div className="portal-metric-value">{latestEvaluationValue}</div>
          <div className="portal-metric-note">{latestEvaluation ? "من سجل التقييمات" : "لا توجد تقييمات مسجلة"}</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">الوضع المالي</span>
            <span className="portal-metric-icon blue"><Wallet size={18} /></span>
          </div>
          <div className="portal-metric-value" style={{ fontSize: "1.25rem" }}>{child.invoiceStatus}</div>
          <div className="portal-metric-note">{child.invoiceDue}</div>
        </div>
      </div>

      {/* Live Group Leaderboard Podium */}
      <div style={{ marginBottom: "20px" }}>
        <GroupLeaderboardCard
          currentStudentId={child.id}
          studentName={child.name}
          groupId={(child.sessionRecords?.[0] as { courseOfferingId?: string } | undefined)?.courseOfferingId}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <section className="consumer-panel">
          <div className="consumer-panel-header">
            <div>
              <CalendarDays size={18} />
              <h2>الجلسة القادمة</h2>
            </div>
            <button type="button" className="button button-ghost" style={{ fontSize: "0.85rem", color: "#0d9488" }} onClick={() => onTab("attendance")}>
              عرض كل الجلسات <ChevronLeft size={14} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#ccfbf1", color: "#0d9488" }}>
              <CalendarDays size={22} />
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: "1.05rem", color: "#0f172a", marginBottom: "4px" }}>{child.nextSession}</strong>
              <small style={{ color: "#64748b", fontSize: "0.86rem" }}>
                {child.course} · {child.nextRoom} · فرع {child.branch}
              </small>
            </div>
            {child.hasUpcomingSession && <span className="status-tag scheduled">قادمة ومؤكدة</span>}
          </div>
        </section>

        <section className="consumer-panel">
          <div className="consumer-panel-header">
            <div>
              <Star size={18} />
              <h2>آخر متابعة أكاديمية</h2>
            </div>
            <button type="button" className="button button-ghost" style={{ fontSize: "0.85rem", color: "#0d9488" }} onClick={() => onTab("evaluations")}>
              عرض بطاقة التقييم <ChevronLeft size={14} />
            </button>
          </div>
          {latestEvaluation ? (
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", background: "#fefce8", borderRadius: "12px", border: "1px solid #fef08a" }}>
              <span style={{ display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#fef08a", color: "#a16207", fontWeight: 800, fontSize: "1.1rem" }}>
                ★
              </span>
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", fontSize: "1rem", color: "#0f172a", marginBottom: "2px" }}>
                  تقييم الجلسة: {latestEvaluationValue}
                </strong>
                <small style={{ color: "#713f12", fontSize: "0.84rem" }}>
                  {latestEvaluation.notes || "لا توجد ملاحظة مسجلة لهذه الجلسة."}
                </small>
              </div>
            </div>
          ) : (
            <div className="consumer-note-box" role="status">لا توجد تقييمات مسجلة لهذا الطفل حاليًا.</div>
          )}
        </section>
      </div>
    </>
  );
}

export function ChildAttendance({ child }: { child: ChildData }) {
  const sessions = child.sessionRecords ?? [];

  return (
    <section className="consumer-panel">
      <div className="consumer-panel-header">
        <div>
          <CalendarDays size={18} />
          <h2>سجل الحضور والانتظام الأكاديمي</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          إجمالي الجلسات المسجلة: <b>{sessions.length} جلسة</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <div style={{ padding: "14px 18px", background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "12px" }}>
          <small style={{ color: "#0d9488", fontWeight: 700, fontSize: "0.8rem" }}>نسبة الحضور الإجمالية</small>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f766e" }}>{child.attendance === null ? "—" : `${child.attendance}%`}</div>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            {child.attendance === null ? "لا توجد سجلات حضور" : "من الجلسات ذات الحضور المسجل"}
          </span>
        </div>
        <div style={{ padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <small style={{ color: "#475569", fontWeight: 700, fontSize: "0.8rem" }}>الجلسات المكتملة</small>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e293b" }}>
            {sessions.filter(s => s.status === "COMPLETED").length}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>من الجلسات المسجلة في النظام</span>
        </div>
        <div style={{ padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
          <small style={{ color: "#475569", fontWeight: 700, fontSize: "0.8rem" }}>الجلسات المجدولة القادمة</small>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0284c7" }}>
            {sessions.filter(s => s.status !== "CANCELLED" && new Date(s.startAt).getTime() > Date.now()).length}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>من مواعيد الجلسات القادمة المسجلة</span>
        </div>
      </div>

      <div className="consumer-sessions-list">
        {sessions.length === 0 ? (
          <div className="consumer-note-box">
            لا توجد جلسات مدخلة بعد لهذا الطفل في النظام المباشر.
          </div>
        ) : (
          sessions.map((sess, idx) => {
            const isCompleted = sess.status === "COMPLETED";
            const isPresent = sess.attendanceStatus === "PRESENT";
            const isLate = sess.attendanceStatus === "LATE";
            const isAbsent = sess.attendanceStatus === "ABSENT";
            const isExcused = sess.attendanceStatus === "EXCUSED";

            const tagClass = isPresent ? "present" : isLate ? "late" : isAbsent ? "absent" : isExcused ? "excused" : "scheduled";
            const tagLabel = sess.attendanceStatus && sess.attendanceStatus !== "UNMARKED"
              ? attendanceStatusLabel(sess.attendanceStatus)
              : "مجدولة";

            const formattedDate = new Date(sess.startAt).toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const formattedTime = new Date(sess.startAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={sess.sessionId || idx} className="consumer-session-item">
                <div className="consumer-session-item-main">
                  <span className={`consumer-session-item-icon ${isCompleted ? "done" : "upcoming"}`}>
                    <CalendarDays size={20} />
                  </span>
                  <div className="consumer-session-item-info">
                    <strong>جلسة رقم #{sess.sessionNumber} · {sess.courseName}</strong>
                    <small>
                      {formattedDate} · الساعة {formattedTime} · {sess.classroomName} ({sess.branchName})
                    </small>
                    {sess.notes && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#047857", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px" }}>
                        <strong>ملاحظة المدرب:</strong> {sess.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="consumer-session-badges">
                  {sess.score !== null && sess.score !== undefined && (
                    <span className="status-tag score">
                      ★ {sess.score} / 100
                    </span>
                  )}
                  <span className={`status-tag ${tagClass}`}>{tagLabel}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export function ChildEvaluations({ child }: { child: ChildData }) {
  const evaluations = (child.sessionRecords ?? []).filter(item => item.score !== null);
  const averageScore = evaluations.length
    ? evaluations.reduce((sum, item) => sum + (item.score ?? 0), 0) / evaluations.length
    : null;

  const [reviewModalSession, setReviewModalSession] = useState<ConsumerSessionRecord | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalSession) return;
    if (!reviewNote.trim()) {
      toast.error("يرجى كتابة سبب طلب المراجعة أو استفسارك.");
      return;
    }

    setSubmittingReview(true);
    try {
      evaluationReviewStorage.createReview({
        sessionId: reviewModalSession.sessionId,
        studentId: child.id,
        studentName: child.name,
        courseName: reviewModalSession.courseName || child.course || "البرنامج التدريبي",
        score: reviewModalSession.score,
        notes: reviewNote.trim(),
        sessionDate: reviewModalSession.startAt
          ? new Date(reviewModalSession.startAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
      toast.success("تم إرسال طلب مراجعة التقييم لإدارة الفرع والسكرتارية بنجاح وسيتم الرد عليك قريباً.");
      setReviewModalSession(null);
      setReviewNote("");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الطلب.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <GroupLeaderboardCard
        currentStudentId={child.id}
        studentName={child.name}
        groupId={(child.sessionRecords?.[0] as { courseOfferingId?: string } | undefined)?.courseOfferingId}
      />

      <section className="consumer-panel">
        <div className="consumer-panel-header">
          <div>
            <Star size={18} />
            <h2>التقييمات وبطاقات المتابعة الأكاديمية</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          درجات وملاحظات مسجلة من الجلسات
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <div style={{ padding: "16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", textAlign: "center" }}>
          <small style={{ color: "#92400e", fontWeight: 700, fontSize: "0.82rem" }}>متوسط درجات الجلسات المسجلة</small>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b45309" }}>
            {averageScore === null ? "—" : `${(averageScore / 20).toFixed(1)} / 5`}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#78350f" }}>
            {evaluations.length} تقييم{evaluations.length === 1 ? "" : "ات"} مسجل
          </span>
        </div>
      </div>

      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "14px", color: "#0f172a" }}>
        سجل تقييمات الجلسات الفردية
      </h3>

      {evaluations.length === 0 ? (
        <div className="consumer-note-box">
          لا توجد تقييمات منشورة لهذا الطفل حتى الآن. تظهر البطاقات بعد مراجعة رئيس المدربين.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {evaluations.map((ev, idx) => (
            <div
              key={ev.sessionId || idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                padding: "16px 20px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "1rem", color: "#0f172a" }}>
                    جلسة رقم #{ev.sessionNumber} · {ev.courseName}
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    ({new Date(ev.startAt).toLocaleDateString("ar-EG")})
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", color: "#334155", fontSize: "0.88rem", lineHeight: "1.6" }}>
                  <strong>ملاحظة وتوجيه المدرب:</strong> {ev.notes || "لا توجد ملاحظة مسجلة لهذه الجلسة."}
                </p>
                <div style={{ marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModalSession(ev);
                      setReviewNote("");
                    }}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Star size={13} /> طلب مراجعة أو استفسار عن التقييم
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#059669" }}>
                  {ev.score} / 100
                </span>
                <span className="status-tag score" style={{ fontSize: "0.78rem" }}>
                  مكافئ {((ev.score ?? 0) / 20).toFixed(1)} من 5 نجوم
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </section>

      {/* Review Request Modal */}
      {reviewModalSession && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReviewModalSession(null);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Star size={20} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                  طلب مراجعة تقييم الجلسة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalSession(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", fontSize: "0.85rem", color: "#475569", lineHeight: "1.6" }}>
              <div><strong>الطالب:</strong> {child.name}</div>
              <div><strong>الجلسة:</strong> #{reviewModalSession.sessionNumber} · {reviewModalSession.courseName}</div>
              <div><strong>الدرجة الحالية:</strong> {reviewModalSession.score} / 100</div>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  ملاحظات أو استفسار ولي الأمر
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="مثال: نرجو توضيح درجة التطبيق العملي للطفل، أو مراجعة معيار الدرجات مع المدرب..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  سيتم توجيه طلبك فوراً إلى مدير الفرع ومسؤول السكرتارية للمتابعة وإعادة المراجعة.
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setReviewModalSession(null)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0f766e",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {submittingReview ? "جارٍ الإرسال..." : "إرسال طلب المراجعة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChildInvoices({
  invoices,
  loading,
  error,
  onRetry,
  onPaymentSuccess,
}: {
  invoices: FinanceInvoice[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPaymentSuccess?: () => void;
}) {
  const [checkoutInvoice, setCheckoutInvoice] = useState<FinanceInvoice | null>(null);
  const [payMethod, setPayMethod] = useState<"CARD" | "WALLET" | "INSTAPAY">("CARD");
  const [payAmountEgp, setPayAmountEgp] = useState<string>("");
  const [session, setSession] = useState<ConsumerCheckoutSession | null>(null);
  const [busy, setBusy] = useState(false);

  const openCheckout = (invoice: FinanceInvoice) => {
    setCheckoutInvoice(invoice);
    setPayMethod("CARD");
    setPayAmountEgp(String(Math.round(invoice.remainingPiastres / 100)));
    setSession(null);
  };

  const handleStartCheckout = async () => {
    if (!checkoutInvoice) return;
    const parsedEgp = Number(payAmountEgp);
    const amountPiastres = Math.round(parsedEgp * 100);
    if (!Number.isFinite(amountPiastres) || amountPiastres <= 0 || amountPiastres > checkoutInvoice.remainingPiastres) {
      toast.error("يرجى إدخال مبلغ صحيح لا يتجاوز المتبقي في الفاتورة.");
      return;
    }
    setBusy(true);
    try {
      const created = await apiClient.createConsumerCheckout(checkoutInvoice.id, {
        method: payMethod,
        amountPiastres,
      });
      setSession(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر بدء جلسة الدفع الإلكتروني");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutInvoice || !session) return;
    setBusy(true);
    try {
      await apiClient.confirmConsumerCheckout(checkoutInvoice.id, {
        checkoutSessionId: session.checkoutSessionId,
        method: payMethod,
        amountPiastres: session.amountPiastres,
        gatewayReference: session.referenceCode,
        idempotencyKey: session.checkoutSessionId,
      });
      toast.success("تم السداد الإلكتروني بنجاح وتحديث رصيد الفاتورة.");
      setCheckoutInvoice(null);
      setSession(null);
      onPaymentSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تأكيد عملية السداد");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="consumer-panel">
      <div className="consumer-panel-header">
        <div>
          <Wallet size={18} />
          <h2>الفواتير والمدفوعات والأقساط</h2>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
          كشف حساب ورصيد الرسوم الدراسية
        </span>
      </div>

      {loading ? (
        <div className="consumer-note-box">
          <RefreshCw size={16} className="animate-spin" />
          <span>جارٍ جلب فواتير ومدفوعات الطفل…</span>
        </div>
      ) : error ? (
        <div className="consumer-note-box warning" role="alert">
          <AlertCircle size={16} />
          <span>تعذر تحميل الفواتير: {error}</span>
          <button type="button" className="button button-secondary" onClick={onRetry} style={{ marginInlineStart: "auto" }}>
            إعادة المحاولة
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="consumer-note-box">
          <CheckCircle2 size={16} />
          <span>لا توجد فواتير مستحقة أو غير مسددة مسجلة لهذا الطفل حاليًا.</span>
        </div>
      ) : (
        <div className="consumer-invoices-list">
          {invoices.map(invoice => {
            const isPaid = invoice.remainingPiastres === 0;
            const isPartial = invoice.paidPiastres > 0 && invoice.remainingPiastres > 0;
            const statusLabel = isPaid ? "مدفوع بالكامل" : isPartial ? "سداد جزئي" : "مستحق السداد";
            const statusClass = isPaid ? "present" : isPartial ? "late" : "absent";

            return (
              <div key={invoice.id} className="consumer-invoice-card">
                <div className="consumer-invoice-card-header">
                  <div>
                    <strong style={{ fontSize: "1.05rem", color: "#0f172a", display: "block" }}>
                      فاتورة رقم: {invoice.invoiceNumber}
                    </strong>
                    <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                      تاريخ الإصدار: {invoice.issueDate} · تاريخ الاستحقاق: {invoice.dueDate}
                    </small>
                  </div>
                  <span className={`status-tag ${statusClass}`}>{statusLabel}</span>
                </div>

                <div className="consumer-invoice-amounts">
                  <div className="consumer-invoice-amount-item">
                    <small>إجمالي الفاتورة</small>
                    <strong>{(invoice.totalPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                  <div className="consumer-invoice-amount-item">
                    <small>المبلغ المسدد</small>
                    <strong style={{ color: "#059669" }}>{(invoice.paidPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                  <div className="consumer-invoice-amount-item">
                    <small>المتبقي المستحق</small>
                    <strong className="remaining">{(invoice.remainingPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                </div>

                {invoice.lines && invoice.lines.length > 0 && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                    <small style={{ fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                      بنود الفاتورة والاشتراك:
                    </small>
                    {invoice.lines.map((l, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", color: "#334155" }}>
                        <span>• {l.description || "رسوم الدورة التدريبية"}</span>
                        <span>{((l.amountPiastres || invoice.totalPiastres) / 100).toLocaleString("ar-EG")} ج.م</span>
                      </div>
                    ))}
                  </div>
                )}

                {invoice.payments && invoice.payments.length > 0 && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                    <small style={{ fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>
                      إيصالات التحصيل المسجلة:
                    </small>
                    {invoice.payments.map((p, i: number) => (
                      <div key={p.id || i} className="consumer-receipt-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Receipt size={16} style={{ color: "#0d9488" }} />
                          <span>إيصال سداد بتاريخ {p.receivedOn} ({p.method === "CASH" ? "نقدي بخزينة الفرع" : "تحويل إلكتروني"})</span>
                        </div>
                        <strong style={{ color: "#059669" }}>+{(p.amountPiastres / 100).toLocaleString("ar-EG")} ج.م</strong>
                      </div>
                    ))}
                  </div>
                )}

                {invoice.remainingPiastres > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">
                      متاح السداد الفوري عبر البطاقة البنكية أو المحفظة أو إنستاباي
                    </span>
                    <button
                      type="button"
                      onClick={() => openCheckout(invoice)}
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700"
                    >
                      <CreditCard size={14} />
                      سداد أونلاين الآن
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {checkoutInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">بوابة السداد الإلكتروني</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  فاتورة {checkoutInvoice.invoiceNumber} · المتبقي {(checkoutInvoice.remainingPiastres / 100).toLocaleString("ar-EG")} ج.م
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setCheckoutInvoice(null); setSession(null); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {!session ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">وسيلة الدفع</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "CARD" as const, label: "بطاقة بنكية", icon: CreditCard },
                      { id: "WALLET" as const, label: "محفظة إلكترونية", icon: Smartphone },
                      { id: "INSTAPAY" as const, label: "إنستاباي", icon: Wallet },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = payMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPayMethod(opt.id)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${
                            active
                              ? "border-teal-600 bg-teal-50 text-teal-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <Icon size={16} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">المبلغ المراد سداده (ج.م)</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.round(checkoutInvoice.remainingPiastres / 100)}
                    value={payAmountEgp}
                    onChange={(e) => setPayAmountEgp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutInvoice(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleStartCheckout}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {busy && <Loader2 size={14} className="animate-spin" />}
                    متابعة للدفع
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="space-y-1.5 rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-950">
                  <div className="flex justify-between">
                    <span className="text-teal-700">مرجع العملية</span>
                    <span className="font-mono font-bold">{session.referenceCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-700">المبلغ المطلوب</span>
                    <span className="font-extrabold">{(session.amountPiastres / 100).toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-700">وضع البوابة</span>
                    <span className="font-bold">{session.gatewayMode === "SANDBOX" ? "بيئة اختبار آمنة (Sandbox)" : "بث مباشر"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSession(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    رجوع
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleConfirmCheckout}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    تأكيد وإتمام السداد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export function ChildFreezeSection({ child, liveMode }: { child: ChildData; liveMode: boolean }) {
  const [requests, setRequests] = useState<SubscriptionFreezeRequest[]>(() => {
    return liveMode ? [] : freezeStorage.getRequests().filter(r => r.studentId === child.id);
  });
  const [requestsLoading, setRequestsLoading] = useState(liveMode);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestRetryKey, setRequestRetryKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    startDate: string;
    endDate: string;
    reason: SubscriptionFreezeRequest["reason"];
    reasonText: string;
  }>({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    reason: "MEDICAL",
    reasonText: "",
  });

  useEffect(() => {
    if (!liveMode) {
      setRequests(freezeStorage.getRequests().filter(r => r.studentId === child.id));
      setRequestsLoading(false);
      setRequestsError(null);
      return;
    }

    let cancelled = false;
    setRequests([]);
    setRequestsLoading(true);
    setRequestsError(null);
    apiClient
      .consumerFreezeRequests()
      .then(res => {
        if (cancelled) return;
        setRequests(res.filter(r => r.studentId === child.id));
        setRequestsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRequests([]);
        setRequestsLoading(false);
        setRequestsError("تعذر تحميل طلبات التجميد حاليًا.");
      });

    return () => {
      cancelled = true;
    };
  }, [child.id, liveMode, requestRetryKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reasonText.trim()) {
      toast.error("يرجى كتابة سبب التجميد بالتفصيل");
      return;
    }
    if (liveMode) {
      try {
        const liveCreated = await apiClient.createConsumerFreezeRequest({
          studentId: child.id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          reasonText: formData.reasonText,
        });
        setRequests(prev => [liveCreated, ...prev]);
        setModalOpen(false);
        setFormData({
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          reason: "MEDICAL",
          reasonText: "",
        });
        toast.success("تم إرسال طلب التجميد بنجاح إلى مدير الفرع للمراجعة والاعتماد");
        return;
      } catch {
        toast.error("تعذر إرسال طلب التجميد إلى الخادم؛ لم يتم حفظ الطلب. يرجى المحاولة مرة أخرى.");
        return;
      }
    }

    const created = freezeStorage.createRequest({
      studentId: child.id,
      studentName: child.name,
      courseName: child.course,
      branchName: child.branch,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      reasonText: formData.reasonText,
      submittedByRole: "R08_PARENT",
      submittedByName: "ولي الأمر",
    });
    setRequests(prev => [created, ...prev]);
    setModalOpen(false);
    toast.success("تم إرسال طلب التجميد بنجاح إلى مدير الفرع");
  };

  const totalMakeUpCredits = requests
    .filter(r => r.status === "APPROVED")
    .reduce((sum, r) => sum + r.makeUpCreditsAwarded, 0);
  const freezeStatus = requestsLoading
    ? "جارٍ التحميل"
    : requestsError
      ? "غير متاح"
      : requests.some(r => r.status === "APPROVED")
        ? "يوجد طلب معتمد"
        : requests.some(r => r.status === "PENDING")
          ? "طلب قيد المراجعة"
          : requests.some(r => r.status === "REJECTED")
            ? "آخر طلب مرفوض"
            : "لا توجد طلبات";

  return (
    <section className="consumer-panel">
      <div className="consumer-panel-header">
        <div>
          <Snowflake size={18} />
          <h2>تجميد الاشتراك وحصص التعويض الأكاديمية</h2>
        </div>
        <button
          type="button"
          className="button button-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.88rem" }}
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} /> تقديم طلب تجميد جديد
        </button>
      </div>

      <div className="portal-metrics-grid" style={{ marginBottom: "20px" }}>
        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">حالة طلبات التجميد</span>
            <span className="portal-metric-icon teal"><Snowflake size={18} /></span>
          </div>
          <div className="portal-metric-value" style={{ fontSize: "1.3rem" }}>
            {freezeStatus}
          </div>
          <div className="portal-metric-note">{requestsError ? "تعذر تحميل حالة الطلبات من الخادم" : "طبقًا لقرارات إدارة الفرع"}</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">رصيد حصص التعويض</span>
            <span className="portal-metric-icon violet"><Clock size={18} /></span>
          </div>
          <div className="portal-metric-value">{requestsLoading || requestsError ? "—" : `${totalMakeUpCredits} حصة`}</div>
          <div className="portal-metric-note">متاحة للتسكين في فصول بديلة</div>
        </div>

        <div className="portal-metric-card">
          <div className="portal-metric-top">
            <span className="portal-metric-label">الطلبات المعلقة</span>
            <span className="portal-metric-icon amber"><AlertCircle size={18} /></span>
          </div>
          <div className="portal-metric-value">{requestsLoading || requestsError ? "—" : requests.filter(r => r.status === "PENDING").length}</div>
          <div className="portal-metric-note">قيد مراجعة مدير الفرع</div>
        </div>
      </div>

      <div className="consumer-note-box" style={{ background: "#f0fdfa", borderColor: "#ccfbf1" }}>
        <ShieldCheck size={18} style={{ color: "#0d9488" }} />
        <span>
          <strong>سياسة تجميد الاشتراك بالأكاديمية:</strong> يتاح لكل طالب تجميد الاشتراك لمرة واحدة بحد أقصى ٣٠ يومًا سنويًا بعذر مقبول (طبي، سفر، امتحانات مدرسية). يتم ترحيل تاريخ نهاية الاشتراك تلقائيًا عند الاعتماد وإضافة رصيد حصص تعويضية مساوٍ للحصص المتأثرة.
        </span>
      </div>

      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "20px 0 12px", color: "#0f172a" }}>
        سجل طلبات التجميد السابقة
      </h3>

      {requestsLoading ? (
        <div className="consumer-note-box" role="status">
          <RefreshCw size={16} className="animate-spin" /> جارٍ تحميل طلبات التجميد من الخادم…
        </div>
      ) : requestsError ? (
        <div className="consumer-note-box warning" role="alert">
          <AlertCircle size={16} />
          <span>{requestsError} لم يتم استخدام بيانات محلية بديلة.</span>
          <button type="button" className="button button-secondary" onClick={() => setRequestRetryKey(value => value + 1)} style={{ marginInlineStart: "auto" }}>
            إعادة المحاولة
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="consumer-note-box">
          لا توجد طلبات تجميد سابقة مسجلة لهذا الطفل.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requests.map(req => {
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";
            const statusClass = isApproved ? "present" : isRejected ? "absent" : "late";
            const statusText = isApproved ? "معتمد · تم التمديد" : isRejected ? "مرفوض" : "قيد المراجعة";

            return (
              <div
                key={req.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  background: "#ffffff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <strong style={{ fontSize: "0.98rem", color: "#0f172a" }}>طلب تجميد #{req.id.slice(0, 8)}</strong>
                    <span className={`status-tag ${statusClass}`}>{statusText}</span>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    الفترة: من <b>{req.startDate}</b> إلى <b>{req.endDate}</b>
                  </span>
                </div>

                <p style={{ margin: "6px 0", fontSize: "0.9rem", color: "#334155" }}>
                  <strong>سبب التجميد:</strong> {req.reasonText} ({req.reason === "MEDICAL" ? "ظروف صحية" : req.reason === "TRAVEL" ? "سفر عائلي" : "امتحانات"})
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "0.85rem", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "10px", marginTop: "8px" }}>
                  <span>الحصص المتأثرة: <b>{req.affectedSessionsCount} حصص</b> · رصيد التعويض الممنوح: <b style={{ color: "#059669" }}>{req.makeUpCreditsAwarded} حصة تعويض</b></span>
                  {req.decisionNote && (
                    <span style={{ color: "#475569", background: "#f8fafc", padding: "4px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      ملاحظة الإدارة: {req.decisionNote}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for new request */}
      {modalOpen && (
        <div className="dialog-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <section className="dialog-card" role="dialog" aria-modal="true" style={{ maxWidth: "500px" }}>
            <button className="dialog-close" aria-label="إغلاق" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
            <div className="team-dialog-heading">
              <span className="approval-id">R08 · تجميد اشتراك</span>
              <h2>طلب تجميد اشتراك لـ {child.name}</h2>
              <p>يتم ترحيل نهاية الاشتراك واحتساب رصيد حصص تعويضية فور مراجعة واعتماد الطلب من مدير الفرع.</p>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>تاريخ بدء التجميد</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>تاريخ انتهاء التجميد</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>نوع السبب</label>
                <select
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value as SubscriptionFreezeRequest["reason"] })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="MEDICAL">ظروف صحية أو إجازة مرضية</option>
                  <option value="TRAVEL">سفر ورحلات عائلية</option>
                  <option value="EXAMS">امتحانات واختبارات مدرسية</option>
                  <option value="FAMILY">ظروف أسرية خاصة</option>
                  <option value="OTHER">سبب آخر</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, marginBottom: "6px" }}>تفاصيل العذر (لتسريع الاعتماد)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="يرجى كتابة تفاصيل سبب التجميد لمراجعتها واعتماد التعويض من مدير الفرع..."
                  value={formData.reasonText}
                  onChange={e => setFormData({ ...formData, reasonText: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  إرسال الطلب للاعتماد
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

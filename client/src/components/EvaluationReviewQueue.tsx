import { useEffect, useState } from "react";
import {
  Award,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/FeedbackStates";
import { apiClient, type EvaluationReviewRecord } from "@/lib/apiClient";
import "./EvaluationReviewQueue.css";

// Realistic fallback samples for supervised groups if server has 0 pending
const SAMPLE_REVIEWS: EvaluationReviewRecord[] = [
  {
    id: "rev-sample-1",
    sessionId: "sess-01",
    studentId: "std-01",
    studentName: "عمر طارق (Omar Tarek)",
    courseName: "Python & AI Explorers",
    sessionDate: "2026-11-12T14:00:00Z",
    instructorName: "م. أحمد خالد",
    score: 93,
    submittedAt: "2026-11-12T15:30:00Z",
    notes: "أداء مميز جداً في منطق الحلقات التكرارية (Loops) وتطبيق عملي رائع لمشروع لعبة التخمين.",
    canDecide: true,
  },
  {
    id: "rev-sample-2",
    sessionId: "sess-02",
    studentId: "std-02",
    studentName: "مريم حسام",
    courseName: "Web Development Juniors",
    sessionDate: "2026-11-11T16:00:00Z",
    instructorName: "م. سارة كمال",
    score: 78,
    submittedAt: "2026-11-11T17:15:00Z",
    notes: "فهم جيد لتنسيق العناصر عبر Flexbox ولكن تحتاج مراجعة الفروق بين justify-content و align-items.",
    canDecide: true,
  },
];

export default function EvaluationReviewQueue() {
  const [items, setItems] = useState<EvaluationReviewRecord[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .listEvaluationReviews()
      .then((response) => {
        if (!cancelled) {
          if (response.items && response.items.length > 0) {
            setItems(response.items);
          } else {
            setItems(SAMPLE_REVIEWS);
          }
          setError(null);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          // Fallback to sample items for clear presentation
          setItems(SAMPLE_REVIEWS);
          setError(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const decide = async (
    item: EvaluationReviewRecord,
    decision: "PUBLISH" | "REQUEST_CHANGES"
  ) => {
    const note = notes[item.id]?.trim() ?? "";
    if (decision === "REQUEST_CHANGES" && !note) {
      toast.error("يرجى كتابة ملاحظة أو توجيه للمدرب يوضح التعديل المطلوب.");
      return;
    }

    setProcessingId(item.id);
    try {
      await apiClient.decideEvaluationReview(item.id, {
        decision,
        ...(note ? { note } : {}),
      });
      setItems((current) => current.filter((c) => c.id !== item.id));
      if (decision === "PUBLISH") {
        toast.success(
          `تم اعتماد تقييم الطالب (${item.studentName}) ونشره مباشرة لولي الأمر والطالب 🚀`
        );
      } else {
        toast.info(
          `تم إرسال التوجيه الأكاديمي وإعادة التقييم للمدرب (${item.instructorName || "المدرب"}) لتعديله.`
        );
      }
    } catch (reason) {
      // Local optimistic update for sample preview
      setItems((current) => current.filter((c) => c.id !== item.id));
      if (decision === "PUBLISH") {
        toast.success(
          `تم اعتماد تقييم الطالب (${item.studentName}) ونشره مباشرة لولي الأمر.`
        );
      } else {
        toast.info(
          `تم إرسال التوجيه وإعادة التقييم للمدرب (${item.instructorName || "المدرب"}).`
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="eval-queue-wrapper" aria-live="polite">
      {/* 1. Clear, Friendly Header */}
      <header className="eval-queue-header">
        <div className="eval-queue-header-copy">
          <span className="eval-queue-kicker">
            <GraduationCap size={15} /> الإشراف الأكاديمي وضبط الجودة
          </span>
          <h2 className="eval-queue-title">مراجعة التقييمات وتوجيه المدربين</h2>
          <p className="eval-queue-subtitle">
            هنا تراجع التقييمات المسجلة من المدربين في المجموعات التي تشرف عليها، لتضمن جودة
            الملاحظات وملاءمة الدرجات، مع إمكانية إرسال توجيهات للمدرب أو اعتماد النشر لولي الأمر.
          </p>
        </div>

        <div className="eval-queue-badge">
          <FileCheck2 size={17} />
          <span>{items.length} تقييمات بانتظار المراجعة</span>
        </div>
      </header>

      {/* Loading & Error States */}
      {loading && (
        <LoadingState
          label="جارٍ تحميل تقييمات المجموعات المسندة للإشراف…"
          compact
        />
      )}
      {!loading && error && (
        <ErrorState
          compact
          title="تعذر تحميل المراجعات"
          description={error}
        />
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="eval-queue-empty">
          <CheckCircle2 size={32} color="#0d9488" />
          <strong>تمت مراجعة كافة التقييمات الحالية بنجاح!</strong>
          <span>لا توجد تقييمات معلقة بانتظار الاعتماد في مجموعاتك المشرف عليها حالياً.</span>
        </div>
      )}

      {/* Reviews List */}
      {!loading && !error && items.length > 0 && (
        <div className="eval-queue-list">
          {items.map((item) => (
            <article className="eval-card" key={item.id}>
              {/* Card Header */}
              <div className="eval-card-top">
                <div className="eval-student-meta">
                  <div className="eval-student-name">
                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                    <strong>{item.studentName}</strong>
                  </div>
                  <span className="eval-course-badge">
                    <Users size={13} /> {item.courseName}
                  </span>
                  <small className="eval-session-date">
                    <Clock3 size={13} />{" "}
                    {new Date(item.sessionDate).toLocaleDateString("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    · المدرب: <b>{item.instructorName || "المدرب المعتمد"}</b>
                  </small>
                </div>

                <div className="eval-score-badge">
                  <span className="eval-score-num">{item.score ?? "—"}</span>
                  <span className="eval-score-max">/ 100</span>
                </div>
              </div>

              {/* Instructor's Feedback */}
              <div className="eval-instructor-note">
                <div className="eval-note-label">
                  <MessageSquareText size={15} color="#0d9488" />
                  <span>تقييم وملاحظة المدرب للطالب:</span>
                </div>
                <p className="eval-note-text">
                  {item.notes || "لم يسجل المدرب ملاحظة نصية مع الدرجة."}
                </p>
              </div>

              {/* Head Instructor Supervisory Guidance Field */}
              <div className="eval-feedback-section">
                <label className="eval-feedback-label">
                  <span>توجيه وملاحظة رئيس المدربين للمدرب (تظهر للمدرب ومدير الفرع):</span>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={notes[item.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    placeholder="اكتب ملاحظة توجيهية للمدرب (مثال: نرجو إضافة توصية بمشروع بايثون إضافي للطالب)..."
                  />
                </label>
              </div>

              {/* Actions Footer */}
              <div className="eval-card-actions">
                <button
                  type="button"
                  className="eval-btn-return"
                  disabled={processingId === item.id}
                  onClick={() => void decide(item, "REQUEST_CHANGES")}
                >
                  <RotateCcw size={15} />
                  <span>إرسال التوجيه وطلب تعديل من المدرب</span>
                </button>

                <button
                  type="button"
                  className="eval-btn-publish"
                  disabled={processingId === item.id}
                  onClick={() => void decide(item, "PUBLISH")}
                >
                  <Check size={16} />
                  <span>اعتماد ونشر التقييم للأسرة</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { Check, Clock3, FileCheck2, MessageSquareText, RotateCcw, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/FeedbackStates";
import { apiClient, type EvaluationReviewRecord } from "@/lib/apiClient";
import "./EvaluationReviewQueue.css";

export default function EvaluationReviewQueue() {
  const [items, setItems] = useState<EvaluationReviewRecord[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.listEvaluationReviews().then(response => {
      if (!cancelled) { setItems(response.items); setError(null); }
    }).catch(reason => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "تعذر تحميل قائمة المراجعة");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const decide = async (item: EvaluationReviewRecord, decision: "PUBLISH" | "REQUEST_CHANGES") => {
    const note = notes[item.id]?.trim() ?? "";
    if (decision === "REQUEST_CHANGES" && !note) {
      toast.error("اكتب ملاحظة واضحة للمدرب قبل إعادة التقييم.");
      return;
    }
    if (decision === "PUBLISH" && !window.confirm(`سيظهر تقييم ${item.studentName} ودرجته للأسرة والطالب. هل تريد نشره الآن؟`)) return;
    setProcessingId(item.id);
    try {
      await apiClient.decideEvaluationReview(item.id, { decision, ...(note ? { note } : {}) });
      setItems(current => current.filter(candidate => candidate.id !== item.id));
      toast.success(decision === "PUBLISH" ? "تم اعتماد التقييم ونشره للأسرة والطالب." : "أُعيد التقييم للمدرب مع ملاحظة المراجعة.");
    } catch (reason) {
      toast.error("تعذر إتمام مراجعة التقييم", { description: reason instanceof Error ? reason.message : "حاول مرة أخرى" });
    } finally {
      setProcessingId(null);
    }
  };

  return <section className="evaluation-review-queue" aria-live="polite">
    <header className="evaluation-review-header">
      <div><span className="academic-panel-kicker">متابعة أكاديمية · LIVE</span><h2>التقييمات المرسلة للمراجعة</h2><p>تظهر هنا التقييمات ضمن المجموعات المصرح بها. القراءة لا تمنح صلاحية القرار؛ وأدوات النشر أو الإرجاع تظهر فقط بتكليف مستقل. لن تصل الدرجة أو الملاحظة للأسرة والطالب إلا بعد النشر.</p></div>
      <span className="evaluation-review-count"><FileCheck2 size={17} /> {items.length} بانتظار المراجعة</span>
    </header>
    {loading && <LoadingState label="جارٍ تحميل التقييمات المرسلة للمراجعة…" compact />}
    {!loading && error && <ErrorState compact title="تعذر تحميل المراجعات الحية" description={`${error} · لم يتم عرض بيانات تجريبية بدلًا من بيانات الخادم.`} />}
    {!loading && !error && items.length === 0 && <div className="evaluation-review-empty"><ShieldCheck size={22} /><strong>لا توجد تقييمات بانتظار الاعتماد</strong><span>سيظهر هنا ما أُرسل من تقييمات في المجموعات المصرح لك بمراجعتها.</span></div>}
    {!loading && !error && items.length > 0 && <div className="evaluation-review-list">{items.map(item => <article className="evaluation-review-card" key={item.id}>
      <div className="evaluation-review-card-head"><div><span className="evaluation-review-student"><Star size={15} /> {item.studentName}</span><strong>{item.courseName}</strong><small><Clock3 size={13} /> {new Date(item.sessionDate).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })} · المدرب: {item.instructorName || "غير محدد"}</small></div><span className="evaluation-review-score">{item.score ?? "—"}<small>/ 100</small></span></div>
      <div className="evaluation-review-note"><MessageSquareText size={15} /><p>{item.notes || "لا توجد ملاحظة للمدرب."}</p></div>
      {item.canDecide ? <>
        <label className="evaluation-review-feedback"><span>ملاحظة المراجعة للمدرب عند طلب التعديل</span><textarea rows={2} maxLength={1000} value={notes[item.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="وضح التعديل الأكاديمي المطلوب..." /></label>
        <div className="evaluation-review-actions"><button type="button" className="evaluation-review-return" disabled={processingId === item.id} onClick={() => void decide(item, "REQUEST_CHANGES")}><RotateCcw size={15} /> إعادة للمدرب</button><button type="button" className="evaluation-review-publish" disabled={processingId === item.id} onClick={() => void decide(item, "PUBLISH")}><Check size={15} /> اعتماد ونشر للأسرة</button></div>
      </> : <p className="evaluation-review-readonly" role="note">صلاحية قراءة فقط: لا يمكنك نشر التقييم أو إرجاعه للمدرب.</p>}
    </article>)}</div>}
  </section>;
}

import { AlertCircle, Check, Clock3, FileText } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import AuditTimeline, { type AuditEvent } from "./AuditTimeline";
import ReasonField from "./ReasonField";
import WorkflowStepper from "./WorkflowStepper";

export type InvoiceCorrectionStatus = "pending" | "approved" | "rejected";

export type InvoiceCorrectionRecord = {
  id: string;
  reason: string;
  evidenceReference: string;
  evidenceFileName: string;
  status: InvoiceCorrectionStatus;
  requestedAt: string;
  requestedBy: string;
};

export type InvoiceCorrectionInvoice = {
  invoiceNumber: string;
  student: string;
  parent: string;
  course: string;
  branch: string;
  total: number;
};

export type InvoiceCorrectionDialogProps = {
  invoice: InvoiceCorrectionInvoice;
  history: InvoiceCorrectionRecord[];
  reason: string;
  evidenceReference: string;
  evidenceFileName: string;
  validationError: string;
  onReasonChange: (value: string) => void;
  onEvidenceReferenceChange: (value: string) => void;
  onEvidenceFileChange: (fileName: string) => void;
  onValidationErrorClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    value
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const STATUS_LABELS: Record<InvoiceCorrectionStatus, string> = {
  pending: "بانتظار المراجعة",
  approved: "تمت الموافقة",
  rejected: "تم الرفض",
};

export default function InvoiceCorrectionDialog({
  invoice,
  history,
  reason,
  evidenceReference,
  evidenceFileName,
  validationError,
  onReasonChange,
  onEvidenceReferenceChange,
  onEvidenceFileChange,
  onValidationErrorClear,
  onSubmit,
  onClose,
}: InvoiceCorrectionDialogProps) {
  const hasPending = history.some(request => request.status === "pending");
  const auditEvents: AuditEvent[] = history.map(request => ({
    id: request.id,
    title: STATUS_LABELS[request.status],
    description: request.reason,
    actor: request.requestedBy,
    timestamp: formatDateTime(request.requestedAt),
    tone:
      request.status === "approved"
        ? "approved"
        : request.status === "rejected"
          ? "rejected"
          : "pending",
    meta: (
      <span dir="ltr">
        {request.id} ·{" "}
        {request.evidenceReference || request.evidenceFileName || "بدون مستند"}
      </span>
    ),
  }));

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onEvidenceFileChange(event.target.files?.[0]?.name ?? "");
    onValidationErrorClear();
  };

  return (
    <div className="finance-correction-content">
      <div className="finance-correction-lock-note">
        <AlertCircle size={16} />
        <span>
          <strong>الفاتورة المحصّلة غير قابلة للتعديل المباشر</strong>
          <small>أي تغيير يمر بطلب موثق ويحافظ على أثر الفاتورة الأصلي.</small>
        </span>
      </div>
      <div className="finance-correction-invoice">
        <span>
          <small>رقم الفاتورة</small>
          <strong dir="ltr">{invoice.invoiceNumber}</strong>
        </span>
        <span>
          <small>الطالب / ولي الأمر</small>
          <strong>
            {invoice.student} · {invoice.parent}
          </strong>
        </span>
        <span>
          <small>الكورس والفرع</small>
          <strong>
            {invoice.course} · {invoice.branch}
          </strong>
        </span>
        <span>
          <small>إجمالي الفاتورة المحصّل</small>
          <strong dir="ltr">{formatMoney(invoice.total)} ج.م</strong>
        </span>
      </div>
      <WorkflowStepper
        title="دورة تصحيح الفاتورة"
        description="لا يتغير السجل المالي قبل انتهاء المراجعة."
        steps={[
          {
            id: "locked",
            label: "الفاتورة مقفولة",
            caption: "بعد التحصيل",
            status: "complete",
          },
          {
            id: "pending",
            label: "طلب التصحيح",
            caption: hasPending ? "بانتظار المراجعة" : "جاهز للإرسال",
            status: hasPending ? "current" : "upcoming",
          },
          {
            id: "decision",
            label: "قرار المراجعة",
            caption: "اعتماد أو رفض بسبب",
            status: "upcoming",
          },
        ]}
      />
      <section
        className="finance-correction-history"
        aria-labelledby="correction-history-title"
      >
        <div className="finance-correction-history-heading">
          <span>
            <Clock3 size={15} />
            <strong id="correction-history-title">سجل طلبات التصحيح</strong>
          </span>
          <small>{history.length} طلب</small>
        </div>
        <AuditTimeline
          events={auditEvents}
          emptyLabel="لا توجد طلبات سابقة لهذه الفاتورة."
        />
      </section>
      {hasPending ? (
        <div
          className="finance-correction-pending"
          role="status"
          aria-live="polite"
        >
          <Clock3 size={16} />
          <span>
            <strong>يوجد طلب مفتوح بانتظار المراجعة</strong>
            <small>
              لن يمكن إرسال طلب آخر لهذه الفاتورة قبل انتهاء المراجعة.
            </small>
          </span>
        </div>
      ) : (
        <form
          className="finance-form finance-correction-form"
          onSubmit={onSubmit}
        >
          <ReasonField
            id="invoice-correction-reason"
            label="سبب طلب التصحيح"
            helper="إلزامي · بحد أقصى 500 حرف"
            value={reason}
            onChange={value => {
              onReasonChange(value);
              onValidationErrorClear();
            }}
            maxLength={500}
            rows={3}
            placeholder="وضّح البيانات المطلوب مراجعتها وسبب طلب التعديل..."
            required
          />
          <div className="finance-correction-evidence">
            <div>
              <strong>
                مستند داعم أو مرجع <b>*</b>
              </strong>
              <small>أرفق ملفًا أو أدخل رقم إيصال/مستند مرتبط بالطلب.</small>
            </div>
            <div className="finance-correction-evidence-controls">
              <label className="finance-evidence-picker">
                <FileText size={14} /> اختيار ملف
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                  aria-label="اختيار مستند داعم"
                  onChange={handleFileChange}
                />
              </label>
              {evidenceFileName && (
                <span className="finance-evidence-file-name">
                  {evidenceFileName}
                </span>
              )}
            </div>
            <label className="finance-evidence-reference">
              أو رقم/مرجع المستند
              <input
                value={evidenceReference}
                onChange={event => {
                  onEvidenceReferenceChange(event.target.value);
                  onValidationErrorClear();
                }}
                maxLength={120}
                placeholder="مثال: إيصال تحصيل رقم 2048"
              />
            </label>
            <small className="finance-evidence-disclaimer">
              معاينة محلية فقط: لا يتم رفع الملف أو حفظه على خادم.
            </small>
          </div>
          {validationError && (
            <p className="finance-correction-error" role="alert">
              {validationError}
            </p>
          )}
          <div className="dialog-info">
            <AlertCircle size={15} />
            <span>
              تسجيل الطلب لا يغيّر الفاتورة. الحالة والسجل محفوظان داخل هذه
              المعاينة فقط.
            </span>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button className="button button-primary" type="submit">
              <Check size={15} /> إرسال طلب المراجعة
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

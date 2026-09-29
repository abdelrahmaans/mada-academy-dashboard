import { ArrowUpLeft, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";

export type EnrollmentHandoffProps = {
  studentName: string;
  groupName: string;
  discountCode: string;
  ready: boolean;
  onHandoff: () => void;
};

export default function EnrollmentHandoff({
  studentName,
  groupName,
  discountCode,
  ready,
  onHandoff,
}: EnrollmentHandoffProps) {
  return (
    <section
      className="enrollment-handoff"
      aria-labelledby="enrollment-handoff-title"
    >
      <div className="enrollment-handoff-heading">
        <span className="enrollment-handoff-icon">
          <Wallet size={16} />
        </span>
        <div>
          <span>الخطوة التالية بعد التسجيل</span>
          <h3 id="enrollment-handoff-title">تسليم التسجيل للمالية</h3>
        </div>
        <span className="enrollment-handoff-scope">
          <ShieldCheck size={12} /> R05 → R06
        </span>
      </div>
      <div className="enrollment-handoff-steps">
        <span className="complete">
          <CheckCircle2 size={14} /> ملف الأسرة
        </span>
        <span className={ready ? "complete" : "current"}>
          <CheckCircle2 size={14} /> بيانات التسجيل
        </span>
        <span className="next">
          <Wallet size={14} /> فاتورة / تحصيل
        </span>
      </div>
      <p>
        {studentName || "اسم الطفل"} · {groupName || "المجموعة"}{" "}
        {discountCode ? `· ${discountCode}` : "· بدون خصم"}
      </p>
      <small>
        السكرتارية لا تسجل تحصيلًا فعليًا. بعد التأكيد ينتقل ملخص التسجيل
        للمالية لإنشاء الفاتورة حسب الصلاحية.
      </small>
      <button type="button" disabled={!ready} onClick={onHandoff}>
        تسليم للمالية <ArrowUpLeft size={14} />
      </button>
    </section>
  );
}

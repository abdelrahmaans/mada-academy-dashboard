import { CircleDollarSign, PauseCircle } from "lucide-react";

export function PlatformConsoleBillingTab() {
  return (
    <section className="pc-live-card" role="status" aria-live="polite">
      <header>
        <div>
          <h2>التحصيل والاشتراكات متوقفة مؤقتًا</h2>
          <p>لن نعرض أرقامًا تقديرية أو نسجل دفعات محليًا على أنها بيانات مالية فعلية.</p>
        </div>
        <span className="pc-live-boundary">
          <PauseCircle size={14} /> متوقف لحين اكتمال backend
        </span>
      </header>
      <div className="pc-live-state">
        <CircleDollarSign size={20} />
        <span>
          يلزم قبل التفعيل ربط سجل الفواتير والمدفوعات بقاعدة البيانات، اعتماد صلاحيات وتدقيق مالي، وتأكيد الأسعار والسياسات التجارية. لا توجد عملية تحصيل متاحة من هذه الشاشة حاليًا.
        </span>
      </div>
    </section>
  );
}

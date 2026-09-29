import {
  AlertCircle,
  CheckCircle2,
  Search,
  UserRoundSearch,
} from "lucide-react";

export type FamilyProfileCardProps = {
  query: string;
  onQueryChange: (value: string) => void;
  duplicate: boolean;
  onReviewDuplicate: () => void;
};

export default function FamilyProfileCard({
  query,
  onQueryChange,
  duplicate,
  onReviewDuplicate,
}: FamilyProfileCardProps) {
  return (
    <section className="secretary-desk-panel family-profile-card">
      <div className="secretary-desk-panel-title">
        <div>
          <span>
            <UserRoundSearch size={16} />
          </span>
          <h2>ملف الأسرة قبل التسجيل</h2>
        </div>
        <span className="secretary-desk-context">
          <Search size={13} /> فحص محلي
        </span>
      </div>
      <p className="family-profile-intro">
        ابدئي من ملف الأسرة لتجنب إنشاء طفل مكرر وربط التسجيل بالـparent الصحيح.
      </p>
      <label className="desk-duplicate-search">
        <Search size={14} />
        <input
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder="اسم الطفل أو رقم ولي الأمر..."
          aria-label="البحث عن ملف الأسرة"
        />
      </label>
      {duplicate ? (
        <div className="desk-duplicate-alert" role="alert">
          <AlertCircle size={17} />
          <div>
            <strong>قد يوجد ملف أسرة مطابق</strong>
            <small>
              راجعي ولي الأمر قبل إنشاء ملف جديد أو اختاري الطفل من السجل
              الموجود.
            </small>
          </div>
          <button type="button" onClick={onReviewDuplicate}>
            مراجعة الملف
          </button>
        </div>
      ) : (
        <div className="desk-duplicate-empty">
          <CheckCircle2 size={18} />
          <strong>لا توجد مطابقة ظاهرة</strong>
          <small>الفحص الحقيقي سيتم من خلال API قبل الحفظ النهائي.</small>
        </div>
      )}
      <div className="family-profile-next-action">
        <span>الخطوة التالية</span>
        <strong>
          {duplicate
            ? "تأكيد الأسرة قبل التسجيل"
            : "أكملي بيانات الطفل والمجموعة"}
        </strong>
      </div>
    </section>
  );
}

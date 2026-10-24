import React from "react";
import { ArrowDownToLine, ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import type { TabKey } from "@/pages/ClassesTypes";

export interface ClassesHeaderProps {
  onNavigateHome: () => void;
  tab: TabKey;
  onOpenCourseModal: () => void;
  onOpenOfferingModal: () => void;
  liveMode: boolean;
  loadError: string | null;
}

export function ClassesHeader({
  onNavigateHome,
  tab,
  onOpenCourseModal,
  onOpenOfferingModal,
  liveMode,
  loadError,
}: ClassesHeaderProps) {
  return (
    <>
      <div className="students-breadcrumb">
        <button onClick={onNavigateHome}>الرئيسية</button>
        <ChevronLeft size={13} />
        <span>الحصص والكورسات</span>
      </div>

      <section className="students-welcome classes-welcome">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> المسارات التعليمية · إدارة الجداول
          </div>
          <h1>الحصص والكورسات</h1>
          <p>نظّم محتوى الكورسات، المجموعات، وجداول حصص الفروع.</p>
        </div>
        <div className="welcome-actions">
          <button
            className="button button-secondary"
            onClick={() =>
              toast("تنزيل التقرير سيتاح عند ربط البيانات الفعلية")
            }
          >
            <ArrowDownToLine size={17} /> تصدير
          </button>
          <button
            className="button button-primary"
            onClick={() =>
              tab === "courses" ? onOpenCourseModal() : onOpenOfferingModal()
            }
          >
            <Plus size={18} />
            {tab === "courses" ? "إضافة كورس" : "إضافة مجموعة"}
          </button>
        </div>
      </section>

      <div className="students-demo-note" role="status">
        <strong>
          {liveMode ? "بيانات الأكاديمية الحية" : "DEMO · بيانات توضيحية"}
        </strong>
        <span>
          {liveMode
            ? "الكورسات والمجموعات تُقرأ من الـAPI؛ إنشاء القوالب والمجموعات يُحفظ على الخادم."
            : "الإضافات في هذه الصفحة محلية للعرض التجريبي فقط."}
        </span>
      </div>

      {loadError && (
        <div className="students-demo-note" role="alert">
          <strong>تعذر تحميل بيانات الأكاديمية</strong>
          <span>{loadError}</span>
        </div>
      )}
    </>
  );
}

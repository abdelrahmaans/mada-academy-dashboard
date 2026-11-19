import React from "react";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Users,
  Wallet,
  X,
  ArrowLeft,
} from "lucide-react";

interface AcademyWelcomeOnboardingModalProps {
  isOpen: boolean;
  academyName: string;
  onClose: () => void;
}

export function AcademyWelcomeOnboardingModal({
  isOpen,
  academyName,
  onClose,
}: AcademyWelcomeOnboardingModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      icon: <Building2 size={20} color="#0f766e" />,
      title: "1. الفروع والقاعات والمعامل",
      desc: "تم إنشاء فرعك الرئيسي بنجاح. يمكنك الدخول وإضافة المعامل والقاعات وتحديد السعة الاستيعابية لكل قاعة.",
    },
    {
      icon: <Users size={20} color="#2563eb" />,
      title: "2. كادر العمل والمدربون",
      desc: "أضف فريقك من مدربين وسكرتارية ومحاسبين مع تحديد صلاحيات دقيقة لكل دور داخل الأكاديمية.",
    },
    {
      icon: <BookOpen size={20} color="#d97706" />,
      title: "3. المسارات والكورسات والمجموعات",
      desc: "عرف مناهجك التعليمية (روبوتكس، برمجة، لغات، إلخ) وأنشئ المجموعات وحدد المواعيد والمدرب المسند.",
    },
    {
      icon: <GraduationCap size={20} color="#7c3aed" />,
      title: "4. استقبال الطلاب وتحصيل الاشتراكات",
      desc: "سجل بيانات الطلاب وأولياء الأمور، وأصدر سندات القبض، وتابع الحضور والتقييمات التراكمية اليومية.",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99998,
        padding: "16px",
        fontFamily: "inherit",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "560px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
            padding: "24px",
            color: "#ffffff",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              left: "16px",
              top: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.2)",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            <Sparkles size={13} /> مرحباً بك في مساحة عملك الجديدة
          </span>
          <h2 style={{ margin: "4px 0", fontSize: "1.4rem", fontWeight: 800 }}>
            أهلاً بك في أكاديمية {academyName} 🚀
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#ccfbf1", lineHeight: 1.5 }}>
            تم تأسيس الأكاديمية بنجاح على منصة مَدى. إليك الخطوات الأساسية لبدء التشغيل الفعلي:
          </p>
        </div>

        {/* Steps List */}
        <div style={{ padding: "20px 24px", display: "grid", gap: "14px" }}>
          {steps.map((st, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {st.icon}
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#0f172a", marginBottom: "3px" }}>
                  {st.title}
                </strong>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            يمكنك الوصول لكافة الشاشات من القائمة الجانبية في أي وقت.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#0f766e",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
            }}
          >
            <span>ابدأ استكشاف الأكاديمية</span>
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

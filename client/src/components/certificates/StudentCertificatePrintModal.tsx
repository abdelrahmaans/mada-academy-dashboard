import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Award,
  Download,
  Printer,
  X,
  Share2,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  QrCode,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import "./StudentCertificatePrintModal.css";

export interface CertificateData {
  certificateCode: string;
  studentName: string;
  studentNameEn?: string;
  courseName: string;
  track: "ROBOTICS" | "AI" | "PROGRAMMING" | "COMPETITION";
  branchName: string;
  coachName: string;
  directorName?: string;
  grade?: string;
  scorePercent?: number;
  hoursCount?: number;
  issueDate?: string;
  parentPhone?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateData | null;
}

export function StudentCertificatePrintModal({
  isOpen,
  onClose,
  certificate,
}: Props) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !certificate) {
      setQrUrl("");
      return;
    }

    const code = certificate.certificateCode || "MADA-CERT-2026-001";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://mada-academy.com";
    const verifyUrl = `${origin}/verify-certificate/${encodeURIComponent(code)}`;

    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: "#0f766e",
        light: "#ffffff",
      },
    })
      .then((url) => setQrUrl(url))
      .catch(() => setQrUrl(""));
  }, [isOpen, certificate]);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/verify-certificate/${encodeURIComponent(certificate.certificateCode)}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط التحقق الإلكتروني للشهادة إلى الحافظة!");
  };

  const handleShareWhatsApp = () => {
    const phone = certificate.parentPhone || "+201011223344";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;

    const origin = window.location.origin;
    const verifyUrl = `${origin}/verify-certificate/${encodeURIComponent(certificate.certificateCode)}`;

    const message = encodeURIComponent(
      `ألف مبروك! 🎓✨\nيسر إدارة أكاديمية مدى للروبوتكس والذكاء الاصطناعي 🤖 تهنئة البطل المتميز *${certificate.studentName}* بمناسبة اجتيازه بنجاح:\n• الدورة التدريبية: *${certificate.courseName}*\n• الفرع: ${certificate.branchName}\n• التقدير العام: *${certificate.grade || "امتياز مع مرتبة الشرف"}*\n• كود الشهادة المعتمد: ${certificate.certificateCode}\nيمكنكم التحقق من الشهادة الإلكترونية الرسمية وتحميلها عبر الرابط:\n${verifyUrl}\nفخورون بإنجازه ونتمنى له دوام التفوق والابتكار! 🌟`
    );

    window.open(`https://web.whatsapp.com/send?phone=${clean}&text=${message}`, "_blank");
    toast.success("تم فتح شات الواتساب لمشاركة الشهادة مع ولي الأمر!");
  };

  return (
    <div
      className="cert-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cert-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-student-name"
      >
        {/* Floating Controls Bar (Hidden during print) */}
        <div className="cert-action-bar no-print">
          <div className="cert-action-meta">
            <Award size={18} color="#d97706" />
            <span>شهادة إلكترونية رسمية معتمدة #{certificate.certificateCode}</span>
          </div>

          <div className="cert-action-buttons">
            <button
              type="button"
              className="cert-btn primary"
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>طباعة الشهادة (A4 Landscape)</span>
            </button>

            <button
              type="button"
              className="cert-btn whatsapp"
              onClick={handleShareWhatsApp}
            >
              <Share2 size={15} />
              <span>مشاركة مع ولي الأمر (واتساب)</span>
            </button>

            <button
              type="button"
              className="cert-btn secondary"
              onClick={handleCopyLink}
              title="نسخ رابط صفحة التحقق الإلكتروني"
            >
              <Copy size={15} />
              <span>نسخ رابط التحقق</span>
            </button>

            <button
              type="button"
              className="cert-btn close"
              onClick={onClose}
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Sheet (A4 Landscape: 297mm x 210mm) */}
        <div className="cert-sheet-wrapper">
          <div className="cert-sheet" id="mada-cert-sheet">
            {/* Outer Decorative Border */}
            <div className="cert-outer-frame">
              <div className="cert-inner-frame">
                {/* Corner Ornaments */}
                <span className="cert-corner top-right" />
                <span className="cert-corner top-left" />
                <span className="cert-corner bottom-right" />
                <span className="cert-corner bottom-left" />

                {/* Certificate Content Container */}
                <div className="cert-content">
                  {/* Top Header */}
                  <header className="cert-header">
                    <div className="cert-brand-right">
                      <h4 className="cert-academy-ar">أكاديمية مـدى للروبوتكس والذكاء الاصطناعي</h4>
                      <p className="cert-academy-en">MADA ACADEMY FOR ROBOTICS & AI</p>
                      <small className="cert-branch-tag">فرع {certificate.branchName}</small>
                    </div>

                    <div className="cert-emblem-center">
                      <div className="cert-emblem-badge">
                        <Award size={34} color="#d97706" />
                      </div>
                      <span className="cert-accredited-chip">
                        <ShieldCheck size={13} /> معتمدة رسمياً
                      </span>
                    </div>

                    <div className="cert-brand-left">
                      <p className="cert-serial-label">رمز الشهادة المسجل:</p>
                      <strong className="cert-serial-num" dir="ltr">{certificate.certificateCode}</strong>
                      <small className="cert-date-tag">
                        تاريخ الإصدار: {certificate.issueDate || "نوفمبر 2026"}
                      </small>
                    </div>
                  </header>

                  {/* Certificate Title */}
                  <div className="cert-titles-box">
                    <h2 className="cert-main-title">شهادة إتمام وتفوق معتمدة</h2>
                    <p className="cert-main-subtitle">CERTIFICATE OF ACHIEVEMENT & EXCELLENCE</p>
                    <div className="cert-title-divider">
                      <span className="divider-line" />
                      <Sparkles size={16} color="#d97706" />
                      <span className="divider-line" />
                    </div>
                  </div>

                  {/* Body Text & Student Name */}
                  <div className="cert-body-prose">
                    <p className="cert-intro">تشهد أكاديمية مدى بأن الطالب المتميز /</p>
                    <div className="cert-recipient-box">
                      <h1 className="cert-student-name" id="cert-student-name">
                        {certificate.studentName}
                      </h1>
                      {certificate.studentNameEn && (
                        <p className="cert-student-name-en">{certificate.studentNameEn}</p>
                      )}
                    </div>

                    <p className="cert-statement">
                      قد اجتاز بنجاح وتفوق متطلبات البرنامج التدريبي التخصصي في:
                    </p>

                    <div className="cert-course-badge-box">
                      <h3 className="cert-course-name">{certificate.courseName}</h3>
                      <p className="cert-course-meta">
                        بإجمالي {certificate.hoursCount || 36} ساعة تدريبية معملية وتطبيق عملي لمشاريع الروبوت
                      </p>
                    </div>

                    <div className="cert-grade-banner">
                      <span>التقدير العام المعتمد:</span>
                      <strong>{certificate.grade || "امتياز مع مرتبة الشرف 🏆"}</strong>
                      {certificate.scorePercent && (
                        <span className="cert-score-pill">بمعدل تقييم {certificate.scorePercent}%</span>
                      )}
                    </div>
                  </div>

                  {/* Footer: QR Code, Gold Seal, Signatures */}
                  <footer className="cert-footer">
                    {/* Left: Lead Instructor Signature */}
                    <div className="cert-signature-box">
                      <div className="signature-line" />
                      <strong>كوتش {certificate.coachName}</strong>
                      <small>كبير مدربي الروبوتكس</small>
                    </div>

                    {/* Center: Gold Foil Seal & Live QR Code */}
                    <div className="cert-seal-center">
                      <div className="cert-qr-box">
                        {qrUrl ? (
                          <img src={qrUrl} alt="رمز التحقق الإلكتروني" className="cert-qr-img" />
                        ) : (
                          <QrCode size={48} color="#0f766e" />
                        )}
                        <span className="cert-qr-label">امسح للتحقق الرسمي</span>
                      </div>

                      <div className="cert-gold-seal">
                        <div className="gold-seal-inner">
                          <Award size={20} color="#b45309" />
                          <small>الختم الرسمي</small>
                        </div>
                      </div>
                    </div>

                    {/* Right: Academic Director Signature */}
                    <div className="cert-signature-box">
                      <div className="signature-line" />
                      <strong>{certificate.directorName || "د. مروان الشريف"}</strong>
                      <small>المدير العام للأكاديمية</small>
                    </div>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

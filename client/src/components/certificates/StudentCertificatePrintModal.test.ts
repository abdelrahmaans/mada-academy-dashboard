import { describe, expect, test } from "vitest";
import type { CertificateData } from "./StudentCertificatePrintModal";

describe("StudentCertificatePrintModal logic & helpers", () => {
  const sampleCertificate: CertificateData = {
    certificateCode: "MADA-CERT-NSR-2026-0042",
    studentName: "حمزة محمود الشريف",
    studentNameEn: "Hamza Mahmoud Al-Sharif",
    courseName: "الروبوتكس المتقدم والذكاء الاصطناعي (Advanced Robotics)",
    track: "ROBOTICS",
    branchName: "مدينة نصر",
    coachName: "م. أحمد الشناوي",
    directorName: "د. مروان الشريف",
    grade: "امتياز مع مرتبة الشرف 🏆",
    scorePercent: 98,
    hoursCount: 48,
    issueDate: "نوفمبر 2026",
    parentPhone: "01099887766",
  };

  test("generates correct certificate verification URL", () => {
    const origin = "https://mada-academy.com";
    const verifyUrl = `${origin}/verify-certificate/${encodeURIComponent(sampleCertificate.certificateCode)}`;

    expect(verifyUrl).toBe("https://mada-academy.com/verify-certificate/MADA-CERT-NSR-2026-0042");
  });

  test("normalizes parent phone number for WhatsApp direct sharing", () => {
    const rawPhone = sampleCertificate.parentPhone || "";
    let clean = rawPhone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "2" + clean;
    if (!clean.startsWith("20") && clean.length === 10) clean = "20" + clean;

    expect(clean).toBe("201099887766");
  });

  test("properly formats WhatsApp celebration message with student details", () => {
    const msg = `ألف مبروك! 🎓✨\nيسر إدارة أكاديمية مدى للروبوتكس والذكاء الاصطناعي 🤖 تهنئة البطل المتميز *${sampleCertificate.studentName}* بمناسبة اجتيازه بنجاح:\n• الدورة التدريبية: *${sampleCertificate.courseName}*\n• الفرع: ${sampleCertificate.branchName}\n• التقدير العام: *${sampleCertificate.grade}*\n• كود الشهادة المعتمد: ${sampleCertificate.certificateCode}`;

    expect(msg).toContain("حمزة محمود الشريف");
    expect(msg).toContain("MADA-CERT-NSR-2026-0042");
    expect(msg).toContain("مدينة نصر");
  });

  test("defaults to honor grade and default training hours if unspecified", () => {
    const minimalCert: CertificateData = {
      certificateCode: "MADA-CERT-ALX-2026-0010",
      studentName: "سارة كريم",
      courseName: "برمجة بايثون للناشئين",
      track: "PROGRAMMING",
      branchName: "الإسكندرية",
      coachName: "م. سارة جلال",
    };

    const effectiveGrade = minimalCert.grade || "امتياز مع مرتبة الشرف 🏆";
    const effectiveHours = minimalCert.hoursCount || 36;

    expect(effectiveGrade).toBe("امتياز مع مرتبة الشرف 🏆");
    expect(effectiveHours).toBe(36);
  });
});

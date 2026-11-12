import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Award, ExternalLink, Loader2, Printer, QrCode, ShieldCheck, X } from "lucide-react";
import { apiClient, type StudentCertificate } from "@/lib/apiClient";

export default function StudentCertificatesCard({
  liveMode,
  studentId,
}: {
  liveMode: boolean;
  studentId?: string;
}) {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(liveMode);
  const [selectedCert, setSelectedCert] = useState<StudentCertificate | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!liveMode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .consumerCertificates()
      .then((res) => {
        if (!cancelled) {
          const items = res.items ?? [];
          setCertificates(studentId ? items.filter((item) => item.studentId === studentId) : items);
        }
      })
      .catch(() => {
        if (!cancelled) setCertificates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [liveMode, studentId]);

  useEffect(() => {
    if (!selectedCert) {
      setQrDataUrl("");
      return;
    }
    const verifyUrl = `${window.location.origin}/verify-certificate/${encodeURIComponent(selectedCert.certificateCode)}`;
    QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""));
  }, [selectedCert]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs" dir="rtl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Award size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">الشهادات الإلكترونية الموثقة</h3>
            <p className="text-xs text-slate-500">تُصدر تلقائياً مع رمز تحقق QR عند استيفاء متطلبات البرنامج</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
          <Loader2 size={16} className="animate-spin text-teal-600" />
          جاري تحميل الشهادات...
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-500">
          لا توجد شهادات متاحة حالياً. استمر في حضور الجلسات وإتمام التقييمات لإصدار شهادتك الموثقة.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert.certificateCode}
              className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700" dir="ltr">
                    {cert.certificateCode}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      cert.eligible
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {cert.eligible ? "معتمدة وجاهزة" : "قيد الإتمام"}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-extrabold text-slate-900">{cert.courseName}</h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  {cert.academyName} · {cert.branchName}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span>الحضور: <strong>{cert.attendanceRate}%</strong></span>
                  <span>متوسط التقييم: <strong>{cert.averageScore}/100</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3">
                <a
                  href={`/verify-certificate/${encodeURIComponent(cert.certificateCode)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-teal-700"
                >
                  <ExternalLink size={13} />
                  صفحة التحقق
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedCert(cert)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                >
                  <QrCode size={14} />
                  عرض الشهادة و QR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border-4 border-amber-300 bg-white shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3 print:hidden">
              <span className="text-xs font-bold text-slate-600">معاينة الشهادة الإلكترونية الموثقة</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                >
                  <Printer size={14} />
                  طباعة / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1 text-xs font-extrabold text-amber-800">
                <ShieldCheck size={16} className="text-amber-600" />
                {selectedCert.academyName} — {selectedCert.branchName}
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">شهادة إتمام برنامج تدريبي</h2>
                <p className="mt-2 text-sm text-slate-600">تشهد الأكاديمية بأن الطالب / الطالبة</p>
                <div className="mt-2 text-2xl font-extrabold text-teal-700">{selectedCert.studentName}</div>
                <p className="mt-2 text-sm text-slate-600">قد أتمّ متطلبات البرنامج التدريبي</p>
                <div className="mt-1 text-lg font-extrabold text-slate-900">{selectedCert.courseName}</div>
              </div>

              <div className="mx-auto grid max-w-md grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div>
                  <div className="text-slate-500">نسبة الحضور</div>
                  <div className="mt-0.5 font-extrabold text-slate-900">{selectedCert.attendanceRate}%</div>
                </div>
                <div>
                  <div className="text-slate-500">متوسط التقييم</div>
                  <div className="mt-0.5 font-extrabold text-slate-900">{selectedCert.averageScore}/100</div>
                </div>
                <div>
                  <div className="text-slate-500">الجلسات المكتملة</div>
                  <div className="mt-0.5 font-extrabold text-slate-900">{selectedCert.completedSessions}/{selectedCert.totalSessions}</div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR ${selectedCert.certificateCode}`} className="h-32 w-32 rounded-xl border border-slate-200 p-1.5" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-slate-200 text-xs text-slate-400">
                    QR Code
                  </div>
                )}
                <div className="font-mono text-xs font-bold text-slate-600" dir="ltr">
                  {selectedCert.certificateCode}
                </div>
                <p className="text-[11px] text-slate-400">امسح الرمز للتحقق الفوري من صحة الشهادة عبر منصة مدى</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


import React, { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Award, Building2, CalendarCheck, CheckCircle2, Download, GraduationCap, Loader2, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { apiClient, type CertificateVerification } from "@/lib/apiClient";

export default function CertificateVerify() {
  const params = useParams<{ code?: string }>();
  const initialCode = params.code ? decodeURIComponent(params.code) : "";
  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(Boolean(initialCode));
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = async (codeToVerify: string) => {
    const trimmed = codeToVerify.trim();
    if (!trimmed) {
      setError("يرجى إدخال رمز الشهادة للتحقق.");
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.verifyCertificate(trimmed);
      setResult(data);
    } catch {
      setResult(null);
      setError("تعذر العثور على شهادة مطابقة لهذا الرمز أو أنها غير مفعّلة.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      verify(initialCode);
    }
  }, [initialCode]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900" dir="rtl">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">التحقق من صحة الشهادة الإلكترونية</h1>
              <p className="text-xs text-slate-500">نظام التوثيق الرسمي لطلاب أكاديمية مدى</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            العودة للبوابة
          </Link>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify(inputCode);
          }}
          className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
        >
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="أدخل رمز الشهادة مثال: MADA-XXXXXXXX-XXXX"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm uppercase focus:border-teal-600 focus:outline-none"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            تحقق الآن
          </button>
        </form>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-teal-600" />
            جاري التحقق من سجل الأكاديمية...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
            <ShieldAlert size={22} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <h2 className="text-sm font-extrabold">شهادة غير موثقة</h2>
              <p className="mt-1 text-xs text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {!loading && result && result.valid && (
          <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 bg-emerald-600 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} />
                <div>
                  <div className="text-sm font-extrabold">شهادة إتمام موثقة وصحيحة</div>
                  <div className="font-mono text-xs opacity-90" dir="ltr">{result.certificateCode}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                <CheckCircle2 size={14} />
                معتمدة
              </span>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">اسم الطالب</div>
                <div className="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <GraduationCap size={18} className="text-teal-600" />
                  {result.studentName}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">البرنامج التدريبي</div>
                <div className="mt-1 text-base font-extrabold text-slate-900">{result.courseName}</div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">الأكاديمية والفرع</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Building2 size={16} className="text-teal-600" />
                  {result.academyName} · {result.branchName}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">معدل الحضور والتقييم</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <CalendarCheck size={16} className="text-emerald-600" />
                  حضور {result.attendanceRate}% · متوسط التقييم {result.averageScore}/100
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 p-4 text-center">
              <a
                href={`https://academy-dashboard.runasp.net/api/v1/certificates/verify/${encodeURIComponent(result.certificateCode)}/pdf`}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700"
              >
                <Download size={15} />
                تحميل النسخة الرسمية للشهادة (PDF عالي الدقة)
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


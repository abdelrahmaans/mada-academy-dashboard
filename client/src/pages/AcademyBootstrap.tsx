import { useState, type FormEvent } from "react";
import { ArrowLeft, Building2, CheckCircle2, ChevronLeft, GraduationCap, MapPin, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { apiClient, type BootstrapAcademyResponse } from "@/lib/apiClient";

const initialForm = {
  name: "",
  slug: "",
  planCode: "STARTER",
  branchName: "",
  branchCode: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  ownerPassword: "",
};

export default function AcademyBootstrap() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<BootstrapAcademyResponse | null>(null);

  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.branchName.trim() || !form.branchCode.trim() || !form.ownerName.trim() || !form.ownerPhone.trim() || !form.ownerEmail.trim() || form.ownerPassword.length < 8) {
      setError("أكمل بيانات الأكاديمية والفرع ومسؤول الأكاديمية أولًا.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiClient.bootstrapAcademy({
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        planCode: form.planCode,
        primaryBranch: { name: form.branchName.trim(), code: form.branchCode.trim() },
        owner: { fullName: form.ownerName.trim(), phone: form.ownerPhone.trim(), email: form.ownerEmail.trim(), password: form.ownerPassword },
      });
      setCreated(response);
      toast.success("تم إنشاء الأكاديمية بنجاح");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إنشاء الأكاديمية الآن.");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <main className="academy-bootstrap-page" dir="rtl">
        <section className="academy-bootstrap-success">
          <div className="academy-bootstrap-success-icon"><CheckCircle2 size={29} /></div>
          <span className="academy-bootstrap-kicker">MVP CHECKPOINT · ACADEMY BOOTSTRAP</span>
          <h1>الأكاديمية اتعملت بنجاح</h1>
          <p>تم إنشاء الأكاديمية، أول فرع، وحساب مسؤول الأكاديمية في عملية واحدة.</p>
          <div className="academy-bootstrap-result-grid">
            <div><small>الأكاديمية</small><strong>{created.academy.name}</strong><span>{created.academy.slug}</span></div>
            <div><small>الفرع الأساسي</small><strong>{created.primaryBranch.name}</strong><span>{created.primaryBranch.code}</span></div>
            <div><small>مسؤول الأكاديمية</small><strong>{created.owner.displayName}</strong><span>{created.owner.phone}</span></div>
          </div>
          <div className="academy-bootstrap-next-step"><ShieldCheck size={17} /><span><strong>الخطوة التالية:</strong> سجّل دخول مسؤول الأكاديمية برقم الهاتف وكلمة المرور التي تم تعيينها.</span></div>
          <div className="academy-bootstrap-actions">
            <button className="academy-bootstrap-primary" onClick={() => navigate("/workspace")}><ArrowLeft size={16} /> العودة إلى Workspace</button>
            <button className="academy-bootstrap-secondary" onClick={() => { setCreated(null); setForm(initialForm); }}>إنشاء أكاديمية أخرى</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="academy-bootstrap-page" dir="rtl">
      <header className="academy-bootstrap-topbar">
        <button className="academy-bootstrap-brand" onClick={() => navigate("/workspace")}><span><GraduationCap size={19} /></span><strong>مدى</strong><small>Platform Control</small></button>
        <button className="academy-bootstrap-close" aria-label="إغلاق" onClick={() => navigate("/workspace")}><X size={18} /></button>
      </header>
      <div className="academy-bootstrap-layout">
        <section className="academy-bootstrap-intro">
          <span className="academy-bootstrap-kicker"><Building2 size={14} /> PLATFORM · R00</span>
          <h1>أنشئ أكاديمية جديدة من أول خطوة</h1>
          <p>ابدأ الكيان الأساسي للأكاديمية، ثم خلّي النظام يجهز أول فرع ومسؤول أكاديمية بصلاحياته الصحيحة.</p>
          <div className="academy-bootstrap-flow">
            <FlowStep number="01" title="بيانات الأكاديمية" active />
            <FlowStep number="02" title="الفرع الأساسي" />
            <FlowStep number="03" title="مسؤول الأكاديمية" />
            <FlowStep number="04" title="الدخول والصلاحيات" />
          </div>
          <div className="academy-bootstrap-scope"><ShieldCheck size={16} /><div><strong>صلاحية مطلوبة</strong><span>R00 · Platform Admin فقط</span></div></div>
        </section>
        <section className="academy-bootstrap-card">
          <div className="academy-bootstrap-card-heading"><div><span className="academy-bootstrap-card-icon"><Building2 size={18} /></span><div><h2>إنشاء الأكاديمية</h2><p>بيانات تأسيسية قابلة للتعديل بعد الإنشاء.</p></div></div><span className="academy-bootstrap-step">1 / 1</span></div>
          {error && <div className="academy-bootstrap-error" role="alert"><X size={15} /><span>{error}</span></div>}
          <form onSubmit={submit} className="academy-bootstrap-form">
            <fieldset><legend>بيانات الأكاديمية</legend><div className="academy-bootstrap-fields two"><Field label="اسم الأكاديمية" value={form.name} onChange={value => update("name", value)} placeholder="مثال: أكاديمية مدى" required /><Field label="Slug اختياري" value={form.slug} onChange={value => update("slug", value)} placeholder="mada-academy" dir="ltr" hint="يُستخدم في الرابط الداخلي" /><label><span>الباقة</span><select value={form.planCode} onChange={event => update("planCode", event.target.value)}><option value="STARTER">Starter · بداية</option><option value="GROWTH">Growth · نمو</option><option value="SCALE">Scale · توسع</option></select></label></div></fieldset>
            <fieldset><legend><MapPin size={14} /> الفرع الأساسي</legend><div className="academy-bootstrap-fields two"><Field label="اسم الفرع" value={form.branchName} onChange={value => update("branchName", value)} placeholder="مدينة نصر" required /><Field label="كود الفرع" value={form.branchCode} onChange={value => update("branchCode", value)} placeholder="NASR_CITY" dir="ltr" required /></div></fieldset>
            <fieldset><legend><UserRound size={14} /> مسؤول الأكاديمية الأول</legend><div className="academy-bootstrap-fields two"><Field label="الاسم بالكامل" value={form.ownerName} onChange={value => update("ownerName", value)} placeholder="أحمد محمود" required /><Field label="البريد الإلكتروني" value={form.ownerEmail} onChange={value => update("ownerEmail", value)} placeholder="owner@academy.com" type="email" dir="ltr" required /><Field label="رقم الهاتف" value={form.ownerPhone} onChange={value => update("ownerPhone", value)} placeholder="01012345678" type="tel" dir="ltr" required /><Field label="كلمة المرور" value={form.ownerPassword} onChange={value => update("ownerPassword", value)} placeholder="8 أحرف على الأقل" type="password" dir="ltr" required /></div><small className="academy-bootstrap-field-note"><Phone size={13} /> سيتم استخدام الرقم وكلمة المرور في تسجيل الدخول بعد إنشاء الأكاديمية.</small></fieldset>
            <div className="academy-bootstrap-form-footer"><span><ShieldCheck size={14} /> العملية تنشئ Tenant + Branch + Owner + Membership</span><button className="academy-bootstrap-primary" disabled={submitting}>{submitting ? "جارٍ الإنشاء…" : "إنشاء الأكاديمية"}<ChevronLeft size={16} /></button></div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", dir, required, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; dir?: "ltr" | "rtl"; required?: boolean; hint?: string }) {
  return <label><span>{label}{required && <b> *</b>}</span><input type={type} value={value} dir={dir} placeholder={placeholder} required={required} onChange={event => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}
function FlowStep({ number, title, active = false }: { number: string; title: string; active?: boolean }) {
  return <div className={active ? "academy-bootstrap-flow-step active" : "academy-bootstrap-flow-step"}><span>{number}</span><strong>{title}</strong></div>;
}

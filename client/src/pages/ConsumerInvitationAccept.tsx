import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, Mail, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, type ConsumerInvitationDelivery, type ConsumerInvitationPreview } from "@/lib/apiClient";
import "./ConsumerInvitationAccept.css";

export default function ConsumerInvitationAccept() {
  const [, navigate] = useLocation();
  const { reload } = useAuth();
  const [token, setToken] = useState("");
  const [preview, setPreview] = useState<ConsumerInvitationPreview | null>(null);
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState<ConsumerInvitationDelivery | null>(null);

  useEffect(() => {
    const inviteToken = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    if (inviteToken) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setToken(inviteToken);
    if (!inviteToken) {
      setError("رابط الدعوة غير مكتمل. اطلب من الأكاديمية إرسال دعوة جديدة.");
      return;
    }
    let active = true;
    void apiClient.previewConsumerInvitation(inviteToken).then(result => {
      if (active) setPreview(result);
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : "الدعوة غير صالحة أو انتهت صلاحيتها.");
    });
    return () => { active = false; };
  }, []);

  const resendCode = async () => {
    if (!token) return;
    setResending(true); setError(null); setDeliveryNote(null);
    try {
      const result = await apiClient.resendConsumerInvitationCode(token);
      setDeliveryNote(result);
      if (result.developmentCode) setCode(result.developmentCode);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إرسال رمز جديد.");
    } finally {
      setResending(false);
    }
  };

  const accept = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !preview) return;
    if (preview.displayNameRequired && !fullName.trim()) { setError("اكتب الاسم الكامل."); return; }
    if (password.length < 8) { setError("كلمة المرور يجب ألا تقل عن 8 أحرف."); return; }
    if (password !== passwordConfirmation) { setError("تأكيد كلمة المرور غير مطابق."); return; }
    setBusy(true); setError(null);
    try {
      await apiClient.acceptConsumerInvitation({ token, code: code.trim(), fullName: fullName.trim() || undefined, email: email.trim() || undefined, password });
      await reload();
      navigate(preview.accountType === "parent" ? "/family-portal" : "/student-portal");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تفعيل الحساب. راجع الرمز وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="consumer-invite-page" dir="rtl">
    <section className="consumer-invite-card" aria-labelledby="consumer-invite-title">
      <header className="consumer-invite-brand"><span><ShieldCheck size={20} /></span><div><strong>مدى أكاديمي</strong><small>تفعيل حساب الأسرة والطالب</small></div></header>
      <div className="consumer-invite-heading"><span className="consumer-invite-icon"><KeyRound size={19} /></span><div><h1 id="consumer-invite-title">قبول دعوة الحساب</h1><p>أدخل رمز التحقق المرسل إلى الهاتف لإكمال تفعيل حسابك.</p></div></div>
      {preview && <div className="consumer-invite-recipient"><Phone size={16} /><span>الدعوة مرتبطة بالرقم</span><strong dir="ltr">{preview.maskedPhone}</strong><span className="consumer-invite-type">{preview.accountType === "parent" ? "ولي أمر" : "طالب"}</span></div>}
      {error && <div className="consumer-invite-error" role="alert">{error}</div>}
      {preview && <form className="consumer-invite-form" onSubmit={accept}>
        {preview.displayNameRequired && <label><span>الاسم الكامل</span><input autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} maxLength={160} required /></label>}
        <label><span>رمز التحقق (6 أرقام)</span><input autoFocus inputMode="numeric" autoComplete="one-time-code" dir="ltr" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} pattern="[0-9]{6}" maxLength={6} required /></label>
        <label><span>البريد الإلكتروني <small>اختياري</small></span><div className="consumer-invite-input"><Mail size={16} /><input type="email" autoComplete="email" dir="ltr" value={email} onChange={event => setEmail(event.target.value)} maxLength={320} placeholder="name@example.com" /></div></label>
        <label><span>كلمة المرور</span><div className="consumer-invite-input"><LockKeyhole size={16} /><input type="password" autoComplete="new-password" dir="ltr" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required /></div></label>
        <label><span>تأكيد كلمة المرور</span><div className="consumer-invite-input"><LockKeyhole size={16} /><input type="password" autoComplete="new-password" dir="ltr" value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} minLength={8} required /></div></label>
        <button type="submit" className="consumer-invite-primary" disabled={busy || code.length !== 6}>{busy ? "جارٍ تفعيل الحساب…" : "تحقق وفعّل الحساب"}<ArrowLeft size={16} /></button>
      </form>}
      {preview && <div className="consumer-invite-actions"><button type="button" className="consumer-invite-resend" onClick={() => void resendCode()} disabled={resending}><RefreshCw size={15} />{resending ? "جارٍ الإرسال…" : "إعادة إرسال رمز التحقق"}</button><span>صلاحية الرمز 10 دقائق، وبحد أقصى 5 محاولات تحقق.</span></div>}
      {deliveryNote?.developmentCode && <div className="consumer-invite-dev-note" role="status"><CheckCircle2 size={15} /> رمز اختبار Development فقط: <b dir="ltr">{deliveryNote.developmentCode}</b> — لا يتم إرسال SMS فعلية في هذا الوضع.</div>}
      <footer className="consumer-invite-footer"><ShieldCheck size={14} /> لا تشارك رمز التحقق مع أي شخص.</footer>
    </section>
  </main>;
}

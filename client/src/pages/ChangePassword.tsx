import { useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import "./Login.css";

export default function ChangePassword() {
  const { me, logout } = useAuth();
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) { setError("كلمة السر الجديدة يجب ألا تقل عن 8 أحرف."); return; }
    if (newPassword !== confirmation) { setError("تأكيد كلمة السر غير مطابق."); return; }
    setBusy(true); setError(null);
    try {
      await apiClient.changePassword(newPassword, currentPassword);
      toast.success("تم تغيير كلمة السر بنجاح. سجّل الدخول بالكلمة الجديدة.");
      await logout();
      navigate("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تغيير كلمة السر.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-login-page" dir="rtl">
    <section className="auth-login-aside">
      <div className="auth-login-brand"><span><ShieldCheck size={20} /></span><strong>مدى</strong><small>Academy Operating System</small></div>
      <span className="auth-login-kicker">SECURE ACCOUNT SETUP</span>
      <h1>خطوة أمان واحدة قبل دخول الأكاديمية.</h1>
      <p>هذه كلمة سر مؤقتة. غيّرها الآن إلى كلمة سر خاصة بك، وبعدها ستدخل إلى مساحة الأكاديمية بشكل طبيعي.</p>
      <div className="auth-login-trust"><div><KeyRound size={16} /><span><strong>كلمة سر جديدة</strong><small>لا تشاركها مع أي شخص</small></span></div><div><LockKeyhole size={16} /><span><strong>جلسات آمنة</strong><small>سيتم إنهاء الجلسة المؤقتة بعد التغيير</small></span></div></div>
    </section>
    <section className="auth-login-card">
      <div className="auth-login-card-head"><span className="auth-login-icon"><KeyRound size={19} /></span><div><h2>تغيير كلمة السر</h2><p>{me?.user?.displayName ? `مرحباً ${me.user.displayName}` : "غيّر كلمة السر المؤقتة"}</p></div></div>
      {error && <div className="auth-login-error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-login-form">
        <label htmlFor="current-password"><span>كلمة السر المؤقتة الحالية</span><div className="auth-input-with-icon"><LockKeyhole size={16} /><input id="current-password" autoComplete="current-password" dir="ltr" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required /></div></label>
        <label htmlFor="new-password"><span>كلمة السر الجديدة</span><div className="auth-input-with-icon"><LockKeyhole size={16} /><input id="new-password" autoComplete="new-password" dir="ltr" type="password" minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} required /></div></label>
        <label htmlFor="confirm-password"><span>تأكيد كلمة السر الجديدة</span><div className="auth-input-with-icon"><LockKeyhole size={16} /><input id="confirm-password" autoComplete="new-password" dir="ltr" type="password" minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></div></label>
        <button className="auth-login-primary" type="submit" disabled={busy} aria-busy={busy}>{busy ? "جارٍ الحفظ…" : "حفظ كلمة السر والدخول"}<ArrowLeft size={16} /></button>
      </form>
      <footer className="auth-login-footer"><ShieldCheck size={14} /> بعد الحفظ سيتم تسجيل خروجك، ثم تدخل بالكلمة الجديدة.</footer>
    </section>
  </main>;
}

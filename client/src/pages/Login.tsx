import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import "./Login.css";

function homeForRole(role: string) {
  const roleHomes: Record<string, string> = {
    R00_PLATFORM_ADMIN: "/platform-console",
    R01_ACADEMY_OWNER: "/executive-dashboard",
    R02_BRANCH_MANAGER: "/",
    R03_HEAD_INSTRUCTORS: "/head-instructors",
    R04_INSTRUCTOR: "/instructor-desk",
    R05_SECRETARY: "/secretary-desk",
    R06_ACCOUNTANT: "/finance-desk",
    R07_MEDIA_MANAGER: "/marketing-desk",
    R08_PARENT: "/family-portal",
    R09_STUDENT: "/student-portal",
  };
  return roleHomes[role] ?? "/workspace";
}

export default function Login() {
  const { me, loading, error: authError, login } = useAuth();
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"staff" | "parent" | "student">("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && me) navigate(homeForRole(me.role)); }, [loading, me, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!phone.trim() || !password) { setError("أدخل رقم الهاتف وكلمة المرور."); return; }
    setBusy(true); setError(null);
    try { await login(phone.trim(), password, accountType); }
    catch (cause) { setError(cause instanceof Error ? cause.message : authError ?? "رقم الهاتف أو كلمة المرور غير صحيحة."); }
    finally { setBusy(false); }
  };

  return <main className="auth-login-page" dir="rtl">
    <section className="auth-login-aside"><div className="auth-login-brand"><span><ShieldCheck size={20} /></span><strong>مدى</strong><small>Academy Operating System</small></div><span className="auth-login-kicker">SECURE WORKSPACE ACCESS</span><h1>ادخل إلى مساحة الأكاديمية بصلاحيتك.</h1><p>كل حساب يرى نطاقه فقط. الدور والأكاديمية والصلاحيات يتم تحميلها من الـbackend بعد تسجيل الدخول.</p><div className="auth-login-trust"><div><CheckCircle2 size={16} /><span><strong>نطاق واضح</strong><small>Academy · Branch · Assigned</small></span></div><div><LockKeyhole size={16} /><span><strong>دخول آمن</strong><small>رقم الهاتف وكلمة المرور</small></span></div></div></section>
    <section className="auth-login-card"><div className="auth-login-card-head"><span className="auth-login-icon"><KeyRound size={19} /></span><div><h2>تسجيل الدخول</h2><p>استخدم رقم الهاتف وكلمة المرور لحسابك في مدى.</p></div></div>{(error || authError) && <div className="auth-login-error" role="alert">{error || authError}</div>}
      <form onSubmit={submit} className="auth-login-form"><label><span>نوع الحساب</span><select aria-label="نوع الحساب" value={accountType} onChange={event => setAccountType(event.target.value as typeof accountType)}><option value="staff">فريق الأكاديمية</option><option value="parent">ولي أمر</option><option value="student">طالب</option></select></label><label><span>رقم الهاتف</span><div className="auth-input-with-icon"><Phone size={16} /><input autoFocus autoComplete="tel" aria-label="رقم الهاتف" dir="ltr" type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="01012345678" /></div></label><label><span>كلمة المرور</span><div className="auth-input-with-icon"><LockKeyhole size={16} /><input autoComplete="current-password" aria-label="كلمة المرور" dir="ltr" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" /><button type="button" className="auth-password-toggle" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword(value => !value)}>{showPassword ? "إخفاء" : "إظهار"}</button></div></label><button className="auth-login-primary" type="submit" disabled={busy} aria-busy={busy}>{busy ? "جارٍ تسجيل الدخول…" : "دخول إلى المساحة"}<ArrowLeft size={16} /></button></form>
      <footer className="auth-login-footer"><ShieldCheck size={14} /> لا تملك حسابًا؟ اطلب دعوة من مسؤول الأكاديمية.</footer>
    </section>
  </main>;
}

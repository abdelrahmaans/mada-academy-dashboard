import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
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
  const { lang, dir, t } = useLanguage();
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"staff" | "parent" | "student">("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && me) navigate(me.mustChangePassword || me.user?.mustChangePassword ? "/change-password" : homeForRole(me.role)); }, [loading, me, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!phone.trim() || !password) { setError(lang === "en" ? "Please enter phone and password." : "أدخل رقم الهاتف وكلمة المرور."); return; }
    setBusy(true); setError(null);
    try {
      if (password.startsWith("Mada#")) {
        localStorage.setItem("mada_must_change_password", "true");
      }
      await login(phone.trim(), password, accountType);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : authError ?? (lang === "en" ? "Invalid phone number or password." : "رقم الهاتف أو كلمة المرور غير صحيحة.")); }
    finally { setBusy(false); }
  };

  return <main className="auth-login-page" dir={dir}>
    <section className="auth-login-aside">
      <div className="auth-login-brand">
        <span><ShieldCheck size={20} /></span>
        <strong>{lang === "en" ? "Mada" : "مدى"}</strong>
        <small>Academy Operating System</small>
      </div>
      <span className="auth-login-kicker">SECURE WORKSPACE ACCESS</span>
      <h1>{lang === "en" ? "Sign in to your academy workspace." : "ادخل إلى مساحة الأكاديمية بصلاحيتك."}</h1>
      <p>{lang === "en" ? "Each account only sees its assigned scope. Role, academy, and permissions are loaded securely from the backend." : "كل حساب يرى نطاقه فقط. الدور والأكاديمية والصلاحيات يتم تحميلها من الـbackend بعد تسجيل الدخول."}</p>
      <div className="auth-login-trust">
        <div><CheckCircle2 size={16} /><span><strong>{lang === "en" ? "Clear Scope" : "نطاق واضح"}</strong><small>Academy · Branch · Assigned</small></span></div>
        <div><LockKeyhole size={16} /><span><strong>{lang === "en" ? "Secure Auth" : "دخول آمن"}</strong><small>{lang === "en" ? "Phone & Password" : "رقم الهاتف وكلمة المرور"}</small></span></div>
      </div>
    </section>
    <section className="auth-login-card">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
        <LanguageToggle variant="pill" />
      </div>
      <div className="auth-login-card-head">
        <span className="auth-login-icon"><KeyRound size={19} /></span>
        <div>
          <h2>{lang === "en" ? "Sign In" : "تسجيل الدخول"}</h2>
          <p>{lang === "en" ? "Enter your phone and password for your Mada account." : "استخدم رقم الهاتف وكلمة المرور لحسابك في مدى."}</p>
        </div>
      </div>
      {(error || authError) && <div className="auth-login-error" role="alert">{error || authError}</div>}
      <form onSubmit={submit} className="auth-login-form">
        <label htmlFor="login-account-type">
          <span>{lang === "en" ? "Account Type" : "نوع الحساب"}</span>
          <select id="login-account-type" name="accountType" aria-label={lang === "en" ? "Account Type" : "نوع الحساب"} value={accountType} onChange={event => setAccountType(event.target.value as typeof accountType)}>
            <option value="staff">{lang === "en" ? "Academy Staff" : "فريق الأكاديمية"}</option>
            <option value="parent">{lang === "en" ? "Parent" : "ولي أمر"}</option>
            <option value="student">{lang === "en" ? "Student" : "طالب"}</option>
          </select>
        </label>
        <label htmlFor="login-phone">
          <span>{lang === "en" ? "Phone Number" : "رقم الهاتف"}</span>
          <div className="auth-input-with-icon">
            <Phone size={16} />
            <input id="login-phone" name="phone" autoFocus autoComplete="tel" aria-label={lang === "en" ? "Phone Number" : "رقم الهاتف"} dir="ltr" type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="01012345678" />
          </div>
        </label>
        <label htmlFor="login-password">
          <span>{lang === "en" ? "Password" : "كلمة المرور"}</span>
          <div className="auth-input-with-icon">
            <LockKeyhole size={16} />
            <input id="login-password" name="password" autoComplete="current-password" aria-label={lang === "en" ? "Password" : "كلمة المرور"} dir="ltr" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" />
            <button type="button" className="auth-password-toggle" aria-label={showPassword ? (lang === "en" ? "Hide password" : "إخفاء كلمة المرور") : (lang === "en" ? "Show password" : "إظهار كلمة المرور")} onClick={() => setShowPassword(value => !value)}>
              {showPassword ? (lang === "en" ? "Hide" : "إخفاء") : (lang === "en" ? "Show" : "إظهار")}
            </button>
          </div>
        </label>
        <button className="auth-login-primary" type="submit" disabled={busy} aria-busy={busy}>
          {busy ? (lang === "en" ? "Signing In…" : "جارٍ تسجيل الدخول…") : (lang === "en" ? "Access Workspace" : "دخول إلى المساحة")}
          <ArrowLeft size={16} />
        </button>
      </form>
      <footer className="auth-login-footer">
        <ShieldCheck size={14} />
        {lang === "en" ? " Don't have an account? Request an invite from the academy administrator." : " لا تملك حسابًا؟ اطلب دعوة من مسؤول الأكاديمية."}
      </footer>
    </section>
  </main>;
}

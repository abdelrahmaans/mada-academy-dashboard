import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  Send,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { DASHBOARD_URL, submitPublicLead } from "@/lib/publicApi";

type FormMessage = { type: "success" | "error"; text: string } | null;

function DemoForm() {
  const [message, setMessage] = useState<FormMessage>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setPending(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await submitPublicLead({
        kind: "demo",
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        academyName: String(form.get("academyName")),
        branchCount: String(form.get("branchCount")),
        operationalNeed: String(form.get("operationalNeed")),
      });
      formElement.reset();
      setMessage({
        type: "success",
        text: "وصل طلبك. سيتواصل معك فريق Mada لتنسيق عرض يناسب طريقة تشغيل أكاديميتك.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "تعذر إرسال الطلب. حاول مرة أخرى.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="lead-form demo-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <span>01</span>
        <div>
          <strong>اطلب Demo للنظام</strong>
          <small>هنستعرض معك طريقة تشغيل الأكاديمية، مش عرضًا عامًا.</small>
        </div>
      </div>
      <div className="field-grid">
        <label>
          الاسم الكامل
          <input autoComplete="name" required name="name" placeholder="مثال: سارة أحمد" />
        </label>
        <label>
          اسم الأكاديمية
          <input required name="academyName" placeholder="اسم الأكاديمية" />
        </label>
        <label>
          البريد المهني
          <input autoComplete="email" required type="email" name="email" placeholder="you@academy.com" dir="ltr" />
        </label>
        <label>
          رقم الهاتف
          <input autoComplete="tel" required name="phone" type="tel" placeholder="01xxxxxxxxx" dir="ltr" />
        </label>
        <label>
          عدد الفروع
          <select required name="branchCount" defaultValue="">
            <option value="" disabled>اختر عدد الفروع</option>
            <option value="فرع واحد">فرع واحد</option>
            <option value="2–3 فروع">2–3 فروع</option>
            <option value="4–10 فروع">4–10 فروع</option>
            <option value="11+ فروع">11+ فروع</option>
          </select>
        </label>
      </div>
      <label>
        ما أكبر تحدٍ تشغيلي تريد حله؟
        <textarea required name="operationalNeed" rows={3} placeholder="مثال: متابعة الجداول والحضور بين أكثر من فرع…" />
      </label>
      <p className="privacy-note">لا ترسل بيانات طلاب أو أطفال هنا. بيانات التواصل تستخدم للرد على طلب العرض.</p>
      <button className="button button-primary button-wide" disabled={pending}>
        {pending ? "جارٍ إرسال الطلب…" : "أرسل طلب الـDemo"}
        <Send size={17} aria-hidden="true" />
      </button>
      {message && (
        <p className={`form-message ${message.type}`} role={message.type === "error" ? "alert" : "status"} aria-live="polite">
          <CheckCircle2 size={16} aria-hidden="true" />
          {message.text}
        </p>
      )}
    </form>
  );
}

const capabilities = [
  {
    icon: Building2,
    label: "01 / الفروع",
    title: "كل فرع في نطاق واضح",
    text: "نظّم الفروع، وحدد لكل فريق المساحة التي يعمل ضمنها.",
  },
  {
    icon: Users,
    label: "02 / الطلاب والفريق",
    title: "ملفات ومجموعات مترابطة",
    text: "تابع الطلاب والتسجيلات والمجموعات، واربط كل دور بما يحتاجه.",
  },
  {
    icon: CalendarDays,
    label: "03 / التشغيل اليومي",
    title: "جداول وحضور الجلسات",
    text: "رتّب الجلسات وسجّل الحضور وتابع سير العمل عبر الفروع.",
  },
  {
    icon: ClipboardCheck,
    label: "04 / التقدم",
    title: "تقييمات مفهومة للفريق",
    text: "سجّل التقييمات وانشر المعلومات للأدوار المعنية.",
  },
  {
    icon: Wallet,
    label: "05 / المالية",
    title: "سجلات مالية أوضح",
    text: "تابع الفواتير والمدفوعات والمصروفات. الدفع نفسه يتم خارج النظام.",
  },
  {
    icon: LayoutDashboard,
    label: "06 / المتابعة",
    title: "صورة تشغيلية في مكان واحد",
    text: "راجع النشاط والمؤشرات المتاحة ضمن صلاحياتك ونطاقك.",
  },
];

const workflow = [
  { title: "جهّز الأكاديمية", text: "عرّف الفروع، أعضاء الفريق، والأدوار المصرح بها." },
  { title: "نظّم الطلاب والمجموعات", text: "اربط ملفات الطلاب بالتسجيلات ومجموعات الدراسة." },
  { title: "شغّل الجلسات", text: "رتّب الجدول وسجّل الحضور وملاحظات التنفيذ." },
  { title: "تابع التقدم والسجلات", text: "ارجع للتقييمات والفواتير والتحصيل المسجل حسب دورك." },
];

const audiences = [
  {
    icon: LayoutDashboard,
    label: "للإدارة",
    title: "رؤية أوضح للأكاديمية",
    text: "تابع حالة التشغيل والفروع من مساحة إدارية واحدة.",
  },
  {
    icon: Building2,
    label: "لمدير الفرع",
    title: "إدارة يومية داخل النطاق",
    text: "نظّم الفريق والجداول والطلاب في الفرع المصرح لك به.",
  },
  {
    icon: Activity,
    label: "لفريق التشغيل",
    title: "خطوات العمل متصلة",
    text: "من تسجيل الطالب والجلسة إلى الحضور والمتابعة.",
  },
  {
    icon: Users,
    label: "للأسرة والطالب",
    title: "معلومات تخصّهم",
    text: "تجربة مرتبطة بالطالب وما تتيحه الأكاديمية لهما.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".reveal-on-scroll"));
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) observer.unobserve(entry.target);
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      }),
      { threshold: 0.14 },
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell" dir="rtl">
      <header className="site-header">
        <Link href="/" className="brand-mark" aria-label="Mada Academy — الرئيسية">
          <span className="brand-symbol">↗</span>
          <span><strong>MADA</strong><small>ACADEMY</small></span>
        </Link>
        <nav className={menuOpen ? "nav-open" : ""} aria-label="القائمة الرئيسية">
          <a href="#features" onClick={closeMenu}>المزايا</a>
          <a href="#workflow" onClick={closeMenu}>سير التشغيل</a>
          <a href="#audience" onClick={closeMenu}>لمن صُمم</a>
          <a href="#demo" onClick={closeMenu}>اطلب Demo</a>
          <a href={DASHBOARD_URL} className="mobile-nav-link" onClick={closeMenu}>دخول Admin</a>
        </nav>
        <div className="header-actions">
          <a className="text-link" href={DASHBOARD_URL}>دخول Admin <ArrowUpLeft size={15} /></a>
          <a href="#demo" className="button button-small button-dark">اطلب عرضًا <ArrowLeft size={15} /></a>
        </div>
        <button
          className="menu-button"
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="signal-dot" /> MADA / ACADEMY OPERATIONS</div>
            <h1>شغّل أكاديميتك<br /><em>من مساحة واحدة.</em></h1>
            <p className="hero-lede">نظّم الفروع والطلاب والجلسات والحضور والتقييمات والسجلات المالية في تجربة واحدة، بصلاحيات تناسب كل دور.</p>
            <div className="hero-actions">
              <a href="#demo" className="button button-primary">اطلب عرضًا للنظام <ArrowLeft size={18} /></a>
              <a href="#features" className="quiet-link">استكشف المزايا <ArrowDown size={17} /></a>
            </div>
            <div className="proof-strip" aria-label="مجالات تشغيل الأكاديمية">
              <div><strong>01</strong><span>الفروع والطلاب</span></div>
              <div><strong>02</strong><span>الجلسات والحضور</span></div>
              <div><strong>03</strong><span>التقييم والمتابعة</span></div>
            </div>
          </div>
          <div className="hero-visual product-preview" aria-label="تصور بصري لمساحة تشغيل الأكاديمية">
            <div className="visual-index">MADA / ACADEMY OPERATIONS</div>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-panel product-dashboard">
              <span className="panel-label">مساحة الأكاديمية</span>
              <strong>كل يوم<br /><em>أوضح.</em></strong>
              <div className="dashboard-lines">
                <div><Building2 size={14} /><span>الفروع</span><b>ضمن نطاقها</b></div>
                <div><CalendarDays size={14} /><span>الجلسات</span><b>في جدول واحد</b></div>
                <div><ClipboardCheck size={14} /><span>المتابعة</span><b>حسب الدور</b></div>
              </div>
              <div className="panel-foot"><span>students · sessions · progress</span><span className="mini-arrow">↗</span></div>
            </div>
            <div className="floating-note"><ShieldCheck size={18} /><span><b>نطاق وصلاحيات</b><small>لكل دور مساحة واضحة</small></span></div>
            <div className="visual-number">01</div>
          </div>
        </section>

        <section className="ticker" aria-label="مساحات إدارة الأكاديمية">
          <span>ACADEMY OPERATIONS</span><i>✳</i><span>الفروع</span><i>✳</i><span>الطلاب</span><i>✳</i><span>الجلسات والمتابعة</span>
        </section>

        <section className="product-section reveal-on-scroll" id="features">
          <div className="section-intro">
            <div><div className="eyebrow">02 / المزايا</div><h2>تشغيل مترابط.<br /><em>وتفاصيل أوضح.</em></h2></div>
            <p>بدل ملفات وخطوات متفرقة، اجمع العمليات اليومية التي تحتاجها الأكاديمية في مساحة منظمة حسب الفرع والدور.</p>
          </div>
          <div className="product-grid">
            {capabilities.map(({ icon: Icon, label, title, text }) => (
              <article className="product-card" key={label}>
                <div className="product-card-top"><span className="product-icon"><Icon size={19} aria-hidden="true" /></span><span>{label}</span></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="method-section reveal-on-scroll" id="workflow">
          <div className="section-intro">
            <div><div className="eyebrow">03 / سير التشغيل</div><h2>من إعداد الفرع<br />إلى <em>متابعة التقدم.</em></h2></div>
            <p>تظهر قيمة النظام في ترابط الخطوات اليومية، مع بقاء كل عضو داخل الصلاحيات الممنوحة له.</p>
          </div>
          <div className="method-steps">
            {workflow.map((step, index) => (
              <article className={index === 1 ? "active-step" : ""} key={step.title}>
                <span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><ArrowUpLeft size={20} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="audience-section reveal-on-scroll" id="audience">
          <div className="section-intro split-intro">
            <div><div className="eyebrow">04 / لمن صُمم</div><h2>أدوار مختلفة.<br /><em>تشغيل أوضح.</em></h2></div>
            <p>لكل شخص في الأكاديمية زاوية مختلفة للعمل؛ تظهر له المعلومات والمسارات المناسبة لدوره ونطاقه.</p>
          </div>
          <div className="audience-list">
            {audiences.map(({ icon: Icon, label, title, text }, index) => (
              <article key={label} className={index === 1 ? "audience-card featured" : "audience-card"}>
                <div className="card-top"><span className="card-icon"><Icon size={19} aria-hidden="true" /></span><span>{label}</span><ArrowUpLeft size={19} aria-hidden="true" /></div>
                <h3>{title}</h3><p>{text}</p><span className="card-index">0{index + 1}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="quote-section reveal-on-scroll">
          <div className="quote-mark">“</div>
          <blockquote>كل دور يرى ما يحتاجه.<br /><em>وكل فرع يعمل ضمن نطاقه.</em></blockquote>
          <div className="quote-aside"><span className="eyebrow">SCOPE BY DESIGN</span><p>التحقق من الصلاحيات يتم في الـBackend؛ الواجهة وحدها لا تمنح الوصول.</p><p className="finance-boundary">الفواتير والتحصيل سجلات تشغيلية. Mada لا تعالج المدفوعات.</p></div>
        </section>

        <section className="conversion-section reveal-on-scroll" id="demo">
          <div className="conversion-heading">
            <div><div className="eyebrow">05 / الخطوة التالية</div><h2>خلّينا نعرض لك<br /><em>النظام على واقعك.</em></h2></div>
            <p>شاركنا نبذة عن الأكاديمية. نرتب Demo يوضح سير التشغيل المناسب لاحتياجك.</p>
          </div>
          <div className="forms-grid demo-layout">
            <DemoForm />
            <aside className="demo-aside">
              <div className="eyebrow">MADA / PRODUCT WALKTHROUGH</div>
              <h3>إيه اللي هتشوفه في العرض؟</h3>
              <ol>
                <li><span>01</span><div><strong>مساحة الأكاديمية</strong><small>الفروع والأدوار والصلاحيات.</small></div></li>
                <li><span>02</span><div><strong>يوم تشغيل نموذجي</strong><small>الطلاب، الجلسات، الحضور، والمتابعة.</small></div></li>
                <li><span>03</span><div><strong>أسئلتك وخطوتك التالية</strong><small>نركز على طريقة عمل أكاديميتك.</small></div></li>
              </ol>
              <div className="demo-aside-note"><CheckCircle2 size={16} aria-hidden="true" /><span>لا تحتاج لإرسال بيانات طلاب أو ملفات تشغيل لطلب العرض.</span></div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Link href="/" className="brand-mark"><span className="brand-symbol">↗</span><span><strong>MADA</strong><small>ACADEMY</small></span></Link>
        <span>Mada Academy — نظام لإدارة الأكاديميات</span>
        <a href="#demo">اطلب Demo <ArrowUpLeft size={15} /></a>
      </footer>
    </div>
  );
}

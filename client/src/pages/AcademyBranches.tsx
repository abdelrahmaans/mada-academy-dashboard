import { useEffect, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Edit3, Link2, LoaderCircle, Plus, ShieldCheck, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import { apiClient, type AcademyBranch } from "@/lib/apiClient";
import "./AcademyBranches.css";

export default function AcademyBranches() {
  const [, navigate] = useLocation();
  const [branches, setBranches] = useState<AcademyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AcademyBranch | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });

  const load = async () => {
    setLoading(true); setError(null);
    try { setBranches((await apiClient.academyBranches()).items); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل الفروع."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", code: "" }); setShowAdd(true); };
  const openEdit = (branch: AcademyBranch) => { setEditing(branch); setForm({ name: branch.name, code: branch.code }); setShowAdd(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) { toast.error("أدخل اسم الفرع والكود."); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiClient.updateAcademyBranch(editing.id, form);
        setBranches(current => current.map(item => item.id === editing.id ? { ...item, ...updated } : item));
        toast.success("تم تحديث بيانات الفرع");
      } else {
        const created = await apiClient.addAcademyBranch(form);
        setBranches(current => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "ar")));
        toast.success("تم إنشاء الفرع");
      }
      setShowAdd(false);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر حفظ الفرع."); }
    finally { setSaving(false); }
  };
  const toggleStatus = async (branch: AcademyBranch) => {
    setSaving(true);
    try {
      const status = branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await apiClient.changeAcademyBranchStatus(branch.id, status);
      setBranches(current => current.map(item => item.id === branch.id ? { ...item, status } : item));
      toast.success(status === "ACTIVE" ? "تم تفعيل الفرع" : "تم إيقاف الفرع");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تغيير حالة الفرع."); }
    finally { setSaving(false); }
  };

  return <RoleDashboardShell className="academy-branches-shell" roleCode="R01" roleLabel="مسؤول الأكاديمية" scopeLevel="tenant" scopeLabel="كل فروع الأكاديمية" tenantName="الأكاديمية">
    <main className="academy-branches-page" dir="rtl">
      <header className="academy-branches-topbar"><button onClick={() => navigate("/academy-owner")}><ArrowRight size={16} /> العودة إلى الأكاديمية</button><span><ShieldCheck size={15} /> R01 · إدارة الفروع</span></header>
      <div className="academy-branches-content">
        <PageHeader className="academy-branches-header" eyebrow={<span><i /> ACADEMY STRUCTURE · الفروع</span>} title="إدارة الفروع" description="أنشئ فروع الأكاديمية، حدّث بياناتها، وتابع المستخدمين والطلاب المرتبطين بكل فرع." actions={<button className="academy-branches-add" onClick={openAdd}><Plus size={16} /> إضافة فرع</button>} />
        <div className="academy-branches-scope"><ShieldCheck size={16} /><span><strong>نطاق الإدارة:</strong> فروع أكاديميتك فقط · المستخدمون ذوو الدور الفرعي يجب ربطهم بفرع نشط.</span></div>
        {error && <div className="academy-branches-error">{error}<button onClick={() => void load()}>إعادة المحاولة</button></div>}
        {loading ? <div className="academy-branches-loading"><LoaderCircle className="spin" size={22} /> جارٍ تحميل الفروع…</div> : <>
          <section className="academy-branches-metrics"><Metric icon={<Building2 size={17} />} label="إجمالي الفروع" value={branches.length} /><Metric icon={<CheckCircle2 size={17} />} label="فروع نشطة" value={branches.filter(item => item.status === "ACTIVE").length} /><Metric icon={<Users size={17} />} label="مستخدمون مرتبطون" value={branches.reduce((sum, item) => sum + item.membersCount, 0)} /><Metric icon={<Link2 size={17} />} label="طلاب مرتبطون" value={branches.reduce((sum, item) => sum + item.studentsCount, 0)} /></section>
          <section className="academy-branches-grid">{branches.length === 0 ? <div className="academy-branches-empty"><Building2 size={25} /><strong>لا توجد فروع بعد</strong><span>ابدأ بإنشاء أول فرع للأكاديمية.</span></div> : branches.map(branch => <article className="academy-branch-card" key={branch.id}><header><span className="academy-branch-icon"><Building2 size={19} /></span><div><strong>{branch.name}</strong><small dir="ltr">{branch.code}</small></div><span className={`academy-branch-status ${branch.status.toLowerCase()}`}>{branch.status === "ACTIVE" ? "نشط" : "موقوف"}</span></header><div className="academy-branch-counts"><span><Users size={14} /><b>{branch.membersCount}</b> مستخدم</span><span><Link2 size={14} /><b>{branch.studentsCount}</b> طالب</span></div><footer><button onClick={() => openEdit(branch)}><Edit3 size={14} /> تعديل</button><button onClick={() => void toggleStatus(branch)} disabled={saving}>{branch.status === "ACTIVE" ? "إيقاف الفرع" : "تفعيل الفرع"}</button><button className="link" onClick={() => navigate(`/academy/roles?branch=${branch.id}`)}>إدارة المستخدمين <ArrowRight size={13} /></button></footer></article>)}</section>
        </>}
      </div>
    </main>
    {showAdd && <div className="academy-branches-overlay"><form className="academy-branches-modal" onSubmit={save}><header><div><span><Building2 size={17} /></span><h2>{editing ? "تعديل الفرع" : "إضافة فرع جديد"}</h2></div><button type="button" onClick={() => setShowAdd(false)}><X size={18} /></button></header><p>استخدم كودًا إنجليزيًا ثابتًا لتمييز الفرع داخل الأكاديمية.</p><label>اسم الفرع<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="فرع مدينة نصر" /></label><label>كود الفرع<input dir="ltr" value={form.code} onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="NASR" /></label><footer><button type="button" onClick={() => setShowAdd(false)}>إلغاء</button><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ الفرع"}</button></footer></form></div>}
  </RoleDashboardShell>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="academy-branches-metric"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }

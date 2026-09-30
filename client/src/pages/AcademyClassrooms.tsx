import { useEffect, useMemo, useState } from "react";
import { Armchair, ArrowRight, Building2, CheckCircle2, Edit3, GraduationCap, LoaderCircle, MapPin, Plus, Settings2, Trash2, Users, Wrench, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import PageHeader from "@/components/PageHeader";
import { apiClient, type AcademyBranch, type AcademyClassroom, type ClassroomResource } from "@/lib/apiClient";

const STATUS_LABELS: Record<string, string> = { AVAILABLE: "متاحة", MAINTENANCE: "صيانة", INACTIVE: "موقوفة" };
const STATUS_TONES: Record<string, string> = { AVAILABLE: "available", MAINTENANCE: "maintenance", INACTIVE: "inactive" };

export default function AcademyClassrooms() {
  const [, navigate] = useLocation();
  const [branches, setBranches] = useState<AcademyBranch[]>([]);
  const [classrooms, setClassrooms] = useState<AcademyClassroom[]>([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AcademyClassroom | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ branchId: "", name: "", capacity: "12" });
  const [resourceRoom, setResourceRoom] = useState<AcademyClassroom | null>(null);
  const [resources, setResources] = useState<ClassroomResource[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceForm, setResourceForm] = useState({ kind: "EQUIPMENT" as "SEATING" | "EQUIPMENT", name: "", quantity: "1", status: "AVAILABLE", notes: "" });

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [branchResponse, classroomResponse] = await Promise.all([apiClient.academyBranches(), apiClient.academyClassrooms(branchFilter === "all" ? undefined : branchFilter)]);
      setBranches(branchResponse.items.filter(branch => branch.status === "ACTIVE"));
      setClassrooms(classroomResponse.items);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل القاعات."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [branchFilter]);

  const activeClassrooms = useMemo(() => classrooms.filter(room => room.status === "AVAILABLE").length, [classrooms]);
  const totalCapacity = useMemo(() => classrooms.filter(room => room.status !== "INACTIVE").reduce((sum, room) => sum + room.capacity, 0), [classrooms]);
  const scheduledRooms = useMemo(() => classrooms.filter(room => room.sessionsCount > 0).length, [classrooms]);

  const openAdd = () => { setEditing(null); setForm({ branchId: branchFilter === "all" ? branches[0]?.id ?? "" : branchFilter, name: "", capacity: "12" }); setShowForm(true); };
  const openEdit = (room: AcademyClassroom) => { setEditing(room); setForm({ branchId: room.branchId, name: room.name, capacity: String(room.capacity) }); setShowForm(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const capacity = Number(form.capacity);
    if (!form.branchId || !form.name.trim() || !Number.isInteger(capacity) || capacity < 1) { toast.error("اختر الفرع وأدخل اسم القاعة وسعة صحيحة."); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiClient.updateAcademyClassroom(editing.id, { name: form.name.trim(), capacity });
        setClassrooms(current => current.map(item => item.id === editing.id ? { ...item, ...updated } : item));
        toast.success("تم تحديث بيانات القاعة");
      } else {
        const created = await apiClient.addAcademyClassroom({ branchId: form.branchId, name: form.name.trim(), capacity });
        if (branchFilter === "all" || created.branchId === branchFilter) setClassrooms(current => [...current, created]);
        toast.success("تم إنشاء القاعة وربطها بالفرع");
      }
      setShowForm(false);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر حفظ القاعة."); }
    finally { setSaving(false); }
  };
  const changeStatus = async (room: AcademyClassroom) => {
    const status = room.status === "AVAILABLE" ? "MAINTENANCE" : room.status === "MAINTENANCE" ? "AVAILABLE" : "AVAILABLE";
    setSaving(true);
    try { await apiClient.changeAcademyClassroomStatus(room.id, status); setClassrooms(current => current.map(item => item.id === room.id ? { ...item, status } : item)); toast.success(status === "AVAILABLE" ? "تم إتاحة القاعة" : "تم تحويل القاعة للصيانة"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تغيير حالة القاعة."); }
    finally { setSaving(false); }
  };
  const openResources = async (room: AcademyClassroom) => {
    setResourceRoom(room); setResourceLoading(true);
    try { const response = await apiClient.classroomResources(room.id); setResources(response.items); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر تحميل تجهيزات القاعة."); }
    finally { setResourceLoading(false); }
  };
  const addResource = async (event: React.FormEvent) => {
    event.preventDefault(); const quantity = Number(resourceForm.quantity);
    if (!resourceRoom || !resourceForm.name.trim() || !Number.isInteger(quantity) || quantity < 1) { toast.error("أدخل اسم المورد وكمية صحيحة."); return; }
    try { const created = await apiClient.addClassroomResource(resourceRoom.id, { ...resourceForm, name: resourceForm.name.trim(), quantity, notes: resourceForm.notes.trim() }); setResources(current => [...current, created]); setResourceForm({ ...resourceForm, name: "", quantity: "1", notes: "" }); toast.success("تمت إضافة المورد للقاعة"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر إضافة المورد."); }
  };
  const removeResource = async (resource: ClassroomResource) => {
    if (!resourceRoom) return;
    try { await apiClient.deleteClassroomResource(resourceRoom.id, resource.id); setResources(current => current.filter(item => item.id !== resource.id)); toast.success("تم حذف المورد"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "تعذر حذف المورد."); }
  };

  return <RoleDashboardShell className="academy-classrooms-shell" roleCode="R01" roleLabel="مسؤول الأكاديمية" scopeLevel="tenant" scopeLabel="كل فروع الأكاديمية" tenantName="الأكاديمية">
    <main className="academy-classrooms-page" dir="rtl">
      <header className="academy-classrooms-topbar"><button onClick={() => navigate("/academy-owner")}><ArrowRight size={16} /> العودة إلى الأكاديمية</button><span><Settings2 size={15} /> R01 · إدارة القاعات</span></header>
      <div className="academy-classrooms-content">
        <PageHeader className="academy-classrooms-header" eyebrow={<span><i /> ACADEMY OPERATIONS · القاعات</span>} title="إدارة القاعات الدراسية" description="عرّف القاعات داخل كل فرع، حدّد سعتها، وتابع جاهزيتها قبل جدولة الحصص." actions={<button className="academy-classrooms-add" onClick={openAdd} disabled={!branches.length}><Plus size={16} /> إضافة قاعة</button>} />
        <div className="academy-classrooms-toolbar"><label><MapPin size={15} /><span>الفرع</span><select value={branchFilter} onChange={event => setBranchFilter(event.target.value)}><option value="all">كل الفروع النشطة</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select></label><button onClick={() => navigate("/academy/branches")}><Building2 size={14} /> إدارة الفروع</button></div>
        {error && <div className="academy-classrooms-error">{error}<button onClick={() => void load()}>إعادة المحاولة</button></div>}
        {loading ? <div className="academy-classrooms-loading"><LoaderCircle className="spin" size={22} /> جارٍ تحميل القاعات…</div> : <>
          <section className="academy-classrooms-metrics"><Metric icon={<Building2 size={17} />} label="إجمالي القاعات" value={classrooms.length} /><Metric icon={<CheckCircle2 size={17} />} label="قاعات متاحة" value={activeClassrooms} /><Metric icon={<Users size={17} />} label="السعة التشغيلية" value={totalCapacity} /><Metric icon={<GraduationCap size={17} />} label="قاعات مجدولة" value={scheduledRooms} /></section>
          <section className="academy-classrooms-grid">{classrooms.length === 0 ? <div className="academy-classrooms-empty"><Building2 size={26} /><strong>لا توجد قاعات بعد</strong><span>أنشئ أول قاعة واربطها بفرع نشط.</span></div> : classrooms.map(room => <article className="academy-classroom-card" key={room.id}><header><span className="academy-classroom-icon"><Building2 size={19} /></span><div><strong>{room.name}</strong><small><MapPin size={11} /> {room.branch.name} · {room.branch.code}</small></div><span className={`academy-classroom-status ${STATUS_TONES[room.status] ?? "inactive"}`}>{STATUS_LABELS[room.status] ?? room.status}</span></header><div className="academy-classroom-details"><span><Users size={14} /><b>{room.capacity}</b> مقعد</span><span><GraduationCap size={14} /><b>{room.sessionsCount}</b> حصة</span><span><Settings2 size={14} /><b>{room.offeringsCount}</b> مجموعة</span></div><footer><button onClick={() => void openResources(room)}><Wrench size={14} /> المقاعد والأجهزة</button><button onClick={() => openEdit(room)}><Edit3 size={14} /> تعديل</button><button onClick={() => void changeStatus(room)} disabled={saving}>{room.status === "AVAILABLE" ? "تحويل للصيانة" : room.status === "MAINTENANCE" ? "إتاحة القاعة" : "تفعيل القاعة"}</button></footer></article>)}</section>
        </>}
      </div>
    </main>
    {showForm && <div className="academy-classrooms-overlay"><form className="academy-classrooms-modal" onSubmit={save}><header><div><span><Building2 size={17} /></span><h2>{editing ? "تعديل القاعة" : "إضافة قاعة جديدة"}</h2></div><button type="button" onClick={() => setShowForm(false)}><X size={18} /></button></header><p>ربط القاعة بفرع نشط يجعلها متاحة للاستخدام في جدولة الحصص.</p><label>الفرع<select value={form.branchId} onChange={event => setForm({ ...form, branchId: event.target.value })} disabled={Boolean(editing)}><option value="">اختر الفرع</option>{branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select></label><label>اسم القاعة<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="معمل الروبوتات" /></label><label>السعة القصوى<input type="number" min="1" max="500" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} /></label><footer><button type="button" onClick={() => setShowForm(false)}>إلغاء</button><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ القاعة"}</button></footer></form></div>}
    {resourceRoom && <div className="academy-classrooms-overlay"><section className="academy-classrooms-modal academy-resources-modal"><header><div><span><Wrench size={17} /></span><h2>المقاعد والأجهزة · {resourceRoom.name}</h2></div><button type="button" onClick={() => setResourceRoom(null)}><X size={18} /></button></header><p>أضف مخزون المقاعد أو الأجهزة المتاحة داخل القاعة لمساعدة التشغيل والجدولة.</p><form className="academy-resource-form" onSubmit={addResource}><select value={resourceForm.kind} onChange={event => setResourceForm({ ...resourceForm, kind: event.target.value as "SEATING" | "EQUIPMENT" })}><option value="SEATING">مقاعد</option><option value="EQUIPMENT">أجهزة</option></select><input value={resourceForm.name} onChange={event => setResourceForm({ ...resourceForm, name: event.target.value })} placeholder="مثال: مقاعد طلاب" /><input type="number" min="1" value={resourceForm.quantity} onChange={event => setResourceForm({ ...resourceForm, quantity: event.target.value })} /><button className="primary"><Plus size={14} /> إضافة</button></form><div className="academy-resources-list">{resourceLoading ? <div className="academy-classrooms-loading"><LoaderCircle className="spin" size={19} /> جارٍ التحميل…</div> : resources.length === 0 ? <div className="academy-resources-empty"><Armchair size={22} /> لا توجد مقاعد أو أجهزة مسجلة.</div> : resources.map(resource => <div className="academy-resource-row" key={resource.id}><span className={`academy-resource-kind ${resource.kind === "SEATING" ? "seating" : "equipment"}`}>{resource.kind === "SEATING" ? <Armchair size={15} /> : <Settings2 size={15} />}</span><div><strong>{resource.name}</strong><small>{resource.kind === "SEATING" ? "مقاعد" : "أجهزة"} · {resource.status === "AVAILABLE" ? "متاح" : resource.status === "MAINTENANCE" ? "صيانة" : "موقوف"}</small></div><b>{resource.quantity}</b><button onClick={() => void removeResource(resource)} aria-label={`حذف ${resource.name}`}><Trash2 size={15} /></button></div>)}</div></section></div>}
  </RoleDashboardShell>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="academy-classrooms-metric"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }

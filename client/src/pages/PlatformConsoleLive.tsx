import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Building2, CheckCircle2, Clock3, KeyRound, LifeBuoy, LockKeyhole, Plus, RefreshCw, Search, ShieldCheck, UserRoundX, Users } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import RoleScopeCard from "@/components/RoleScopeCard";
import SessionLogoutButton from "@/components/SessionLogoutButton";
import { apiClient, type PlatformAcademy, type PlatformActivity, type PlatformMember, type PlatformOverview, type PlatformRole } from "@/lib/apiClient";
import "./PlatformConsoleLive.css";

type View = "overview" | "academies" | "support" | "audit" | "roles";
const nav: Array<{ id: View; label: string; icon: typeof Building2 }> = [
  { id: "overview", label: "نظرة عامة", icon: Building2 },
  { id: "academies", label: "الأكاديميات", icon: Building2 },
  { id: "support", label: "دعم المستخدمين", icon: LifeBuoy },
  { id: "audit", label: "سجل التدقيق", icon: Activity },
  { id: "roles", label: "أدوار المنصة", icon: KeyRound },
];
const statusLabel: Record<string, string> = { ACTIVE: "نشط", TRIAL: "تجريبي", SETUP: "إعداد", PAUSED: "موقوف" };
const fmtDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "لا يوجد";
const reasonValid = (reason: string) => reason.trim().length >= 4;

export default function PlatformConsoleLive() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("overview");
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [academies, setAcademies] = useState<PlatformAcademy[]>([]);
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [members, setMembers] = useState<PlatformMember[]>([]);
  const [activity, setActivity] = useState<PlatformActivity[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const selectedTenant = academies.find(item => item.id === selectedTenantId) ?? null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setWarning(null);
    Promise.allSettled([apiClient.platformOverview(), apiClient.platformAcademies(), apiClient.platformRoles()])
      .then(([overviewResult, academyResult, rolesResult]) => {
        if (!active) return;
        const warnings: string[] = [];
        if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
        else warnings.push("مؤشرات المنصة غير متاحة مؤقتًا.");
        if (academyResult.status === "fulfilled") {
          setAcademies(academyResult.value.items);
          setSelectedTenantId(current => current || academyResult.value.items[0]?.id || "");
        } else warnings.push("قائمة الأكاديميات غير متاحة مؤقتًا.");
        if (rolesResult.status === "fulfilled") setRoles(rolesResult.value.items);
        else warnings.push("تعريفات أدوار المنصة غير متاحة مؤقتًا.");
        if (warnings.length === 3) throw new Error("تعذر تحميل بيانات الإدارة الحية.");
        if (warnings.length > 0) {
          const warningMessage = warnings.join(" ");
          setWarning(warningMessage);
          toast.error(warningMessage);
        } else setWarning(null);
        if (refreshKey > 0) toast.success("تم تحديث بيانات المنصة");
      })
      .catch(failure => {
        if (!active) return;
        const message = failure instanceof Error ? failure.message : "تعذر تحميل بيانات الإدارة الحية.";
        setError(message);
        toast.error(message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedTenantId || (view !== "support" && view !== "audit")) return;
    let active = true;
    setSupportLoading(true);
    setSupportError(null);
    const delay = window.setTimeout(() => {
      const calls = view === "support"
        ? Promise.all([apiClient.platformAcademyMembers(selectedTenantId, userSearch), apiClient.platformAcademyActivity(selectedTenantId)])
        : Promise.all([apiClient.platformAcademyActivity(selectedTenantId)]);
      calls.then(result => {
        if (!active) return;
        if (view === "support") {
          const [memberResponse, activityResponse] = result as [{ items: PlatformMember[] }, { items: PlatformActivity[] }];
          setMembers(memberResponse.items);
          setActivity(activityResponse.items);
        } else {
          const [activityResponse] = result as [{ items: PlatformActivity[] }];
          setActivity(activityResponse.items);
        }
      }).catch(failure => {
        if (!active) return;
        const message = failure instanceof Error ? failure.message : "تعذر تحميل سجل الدعم.";
        setSupportError(message);
        toast.error(message);
      }).finally(() => { if (active) setSupportLoading(false); });
    }, view === "support" ? 250 : 0);
    return () => { active = false; window.clearTimeout(delay); };
  }, [selectedTenantId, userSearch, view, refreshKey]);

  const filteredAcademies = useMemo(() => {
    const query = tenantSearch.trim().toLocaleLowerCase("ar-EG");
    return academies.filter(item => !query || `${item.name} ${item.owner ?? ""} ${item.id} ${item.slug}`.toLocaleLowerCase("ar-EG").includes(query));
  }, [academies, tenantSearch]);

  const doTenantStatus = async (tenant: PlatformAcademy) => {
    if (!reasonValid(reason)) { toast.error("اكتب سببًا واضحًا من 4 أحرف على الأقل قبل تغيير الحالة."); return; }
    const next = tenant.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    if (!window.confirm(next === "PAUSED" ? `إيقاف ${tenant.name}؟ سيتم رفض طلبات tenant فورًا وإلغاء جلسات refresh.` : `إعادة تفعيل ${tenant.name}؟ سيحتاج المستخدمون لتسجيل الدخول مجددًا.`)) return;
    setBusyKey(`tenant:${tenant.id}`);
    try {
      const result = await apiClient.changePlatformAcademyStatus(tenant.id, next, reason);
      toast.success(next === "PAUSED" ? `تم إيقاف الأكاديمية وإلغاء ${result.revokedSessions} جلسة.` : "تمت إعادة تفعيل الأكاديمية.");
      setReason("");
      setRefreshKey(value => value + 1);
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "تعذر تغيير الحالة."); }
    finally { setBusyKey(""); }
  };

  const doMemberStatus = async (member: PlatformMember, status: "ACTIVE" | "REVOKED") => {
    if (!selectedTenant) return;
    if (!reasonValid(reason)) { toast.error("اكتب سببًا واضحًا من 4 أحرف على الأقل قبل تغيير الوصول."); return; }
    if (status === "REVOKED" && !window.confirm(`تعطيل عضوية ${member.name ?? member.maskedPhone} في ${selectedTenant.name}؟ سيُلغى تسجيله في الأكاديمية وتُنهى جلسات refresh الخاصة به.`)) return;
    setBusyKey(`member:${member.membershipId}`);
    try {
      const result = await apiClient.changePlatformMemberStatus(selectedTenant.id, member.membershipId, status, reason);
      toast.success(status === "REVOKED" ? `تم تعطيل العضوية وإلغاء ${result.revokedSessions} جلسة.` : "تمت إعادة العضوية.");
      setReason("");
      setRefreshKey(value => value + 1);
      setUserSearch(current => current);
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "تعذر تغيير العضوية."); }
    finally { setBusyKey(""); }
  };

  const doRevokeSessions = async (member: PlatformMember) => {
    if (!selectedTenant) return;
    if (!reasonValid(reason)) { toast.error("اكتب سببًا واضحًا من 4 أحرف على الأقل قبل إلغاء الجلسات."); return; }
    if (!window.confirm(`إلغاء جلسات ${member.name ?? member.maskedPhone}؟`)) return;
    setBusyKey(`sessions:${member.userId}`);
    try {
      const result = await apiClient.revokePlatformUserSessions(selectedTenant.id, member.userId, reason);
      toast.success(`تم إلغاء ${result.revokedCount} جلسة refresh.`);
      setReason("");
      setRefreshKey(value => value + 1);
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "تعذر إلغاء الجلسات."); }
    finally { setBusyKey(""); }
  };

  const title = nav.find(item => item.id === view)?.label ?? "إدارة المنصة";
  return <RoleDashboardShell className="app-shell pc-live-shell" roleCode="R00" roleLabel="مسؤول المنصة" scopeLevel="platform" scopeLabel="نطاق المنصة" tenantName="منصة مدى" demo={false}>
    <aside className="pc-live-sidebar" aria-label="تنقل إدارة المنصة">
      <div className="pc-live-brand"><span><ShieldCheck size={20} /></span><div><strong>مدى</strong><small>إدارة المنصة · R00</small></div></div>
      <nav>{nav.map(item => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} type="button"><Icon size={17} /><span>{item.label}</span></button>; })}</nav>
      <div className="pc-live-side-note"><LockKeyhole size={16} /><span>البيانات الإدارية فقط؛ لا توجد تفاصيل مالية أو سجلات طلاب في نطاق الدعم.</span></div>
      <SessionLogoutButton className="nav-link pc-live-logout" iconSize={17} />
      <small className="pc-live-status"><i /> اتصال API مباشر</small>
    </aside>
    <main className="pc-live-main" dir="rtl">
      <header className="pc-live-topbar"><span><Building2 size={15} /> نطاق المنصة</span><span className="pc-live-pill"><i /> LIVE · لا توجد بيانات تجريبية</span></header>
      <div className="pc-live-content">
        <PageHeader eyebrow={<span className="pc-live-eyebrow"><ShieldCheck size={14} /> مسؤول المنصة · R00 · LIVE</span>} title={title} description="دعم متعدد الأكاديميات بنطاق صريح، مع تسجيل أسباب الإجراءات وإظهار سجلها." actions={<button className="pc-live-primary" type="button" onClick={() => navigate("/platform/academies/new")}><Plus size={16} /> إنشاء أكاديمية</button>} />
        <RoleScopeCard className="pc-live-scope" compact />
        {loading && <div className="pc-live-state" role="status"><RefreshCw className="pc-live-spin" size={18} /> جارٍ تحميل بيانات المنصة…</div>}
        {!loading && error && <div className="pc-live-state pc-live-error" role="alert"><AlertCircle size={19} /><span>{error}</span><button type="button" onClick={() => setRefreshKey(value => value + 1)}>إعادة المحاولة</button></div>}
        {!loading && !error && warning && <div className="pc-live-state pc-live-error" role="status"><AlertCircle size={19} /><span>{warning} البيانات المتاحة ما زالت معروضة من الخادم.</span><button type="button" onClick={() => setRefreshKey(value => value + 1)}>إعادة المحاولة</button></div>}
        {!loading && !error && view === "overview" && <>
          <label className="pc-live-reason"><span>سبب إجراء الإيقاف أو التفعيل (إلزامي)</span><input value={reason} onChange={event => setReason(event.target.value)} placeholder="اكتب سببًا مختصرًا قبل أي تغيير حالة" /></label>
          <section className="pc-live-metrics" aria-label="مؤشرات المنصة الحية">
            <Metric icon={<Building2 />} label="الأكاديميات" value={overview?.academies ?? 0} note="Tenant مسجل" />
            <Metric icon={<CheckCircle2 />} label="نشطة" value={overview?.activeAcademies ?? 0} note="حالة الأكاديمية" />
            <Metric icon={<Users />} label="حسابات الفريق" value={overview?.staffAccounts ?? 0} note="عدد حسابات staff" />
            <Metric icon={<Activity />} label="جلسات قابلة للتجديد" value={overview?.activeSessions ?? 0} note="Refresh session نشطة" />
          </section>
          <section className="pc-live-card"><header><div><h2>الأكاديميات التي تحتاج متابعة</h2><p>حالات الإعداد والإيقاف، من سجل Tenant الفعلي.</p></div><button type="button" className="pc-live-link" onClick={() => setView("academies")}>عرض الكل</button></header><AcademyTable rows={academies.filter(item => item.status === "PAUSED" || item.status === "SETUP").slice(0, 6)} onSupport={id => { setSelectedTenantId(id); setView("support"); }} onStatus={id => { const row = academies.find(item => item.id === id); if (row) void doTenantStatus(row); }} busyKey={busyKey} />{academies.every(item => item.status !== "PAUSED" && item.status !== "SETUP") && <p className="pc-live-empty">لا توجد أكاديميات موقوفة أو قيد الإعداد.</p>}</section>
        </>}
        {!loading && !error && view === "academies" && <section className="pc-live-card"><header><div><h2>سجل الأكاديميات</h2><p>{academies.length} سجل من API؛ استخدم البحث بالاسم أو المالك أو المعرف.</p></div></header><label className="pc-live-search"><Search size={16} /><input value={tenantSearch} onChange={event => setTenantSearch(event.target.value)} placeholder="ابحث عن Tenant / اسم / مسؤول" /></label><label className="pc-live-reason"><span>سبب تغيير الحالة (إلزامي)</span><input value={reason} onChange={event => setReason(event.target.value)} placeholder="مثال: مراجعة امتثال رقم …" /></label><AcademyTable rows={filteredAcademies} onSupport={id => { setSelectedTenantId(id); setView("support"); }} onStatus={id => { const row = academies.find(item => item.id === id); if (row) void doTenantStatus(row); }} busyKey={busyKey} /></section>}
        {!loading && !error && view === "support" && <section className="pc-live-card"><header><div><h2>بحث ودعم المستخدمين</h2><p>اختر Tenant أولًا؛ الاستعلام والإجراءات مقيدة بعضوية هذا الـTenant فقط.</p></div><span className="pc-live-boundary"><LockKeyhole size={14} /> لا يوجد bypass دائم</span></header><div className="pc-live-support-controls"><label><span>الأكاديمية المحددة</span><select value={selectedTenantId} onChange={event => setSelectedTenantId(event.target.value)}><option value="">اختر أكاديمية</option>{academies.map(item => <option key={item.id} value={item.id}>{item.name} · {item.id.slice(0, 8)}</option>)}</select></label><label><span>ابحث عن اسم أو بريد أو هاتف</span><input value={userSearch} onChange={event => setUserSearch(event.target.value)} placeholder="بحث داخل الأكاديمية المحددة" /></label></div>{selectedTenant && <div className="pc-live-tenant-summary"><strong>{selectedTenant.name}</strong><span>{statusLabel[selectedTenant.status] ?? selectedTenant.status} · {selectedTenant.id}</span><button type="button" className="pc-live-link" onClick={() => void doTenantStatus(selectedTenant)} disabled={busyKey === `tenant:${selectedTenant.id}`}>{selectedTenant.status === "PAUSED" ? "إعادة التفعيل" : "إيقاف الأكاديمية"}</button></div>}<label className="pc-live-reason"><span>سبب الإجراء (إلزامي، ويُسجل في audit)</span><input value={reason} onChange={event => setReason(event.target.value)} placeholder="سبب تشغيلي/أمني مختصر" /></label>{supportLoading && <div className="pc-live-state"><RefreshCw className="pc-live-spin" size={16} /> جارٍ البحث…</div>}{supportError && <div className="pc-live-error" role="alert">{supportError}</div>}{!supportLoading && selectedTenant && <MemberTable rows={members} busyKey={busyKey} onDisable={member => void doMemberStatus(member, "REVOKED")} onRestore={member => void doMemberStatus(member, "ACTIVE")} onRevoke={member => void doRevokeSessions(member)} />}{!supportLoading && !selectedTenant && <p className="pc-live-empty">اختر أكاديمية لعرض مستخدميها.</p>}<p className="pc-live-footnote">التعطيل هنا يلغي عضوية المستخدم داخل هذه الأكاديمية فقط وينهي refresh sessions. العضوية في Tenant آخر لا تُعرض ولا تتغير؛ الجلسة التي أُصدرت بالفعل تُرفض فورًا عند التحقق من العضوية.</p></section>}
        {!loading && !error && view === "audit" && <section className="pc-live-card"><header><div><h2>سجل دعم الأكاديمية</h2><p>الأحداث scoped للأكاديمية المحددة؛ لا تُعرض metadata أو عناوين IP.</p></div></header><label className="pc-live-support-controls"><span>الأكاديمية المحددة</span><select value={selectedTenantId} onChange={event => setSelectedTenantId(event.target.value)}><option value="">اختر أكاديمية</option>{academies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{supportLoading && <div className="pc-live-state"><RefreshCw className="pc-live-spin" size={16} /> جارٍ تحميل السجل…</div>}{supportError && <div className="pc-live-error" role="alert">{supportError}</div>}{!supportLoading && <ActivityTable rows={activity} />}</section>}
        {!loading && !error && view === "roles" && <section className="pc-live-card"><header><div><h2>أدوار المنصة وحدود الوصول</h2><p>سياسة الصلاحيات الفعلية من API؛ لا تسمح الشاشة بإنشاء مسؤول منصة أو منح نفسها صلاحيات إضافية.</p></div><span className="pc-live-boundary"><LockKeyhole size={14} /> تعيين R00 مضبوط خارجيًا</span></header>{roles.map(role => <article className="pc-live-role" key={role.code}><div><strong>{role.label} · {role.code}</strong><span>النطاق: {role.scope} · التعيين: {role.assignmentMode} · self-assign: {role.canSelfAssign ? "مسموح" : "ممنوع"}</span></div><ul>{role.permissions.map(permission => <li key={permission}>{permission}</li>)}</ul></article>)}<div className="pc-live-security"><ShieldCheck size={17} /><span>R00 لا يرى تفاصيل الماليات أو سجلات الطلاب. تعديل أدوار الأكاديمية مسؤولية R01، وتعيين R00 يتم خارج لوحة الدعم لتجنب تصعيد الصلاحيات.</span></div></section>}
      </div>
    </main>
  </RoleDashboardShell>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number; note: string }) {
  return <article className="pc-live-metric"><span>{icon}</span><div><small>{label}</small><strong>{new Intl.NumberFormat("ar-EG").format(value)}</strong><em>{note}</em></div></article>;
}

function AcademyTable({ rows, onSupport, onStatus, busyKey }: { rows: PlatformAcademy[]; onSupport: (id: string) => void; onStatus: (id: string) => void; busyKey: string }) {
  return <div className="pc-live-table-wrap"><table className="pc-live-table"><thead><tr><th>الأكاديمية</th><th>الحالة</th><th>الفروع</th><th>الأعضاء</th><th>الخطة</th><th>إجراء دعم</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><th scope="row"><strong>{row.name}</strong><small>{row.owner ?? "لا يوجد مسؤول"} · {row.id}</small></th><td><span className={`pc-live-status-tag ${row.status === "PAUSED" ? "paused" : ""}`}>{statusLabel[row.status] ?? row.status}</span></td><td>{row.branches}</td><td>{row.users}</td><td>{row.plan}</td><td><div className="pc-live-row-actions"><button type="button" onClick={() => onSupport(row.id)}>دعم</button><button type="button" onClick={() => onStatus(row.id)} disabled={busyKey === `tenant:${row.id}`}>{row.status === "PAUSED" ? "تفعيل" : "إيقاف"}</button></div></td></tr>)}{rows.length === 0 && <tr><td colSpan={6} className="pc-live-empty-cell">لا توجد أكاديميات مطابقة للبحث.</td></tr>}</tbody></table></div>;
}

function MemberTable({ rows, busyKey, onDisable, onRestore, onRevoke }: { rows: PlatformMember[]; busyKey: string; onDisable: (member: PlatformMember) => void; onRestore: (member: PlatformMember) => void; onRevoke: (member: PlatformMember) => void }) {
  return <div className="pc-live-table-wrap"><table className="pc-live-table pc-live-member-table"><thead><tr><th>المستخدم</th><th>الدور / العضوية</th><th>آخر دخول</th><th>آخر جلسة / نشطة</th><th>إجراءات أمنية</th></tr></thead><tbody>{rows.map(member => <tr key={member.membershipId}><th scope="row"><strong>{member.name ?? "بدون اسم"}</strong><small>{member.maskedEmail ?? "لا يوجد بريد"} · {member.maskedPhone}</small></th><td>{member.roleCode}<small>{member.membershipStatus} · الحساب {member.userStatus}</small></td><td>{fmtDate(member.lastLoginAt)}</td><td>{fmtDate(member.lastSessionAt)}<small>{member.activeSessions} جلسة refresh نشطة</small></td><td><div className="pc-live-row-actions">{member.membershipStatus === "REVOKED" ? <button type="button" onClick={() => onRestore(member)} disabled={busyKey === `member:${member.membershipId}`}>إعادة العضوية</button> : <button type="button" className="danger" onClick={() => onDisable(member)} disabled={busyKey === `member:${member.membershipId}` || member.roleCode === "R00_PLATFORM_ADMIN"}><UserRoundX size={14} /> تعطيل</button>}<button type="button" onClick={() => onRevoke(member)} disabled={busyKey === `sessions:${member.userId}`}><RefreshCw size={13} /> تدوير الجلسات</button></div></td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="pc-live-empty-cell">لا يوجد مستخدمون مطابقون في الأكاديمية المحددة.</td></tr>}</tbody></table></div>;
}

function ActivityTable({ rows }: { rows: PlatformActivity[] }) {
  return <div className="pc-live-activity-list">{rows.map(item => <article key={item.id}><span className="pc-live-activity-icon"><Activity size={15} /></span><div><strong>{item.action}</strong><small>{item.tenantName ?? "الأكاديمية"} · {item.targetType} · {item.targetId}{item.reason ? ` · السبب: ${item.reason}` : ""}</small><small>بواسطة {item.actorName ?? "system"}</small></div><time><Clock3 size={13} />{fmtDate(item.createdAt)}</time></article>)}{rows.length === 0 && <p className="pc-live-empty">لا توجد أحداث تدقيق مسجلة لهذا الـTenant.</p>}</div>;
}

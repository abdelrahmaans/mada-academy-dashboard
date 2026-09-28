import { useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  CirclePlus,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RoleDashboardShell, {
  RoleScopeCard,
  type RoleNavigationItem,
} from "@/components/RoleDashboardShell";

type AcademyStatus = "active" | "setup" | "paused";
type Academy = {
  id: string;
  name: string;
  owner: string;
  branches: number;
  users: number;
  status: AcademyStatus;
};

type StatusFilter = "all" | AcademyStatus;

const initialAcademies: Academy[] = [
  {
    id: "mada-01",
    name: "أكاديمية الروّاد",
    owner: "مها صالح",
    branches: 4,
    users: 126,
    status: "active",
  },
  {
    id: "mada-02",
    name: "مسار الابتكار",
    owner: "يوسف حسان",
    branches: 2,
    users: 54,
    status: "active",
  },
  {
    id: "mada-03",
    name: "براعم التقنية",
    owner: "ندى فؤاد",
    branches: 1,
    users: 28,
    status: "setup",
  },
  {
    id: "mada-04",
    name: "آفاق للعلوم",
    owner: "كريم حسن",
    branches: 3,
    users: 91,
    status: "paused",
  },
];

const statusLabels: Record<AcademyStatus, string> = {
  active: "نشطة",
  setup: "تحتاج استكمالًا",
  paused: "متوقفة مؤقتًا",
};

const statusStyles: Record<AcademyStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  setup: "bg-amber-50 text-amber-800 ring-amber-200",
  paused: "bg-slate-100 text-slate-600 ring-slate-200",
};

const navigationItems: RoleNavigationItem[] = [
  { label: "نظرة عامة", href: "/platform-console", icon: Building2 },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("ar-EG").format(value);

export default function PlatformConsole() {
  const [academies, setAcademies] = useState(initialAcademies);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [academyName, setAcademyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);

  const filteredAcademies = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");
    return academies.filter(academy => {
      const matchesQuery =
        !normalized ||
        `${academy.name} ${academy.owner}`
          .toLocaleLowerCase("ar")
          .includes(normalized);
      const matchesStatus =
        statusFilter === "all" || academy.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [academies, query, statusFilter]);

  const branchCount = academies.reduce(
    (total, academy) => total + academy.branches,
    0
  );
  const activeCount = academies.filter(
    academy => academy.status === "active"
  ).length;
  const pendingCount = academies.filter(
    academy => academy.status === "setup"
  ).length;

  const handleCreateAcademy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = academyName.trim();
    const owner = ownerName.trim();
    if (!name || !owner) return;

    setAcademies(current => [
      {
        id: `demo-${Date.now()}`,
        name,
        owner,
        branches: 1,
        users: 0,
        status: "setup",
      },
      ...current,
    ]);
    setAcademyName("");
    setOwnerName("");
    setCreateOpen(false);
    toast.success("أُضيفت الأكاديمية إلى المعاينة فقط", {
      description: "التغيير محلي في الواجهة ولن يُحفظ بعد إعادة تحميل الصفحة.",
    });
  };

  return (
    <RoleDashboardShell
      roleCode="R00"
      roleName="مدير المنصة"
      userName="مسؤول المنصة"
      scopeLabel="كل الأكاديميات"
      navItems={navigationItems}
    >
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold text-teal-800">
              <span className="h-2 w-2 rounded-full bg-teal-600" />
              منصة مدى · مستوى المنصة L0
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              إدارة الأكاديميات
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              نظرة موحّدة على الأكاديميات والفروع وحالات التهيئة، ضمن مساحة
              مستقلة عن التشغيل اليومي لكل فرع.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-700/15"
              >
                <CirclePlus size={18} aria-hidden="true" />
                إنشاء أكاديمية
              </button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="text-right sm:max-w-md">
              <DialogHeader className="text-right">
                <DialogTitle>إضافة أكاديمية للمعاينة</DialogTitle>
                <DialogDescription>
                  نموذج تفاعلي للواجهة فقط. لن تُرسل البيانات أو تُحفظ في نظام
                  خلفي.
                </DialogDescription>
              </DialogHeader>
              <form
                id="academy-create-form"
                onSubmit={handleCreateAcademy}
                className="space-y-4"
              >
                <label
                  className="block space-y-1.5 text-sm font-semibold text-slate-700"
                  htmlFor="academy-name"
                >
                  اسم الأكاديمية
                  <input
                    id="academy-name"
                    autoFocus
                    required
                    value={academyName}
                    onChange={event => setAcademyName(event.target.value)}
                    placeholder="مثال: أكاديمية مدى للعلوم"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                </label>
                <label
                  className="block space-y-1.5 text-sm font-semibold text-slate-700"
                  htmlFor="academy-owner"
                >
                  اسم المالك في بيانات العرض
                  <input
                    id="academy-owner"
                    required
                    value={ownerName}
                    onChange={event => setOwnerName(event.target.value)}
                    placeholder="الاسم الظاهر في المعاينة"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                </label>
              </form>
              <DialogFooter className="sm:flex-row-reverse">
                <button
                  type="submit"
                  form="academy-create-form"
                  disabled={!academyName.trim() || !ownerName.trim()}
                  className="min-h-10 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  إضافة للمعاينة
                </button>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <RoleScopeCard
          scope="كل الأكاديميات على المنصة"
          description="هذا الدور يرى نطاق المنصة بالكامل. بيانات الصفحة تجريبية، واختيار الدور أداة معاينة وليس تسجيل دخول أو إنفاذًا للصلاحيات."
        />

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <ShieldCheck
            size={16}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p>
            <strong>DEMO:</strong> الأرقام والسجلات للتصميم فقط. أي إضافة أو
            فلترة تعمل داخل الواجهة الحالية ولا تُرسل إلى API أو قاعدة بيانات.
          </p>
        </div>

        <section
          aria-label="مؤشرات المنصة"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          <MetricCard
            label="الأكاديميات"
            value={formatNumber(academies.length)}
            caption={`${formatNumber(activeCount)} نشطة في عينة العرض`}
            icon={Building2}
            tone="teal"
          />
          <MetricCard
            label="الفروع"
            value={formatNumber(branchCount)}
            caption="إجمالي الفروع في بيانات المعاينة"
            icon={MapPin}
            tone="blue"
          />
          <MetricCard
            label="تحتاج استكمالًا"
            value={formatNumber(pendingCount)}
            caption="حالات عرض بانتظار تصميم مسار المراجعة"
            icon={CheckCircle2}
            tone="amber"
          />
        </section>

        <section
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]"
          aria-labelledby="academies-heading"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                id="academies-heading"
                className="text-base font-extrabold text-slate-900"
              >
                الأكاديميات
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {formatNumber(filteredAcademies.length)} من{" "}
                {formatNumber(academies.length)} في بيانات العرض
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 focus-within:border-teal-400 focus-within:bg-white sm:w-64">
                <Search size={16} aria-hidden="true" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="ابحث باسم الأكاديمية أو المالك"
                  aria-label="ابحث باسم الأكاديمية أو المالك"
                  className="w-full min-w-0 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>
              <select
                aria-label="تصفية حسب حالة الأكاديمية"
                value={statusFilter}
                onChange={event =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشطة</option>
                <option value="setup">تحتاج استكمالًا</option>
                <option value="paused">متوقفة مؤقتًا</option>
              </select>
            </div>
          </div>

          {filteredAcademies.length === 0 ? (
            <div className="grid min-h-56 place-items-center px-6 py-12 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                  <Search size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-slate-800">
                  لا توجد نتائج مطابقة
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  جرّب كلمة بحث أو حالة مختلفة.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-right">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3.5">
                        الأكاديمية
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        المالك
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        الفروع
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        المستخدمون
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        الحالة
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        <span className="sr-only">تفاصيل</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAcademies.map(academy => (
                      <tr
                        key={academy.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                              <Building2 size={18} aria-hidden="true" />
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {academy.name}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                معرّف عرض · {academy.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                          {academy.owner}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                          {formatNumber(academy.branches)}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                          {formatNumber(academy.users)}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={academy.status} />
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedAcademy(academy)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-50"
                          >
                            التفاصيل{" "}
                            <ChevronLeft size={14} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 md:hidden">
                {filteredAcademies.map(academy => (
                  <article
                    key={academy.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                          <Building2 size={18} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-slate-800">
                            {academy.name}
                          </h3>
                          <p className="mt-1 truncate text-[10px] text-slate-400">
                            {academy.owner}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={academy.status} />
                    </div>
                    <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" />
                        {formatNumber(academy.branches)} فروع
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} className="text-slate-400" />
                        {formatNumber(academy.users)} مستخدم
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedAcademy(academy)}
                        className="mr-auto inline-flex items-center gap-1 font-bold text-teal-800"
                      >
                        تفاصيل <ChevronLeft size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <div className="flex items-start gap-2 text-[11px] leading-5 text-slate-500">
          <Users size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            الخطوة التالية في هذا السطح: تصميم إدارة الفروع والمستخدمين وسجل
            المراجعة. لا توجد عمليات إنشاء أو تعديل محفوظة في هذه المرحلة.
          </p>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedAcademy)}
        onOpenChange={open => !open && setSelectedAcademy(null)}
      >
        <DialogContent dir="rtl" className="text-right sm:max-w-md">
          <DialogHeader className="text-right">
            <DialogTitle>{selectedAcademy?.name}</DialogTitle>
            <DialogDescription>
              تفاصيل من بيانات المعاينة المحلية، وليست سجلًا حقيقيًا.
            </DialogDescription>
          </DialogHeader>
          {selectedAcademy && (
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <dt className="text-slate-500">المالك</dt>
              <dd className="font-semibold text-slate-800">
                {selectedAcademy.owner}
              </dd>
              <dt className="text-slate-500">عدد الفروع</dt>
              <dd className="font-semibold text-slate-800">
                {formatNumber(selectedAcademy.branches)}
              </dd>
              <dt className="text-slate-500">المستخدمون</dt>
              <dd className="font-semibold text-slate-800">
                {formatNumber(selectedAcademy.users)}
              </dd>
              <dt className="text-slate-500">الحالة</dt>
              <dd>
                <StatusBadge status={selectedAcademy.status} />
              </dd>
            </dl>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="min-h-10 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-700"
              >
                إغلاق
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleDashboardShell>
  );
}

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Building2;
  tone: "teal" | "blue" | "amber";
}) {
  const toneStyles = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-800",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${toneStyles[tone]}`}
        >
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{caption}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: AcademyStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

import { useState, useMemo, type FormEvent } from "react";
import {
  Users,
  Clock3,
  CheckCircle2,
  Phone,
  MessageCircle,
  Plus,
  Search,
  Filter,
  Send,
  UserCheck,
  X,
  BookOpen,
  MapPin,
  CalendarDays,
  Trash2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import type { WaitlistEntry } from "@/lib/apiClient";
import type { Offering } from "@/pages/Classes";

type Props = {
  offerings: Offering[];
  waitlistEntries: WaitlistEntry[];
  onNotifyWaitlist: (id: string) => void;
  onEnrollWaitlist: (id: string, withInvoice?: boolean) => void;
  onAddWaitlistEntry: (input: Omit<WaitlistEntry, "id" | "status" | "priorityRank" | "addedAt">) => void;
  onCancelWaitlistEntry?: (id: string) => void;
  onDeleteWaitlistEntry?: (id: string) => void;
  initialSelectedGroupId?: string;
};

export default function WaitlistManagementView({
  offerings,
  waitlistEntries,
  onNotifyWaitlist,
  onEnrollWaitlist,
  onAddWaitlistEntry,
  onCancelWaitlistEntry,
  onDeleteWaitlistEntry,
  initialSelectedGroupId,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WAITING" | "NOTIFIED" | "ENROLLED">("ALL");
  const [groupFilter, setGroupFilter] = useState<string>(initialSelectedGroupId || "ALL");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New waitlist entry form state
  const [formData, setFormData] = useState({
    groupId: offerings[0]?.id || "",
    studentName: "",
    parentName: "",
    phone: "",
    notes: "",
  });

  const waitingCount = useMemo(
    () => waitlistEntries.filter(e => e.status === "WAITING").length,
    [waitlistEntries]
  );
  const notifiedCount = useMemo(
    () => waitlistEntries.filter(e => e.status === "NOTIFIED").length,
    [waitlistEntries]
  );
  const enrolledCount = useMemo(
    () => waitlistEntries.filter(e => e.status === "ENROLLED").length,
    [waitlistEntries]
  );
  const fullGroupsCount = useMemo(
    () => offerings.filter(o => o.enrolledStudents >= o.maxStudents).length,
    [offerings]
  );

  const filteredEntries = useMemo(() => {
    return waitlistEntries.filter(entry => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        entry.studentName.toLowerCase().includes(q) ||
        entry.parentName.toLowerCase().includes(q) ||
        entry.phone.toLowerCase().includes(q) ||
        entry.courseName.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || entry.status === statusFilter;
      const matchesGroup =
        groupFilter === "ALL" || entry.groupId === groupFilter;

      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [waitlistEntries, search, statusFilter, groupFilter]);

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.groupId) {
      toast.error("يرجى كتابة اسم الطالب واختيار المجموعة");
      return;
    }

    const targetOffering = offerings.find(o => o.id === formData.groupId);
    onAddWaitlistEntry({
      studentId: `STU-TEMP-${Date.now().toString().slice(-4)}`,
      studentName: formData.studentName.trim(),
      parentName: formData.parentName.trim() || "ولي الأمر",
      phone: formData.phone.trim() || "+201000000000",
      groupId: formData.groupId,
      courseName: targetOffering?.courseName || "كورس عام",
      branchName: targetOffering?.branch || "الفرع الرئيسي",
      notes: formData.notes.trim() || "حجز بقائمة الانتظار عبر إدارة الحصص",
    });

    toast.success(`تم إدراج الطالب ${formData.studentName} في قائمة الانتظار بنجاح!`);
    setFormData({
      groupId: offerings[0]?.id || "",
      studentName: "",
      parentName: "",
      phone: "",
      notes: "",
    });
    setAddModalOpen(false);
  };

  const openWhatsAppNotice = (entry: WaitlistEntry) => {
    onNotifyWaitlist(entry.id);
    const cleanPhone = entry.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `السلام عليكم ورحمة الله، مرحباً أ/ ${entry.parentName}.\n\nيسرنا في أكاديمية مدى إبلاغكم بتوفر مقعد شاغر للطالب (${entry.studentName}) في مجموعة (${entry.courseName}) بفرع ${entry.branchName}.\n\nنرجو من سيادتكم تأكيد الحجز خلال 24 ساعة لتثبيت المقعد وإتمام التسجيل.\n\nشكراً لكم ونتمنى لطلابنا دوام التفوق!`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    }
  };

  return (
    <div className="waitlist-view-container">
      {/* 4 Summary Stat Cards */}
      <div className="waitlist-kpis-grid">
        <div className="waitlist-kpi-card kpi-amber">
          <div className="kpi-icon-wrap">
            <Clock3 size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">قيد الانتظار حالياً</span>
            <strong className="kpi-val">{waitingCount}</strong>
            <small>بانتظار توفر شواغر في المجموعات</small>
          </div>
        </div>

        <div className="waitlist-kpi-card kpi-blue">
          <div className="kpi-icon-wrap">
            <Send size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">تم إشعارهم بشاغر</span>
            <strong className="kpi-val">{notifiedCount}</strong>
            <small>بانتظار تأكيد أولياء الأمور</small>
          </div>
        </div>

        <div className="waitlist-kpi-card kpi-green">
          <div className="kpi-icon-wrap">
            <UserCheck size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">تم تسكينهم رسمياً</span>
            <strong className="kpi-val">{enrolledCount}</strong>
            <small>تم تحويلهم لاشتراكات نشطة</small>
          </div>
        </div>

        <div className="waitlist-kpi-card kpi-purple">
          <div className="kpi-icon-wrap">
            <Users size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">مجموعات مكتملة السعة</span>
            <strong className="kpi-val">{fullGroupsCount}</strong>
            <small>مجموعات وصلت للحد الأقصى (100%)</small>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="waitlist-toolbar">
        <div className="toolbar-search-group">
          <div className="search-input-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="ابحث باسم الطالب، ولي الأمر، الهاتف أو الكورس..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-filters">
            <div className="filter-select-box">
              <Filter size={14} />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as "ALL" | "WAITING" | "NOTIFIED" | "ENROLLED")}
              >
                <option value="ALL">جميع الحالات</option>
                <option value="WAITING">قيد الانتظار ({waitingCount})</option>
                <option value="NOTIFIED">تم الإشعار ({notifiedCount})</option>
                <option value="ENROLLED">تم التسكين ({enrolledCount})</option>
              </select>
            </div>

            <div className="filter-select-box">
              <BookOpen size={14} />
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
              >
                <option value="ALL">كل المجموعات</option>
                {offerings.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.courseName} ({o.id}) · {o.branch}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          className="button button-primary add-waitlist-btn"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus size={16} />
          <span>إدراج طالب في قائمة الانتظار</span>
        </button>
      </div>

      {/* Waitlist List / Table */}
      <div className="waitlist-table-wrapper">
        <table className="waitlist-table">
          <thead>
            <tr>
              <th style={{ width: "90px" }}>الأولوية</th>
              <th>الطالب وولي الأمر</th>
              <th>المجموعة والكورس</th>
              <th>الفرع والمعمل</th>
              <th>تاريخ الإضافة</th>
              <th>الحالة</th>
              <th style={{ textAlign: "center" }}>الإجراءات التشغيلية</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(entry => {
              const matchedOffering = offerings.find(o => o.id === entry.groupId);
              const isFull = matchedOffering
                ? matchedOffering.enrolledStudents >= matchedOffering.maxStudents
                : false;

              return (
                <tr key={entry.id} className={`waitlist-row status-${entry.status.toLowerCase()}`}>
                  <td data-label="الأولوية">
                    <span className={`priority-rank-badge rank-${entry.priorityRank}`}>
                      #{entry.priorityRank}
                    </span>
                  </td>

                  <td data-label="الطالب وولي الأمر">
                    <div className="student-profile-cell">
                      <strong>{entry.studentName}</strong>
                      <span className="parent-subtext">
                        ولي الأمر: {entry.parentName}
                      </span>
                      <a
                        href={`tel:${entry.phone}`}
                        className="phone-link"
                        dir="ltr"
                      >
                        <Phone size={12} /> {entry.phone}
                      </a>
                    </div>
                  </td>

                  <td data-label="المجموعة والكورس">
                    <div className="group-info-cell">
                      <span className="course-name">{entry.courseName}</span>
                      <small className="group-id-tag">
                        كود المجموعة: {entry.groupId}
                      </small>
                      {matchedOffering && (
                        <div className="mini-capacity-bar">
                          <span>
                            السعة: {matchedOffering.enrolledStudents}/{matchedOffering.maxStudents}
                          </span>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${isFull ? "bar-full" : ""}`}
                              style={{
                                width: `${Math.min(100, (matchedOffering.enrolledStudents / matchedOffering.maxStudents) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  <td data-label="الفرع والمعمل">
                    <div className="branch-info-cell">
                      <span>
                        <MapPin size={13} /> {entry.branchName}
                      </span>
                      {matchedOffering?.classroom && (
                        <small>{matchedOffering.classroom}</small>
                      )}
                      {matchedOffering?.schedule && (
                        <small className="schedule-sub">
                          <CalendarDays size={12} /> {matchedOffering.schedule}
                        </small>
                      )}
                    </div>
                  </td>

                  <td data-label="تاريخ الإضافة">
                    <div className="date-info-cell">
                      <span>{entry.addedAt.slice(0, 10)}</span>
                      {entry.notes && (
                        <small className="notes-preview" title={entry.notes}>
                          {entry.notes}
                        </small>
                      )}
                    </div>
                  </td>

                  <td data-label="الحالة">
                    <div className="status-badge-cell">
                      {entry.status === "WAITING" && (
                        <span className="badge badge-amber">
                          <Clock3 size={13} /> قيد الانتظار
                        </span>
                      )}
                      {entry.status === "NOTIFIED" && (
                        <span className="badge badge-blue">
                          <Send size={13} /> تم الإشعار بشاغر
                        </span>
                      )}
                      {entry.status === "ENROLLED" && (
                        <span className="badge badge-emerald">
                          <CheckCircle2 size={13} /> تم التسكين وتفعيل الاشتراك
                        </span>
                      )}
                      {entry.status === "CANCELLED" && (
                        <span className="badge badge-gray">
                          <Ban size={13} /> ملغي
                        </span>
                      )}
                    </div>
                  </td>

                  <td data-label="الإجراءات التشغيلية" className="actions-cell">
                    <div className="action-buttons-group">
                      {entry.status === "WAITING" && (
                        <>
                          <button
                            className="btn-action btn-notify-wa"
                            onClick={() => openWhatsAppNotice(entry)}
                            title="إرسال إشعار توفر مقعد شاغر عبر واتساب"
                          >
                            <MessageCircle size={15} />
                            <span>إشعار شاغر</span>
                          </button>
                          <button
                            className="btn-action btn-enroll-now"
                            onClick={() => onEnrollWaitlist(entry.id, true)}
                            title="تسكين رسمي وتفعيل الاشتراك مع إصدار فاتورة فوراً"
                          >
                            <UserCheck size={15} />
                            <span>تسكين وفاتورة</span>
                          </button>
                        </>
                      )}

                      {entry.status === "NOTIFIED" && (
                        <>
                          <button
                            className="btn-action btn-enroll-now"
                            onClick={() => onEnrollWaitlist(entry.id, true)}
                            title="تأكيد الحجز وتسكين الطالب مع إصدار فاتورة فوراً"
                          >
                            <UserCheck size={15} />
                            <span>تأكيد وفاتورة</span>
                          </button>
                          <button
                            className="btn-action btn-re-notify"
                            onClick={() => openWhatsAppNotice(entry)}
                            title="إعادة إرسال رسالة التذكير عبر واتساب"
                          >
                            <MessageCircle size={15} />
                            <span>تذكير</span>
                          </button>
                        </>
                      )}

                      {entry.status === "ENROLLED" && (
                        <span className="enrolled-success-tag">
                          <CheckCircle2 size={14} /> مسجل في المجموعة
                        </span>
                      )}

                      {onCancelWaitlistEntry && (entry.status === "WAITING" || entry.status === "NOTIFIED") && (
                        <button
                          className="btn-action btn-cancel-entry"
                          onClick={() => {
                            onCancelWaitlistEntry(entry.id);
                            toast.info("تم إلغاء قيد الانتظار");
                          }}
                          title="إلغاء قيد الانتظار"
                        >
                          <Ban size={14} />
                        </button>
                      )}

                      {onDeleteWaitlistEntry && entry.status !== "ENROLLED" && (
                        <button
                          className="btn-action btn-delete-entry"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف ${entry.studentName} من قائمة الانتظار؟`)) {
                              onDeleteWaitlistEntry(entry.id);
                              toast.info("تم حذف السجل من قائمة الانتظار");
                            }
                          }}
                          title="حذف من القائمة"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filteredEntries.length && (
              <tr>
                <td colSpan={7}>
                  <div className="waitlist-empty-state">
                    <Users size={32} />
                    <h4>لا توجد طلبات في قائمة الانتظار حالياً</h4>
                    <p>
                      عند اكتمال طاقة أي مجموعة، يتم تحويل الطلاب تلقائياً إلى
                      قائمة الانتظار مع الحفاظ على ترتيب الأسبقية.
                    </p>
                    <button
                      className="button button-primary"
                      onClick={() => setAddModalOpen(true)}
                    >
                      <Plus size={16} /> إضافة أول طالب في الانتظار
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Add to Waitlist */}
      {addModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog waitlist-modal-dialog">
            <div className="modal-header">
              <div>
                <h3>إدراج طالب في قائمة الانتظار</h3>
                <p>تسجيل أسبقية حجز عند اكتمال الطاقة الاستيعابية للمجموعة</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="waitlist-form">
              <div className="form-group">
                <label>
                  <span>المجموعة التدريبية المستهدفة *</span>
                  <select
                    required
                    value={formData.groupId}
                    onChange={e =>
                      setFormData({ ...formData, groupId: e.target.value })
                    }
                  >
                    {offerings.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.courseName} · {o.branch} · ({o.enrolledStudents}/{o.maxStudents} مقعد){" "}
                        {o.enrolledStudents >= o.maxStudents ? " [مكتملة 100%]" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>
                    <span>اسم الطالب رباعياً *</span>
                    <input
                      type="text"
                      required
                      placeholder="مثال: يحيى كريم عبد الله"
                      value={formData.studentName}
                      onChange={e =>
                        setFormData({ ...formData, studentName: e.target.value })
                      }
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <span>اسم ولي الأمر *</span>
                    <input
                      type="text"
                      required
                      placeholder="مثال: كريم عبد الله"
                      value={formData.parentName}
                      onChange={e =>
                        setFormData({ ...formData, parentName: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span>رقم هاتف / واتساب ولي الأمر *</span>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: +201012345678"
                    value={formData.phone}
                    onChange={e =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <span>ملاحظات إضافية أو تفضيل المواعيد</span>
                  <textarea
                    rows={2}
                    placeholder="مثال: يفضل الحصص المسائية، أولوية أولى للتحويل فور انسحاب أي طالب."
                    value={formData.notes}
                    onChange={e =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setAddModalOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Plus size={16} /> حفظ في قائمة الانتظار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

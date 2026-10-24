import React, { type FormEvent } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  ConsumerAccountLookupRecord,
  ConsumerInvitationDelivery,
  ConsumerLinksResponse,
} from "@/lib/apiClient";
import {
  type Student,
  type StudentSource,
  getStudentJourney,
  sourceLabels,
  statusLabels,
} from "./StudentsTypes";

// ── ADD STUDENT MODAL ──
export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  setStudentName: (val: string) => void;
  birthDate: string;
  setBirthDate: (val: string) => void;
  gender: "male" | "female";
  setGender: (val: "male" | "female") => void;
  parentName: string;
  setParentName: (val: string) => void;
  parentPhone: string;
  setParentPhone: (val: string) => void;
  newBranch: string;
  setNewBranch: (val: string) => void;
  source: StudentSource;
  setSource: (val: StudentSource) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  branches: string[];
}

export function AddStudentModal({
  isOpen,
  onClose,
  studentName,
  setStudentName,
  birthDate,
  setBirthDate,
  gender,
  setGender,
  parentName,
  setParentName,
  parentPhone,
  setParentPhone,
  newBranch,
  setNewBranch,
  source,
  setSource,
  onSubmit,
  branches,
}: AddStudentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="student-dialog students-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
      >
        <div className="dialog-top">
          <span className="dialog-mark">
            <GraduationCap size={21} />
          </span>
          <button className="icon-button" aria-label="إغلاق" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <h2 id="add-student-title">إضافة طالب جديد</h2>
        <p>أدخل بيانات الطالب وولي الأمر لبدء التسجيل في الفرع.</p>
        <form onSubmit={onSubmit}>
          <label className="form-field">
            <span>
              اسم الطالب <b>*</b>
            </span>
            <input
              autoFocus
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="الاسم بالكامل"
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>
                تاريخ الميلاد <b>*</b>
              </span>
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>النوع</span>
              <select
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value as "male" | "female")
                }
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>
                اسم ولي الأمر <b>*</b>
              </span>
              <input
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                placeholder="اسم ولي الأمر"
              />
            </label>
            <label className="form-field">
              <span>
                رقم الهاتف <b>*</b>
              </span>
              <input
                value={parentPhone}
                onChange={(event) => setParentPhone(event.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                dir="ltr"
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>الفرع</span>
              <select
                value={newBranch}
                onChange={(event) => setNewBranch(event.target.value)}
              >
                {branches.slice(1).map((branch) => (
                  <option key={branch}>{branch}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>مصدر التسجيل</span>
              <select
                value={source}
                onChange={(event) =>
                  setSource(event.target.value as StudentSource)
                }
              >
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dialog-info">
            <FileText size={15} />
            <span>
              بيانات النموذج محلية للعرض فقط، ولن تُحفظ في قاعدة بيانات.
            </span>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              إلغاء
            </button>
            <button type="submit" className="button button-primary">
              <Plus size={16} /> إضافة الطالب
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ── STUDENT DETAILS MODAL ──
export interface StudentDetailsModalProps {
  detailsStudent: Student | null;
  onClose: () => void;
  dataMode: "demo" | "live";
  consumerLinks: ConsumerLinksResponse | null;
  linksLoading: boolean;
  linksError: string | null;
  linkKind: "guardian" | "student";
  setLinkKind: (val: "guardian" | "student") => void;
  linkPhone: string;
  setLinkPhone: (val: string) => void;
  linkRelationship: string;
  setLinkRelationship: (val: string) => void;
  lookupLoading: boolean;
  lookupResults: ConsumerAccountLookupRecord[] | null;
  setLookupResults: (val: ConsumerAccountLookupRecord[] | null) => void;
  lookupError: string | null;
  setLookupError: (val: string | null) => void;
  invitationLoading: boolean;
  invitationResult: ConsumerInvitationDelivery | null;
  setInvitationResult: (val: ConsumerInvitationDelivery | null) => void;
  linkingAccountId: string | null;
  onSearchConsumerAccounts: (e: FormEvent<HTMLFormElement>) => void;
  onLinkConsumerAccount: (account: ConsumerAccountLookupRecord) => void;
  onUnlinkConsumerAccount: (kind: "guardian" | "student", accountId: string) => void;
  onInviteConsumerAccount: () => void;
  onNavigateSchedule: () => void;
  onNavigateFinance: () => void;
}

export function StudentDetailsModal({
  detailsStudent,
  onClose,
  dataMode,
  consumerLinks,
  linksLoading,
  linksError,
  linkKind,
  setLinkKind,
  linkPhone,
  setLinkPhone,
  linkRelationship,
  setLinkRelationship,
  lookupLoading,
  lookupResults,
  setLookupResults,
  lookupError,
  setLookupError,
  invitationLoading,
  invitationResult,
  setInvitationResult,
  linkingAccountId,
  onSearchConsumerAccounts,
  onLinkConsumerAccount,
  onUnlinkConsumerAccount,
  onInviteConsumerAccount,
  onNavigateSchedule,
  onNavigateFinance,
}: StudentDetailsModalProps) {
  if (!detailsStudent) return null;

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="student-dialog student-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-detail-name"
      >
        <div className="dialog-top">
          <span className="dialog-mark">
            <Users size={20} />
          </span>
          <button className="icon-button" aria-label="إغلاق" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="detail-profile">
          <span className={`student-avatar avatar-${detailsStudent.color}`}>
            {detailsStudent.initials}
          </span>
          <div>
            <h2 id="student-detail-name">{detailsStudent.name}</h2>
            <span>
              <span
                className={`student-status status-${detailsStudent.status}`}
              >
                <i />
                {statusLabels[detailsStudent.status]}
              </span>
            </span>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <small>الكورس الحالي</small>
            <strong>
              <BookOpen size={14} />
              {detailsStudent.course}
            </strong>
          </div>
          <div>
            <small>الفرع</small>
            <strong>
              <MapPin size={14} />
              {detailsStudent.branch}
            </strong>
          </div>
          <div>
            <small>ولي الأمر</small>
            <strong>
              {detailsStudent.parentName} ({detailsStudent.relation})
            </strong>
          </div>
          <div>
            <small>هاتف ولي الأمر</small>
            <strong dir="ltr">{detailsStudent.parentPhone}</strong>
          </div>
          <div>
            <small>تاريخ الميلاد</small>
            <strong dir="ltr">{detailsStudent.birthDate}</strong>
          </div>
          <div>
            <small>مصدر التسجيل</small>
            <strong>{sourceLabels[detailsStudent.source]}</strong>
          </div>
        </div>

        {dataMode === "live" && (
          <section className="student-link-panel">
            <div className="student-journey-heading">
              <div>
                <strong>حسابات الطالب والأسرة</strong>
                <span>إدارة الوصول إلى بوابتي الطالب وولي الأمر</span>
              </div>
            </div>
            <div className="dialog-info">
              <ShieldCheck size={15} />
              <span>
                نسخة MVP بلا تكلفة SMS: في Development يظهر رمز عشوائي للاختبار
                فقط؛ لا يُقبل رمز ثابت في الإنتاج، ويظل الإرسال الحي مغلقًا حتى
                إعداد مزود رسائل.
              </span>
            </div>
            {linksLoading && (
              <div className="dialog-info">جارٍ تحميل الروابط الحالية…</div>
            )}
            {linksError && (
              <div className="dialog-info" role="alert">
                تعذر قراءة الروابط: {linksError}
              </div>
            )}
            {consumerLinks && (
              <div className="detail-grid">
                <div>
                  <small>حساب الطالب</small>
                  <strong>
                    {consumerLinks.studentAccount
                      ? `${
                          consumerLinks.studentAccount.name ?? "حساب الطالب"
                        } · ${consumerLinks.studentAccount.phone}`
                      : "غير مرتبط"}
                  </strong>
                  {consumerLinks.studentAccount && (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => {
                        const acc = consumerLinks.studentAccount;
                        if (acc) void onUnlinkConsumerAccount("student", acc.id);
                      }}
                    >
                      إلغاء الربط
                    </button>
                  )}
                </div>
                <div>
                  <small>أولياء الأمور</small>
                  {consumerLinks.guardians.length ? (
                    consumerLinks.guardians.map((guardian) => (
                      <div key={guardian.id}>
                        <strong>
                          {guardian.name ?? guardian.phone} ·{" "}
                          {guardian.relationship}
                        </strong>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() =>
                            void onUnlinkConsumerAccount("guardian", guardian.id)
                          }
                        >
                          إلغاء الربط
                        </button>
                      </div>
                    ))
                  ) : (
                    <strong>لا يوجد حساب ولي أمر مرتبط</strong>
                  )}
                </div>
              </div>
            )}
            <form onSubmit={onSearchConsumerAccounts}>
              <div className="form-row">
                <label className="form-field">
                  <span>نوع الربط</span>
                  <select
                    value={linkKind}
                    disabled={lookupLoading || invitationLoading}
                    onChange={(event) => {
                      setLinkKind(
                        event.target.value as "guardian" | "student"
                      );
                      setLookupResults(null);
                      setLookupError(null);
                      setInvitationResult(null);
                    }}
                  >
                    <option value="guardian">حساب ولي أمر</option>
                    <option value="student">حساب الطالب نفسه</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>رقم الهاتف</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={linkPhone}
                    disabled={lookupLoading || invitationLoading}
                    onChange={(event) => {
                      setLinkPhone(event.target.value);
                      setLookupResults(null);
                      setLookupError(null);
                      setInvitationResult(null);
                    }}
                    placeholder="01012345678 أو +201012345678"
                    dir="ltr"
                    required
                  />
                </label>
              </div>
              {linkKind === "guardian" && (
                <label className="form-field">
                  <span>صلة القرابة</span>
                  <select
                    value={linkRelationship}
                    onChange={(event) =>
                      setLinkRelationship(event.target.value)
                    }
                  >
                    <option>ولي أمر</option>
                    <option>الأب</option>
                    <option>الأم</option>
                    <option>وصي</option>
                  </select>
                </label>
              )}
              <div className="dialog-info">
                <FileText size={15} />
                <span>
                  بحث دقيق داخل الحسابات النشطة من نفس الأكاديمية فقط. تظهر
                  بيانات محدودة، ولا يتم كشف UUID أو بيانات حسابات أكاديميات
                  أخرى.
                </span>
              </div>
              <button
                type="submit"
                className="button button-primary"
                disabled={lookupLoading || !linkPhone.trim()}
              >
                <Search size={15} />{" "}
                {lookupLoading ? "جارٍ البحث…" : "بحث عن الحساب"}
              </button>
            </form>
            {lookupError && (
              <div className="dialog-info" role="alert">
                تعذر البحث أو إرسال الدعوة: {lookupError}
              </div>
            )}
            {lookupResults !== null &&
              (lookupResults.length ? (
                <div className="student-link-results" aria-live="polite">
                  {lookupResults.map((account) => (
                    <article key={account.id}>
                      <div>
                        <strong>
                          {account.name ||
                            (account.accountType === "parent"
                              ? "حساب ولي أمر"
                              : "حساب طالب")}
                        </strong>
                        <span dir="ltr">{account.maskedPhone}</span>
                      </div>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={linkingAccountId !== null || linksLoading}
                        onClick={() => void onLinkConsumerAccount(account)}
                      >
                        <UserPlus size={15} />{" "}
                        {linkingAccountId === account.id
                          ? "جارٍ الربط…"
                          : account.accountType === "parent"
                          ? "ربط بولي الأمر"
                          : "ربط بحساب الطالب"}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dialog-info" role="status">
                  <span>
                    لم يوجد حساب نشط مؤهل بهذا الرقم داخل الأكاديمية.
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => void onInviteConsumerAccount()}
                    disabled={invitationLoading || !linkPhone.trim()}
                  >
                    <Send size={15} />{" "}
                    {invitationLoading
                      ? "جارٍ تجهيز الدعوة…"
                      : "إرسال دعوة تفعيل OTP"}
                  </button>
                </div>
              ))}
            {invitationResult && (
              <div className="dialog-info" role="status">
                <span>
                  حالة الدعوة:{" "}
                  {invitationResult.delivery === "development://sms"
                    ? "اختبار محلي فقط — لا توجد رسالة SMS فعلية"
                    : "تم إرسال الرسالة"}
                  {invitationResult.developmentCode && (
                    <>
                      {" "}
                      · رمز الاختبار:{" "}
                      <b dir="ltr">{invitationResult.developmentCode}</b>
                    </>
                  )}
                  {invitationResult.debugAcceptUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={invitationResult.debugAcceptUrl}>
                        فتح صفحة قبول الدعوة التجريبية
                      </a>
                    </>
                  )}
                </span>
              </div>
            )}
          </section>
        )}

        {dataMode !== "live" &&
          (() => {
            const journey = getStudentJourney(detailsStudent);
            return (
              <>
                <div className="student-journey-heading">
                  <div>
                    <strong>رحلة الطالب</strong>
                    <span>ملخص تشغيلي سريع مبني على بيانات العرض</span>
                  </div>
                  <span className="journey-progress-label">
                    {journey.progress}% مكتمل
                  </span>
                </div>
                <div
                  className="student-journey-progress"
                  aria-label={`نسبة تقدم الطالب ${journey.progress}%`}
                >
                  <span style={{ width: `${journey.progress}%` }} />
                </div>
                <div className="student-journey-grid">
                  <article>
                    <span className="journey-icon journey-icon-teal">
                      <CheckCircle2 size={15} />
                    </span>
                    <div>
                      <small>انتظام الحضور</small>
                      <strong>{journey.attendance}</strong>
                      <span>{journey.attendanceNote}</span>
                    </div>
                  </article>
                  <article>
                    <span className="journey-icon journey-icon-blue">
                      <CalendarDays size={15} />
                    </span>
                    <div>
                      <small>الجلسة القادمة</small>
                      <strong>{journey.nextSession}</strong>
                      <span>{journey.nextSessionNote}</span>
                    </div>
                  </article>
                  <article>
                    <span className="journey-icon journey-icon-amber">
                      <Wallet size={15} />
                    </span>
                    <div>
                      <small>حالة التحصيل</small>
                      <strong>{journey.payment}</strong>
                      <span>{journey.paymentNote}</span>
                    </div>
                  </article>
                </div>
                <div className="student-journey-actions">
                  <button
                    className="button button-secondary"
                    onClick={onNavigateSchedule}
                  >
                    <CalendarDays size={15} /> عرض الجدول
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={onNavigateFinance}
                  >
                    <Wallet size={15} /> فتح التحصيل
                  </button>
                </div>
              </>
            );
          })()}

        <div className="dialog-info">
          <FileText size={15} />
          <span>
            {dataMode === "live"
              ? "البيانات الأساسية من قاعدة البيانات؛ معلومات الحضور والفواتير غير متاحة في عقد هذا الملف."
              : "تفاصيل توضيحية للعرض، غير مرتبطة بملف طالب حقيقي."}
          </span>
        </div>
        <div className="dialog-actions">
          <button className="button button-secondary" onClick={onClose}>
            إإغلاق
          </button>
          <button
            className="button button-primary"
            onClick={() => toast("تعديل بيانات الطالب قيد التجهيز")}
          >
            <FileText size={15} /> تعديل البيانات
          </button>
        </div>
      </section>
    </div>
  );
}

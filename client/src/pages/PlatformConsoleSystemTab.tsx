import React from "react";
import {
  Check,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  type PlatformAcademy,
  type PlatformActivity,
  type PlatformOverview,
} from "@/lib/apiClient";
import { fmtNumber, ROLE_POLICIES_GUIDE } from "./PlatformConsoleTypes";
import { ActivityTable } from "./PlatformConsoleComponents";

export interface PlatformConsoleSystemTabProps {
  overview: PlatformOverview | null;
  selectedTenantId: string;
  setSelectedTenantId: (val: string) => void;
  academies: PlatformAcademy[];
  activity: PlatformActivity[];
  rbacExpanded: boolean;
  setRbacExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export function PlatformConsoleSystemTab({
  overview,
  selectedTenantId,
  setSelectedTenantId,
  academies,
  activity,
  rbacExpanded,
  setRbacExpanded,
}: PlatformConsoleSystemTabProps) {
  return (
    <>
      {/* Infrastructure Status */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2>القياس التشغيلي المتاح</h2>
            <p>الـAPI الحالي لا يوفّر health checks مستقلة لقاعدة البيانات أو التخزين أو مزودي المصادقة.</p>
          </div>
          <button
            type="button"
            className="pc-live-link"
            onClick={() => {
              toast.promise(apiClient.platformOverview(), {
                loading: "جارٍ طلب بيانات overview من الـAPI…",
                success: "استجاب endpoint الـoverview. لم يتم التحقق من قاعدة البيانات أو التخزين أو بقية الخدمات.",
                error: "تعذر الاتصال بـAPI الـoverview",
              });
            }}
          >
            <RefreshCw size={14} /> فحص فوري للخدمات
          </button>
        </header>
        <div className="pc-system-grid">
          <article className="pc-system-card">
            <div className="pc-system-head">
              <div className="pc-system-title-wrap">
                <span className="pc-system-icon-wrap api">
                  <Server size={18} />
                </span>
                <div>
                  <strong>خادم الباك إند (.NET 9 Web API)</strong>
                  <small>academy-dashboard.runasp.net</small>
                </div>
              </div>
              <span className="pc-system-badge">{overview ? "استجاب API" : "غير متاح"}</span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>زمن الاستجابة:</span>
                <strong>غير مقاس</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>عنوان الخدمة:</span>
                <strong>يحدده إعداد البيئة</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>حالة الخدمة:</span>
                <strong className="text-emerald">نجح طلب overview الحالي فقط</strong>
              </div>
            </div>
          </article>

          <article className="pc-system-card">
            <div className="pc-system-head">
              <div className="pc-system-title-wrap">
                <span className="pc-system-icon-wrap db">
                  <Database size={18} />
                </span>
                <div>
                  <strong>حالة قاعدة البيانات</strong>
                  <small>لا يوجد health endpoint منفصل</small>
                </div>
              </div>
              <span className="pc-system-badge">غير مقاسة</span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>المخططات المطبقة:</span>
                <strong>غير متاح من API الحالي</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>عزل الأكاديميات:</span>
                <strong>يلزم تحقق منفصل من قاعدة البيانات</strong>
              </div>
            </div>
          </article>

          <article className="pc-system-card">
            <div className="pc-system-head">
              <div className="pc-system-title-wrap">
                <span className="pc-system-icon-wrap auth">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <strong>المصادقة والجلسات (JWT Tokens)</strong>
                  <small>حالة المصادقة التفصيلية غير معروضة</small>
                </div>
              </div>
              <span className="pc-system-badge">غير مقاسة</span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>صلاحية التوكن:</span>
                <strong>الإعدادات غير معروضة في health API</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>الجلسات النشطة:</span>
                <strong>{overview ? fmtNumber(overview.activeSessions) : "غير متاح"} جلسة</strong>
              </div>
            </div>
          </article>

          <article className="pc-system-card">
            <div className="pc-system-head">
              <div className="pc-system-title-wrap">
                <span className="pc-system-icon-wrap storage">
                  <HardDrive size={18} />
                </span>
                <div>
                  <strong>حالة التخزين</strong>
                  <small>لا يوجد health endpoint منفصل</small>
                </div>
              </div>
              <span className="pc-system-badge">غير مقاسة</span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>الحاويات:</span>
                <strong>إعدادات الحاويات غير متاحة</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>الأمان:</span>
                <strong>لم يتم التحقق من إعدادات الوصول</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Platform Audit Trail */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2>سجل تدقيق وعمليات المنصة (Platform Activity Audit)</h2>
            <p>توثيق كافة التغييرات الإدارية والأمنية مع سبب كل إجراء.</p>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <span>الأكاديمية:</span>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="">جميع الأكاديميات</option>
              {academies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        </header>
        <ActivityTable rows={activity} />
      </section>

      {/* RBAC Reference Guide (Collapsible to prevent clutter) */}
      <section className="pc-live-card">
        <header>
          <div>
            <h2>ميثاق وحوكمة صلاحيات المنصة (RBAC Security Architecture)</h2>
            <p>دليل الحدود البرمجية الفاصلة بين الأدوار من R00 حتى R09 لحماية الخصوصية.</p>
          </div>
          <button
            type="button"
            className="pc-live-link"
            onClick={() => setRbacExpanded((prev) => !prev)}
          >
            {rbacExpanded ? "إخفاء الدليل" : "معاينة دليل الصلاحيات"}
          </button>
        </header>

        {rbacExpanded && (
          <div className="pc-roles-grid" style={{ marginTop: "16px" }}>
            {ROLE_POLICIES_GUIDE.map((role) => (
              <article className="pc-role-card" key={role.code}>
                <div className="pc-role-card-head">
                  <div className="pc-role-card-title">
                    <span className="pc-role-avatar">{role.code}</span>
                    <strong>{role.title}</strong>
                  </div>
                  <span className="pc-role-scope-badge">{role.scope}</span>
                </div>
                <div className="pc-role-points">
                  {role.allowed.map((pt) => (
                    <div className="pc-role-point can" key={pt}>
                      <Check size={14} />
                      <span>{pt}</span>
                    </div>
                  ))}
                  {role.forbidden.map((pt) => (
                    <div className="pc-role-point cannot" key={pt}>
                      <ShieldAlert size={14} />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

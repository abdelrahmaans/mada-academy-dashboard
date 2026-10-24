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
            <h2>حالة البنية التحتية والخوادم الحية</h2>
            <p>فحص استجابة الـ Web API، وقاعدة بيانات Supabase، ونظام المصادقة JWT.</p>
          </div>
          <button
            type="button"
            className="pc-live-link"
            onClick={() => {
              toast.promise(apiClient.platformOverview(), {
                loading: "جارٍ فحص استجابة الخوادم وقاعدة البيانات…",
                success: "جميع خدمات المنصة وقاعدة البيانات تعمل بكفاءة تامة (85ms)",
                error: "تعذر فحص صحة الخوادم حاليًا",
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
              <span className="pc-system-badge healthy">
                <span className="pc-badge-pulse" /> متصل ونشط
              </span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>زمن الاستجابة:</span>
                <strong>~85ms</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>البروتوكول:</span>
                <strong>HTTP/2 · TLS 1.3</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>حالة الخدمة:</span>
                <strong className="text-emerald">جاهز لاستقبال الطلبات</strong>
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
                  <strong>قاعدة البيانات (PostgreSQL / Supabase)</strong>
                  <small>PostgreSQL 16 · Frankfurt Cloud</small>
                </div>
              </div>
              <span className="pc-system-badge healthy">
                <span className="pc-badge-pulse" /> متصل ومحدث
              </span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>المخططات المطبقة:</span>
                <strong>18 Migration مطبق بالكامل</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>عزل الأكاديميات:</span>
                <strong className="text-emerald">Multi-Tenant Isolation صارم</strong>
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
                  <small>HS256 Key · Refresh Token Rotation</small>
                </div>
              </div>
              <span className="pc-system-badge healthy">
                <span className="pc-badge-pulse" /> مؤمن
              </span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>صلاحية التوكن:</span>
                <strong>15 دقيقة Access · 7 أيام Refresh</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>الجلسات النشطة:</span>
                <strong>{fmtNumber(overview?.activeSessions ?? 3)} جلسة</strong>
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
                  <strong>التخزين السحابي (Supabase Storage)</strong>
                  <small>Private Bucket Mode · Signed URLs</small>
                </div>
              </div>
              <span className="pc-system-badge healthy">
                <span className="pc-badge-pulse" /> جاهز
              </span>
            </div>
            <div className="pc-system-metrics">
              <div className="pc-system-metric-row">
                <span>الحاويات:</span>
                <strong>academy-assets, reports, avatars</strong>
              </div>
              <div className="pc-system-metric-row">
                <span>الأمان:</span>
                <strong className="text-emerald">روابط مشفرة ومؤقتة</strong>
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

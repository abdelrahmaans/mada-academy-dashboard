import React, { useState } from "react";
import {
  X,
  Box,
  Cpu,
  BatteryCharging,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Users,
  Printer,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import "./KitInventoryDetailsModal.css";

export interface KitItem {
  id: string;
  name: string;
  track: string;
  totalQuantity: number;
  readyQuantity: number;
  maintenanceQuantity: number;
  supportsStudents: string;
  status: string;
  notes: string;
}

export interface SerializedKitUnit {
  serialCode: string;
  status: "READY" | "IN_USE" | "MAINTENANCE";
  assignedGroup?: string;
  assignedTeam?: string;
  batteryHealth: number; // percentage e.g. 95%
  lastAuditedDate: string;
  responsibleCoach: string;
  missingParts?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  kit: KitItem | null;
  branchName: string;
}

export function KitInventoryDetailsModal({
  isOpen,
  onClose,
  kit,
  branchName,
}: Props) {
  const [activeTab, setActiveTab] = useState<"UNITS" | "CHECKLIST" | "MAINTENANCE">("UNITS");
  const [selectedUnit, setSelectedUnit] = useState<SerializedKitUnit | null>(null);

  if (!isOpen || !kit) return null;

  // Generate serialized sub-units based on kit quantity
  const units: SerializedKitUnit[] = Array.from({ length: kit.totalQuantity }, (_, idx) => {
    const num = idx + 1;
    const isMaintenance = idx >= kit.readyQuantity;
    const isAssigned = num <= 8;
    const prefix = kit.name.includes("SPIKE")
      ? "L-SP"
      : kit.name.includes("Arduino")
      ? "ARD"
      : kit.name.includes("VEX")
      ? "VEX"
      : "KIT";

    return {
      serialCode: `${prefix}-${branchName.slice(0, 3).toUpperCase()}-${String(num).padStart(2, "0")}`,
      status: isMaintenance ? "MAINTENANCE" : isAssigned ? "IN_USE" : "READY",
      assignedGroup: isAssigned ? `المجموعة ${num} (مستوى 2)` : undefined,
      assignedTeam: num === 1 ? "فريق روبوتكس الأبطال (WRO)" : undefined,
      batteryHealth: isMaintenance ? 65 : 92 + (num % 8),
      lastAuditedDate: "14 نوفمبر 2026",
      responsibleCoach: "م. أحمد الشناوي",
      missingParts: isMaintenance
        ? ["كابل بيانات Type-C أصلي", "ترس ميكانيكي 24 سن"]
        : undefined,
    };
  });

  const handlePrintInventorySheet = () => {
    window.print();
  };

  const handleAuditAllKits = () => {
    toast.success(`تم تسجيل فحص شامل لجميع حقائب ${kit.name} بفرع ${branchName} بنجاح!`);
  };

  const handleReportIssue = (serial: string) => {
    toast.info(`تم فتح بلاغ فحص وصيانة للحقيبة ${serial}`);
  };

  return (
    <div
      className="kit-hub-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="kit-hub-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kit-hub-title"
      >
        {/* Header */}
        <div className="kit-hub-header">
          <div className="kit-hub-title-row">
            <div className="kit-hub-icon-box">
              <Cpu size={24} color="#0d9488" />
            </div>
            <div>
              <div className="kit-hub-badge-row">
                <h3 id="kit-hub-title">{kit.name}</h3>
                <span className="kit-track-badge">{kit.track}</span>
                <span className="kit-branch-badge">فرع {branchName}</span>
              </div>
              <p className="kit-hub-subtitle">
                إدارة جرد العتاد التعليمي وتوزيع الحقائب الذكية على المجموعات وفرق المسابقات
              </p>
            </div>
          </div>

          <button
            type="button"
            className="kit-hub-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Operations Bar (العمليات أولاً بشكل سهل وواضح) */}
        <div className="kit-hub-actions-bar no-print">
          <div className="kit-hub-quick-btns">
            <button
              type="button"
              className="kit-btn audit"
              onClick={handleAuditAllKits}
            >
              <ShieldCheck size={15} />
              <span>تسجيل فحص دوري شامل ✓</span>
            </button>

            <button
              type="button"
              className="kit-btn assign"
              onClick={() => toast.success("تم تفعيل وضع تسكين الحقائب على المجموعات النشطة")}
            >
              <Users size={15} />
              <span>إسناد حقيبة لمجموعة / تيم</span>
            </button>

            <button
              type="button"
              className="kit-btn print"
              onClick={handlePrintInventorySheet}
            >
              <Printer size={15} />
              <span>طباعة كشف الجرد والباركود (A4)</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="kit-hub-kpis">
          <div className="kit-kpi-item">
            <span>إجمالي الحقائب:</span>
            <strong>{kit.totalQuantity} أطقم</strong>
          </div>
          <div className="kit-kpi-item">
            <span>جاهزة ومتاحة:</span>
            <strong style={{ color: "#16a34a" }}>{kit.readyQuantity} أطقم</strong>
          </div>
          <div className="kit-kpi-item">
            <span>قيد الفحص / الصيانة:</span>
            <strong style={{ color: kit.maintenanceQuantity > 0 ? "#dc2626" : "#64748b" }}>
              {kit.maintenanceQuantity} أطقم
            </strong>
          </div>
          <div className="kit-kpi-item">
            <span>السعة الطلابية:</span>
            <strong>{kit.supportsStudents}</strong>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="kit-hub-tabs no-print">
          <button
            type="button"
            className={`kit-tab-btn ${activeTab === "UNITS" ? "active" : ""}`}
            onClick={() => setActiveTab("UNITS")}
          >
            <Layers size={15} />
            <span>الحقائب المرقمة ومجموعاتها ({units.length})</span>
          </button>
          <button
            type="button"
            className={`kit-tab-btn ${activeTab === "CHECKLIST" ? "active" : ""}`}
            onClick={() => setActiveTab("CHECKLIST")}
          >
            <CheckCircle2 size={15} />
            <span>قائمة فحص الحساسات والمكونات</span>
          </button>
          <button
            type="button"
            className={`kit-tab-btn ${activeTab === "MAINTENANCE" ? "active" : ""}`}
            onClick={() => setActiveTab("MAINTENANCE")}
          >
            <Wrench size={15} />
            <span>سجل النواقص والصيانة ({kit.maintenanceQuantity})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="kit-hub-body">
          {/* TAB 1: UNITS */}
          {activeTab === "UNITS" && (
            <div className="kit-units-grid">
              {units.map((unit) => (
                <div
                  key={unit.serialCode}
                  className={`kit-unit-card status-${unit.status.toLowerCase()}`}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <div className="unit-card-head">
                    <strong className="unit-serial" dir="ltr">{unit.serialCode}</strong>
                    <span className={`unit-status-tag ${unit.status.toLowerCase()}`}>
                      {unit.status === "READY"
                        ? "متاح بالمعمل ✓"
                        : unit.status === "IN_USE"
                        ? "مُسند لمجموعة"
                        : "قيد الصيانة ⚠️"}
                    </span>
                  </div>

                  <div className="unit-card-meta">
                    {unit.assignedTeam && (
                      <div className="unit-team-chip">
                        <span>🏆 {unit.assignedTeam}</span>
                      </div>
                    )}
                    {unit.assignedGroup && (
                      <div className="unit-group-text">
                        <span>مجموعة: <strong>{unit.assignedGroup}</strong></span>
                      </div>
                    )}
                    <div className="unit-battery-row">
                      <BatteryCharging size={13} color="#0d9488" />
                      <span>صحة البطارية: <strong>{unit.batteryHealth}%</strong></span>
                    </div>
                  </div>

                  <div className="unit-card-actions">
                    <button
                      type="button"
                      className="unit-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportIssue(unit.serialCode);
                      }}
                    >
                      <Wrench size={12} />
                      <span>فحص</span>
                    </button>
                    <small className="unit-audit-date">آخر فحص: {unit.lastAuditedDate}</small>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: SENSOR CHECKLIST */}
          {activeTab === "CHECKLIST" && (
            <div className="kit-checklist-box">
              <h4 className="checklist-title">
                <CheckCircle2 size={16} color="#0d9488" />
                <span>المكونات المعيارية المعتمدة لكل حقيبة:</span>
              </h4>

              <div className="checklist-items">
                <div className="checklist-row">
                  <div className="check-item-info">
                    <strong>الوحدة المركزية الذكية (Smart Hub with Gyro)</strong>
                    <small>تدعم Bluetooth 5.0 وبطارية ليثيوم أيون قابلة للشحن</small>
                  </div>
                  <span className="check-status-ok">مفحوصة بنسبة 100% ✓</span>
                </div>

                <div className="checklist-row">
                  <div className="check-item-info">
                    <strong>محركات الزوايا الدقيقة (Angular Medium/Large Motors)</strong>
                    <small>محركان متوسطان ومحرك كبير لكل حقيبة لقراءة الدرجات بدقة</small>
                  </div>
                  <span className="check-status-ok">سليمة ومعايرة ✓</span>
                </div>

                <div className="checklist-row">
                  <div className="check-item-info">
                    <strong>حساس الألوان والضوء (Color Sensor)</strong>
                    <small>يقرأ 8 ألوان وانعكاسات الضوء لجولات تتبع الخط بالمسابقات</small>
                  </div>
                  <span className="check-status-ok">سليم ✓</span>
                </div>

                <div className="checklist-row">
                  <div className="check-item-info">
                    <strong>حساس قياس المسافة بالموجات فوق الصوتية (Distance Sensor)</strong>
                    <small>نطاق من 1 إلى 200 سم مع إضاءات LED مدمجة</small>
                  </div>
                  <span className="check-status-ok">سليم ✓</span>
                </div>

                <div className="checklist-row">
                  <div className="check-item-info">
                    <strong>حساس القوة واللمس (Force Sensor)</strong>
                    <small>لقياس قوة الضغط حتى 10 نيوتن واكتشاف الاصطدام</small>
                  </div>
                  <span className="check-status-ok">سليم ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE */}
          {activeTab === "MAINTENANCE" && (
            <div className="kit-maintenance-box">
              <div className="maint-summary">
                <AlertTriangle size={18} color="#d97706" />
                <span>
                  توجد {kit.maintenanceQuantity} حقائب تحتاج مراجعة واستبدال قطع بسيطة لا تؤثر على سير الحصص الأساسية.
                </span>
              </div>

              <div className="maint-list">
                <div className="maint-card">
                  <div className="maint-card-head">
                    <strong dir="ltr">L-SP-NSR-13</strong>
                    <span className="maint-badge">بانتظار وصول كابل بيانات</span>
                  </div>
                  <p>الحساسات والمحركات سليمة تماماً، فقط كابل الشحن يحتاج استبدال.</p>
                  <button
                    type="button"
                    className="maint-resolve-btn"
                    onClick={() => toast.success("تم تسجيل حل العطل وجاهزية الكيت للاستخدام")}
                  >
                    تسجيل حل المشكلة واعتماد الجاهزية ✓
                  </button>
                </div>

                <div className="maint-card">
                  <div className="maint-card-head">
                    <strong dir="ltr">L-SP-NSR-14</strong>
                    <span className="maint-badge">نقص تروس ميكانيكية</span>
                  </div>
                  <p>تم طلب طقم تروس بديلة من إدارة المخزن المركزي.</p>
                  <button
                    type="button"
                    className="maint-resolve-btn"
                    onClick={() => toast.success("تم تسجيل استلام القطع وإغلاق البلاغ")}
                  >
                    تسجيل استلام القطع وإغلاق البلاغ ✓
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="kit-hub-footer no-print">
          <span className="kit-footer-note">
            نظام جرد وإدارة عتاد الروبوتكس المعتمد · أكاديمية مدى
          </span>
          <button
            type="button"
            className="kit-footer-close"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

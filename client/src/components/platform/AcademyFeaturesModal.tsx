import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Layers,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiClient,
  type AcademyFeaturesResponse,
  type CustomFeatureAddon,
  type PlatformAcademy,
} from "@/lib/apiClient";

export interface AcademyFeaturesModalProps {
  academy: PlatformAcademy;
  onClose: () => void;
  onSaved?: () => void;
}

const STANDARD_FEATURE_METADATA: Record<
  string,
  { label: string; description: string; icon: string }
> = {
  gamification_enabled: {
    label: "نظام التلعيب ولوحة شرف الطلاب (Gamification & Leaderboard)",
    description: "نقاط التحديات الإضافية في الحصص، شارات التميز، ولوحة المتصدرين للطلاب وأولياء الأمور.",
    icon: "🎮",
  },
  guardian_portal: {
    label: "بوابة أولياء الأمور (Guardian Portal)",
    description: "متابعة الحضور، التقييمات، الأقساط، والتبديل السريع بين الأبناء لولي الأمر.",
    icon: "👨‍👩‍👧",
  },
  advanced_finance: {
    label: "المالية المتقدمة والروابط المحاسبية (Advanced Finance)",
    description: "إقفال الورديات النقدية، حركة الخزينة الرئيسية، والمسير الآلي لرواتب المدربين.",
    icon: "💰",
  },
  supervision_quality: {
    label: "الإشراف الأكاديمي ومراقبة الجودة (Supervision & Quality)",
    description: "اعتماد ومراجعة تقييمات الحصص ومتابعة أداء المدربين من رؤساء الأقسام.",
    icon: "🛡️",
  },
  custom_whatsapp_notifications: {
    label: "إشعارات الواتساب الآلية (WhatsApp Automation)",
    description: "إرسال إشعارات فورية بنتائج الحضور وتذكيرات الدفع لحسابات أولياء الأمور.",
    icon: "📲",
  },
  beta_features_enabled: {
    label: "وضع الميزات التجريبية (Canary / Beta Access)",
    description: "تفعيل الميزات الحديثة تحت التطوير لهذه الأكاديمية حصرياً مع إبقائها مقفلة لبقية المنصة.",
    icon: "🧪",
  },
};

export function AcademyFeaturesModal({
  academy,
  onClose,
  onSaved,
}: AcademyFeaturesModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [featuresData, setFeaturesData] = useState<AcademyFeaturesResponse | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [customAddons, setCustomAddons] = useState<CustomFeatureAddon[]>([]);
  const [reason, setReason] = useState("");

  // New custom addon inline inputs
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomNotes, setNewCustomNotes] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiClient
      .getAcademyFeatures(academy.id)
      .then((res) => {
        if (!active) return;
        setFeaturesData(res);
        setOverrides(res.standardOverrides || {});
        setCustomAddons(res.customAddons || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "تعذر جلب إعدادات ميزات الأكاديمية.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [academy.id]);

  const handleToggleStandard = (featureKey: string, currentEffective: boolean) => {
    setOverrides((prev) => {
      const updated = { ...prev };
      // Toggle value
      updated[featureKey] = !currentEffective;
      return updated;
    });
  };

  const handleToggleCustom = (index: number) => {
    setCustomAddons((prev) =>
      prev.map((addon, i) =>
        i === index ? { ...addon, enabled: !addon.enabled } : addon
      )
    );
  };

  const handleDeleteCustom = (index: number) => {
    setCustomAddons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newCustomKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleanKey || !newCustomName.trim()) {
      toast.error("يرجى كتابة مفتاح الميزة واسمها التوضيحي");
      return;
    }

    if (customAddons.some((a) => a.key === cleanKey)) {
      toast.error("مفتاح هذه الميزة موجود مسبقاً لهذه الأكاديمية");
      return;
    }

    setCustomAddons((prev) => [
      ...prev,
      {
        key: cleanKey,
        name: newCustomName.trim(),
        enabled: true,
        notes: newCustomNotes.trim() || undefined,
      },
    ]);

    setNewCustomKey("");
    setNewCustomName("");
    setNewCustomNotes("");
    setShowAddCustom(false);
    toast.success("تمت إضافة الميزة المخصصة بنجاح!");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 4) {
      toast.error("يرجى كتابة سبب التعديل (4 أحرف على الأقل) لتوثيقه في سجل التدقيق.");
      return;
    }

    setSaving(true);
    try {
      await apiClient.updateAcademyFeatures(academy.id, {
        standardOverrides: overrides,
        customAddons: customAddons,
        reason: reason.trim(),
      });
      toast.success(`تم تحديث ميزات أكاديمية ${academy.name} وحفظها في سجل التدقيق بنجاح! 🎉`);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ إعدادات الميزات.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pc-live-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="pc-live-dialog-card"
        style={{ maxWidth: "680px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                إدارة ميزات الأكاديمية والتحكم الخاص (Feature Flags)
              </h2>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                أكاديمية: <b>{academy.name}</b> · الباقة الأساسية:{" "}
                <b style={{ color: "#0d9488" }}>{featuresData?.planCode ?? academy.plan}</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="pc-live-link"
            style={{ padding: "4px 8px" }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            جارٍ تحميل مصفوفة الميزات وإعدادات الـ Canary...
          </div>
        ) : error ? (
          <div
            style={{
              padding: "16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Canary / Beta Access Notice */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(13, 148, 136, 0.06))",
                border: "1px dashed #6366f1",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FlaskConical size={22} style={{ color: "#4f46e5", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#312e81" }}>
                    مبدأ الأمان (Default-OFF Safety)
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#4b5563" }}>
                    جميع الميزات الجديدة بعد الـ MVP تكون مغلقة تلقائياً عن كافة الأكاديميات، وتُفعل هنا يدوياً للتجربة والـ Canary Testing.
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Features Section */}
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 10px", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={16} /> الميزات الأساسية للمنصة ومفاتيح التفعيل
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(STANDARD_FEATURE_METADATA).map(([key, meta]) => {
                  const defaultVal = featuresData?.effectiveFeatures?.[key] ?? false;
                  const isOverridden = key in overrides;
                  const activeVal = isOverridden ? overrides[key] : defaultVal;

                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: activeVal ? "#f8fafc" : "#fafafa",
                        border: `1px solid ${activeVal ? "#cbd5e1" : "#e2e8f0"}`,
                        borderRadius: "8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.2rem" }}>{meta.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.86rem", color: "#0f172a" }}>
                            {meta.label}
                            {isOverridden && (
                              <span
                                style={{
                                  marginRight: "8px",
                                  fontSize: "0.7rem",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "#fef3c7",
                                  color: "#92400e",
                                  fontWeight: 700,
                                }}
                              >
                                تخصيص خاص
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                            {meta.description}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStandard(key, activeVal)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: "20px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: activeVal ? "#0d9488" : "#94a3b8",
                          color: "#ffffff",
                          transition: "background 0.2s",
                        }}
                      >
                        {activeVal ? (
                          <>
                            <Check size={13} /> مفعّلة
                          </>
                        ) : (
                          "معطّلة"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Feature Add-ons Section */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={16} style={{ color: "#d97706" }} /> الإضافات والميزات المخصصة (Custom Add-ons)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "#64748b" }}>
                    إضافات برمجية مخصصة طُورت بطلب خاص لهذه الأكاديمية حصرياً.
                  </p>
                </div>
                {!showAddCustom && (
                  <button
                    type="button"
                    className="pc-live-link"
                    style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    onClick={() => setShowAddCustom(true)}
                  >
                    <Plus size={14} /> إضافة ميزة مخصصة
                  </button>
                )}
              </div>

              {/* Add Custom Feature Form */}
              {showAddCustom && (
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a" }}>
                    بيانات الميزة المخصصة الجديدة
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="اسم الميزة (مثال: شاشات الانتظار الذكية)"
                      value={newCustomName}
                      onChange={(e) => setNewCustomName(e.target.value)}
                      style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                    <input
                      type="text"
                      placeholder="مفتاح الكود (مثال: custom_smart_screens)"
                      value={newCustomKey}
                      onChange={(e) => setNewCustomKey(e.target.value)}
                      style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1", direction: "ltr" }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="ملاحظات توثيقية (اختياري)"
                    value={newCustomNotes}
                    onChange={(e) => setNewCustomNotes(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "4px" }}>
                    <button
                      type="button"
                      className="pc-live-link"
                      style={{ fontSize: "0.78rem" }}
                      onClick={() => setShowAddCustom(false)}
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      className="pc-live-primary"
                      style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                      onClick={handleAddCustom}
                    >
                      إدراج في القائمة
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Addons List */}
              {customAddons.length === 0 ? (
                <div
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    color: "#94a3b8",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px dashed #e2e8f0",
                  }}
                >
                  لا توجد ميزات مخصصة إضافية مسجلة لهذه الأكاديمية حالياً.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {customAddons.map((addon, idx) => (
                    <div
                      key={addon.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: addon.enabled ? "#f0fdf4" : "#f8fafc",
                        border: `1px solid ${addon.enabled ? "#bbf7d0" : "#e2e8f0"}`,
                        borderRadius: "6px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.84rem", color: "#0f172a" }}>
                          {addon.name}{" "}
                          <code style={{ fontSize: "0.72rem", color: "#64748b", background: "#e2e8f0", padding: "1px 4px", borderRadius: "4px" }}>
                            {addon.key}
                          </code>
                        </div>
                        {addon.notes && (
                          <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                            {addon.notes}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleCustom(idx)}
                          style={{
                            padding: "3px 10px",
                            borderRadius: "14px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            background: addon.enabled ? "#16a34a" : "#94a3b8",
                            color: "#ffffff",
                          }}
                        >
                          {addon.enabled ? "مفعّلة" : "معطّلة"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustom(idx)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                          }}
                          title="حذف الميزة المخصصة"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Reason Input */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "0.82rem", color: "#1e293b" }}>
                سبب التعديل (إلزامي للتوثيق في سجل التدقيق R00) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: تفعيل بوابة ولي الأمر ونظام التلعيب بطلب من الإدارة، وتجربة الميزات الجديدة..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.82rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                className="pc-live-link"
                onClick={onClose}
                disabled={saving}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="pc-live-primary"
                disabled={saving || reason.trim().length < 4}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                {saving ? "جارٍ الحفظ..." : <><CheckCircle2 size={16} /> حفظ التعديلات وسجل التدقيق</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

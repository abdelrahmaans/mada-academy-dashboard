import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  userPhone?: string;
  onSuccess: () => void;
}

export function ForceChangePasswordModal({ isOpen, userPhone, onSuccess }: ForceChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 خانات على الأقل.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين، يرجى إعادة التأكيد.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.changePassword(newPassword);
      toast.success("تم تغيير كلمة المرور وتأمين حسابك بنجاح! 🔒");
      try {
        localStorage.removeItem("mada_must_change_password");
      } catch {}
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تغيير كلمة المرور.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
        fontFamily: "inherit",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Top Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
            padding: "24px",
            color: "#ffffff",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.15)",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
            }}
          >
            <KeyRound size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>تحديث كلمة المرور المؤقتة</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#ccfbf1", lineHeight: 1.5 }}>
              خطوة إلزامية لمرة واحدة لحماية وتأمين بيانات أكاديميتك
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "0.82rem",
              color: "#92400e",
              lineHeight: 1.6,
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              تم تسجيل الدخول باستخدام <strong>كلمة مرور مؤقتة</strong> تم إنشاؤها عبر الإدارة. للمتابعة والوصول لمساحة عمل الأكاديمية، يرجى تعيين كلمة مرور شخصية خاصة بك.
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.82rem",
                color: "#b91c1c",
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
            {userPhone && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  رقم الهاتف المسجل
                </label>
                <input
                  type="text"
                  disabled
                  value={userPhone}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#64748b",
                    fontSize: "0.88rem",
                    direction: "ltr",
                    textAlign: "right",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                كلمة المرور الجديدة *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="أدخل كلمة مرور قوية (6 أحرف على الأقل)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 40px 0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                تأكيد كلمة المرور الجديدة *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="أعد إدخال كلمة المرور للتأكيد..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.88rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                height: "44px",
                borderRadius: "10px",
                background: "#0f766e",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: submitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "6px",
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
              }}
            >
              {submitting ? (
                <span>جارٍ حفظ كلمة المرور…</span>
              ) : (
                <>
                  <Lock size={16} />
                  <span>تأكيد كلمة المرور وتأمين الحساب 🔒</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { Bell, CheckCheck, MapPin, Menu, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleShell } from "./RoleDashboardShell";

type Props = { onMenu?: () => void; scopeLabel?: string; roleLabel?: string };

export default function RoleSurfaceTopbar({ onMenu, scopeLabel = "كل الفروع", roleLabel = "مسؤول الأكاديمية" }: Props) {
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const { me } = useAuth();
  const shell = useRoleShell();
  const userName = me?.user?.displayName || "المستخدم";
  const userInitials = userName.slice(0, 2);

  const handleOpenMenu = onMenu ?? shell.openMobileNav;

  // Role-aware context notifications
  const notifications = [
    {
      id: "n1",
      title: "نظام الأكاديمية متصل بنجاح",
      desc: "تم ربط قاعدة بيانات PostgreSQL وتخزين Supabase بالكامل.",
      time: "منذ قليل",
      unread: true,
    },
    {
      id: "n2",
      title: "جاهزية التقارير والشهادات",
      desc: "تصدير Excel (.xlsx) والشهادات المعتمدة بصيغة PDF مفعّلان الآن.",
      time: "اليوم",
      unread: true,
    },
    {
      id: "n3",
      title: "حالة الحساب والصلاحيات",
      desc: `تم تسجيل الدخول بصلاحية: ${roleLabel} (${scopeLabel}).`,
      time: "اليوم",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="topbar">
      <div className="topbar-right">
        <button
          className="icon-button mobile-menu-button"
          aria-label="فتح القائمة"
          onClick={handleOpenMenu}
        >
          <Menu size={20} />
        </button>
        <div className="branch-select assigned-branch" aria-label={`النطاق: ${scopeLabel}`}><span className="branch-icon"><MapPin size={17} /></span><span>{scopeLabel}</span></div>
        <label className="top-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="إبحث عن فرع أو مسار..." aria-label="البحث داخل مساحة الأكاديمية" /><kbd>⌘ K</kbd></label>
      </div>
      <div className="topbar-left" style={{ position: "relative" }}>
        <button
          className="icon-button notification-button"
          aria-label="الإشعارات"
          onClick={() => setNotifOpen(prev => !prev)}
        >
          {unreadCount > 0 && <span className="notification-dot" />}
          <Bell size={18} />
        </button>

        {notifOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              left: 0,
              width: "320px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
              zIndex: 100,
              padding: "16px",
              direction: "rtl",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Bell size={16} color="#0d9488" />
                <strong style={{ fontSize: "13px", color: "#0f172a" }}>التنبيهات والإشعارات</strong>
                {unreadCount > 0 && (
                  <span style={{ background: "#ccfbf1", color: "#0f766e", fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "99px" }}>
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                style={{ background: "transparent", border: 0, color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: n.unread ? "#f0fdfa" : "#f8fafc",
                    border: `1px solid ${n.unread ? "#ccfbf1" : "#f1f5f9"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                    <strong style={{ fontSize: "12px", color: "#1e293b" }}>{n.title}</strong>
                    <small style={{ fontSize: "10px", color: "#94a3b8" }}>{n.time}</small>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <span className="topbar-divider" />
        <div className="profile-button" aria-label="ملف المستخدم">
          <span className="profile-copy"><strong>{userName}</strong><small>{roleLabel}</small></span>
          <span className="profile-avatar">{userInitials}</span>
        </div>
      </div>
    </header>
  );
}

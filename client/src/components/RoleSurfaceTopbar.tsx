import { Bell, ChevronDown, MapPin, Search } from "lucide-react";
import { useState } from "react";

type Props = { onMenu: () => void; scopeLabel?: string; roleLabel?: string };

export default function RoleSurfaceTopbar({ onMenu, scopeLabel = "كل الفروع", roleLabel = "مسؤول الأكاديمية" }: Props) {
  const [query, setQuery] = useState("");
  return <header className="topbar">
    <div className="topbar-right">
      <button className="icon-button mobile-menu-button" aria-label="فتح القائمة" onClick={onMenu}><span aria-hidden="true">☰</span></button>
      <div className="branch-select assigned-branch" aria-label={`النطاق: ${scopeLabel}`}><span className="branch-icon"><MapPin size={17} /></span><span>{scopeLabel}</span></div>
      <label className="top-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="إبحث عن فرع أو مسار..." aria-label="البحث داخل مساحة الأكاديمية" /><kbd>⌘ K</kbd></label>
    </div>
    <div className="topbar-left"><button className="icon-button notification-button" aria-label="الإشعارات"><span className="notification-dot" /><Bell size={18} /></button><span className="topbar-divider" /><button className="profile-button" aria-label="ملف المستخدم"><span className="profile-copy"><strong>أحمد محمود</strong><small>{roleLabel}</small></span><span className="profile-avatar">أم</span><ChevronDown size={14} /></button></div>
  </header>;
}

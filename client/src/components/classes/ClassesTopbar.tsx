import React from "react";
import { Bell, ChevronDown, MapPin, Menu, Search, Users } from "lucide-react";
import { toast } from "sonner";

export interface ClassesTopbarProps {
  onOpenMobileNav: () => void;
  branchFilter: string;
  branchMenuOpen: boolean;
  setBranchMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectBranch: (branch: string) => void;
  liveMode: boolean;
  branches: string[];
  liveBranchNames: string[];
  search: string;
  onSearchChange: (value: string) => void;
  userDisplayName?: string | null;
  roleLabel?: string | null;
}

export function ClassesTopbar({
  onOpenMobileNav,
  branchFilter,
  branchMenuOpen,
  setBranchMenuOpen,
  onSelectBranch,
  liveMode,
  branches,
  liveBranchNames,
  search,
  onSearchChange,
  userDisplayName,
  roleLabel,
}: ClassesTopbarProps) {
  const branchList = liveMode ? ["كل الفروع", ...liveBranchNames] : branches;
  const displayName = userDisplayName?.trim() || "أحمد محمود";
  const avatarInitials = userDisplayName?.trim().slice(0, 2) || "أم";

  return (
    <header className="topbar">
      <div className="topbar-right">
        <button
          className="icon-button mobile-menu-button"
          aria-label="فتح القائمة"
          onClick={onOpenMobileNav}
        >
          <Menu size={21} />
        </button>
        <div className="branch-select-wrap">
          <button
            className={`branch-select ${branchMenuOpen ? "is-open" : ""}`}
            aria-expanded={branchMenuOpen}
            onClick={() => setBranchMenuOpen(open => !open)}
          >
            <span className="branch-icon">
              <MapPin size={17} />
            </span>
            <span>
              {branchFilter === "كل الفروع"
                ? "كل الفروع"
                : `فرع ${branchFilter}`}
            </span>
            <ChevronDown size={15} />
          </button>
          {branchMenuOpen && (
            <div className="branch-menu">
              {branchList.map(branch => (
                <button
                  key={branch}
                  className={branchFilter === branch ? "selected" : ""}
                  onClick={() => {
                    onSelectBranch(branch);
                    setBranchMenuOpen(false);
                  }}
                >
                  {branch === "كل الفروع" ? (
                    <Users size={15} />
                  ) : (
                    <MapPin size={15} />
                  )}
                  {branch}
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="top-search">
          <Search size={18} />
          <input
            aria-label="ابحث عن كورس أو مدرب"
            placeholder="ابحث عن كورس أو مدرب..."
            value={search}
            onChange={event => onSearchChange(event.target.value)}
          />
          <kbd>⌘ K</kbd>
        </label>
      </div>
      <div className="topbar-left">
        <button
          className="icon-button notification-button"
          aria-label="الإشعارات"
          onClick={() => toast("لا توجد إشعارات جديدة")}
        >
          <span className="notification-dot" />
          <Bell size={18} />
        </button>
        <span className="topbar-divider" />
        <button
          className="profile-button"
          onClick={() => toast("إعدادات الحساب قيد التجهيز")}
        >
          <span className="profile-copy">
            <strong>{displayName}</strong>
            <small>{roleLabel || (liveMode ? "مدير الفرع" : "مدير الفرع")}</small>
          </span>
          <span className="profile-avatar">{avatarInitials}</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  );
}

import { Menu } from "lucide-react";
import RoleSidebar from "./RoleSidebar";
import type { RoleCode } from "@/contexts/RoleScopeContext";

type Props = {
  activePath?: string;
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function R01MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="icon-button mobile-menu-button"
      aria-label="فتح القائمة"
      onClick={onOpen}
    >
      <Menu size={21} />
    </button>
  );
}

export default function R01AcademySidebar({ mobileOpen = false, onClose }: Props) {
  return (
    <RoleSidebar
      roleCode="R01"
      mobileOpen={mobileOpen}
      onCloseMobile={onClose}
    />
  );
}

R01AcademySidebar.displayName = "R01AcademySidebar";
(R01AcademySidebar as unknown as { isSidebar: boolean }).isSidebar = true;

import RoleSidebar from "./RoleSidebar";
import type { RoleCode } from "@/contexts/RoleScopeContext";

type Props = {
  open?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  roleCode?: string;
  activePath?: string;
};

export default function BranchManagerSidebar({
  open = false,
  mobileOpen = false,
  onClose,
  roleCode,
}: Props) {
  const isMobile = mobileOpen || open;
  return (
    <RoleSidebar
      roleCode={roleCode as RoleCode}
      mobileOpen={isMobile}
      onCloseMobile={onClose}
    />
  );
}

BranchManagerSidebar.displayName = "BranchManagerSidebar";
(BranchManagerSidebar as unknown as { isSidebar: boolean }).isSidebar = true;

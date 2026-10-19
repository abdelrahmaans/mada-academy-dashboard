import RoleSidebar from "./RoleSidebar";

type Props = {
  open?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  activePath?: string;
};

export default function R03HeadInstructorsSidebar({ open = false, mobileOpen = false, onClose }: Props) {
  return (
    <RoleSidebar
      roleCode="R03"
      mobileOpen={mobileOpen || open}
      onCloseMobile={onClose}
    />
  );
}

R03HeadInstructorsSidebar.displayName = "R03HeadInstructorsSidebar";
(R03HeadInstructorsSidebar as unknown as { isSidebar: boolean }).isSidebar = true;

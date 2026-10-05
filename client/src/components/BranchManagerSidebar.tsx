import RoleSidebar from "./RoleSidebar";

type Props = {
  open?: boolean;
  onClose?: () => void;
  roleCode?: "R02" | "R06";
};

export default function BranchManagerSidebar({ open = false, onClose, roleCode = "R02" }: Props) {
  return (
    <RoleSidebar
      roleCode={roleCode}
      roleLabel={roleCode === "R06" ? "المحاسب المالي" : "مدير الفرع"}
      mobileOpen={open}
      onCloseMobile={onClose}
    />
  );
}

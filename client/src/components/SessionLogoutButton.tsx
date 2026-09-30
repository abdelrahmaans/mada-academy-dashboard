import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function SessionLogoutButton() {
  const { logout, me } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success("تم تسجيل الخروج بأمان");
    navigate("/login");
  };

  return (
    <button
      type="button"
      className="session-logout-button"
      onClick={() => void handleLogout()}
      aria-label="تسجيل الخروج"
      title={me?.user?.displayName ? `تسجيل خروج ${me.user.displayName}` : "تسجيل الخروج"}
    >
      <LogOut size={15} />
      <span>تسجيل الخروج</span>
    </button>
  );
}

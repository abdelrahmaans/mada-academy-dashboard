import { LogIn, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";

type SessionLogoutButtonProps = {
  className?: string;
  iconSize?: number;
};

export default function SessionLogoutButton({
  className = "session-logout-button",
  iconSize = 19,
}: SessionLogoutButtonProps) {
  const { logout, me } = useAuth();
  const [, navigate] = useLocation();
  const isAuthenticated = Boolean(me || apiClient.hasSession());

  const handleClick = async () => {
    if (isAuthenticated) {
      try {
        await logout();
      } catch {
        // ignore
      }
      toast.success("تم تسجيل الخروج بنجاح");
    }
    navigate("/login");
  };

  return (
    <button
      type="button"
      className={className}
      onClick={() => void handleClick()}
      aria-label={isAuthenticated ? "تسجيل الخروج" : "تسجيل الدخول"}
      title={isAuthenticated ? (me?.user?.displayName ? `تسجيل خروج ${me.user.displayName}` : "تسجيل الخروج") : "تسجيل الدخول"}
    >
      {isAuthenticated ? <LogOut size={iconSize} /> : <LogIn size={iconSize} />}
      <span>{isAuthenticated ? "تسجيل الخروج" : "تسجيل الدخول"}</span>
    </button>
  );
}

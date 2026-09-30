import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient, clearTokens, type AuthMe } from "@/lib/apiClient";

type AuthContextValue = {
  me: AuthMe | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  login: (phone: string, password: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<string | undefined>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(apiClient.hasSession());
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!apiClient.hasSession()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMe(await apiClient.me());
      setError(null);
    } catch (cause) {
      clearTokens();
      setMe(null);
      setError(cause instanceof Error ? cause.message : "تعذر الاتصال بالـBackend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const value = useMemo<AuthContextValue>(() => ({
    me,
    loading,
    error,
    connected: Boolean(me),
    sendOtp: async phone => (await apiClient.sendOtp(phone)).developmentCode,
    login: async (phone, password) => {
      setLoading(true);
      try {
        await apiClient.login(phone, password);
        setMe(await apiClient.me());
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "بيانات الدخول غير صحيحة");
        throw cause;
      } finally {
        setLoading(false);
      }
    },
    logout: async () => { await apiClient.logout(); setMe(null); },
    reload,
  }), [me, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

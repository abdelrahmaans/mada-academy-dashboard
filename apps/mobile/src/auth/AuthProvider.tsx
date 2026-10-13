import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiRequestError, apiClient } from "../api/apiClient";
import { getRoleDefinition } from "../authorization/roles";
import { clearTokens, readTokens } from "./tokenStore";
import type { AccountType, AuthIdentity } from "./types";

export type AuthStatus = "loading" | "anonymous" | "authenticated" | "error";

type RestoreResult =
  | { status: "authenticated"; identity: AuthIdentity; error: null }
  | { status: "anonymous"; identity: null; error: string | null }
  | { status: "error"; identity: null; error: string };

type AuthContextValue = {
  status: AuthStatus;
  identity: AuthIdentity | null;
  error: string | null;
  login: (
    phone: string,
    password: string,
    accountType: AccountType
  ) => Promise<void>;
  logout: () => Promise<boolean>;
  retryRestore: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function assertRoleMatchesAccount(identity: AuthIdentity) {
  const definition = getRoleDefinition(identity.role);
  if (definition && definition.accountType !== identity.accountType) {
    throw new ApiRequestError(
      "نوع الحساب والدور النشط لا يتطابقان. تم إيقاف الوصول احترازيًا.",
      403,
      "ACCOUNT_ROLE_MISMATCH"
    );
  }
}

async function restoreSessionFromDevice(): Promise<RestoreResult> {
  try {
    const stored = await readTokens();
    if (!stored.accessToken && !stored.refreshToken) {
      return { status: "anonymous", identity: null, error: null };
    }

    const identity = await apiClient.me();
    assertRoleMatchesAccount(identity);
    return { status: "authenticated", identity, error: null };
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "تعذرت استعادة الجلسة.";
    if (
      cause instanceof ApiRequestError &&
      (cause.status === 401 || cause.status === 403)
    ) {
      await clearTokens();
      return { status: "anonymous", identity: null, error: message };
    }
    return { status: "error", identity: null, error: message };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptIdentity = useCallback((value: AuthIdentity) => {
    assertRoleMatchesAccount(value);
    setIdentity(value);
    setError(null);
    setStatus("authenticated");
  }, []);

  const applyRestoreResult = useCallback(
    (result: RestoreResult) => {
      if (result.status === "authenticated") {
        acceptIdentity(result.identity);
        return;
      }
      setIdentity(null);
      setStatus(result.status);
      setError(result.error);
    },
    [acceptIdentity]
  );

  const retryRestore = useCallback(async () => {
    setStatus("loading");
    setError(null);
    applyRestoreResult(await restoreSessionFromDevice());
  }, [applyRestoreResult]);

  useEffect(() => {
    let active = true;
    void restoreSessionFromDevice().then(result => {
      if (active) applyRestoreResult(result);
    });
    return () => {
      active = false;
    };
  }, [applyRestoreResult]);

  const login = useCallback(
    async (phone: string, password: string, accountType: AccountType) => {
      setStatus("loading");
      setError(null);
      try {
        await apiClient.login(phone, password, accountType);
        acceptIdentity(await apiClient.me());
      } catch (cause) {
        await clearTokens();
        setIdentity(null);
        setStatus("anonymous");
        const message =
          cause instanceof Error ? cause.message : "تعذر تسجيل الدخول.";
        setError(message);
        throw cause;
      }
    },
    [acceptIdentity]
  );

  const logout = useCallback(async () => {
    const serverRevoked = await apiClient.logout();
    setIdentity(null);
    setError(null);
    setStatus("anonymous");
    return serverRevoked;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      identity,
      error,
      login,
      logout,
      retryRestore,
    }),
    [status, identity, error, login, logout, retryRestore]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

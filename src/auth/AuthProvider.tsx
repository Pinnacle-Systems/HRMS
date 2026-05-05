import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiService } from "../services/api/api.config";
import * as authApi from "./authApi";
import { clearSession, loadSession, saveSession } from "./authSession";
import { AuthContext } from "./authContext";
import type {
  AuthContextValue,
  AuthSession,
  LoginOutcome,
  LoginRequest,
  SelectTenantRequest,
} from "./authTypes";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const isLoading = false;

  useEffect(() => {
    apiService.setAuthToken(session?.accessToken ?? null);
  }, [session?.accessToken]);

  const login = useCallback(
    async (request: LoginRequest): Promise<LoginOutcome> => {
      const outcome = await authApi.login(request);

      if (outcome.type === "authenticated") {
        setSession(outcome.session);
        apiService.setAuthToken(outcome.session.accessToken);
      }

      if (outcome.type === "mustChangePassword" && outcome.session) {
        setSession(outcome.session);
        apiService.setAuthToken(outcome.session.accessToken);
      }

      return outcome;
    },
    [],
  );

  const selectTenant = useCallback(
    async (request: SelectTenantRequest): Promise<LoginOutcome> => {
      const outcome = await authApi.selectTenant(request);

      if (outcome.type === "authenticated") {
        setSession(outcome.session);
        apiService.setAuthToken(outcome.session.accessToken);
      }

      if (outcome.type === "mustChangePassword" && outcome.session) {
        setSession(outcome.session);
        apiService.setAuthToken(outcome.session.accessToken);
      }

      return outcome;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshedSession = await authApi.refreshSession();

    if (refreshedSession) {
      setSession(refreshedSession);
      apiService.setAuthToken(refreshedSession.accessToken);
      return refreshedSession;
    }

    clearSession();
    setSession(null);
    apiService.setAuthToken(null);
    return null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session),
      login,
      selectTenant,
      logout,
      refreshSession,
    }),
    [isLoading, login, logout, refreshSession, selectTenant, session],
  );

  useEffect(() => {
    if (session) {
      saveSession(session);
    }
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

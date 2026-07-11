import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiService } from "../services/api/api.config";
import { logger } from "../utils/logger";
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
    logger.debug("Auth token updated on API service", {
      isAuthenticated: Boolean(session),
      userId: session?.user.userId,
      tenantId: session?.user.tenantId,
      roles: session?.user.roles,
    });
  }, [session]);

  const login = useCallback(
    async (request: LoginRequest): Promise<LoginOutcome> => {
      logger.info("Login started", {
        loginId: request.loginId,
        hasMobileNumber: Boolean(request.mobileNumber),
        tenantId: request.tenantId,
      });

      const outcome = await authApi.login(request);
      logger.info("Login completed", {
        outcome: outcome.type,
        userId: outcome.type === "authenticated" ? outcome.session.user.userId : undefined,
        roles: outcome.type === "authenticated" ? outcome.session.user.roles : undefined,
      });

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
      logger.info("Tenant selection started", { tenantId: request.tenantId });
      const outcome = await authApi.selectTenant(request);
      logger.info("Tenant selection completed", {
        tenantId: request.tenantId,
        outcome: outcome.type,
        userId: outcome.type === "authenticated" ? outcome.session.user.userId : undefined,
      });

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
    logger.info("Logout started", { userId: session?.user.userId });
    await authApi.logout();
    setSession(null);
    logger.info("Logout completed");
  }, [session?.user.userId]);

  const refreshSession = useCallback(async () => {
    logger.info("Session refresh started");
    const refreshedSession = await authApi.refreshSession();

    if (refreshedSession) {
      setSession(refreshedSession);
      apiService.setAuthToken(refreshedSession.accessToken);
      logger.info("Session refresh completed", {
        userId: refreshedSession.user.userId,
        tenantId: refreshedSession.user.tenantId,
        roles: refreshedSession.user.roles,
      });
      return refreshedSession;
    }

    clearSession();
    setSession(null);
    apiService.setAuthToken(null);
    logger.warn("Session refresh returned no session; cleared auth state");
    return null;
  }, []);

  const sendMobileOtp = useCallback(
  async (mobileNumber: string): Promise<LoginOutcome> => {
    logger.info("Sending mobile OTP", { mobileNumber });
    return authApi.sendMobileOtp(mobileNumber);
  },
  []
);

const verifyMobileOtp = useCallback(
  async (mobileNumber: string, otp: string): Promise<LoginOutcome> => {
    logger.info("Verifying mobile OTP", { mobileNumber });
    const outcome = await authApi.verifyMobileOtp(mobileNumber, otp);
    
    if (outcome.type === "authenticated") {
      setSession(outcome.session);
      apiService.setAuthToken(outcome.session.accessToken);
    }
    
    return outcome;
  },
  []
);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session),
      login,
      selectTenant,
      logout,
      refreshSession,
      sendMobileOtp,
      verifyMobileOtp
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
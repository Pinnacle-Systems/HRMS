import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiService } from "../services/api/api.config";
import { logger } from "../utils/logger";
import * as authApi from "./authApi";
import { clearSession, loadSession, saveSession } from "./authSession";
import { AuthContext } from "./authContext";
import type {
  AppRole,
  AuthContextValue,
  AuthSession,
  LoginOutcome,
  LoginRequest,
  Permission,
  SelectTenantRequest,
} from "./authTypes";

export const TOKEN_EXPIRY_EVENT = 'token-expiry-warning';

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

  //  const login = useCallback(
  //   async (request: LoginRequest): Promise<LoginOutcome> => {
  //       logger.info("Login started", {
  //       loginId: request.loginId,
  //       hasMobileNumber: Boolean(request.mobileNumber),
  //       tenantId: request.tenantId,
  //     });
  //     const outcome:any = await authApi.login(request);
  //      logger.info("Login completed", {
  //       outcome: outcome.type,
  //       userId: outcome.type === "authenticated" ? outcome.session.user.userId : undefined,
  //       roles: outcome.type === "authenticated" ? outcome.session.user.roles : undefined,
  //     });

  //     if (outcome.type === "authenticated" || 
  //         (outcome.type === "mustChangePassword" && outcome.session)) {
  //       setSession(outcome.session);
  //       apiService.setAuthToken(outcome.session.accessToken);
  //     }

  //     return outcome;
  //   },
  //   [],
  // );

  // const login = useCallback(
  //   async (request: LoginRequest): Promise<LoginOutcome> => {
  //     logger.info("Login started", {
  //       loginId: request.loginId,
  //       hasMobileNumber: Boolean(request.mobileNumber),
  //       tenantId: request.tenantId,
  //     });

  //     const outcome = await authApi.login(request);
  //     logger.info("Login completed", {
  //       outcome: outcome.type,
  //       userId: outcome.type === "authenticated" ? outcome.session.user.userId : undefined,
  //       roles: outcome.type === "authenticated" ? outcome.session.user.roles : undefined,
  //     });

  //     if (outcome.type === "authenticated") {
  //       setSession(outcome.session);
  //       apiService.setAuthToken(outcome.session.accessToken);
  //     }

  //     if (outcome.type === "mustChangePassword" && outcome.session) {
  //       setSession(outcome.session);
  //       apiService.setAuthToken(outcome.session.accessToken);
  //     }

  //     return outcome;
  //   },
  //   [],
  // );

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
        userId: outcome.type === "authenticated" ? outcome.session?.user.userId : undefined,
        roles: outcome.type === "authenticated" ? outcome.session?.user.roles : undefined,
      });

      if (outcome.type === "authenticated" && outcome.session) {
        setSession(outcome.session);
        apiService.setAuthToken(outcome.session.accessToken);
      } else if (outcome.type === "mustChangePassword" && outcome.session) {
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
      const previewOutcome: any = await authApi.selectTenant(request);
      logger.info("Tenant selection completed", {
        tenantId: request.tenantId,
        outcome: previewOutcome.type,
        userId: previewOutcome.type === "authenticated" ? previewOutcome.session.user.userId : undefined,
      });
      if (previewOutcome.type === 'failed') {
        return previewOutcome;
      }
      return previewOutcome;
    },
    [],
  );

  // const selectTenant = useCallback(
  //   async (request: SelectTenantRequest): Promise<LoginOutcome> => {
  //     logger.info("Tenant selection started", { tenantId: request.tenantId });
  //     const outcome = await authApi.selectTenant(request);
  //     logger.info("Tenant selection completed", {
  //       tenantId: request.tenantId,
  //       outcome: outcome.type,
  //       userId: outcome.type === "authenticated" ? outcome.session.user.userId : undefined,
  //     });

  //     if (outcome.type === "authenticated") {
  //       setSession(outcome.session);
  //       apiService.setAuthToken(outcome.session.accessToken);
  //     }

  //     if (outcome.type === "mustChangePassword" && outcome.session) {
  //       setSession(outcome.session);
  //       apiService.setAuthToken(outcome.session.accessToken);
  //     }

  //     return outcome;
  //   },
  //   [],
  // );

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
      const outcome: any = await authApi.verifyMobileOtp(mobileNumber, otp);

      if (outcome.type === "authenticated" ||
        (outcome.type === "mustChangePassword" && outcome.session)) {
        setSession(outcome.session);
        apiService.setAuthToken(outcome.session.accessToken);
      }

      return outcome;
    },
    []
  );

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!session?.user) return false;
    return session.user.permissions.includes(permission);
  }, [session]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!session?.user) return false;
    return permissions.some(permission => session.user.permissions.includes(permission));
  }, [session]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!session?.user) return false;
    return permissions.every(permission => session.user.permissions.includes(permission));
  }, [session]);

  const hasRole = useCallback((role: AppRole): boolean => {
    if (!session?.user) return false;
    return session.user.roles.includes(role);
  }, [session]);

  const hasAnyRole = useCallback((roles: AppRole[]): boolean => {
    if (!session?.user) return false;
    return roles.some(role => session.user.roles.includes(role));
  }, [session]);

  const setSessionCall = useCallback((newSession: AuthSession | null) => {
    setSession(newSession);
    if (newSession) {
      saveSession(newSession);
      apiService.setAuthToken(newSession.accessToken);
    } else {
      clearSession();
      apiService.setAuthToken(null);
    }
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
      sendMobileOtp,
      verifyMobileOtp,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      setSessionCall
    }),
    [isLoading, login, logout, refreshSession, selectTenant, session, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, setSessionCall],);

  // useEffect(() => {
  //   if (session) {
  //     saveSession(session);
  //   }
  // }, [session]);

  useEffect(() => {
    apiService.setAuthToken(session?.accessToken ?? null);
  }, [session]);

  useEffect(() => {
    let refreshTimer: any | null = null;
    let isMounted = true;

    const scheduleRefresh = (expiresInSeconds: number) => {
      // Clear any existing timer
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }

      // Refresh ~60 seconds before expiry
      const refreshMs = Math.max((expiresInSeconds - 60) * 1000, 5000);

      logger.debug(`Scheduling auto-refresh in ${Math.round(refreshMs / 1000)}s`);

      refreshTimer = setTimeout(async () => {
        if (!isMounted) return;

        logger.info("Auto-refreshing session before expiry");
        try {
          const newSession = await refreshSession();

          if (newSession && isMounted) {
            // Re-schedule for next cycle
            scheduleRefresh(newSession.expiresIn);
          } else if (isMounted) {
            logger.warn("Auto-refresh failed, logging out");
            await logout();
          }
        } catch (error) {
          logger.error("Auto-refresh error", { error });
          if (isMounted) {
            await logout();
          }
        }
      }, refreshMs);
    };

    if (session) {
      const timeUntilExpiry = session.expiresAt - Date.now();
      if (timeUntilExpiry > 0) {
        scheduleRefresh(session.expiresIn);
      } else {
        // Already expired - refresh now
        logger.warn("Session already expired, attempting immediate refresh");
        refreshSession().then(newSession => {
          if (newSession && isMounted) {
            setSession(newSession);
            apiService.setAuthToken(newSession.accessToken);
          } else if (isMounted) {
            logout();
          }
        });
      }
    }

    return () => {
      isMounted = false;
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    };
  }, [session, refreshSession, logout]);

  // useEffect(() => {
  //   const bootstrap = async () => {
  //     const storedSession = loadSession();
  //     if (storedSession) {
  //       // Check if token is close to expiry
  //       const timeUntilExpiry = storedSession.expiresAt - Date.now();
  //       const fiveMinutes = 5 * 60 * 1000;

  //       if (timeUntilExpiry < fiveMinutes) {
  //         // Refresh early
  //         await refreshSession();
  //       } else {
  //         setSession(storedSession);
  //       }
  //     }
  //   };

  //   bootstrap();
  // }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const storedSession = loadSession();
        if (storedSession && isMounted) {
          // Check if token is close to expiry
          const timeUntilExpiry = storedSession.expiresAt - Date.now();
          const fiveMinutes = 5 * 60 * 1000;

          if (timeUntilExpiry < fiveMinutes) {
            // Refresh early
            logger.info("Token close to expiry on bootstrap, refreshing");
            const newSession = await refreshSession();
            if (newSession && isMounted) {
              setSession(newSession);
              apiService.setAuthToken(newSession.accessToken);
            } else if (isMounted) {
              // Refresh failed, clear session
              clearSession();
              setSession(null);
              apiService.setAuthToken(null);
            }
          } else if (isMounted) {
            // Token is still valid
            setSession(storedSession);
            apiService.setAuthToken(storedSession.accessToken);
          }
        }
      } catch (error) {
        logger.error("Bootstrap auth failed", { error });
        if (isMounted) {
          clearSession();
          setSession(null);
          apiService.setAuthToken(null);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

   useEffect(() => {
    let checkInterval: any | null = null;
    
    if (session) {
      const checkTokenExpiry = () => {
        const timeUntilExpiry = session.expiresAt - Date.now();
        const secondsUntilExpiry = Math.floor(timeUntilExpiry / 1000);
        
        // Emit event at specific thresholds
        const thresholds = [300, 180, 120, 60, 30, 15, 10, 5];
        thresholds.forEach(threshold => {
          if (secondsUntilExpiry <= threshold && secondsUntilExpiry > threshold - 2) {
            // Dispatch custom event
            const event = new CustomEvent(TOKEN_EXPIRY_EVENT, {
              detail: {
                timeRemaining: secondsUntilExpiry,
                threshold,
                isCritical: threshold <= 60,
              }
            });
            window.dispatchEvent(event);
            
            logger.info(`Token expiry warning: ${secondsUntilExpiry}s remaining`);
          }
        });
      };

      // Check every second
      checkInterval = setInterval(checkTokenExpiry, 1000);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
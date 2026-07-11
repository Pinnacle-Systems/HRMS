import type { AuthContextValue, AuthSession, AppRole } from "../../src/auth/authTypes";

export const AUTH_STORAGE_KEY = "hrms.auth.session";

export function createMockAuthSession(
  overrides: Partial<AuthSession> = {},
): AuthSession {
  const roles = overrides.user?.roles ?? (["ADMIN"] as AppRole[]);

  return {
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    expiresAt: Date.now() + 3600 * 1000,
    ...overrides,
    user: {
      userId: "user-1",
      tenantId: "tenant-1",
      email: "admin@company.com",
      roles,
      rawRoles: roles,
      permissions: ["EMPLOYEE_READ"],
      ...overrides.user,
    },
  };
}

export function createAuthContextValue(
  session: AuthSession | null = createMockAuthSession(),
): AuthContextValue {
  return {
    session,
    isLoading: false,
    isAuthenticated: Boolean(session),
    login: async () => ({ type: "authenticated", session: session ?? createMockAuthSession() }),
    selectTenant: async () => ({
      type: "authenticated",
      session: session ?? createMockAuthSession(),
    }),
    logout: async () => undefined,
    refreshSession: async () => session,
    sendMobileOtp: async (_mobileNumber: string) => ({
      type: "authenticated",
      session: session ?? createMockAuthSession(),
    }),
    verifyMobileOtp: async (_mobileNumber: string, _otp: string) => ({
      type: "authenticated",
      session: session ?? createMockAuthSession(),
    }),
  };
}

export function seedAuthSession(session = createMockAuthSession()): AuthSession {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

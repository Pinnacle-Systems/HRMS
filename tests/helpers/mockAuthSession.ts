import type {
  AuthContextValue,
  AuthSession,
  AppRole,
  Permission,
} from "../../src/auth/authTypes";

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
    company: {
      companyId: "",
      companyName: "",
      logoUrl: "  ",
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
    login: async () => ({
      type: "authenticated",
      session: session ?? createMockAuthSession(),
    }),
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
    hasPermission: (permission: Permission) => {
      return session?.user?.permissions?.includes(permission) ?? false;
    },
    hasAnyPermission: (permissions: Permission[]) => {
      return permissions.some(p => 
        session?.user?.permissions?.includes(p) ?? false
      );
    },
    hasAllPermissions: (permissions: Permission[]) => {
      return permissions.every(p => 
        session?.user?.permissions?.includes(p) ?? false
      );
    },
    hasRole: (role: AppRole) => {
      return session?.user?.roles?.includes(role) ?? false;
    },
    hasAnyRole: (roles: AppRole[]) => {
      return roles.some(r => 
        session?.user?.roles?.includes(r) ?? false
      );
    },
  };
}

export function seedAuthSession(
  session = createMockAuthSession(),
): AuthSession {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

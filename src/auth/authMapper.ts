import type {
  AppRole,
  AuthResponse,
  AuthSession,
  AuthUser,
  LoginApiResponse,
  LoginOutcome,
  NavItem,
} from "./authTypes";

type JwtPayload = {
  roles?: string[];
  permissions?: string[];
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return {};
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(padded)) as JwtPayload;
  } catch {
    return {};
  }
}

export function parseJwtPermissions(token: string): string[] {
  const payload = decodeJwtPayload(token);
  return Array.isArray(payload.permissions) ? payload.permissions : [];
}

export function parseJwtRoles(token: string): string[] {
  const payload = decodeJwtPayload(token);
  return Array.isArray(payload.roles) ? payload.roles : [];
}

export function mapApiRoleToAppRole(role: string): AppRole {
  switch (role) {
    case "ADMIN":
      return "ADMIN";
    case "HR":
      return "HR";
    case "MANAGER":
      return "MANAGER";
    case "EMPLOYEE":
    case "ESS":
    default:
      return "EMPLOYEE";
  }
}

function uniqueRoles(roles: AppRole[]): AppRole[] {
  return Array.from(new Set(roles));
}

export function mapAuthResponseToSession(data: AuthResponse): AuthSession {
  if (!data.accessToken || !data.refreshToken) {
    throw new Error("Token response is incomplete");
  }

  const rawRoles = data.roles?.length
    ? data.roles
    : parseJwtRoles(data.accessToken);
  const roles = uniqueRoles(rawRoles.map(mapApiRoleToAppRole));
  const permissions = parseJwtPermissions(data.accessToken);

  const user: AuthUser = {
    userId: data.userId ?? "",
    tenantId: data.tenantId ?? "",
    email: data.email ?? "",
    roles,
    rawRoles,
    permissions,
  };

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenType: data.tokenType === "Bearer" ? "Bearer" : "Bearer",
    expiresIn: data.expiresIn ?? 0,
    expiresAt: Date.now() + (data.expiresIn ?? 0) * 1000,
    user,
  };
}

export function mapLoginResponseToOutcome(
  response: LoginApiResponse,
  loginId?: string,
): LoginOutcome {
  const data = response.data;

  if (!response.success || !data) {
    return {
      type: "failed",
      message: response.message || "Login failed",
    };
  }

  if (data.multiTenant && data.tenants?.length) {
    return {
      type: "tenantSelection",
      tenants: data.tenants,
      email: data.email || loginId || "",
    };
  }

  if (data.mfaRequired && data.sessionToken) {
    return {
      type: "mfaRequired",
      sessionToken: data.sessionToken,
      mfaType: data.mfaType,
    };
  }

  if (data.accessToken) {
    const session = mapAuthResponseToSession(data);

    if (data.mustChangePassword) {
      return {
        type: "mustChangePassword",
        session,
        email: data.email || loginId,
      };
    }

    return {
      type: "authenticated",
      session,
    };
  }

  if (data.mustChangePassword) {
    return {
      type: "mustChangePassword",
      email: data.email || loginId,
    };
  }

  return {
    type: "failed",
    message: response.message || "Unable to start your session",
  };
}

export function getDefaultRoute(user: AuthUser): string {
  if (user.roles.includes("ADMIN")) return "/admin/dashboard";
  if (user.roles.includes("HR")) return "/hr/dashboard";
  if (user.roles.includes("MANAGER")) return "/manager/dashboard";
  if (user.roles.includes("EMPLOYEE")) return "/employee/dashboard";

  return "/unauthorized";
}

export function getWorkspaceLabel(user: AuthUser): string {
  if (user.roles.includes("ADMIN")) return "Admin Console";
  if (user.roles.includes("HR")) return "HR Workspace";
  if (user.roles.includes("MANAGER")) return "Manager Workspace";

  return "Employee Portal";
}

export function canShowNavItem(user: AuthUser, item: NavItem): boolean {
  const roleAllowed = item.roles.some((role) => user.roles.includes(role));
  const hasPermissions = user.permissions.length > 0;
  const permissionAllowed =
    !item.permissions?.length ||
    !hasPermissions ||
    item.permissions.every((permission) =>
      user.permissions.includes(permission),
    );

  return roleAllowed && permissionAllowed;
}

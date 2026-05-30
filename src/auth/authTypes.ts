import type { ReactNode } from "react";

export type ApiRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE" | "ESS" | string;

export type AppRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export type TenantInfo = {
  id: string;
  name: string;
  subdomain?: string;
};

export type AuthUser = {
  userId: string;
  tenantId: string;
  email: string;
  roles: AppRole[];
  rawRoles: string[];
  permissions: string[];
  profilePic?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  expiresAt: number;
  user: AuthUser;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
};

export type LoginRequest = {
  loginId?: string;
  password?: string;
  mobileNumber?: string;
  mobileOtp?: string;
  tenantId?: string;
};

export type SelectTenantRequest = {
  tenantId: string;
  sessionToken: string;
};

export type UserProfile = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  biography?: string;
  profilePicUrl?: string;
  mfaEnabled?: boolean;
  emailVerified?: boolean;
  roles?: string[];
  permissions?: string[];
  createdAt?: string;
};

export type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
  tenantId?: string;
  email?: string;
  roles?: string[];
  mfaRequired?: boolean;
  mfaType?: string;
  sessionToken?: string;
  multiTenant?: boolean;
  tenants?: TenantInfo[];
  mustChangePassword?: boolean;
  passwordExpiringSoon?: boolean;
  daysUntilPasswordExpiry?: number;
  profile?: UserProfile;
};

export type LoginApiResponse = ApiResponse<AuthResponse>;

export type LoginOutcome =
  | { type: "authenticated"; session: AuthSession }
  | { type: "mfaRequired"; sessionToken: string; mfaType?: string }
  | {
      type: "tenantSelection";
      tenants: TenantInfo[];
      email: string;
      sessionToken?: string;
    }
  | { type: "mustChangePassword"; session?: AuthSession; email?: string }
  | { type: "failed"; message: string };

export type NavItem = {
  text: string;
  path: string;
  icon: ReactNode;
  roles: AppRole[];
  permissions?: string[];
  children?: {
    text: string;
    // icon: React.ReactNode;
    path: string;
  }[];
};

export type ProtectedRouteProps = {
  children?: ReactNode;
  allowedRoles?: AppRole[];
  requiredPermissions?: string[];
};

export type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<LoginOutcome>;
  selectTenant: (request: SelectTenantRequest) => Promise<LoginOutcome>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
};

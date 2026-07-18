import type { ReactNode } from "react";

export type ApiRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE" | "ESS" | string;

export type AppRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export type Permission =
  | "EMPLOYEE_READ"
  | "EMPLOYEE_WRITE"
  | "EMPLOYEE_DELETE"
  | "EMPLOYEE_UPLOAD"
  | "PAYROLL_READ"
  | "PAYROLL_WRITE"
  | "REPORT_READ"
  | "REPORT_EXPORT"
  | "PROFILE_READ"
  | "PROFILE_WRITE"
  | "USER_MANAGE"
  | "ATTENDANCE_READ"
  | "ATTENDANCE_WRITE"
  | "SETTINGS_READ"
  | "SETTINGS_WRITE"
  | "POLICY_READ"
  | "POLICY_WRITE"
  | "LEAVE_READ"
  | "LEAVE_WRITE"
  | "LEAVE_APPROVE"
  | "ROLE_MANAGE";

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

export type CompanyDetails = {
  companyId: string;
  companyName: string;
  logoUrl: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  expiresAt: number;
  user: AuthUser;
  company: CompanyDetails;
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
  sessionToken?: string;
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
  type: string;
};

export type MfaVerifyRequest = {
  sessionToken: string;
  code: string;
};

export type MfaSetupRequest = {
  mfaType: string;
  phoneNumber?: string;
};

export type MfaEnableRequest = {
  code: string;
  mfaType: string;
};

export type PasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type SetPasswordRequest = {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
};

export type ActivateInviteRequest = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type SignupRequest = {
  firstName: string;
  lastName: string;
  phone: string;
  loginUrl?: string;
  loginId: string;
  password: string;
  companyName: string;
  subdomain: string;
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
  department: string;
  designation: string;
  hireDate: string;
  mfaType: string;
};

export type ProfilePictureResponse = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profilePicUrl?: string;
  roles?: string[];
  permissions?: string[];
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
  mfaSetupRequired?: boolean;
  companyId?: string;
  companyName?: string;
  logoUrl?: string;
};

export type LoginApiResponse = ApiResponse<AuthResponse>;

// export type LoginOutcome =
//   | { type: "authenticated"; session: AuthSession }
//   | { type: "mfaRequired"; sessionToken: string; mfaType?: string }
//   | {
//       type: "tenantSelection";
//       tenants: TenantInfo[];
//       email: string;
//       sessionToken?: string;
//     }
//   | { type: "mustChangePassword"; session?: AuthSession; email?: string }
//   | { type: "failed"; message: string };

export interface LoginOutcome {
  type:
    | "authenticated"
    | "mfaRequired"
    | "tenantSelection"
    | "mustChangePassword"
    | "failed";
  session?: AuthSession;
  sessionToken?: string;
  mfaType?: string;
  tenants?: TenantInfo[];
  email?: string;
  message?: string;
  mfaSetupRequired?: boolean;
}

// export type LoginOutcome =
//   | { type: "authenticated"; session: AuthSession; mfaSetupRequired?: boolean }
//   | { type: "mfaRequired"; sessionToken: string; mfaType?: string }
//   | { type: "tenantSelection"; tenants: TenantInfo[]; email: string; sessionToken?: string }
//   | { type: "mustChangePassword"; session?: AuthSession; email?: string }
//   | { type: "failed"; essage: string };

export type NavItem = {
  text: string;
  path: string;
  icon: ReactNode;
  roles: AppRole[];
  permissions?: Permission[];
  isPayroll?: boolean;
  children?: {
    text: string;
    // icon: React.ReactNode;
    path: string;
  }[];
};

export type ProtectedRouteProps = {
  children?: ReactNode;
  allowedRoles?: AppRole[];
  requiredPermissions?: Permission[];
  permissionMode?: "any" | "all";
};

export type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<LoginOutcome>;
  selectTenant: (request: SelectTenantRequest) => Promise<LoginOutcome>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
  sendMobileOtp: (mobileNumber: string) => Promise<LoginOutcome>;
  verifyMobileOtp: (mobileNumber: string, otp: string) => Promise<LoginOutcome>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
};

export type MfaSetupResponse = {
  qrCode?: string;
  secret?: string;
  phoneNumber?: string;
  mfaType: string;
};

import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface PasswordPolicyRequest extends Record<string, unknown> {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
  passwordExpiryDays: number;
  expiryReminderDays: number;
  maxInvalidLoginAttempts: number;
  welcomePasswordExpiryDays: number;
  requireMfa: boolean;
}

export interface PasswordPolicyResponse extends PasswordPolicyRequest {
  id?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetPasswordPolicyParams {
  tenantId?: string;
  userId?: string;
  email?: string;
  password?: string;
  active?: boolean;
  roles?: string[];
  permissions?: string[];
}

const PASSWORD_POLICY_FIELDS: Array<keyof PasswordPolicyRequest> = [
  "minPasswordLength",
  "requireUppercase",
  "requireLowercase",
  "requireDigit",
  "requireSpecialChar",
  "passwordExpiryDays",
  "expiryReminderDays",
  "maxInvalidLoginAttempts",
  "welcomePasswordExpiryDays",
  "requireMfa",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizePasswordPolicy(value: unknown): PasswordPolicyResponse {
  const candidate =
    isRecord(value) && isRecord(value.data) ? value.data : value;

  if (!isRecord(candidate)) {
    throw new Error("Invalid password policy response");
  }

  return {
    id: typeof candidate.id === 'string' ? candidate.id : undefined,
    tenantId: typeof candidate.tenantId === 'string' ? candidate.tenantId : undefined,
    minPasswordLength: Number(candidate.minPasswordLength) || 8,
    requireUppercase: Boolean(candidate.requireUppercase),
    requireLowercase: Boolean(candidate.requireLowercase),
    requireDigit: Boolean(candidate.requireDigit),
    requireSpecialChar: Boolean(candidate.requireSpecialChar),
    passwordExpiryDays: Number(candidate.passwordExpiryDays) || 1,
    expiryReminderDays: Number(candidate.expiryReminderDays) || 1,
    maxInvalidLoginAttempts: Number(candidate.maxInvalidLoginAttempts) || 1,
    welcomePasswordExpiryDays: Number(candidate.welcomePasswordExpiryDays) || 1,
    requireMfa: Boolean(candidate.requireMfa),
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : undefined,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
  };
}

export function toPasswordPolicyRequest(
  payload: Partial<PasswordPolicyRequest>,
): Partial<PasswordPolicyRequest> {
  return PASSWORD_POLICY_FIELDS.reduce<Partial<PasswordPolicyRequest>>(
    (result, field) => ({
      ...result,
      [field]: payload[field],
    }),
    {}
  );
}

class PasswordPolicyService {
  /**
   * Get a tenant's password policy (public — read-only)
   * Supports query params for tenant resolution
   */
  async getPasswordPolicy(
    params?: GetPasswordPolicyParams
  ): Promise<PasswordPolicyResponse> {
    try {
      const response = await apiService.get<unknown>(
        API_ENDPOINTS.PASSWORD_POLICY.BASE,
        { params }
      );
      return normalizePasswordPolicy(response);
    } catch (error) {
      console.error("Failed to fetch password policy:", error);
      // Return default policy instead of throwing
      return {
        minPasswordLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSpecialChar: true,
        passwordExpiryDays: 90,
        expiryReminderDays: 7,
        maxInvalidLoginAttempts: 5,
        welcomePasswordExpiryDays: 7,
        requireMfa: false,
      };
    }
  }

  /**
   * Update password policy (ADMIN only)
   */
  async updatePasswordPolicy(
    payload: PasswordPolicyRequest,
  ): Promise<PasswordPolicyResponse> {
    const response = await apiService.put(
      API_ENDPOINTS.PASSWORD_POLICY.BASE,
      toPasswordPolicyRequest(payload),
    );
    return normalizePasswordPolicy(response);
  }

  /**
   * Check if a password meets the current policy requirements
   */
  async validatePassword(password: string, params?: GetPasswordPolicyParams): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    try {
      const policy = await this.getPasswordPolicy(params);
      const errors: string[] = [];

      if (password.length < policy.minPasswordLength) {
        errors.push(`Password must be at least ${policy.minPasswordLength} characters long`);
      }

      if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
      }

      if (policy.requireLowercase && !/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
      }

      if (policy.requireDigit && !/\d/.test(password)) {
        errors.push("Password must contain at least one number");
      }

      if (policy.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Unable to validate password policy. Please try again."],
      };
    }
  }

  /**
   * Get password requirements as a human-readable list
   */
  async getPasswordRequirements(params?: GetPasswordPolicyParams): Promise<string[]> {
    try {
      const policy = await this.getPasswordPolicy(params);
      const requirements: string[] = [];

      requirements.push(`At least ${policy.minPasswordLength} characters`);

      if (policy.requireUppercase) {
        requirements.push("Contains uppercase letter (A-Z)");
      }

      if (policy.requireLowercase) {
        requirements.push("Contains lowercase letter (a-z)");
      }

      if (policy.requireDigit) {
        requirements.push("Contains number (0-9)");
      }

      if (policy.requireSpecialChar) {
        requirements.push("Contains special character (!@#$%^&*(),.?\":{}|<>)");
      }

      return requirements;
    } catch (error) {
      return [
        "At least 8 characters",
        "Contains uppercase letter (A-Z)",
        "Contains lowercase letter (a-z)",
        "Contains number (0-9)",
        "Contains special character (!@#$%^&*(),.?\":{}|<>)",
      ];
    }
  }
}

export const passwordPolicyService = new PasswordPolicyService();
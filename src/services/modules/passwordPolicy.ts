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

export type PasswordPolicyResponse = PasswordPolicyRequest;

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
    minPasswordLength: Number(candidate.minPasswordLength),
    requireUppercase: Boolean(candidate.requireUppercase),
    requireLowercase: Boolean(candidate.requireLowercase),
    requireDigit: Boolean(candidate.requireDigit),
    requireSpecialChar: Boolean(candidate.requireSpecialChar),
    passwordExpiryDays: Number(candidate.passwordExpiryDays),
    expiryReminderDays: Number(candidate.expiryReminderDays),
    maxInvalidLoginAttempts: Number(candidate.maxInvalidLoginAttempts),
    welcomePasswordExpiryDays: Number(candidate.welcomePasswordExpiryDays),
    requireMfa: Boolean(candidate.requireMfa),
  };
}

export function toPasswordPolicyRequest(
  payload: PasswordPolicyRequest,
): PasswordPolicyRequest {
  return PASSWORD_POLICY_FIELDS.reduce<PasswordPolicyRequest>(
    (result, field) => ({
      ...result,
      [field]: payload[field],
    }),
    {
      minPasswordLength: payload.minPasswordLength,
      requireUppercase: payload.requireUppercase,
      requireLowercase: payload.requireLowercase,
      requireDigit: payload.requireDigit,
      requireSpecialChar: payload.requireSpecialChar,
      passwordExpiryDays: payload.passwordExpiryDays,
      expiryReminderDays: payload.expiryReminderDays,
      maxInvalidLoginAttempts: payload.maxInvalidLoginAttempts,
      welcomePasswordExpiryDays: payload.welcomePasswordExpiryDays,
      requireMfa: payload.requireMfa,
    },
  );
}

class PasswordPolicyService {
  async getPasswordPolicy(): Promise<PasswordPolicyResponse> {
    const response = await apiService.get<unknown>(API_ENDPOINTS.PASSWORD_POLICY.BASE);
    return normalizePasswordPolicy(response);
  }

  async updatePasswordPolicy(
    payload: PasswordPolicyRequest,
  ): Promise<PasswordPolicyResponse> {
    const response = await apiService.put(
      API_ENDPOINTS.PASSWORD_POLICY.BASE,
      toPasswordPolicyRequest(payload),
    );
    return normalizePasswordPolicy(response);
  }
}

export const passwordPolicyService = new PasswordPolicyService();

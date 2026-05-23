import type { PasswordPolicyResponse } from "../services/modules/passwordPolicy";

export const FALLBACK_PASSWORD_POLICY: PasswordPolicyResponse = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: false,
  passwordExpiryDays: 90,
  expiryReminderDays: 7,
  maxInvalidLoginAttempts: 5,
  welcomePasswordExpiryDays: 7,
  requireMfa: false,
};

export function validatePasswordAgainstPolicy(
  password: string,
  policy: PasswordPolicyResponse,
): string[] {
  const messages: string[] = [];

  if (password.length < policy.minPasswordLength) {
    messages.push(
      `Password must be at least ${policy.minPasswordLength} characters long.`,
    );
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    messages.push("Password must include at least one uppercase letter.");
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    messages.push("Password must include at least one lowercase letter.");
  }

  if (policy.requireDigit && !/\d/.test(password)) {
    messages.push("Password must include at least one number.");
  }

  if (policy.requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
    messages.push("Password must include at least one special character.");
  }

  return messages;
}

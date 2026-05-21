import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet, apiPut } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: apiGet,
    put: apiPut,
  },
}));

describe("passwordPolicyService", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPut.mockReset();
  });

  it("uses the password-policy GET path", async () => {
    apiGet.mockResolvedValue({
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
    });

    const { passwordPolicyService } = await import(
      "../../src/services/modules/passwordPolicy"
    );
    await passwordPolicyService.getPasswordPolicy();

    expect(apiGet).toHaveBeenCalledWith("/password-policy");
  });

  it("sends all supported password-policy fields in the PUT body", async () => {
    const payload = {
      minPasswordLength: 12,
      requireUppercase: true,
      requireLowercase: false,
      requireDigit: true,
      requireSpecialChar: true,
      passwordExpiryDays: 60,
      expiryReminderDays: 10,
      maxInvalidLoginAttempts: 4,
      welcomePasswordExpiryDays: 3,
      requireMfa: true,
    };
    apiPut.mockResolvedValue(payload);

    const { passwordPolicyService } = await import(
      "../../src/services/modules/passwordPolicy"
    );
    await passwordPolicyService.updatePasswordPolicy(payload);

    expect(apiPut).toHaveBeenCalledWith("/password-policy", payload);
  });

  it("does not send unsafe auth-context query params", async () => {
    const payload = {
      minPasswordLength: 10,
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
    apiPut.mockResolvedValue(payload);

    const { passwordPolicyService } = await import(
      "../../src/services/modules/passwordPolicy"
    );
    await passwordPolicyService.updatePasswordPolicy(payload);

    expect(apiPut).toHaveBeenCalledTimes(1);
    expect(apiPut.mock.calls[0]).toHaveLength(2);
    expect(apiPut.mock.calls[0][1]).not.toHaveProperty("userId");
    expect(apiPut.mock.calls[0][1]).not.toHaveProperty("tenantId");
    expect(apiPut.mock.calls[0][1]).not.toHaveProperty("email");
    expect(apiPut.mock.calls[0][1]).not.toHaveProperty("password");
    expect(apiPut.mock.calls[0][1]).not.toHaveProperty("roles");
    expect(apiPut.mock.calls[0][1]).not.toHaveProperty("permissions");
  });
});

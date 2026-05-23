import { describe, expect, it } from "vitest";
import {
  FALLBACK_PASSWORD_POLICY,
  validatePasswordAgainstPolicy,
} from "../../src/utils/passwordPolicyValidation";

describe("validatePasswordAgainstPolicy", () => {
  it("reports minimum length failures", () => {
    expect(validatePasswordAgainstPolicy("Aa1", FALLBACK_PASSWORD_POLICY)).toContain(
      "Password must be at least 8 characters long.",
    );
  });

  it("reports missing uppercase", () => {
    expect(
      validatePasswordAgainstPolicy("lowercase1", FALLBACK_PASSWORD_POLICY),
    ).toContain("Password must include at least one uppercase letter.");
  });

  it("reports missing lowercase", () => {
    expect(
      validatePasswordAgainstPolicy("UPPERCASE1", FALLBACK_PASSWORD_POLICY),
    ).toContain("Password must include at least one lowercase letter.");
  });

  it("reports missing digit", () => {
    expect(
      validatePasswordAgainstPolicy("NoDigitHere", FALLBACK_PASSWORD_POLICY),
    ).toContain("Password must include at least one number.");
  });

  it("reports missing special character when required", () => {
    expect(
      validatePasswordAgainstPolicy("ValidPass1", {
        ...FALLBACK_PASSWORD_POLICY,
        requireSpecialChar: true,
      }),
    ).toContain("Password must include at least one special character.");
  });

  it("reports multiple failures", () => {
    const messages = validatePasswordAgainstPolicy("abc", {
      ...FALLBACK_PASSWORD_POLICY,
      requireSpecialChar: true,
    });

    expect(messages).toEqual([
      "Password must be at least 8 characters long.",
      "Password must include at least one uppercase letter.",
      "Password must include at least one number.",
      "Password must include at least one special character.",
    ]);
  });

  it("returns no messages for a valid password", () => {
    expect(
      validatePasswordAgainstPolicy("ValidPass1!", {
        ...FALLBACK_PASSWORD_POLICY,
        requireSpecialChar: true,
      }),
    ).toEqual([]);
  });
});

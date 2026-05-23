import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPassword from "../../src/pages/auth/ResetPassword/ResetPassword";
import { renderWithProviders } from "../helpers/render";

const { resetPassword, getPasswordPolicy } = vi.hoisted(() => ({
  resetPassword: vi.fn(),
  getPasswordPolicy: vi.fn(),
}));

vi.mock("../../src/services/modules/auth", () => ({
  authService: {
    resetPassword,
  },
}));

vi.mock("../../src/services/modules/passwordPolicy", () => ({
  passwordPolicyService: {
    getPasswordPolicy,
  },
}));

describe("ResetPassword policy validation", () => {
  beforeEach(() => {
    resetPassword.mockReset();
    getPasswordPolicy.mockReset();
    getPasswordPolicy.mockResolvedValue({
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
    });
  });

  it("renders guidance from the fetched password policy", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPassword />, { route: "/reset-password" });

    await user.type(screen.getByPlaceholderText(/enter new password/i), "ValidPass1");

    expect(
      await screen.findByText(
        "Password must include at least one special character.",
      ),
    ).toBeInTheDocument();
  });
});

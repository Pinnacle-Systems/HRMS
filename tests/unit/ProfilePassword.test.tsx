import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "../../src/pages/myProfile/myprofile";
import { renderWithProviders } from "../helpers/render";

const { getProfile, getLoginHistory, changePassword, getPasswordPolicy } =
  vi.hoisted(() => ({
    getProfile: vi.fn(),
    getLoginHistory: vi.fn(),
    changePassword: vi.fn(),
    getPasswordPolicy: vi.fn(),
  }));

vi.mock("../../src/services/modules/auth", () => ({
  authService: {
    getProfile,
    getLoginHistory,
    changePassword,
    uploadProfilePicture: vi.fn(),
  },
}));

vi.mock("../../src/services/modules/passwordPolicy", () => ({
  passwordPolicyService: {
    getPasswordPolicy,
  },
}));

describe("Profile change password validation", () => {
  beforeEach(() => {
    getProfile.mockReset();
    getLoginHistory.mockReset();
    changePassword.mockReset();
    getPasswordPolicy.mockReset();
    getProfile.mockResolvedValue({ success: true, data: {} });
    getLoginHistory.mockResolvedValue({ success: true, data: [] });
    getPasswordPolicy.mockResolvedValue({
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
    changePassword.mockResolvedValue({ success: true, message: "Updated" });
  });

  it("allows an 8-character password that satisfies policy", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);

    await user.click(await screen.findByRole("button", { name: /change password/i }));
    await waitFor(() => expect(getPasswordPolicy).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: "OldPass1" },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "Abcdefg1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "Abcdefg1" },
    });

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => expect(changePassword).toHaveBeenCalledTimes(1));
  });
});

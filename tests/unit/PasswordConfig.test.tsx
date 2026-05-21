import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PasswordConfig from "../../src/pages/settings/general/passwordConfig";
import { renderWithProviders } from "../helpers/render";

const { getPasswordPolicy, updatePasswordPolicy } = vi.hoisted(() => ({
  getPasswordPolicy: vi.fn(),
  updatePasswordPolicy: vi.fn(),
}));

vi.mock("../../src/services/modules/passwordPolicy", () => ({
  passwordPolicyService: {
    getPasswordPolicy,
    updatePasswordPolicy,
  },
}));

const policy = {
  minPasswordLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: false,
  requireSpecialChar: true,
  passwordExpiryDays: 60,
  expiryReminderDays: 5,
  maxInvalidLoginAttempts: 4,
  welcomePasswordExpiryDays: 2,
  requireMfa: false,
};

describe("PasswordConfig", () => {
  beforeEach(() => {
    getPasswordPolicy.mockReset();
    updatePasswordPolicy.mockReset();
    getPasswordPolicy.mockResolvedValue(policy);
    updatePasswordPolicy.mockImplementation((payload) => Promise.resolve(payload));
  });

  it("loads and displays the policy", async () => {
    renderWithProviders(<PasswordConfig />);

    expect(await screen.findByDisplayValue("12")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });

  it("toggles complexity fields and saves the mapped body", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PasswordConfig />);

    await screen.findByDisplayValue("12");
    await user.click(screen.getByLabelText(/require numbers/i));
    await user.click(screen.getByLabelText(/enable two-factor authentication/i));
    await user.click(screen.getByRole("button", { name: /save password policy/i }));

    await waitFor(() => expect(updatePasswordPolicy).toHaveBeenCalledTimes(1));
    expect(updatePasswordPolicy).toHaveBeenCalledWith({
      ...policy,
      requireDigit: true,
      requireMfa: true,
    });
    expect(
      await screen.findByText(/password policy saved successfully/i),
    ).toBeInTheDocument();
  });

  it("validates numeric constraints before saving", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PasswordConfig />);

    const minLength = await screen.findByLabelText(/minimum password length/i);
    fireEvent.change(minLength, { target: { value: "0" } });
    await user.click(screen.getByRole("button", { name: /save password policy/i }));

    expect(updatePasswordPolicy).not.toHaveBeenCalled();
    expect(
      screen.getByText(/minimum password length should be positive/i),
    ).toBeInTheDocument();
  });

  it("shows fetch and save error states", async () => {
    getPasswordPolicy.mockRejectedValueOnce(new Error("Fetch failed"));
    renderWithProviders(<PasswordConfig />);

    expect(await screen.findByText("Fetch failed")).toBeInTheDocument();

    updatePasswordPolicy.mockRejectedValueOnce(new Error("Save failed"));
    await userEvent.click(
      screen.getByRole("button", { name: /save password policy/i }),
    );

    expect(await screen.findByText("Save failed")).toBeInTheDocument();
  });
});

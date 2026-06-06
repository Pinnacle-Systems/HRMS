import "@testing-library/jest-dom/vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../helpers/render";
import Profile from "../../src/pages/myProfile/myprofile";

// --------------- DatePicker stub ---------------
vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ label }: { label?: string }) => (
    <input aria-label={label ?? "date-picker"} placeholder={label} />
  ),
}));
vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class {},
}));

// --------------- service mocks ---------------
vi.mock("../../src/services/modules/auth", () => ({
  authService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    getLoginHistory: vi.fn(),
    clearLoginHistory: vi.fn(),
    clearLoginHistoryOlderThan: vi.fn(),
    uploadProfilePicture: vi.fn(),
  },
}));

vi.mock("../../src/services/modules/passwordPolicy", () => ({
  passwordPolicyService: {
    getPasswordPolicy: vi.fn().mockResolvedValue({
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
    }),
  },
}));

vi.mock("../../src/utils/dateFormatter", () => ({
  formatDateTime: (v: string) => v ?? "-",
}));

// --------------- fixtures ---------------
const mockProfile = {
  firstName: "Alice",
  lastName: "Johnson",
  email: "alice@example.com",
  phone: "9876543210",
  department: "Engineering",
  designation: "Software Engineer",
  hire_date: "2023-01-15",
  roles: ["Admin"],
  profilePicUrl: "",
};

const mockLoginHistory = [
  {
    id: "lh-1",
    browser: "Chrome",
    deviceType: "desktop",
    ipAddress: "192.168.1.1",
    os: "Windows",
    userAgent: "Mozilla/5.0 Chrome/120",
    status: "SUCCESS",
    createdAt: "2024-01-15T10:00:00Z",
    failureReason: null,
  },
  {
    id: "lh-2",
    browser: "Firefox",
    deviceType: "mobile",
    ipAddress: "192.168.1.2",
    os: "Android",
    userAgent: "Mozilla/5.0 Firefox/121",
    status: "FAILED",
    createdAt: "2024-01-14T09:00:00Z",
    failureReason: "Invalid credentials",
  },
];

async function setupMocks() {
  const { authService } = await import("../../src/services/modules/auth");
  vi.mocked(authService.getProfile).mockResolvedValue({
    success: true,
    data: mockProfile,
  } as any);
  vi.mocked(authService.getLoginHistory).mockResolvedValue({
    success: true,
    data: { content: mockLoginHistory, totalElements: 2 },
  } as any);
  vi.mocked(authService.updateProfile).mockResolvedValue({
    success: true,
    data: mockProfile,
    message: "Profile updated successfully",
  } as any);
  vi.mocked(authService.changePassword).mockResolvedValue({
    success: true,
    message: "Password changed successfully",
  } as any);
  vi.mocked(authService.clearLoginHistory).mockResolvedValue({} as any);
  vi.mocked(authService.clearLoginHistoryOlderThan).mockResolvedValue({} as any);
}

// --------------- tests ---------------
describe("Profile — rendering", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("renders without crashing", async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it("renders two tabs: Profile Info and Login History", async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /profile info/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /login history/i })).toBeInTheDocument();
    });
  });

  it("has Profile Info tab selected by default", async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /profile info/i })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
  });

  it("shows Personal Information section heading", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText(/personal information/i)).toBeInTheDocument();
  });

  it("shows Employment Information section heading", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText(/employment information/i)).toBeInTheDocument();
  });

  it("renders Edit Info button", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByRole("button", { name: /edit info/i })).toBeInTheDocument();
  });

  it("renders Change Password button", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByRole("button", { name: /change password/i })).toBeInTheDocument();
  });
});

describe("Profile — API contract", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("calls getProfile on mount", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    renderWithProviders(<Profile />);
    await waitFor(() => {
      expect(vi.mocked(authService.getProfile)).toHaveBeenCalled();
    });
  });

  it("calls getLoginHistory on mount with pagination params", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    renderWithProviders(<Profile />);
    await waitFor(() => {
      expect(vi.mocked(authService.getLoginHistory)).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0 })
      );
    });
  });
});

describe("Profile — profile data display", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("displays the user's first name", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("displays the user's last name", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText("Johnson")).toBeInTheDocument();
  });

  it("displays the user's email address", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
  });

  it("displays the user's phone number", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText("9876543210")).toBeInTheDocument();
  });

  it("displays the user's department in employment info", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText("Engineering")).toBeInTheDocument();
  });

  it("displays the user's designation in employment info", async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText("Software Engineer")).toBeInTheDocument();
  });

  it("shows N/A for missing fields", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    vi.mocked(authService.getProfile).mockResolvedValue({
      success: true,
      data: { ...mockProfile, phone: "" },
    } as any);
    renderWithProviders(<Profile />);
    await screen.findByText("alice@example.com");
    const naItems = screen.getAllByText("N/A");
    expect(naItems.length).toBeGreaterThan(0);
  });
});

describe("Profile — tab navigation", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("switches to Login History tab on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));

    expect(screen.getByRole("tab", { name: /login history/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("Login History tab shows the table headers", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));

    expect(await screen.findByText("Browser")).toBeInTheDocument();
    expect(await screen.findByText("IP Address")).toBeInTheDocument();
    expect(await screen.findByText("User Agent")).toBeInTheDocument();
    expect(await screen.findByText("Status")).toBeInTheDocument();
  });
});

describe("Profile — edit profile dialog", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("opens edit dialog when Edit Info is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByRole("button", { name: /edit info/i });

    await user.click(screen.getByRole("button", { name: /edit info/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(await screen.findByText(/edit profile information/i)).toBeInTheDocument();
  });

  it("dialog contains Update Profile button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /edit info/i }));
    expect(await screen.findByRole("button", { name: /update profile/i })).toBeInTheDocument();
  });

  it("closes edit dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /edit info/i }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText(/edit profile information/i)).not.toBeInTheDocument();
    });
  });

  it("calls updateProfile when Update Profile is clicked", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /edit info/i }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: /update profile/i }));

    await waitFor(() => {
      expect(vi.mocked(authService.updateProfile)).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: "Alice", lastName: "Johnson" })
      );
    });
  });
});

describe("Profile — change password dialog", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("opens password dialog when Change Password is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /change password/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(await screen.findByLabelText(/current password/i)).toBeInTheDocument();
  });

  it("dialog contains Current, New, and Confirm password fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /change password/i }));
    await screen.findByRole("dialog");

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it("closes password dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /change password/i }));
    await screen.findByRole("dialog");

    const cancelBtn = screen.getAllByRole("button", { name: /cancel/i })[0];
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
    });
  });

  it("does not call changePassword when new passwords do not match", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /change password/i }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "oldPass123" } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: "newPass123" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "different99" } });

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(vi.mocked(authService.changePassword)).not.toHaveBeenCalled();
    });
  });

  it("does not call changePassword when password is too short (less than 9 chars)", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /change password/i }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "old1234" } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "short" } });

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(vi.mocked(authService.changePassword)).not.toHaveBeenCalled();
    });
  });

  it("calls changePassword when passwords match and are long enough", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /change password/i }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "OldPass123" } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: "NewPass456!" } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: "NewPass456!" } });

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(vi.mocked(authService.changePassword)).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPassword: "OldPass123",
          newPassword: "NewPass456!",
          confirmPassword: "NewPass456!",
        })
      );
    });
  });

  it("toggles current password visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await user.click(await screen.findByRole("button", { name: /change password/i }));
    await screen.findByRole("dialog");

    const passwordInput = screen.getByLabelText(/current password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    // VisibilityOff icon is the first visibility toggle
    const visibilityBtns = screen.getAllByTestId("VisibilityOffIcon");
    await user.click(visibilityBtns[0].closest("button")!);

    expect(passwordInput).toHaveAttribute("type", "text");
  });
});

describe("Profile — login history tab", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("shows login history rows after switching to Login History tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));

    expect(await screen.findByText("Chrome")).toBeInTheDocument();
    expect(await screen.findByText("Firefox")).toBeInTheDocument();
  });

  it("shows IP addresses in the history table", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));

    expect(await screen.findByText("192.168.1.1")).toBeInTheDocument();
    expect(await screen.findByText("192.168.1.2")).toBeInTheDocument();
  });

  it("renders a success icon for SUCCESS status rows", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));
    await screen.findByText("Chrome");

    expect(screen.getByTestId("CheckCircleRoundedIcon")).toBeInTheDocument();
  });

  it("renders an error icon for FAILED status rows", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));
    await screen.findByText("Chrome");

    expect(screen.getByTestId("ErrorRoundedIcon")).toBeInTheDocument();
  });

  it("shows 'No login history available' when history is empty", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    vi.mocked(authService.getLoginHistory).mockResolvedValue({
      success: true,
      data: { content: [], totalElements: 0 },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));

    expect(await screen.findByText(/no login history available/i)).toBeInTheDocument();
  });

  it("shows Clear All button when login history is present", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));

    expect(await screen.findByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  it("shows 'Clear Older Than' button when history is present", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));

    expect(await screen.findByRole("button", { name: /clear older than/i })).toBeInTheDocument();
  });

  it("opens 'Clear Older Than' dialog when the button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await screen.findByText(/personal information/i);

    await user.click(screen.getByRole("tab", { name: /login history/i }));
    await user.click(await screen.findByRole("button", { name: /clear older than/i }));

    // The dialog contains a unique helper text below the Days input
    expect(
      await screen.findByText(/enter number of days to keep/i)
    ).toBeInTheDocument();
  });
});

describe("Profile — API error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not crash when getProfile rejects", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    vi.mocked(authService.getProfile).mockRejectedValue(new Error("Network error"));
    vi.mocked(authService.getLoginHistory).mockResolvedValue({
      success: true,
      data: { content: [], totalElements: 0 },
    } as any);

    renderWithProviders(<Profile />);

    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it("does not crash when getLoginHistory rejects", async () => {
    const { authService } = await import("../../src/services/modules/auth");
    vi.mocked(authService.getProfile).mockResolvedValue({
      success: true,
      data: mockProfile,
    } as any);
    vi.mocked(authService.getLoginHistory).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<Profile />);

    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});

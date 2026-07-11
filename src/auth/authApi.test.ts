import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiService } from "../services/api/api.config";
import { API_ENDPOINTS } from "../services/api/endpoints";
import { verifyOtp, mfaVerify } from "./authApi";

vi.mock("../services/api/api.config", () => ({
  apiService: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    setAuthToken: vi.fn(),
  },
}));

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies OTP using the backend contract", async () => {
    vi.mocked(apiService.post).mockResolvedValueOnce({
      success: true,
      data: {},
      message: "OTP verified",
    });

    await verifyOtp({
      email: "john.doe@example.com",
      otp: "123456",
      type: "RESET_PASSWORD",
    });

    expect(apiService.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      email: "john.doe@example.com",
      otp: "123456",
      type: "RESET_PASSWORD",
    });
  });

  it("verifies MFA challenge with the backend contract", async () => {
    vi.mocked(apiService.post).mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: "token",
        refreshToken: "refresh",
        tokenType: "Bearer",
        expiresIn: 3600,
        userId: "user-1",
        tenantId: "tenant-1",
        email: "john.doe@example.com",
        roles: ["ADMIN"],
      },
      message: "MFA verified",
    });

    await mfaVerify({ sessionToken: "session-token", code: "654321" });

    expect(apiService.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.MFA_VERIFY, {
      sessionToken: "session-token",
      code: "654321",
    });
  });
});

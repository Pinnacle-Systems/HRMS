import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiService } from "../../src/services/api/api.config";
import { API_ENDPOINTS } from "../../src/services/api/endpoints";
import { buildLoginRequest, verifyOtp, mfaVerify } from "../../src/auth/authApi";

vi.mock("../../src/services/api/api.config", () => ({
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

  it("builds the mobile login payload for backend auth requests", () => {
    const request = buildLoginRequest({
      mobileNumber: "+919876543210",
      mobileOtp: "123456",
      tenantId: "tenant-1",
    });

    expect(request).toEqual({
      mobileNumber: "+919876543210",
      mobileOtp: "123456",
      tenantId: "tenant-1",
    });
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

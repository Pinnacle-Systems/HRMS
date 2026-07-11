import * as authApi from "../../auth/authApi";
import { loadSession } from "../../auth/authSession";
import type {
  ActivateInviteRequest,
  LoginRequest,
  MfaEnableRequest,
  MfaSetupRequest,
  MfaVerifyRequest,
  PasswordChangeRequest,
  SetPasswordRequest,
  SignupRequest,
  VerifyOtpRequest,
} from "../../auth/authTypes";
import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface LoginHistoryParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}

class AuthService {
  async login(credentials: LoginRequest) {
    return authApi.login(credentials);
  }

  async logout() {
    await authApi.logout();
  }

  async refreshToken() {
    return authApi.refreshSession();
  }

  async resetPassword(payload: SetPasswordRequest) {
    return authApi.setPassword(payload);
  }

  getCurrentUser() {
    return loadSession()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return Boolean(loadSession());
  }

  async getProfile() {
    return apiService.get(API_ENDPOINTS.AUTH.PROFILE);
  }

  async updateProfile(payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.AUTH.PROFILE, payload);
  }

  async uploadProfilePicture(file: File) {
    return authApi.uploadProfilePicture(file);
  }

  async changePassword(payload: PasswordChangeRequest) {
    return authApi.changePassword(payload);
  }

  async forgotPassword(loginId: string) {
    return authApi.forgotPassword(loginId);
  }

  async verifyOtp(payload: VerifyOtpRequest) {
    return authApi.verifyOtp(payload);
  }

  async mfaVerify(payload: MfaVerifyRequest) {
    return authApi.mfaVerify(payload);
  }

  async mfaSetup(payload: MfaSetupRequest) {
    return authApi.mfaSetup(payload);
  }

  async resendMfaOtp() {
    return authApi.mfaResendOtp();
  }

  async enableMfa(payload: MfaEnableRequest) {
    return authApi.mfaEnable(payload);
  }

  async getPermissions() {
    return authApi.getPermissions();
  }

  async verifyInvite(token: string) {
    return authApi.verifyInvite(token);
  }

  async signup(payload: SignupRequest) {
    return authApi.signup(payload);
  }

  async activateInvite(payload: ActivateInviteRequest) {
    return authApi.activateInvite(payload);
  }

  async getLoginHistory(params?: LoginHistoryParams) {
    return apiService.get(API_ENDPOINTS.LOGIN_HISTORY.BASE, { params });
  }

  async getLoginHistoryByUser(id?: string | number) {
    return apiService.get(API_ENDPOINTS.LOGIN_HISTORY.GET_BY_USERID(String(id)));
  }

  async getLoginHistoryByTenant(params?: LoginHistoryParams) {
    return apiService.get(API_ENDPOINTS.LOGIN_HISTORY.GET_BY_TENANTID, {
      params,
    });
  }

  async clearLoginHistory(params?: LoginHistoryParams) {
    return apiService.delete(API_ENDPOINTS.LOGIN_HISTORY.DELETE, { params });
  }

  async clearLoginHistoryOlderThan(days: string | number) {
    return apiService.delete(API_ENDPOINTS.LOGIN_HISTORY.CLEAR_OLDER(String(days)));
  }
}

export const authService = new AuthService();

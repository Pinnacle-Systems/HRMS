import * as authApi from "../../auth/authApi";
import { loadSession } from "../../auth/authSession";
import type { LoginRequest } from "../../auth/authTypes";
import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

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

  async resetPassword(payload: any) {
    return await apiService.post(API_ENDPOINTS.AUTH.SET_PASSWORD, payload);
  }

  getCurrentUser() {
    return loadSession()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return Boolean(loadSession());
  }

  async getProfile(params?: any) {
    return apiService.get(API_ENDPOINTS.AUTH.PROFILE, { params });
  }

  async updateProfile(payload: any) {
    return apiService.put(API_ENDPOINTS.AUTH.PROFILE, payload);
  }

  async changePassword(payload: any) {
    const response = await apiService.post(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      payload,
    );
    return response;
  }
}

export const authService = new AuthService();

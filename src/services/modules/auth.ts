import * as authApi from "../../auth/authApi";
import { loadSession } from "../../auth/authSession";
import type { LoginRequest } from "../../auth/authTypes";
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

  async resetPassword(payload: Record<string, unknown>) {
    return await apiService.post(API_ENDPOINTS.AUTH.SET_PASSWORD, payload);
  }

  getCurrentUser() {
    return loadSession()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return Boolean(loadSession());
  }

  async getProfile(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.AUTH.PROFILE, { params });
  }

  async updateProfile(payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.AUTH.PROFILE, payload);
  }

  
  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return apiService.post(API_ENDPOINTS.AUTH.PHOTO, formData);
  }

  async changePassword(payload: Record<string, unknown>) {
    const response = await apiService.post(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      payload,
    );
    return response;
  }

  async getLoginHistory(params?: LoginHistoryParams) {
    return apiService.get(API_ENDPOINTS.LOGIN_HISTORY.BASE, { params });
  }

  async getLoginHistoryByUser(id?: string | number) {
    return apiService.get(API_ENDPOINTS.LOGIN_HISTORY.GET_BY_USERID(id));
  }

  async getLoginHistoryByTenant(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.LOGIN_HISTORY.GET_BY_TENANTID, {
      params,
    });
  }

  async clearLoginHistory(params?: Record<string, unknown>) {
    return apiService.delete(API_ENDPOINTS.LOGIN_HISTORY.DELETE, { params });
  }

  async clearLoginHistoryOlderThan(days: string | number) {
    return apiService.delete(API_ENDPOINTS.LOGIN_HISTORY.CLEAR_OLDER(days));
  }
}

export const authService = new AuthService();

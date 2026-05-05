import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

class AuthService {

  async login(credentials: any) {
    const response = await apiService.post(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    if (response.success && response.data) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("userId", JSON.stringify(response.data.userId));
    }
    return response;
  }

  async getOtp(payload: any) {
    const response = await apiService.post(API_ENDPOINTS.AUTH.GET_OTP, payload);
    return response;
  }

  async forgotPassword(loginId: any) {
    const response = await apiService.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      loginId,
    );
    return response;
  }

  async resetPassword(payload: any) {
    const response = await apiService.post(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      payload,
    );
    return response;
  }

  async logout() {
    const response = await apiService.delete(API_ENDPOINTS.AUTH.LOGOUT);
    localStorage.clear();
    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await apiService.post(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken: refreshToken,
    });
    if (response.success && response.data) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }
    return response;
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem("userId");
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
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

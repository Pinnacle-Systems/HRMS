// services/modules/auth.ts
import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";
// import { type ApiResponse } from "../api/api.types";

// export interface LoginCredentials {
//   email: string;
//   password: string;
// }

// export interface LoginResponse {
//   user: {
//     id: string;
//     name: string;
//     email: string;
//     role: string;
//   };
//   accessToken: string;
//   refreshToken: string;
// }

class AuthService {
  // Login
  //   async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
  //     const response = await apiService.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
//   async login(credentials: any): Promise<ApiResponse<any>> {
  async login(credentials: any) {
    const response = await apiService.post(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    if (response.success && response.data) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("userId", JSON.stringify(response.data.userId));
      apiService.setAuthToken(response.data.accessToken);
    }
    return response;
  }

  // Logout : Promise<ApiResponse<void>>
  async logout() {
    const response = await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    localStorage.clear();
    apiService.setAuthToken(null);
    return response;
  }

  // Refresh token : Promise<ApiResponse<{ accessToken: string }>> 
  async refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await apiService.post(
      API_ENDPOINTS.AUTH.REFRESH,
      {
        refreshToken: refreshToken,
      },
    );

    if (response.success && response.data) {
      localStorage.setItem("accessToken", response.data.accessToken);
      apiService.setAuthToken(response.data.accessToken);
    }

    return response;
  }

  // Get current user
  //   getCurrentUser(): LoginResponse['user'] | null {
  getCurrentUser(): any {
    const userStr = localStorage.getItem("userId");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem("accessToken");
  }
}

export const authService = new AuthService();

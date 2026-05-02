import * as authApi from "../../auth/authApi";
import { loadSession } from "../../auth/authSession";
import type { LoginRequest } from "../../auth/authTypes";

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

  getCurrentUser() {
    return loadSession()?.user ?? null;
  }

  isAuthenticated(): boolean {
    return Boolean(loadSession());
  }
}

export const authService = new AuthService();

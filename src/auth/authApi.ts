import { apiService } from "../services/api/api.config";
import { API_ENDPOINTS } from "../services/api/endpoints";
import { mapAuthResponseToSession, mapLoginResponseToOutcome } from "./authMapper";
import {
  clearSession,
  getRefreshToken,
  loadSession,
  saveSession,
  updateAccessToken,
} from "./authSession";
import type {
  ApiResponse,
  AuthResponse,
  AuthSession,
  LoginApiResponse,
  LoginOutcome,
  LoginRequest,
  SelectTenantRequest,
} from "./authTypes";

export async function login(request: LoginRequest): Promise<LoginOutcome> {
  const response = (await apiService.post(
    API_ENDPOINTS.AUTH.LOGIN,
    request,
  )) as LoginApiResponse;
  const outcome = mapLoginResponseToOutcome(response, request.loginId);

  if (outcome.type === "authenticated") {
    saveSession(outcome.session);
  }

  if (outcome.type === "mustChangePassword" && outcome.session) {
    saveSession(outcome.session);
  }

  return outcome;
}

export async function selectTenant(
  request: SelectTenantRequest,
): Promise<LoginOutcome> {
  const response = (await apiService.post(
    API_ENDPOINTS.AUTH.SELECT_TENANT,
    request,
    {
      headers: {
        Authorization: `Bearer ${request.sessionToken}`,
      },
    },
  )) as LoginApiResponse;
  const outcome = mapLoginResponseToOutcome(response);

  if (outcome.type === "authenticated") {
    saveSession(outcome.session);
  }

  if (outcome.type === "mustChangePassword" && outcome.session) {
    saveSession(outcome.session);
  }

  return outcome;
}

export async function refreshSession(): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = (await apiService.post(API_ENDPOINTS.AUTH.REFRESH, {
    refreshToken,
  })) as ApiResponse<AuthResponse>;

  if (!response.success || !response.data?.accessToken) {
    return null;
  }

  const currentSession = loadSession();
  const session =
    response.data.userId || response.data.roles?.length
      ? mapAuthResponseToSession({
          ...response.data,
          refreshToken: response.data.refreshToken || refreshToken,
        })
      : updateAccessToken(response.data.accessToken, response.data.expiresIn);

  if (!session && currentSession) {
    return updateAccessToken(response.data.accessToken, response.data.expiresIn);
  }

  if (!session) {
    return null;
  }

  saveSession(session);

  return session;
}

export async function logout(): Promise<void> {
  try {
    await apiService.delete(API_ENDPOINTS.AUTH.LOGOUT);
  } finally {
    clearSession();
    apiService.setAuthToken(null);
  }
}

export async function forgotPassword(loginId: string): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    loginId,
  })) as ApiResponse<void>;
}

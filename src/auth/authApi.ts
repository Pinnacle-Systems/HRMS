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
  ActivateInviteRequest,
  ApiResponse,
  AuthResponse,
  AuthSession,
  LoginApiResponse,
  LoginOutcome,
  LoginRequest,
  MfaEnableRequest,
  MfaSetupRequest,
  MfaSetupResponse,
  MfaVerifyRequest,
  PasswordChangeRequest,
  ProfilePictureResponse,
  SelectSessionContextResponse,
  SelectTenantRequest,
  SessionContext,
  SessionContextResponse,
  SessionContextSelection,
  SetPasswordRequest,
  SignupRequest,
  UserProfile,
  VerifyOtpRequest,
} from "./authTypes";

export function buildLoginRequest(params: {
  loginId?: string;
  password?: string;
  mobileNumber?: string;
  mobileOtp?: string;
  tenantId?: string;
}): LoginRequest {
  const request: LoginRequest = {};

  if (params.tenantId) {
    request.tenantId = params.tenantId;
  }

  if (params.loginId) {
    request.loginId = params.loginId;
  }

  if (params.password) {
    request.password = params.password;
  }

  if (params.mobileNumber) {
    request.mobileNumber = params.mobileNumber;
  }

  if (params.mobileOtp) {
    request.mobileOtp = params.mobileOtp;
  }

  return request;
}

export async function login(request: LoginRequest): Promise<LoginOutcome> {
  const response = (await apiService.post(
    API_ENDPOINTS.AUTH.LOGIN,
    request,
  )) as LoginApiResponse;
  const outcome:any = mapLoginResponseToOutcome(response, request.loginId);

  if (outcome.type === "authenticated") {
    saveSession(outcome.session);
  }

  if (outcome.type === "mustChangePassword" && outcome.session) {
    saveSession(outcome.session);
  }

  return outcome;
}

// export async function selectTenant(
//   request: SelectTenantRequest,
// ): Promise<LoginOutcome> {
//   const response = (await apiService.post(
//     API_ENDPOINTS.AUTH.SELECT_TENANT,
//     {
//       email: request.email,
//       tenantId: request.tenantId,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${request.sessionToken}`,
//       },
//     },
//   )) as LoginApiResponse;
//   const outcome = mapLoginResponseToOutcome(response);

//   if (outcome.type === "authenticated") {
//     saveSession(outcome.session);
//   }

//   if (outcome.type === "mustChangePassword" && outcome.session) {
//     saveSession(outcome.session);
//   }

//   return outcome;
// }

export async function selectTenant(
  request: SelectTenantRequest,
): Promise<LoginOutcome> {
  const headers: Record<string, string> = {};
  if (request.sessionToken) {
    headers.Authorization = `Bearer ${request.sessionToken}`;
  }

  const response = (await apiService.post(
    API_ENDPOINTS.AUTH.SELECT_TENANT,
    {
      email: request.email,
      tenantId: request.tenantId,
    },
    { headers }
  )) as LoginApiResponse;

  const outcome:any = mapLoginResponseToOutcome(response, request.email);

  // Persist session for successful authentication flows
  if (outcome.type === "authenticated" || 
      (outcome.type === "mustChangePassword" && outcome.session)) {
    saveSession(outcome.session);
  }

  return outcome;
  // if (response.success && response.data) {
  //   return {
  //     type: 'tenantSelection',
  //     tenants: response.data.tenants || [],
  //     email: response.data.email || request.email,
  //     sessionToken: request.sessionToken,
  //     message: 'Tenant selected. Please login with your credentials.'
  //   };
  // }

  // return {
  //   type: 'failed',
  //   message: response.message || 'Failed to select tenant'
  // };
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

export async function resendSignupOTP(
  request: {email: string},
): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.RESEND_OTP, request)) as ApiResponse<void>;
}

export async function verifyOtp(
  request: VerifyOtpRequest,
): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.VERIFY_OTP, request)) as ApiResponse<void>;
}

export async function mfaVerify(
  request: MfaVerifyRequest,
): Promise<ApiResponse<AuthResponse>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.MFA_VERIFY, request)) as ApiResponse<AuthResponse>;
}

export async function mfaSetup(
  request: MfaSetupRequest,
): Promise<ApiResponse<MfaSetupResponse>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.MFA_SETUP, request)) as ApiResponse<MfaSetupResponse>;
}

export async function mfaResendOtp(): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.MFA_RESENDOTP, {})) as ApiResponse<void>;
}

export async function mfaEnable(
  request: MfaEnableRequest,
): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.MFA_ENABLE, undefined, {
    params: {
      code: request.code,
      mfaType: request.mfaType,
    },
  })) as ApiResponse<void>;
}

export async function changePassword(
  request: PasswordChangeRequest,
): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, request)) as ApiResponse<void>;
}

export async function setPassword(
  request: SetPasswordRequest,
): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.SET_PASSWORD, request)) as ApiResponse<void>;
}

export async function getPermissions(): Promise<ApiResponse<Record<string, unknown>>> {
  return (await apiService.get(API_ENDPOINTS.AUTH.PERMISSIONS)) as ApiResponse<Record<string, unknown>>;
}

export async function uploadProfilePicture(
  file: File,
): Promise<ApiResponse<ProfilePictureResponse>> {
  const formData = new FormData();
  formData.append("file", file);
  return (await apiService.post(API_ENDPOINTS.AUTH.PHOTO, formData)) as ApiResponse<ProfilePictureResponse>;
}

export async function verifyInvite(token: string): Promise<ApiResponse<Record<string, unknown>>> {
  return (await apiService.get(API_ENDPOINTS.AUTH.VERIFY_INVITE(token))) as ApiResponse<Record<string, unknown>>;
}

export async function signup(request: SignupRequest): Promise<ApiResponse<void>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.SIGNUP, request)) as ApiResponse<void>;
}

export async function activateInvite(
  request: ActivateInviteRequest,
): Promise<ApiResponse<AuthResponse>> {
  return (await apiService.post(API_ENDPOINTS.AUTH.ACTIVATE_INVITE, request)) as ApiResponse<AuthResponse>;
}

export async function updateProfile(payload: Record<string, unknown>): Promise<ApiResponse<UserProfile>> {
  return (await apiService.put(API_ENDPOINTS.AUTH.PROFILE, payload)) as ApiResponse<UserProfile>;
}

// export async function sendMobileOtp(mobileNumber: string): Promise<LoginOutcome> {
//   const response = (await apiService.post(
//     API_ENDPOINTS.AUTH.LOGIN,
//     { mobileNumber }
//   )) as LoginApiResponse;
  
//   return mapLoginResponseToOutcome(response);
// }

export async function sendMobileOtp(mobileNumber: string): Promise<LoginOutcome> {
  try {
    const response = (await apiService.post(
      API_ENDPOINTS.AUTH.LOGIN,
      { mobileNumber }
    )) as LoginApiResponse;
    
    return mapLoginResponseToOutcome(response);
  } catch (error) {
    return {
      type: "failed",
      message: error instanceof Error ? error.message : "Failed to send OTP",
    };
  }
}

export async function verifyMobileOtp(mobileNumber: string,otp: string): Promise<LoginOutcome> {
  const response = (await apiService.post(
    API_ENDPOINTS.AUTH.LOGIN,
    { mobileNumber, mobileOtp: otp }
  )) as LoginApiResponse;
  
  const outcome:any = mapLoginResponseToOutcome(response);

  if (outcome.type === "authenticated") {
    saveSession(outcome.session);
  }

  if (outcome.type === "mustChangePassword" && outcome.session) {
    saveSession(outcome.session);
  }

  return outcome;
}

export async function getSessionContext(): Promise<SessionContextResponse> {
  return await apiService.get(API_ENDPOINTS.AUTH.GET_SESSION_CONTEXT);
}

export async function selectSessionContext(payload: SessionContextSelection): Promise<SelectSessionContextResponse> {
  const response = await apiService.post(API_ENDPOINTS.AUTH.SELECT_SESSION_CONTEXT, payload);
  return response as SelectSessionContextResponse;
}

// export async function verifyMobileOtp(
//   mobileNumber: string,
//   otp: string
// ): Promise<LoginOutcome> {
//   const response = (await apiService.post(
//     API_ENDPOINTS.AUTH.LOGIN,
//     { mobileNumber, mobileOtp: otp }
//   )) as LoginApiResponse;
  
//   return mapLoginResponseToOutcome(response);
// }

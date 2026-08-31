import {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import type { ApiError } from "./api.types";
import { API_ENDPOINTS } from "./endpoints";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
} from "../../auth/authSession";
import { refreshSession } from "../../auth/authApi"; // ✅ Import centralized refresh
import { logger } from "../../utils/logger";
import { assertSafeQueryParams } from "../../utils/apiGuards";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }

  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Track token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

type RetryRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

type ErrorResponseData = {
  message?: string;
  errors?: Record<string, string[]>;
};

const PUBLIC_ROUTE_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  "/mfa",
  "/select-tenant",
  "/unauthorized",
  "/branch-fiscal-year",
]);

const PUBLIC_REQUEST_PATHS = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.SIGNUP,
  API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
  API_ENDPOINTS.AUTH.VERIFY_OTP,
  API_ENDPOINTS.AUTH.MFA_VERIFY,
  API_ENDPOINTS.AUTH.MFA_SETUP,
  API_ENDPOINTS.AUTH.MFA_RESENDOTP,
  API_ENDPOINTS.AUTH.MFA_ENABLE,
  API_ENDPOINTS.AUTH.SELECT_TENANT,
  API_ENDPOINTS.AUTH.SET_PASSWORD,
  API_ENDPOINTS.AUTH.VERIFY_INVITE(""),
  API_ENDPOINTS.AUTH.SIGNUP,
  API_ENDPOINTS.AUTH.ACTIVATE_INVITE,
  API_ENDPOINTS.PASSWORD_POLICY.BASE,
  API_ENDPOINTS.AUTH.REFRESH,
];

function isPublicRequest(requestUrl: string): boolean {
  if (!requestUrl) {
    return false;
  }

  const normalizedUrl = requestUrl.startsWith("http")
    ? new URL(requestUrl, window.location.origin).pathname
    : requestUrl;

  return PUBLIC_REQUEST_PATHS.some((path) => normalizedUrl.includes(path));
}

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupInterceptors = (axiosInstance: AxiosInstance) => {
  // Request Interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      config.metadata = { startTime: Date.now() };
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Remove Content-Type for FormData
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      assertSafeQueryParams(config.params);
      logger.debug("API request started", {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
      });

      return config;
    },
    (error: unknown) => {
      logger.error("API request setup failed", { error });
      return Promise.reject(error);
    },
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      const metadata = response.config.metadata;
      logger.debug("API request completed", {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        durationMs: metadata?.startTime ? Date.now() - metadata.startTime : undefined,
      });

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryRequestConfig;
      const requestUrl = originalRequest?.url || "";
      const isRefreshRequest = requestUrl.includes(API_ENDPOINTS.AUTH.REFRESH);
      const isPublicRoute = typeof window !== "undefined" && PUBLIC_ROUTE_PATHS.has(window.location.pathname);
      const isPublicRequestUrl = isPublicRequest(requestUrl);
      // const metadata = originalRequest?.metadata;

      // Don't attempt refresh for public routes/requests
      if (isPublicRoute || isPublicRequestUrl) {
        return Promise.reject(error);
      }

      // Don't attempt refresh if it's the refresh request itself
      if (isRefreshRequest) {
        // Clear session if refresh fails
        clearSession();
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Check if refresh token exists
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logger.warn("No refresh token available for 401");
          clearSession();
          return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
          logger.debug("Queueing request while token refresh is in progress", {
            url: requestUrl,
          });

          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // Mark request as retried and start refresh
        originalRequest._retry = true;
        isRefreshing = true;

        logger.info("Attempting token refresh after 401", { url: requestUrl });

        try {
          const newSession = await refreshSession();

          if (!newSession || !newSession.accessToken) {
            throw new Error("Refresh failed - no access token");
          }

          const accessToken = newSession.accessToken;
          logger.info("Token refresh successful", {
            userId: newSession.user?.userId,
            expiresIn: newSession.expiresIn,
          });

          // Process queued requests with new token
          processQueue(null, accessToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          logger.error("Token refresh failed", {
            error: refreshError instanceof Error ? refreshError.message : String(refreshError),
          });

          // Process queue with error
          processQueue(refreshError, null);

          // Clear session
          clearSession();

          // Return the original error - don't redirect here
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        logger.warn("Access forbidden", {
          url: requestUrl,
          method: originalRequest?.method?.toUpperCase(),
        });
      }

      // Format error for consistent handling
      const errorData = error.response?.data as ErrorResponseData | undefined;
      const apiError: ApiError = {
        status: error.response?.status || 0,
        message: errorData?.message || error.message || "An error occurred",
        errors: errorData?.errors,
      };

      return Promise.reject(apiError);
    },
  );
};
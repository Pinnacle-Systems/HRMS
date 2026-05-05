import {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import type { ApiError } from "./api.types";
import { apiService } from "./api.config";
import { API_ENDPOINTS } from "./endpoints";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
} from "../../auth/authSession";

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

type RefreshResponseData = {
  data?: {
    accessToken?: string;
    expiresIn?: number;
  };
};

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
  // Request Interceptor - ONLY add token if not already present
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Remove Content-Type for FormData
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      return config;
    },
    (error: unknown) => {
      return Promise.reject(error);
    },
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryRequestConfig;
      const requestUrl = originalRequest?.url || "";
      const isRefreshRequest = requestUrl.includes(API_ENDPOINTS.AUTH.REFRESH);

      // Handle 401 Unauthorized
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isRefreshRequest
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers = {
                ...originalRequest.headers,
                Authorization: `Bearer ${token}`,
              };
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          const response = await axiosInstance.post<RefreshResponseData>(
            API_ENDPOINTS.AUTH.REFRESH,
            {
              refreshToken: refreshToken,
            },
          );

          const { accessToken, expiresIn } = response.data.data || {};
          if (!accessToken) {
            throw new Error("Refresh response did not include an access token");
          }
          updateAccessToken(accessToken, expiresIn);

          processQueue(null, accessToken);

          // Retry original request
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${accessToken}`,
          };
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearSession();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Format error for consistent handling
      const errorData = error.response?.data as ErrorResponseData | undefined;
      const apiError: ApiError = {
        status: error.response?.status || 0,
        message:
          errorData?.message ||
          error.message ||
          "An error occurred",
        errors: errorData?.errors,
      };
      return Promise.reject(apiError);
    },
  );
};

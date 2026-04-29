import {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import type { ApiError } from "./api.types";

// Track token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any | null, token: string | null = null) => {
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
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add company context
      // const companyId = localStorage.getItem('company_id');
      // if (companyId) {
      //   config.headers['X-Company-Id'] = companyId;
      // }

      // Remove Content-Type for FormData
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    },
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue the request while token is refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          const response = await axiosInstance.post("/auth/refresh", {
            refreshToken: refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);

          // Process queued requests
          processQueue(null, accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear session and redirect to login
          processQueue(refreshError, null);
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Format error for consistent handling
      const apiError: ApiError = {
        status: error.response?.status || 0,
        message:
          (error.response?.data as any)?.message ||
          error.message ||
          "An error occurred",
        errors: (error.response?.data as any)?.errors,
      };

      return Promise.reject(apiError);
    },
  );
};

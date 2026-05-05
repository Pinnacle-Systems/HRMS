import {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import type { ApiError } from "./api.types";
import { apiService } from "./api.config";

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
  // Request Interceptor - ONLY add token if not already present
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Don't add token if it's a refresh request
      if (config.url?.includes('/refresh-token')) {
        return config;
      }
      
      const token = localStorage.getItem("accessToken");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Remove Content-Type for FormData
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      return config;
    },
    (error: any) => Promise.reject(error),
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;
      
      // Prevent infinite loops
      if (originalRequest.url?.includes('/refresh-token')) {
        localStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
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

          // Use consistent endpoint
          const response = await axiosInstance.post("/auth/refresh-token", {
            refreshToken: refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);

          processQueue(null, accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.clear();
          apiService.setAuthToken(null);
          
          // Prevent redirect loops
          if (window.location.pathname !== '/login') {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      const apiError: ApiError = {
        status: error.response?.status || 0,
        message: (error.response?.data as any)?.message || error.message || "An error occurred",
        errors: (error.response?.data as any)?.errors,
      };
      return Promise.reject(apiError);
    },
  );
};

import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { setupInterceptors } from "./interceptors";
// import type { ApiResponse } from "./api.types";
import { API_CONFIG } from "./config";

type RequestBody = Record<string, unknown> | FormData | File | string | number | boolean | null;
type UploadAdditionalData = Record<string, string | Blob>;

class ApiService {
  private static instance: ApiService;
  public axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    // Setup interceptors
    setupInterceptors(this.axiosInstance);
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Generic GET request
  async get<TResponse = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.axiosInstance.get<TResponse>(url, config);
    return response.data;
  }

  // Generic GET with pagination
  // async getPaginated(url: string, params?: any): Promise<ApiResponse<{ items: T[]; total: number; page: number; limit: number; totalPages: number }>> {
  //   const response = await this.axiosInstance.get(url, { params });
  //   return response.data;
  // }

  // Generic POST request
  async post(
    url: string,
    data?: RequestBody,
    config?: AxiosRequestConfig,
  ): Promise<unknown> {
    const response = await this.axiosInstance.post<unknown>(url, data, config);
    return response.data;
  }

  // Generic PUT request
  async put(
    url: string,
    data?: RequestBody,
    config?: AxiosRequestConfig,
  ): Promise<unknown> {
    const response = await this.axiosInstance.put<unknown>(url, data, config);
    return response.data;
  }

  // Generic PATCH request
  async patch(
    url: string,
    data?: RequestBody,
    config?: AxiosRequestConfig,
  ): Promise<unknown> {
    const response = await this.axiosInstance.patch<unknown>(url, data, config);
    return response.data;
  }

  // Generic DELETE request
  async delete<TResponse = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const response = await this.axiosInstance.delete<TResponse>(url, config);
    return response.data;
  }

  // File upload
  async upload(
    url: string,
    file: File,
    fieldName: string = "file",
    additionalData?: UploadAdditionalData,
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // Multiple files upload
  async uploadMultiple(
    url: string,
    files: File[],
    fieldName: string = "files",
    additionalData?: UploadAdditionalData,
  ): Promise<unknown> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // File download
  async download(url: string, filename: string): Promise<void> {
    const response = await this.axiosInstance.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Set auth token
  setAuthToken(token: string | null) {
    if (token) {
      this.axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common["Authorization"];
    }
  }
}

export const apiService = ApiService.getInstance();

import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";
import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// const API_VERSION = '/api/v1';

export interface PunchData {
  id: number;
  m_id_card: string;
  timestamp: string;
  machineIP: string;
  machineType: string;
  machineInOutGridId: number;
  employeeId: number;
  employeeName?: string;
  punch_type?: string;
}

export interface Device {
  id: number;
  machineIp: string;
  machineName: string;
  machineType: string;
  status: "online" | "offline";
  port: number;
}

export interface PaginatedResponse {
  success: boolean;
  data: PunchData[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    pages: number;
  };
}

export interface FetchLogsResponse {
  success: boolean;
  from_date: string;
  to_date: string;
  total_new: number;
  count: number;
  message: string;
  data: PunchData[];
}

export interface LogsSummary {
  total_logs: number;
  distinct_employees: number;
  logs_by_machine: Record<string, number>;
  date_range: {
    from: string;
    to: string;
  };
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}

function unwrapApiData<T>(response: unknown): T {
  if (response && typeof response === "object") {
    const envelope = response as ApiEnvelope<T>;
    if (
      envelope &&
      typeof envelope === "object" &&
      "data" in envelope &&
      envelope.data !== undefined
    ) {
      return envelope.data as T;
    }
  }

  return response as T;
}

export interface BiometricDevice {
  isActive: boolean;
  id: string;
  deviceSerial: string;
  deviceName: string;
  deviceModel: string;
  ipAddress: string;
  location: string;
  syncFrequency: number;
  machineType: string;
  machineSetUp: string;
  lastSyncAt: string;
  lastPunchAt: string;
  createdAt: string;
  updatedAt: string;
  port: number;
}

export interface SyncStatus {
  id: string;
  deviceId: string;
  startDate: string;
  endDate: string;
  status: string;
  punchesReceived: number;
  punchesApplied: number;
  message: string;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

export interface DeviceHealth {
  deviceId: string;
  deviceSerial: string;
  deviceName: string;
  status: string;
  active: boolean;
  lastSyncAt: string;
  lastPunchAt: string;
  syncFrequency: number;
  minutesSinceLastPunch: number;
  message: string;
}

export interface WebhookPunchData {
  deviceSerial: string;
  employeeCode: string;
  punchTime: string;
  punchType: "check_in" | "check_out" | "break_in" | "break_out";
  verificationMode: "fingerprint" | "card" | "face" | "pin";
}

export interface WebhookResponse {
  accepted: boolean;
  employeeId: string;
  employeeCode: string;
  attendanceDate: string;
  punchType: string;
  status: "checked_in" | "checked_out" | "break_started" | "break_ended";
  message: string;
}

export interface SyncRequest {
  deviceId: string;
  startDate: string;
  endDate: string;
}

export interface mapp {
  deviceId: string;
  deviceEmployeeCode: string;
  hrmsEmployeeId: string;
  isActive: boolean;
}

export interface EmployeeMapRequest {
  mappings: mapp[];
}

export interface EmployeeMapResponse {
  isActive: boolean;
  id: string;
  deviceId: string;
  deviceSerial: string;
  deviceEmployeeCode: string;
  hrmsEmployeeId: string;
  employeeName: string;
  employeeCode: string;
}

export interface CreateDeviceRequest {
  deviceSerial: string;
  deviceName: string;
  deviceModel: string;
  ipAddress: string;
  location: string;
  port: number;
  syncFrequency: number;
  machineType: string;
  machineSetUp: string;
  isActive: boolean;
}

export interface FetchLogQuery {
  from_date: string;
  to_date: string;
  // port?: number;
  deviceIps: string[];
}

// const baseUrl = "http://localhost:3000/api/";

// BiometricService.ts - Complete service class
export const biometricService = {
  // const baseUrl = "http://localhost:3000/api/";

  async getAllDevices(params?: any): Promise<BiometricDevice[]> {
    const response: any = await apiService.get(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.GET_DEVICES,
      { params },
    );
    return unwrapApiData<BiometricDevice[]>(response) ?? [];
  },

  async getDeviceById(id: string): Promise<BiometricDevice> {
    const response: any = await apiService.get(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.GET_DEVICE_BYID(id),
    );
    return unwrapApiData<BiometricDevice>(response);
  },

  async getSyncStatus(deviceId: string, syncId: string): Promise<SyncStatus> {
    const response: any = await apiService.get(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.SYNC,
      {
        params: { deviceId, syncId },
      },
    );
    return unwrapApiData<SyncStatus>(response);
  },

  async checkDeviceHealth(id: string): Promise<DeviceHealth> {
    const response: any = await apiService.get(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.HEALTH(id),
    );
    return unwrapApiData<DeviceHealth>(response);
  },

  async processWebhookPunch(data: WebhookPunchData): Promise<WebhookResponse> {
    const response: any = await apiService.post(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_WEBHOOK,
      data,
    );
    return unwrapApiData<WebhookResponse>(response);
  },

  async initiateSync(data: SyncRequest): Promise<SyncStatus> {
    const response: any = await apiService.post(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_SYNC,
      data,
    );
    return unwrapApiData<SyncStatus>(response);
  },

  async mapEmployeeToDevice(
    data: mapp | mapp[],
  ): Promise<EmployeeMapResponse> {
    const response: any = await apiService.post(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_MAP,
      data,
    );
    return unwrapApiData<EmployeeMapResponse>(response);
  },

  async registerDevice(data: CreateDeviceRequest): Promise<BiometricDevice> {
    const response: any = await apiService.post(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_DEVICE,
      data,
    );
    return unwrapApiData<BiometricDevice>(response);
  },

  async updateDevice(
    id: string,
    data: Partial<CreateDeviceRequest>,
  ): Promise<BiometricDevice> {
    const response: any = await apiService.put(
      API_ENDPOINTS.ATTENDANCE.BIOMETRIC.UPDATE_DEVICE(id),
      data,
    );
    return unwrapApiData<BiometricDevice>(response);
  },

  async fetchLogs(params: FetchLogQuery) {
    try {
      const deviceIpsString = params.deviceIps.join(",");

      const response = await apiService.get(
        "http://localhost:8000/fetch-logs",
        {
          params: {
            from_date: params.from_date,
            to_date: params.to_date,
            device_ips: deviceIpsString,
          },
        },
      );
      return unwrapApiData<DeviceHealth>(response);
    } catch (error) {
      console.error("Error fetching logs:", error);
      throw error;
    }
  },

  // async fetchAndSyncLogs(params: FetchLogQuery): Promise<FetchLogQuery> {
  //   const response = await axios.get('http://localhost:8000/attendance/fetch-logs', {
  //     params: {
  //       // from_date: moment(params.fromDate).format('YYYY-MM-DD'),
  //       // to_date: moment(params.toDate).format('YYYY-MM-DD'),
  //       from_date: params.from_date,
  //       to_date: params.to_date,
  //       device_ip: params.deviceIp || undefined
  //     },
  //     timeout: 300000
  //   });
  //   return response.data;
  // },

  //  async getLogs(params: any) {
  //   const response = await axios.get('http://localhost:8000/attendance/logs', {
  //     params: {
  //       // from_date: moment(params.fromDate).format('YYYY-MM-DD'),
  //       // to_date: moment(params.toDate).format('YYYY-MM-DD'),
  //       from_date: params.from_date,
  //       to_date: params.to_date,
  //       employee_id: params.employeeId,
  //       device_ip: params.deviceIp,
  //       page: params.page || 1,
  //       page_size: params.pageSize || 100
  //     }
  //   });
  //   return response.data;
  // },

  // async getDevices(): Promise<Device[]> {
  //   const response = await axios.get(`${API_URL}/attendance/devices`);
  //   return response.data.devices;
  // }

  async fetchAndSyncLogs(params: {
    fromDate: Date | string;
    toDate: Date | string;
    deviceIp?: string;
  }): Promise<FetchLogsResponse> {
    try {
      const response = await axios.get<FetchLogsResponse>(
        "http://localhost:3000/api/attendance/fetch-logs",
        {
          params: {
            // from_date: moment(params.fromDate).format('YYYY-MM-DD'),
            // to_date: moment(params.toDate).format('YYYY-MM-DD'),
            device_ip: params.deviceIp || undefined,
          },
          timeout: 300000, // 5 minutes
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || "Failed to fetch logs");
      }
      throw error;
    }
  },

  async getLogs(params: {
    fromDate: Date | string;
    toDate: Date | string;
    employeeId?: number;
    deviceIp?: string;
    cardId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse> {
    try {
      const response = await axios.get<PaginatedResponse>(
        "http://localhost:3000/api/attendance/logs",
        {
          params: {
            // from_date: moment(params.fromDate).format('YYYY-MM-DD'),
            // to_date: moment(params.toDate).format('YYYY-MM-DD'),
            employee_id: params.employeeId,
            device_ip: params.deviceIp,
            card_id: params.cardId,
            page: params.page || 1,
            page_size: params.pageSize || 100,
          },
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || "Failed to get logs");
      }
      throw error;
    }
  },

  // async getDevices(): Promise<Device[]> {
  //   try {
  //     const response = await axios.get<{ success: boolean; devices: Device[] }>(
  //       `${this.baseUrl}/attendance/devices`
  //     );
  //     return response.data.devices;
  //   } catch (error) {
  //     if (axios.isAxiosError(error)) {
  //       throw new Error(error.response?.data?.error || 'Failed to get devices');
  //     }
  //     throw error;
  //   }
  // },

  async getLogsSummary(params: {
    fromDate: Date | string;
    toDate: Date | string;
    deviceIp?: string;
  }): Promise<LogsSummary> {
    try {
      const response = await axios.get<{
        success: boolean;
        summary: LogsSummary;
      }>("http://localhost:3000/api/attendance/summary", {
        params: {
          // from_date: moment(params.fromDate).format('YYYY-MM-DD'),
          // to_date: moment(params.toDate).format('YYYY-MM-DD'),
          device_ip: params.deviceIp || undefined,
        },
      });
      return response.data.summary;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || "Failed to get summary");
      }
      throw error;
    }
  },

  // async getRecentLogs(limit: number = 100): Promise<PunchData[]> {
  //   try {
  //     const response = await axios.get<{ success: boolean; data: PunchData[] }>(
  //       `${this.baseUrl}/attendance/recent`,
  //       {
  //         params: { limit }
  //       }
  //     );
  //     return response.data.data;
  //   } catch (error) {
  //     if (axios.isAxiosError(error)) {
  //       throw new Error(error.response?.data?.error || 'Failed to get recent logs');
  //     }
  //     throw error;
  //   }
  // },

  // async getEmployeeLogs(params: {
  //   employeeId: number;
  //   fromDate: Date | string;
  //   toDate: Date | string;
  //   page?: number;
  //   pageSize?: number;
  // }): Promise<PaginatedResponse> {
  //   try {
  //     const response = await axios.get<PaginatedResponse>(
  //       `${this.baseUrl}/attendance/employee/${params.employeeId}`,
  //       {
  //         params: {
  //           from_date: moment(params.fromDate).format('YYYY-MM-DD'),
  //           to_date: moment(params.toDate).format('YYYY-MM-DD'),
  //           page: params.page || 1,
  //           page_size: params.pageSize || 100
  //         }
  //       }
  //     );
  //     return response.data;
  //   } catch (error) {
  //     if (axios.isAxiosError(error)) {
  //       throw new Error(error.response?.data?.error || 'Failed to get employee logs');
  //     }
  //     throw error;
  //   }
  // },

  // async syncAllDevices(): Promise<{ success: boolean; message: string; devices: string[] }> {
  //   try {
  //     const response = await axios.post(`${this.baseUrl}/attendance/sync-all`);
  //     return response.data;
  //   } catch (error) {
  //     if (axios.isAxiosError(error)) {
  //       throw new Error(error.response?.data?.error || 'Failed to sync devices');
  //     }
  //     throw error;
  //   }
  // }
};

import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

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
  punchType: 'check_in' | 'check_out' | 'break_in' | 'break_out';
  verificationMode: 'fingerprint' | 'card' | 'face' | 'pin';
}

export interface WebhookResponse {
  accepted: boolean;
  employeeId: string;
  employeeCode: string;
  attendanceDate: string;
  punchType: string;
  status: 'checked_in' | 'checked_out' | 'break_started' | 'break_ended';
  message: string;
}

export interface SyncRequest {
  deviceId: string;
  startDate: string;
  endDate: string;
}

export interface EmployeeMapRequest {
  deviceId: string;
  deviceEmployeeCode: string;
  hrmsEmployeeId: string;
  isActive: boolean;
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
  syncFrequency: number;
  machineType: string;
  machineSetUp: string;
  isActive: boolean;
}


// BiometricService.ts - Complete service class
export const biometricService = {

  async getAllDevices(params?: any): Promise<BiometricDevice[]> {
    const response:any = await apiService.get(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.GET_DEVICES, {params});
    return response.data;
  },

  async getDeviceById(id: string): Promise<BiometricDevice> {
    const response:any = await apiService.get(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.GET_DEVICE_BYID(id));
    return response.data;
  },

  async getSyncStatus(deviceId: string, syncId: string): Promise<SyncStatus> {
    const response:any = await apiService.get(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.SYNC, {
      params: { deviceId, syncId }
    });
    return response.data;
  },

  async checkDeviceHealth(id: string): Promise<DeviceHealth> {
    const response:any = await apiService.get(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.HEALTH(id));
    return response.data;
  },

  async processWebhookPunch(data: WebhookPunchData): Promise<WebhookResponse> {
    const response:any = await apiService.post(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_WEBHOOK, data);
    return response.data;
  },

  async initiateSync(data: SyncRequest): Promise<SyncStatus> {
    const response:any = await apiService.post(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_SYNC, data);
    return response.data;
  },

  async mapEmployeeToDevice(data: EmployeeMapRequest): Promise<EmployeeMapResponse> {
    const response:any = await apiService.post(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_MAP, data);
    return response.data;
  },

  async registerDevice(data: CreateDeviceRequest): Promise<BiometricDevice> {
    const response:any = await apiService.post(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.POST_DEVICE, data);
    return response.data;
  },

  async updateDevice(id: string, data: Partial<CreateDeviceRequest>): Promise<BiometricDevice> {
    const response:any = await apiService.put(API_ENDPOINTS.ATTENDANCE.BIOMETRIC.UPDATE_DEVICE(id), data);
    return response.data;
  }
}

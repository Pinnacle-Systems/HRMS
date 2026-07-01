import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface AttendanceConflict {
    id: string;
    employeeId: string;
    attendanceDate: string;
    deviceId: string;
    syncToken: string;
    serverCheckIn: string;
    serverCheckOut: string;
    clientCheckIn: string;
    clientCheckOut: string;
    status: 'pending' | 'resolved' | 'ignored';
    resolutionStrategy: 'server_wins' | 'client_wins' | 'latest_wins' | 'manual';
    resolvedBy: string;
    notes: string;
    resolvedAt: string;
    createdAt: string;
}

export interface DeviceErrorLog {
    id: string;
    deviceId: string;
    employeeId: string;
    errorCode: string;
    errorMessage: string;
    stackTrace: string;
    timestamp: string;
    appVersion: string;
    loggedAt: string;
}

export interface ConsolidateRequest {
    employeeId: string;
    deviceId: string;
    syncToken: string;
    offlinePunches: OfflinePunch[];
}

export interface OfflinePunch {
    type: 'check_in' | 'check_out' | 'break_in' | 'break_out';
    timestamp: string;
    latitude: number;
    longitude: number;
    photoHash: string;
}

export interface ConsolidateResponse {
    employeeId: string;
    totalPunches: number;
    daysApplied: number;
    conflicts: number;
    skipped: number;
    results: ConsolidationResult[];
}

export interface ConsolidationResult {
    date: string;
    action: string;
    status: 'checked_in' | 'checked_out' | 'conflict' | 'skipped';
    conflictId: string;
    message: string;
}

export interface ResolveConflictRequest {
    resolutionStrategy: 'server_wins' | 'client_wins' | 'latest_wins' | 'manual';
    resolvedBy: string;
    notes: string;
}

export interface CreateErrorLogRequest {
    deviceId: string;
    employeeId?: string;
    errorCode: string;
    errorMessage: string;
    stackTrace?: string;
    timestamp: string;
    appVersion: string;
}

export interface CreateErrorLogResponse {
    id: string;
    deviceId: string;
    employeeId: string;
    errorCode: string;
    occurredAt: string;
    appVersion: string;
    loggedAt: string;
}

export const offlineSyncService = {

    async getConflicts(employeeId?: string, syncToken?: string): Promise<AttendanceConflict[]> {
        const response: any = await apiService.get(API_ENDPOINTS.ATTENDANCE.DATA_INTEGRITY.CONFLICTS, {
            params: { employeeId, syncToken }
        });
        return response.data;
    },
    async logDeviceError(data: CreateErrorLogRequest): Promise<CreateErrorLogResponse> {
        const response:any = await apiService.post(API_ENDPOINTS.ATTENDANCE.DATA_INTEGRITY.LOG_ERROR, data);
        return response.data;
    },


    async consolidateOfflinePunches(data: ConsolidateRequest): Promise<ConsolidateResponse> {
        const response: any = await apiService.post(API_ENDPOINTS.ATTENDANCE.DATA_INTEGRITY.CONSOLIDATE, data);
        return response.data;
    },

    async resolveConflict(conflictId: string, data: ResolveConflictRequest): Promise<AttendanceConflict> {
        const response: any = await apiService.post(API_ENDPOINTS.ATTENDANCE.DATA_INTEGRITY.CON_RESOLVE(conflictId), data);
        return response.data;
    },

    // async logDeviceError(data: Omit<DeviceErrorLog, 'id' | 'loggedAt'>): Promise<DeviceErrorLog> {
    //     const response:any = await apiService.post(API_ENDPOINTS.ATTENDANCE.DATA_INTEGRITY.LOG_ERROR, data);
    //     return response.data;
    // }
}


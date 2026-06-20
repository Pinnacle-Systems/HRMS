import type { ShiftCategoryConfig } from "../../pages/attendance/shiftSettings/types";
import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

// Common response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Time structure
export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

// Shift type enum
export type ShiftTypeEnum = "General" | "Flexible" | "Rotational" | "Split"; // Adjust based on your actual enum
export type WeekDay = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

// Shift interface
export interface Shift {
  id: string;
  shiftName: string;
  shiftCode: string;
  shiftType: ShiftTypeEnum;
  startTime: string;
  endTime: string;
  breakTime: number; // in minutes
  graceTime: number; // in minutes
  totalHours: number; // in hours
  weeklyOff: WeekDay[];
  color: string;
  description: string;
  // active: boolean;
  isNightShift: boolean;
  isActive: boolean;
  templateId: string;
  advancedConfigTypes: [];
  templateName?: string;
}

// Pagination response for shifts
export interface PaginatedResponse<T = any> {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: T[];
  number: number;
  sort: SortInfo;
  numberOfElements: number;
  pageable: PageableInfo;
  empty: boolean;
}

export interface SortInfo {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageableInfo {
  offset: number;
  sort: SortInfo;
  paged: boolean;
  pageNumber: number;
  pageSize: number;
  unpaged: boolean;
}

// Stats interface
export interface ShiftStats {
  totalShifts: number;
  activeShifts: number;
  nightShifts: number;
  flexibleShifts: number;
}

interface ShiftTypesResponse {
  success: boolean;
  message: string;
  data: string[];
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
}

export interface AdvancedConfigPayload {
  shiftId: string;
  shiftName: string;
  advancedConfigs: ShiftCategoryConfig[];
}

// Combined types for API responses
export type ShiftsApiResponse = ApiResponse<PaginatedResponse<Shift>>;
export type ShiftStatsApiResponse = ApiResponse<ShiftStats>;

export interface ShiftRotationData {
  id: string;
  rotationName: string;
  description: string;
  shiftIds: string[];
  shifts?: ShiftInfo[];
  cycleDays: number;
  active: boolean;
}

export interface ShiftInfo {
  id: string;
  shiftName: string;
  shiftCode: string;
  color: string;
}

export interface ShiftSchedule {
  id: string;
  employeeName: string;
  employeeId: string;
  startTime: string;
  endTime: string;
  shiftCode: string;
  status: "Scheduled" | "Completed" | "Absent" | "On Leave" | "Late";
  department?: string;
  branch?: string;
  color: string;
}

export type SwapRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface SwapRequest {
  id: string;
  requesterEmployeeId: string;
  requesterEmployeeName: string;
  requesterDate: string;
  requesterShiftCode: string;
  targetEmployeeId: string;
  targetEmployeeName: string;
  targetDate: string;
  targetShiftCode: string;
  reason: string;
  status: SwapRequestStatus;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
  createdAt: string;
  decidedByName?: string
}

export interface ScheduleStats {
  totalScheduled: number;
  inProgress: number;
  completed: number;
  weeklyOff: number;
  unassigned: number;
  byStatus: Record<string, number>;
}

export interface ShiftDistribution {
  shiftCode: string;
  shiftName: string;
  color: string;
  employeeCount: number;
}

export interface ShiftDistributionData {
  from: string;
  to: string;
  buckets: ShiftDistribution[];
}

export interface ShiftDistributionApiResponse {
  success: boolean;
  message: string;
  data: ShiftDistributionData;
  timestamp: string;
}

export interface CreateSwapRequestDto {
  requesterEmployeeId: string;
  requesterDate: string;
  targetEmployeeId: string;
  targetDate: string;
  reason: string;
}

export type UpdateSwapRequestStatusDto = {
  status: "APPROVED" | "REJECTED" | "CANCELLED";
  reason?: string;
};

export type ScheduleApiResponse = ApiResponse<ShiftSchedule[]>;
export type SwapRequestApiResponse = ApiResponse<
  PaginatedResponse<SwapRequest>
>;
export type SingleSwapRequestApiResponse = ApiResponse<SwapRequest>;
export type ScheduleStatsApiResponse = ApiResponse<ScheduleStats>;

class ShiftService {
  async getShiftById(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_BY_ID(id), { params });
  }

  async deleteShift(id: string) {
    return apiService.delete(API_ENDPOINTS.SHIFTS.DELETE(id));
  }

  async getShifts(params?: any): Promise<PaginatedResponse<Shift>> {
    const response = await apiService.get<ShiftsApiResponse>(
      API_ENDPOINTS.SHIFTS.BASE,
      { params },
    );
    return response.data;
  }

  async getShiftStats(params?: any): Promise<ShiftStats> {
    const response = await apiService.get<ShiftStatsApiResponse>(
      API_ENDPOINTS.SHIFTS.GET_STATS,
      { params },
    );
    return response.data;
  }

  async validateShiftCode(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.VALIDATE_SHIFT, data);
  }

  async getShiftTypes(): Promise<ShiftTypesResponse> {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_SHIFT_TYPES);
  }

  async getShiftDropdown(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_DROPDOWN, { params });
  }

  async getActiveShifts(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_ACTIVE, { params });
  }

  async createShift(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.CREATE, data);
  }

  async updateShift(id: string, data: any) {
    return apiService.put(API_ENDPOINTS.SHIFTS.UPDATE(id), data);
  }

  async updateShiftStatus(id: string, data: any) {
    return apiService.put(API_ENDPOINTS.SHIFTS.UPDATE_ACTIVE(id), data);
  }

  // Shift Swap Requests
  async getSwapRequests(params?: any): Promise<PaginatedResponse<SwapRequest>> {
    const response = await apiService.get<SwapRequestApiResponse>(
      API_ENDPOINTS.SHIFTS.GET_SWAP_REQUEST,
      { params },
    );

    return response.data;
  }

  async getSwapRequestById(id: string, params?: any): Promise<SwapRequest> {
    const response = await apiService.get<SingleSwapRequestApiResponse>(
      API_ENDPOINTS.SHIFTS.GET_SWAP_REQUEST_BYID(id),
      { params },
    );

    return response.data;
  }

  async createSwapRequest(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.CREATE_SWAP_REQUEST, data);
  }

  async updateSwapRequestStatus(
    id: string,
    data: UpdateSwapRequestStatusDto,
  ): Promise<SwapRequest> {
    const response = await apiService.put(
      API_ENDPOINTS.SHIFTS.UPDATE_SWAP_REQUEST(id),
      data,
    );
    return (response as SingleSwapRequestApiResponse).data;
  }

  // Shift Rotations
  async getRotations(
    params?: any,
  ): Promise<ApiResponse<PaginatedResponse<ShiftRotationData>>> {
    return apiService.get(API_ENDPOINTS.SHIFTS.BASE_ROTATION, { params });
  }

  async getRotationById(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_ROTATION_BY_ID(id), {
      params,
    });
  }

  async createRotation(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.CREATE_ROTATION, data);
  }

  async updateRotation(id: string, data: any) {
    return apiService.put(API_ENDPOINTS.SHIFTS.UPDATE_ROTATION(id), data);
  }

  async deleteRotation(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(API_ENDPOINTS.SHIFTS.DELETE_ROTATION(id));
  }

  async applyRotation(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.UPDATE_APPLY(id), data);
  }

  // Shift Roster
  async getRoster(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_ROSTER, { params });
  }

  async exportRosterToPDF(params?: any) {
    const response = await apiService.axiosInstance.get(
      API_ENDPOINTS.SHIFTS.EXPORT_PDF,
      {
        params,
        responseType: "blob",
      },
    );
    const blob = response.data;
    if (!blob || blob.size === 0) {
      throw new Error("Downloaded PDF file is empty.");
    }
    if (
      blob.type?.includes("application/json") ||
      blob.type?.includes("text/plain")
    ) {
      const text = await blob.text();
      let errMsg = "Failed to export PDF.";
      try {
        const json = JSON.parse(text);
        if (json.message) {
          errMsg = json.message;
        }
      } catch {
        if (text) {
          errMsg = text;
        }
      }
      throw new Error(errMsg);
    }

    let filename = "shift_roster.pdf";
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.includes("attachment")) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async exportRosterToExcel(params?: any) {
    const response = await apiService.axiosInstance.get(
      API_ENDPOINTS.SHIFTS.EXPORT_EXCEL,
      {
        params,
        responseType: "blob",
      },
    );
    const blob = response.data;
    if (!blob || blob.size === 0) {
      throw new Error("Downloaded Excel file is empty.");
    }
    if (
      blob.type?.includes("application/json") ||
      blob.type?.includes("text/plain")
    ) {
      const text = await blob.text();
      let errMsg = "Failed to export Excel.";
      try {
        const json = JSON.parse(text);
        if (json.message) {
          errMsg = json.message;
        }
      } catch {
        if (text) {
          errMsg = text;
        }
      }
      throw new Error(errMsg);
    }
    let filename = "shift_roster.xlsx";
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.includes("attachment")) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async getRosterAlerts(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_ALERTS, { params });
  }

  async publishRoster(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.PUBLISH, data);
  }

  async copyPreviousWeekToRoster(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.COPY_PREV_WEEK, data);
  }

  async bulkAssignShifts(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.BULK_ASSIGN, data);
  }

  async updateEmployeeRoster(eid: string, data: any) {
    return apiService.put(API_ENDPOINTS.SHIFTS.UPDATE_EMP_ROSTER(eid), data);
  }

  // Shift Schedule
  async getSchedule(params?: any): Promise<ScheduleApiResponse> {
    return apiService.get<ScheduleApiResponse>(
      API_ENDPOINTS.SHIFTS.GET_SCHEDULE,
      { params },
    );
  }

  async getUpcomingShifts(params?: any): Promise<ScheduleApiResponse> {
    return apiService.get<ScheduleApiResponse>(
      API_ENDPOINTS.SHIFTS.GET_UPCOMING,
      { params },
    );
  }

  async getScheduleStats(params?: any): Promise<ScheduleStatsApiResponse> {
    return apiService.get<ScheduleStatsApiResponse>(
      API_ENDPOINTS.SHIFTS.GET_SCHEDULE_STATS,
      { params },
    );
  }

  async exportScheduleToPDF(params?: any) {
    const response = await apiService.axiosInstance.get(
      API_ENDPOINTS.SHIFTS.EXPORT_SCHEDULE_PDF,
      {
        params,
        responseType: "blob",
      },
    );
    const blob = response.data;
    if (!blob || blob.size === 0) {
      throw new Error("Downloaded PDF file is empty.");
    }
    if (
      blob.type?.includes("application/json") ||
      blob.type?.includes("text/plain")
    ) {
      const text = await blob.text();
      let errMsg = "Failed to export PDF.";
      try {
        const json = JSON.parse(text);
        if (json.message) {
          errMsg = json.message;
        }
      } catch {
        if (text) {
          errMsg = text;
        }
      }
      throw new Error(errMsg);
    }
    let filename = "shift_schedule.pdf";
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.includes("attachment")) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async exportScheduleToExcel(params?: any) {
    const response = await apiService.axiosInstance.get(
      API_ENDPOINTS.SHIFTS.EXPORT_SCHEDULE_Excel,
      {
        params,
        responseType: "blob",
      },
    );
    const blob = response.data;
    if (!blob || blob.size === 0) {
      throw new Error("Downloaded Excel file is empty.");
    }
    if (
      blob.type?.includes("application/json") ||
      blob.type?.includes("text/plain")
    ) {
      const text = await blob.text();
      let errMsg = "Failed to export Excel.";
      try {
        const json = JSON.parse(text);
        if (json.message) {
          errMsg = json.message;
        }
      } catch {
        if (text) {
          errMsg = text;
        }
      }
      throw new Error(errMsg);
    }
    let filename = "shift_schedule.xlsx";
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.includes("attachment")) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async getShiftDistribution(
    params?: any,
  ): Promise<ShiftDistributionApiResponse> {
    return apiService.get<ShiftDistributionApiResponse>(
      API_ENDPOINTS.SHIFTS.GET_COUNT,
      { params },
    );
  }

  async sendShiftNotifications(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.SEND_NOTIFY, data);
  }

  //Shift Advanced Configuration
  async getShiftAdvancedConfig(id: string) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_ADV_CONFIG(id));
  }

  async createShiftAdvancedConfig(id: string, payload: AdvancedConfigPayload) {
    return apiService.post(API_ENDPOINTS.SHIFTS.POST_ADV_CONFIG(id), payload);
  }

  async updateShiftAdvancedConfig(id: string, payload: AdvancedConfigPayload) {
    return apiService.put(API_ENDPOINTS.SHIFTS.PUT_ADV_CONFIG(id), payload);
  }
}

export const shiftService = new ShiftService();

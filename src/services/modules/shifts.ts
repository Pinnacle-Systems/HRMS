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
  active: boolean;
  nightShift: boolean;
  isActive?: boolean;
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
  async getSwapRequests(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_SWAP_REQUEST, { params });
  }

  async getSwapRequestById(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_SWAP_REQUEST_BYID(id), {
      params,
    });
  }

  async createSwapRequest(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.CREATE_SWAP_REQUEST, data);
  }

  async updateSwapRequestStatus(id: string, data: any) {
    return apiService.put(API_ENDPOINTS.SHIFTS.UPDATE_SWAP_REQUEST(id), data);
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
    return apiService.get(API_ENDPOINTS.SHIFTS.EXPORT_PDF, {
      params,
      responseType: "blob",
    });
  }

  async exportRosterToExcel(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.EXPORT_EXCEL, {
      params,
      responseType: "blob",
    });
  }

  async getRosterAlerts(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_ALERTS, { params });
  }

  async publishRoster(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.PUBLISH, data);
  }

  async copyPreviousWeekToRoster(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.COPT_PRE_WEEK, data);
  }

  async bulkAssignShifts(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.BULK_ASSIGN, data);
  }

  async updateEmployeeRoster(eid: string, data: any) {
    return apiService.put(API_ENDPOINTS.SHIFTS.UPDATE_EMP_ROSTER(eid), data);
  }

  // Shift Schedule
  async getSchedule(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_SCHEDULE, { params });
  }

  async getUpcomingShifts(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_UPCOMING, { params });
  }

  async getScheduleStats(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_SCHEDULE_STATS, { params });
  }

  async exportScheduleToPDF(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.EXPORT_SCHEDULE_PDF, {
      params,
      responseType: "blob",
    });
  }

  async exportScheduleToExcel(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.EXPORT_SCHEDULE_Excel, {
      params,
      responseType: "blob",
    });
  }

  async getShiftDistribution(params?: any) {
    return apiService.get(API_ENDPOINTS.SHIFTS.GET_COUNT, { params });
  }

  async sendShiftNotifications(data: any) {
    return apiService.post(API_ENDPOINTS.SHIFTS.SEND_NOTIFY, data);
  }
}

export const shiftService = new ShiftService();

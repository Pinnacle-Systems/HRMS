import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

// ── Types ──────────────────────────────────────────────────────────────────

interface TodayQuery {
  employeeId: string;
}

interface TimelineQuery {
  employeeId: string;
  date?: string;
}

interface SummaryQuery {
  employeeId: string;
  month: number;
  year: number;
}

interface HistoryQuery {
  employeeId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface GeofenceValidateQuery {
  employeeId: string;
  latitude: number;
  longitude: number;
}

interface CheckInPayload {
  employeeId: string;
  latitude: number;
  longitude: number;
  photoBase64: string;
  timestamp: string;
  deviceId: string;
  remarks?: string;
}

interface CheckOutPayload {
  employeeId: string;
  latitude: number;
  longitude: number;
  photoBase64: string;
  timestamp: string;
  deviceId: string;
  remarks?: string;
  autoCalculate: boolean;
}

interface RemoteCheckinPayload {
  employeeId: string;
  latitude: number;
  longitude: number;
  checkinType: string;
  clientName: string;
  purpose: string;
  photoEvidence: string;
  requiresApproval: boolean;
  timestamp: string;
  deviceId: string;
}

interface CorrectionRequestPayload {
  employeeId: string;
  attendanceDate: string;
  currentCheckIn?: string;
  currentCheckOut?: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  supportingDocument?: string;
}

interface BreakStartPayload {
  employeeId: string;
  breakType: string;
  timestamp: string;
  latitude: number;
  longitude: number;
}

interface BreakEndPayload {
  employeeId: string;
  breakId: string;
  timestamp: string;
}

// ── Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface TodayAttendanceData {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  shiftCode: string;
  shiftStart: string;
  shiftEnd: string;
  status: "checked_in" | "checked_out" | "on_duty" | "absent" | "on_leave";
  category: "regular" | "remote" | "holiday" | "weekly_off";
  workedMinutes: number;
  lateMinutes: number;
  earlyOutMinutes: number;
  overtimeMinutes: number;
  checkInWithinGeofence: boolean;
  checkOutWithinGeofence: boolean;
  checkInPhotoUrl: string;
  checkOutPhotoUrl: string;
  remarks: string;
  checkinType: string;
  clientName: string;
  purpose: string;
  remoteApprovalStatus: "pending" | "approved" | "rejected" | null;
}

interface TimelineEvent {
  type: string; // e.g., "check_in", "check_out", "break_start", "break_end"
  time: string;
  latitude: number;
  longitude: number;
  source: string; // e.g., "mobile", "web", "device"
  withinGeofence: boolean;
}

export interface TimelineData {
  employeeId: string;
  date: string;
  events: TimelineEvent[];
}

export interface SummaryData {
  employeeId: string;
  month: number;
  year: number;
  presentDays: number;
  absentDays: number;
  onLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  lateDays: number;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
  recordedDays: number;
}

export interface HistoryData {
  totalElements: number;
  totalPages: number;
  pageable: {
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    offset: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  content: TodayAttendanceData[];
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface GeofenceValidateData {
  withinGeofence: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  branchId: string;
  branchName: string;
  message: string;
}

export interface BreakData {
  id: string;
  employeeId: string;
  attendanceDate: string;
  breakType: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  status: "active" | "completed" | "cancelled";
}

export interface CorrectionRequestData {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  attendanceDate: string;
  currentCheckIn: string | null;
  currentCheckOut: string | null;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  reason: string;
  supportingDocument: string;
  source: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  approverRemarks: string;
  approvedBy: string;
  decidedAt: string;
  createdAt: string;
}

export const mobileAttendanceService = {
  async getToday(params: TodayQuery) {
    return apiService.get(API_ENDPOINTS.MOBILE_ATTENDANCE.GET_TODAY, {
      params,
    });
  },

  async getTimeline(params: TimelineQuery) {
    return apiService.get(API_ENDPOINTS.MOBILE_ATTENDANCE.GET_TIMELINE, {
      params,
    });
  },

  async getSummary(params: SummaryQuery) {
    return apiService.get(API_ENDPOINTS.MOBILE_ATTENDANCE.GET_SUMMARY, {
      params,
    });
  },

  async getHistory(params: HistoryQuery) {
    return apiService.get(API_ENDPOINTS.MOBILE_ATTENDANCE.GET_HISTORY, {
      params,
    });
  },

  async validateGeofence(params: GeofenceValidateQuery) {
    return apiService.get(API_ENDPOINTS.MOBILE_ATTENDANCE.GEOFENCE_VALIDATE, {
      params,
    });
  },

  async checkIn(payload: CheckInPayload) {
    return apiService.post(
      API_ENDPOINTS.MOBILE_ATTENDANCE.POST_CHECKIN,
      payload,
    );
  },

  async checkOut(payload: CheckOutPayload) {
    return apiService.post(
      API_ENDPOINTS.MOBILE_ATTENDANCE.POST_CHECKOUT,
      payload,
    );
  },

  async remoteCheckin(payload: RemoteCheckinPayload) {
    return apiService.post(
      API_ENDPOINTS.MOBILE_ATTENDANCE.POST_REMOTE_CHECKIN,
      payload,
    );
  },

  async requestCorrection(payload: CorrectionRequestPayload) {
    return apiService.post(
      API_ENDPOINTS.MOBILE_ATTENDANCE.POST_CORRECTION,
      payload,
    );
  },

  async startBreak(payload: BreakStartPayload) {
    return apiService.post(
      API_ENDPOINTS.MOBILE_ATTENDANCE.POST_BREAK_START,
      payload,
    );
  },

  async endBreak(payload: BreakEndPayload) {
    return apiService.post(
      API_ENDPOINTS.MOBILE_ATTENDANCE.POST_BREAK_END,
      payload,
    );
  },
};

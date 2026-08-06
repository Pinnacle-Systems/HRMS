import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";
import type {
  SummaryQuery,
  AttendanceDetailedQuery,
  MusterQuery,
  DailyStatusPayload,
  CheckInPayload,
  CheckOutPayload,
  CorrectionRequestPayload,
  CorrectionApprovePayload,
  ProcessAttendancePayload,
  BulkProcessPayload,
  FinalisePayload,
  UnlockPayload,
  LockPayload,
  MonthYearQuery,
  LateArrivalQuery,
  OvertimeQuery,
  AbsenteeismQuery,
  DateRangeQuery,
  EmployeeHistoryQuery,
  LeaveUtilizationQuery,
  PayrollConsolidated,
  OvertimeCalculateParams,
  LopCalculateParams,
  ExportMonthlyParams,
  RemoteCheckinApproveParams,
  SendRemindersParams,
  OvertimeApproveParams,
  ImportPunchesParams,
  ImportFileParams,
  BulkCheckinPayload,
} from "./attendanceTypes";
export const USE_MOCK_ATTENDANCE_SERVICE =
  import.meta.env.VITE_USE_MOCK_ATTENDANCE_SERVICE === "true";

// ── Service ────────────────────────────────────────────────────────────────
export const attendanceService = {
  // ── GET ──
  async getToday(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockToday(params), "Today's attendance loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_TODAY, { params });
  },

  async getSummary(params?: SummaryQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockSummary(params), "Summary loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_SUMMARY, { params });
  },

  async getDetailed(params?: AttendanceDetailedQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockDetailed(params), "Attendance records loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_DETAILED, { params });
  },

  async getEmployeeAttendance(
    employeeId: string,
    params?: { fromDate?: string; toDate?: string },
  ) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockEmployeeAttendance(employeeId, params), "Employee attendance loaded");
    // }
    return apiService.get(
      API_ENDPOINTS.ATTENDANCE.GET_EMPLOYEE_ATTENDANCE(employeeId),
      { params },
    );
  },

  async getRegister(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockRegister(params), "Daily register loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_REGISTER, { params });
  },

  async getMuster(params: MusterQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockMuster(params), "Muster register loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_MUSTER, { params });
  },

  async getMonthlyRegister(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockMonthlyRegister(params as any), "Monthly register loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_MONTHLY_REGISTER, {
      params,
    });
  },

  async getAttendanceInfo(employeeId: string) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockAttendanceInfo(employeeId), "Attendance info loaded");
    // }
    return apiService.get(
      API_ENDPOINTS.ATTENDANCE.GET_ATTENDANCE_INFO(employeeId),
    );
  },

  async getHolidays(params?: { year?: number; month?: number }) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockHolidays(params), "Holidays loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_HOLIDAYS, { params });
  },

  async getCorrections(params?: Record<string, any>) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockCorrections(params), "Correction requests loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_CORRECTIONS, { params });
  },

  async getCorrectionById(id: string) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockCorrectionById(id), "Correction request loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_CORRECTIONS_BYID(id));
  },

  async getFinalisedPeriods(params?: { year?: number }) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockFinalisedPeriods(params), "Finalised periods loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_FINALISED, { params });
  },

  // ── POST ──
  async postDailyStatus(payload: DailyStatusPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockDailyStatus(payload), "Daily status posted");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_DAILY_STATUS, payload);
  },

  async checkIn(payload: CheckInPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.mockCheckIn(payload), "Check-in recorded");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_CHECKIN, payload);
  },

  async checkOut(payload: CheckOutPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.mockCheckOut(payload), "Check-out recorded");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_CHECKOUT, payload);
  },

  async requestCorrection(payload: CorrectionRequestPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockRequestCorrection(payload), "Correction request submitted");
    // }
    return apiService.post(
      API_ENDPOINTS.ATTENDANCE.POST_CORRECTION_REQ,
      payload,
    );
  },

  async approveCorrection(id: string, payload: CorrectionApprovePayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockApproveCorrection(id, payload), "Correction request updated");
    // }
    return apiService.post(
      API_ENDPOINTS.ATTENDANCE.POST_CORRECTION_APPROVE(id),
      payload,
    );
  },

  async processAttendance(payload: ProcessAttendancePayload) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_PROCESS, payload);
  },

   async validateAttendance(payload: ProcessAttendancePayload) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.VALIDATE, payload);
  },

  async processAndCloseAttendance(payload: ProcessAttendancePayload) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.PROCESS_AND_CLOSE, payload);
  },

  async bulkProcess(payload: BulkProcessPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(
    //     Mock.postMockProcessResult({ fromDate: payload.processDate, toDate: payload.processDate, employeeIds: payload.employeeIds }),
    //     "Bulk attendance processed"
    //   );
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_BULK_PROCESS, payload);
  },

  async finalise(payload: FinalisePayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockFinalise(payload), "Period finalised");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_FINALISE, payload);
  },

  async unlock(payload: UnlockPayload) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.postMockUnlock(payload), "Period unlocked");
    // }
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_UNLOCK, payload);
  },

  async lock(payload: LockPayload) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.POST_LOCK, payload);
  },

  async getAllLocks() {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.GET_LOCKS);
  },

  // ── Reports ──
  async getReportMonthlySummary(params: MonthYearQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportMonthlySummary(params as any), "Monthly summary report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_MONTHLY_SUMMARY, {
      params,
    });
  },

  async getReportLateArrival(params: LateArrivalQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportLateArrival(params as any), "Late arrival report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_LATE_ARRIVAL, {
      params,
    });
  },

  async getReportOvertime(params: OvertimeQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportOvertime(params as any), "Overtime report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_OVERTIME, { params });
  },

  async getReportAbsenteeism(params: AbsenteeismQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportAbsenteeism(params as any), "Absenteeism report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_ABSENTEEISM, {
      params,
    });
  },

  async getReportIrregularPunch(params: DateRangeQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportIrregularPunch(params as any), "Irregular punch report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_IRREGULAR_PUNCH, {
      params,
    });
  },

  async getReportDepartmentWise(params: DateRangeQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportDepartmentWise(), "Department-wise report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_DEPARTMENT_WISE, {
      params,
    });
  },

  async getReportEmployeeHistory(params: EmployeeHistoryQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportEmployeeHistory(params), "Employee history report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_EMPLOYEE_HISTORY, {
      params,
    });
  },

  async getReportLeaveUtilization(params: LeaveUtilizationQuery) {
    // if (USE_MOCK_ATTENDANCE_SERVICE) {
    //   return Mock.mockResponse(Mock.getMockReportLeaveUtilization(params as any), "Leave utilization report loaded");
    // }
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REPORT_LEAVE_UTILIZATION, {
      params,
    });
  },

  async exportReport(
    type: string,
    format: "excel" | "pdf" | "csv",
    params: Record<string, any>,
  ) {
    return apiService.get<{
      success: boolean;
      message: string;
      data: { fileUrl: string };
    }>(API_ENDPOINTS.ATTENDANCE.REPORT_EXPORT(type, format), { params });
  },

  async getPayrollConsolidated(params: PayrollConsolidated) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.PAYROLL_CONSOLIDATE, {
      params,
    });
  },

  async getShiftSchedule(employeeId: string, params?: { days?: number }) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.SHIFT_SCHEDULE(employeeId), {
      params,
    });
  },

  async getRemoteCheckins(params?: { status?: string }) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.REMOTE_CHECKINS, { params });
  },

  async calculateOvertime(params: OvertimeCalculateParams) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.OT_CALCULATE, { params });
  },

  async getOvertimeApprovalRequired(params: {
    managerId?: string;
    departmentId?: string;
    dateRangeStart?: string;
  }) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.OT_APPROVAL_REQ, { params });
  },

  async calculateLop(params: LopCalculateParams) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.LOP_CALCULATE, { params });
  },

  async exportMonthly(params: ExportMonthlyParams) {
    return apiService.get<{
      success: boolean;
      message: string;
      data: { fileUrl: string };
    }>(API_ENDPOINTS.ATTENDANCE.EXPORT_MONTHLY, { params });
  },

  async getEmployeesOnLeaveToday(params?: {
    departmentId?: string;
    leaveType?: string;
  }) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.LEAVE_TODAY, { params });
  },

  // async getDashboardSummary(params?: {
  //   date?: string;
  //   departmentId?: string;
  //   period?: "daily" | "weekly" | "monthly";
  // }) {
  //   return apiService.get(API_ENDPOINTS.ATTENDANCE./dashboard/summary", { params });
  // },

  async getCalendarHolidays(params?: {
    year?: number;
    state?: string;
    holidayType?: string;
  }) {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.CALENDAR_HOLIDAYS, {
      params,
    });
  },

  async approveRemoteCheckin(id: string, data: RemoteCheckinApproveParams) {
    return apiService.put(API_ENDPOINTS.ATTENDANCE.REM_CHK_APPROVE(id), data);
  },

  async rejectRemoteCheckin(id: string, data: RemoteCheckinApproveParams) {
    return apiService.put(API_ENDPOINTS.ATTENDANCE.REM_CHK_REJECT(id), data);
  },

  async sendReminders(data: SendRemindersParams) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.SEND_REMINDERS, data);
  },

  async approveOvertime(id: string, data: OvertimeApproveParams) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.OT_APPROVE(id), data);
  },

  async importAttendance(data: ImportPunchesParams) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.IMPORT, data);
  },

  async importAttendanceFile(params: ImportFileParams, file: File) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    if (params.format) formData.append("format", params.format);
    if (params.source) formData.append("source", params.source);
    if (params.type) formData.append("type", params.type);
    if (params.startDate) formData.append("startDate", params.startDate);
    if (params.endDate) formData.append("endDate", params.endDate);
    return apiService.post(API_ENDPOINTS.ATTENDANCE.IMPORT_FILE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async bulkCheckin(data: BulkCheckinPayload) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.BULK_CHECKIN, data);
  },

  async bulkCheckOut(data: BulkCheckinPayload) {
    return apiService.post(API_ENDPOINTS.ATTENDANCE.BULK_CHECKOUT, data);
  },

  async downloadImportTemplate() {
    const response = await apiService.axiosInstance.get(
      API_ENDPOINTS.ATTENDANCE.DOWNLOAD_TEMP,
      {
        responseType: "blob",
      },
    );

    const blob = response.data;

    if (!blob || blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    if (blob.type === "application/json" || blob.type === "text/plain") {
      const text = await blob.text();
      let errMsg = "Failed to download template.";
      try {
        const json = JSON.parse(text);
        if (json.message) errMsg = json.message;
      } catch {
        if (text) errMsg = text;
      }
      throw new Error(errMsg);
    }

    let filename = "employee_bulk_upload_template.xlsx";
    const disposition = response.headers["content-disposition"];
    if (disposition && disposition.indexOf("attachment") !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
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
  },

  async autoAssignShift() {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.AUTO_ASSIGN_SHIFT);
  },

  async otApprovalReq() {
    return apiService.get(API_ENDPOINTS.ATTENDANCE.OT_APPROVAL_REQUIRED);
  },

  async toogleAutoAssignShift(data: any) {
    return apiService.put(API_ENDPOINTS.ATTENDANCE.AUTO_ASSIGN_SHIFT, data);
  },

  async toogleOtApprovalReq(data: any) {
    return apiService.put(API_ENDPOINTS.ATTENDANCE.OT_APPROVAL_REQUIRED, data);
  },
};

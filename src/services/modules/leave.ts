import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  mockCompOffCreditRequests,
  mockCompOffCredits,
  mockHolidayCalendars,
  mockLeaveBalances,
  mockLeaveLedger,
  mockLeavePolicies,
  mockLeaveRequests,
  mockLeaveTypes,
  mockPayrollLeaveInputs,
  mockTeamCalendar,
  mockWorkCalendars,
} from "./leaveMockData";
import type {
  CompOffCredit,
  CompOffCreditRequest,
  CompOffCreditRequestPayload,
  HolidayCalendar,
  LeaveAdjustmentPayload,
  LeaveApiResponse,
  LeaveBalance,
  LeaveCalculationRequest,
  LeaveCalculationResult,
  LeaveLedgerEntry,
  LeaveListParams,
  LeavePolicy,
  LeaveRequest,
  LeaveType,
  PageResponse,
  PayrollLeaveInput,
  WorkCalendar,
} from "./leaveTypes";

export const USE_MOCK_LEAVE_SERVICE = true;
const MOCK_EMPLOYEE_ID = "emp-100";

type CreateLeaveRequestPayload = Partial<LeaveRequest>;
type LeaveActionPayload = {
  remarks?: string;
};

function mockResponse<T>(data: T, message = "Success"): LeaveApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function normalizePage(params?: LeaveListParams) {
  return {
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  };
}

function applySearch<T>(items: T[], search?: string): T[] {
  if (!search?.trim()) {
    return items;
  }

  const normalized = search.trim().toLowerCase();
  return items.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(normalized),
  );
}

function applySort<T>(items: T[], sort?: string): T[] {
  if (!sort) {
    return items;
  }

  const [field, direction = "ASC"] = sort.split(",");
  if (!field) {
    return items;
  }

  return [...items].sort((left, right) => {
    const leftValue = String((left as Record<string, unknown>)[field] ?? "");
    const rightValue = String((right as Record<string, unknown>)[field] ?? "");
    const result = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return direction.toUpperCase() === "DESC" ? -result : result;
  });
}

function paginate<T>(items: T[], params?: LeaveListParams): PageResponse<T> {
  const { page, size } = normalizePage(params);
  const searched = applySearch(items, params?.search);
  const sorted = applySort(searched, params?.sort);
  const start = page * size;
  const content = sorted.slice(start, start + size);

  return {
    content,
    totalElements: sorted.length,
    totalPages: Math.ceil(sorted.length / size),
    page,
    size,
  };
}

function updateStatus(
  id: string,
  status: LeaveRequest["status"],
  payload?: LeaveActionPayload,
): LeaveRequest {
  const requestIndex = mockLeaveRequests.findIndex((item) => item.id === id);
  const request = mockLeaveRequests[requestIndex];
  if (!request) {
    throw new Error("Leave request not found");
  }

  const updated = {
    ...request,
    status,
    approverRemarks: payload?.remarks ?? request.approverRemarks,
  };
  mockLeaveRequests[requestIndex] = updated;
  return updated;
}

class LeaveService {
  async getLeaves(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<LeaveRequest>>>(
        API_ENDPOINTS.LEAVE.BASE,
        { params },
      );
    }

    let requests = mockLeaveRequests;
    if (params?.status) {
      requests = requests.filter((request) => request.status === params.status);
    }
    if (params?.employeeId) {
      requests = requests.filter(
        (request) => request.employeeId === params.employeeId,
      );
    }
    if (params?.managerId) {
      requests = requests.filter(
        (request) => request.managerId === params.managerId,
      );
    }
    if (params?.department) {
      requests = requests.filter(
        (request) => request.department === params.department,
      );
    }
    if (params?.leaveTypeId) {
      requests = requests.filter(
        (request) => request.leaveTypeId === params.leaveTypeId,
      );
    }
    if (params?.fromDate) {
      requests = requests.filter(
        (request) => request.toDate >= params.fromDate!,
      );
    }
    if (params?.toDate) {
      requests = requests.filter((request) => request.fromDate <= params.toDate!);
    }

    return mockResponse(paginate(requests, params), "Leave requests loaded");
  }

  async getManagerLeaveApprovals(params?: LeaveListParams) {
    return this.getLeaves({ ...params, managerId: params?.managerId ?? "emp-200" });
  }

  async createLeave(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(
        API_ENDPOINTS.LEAVE.BASE,
        payload,
      ) as Promise<LeaveApiResponse<LeaveRequest>>;
    }

    const leaveType = mockLeaveTypes.find(
      (item) => item.id === payload.leaveTypeId,
    ) ?? mockLeaveTypes[0];
    const created: LeaveRequest = {
      id: `lv-${Date.now()}`,
      employeeId: payload.employeeId ?? MOCK_EMPLOYEE_ID,
      employeeCode: payload.employeeCode ?? "PNI001",
      employeeName: payload.employeeName ?? "Aarav Menon",
      department: payload.department ?? "Engineering",
      location: payload.location ?? "Bengaluru",
      managerId: payload.managerId ?? "emp-200",
      managerName: payload.managerName ?? "Nisha Rao",
      leaveTypeId: leaveType.id,
      leaveTypeCode: leaveType.code,
      leaveTypeName: leaveType.name,
      fromDate: payload.fromDate ?? new Date().toISOString().slice(0, 10),
      toDate: payload.toDate ?? payload.fromDate ?? new Date().toISOString().slice(0, 10),
      dayType: payload.dayType ?? "FULL_DAY",
      days: payload.days ?? 1,
      reason: payload.reason ?? "Mock leave request",
      status: payload.status ?? "PENDING",
      appliedOn: new Date().toISOString().slice(0, 10),
    };

    return mockResponse(created, "Leave request submitted");
  }

  async createLeaveRequest(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    return this.createLeave(payload);
  }

  async getLeaveById(id: string) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<LeaveRequest>>(
        API_ENDPOINTS.LEAVE.GET_BY_ID(id),
      );
    }

    const request = mockLeaveRequests.find((item) => item.id === id);
    return mockResponse(request ?? null, request ? "Leave request loaded" : "Leave request not found");
  }

  async calculateLeave(
    payload: LeaveCalculationRequest,
  ): Promise<LeaveApiResponse<LeaveCalculationResult>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(
        API_ENDPOINTS.LEAVE.CALCULATE,
        payload,
      ) as Promise<LeaveApiResponse<LeaveCalculationResult>>;
    }

    const from = new Date(payload.fromDate);
    const to = new Date(payload.toDate);
    const holidayDates = new Set(
      mockHolidayCalendars.flatMap((calendar) =>
        calendar.holidays.map((holiday) => holiday.date),
      ),
    );
    const excludedHolidays: string[] = [];
    const excludedWeeklyOffs: string[] = [];
    let requestedDays = 0;
    const cursor = new Date(from);

    while (cursor <= to) {
      const isoDate = cursor.toISOString().slice(0, 10);
      const day = cursor.getDay();
      const isWeeklyOff = day === 0 || day === 6;
      const isHoliday = holidayDates.has(isoDate);

      if (isWeeklyOff) {
        excludedWeeklyOffs.push(isoDate);
      } else if (isHoliday) {
        excludedHolidays.push(isoDate);
      } else {
        let dayValue = 1;
        const isSameDay = payload.fromDate === payload.toDate;
        const isFirstDay = isoDate === payload.fromDate;
        const isLastDay = isoDate === payload.toDate;

        if (isSameDay) {
          dayValue =
            payload.fromSession && payload.fromSession !== "FULL_DAY" ? 0.5 : 1;
        } else {
          if (isFirstDay && payload.fromSession !== "FULL_DAY") {
            dayValue -= 0.5;
          }
          if (isLastDay && payload.toSession !== "FULL_DAY") {
            dayValue -= 0.5;
          }
        }
        requestedDays += Math.max(0.5, dayValue);
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    const balance =
      mockLeaveBalances.find(
        (item) =>
          item.employeeId === payload.employeeId &&
          item.leaveTypeId === payload.leaveTypeId,
      )?.balance ?? 0;

    const result: LeaveCalculationResult = {
      days: requestedDays,
      workingDays: requestedDays,
      holidays: excludedHolidays,
      weeklyOffs: excludedWeeklyOffs,
      availableBalance: balance,
      lopDays: Math.max(0, requestedDays - balance),
    };

    return mockResponse(result, "Leave calculation completed");
  }

  async calculateLeaveDays(
    payload: LeaveCalculationRequest,
  ): Promise<LeaveApiResponse<LeaveCalculationResult>> {
    return this.calculateLeave(payload);
  }

  async getMyLeaves(params?: LeaveListParams) {
    return this.getLeaves({ ...params, employeeId: MOCK_EMPLOYEE_ID });
  }

  async withdrawLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(
        API_ENDPOINTS.LEAVE.WITHDRAW(id),
        payload ?? {},
      ) as Promise<LeaveApiResponse<LeaveRequest>>;
    }

    return mockResponse(updateStatus(id, "WITHDRAWN", payload), "Leave withdrawn");
  }

  async withdrawLeaveRequest(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    return this.withdrawLeave(id, payload);
  }

  async cancelLeaveRequest(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(
        API_ENDPOINTS.LEAVE.CANCEL_REQUEST(id),
        payload ?? {},
      ) as Promise<LeaveApiResponse<LeaveRequest>>;
    }

    return mockResponse(
      updateStatus(id, "CANCEL_REQUESTED", payload),
      "Cancellation requested",
    );
  }

  async requestLeaveCancellation(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    return this.cancelLeaveRequest(id, payload);
  }

  async approveLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(
        API_ENDPOINTS.LEAVE.APPROVE(id),
        payload ?? {},
      ) as Promise<LeaveApiResponse<LeaveRequest>>;
    }

    return mockResponse(updateStatus(id, "APPROVED", payload), "Leave approved");
  }

  async rejectLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(
        API_ENDPOINTS.LEAVE.REJECT(id),
        payload ?? {},
      ) as Promise<LeaveApiResponse<LeaveRequest>>;
    }

    return mockResponse(updateStatus(id, "REJECTED", payload), "Leave rejected");
  }

  async requestLeaveClarification(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    return mockResponse(
      updateStatus(id, "PENDING", payload),
      "Clarification requested",
    );
  }

  async overrideLeave(id: string, payload?: LeaveActionPayload) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(API_ENDPOINTS.LEAVE.OVERRIDE(id), payload ?? {});
    }

    return mockResponse(updateStatus(id, "APPROVED", payload), "Leave overridden");
  }

  async getEmployeeLeaveBalances(employeeId: string, params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<LeaveBalance>>>(
        API_ENDPOINTS.EMPLOYEE.LEAVE_BALANCES(employeeId),
        { params },
      );
    }

    const balances = mockLeaveBalances.filter(
      (item) => item.employeeId === employeeId,
    );
    return mockResponse(paginate(balances, params), "Leave balances loaded");
  }

  async getEmployeeLeaveLedger(employeeId: string, params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<LeaveLedgerEntry>>>(
        API_ENDPOINTS.EMPLOYEE.LEAVE_LEDGER(employeeId),
        { params },
      );
    }

    const ledger = mockLeaveLedger.filter((item) => item.employeeId === employeeId);
    return mockResponse(paginate(ledger, params), "Leave ledger loaded");
  }

  async createLeaveAdjustment(employeeId: string, payload: LeaveAdjustmentPayload) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(
        API_ENDPOINTS.EMPLOYEE.LEAVE_ADJUSTMENTS(employeeId),
        payload,
      );
    }

    const entry: LeaveLedgerEntry = {
      id: `ll-${Date.now()}`,
      employeeId,
      leaveTypeId: payload.leaveTypeId,
      transactionDate: new Date().toISOString().slice(0, 10),
      transactionType: "ADJUSTMENT",
      days: payload.days,
      remarks: payload.reason,
    };
    return mockResponse(entry, "Leave adjustment created");
  }

  async getLeaveTypes(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<LeaveType>>>(
        API_ENDPOINTS.LEAVE_TYPE.BASE,
        { params },
      );
    }

    return mockResponse(paginate(mockLeaveTypes, params), "Leave types loaded");
  }

  async createLeaveType(payload: Partial<LeaveType>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(API_ENDPOINTS.LEAVE_TYPE.BASE, payload);
    }

    const created: LeaveType = {
      id: `lt-${Date.now()}`,
      code: payload.code ?? "NEW",
      name: payload.name ?? "New Leave Type",
      description: payload.description ?? "",
      paid: payload.paid ?? true,
      enabled: payload.enabled ?? true,
      color: payload.color ?? "#e16a3d",
      maxDaysPerRequest: payload.maxDaysPerRequest,
      requiresDocumentAfterDays: payload.requiresDocumentAfterDays,
    };
    return mockResponse(created, "Leave type created");
  }

  async updateLeaveType(id: string, payload: Partial<LeaveType>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.put(API_ENDPOINTS.LEAVE_TYPE.UPDATE(id), payload);
    }

    const existing = mockLeaveTypes.find((item) => item.id === id);
    return mockResponse(
      { ...existing, ...payload, id } as LeaveType,
      "Leave type updated",
    );
  }

  async getLeavePolicies(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<LeavePolicy>>>(
        API_ENDPOINTS.LEAVE_POLICY.BASE,
        { params },
      );
    }

    return mockResponse(paginate(mockLeavePolicies, params), "Leave policies loaded");
  }

  async createLeavePolicy(payload: Partial<LeavePolicy>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.post(API_ENDPOINTS.LEAVE_POLICY.BASE, payload);
    }

    return mockResponse(
      {
        id: `lp-${Date.now()}`,
        name: payload.name ?? "New Leave Policy",
        leaveTypeId: payload.leaveTypeId ?? "lt-el",
        appliesTo: payload.appliesTo ?? "All employees",
        accrualFrequency: payload.accrualFrequency ?? "MONTHLY",
        annualEntitlement: payload.annualEntitlement ?? 0,
        carryForwardLimit: payload.carryForwardLimit ?? 0,
        encashable: payload.encashable ?? false,
        active: payload.active ?? true,
      },
      "Leave policy created",
    );
  }

  async getHolidayCalendars(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<HolidayCalendar>>>(
        API_ENDPOINTS.HOLIDAY_CALENDAR.BASE,
        { params },
      );
    }

    return mockResponse(
      paginate(mockHolidayCalendars, params),
      "Holiday calendars loaded",
    );
  }

  async selectOptionalHoliday(holidayId: string) {
    const holiday = mockHolidayCalendars
      .flatMap((calendar) => calendar.holidays)
      .find((item) => item.id === holidayId);

    return mockResponse(
      { holidayId, selected: true },
      holiday ? `${holiday.name} selected` : "Optional holiday selected",
    );
  }

  async getCompOffCredits(params?: LeaveListParams) {
    const credits = mockCompOffCredits.filter(
      (item) => !params?.employeeId || item.employeeId === params.employeeId,
    );
    return mockResponse(
      paginate<CompOffCredit>(credits, params),
      "Comp-off credits loaded",
    );
  }

  async getCompOffCreditRequests(params?: LeaveListParams) {
    const requests = mockCompOffCreditRequests.filter(
      (item) => !params?.employeeId || item.employeeId === params.employeeId,
    );
    return mockResponse(
      paginate<CompOffCreditRequest>(requests, params),
      "Comp-off request history loaded",
    );
  }

  async requestCompOffCredit(payload: CompOffCreditRequestPayload) {
    const requestedDays = payload.workedSession === "FULL_DAY" ? 1 : 0.5;
    const request: CompOffCreditRequest = {
      id: `co-req-${Date.now()}`,
      employeeId: payload.employeeId,
      workedDate: payload.workedDate,
      workedSession: payload.workedSession,
      requestedDays,
      reason: payload.reason,
      status: "PENDING",
      submittedOn: new Date().toISOString().slice(0, 10),
      approver: "Nisha Rao",
    };

    return mockResponse(request, "Comp-off credit request submitted");
  }

  async getTeamCalendar(params?: LeaveListParams) {
    return mockResponse(paginate(mockTeamCalendar, params), "Team calendar loaded");
  }

  async getWorkCalendars(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<WorkCalendar>>>(
        API_ENDPOINTS.WORK_CALENDAR.BASE,
        { params },
      );
    }

    return mockResponse(paginate(mockWorkCalendars, params), "Work calendars loaded");
  }

  async getPayrollLeaveInputs(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      return apiService.get<LeaveApiResponse<PageResponse<PayrollLeaveInput>>>(
        API_ENDPOINTS.PAYROLL.LEAVE_INPUTS,
        { params },
      );
    }

    return mockResponse(
      paginate(mockPayrollLeaveInputs, params),
      "Payroll leave inputs loaded",
    );
  }
}

export const leaveService = new LeaveService();

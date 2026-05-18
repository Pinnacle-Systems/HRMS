import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  mapCompOffResponseToCreditViewModel,
  mapCompOffResponseToViewModel,
  mapHolidayCalendarResponseToViewModel,
  mapHolidayResponseToViewModel,
  mapLeaveBalanceResponseToViewModel,
  mapLeaveRequestResponseToViewModel,
  mapLeaveTypeResponseToViewModel,
  mapWorkCalendarResponseToViewModel,
  type CompOffResponse,
  type HolidayCalendarResponse,
  type HolidayResponse,
  type LeaveBalanceResponse,
  type LeaveRequestResponse,
  type LeaveTypeResponse,
  type WorkCalendarResponse,
} from "./leaveAdapters";
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
  LeaveAdjustmentPayload,
  LeaveApiResponse,
  LeaveCalculationRequest,
  LeaveCalculationResult,
  LeaveLedgerEntry,
  LeaveListParams,
  LeavePolicy,
  LeaveRequest,
  LeaveType,
  PageResponse,
  PayrollLeaveInput,
  Holiday,
  HolidayCalendar,
} from "./leaveTypes";

export const USE_MOCK_LEAVE_SERVICE =
  import.meta.env.VITE_USE_MOCK_LEAVE_SERVICE === "true";
const MOCK_EMPLOYEE_ID = "emp-100";

type CreateLeaveRequestPayload = Partial<LeaveRequest>;
type LeaveActionPayload = {
  remarks?: string;
};

type CreateLeaveRequestApiPayload = {
  leaveTypeId?: string;
  fromDate?: string;
  toDate?: string;
  fromSession?: LeaveRequest["dayType"];
  toSession?: LeaveRequest["dayType"];
  appliedReason?: string;
  emergencyContactNumber?: string;
  draft?: boolean;
  approverId?: string;
  holidayCalendarId?: string;
  workCalendarId?: string;
};

type LeaveCalculationResponse = {
  days?: number;
  totalDays?: number;
  requestedDays?: number;
  workingDays?: number;
  holidays?: string[];
  holidayDates?: string[];
  excludedHolidays?: string[];
  weeklyOffs?: string[];
  weeklyOffDates?: string[];
  excludedWeeklyOffs?: string[];
  availableBalance?: number;
  closingBalance?: number;
  balance?: number;
  lopDays?: number;
  lossOfPayDays?: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
};

type SwaggerPageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number?: number;
  page?: number;
  size: number;
};

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success?: unknown }).success === "boolean"
  );
}

function isPageResponse<T>(value: unknown): value is SwaggerPageResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { content?: unknown }).content)
  );
}

export function unwrapApiData<T>(response: ApiEnvelope<T> | T): T {
  if (!isApiEnvelope(response)) {
    return response as T;
  }

  if (response.success === false) {
    throw new Error(response.message || "Leave API request failed");
  }

  if (response.data === undefined) {
    throw new Error(response.message || "Leave API response did not include data");
  }

  return response.data as T;
}

export function unwrapApiList<T>(response: ApiEnvelope<T[]> | T[]): T[] {
  const data = unwrapApiData<T[] | SwaggerPageResponse<T>>(response);
  if (Array.isArray(data)) {
    return data;
  }
  if (isPageResponse<T>(data)) {
    return data.content;
  }

  throw new Error("Leave API response did not include a list");
}

export function unwrapApiPageContent<T>(
  response: ApiEnvelope<SwaggerPageResponse<T>> | SwaggerPageResponse<T>,
): T[] {
  const data = unwrapApiData<SwaggerPageResponse<T>>(response);
  if (!isPageResponse<T>(data)) {
    throw new Error("Leave API response did not include paginated content");
  }

  return data.content;
}

function unwrapApiPage<T>(
  response:
    | ApiEnvelope<SwaggerPageResponse<T> | T[]>
    | SwaggerPageResponse<T>
    | T[],
): PageResponse<T> {
  const data = unwrapApiData<SwaggerPageResponse<T> | T[]>(response);
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      page: 0,
      size: data.length,
    };
  }

  if (!isPageResponse<T>(data)) {
    throw new Error("Leave API response did not include paginated data");
  }

  return {
    content: data.content,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    page: data.page ?? data.number ?? 0,
    size: data.size,
  };
}

function apiResponse<T>(
  response: ApiEnvelope<T>,
  fallbackMessage = "Success",
): LeaveApiResponse<T> {
  return {
    success: true,
    message: response.message ?? fallbackMessage,
    data: unwrapApiData<T>(response),
    timestamp: response.timestamp ?? new Date().toISOString(),
  };
}

function apiPageResponse<T>(
  response: ApiEnvelope<SwaggerPageResponse<T> | T[]>,
  fallbackMessage = "Success",
): LeaveApiResponse<PageResponse<T>> {
  return {
    success: true,
    message: response.message ?? fallbackMessage,
    data: unwrapApiPage<T>(response),
    timestamp: response.timestamp ?? new Date().toISOString(),
  };
}

function apiMappedResponse<TDto, TView>(
  response: ApiEnvelope<TDto>,
  mapper: (dto: TDto) => TView,
  fallbackMessage = "Success",
): LeaveApiResponse<TView> {
  return {
    success: true,
    message: response.message ?? fallbackMessage,
    data: mapper(unwrapApiData<TDto>(response)),
    timestamp: response.timestamp ?? new Date().toISOString(),
  };
}

function apiMappedPageResponse<TDto, TView>(
  response: ApiEnvelope<SwaggerPageResponse<TDto> | TDto[]>,
  mapper: (dto: TDto) => TView,
  fallbackMessage = "Success",
): LeaveApiResponse<PageResponse<TView>> {
  const page = unwrapApiPage<TDto>(response);

  return {
    success: true,
    message: response.message ?? fallbackMessage,
    data: {
      ...page,
      content: page.content.map(mapper),
    },
    timestamp: response.timestamp ?? new Date().toISOString(),
  };
}

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

function buildLeaveRequestApiParams(params?: LeaveListParams) {
  if (!params) {
    return undefined;
  }

  const { status, fromDate, toDate, ...rest } = params;
  return {
    ...rest,
    currentStatus: status,
    startDate: fromDate,
    endDate: toDate,
  };
}

function filterLeaveRequests(
  requests: LeaveRequest[],
  params?: LeaveListParams,
) {
  let filtered = requests;
  if (params?.status) {
    filtered = filtered.filter((request) => request.status === params.status);
  }
  if (params?.leaveTypeId) {
    filtered = filtered.filter(
      (request) => request.leaveTypeId === params.leaveTypeId,
    );
  }
  if (params?.fromDate) {
    filtered = filtered.filter((request) => request.toDate >= params.fromDate!);
  }
  if (params?.toDate) {
    filtered = filtered.filter((request) => request.fromDate <= params.toDate!);
  }

  return filtered;
}

function attachHolidaysToCalendars(
  calendars: HolidayCalendar[],
  holidays: Holiday[],
): HolidayCalendar[] {
  if (holidays.length === 0) {
    return calendars;
  }

  if (calendars.length === 0) {
    return [
      {
        id: "holiday-calendar",
        name: "Holiday Calendar",
        year: new Date().getFullYear(),
        locations: Array.from(
          new Set(holidays.map((holiday) => holiday.location).filter(Boolean)),
        ),
        holidays,
      },
    ];
  }

  const holidaysByCalendarId = new Map<string, Holiday[]>();
  const unassignedHolidays: Holiday[] = [];

  holidays.forEach((holiday) => {
    if (holiday.calendarId) {
      const existing = holidaysByCalendarId.get(holiday.calendarId) ?? [];
      holidaysByCalendarId.set(holiday.calendarId, [...existing, holiday]);
      return;
    }
    unassignedHolidays.push(holiday);
  });

  return calendars.map((calendar, index) => {
    const matchedHolidays = holidaysByCalendarId.get(calendar.id) ?? [];
    const shouldReceiveUnassigned =
      unassignedHolidays.length > 0 && (calendars.length === 1 || index === 0);
    const calendarHolidays = shouldReceiveUnassigned
      ? [...matchedHolidays, ...unassignedHolidays]
      : matchedHolidays;

    return {
      ...calendar,
      holidays: calendarHolidays.map((holiday) => ({
        ...holiday,
        location:
          holiday.location ||
          calendar.branchName ||
          calendar.locations.join(", "),
      })),
    };
  });
}

function normalizeDateList(value?: string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function mapLeaveCalculationResponseToViewModel(
  dto: LeaveCalculationResponse,
): LeaveCalculationResult {
  const days = dto.days ?? dto.totalDays ?? dto.requestedDays ?? dto.workingDays ?? 0;
  const availableBalance =
    dto.availableBalance ?? dto.closingBalance ?? dto.balance ?? 0;

  return {
    days,
    workingDays: dto.workingDays ?? days,
    holidays: normalizeDateList(
      dto.holidays ?? dto.holidayDates ?? dto.excludedHolidays,
    ),
    weeklyOffs: normalizeDateList(
      dto.weeklyOffs ?? dto.weeklyOffDates ?? dto.excludedWeeklyOffs,
    ),
    availableBalance,
    lopDays: dto.lopDays ?? dto.lossOfPayDays ?? Math.max(0, days - availableBalance),
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
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<LeaveRequestResponse> | LeaveRequestResponse[]>>(
        API_ENDPOINTS.LEAVE.BASE,
        { params: buildLeaveRequestApiParams(params) },
      );
      const mappedResponse = apiMappedPageResponse(
        response,
        mapLeaveRequestResponseToViewModel,
        "Leave requests loaded",
      );
      if (!mappedResponse.data) {
        return mappedResponse;
      }

      const content = filterLeaveRequests(mappedResponse.data.content, params);
      return {
        ...mappedResponse,
        data: {
          ...mappedResponse.data,
          content,
          totalElements: content.length,
          totalPages: Math.ceil(content.length / mappedResponse.data.size),
        },
      };
    }

    let requests = mockLeaveRequests;
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
    requests = filterLeaveRequests(requests, params);

    return mockResponse(paginate(requests, params), "Leave requests loaded");
  }

  async getManagerLeaveApprovals(params?: LeaveListParams) {
    return this.getLeaves({ ...params, managerId: params?.managerId ?? "emp-200" });
  }

  async createLeave(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const apiPayload: CreateLeaveRequestApiPayload = {
        leaveTypeId: payload.leaveTypeId,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        fromSession: payload.fromSession ?? payload.dayType ?? "FULL_DAY",
        toSession: payload.toSession ?? payload.dayType ?? "FULL_DAY",
        appliedReason: payload.reason,
        emergencyContactNumber: payload.emergencyContactNumber,
        draft: payload.status === "DRAFT",
        approverId: payload.approverId,
        holidayCalendarId: payload.holidayCalendarId,
        workCalendarId: payload.workCalendarId,
      };
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.BASE,
        apiPayload,
      ) as ApiEnvelope<LeaveRequestResponse>;
      return apiMappedResponse(
        response,
        mapLeaveRequestResponseToViewModel,
        "Leave request submitted",
      );
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
      const response = await apiService.get<ApiEnvelope<LeaveRequestResponse>>(
        API_ENDPOINTS.LEAVE.GET_BY_ID(id),
      );
      return apiMappedResponse(
        response,
        mapLeaveRequestResponseToViewModel,
        "Leave request loaded",
      );
    }

    const request = mockLeaveRequests.find((item) => item.id === id);
    return mockResponse(request ?? null, request ? "Leave request loaded" : "Leave request not found");
  }

  async calculateLeave(
    payload: LeaveCalculationRequest,
  ): Promise<LeaveApiResponse<LeaveCalculationResult>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.CALCULATE,
        {
          employeeId: payload.employeeId,
          leaveTypeId: payload.leaveTypeId,
          fromDate: payload.fromDate,
          toDate: payload.toDate,
          fromSession: payload.fromSession ?? payload.dayType ?? "FULL_DAY",
          toSession: payload.toSession ?? payload.dayType ?? "FULL_DAY",
          holidayCalendarId: payload.holidayCalendarId,
          workCalendarId: payload.workCalendarId,
        },
      ) as ApiEnvelope<LeaveCalculationResponse>;
      return apiMappedResponse(
        response,
        mapLeaveCalculationResponseToViewModel,
        "Leave calculation completed",
      );
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
    const employeeId = params?.employeeId ?? (USE_MOCK_LEAVE_SERVICE ? MOCK_EMPLOYEE_ID : undefined);
    return this.getLeaves({ ...params, employeeId });
  }

  async withdrawLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.WITHDRAW(id),
        payload ?? {},
      ) as ApiEnvelope<LeaveRequestResponse>;
      return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave withdrawn");
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
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.CANCEL_REQUEST(id),
        payload ?? {},
      ) as ApiEnvelope<LeaveRequestResponse>;
      return apiMappedResponse(
        response,
        mapLeaveRequestResponseToViewModel,
        "Cancellation requested",
      );
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
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.APPROVE(id),
        payload ?? {},
      ) as ApiEnvelope<LeaveRequestResponse>;
      return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave approved");
    }

    return mockResponse(updateStatus(id, "APPROVED", payload), "Leave approved");
  }

  async rejectLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.REJECT(id),
        payload ?? {},
      ) as ApiEnvelope<LeaveRequestResponse>;
      return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave rejected");
    }

    return mockResponse(updateStatus(id, "REJECTED", payload), "Leave rejected");
  }

  async requestLeaveClarification(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.REQUEST_CLARIFICATION(id),
        payload ?? {},
      ) as ApiEnvelope<LeaveRequestResponse>;
      return apiMappedResponse(
        response,
        mapLeaveRequestResponseToViewModel,
        "Clarification requested",
      );
    }

    return mockResponse(
      updateStatus(id, "PENDING", payload),
      "Clarification requested",
    );
  }

  async overrideLeave(id: string, payload?: LeaveActionPayload) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE.OVERRIDE(id),
        payload ?? {},
      ) as ApiEnvelope<LeaveRequestResponse>;
      return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave overridden");
    }

    return mockResponse(updateStatus(id, "APPROVED", payload), "Leave overridden");
  }

  async getEmployeeLeaveBalances(employeeId: string, params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<LeaveBalanceResponse> | LeaveBalanceResponse[]>>(
        API_ENDPOINTS.EMPLOYEE.LEAVE_BALANCES(employeeId),
        {
          params: {
            ...params,
            leaveYear: params?.leaveYear ?? new Date().getFullYear(),
          },
        },
      );
      return apiMappedPageResponse(
        response,
        mapLeaveBalanceResponseToViewModel,
        "Leave balances loaded",
      );
    }

    const balances = mockLeaveBalances.filter(
      (item) => item.employeeId === employeeId,
    );
    return mockResponse(paginate(balances, params), "Leave balances loaded");
  }

  async getEmployeeLeaveLedger(employeeId: string, params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<LeaveLedgerEntry>>>(
        API_ENDPOINTS.EMPLOYEE.LEAVE_LEDGER(employeeId),
        { params },
      );
      return apiPageResponse(response, "Leave ledger loaded");
    }

    const ledger = mockLeaveLedger.filter((item) => item.employeeId === employeeId);
    return mockResponse(paginate(ledger, params), "Leave ledger loaded");
  }

  async createLeaveAdjustment(employeeId: string, payload: LeaveAdjustmentPayload) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.EMPLOYEE.LEAVE_ADJUSTMENTS(employeeId),
        payload,
      ) as ApiEnvelope<LeaveLedgerEntry>;
      return apiResponse(response, "Leave adjustment created");
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
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<LeaveTypeResponse> | LeaveTypeResponse[]>>(
        API_ENDPOINTS.LEAVE_TYPE.BASE,
        { params },
      );
      const mappedResponse = apiMappedPageResponse(
        response,
        mapLeaveTypeResponseToViewModel,
        "Leave types loaded",
      );
      return {
        ...mappedResponse,
        data: mappedResponse.data
          ? {
              ...mappedResponse.data,
              content: mappedResponse.data.content.filter(
                (leaveType) => leaveType.enabled,
              ),
            }
          : mappedResponse.data,
      };
    }

    return mockResponse(paginate(mockLeaveTypes, params), "Leave types loaded");
  }

  async createLeaveType(payload: Partial<LeaveType>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE_TYPE.BASE,
        payload,
      ) as ApiEnvelope<LeaveTypeResponse>;
      return apiMappedResponse(response, mapLeaveTypeResponseToViewModel, "Leave type created");
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
      const response = await apiService.put(
        API_ENDPOINTS.LEAVE_TYPE.UPDATE(id),
        payload,
      ) as ApiEnvelope<LeaveTypeResponse>;
      return apiMappedResponse(response, mapLeaveTypeResponseToViewModel, "Leave type updated");
    }

    const existing = mockLeaveTypes.find((item) => item.id === id);
    return mockResponse(
      { ...existing, ...payload, id } as LeaveType,
      "Leave type updated",
    );
  }

  async getLeavePolicies(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<LeavePolicy>>>(
        API_ENDPOINTS.LEAVE_POLICY.BASE,
        { params },
      );
      return apiPageResponse(response, "Leave policies loaded");
    }

    return mockResponse(paginate(mockLeavePolicies, params), "Leave policies loaded");
  }

  async createLeavePolicy(payload: Partial<LeavePolicy>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.LEAVE_POLICY.BASE,
        payload,
      ) as ApiEnvelope<LeavePolicy>;
      return apiResponse(response, "Leave policy created");
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
      const [calendarResponse, holidayResponse] = await Promise.all([
        apiService.get<ApiEnvelope<HolidayCalendarResponse[]>>(
          API_ENDPOINTS.HOLIDAY_CALENDAR.BASE,
        ),
        apiService.get<ApiEnvelope<SwaggerPageResponse<HolidayResponse> | HolidayResponse[]>>(
          API_ENDPOINTS.HOLIDAY.BASE,
        ),
      ]);
      const calendarPage = apiMappedPageResponse(
        calendarResponse,
        mapHolidayCalendarResponseToViewModel,
        "Holiday calendars loaded",
      );
      const holidayPage = apiMappedPageResponse(
        holidayResponse,
        mapHolidayResponseToViewModel,
        "Holidays loaded",
      );

      if (!calendarPage.data || !holidayPage.data) {
        return calendarPage;
      }

      const calendars = attachHolidaysToCalendars(
        calendarPage.data.content,
        holidayPage.data.content,
      );

      return {
        ...calendarPage,
        data: paginate(calendars, params),
      };
    }

    return mockResponse(
      paginate(mockHolidayCalendars, params),
      "Holiday calendars loaded",
    );
  }

  async getHolidays(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<HolidayResponse> | HolidayResponse[]>>(
        API_ENDPOINTS.HOLIDAY.BASE,
        { params },
      );
      return apiMappedPageResponse(
        response,
        mapHolidayResponseToViewModel,
        "Holidays loaded",
      );
    }

    return mockResponse(
      paginate(
        mockHolidayCalendars.flatMap((calendar) => calendar.holidays),
        params,
      ),
      "Holidays loaded",
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
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<CompOffResponse> | CompOffResponse[]>>(
        API_ENDPOINTS.COMP_OFF.BASE,
        { params },
      );
      return apiMappedPageResponse(
        response,
        mapCompOffResponseToCreditViewModel,
        "Comp-off credits loaded",
      );
    }

    const credits = mockCompOffCredits.filter(
      (item) => !params?.employeeId || item.employeeId === params.employeeId,
    );
    return mockResponse(
      paginate<CompOffCredit>(credits, params),
      "Comp-off credits loaded",
    );
  }

  async getCompOffCreditRequests(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<CompOffResponse> | CompOffResponse[]>>(
        API_ENDPOINTS.COMP_OFF.BASE,
        { params },
      );
      return apiMappedPageResponse(
        response,
        mapCompOffResponseToViewModel,
        "Comp-off request history loaded",
      );
    }

    const requests = mockCompOffCreditRequests.filter(
      (item) => !params?.employeeId || item.employeeId === params.employeeId,
    );
    return mockResponse(
      paginate<CompOffCreditRequest>(requests, params),
      "Comp-off request history loaded",
    );
  }

  async requestCompOffCredit(payload: CompOffCreditRequestPayload) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.post(
        API_ENDPOINTS.COMP_OFF.BASE,
        {
          workedDate: payload.workedDate,
          sessionType: payload.workedSession,
          creditDays:
            payload.creditDays ??
            (payload.workedSession === "FULL_DAY" ? 1 : 0.5),
          expiryDate: payload.expiryDate,
          reason: payload.reason,
          approverId: payload.approverId,
          leaveTypeId: payload.leaveTypeId,
        },
      ) as ApiEnvelope<CompOffResponse>;
      return apiMappedResponse(
        response,
        mapCompOffResponseToViewModel,
        "Comp-off credit request submitted",
      );
    }

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
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<WorkCalendarResponse> | WorkCalendarResponse[]>>(
        API_ENDPOINTS.WORK_CALENDAR.BASE,
        params ? { params } : undefined,
      );
      return apiMappedPageResponse(
        response,
        mapWorkCalendarResponseToViewModel,
        "Work calendars loaded",
      );
    }

    return mockResponse(paginate(mockWorkCalendars, params), "Work calendars loaded");
  }

  async getPayrollLeaveInputs(params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<PayrollLeaveInput>>>(
        API_ENDPOINTS.PAYROLL.LEAVE_INPUTS,
        { params },
      );
      return apiPageResponse(response, "Payroll leave inputs loaded");
    }

    return mockResponse(
      paginate(mockPayrollLeaveInputs, params),
      "Payroll leave inputs loaded",
    );
  }
}

export const leaveService = new LeaveService();

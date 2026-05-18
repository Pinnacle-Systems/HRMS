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
import type {
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

class LeaveService {
  async getLeaves(params?: LeaveListParams) {
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

  async getManagerLeaveApprovals(params?: LeaveListParams) {
    return this.getLeaves(params);
  }

  async createLeave(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
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

  async createLeaveRequest(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    return this.createLeave(payload);
  }

  async getLeaveById(id: string) {
    const response = await apiService.get<ApiEnvelope<LeaveRequestResponse>>(
      API_ENDPOINTS.LEAVE.GET_BY_ID(id),
    );
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave request loaded",
    );
  }

  async calculateLeave(
    payload: LeaveCalculationRequest,
  ): Promise<LeaveApiResponse<LeaveCalculationResult>> {
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

  async calculateLeaveDays(
    payload: LeaveCalculationRequest,
  ): Promise<LeaveApiResponse<LeaveCalculationResult>> {
    return this.calculateLeave(payload);
  }

  async getMyLeaves(params?: LeaveListParams) {
    return this.getLeaves(params);
  }

  async withdrawLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.WITHDRAW(id),
      payload ?? {},
    ) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave withdrawn");
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
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.APPROVE(id),
      payload ?? {},
    ) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave approved");
  }

  async rejectLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.REJECT(id),
      payload ?? {},
    ) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave rejected");
  }

  async requestLeaveClarification(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
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

  async overrideLeave(id: string, payload?: LeaveActionPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.OVERRIDE(id),
      payload ?? {},
    ) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(response, mapLeaveRequestResponseToViewModel, "Leave overridden");
  }

  async getEmployeeLeaveBalances(employeeId: string, params?: LeaveListParams) {
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

  async getEmployeeLeaveLedger(employeeId: string, params?: LeaveListParams) {
    const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<LeaveLedgerEntry> | LeaveLedgerEntry[]>>(
      API_ENDPOINTS.EMPLOYEE.LEAVE_LEDGER(employeeId),
      { params },
    );
    return apiPageResponse(response, "Leave ledger loaded");
  }

  async createLeaveAdjustment(employeeId: string, payload: LeaveAdjustmentPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.EMPLOYEE.LEAVE_ADJUSTMENTS(employeeId),
      payload,
    ) as ApiEnvelope<LeaveLedgerEntry>;
    return apiResponse(response, "Leave adjustment created");
  }

  async getLeaveTypes(params?: LeaveListParams) {
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

  async createLeaveType(payload: Partial<LeaveType>) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE_TYPE.BASE,
      payload,
    ) as ApiEnvelope<LeaveTypeResponse>;
    return apiMappedResponse(response, mapLeaveTypeResponseToViewModel, "Leave type created");
  }

  async updateLeaveType(id: string, payload: Partial<LeaveType>) {
    const response = await apiService.put(
      API_ENDPOINTS.LEAVE_TYPE.UPDATE(id),
      payload,
    ) as ApiEnvelope<LeaveTypeResponse>;
    return apiMappedResponse(response, mapLeaveTypeResponseToViewModel, "Leave type updated");
  }

  async getLeavePolicies(params?: LeaveListParams) {
    const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<LeavePolicy> | LeavePolicy[]>>(
      API_ENDPOINTS.LEAVE_POLICY.BASE,
      { params },
    );
    return apiPageResponse(response, "Leave policies loaded");
  }

  async createLeavePolicy(payload: Partial<LeavePolicy>) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE_POLICY.BASE,
      payload,
    ) as ApiEnvelope<LeavePolicy>;
    return apiResponse(response, "Leave policy created");
  }

  async getHolidayCalendars(params?: LeaveListParams) {
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
    const page = params
      ? paginate(calendars, params)
      : paginate(calendars, { page: 0, size: calendars.length || 1 });

    return {
      ...calendarPage,
      data: page,
    };
  }

  async getHolidays(params?: LeaveListParams) {
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

  async selectOptionalHoliday(
    _holidayId: string,
  ): Promise<LeaveApiResponse<{ holidayId: string; selected: boolean }>> {
    throw new Error("Optional holiday selection API is not configured");
  }

  async getCompOffCredits(params?: LeaveListParams) {
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

  async getCompOffCreditRequests(params?: LeaveListParams) {
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

  async requestCompOffCredit(payload: CompOffCreditRequestPayload) {
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

  async getTeamCalendar(params?: LeaveListParams) {
    return this.getLeaves(params);
  }

  async getWorkCalendars(params?: LeaveListParams) {
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

  async getPayrollLeaveInputs(params?: LeaveListParams) {
    const response = await apiService.get<ApiEnvelope<SwaggerPageResponse<PayrollLeaveInput> | PayrollLeaveInput[]>>(
      API_ENDPOINTS.PAYROLL.LEAVE_INPUTS,
      { params },
    );
    return apiPageResponse(response, "Payroll leave inputs loaded");
  }
}

export const leaveService = new LeaveService();

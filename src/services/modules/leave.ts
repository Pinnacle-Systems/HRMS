import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  // mapCompOffResponseToCreditViewModel,
  mapCompOffResponseToViewModel,
  mapHolidayCalendarResponseToViewModel,
  mapHolidayResponseToViewModel,
  // mapLeaveAccrualRunResponseToViewModel,
  mapLeaveBalanceResponseToViewModel,
  mapLeavePolicyRuleResponseToViewModel,
  mapLeaveRequestResponseToViewModel,
  mapLeaveTypeResponseToViewModel,
  // mapWorkCalendarResponseToViewModel,
  type CompOffResponse,
  type HolidayCalendarResponse,
  type HolidayResponse,
  // type LeaveAccrualRunResponse,
  type LeaveBalanceResponse,
  type LeavePolicyRuleResponse,
  type LeaveRequestResponse,
  type LeaveTypeResponse,
  // type WorkCalendarResponse,
} from "./leaveAdapters";
// import { mockPayrollLeaveInputs } from "./leaveMockData";
import type {
  // CompOffCredit,
  // CompOffCreditRequest,
  CompOffCreditRequestPayload,
  // EmpOperationalListEntry,
  HolidayImportResult,
  LeaveAccrualRunRequest,
  // LeaveAccrualRunResult,
  LeaveAdjustmentPayload,
  LeaveApiResponse,
  LeaveCalculationRequest,
  // LeaveCalculationResult,
  LeaveLedgerEntry,
  LeaveListParams,
  LeavePolicy,
  LeavePolicyRule,
  LeaveRequest,
  LeaveType,
  PageResponse,
  // PayrollLeaveInput,
  // PayrollLeaveSummary,
  Holiday,
  HolidayCalendar,
  WorkCalendar,
  HolidayImport,
  CompOffBalance,
  PayrollInput,
  PayrollInputFilter,
  LeaveEncashmentFilter,
  LeaveEncashment,
  GeneratePayload,
  LockUnlockPayload,
  FinalSettlementPayload,
  LeaveEncashmentPayload,
  PayrollLeaveInput,
} from "./leaveTypes";

export const USE_MOCK_LEAVE_SERVICE =
  import.meta.env.VITE_USE_MOCK_LEAVE_SERVICE === "true";
export const DEFAULT_MOCK_MANAGER_ID = "emp-200";

type CreateLeaveRequestPayload = Partial<LeaveRequest>;
type LeaveActionPayload = {
  comments?: string;
  lopLeaveTypeId?: string;
};

type HrVerificationPayload = {
  comments?: string;
  verified?: boolean;
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
  attachmentIds?: string[];
};

// type LeaveCalculationResponse = {
//   days?: number;
//   totalDays?: number;
//   requestedDays?: number;
//   workingDays?: number;
//   holidays?: string[];
//   holidayDates?: string[];
//   excludedHolidays?: string[];
//   weeklyOffs?: string[];
//   weeklyOffDates?: string[];
//   excludedWeeklyOffs?: string[];
//   availableBalance?: number;
//   closingBalance?: number;
//   balance?: number;
//   lopDays?: number;
//   lossOfPayDays?: number;
//   calculatedDays: number;
// };

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

// type OperationalListResponse<T> = {
//   meta: {
//     dataset?: string;
//     queryTimeMs?: number;
//     rowCount?: number;
//     currency?: string;
//     palette?: string[];
//     comparisonMode?: string;
//   };
//   data: T[];
// };

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
    throw new Error(
      response.message || "Leave API response did not include data",
    );
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

// function apiOperationalListResponse<TDto, TView>(
//   response: ApiEnvelope<OperationalListResponse<TDto>>,
//   mapper: (dto: TDto) => TView,
//   fallbackMessage = "Success",
// ): LeaveApiResponse<PageResponse<TView>> {
//   const data = unwrapApiData<OperationalListResponse<TDto>>(response);
//   const items = data.data || [];
//   const mapped = items.map(mapper);

//   return {
//     success: true,
//     message: response.message ?? fallbackMessage,
//     data: {
//       content: mapped,
//       totalElements: items.length,
//       totalPages: 1,
//       page: 0,
//       size: items.length,
//     },
//     timestamp: response.timestamp ?? new Date().toISOString(),
//   };
// }

function mockResponse<T>(data: T, message = "Success"): LeaveApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

// function normalizePage(params?: LeaveListParams) {
//   return {
//     page: params?.page ?? 0,
//     size: params?.size ?? 20,
//   };
// }

// function applySearch<T>(items: T[], search?: string): T[] {
//   if (!search?.trim()) {
//     return items;
//   }

//   const normalized = search.trim().toLowerCase();
//   return items.filter((item) =>
//     JSON.stringify(item).toLowerCase().includes(normalized),
//   );
// }

// function applySort<T>(items: T[], sort?: string): T[] {
//   if (!sort) {
//     return items;
//   }

//   const [field, direction = "ASC"] = sort.split(",");
//   if (!field) {
//     return items;
//   }

//   return [...items].sort((left, right) => {
//     const leftValue = String((left as Record<string, unknown>)[field] ?? "");
//     const rightValue = String((right as Record<string, unknown>)[field] ?? "");
//     const result = leftValue.localeCompare(rightValue, undefined, {
//       numeric: true,
//       sensitivity: "base",
//     });
//     return direction.toUpperCase() === "DESC" ? -result : result;
//   });
// }

// function paginate<T>(items: T[], params?: LeaveListParams): PageResponse<T> {
//   const { page, size } = normalizePage(params);
//   const searched = applySearch(items, params?.search);
//   const sorted = applySort(searched, params?.sort);
//   const start = page * size;
//   const content = sorted.slice(start, start + size);

//   return {
//     content,
//     totalElements: sorted.length,
//     totalPages: Math.ceil(sorted.length / size),
//     page,
//     size,
//   };
// }

function buildLeaveRequestApiParams(params?: LeaveListParams) {
  if (!params) {
    return undefined;
  }

  const { status, fromDate, toDate, ...rest } = params;
  return {
    ...rest,
    status: status,
    fromDate: fromDate,
    toDate: toDate,
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

// function attachHolidaysToCalendars(
//   calendars: HolidayCalendar[],
//   holidays: Holiday[],
// ): HolidayCalendar[] {
//   if (holidays.length === 0) {
//     return calendars;
//   }

//   if (calendars.length === 0) {
//     return [
//       {
//         id: "holiday-calendar",
//         calendarName: "Holiday Calendar",
//         year: new Date().getFullYear(),
//         locations: Array.from(
//           new Set(holidays.map((holiday) => holiday.location).filter(Boolean)),
//         ),
//         holidays,
//       },
//     ];
//   }

//   const holidaysByCalendarId = new Map<string, Holiday[]>();
//   const unassignedHolidays: Holiday[] = [];

//   holidays.forEach((holiday) => {
//     if (holiday.calendarId) {
//       const existing = holidaysByCalendarId.get(holiday.calendarId) ?? [];
//       holidaysByCalendarId.set(holiday.calendarId, [...existing, holiday]);
//       return;
//     }
//     unassignedHolidays.push(holiday);
//   });

//   return calendars.map((calendar, index) => {
//     const matchedHolidays = holidaysByCalendarId.get(calendar.id) ?? [];
//     const shouldReceiveUnassigned =
//       unassignedHolidays.length > 0 && (calendars.length === 1 || index === 0);
//     const calendarHolidays = shouldReceiveUnassigned
//       ? [...matchedHolidays, ...unassignedHolidays]
//       : matchedHolidays;

//     return {
//       ...calendar,
//       holidays: calendarHolidays.map((holiday) => ({
//         ...holiday,
//         location:
//           holiday.location ||
//           calendar.branchName ||
//           calendar.locations.join(", "),
//       })),
//     };
//   });
// }

// function normalizeDateList(value?: string[]) {
//   return Array.isArray(value) ? value.filter(Boolean) : [];
// }

// function mapLeaveCalculationResponseToViewModel(
//   dto: LeaveCalculationResponse,
// ): LeaveCalculationResult {
//   const days = dto.calculatedDays ?? dto.totalDays ?? dto.requestedDays ?? dto.workingDays ?? 0;
//   const availableBalance =
//     dto.availableBalance ?? dto.closingBalance ?? dto.balance ?? 0;

//   return {
//     days,
//     workingDays: dto.workingDays ?? days,
//     holidays: normalizeDateList(
//       dto.holidays ?? dto.holidayDates ?? dto.excludedHolidays,
//     ),
//     weeklyOffs: normalizeDateList(
//       dto.weeklyOffs ?? dto.weeklyOffDates ?? dto.excludedWeeklyOffs,
//     ),
//     availableBalance,
//     lopDays: dto.lopDays ?? dto.lossOfPayDays ?? Math.max(0, days - availableBalance),
//   };
// }

// function updateStatus(
//   id: string,
//   status: LeaveRequest["status"],
//   payload?: LeaveActionPayload,
// ): LeaveRequest {
//   const requestIndex = mockLeaveRequests.findIndex((item) => item.id === id);
//   const request = mockLeaveRequests[requestIndex];
//   if (!request) {
//     throw new Error("Leave request not found");
//   }

//   const updated = {
//     ...request,
//     status,
//     approverRemarks: payload?.comments ?? request.approverRemarks,
//   };
//   mockLeaveRequests[requestIndex] = updated;
//   return updated;
// }

class LeaveService {
  async getLeaves(params?: LeaveListParams) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = await apiService.get<
      ApiEnvelope<
        SwaggerPageResponse<LeaveRequestResponse> | LeaveRequestResponse[]
      >
    >(API_ENDPOINTS.LEAVE.BASE, {
      params: buildLeaveRequestApiParams(params),
    });
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
        totalElements: mappedResponse.data.totalElements,
        totalPages: mappedResponse.data.page,
      },
    };
    // }

    // let requests = mockLeaveRequests;
    // if (params?.employeeId) {
    //   requests = requests.filter(
    //     (request) => request.employeeId === params.employeeId,
    //   );
    // }
    // if (params?.managerId) {
    //   requests = requests.filter(
    //     (request) => request.managerId === params.managerId,
    //   );
    // }
    // if (params?.department) {
    //   requests = requests.filter(
    //     (request) => request.department === params.department,
    //   );
    // }
    // requests = filterLeaveRequests(requests, params);

    // return mockResponse(paginate(requests, params), "Leave requests loaded");
  }

  async getMyLeaves(params?: LeaveListParams) {
    const response = await apiService.get<
      ApiEnvelope<
        SwaggerPageResponse<LeaveRequestResponse> | LeaveRequestResponse[]
      >
    >(API_ENDPOINTS.LEAVE.GET_MY, {
      params: buildLeaveRequestApiParams(params),
    });
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
        totalElements: mappedResponse.data.totalElements,
        totalPages: mappedResponse.data.page,
      },
    };
  }

  async getManagerLeaveApprovals(
    params?: LeaveListParams,
    managerEmployeeId?: string,
    isAdmin?: boolean,
  ) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // return this.getLeaves(params);
    // }

    // return this.getLeaves({
    // ...params,
    // managerId: params?.managerId ?? DEFAULT_MOCK_MANAGER_ID,
    // });
    if (managerEmployeeId || isAdmin) {
      return this.getLeaves(params);
    } else {
      return await apiService.get(API_ENDPOINTS.LEAVE.GET_APPROVALS, {
        params,
      });
    }
  }

  async getMyManagerLeaveApprovals(
    params?: LeaveListParams,
    // managerEmployeeId?: string,
  ) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // if (managerEmployeeId) {
    return this.getLeaves({ ...params });
    // }

    // const response = await apiService.get<
    //   ApiEnvelope<
    //     SwaggerPageResponse<LeaveRequestResponse> | LeaveRequestResponse[]
    //   >
    // >(API_ENDPOINTS.LEAVE.MY_APPROVALS, {
    //   params: buildLeaveRequestApiParams(params),
    // });
    // return apiMappedPageResponse(
    //   response,
    //   mapLeaveRequestResponseToViewModel,
    //   "Leave approvals loaded",
    // );
    // }

    // const managerId = managerEmployeeId ?? params?.managerId;
    // if (managerId) {
    //   const response = await this.getLeaves({ ...params, managerId });
    //   if (response.data?.content.length) {
    //     return response;
    //   }
    // }

    // return this.getLeaves({
    //   ...params,
    //   managerId: DEFAULT_MOCK_MANAGER_ID,
    // });
  }

  async createLeave(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const apiPayload: CreateLeaveRequestApiPayload = {
      leaveTypeId: payload.leaveTypeId,
      fromDate: payload.fromDate,
      toDate: payload.toDate,
      fromSession: payload.fromSession ?? payload.dayType ?? "FULL_DAY",
      toSession: payload.toSession ?? payload.dayType ?? "FULL_DAY",
      appliedReason: payload.appliedReason,
      emergencyContactNumber: payload.emergencyContactNumber,
      draft: payload.status === "DRAFT",
      approverId: payload.approverId,
      attachmentIds: payload.attachmentIds,
    };
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.BASE,
      apiPayload,
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave request submitted",
    );
    // }

    // const leaveType = mockLeaveTypes.find(
    //   (item) => item.id === payload.leaveTypeId,
    // ) ?? mockLeaveTypes[0];
    // const created: LeaveRequest = {
    //   id: `lv-${Date.now()}`,
    //   employeeId: payload.employeeId ?? MOCK_EMPLOYEE_ID,
    //   employeeCode: payload.employeeCode ?? "PNI001",
    //   employeeName: payload.employeeName ?? "Aarav Menon",
    //   department: payload.department ?? "Engineering",
    //   location: payload.location ?? "Bengaluru",
    //   managerId: payload.managerId ?? DEFAULT_MOCK_MANAGER_ID,
    //   managerName: payload.managerName ?? "Nisha Rao",
    //   leaveTypeId: leaveType.id,
    //   leaveTypeCode: leaveType.code,
    //   leaveTypeName: leaveType.name,
    //   fromDate: payload.fromDate ?? new Date().toISOString().slice(0, 10),
    //   toDate: payload.toDate ?? payload.fromDate ?? new Date().toISOString().slice(0, 10),
    //   dayType: payload.dayType ?? "FULL_DAY",
    //   days: payload.days ?? 1,
    //   reason: payload.reason ?? "Mock leave request",
    //   status: payload.status ?? "PENDING",
    //   appliedOn: new Date().toISOString().slice(0, 10),
    // };

    // return mockResponse(created, "Leave request submitted");
  }

  async createLeaveRequest(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    return this.createLeave(payload);
  }

  async getLeaveById(id: string) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = await apiService.get<ApiEnvelope<LeaveRequestResponse>>(
      API_ENDPOINTS.LEAVE.GET_BY_ID(id),
    );
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave request loaded",
    );
    // }

    // const request = mockLeaveRequests.find((item) => item.id === id);
    // return mockResponse(
    //   request ?? null,
    //   request ? "Leave request loaded" : "Leave request not found",
    // );
  }

  async deleteLeave(id: string) {
    const response = (await apiService.delete(
      API_ENDPOINTS.LEAVE.DELETE(id),
    )) as ApiEnvelope<null>;
    return apiResponse(response, "Leave policy deleted");
  }

  // async calculateLeave(
  //   payload: LeaveCalculationRequest,
  // ): Promise<LeaveApiResponse<LeaveCalculationResult>> {
  //   if (!USE_MOCK_LEAVE_SERVICE) {
  //     const response = await apiService.post(
  //       API_ENDPOINTS.LEAVE.CALCULATE,
  //       {
  //         leaveTypeId: payload.leaveTypeId,
  //         fromDate: payload.fromDate,
  //         toDate: payload.toDate,
  //         fromSession: payload.fromSession ?? payload.dayType ?? "FULL_DAY",
  //         toSession: payload.toSession ?? payload.dayType ?? "FULL_DAY",
  //       },
  //     ) as ApiEnvelope<LeaveCalculationResponse>;
  //     return apiMappedResponse(
  //       response,
  //       mapLeaveCalculationResponseToViewModel,
  //       "Leave calculation completed",
  //     );
  //   }

  //   const from = new Date(payload.fromDate);
  //   const to = new Date(payload.toDate);
  //   const holidayDates = new Set(
  //     mockHolidayCalendars.flatMap((calendar) =>
  //       calendar.holidays.map((holiday) => holiday.date),
  //     ),
  //   );
  //   const excludedHolidays: string[] = [];
  //   const excludedWeeklyOffs: string[] = [];
  //   let requestedDays = 0;
  //   const cursor = new Date(from);

  //   while (cursor <= to) {
  //     const isoDate = cursor.toISOString().slice(0, 10);
  //     const day = cursor.getDay();
  //     const isWeeklyOff = day === 0 || day === 6;
  //     const isHoliday = holidayDates.has(isoDate);

  //     if (isWeeklyOff) {
  //       excludedWeeklyOffs.push(isoDate);
  //     } else if (isHoliday) {
  //       excludedHolidays.push(isoDate);
  //     } else {
  //       let dayValue = 1;
  //       const isSameDay = payload.fromDate === payload.toDate;
  //       const isFirstDay = isoDate === payload.fromDate;
  //       const isLastDay = isoDate === payload.toDate;

  //       if (isSameDay) {
  //         dayValue =
  //           payload.fromSession && payload.fromSession !== "FULL_DAY" ? 0.5 : 1;
  //       } else {
  //         if (isFirstDay && payload.fromSession !== "FULL_DAY") {
  //           dayValue -= 0.5;
  //         }
  //         if (isLastDay && payload.toSession !== "FULL_DAY") {
  //           dayValue -= 0.5;
  //         }
  //       }
  //       requestedDays += Math.max(0.5, dayValue);
  //     }

  //     cursor.setDate(cursor.getDate() + 1);
  //   }

  //   const balance =
  //     mockLeaveBalances.find(
  //       (item) =>
  //         item.employeeId === payload.employeeId &&
  //         item.leaveTypeId === payload.leaveTypeId,
  //     )?.balance ?? 0;

  //   const result: LeaveCalculationResult = {
  //     days: requestedDays,
  //     workingDays: requestedDays,
  //     holidays: excludedHolidays,
  //     weeklyOffs: excludedWeeklyOffs,
  //     availableBalance: balance,
  //     lopDays: Math.max(0, requestedDays - balance),
  //   };

  //   return mockResponse(result, "Leave calculation completed");
  // }

  // async calculateLeaveDays(
  //   payload: LeaveCalculationRequest,
  // ): Promise<LeaveApiResponse<LeaveCalculationResult>> {
  //   return this.calculateLeave(payload);
  // }

  async calculateLeaveDays(payload: LeaveCalculationRequest) {
    return apiService.post(API_ENDPOINTS.LEAVE.CALCULATE, payload);
  }

  async patchDraft(id: string, payload: CreateLeaveRequestPayload) {
    return apiService.patch(API_ENDPOINTS.LEAVE.PATCH_DRAFT(id), payload);
  }

  async submitLeave(id: string) {
    return apiService.post(API_ENDPOINTS.LEAVE.SUBMIT(id));
  }

  // async getMyLeaves(params?: LeaveListParams) {
  //   return this.getLeaves({ ...params });
  // }

  async withdrawLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.WITHDRAW(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave withdrawn",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "WITHDRAWN", payload),
    //   "Leave withdrawn",
    // );
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
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.CANCEL_REQUEST(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Cancellation requested",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "CANCEL_REQUESTED", payload),
    //   "Cancellation requested",
    // );
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
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.APPROVE(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave approved",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "APPROVED", payload),
    //   "Leave approved",
    // );
  }

  async rejectLeave(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.REJECT(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave rejected",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "REJECTED", payload),
    //   "Leave rejected",
    // );
  }

  async requestLeaveClarification(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.REQUEST_CLARIFICATION(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Clarification requested",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "PENDING", payload),
    //   "Clarification requested",
    // );
  }

  async forceApproveLeave(id: string, payload?: LeaveActionPayload) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.FORCE_APPROVE(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave force-approved",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "APPROVED", payload),
    //   "Leave force-approved",
    // );
  }

  // async overrideLeave(id: string, payload?: LeaveActionPayload) {
  //   return this.forceApproveLeave(id, payload);
  // }

  async revokeLeave(id: string, payload?: LeaveActionPayload) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.REVOKE(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave revoked",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "CANCELLED", payload),
    //   "Leave revoked",
    // );
  }

  async convertLeaveToLop(id: string, payload?: LeaveActionPayload) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.CONVERT_TO_LOP(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Leave converted to LOP",
    );
    // }

    // return mockResponse(
    //   updateStatus(id, "CONVERTED_TO_LOP", payload),
    //   "Leave converted to LOP",
    // );
  }

  async hrVerified(
    id: string,
    payload?: HrVerificationPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.HR_VERIFY(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "HR verification Done",
    );
  }

  async sendToHrVerification(
    id: string,
    payload?: LeaveActionPayload,
  ): Promise<LeaveApiResponse<LeaveRequest>> {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE.SENDTO_HR_VERIFY(id),
      payload ?? {},
    )) as ApiEnvelope<LeaveRequestResponse>;
    return apiMappedResponse(
      response,
      mapLeaveRequestResponseToViewModel,
      "Sent to HR for verification",
    );
  }

  async getUpcomingLeaves(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.LEAVE.UPCOMING_LEAVES, {
      params,
    });
    // return apiOperationalListResponse(
    //   response,
    //   mapLeaveRequestResponseToViewModel,
    //   "Upcoming leaves loaded",
    // );
  }

  async getPendingApprovals(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.LEAVE.PENDING_APPROVALS, {
      params,
    });
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const response = await apiService.get<
    //   ApiEnvelope<
    //     SwaggerPageResponse<LeaveRequestResponse> | LeaveRequestResponse[]
    //   >
    // >(API_ENDPOINTS.LEAVE.PENDING_APPROVALS, {
    //   params: buildLeaveRequestApiParams(params),
    // });
    // return apiMappedPageResponse(
    //   response,
    //   mapLeaveRequestResponseToViewModel,
    //   "Pending approvals loaded",
    // );
    // }

    // const pending = filterLeaveRequests(
    //   mockLeaveRequests.filter((request) => request.status === "PENDING"),
    //   params,
    // );
    // return mockResponse(paginate(pending, params), "Pending approvals loaded");
  }

  async getEmployeeLeaveBalances(employeeId: string, params?: LeaveListParams) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = await apiService.get<
      ApiEnvelope<
        SwaggerPageResponse<LeaveBalanceResponse> | LeaveBalanceResponse[]
      >
    >(API_ENDPOINTS.EMPLOYEE.LEAVE_BALANCES(employeeId), {
      params: {
        // ...params,
        leaveYear: params?.leaveYear ?? new Date().getFullYear(),
      },
    });
    return apiMappedPageResponse(
      response,
      mapLeaveBalanceResponseToViewModel,
      "Leave balances loaded",
    );
    // }

    // const balances = mockLeaveBalances.filter(
    //   (item) => item.employeeId === employeeId,
    // );
    // return mockResponse(paginate(balances, params), "Leave balances loaded");
  }

  async getEmployeeLeaveLedger(employeeId: string, params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<
        ApiEnvelope<SwaggerPageResponse<LeaveLedgerEntry>>
      >(API_ENDPOINTS.EMPLOYEE.LEAVE_LEDGER(employeeId), {
        params: {
          ...params,
          leaveYear: params?.leaveYear ?? new Date().getFullYear(),
        },
      });
      return apiPageResponse(response, "Leave ledger loaded");
    }

    // const ledger = mockLeaveLedger.filter(
    //   (item) => item.employeeId === employeeId,
    // );
    // return mockResponse(paginate(ledger, params), "Leave ledger loaded");
  }

  async getEmployeeLeaves(
    employeeId: string,
    params?: {
      status?: string;
      page?: number;
      size?: number;
      sort?: string[];
    },
  ) {
    const response = await apiService.get<
      ApiEnvelope<SwaggerPageResponse<LeaveRequest>>
    >(API_ENDPOINTS.EMPLOYEE.LEAVES(employeeId), {
      params: {
        ...params,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return apiPageResponse(response, "Employee leaves loaded");
  }

  async getEmployeeCompOffBalances(employeeId: string) {
    const response = await apiService.get<ApiEnvelope<CompOffBalance[]>>(
      API_ENDPOINTS.EMPLOYEE.COMP_OFF_BALANCE(employeeId),
    );
    return apiResponse(response, "Comp-off balances loaded");
  }

  async createLeaveAdjustment(
    employeeId: string,
    payload: LeaveAdjustmentPayload,
  ) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.EMPLOYEE.LEAVE_ADJUSTMENTS(employeeId),
      payload,
    )) as ApiEnvelope<LeaveLedgerEntry>;
    return apiResponse(response, "Leave adjustment created");
    // }

    // const entry: LeaveLedgerEntry = {
    //   id: `ll-${Date.now()}`,
    //   employeeId,
    //   leaveTypeId: payload.leaveTypeId,
    //   transactionDate: new Date().toISOString().slice(0, 10),
    //   transactionType: "ADJUSTMENT",
    //   days: payload.days,
    //   remarks: payload.reason,
    // };
    // return mockResponse(entry, "Leave adjustment created");
  }

  async getLeaveTypes(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.LEAVE_TYPE.BASE, { params });
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const response = await apiService.get<
    //   ApiEnvelope<
    //     SwaggerPageResponse<LeaveTypeResponse> | LeaveTypeResponse[]
    //   >
    // >(API_ENDPOINTS.LEAVE_TYPE.BASE, { params });
    // const mappedResponse = apiMappedPageResponse(
    //   response,
    //   mapLeaveTypeResponseToViewModel,
    //   "Leave types loaded",
    // );
    // if (params?.includeDisabled) {
    //   return mappedResponse;
    // }

    // return {
    //   ...mappedResponse,
    //   data: mappedResponse.data
    //     ? {
    //         ...mappedResponse.data,
    //         content: mappedResponse.data.content.filter(
    //           (leaveType) => leaveType?.active,
    //         ),
    //       }
    //     : mappedResponse.data,
    // };
    // }

    // const types = params?.includeDisabled
    //   ? mockLeaveTypes
    //   : mockLeaveTypes.filter((leaveType) => leaveType.active);
    // return mockResponse(paginate(types, params), "Leave types loaded");
  }

  async createLeaveType(payload: Partial<LeaveType>) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = (await apiService.post(
      API_ENDPOINTS.LEAVE_TYPE.BASE,
      payload,
    )) as ApiEnvelope<LeaveTypeResponse>;
    return apiMappedResponse(
      response,
      mapLeaveTypeResponseToViewModel,
      "Leave type created",
    );
    // }

    // const created: LeaveType = {
    //   id: `lt-${Date.now()}`,
    //   code: payload.code ?? "NEW",
    //   name: payload.name ?? "New Leave Type",
    //   description: payload.description ?? "",
    //   paid: payload.paid ?? true,
    //   // enabled: payload.enabled ?? true,
    //   // color: payload.color ?? "#e16a3d",
    //   // maxDaysPerRequest: payload.maxDaysPerRequest,
    //   // requiresDocumentAfterDays: payload.requiresDocumentAfterDays,
    // };
    // return mockResponse(created, "Leave type created");
  }

  async updateLeaveType(id: string, payload: Partial<LeaveType>) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    return await apiService.put(API_ENDPOINTS.LEAVE_TYPE.UPDATE(id), payload);
    // }

    // const existing = mockLeaveTypes.find((item) => item.id === id);
    // return mockResponse(
    //   { ...existing, ...payload, id } as LeaveType,
    //   "Leave type updated",
    // );
  }

  async getLeaveTypeById(id: string) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = await apiService.get<ApiEnvelope<LeaveTypeResponse>>(
      API_ENDPOINTS.LEAVE_TYPE.GET_BY_ID(id),
    );
    return apiMappedResponse(
      response,
      mapLeaveTypeResponseToViewModel,
      "Leave type loaded",
    );
    // }

    // const leaveType = mockLeaveTypes.find((item) => item.id === id);
    // return mockResponse(
    //   leaveType ?? null,
    //   leaveType ? "Leave type loaded" : "Leave type not found",
    // );
  }

  async deleteLeaveType(id: string) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    return await apiService.delete(API_ENDPOINTS.LEAVE_TYPE.DELETE(id));
    // return apiResponse(response, "Leave type deleted");
    // }

    // const index = mockLeaveTypes.findIndex((item) => item.id === id);
    // if (index >= 0) {
    //   mockLeaveTypes.splice(index, 1);
    // }
    // return mockResponse(null, "Leave type deleted");
  }

  async getLeavePolicies(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.LEAVE_POLICY.BASE, { params });
    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = await apiService.get<
    //     ApiEnvelope<SwaggerPageResponse<LeavePolicy>>
    //   >(API_ENDPOINTS.LEAVE_POLICY.BASE, { params });
    //   return apiPageResponse(response, "Leave policies loaded");
    // }

    // return mockResponse(
    //   paginate(mockLeavePolicies, params),
    //   "Leave policies loaded",
    // );
  }

  async createLeavePolicy(payload: Partial<LeavePolicy>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.post(
        API_ENDPOINTS.LEAVE_POLICY.BASE,
        payload,
      )) as ApiEnvelope<LeavePolicy>;
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

  async getLeavePolicyById(id: string) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<LeavePolicy>>(
        API_ENDPOINTS.LEAVE_POLICY.GET_BY_ID(id),
      );
      return apiResponse(response, "Leave policy loaded");
    }

    // const policy = mockLeavePolicies.find((item) => item.id === id);
    // return mockResponse(
    //   policy ?? null,
    //   policy ? "Leave policy loaded" : "Leave policy not found",
    // );
  }

  async updateLeavePolicy(id: string, payload: Partial<LeavePolicy>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.put(
        API_ENDPOINTS.LEAVE_POLICY.UPDATE(id),
        payload,
      )) as ApiEnvelope<LeavePolicy>;
      return apiResponse(response, "Leave policy updated");
    }

    // const index = mockLeavePolicies.findIndex((item) => item.id === id);
    // if (index < 0) {
    //   return mockResponse(null, "Leave policy not found");
    // }
    // mockLeavePolicies[index] = { ...mockLeavePolicies[index], ...payload, id };
    // return mockResponse(mockLeavePolicies[index], "Leave policy updated");
  }

  async deleteLeavePolicy(id: string) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.delete(
        API_ENDPOINTS.LEAVE_POLICY.DELETE(id),
      )) as ApiEnvelope<null>;
      return apiResponse(response, "Leave policy deleted");
    }

    // const index = mockLeavePolicies.findIndex((item) => item.id === id);
    // if (index >= 0) {
    //   mockLeavePolicies.splice(index, 1);
    // }
    // return mockResponse(null, "Leave policy deleted");
  }

  async getLeavePolicyRules(
    params?: LeaveListParams & { leavePolicyId?: string },
  ) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<
        ApiEnvelope<
          | SwaggerPageResponse<LeavePolicyRuleResponse>
          | LeavePolicyRuleResponse[]
        >
      >(API_ENDPOINTS.LEAVE_POLICY_RULE.BASE, { params });
      return apiMappedPageResponse(
        response,
        mapLeavePolicyRuleResponseToViewModel,
        "Leave policy rules loaded",
      );
    }

    // const rules = params?.leavePolicyId
    //   ? mockLeavePolicyRules.filter(
    //       (rule) => rule.leavePolicyId === params.leavePolicyId,
    //     )
    //   : mockLeavePolicyRules;
    // return mockResponse(paginate(rules, params), "Leave policy rules loaded");
  }

  async getLeavePolicyRuleById(id: string) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<
        ApiEnvelope<LeavePolicyRuleResponse>
      >(API_ENDPOINTS.LEAVE_POLICY_RULE.BY_ID(id));
      return apiMappedResponse(
        response,
        mapLeavePolicyRuleResponseToViewModel,
        "Leave policy rule loaded",
      );
    }

    // const rule = mockLeavePolicyRules.find((item) => item.id === id);
    // return mockResponse(
    //   rule ?? null,
    //   rule ? "Leave policy rule loaded" : "Leave policy rule not found",
    // );
  }

  async createLeavePolicyRule(payload: Partial<LeavePolicyRule>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.post(
        API_ENDPOINTS.LEAVE_POLICY_RULE.BASE,
        payload,
      )) as ApiEnvelope<LeavePolicyRuleResponse>;
      return apiMappedResponse(
        response,
        mapLeavePolicyRuleResponseToViewModel,
        "Leave policy rule created",
      );
    }

    // const created: LeavePolicyRule = {
    //   id: `lpr-${Date.now()}`,
    //   leavePolicyId: payload.leavePolicyId ?? "",
    //   ruleType: payload.ruleType ?? "ACCRUAL",
    //   value: payload.value,
    //   unit: payload.unit,
    //   condition: payload.condition,
    //   description: payload.description ?? "",
    //   active: payload.active ?? true,
    // };
    // mockLeavePolicyRules.push(created);
    // return mockResponse(created, "Leave policy rule created");
  }

  async updateLeavePolicyRule(id: string, payload: Partial<LeavePolicyRule>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.put(
        API_ENDPOINTS.LEAVE_POLICY_RULE.UPDATE(id),
        payload,
      )) as ApiEnvelope<LeavePolicyRuleResponse>;
      return apiMappedResponse(
        response,
        mapLeavePolicyRuleResponseToViewModel,
        "Leave policy rule updated",
      );
    }

    // const index = mockLeavePolicyRules.findIndex((item) => item.id === id);
    // if (index < 0) {
    //   return mockResponse(null, "Leave policy rule not found");
    // }
    // mockLeavePolicyRules[index] = {
    //   ...mockLeavePolicyRules[index],
    //   ...payload,
    //   id,
    // };
    // return mockResponse(
    //   mockLeavePolicyRules[index],
    //   "Leave policy rule updated",
    // );
  }

  async deleteLeavePolicyRule(id: string) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.delete(
        API_ENDPOINTS.LEAVE_POLICY_RULE.DELETE(id),
      )) as ApiEnvelope<null>;
      return apiResponse(response, "Leave policy rule deleted");
    }

    // const index = mockLeavePolicyRules.findIndex((item) => item.id === id);
    // if (index >= 0) {
    //   mockLeavePolicyRules.splice(index, 1);
    // }
    // return mockResponse(null, "Leave policy rule deleted");
  }

  async getHolidayCalendars() {
    return await apiService.get(API_ENDPOINTS.HOLIDAY_CALENDAR.BASE);
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const [calendarResponse, holidayResponse] = await Promise.all([
    //   apiService.get<ApiEnvelope<HolidayCalendarResponse[]>>(
    //     API_ENDPOINTS.HOLIDAY_CALENDAR.BASE,
    //   ),
    //   apiService.get<
    //     ApiEnvelope<SwaggerPageResponse<HolidayResponse> | HolidayResponse[]>
    //   >(API_ENDPOINTS.HOLIDAY.BASE),
    // ]);
    // const calendarPage = apiMappedPageResponse(
    //   calendarResponse,
    //   mapHolidayCalendarResponseToViewModel,
    //   "Holiday calendars loaded",
    // );
    // const holidayPage = apiMappedPageResponse(
    //   holidayResponse,
    //   mapHolidayResponseToViewModel,
    //   "Holidays loaded",
    // );

    // if (!calendarPage.data || !holidayPage.data) {
    //   return calendarPage;
    // }

    // const calendars = attachHolidaysToCalendars(
    //   calendarPage.data.content,
    //   holidayPage.data.content,
    // );

    // return {
    //   ...calendarPage,
    //   data: paginate(calendars, params),
    // };
    // }

    // return mockResponse(
    //   paginate(mockHolidayCalendars, params),
    //   "Holiday calendars loaded",
    // );
  }

  async getHolidayCalendarById(id: string) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<
        ApiEnvelope<HolidayCalendarResponse>
      >(API_ENDPOINTS.HOLIDAY_CALENDAR.GET_BY_ID(id));
      return apiMappedResponse(
        response,
        mapHolidayCalendarResponseToViewModel,
        "Holiday calendar loaded",
      );
    }

    // const calendar = mockHolidayCalendars.find((item) => item.id === id);
    // return mockResponse(
    //   calendar ?? null,
    //   calendar ? "Holiday calendar loaded" : "Holiday calendar not found",
    // );
  }

  async createHolidayCalendar(payload: Partial<HolidayCalendar>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.post(
        API_ENDPOINTS.HOLIDAY_CALENDAR.BASE,
        payload,
      )) as ApiEnvelope<HolidayCalendarResponse>;
      return apiMappedResponse(
        response,
        mapHolidayCalendarResponseToViewModel,
        "Holiday calendar created",
      );
    }

    // const created: HolidayCalendar = {
    //   id: `hc-${Date.now()}`,
    //   calendarName: payload.calendarName ?? "New Holiday Calendar",
    //   year: payload.year ?? new Date().getFullYear(),
    //   locations: payload.locations ?? [],
    //   holidays: payload.holidays ?? [],
    //   branchId: payload.branchId,
    //   branchName: payload.branchName,
    //   active: payload.active ?? true,
    // };
    // mockHolidayCalendars.push(created);
    // return mockResponse(created, "Holiday calendar created");
  }

  async updateHolidayCalendar(id: string, payload: Partial<HolidayCalendar>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.put(
        API_ENDPOINTS.HOLIDAY_CALENDAR.UPDATE(id),
        payload,
      )) as ApiEnvelope<HolidayCalendarResponse>;
      return apiMappedResponse(
        response,
        mapHolidayCalendarResponseToViewModel,
        "Holiday calendar updated",
      );
    }

    // const index = mockHolidayCalendars.findIndex((item) => item.id === id);
    // if (index < 0) {
    //   return mockResponse(null, "Holiday calendar not found");
    // }
    // mockHolidayCalendars[index] = {
    //   ...mockHolidayCalendars[index],
    //   ...payload,
    //   id,
    // };
    // return mockResponse(
    //   mockHolidayCalendars[index],
    //   "Holiday calendar updated",
    // );
  }

  async deleteHolidayCalendar(id: string) {
    return await apiService.delete(API_ENDPOINTS.HOLIDAY_CALENDAR.DELETE(id));
    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = (await apiService.delete(
    //     API_ENDPOINTS.HOLIDAY_CALENDAR.DELETE(id),
    //   )) as ApiEnvelope<null>;
    //   return apiResponse(response, "Holiday calendar deleted");
    // }

    // const index = mockHolidayCalendars.findIndex((item) => item.id === id);
    // if (index >= 0) {
    //   mockHolidayCalendars.splice(index, 1);
    // }
    // return mockResponse(null, "Holiday calendar deleted");
  }

  async getHolidays(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.HOLIDAY.BASE, { params });
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const response = await apiService.get<
    //   ApiEnvelope<SwaggerPageResponse<HolidayResponse> | HolidayResponse[]>
    // >(API_ENDPOINTS.HOLIDAY.BASE, { params });
    // return apiMappedPageResponse(
    //   response,
    //   mapHolidayResponseToViewModel,
    //   "Holidays loaded",
    // );
    // }

    // return mockResponse(
    //   paginate(
    //     mockHolidayCalendars.flatMap((calendar) => calendar.holidays),
    //     params,
    //   ),
    //   "Holidays loaded",
    // );
  }

  async selectOptionalHoliday(eId: any, payload: any) {
    return apiService.put(API_ENDPOINTS.HOLIDAY.OPT_HOLIDAYS_BY_EMP(eId),payload)
  } 

  async getOptionalHolidayByEmpId(eId: string) {
    return apiService.get(API_ENDPOINTS.HOLIDAY.OPT_HOLIDAYS_BY_EMP(eId))
  } 

  async getOptionalHoliday() {
    return apiService.get(API_ENDPOINTS.HOLIDAY.OPTIONAL)
  } 

  async createHoliday(payload: Partial<Holiday>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.post(
        API_ENDPOINTS.HOLIDAY.BASE,
        payload,
      )) as ApiEnvelope<HolidayResponse>;
      return apiMappedResponse(
        response,
        mapHolidayResponseToViewModel,
        "Holiday created",
      );
    }

    // const created: Holiday = {
    //   id: `h-${Date.now()}`,
    //   name: payload.name ?? "New Holiday",
    //   date: payload.date ?? new Date().toISOString().slice(0, 10),
    //   type: payload.type ?? "PUBLIC",
    //   location: payload.location ?? "",
    //   calendarId: payload.calendarId,
    //   calendarName: payload.calendarName,
    //   active: payload.active ?? true,
    // };
    // const calendar =
    //   mockHolidayCalendars.find((item) => item.id === payload.calendarId) ??
    //   mockHolidayCalendars[0];
    // calendar?.holidays.push(created);
    // return mockResponse(created, "Holiday created");
  }

  async updateHoliday(id: string, payload: Partial<Holiday>) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.put(
        API_ENDPOINTS.HOLIDAY.UPDATE(id),
        payload,
      )) as ApiEnvelope<HolidayResponse>;
      return apiMappedResponse(
        response,
        mapHolidayResponseToViewModel,
        "Holiday updated",
      );
    }

    // for (const calendar of mockHolidayCalendars) {
    //   const index = calendar.holidays.findIndex((holiday) => holiday.id === id);
    //   if (index >= 0) {
    //     calendar.holidays[index] = {
    //       ...calendar.holidays[index],
    //       ...payload,
    //       id,
    //     };
    //     return mockResponse(calendar.holidays[index], "Holiday updated");
    //   }
    // }
    // return mockResponse(null, "Holiday not found");
  }

  async deleteHoliday(id: string) {
    return await apiService.delete(API_ENDPOINTS.HOLIDAY.DELETE(id));
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const response = (await apiService.delete(
    //   API_ENDPOINTS.HOLIDAY.DELETE(id),
    // )) as ApiEnvelope<null>;
    // return apiResponse(response, "Holiday deleted");
    // }

    // for (const calendar of mockHolidayCalendars) {
    //   const index = calendar.holidays.findIndex((holiday) => holiday.id === id);
    //   if (index >= 0) {
    //     calendar.holidays.splice(index, 1);
    //     break;
    //   }
    // }
    // return mockResponse(null, "Holiday deleted");
  }

  async getUpcomingHolidays(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.HOLIDAY.UPCOMING_HOLIDAYS, {
      params,
    });
    // return apiOperationalListResponse(
    //   response,
    //   mapHolidayResponseToViewModel,
    //   "Upcoming holidays loaded",
    // );
  }

  async importHolidays(calendarId: string, payload: HolidayImport) {
    // return await apiService.post(API_ENDPOINTS.HOLIDAY_IMPORT.BASE, {params},payload)
    const response = (await apiService.post(
      API_ENDPOINTS.HOLIDAY_IMPORT.BASE,
      payload,
      { params: { calendarId } },
    )) as ApiEnvelope<HolidayImportResult>;
    return apiResponse(response, "Holidays imported");
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // NOTE: response shape inferred from endpoint name, verify against backend swagger
    // const response = (await apiService.upload(
    //   API_ENDPOINTS.HOLIDAY_IMPORT.BASE,
    //   file,
    //   "file",
    //   { calendarId },
    // )) as ApiEnvelope<HolidayImportResult>;
    // return apiResponse(response, "Holidays imported");
    // }

    // const result: HolidayImportResult = {
    //   id: `hi-${Date.now()}`,
    //   fileName: file.name,
    //   calendarId,
    //   totalRows: 1,
    //   importedCount: 1,
    //   skippedCount: 0,
    //   errorCount: 0,
    //   importedAt: new Date().toISOString().slice(0, 10),
    // };
    // mockHolidayImportHistory.unshift(result);
    // return mockResponse(result, "Holidays imported");
  }

  async getHolidayImportHistory(_params?: LeaveListParams) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      throw new Error("getHolidayImportHistory: real API not implemented");
    }

    // return mockResponse(
    //   paginate(mockHolidayImportHistory, params),
    //   "Holiday import history loaded",
    // );
  }

  async getCompOffCredits(params?: LeaveListParams) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    return await apiService.get(API_ENDPOINTS.COMP_OFF.BASE, { params });
    // return apiMappedPageResponse(
    //   response,
    // mapCompOffResponseToCreditViewModel,
    // "Comp-off credits loaded",
    // );
    // }

    // const credits = mockCompOffCredits.filter(
    //   (item) => !params?.employeeId || item.employeeId === params.employeeId,
    // );
    // return mockResponse(
    //   paginate<CompOffCredit>(credits, params),
    //   "Comp-off credits loaded",
    // );
  }

  // async getCompOffCreditRequests(params?: LeaveListParams) {
  //   // if (!USE_MOCK_LEAVE_SERVICE) {
  //     const response = await apiService.get<
  //       ApiEnvelope<SwaggerPageResponse<CompOffResponse> | CompOffResponse[]>
  //     >(API_ENDPOINTS.COMP_OFF.BASE, { params });
  //     return apiMappedPageResponse(
  //       response,
  //       mapCompOffResponseToViewModel,
  //       "Comp-off request history loaded",
  //     );
  //   // }

  //   // const requests = mockCompOffCreditRequests.filter(
  //   //   (item) => !params?.employeeId || item.employeeId === params.employeeId,
  //   // );
  //   // return mockResponse(
  //   //   paginate<CompOffCreditRequest>(requests, params),
  //   //   "Comp-off request history loaded",
  //   // );
  // }

  async requestCompOffCredit(payload: CompOffCreditRequestPayload) {
    return await apiService.post(API_ENDPOINTS.COMP_OFF.BASE, payload);
    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = (await apiService.post(API_ENDPOINTS.COMP_OFF.BASE, {
    //     workedDate: payload.workedDate,
    //     sessionType: payload.workedSession,
    //     creditDays:
    //       payload.creditDays ??
    //       (payload.workedSession === "FULL_DAY" ? 1 : 0.5),
    //     expiryDate: payload.expiryDate,
    //     reason: payload.reason,
    //     approverId: payload.approverId,
    //     leaveTypeId: payload.leaveTypeId,
    //   })) as ApiEnvelope<CompOffResponse>;
    //   return apiMappedResponse(
    //     response,
    //     mapCompOffResponseToViewModel,
    //     "Comp-off credit request submitted",
    //   );
    // }

    // const requestedDays = payload.workedSession === "FULL_DAY" ? 1 : 0.5;
    // const request: CompOffCreditRequest = {
    //   id: `co-req-${Date.now()}`,
    //   employeeId: payload.employeeId,
    //   workedDate: payload.workedDate,
    //   workedSession: payload.workedSession,
    //   requestedDays,
    //   reason: payload.reason,
    //   status: "PENDING",
    //   submittedOn: new Date().toISOString().slice(0, 10),
    //   approver: "Nisha Rao",
    // };

    // return mockResponse(request, "Comp-off credit request submitted");
  }

  async getCompOffById(id: string) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = await apiService.get<ApiEnvelope<CompOffResponse>>(
        API_ENDPOINTS.COMP_OFF.GET_BY_ID(id),
      );
      return apiMappedResponse(
        response,
        mapCompOffResponseToViewModel,
        "Comp-off request loaded",
      );
    }

    // const request = mockCompOffCreditRequests.find((item) => item.id === id);
    // return mockResponse(
    //   request ?? null,
    //   request ? "Comp-off request loaded" : "Comp-off request not found",
    // );
  }

  async approveCompOffCredit(id: string, payload?: LeaveActionPayload) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.post(
        API_ENDPOINTS.COMP_OFF.APPROVE(id),
        payload ?? {},
      )) as ApiEnvelope<CompOffResponse>;
      return apiMappedResponse(
        response,
        mapCompOffResponseToViewModel,
        "Comp-off credit approved",
      );
    }

    // const index = mockCompOffCreditRequests.findIndex((item) => item.id === id);
    // if (index < 0) {
    //   return mockResponse(null, "Comp-off request not found");
    // }
    // const updated = {
    //   ...mockCompOffCreditRequests[index],
    //   status: "APPROVED" as const,
    // };
    // mockCompOffCreditRequests[index] = updated;
    // mockCompOffCredits.push({
    //   id: `co-cred-${Date.now()}`,
    //   employeeId: updated.employeeId,
    //   workedDate: updated.workedDate,
    //   workedSession: updated.workedSession,
    //   creditedDays: updated.requestedDays,
    //   expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    //     .toISOString()
    //     .slice(0, 10),
    //   status: "AVAILABLE",
    //   reason: updated.reason,
    //   approvedBy: updated.approver,
    // });
    // return mockResponse(updated, "Comp-off credit approved");
  }

  async rejectCompOffCredit(id: string, payload?: LeaveActionPayload) {
    if (!USE_MOCK_LEAVE_SERVICE) {
      const response = (await apiService.post(
        API_ENDPOINTS.COMP_OFF.REJECT(id),
        payload ?? {},
      )) as ApiEnvelope<CompOffResponse>;
      return apiMappedResponse(
        response,
        mapCompOffResponseToViewModel,
        "Comp-off credit rejected",
      );
    }

    // const index = mockCompOffCreditRequests.findIndex((item) => item.id === id);
    // if (index < 0) {
    //   return mockResponse(null, "Comp-off request not found");
    // }
    // mockCompOffCreditRequests[index] = {
    //   ...mockCompOffCreditRequests[index],
    //   status: "REJECTED",
    // };
    // return mockResponse(
    //   mockCompOffCreditRequests[index],
    //   "Comp-off credit rejected",
    // );
  }

  // async getTeamCalendar(_params?: LeaveListParams) {
  //   // if (!USE_MOCK_LEAVE_SERVICE) {
  //   throw new Error("getTeamCalendar: real API not implemented");
  //   // }

  //   // return mockResponse(
  //   //   paginate(mockTeamCalendar, params),
  //   //   "Team calendar loaded",
  //   // );
  // }

  async getWorkCalendars() {
    return await apiService.get(API_ENDPOINTS.WORK_CALENDAR.BASE);
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const response = await apiService.get<
    //   ApiEnvelope<SwaggerPageResponse<WorkCalendarResponse>>
    // >(API_ENDPOINTS.WORK_CALENDAR.BASE, { params });
    // return apiMappedPageResponse(
    //   response,
    //   mapWorkCalendarResponseToViewModel,
    //   "Work calendars loaded",
    // );
    // }

    // return mockResponse(
    //   paginate(mockWorkCalendars, params),
    //   "Work calendars loaded",
    // );
  }

  async getWorkCalendarById(_id: string) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = await apiService.get<ApiEnvelope<WorkCalendarResponse>>(
    //     API_ENDPOINTS.WORK_CALENDAR.GET_BY_ID(id),
    //   );
    //   return apiMappedResponse(
    //     response,
    //     mapWorkCalendarResponseToViewModel,
    //     "Work calendar loaded",
    //   );
    // }
    // const calendar = mockWorkCalendars.find((item) => item.id === id);
    // return mockResponse(
    //   calendar ?? null,
    //   calendar ? "Work calendar loaded" : "Work calendar not found",
    // );
  }

  async createWorkCalendar(payload: Partial<WorkCalendar>) {
    return await apiService.post(API_ENDPOINTS.WORK_CALENDAR.BASE, payload);
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const response = (await apiService.post(
    //   API_ENDPOINTS.WORK_CALENDAR.BASE,
    //   payload,
    // )) as ApiEnvelope<WorkCalendarResponse>;
    // return apiMappedResponse(
    //   response,
    //   mapWorkCalendarResponseToViewModel,
    //   "Work calendar created",
    // );
    // }

    // const created: WorkCalendar = {
    //   id: `wc-${Date.now()}`,
    //   name: payload.name ?? "New Work Calendar",
    //   locations: payload.locations ?? [],
    //   weeklyOffs: payload.weeklyOffs ?? ["SATURDAY", "SUNDAY"],
    //   workingHoursPerDay: payload.workingHoursPerDay ?? 8,
    //   active: payload.active ?? true,
    // };
    // mockWorkCalendars.push(created);
    // return mockResponse(created, "Work calendar created");
  }

  async updateWorkCalendar(id: string, payload: Partial<WorkCalendar>) {
    return await apiService.put(
      API_ENDPOINTS.WORK_CALENDAR.UPDATE(id),
      payload,
    );
    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = (await apiService.put(
    //     API_ENDPOINTS.WORK_CALENDAR.UPDATE(id),
    //     payload,
    //   )) as ApiEnvelope<WorkCalendarResponse>;
    //   return apiMappedResponse(
    //     response,
    //     mapWorkCalendarResponseToViewModel,
    //     "Work calendar updated",
    //   );
    // }

    // const index = mockWorkCalendars.findIndex((item) => item.id === id);
    // if (index < 0) {
    //   return mockResponse(null, "Work calendar not found");
    // }
    // mockWorkCalendars[index] = { ...mockWorkCalendars[index], ...payload, id };
    // return mockResponse(mockWorkCalendars[index], "Work calendar updated");
  }

  async deleteWorkCalendar(id: string) {
    return await apiService.delete(API_ENDPOINTS.WORK_CALENDAR.DELETE(id));
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // const response = (await apiService.delete(
    //   API_ENDPOINTS.WORK_CALENDAR.DELETE(id),
    // )) as ApiEnvelope<null>;
    // return apiResponse(response, "Work calendar deleted");
    // }

    // const index = mockWorkCalendars.findIndex((item) => item.id === id);
    // if (index >= 0) {
    //   mockWorkCalendars.splice(index, 1);
    // }
    // return mockResponse(null, "Work calendar deleted");
  }

  async getPayrollLeaveInputs(params?: LeaveListParams) {
    // if (!USE_MOCK_LEAVE_SERVICE) {
    const response = await apiService.get<
      ApiEnvelope<SwaggerPageResponse<PayrollLeaveInput>>
    >(API_ENDPOINTS.LEAVE.PAYROLL.LEAVE_INPUTS, { params });
    return apiPageResponse(response, "Payroll leave inputs loaded");
    // }

    // return mockResponse(
    //   paginate(mockPayrollLeaveInputs, params),
    //   "Payroll leave inputs loaded",
    // );
  }

  async getPayrollLeaveSummary(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.LEAVE.PAYROLL.LEAVE_SUMMARY, {
      params,
    });
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // NOTE: response shape inferred from PayrollLeaveInput, verify against backend swagger
    // const response = await apiService.get<
    //   ApiEnvelope<SwaggerPageResponse<PayrollLeaveSummary>>
    // >(API_ENDPOINTS.PAYROLL.LEAVE_SUMMARY, { params });
    // return apiPageResponse(response, "Payroll leave summary loaded");
    // }

    // const byEmployeeMonth = new Map<string, PayrollLeaveSummary>();
    // for (const input of mockPayrollLeaveInputs) {
    //   const key = `${input.employeeId}-${input.month}`;
    //   const existing = byEmployeeMonth.get(key);
    //   if (existing) {
    //     existing.totalLopDays += input.lopDays;
    //     existing.totalPaidLeaveDays += input.paidLeaveDays;
    //     existing.totalCompOffDays += input.compOffDays;
    //     continue;
    //   }
    //   byEmployeeMonth.set(key, {
    //     employeeId: input.employeeId,
    //     employeeCode: input.employeeCode,
    //     employeeName: input.employeeName,
    //     month: input.month,
    //     totalLopDays: input.lopDays,
    //     totalPaidLeaveDays: input.paidLeaveDays,
    //     totalCompOffDays: input.compOffDays,
    //     totalEncashedDays: 0,
    //   });
    // }

    // return mockResponse(
    //   paginate(Array.from(byEmployeeMonth.values()), params),
    //   "Payroll leave summary loaded",
    // );
  }

  async runLeaveAccrual(params: LeaveAccrualRunRequest) {
    return await apiService.post(API_ENDPOINTS.LEAVE_ACCRUAL.RUN, params);
    // if (!USE_MOCK_LEAVE_SERVICE) {
    // NOTE: response shape inferred from endpoint name, verify against backend swagger
    // const response = (await apiService.post(
    //   API_ENDPOINTS.LEAVE_ACCRUAL.RUN,
    //   payload,
    // )) as ApiEnvelope<LeaveAccrualRunResponse>;
    // return apiMappedResponse(
    //   response,
    //   mapLeaveAccrualRunResponseToViewModel,
    //   "Leave accrual run completed",
    // );
    // }

    // let employeesProcessed = 0;
    // if (!payload.dryRun) {
    //   for (const balance of mockLeaveBalances) {
    //     if (
    //       payload.leaveTypeId &&
    //       balance.leaveTypeId !== payload.leaveTypeId
    //     ) {
    //       continue;
    //     }
    //     balance.credited += 1;
    //     balance.balance += 1;
    //     employeesProcessed += 1;
    //   }
    // } else {
    //   employeesProcessed = mockLeaveBalances.filter(
    //     (balance) =>
    //       !payload.leaveTypeId || balance.leaveTypeId === payload.leaveTypeId,
    //   ).length;
    // }

    // const result: LeaveAccrualRunResult = {
    //   runId: `accrual-${Date.now()}`,
    //   month: payload.month,
    //   employeesProcessed,
    //   totalDaysAccrued: payload.dryRun ? 0 : employeesProcessed,
    //   status: "COMPLETED",
    //   runAt: new Date().toISOString(),
    // };
    // return mockResponse(result, "Leave accrual run completed");
  }

  async getUpcomingWorkAnniversaries(params?: LeaveListParams) {
    return await apiService.get(
      API_ENDPOINTS.EMP_OPERATIONAL_LIST.ANNIVERSARIES,
      { params },
    );
    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = await apiService.get<
    //     ApiEnvelope<
    //       | SwaggerPageResponse<EmpOperationalListEntry>
    //       | EmpOperationalListEntry[]
    //     >
    //   >(API_ENDPOINTS.EMP_OPERATIONAL_LIST.ANNIVERSARIES, { params });
    //   return apiPageResponse(response, "Upcoming work anniversaries loaded");
    // }

    // return mockResponse(
    //   paginate(mockUpcomingAnniversaries, params),
    //   "Upcoming work anniversaries loaded",
    // );
  }

  async getUpcomingBirthdays(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.EMP_OPERATIONAL_LIST.BIRTHDAYS, {
      params,
    });

    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = await apiService.get<
    //     ApiEnvelope<
    //       | SwaggerPageResponse<EmpOperationalListEntry>
    //       | EmpOperationalListEntry[]
    //     >
    //   >(API_ENDPOINTS.EMP_OPERATIONAL_LIST.BIRTHDAYS, { params });
    //   return apiPageResponse(response, "Upcoming birthdays loaded");
    // }

    // return mockResponse(
    //   paginate(mockUpcomingBirthdays, params),
    //   "Upcoming birthdays loaded",
    // );
  }

  async getRecentResignations(params?: LeaveListParams) {
    return await apiService.get(
      API_ENDPOINTS.EMP_OPERATIONAL_LIST.RESIGNATIONS,
      { params },
    );

    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = await apiService.get<
    //     ApiEnvelope<
    //       | SwaggerPageResponse<EmpOperationalListEntry>
    //       | EmpOperationalListEntry[]
    //     >
    //   >(API_ENDPOINTS.EMP_OPERATIONAL_LIST.RESIGNATIONS, { params });
    //   return apiPageResponse(response, "Recent resignations loaded");
    // }

    // return mockResponse(
    //   paginate(mockRecentResignations, params),
    //   "Recent resignations loaded",
    // );
  }

  async getRecentJoiners(params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.EMP_OPERATIONAL_LIST.JOINERS, {
      params,
    });

    // if (!USE_MOCK_LEAVE_SERVICE) {
    //   const response = await apiService.get<
    //     ApiEnvelope<
    //       | SwaggerPageResponse<EmpOperationalListEntry>
    //       | EmpOperationalListEntry[]
    //     >
    //   >(API_ENDPOINTS.EMP_OPERATIONAL_LIST.JOINERS, { params });
    //   return apiPageResponse(response, "Recent joiners loaded");
    // }

    // return mockResponse(
    //   paginate(mockRecentJoiners, params),
    //   "Recent joiners loaded",
    // );
  }

  async getLeaveInputs(params?: PayrollInputFilter) {
    const response = await apiService.get<
      ApiEnvelope<SwaggerPageResponse<PayrollInput>>
    >(API_ENDPOINTS.LEAVE.PAYROLL.LEAVE_INPUTS, {
      params: {
        ...params,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response;
  }

  async getLeaveEncashments(params?: LeaveEncashmentFilter) {
    const response = await apiService.get<
      ApiEnvelope<SwaggerPageResponse<LeaveEncashment>>
    >(API_ENDPOINTS.LEAVE.PAYROLL.GET_LEAVE_ENCASHMENT, {
      params: {
        ...params,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response;
  }

  async generateLeaveInputs(payload: GeneratePayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.PAYROLL.GENERATE,
      payload,
    );
    return response;
  }

  async lockLeaveInputs(payload: LockUnlockPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.PAYROLL.LOCK,
      payload,
    );
    return response;
  }

  async unlockLeaveInputs(payload: LockUnlockPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.PAYROLL.UNLOCK,
      payload,
    );
    return response;
  }

  async createLeaveEncashment(payload: LeaveEncashmentPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.PAYROLL.POST_LV_ENCASHMENT,
      payload,
    );
    return response;
  }

  async previewLeaveEncashment(payload: LeaveEncashmentPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.PAYROLL.PREVIEW,
      payload,
    );
    return response;
  }

  async processFinalSettlement(empId: string, payload: FinalSettlementPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.PAYROLL.FS_LV_PROCESS(empId),
      payload,
    );
    return response;
  }

  async previewFinalSettlement(empId: string, payload: FinalSettlementPayload) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.PAYROLL.FS_LV_PREVIEW(empId),
      payload,
    );
    return response;
  }

  async getTeamCalendar(params: {
    fromDate: string;
    toDate: string;
    departmentId?: string;
  }) {
    return apiService.get(API_ENDPOINTS.LEAVE.TEAM_CALENDAR, { params });
  }

  async uploadLeaveAttachment(
    id: string,
    payload: { documentName: string; documentType?: string; file: File },
  ) {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("documentName", payload.documentName);
    if (payload.documentType) {
      formData.append("documentType", payload.documentType);
    }

    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.ATTACHMENTS.UPLOAD(id),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  }

  async deleteLeaveAttachment(id: string, attachmentId: string) {
    const response = await apiService.delete(
      API_ENDPOINTS.LEAVE.ATTACHMENTS.DELETE(id, attachmentId),
    );
    return response;
  }

  async getLeaveAttachments(id: string) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.ATTACHMENTS.GET_BY_ID(id),
    );
    return response;
  }

  async getLeaveUsageReport(filters: {
    from?: string;
    to?: string;
    employeeId?: string;
  }) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.REPORTS.LEAVE_USAGE,
      { params: filters },
    );
    return response;
  }

  async getLeavePendingApprovalsReport(filters: {
    from?: string;
    to?: string;
  }) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.REPORTS.LEAVE_PENDING_APPROVALS,
      { params: filters },
    );
    return response;
  }

  async getLeaveLopReport(filters: { from?: string; to?: string }) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.REPORTS.LEAVE_LOP,
      { params: filters },
    );
    return response;
  }

  async getLeaveCompOffReport(filters: { status?: string }) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.REPORTS.LEAVE_COMP_OFF,
      { params: filters },
    );
    return response;
  }

  async getLeaveBalanceReport(filters: { year?: number; employeeId?: string }) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.REPORTS.LEAVE_BALANCE,
      { params: filters },
    );
    return response;
  }

  async exportReport(payload: {
    reportType:
      | "LEAVE_BALANCE"
      | "LEAVE_USAGE"
      | "LEAVE_LOP"
      | "LEAVE_PENDING_APPROVALS"
      | "LEAVE_COMP_OFFS";
    format: "csv" | "xlsx";
    filters?: {
      leaveYear?: number;
      employeeId?: string;
      branchId?: string;
      from?: string;
      to?: string;
    };
  }) {
    const response = await apiService.post(
      API_ENDPOINTS.LEAVE.REPORTS.POST_EXPORT,
      payload,
    );
    return response;
  }

  async getExportStatus(jobRef: string) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.REPORTS.GET_EXPORTS(jobRef),
    );
    return response;
  }

  async downloadExport(jobRef: string) {
    const response = await apiService.get(
      API_ENDPOINTS.LEAVE.REPORTS.DOWNLOAD_EXPORT(jobRef),
      { responseType: "blob" },
    );
    return response;
  }

  async getEmpLeaveAudit(id: string, params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.EMPLOYEE.LEAVE_AUDIT(id), {
      params,
    });
  }

  async getLeaveAudit(id: string, params?: LeaveListParams) {
    return await apiService.get(API_ENDPOINTS.LEAVE.GET_AUDIT(id), { params });
  }
}

export const leaveService = new LeaveService();

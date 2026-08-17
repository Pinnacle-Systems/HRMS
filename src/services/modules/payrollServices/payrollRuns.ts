import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";


export interface PayrollRunQuery {
  status?: string;
  year?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PayrollRun {
  id: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  paymentDate: string;
  workingDays: number;
  status: string;
  totalEmployees: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  progressPercent: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  notifyEmail: string;
  startedAt: string;
  finishedAt: string;
  errorSummary: string;
  createdAt: string;
}

export interface PayrollRunItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  status: string;
  basic: number;
  hra: number;
  conveyance: number;
  special: number;
  gross: number;
  pf: number;
  professionalTax: number;
  tds: number;
  loanAdvance: number;
  otherDeductions: number;
  totalDeductions: number;
  lopDays: number;
  lopAmount: number;
  netPay: number;
  errorMessage: string;
}

export interface PayrollRunItemsResponse {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: PayrollRunItem[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  empty: boolean;
}

export interface PeriodDetails {
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
  workingDays: number;
}

export interface PayrollRunCreatePayload {
  payrollPeriodId?: string;
  periodYear?: number;
  periodMonth?: number;
  paymentDate: string;
  workingDays: number;
  employeeIds?: string[];
  notifyEmail?: string;
  branchId?: string;
}

export interface PayrollRunPreviewPayload {
  periodYear: number;
  periodMonth: number;
  workingDays: number;
  employeeIds?: string[];
}

export interface PayrollRunPreviewResponse {
  items: PayrollRunItem[];
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
}

export const payrollRunsService = {
  async getPayrollRuns(params?: PayrollRunQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLRUNS.BASE, { params });
  },

  async getPayrollRunById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLRUNS.GET_BY_ID(id));
  },

  async getPayrollRunItems(id: string, params?: { status?: string; page?: number; size?: number; sort?: string[] }) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLRUNS.GET_ITEMS(id), { params });
  },

  // async getPeriodDetails(params: { year: number; month: number }) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLRUNS.GET_PERIOD_DETAILS, { params });
  // },

  async createPayrollRun(payload: PayrollRunCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.PAYROLLRUNS.CREATE, payload);
  },

  async cancelPayrollRun(id: string) {
    return apiService.post(API_ENDPOINTS.PAYROLL.PAYROLLRUNS.CANCEL(id));
  },

  async previewPayrollRun(payload: PayrollRunPreviewPayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.PAYROLLRUNS.PREVIEW, payload);
  },
};
import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface DaySplit {
  startDate: string;
  endDate: string;
  totalDays: number;
  workingDays: number;
  weekOff: number;
  holidays: number;
  holidayList: Holiday[];
} 

export interface Period {
  holidays: Holiday[];
  periodMonth?: string;
  periodYear?: string;
  id: string;
  name: string;
  month: number;
  monthName: string;     
  year: number;
  startDate: string;      
  endDate: string;
  paymentDate: string;
  cutoffDate: string;
  workingDays: number;
  workingDaysPerWeek?: number;
  status: string;         
  daySplit: DaySplit;
  periodType?: string;
}

export interface Holiday {
  name: string;
  date: string;
  type: string;
}

export interface PeriodCreatePayload {
  name: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  cutoffDate: string;
  workingDays: number;
  status: string;
  holidays: Holiday[];
}

export interface PeriodUpdateResult extends Period {
  affectedPeriods: string[];
}

export interface PeriodUpdateResponse {
  success: boolean;
  message: string;
  data: PeriodUpdateResult;
  timestamp: string;
}

export interface PeriodUpdateOptions {
  dryRun?: boolean;
}

export interface PeriodUpdatePayload {
  name: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  cutoffDate: string;
  workingDays: number;
  workingDaysPerWeek?: number;
  status: string;
  holidays: Holiday[];
}

export type PeriodSortBy =
  | "startDate"
  | "endDate"
  | "paymentDate"
  | "cutoffDate"
  | "workingDays"
  | "name"
  | "status"
  | "periodType";

export type PeriodSortDirection = "asc" | "desc";

export interface PeriodSortParams {
  sortBy: PeriodSortBy;
  sortDir: PeriodSortDirection;
}

export const periodsService = {
  async getPeriods(params?: PeriodSortParams) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PERIODS.BASE, { params });
  },

  async getSummaryPeriods(params: any) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PERIODS.SUMMARY , {params});
  },

  async getPeriodById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PERIODS.GET_BY_ID(id));
  },

  async createPeriod(payload: PeriodCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.PERIODS.CREATE, payload);
  },

  async updatePeriod(
    id: string,
    payload: PeriodUpdatePayload,
    options?: PeriodUpdateOptions,
  ) {
    return apiService.put<PeriodUpdateResponse>(
      API_ENDPOINTS.PAYROLL.PERIODS.UPDATE(id),
      payload,
      { params: options },
    );
  },

  async deletePeriod(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.PERIODS.DELETE(id));
  },
};
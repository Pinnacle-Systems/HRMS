import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";


export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  cutoffDate: string;
  workingDays: number;
  status: string;
  holidays: Holiday[];
  periodMonth?: string;
  periodYear?: string;
}

export interface Holiday {
  name: string;
  date: string;
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

export interface PeriodUpdatePayload {
  name: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  cutoffDate: string;
  workingDays: number;
  status: string;
  holidays: Holiday[];
}

export const periodsService = {
  async getPeriods() {
    return apiService.get(API_ENDPOINTS.PAYROLL.PERIODS.BASE);
  },

  async getPeriodById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PERIODS.GET_BY_ID(id));
  },

  async createPeriod(payload: PeriodCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.PERIODS.CREATE, payload);
  },

  async updatePeriod(id: string, payload: PeriodUpdatePayload) {
    return apiService.put(API_ENDPOINTS.PAYROLL.PERIODS.UPDATE(id), payload);
  },

  async deletePeriod(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.PERIODS.DELETE(id));
  },
};
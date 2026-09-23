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
  status: string;         
  daySplit: DaySplit;
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

  async getSummaryPeriods(params: any) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PERIODS.SUMMARY , {params});
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
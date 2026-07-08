import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

interface FiscalYearListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

interface FiscalYearPayload {
  yearLabel: string;
  startDate: string;
  endDate: string;
}

class FiscalYearService {

  async getFiscalYears(cid: string, params?: FiscalYearListParams) {
    return apiService.get(API_ENDPOINTS.FISCAL_YEARS.GET(cid), { params });
  }

  async getActiveFiscalYears(cid: string, params?: FiscalYearListParams) {
    return apiService.get(API_ENDPOINTS.FISCAL_YEARS.GET_ACTIVE(cid), {
      params,
    });
  }

  async createFiscalYear(cid: string, payload: FiscalYearPayload) {
    return apiService.post(API_ENDPOINTS.FISCAL_YEARS.CREATE(cid), payload);
  }

  async updateFiscalYear(cid: string, id: string, payload: FiscalYearPayload) {
    return apiService.put(API_ENDPOINTS.FISCAL_YEARS.UPDATE(cid, id), payload);
  }

  async activateFiscalYear(cid: string, id: string) {
    return apiService.put(API_ENDPOINTS.FISCAL_YEARS.ACTIVATE(cid, id));
  }

  async deleteFiscalYear(cid: string, id: string) {
    return apiService.delete(API_ENDPOINTS.FISCAL_YEARS.DELETE(cid, id));
  }
}

export const fiscalYearService = new FiscalYearService();

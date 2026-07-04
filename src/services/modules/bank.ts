import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface GetBankParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  branchId?: string;
  companyId?: string;
  status?: string;
}

export type BankStatus = "ACTIVE" | "INACTIVE";

class BankService {
  async getBanks(params?: GetBankParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.BANK.BASE, { params });
  }

  async deleteBankById(id: string | number) {
    return apiService.delete(API_ENDPOINTS.BANK.DELETE(String(id)));
  }

  async getBankById(id: string | number) {
    return apiService.get(API_ENDPOINTS.BANK.GET_BY_ID(String(id)));
  }

  async setPrimary(id: string | number) {
    return apiService.patch(API_ENDPOINTS.BANK.PATCH_PRIMARY(String(id)));
  }

  async updateStatus(id: string | number, status: BankStatus) {
    return apiService.patch(
      `${API_ENDPOINTS.BANK.PATCH_STATUS(String(id))}?status=${status}`,
    );
  }

  async createBank(payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.BANK.CREATE, payload);
  }

  async updateBank(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.BANK.UPDATE(String(id)), payload);
  }
}
export const bankService = new BankService();

import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

interface GetBranchesParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class BranchService {
  async getBranches(params?: GetBranchesParams) {
    return apiService.get(API_ENDPOINTS.BRANCH.BASE, { params });
  }

  async deleteBranchById(id: string | number) {
    return apiService.delete(API_ENDPOINTS.BRANCH.DELETE(String(id)));
  }

  async getBranchById(id: string | number) {
    return apiService.get(API_ENDPOINTS.BRANCH.GET_BY_ID(String(id)));
  }

  async getActiveBranches(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.BRANCH.GET_ACTIVE, { params });
  }

  async toggleBranchById(id: string | number) {
    return apiService.patch(API_ENDPOINTS.BRANCH.PATCH(String(id)));
  }

  async createBranch(payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.BRANCH.CREATE, payload);
  }

  async updateBranch(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.BRANCH.UPDATE(String(id)), payload);
  }
}
export const branchService = new BranchService();

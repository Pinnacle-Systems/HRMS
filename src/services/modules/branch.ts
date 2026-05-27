import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface GetBranchesParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  isActive?: boolean;
  branchHeadId?: string;
}

class BranchService {
  async getBranches(params?: GetBranchesParams | Record<string, unknown>) {
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

  async getBranchesUsage(id: string | number) {
    return apiService.get(API_ENDPOINTS.BRANCH.GET_USAGE(String(id)));
  }

  async getDropdownBranches() {
    return apiService.get(API_ENDPOINTS.BRANCH.GET_DROPDOWN);
  }

  async createDefaultBranch() {
    return apiService.post(API_ENDPOINTS.BRANCH.DEFAULT_CREATE);
  }
}
export const branchService = new BranchService();

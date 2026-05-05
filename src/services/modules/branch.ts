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

  async deleteBranchById(id: any) {
    return apiService.delete(API_ENDPOINTS.BRANCH.DELETE(id));
  }

  async getBranchById(id: any) {
    return apiService.get(API_ENDPOINTS.BRANCH.GET_BY_ID(id));
  }

  async getActiveBranches(params?: any) {
    return apiService.get(API_ENDPOINTS.BRANCH.GET_ACTIVE, { params });
  }

  async toggleBranchById(id: any) {
    return apiService.patch(API_ENDPOINTS.BRANCH.PATCH(id));
  }

  async createBranch(payload: any) {
    return apiService.post(API_ENDPOINTS.BRANCH.CREATE, payload);
  }

  async updateBranch(id: any, payload:any) {
    return apiService.put(API_ENDPOINTS.BRANCH.UPDATE(id), payload);
  }
}
export const branchService = new BranchService();

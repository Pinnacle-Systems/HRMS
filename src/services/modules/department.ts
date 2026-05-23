import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface GetDepartmentParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  isActive?: boolean;
  branchId?: string;
  departmentHeadId?: string;
}

class DepartmentService {
  async getDepartments(params?: GetDepartmentParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.DEPARTMENT.BASE, { params });
  }

  async deleteDepartmentById(id: any) {
    return apiService.delete(API_ENDPOINTS.DEPARTMENT.DELETE(id));
  }

  async getDepartmentById(id: any) {
    return apiService.get(API_ENDPOINTS.DEPARTMENT.GET_BY_ID(id));
  }

  async getDepartmentByBranchId(bid: any) {
    return apiService.get(API_ENDPOINTS.DEPARTMENT.GET_BY_BRANCHID(bid));
  }

  async getActiveDepartments(params?: any) {
    return apiService.get(API_ENDPOINTS.DEPARTMENT.GET_ACTIVE, { params });
  }

  async toggleDepartmentById(id: any) {
    return apiService.patch(API_ENDPOINTS.DEPARTMENT.PATCH(id));
  }

  async createDepartment(payload: any) {
    return apiService.post(API_ENDPOINTS.DEPARTMENT.CREATE, payload);
  }

  async updateDepartment(id: any, payload:any) {
    return apiService.put(API_ENDPOINTS.DEPARTMENT.UPDATE(id), payload);
  }
}
export const departmentService = new DepartmentService();

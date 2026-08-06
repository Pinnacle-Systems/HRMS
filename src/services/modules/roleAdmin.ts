import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface UserRoleGrantPayload {
  roleId: string;
  branchId?: string;
}

export interface RoleOption {
  roleId: string;
  name: string;
  description?: string;
}

export interface UserRoleGrantRecord {
  grantId: string;
  roleId: string;
  roleName: string;
  scope: string;
  branchId?: string | null;
  branchName?: string | null;
}

const roleAdminEndpoints = (API_ENDPOINTS as any).ROLE_ADMIN;

class RoleAdminService {
  async getRoles() {
    return apiService.get(roleAdminEndpoints.GET_ROLES);
  }

  async getUserRoleGrants(userId: string) {
    return apiService.get(roleAdminEndpoints.GET_USER_ROLES(userId));
  }

  async createUserRoleGrant(userId: string, payload: UserRoleGrantPayload) {
    return apiService.post(roleAdminEndpoints.CREATE_USER_ROLES(userId), payload);
  }

  async deleteUserRoleGrant(userId: string, grantId: string) {
    return apiService.delete(roleAdminEndpoints.DELETE_USER_ROLES(userId, grantId));
  }
}

export const roleAdminService = new RoleAdminService();

import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";


// Types
export interface Permission {
    name: string;
    resource: string;
    action: string;
    description: string;
}

export interface RolePermission {
    roleId: string;
    role: string;
    description: string;
    permissions: string[];
}

export interface PermissionResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

export interface UpdatePermissionsRequest {
    permissions: string[];
}

export interface PermissionQueryParams {
    userId?: string;
    tenantId?: string;
    email?: string;
    password?: string;
    active?: boolean;
    roles?: string[];
    permissions?: string[];
}

export const permissionService = {

    async getRolePermissions(role: string, params?: PermissionQueryParams) {
        const response = await apiService.get<PermissionResponse<RolePermission>>(
            API_ENDPOINTS.PERMISSION.ROLE_PERMISSIONS(role),
            { params }
        );
        return response;
    },

    async getPermissionCatalog() {
        const response = await apiService.get<PermissionResponse<Permission[]>>(
            API_ENDPOINTS.PERMISSION.GET
        );
        return response;
    },

    async updateRolePermissions(
        role: string,
        permissions: string[],
        params?: PermissionQueryParams
    ) {
        const response = await apiService.put<PermissionResponse<RolePermission>>(
            API_ENDPOINTS.PERMISSION.ROLE_PERMISSIONS(role),
            { permissions },
            { params }
        );
        return response;
    }

}
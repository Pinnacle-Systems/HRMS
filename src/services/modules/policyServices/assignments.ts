import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { PolicyAssignment } from "../../../types/policy";

export const assignmentService = {
  async getAssignmentsByVersion(versionId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.ASSIGNMENT.GET_BY_VERSION(versionId));
  },

  async createAssignment(payload: Partial<PolicyAssignment>) {
    return apiService.post(API_ENDPOINTS.POLICY.ASSIGNMENT.CREATE, payload);
  },

  async updateAssignment(id: string, payload: Partial<PolicyAssignment>) {
    return apiService.put(API_ENDPOINTS.POLICY.ASSIGNMENT.UPDATE(id), payload);
  },

  async deleteAssignment(id: string) {
    return apiService.delete(API_ENDPOINTS.POLICY.ASSIGNMENT.DELETE(id));
  },

  async checkConflicts(payload: Partial<PolicyAssignment>) {
    return apiService.post(API_ENDPOINTS.POLICY.ASSIGNMENT.CHECK_CONFLICTS, payload);
  },

  async getAssignmentById(id: string) {
    return apiService.get(API_ENDPOINTS.POLICY.ASSIGNMENT.GET_BY_ID(id));
  },

  async getAssignmentConflicts(id: string) {
    return apiService.get(API_ENDPOINTS.POLICY.ASSIGNMENT.CONFLICTS(id));
  },

  async getEmployeeAssignments(employeeId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.ASSIGNMENT.EMP_ASSIGNMENTS(employeeId));
  },
};

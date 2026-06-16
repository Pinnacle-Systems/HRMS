import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export const approvalWorkflowService = {
  async getApprovalFlowByVersion(versionId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.APPROVAL_WORKFLOW.GET_BY_VERSION(versionId));
  },

  async createApprovalFlow(versionId: string, payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.POLICY.APPROVAL_WORKFLOW.CREATE_FLOW(versionId), payload);
  },

  async updateApprovalFlow(id: string, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.POLICY.APPROVAL_WORKFLOW.UPDATE(id), payload);
  },

  async deleteApprovalFlow(id: string) {
    return apiService.delete(API_ENDPOINTS.POLICY.APPROVAL_WORKFLOW.DELETE(id));
  },

  async createApprovalLevel(flowId: string, payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.POLICY.APPROVAL_WORKFLOW.CREATE_LEVEL(flowId), payload);
  },

  async updateApprovalLevel(levelId: string, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.POLICY.APPROVAL_WORKFLOW.UPDATE_LEVEL(levelId), payload);
  },

  async deleteApprovalLevel(levelId: string) {
    return apiService.delete(API_ENDPOINTS.POLICY.APPROVAL_WORKFLOW.DELETE_LEVEL(levelId));
  },
};

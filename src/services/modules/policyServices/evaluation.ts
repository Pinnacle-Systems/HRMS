import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { PolicyEvaluationRequest, PolicyDomain, PreviewPayload } from "../../../types/policy";

export const evaluationService = {
  async evaluatePolicy(payload: PolicyEvaluationRequest) {
    return apiService.post(API_ENDPOINTS.POLICY.EVALUATION.EVALUATE, payload);
  },

  async previewVersion(versionId: string, payload: PreviewPayload) {
    return apiService.post(API_ENDPOINTS.POLICY.EVALUATION.PREVIEW(versionId), payload);
  },

  async getEmployeePolicies(employeeId: string, domain?: PolicyDomain) {
    return apiService.get(API_ENDPOINTS.POLICY.EVALUATION.GET_EMP_POLICY(employeeId), {
      params: domain ? { domain } : {},
    });
  },

  async getEmployeePolicyHistory(employeeId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.EVALUATION.GET_HISTORY(employeeId));
  },

  async getEffectivePolicy(employeeId: string, domain: string) {
    return apiService.get(API_ENDPOINTS.POLICY.EVALUATION.GET_EFFECTIVE_POLICY(employeeId, domain));
  },
};

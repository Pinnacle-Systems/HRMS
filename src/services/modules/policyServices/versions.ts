import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export const policyVersionService = {
  async getPolicyVersions(policyId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.GET_VERSIONS(policyId));
  },

  async createPolicyVersion(
    policyId: string,
    payload: { changeLog: string; configJson: Record<string, unknown>, effectiveFrom?: string, effectiveTo?: string },
  ) {
    return apiService.post(API_ENDPOINTS.POLICY.CREATE_VERSION(policyId), payload);
  },

  async validatePolicyConfigByPolicy(
    policyId: string,
    payload: { changeLog?: string; configJson: Record<string, unknown> },
  ) {
    return apiService.post(API_ENDPOINTS.POLICY.UPDATE_VALIDATE_CONFIG(policyId), payload);
  },

  async validatePolicyConfigByDomain(
    policyId: string,
    payload: { changeLog?: string; configJson: Record<string, unknown> },
  ) {
    return apiService.post(API_ENDPOINTS.POLICY.CREATE_VALIDATE_CONFIG(policyId), payload);
  },

  async compareVersion(v1: string, v2: string) {
    return apiService.get(API_ENDPOINTS.POLICY.VERSION.COMPARE(v1, v2));
  },

  async updatePolicyVersion(
    versionId: string,
    payload: { changeLog: string; configJson: Record<string, unknown> },
  ) {
    return apiService.put(API_ENDPOINTS.POLICY.VERSION.UPDATE(versionId), payload);
  },

  async submitVersionForApproval(versionId: string, payload?: { remarks: string }) {
    return apiService.post(API_ENDPOINTS.POLICY.VERSION.SUBMIT(versionId), payload ?? {});
  },

  async approveVersion(versionId: string) {
    return apiService.post(API_ENDPOINTS.POLICY.VERSION.APPROVE(versionId));
  },

  async rejectVersion(versionId: string, remarks?: string) {
    return apiService.post(API_ENDPOINTS.POLICY.VERSION.REJECT(versionId), remarks ? { remarks } : {});
  },

  async activateVersion(versionId: string, payload?: { remarks: string }) {
    return apiService.post(API_ENDPOINTS.POLICY.VERSION.ACTIVATE(versionId), payload ?? {});
  },

  async archiveVersion(versionId: string) {
    return apiService.post(API_ENDPOINTS.POLICY.VERSION.ARCHIVE(versionId));
  },

  async expireVersion(versionId: string) {
    return apiService.post(API_ENDPOINTS.POLICY.VERSION.EXPIRE(versionId));
  },

  async getVersionAudit(versionId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.VERSION.GET_AUDIT(versionId));
  },
};

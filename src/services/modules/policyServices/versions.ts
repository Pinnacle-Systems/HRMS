import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export const policyVersionService = {
  async getPolicyVersions(policyId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.GET_VERSIONS(policyId));
  },

  async createPolicyVersion(
    policyId: string,
    payload: {
      changeLog: string;
      configJson: Record<string, unknown>;
      effectiveFrom?: string;
      effectiveTo?: string;
    },
  ) {
    return apiService.post(
      API_ENDPOINTS.POLICY.CREATE_VERSION(policyId),
      payload,
    );
  },

  async validatePolicyConfigByPolicy(
    policyId: string,
    payload: { changeLog?: string; configJson: Record<string, unknown> },
  ) {
    return apiService.post(
      API_ENDPOINTS.POLICY.UPDATE_VALIDATE_CONFIG(policyId),
      payload,
    );
  },

  async validatePolicyConfigByDomain(
    policyId: string,
    payload: { changeLog?: string; configJson: Record<string, unknown> },
  ) {
    return apiService.post(
      API_ENDPOINTS.POLICY.CREATE_VALIDATE_CONFIG(policyId),
      payload,
    );
  },

  async compareVersion(v1: string, v2: string) {
    return apiService.get(API_ENDPOINTS.POLICY.VERSION.COMPARE(v1, v2));
  },

  async updatePolicyVersion(
    versionId: string,
    payload: { changeLog: string; configJson: Record<string, unknown> },
  ) {
    return apiService.put(
      API_ENDPOINTS.POLICY.VERSION.UPDATE(versionId),
      payload,
    );
  },

  async submitVersionForApproval(
    versionId: string,
    payload?: { remarks: string },
  ) {
    return apiService.post(
      API_ENDPOINTS.POLICY.VERSION.SUBMIT(versionId),
      payload ?? {},
    );
  },

  async approveVersion(versionId: string) {
    return apiService.post(API_ENDPOINTS.POLICY.VERSION.APPROVE(versionId));
  },

  async rejectVersion(versionId: string, remarks?: string) {
    return apiService.post(
      API_ENDPOINTS.POLICY.VERSION.REJECT(versionId),
      remarks ? { remarks } : {},
    );
  },

  async activateVersion(versionId: string, payload?: { remarks: string }) {
    return apiService.post(
      API_ENDPOINTS.POLICY.VERSION.ACTIVATE(versionId),
      payload ?? {},
    );
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

  async createNotify(versionId: string, payload: any) {
    return apiService.post(
      API_ENDPOINTS.POLICY.NOTIFICATION.CREATE(versionId),
      payload,
    );
  },

  async exportConfigurtion(token?: string) {
    const response = await apiService.axiosInstance.get(
      API_ENDPOINTS.EMPLOYEE.EXPORT,
      {
        params: {
          token,
        },
        responseType: "blob",
      },
    );

    const blob = response.data;

    if (!blob || blob.size === 0) {
      throw new Error("Downloaded export file is empty.");
    }

    if (
      blob.type?.includes("application/json") ||
      blob.type?.includes("text/plain")
    ) {
      const text = await blob.text();

      let errMsg = "Failed to export employees.";

      try {
        const json = JSON.parse(text);
        if (json.message) errMsg = json.message;
      } catch {
        if (text) errMsg = text;
      }

      throw new Error(errMsg);
    }

    let filename = `version_export`;

    const disposition = response.headers["content-disposition"];

    if (disposition && disposition.includes("attachment")) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;

      const matches = filenameRegex.exec(disposition);

      if (matches?.[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute("download", filename);

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  },
};

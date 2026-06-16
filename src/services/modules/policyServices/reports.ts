import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export const reportService = {
  async getReportSummary(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.REPORTS.GET_SUMMARY, { params });
  },

  async getReportSimulations(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.REPORTS.GET_SIMULATION, { params });
  },

  async getReportConflicts(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.REPORTS.GET_CONFLICTS, { params });
  },

  async getReportAudit(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.REPORTS.GET_AUDIT, { params });
  },

  async getReportAssignments(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.REPORTS.GET_ASSIGNMENTS, { params });
  },

  async getReportApprovals(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.REPORTS.GET_APPROVALS, { params });
  },

  async getDashboardPolicies(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.REPORTS.GET, { params });
  },
};

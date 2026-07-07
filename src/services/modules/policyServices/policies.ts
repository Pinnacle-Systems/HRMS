import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { PolicyDefinition } from "../../../types/policy";

export interface PolicyPageParams {
  search?: string;
  companyId?: string;
  domainId?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PolicyPage {
  content: PolicyDefinition[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CreatePolicyPayload {
  companyId: string;
  templateId: string;
  domainId: string;
  policyCode: string;
  policyName: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpdatePolicyPayload {
  companyId?: string;
  templateId?: string;
  domainId?: string;
  policyCode?: string;
  policyName?: string;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: string;
}

export const policyCrudService = {
  async getPolicies(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.BASE, { params });
  },

  async getPolicyById(id: string) {
    return apiService.get(API_ENDPOINTS.POLICY.GET_BY_ID(id));
  },

  async getPoliciesByCompany(companyId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.COMPANY_POLICY(companyId));
  },

  async getPoliciesByDomain(domain: string) {
    return apiService.get(API_ENDPOINTS.POLICY.GET_BY_DOMAIN(domain));
  },

  async createPolicy(payload: CreatePolicyPayload) {
    return apiService.post(API_ENDPOINTS.POLICY.CREATE, payload);
  },

  async updatePolicy(id: string, payload: UpdatePolicyPayload) {
    return apiService.put(API_ENDPOINTS.POLICY.UPDATE(id), payload);
  },

  async deletePolicy(id: string) {
    return apiService.delete(API_ENDPOINTS.POLICY.DELETE(id));
  },

  // ── Audit ──────────────────────────────────────────────────────────────────
  async getPolicyAudit(policyId: string) {
    return apiService.get(API_ENDPOINTS.POLICY.GET_AUDIT(policyId));
  },

  // Notification
   async getPolicyNotifications() {
    return apiService.get(API_ENDPOINTS.POLICY.NOTIFICATION.GET);
  },
};

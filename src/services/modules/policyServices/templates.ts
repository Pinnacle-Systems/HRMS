import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { PolicyTemplate } from "../../../types/policy";

export interface GetTemplateParams {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export const templateService = {
  async getTemplates(params: GetTemplateParams) {
    return apiService.get(API_ENDPOINTS.POLICY.TEMPLATES.BASE, { params });
  },

  async getTemplateById(id: string) {
    return apiService.get(API_ENDPOINTS.POLICY.TEMPLATES.GET_BY_ID(id));
  },

  async getRuleByTemplateId(id: string) {
    return apiService.get(API_ENDPOINTS.POLICY.TEMPLATES.GET_RULES_BY_ID(id));
  },

  async createTemplate(payload: Partial<PolicyTemplate>) {
    return apiService.post(API_ENDPOINTS.POLICY.TEMPLATES.CREATE, payload);
  },

  async createRuleForTemplate(id: string, payload: any) {
    return apiService.post(API_ENDPOINTS.POLICY.TEMPLATES.ADD_RULE(id), payload);
  },

  async copyTemplate(id: string, payload: any) {
    return apiService.post(API_ENDPOINTS.POLICY.TEMPLATES.COPY(id), payload);
  },

  async updateTemplate(id: string, payload: Partial<PolicyTemplate>) {
    return apiService.put(API_ENDPOINTS.POLICY.TEMPLATES.UPDATE(id), payload);
  },

  async updateRuleForTemplate(id: string, rid: string, payload: Partial<PolicyTemplate>) {
    return apiService.put(API_ENDPOINTS.POLICY.TEMPLATES.UPDATE_RULE(id, rid), payload);
  },

  async deleteTemplate(id: string) {
    return apiService.delete(API_ENDPOINTS.POLICY.TEMPLATES.DELETE(id));
  },

  async deleteRuleFromTemplate(id: string, rid: string) {
    return apiService.delete(API_ENDPOINTS.POLICY.TEMPLATES.REMOVE_RULE(id, rid));
  },
};

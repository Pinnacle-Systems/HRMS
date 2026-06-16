import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface GetRuleBlockParams {
  search?: string;
  active?: boolean;
  domainId?: string;
}

export const ruleBlockService = {
  async getRuleBlocks(params?: GetRuleBlockParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.RULE_BLOCKS.BASE, { params });
  },

  async getRuleBlockSchema(id: string | number) {
    return apiService.get(API_ENDPOINTS.POLICY.RULE_BLOCKS.SCHEMA(String(id)));
  },

  async getRuleBlockByDomain(code: string | number) {
    return apiService.get(API_ENDPOINTS.POLICY.RULE_BLOCKS.BY_DOMAIN(String(code)));
  },

  async deleteRuleBlockById(id: string | number) {
    return apiService.delete(API_ENDPOINTS.POLICY.RULE_BLOCKS.DELETE(String(id)));
  },

  async getRuleBlockById(id: string | number) {
    return apiService.get(API_ENDPOINTS.POLICY.RULE_BLOCKS.GET_BY_ID(String(id)));
  },

  async createRuleBlock(payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.POLICY.RULE_BLOCKS.CREATE, payload);
  },

  async updateRuleBlock(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.POLICY.RULE_BLOCKS.UPDATE(String(id)), payload);
  },
};

import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface GetDomainParams {
  search?: string;
  active?: boolean;
}

export interface GetAllowanceParams {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface GetDeductionParams {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface GetExpenseParams {
  search?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

// Domain, allowance, expense-category and deduction master data used by the
// Policy module. Grouped together since they're all simple lookup/CRUD
// tables with an identical shape, rather than scattered across the
// monolithic PolicyService alongside templates/versions/assignments.
export const masterDataService = {
  // Domain master
  async getDomains(params?: GetDomainParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY_DOMAIN.BASE, { params });
  },

  async deleteDomainById(id: string | number) {
    return apiService.delete(API_ENDPOINTS.POLICY_DOMAIN.DELETE(String(id)));
  },

  async getDomainById(id: string | number) {
    return apiService.get(API_ENDPOINTS.POLICY_DOMAIN.GET_BY_ID(String(id)));
  },

  async createDomain(payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.POLICY_DOMAIN.CREATE, payload);
  },

  async updateDomain(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.POLICY_DOMAIN.UPDATE(String(id)), payload);
  },

  // Allowance master
  async getAllowance(params?: GetAllowanceParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.ALLOWANCE.BASE, { params });
  },

  async deleteAllowanceById(id: string | number) {
    return apiService.delete(API_ENDPOINTS.ALLOWANCE.DELETE(String(id)));
  },

  async getAllowanceById(id: string | number) {
    return apiService.get(API_ENDPOINTS.ALLOWANCE.GET_BY_ID(String(id)));
  },

  async createAllowance(payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.ALLOWANCE.CREATE, payload);
  },

  async toggleAllowanceById(id: string | number) {
    return apiService.patch(API_ENDPOINTS.ALLOWANCE.TOOGLE_ACTIVE(String(id)));
  },

  async updateAllowance(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.ALLOWANCE.UPDATE(String(id)), payload);
  },

  // Expense-categories master
  async getExpenseCategory(params?: GetExpenseParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.EXPENSE_CATEGORIES.BASE, { params });
  },

  async deleteExpenseCategoryById(id: string | number) {
    return apiService.delete(API_ENDPOINTS.EXPENSE_CATEGORIES.DELETE(String(id)));
  },

  async getExpenseCategoryById(id: string | number) {
    return apiService.get(API_ENDPOINTS.EXPENSE_CATEGORIES.GET_BY_ID(String(id)));
  },

  async createExpenseCategory(payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.EXPENSE_CATEGORIES.CREATE, payload);
  },

  async toggleExpenseCategoryById(id: string | number) {
    return apiService.patch(API_ENDPOINTS.EXPENSE_CATEGORIES.TOOGLE_ACTIVE(String(id)));
  },

  async updateExpenseCategory(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.EXPENSE_CATEGORIES.UPDATE(String(id)), payload);
  },

  // Deduction master
  async getDeduction(params?: GetDeductionParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.DEDUCTION.BASE, { params });
  },

  async deleteDeductionById(id: string | number) {
    return apiService.delete(API_ENDPOINTS.DEDUCTION.DELETE(String(id)));
  },

  async getDeductionById(id: string | number) {
    return apiService.get(API_ENDPOINTS.DEDUCTION.GET_BY_ID(String(id)));
  },

  async createDeduction(payload: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.DEDUCTION.CREATE, payload);
  },

  async toggleDeductionById(id: string | number) {
    return apiService.patch(API_ENDPOINTS.DEDUCTION.TOOGLE_ACTIVE(String(id)));
  },

  async updateDeduction(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.DEDUCTION.UPDATE(String(id)), payload);
  },
};

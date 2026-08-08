import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface ComponentQuery {
  search?: string;
  type?: string;
  includeInactive?: boolean;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  componentType: string;
  calculationType: string;
  calculationValue: number;
  formulaExpression: string;
  minAmount: number;
  maxAmount: number;
  taxable: boolean;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface ComponentSummary {
  earningComponents: number;
  deductionComponents: number;
  benefitComponents: number;
  totalComponents: number;
}

export interface ComponentCreatePayload {
  name: string;
  code: string;
  componentType: string;
  calculationType: string;
  calculationValue?: number;
  formulaExpression?: string;
  minAmount?: number;
  maxAmount?: number;
  taxable?: boolean;
  displayOrder?: number;
}

export interface ComponentUpdatePayload {
  name: string;
  code: string;
  componentType: string;
  calculationType: string;
  calculationValue?: number;
  formulaExpression?: string;
  minAmount?: number;
  maxAmount?: number;
  taxable?: boolean;
  displayOrder?: number;
}

export interface FormulaValidationPayload {
  expression: string;
}

export interface FormulaValidationResponse {
  valid: boolean;
  message: string;
  referencedCodes: string[];
  unknownCodes: string[];
}

export const salaryComponentsService = {
  async getComponents(params?: ComponentQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPONENTS.BASE, { params });
  },

  async getComponentById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPONENTS.GET_BY_ID(id));
  },

  async createComponent(payload: ComponentCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.COMPONENTS.CREATE, payload);
  },

  async getComponentSummary() {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPONENTS.SUMMARY);
  },

  async validateFormula(payload: FormulaValidationPayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.COMPONENTS.VALIDATE, payload);
  },

  async updateComponent(id: string, payload: ComponentUpdatePayload) {
    return apiService.put(API_ENDPOINTS.PAYROLL.COMPONENTS.UPDATE(id), payload);
  },

  async deleteComponent(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.COMPONENTS.DELETE(id));
  },
};
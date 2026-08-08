import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";



export interface SalaryStructureQuery {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: string;
  applicableFor?: string;
}

export interface SalaryStructureItem {
  id: string;
  name: string;
  code: string;
  status: string;
  applicableFor: string[];
  earningCount: number;
  deductionCount: number;
  annualCtc: number;
  updatedAt: string;
}

export interface SalaryStructureDetail {
  id: string;
  name: string;
  code: string;
  description: string;
  applicableFor: string[];
  gradeLevels: string[];
  status: string;
  publishedAt: string;
  earnings: SalaryStructureComponent[];
  deductions: SalaryStructureComponent[];
  grossEarningsMonthly: number;
  totalDeductionsMonthly: number;
  netMonthly: number;
  annualCtc: number;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SalaryStructureComponent {
  id: string;
  itemType: string;
  componentId: string;
  componentCode: string;
  componentName: string;
  calculationType: string;
  value: number;
  limitValue: number;
  sequence: number;
  preview: string;
  computedMonthlyAmount: number;
}

export interface ComponentOption {
  id: string;
  code: string;
  name: string;
  componentType: string;
  calculationType: string;
  defaultValue: number;
  taxable: boolean;
}

export interface ComponentOptionsResponse {
  earnings: ComponentOption[];
  deductions: ComponentOption[];
}

export interface SalaryStructurePayload {
  name: string;
  code: string;
  description?: string;
  applicableFor?: string[];
  gradeLevels?: string[];
  earnings?: Array<{
    componentId: string;
    value: number;
    limitValue?: number;
    sequence?: number;
  }>;
  deductions?: Array<{
    componentId: string;
    value: number;
    limitValue?: number;
    sequence?: number;
  }>;
}

export interface ComponentItemsPayload {
  items: Array<{
    componentId: string;
    value: number;
    limitValue?: number;
    sequence?: number;
  }>;
}

export interface BasicInfoPayload {
  name: string;
  code: string;
  description?: string;
  applicableFor?: string[];
  gradeLevels?: string[];
}

export interface PreviewPayload {
  earnings?: Array<{
    componentId: string;
    value: number;
    limitValue?: number;
    sequence?: number;
  }>;
  deductions?: Array<{
    componentId: string;
    value: number;
    limitValue?: number;
    sequence?: number;
  }>;
}

export interface PreviewResponse {
  earnings: SalaryStructureComponent[];
  deductions: SalaryStructureComponent[];
  grossEarningsMonthly: number;
  totalDeductionsMonthly: number;
  netMonthly: number;
  annualCtc: number;
  warnings: string[];
}

// ============ SERVICE ============

export const salaryStructureService = {

  async getSalaryStructures(params?: SalaryStructureQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.STRUCTURES.BASE, { params });
  },

  async getComponentOptions() {
    return apiService.get(API_ENDPOINTS.PAYROLL.STRUCTURES.GET_OPTIONS);
  },

  async getSalaryStructureById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.STRUCTURES.GET_BY_ID(id));
  },

  async createSalaryStructure(payload: SalaryStructurePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.STRUCTURES.CREATE, payload);
  },

  async updateSalaryStructure(id: string, payload: SalaryStructurePayload) {
    return apiService.put(API_ENDPOINTS.PAYROLL.STRUCTURES.UPDATE(id), payload);
  },

  // async updateSalaryStructureEarnings(id: string, payload: ComponentItemsPayload) {
  //   return apiService.put(API_ENDPOINTS.PAYROLL.STRUCTURES.UPDATE_EARNINGS(id), payload);
  // },

  // async updateSalaryStructureDeductions(id: string, payload: ComponentItemsPayload) {
  //   return apiService.put(API_ENDPOINTS.PAYROLL.STRUCTURES.UPDATE_DEDUCTIONS(id), payload);
  // },

  // async updateSalaryStructureBasic(id: string, payload: BasicInfoPayload) {
  //   return apiService.put(API_ENDPOINTS.PAYROLL.STRUCTURES.UPDATE_BASIC(id), payload);
  // },

  async deleteSalaryStructure(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.STRUCTURES.DELETE(id));
  },

  async publishSalaryStructure(id: string) {
    return apiService.post(API_ENDPOINTS.PAYROLL.STRUCTURES.PUBLISH(id));
  },

  async unpublishSalaryStructure(id: string) {
    return apiService.post(API_ENDPOINTS.PAYROLL.STRUCTURES.UNPUBLISH(id));
  },

  async duplicateSalaryStructure(id: string) {
    return apiService.post(API_ENDPOINTS.PAYROLL.STRUCTURES.DUPLICATE(id));
  },

  async previewSalaryStructure(payload: PreviewPayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.STRUCTURES.PREVIEW, payload);
  },
};
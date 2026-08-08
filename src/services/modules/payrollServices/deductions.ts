import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface EmployeeDeductionQuery {
  employeeId?: string;
  status?: string;
}

export interface EmployeeDeduction {
  id: string;
  employeeId: string;
  type: string;
  typeLabel: string;
  name: string;
  monthlyAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  progressLabel: string;
  progressPercent: number;
  totalAmount: number;
  startedOn: string;
  status: string;
  sourceType: string;
  sourceRefId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  code: string;
  designationId: string;
  departmentId: string;
  annualCtc: number;
}

export interface DeductionSummary {
  compliant: number;
  pending: number;
  nonCompliant: number;
  total: number;
  totalAmount: number;
}

export interface DeductionDistribution {
  label: string;
  amount: number;
  color: string;
}

export interface EmployeeDeductionOverview {
  employee: Employee;
  activeDeductions: EmployeeDeduction[];
  summary: DeductionSummary;
  distribution: DeductionDistribution[];
}

export interface EmployeeDeductionCreatePayload {
  employeeId: string;
  type: string;
  name: string;
  monthlyAmount: number;
  totalInstallments: number;
  paidInstallments?: number;
  totalAmount: number;
  startedOn: string;
}

export interface EmployeeDeductionUpdatePayload {
  employeeId: string;
  type: string;
  name: string;
  monthlyAmount: number;
  totalInstallments: number;
  paidInstallments?: number;
  totalAmount: number;
  startedOn: string;
}

export const employeeDeductionsService = {
  async getEmployeeDeductions(params?: EmployeeDeductionQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.BASE, { params });
  },

  async getEmployeeDeductionOverview(employeeId: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.GET_BY_EMPLOYEE(employeeId));
  },

  async getEmployeeDeductionById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.GET_BY_ID(id));
  },

  async createEmployeeDeduction(payload: EmployeeDeductionCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.CREATE, payload);
  },

  async createDeductionFromLoan(id: string) {
    return apiService.post(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.FROM_LOAN(id));
  },

  async updateEmployeeDeduction(id: string, payload: EmployeeDeductionUpdatePayload) {
    return apiService.put(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.UPDATE(id), payload);
  },

  async deleteEmployeeDeduction(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.DELETE(id));
  },

  async updateEmployeeDeductionStatus(id: string, status: string) {
    return apiService.put(API_ENDPOINTS.PAYROLL.EMP_DEDUCTIONS.STATUS(id), null, {
      params: { status }
    });
  },
};
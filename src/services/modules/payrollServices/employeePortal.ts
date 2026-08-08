import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface EmployeePortalSummary {
  compliant: number;
  pending: number;
  nonCompliant: number;
  total: number;
  totalAmount: number;
}

export interface Feature {
  key: string;
  name: string;
  description: string;
  available: boolean;
}

export interface PortalEmployeeQuery {
  search?: string;
  departmentId?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PortalEmployee {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  lastLogin: string;
  status: string;
}

export interface TaxSummary {
  financialYear: string;
  grossAnnualIncome: number;
  exemptionsDeductions: number;
  netTaxableIncome: number;
  taxComputed: number;
  tdsDeducted: number;
  balanceTaxPayable: number;
}

export interface PayslipHistory {
  runItemId: string;
  periodLabel: string;
  gross: number;
  net: number;
  generatedOn: string;
}

export interface EmployeePayslipsResponse {
  currentMonthGross: number;
  currentMonthNet: number;
  ytdEarnings: number;
  payslips: PayslipHistory[];
}

export const employeePortalService = {
  async getPortalSummary() {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.SUMMARY);
  },

  async getPortalFeatures() {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.FEATURES);
  },

  async getPortalEmployees(params?: PortalEmployeeQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.EMPLOYEES, { params });
  },

  async getEmployeeTaxSummary(employeeId: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.TAX_SUMMARY(employeeId));
  },

  async getEmployeePayslips(employeeId: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.PAYSLIPS(employeeId));
  },
};
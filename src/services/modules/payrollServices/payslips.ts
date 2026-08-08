import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface PayslipQuery {
  year: number;
  month: number;
  departmentId?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PayslipListItem {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentId: string;
  department: string;
  designationId: string;
  payDays: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  status: string;
}

export interface PayslipDetail {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentId: string;
  department: string;
  periodLabel: string;
  payDays: number;
  paymentDate: string;
  basic: number;
  hra: number;
  conveyance: number;
  special: number;
  gross: number;
  pf: number;
  professionalTax: number;
  tds: number;
  loanAdvance: number;
  otherDeductions: number;
  totalDeductions: number;
  lopDays: number;
  lopAmount: number;
  netPay: number;
  status: string;
}

export interface PayslipSummary {
  periodLabel: string;
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
}

export interface PayslipDownloadResponse {
  fileUrl: string;
}

export const payslipsService = {
  async getPayslips(params: PayslipQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYSLIPS.BASE, { params });
  },

  async viewPayslip(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYSLIPS.VIEW_PAYSLIP(id));
  },

  async downloadPayslip(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYSLIPS.DOWNLOAD(id));
  },

  async getPayslipSummary(params: { year: number; month: number }) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYSLIPS.SUMMARY, { params });
  },
};
import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";


export interface ReportQuery {
  type?: string;
  period?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ReportGeneratePayload {
  type: string;
  period: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  format?: string;
  [key: string]: any;
}

export interface QuickReportQuery {
  period: string;
  department?: string;
  format?: string;
  userId?: string;
  tenantId?: string;
  email?: string;
  password?: string;
  active?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface PayrollReportQuery {
  reportType?: string;
  year?: number;
  month?: number;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PayrollReport {
  id: string;
  reportType: string;
  reportTypeLabel: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  status: string;
  sizeBytes: number;
  size: string;
  generatedOn: string;
  generatedByName: string;
  fileUrl: string;
  createdAt: string;
}

export interface PayrollReportSummary {
  totalReports: number;
  thisMonth: number;
  lastMonth: number;
  pending: number;
}

export interface PayrollReportGeneratePayload {
  reportType: string;
  periodYear: number;
  periodMonth: number;
}

export interface PayrollReportDownloadResponse {
  fileUrl: string;
}

export const reportsService = {
  // async getReports(params?: ReportQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.REPORTS.BASE, { params });
  // },

  // async generateReport(payload: ReportGeneratePayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.REPORTS.GENERATE, payload);
  // },

  // async downloadReport(id: string) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.REPORTS.DOWNLOAD(id));
  // },

  // async deleteReport(id: string) {
  //   return apiService.delete(API_ENDPOINTS.PAYROLL.REPORTS.DELETE(id));
  // },

  // async getQuickReport(type: string, params: QuickReportQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.REPORTS.QUICK(type), { params });
  // },

  async getPayrollReports(params?: PayrollReportQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLREPORTS.BASE, { params });
  },

  async deletePayrollReport(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.PAYROLLREPORTS.DELETE(id));
  },

  async getPayrollReportById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLREPORTS.GET_BY_ID(id));
  },

  async downloadPayrollReport(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLREPORTS.DOWNLOAD(id));
  },

  async getPayrollReportSummary() {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLREPORTS.SUMMARY);
  },

  async generatePayrollReportById(id: string) {
    return apiService.post(API_ENDPOINTS.PAYROLL.PAYROLLREPORTS.GENERATE_BY_ID(id));
  },

  async generatePayrollReport(payload: PayrollReportGeneratePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.PAYROLLREPORTS.GENERATE, payload);
  },
};

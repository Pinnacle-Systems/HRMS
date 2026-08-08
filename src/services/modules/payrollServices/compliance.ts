import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";


export interface ComplianceQuery {
  type?: string;
  year?: number;
  month?: number;
  status?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface ComplianceRecord {
  id: string;
  type: string;
  typeFullName: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  dueDate: string;
  amount: number;
  employeeCount: number;
  status: string;
  filedDate: string;
  referenceNumber: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceOverviewResponse {
  summary: {
    compliant: number;
    pending: number;
    nonCompliant: number;
    total: number;
    totalAmount: number;
  };
  filings: ComplianceRecord[];
  complianceRates: Array<{
    type: string;
    typeFullName: string;
    ratePercent: number;
    compliantCount: number;
    totalCount: number;
  }>;
}

export interface ComplianceDownloadResponse {
  fileUrl: string;
}

export interface ComplianceReportResponse {
  fileUrl: string;
}

export interface ComplianceCreatePayload {
  type: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string;
  amount: number;
  employeeCount: number;
  status: string;
  filedDate: string;
  referenceNumber: string;
  remarks: string;
}

export interface ComplianceUpdatePayload {
  type: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string;
  amount: number;
  employeeCount: number;
  status: string;
  filedDate: string;
  referenceNumber: string;
  remarks: string;
}

export const complianceService = {
  async getCompliance(params?: ComplianceQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPLIANCE.BASE, { params });
  },

  async getComplianceById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPLIANCE.GET_BY_ID(id));
  },

  async deleteCompliance(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.COMPLIANCE.DELETE(id));
  },

  async downloadCompliance(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPLIANCE.DOWNLOAD(id));
  },

  async getComplianceOverview(params?: { year?: number; month?: number }) {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPLIANCE.OVERVIEW, { params });
  },

  async updateComplianceStatus(id: string, status: string) {
    return apiService.put(API_ENDPOINTS.PAYROLL.COMPLIANCE.UPDATE_STATUS(id), null, {
      params: { status }
    });
  },

  async createCompliance(payload: ComplianceCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.COMPLIANCE.CREATE, payload);
  },

  async generateComplianceReport(params?: { type?: string; year?: number; month?: number }) {
    return apiService.get(API_ENDPOINTS.PAYROLL.COMPLIANCE.GENERATE_REPORT, { params });
  },

  async updateCompliance(id: string, payload: ComplianceUpdatePayload) {
    return apiService.put(API_ENDPOINTS.PAYROLL.COMPLIANCE.UPDATE(id), payload);
  },
};
import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface LoanAdvanceQuery {
  employeeId?: string;
  requestType?: string;
  status?: string;
  branchId?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface LoanAdvanceRequest {
  id: string;
  requestCode: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  requestType: string;
  amount: number;
  purpose: string;
  tenureMonths: number;
  emiAmount: number;
  status: string;
  rejectionReason: string;
  decidedBy: string;
  decidedAt: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface LoanAdvanceCreatePayload {
  requestType: string;
  amount: number;
  purpose: string;
  tenureMonths: number;
  emiAmount?: number;
  employeeId?: string;
  branchId?: string;
}

export interface LoanAdvanceUpdatePayload {
  requestType: string;
  amount: number;
  purpose: string;
  tenureMonths: number;
  emiAmount?: number;
}

export interface LoanAdvanceActionPayload {
  reason: string;
}

export interface LoanAdvanceSummary {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  approvedAmount: number;
}

export interface LoanAdvanceMyQuery {
  status?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export const loanAdvanceService = {
  async getLoanRequests(params?: LoanAdvanceQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.BASE, { params });
  },

  async getLoanRequestById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.GET_BY_ID(id));
  },

  async downloadLoanRequest(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.DOWNLOAD(id));
  },

  async createLoanRequest(payload: LoanAdvanceCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.CREATE, payload);
  },

  async updateLoanRequest(id: string, payload: LoanAdvanceUpdatePayload) {
    return apiService.put(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.UPDATE(id), payload);
  },

  async approveLoanRequest(id: string, payload: LoanAdvanceActionPayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.APPROVE(id), payload);
  },

  async rejectLoanRequest(id: string, payload: LoanAdvanceActionPayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.REJECT(id), payload);
  },

  async getLoanAdvanceSummary(params: any) {
    return apiService.get(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.SUMMARY, {params});
  },

  async getMyLoanRequests(params?: LoanAdvanceMyQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.LOAN_ADVANCE.MY, { params });
  },
};
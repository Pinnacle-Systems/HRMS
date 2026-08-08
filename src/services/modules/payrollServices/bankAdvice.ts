import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";


export interface BankAdvice {
  id: string;
  adviceCode: string;
  payrollPeriodId: string;
  periodLabel: string;
  bankId: string;
  bankName: string;
  accountNumber: string;
  fileFormat: string;
  totalAmount: number;
  employeeCount: number;
  status: string;
  generatedOn: string;
  fileUrl: string;
  lines: BankAdviceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface BankAdviceLine {
  employeeId: string;
  employeeName: string;
  accountNumber: string;
  ifscCode: string;
  amount: number;
}

export interface BankAdviceGeneratePayload {
  payrollPeriodId?: string;
  periodYear?: number;
  periodMonth?: number;
  bankId: string;
  fileFormat: string;
}

export interface BankAdviceSummary {
  totalAmount: number;
  totalEmployees: number;
  banks: number;
}

export interface BankAdviceDownloadResponse {
  fileUrl: string;
}

export const bankAdviceService = {
  async getBankAdvices() {
    return apiService.get(API_ENDPOINTS.PAYROLL.BANK_ADVICE.BASE);
  },

  async getBankAdviceById(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.BANK_ADVICE.GET_BY_ID(id));
  },

  async generateBankAdvice(payload: BankAdviceGeneratePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.BANK_ADVICE.GENERATE, payload);
  },

  async getBankAdviceSummary() {
    return apiService.get(API_ENDPOINTS.PAYROLL.BANK_ADVICE.SUMMARY);
  },

  async downloadBankAdvice(id: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.BANK_ADVICE.DOWNLOAD(id));
  },

  async deleteBankAdvice(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.BANK_ADVICE.DELETE(id));
  },
};
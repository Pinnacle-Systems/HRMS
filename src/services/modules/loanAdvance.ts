import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export type LoanAdvanceRequestType = "LOAN" | "ADVANCE";

export type LoanAdvanceTypeOption = {
  id: string;
  name: string;
  code?: string;
  maxAmount?: number;
  maxRepaymentMonths?: number;
  interestRate?: number;
};

export type LoanAdvanceRequestPayload = {
  employeeId?: string;
  requestType: LoanAdvanceRequestType;
  loanTypeId: string;
  requestedAmount: number;
  reason: string;
  requestedOn?: string;
  repaymentMonths?: number;
  notes?: string;
};

export type LoanAdvanceRequest = LoanAdvanceRequestPayload & {
  id?: string;
  status?: string;
  createdAt?: string;
};

export const loanAdvanceService = {
  async getLoanTypes() {
    const response = await apiService.get<{
      success: boolean;
      message?: string;
      data?: LoanAdvanceTypeOption[];
    }>(API_ENDPOINTS.LOAN_ADVANCE.GET_TYPES);

    return response;
  },

  async createLoanAdvanceRequest(payload: LoanAdvanceRequestPayload) {
    return apiService.post(API_ENDPOINTS.LOAN_ADVANCE.CREATE, payload);
  },
};

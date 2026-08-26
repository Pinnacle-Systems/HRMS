import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface BankDetailsPayload {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branch: string;
}

export const employeePortalService = {
  // async getPortalData() {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.BASE);
  // },

  async getSelfView() {
    return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.SELF);
  },

  // async getEmployeePortalData(employeeId: string) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.GET_BY_EMPLOYEE(employeeId));
  // },

  async updateBankDetails(payload: BankDetailsPayload) {
    return apiService.put(API_ENDPOINTS.PAYROLL.PORTAL.BANK_DETAILS, payload);
  },

  async getTaxSummary() {
    return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.TAX_SUMMARY);
  },
};
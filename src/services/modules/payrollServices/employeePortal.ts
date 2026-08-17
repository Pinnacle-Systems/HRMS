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

export interface BankDetailsPayload {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branch: string;
}

export interface SelfViewResponse {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  lastLogin: string;
  email: string;
  mobileNumber: string;
  joiningDate: string;
  [key: string]: any;
}

export interface EmployeePortalData {
  [key: string]: any;
}

export interface EmployeeFullPortalData {
  taxSummary: TaxSummary;
  payslips: EmployeePayslipsResponse;
  portalData: EmployeePortalData;
}

export interface SelfFullPortalData {
  selfView: SelfViewResponse;
  taxSummary: TaxSummary;
  payslips: EmployeePayslipsResponse;
}

// ============ Service ============

export const employeePortalService = {

  async getPortalSummary(): Promise<{ data: EmployeePortalSummary }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.SUMMARY);
  },

  async getPortalFeatures(): Promise<{ data: Feature[] }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.FEATURES);
  },

  async getPortalEmployees(params?: PortalEmployeeQuery): Promise<{
    data: {
      content: PortalEmployee[];
      totalElements: number;
      totalPages: number;
      pageable: any;
      first: boolean;
      last: boolean;
      size: number;
      number: number;
      sort: any;
      numberOfElements: number;
      empty: boolean;
    }
  }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.EMPLOYEES, { params });
  },

  async getEmployeeTaxSummary(employeeId: string): Promise<{ data: TaxSummary }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.TAX_SUMMARY(employeeId));
  },

  async getEmployeePayslips(employeeId: string): Promise<{ data: EmployeePayslipsResponse }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.EMP_PORTAL.PAYSLIPS(employeeId));
  },

  // async downloadPayslip(employeeId: string, runItemId: string): Promise<Blob> {
  //   return apiService.get(
  //     `${API_ENDPOINTS.PAYROLL.EMP_PORTAL.BASE}/employees/${employeeId}/payslips/${runItemId}/download`,
  //     { responseType: 'blob' }
  //   );
  // },

  async getEmployeePortalData(): Promise<{ data: EmployeePortalData }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.BASE);
  },

  async getSelfTaxSummary(params?: { userId?: string; tenantId?: string; email?: string }): Promise<{ data: TaxSummary }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.TAX_SUMMARY, { params });
  },

  async getSelfView(): Promise<{ data: SelfViewResponse }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.SELF);
  },

  async getEmployeePortalDataById(employeeId: string): Promise<{ data: EmployeePortalData }> {
    return apiService.get(API_ENDPOINTS.PAYROLL.PORTAL.EMPLOYEE(employeeId));
  },

  async updateBankDetails(payload: BankDetailsPayload): Promise<{ data: any }> {
    return apiService.put(API_ENDPOINTS.PAYROLL.PORTAL.BANK_DETAILS, payload);
  },

  async getEmployeeFullPortalData(employeeId: string): Promise<EmployeeFullPortalData> {
    const [taxSummary, payslips, portalData] = await Promise.all([
      this.getEmployeeTaxSummary(employeeId),
      this.getEmployeePayslips(employeeId),
      this.getEmployeePortalDataById(employeeId),
    ]);

    return {
      taxSummary: taxSummary.data,
      payslips: payslips.data,
      portalData: portalData.data,
    };
  },

  async getSelfFullPortalData(): Promise<SelfFullPortalData> {
    const [selfView, taxSummary, payslips] = await Promise.all([
      this.getSelfView(),
      this.getSelfTaxSummary(),
      this.getEmployeePayslips('self'),
    ]);

    return {
      selfView: selfView.data,
      taxSummary: taxSummary.data,
      payslips: payslips.data,
    };
  },

  // getPayslipDownloadUrl(employeeId: string, runItemId: string): string {
  //   return `${API_ENDPOINTS.PAYROLL.EMP_PORTAL.BASE}/employees/${employeeId}/payslips/${runItemId}/download`;
  // },

  async searchEmployees(searchTerm: string, page: number = 0, size: number = 20): Promise<{ data: { content: PortalEmployee[]; totalElements: number; totalPages: number } }> {
    return this.getPortalEmployees({
      search: searchTerm,
      page,
      size,
      sort: ['employeeName,asc'],
    });
  },

  async getEmployeesByDepartment(departmentId: string, page: number = 0, size: number = 20): Promise<{ data: { content: PortalEmployee[]; totalElements: number; totalPages: number } }> {
    return this.getPortalEmployees({
      departmentId,
      page,
      size,
      sort: ['employeeName,asc'],
    });
  },


  async getActiveEmployeeCount(): Promise<number> {
    const response = await this.getPortalSummary();
    return response.data?.total || 0;
  },

  async getComplianceStatus(): Promise<{
    compliant: number;
    pending: number;
    nonCompliant: number;
    total: number;
  }> {
    const response = await this.getPortalSummary();
    return {
      compliant: response.data?.compliant || 0,
      pending: response.data?.pending || 0,
      nonCompliant: response.data?.nonCompliant || 0,
      total: response.data?.total || 0,
    };
  },

  async getCurrentMonthPayslip(employeeId: string): Promise<PayslipHistory | null> {
    try {
      const response = await this.getEmployeePayslips(employeeId);
      const payslips = response.data?.payslips || [];
      return payslips.length > 0 ? payslips[0] : null;
    } catch (error) {
      console.error('Failed to get current month payslip:', error);
      return null;
    }
  },

  async getYtdEarnings(employeeId: string): Promise<number> {
    try {
      const response = await this.getEmployeePayslips(employeeId);
      return response.data?.ytdEarnings || 0;
    } catch (error) {
      console.error('Failed to get YTD earnings:', error);
      return 0;
    }
  },

  async getBulkEmployeePayslips(employeeIds: string[]): Promise<Map<string, EmployeePayslipsResponse>> {
    const results = new Map<string, EmployeePayslipsResponse>();

    await Promise.all(
      employeeIds.map(async (id) => {
        try {
          const response = await this.getEmployeePayslips(id);
          results.set(id, response.data);
        } catch (error) {
          console.error(`Failed to get payslips for employee ${id}:`, error);
        }
      })
    );

    return results;
  },

  async getBulkEmployeeTaxSummaries(employeeIds: string[]): Promise<Map<string, TaxSummary>> {
    const results = new Map<string, TaxSummary>();

    await Promise.all(
      employeeIds.map(async (id) => {
        try {
          const response = await this.getEmployeeTaxSummary(id);
          results.set(id, response.data);
        } catch (error) {
          console.error(`Failed to get tax summary for employee ${id}:`, error);
        }
      })
    );

    return results;
  },

  // async exportEmployeesWithPayroll(params?: PortalEmployeeQuery): Promise<Blob> {
  //   return apiService.get(
  //     `${API_ENDPOINTS.PAYROLL.EMP_PORTAL.BASE}/employees/export`,
  //     { params, responseType: 'blob' }
  //   );
  // },
};

export function isTaxSummary(data: any): data is TaxSummary {
  return data &&
    typeof data.financialYear === 'string' &&
    typeof data.grossAnnualIncome === 'number' &&
    typeof data.netTaxableIncome === 'number';
}

export function isPayslipHistory(data: any): data is PayslipHistory {
  return data &&
    typeof data.runItemId === 'string' &&
    typeof data.periodLabel === 'string' &&
    typeof data.gross === 'number' &&
    typeof data.net === 'number';
}

export function isEmployeePayslipsResponse(data: any): data is EmployeePayslipsResponse {
  return data &&
    typeof data.currentMonthGross === 'number' &&
    typeof data.currentMonthNet === 'number' &&
    typeof data.ytdEarnings === 'number' &&
    Array.isArray(data.payslips);
}

export function isPortalEmployee(data: any): data is PortalEmployee {
  return data &&
    typeof data.employeeId === 'string' &&
    typeof data.employeeName === 'string';
}
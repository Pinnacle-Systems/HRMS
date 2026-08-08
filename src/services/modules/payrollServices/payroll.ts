import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

// ===== RUNS =====
export interface PayrollRunQuery {
  page?: number;
  limit?: number;
  status?: string;
  year?: number;
}

export interface PayrollRun {
  id: string;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  completedAt?: string;
  [key: string]: any;
}

export interface PayrollRunCreatePayload {
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  employeeIds?: string[];
  departmentIds?: string[];
  includeAllEmployees?: boolean;
  [key: string]: any;
}

// ===== PAYSLIPS =====
export interface PayslipQuery {
  period: string;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Payslip {
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
  [key: string]: any;
}

export interface PayslipDownloadResponse {
  fileUrl: string;
}

// ===== GENERATE =====
export interface GeneratePreviewQuery {
  periodId: string;
  employeeIds: string[];
}

// ===== SALARY VIEW =====
export interface SalaryViewHeader {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  grade: string;
  employmentType: string;
  annualCtc: number;
  monthlyGross: number;
  monthlyNet: number;
}

export interface SalaryStructureItem {
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  leaveYear: number;
  closingBalance: number;
  encashable: boolean;
  action: string;
  days: number;
  amount: number;
}

export interface SalaryViewStructure {
  earnings: SalaryStructureItem[];
  grossSalary: number;
  deductions: SalaryStructureItem[];
  totalDeductions: number;
  netTakeHome: number;
}

export interface MonthlyTrend {
  label: string;
  earnings: number;
  deductions: number;
  net: number;
}

export interface MonthlyPayslip {
  runItemId: string;
  periodLabel: string;
  gross: number;
  net: number;
  generatedOn: string;
}

export interface ActiveLoan {
  type: string;
  name: string;
  total: number;
  emiPerMonth: number;
  remainingMonths: number;
  progressPercent: number;
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

export interface SalaryViewResponse {
  header: SalaryViewHeader;
  currentStructure: SalaryViewStructure;
  payrollHistory: {
    ytdEarnings: number;
    ytdDeductions: number;
    ytdNet: number;
    monthlyTrend: MonthlyTrend[];
    monthlyPayslips: MonthlyPayslip[];
  };
  loans: {
    activeLoans: ActiveLoan[];
  };
  taxSummary: TaxSummary;
}

export interface Settings {
  [key: string]: any;
}

export const payrollService = {
  async getDashboard() {
    return apiService.get(API_ENDPOINTS.PAYROLL.DASHBOARD);
  },

  // async getPayrollRuns(params?: PayrollRunQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.RUNS.BASE, { params });
  // },

  // async getPayrollRunById(id: string) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.RUNS.GET_BY_ID(id));
  // },

  // async createPayrollRun(payload: PayrollRunCreatePayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.RUNS.CREATE, payload);
  // },

  // async processPayrollRun(id: string) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.RUNS.PROCESS(id));
  // },

  // async getPayslips(params: PayslipQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLLPAYSLIPS.BASE, {
  //     params,
  //   });
  // },

  // async getPayslipByEmployeeAndPeriod(
  //   employeeId: string,
  //   year: number,
  //   month: number,
  // ) {
  //   const period = `${year}-${String(month).padStart(2, "0")}`;
  //   return apiService.get(
  //     API_ENDPOINTS.PAYROLL.PAYROLLPAYSLIPS.GET_BY_EMPLOYEE_AND_PERIOD(
  //       employeeId,
  //       period,
  //     ),
  //   );
  // },

  // async downloadPayslip(employeeId: string, year: number, month: number) {
  //   return apiService.get(
  //     API_ENDPOINTS.PAYROLL.PAYROLLPAYSLIPS.DOWNLOAD(employeeId),
  //     {
  //       params: { year, month },
  //     },
  //   );
  // },

  // async previewPayrollGeneration(params: GeneratePreviewQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.GENERATE.PREVIEW, { params });
  // },

  // async getEmployeeSalaryView(employeeId: string) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.SALARY_VIEW.BASE(employeeId));
  // },

  // async getSettings() {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.SETTINGS.BASE);
  // },

  // async updateSettings(payload: Settings) {
  //   return apiService.put(API_ENDPOINTS.PAYROLL.SETTINGS.UPDATE, payload);
  // },
};

import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

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

export interface SalaryViewItem {
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
  earnings: SalaryViewItem[];
  grossSalary: number;
  deductions: SalaryViewItem[];
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

export interface DownloadPayslipResponse {
  fileUrl: string;
}

export const salaryViewService = {
  async getEmployeeSalaryView(employeeId: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.SALARY_VIEW.EMP__SALARY_VIEW(employeeId));
  },

  async downloadEmployeePayslip(employeeId: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.SALARY_VIEW.EMP__DOWNLOAD_PAYSLIP(employeeId));
  },
};
import type { Employee } from "../../types";

export interface ProcessingStatus {
  label: string;
  count: number;
}

export interface UpcomingPayroll {
  period: string;
  status: string;
}

export interface RecentActivity {
  type: string;
  text: string;
  time: string;
  user: string;
}

export interface DepartmentData {
  department: string;
  total: number;
}

export interface DeductionData {
  name: string;
  value: number;
}

export interface MonthlyTrend {
  month: string;
  amount: number;
}

export interface DashboardData {
  totalEmployees: number;
  netPayroll: number;
  pendingApprovals: number;
  totalCost: number;
  processingStatus: ProcessingStatus[];
  upcomingPayrolls: UpcomingPayroll[];
  recentActivities: RecentActivity[];
  departmentWiseData: DepartmentData[];
  deductionComposition: DeductionData[];
  monthlyTrend: MonthlyTrend[];
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export interface PreviewItem {
    id: string;
    employeeId: string;
    employeeCode: string;
    employeeName: string;
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
    errorMessage: string;
}

export interface PreviewData {
    items: PreviewItem[];
    employeeCount: number;
    totalGross: number;
    totalDeductions: number;
    totalNetPay: number;
}

export interface EmployeeEarnings extends Employee {
    basic: number;
    hra: number;
    conv: number;
    special: number;
    gross: number;
    loanAdvance?: number;
}

export const STATUS_CHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

// export const calcLabel: Record<string, string> = {
//   FIXED_AMOUNT: "Fixed Amount",
//   PERCENT_OF_CTC: "% of CTC",
//   PERCENT_OF_BASIC: "% of Basic",
//   SLAB_BASED : "Slab Based",
//   FORMULA: "Formula",
// };

export const calcLabel: Record<string, string> = {
  FIXED_AMOUNT: "Fixed Amount",
  PERCENT_OF_BASIC: "% of Basic",
  PERCENT_OF_CTC: "% of CTC",
  FORMULA: "Formula",
  SLAB_BASED: "Slab Based",
  FIXED: "Fixed Amount",
  PERCENTAGE: "Percentage",
};

export const steps = [
  { id: 1, name: "Basic Info", desc: "Name, code & applicability" },
  { id: 2, name: "Earnings", desc: "Configure earning components" },
  { id: 3, name: "Deductions", desc: "Configure deduction rules" },
  { id: 4, name: "Review & Save", desc: "Review and publish" },
];

// export const employmentTypes = ["PERMANENT", "CONTRACT", "INTERN", "CONSULTANT"];
// export const grades = ["L1", "L2", "L3", "L4", "L5", "L6"];

export const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "#6b7280", bgColor: "#f3f4f6" },
  published: { label: "Published", color: "#0ea249", bgColor: "#cdfdcd" },
};

export const typeConfig = {
  EARNING: { label: "Earning", color: "#10b981", bgColor: "#d1fae5" },
  DEDUCTION: { label: "Deduction", color: "#ef4444", bgColor: "#fee2e2" },
  BENEFIT: { label: "Benefit", color: "#3b82f6", bgColor: "#dbeafe" },
};

export interface PayslipHistory {
  runItemId: string;
  periodLabel: string;
  gross: number;
  net: number;
  generatedOn: string;
}

export interface EmployeePayslipsData {
  currentMonthGross: number;
  currentMonthNet: number;
  ytdEarnings: number;
  payslips: PayslipHistory[];
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

export const getCurrentMonthYear = () => {
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};
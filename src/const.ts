import { PERMISSIONS } from "./auth/Permissions";

export const selectSx = {
  "& .MuiSelect-select": {
    padding: "9px !important",
  },
};

export const PAYROLL_PERMISSIONS = {
  DASHBOARD: [PERMISSIONS.PAYROLL_READ],
  RUNS: [PERMISSIONS.PAYROLL_READ],
  GENERATE: [PERMISSIONS.PAYROLL_WRITE],
  PAYSLIPS: [PERMISSIONS.PAYROLL_READ],
  EMPLOYEE_VIEW: [PERMISSIONS.PAYROLL_READ],
  COMPONENTS: [PERMISSIONS.PAYROLL_WRITE],
  STRUCTURES: [PERMISSIONS.PAYROLL_WRITE],
  ASSIGN: [PERMISSIONS.PAYROLL_WRITE],
  DEDUCTIONS: [PERMISSIONS.PAYROLL_WRITE],
  PERIODS: [PERMISSIONS.PAYROLL_WRITE],
  LOAN_ADVANCE: [PERMISSIONS.PAYROLL_READ],
  STATUTORY: [PERMISSIONS.PAYROLL_READ],
  BANK_ADVICE: [PERMISSIONS.PAYROLL_READ],
  REPORTS: [PERMISSIONS.REPORT_READ],
  AUDIT: [PERMISSIONS.REPORT_READ],
  PORTAL: [PERMISSIONS.PAYROLL_READ],
};

export const hasPermission = (
  userPermissions: string[],
  requiredPermissions: string[],
): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.some((p) => userPermissions.includes(p));
};

export const dialogSx = {
  "& .MuiDialog-paper": {
    width: "1200px",
    maxWidth: "1200px",
  },
};

export const dialogsx = {
  "& .MuiDialog-paper": {
    width: "600px",
    maxWidth: "600px",
  },
};

import { PolicyDomain, VersionStatus, type Employee } from "../../types/policy";
import type { AssignmentRule } from "./types";

export const helperSx = {
  "& .MuiFormHelperText-root": { color: "var(--text-primary)" },
};

export const slidersx = {
  "& .MuiSlider-track": {
    background: "linear-gradient(90deg, #4caf50 0%, #ff9800 50%, #f44336 100%)",
    border: "none",
    height: 8,
  },
  "& .MuiSlider-rail": {
    backgroundColor: "#e0e0e0",
    height: 8,
    borderRadius: "4px",
  },
  "& .MuiSlider-thumb": {
    backgroundColor: "#fff",
    border: "2px solid #ff9800",
    width: 16,
    height: 16,
    "&:hover, &.Mui-focusVisible": {
      boxShadow: "0 0 0 8px rgba(255, 152, 0, 0.16)",
    },
    "&.Mui-active": {
      boxShadow: "0 0 0 12px rgba(255, 152, 0, 0.2)",
    },
  },
  "& .MuiSlider-mark": {
    backgroundColor: "#fff",
    height: 12,
    width: 3,
    borderRadius: "2px",
    border: "1px solid currentColor",
    '&[data-index="0"]': { borderColor: "#4caf50", backgroundColor: "#4caf50" },
    '&[data-index="1"]': { borderColor: "#ff9800", backgroundColor: "#ff9800" },
    '&[data-index="2"]': { borderColor: "#f44336", backgroundColor: "#f44336" },
  },
  "& .MuiSlider-markLabel": {
    fontSize: "12px",
    fontWeight: 500,
    marginTop: "8px",
    '&[data-index="0"]': { color: "#4caf50" },
    '&[data-index="1"]': { color: "#ff9800" },
    '&[data-index="2"]': { color: "#f44336" },
  },
  "& .MuiSlider-valueLabel": {
    background: "linear-gradient(135deg, #ff9800, #f44336)",
    color: "#fff",
    fontWeight: 600,
    borderRadius: "8px",
    padding: "4px 8px",
    "&:before": {
      display: "none",
    },
  },
  "& .MuiSlider-markActive": {
    opacity: 1,
    backgroundColor: "#fff",
  },
};

// Domain-aware auto-approve label / unit
export const AUTO_APPROVE_META: Record<
  string,
  { label: string; unit: string; helper: string }
> = {
  [PolicyDomain.LEAVE]: {
    label: "Auto-approve below (days)",
    unit: "days",
    helper: "Leave requests shorter than this are auto-approved",
  },
  [PolicyDomain.EXPENSE]: {
    label: "Auto-approve below (₹)",
    unit: "₹",
    helper: "Expense claims under this amount are auto-approved",
  },
  [PolicyDomain.OVERTIME]: {
    label: "Auto-approve below (hours)",
    unit: "hrs",
    helper: "Overtime requests under this duration are auto-approved",
  },
  [PolicyDomain.COMP_OFF]: {
    label: "Auto-approve below (days)",
    unit: "days",
    helper: "Comp-off requests shorter than this are auto-approved",
  },
  [PolicyDomain.WORK_FROM_HOME]: {
    label: "Auto-approve below (days)",
    unit: "days",
    helper: "WFH requests shorter than this are auto-approved",
  },
};

export const APPROVER_LABELS: Record<string, string> = {
  REPORTING_MANAGER: "Reporting Manager",
  HR: "HR Department",
  DEPARTMENT_HEAD: "Department Head",
  ADMIN: "System Admin",
  SPECIFIC_USER: "Specific User",
};

export const DEFAULT_META = {
  label: "Auto-approve threshold",
  unit: "units",
  helper: "Requests below this threshold are auto-approved",
};

export const typeLabels: Record<string, string> = {
  BRANCH: "Branch",
  DEPARTMENT: "Department",
  DESIGNATION: "Designation",
  EMPLOYMENT_TYPE: "Employment Type",
  EMPLOYEE_CATEGORY: "Category",
  EMPLOYEE_TEMPLATE: "Template",
  // EMPLOYEE_GROUP: "Group",
  SPECIFIC_EMPLOYEES: "Specific Employee",
};

export const statusConfig: Record<
  VersionStatus,
  { color: any; label: string }
> = {
  [VersionStatus.DRAFT]: { color: "info", label: "Draft" },
  [VersionStatus.PENDING_APPROVAL]: {
    color: "warning",
    label: "Pending Approval",
  },
  [VersionStatus.ACTIVE]: { color: "success", label: "Active" },
  [VersionStatus.EXPIRED]: { color: "error", label: "Expired" },
  [VersionStatus.ARCHIVED]: { color: "secondary", label: "Archived" },
};

export const RULE_BLOCK_CONFIG_PATHS: Record<string, string> = {
  ACCRUAL_RULES: "accrualRules",
  CARRY_FORWARD: "carryForward",
  SANDWICH_RULE: "sandwichRule",
  OVERTIME_RULES: "overtimeRules",
  SHIFT_RULES: "shiftConfig",
  TAX_DEDUCTIONS: "tds",
  APPROVAL_FLOW: "approvalFlow",
  BONUS_RULES: "bonusRules",
  LOAN_ADVANCE_RULES: "loanAdvanceRules",
  PAYROLL_RULES: "payrollComponents",
  WFH_RULES: "",
  COMP_OFF_RULES: "",
  PROBATION_RULES: "",
  NOTICE_PERIOD_RULES: "",
  HOLIDAY_RULES: "",
  ONBOARDING_RULES: "",
  OFFBOARDING_RULES: "",
};

export const OBJECT_TYPED_FIELDS = new Set([
  "carryForward",
  "accrualRules",
  "sandwichRule",
  "overtimeRules",
  "shiftConfig",
  "approvalFlow",
  "bonusRules",
  "loanAdvanceRules",
  "payrollComponents",
  "pf",
  "esi",
  "professionalTax",
  "gratuity",
  "lwf",
  "tds",
]);

export interface AssignmentRuleWithMeta extends AssignmentRule {
  _apiIds?: string[];
  _saved?: boolean;
  _saving?: boolean;
  _selectedEmployees?: Employee[];
}

export const chipSx = {
  borderRadius: "16px",
  backgroundColor: "var(--head)",
  fontSize: "0.8125rem",
  width:"max-content",
  fontWeight: 400,
  color: "#1f2937",
  height: "24px",
  paddingTop:"3px",
  "& .MuiOutlinedInput-notchedOutline": { border: "none"},
  "& .MuiSelect-select": {
    py: 0,
    px: "8px",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-icon": { right: 2, fontSize: "1rem" },
};

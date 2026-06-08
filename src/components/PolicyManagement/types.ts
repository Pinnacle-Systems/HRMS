import {
  PolicyDomain,
  PolicyScopeLevel,
  type ApprovalFlowConfig,
  type Employee,
  type PolicyAssignment,
  type PolicyConfig,
  type PolicyTemplate,
  type PolicyVersion,
  type RuleBlockType,
} from "../../types/policy";

export interface Step3SetEligibilityProps {
  companyId: string;
  config: any;
  onChange: (config: any) => void;
}

export const steps = [
  "Select Template",
  "Configure Rules",
  "Set Eligibility",
  "Approval Flow",
  "Preview & Assign",
];

export interface PolicyWizardProps {
  companyId: string;
  existingPolicyId?: string;
  onComplete: (policyId: string) => void;
  onCancel: () => void;
  domain?: string;
}

export interface Step2ConfigureRulesProps {
  template: PolicyTemplate;
  config: PolicyConfig | null;
  onChange: (config: PolicyConfig) => void;
}

export interface AssignmentRule {
  id: string;
  type:
    | "BRANCH"
    | "DEPARTMENT"
    | "DESIGNATION"
    | "EMPLOYMENT_TYPE"
    | "EMPLOYEE_CATEGORY"
    | "EMPLOYEE_GROUP"
    | "SPECIFIC_EMPLOYEES";
  values: string[];
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  conditions?: Record<string, any>;
}

export const SCOPE_PRIORITY_HINTS: Record<string, number> = {
  BRANCH: PolicyScopeLevel.BRANCH,
  DEPARTMENT: PolicyScopeLevel.DEPARTMENT,
  DESIGNATION: PolicyScopeLevel.DESIGNATION,
  EMPLOYMENT_TYPE: PolicyScopeLevel.DESIGNATION,
  EMPLOYEE_CATEGORY: PolicyScopeLevel.DESIGNATION,
  EMPLOYEE_GROUP: PolicyScopeLevel.EMPLOYEE_GROUP,
  SPECIFIC_EMPLOYEES: PolicyScopeLevel.EMPLOYEE,
};

export interface Step1SelectTemplateProps {
  companyId: string;
  selectedTemplate: PolicyTemplate | null;
  onSelect: (template: PolicyTemplate) => void;
  onPolicyDefinitionChange: (data: any) => void;
  policyDefinition: any;
  policyDomain?: string;
}
export interface CreateTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (template: PolicyTemplate) => void;
}

export interface Step4ApprovalFlowProps {
  config: ApprovalFlowConfig | null;
  onChange: (config: ApprovalFlowConfig) => void;
  domain?: string;
}

export interface Step5PreviewAssignProps {
  policyName: any;
  templateName?: string;
  config: any;
  eligibilityConfig: any;
  approvalFlow: any;
  effectiveFrom?: string;
  onEffectiveFromChange?: (date: string) => void;
}

export interface EmployeeSelectorProps {
  companyId?: string;
  value: Employee | Employee[] | null;
  onChange: (employee: Employee | Employee[] | null) => void;
  multiple?: boolean;
  filter?: (employee: Employee) => boolean;
  label?: string;
  placeholder?: string;
  pageSize?: number;
}

export interface PolicyAssignmentGridProps {
  assignments: PolicyAssignment[];
  companyId: string;
  onAddAssignment: (assignment: Partial<PolicyAssignment>) => Promise<void>;
  onUpdateAssignment: (
    id: string,
    assignment: Partial<PolicyAssignment>,
  ) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onCheckConflicts: (
    assignment: Partial<PolicyAssignment>,
  ) => Promise<PolicyAssignment[]>;
  policyVersionId: string;
  readOnly?: boolean;
}

export interface AssignmentFormData {
  type:
    | "BRANCH"
    | "DEPARTMENT"
    | "DESIGNATION"
    | "EMPLOYMENT_TYPE"
    | "EMPLOYEE_TEMPLATE"
    | "SPECIFIC_EMPLOYEES";
  values: string[];
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface PolicyPreviewSimulatorProps {
  open: boolean;
  onClose: () => void;
  policyVersionId: string;
  policyName?: string;
}

export interface PolicyVersionHistoryProps {
  versions: PolicyVersion[];
  policyName: string;
  onViewVersion: (version: PolicyVersion) => void;
  onRestoreVersion: (version: PolicyVersion) => void;
  onApproveVersion?: (version: PolicyVersion) => void;
  onCompareVersions?: (
    version1: PolicyVersion,
    version2: PolicyVersion,
  ) => void;
  onExportVersion?: (version: PolicyVersion) => void;
}

export const DOMAIN_RULE_BLOCKS: Record<
  PolicyDomain,
  { type: RuleBlockType; name: string }[]
> = {
  LEAVE: [
    { type: "LEAVE_ENTITLEMENTS", name: "Leave Entitlements" },
    { type: "ACCRUAL_RULES", name: "Accrual Rules" },
    { type: "CARRY_FORWARD", name: "Carry Forward" },
    { type: "SANDWICH_RULE", name: "Sandwich Rule" },
    { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  ],
  OVERTIME: [
    { type: "OVERTIME_RULES", name: "Overtime Rules" },
    { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  ],
  ATTENDANCE: [{ type: "SHIFT_RULES", name: "Attendance & Shift Rules" }],
  // SHIFT: [
  //   { type: "SHIFT_RULES", name: "Shift Rules" },
  //   { type: "ROTATION_RULES", name: "Rotation Rules" },
  //   { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  // ],
  EXPENSE: [
    { type: "EXPENSE_LIMITS", name: "Expense Limits & Categories" },
    { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  ],
  PAYROLL: [
    { type: "PAYROLL_RULES", name: "Payroll Components" },
    { type: "STATUTORY_DEDUCTIONS", name: "Statutory Deductions" },
    { type: "TAX_DEDUCTIONS", name: "Tax Deductions" },
  ],
  PROBATION: [{ type: "PROBATION_RULES", name: "Probation Rules" }],
  NOTICE_PERIOD: [{ type: "NOTICE_PERIOD_RULES", name: "Notice Period Rules" }],
  COMP_OFF: [
    { type: "COMP_OFF_RULES", name: "Compensatory Off Rules" },
    { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  ],
  WORK_FROM_HOME: [
    { type: "WFH_RULES", name: "Work From Home Rules" },
    { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  ],
  HOLIDAY: [{ type: "HOLIDAY_RULES", name: "Holiday Rules" }],
  ALLOWANCE: [{ type: "ALLOWANCE_RULES", name: "Allowance Rules" }],
  DEDUCTION: [
    { type: "STATUTORY_DEDUCTIONS", name: "Statutory Deductions" },
    { type: "TAX_DEDUCTIONS", name: "Tax Deductions" },
  ],
  // APPROVAL_WORKFLOW: [
  //   { type: "APPROVAL_FLOW", name: "Approval Workflow Configuration" },
  // ],
  ONBOARDING: [{ type: "ONBOARDING_RULES", name: "Onboarding Rules" }],
  OFFBOARDING: [
    { type: "OFFBOARDING_RULES", name: "Offboarding Rules" },
    { type: "NOTICE_PERIOD_RULES", name: "Notice Period Rules" },
  ],
  BONUS: [
    { type: "BONUS_RULES", name: "Bonus Configuration" },
    { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  ],
  LOAN_ADVANCE: [
    { type: "LOAN_ADVANCE_RULES", name: "Loan & Advance Configuration" },
    { type: "APPROVAL_FLOW", name: "Approval Workflow" },
  ],
};

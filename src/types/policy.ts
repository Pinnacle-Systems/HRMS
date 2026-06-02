export const PolicyDomain = {
  LEAVE: 'LEAVE',
  ATTENDANCE: 'ATTENDANCE',
  SHIFT: 'SHIFT',
  HOLIDAY: 'HOLIDAY',
  OVERTIME: 'OVERTIME',
  PAYROLL: 'PAYROLL',
  ALLOWANCE: 'ALLOWANCE',
  DEDUCTION: 'DEDUCTION',
  PROBATION: 'PROBATION',
  NOTICE_PERIOD: 'NOTICE_PERIOD',
  EXPENSE: 'EXPENSE',
  APPROVAL_WORKFLOW: 'APPROVAL_WORKFLOW',
  ONBOARDING: 'ONBOARDING',
  OFFBOARDING: 'OFFBOARDING',
  COMP_OFF: 'COMP_OFF',
  WORK_FROM_HOME: 'WORK_FROM_HOME',
} as const;

export type PolicyDomain = typeof PolicyDomain[keyof typeof PolicyDomain];

export const IndustryType = {
  IT: 'IT',
  MANUFACTURING: 'MANUFACTURING',
  TEXTILE: 'TEXTILE',
  RETAIL: 'RETAIL',
  HEALTHCARE: 'HEALTHCARE',
  CONSTRUCTION: 'CONSTRUCTION',
  LOGISTICS: 'LOGISTICS',
  EDUCATION: 'EDUCATION',
  HOSPITALITY: 'HOSPITALITY',
  BPO: 'BPO',
} as const;

export type IndustryType = typeof IndustryType[keyof typeof IndustryType];

export const PolicyStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  SCHEDULED: 'SCHEDULED',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type PolicyStatus = typeof PolicyStatus[keyof typeof PolicyStatus];

export const EmploymentType = {
  PERMANENT: 'PERMANENT',
  CONTRACT: 'CONTRACT',
  INTERN: 'INTERN',
  CONSULTANT: 'CONSULTANT',
  PROBATION: 'PROBATION',
  TEMPORARY: 'TEMPORARY',
} as const;

export type EmploymentType = typeof EmploymentType[keyof typeof EmploymentType];

export const EmployeeCategory = {
  STAFF:        'STAFF',        // Office / white-collar: managers, engineers, HR
  LABOUR:       'LABOUR',       // Factory / production floor workers
  GROUND_WORKER:'GROUND_WORKER',// Retail floor, security, field / delivery staff
  SUPERVISOR:   'SUPERVISOR',   // Mid-level: team leads, floor supervisors
  TECHNICIAN:   'TECHNICIAN',   // Skilled trade: electrician, mechanic, maintenance
} as const;

export type EmployeeCategory = typeof EmployeeCategory[keyof typeof EmployeeCategory];

export const VersionStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type VersionStatus = typeof VersionStatus[keyof typeof VersionStatus];

export const PolicyScopeLevel = {
  SYSTEM_DEFAULT: 10,
  INDUSTRY_TEMPLATE: 20,
  COMPANY: 30,
  BRANCH: 40,
  DEPARTMENT: 50,
  DESIGNATION: 60,
  EMPLOYEE_GROUP: 70,
  EMPLOYEE: 80,
} as const;

export type PolicyScopeLevel = typeof PolicyScopeLevel[keyof typeof PolicyScopeLevel];

// Rest of the types remain the same
export interface PolicyTemplate {
  id: string;
  name: string;
  domain: PolicyDomain;
  industryType?: IndustryType;
  description: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  ruleBlocks: RuleBlock[];
  isSystemTemplate: boolean;
}

export interface RuleBlock {
  id: string;
  name: string;
  type: string;
  configurable: boolean;
  schema: Record<string, any>;
}

export interface PolicyDefinition {
  id: string;
  companyId: string;
  templateId: string;
  name: string;
  domain: PolicyDomain;
  description?: string;
  status: PolicyStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: PolicyVersion;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  config: PolicyConfig;
  effectiveFrom: string;
  effectiveTo?: string;
  status: VersionStatus;
  changeLog?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface PolicyConfig {
  rules?: PolicyRule[];
  entitlements?: EntitlementConfig[];
  accrualRules?: AccrualRule;
  carryForward?: CarryForwardRule;
  approvalFlow?: ApprovalFlowConfig;
  [key: string]: any;
}

export interface PolicyRule {
  id: string;
  name: string;
  ruleType: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  enabled: boolean;
}

export interface RuleCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'between';
  value: any;
  logicalOperator?: 'and' | 'or';
  conditions?: RuleCondition[];
}

export interface RuleAction {
  type: 'ALLOW' | 'REJECT' | 'REQUIRE_APPROVAL' | 'REQUIRE_DOCUMENT' | 'CALCULATE';
  value?: any;
  message?: string;
}

export interface EntitlementConfig {
  leaveType: string;
  name: string;
  annualEntitlement: number;
  accrualType: 'MONTHLY' | 'YEARLY' | 'QUARTERLY';
  maxConsecutiveDays?: number;
  requiresDocument?: boolean;
  documentAfterDays?: number;
  allowedDuringProbation: boolean;
  // Extended fields
  halfDayAllowed?: boolean;
  minimumServiceMonths?: number;
  advanceLeaveAllowed?: boolean;
  backdatedAllowed?: boolean;
  backdatedDaysLimit?: number;
  genderRestricted?: 'MALE' | 'FEMALE' | null;
  encashable?: boolean;
  clubbingRestrictions?: string[];
}

export interface AccrualRule {
  enableProRata?: boolean;
  carryForwardUnused?: boolean;
  accrualFrequency?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  maxAccrual?: number;
  leaveYearStartMonth?: number;
  resetOnYearEnd?: boolean;
}

export interface CarryForwardRule {
  maxDays?: number;
  validUntilMonths?: number;
  allowEncashment?: boolean;
  encashmentRate?: number;
}

export interface ApprovalFlowConfig {
  levels: ApprovalLevel[];
  autoApproveBelowDays: number;
  autoApproveThreshold?: number;
  fallbackApprover?: string;
  notifyOnSubmit?: boolean;
  notifyOnApproval?: boolean;
  parallelApproval?: boolean;
  rejectionRequiresReason?: boolean;
}

export interface ApprovalLevel {
  level: number;
  approverType: 'REPORTING_MANAGER' | 'HR' | 'DEPARTMENT_HEAD' | 'ADMIN' | 'SPECIFIC_USER';
  approverId?: string;
  condition?: RuleCondition;
  timeoutDays?: number;
  escalationTo?: string;
}

export interface PolicyAssignment {
  id: string;
  policyVersionId: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  employeeGradeId?: string;
  employmentType?: EmploymentType;
  employeeCategory?: EmployeeCategory;
  employeeGroupId?: string;
  employeeId?: string;
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  conditions?: Record<string, any>;
}

export interface PolicyEvaluationRequest {
  employeeId: string;
  domain: PolicyDomain;
  action: string;
  effectiveDate: string;
  context: Record<string, any>;
}

export interface PolicyEvaluationResponse {
  allowed: boolean;
  policyId?: string;
  policyName?: string;
  policyVersion?: number;
  messages: EvaluationMessage[];
  computed?: Record<string, any>;
  suggestions?: string[];
}

export interface EvaluationMessage {
  type: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  field?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  companyId: string;
  branchId: string;
  departmentId: string;
  designationId: string;
  employmentType: EmploymentType;
  employeeCategory: EmployeeCategory;
  joiningDate: string;
  probationEndDate?: string;
  isOnProbation: boolean;
  grade?: string;
  shiftType?: string;
  location?: string;
}
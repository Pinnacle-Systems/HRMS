export const PolicyDomain = {
  ONBOARDING: "ONBOARDING",
  PROBATION: "PROBATION",
  ATTENDANCE: "ATTENDANCE",
  // SHIFT: 'SHIFT',
  WORK_FROM_HOME: "WORK_FROM_HOME",
  HOLIDAY: "HOLIDAY",
  LEAVE: "LEAVE",
  COMP_OFF: "COMP_OFF",
  OVERTIME: "OVERTIME",
  EXPENSE: "EXPENSE",
  ALLOWANCE: "ALLOWANCE",
  DEDUCTION: "DEDUCTION",
  PAYROLL: "PAYROLL",
  NOTICE_PERIOD: "NOTICE_PERIOD",
  OFFBOARDING: "OFFBOARDING",
  BONUS: "BONUS",
  LOAN_ADVANCE: "LOAN_ADVANCE",
  // APPROVAL_WORKFLOW: 'APPROVAL_WORKFLOW',
} as const;

export type PolicyDomain = (typeof PolicyDomain)[keyof typeof PolicyDomain];

export const PolicyStatus = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  SCHEDULED: "SCHEDULED",
  EXPIRED: "EXPIRED",
  ARCHIVED: "ARCHIVED",
} as const;

export type PolicyStatus = (typeof PolicyStatus)[keyof typeof PolicyStatus];

export const EmploymentType = {
  PERMANENT: "PERMANENT",
  CONTRACT: "CONTRACT",
  INTERN: "INTERN",
  CONSULTANT: "CONSULTANT",
  PROBATION: "PROBATION",
  TEMPORARY: "TEMPORARY",
} as const;

export type EmploymentType =
  (typeof EmploymentType)[keyof typeof EmploymentType];

export const EmployeeCategory = {
  Staff: "staff",
  Labour: "labour",
} as const;

export type EmployeeCategory =
  (typeof EmployeeCategory)[keyof typeof EmployeeCategory];

export const VersionStatus = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  ARCHIVED: "ARCHIVED",
} as const;

export type VersionStatus = (typeof VersionStatus)[keyof typeof VersionStatus];

export const PolicyScopeLevel = {
  SYSTEM_DEFAULT: 10,
  // INDUSTRY_TEMPLATE: 20,
  COMPANY: 20,
  BRANCH: 30,
  DEPARTMENT: 40,
  DESIGNATION: 50,
  // EMPLOYEE_GROUP: 70,
  EMPLOYEE_TEMPLATE: 70,
  EMPLOYEE: 80,
} as const;

export type PolicyScopeLevel =
  (typeof PolicyScopeLevel)[keyof typeof PolicyScopeLevel];

// ============================================
// Base Types
// ============================================

export interface PolicyTemplate {
  id: string;
  name: string;
  domainId: string;
  description: string;
  configSchema: Record<string, any>;
  defaultConfig: Record<string, any>;
  ruleBlocks: RuleBlock[];
  systemTemplate: boolean;
  isSystemTemplate: boolean;
  blockCount: number;
  domainName?: string;
}

export interface RuleBlock {
  id: string;
  ruleBlockName: string;
  ruleBlockCode: RuleBlockType;
  sequenceNo: number;
  ruleBlockId: string;
  configurable: boolean;
  templateId: string;
  mandatory: boolean;
}

export type RuleBlockType =
  | "LEAVE_ENTITLEMENTS"
  | "ACCRUAL_RULES"
  | "CARRY_FORWARD"
  | "SANDWICH_RULE"
  | "OVERTIME_RULES"
  | "SHIFT_RULES"
  | "ROTATION_RULES"
  | "EXPENSE_LIMITS"
  | "PAYROLL_RULES"
  | "STATUTORY_DEDUCTIONS"
  | "TAX_DEDUCTIONS"
  | "PROBATION_RULES"
  | "NOTICE_PERIOD_RULES"
  | "HOLIDAY_RULES"
  | "ALLOWANCE_RULES"
  | "COMP_OFF_RULES"
  | "WFH_RULES"
  | "APPROVAL_FLOW"
  | "ONBOARDING_RULES"
  | "OFFBOARDING_RULES"
  | "BONUS_RULES"
  | "LOAN_ADVANCE_RULES";

export interface PolicyDefinition {
  id: string;
  companyId: string;
  templateId: string;
  policyName: string;
  domainId: string;
  domainName?: string;
  domain: string;
  description?: string;
  status: PolicyStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  currentVersion?: PolicyVersion;
  effectiveFrom?: string;
  effectiveTo?: string;
  policyCode: string;
  createdByName?: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNo: number;
  configJson: PolicyConfig;
  effectiveFrom: string;
  effectiveTo?: string;
  status: VersionStatus;
  changeLog?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  createdByName?: string;
  approvedByName?: string;
}

// ============================================
// Policy Config - Complete Type
// ============================================

// Add or update this in your policy.ts file

export interface OTConfigs {
  otDay: string;
  otCode: string;
  // otValue: string;
  multiplier: number;
  formula: string;
}

// Update the PolicyConfig interface
export interface PolicyConfig {
  rules?: PolicyRule[];

  entitlements?: EntitlementConfig[];
  leaveTypes?: EntitlementConfig[];
  accrualRules?: AccrualRule;
  carryForward?: CarryForwardRule;
  approvalFlow?: ApprovalFlowConfig;

  // Expense domain
  expenseLimits?: Record<string, ExpenseLimit>;
  advanceAllowed?: boolean;
  maxAdvanceAmount?: number;
  settlementDays?: number;
  perDiemAllowed?: boolean;
  perDiemAmount?: number;
  foreignCurrencyAllowed?: boolean;

  // Overtime domain
  overtimeRules?: {
    maxHoursPerDay?: number;
    maxHoursPerMonth?: number;
    weeklyOTLimit?: number;
    overtimeEligibleAfterHours?: number;
    // weekdayMultiplier?: number;
    // weekendMultiplier?: number;
    // holidayMultiplier?: number;
    compensationType?: "PAY" | "COMP_OFF" | "COMP_OFF_OR_PAY";
    compOffValidityDays?: number;
    requiresManagerApproval?: boolean;
    configs: OTConfigs[];
  };

  // Shift/Attendance domain
  shiftConfig?: {
    graceTimeMinutes?: number;
    latePenaltyAfterMinutes?: number;
    halfDayMinutes?: number;
    fullDayMinutes?: number;
    biometricRequired?: boolean;
    mobileCheckInAllowed?: boolean;
    wfhAllowed?: boolean;
    regularizationAllowedPerMonth?: number;
    overtimeAutoCalculate?: boolean;
  };

  penalties?: {
    absentDeductionPerDay?: number;
    lwpAfterDays?: number;
  };

  // Onboarding domain
  onboardingTasks?: string[];
  trainingRequired?: boolean;
  mentorAssigned?: boolean;
  backgroundVerificationRequired?: boolean;
  buddySystemEnabled?: boolean;
  inductionDurationDays?: number;

  // Offboarding domain
  fullAndFinalSettlementDays?: number;
  exitInterviewRequired?: boolean;
  assetReturnRequired?: boolean;
  experienceLetterProvided?: boolean;
  relievingLetterProvided?: boolean;
  knowledgeTransferRequired?: boolean;
  knowledgeTransferDays?: number;
  rehireEligibility?: RehireEligibility;
  clearanceChecklist?: string[];

  // Payroll domain
  payrollComponents?: {
    basic?: { percentage: number; of: string };
    hra?: { percentage: number; of: string; cityType?: string };
    da?: { percentage: number; of: string };
    special?: { percentage: number; of: string };
  };

  overtimeMultiplier?: number;
  shiftAllowance?: Record<string, number>;

  // Statutory deductions
  pf?: {
    employeeContribution: number;
    employerContribution: number;
    ceiling: number;
    basis?: string;
  };

  esi?: {
    employeeContribution: number;
    employerContribution: number;
    applicableBelowCTC: number;
  };

  professionalTax?: {
    applicable: boolean;
    state?: string;
    slabs?: Array<{ min: number; max: number; amount: number }>;
  };

  gratuity?: {
    eligibleAfterYears: number;
    rate: number;
  };

  lwf?: {
    applicable: boolean;
    state?: string;
  };

  tds?: {
    applicable: boolean;
    regime: "OLD" | "NEW";
    declarationRequired?: boolean;
    investmentProofRequired?: boolean;
  };

  // Probation domain
  probationDuration?: number;
  extensionAllowed?: boolean;
  maxExtensionDays?: number;
  reviewCheckpoints?: number[];
  autoConfirmIfNoAction?: boolean;
  salaryPercentageDuringProbation?: number;
  benefitsEligible?: boolean;
  performanceReviewRequired?: boolean;

  // Notice period domain
  noticeDays?: Record<string, number>;
  noticeDuringProbation?: number;
  buyOutAllowed?: boolean;
  buyOutMultiplier?: number;
  gardenLeaveAllowed?: boolean;

  // Comp off domain
  compOffValidityDays?: number;
  minOTHoursForCompOff?: number;
  maxCompOffBalance?: number;
  requiresManagerApproval?: boolean;
  autoExpireUnused?: boolean;

  // WFH domain
  wfhDaysPerMonth?: number;
  advanceNoticeDays?: number;
  geofencingEnabled?: boolean;
  geofencingRadius?: number;
  eligibleAfterProbation?: boolean;
  allowedDuringProbation?: boolean;

  // Holiday domain
  holidayTypes?: string[];
  optionalHolidayQuota?: number;
  workOnHolidayAllowed?: boolean;
  workOnHolidayCompensation?: string;

  // Allowance domain
  allowances?: Array<{
    type: string;
    percentage?: number;
    fixedAmount?: number;
    basis?: string;
    taxExempt: boolean;
  }>;

  // Bonus domain
  bonusRules?: {
    bonusTypes?: Array<{
      type:
        | "ANNUAL"
        | "PERFORMANCE"
        | "FESTIVAL"
        | "RETENTION"
        | "REFERRAL"
        | "JOINING";
      name: string;
      calculationBasis: "CTC" | "BASIC" | "GROSS";
      percentage?: number;
      fixedAmount?: number;
      payoutFrequency: "ANNUAL" | "SEMI_ANNUAL" | "QUARTERLY" | "ONE_TIME";
      payoutMonth?: number;
      eligibilityMonths: number;
      performanceLinked: boolean;
      minPerformanceRating?: number;
      prorationApplicable: boolean;
      clawbackPeriodMonths?: number;
      taxable: boolean;
    }>;
    requiresManagerApproval?: boolean;
    requiresHRApproval?: boolean;
    budgetCapPercentage?: number;
  };

  // Loan & Advance domain
  loanAdvanceRules?: {
    // --- SECTION 1: SANCTIONING ---
    loanTypes?: Array<{
      type:
        | "SALARY_ADVANCE"
        | "PERSONAL_LOAN"
        | "FESTIVAL_ADVANCE"
        | "EDUCATION_LOAN"
        | "MEDICAL_ADVANCE"
        | "VEHICLE_LOAN";
      name: string;
      maxAmount?: number;
      maxMonthlyMultiplier?: number;
      interestRate: number;
      maxRepaymentMonths: number;
      maxEMIPercentage?: number;
      minServiceMonths: number;
      collateralRequired: boolean;
      preClosureAllowed: boolean;
      maxActiveLoans: number;
    }>;
    approvalMatrix: {
      requiresManagerApproval?: boolean;
      requiresHRApproval?: boolean;
      requiresFinanceApproval?: boolean;
      deductionFromSalary?: boolean;
    };
    // --- SECTION 2: REPAYMENT RECOVERY (NEW - Handles EMI Skips) ---
    repaymentRecoveryRules: {
      emiSkipRequest: {
        allowed: boolean;
        maxSkipsPerYear: number;
        skipReasons: [
         | "MEDICAL_EMERGENCY",
         | "SALARY_CREDIT_DELAY",
         | "FAMILY_EVENT",
        ];
        // CRITICAL: Configurable recovery method for the skipped month
        recoveryMethod: "TENOR_EXTENSION" | "CATCH_UP";
        // Options: "CATCH_UP" (double deduction next month) OR "TENOR_EXTENSION" (add 1 month to tenure)
        requiresApproval: boolean;
      };
      earlyClosure: {
        allowed: boolean;
        processingFeePercentage: number; // 2% if you charge a fee
      };
    };
     // --- SECTION 3: OVERLAPPING LOAN & PENDING ARREARS (NEW - Handles multiple loans) ---
    overlappingLoanPolicy: {
      allowConcurrentLoans: boolean, // If false, blocks new loan until old one finishes
      maxTotalDeductionPercentage: number, // Combined EMIs cannot exceed 50% of salary      
      // CRITICAL: What to do with an old loan's pending balance when giving a new loan?
      pendingArrearHandling: "REJECT" | "CONSOLIDATE" | "PARALLEL_WITH_ADJUSTED_TENURE" | "MANUAL_OVERRIDE", 
      /* 
        Options:
        - "REJECT": Do not allow a new loan if any pending months exist.
        - "CONSOLIDATE": Add the pending amount of Old Loan into New Loan's principal (Carry Forward).
        - "PARALLEL_WITH_ADJUSTED_TENURE": Keep old loan running, but reduce the tenure of the NEW loan 
           so its EMI fits within the maxTotalDeductionPercentage.
        - "MANUAL_OVERRIDE": System flags a warning, but HR can manually approve.
      */
      maxActiveLoansCombined: number // Hard limit on total number of concurrent loans
    }
  }
  [key: string]: any;
}

// ============================================
// Leave Domain Types
// ============================================

export interface LeaveEntitlement {
  leaveType: string;
  name: string;
  annualEntitlement: number;
  accrualType: "MONTHLY" | "QUARTERLY" | "YEARLY" | "PER_DAY";
  maxConsecutiveDays?: number;
  requiresDocument: boolean;
  documentAfterDays?: number;
  allowedDuringProbation: boolean;
  halfDayAllowed?: boolean;
  advanceLeaveAllowed?: boolean;
  encashable?: boolean;
  minimumServiceMonths?: number;
  backdatedAllowed?: boolean;
  backdatedDaysLimit?: number;
  genderRestricted?: "MALE" | "FEMALE" | null;
  clubbingRestrictions?: string[];
}

export interface AccrualRules {
  enableProRata?: boolean;
  carryForwardUnused?: boolean;
  accrualFrequency?: "MONTHLY" | "QUARTERLY" | "YEARLY";
  maxAccrual?: number;
  leaveYearStartMonth?: number;
  resetOnYearEnd?: boolean;
}

export interface CarryForwardRules {
  maxDays?: number;
  validUntilMonths?: number;
  allowEncashment?: boolean;
  encashmentRate?: number;
}

export interface SandwichRule {
  enabled: boolean;
  includeWeekends?: boolean;
  includeHolidays?: boolean;
}

// ============================================
// Overtime Domain Types
// ============================================

export interface OvertimeRules {
  maxHoursPerDay?: number;
  maxHoursPerMonth?: number;
  weeklyOTLimit?: number;
  overtimeEligibleAfterHours?: number;
  weekdayMultiplier?: number;
  weekendMultiplier?: number;
  holidayMultiplier?: number;
  compensationType?: "PAY" | "COMP_OFF" | "COMP_OFF_OR_PAY";
  compOffValidityDays?: number;
  requiresManagerApproval?: boolean;
}

// ============================================
// Attendance/Shift Domain Types
// ============================================

export interface ShiftConfig {
  graceTimeMinutes?: number;
  latePenaltyAfterMinutes?: number;
  halfDayMinutes?: number;
  fullDayMinutes?: number;
  biometricRequired?: boolean;
  mobileCheckInAllowed?: boolean;
  wfhAllowed?: boolean;
  regularizationAllowedPerMonth?: number;
  overtimeAutoCalculate?: boolean;
}

export interface AttendancePenalties {
  absentDeductionPerDay?: number;
  lwpAfterDays?: number;
}

// ============================================
// Onboarding Domain Types
// ============================================

export interface OnboardingConfig {
  probationDuration?: number;
  trainingRequired?: boolean;
  mentorAssigned?: boolean;
  backgroundVerificationRequired?: boolean;
  buddySystemEnabled?: boolean;
  inductionDurationDays?: number;
  onboardingTasks?: string[];
}

// ============================================
// Offboarding Domain Types
// ============================================

export type RehireEligibility = "ELIGIBLE" | "CASE_BY_CASE" | "NOT_ELIGIBLE";

export interface OffboardingConfig {
  fullAndFinalSettlementDays?: number;
  exitInterviewRequired?: boolean;
  assetReturnRequired?: boolean;
  experienceLetterProvided?: boolean;
  relievingLetterProvided?: boolean;
  knowledgeTransferRequired?: boolean;
  knowledgeTransferDays?: number;
  rehireEligibility?: RehireEligibility;
  clearanceChecklist?: string[];
}

// ============================================
// Expense Domain Types
// ============================================

interface ExpenseLimit {
  daily?: number;
  monthly?: number;
  yearly?: number;
  requiresReceipt?: boolean;
  requiresPreApproval?: boolean;
  preApprovalThreshold?: number;
}

// ============================================
// Payroll Domain Types
// ============================================

export interface PayrollComponents {
  basic: { percentage: number; of: "CTC" };
  hra: { percentage: number; of: "BASIC"; cityType?: "METRO" | "NON_METRO" };
  da: { percentage: number; of: "BASIC" };
  special: { percentage: number; of: "BASIC" };
}

export interface ShiftAllowance {
  MORNING?: number;
  EVENING?: number;
  NIGHT?: number;
}

// ============================================
// Statutory Deductions Types
// ============================================

export interface PFConfig {
  employeeContribution: number;
  employerContribution: number;
  ceiling: number;
  basis?: "BASIC" | "BASIC_DA";
}

export interface ESIConfig {
  employeeContribution: number;
  employerContribution: number;
  applicableBelowCTC: number;
}

export interface ProfessionalTaxConfig {
  applicable: boolean;
  state?: string;
  slabs?: Array<{ min: number; max: number; amount: number }>;
}

export interface GratuityConfig {
  eligibleAfterYears: number;
  rate: number;
}

export interface LWFConfig {
  applicable: boolean;
  state?: string;
}

// ============================================
// Tax Deductions Types
// ============================================

export interface TDSConfig {
  applicable: boolean;
  regime: "OLD" | "NEW";
  declarationRequired?: boolean;
  investmentProofRequired?: boolean;
}

// ============================================
// Probation Domain Types
// ============================================

export interface ProbationRules {
  probationDuration?: number;
  extensionAllowed?: boolean;
  maxExtensionDays?: number;
  reviewCheckpoints?: number[];
  autoConfirmIfNoAction?: boolean;
  salaryPercentageDuringProbation?: number;
  benefitsEligible?: boolean;
  performanceReviewRequired?: boolean;
}

// ============================================
// Notice Period Domain Types
// ============================================

export interface NoticeDaysConfig {
  DEFAULT?: number;
  ASSOCIATE?: number;
  SENIOR?: number;
  MANAGER?: number;
  DIRECTOR?: number;
  [key: string]: number | undefined;
}

// ============================================
// Allowance Domain Types
// ============================================

export interface Allowance {
  type: string;
  percentage?: number;
  fixedAmount?: number;
  basis?: "BASIC" | "BASIC_DA" | "CTC";
  cityType?: "METRO" | "NON_METRO" | "ALL";
  taxExempt: boolean;
  maxExemptAmount?: number;
}

// ============================================
// Approval Flow Types (Updated to fix the error)
// ============================================

export interface ApprovalCondition {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "notIn"
    | "between";
  value: any;
}

export interface ApprovalLevel {
  id?: string;
  level: number;
  approverType:
    | "REPORTING_MANAGER"
    | "HR"
    | "DEPARTMENT_HEAD"
    | "ADMIN"
    | "SPECIFIC_USER";
  approverId?: string;
  condition?: ApprovalCondition;
  timeoutDays?: number;
  escalationTo?: string;
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

// ============================================
// Rule Engine Types (Existing)
// ============================================

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
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "notIn"
    | "between";
  value: any;
  logicalOperator?: "and" | "or";
  conditions?: RuleCondition[];
}

export interface RuleAction {
  type:
    | "ALLOW"
    | "REJECT"
    | "REQUIRE_APPROVAL"
    | "REQUIRE_DOCUMENT"
    | "CALCULATE";
  value?: any;
  message?: string;
}

// Legacy types (kept for backward compatibility)
export interface EntitlementConfig {
  leaveType: string;
  code?: string;
  name: string;
  annualEntitlement: number;
  accrualType: "MONTHLY" | "YEARLY" | "QUARTERLY";
  maxConsecutiveDays?: number;
  requiresDocument?: boolean;
  documentAfterDays?: number;
  allowedDuringProbation: boolean;
  halfDayAllowed?: boolean;
  minimumServiceMonths?: number;
  advanceLeaveAllowed?: boolean;
  backdatedAllowed?: boolean;
  backdatedDaysLimit?: number;
  genderRestricted?: "MALE" | "FEMALE" | null;
  encashable?: boolean;
  clubbingRestrictions?: string[];

  enableProRata?: boolean;
  carryForwardUnused?: boolean;
  maxAccrual?: number;
}

export interface AccrualRule {
  enableProRata?: boolean;
  carryForwardUnused?: boolean;
  accrualFrequency?: "MONTHLY" | "QUARTERLY" | "YEARLY";
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

// ============================================
// Assignment & Evaluation Types
// ============================================

export interface PolicyAssignment {
  id: string;
  policyVersionId: string;
  companyId?: string;
  companyName: "string",
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  employeeGradeId?: string;
  employmentType?: EmploymentType;
  employeeCategory?: string;
  employeeGroupId?: string;
  employeeId?: string;
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  conditions?: Record<string, any>;
  templateName?: string;
  branchName?: string;
  departmentName?: string;
  designationName?: string;
  employmentTypeName?: string;
  employeeName?: string;
  employeeGroupName?: string;
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
  type: "ERROR" | "WARNING" | "INFO";
  code: string;
  message: string;
  field?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  companyId: string;
  branch: string;
  department: string;
  designation: string;
  employmentType: EmploymentType;
  employeeCategory: EmployeeCategory;
  joiningDate: string;
  probationEndDate?: string;
  isOnProbation: boolean;
  grade?: string;
  shiftType?: string;
  location?: string;
}

export interface Domain {
  id: string;
  name: string;
  code: string;
}

export interface PolicyAuditLog {
  id: string;
  policyId: string;
  versionId: string;
  actionType: string;
  actionBy: string;
  actionDate: string;
  remarks: string;
  actionByName: string;
}

export interface PreviewPayload {
  employeeId: string;
  domain?: string;
  action: string;
  effectiveDate?: string;
  context?: Record<string, unknown>;
}

// ============================================
// Simulation Types
// ============================================

export interface SimulationRunPayload {
  simulationName: string;
  simulationType: string;
  employeeIds: string[];
}

export interface SimulationResultItem {
  id: string;
  simulationId: string;
  employeeId: string;
  policyId: string;
  resultStatus: string;
  resultJson: Record<string, any>;
}

export interface PolicySimulation {
  id: string;
  versionId: string;
  simulationName: string;
  simulationType: string;
  status: string;
  createdAt: string;
  totalEmployees: number;
  appliedCount: number;
  notApplicableCount: number;
  results: SimulationResultItem[];
}

export interface ImpactAnalysisResult {
  versionId: string;
  domainCode: string;
  totalEmployees: number;
  affectedEmployees: number;
  metrics: Record<string, any>;
}

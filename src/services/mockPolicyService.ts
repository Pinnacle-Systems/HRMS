import type {
  PolicyTemplate,
  PolicyDefinition,
  PolicyVersion,
  PolicyAssignment,
  PolicyEvaluationRequest,
  PolicyEvaluationResponse,
  Employee,
} from '../types/policy';
import {
  PolicyDomain,
  PolicyStatus,
  VersionStatus,
  EmploymentType,
  EmployeeCategory,
} from '../types/policy';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export const delay = (ms = 400) => new Promise<void>(r => setTimeout(r, ms));

// ─────────────────────────────────────────────
// MOCK TEMPLATES
// ─────────────────────────────────────────────
export const MOCK_TEMPLATES: PolicyTemplate[] = [
  // ── LEAVE DOMAIN ──────────────────────────────────────────────────────────────
  {
    id: 'tmpl_it_leave',
    name: 'Standard Leave Policy',
    domain: PolicyDomain.LEAVE,
    description: 'Standard leave policy for IT companies — CL, SL, EL with monthly accrual, carry-forward, and sandwich rule.',
    configSchema: {},
    defaultConfig: {
      entitlements: [
        {
          leaveType: 'CL',
          name: 'Casual Leave',
          annualEntitlement: 12,
          accrualType: 'MONTHLY',
          maxConsecutiveDays: 3,
          requiresDocument: false,
          allowedDuringProbation: true,
          halfDayAllowed: true,
          advanceLeaveAllowed: false,
          encashable: false,
          minimumServiceMonths: null,
          backdatedAllowed: true,
          backdatedDaysLimit: 7,
          genderRestricted: null,
        },
      ],
      accrualRules: {
        enableProRata: true,
        carryForwardUnused: true,
        accrualFrequency: 'MONTHLY',
        maxAccrual: 45,
        leaveYearStartMonth: 4,
        resetOnYearEnd: false,
      },
      carryForward: {
        maxDays: 30,
        validUntilMonths: 3,
        allowEncashment: true,
        encashmentRate: 100,
      },
      sandwichRule: { 
        enabled: true, 
        includeWeekends: true, 
        includeHolidays: true 
      },
     
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Leave Entitlements', type: 'LEAVE_ENTITLEMENTS', configurable: true, schema: {} },
      { id: 'rb2', name: 'Accrual Rules', type: 'ACCRUAL_RULES', configurable: true, schema: {} },
      { id: 'rb3', name: 'Carry Forward', type: 'CARRY_FORWARD', configurable: true, schema: {} },
      { id: 'rb4', name: 'Sandwich Rule', type: 'SANDWICH_RULE', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── OVERTIME DOMAIN ──────────────────────────────────────────────────────────
  {
    id: 'tmpl_overtime',
    name: 'Overtime Policy',
    domain: PolicyDomain.OVERTIME,
    description: 'Overtime compensation as per Factories Act, 1948 — double rate, max 4 hours/day, 50 hours/month',
    configSchema: {},
    defaultConfig: {
      overtimeRules: {
        maxHoursPerDay: 4,
        maxHoursPerMonth: 50,
        weeklyOTLimit: 20,
        overtimeEligibleAfterHours: 9,
        weekdayMultiplier: 2.0,
        weekendMultiplier: 2.0,
        holidayMultiplier: 2.5,
        compensationType: 'PAY',
        compOffValidityDays: 90,
        requiresManagerApproval: true,
      },
      approvalFlow: {
        levels: [
          {
            level: 1,
            approverType: 'REPORTING_MANAGER',
            timeoutDays: 1,
          },
          {
            level: 2,
            approverType: 'HR',
            timeoutDays: 2,
            condition: {
              field: 'hours',
              operator: 'gt',
              value: 4,
            },
          },
        ],
        autoApproveBelowDays: 0,
        fallbackApprover: 'HR',
        notifyOnSubmit: true,
        notifyOnApproval: true,
        parallelApproval: false,
        rejectionRequiresReason: true,
      },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Overtime Rules', type: 'OVERTIME_RULES', configurable: true, schema: {} },
      { id: 'rb2', name: 'Approval Workflow', type: 'APPROVAL_FLOW', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── ATTENDANCE DOMAIN ─────────────────────────────────────────────────────────
  {
    id: 'tmpl_attendance',
    name: 'Attendance & Shift Policy',
    domain: PolicyDomain.ATTENDANCE,
    description: 'Shift-based attendance with grace time, late penalty, and absent deduction rules',
    configSchema: {},
    defaultConfig: {
      shiftConfig: {
        graceTimeMinutes: 15,
        latePenaltyAfterMinutes: 30,
        halfDayMinutes: 240,
        fullDayMinutes: 480,
        biometricRequired: true,
        mobileCheckInAllowed: false,
        wfhAllowed: false,
        regularizationAllowedPerMonth: 3,
        overtimeAutoCalculate: true,
      },
      penalties: {
        absentDeductionPerDay: 1,
        lwpAfterDays: 3,
      },
      approvalFlow: {
        levels: [
          {
            level: 1,
            approverType: 'REPORTING_MANAGER',
            timeoutDays: 2,
          },
        ],
        autoApproveBelowDays: 0,
        fallbackApprover: 'HR',
        notifyOnSubmit: true,
        notifyOnApproval: true,
        parallelApproval: false,
        rejectionRequiresReason: true,
      },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Shift & Attendance Rules', type: 'SHIFT_RULES', configurable: true, schema: {} },
      { id: 'rb2', name: 'Approval Workflow', type: 'APPROVAL_FLOW', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── SHIFT DOMAIN ──────────────────────────────────────────────────────────────
  {
    id: 'tmpl_shift_rotation',
    name: 'Shift Rotation Policy',
    domain: PolicyDomain.SHIFT,
    description: 'Rotational shift policy for 24/7 operations with shift allowances',
    configSchema: {},
    defaultConfig: {
      shiftConfig: {
        graceTimeMinutes: 10,
        latePenaltyAfterMinutes: 30,
        halfDayMinutes: 240,
        fullDayMinutes: 480,
        biometricRequired: true,
        mobileCheckInAllowed: false,
        wfhAllowed: false,
        regularizationAllowedPerMonth: 2,
        overtimeAutoCalculate: true,
      },
      rotationPattern: 'WEEKLY',
      notifyDaysBefore: 3,
      minGapBetweenShifts: 12,
      shiftAllowance: {
        MORNING: 100,
        EVENING: 200,
        NIGHT: 500,
      },
      approvalFlow: {
        levels: [
          {
            level: 1,
            approverType: 'REPORTING_MANAGER',
            timeoutDays: 2,
          },
        ],
        autoApproveBelowDays: 0,
        fallbackApprover: 'HR',
        notifyOnSubmit: true,
        notifyOnApproval: true,
        parallelApproval: false,
        rejectionRequiresReason: true,
      },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Shift Rules', type: 'SHIFT_RULES', configurable: true, schema: {} },
      { id: 'rb2', name: 'Rotation Rules', type: 'ROTATION_RULES', configurable: true, schema: {} },
      { id: 'rb3', name: 'Approval Workflow', type: 'APPROVAL_FLOW', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── EXPENSE DOMAIN ────────────────────────────────────────────────────────────
  {
    id: 'tmpl_expense',
    name: 'Expense Reimbursement Policy',
    domain: PolicyDomain.EXPENSE,
    description: 'Expense reimbursement with per-category limits as per Income Tax Act, 1961',
    configSchema: {},
    defaultConfig: {
      expenseLimits: {
        TRAVEL: { daily: 5000, monthly: 50000, requiresReceipt: true, requiresPreApproval: false },
        FOOD: { daily: 500, monthly: 5000, requiresReceipt: false, requiresPreApproval: false },
        ACCOMMODATION: { daily: 3000, monthly: 30000, requiresReceipt: true, requiresPreApproval: true, preApprovalThreshold: 10000 },
        EQUIPMENT: { yearly: 25000, requiresReceipt: true, requiresPreApproval: true, preApprovalThreshold: 5000 },
        STATIONERY: { monthly: 1000, requiresReceipt: false, requiresPreApproval: false },
        OTHER: { monthly: 2000, requiresReceipt: true, requiresPreApproval: false },
      },
      advanceAllowed: true,
      maxAdvanceAmount: 20000,
      settlementDays: 7,
      perDiemAllowed: false,
      perDiemAmount: 0,
      foreignCurrencyAllowed: false,
      approvalFlow: {
        levels: [
          {
            level: 1,
            approverType: 'REPORTING_MANAGER',
            timeoutDays: 3,
          },
          {
            level: 2,
            approverType: 'DEPARTMENT_HEAD',
            timeoutDays: 2,
            condition: {
              field: 'amount',
              operator: 'gt',
              value: 10000,
            },
          },
          {
            level: 3,
            approverType: 'ADMIN',
            timeoutDays: 2,
            condition: {
              field: 'amount',
              operator: 'gt',
              value: 50000,
            },
          },
        ],
        autoApproveBelowDays: 0,
        fallbackApprover: 'HR',
        notifyOnSubmit: true,
        notifyOnApproval: true,
        parallelApproval: false,
        rejectionRequiresReason: true,
      },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Expense Limits', type: 'EXPENSE_LIMITS', configurable: true, schema: {} },
      { id: 'rb2', name: 'Approval Workflow', type: 'APPROVAL_FLOW', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── PAYROLL DOMAIN ────────────────────────────────────────────────────────────
  {
    id: 'tmpl_payroll',
    name: 'Payroll Policy',
    domain: PolicyDomain.PAYROLL,
    description: 'Payroll components with statutory deductions as per Indian Labour Laws',
    configSchema: {},
    defaultConfig: {
      payrollComponents: {
        basic: { percentage: 60, of: 'CTC' },
        hra: { percentage: 40, of: 'BASIC', cityType: 'METRO' },
        da: { percentage: 10, of: 'BASIC' },
        special: { percentage: 15, of: 'BASIC' },
      },
      overtimeMultiplier: 2.0,
      shiftAllowance: { MORNING: 0, EVENING: 200, NIGHT: 500 },
      pf: { employeeContribution: 12, employerContribution: 12, ceiling: 15000, basis: 'BASIC' },
      esi: { employeeContribution: 0.75, employerContribution: 3.25, applicableBelowCTC: 21000 },
      professionalTax: { applicable: true, state: 'KARNATAKA' },
      gratuity: { eligibleAfterYears: 5, rate: 15 },
      lwf: { applicable: false },
      tds: { applicable: true, regime: 'NEW', declarationRequired: true },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Payroll Components', type: 'PAYROLL_RULES', configurable: true, schema: {} },
      { id: 'rb2', name: 'Statutory Deductions', type: 'STATUTORY_DEDUCTIONS', configurable: true, schema: {} },
      { id: 'rb3', name: 'Tax Deductions', type: 'TAX_DEDUCTIONS', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── PROBATION DOMAIN ──────────────────────────────────────────────────────────
  {
    id: 'tmpl_generic_probation',
    name: 'Standard Probation Policy',
    domain: PolicyDomain.PROBATION,
    description: 'Standard probation policy — 3 to 6 month period with configurable review checkpoints',
    configSchema: {},
    defaultConfig: {
      probationDuration: 90,
      extensionAllowed: true,
      maxExtensionDays: 90,
      reviewCheckpoints: [30, 60, 90],
      autoConfirmIfNoAction: false,
      salaryPercentageDuringProbation: 100,
      benefitsEligible: true,
      performanceReviewRequired: true,
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Probation Rules', type: 'PROBATION_RULES', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── NOTICE PERIOD DOMAIN ──────────────────────────────────────────────────────
  {
    id: 'tmpl_generic_notice',
    name: 'Notice Period Policy',
    domain: PolicyDomain.NOTICE_PERIOD,
    description: 'Notice period policy — defines notice duration by designation and buy-out rules',
    configSchema: {},
    defaultConfig: {
      noticeDays: { 
        DEFAULT: 30, 
        ASSOCIATE: 30, 
        SENIOR: 60, 
        MANAGER: 60, 
        DIRECTOR: 90 
      },
      noticeDuringProbation: 7,
      buyOutAllowed: true,
      buyOutMultiplier: 1.0,
      gardenLeaveAllowed: false,
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Notice Period Rules', type: 'NOTICE_PERIOD_RULES', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── HOLIDAY DOMAIN ────────────────────────────────────────────────────────────
  {
    id: 'tmpl_generic_holiday',
    name: 'Company Holiday Policy',
    domain: PolicyDomain.HOLIDAY,
    description: 'Defines national, state, and company-declared holidays with optional/mandatory classification',
    configSchema: {},
    defaultConfig: {
      holidayTypes: ['NATIONAL', 'STATE', 'COMPANY', 'OPTIONAL'],
      mandatoryHolidays: ['NATIONAL'],
      optionalHolidayQuota: 2,
      workOnHolidayAllowed: true,
      workOnHolidayCompensation: 'COMP_OFF',
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Holiday Rules', type: 'HOLIDAY_RULES', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── ALLOWANCE DOMAIN ──────────────────────────────────────────────────────────
  {
    id: 'tmpl_generic_allowance',
    name: 'Standard Allowance Policy',
    domain: PolicyDomain.ALLOWANCE,
    description: 'Defines HRA, Travel Allowance, Medical Allowance, and other recurring allowances',
    configSchema: {},
    defaultConfig: {
      allowances: [
        { type: 'HRA', percentage: 40, basis: 'BASIC', cityType: 'NON_METRO', taxExempt: true },
        { type: 'TRANSPORT', fixedAmount: 1600, taxExempt: true },
        { type: 'MEDICAL', fixedAmount: 1250, taxExempt: true },
        { type: 'SPECIAL', percentage: 10, basis: 'BASIC', taxExempt: false },
      ],
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Allowance Components', type: 'ALLOWANCE_RULES', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── DEDUCTION DOMAIN ──────────────────────────────────────────────────────────
  {
    id: 'tmpl_generic_deduction',
    name: 'Statutory Deduction Policy',
    domain: PolicyDomain.DEDUCTION,
    description: 'PF, ESI, Professional Tax, LWF, and TDS deduction configuration',
    configSchema: {},
    defaultConfig: {
      pf: { employeeContribution: 12, employerContribution: 12, basis: 'BASIC', ceiling: 15000 },
      esi: { employeeContribution: 0.75, employerContribution: 3.25, applicableBelowCTC: 21000 },
      professionalTax: { applicable: true, state: 'KARNATAKA' },
      lwf: { applicable: false },
      tds: { applicable: true, regime: 'NEW', declarationRequired: true },
      gratuity: { eligibleAfterYears: 5, rate: 15 },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Statutory Deductions (PF/ESI/PT)', type: 'STATUTORY_DEDUCTIONS', configurable: true, schema: {} },
      { id: 'rb2', name: 'Tax Deductions (TDS)', type: 'TAX_DEDUCTIONS', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── COMP OFF DOMAIN ───────────────────────────────────────────────────────────
  {
    id: 'tmpl_generic_compoff',
    name: 'Compensatory Off Policy',
    domain: PolicyDomain.COMP_OFF,
    description: 'Rules for earning and redeeming compensatory offs against overtime or holiday work',
    configSchema: {},
    defaultConfig: {
      compOffValidityDays: 90,
      minOTHoursForCompOff: 4,
      maxCompOffBalance: 5,
      requiresManagerApproval: true,
      autoExpireUnused: true,
      approvalFlow: {
        levels: [
          {
            level: 1,
            approverType: 'REPORTING_MANAGER',
            timeoutDays: 2,
          },
        ],
        autoApproveBelowDays: 0,
        fallbackApprover: 'HR',
        notifyOnSubmit: true,
        notifyOnApproval: true,
        parallelApproval: false,
        rejectionRequiresReason: true,
      },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Comp-off Rules', type: 'COMP_OFF_RULES', configurable: true, schema: {} },
      { id: 'rb2', name: 'Approval Workflow', type: 'APPROVAL_FLOW', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── WORK FROM HOME DOMAIN ─────────────────────────────────────────────────────
  {
    id: 'tmpl_generic_wfh',
    name: 'Work From Home Policy',
    domain: PolicyDomain.WORK_FROM_HOME,
    description: 'Eligibility and limits for remote/WFH work per employee category and designation',
    configSchema: {},
    defaultConfig: {
      wfhDaysPerMonth: 8,
      requiresManagerApproval: true,
      advanceNoticeDays: 1,
      geofencingEnabled: false,
      geofencingRadius: 500,
      eligibleAfterProbation: true,
      allowedDuringProbation: false,
      approvalFlow: {
        levels: [
          {
            level: 1,
            approverType: 'REPORTING_MANAGER',
            timeoutDays: 1,
          },
        ],
        autoApproveBelowDays: 0,
        fallbackApprover: 'HR',
        notifyOnSubmit: true,
        notifyOnApproval: true,
        parallelApproval: false,
        rejectionRequiresReason: true,
      },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'WFH Rules', type: 'WFH_RULES', configurable: true, schema: {} },
      { id: 'rb2', name: 'Approval Workflow', type: 'APPROVAL_FLOW', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── APPROVAL WORKFLOW DOMAIN ──────────────────────────────────────────────────
  {
    id: 'tmpl_approval_workflow',
    name: 'Multi-Level Approval Workflow',
    domain: PolicyDomain.APPROVAL_WORKFLOW,
    description: 'Generic multi-level approval workflow for various requests',
    configSchema: {},
    defaultConfig: {
      approvalFlow: {
        levels: [
          {
            level: 1,
            approverType: 'REPORTING_MANAGER',
            timeoutDays: 2,
            escalationTo: 'DEPARTMENT_HEAD',
          },
          {
            level: 2,
            approverType: 'DEPARTMENT_HEAD',
            timeoutDays: 2,
            condition: {
              field: 'amount',
              operator: 'gt',
              value: 10000,
            },
          },
          {
            level: 3,
            approverType: 'HR',
            timeoutDays: 2,
            condition: {
              field: 'amount',
              operator: 'gt',
              value: 50000,
            },
          },
        ],
        autoApproveBelowDays: 1,
        fallbackApprover: 'ADMIN',
        notifyOnSubmit: true,
        notifyOnApproval: true,
        parallelApproval: false,
        rejectionRequiresReason: true,
      },
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Approval Workflow', type: 'APPROVAL_FLOW', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── ONBOARDING DOMAIN ─────────────────────────────────────────────────────────
  {
    id: 'tmpl_onboarding',
    name: 'Employee Onboarding Policy',
    domain: PolicyDomain.ONBOARDING,
    description: 'Standard onboarding process for new employees',
    configSchema: {},
    defaultConfig: {
      onboardingTasks: [
        'Document Collection',
        'IT Asset Allocation',
        'Email & System Access',
        'HR Induction',
        'Department Introduction',
      ],
      probationDuration: 90,
      trainingRequired: true,
      mentorAssigned: true,
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Onboarding Rules', type: 'ONBOARDING_RULES', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },

  // ── OFFBOARDING DOMAIN ────────────────────────────────────────────────────────
  {
    id: 'tmpl_offboarding',
    name: 'Employee Offboarding Policy',
    domain: PolicyDomain.OFFBOARDING,
    description: 'Standard offboarding process for exiting employees',
    configSchema: {},
    defaultConfig: {
      noticeDays: { DEFAULT: 30, MANAGER: 60, SENIOR: 90 },
      exitInterviewRequired: true,
      assetReturnRequired: true,
      fullAndFinalSettlementDays: 45,
      experienceLetterProvided: true,
    },
    ruleBlocks: [
      { id: 'rb1', name: 'Offboarding Rules', type: 'OFFBOARDING_RULES', configurable: true, schema: {} },
      { id: 'rb2', name: 'Notice Period Rules', type: 'NOTICE_PERIOD_RULES', configurable: true, schema: {} },
    ],
    isSystemTemplate: true,
  },
];

// ─────────────────────────────────────────────
// MOCK EMPLOYEES
// ─────────────────────────────────────────────

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'EMP001',
    employeeId: 'E1001',
    name: 'John Doe',
    companyId: 'company_123',
    branch: 'branch1',
    department: 'dept1',
    designation: 'des2',
    employmentType: EmploymentType.PERMANENT,
    employeeCategory: EmployeeCategory.STAFF,
    joiningDate: '2020-01-15',
    isOnProbation: false,
    grade: 'P3',
    shiftType: 'GENERAL',
    location: 'Chennai',
  },
  {
    id: 'EMP002',
    employeeId: 'E1002',
    name: 'Priya Sharma',
    companyId: 'company_123',
    branch: 'branch1',
    department: 'dept3',
    designation: 'des1',
    employmentType: EmploymentType.PERMANENT,
    employeeCategory: EmployeeCategory.STAFF,
    joiningDate: '2019-06-01',
    isOnProbation: false,
    grade: 'M1',
    shiftType: 'GENERAL',
    location: 'Chennai',
  },
  {
    id: 'EMP003',
    employeeId: 'E1003',
    name: 'Rajesh Kumar',
    companyId: 'company_123',
    branch: 'branch3',
    department: 'dept4',
    designation: 'des4',
    employmentType: EmploymentType.CONTRACT,
    employeeCategory: EmployeeCategory.LABOUR,
    joiningDate: '2023-03-10',
    isOnProbation: false,
    grade: 'W1',
    shiftType: 'MORNING',
    location: 'Mumbai',
  },
  {
    id: 'EMP005',
    employeeId: 'E1005',
    name: 'Arjun Mehta',
    companyId: 'company_123',
    branch: 'branch1',
    department: 'dept1',
    designation: 'des3',
    employmentType: EmploymentType.PROBATION,
    employeeCategory: EmployeeCategory.STAFF,
    joiningDate: '2026-03-01',
    probationEndDate: '2026-09-01',
    isOnProbation: true,
    grade: 'J1',
    shiftType: 'GENERAL',
    location: 'Chennai',
  },
  {
    id: 'EMP006',
    employeeId: 'E1006',
    name: 'Deepa Nair',
    companyId: 'company_123',
    branch: 'branch2',
    department: 'dept3',
    designation: 'des3',
    employmentType: EmploymentType.PERMANENT,
    employeeCategory: EmployeeCategory.STAFF,
    joiningDate: '2021-11-15',
    isOnProbation: false,
    grade: 'J2',
    shiftType: 'GENERAL',
    location: 'Bangalore',
  },
  {
    id: 'EMP008',
    employeeId: 'E1008',
    name: 'Anita Bose',
    companyId: 'company_123',
    branch: 'branch1',
    department: 'dept2',
    designation: 'des1',
    employmentType: EmploymentType.PERMANENT,
    employeeCategory: EmployeeCategory.STAFF,
    joiningDate: '2017-04-10',
    isOnProbation: false,
    grade: 'M2',
    shiftType: 'GENERAL',
    location: 'Chennai',
  },
];

// ─────────────────────────────────────────────
// MOCK POLICY DEFINITIONS  (in-memory store so
// newly created policies show up in the list)
// ─────────────────────────────────────────────

const INITIAL_POLICIES: PolicyDefinition[] = [
  {
    id: 'POL-001',
    companyId: 'company_123',
    templateId: 'tmpl_it_leave',
    name: 'Annual Leave Policy',
    domain: PolicyDomain.LEAVE,
    description: 'Defines annual leave entitlement and carry-forward rules for all permanent IT staff.',
    status: PolicyStatus.ACTIVE,
    createdBy: 'HR Admin',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-05-20T10:30:00Z',
    effectiveFrom: '2026-01-01',
    currentVersion: {
      id: 'VER-001-v2',
      policyId: 'POL-001',
      versionNumber: 2,
      config: {},
      effectiveFrom: '2026-01-01',
      status: VersionStatus.ACTIVE,
      createdBy: 'HR Admin',
      createdAt: '2025-12-15T09:00:00Z',
    },
  },
  {
    id: 'POL-002',
    companyId: 'company_123',
    templateId: 'tmpl_mfg_attendance',
    name: 'Attendance Regularization Policy',
    domain: PolicyDomain.ATTENDANCE,
    description: 'Rules for attendance correction and approval workflow.',
    status: PolicyStatus.DRAFT,
    createdBy: 'HR Manager',
    createdAt: '2026-03-05T11:00:00Z',
    updatedAt: '2026-05-25T14:00:00Z',
    effectiveFrom: '2026-04-01',
    currentVersion: {
      id: 'VER-002-v1',
      policyId: 'POL-002',
      versionNumber: 1,
      config: {},
      effectiveFrom: '2026-04-01',
      status: VersionStatus.DRAFT,
      createdBy: 'HR Manager',
      createdAt: '2026-03-05T11:00:00Z',
    },
  },
  {
    id: 'POL-003',
    companyId: 'company_123',
    templateId: 'tmpl_retail_shift',
    name: 'Shift Assignment Policy',
    domain: PolicyDomain.SHIFT,
    description: 'Automated shift allocation and swap approval process.',
    status: PolicyStatus.PENDING_APPROVAL,
    createdBy: 'Operations Head',
    createdAt: '2026-04-12T08:15:00Z',
    updatedAt: '2026-05-28T09:45:00Z',
    effectiveFrom: '2026-06-01',
    currentVersion: {
      id: 'VER-003-v1',
      policyId: 'POL-003',
      versionNumber: 1,
      config: {},
      effectiveFrom: '2026-06-01',
      status: VersionStatus.PENDING_APPROVAL,
      createdBy: 'Operations Head',
      createdAt: '2026-04-12T08:15:00Z',
    },
  },
  {
    id: 'POL-004',
    companyId: 'company_123',
    templateId: 'tmpl_it_overtime',
    name: 'Overtime Compensation Policy',
    domain: PolicyDomain.OVERTIME,
    description: 'Defines overtime eligibility and compensation calculation.',
    status: PolicyStatus.ACTIVE,
    createdBy: 'Payroll Admin',
    createdAt: '2026-02-18T07:30:00Z',
    updatedAt: '2026-05-15T16:20:00Z',
    effectiveFrom: '2026-02-01',
    currentVersion: {
      id: 'VER-004-v1',
      policyId: 'POL-004',
      versionNumber: 1,
      config: {},
      effectiveFrom: '2026-02-01',
      status: VersionStatus.ACTIVE,
      createdBy: 'Payroll Admin',
      createdAt: '2026-02-18T07:30:00Z',
    },
  },
  {
    id: 'POL-005',
    companyId: 'company_123',
    templateId: 'tmpl_mfg_payroll',
    name: 'Payroll Processing Policy',
    domain: PolicyDomain.PAYROLL,
    description: 'Monthly payroll processing timeline and validations.',
    status: PolicyStatus.SCHEDULED,
    createdBy: 'Finance Manager',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-29T11:00:00Z',
    effectiveFrom: '2026-07-01',
    currentVersion: {
      id: 'VER-005-v1',
      policyId: 'POL-005',
      versionNumber: 1,
      config: {},
      effectiveFrom: '2026-07-01',
      status: VersionStatus.DRAFT,
      createdBy: 'Finance Manager',
      createdAt: '2026-05-01T10:00:00Z',
    },
  },
  {
    id: 'POL-006',
    companyId: 'company_123',
    templateId: 'tmpl_generic_probation',
    name: 'Probation Confirmation Policy',
    domain: PolicyDomain.PROBATION,
    description: 'Employee probation review and confirmation workflow.',
    status: PolicyStatus.ACTIVE,
    createdBy: 'HR Director',
    createdAt: '2026-01-25T12:00:00Z',
    updatedAt: '2026-05-10T09:30:00Z',
    effectiveFrom: '2026-01-01',
    currentVersion: {
      id: 'VER-006-v1',
      policyId: 'POL-006',
      versionNumber: 1,
      config: {},
      effectiveFrom: '2026-01-01',
      status: VersionStatus.ACTIVE,
      createdBy: 'HR Director',
      createdAt: '2026-01-25T12:00:00Z',
    },
  },
  {
    id: 'POL-007',
    companyId: 'company_123',
    templateId: 'tmpl_it_expense',
    name: 'Travel Expense Reimbursement',
    domain: PolicyDomain.EXPENSE,
    description: 'Rules for claiming official travel and project-related expenses.',
    status: PolicyStatus.EXPIRED,
    createdBy: 'Accounts Team',
    createdAt: '2025-08-15T09:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    effectiveFrom: '2025-08-01',
    currentVersion: {
      id: 'VER-007-v1',
      policyId: 'POL-007',
      versionNumber: 1,
      config: {},
      effectiveFrom: '2025-08-01',
      status: VersionStatus.EXPIRED,
      createdBy: 'Accounts Team',
      createdAt: '2025-08-15T09:00:00Z',
    },
  },
  {
    id: 'POL-008',
    companyId: 'company_123',
    templateId: 'tmpl_generic_notice',
    name: 'Employee Offboarding Policy',
    domain: PolicyDomain.NOTICE_PERIOD,
    description: 'Notice period and exit formalities for all grades.',
    status: PolicyStatus.ACTIVE,
    createdBy: 'Talent Acquisition',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-05-22T13:15:00Z',
    effectiveFrom: '2026-02-01',
    currentVersion: {
      id: 'VER-008-v1',
      policyId: 'POL-008',
      versionNumber: 1,
      config: {},
      effectiveFrom: '2026-02-01',
      status: VersionStatus.ACTIVE,
      createdBy: 'Talent Acquisition',
      createdAt: '2026-02-10T09:00:00Z',
    },
  },
  {
    id: 'POL-009',
    companyId: 'company_123',
    templateId: 'tmpl_it_leave',
    name: 'Annual Leave Policy',
    domain: PolicyDomain.ONBOARDING,
    description: 'Defines annual leave entitlement and carry-forward rules for all permanent IT staff.',
    status: PolicyStatus.ARCHIVED,
    createdBy: 'HR Admin',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-05-20T10:30:00Z',
    effectiveFrom: '2026-01-01',
    currentVersion: {
      id: 'VER-001-v2',
      policyId: 'POL-001',
      versionNumber: 2,
      config: {},
      effectiveFrom: '2026-01-01',
      status: VersionStatus.ARCHIVED,
      createdBy: 'HR Admin',
      createdAt: '2025-12-15T09:00:00Z',
    },
  },
];

// Mutable runtime store — new policies created via wizard are appended here
const policyStore: PolicyDefinition[] = [...INITIAL_POLICIES];

// Employee groups (mock)
export const MOCK_EMPLOYEE_GROUPS = [
  { id: 'grp1', name: 'Permanent - Grade A' },
  { id: 'grp2', name: 'Permanent - Grade B' },
  { id: 'grp3', name: 'Contract Workers' },
  { id: 'grp4', name: 'Field Sales Team' },
  { id: 'grp5', name: 'Night Shift Workers' },
  { id: 'grp6', name: 'Senior Management' },
];

// ─────────────────────────────────────────────
// MOCK VERSIONS
// ─────────────────────────────────────────────

const MOCK_VERSIONS: Record<string, PolicyVersion[]> = {
  'POL-001': [
    {
      id: 'VER-001-v2',
      policyId: 'POL-001',
      versionNumber: 2,
      config: {
        entitlements: [
          { leaveType: 'CL', name: 'Casual Leave', annualEntitlement: 12, accrualType: 'MONTHLY', allowedDuringProbation: true },
          { leaveType: 'SL', name: 'Sick Leave', annualEntitlement: 12, accrualType: 'YEARLY', allowedDuringProbation: true },
          { leaveType: 'EL', name: 'Earned Leave', annualEntitlement: 15, accrualType: 'MONTHLY', allowedDuringProbation: false },
        ],
        accrualRules: { enableProRata: true, carryForwardUnused: true, accrualFrequency: 'MONTHLY' },
        carryForward: { maxDays: 30, validUntilMonths: 3, allowEncashment: true },
        approvalFlow: {
          levels: [{ level: 1, approverType: 'REPORTING_MANAGER', timeoutDays: 2 }],
          autoApproveBelowDays: 1,
        },
      },
      effectiveFrom: '2026-01-01',
      status: VersionStatus.ACTIVE,
      changeLog: 'Increased EL from 12 to 15 days; added carry-forward',
      createdBy: 'HR Admin',
      approvedBy: 'HR Director',
      approvedAt: '2025-12-20T10:00:00Z',
      createdAt: '2025-12-15T09:00:00Z',
    },
    {
      id: 'VER-001-v1',
      policyId: 'POL-001',
      versionNumber: 1,
      config: {
        entitlements: [
          { leaveType: 'CL', name: 'Casual Leave', annualEntitlement: 12, accrualType: 'MONTHLY', allowedDuringProbation: true },
          { leaveType: 'SL', name: 'Sick Leave', annualEntitlement: 12, accrualType: 'YEARLY', allowedDuringProbation: true },
          { leaveType: 'EL', name: 'Earned Leave', annualEntitlement: 12, accrualType: 'MONTHLY', allowedDuringProbation: false },
        ],
      },
      effectiveFrom: '2025-01-01',
      effectiveTo: '2025-12-31',
      status: VersionStatus.EXPIRED,
      changeLog: 'Initial version',
      createdBy: 'HR Admin',
      createdAt: '2024-12-20T09:00:00Z',
    },
  ],
};

const getOrCreateVersions = (policyId: string): PolicyVersion[] => {
  if (MOCK_VERSIONS[policyId]) return MOCK_VERSIONS[policyId];
  const policy = policyStore.find(p => p.id === policyId);
  return [
    {
      id: `VER-${policyId}-v1`,
      policyId,
      versionNumber: 1,
      config: {},
      effectiveFrom: policy?.effectiveFrom || new Date().toISOString().split('T')[0],
      status: VersionStatus.DRAFT,
      changeLog: 'Initial version',
      createdBy: policy?.createdBy || 'System',
      createdAt: policy?.createdAt || new Date().toISOString(),
    },
  ];
};

// ─────────────────────────────────────────────
// MOCK ASSIGNMENTS
// ─────────────────────────────────────────────

const assignmentStore: PolicyAssignment[] = [
  {
    id: 'ASN-001',
    policyVersionId: 'VER-001-v2',
    companyId: 'company_123',
    departmentId: 'dept1',
    priority: 60,
    effectiveFrom: '2026-01-01',
  },
  {
    id: 'ASN-002',
    policyVersionId: 'VER-001-v2',
    companyId: 'company_123',
    departmentId: 'dept2',
    priority: 50,
    effectiveFrom: '2026-01-01',
  },
];

// ─────────────────────────────────────────────
// MOCK EVALUATION ENGINE
// ─────────────────────────────────────────────

const mockEvaluate = (
  request: PolicyEvaluationRequest,
): PolicyEvaluationResponse => {
  const employee = MOCK_EMPLOYEES.find(e => e.id === request.employeeId);
  const messages: any[] = [];
  const computed: Record<string, any> = {};
  let allowed = true;

  if (!employee) {
    return {
      allowed: false,
      messages: [{ type: 'ERROR', code: 'EMP_NOT_FOUND', message: 'Employee not found in the system.' }],
    };
  }

  const category = employee.employeeCategory;

  messages.push({
    type: 'INFO',
    code: 'EMP_CONTEXT',
    message: `Evaluating for ${employee.name} (${employee.employeeId}) — ${employee.employmentType} · ${category}`,
  });

  if (employee.isOnProbation) {
    messages.push({
      type: 'WARNING',
      code: 'ON_PROBATION',
      message: `Employee is currently on probation (ends ${employee.probationEndDate || 'TBD'})`,
    });
  }

  // ── LEAVE ──
  if (request.domain === PolicyDomain.LEAVE) {
    const { leaveType, fromDate, toDate } = request.context;

    const leaveNames: Record<string, string> = {
      CL: 'Casual Leave', SL: 'Sick Leave', EL: 'Earned Leave',
      ML: 'Maternity Leave', PL: 'Paternity Leave', EmL: 'Emergency Leave',
    };

    // Leave balances differ by employee category
    const leaveBalancesByCategory: Record<string, Record<string, number>> = {
      [EmployeeCategory.STAFF]:        { CL: 12, SL: 12, EL: 15, ML: 182, PL: 15, EmL: 5 },
      [EmployeeCategory.LABOUR]:       { CL: 7,  SL: 10, EL: 18, ML: 182, PL: 7,  EmL: 3 },
    };
    const leaveBalances = leaveBalancesByCategory[category] ?? leaveBalancesByCategory[EmployeeCategory.STAFF];

    const probationAllowed: Record<string, boolean> = {
      CL: true, SL: true, EL: false, ML: false, PL: false, EmL: true,
    };

    if (leaveType) {
      const balance = leaveBalances[leaveType] ?? 0;
      const labelName = leaveNames[leaveType] ?? leaveType;

      computed.leaveType = labelName;
      computed.availableBalance = `${balance} days`;

      if (employee.isOnProbation && !(probationAllowed[leaveType] ?? true)) {
        allowed = false;
        messages.push({
          type: 'ERROR', code: 'PROBATION_RESTRICTED',
          message: `${labelName} is not permitted during probation period.`,
        });
      } else {
        messages.push({
          type: 'INFO', code: 'BALANCE_CHECK',
          message: `Available balance for ${labelName}: ${balance} days`,
        });
      }

      if (fromDate && toDate) {
        const ms = new Date(toDate).getTime() - new Date(fromDate).getTime();
        const days = Math.max(1, Math.ceil(ms / 86_400_000) + 1);
        computed.requestedDays = days;

        if (days > balance) {
          allowed = false;
          messages.push({
            type: 'ERROR', code: 'INSUFFICIENT_BALANCE',
            message: `Requested ${days} days but only ${balance} available.`,
          });
        } else {
          messages.push({
            type: 'INFO', code: 'BALANCE_SUFFICIENT',
            message: `${days} day(s) requested — balance sufficient.`,
          });
        }

        if (days > 3) {
          computed.approvalRequired = true;
          computed.approvalFlow = ['Reporting Manager'];
          messages.push({
            type: 'INFO', code: 'APPROVAL_REQUIRED',
            message: 'Requests over 3 days require Reporting Manager approval.',
          });
        } else if (days > 0) {
          computed.approvalRequired = false;
          computed.approvalFlow = [];
          messages.push({
            type: 'INFO', code: 'AUTO_APPROVED',
            message: 'Short leave (≤ 3 days) — eligible for auto-approval.',
          });
        }

        if (leaveType === 'SL' && days > 3) {
          messages.push({
            type: 'WARNING', code: 'DOCUMENT_REQUIRED',
            message: 'Medical certificate required for sick leave exceeding 3 days.',
          });
        }
      }
    }
  }

  // ── EXPENSE ──
  else if (request.domain === PolicyDomain.EXPENSE) {
    const { amount, category } = request.context;
    const limits: Record<string, number> = {
      TRAVEL: 5000, FOOD: 500, ACCOMMODATION: 3000, EQUIPMENT: 25000, OTHER: 2000,
    };

    if (amount && category) {
      const limit = limits[category] ?? 1000;
      computed.requestedAmount = `₹${amount}`;
      computed.categoryLimit = `₹${limit}`;
      computed.category = category;

      if (amount > limit) {
        messages.push({
          type: 'WARNING', code: 'OVER_LIMIT',
          message: `₹${amount} exceeds the daily limit of ₹${limit} for ${category}.`,
        });
        computed.approvalRequired = true;
        computed.approvalFlow = ['Reporting Manager', 'Finance Team'];
      } else {
        messages.push({
          type: 'INFO', code: 'WITHIN_LIMIT',
          message: `₹${amount} is within the ${category} limit (₹${limit}).`,
        });
        computed.approvalRequired = amount > 1000;
        computed.approvalFlow = amount > 1000 ? ['Reporting Manager'] : ['Auto-approved'];
      }
    }
  }

  // ── OVERTIME ──
  else if (request.domain === PolicyDomain.OVERTIME) {
    const { hours } = request.context;

    // OT rules differ by category (Labour: Factories Act mandates 2×, max 2h/day)
    const otRules: Record<string, { maxHours: number; rate: number; compensationType: string }> = {
      [EmployeeCategory.STAFF]:        { maxHours: 4, rate: 1.5, compensationType: 'Pay or Comp-off (employee\'s choice)' },
      [EmployeeCategory.LABOUR]:       { maxHours: 2, rate: 2.0, compensationType: 'Cash pay only (Factories Act)' },
      // [EmployeeCategory.GROUND_WORKER]:{ maxHours: 3, rate: 1.5, compensationType: 'Pay or Comp-off' },
      // [EmployeeCategory.SUPERVISOR]:   { maxHours: 4, rate: 1.5, compensationType: 'Pay or Comp-off' },
      // [EmployeeCategory.TECHNICIAN]:   { maxHours: 3, rate: 1.75, compensationType: 'Pay or Comp-off' },
    };
    const otRule = otRules[category] ?? otRules[EmployeeCategory.STAFF];

    messages.push({
      type: 'INFO', code: 'OT_CATEGORY_RULE',
      message: `OT rules for ${category}: max ${otRule.maxHours}h/day at ${otRule.rate}× rate.`,
    });

    if (hours != null) {
      computed.requestedHours = hours;
      computed.category = category;
      if (hours > otRule.maxHours) {
        allowed = false;
        messages.push({
          type: 'ERROR', code: 'OT_LIMIT_EXCEEDED',
          message: `${hours}h exceeds the daily overtime limit of ${otRule.maxHours} hours for ${category}.`,
        });
      } else {
        messages.push({
          type: 'INFO', code: 'OT_APPROVED',
          message: `${hours}h overtime approved.`,
        });
        computed.overtimeRate = `${otRule.rate}×`;
        computed.estimatedPay = `${hours}h × ${otRule.rate}× hourly rate`;
        computed.compensationType = otRule.compensationType;
      }
    }
  }

  // ── ATTENDANCE ──
  else if (request.domain === PolicyDomain.ATTENDANCE) {
    messages.push({
      type: 'INFO', code: 'ATT_OK',
      message: 'Attendance regularization request evaluated.',
    });
    computed.graceTime = '10 minutes';
    computed.approvalRequired = true;
    computed.approvalFlow = ['Reporting Manager'];
  }

  // ── GENERIC ──
  else {
    messages.push({
      type: 'INFO', code: 'POLICY_APPLIED',
      message: `${request.domain} policy evaluation completed for ${employee.name}.`,
    });
  }

  return {
    allowed,
    policyId: 'POL-001',
    policyName: 'Standard Leave Policy',
    policyVersion: 2,
    messages,
    computed,
    suggestions: allowed
      ? ['Policy evaluated successfully']
      : ['Contact HR for an exception', 'Check your leave balance', 'Review the company holiday calendar'],
  };
};

// ─────────────────────────────────────────────
// PUBLIC MOCK SERVICE
// ─────────────────────────────────────────────

// User-created templates (mutable — persists during session)
const userTemplateStore: PolicyTemplate[] = [];

export const mockPolicyService = {
  // Templates
  getTemplates: (domain?: string): PolicyTemplate[] => {
    const all = [...MOCK_TEMPLATES, ...userTemplateStore];
    return domain ? all.filter(t => t.domain === domain) : all;
  },

  getTemplateById: (id: string): PolicyTemplate => {
    const all = [...MOCK_TEMPLATES, ...userTemplateStore];
    const t = all.find(t => t.id === id);
    if (!t) throw new Error(`Template ${id} not found`);
    return t;
  },

  createTemplate: (data: Partial<PolicyTemplate>): PolicyTemplate => {
    const newTemplate: PolicyTemplate = {
      id: `tmpl_custom_${Date.now()}`,
      name: data.name || 'Custom Template',
      domain: data.domain || PolicyDomain.LEAVE,
      description: data.description || '',
      configSchema: {},
      defaultConfig: data.defaultConfig || {},
      ruleBlocks: data.ruleBlocks || [],
      isSystemTemplate: false,
    };
    userTemplateStore.push(newTemplate);
    return newTemplate;
  },

  // Policies
  getPolicies: (companyId: string, domain?: string): PolicyDefinition[] =>
    domain
      ? policyStore.filter(p => p.companyId === companyId && p.domain === domain)
      : policyStore.filter(p => p.companyId === companyId),

  getPolicyById: (id: string): PolicyDefinition => {
    const p = policyStore.find(p => p.id === id);
    if (!p) throw new Error(`Policy ${id} not found`);
    return p;
  },

  createPolicy: (data: Partial<PolicyDefinition>): PolicyDefinition => {
    const newPolicy: PolicyDefinition = {
      id: `POL-${Date.now()}`,
      companyId: data.companyId || 'company_123',
      templateId: data.templateId || '',
      name: data.name || 'New Policy',
      domain: data.domain || PolicyDomain.LEAVE,
      description: data.description,
      status: PolicyStatus.DRAFT,
      createdBy: data.createdBy || 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      effectiveFrom: new Date().toISOString().split('T')[0],
    };
    policyStore.push(newPolicy);
    return newPolicy;
  },

  updatePolicy: (id: string, data: Partial<PolicyDefinition>): PolicyDefinition => {
    const idx = policyStore.findIndex(p => p.id === id);
    if (idx < 0) throw new Error(`Policy ${id} not found`);
    policyStore[idx] = { ...policyStore[idx], ...data, updatedAt: new Date().toISOString() };
    return policyStore[idx];
  },

  // Versions
  getPolicyVersions: (policyId: string): PolicyVersion[] => getOrCreateVersions(policyId),

  createPolicyVersion: (policyId: string, config: any, changeLog: string): PolicyVersion => {
    const existing = getOrCreateVersions(policyId);
    const newVersion: PolicyVersion = {
      id: `VER-${policyId}-v${existing.length + 1}`,
      policyId,
      versionNumber: existing.length + 1,
      config,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: VersionStatus.DRAFT,
      changeLog,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    };
    if (!MOCK_VERSIONS[policyId]) MOCK_VERSIONS[policyId] = [...existing];
    MOCK_VERSIONS[policyId].unshift(newVersion);
    return newVersion;
  },

  submitForApproval: (_versionId: string): void => undefined,
  approveVersion: (_versionId: string): void => undefined,
  activateVersion: (_versionId: string): void => undefined,

  // Assignments
  getAssignments: (versionId: string): PolicyAssignment[] =>
    assignmentStore.filter(a => a.policyVersionId === versionId),

  createAssignment: (data: Partial<PolicyAssignment>): PolicyAssignment => {
    const a: PolicyAssignment = {
      id: `ASN-${Date.now()}`,
      policyVersionId: data.policyVersionId || '',
      companyId: data.companyId || 'company_123',
      branchId: data.branchId,
      departmentId: data.departmentId,
      designationId: data.designationId,
      employmentType: data.employmentType,
      template: data.template,
      employeeId: data.employeeId,
      priority: data.priority ?? 50,
      effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: data.effectiveTo,
    };
    assignmentStore.push(a);
    return a;
  },

  updateAssignment: (id: string, data: Partial<PolicyAssignment>): PolicyAssignment => {
    const idx = assignmentStore.findIndex(a => a.id === id);
    if (idx >= 0) assignmentStore[idx] = { ...assignmentStore[idx], ...data };
    return assignmentStore[idx >= 0 ? idx : 0];
  },

  deleteAssignment: (id: string): void => {
    const idx = assignmentStore.findIndex(a => a.id === id);
    if (idx >= 0) assignmentStore.splice(idx, 1);
  },

  checkConflicts: (_data: Partial<PolicyAssignment>): PolicyAssignment[] => [],

  // Evaluation
  evaluatePolicy: (request: PolicyEvaluationRequest): PolicyEvaluationResponse =>
    mockEvaluate(request),

  previewPolicy: (
    _versionId: string,
    employeeId: string,
    action: string,
    context: any,
  ): PolicyEvaluationResponse => {
    const actionDomainMap: Record<string, string> = {
      APPLY_LEAVE: PolicyDomain.LEAVE,
      CANCEL_LEAVE: PolicyDomain.LEAVE,
      CHECK_BALANCE: PolicyDomain.LEAVE,
      MARK_ATTENDANCE: PolicyDomain.ATTENDANCE,
      REGULARIZE_ATTENDANCE: PolicyDomain.ATTENDANCE,
      REQUEST_OVERTIME: PolicyDomain.OVERTIME,
      CALCULATE_OVERTIME: PolicyDomain.OVERTIME,
      SUBMIT_EXPENSE: PolicyDomain.EXPENSE,
      APPROVE_EXPENSE: PolicyDomain.EXPENSE,
    };
    const domain = (actionDomainMap[action] || PolicyDomain.LEAVE) as any;
    return mockEvaluate({
      employeeId,
      domain,
      action,
      effectiveDate: new Date().toISOString().split('T')[0],
      context,
    });
  },

  getEmployeePolicies: (_employeeId: string, _domain?: string): any[] => [],

  getEmployeeGroups: (): typeof MOCK_EMPLOYEE_GROUPS => MOCK_EMPLOYEE_GROUPS,

  // Employees (for EmployeeSelector)
  getEmployees: (companyId: string, search?: string): Employee[] => {
    let list = MOCK_EMPLOYEES.filter(e => e.companyId === companyId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q),
      );
    }
    return list;
  },
};

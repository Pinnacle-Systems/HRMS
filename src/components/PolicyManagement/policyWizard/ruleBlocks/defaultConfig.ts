import type { PolicyConfig, RuleBlock } from '../../../../types/policy';

type RuleBlockCode = RuleBlock['ruleBlockCode'];

const ruleBlockDefaults: Partial<Record<RuleBlockCode, Record<string, unknown>>> = {
  LEAVE_ENTITLEMENTS: {
    entitlements: [{
      allowedDuringProbation: false,
      encashable: false,
      carryForwardUnused: false,
      enableProRata: false,
    }],
  },
  ACCRUAL_RULES: {
    accrualRules: {
      accrualFrequency: 'MONTHLY',
      leaveYearStartMonth: 4,
      enableProRata: false,
      carryForwardUnused: false,
    },
  },
  CARRY_FORWARD: {
    carryForward: { maxDays: 30, validUntilMonths: 3 },
  },
  SANDWICH_RULE: {
    sandwichRule: { enabled: false },
  },
  OVERTIME_RULES: {
    overtimeRules: {
      maxHoursPerDay: 4,
      maxHoursPerMonth: 50,
      compensationType: 'PAY',
      requiresManagerApproval: false,
      includeBreakTime: false,
      configs: [],
    },
  },
  SHIFT_RULES: {
    shiftConfig: {
      latePenaltyAfterMinutes: 30,
      halfDayMinutes: 240,
      fullDayMinutes: 480,
      regularizationAllowedPerMonth: 3,
      biometricRequired: false,
      wfhAllowed: false,
      mobileCheckInAllowed: false,
    },
    penalties: { absentDeductionPerDay: 1, lwpAfterDays: 3 },
  },
  ONBOARDING_RULES: {
    probationDuration: 90,
    trainingRequired: false,
    mentorAssigned: false,
    backgroundVerificationRequired: false,
    buddySystemEnabled: false,
    inductionDurationDays: 7,
    onboardingTasks: [],
  },
  OFFBOARDING_RULES: {
    fullAndFinalSettlementDays: 45,
    exitInterviewRequired: false,
    assetReturnRequired: false,
    experienceLetterProvided: false,
    relievingLetterProvided: false,
    knowledgeTransferRequired: false,
    knowledgeTransferDays: 7,
    rehireEligibility: 'CASE_BY_CASE',
    clearanceChecklist: [],
  },
  EXPENSE_LIMITS: {
    expenseLimits: {},
    settlementDays: 7,
    advanceAllowed: false,
    maxAdvanceAmount: 0,
    perDiemAllowed: false,
    perDiemAmount: 0,
  },
  PAYROLL_RULES: {
    payrollComponents: {
      basic: { percentage: 40, of: 'CTC' },
      hra: { percentage: 40, of: 'BASIC', cityType: 'METRO' },
    },
  },
  STATUTORY_DEDUCTIONS: {
    pf: { employeeContribution: 12, employerContribution: 12, ceiling: 15000 },
    esi: { employeeContribution: 0.75, employerContribution: 3.25, applicableBelowCTC: 21000 },
    professionalTax: { applicable: false },
    gratuity: { eligibleAfterYears: 5, rate: 15 },
  },
  TAX_DEDUCTIONS: {
    tds: { applicable: false, regime: 'NEW', declarationRequired: false },
  },
  PROBATION_RULES: {
    probationDuration: 90,
    salaryPercentageDuringProbation: 100,
    benefitsEligible: false,
    performanceReviewRequired: false,
    extensionAllowed: false,
    maxExtensionDays: 90,
  },
  NOTICE_PERIOD_RULES: {
    noticeDays: { DEFAULT: 30, MANAGER: 60 },
    noticeDuringProbation: 7,
    buyOutAllowed: false,
    gardenLeaveAllowed: false,
  },
  COMP_OFF_RULES: {
    compOffValidityDays: 90,
    minOTHoursForCompOff: 4,
    maxCompOffBalance: 5,
    requiresManagerApproval: false,
    autoExpireUnused: false,
  },
  WFH_RULES: {
    wfhDaysPerMonth: 8,
    advanceNoticeDays: 1,
    requiresManagerApproval: false,
    geofencingEnabled: false,
    eligibleAfterProbation: false,
    allowedDuringProbation: false,
  },
  HOLIDAY_RULES: {
    holidayTypes: ['NATIONAL', 'STATE', 'COMPANY'],
    optionalHolidayQuota: 2,
    workOnHolidayAllowed: false,
  },
  ALLOWANCE_RULES: {
    allowances: [],
  },
  BONUS_RULES: {
    bonusRules: {
      budgetCapPercentage: 15,
      requiresManagerApproval: false,
      requiresHRApproval: false,
      bonusTypes: [{
        performanceLinked: false,
        prorationApplicable: false,
        taxable: false,
        eligibilityMonths: 6,
        clawbackPeriodMonths: 0,
        minPerformanceRating: 3,
      }],
    },
  },
  LOAN_ADVANCE_RULES: {
    loanAdvanceRules: {
      approvalMatrix: {
        deductionFromSalary: false,
        requiresManagerApproval: false,
        requiresHRApproval: false,
        requiresFinanceApproval: false,
      },
      loanTypes: [{
        interestRate: 0,
        maxRepaymentMonths: 12,
        maxEMIPercentage: 40,
        minServiceMonths: 6,
        maxActiveLoans: 1,
        collateralRequired: false,
        preClosureAllowed: false,
      }],
      repaymentRecoveryRules: {
        emiSkipRequest: {
          allowed: false,
          maxSkipsPerYear: 2,
          skipReasons: [],
          recoveryMethod: 'TENOR_EXTENSION',
          requiresApproval: true,
        },
        earlyClosure: { allowed: true, processingFeePercentage: 2 },
      },
      overlappingLoanPolicy: {
        allowConcurrentLoans: true,
        maxTotalDeductionPercentage: 50,
        pendingArrearHandling: 'REJECT',
        maxActiveLoansCombined: 3,
      },
    },
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeDefaults = (value: unknown, defaults: unknown): unknown => {
  if (isRecord(defaults)) {
    const current = isRecord(value) ? value : {};
    let merged = current;

    for (const [key, defaultValue] of Object.entries(defaults)) {
      const nextValue = mergeDefaults(current[key], defaultValue);
      if (nextValue !== current[key]) {
        if (merged === current) merged = { ...current };
        merged[key] = nextValue;
      }
    }

    return merged;
  }

  if (Array.isArray(defaults)) {
    const objectDefaults = defaults.find(isRecord);
    if (objectDefaults) {
      if (!Array.isArray(value)) return [];
      let changed = false;
      const merged = value.map((item) => {
        if (!isRecord(item)) return item;
        const nextItem = mergeDefaults(item, objectDefaults);
        changed ||= nextItem !== item;
        return nextItem;
      });
      return changed ? merged : value;
    }

    return value === null || value === undefined ? defaults : value;
  }

  if (value === null || value === undefined || (typeof defaults === 'string' && value === '')) {
    return defaults;
  }

  return value;
};

export const withRuleBlockDefaults = (
  config: PolicyConfig | Record<string, unknown> | null | undefined,
  ruleBlocks: ReadonlyArray<Pick<RuleBlock, 'ruleBlockCode'>>,
): PolicyConfig => {
  let result: unknown = config ?? {};

  for (const { ruleBlockCode } of ruleBlocks) {
    const defaults = ruleBlockDefaults[ruleBlockCode];
    if (defaults) result = mergeDefaults(result, defaults);
  }

  return result as PolicyConfig;
};

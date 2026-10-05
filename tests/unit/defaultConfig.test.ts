import { describe, expect, it } from 'vitest';
import { withRuleBlockDefaults } from '../../src/components/PolicyManagement/policyWizard/ruleBlocks/defaultConfig';

describe('withRuleBlockDefaults', () => {
  it('includes displayed probation defaults without adding unrelated rule blocks', () => {
    const config = withRuleBlockDefaults({}, [{ ruleBlockCode: 'PROBATION_RULES' }]);

    expect(config).toMatchObject({
      probationDuration: 90,
      salaryPercentageDuringProbation: 100,
      benefitsEligible: false,
      performanceReviewRequired: false,
      extensionAllowed: false,
      maxExtensionDays: 90,
    });
    expect(config.shiftConfig).toBeUndefined();
  });

  it('preserves configured values while filling missing nested rule defaults', () => {
    const existingConfig = {
      pf: { employeeContribution: 10 },
      esi: { applicableBelowCTC: 18000 },
    };
    const config = withRuleBlockDefaults(existingConfig, [
      { ruleBlockCode: 'STATUTORY_DEDUCTIONS' },
    ]);

    expect(config.pf).toEqual({
      employeeContribution: 10,
      employerContribution: 12,
      ceiling: 15000,
    });
    expect(config.esi).toEqual({
      employeeContribution: 0.75,
      employerContribution: 3.25,
      applicableBelowCTC: 18000,
    });
    expect(existingConfig).toEqual({
      pf: { employeeContribution: 10 },
      esi: { applicableBelowCTC: 18000 },
    });
  });

  it('materializes visible defaults for every configured block without replacing arrays', () => {
    const codes = [
      'LEAVE_ENTITLEMENTS',
      'ACCRUAL_RULES',
      'CARRY_FORWARD',
      'SANDWICH_RULE',
      'OVERTIME_RULES',
      'SHIFT_RULES',
      'EXPENSE_LIMITS',
      'PAYROLL_RULES',
      'STATUTORY_DEDUCTIONS',
      'TAX_DEDUCTIONS',
      'PROBATION_RULES',
      'NOTICE_PERIOD_RULES',
      'HOLIDAY_RULES',
      'ALLOWANCE_RULES',
      'COMP_OFF_RULES',
      'WFH_RULES',
      'ONBOARDING_RULES',
      'OFFBOARDING_RULES',
      'BONUS_RULES',
      'LOAN_ADVANCE_RULES',
    ] as const;
    const configuredRows = [{ maxHoursPerDay: 2 }];
    const config = withRuleBlockDefaults(
      { overtimeRules: { configs: configuredRows } },
      codes.map((ruleBlockCode) => ({ ruleBlockCode })),
    );

    expect(config).toMatchObject({
      carryForward: { maxDays: 30, validUntilMonths: 3 },
      sandwichRule: { enabled: false },
      overtimeRules: {
        maxHoursPerDay: 2,
        maxHoursPerMonth: 50,
        compensationType: 'PAY',
      },
      noticeDays: { DEFAULT: 30, MANAGER: 60 },
      holidayTypes: ['NATIONAL', 'STATE', 'COMPANY'],
      loanAdvanceRules: {
        repaymentRecoveryRules: {
          emiSkipRequest: { maxSkipsPerYear: 2, requiresApproval: true },
          earlyClosure: { allowed: true, processingFeePercentage: 2 },
        },
      },
    });
    expect(config.overtimeRules?.configs).toBe(configuredRows);
  });
});

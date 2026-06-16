import type { PolicyConfig } from '../../../../types/policy';

// Shared prop contract for every extracted rule-block component. `localConfig`
// is the full in-progress PolicyConfig and `set` is the deep-path setter that
// lives in Step2ConfigureRules (handles dotted paths like 'pf.employeeContribution').
export interface RuleBlockProps {
  localConfig: PolicyConfig;
  set: (path: string, value: any) => void;
}

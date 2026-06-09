import type { FilterConfig, FilterRule } from '../types/filter';

export const evaluateRule = (
  item: any,
  rule: FilterRule,
  fieldMap: Record<string, string> = {}
): boolean => {
  const fieldValue = item[fieldMap[rule.field] ?? rule.field];
  const ruleValue = rule.value;
  const safeFieldValue = fieldValue ?? '';
  const safeRuleValue = ruleValue ?? '';

  switch (rule.operator) {
    case 'equals':
      return String(safeFieldValue).toLowerCase() === String(safeRuleValue).toLowerCase();
    case 'notEquals':
      return String(safeFieldValue).toLowerCase() !== String(safeRuleValue).toLowerCase();
    case 'contains':
      return String(safeFieldValue).toLowerCase().includes(String(safeRuleValue).toLowerCase());
    case 'notContains':
      return !String(safeFieldValue).toLowerCase().includes(String(safeRuleValue).toLowerCase());
    case 'startsWith':
      return String(safeFieldValue).toLowerCase().startsWith(String(safeRuleValue).toLowerCase());
    case 'endsWith':
      return String(safeFieldValue).toLowerCase().endsWith(String(safeRuleValue).toLowerCase());
    case 'greaterThan':
      return new Date(safeFieldValue) > new Date(safeRuleValue);
    case 'greaterThanOrEqual':
      return new Date(safeFieldValue) >= new Date(safeRuleValue);
    case 'lessThan':
      return new Date(safeFieldValue) < new Date(safeRuleValue);
    case 'lessThanOrEqual':
      return new Date(safeFieldValue) <= new Date(safeRuleValue);
    case 'between':
      return (
        new Date(safeFieldValue) >= new Date(safeRuleValue) &&
        new Date(safeFieldValue) <= new Date(rule.value2)
      );
    case 'in':
      return Array.isArray(safeRuleValue) && safeRuleValue.includes(safeFieldValue);
    case 'notIn':
      return Array.isArray(safeRuleValue) && !safeRuleValue.includes(safeFieldValue);
    case 'isEmpty':
      return (
        !safeFieldValue ||
        safeFieldValue === '' ||
        (Array.isArray(safeFieldValue) && safeFieldValue.length === 0)
      );
    case 'isNotEmpty':
      return !!(
        safeFieldValue &&
        safeFieldValue !== '' &&
        (!Array.isArray(safeFieldValue) || safeFieldValue.length > 0)
      );
    default:
      return true;
  }
};

export const applyFiltersToData = <T>(
  data: T[],
  filters: FilterConfig,
  fieldMap: Record<string, string> = {}
): T[] => {
  if (!filters || filters.rules.length === 0) return data;
  return data.filter((item) => {
    const results = filters.rules.map((rule) => evaluateRule(item, rule, fieldMap));
    return filters.condition === 'AND' ? results.every(Boolean) : results.some(Boolean);
  });
};

// src/utils/formHelpers.ts

export const formatPolicyName = (name: string): string => {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '_')
    .toUpperCase();
};

export const validateEffectiveDate = (effectiveFrom: string, effectiveTo?: string): string | null => {
  const from = new Date(effectiveFrom);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (from < today) {
    return 'Effective from date cannot be in the past';
  }

  if (effectiveTo) {
    const to = new Date(effectiveTo);
    if (to <= from) {
      return 'Effective to date must be after effective from date';
    }
  }

  return null;
};

export const validateAssignmentPriority = (assignments: any[]): string | null => {
  const priorities = assignments.map(a => a.priority);
  const uniquePriorities = new Set(priorities);
  
  if (priorities.length !== uniquePriorities.size) {
    return 'Duplicate priority values found. Each assignment must have a unique priority.';
  }
  
  return null;
};

export const buildRuleDescription = (rule: any): string => {
  if (!rule.condition) return 'No condition configured';
  
  const { field, operator, value } = rule.condition;
  const operatorMap: Record<string, string> = {
    eq: 'equals',
    neq: 'does not equal',
    gt: 'is greater than',
    gte: 'is greater than or equal to',
    lt: 'is less than',
    lte: 'is less than or equal to',
    in: 'is in',
    notIn: 'is not in',
    between: 'is between',
  };
  
  const operatorText = operatorMap[operator] || operator;
  let valueText = Array.isArray(value) ? value.join(', ') : value;
  
  if (operator === 'between' && Array.isArray(value)) {
    valueText = `${value[0]} and ${value[1]}`;
  }
  
  return `When ${field} ${operatorText} ${valueText}`;
};
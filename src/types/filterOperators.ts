import type { FilterOperator } from './filter';

export const operatorLabels: Record<FilterOperator, string> = {
  equals: '= Equals',
  notEquals: '≠ Not Equals',
  contains: 'Contains',
  notContains: 'Does not contain',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  greaterThan: '> Greater than',
  greaterThanOrEqual: '≥ Greater than or equal',
  lessThan: '< Less than',
  lessThanOrEqual: '≤ Less than or equal',
  between: 'Between',
  in: 'In',
  notIn: 'Not in',
  isEmpty: 'Is empty',
  isNotEmpty: 'Is not empty',
};

export const getOperatorsForFieldType = (fieldType: string): FilterOperator[] => {
  const commonOperators: FilterOperator[] = ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'];
  
  const textOperators: FilterOperator[] = ['contains', 'notContains', 'startsWith', 'endsWith'];
  
  const numericOperators: FilterOperator[] = [
    'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between'
  ];
  
  const dateOperators: FilterOperator[] = [
    'equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 
    'lessThan', 'lessThanOrEqual', 'between', 'isEmpty', 'isNotEmpty'
  ];
  
  const selectOperators: FilterOperator[] = ['equals', 'notEquals', 'in', 'notIn', 'isEmpty', 'isNotEmpty'];
  
  const booleanOperators: FilterOperator[] = ['equals', 'isEmpty', 'isNotEmpty'];
  
  switch (fieldType) {
    case 'text':
      return [...commonOperators, ...textOperators];
    case 'number':
      return [...commonOperators, ...numericOperators];
    case 'date':
      return dateOperators;
    case 'boolean':
      return booleanOperators;
    case 'select':
    case 'multiSelect':
      return selectOperators;
    default:
      return commonOperators;
  }
};

export const getInputTypeForOperator = (operator: FilterOperator, fieldType: string): string => {
  if (operator === 'between') return 'range';
  if (operator === 'in' || operator === 'notIn') return 'multiSelect';
  if (fieldType === 'date') return 'date';
  if (fieldType === 'number') return 'number';
  if (fieldType === 'boolean') return 'boolean';
  return 'text';
};
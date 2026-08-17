import type { FilterFieldType, FilterOperator, FilterOperatorOption } from "./filter";

export const operatorLabels: Record<FilterOperator, string> = {
  equals: 'Equals',
  notEquals: 'Not Equals',
  contains: 'Contains',
  notContains: 'Not Contains',
  startsWith: 'Starts With',
  endsWith: 'Ends With',
  isEmpty: 'Is Empty',
  isNotEmpty: 'Is Not Empty',
  isNull: 'Is Null',
  isNotNull: 'Is Not Null',
  greaterThan: 'Greater Than',
  lessThan: 'Less Than',
  greaterThanOrEqual: 'Greater Than or Equal',
  lessThanOrEqual: 'Less Than or Equal',
  between: 'Between',
  in: 'In',
  notIn: 'Not In',
  before: 'Before',
  after: 'After',
  onOrBefore: 'On or Before',
  onOrAfter: 'On or After',
  true: 'True',
  false: 'False',
  yes: 'Yes',
  no: 'No',
};

export const FILTER_OPERATORS: FilterOperatorOption[] = [
  // Text operators
  { value: 'equals', label: 'Equals', requiresValue: true, applicableTypes: ['text', 'select', 'multiSelect'] },
  { value: 'notEquals', label: 'Not Equals', requiresValue: true, applicableTypes: ['text', 'select', 'multiSelect'] },
  { value: 'contains', label: 'Contains', requiresValue: true, applicableTypes: ['text', 'multiline'] },
  { value: 'notContains', label: 'Not Contains', requiresValue: true, applicableTypes: ['text', 'multiline'] },
  { value: 'startsWith', label: 'Starts With', requiresValue: true, applicableTypes: ['text'] },
  { value: 'endsWith', label: 'Ends With', requiresValue: true, applicableTypes: ['text'] },
  
  // Empty/Null operators
  { value: 'isEmpty', label: 'Is Empty', requiresValue: false, applicableTypes: ['text', 'number', 'date', 'multiline'] },
  { value: 'isNotEmpty', label: 'Is Not Empty', requiresValue: false, applicableTypes: ['text', 'number', 'date', 'multiline'] },
  { value: 'isNull', label: 'Is Null', requiresValue: false, applicableTypes: ['text', 'number', 'date', 'select', 'multiSelect', 'boolean'] },
  { value: 'isNotNull', label: 'Is Not Null', requiresValue: false, applicableTypes: ['text', 'number', 'date', 'select', 'multiSelect', 'boolean'] },
  
  // Number operators
  { value: 'greaterThan', label: 'Greater Than', requiresValue: true, applicableTypes: ['number'] },
  { value: 'lessThan', label: 'Less Than', requiresValue: true, applicableTypes: ['number'] },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal', requiresValue: true, applicableTypes: ['number'] },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal', requiresValue: true, applicableTypes: ['number'] },
  { value: 'between', label: 'Between', requiresValue: true, requiresSecondValue: true, applicableTypes: ['number', 'date'] },
  
  // Date operators
  { value: 'before', label: 'Before', requiresValue: true, applicableTypes: ['date'] },
  { value: 'after', label: 'After', requiresValue: true, applicableTypes: ['date'] },
  { value: 'onOrBefore', label: 'On or Before', requiresValue: true, applicableTypes: ['date'] },
  { value: 'onOrAfter', label: 'On or After', requiresValue: true, applicableTypes: ['date'] },
  
  // List operators
  { value: 'in', label: 'In', requiresValue: true, applicableTypes: ['select', 'multiSelect', 'text'] },
  { value: 'notIn', label: 'Not In', requiresValue: true, applicableTypes: ['select', 'multiSelect', 'text'] },
  
  // Boolean operators (no value needed)
  { value: 'true', label: 'True', requiresValue: false, applicableTypes: ['boolean'] },
  { value: 'false', label: 'False', requiresValue: false, applicableTypes: ['boolean'] },
  { value: 'yes', label: 'Yes', requiresValue: false, applicableTypes: ['boolean'] },
  { value: 'no', label: 'No', requiresValue: false, applicableTypes: ['boolean'] },
];

export const getOperatorsForFieldType = (type: FilterFieldType): FilterOperator[] => {
  return FILTER_OPERATORS
    .filter(op => op.applicableTypes.includes(type))
    .map(op => op.value);
};

export const getOperatorRequiresValue = (operator: FilterOperator): boolean => {
  return FILTER_OPERATORS.find(op => op.value === operator)?.requiresValue ?? true;
};

export const getOperatorRequiresSecondValue = (operator: FilterOperator): boolean => {
  return FILTER_OPERATORS.find(op => op.value === operator)?.requiresSecondValue ?? false;
};

export const getOperatorLabel = (operator: FilterOperator): string => {
  return operatorLabels[operator] || operator;
};
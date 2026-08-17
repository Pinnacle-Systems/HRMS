export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains' 
  | 'startsWith' 
  | 'endsWith'
  | 'isEmpty' 
  | 'isNotEmpty' 
  | 'isNull' 
  | 'isNotNull'
  | 'greaterThan' 
  | 'lessThan' 
  | 'greaterThanOrEqual' 
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'before'
  | 'after'
  | 'onOrBefore'
  | 'onOrAfter'
  | 'true'
  | 'false'
  | 'yes'
  | 'no';

export type FilterFieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'multiSelect'
  | 'boolean' 
  | 'user' 
  | 'master-select'
  | 'multiline';

export interface FilterOption {
  value: string | number | boolean;
  label: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: FilterOption[];
  categoryKey?: string;
  isPolicy?: boolean;
  key1?: string;
  key2?: string;
  disabled?: boolean;
  multiline?: boolean;
  full?: boolean;
  group?: string;
  required?: boolean;
}

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any;
}

export interface FilterCondition {
  condition: 'AND' | 'OR';
  rules: FilterRule[];
}

export interface FilterConfig {
  condition: 'AND' | 'OR';
  rules: FilterRule[];
}

export interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterConfig) => void;
  fields: FilterField[];
  initialFilters?: FilterConfig;
  title?: string;
}

export interface FilterOperatorOption {
  value: FilterOperator;
  label: string;
  requiresValue: boolean;
  requiresSecondValue?: boolean;
  applicableTypes: FilterFieldType[];
}
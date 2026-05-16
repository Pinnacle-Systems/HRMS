export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains' 
  | 'startsWith' 
  | 'endsWith'
  | 'greaterThan' 
  | 'greaterThanOrEqual' 
  | 'lessThan' 
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

export type FilterCondition = 'AND' | 'OR';

export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiSelect';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For between operator
}

export interface FilterConfig {
  condition: FilterCondition;
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
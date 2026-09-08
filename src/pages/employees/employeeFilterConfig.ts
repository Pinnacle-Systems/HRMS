import type { Category } from '../../services/modules/shifts';
import type { FilterConfig, FilterField } from '../../types';
import type { Branches, Department, Designation } from './type';
import type { EmployeeSummaryResponse } from '../../services/modules/employees';

export const EMPLOYEE_FIELD_GROUPS = {
  BASIC_INFO: 'Basic Information',
  CONTACT: 'Contact Information',
  EMPLOYMENT: 'Employment Details',
  PERSONAL: 'Personal Details',
  FINANCIAL: 'Financial & Statutory',
  SYSTEM: 'System Fields',
};

// Helper to create field with group
// const createField = (
//   id: string,
//   label: string,
//   type: FilterField['type'],
//   options?: FilterField['options'],
//   group: string = EMPLOYEE_FIELD_GROUPS.BASIC_INFO,
//   extra?: Partial<FilterField>
// ): FilterField => ({
//   id,
//   label,
//   type,
//   group,
//   options: options || [],
//   ...extra,
// });

// Get all filter fields from your const.ts
export const getEmployeeFilterFields = (
  departments: Department[],
  designations: Designation[],
  branches: Branches[],
  empStatus: Category[],
  employeeTypes: Category[] = [],
  employees: EmployeeSummaryResponse[] = [],
): FilterField[] => {
  const employeeOptions = employees
    .filter((employee) => employee.id || employee.employeeId)
    .map((employee) => ({
      value: employee.id || employee.employeeId || '',
      label: `${employee.name || employee.employeeId || 'Employee'}${employee.employeeId ? ` (${employee.employeeId})` : ''}`,
    }));

  const employmentFields: FilterField[] = [
    { id: 'search', label: 'Employee Search', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'joiningDate', label: 'Joining Date', type: 'date', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { 
      id: 'dept', 
      label: 'Department', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: departments.map(d => ({ value: d.id, label: d.departmentName }))
    },
    { 
      id: 'designationId', 
      label: 'Designation', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: designations.map(d => ({ value: d.id, label: d.name }))
    },
    { 
      id: 'branch', 
      label: 'Branch', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: branches.map(b => ({ value: b.id, label: b.branchName }))
    },
    { 
      id: 'managerId', 
      label: 'Reporting Manager', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: employeeOptions
    },
    { 
      id: 'assignedHrId', 
      label: 'Assigned HR', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: employeeOptions
    },
    { 
      id: 'empTypeId', 
      label: 'Employee Type', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: employeeTypes.map(type => ({ value: type.id, label: type.name }))
    },
    { 
      id: 'employeeStatusId', 
      label: 'Employee Status', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: empStatus.map(s => ({ value: s.id, label: s.name }))
    },
    { id: 'includeInactive', label: 'Include Inactive', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.SYSTEM },
  ];
  return employmentFields;
};

/**
 * Build server params from filters - Maps to the API parameters
 * Based on the server API documentation:
 * - search: case-insensitive contains across name / employeeId / emailAddress / firstName / lastName / mobileNumber
 * - dept, branch, designationId, empTypeId, employeeStatusId, managerId, assignedHrId: UUID exact match
 * - joinedFrom, joinedTo: ISO-8601 dates (yyyy-MM-dd) inclusive on joiningDate
 * - includeInactive: defaults to false
 */
// Build server params from filters
export const buildEmployeeServerFilterParams = (
  filters: FilterConfig | null
): Record<string, any> => {
  
  if (!filters?.rules?.length) {
    return {};
  }

  const params: Record<string, any> = {};

  filters.rules.forEach((rule, _index) => {
    
    const operator = rule.operator;
    const field = rule.field;
    const value = rule.value;
    const value2 = rule.value2;

    // Skip empty values
    if (value === undefined || value === null || value === '') {
      return;
    }

    switch (operator) {
      // ===== TEXT OPERATORS =====
      case 'equals':
        // For fields that support exact match
        if (field === 'joiningDate') {
          params.joinedFrom = value;
          params.joinedTo = value;
        } else {
          params[field] = value;
        }
        break;

      case 'contains':
        // For search across multiple fields, use the search parameter
        params.search = value;
        break;

      case 'notContains':
        params[`${field}NotContains`] = value;
        break;

      case 'startsWith':
        params[`${field}StartsWith`] = value;
        break;

      case 'endsWith':
        params[`${field}EndsWith`] = value;
        break;

      // ===== NOT EQUALS =====
      case 'notEquals':
        params[`${field}Ne`] = value;
        break;

      // ===== NULL/EMPTY OPERATORS =====
      case 'isEmpty':
        params[`${field}IsEmpty`] = true;
        break;

      case 'isNotEmpty':
        params[`${field}IsNotEmpty`] = true;
        break;

      case 'isNull':
        params[`${field}IsNull`] = true;
        break;

      case 'isNotNull':
        params[`${field}IsNotNull`] = true;
        break;

      // ===== COMPARISON OPERATORS =====
      case 'greaterThan':
        if (field === 'joiningDate') {
          params.joinedFrom = value;
        } else {
          params[`${field}Gt`] = Number(value);
        }
        break;

      case 'lessThan':
        if (field === 'joiningDate') {
          params.joinedTo = value;
        } else {
          params[`${field}Lt`] = Number(value);
        }
        break;

      case 'greaterThanOrEqual':
        if (field === 'joiningDate') {
          params.joinedFrom = value;
        } else {
          params[`${field}Gte`] = Number(value);
        }
        break;

      case 'lessThanOrEqual':
        if (field === 'joiningDate') {
          params.joinedTo = value;
        } else {
          params[`${field}Lte`] = Number(value);
        }
        break;

      // ===== DATE OPERATORS =====
      case 'before':
        if (field === 'joiningDate') {
          params.joinedTo = value;
        } else {
          params[`${field}Before`] = value;
        }
        break;

      case 'after':
        if (field === 'joiningDate') {
          params.joinedFrom = value;
        } else {
          params[`${field}After`] = value;
        }
        break;

      case 'onOrBefore':
        if (field === 'joiningDate') {
          params.joinedTo = value;
        } else {
          params[`${field}OnOrBefore`] = value;
        }
        break;

      case 'onOrAfter':
        if (field === 'joiningDate') {
          params.joinedFrom = value;
        } else {
          params[`${field}OnOrAfter`] = value;
        }
        break;

      case 'between':
        if (field === 'joiningDate') {
          params.joinedFrom = value;
          params.joinedTo = value2;
        } else {
          params[`${field}Between`] = [value, value2];
        }
        break;

      // ===== LIST OPERATORS =====
      case 'in':
        params[`${field}In`] = Array.isArray(value) ? value : [value];
        break;

      case 'notIn':
        params[`${field}NotIn`] = Array.isArray(value) ? value : [value];
        break;

      // ===== BOOLEAN OPERATORS =====
      case 'true':
      case 'yes':
        if (field === 'includeInactive') {
          params.includeInactive = true;
        } else {
          params[field] = true;
        }
        break;

      case 'false':
      case 'no':
        if (field === 'includeInactive') {
          params.includeInactive = false;
        } else {
          params[field] = false;
        }
        break;

      default:
        params[field] = value;
    }
  });

  return params;
};

// Check if filters can be applied on server
export const isEmployeeServerSupportedFilter = (
  filters: FilterConfig | null
): boolean => {
  if (!filters?.rules.length) return true;
  // All operators are now server-supported
  return true;
};

// Map field IDs to API parameter names where they differ
export const EMPLOYEE_FIELD_MAP: Record<string, string> = {
  dept: 'dept',
  branch: 'branch',
  joinedFrom: 'joiningDate',
};

// Server supported simple fields for client-side fallback
export const SERVER_SIMPLE_FIELDS = [
  'dept',
  'branch',
  'designationId',
  'employeeStatusId',
  'managerId',
  'assignedHrId',
  'empTypeId',
  'employeeId',
  'name',
  'emailAddress',
  'mobileNumber',
  'firstName',
  'lastName',
  'isActive',
  'joiningDate',
];
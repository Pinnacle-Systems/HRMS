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
  employeeTypes: Category[] = [],
  employees: EmployeeSummaryResponse[] = [],
  employeeGroups: Category[] = [],
  shiftCommonTemplates: Category[] = [],
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
      id: 'employeeGroupId',
      label: 'Employee Group',
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: employeeGroups.map(group => ({ value: group.id, label: group.name })),
    },
    {
      id: 'templateId',
      label: 'Shift Common Template',
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: shiftCommonTemplates.map(template => ({ value: template.id, label: template.name })),
    },
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
    // { 
    //   id: 'employeeStatusId', 
    //   label: 'Employee Status', 
    //   type: 'select',
    //   group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
    //   options: empStatus.map(s => ({ value: s.id, label: s.name }))
    // },
    { id: 'active', label: 'Active', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.SYSTEM },
  ];
  return employmentFields;
};

export const serializeEmployeeFilters = (
  filters: FilterConfig | null,
): string | undefined => {
  if (!filters?.rules.length) return undefined;

  const fieldAliases: Record<string, string> = {
    employeeGroupId: "employeeGroup",
    templateId: "template",
    dept: "department",
    designationId: "designation",
    managerId: "manager",
    assignedHrId: "assignedHr",
    empTypeId: "employeeType",
  };

  return JSON.stringify(
    filters.rules.map(({ field, operator, value, value2 }) => {
      const isBooleanOperator = ["true", "yes", "false", "no"].includes(operator);

      return {
        field: fieldAliases[field] ?? field,
        operator: isBooleanOperator ? "equals" : operator,
        value: isBooleanOperator
          ? operator === "true" || operator === "yes"
          : operator === "between"
            ? [value, value2]
            : value === undefined || value === ""
              ? null
              : value,
      };
    }),
  );
};

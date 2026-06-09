import type { FilterField, FilterConfig } from '../../types/filter';
import type { Department, Designation, Branches } from './type';
import type { EmployeeListQuery } from '../../services/modules/employees';
import type { Category } from '../../services/modules/shifts';

// Maps filter field ids to actual Employee object keys where they differ
export const EMPLOYEE_FIELD_MAP: Record<string, string> = {
  dept: 'department',
  joinedFrom: 'joiningDate',
};

export const getEmployeeFilterFields = (
  departments: Department[],
  designations: Designation[],
  branches: Branches[],
  empStatus: Category[]
): FilterField[] => [
  {
    id: 'employeeId',
    label: 'Employee ID',
    type: 'text',
    placeholder: 'Enter employee ID',
  },
  {
    id: 'name',
    label: 'Employee Name',
    type: 'text',
    placeholder: 'Enter employee name',
  },
  {
    id: 'emailAddress',
    label: 'Email Address',
    type: 'text',
    placeholder: 'Enter email address',
  },
  {
    id: 'mobileNumber',
    label: 'Mobile Number',
    type: 'text',
    placeholder: 'Enter mobile number',
  },
  {
    id: 'designationId',
    label: 'Designation',
    type: 'select',
    options: designations.map((d) => ({ value: d.id, label: d.name })),
  },
  {
    id: 'dept',
    label: 'Department',
    type: 'select',
    options: departments.map((d) => ({ value: d.id, label: d.departmentName })),
  },
  {
    id: 'branch',
    label: 'Branch',
    type: 'select',
    options: branches.map((b) => ({ value: b.id, label: b.branchName })),
  },
  {
    id: 'joinedFrom',
    label: 'Joining Date',
    type: 'date',
  },
  {
    id: 'employeeStatusId',
    label: 'Employee Status',
    type: 'select',
    options: empStatus.map((b) => ({ value: b.id, label: b.name })),
  },
  {
    id: 'isActive',
    label: 'Is Active',
    type: 'boolean',
  },
  {
    id: 'relievedDate',
    label: 'Relieved Date',
    type: 'date',
  },
  {
    id: 'deactivatedAt',
    label: 'Deactivated Date',
    type: 'date',
  },
  {
    id: 'createdAt',
    label: 'Created Date',
    type: 'date',
  },
];

const SERVER_SIMPLE_FIELDS = [
  'dept',
  'branch',
  'designationId',
  'employeeStatusId',
  'managerId',
  'employeeId',
  'name',
  'emailAddress',
  'mobileNumber',
];

export const buildEmployeeServerFilterParams = (
  filters: FilterConfig | null
): EmployeeListQuery => {
  if (!filters?.rules.length || filters.condition !== 'AND') return {};

  return filters.rules.reduce<EmployeeListQuery>((params, rule) => {
    if (rule.operator !== 'equals' && rule.operator !== 'between') return params;

    switch (rule.field) {
      case 'dept':
        params.dept = String(rule.value);
        break;
      case 'branch':
        params.branch = String(rule.value);
        break;
      case 'designationId':
        params.designationId = String(rule.value);
        break;
      case 'employeeStatusId':
        params.employeeStatusId = String(rule.value);
        break;
      case 'managerId':
        params.managerId = String(rule.value);
        break;
      case 'joinedFrom':
        if (rule.operator === 'between') {
          params.joinedFrom = String(rule.value);
          params.joinedTo = String(rule.value2);
        } else {
          params.joinedFrom = String(rule.value);
        }
        break;
      case 'employeeId':
      case 'name':
      case 'emailAddress':
      case 'mobileNumber':
        if (!params.search) params.search = String(rule.value);
        break;
    }

    return params;
  }, {});
};

export const isEmployeeServerSupportedFilter = (
  filters: FilterConfig | null
): boolean => {
  if (!filters?.rules.length) return true;
  if (filters.condition !== 'AND') return false;

  return filters.rules.every(
    (rule) =>
      (SERVER_SIMPLE_FIELDS.includes(rule.field) && rule.operator === 'equals') ||
      (rule.field === 'joinedFrom' &&
        (rule.operator === 'equals' || rule.operator === 'between'))
  );
};

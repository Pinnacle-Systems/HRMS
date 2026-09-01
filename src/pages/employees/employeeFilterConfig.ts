import type { Category } from '../../services/modules/shifts';
import type { FilterConfig, FilterField } from '../../types';
import type { Branches, Department, Designation } from './type';

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
  empStatus: Category[]
): FilterField[] => {
  // const allFields: FilterField[] = [];

  // ===== BASIC INFORMATION FIELDS =====
  const basicInfoFields: FilterField[] = [
    { id: 'firstName', label: 'First Name', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'lastName', label: 'Last Name', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'nickName', label: 'Nick Name', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { 
      id: 'gender', 
      label: 'Gender', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO,
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' },
      ]
    },
    { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'age', label: 'Age', type: 'number', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'birthday', label: 'Birthday', type: 'date', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'mobileNumber', label: 'Mobile Number', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'personalEmailAddress', label: 'Personal Email', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'emailAddress', label: 'Official Email', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { 
      id: 'bloodGroup', 
      label: 'Blood Group', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO,
      options: [
        { value: 'A+', label: 'A+' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B-', label: 'B-' },
        { value: 'AB+', label: 'AB+' },
        { value: 'AB-', label: 'AB-' },
        { value: 'O+', label: 'O+' },
        { value: 'O-', label: 'O-' },
      ]
    },
    { id: 'nationality', label: 'Nationality', type: 'select', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO, options: [] },
    { id: 'religion', label: 'Religion', type: 'select', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO, options: [] },
    { 
      id: 'maritalStatus', 
      label: 'Marital Status', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO,
      options: [
        { value: 'Single', label: 'Single' },
        { value: 'Married', label: 'Married' },
        { value: 'Divorced', label: 'Divorced' },
        { value: 'Widowed', label: 'Widowed' },
      ]
    },
    { id: 'marriageDate', label: 'Date of Marriage', type: 'date', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'spouseName', label: "Spouse's Name", type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'fathersName', label: "Father's Name", type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'height', label: 'Height (cm)', type: 'number', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'weight', label: 'Weight (kg)', type: 'number', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'identificationMark', label: 'Identification Mark', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'hobbies', label: 'Hobbies', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'languagesKnown', label: 'Languages', type: 'text', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'physicallyChallenged', label: 'Physically Challenged', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'internationalEmployee', label: 'International Employee', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO },
    { id: 'disabilityType', label: 'Disability Type', type: 'select', group: EMPLOYEE_FIELD_GROUPS.BASIC_INFO, options: [] },
  ];

  // ===== EMPLOYMENT DETAILS =====
  const employmentFields: FilterField[] = [
    { id: 'employeeId', label: 'Employee ID', type: 'text', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'name', label: 'Name', type: 'text', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'joiningDate', label: 'Joining Date', type: 'date', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'confirmationDate', label: 'Confirmation Date', type: 'date', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'probationPeriod', label: 'Probation Period (months)', type: 'number', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'noticePeriod', label: 'Notice Period (days)', type: 'number', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { 
      id: 'departmentId', 
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
      id: 'branchId', 
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
      options: []
    },
    { 
      id: 'assignedHrId', 
      label: 'Assigned HR', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: []
    },
    { 
      id: 'empType', 
      label: 'Employee Type', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: []
    },
    { 
      id: 'employeeStatusId', 
      label: 'Employee Status', 
      type: 'select',
      group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT,
      options: empStatus.map(s => ({ value: s.id, label: s.name }))
    },
    { id: 'referredBy', label: 'Referred By', type: 'text', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'adminRemarks', label: 'Remarks', type: 'multiline', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'idCardNo', label: 'ID Card Number', type: 'text', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'midNo', label: 'MID Number', type: 'number', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'oldIdNo', label: 'Old ID Number', type: 'text', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'hostel', label: 'Hostel Facility', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'vehicleFacility', label: 'Vehicle Facility', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'exService', label: 'Ex-Service Personnel', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'migrant', label: 'Migrant Worker', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'monthly', label: 'Monthly', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
    { id: 'relievedDate', label: 'Relieved Date', type: 'date', group: EMPLOYEE_FIELD_GROUPS.EMPLOYMENT },
  ];

  // ===== ELIGIBILITY/FINANCIAL FIELDS =====
  const financialFields: FilterField[] = [
    { id: 'pfEligible', label: 'PF Eligible', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.FINANCIAL },
    { id: 'excessEpfEligible', label: 'Excess EPF Eligible', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.FINANCIAL },
    { id: 'excessEpsEligible', label: 'Excess EPS Eligible', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.FINANCIAL },
    { id: 'existingEpsMember', label: 'Existing EPS Member', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.FINANCIAL },
    { id: 'esiEligible', label: 'ESI Eligible', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.FINANCIAL },
    { id: 'lwfCovered', label: 'LWF Covered', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.FINANCIAL },
    { id: 'otAmount', label: 'OT Amount', type: 'number', group: EMPLOYEE_FIELD_GROUPS.FINANCIAL },
  ];

  // ===== SYSTEM FIELDS =====
  const systemFields: FilterField[] = [
    { id: 'createdAt', label: 'Created Date', type: 'date', group: EMPLOYEE_FIELD_GROUPS.SYSTEM },
    { id: 'updatedAt', label: 'Last Updated', type: 'date', group: EMPLOYEE_FIELD_GROUPS.SYSTEM },
    { id: 'isActive', label: 'Is Active', type: 'boolean', group: EMPLOYEE_FIELD_GROUPS.SYSTEM },
    { id: 'deactivatedAt', label: 'Deactivated Date', type: 'date', group: EMPLOYEE_FIELD_GROUPS.SYSTEM },
  ];

  return [...basicInfoFields, ...employmentFields, ...financialFields, ...systemFields];
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
        if (['departmentId', 'designationId', 'branchId', 'managerId', 'assignedHrId', 'employeeStatusId', 'empType'].includes(field)) {
          // Map branchId to branch for API compatibility
          if (field === 'branchId') {
            params.branch = value;
          } else {
            params[field] = value;
          }
        } else {
          // For other fields, use the field name directly
          params[field] = value;
        }
        break;

      case 'contains':
        // For search across multiple fields, use the search parameter
        if (['name', 'employeeId', 'emailAddress', 'firstName', 'lastName', 'mobileNumber'].includes(field)) {
          params.search = value;
        } else {
          params[`${field}Contains`] = value;
        }
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
        if (field === 'isActive') {
          params.isActive = true;
        } else {
          params[field] = true;
        }
        break;

      case 'false':
      case 'no':
        if (field === 'isActive') {
          params.isActive = false;
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
  dept: 'department',
  branchId: 'branch',
  joinedFrom: 'joiningDate',
};

// Server supported simple fields for client-side fallback
export const SERVER_SIMPLE_FIELDS = [
  'departmentId',
  'branchId',
  'designationId',
  'employeeStatusId',
  'managerId',
  'assignedHrId',
  'empType',
  'employeeId',
  'name',
  'emailAddress',
  'mobileNumber',
  'firstName',
  'lastName',
  'isActive',
  'joiningDate',
];
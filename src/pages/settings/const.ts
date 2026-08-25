export type UserRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export const companyFieldsWithSections = [
  // Section 1: Basic Information
  { section: "Basic Information", isSection: true },
  {
    key: "companyName",
    label: "Company Name",
    type: "text",
    required: true,
    placeholder: "(e.g., VibeHR Solutions)",
  },
  {
    key: "aliasName",
    label: "Alias Name",
    type: "text",
    placeholder: "(e.g., VibeHR)",
  },
  {
    key: "code",
    label: "Company Code",
    type: "text",
    placeholder: "(e.g., VHR001)",
  },
  {
    key: "costCode",
    label: "Cost Code",
    type: "text",
    placeholder: "(e.g., CC2024001)",
  },
  {
    key: "companyType",
    label: "Company Type",
    type: "text",
    placeholder: "(e.g., Head Office)",
    disabled: true,
  },
  {
    key: "companyAddress",
    label: "Address",
    type: "text",
    required: true,
    multiline: true,
    rows: 4,
  },
  { key: "location", label: "Location", type: "map", multiline: true, rows: 4 },

  // Sub Section: Address Information
  {
    subSection: "Address Information",
    isSubSection: true,
    parentSection: "Basic Information",
  },
  {
    key: "countryId",
    label: "Country",
    type: "master-select",
    placeholder: "(e.g., India)",
  },
  {
    key: "stateId",
    label: "State",
    type: "master-select",
    placeholder: "(e.g., Maharashtra, Karnataka)",
  },
  {
    key: "cityId",
    label: "City",
    type: "master-select",
    placeholder: "(e.g., Mumbai, Delhi, Bangalore)",
  },
  {
    key: "pincode",
    label: "Pincode",
    type: "text",
    placeholder: "(e.g., 400001)",
  },
  {
    key: "phoneNo",
    label: "Phone Number",
    type: "text",
    required: true,
    placeholder: "(e.g., +91 9876543210)",
  },
  {
    key: "fax",
    label: "Fax Number",
    type: "text",
    placeholder: "(e.g., +91 22 12345678)",
  },
  {
    key: "email",
    label: "Email Address",
    type: "text",
    required: true,
    placeholder: "(e.g., company@example.com)",
  },
  //   { key: 'website', label: 'Website', type: 'text', placeholder: '(e.g., www.example.com)' },
  //   { key: 'twitterHandle', label: 'Twitter Handle', type: 'text', placeholder: '(e.g., @companyname)' },

  // Section 2: Tax Information
  { section: "Tax Information", isSection: true },
  {
    key: "gstNo",
    label: "GST Number",
    type: "text",
    required: true,
    placeholder: "22AAAAA1234F1ZO (15 characters)",
    // disabled: true,
  },
  {
    key: "panNo",
    label: "PAN Number",
    type: "text",
    placeholder: "AAAAA1234A (10 characters)",
  },
  {
    key: "tanNo",
    label: "TAN Number",
    type: "text",
    placeholder: "ABCD12345E (10 characters)",
  },
  {
    key: "tinNo",
    label: "TIN Number",
    type: "text",
    placeholder: "12345678901 (11 digits)",
  },
  {
    key: "cstNo",
    label: "CST Number",
    type: "text",
    placeholder: "CST/1234567890",
  },
  {
    key: "cstDate",
    label: "CST Date",
    type: "date",
    placeholder: "DD/MM/YYYY",
  },
  {
    key: "cin",
    label: "CIN Number",
    type: "text",
    placeholder: "U12345MH2024PLC123456 (21 characters)",
  },
  { key: "licenseNo", label: "License Number", type: "text" },
  {
    key: "registrationCertificateNo",
    label: "Registration Number",
    type: "text",
    placeholder: "ROC-1234567890",
  },
  {
    key: "pfNo",
    label: "PF Code",
    type: "text",
    placeholder: "MH/12345/1234 (15-20 characters)",
  },
  {
    key: "esiNo",
    label: "ESI Code",
    type: "text",
    placeholder: "12345678901234567 (17 digits)",
  },
  {
    key: "esicCode",
    label: "ESIC Code",
    type: "text",
    placeholder: "12345678901234567 (17 digits)",
  },
  {
    key: "linNo",
    label: "LIN Number",
    type: "text",
    placeholder: "LIN/MH/2024/12345",
  },
  {
    key: "estdCode",
    label: "ESTD Code",
    type: "text",
    placeholder: "ESTD-2024-001",
  },

  { section: "Contact Info", isSection: true },
  {
    key: "contactName",
    label: "Contact Name",
    type: "text",
    placeholder: "(e.g., John Doe)",
  },
  {
    key: "designation",
    label: "Designation",
    type: "text",
    placeholder: "(e.g., CEO)",
  },
  {
    key: "phone",
    label: "Phone Number",
    type: "text",
    placeholder: "(e.g.,  +91 9876543210)",
  },
  {
    key: "contactEmail",
    label: "Email Address",
    type: "text",
    placeholder: "(e.g., johndoe@example.com)",
  },
  {
    key: "linkedinUrl",
    label: "LinkedIn URL",
    type: "text",
    placeholder: "(e.g., https://linkedin.com/company/example)",
  },
  {
    key: "facebookUrl",
    label: "Facebook URL",
    type: "text",
    placeholder: "(e.g., https://facebook.com/example)",
  },
  {
    key: "instagramHandle",
    label: "Instagram Handle",
    type: "text",
    placeholder: "(e.g., @example_company)",
  },
  {
    key: "twitterHandle",
    label: "Twitter Handle",
    type: "text",
    placeholder: "(e.g., @example)",
  },
  {
    key: "website",
    label: "Website",
    type: "text",
    placeholder: "(e.g., www.example.com)",
  },
   {
    key: "currencyId",
    label: "Currency",
    type: "master-select",
    placeholder: "Select Currency",
    required: true,
  },

  // { section: "Payroll Settings", isSection: true },
  // {
  //   key: "payrollFrequency",
  //   label: "Payroll Frequency",
  //   type: "select",
  //   placeholder: "Select frequency",
  //   options: [
  //     { value: "MONTHLY", label: "Monthly" },
  //     { value: "BI_WEEKLY", label: "Bi-Weekly" },
  //     { value: "WEEKLY", label: "Weekly" },
  //     { value: "SEMI_MONTHLY", label: "Semi-Monthly" },
  //   ],
  // },
  // {
  //   key: "salaryPayDay",
  //   label: "Salary Pay Day",
  //   type: "number",
  //   placeholder: "(e.g., 31)",
  // },
  // {
  //   key: "fiscalYearStartMonth",
  //   label: "Fiscal Year Start Month",
  //   type: "select",
  //   placeholder: "Select month",
  //   options: [
  //     { value: 1, label: "January" },
  //     { value: 2, label: "February" },
  //     { value: 3, label: "March" },
  //     { value: 4, label: "April" },
  //     { value: 5, label: "May" },
  //     { value: 6, label: "June" },
  //     { value: 7, label: "July" },
  //     { value: 8, label: "August" },
  //     { value: 9, label: "September" },
  //     { value: 10, label: "October" },
  //     { value: 11, label: "November" },
  //     { value: 12, label: "December" },
  //   ],
  // },
  // {
  //   key: "currencyId",
  //   label: "Currency",
  //   type: "master-select",
  //   placeholder: "Select Currency",
  //   required: true,
  // },
  // {
  //   key: "signatoryName",
  //   label: "Signatory Name",
  //   type: "text",
  //   placeholder: "(e.g., Jane Smith)",
  // },
  // {
  //   key: "signatoryDesignation",
  //   label: "Signatory Designation",
  //   type: "text",
  //   placeholder: "(e.g., Director)",
  // },
];

// Separate file upload fields
export const fileUploadFields = [
  {
    key: "logoUrl",
    label: "Company Logo",
    accept: "image/jpeg,image/png,image/jpg,image/svg+xml",
    maxSize: 2,
    description: "Recommended size: 200x200px. Max size: 2MB",
  },
  {
    key: "signatureUrl",
    label: "Signature",
    accept: "image/jpeg,image/png,image/jpg",
    maxSize: 1,
    description: "Digital signature for documents. Max size: 1MB",
  },
];

// export const tabs = [
//   {
//     id: "general",
//     label: "General",
//     roles: ['ADMIN', 'HR', 'MANAGER'],
//     options: [
//       {
//         id: "company-settings",
//         label: "Company Settings",
//         path: "/settings/general/company-settings",
//         roles: ['ADMIN'],
//       },
//       {
//         id: "branch-settings",
//         label: "Branch Settings",
//         path: "/settings/general/branch-settings",
//         roles: ['ADMIN'],
//       },
//       {
//         id: "password-config",
//         label: "Password Config",
//         path: "/settings/general/password-config",
//         roles: ['ADMIN'],
//       },
//       {
//         id: "audit-logs",
//         label: "Audit Logs",
//         path: "/settings/general/audit-logs",
//         roles: ['ADMIN', 'HR', 'MANAGER'],
//       },
//     ],
//   },
//   {
//     id: "employee",
//     label: "Employee",
//     roles: ['ADMIN', 'HR'],
//     options: [
//       {
//         id: "onboarding-process",
//         label: "Onboarding Process",
//         path: "/settings/employee/onboarding-process",
//         roles: ['ADMIN', 'HR'],
//       },
//       {
//         id: "department-settings",
//         label: "Department Settings",
//         path: "/settings/employee/department-settings",
//         roles: ['ADMIN'],
//       },
//       {
//         id: "category-settings",
//         label: "Other Category",
//         path: "/settings/employee/category-settings",
//         roles: ['ADMIN'],
//       },
//     ],
//   },
//   {
//     id: "policy",
//     label: "Policy",
//     roles: ['ADMIN', 'HR'],
//     options: [
//       {
//         id: "allowance-components",
//         label: "Allowance Components",
//         path: "/settings/policy/allowance-components",
//         roles: ['ADMIN', 'HR'],
//       },
//       {
//         id: "deduction-components",
//         label: "Deduction Components",
//         path: "/settings/policy/deduction-components",
//         roles: ['ADMIN', 'HR'],
//       },
//       {
//         id: "expense-category",
//         label: "Expense Category",
//         path: "/settings/policy/expense-category",
//         roles: ['ADMIN', 'HR'],
//       },
//     ],
//   },
//   {
//     id: "payroll",
//     label: "Payroll",
//     options: [
//       {
//         id: "payroll-settings",
//         label: "Payroll Settings",
//         path: "/settings/payroll/payroll-settings",
//       },
//     ],
//   },
//   {
//     id: "income-tax",
//     label: "Income Tax",
//     options: [
//       {
//         id: "income-tax-settings",
//         label: "Income Tax Settings",
//         path: "/settings/income-tax/income-tax-settings",
//       },
//     ],
//   },
// ];

export const tabs = [
  {
    id: "general",
    label: "General",
    roles: ["ADMIN", "HR", "MANAGER"] as UserRole[],
    options: [
      {
        id: "company-settings",
        label: "Company Settings",
        path: "/settings/general/company-settings",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "branch-settings",
        label: "Branch Settings",
        path: "/settings/general/branch-settings",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "password-config",
        label: "Password Config",
        path: "/settings/general/password-config",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "audit-logs",
        label: "Audit Logs",
        path: "/settings/general/audit-logs",
        roles: ["ADMIN", "HR", "MANAGER"] as UserRole[],
      },
    ],
  },
  {
    id: "employee",
    label: "Employee",
    roles: ["ADMIN", "HR"] as UserRole[],
    options: [
      {
        id: "onboarding-process",
        label: "Onboarding Process",
        path: "/settings/employee/onboarding-process",
        roles: ["ADMIN", "HR"] as UserRole[],
      },
      {
        id: "department-settings",
        label: "Department Settings",
        path: "/settings/employee/department-settings",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "category-settings",
        label: "Other Category",
        path: "/settings/employee/category-settings",
        roles: ["ADMIN"] as UserRole[],
      },
    ],
  },
  {
    id: "policy",
    label: "Policy",
    roles: ["ADMIN", "HR"] as UserRole[],
    options: [
      {
        id: "allowance-components",
        label: "Allowance Components",
        path: "/settings/policy/allowance-components",
        roles: ["ADMIN", "HR"] as UserRole[],
      },
      {
        id: "deduction-components",
        label: "Deduction Components",
        path: "/settings/policy/deduction-components",
        roles: ["ADMIN", "HR"] as UserRole[],
      },
      {
        id: "expense-category",
        label: "Expense Category",
        path: "/settings/policy/expense-category",
        roles: ["ADMIN", "HR"] as UserRole[],
      },
    ],
  },
  {
    id: "payroll",
    label: "Payroll",
    roles: ["ADMIN"] as UserRole[],
    options: [
      {
        id: "payrol-settings",
        label: "Payroll Settings",
        path: "/settings/payroll/payroll-settings",
        roles: ["ADMIN"] as UserRole[],
      },
      // {
      //   id: "salary-components",
      //   label: "Salary Components",
      //   path: "/settings/payroll/payroll-settings/components",
      //   roles: ["ADMIN"] as UserRole[],
      // },
      {
        id: "allowances-config",
        label: "Allowances Configuration",
        path: "/settings/payroll/payroll-settings/allowances",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "deduction-rules",
        label: "Deduction Rules",
        path: "/settings/payroll/payroll-settings/deductions",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "tax-rules",
        label: "Tax Rules",
        path: "/settings/payroll/payroll-settings/tax",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "pf/esi-settings",
        label: "PF / ESI Settings",
        path: "/settings/payroll/payroll-settings/pf-esi",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "payroll-schedule",
        label: "Payroll Schedule",
        path: "/settings/payroll/payroll-settings/schedule",
        roles: ["ADMIN"] as UserRole[],
      },
      {
        id: "approval-workflow",
        label: "Approval Workflow",
        path: "/settings/payroll/payroll-settings/approval",
        roles: ["ADMIN"] as UserRole[],
      },
    ],
  },
  {
    id: "income-tax",
    label: "Income Tax",
    roles: ["ADMIN"] as UserRole[],
    options: [
      {
        id: "income-tax-settings",
        label: "Income Tax Settings",
        path: "/settings/income-tax/income-tax-settings",
        roles: ["ADMIN"] as UserRole[],
      },
    ],
  },
];

// Helper functions for role-based access
export const hasRoleAccess = (
  itemRoles: string[] | undefined,
  userRoles: string[],
): boolean => {
  if (!itemRoles || itemRoles.length === 0) return true;
  return itemRoles.some((role) =>
    userRoles.some((userRole) => userRole.toUpperCase() === role.toUpperCase()),
  );
};

export const getFilteredTabs = (userRoles: string[]) => {
  const normalizedRoles = userRoles.map((r) => r.toUpperCase());
  return tabs
    .filter((tab) => hasRoleAccess(tab.roles, normalizedRoles))
    .map((tab) => ({
      ...tab,
      options: tab.options.filter((option) =>
        hasRoleAccess(option.roles, normalizedRoles),
      ),
    }))
    .filter((tab) => tab.options.length > 0);
};

export const getCurrentRouteLabel = () => {
  const currentPath = location.pathname;
  for (const tab of tabs) {
    for (const option of tab.options) {
      if (currentPath === option.path) {
        return option.label;
      }
    }
  }
  return "Company Settings";
};

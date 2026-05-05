export const companyFieldsWithSections = [
  // Section 1: Basic Information
  { section: 'Basic Information', isSection: true },
  { key: 'companyName', label: 'Company Name', type: 'text', required:true, multiline: true, placeholder: '(e.g., VibeHR Solutions)' },
//   { key: 'alias_name', label: 'Alias Name', type: 'text', placeholder: '(e.g., VibeHR)', multiline: true },
  { key: 'code', label: 'Company Code', type: 'text', placeholder: '(e.g., VHR001)' },
  { key: 'cost_code', label: 'Cost Code', type: 'text', placeholder: '(e.g., CC-2024-001)' },
  { key: 'companyType', label: 'Company Type', type: 'select', placeholder: '(e.g., Private Limited, Public)' },
  { key: 'companyAddress', label: 'Address', type: 'text', required:true, multiline: true, rows: 6 },
  { key: 'location', label: 'Location', type: 'text', multiline: true, rows: 6 },

  
  // Sub Section: Address Information
  { subSection: 'Address Information', isSubSection: true, parentSection: 'Basic Information' },
  { key: 'cityId', label: 'City', type: 'select', placeholder: '(e.g., Mumbai, Delhi, Bangalore)' },
  { key: 'stateId', label: 'State', type: 'select', placeholder: '(e.g., Maharashtra, Karnataka)' },
  { key: 'countryId', label: 'Country', type: 'select', placeholder: '(e.g., India)' },
  { key: 'pincode', label: 'Pincode', type: 'text', placeholder: '(e.g., 400001)' },
  { key: 'phone', label: 'Phone Number', type: 'text', required:true, placeholder: '(e.g., +91 9876543210)' },
  { key: 'fax', label: 'Fax Number', type: 'text', placeholder: '(e.g., +91 22 12345678)' },
  { key: 'email', label: 'Email Address', type: 'text', required:true, placeholder: '(e.g., company@example.com)' },
  { key: 'website', label: 'Website', type: 'text', placeholder: '(e.g., www.example.com)' },
  { key: 'twitterHandle', label: 'Twitter Handle', type: 'text', placeholder: '(e.g., @companyname)' },

  // Section 2: Tax Information
  { section: 'Tax Information', isSection: true },
  { key: 'gstNo', label: 'GST Number', type: 'text', required:true, placeholder: '22AAAAA0000A1Z (15 characters)' },
  { key: 'panNo', label: 'PAN Number', type: 'text', placeholder: 'AAAAA1234A (10 characters)' },
  { key: 'tanNo', label: 'TAN Number', type: 'text', placeholder: 'ABCD12345E (10 characters)' },
  { key: 'tin_no', label: 'TIN Number', type: 'text', placeholder: '12345678901 (11 digits)' },
  { key: 'cst_no', label: 'CST Number', type: 'text', placeholder: 'CST/1234567890' },
  { key: 'cst_date', label: 'CST Date', type: 'date', placeholder: 'DD/MM/YYYY' },
  { key: 'cin', label: 'CIN Number', type: 'text', placeholder: 'U12345MH2024PLC123456 (21 characters)' },
  { key: 'license_no', label: 'License Number', type: 'text' },
  { key: 'registrationCertificateNo', label: 'Registration Number', type: 'text', placeholder: 'ROC-1234567890' },
  { key: 'pfNo', label: 'PF Number', type: 'text', placeholder: 'MH/12345/1234 (15-20 characters)' },
  { key: 'esiNo', label: 'ESI Number', type: 'text', placeholder: '12345678901234567 (17 digits)' },
  { key: 'esic_code', label: 'ESIC Code', type: 'text', placeholder: '12345678901234567 (17 digits)' },
  { key: 'linNo', label: 'LIN Number', type: 'text', placeholder: 'LIN/MH/2024/12345' },
  { key: 'estd_code', label: 'ESTD Code', type: 'text', placeholder: 'ESTD-2024-001' },  

  { section: 'Contact Info', isSection: true },
  { key: 'contact_name', label: 'Contact Name', type: 'text', placeholder: '(e.g., John Doe)' },
  { key: 'designation', label: 'Designation', type: 'text', placeholder: '(e.g., CEO)' },
  { key: 'phone_no', label: 'Phone Number', type: 'text', placeholder: '(e.g.,  +91 9876543210)' },
  { key: 'contact_email', label: 'Email Address', type: 'text', placeholder: '(e.g., johndoe@example.com)' },
];

// Separate file upload fields
export const fileUploadFields = [
    {
        key: 'logo',
        label: 'Company Logo',
        accept: 'image/*',
        maxSize: 2,
        description: 'Upload company logo (JPEG, PNG, SVG - Max 2MB)'
    },
    {
        key: 'signature',
        label: 'Digital Signature',
        accept: 'image/*,.pdf',
        maxSize: 1,
        description: 'Upload authorized signature (JPEG, PNG, PDF - Max 1MB)'
    },
];

export const tabs = [
    {
        id: "general",
        label: "General",
        options: [
            {
                id: "company-settings",
                label: "Company Settings",
                path: "/settings/general/company-settings",
            },
            {
                id: "branch",
                label: "Branch Settings",
                path: "/settings/general/branch-settings",
            },
            {
                id: "password-config",
                label: "Password Config",
                path: "/settings/general/password-config",
            },
        ],
    },
    {
        id: "employee",
        label: "Employee",
        options: [
            {
                id: "department-settings",
                label: "Department Settings",
                path: "/settings/employee/department-settings",
            },
             {
                id: "category-settings",
                label: "Other Category",
                path: "/settings/employee/category-settings",
            },
        ],
    },
    {
        id: "payroll",
        label: "Payroll",
        options: [
            {
                id: "payroll-settings",
                label: "Payroll Settings",
                path: "/settings/payroll/payroll-settings",
            },
        ],
    },
    {
        id: "income-tax",
        label: "Income Tax",
        options: [
            {
                id: "income-tax-settings",
                label: "Income Tax Settings",
                path: "/settings/income-tax/income-tax-settings",
            },
        ],
    },
];

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
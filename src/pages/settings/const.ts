export const companyFields = [
    { key: 'name', label: 'Company Name', type:'text',multiline: true, placeholder: '(e.g., VibeHR Solutions)' },
  { key: 'alias_name', label: 'Alias Name', type:'text', placeholder: '(e.g., VibeHR)',multiline: true },

    { key: 'code', label: 'Company Code', type:'text', placeholder: '(e.g., VHR001)' },
    { key: 'cost_code', label: 'Cost Code', type:'text', placeholder: '(e.g., CC-2024-001)' },

    // { key: 'division', label: 'Division', type:'select', placeholder: '(e.g., IT, HR, Finance)' },
    { key: 'type_name', label: 'Company Type', type:'select', placeholder: '(e.g., Private Limited, Public)' },
    { key: 'contact_person', label: 'Contact Person', type:'text' },
    { key: 'phone_no', label: 'Phone Number', type:'text', placeholder: '(e.g., +91 9876543210)' },
    { key: 'fax_no', label: 'Fax Number', type:'text', placeholder: '(e.g., +91 22 12345678)' },
    { key: 'email', label: 'Email Address', type:'text', placeholder: '(e.g.,company@example.com)' },
        { key: 'website', label: 'Website', type:'text', placeholder: '(e.g., www.example.com)' },

              { key: 'twitter', label: 'Twitter Handle', type:'text', placeholder: '(e.g., @companyname)' },



    { key: 'city', label: 'City', type:'select', placeholder: '(e.g., Mumbai, Delhi, Bangalore)' },
        { key: 'states', label: 'State', type:'select', placeholder: ' (e.g., Maharashtra, Karnataka)' },
    { key: 'country', label: 'Country', type:'select', placeholder: '(e.g., India)' },

    { key: 'pincode', label: 'Pincode', type:'text', placeholder: '(e.g., 400001)' },
        { key: 'timezone', label: 'Timezone', type:'select', placeholder: '(e.g., IST, EST, PST)' },
        { key: 'address', label: 'Address',type:'text', multiline: true, rows: 3 },
    { key: 'currency', label: 'Currency', type:'select', placeholder: '(e.g., INR, USD, EUR)' },

    { key: 'gst', label: 'GST Number', type:'text', placeholder: '22AAAAA0000A1Z (15 characters)' },
    { key: 'pan', label: 'PAN Number', type:'text', placeholder: 'AAAAA1234A (10 characters)' },
    { key: 'tan_no', label: 'TAN Number', type:'text', placeholder: 'ABCD12345E (10 characters)' },
    { key: 'tin_no', label: 'TIN Number', type:'text', placeholder: '12345678901 (11 digits)' },
    { key: 'cst_no', label: 'CST Number', type:'text', placeholder: 'CST/1234567890' },
    { key: 'cst_date', label: 'CST Date', type:'date', placeholder: 'DD/MM/YYYY' },
    { key: 'cin_no', label: 'CIN Number', type:'text', placeholder: 'U12345MH2024PLC123456 (21 characters)' },
    { key: 'license_no', label: 'License Number',type:'text' },
    { key: 'registration_no', label: 'Registration Number', type:'text', placeholder: 'ROC-1234567890' },
    { key: 'pf_no', label: 'PF Number', type:'text', placeholder: 'MH/12345/1234 (15-20 characters)' },
    { key: 'esi_no', label: 'ESI Number', type:'text', placeholder: '12345678901234567 (17 digits)' },
    { key: 'esic_code', label: 'ESIC Code', type:'text', placeholder: '12345678901234567 (17 digits)' },
    { key: 'lin_no', label: 'LIN Number', type:'text', placeholder: 'LIN/MH/2024/12345' },
    { key: 'estd_code', label: 'ESTD Code', type:'text', placeholder: 'ESTD-2024-001' },
    // { key: 'bank', label: 'Bank Details', type:'text' },
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
                id: "employee",
                label: "Employee",
                path: "/settings/employee/employee",
            },
            {
                id: "employee-positions",
                label: "Employee Positions",
                path: "/settings/employee/employee-positions",
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

//master data
export const masterData = {
  division: ['IT', 'HR', 'Finance', 'Operations', 'Marketing'],
  type_name: ['Head Office', 'Factory', 'Registered Office'],
  city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
  country: ['India', 'USA', 'UK', 'Canada', 'Australia'],
  states: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'West Bengal'],
  timezone: ['IST', 'EST', 'PST', 'GMT', 'CST'],
  currency: ['INR', 'USD', 'EUR', 'GBP', 'JPY'],
};
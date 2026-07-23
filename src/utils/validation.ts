// src/utils/validation.ts

export interface ValidationRule {
  pattern: RegExp;
  message: string;
  formatExample: string;
}

export const validationRules: Record<string, ValidationRule> = {
  // Tax Numbers
  gstNo: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    message: 'Invalid GST number format',
    formatExample: '22AAAAA1234F1ZO'
  },
  panNo: {
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    message: 'Invalid PAN number format',
    formatExample: 'ABCDE1234F'
  },
  tanNo: {
    pattern: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
    message: 'Invalid TAN number format',
    formatExample: 'ABCD12345E'
  },
  tinNo: {
    pattern: /^[0-9]{11}$/,
    message: 'Invalid TIN number format',
    formatExample: '12345678901'
  },
  cstNo: {
    pattern: /^CST\/[0-9]{10}$/,
    message: 'Invalid CST number format',
    formatExample: 'CST/1234567890'
  },
  cin: {
    pattern: /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
    message: 'Invalid CIN number format',
    formatExample: 'U12345MH2024PLC123456'
  },
  
  // Address
  // pincode: {
  //   pattern: /^[1-9][0-9]{5}$/,
  //   message: 'Invalid pincode format',
  //   formatExample: '400001'
  // },
  
  // Contact
  // phone_no: {
  //   pattern: /^(\+91[\-\s]?)?[0]?(91)?[789][0-9]{9}$/,
  //   message: 'Invalid phone number format',
  //   formatExample: '+91 9876543210'
  // },
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Invalid email format',
    formatExample: 'company@example.com'
  },

  contactEmail: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Invalid email format',
    formatExample: 'company@example.com'
  },
  
  // Statutory
  pfNo: {
    pattern: /^[A-Z]{2}\/\d{5}\/\d{4}$/,
    message: 'Invalid PF number format',
    formatExample: 'MH/12345/1234'
  },
  esiNo: {
    pattern: /^\d{17}$/,
    message: 'Invalid ESI number format (17 digits required)',
    formatExample: '12345678901234567'
  },
  esicCode: {
    pattern: /^\d{17}$/,
    message: 'Invalid ESIC code format (17 digits required)',
    formatExample: '12345678901234567'
  },
  linNo: {
    pattern: /^LIN\/[A-Z]{2}\/\d{4}\/\d{5}$/,
    message: 'Invalid LIN number format',
    formatExample: 'LIN/MH/2024/12345'
  },
  
  // License Numbers
  licenseNo: {
    pattern: /^[A-Z]{3}\/[A-Z]{2}\/\d{3}\/\d{4}$/,
    message: 'Invalid license number format',
    formatExample: 'TRD/MH/123/2024'
  },
  registrationCertificateNo: {
    pattern: /^[A-Z]{3}-\d{10}$/,
    message: 'Invalid registration number format',
    formatExample: 'ROC-1234567890'
  },
  
  // Banking
  // bank: {
  //   pattern: /^[A-Za-z\s]+$/,
  //   message: 'Invalid bank name',
  //   formatExample: 'State Bank of India'
  // },
  
  // Basic Info
  // name: {
  //   pattern: /^[A-Za-z\s&.,-]{2,100}$/,
  //   message: 'Invalid company name',
  //   formatExample: 'VibeHR Solutions'
  // },
  // code: {
  //   pattern: /^[A-Z0-9]{3,10}$/,
  //   message: 'Invalid company code',
  //   formatExample: 'VHR001'
  // },
  // costCode: {
  //   pattern: /^[A-Z]{2}-\d{4}-\d{3}$/,
  //   message: 'Invalid cost code format',
  //   formatExample: 'CC-2024-001'
  // }
};

// Helper function to normalize keys (handling snake_case and specific aliases)
const normalizeKey = (key: string): string => {
  const aliases: Record<string, string> = {
    pan: "panNo",
    pan_no: "panNo",
    tan: "tanNo",
    pf: "pfNo",
    esi: "esiNo",
    registration: "registrationCertificateNo",
    registration_no: "registrationCertificateNo",
    registrationNo: "registrationCertificateNo",
    registration_certificate_no: "registrationCertificateNo",
  };

  if (aliases[key]) {
    return aliases[key];
  }

  const camelized = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  if (validationRules[camelized]) {
    return camelized;
  }

  return key;
};

// Helper function to validate a field
export const validateField = (key: string, value: string): string => {  
  const normalizedKey = normalizeKey(key);
  const rule = validationRules[normalizedKey];
  if (!rule) return '';
  
  if (!value || value.trim() === '') return '';
  
  if (!rule.pattern.test(value)) {
    return `Format: ${rule.formatExample}`;
  }
  return '';
};

// Helper function to get field error message
export const getFieldError = (key: string, value: string): string => {
  return validateField(key, value);
};

// Validation for all fields
export const validateAllFields = (data: Record<string, unknown>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    const error = validateField(key, typeof value === "string" ? value : "");
    if (error) {
      errors[key] = error;
    }
  });
  
  return errors;
};

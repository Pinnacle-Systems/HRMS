// ==================== BASIC INFORMATION FIELDS ====================
export const basicInfoFields = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "nickName", label: "Nick Name" },
  { key: "gender", label: "Gender", type: "select" },
  { key: "dateOfBirth", label: "Date of Birth", type: "date" },
  { key: "age", label: "Age", disabled: true },
  { key: "birthday", label: "Birthday", type: "date" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "personalEmailAddress", label: "Personal Email" },
  { key: "emailAddress", label: "Official Email" },
  { key: "bloodGroup", label: "Blood Group", type: "select" },
  { key: "nationality", label: "Nationality", type: "select" },
  { key: "religion", label: "Religion", type: "select" },
  { key: "maritalStatus", label: "Marital Status", type: "select" },
  { key: "marriageDate", label: "Date of Marriage", type: "date" },
  { key: "spouseName", label: "Spouse's Name" },
  { key: "fathersName", label: "Father's Name" },
  { key: "height", label: "Height (cm)" },
  { key: "weight", label: "Weight (kg)" },
  { key: "identificationMark", label: "Identification Mark" },
  { key: "hobbies", label: "Hobbies" },
  { key: "languagesKnown", label: "Languages" },
  // { key: "totalExperience", label: "Total Experience (Years)", disabled: true },
  {
    key: "physicallyChallenged",
    label: "Physically Challenged",
    type: "boolean",
  },
  {
    key: "internationalEmployee",
    label: "International Employee",
    type: "boolean",
  },
  { key: "disabilityType", label: "Disability Type", type: "select" },
];

// ==================== EMERGENCY CONTACTS ====================
export const emergencyColumns = [
  { key: "name", label: "Contact Name" },
  { key: "relationship", label: "Relationship", type: "select" },
  { key: "phone", label: "Mobile Number" },
  { key: "alternatePhone", label: "Alternate Number" },
  { key: "email", label: "Email Address" },
  { key: "address", label: "Address", multiline: true },
  { key: "primary", label: "Primary", type: "boolean" },
];

// ==================== ADDRESS DETAILS ====================
export const addressColumns = [
  {
    key: "addressType",
    label: "Address Type",
    type: "select",
    options: ["Present Address", "Permanent Address"],
  },
  // { key: "addressLine1", label: "Address Line 1", multiline: true },
  // { key: "addressLine2", label: "Address Line 2", multiline: true },
  { key: "street", label: "Street/Locality" },
  { key: "village", label: "Village" },
  { key: "taluk", label: "Taluk" },
  { key: "district", label: "District" },
  { key: "country", label: "Country", type: "master-select" },
  { key: "state", label: "State", type: "master-select" },
  { key: "city", label: "City", type: "master-select" },
  { key: "pincode", label: "Pincode" },
  { key: "primary", label: "Primary", type: "boolean" },
];

// ==================== QUALIFICATIONS ====================
export const qualificationColumns = [
  { key: "qualificationType", label: "Qualification Type", type: "select" },
  { key: "institution", label: "Institution" },
  { key: "boardUniversity", label: "Board/University" },
  { key: "yearOfPassing", label: "Year of Passing", type: "number" },
  { key: "percentage", label: "Percentage/CGPA", type: "number" },
  { key: "grade", label: "Grade" },
  { key: "qualificationArea", label: "Qualification Area", type: "select" },
  // { key: "remarks", label: "Remarks", multiline: true },
];

// ==================== EMPLOYEE DETAILS FIELDS ====================
export const employeeColumns = [
  { key: "employeeId", label: "Employee ID" },
  { key: "name", label: "Name" },
  { key: "joiningDate", label: "Joining Date", type: "date" },
  { key: "confirmationDate", label: "Confirmation Date", type: "date" },
  { key: "probationPeriod", label: "Probation Period (months)" },
  { key: "noticePeriod", label: "Notice Period (days)" },
  { key: "department", label: "Department", type: "select" },
  { key: "designation", label: "Designation", type: "select" },
  {
    key: "grade",
    label: "Grade",
    type: "select",
    categoryKey: "GRADE",
    isPolicy: false,
  },
  {
    key: "band",
    label: "Band / Pay Category",
    type: "select",
    categoryKey: "BAND",
    isPolicy: false,
  },
  { key: "manager", label: "Reporting Manager", type: "user" },
  { key: "empType", label: "Employment Type", type: "select" },
  { key: "template", label: "Template", type: "select" },
  { key: "branch", label: "Branch", type: "select" },
  // { key: "attendanceSchema", label: "Shift Schema", type: "select" },
  {
    key: "bonusPolicy",
    label: "Bonus Policy",
    type: "select",
    categoryKey: "BONUS_POLICY",
    isPolicy: true,
  },
  {
    key: "otPolicy",
    label: "OT Policy",
    type: "select",
    categoryKey: "OT_POLICY",
    isPolicy: true,
  },
  { key: "otAmount", label: "OT Amount" },
  {
    key: "vehicleType",
    label: "Vehicle Type",
    type: "select",
    categoryKey: "VEHICLE_TYPE",
    isPolicy: false,
  },
  // { key: "firstAidTrainee", label: "First Aid Trainee" },
  // { key: "employeeIdentity", label: "Employee Identity" },
  // { key: "employeeReferenceNumber", label: "Employee Reference Number" },
  { key: "referredBy", label: "Referred By" },
  { key: "employeeStatus", label: "Employee Status", type: "select" },
  { key: "adminRemarks", label: "Remarks" },
  { key: "idCardNo", label: "ID Card Number" },
  { key: "midNo", label: "MID Number" },
  { key: "oldIdNo", label: "Old ID Number" },
  { key: "hostel", label: "Hostel Facility", type: "boolean" },
  { key: "vehicleFacility", label: "Vehicle Facility", type: "boolean" },
  { key: "exService", label: "Ex-Service Personnel", type: "boolean" },
  { key: "migrant", label: "Migrant Worker", type: "boolean" },
  { key: "monthly", label: "Monthly", type: "boolean" },
  { key: "relievedDate", label: "Relieved Date", type: "date" },
];

// ==================== ELIGIBILITY FIELDS ====================
export const eligibilityFields = [
  { key: "pfEligible", label: "PF Eligible", type: "boolean" },
  { key: "excessEpfEligible", label: "Excess EPF Eligible", type: "boolean" },
  { key: "excessEpsEligible", label: "Excess EPS Eligible", type: "boolean" },
  { key: "existingEpsMember", label: "Existing EPS Member", type: "boolean" },
  { key: "esiEligible", label: "ESI Eligible", type: "boolean" },
  { key: "lwfCovered", label: "LWF Covered", type: "boolean" },
];

export const VerificationColumns = [
  { key: "backgroundCheckStatus", label: "Background Check Status" },
  {
    key: "backgroundVerificationCompletedOn",
    label: "Verification Completed On",
    type: "date",
  },
  {
    key: "backgroundVerificationIndicator",
    label: "Background Verification Status",
  },
  { key: "agencyName", label: "Background Check Agency" },
  {
    key: "backgroundCheckRemarks",
    label: "Background Check Remarks",
    multiline: true,
  },
];

// ==================== TRAINING DETAILS ====================
export const trainingDetailsColumns = [
  { key: "trainingName", label: "Training Title" },
  { key: "fromDate", label: "From Date", type: "date" },
  { key: "toDate", label: "To Date", type: "date" },
  { key: "durationHours", label: "Duration (Hours)" },
  { key: "conductedBy", label: "Conducted By", type: "user" },
  { key: "certificateNo", label: "Certificate Number" },
  { key: "remarks", label: "Remarks", multiline: true },
];

// ==================== PREVIOUS EMPLOYMENTS ====================
export const employmentColumns = [
  { key: "companyName", label: "Company Name" },
  { key: "companyAddress", label: "Company Address", multiline: true },
  { key: "designation", label: "Designation" },
  { key: "fromDate", label: "From Date", type: "date" },
  { key: "toDate", label: "To Date", type: "date" },
  { key: "experience", label: "Total Experience (Years)" },
  { key: "ctc", label: "CTC" },
  { key: "reasonForLeaving", label: "Reason for Leaving", multiline: true },
  { key: "achievements", label: "Key Achievements", multiline: true },
];

// ==================== IDENTIFICATION DOCUMENTS ====================

// ==================== BANK DETAILS ====================
export const bankColumns = [
  { key: "bankAccountNumber", label: "Account Number" },
  { key: "bankName", label: "Bank Name" },
  { key: "bankBranch", label: "Branch Name" },
  { key: "ifscCode", label: "IFSC Code" },
  { key: "nameAsPerBankRecords", label: "Name as per Bank Account" },
  { key: "salaryPaymentMode", label: "Salary Payment Mode", type: "select" },
  { key: "salaryType", label: "Salary Type", type: "select" },
  { key: "bankAccountType", label: "Bank Account Type", type: "select" },
  { key: "ddPayableAt", label: "DD Payable At" },
  { key: "iban", label: "IBAN" },
];

// ==================== PF & STATUTORY DETAILS ====================
export const pfColumns = [
  { key: "pfNumber", label: "PF Account Number" },
  { key: "uan", label: "UAN Number" },
  { key: "pfScheme", label: "PF Scheme", type: "select" },
  { key: "fromDate", label: "PF Joining Date", type: "date" },
  { key: "toDate", label: "PF Relieving Date", type: "date" },
  { key: "remarks", label: "Remarks", multiline: true },
  { key: "current", label: "Current", type: "boolean" },
];

export const panColumns = [
  { key: "panNumber", label: "PAN Number" },
  { key: "nameInPan", label: "Name as in PAN Card" },
];

export const pranColumns = [
  { key: "pranNumber", label: "PRAN Number" },
  { key: "nameAsPerPran", label: "Name as per PRAN" },
];

export const aadhaarColumns = [
  { key: "aadhaarNumber", label: "Aadhaar Number" },
  { key: "aadhaarEnrolmentNo", label: "Aadhaar Enrollment Number" },
  { key: "nameAsOnAadhaar", label: "Name as in Aadhaar" },
];

export const passportVisaColumns = [
  { key: "passportNumber", label: "Passport Number" },
  { key: "nameInPassport", label: "Name as in Passport" },
  { key: "placeOfIssue", label: "Place of Issue" },
  { key: "dateOfIssue", label: "Date of Issue", type: "date" },
  { key: "expiryDate", label: "Expiry Date", type: "date" },
  { key: "visaType", label: "Visa Type" },
  // { key: "visaNumber", label: "Visa Number" },
  { key: "visaExpiry", label: "Visa Expiry", type: "date" },
];

export const esiColumns = [
  { key: "esiNumber", label: "ESI Number" },
  { key: "esiJoiningDate", label: "ESI Joining Date", type: "date" },
  { key: "esiRelievingDate", label: "ESI Relieving Date", type: "date" },
];

export const insuranceColumns = [
  { key: "insuranceNumber", label: "Insurance Policy Number" },
  { key: "nameInInsurance", label: "Name as in Insurance" },
  { key: "insuranceValidFrom", label: "Valid From", type: "date" },
  { key: "insuranceValidTo", label: "Valid To", type: "date" },
];

// ==================== LOGIN  ====================
export const loginColumns = [
  { key: "loginUserName", label: "Login Username" },
  { key: "loginIpAddress", label: "Login IP Address" },
];

// ==================== FAMILY MEMBERS ====================
export const familyColumns = [
  { key: "name", label: "Member Name" },
  { key: "relationship", label: "Relationship", type: "select" },
  { key: "gender", label: "Gender", type: "select" },
  { key: "dateOfBirth", label: "Date of Birth", type: "date" },
  { key: "age", label: "Age" },
  { key: "bloodGroup", label: "Blood Group", type: "select" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "occupation", label: "Occupation" },
  // { key: "nationality", label: "Nationality", type: "select" },
  // { key: "address", label: "Address", multiline: true },
  // { key: "city", label: "City", type: "master-select" },
  // { key: "state", label: "State", type: "master-select" },
  // { key: "country", label: "Country", type: "master-select" },
  // { key: "pincode", label: "Pincode" },
  { key: "dependent", label: "Is Dependent", type: "boolean" },
  // { key: "isNominee", label: "Is Nominee", type: "boolean" },
];

// ==================== NOMINATIONS ====================
export const nominationTypes = ["EPF", "EPS", "EPI", "GRATUITY"];

export const nominationConfigs: any = {
  EPF: {
    title: "EPF Nominations",
    columns: [
      { key: "nomineeName", label: "Nominee Name", type: "select" },
      { key: "sharePercentage", label: "Nomination Percentage (%)" },
    ],
  },
  EPS: {
    title: "EPS Nominations",
    columns: [{ key: "nomineeName", label: "Nominee Name", type: "select" }],
  },
  EPI: {
    title: "EPI Nominations",
    columns: [{ key: "nomineeName", label: "Nominee Name", type: "select" }],
  },
  GRATUITY: {
    title: "Gratuity Nominations",
    columns: [
      { key: "nomineeName", label: "Nominee Name", type: "select" },
      { key: "sharePercentage", label: "Nomination Percentage (%)" },
    ],
  },
};

// ==================== ATTACHMENTS ====================
export const attachmentColumns = [
  { key: "documentType", label: "Document Type", type: "select" },
  { key: "documentName", label: "File Name" },
  { key: "fileUrl", label: "File URL", type: "link" },
  { key: "uploadedAt", label: "Uploaded Date", type: "date" },
];

export const attachmentAddFields = [
  {
    key: "documentType",
    label: "Document Type",
    type: "select",
    required: true,
  },
  { key: "file", label: "File", type: "file" },
  { key: "documentName", label: "File Name", type: "text", disabled: false },
];

export const commonSx = {
  background: "var(--bg-primary)",
  "& .MuiFormHelperText-root": {
    fontSize: "10px",
    marginLeft: 0,
  },
};

export const commonsx = {
  "& .MuiDialog-paper": {
    width: "500px",
    maxWidth: "500px",
  },
};

export const lockableFields = [
  "name",
  "dateOfBirth",
  "gender",
  "fathersName",
  "address1",
  "city",
  "state",
  "pincode",
];

export const getDomainColor = (domainCode: string) => {
  const colors: Record<string, string> = {
    LEAVE: "#e3f2fd",
    ATTENDANCE: "#e8f5e9",
    PAYROLL: "#fff3e0",
    DEDUCTION: "#fce4ec",
    BONUS: "#f3e5f5",
    ALLOWANCE: "#e0f7fa",
    PROBATION: "#fff8e1",
    EMPLOYMENT: "#e8eaf6",
    NOTICE_PERIOD: "#efebe9",
    OFFBOARDING: "#fbe9e7",
    ONBOARDING: "#e0f2f1",
    EXPENSE: "#fff3e0",
    HOLIDAY: "#e8eaf6",
    LOAN_ADVANCE: "#fce4ec",
    OVERTIME: "#e3f2fd",
    WORK_FROM_HOME: "#e8f5e9",
    POLICY: "#f3e5f5",
  };
  return colors[domainCode] || "#f5f5f5";
};

export const getPriorityColor = (priority: number) => {
  if (priority === 0) return "#9e9e9e";
  if (priority <= 10) return "#4caf50";
  if (priority <= 30) return "#2196f3";
  if (priority <= 50) return "#ff9800";
  return "#f44336";
};

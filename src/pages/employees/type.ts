export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface Employee {
  id: string;
  //   userId: string; // Internal system ID
  employeeId: string; // Client-facing employee ID
  name: string;
  emailAddress: string;
  joiningDate: string;
  mobileNumber: string;
  departmentId: string;
  department?: string;
  designationId: string;
  branch: string;
  branchId: string;
  designation?: string;
  //   status: "PENDING" | "ACTIVE" | "INACTIVE" | "ONBOARDING";
  //   isWelcomeEmailSent: boolean;
  //   welcomeEmailSentAt?: string;
  createdAt?: string;
}

export interface Department {
  id: string;
  departmentName: string;
  departmentCode: string;
}

export interface Designation {
  id: string;
  name: string;
  code: string;
}

export interface Branches {
  id: string;
  branchName: string;
  branchCode: string;
}


export const employeeStatusColors = {
  PENDING: "warning",
  ACTIVE: "success",
  INACTIVE: "error",
  ONBOARDING: "info",
} as const;

export const employeeStatusLabels = {
  PENDING: "Pending",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ONBOARDING: "Onboarding",
} as const;

export interface EmployeeDetails {
  id: string;
  employeeId: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  emailAddress: string;
  mobileNumber: string;
  joiningDate: string;
  hostel: boolean;
  addresses: Address[];
  emergencyContacts: EmergencyContact[];
  qualifications: Qualification[];
  previousEmployments: PreviousEmployment[];
  pfAccounts: PfAccount[];
  nominations: Nomination[];
  familyMembers: FamilyMember[];
  trainingDetails: TrainingDetail[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  physicallyChallenged: boolean;
  internationalEmployee: boolean;
  pfEligible: boolean;
  excessEpfEligible: boolean;
  excessEpsEligible: boolean;
  existingEpsMember: boolean;
  esiEligible: boolean;
  lwfCovered: boolean;
}

export interface Address {
  id: string;
  addressType: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isPrimary: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  mobileNumber: string;
  alternateNumber?: string;
}

export interface Qualification {
  id: string;
  qualification: string;
  institution: string;
  yearOfPassing: number;
  percentage: number;
}

export interface PreviousEmployment {
  id: string;
  companyName: string;
  designation: string;
  fromDate: string;
  toDate: string;
  experience: number;
}

export interface PfAccount {
  id: string;
  pfNumber: string;
  uanNumber: string;
  joiningDate: string;
}

export interface Nomination {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  isNominee: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  isDependent: boolean;
}

export interface TrainingDetail {
  id: string;
  trainingName: string;
  institution: string;
  fromDate: string;
  toDate: string;
  certificate: string;
}

interface Attachment {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

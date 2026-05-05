export interface CompanyInfo {
  companyName: string;
//   alias_name: string;
//   code: string;
//   cost_code: string;
  companyType: string;
  contact_person: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  twitterHandle: string;
  companyAddress: string;
  cityId: string;
  stateId: string;
  countryId: string;
  pincode: string;
  timezone: string;
  currencyId: string;
  gstNo: string;
  panNo: string;
  tanNo: string;
//   tin_no: string;
//   cst_no: string;
//   cst_date: string;
  cin: string;
//   license_no: string;
  registrationCertificateNo: string;
  pfNo: string;
  esiNo: string;
//   esic_code: string;
  linNo: string;
//   estd_code: string;
//   logo: string | File;
//   signature: string | File;
}

export interface Branch {
  id: string;
  branchName: string;
  branchCode: string;
  branchAddress: string;
  latitude: number;
  longitude: number;
  radius: number;
  branchHeadId: string;
  active: boolean;
  location?: string;
}

export const sortOptions = [
  { value: "branchName", label: "Branch Name" },
  { value: "branchCode", label: "Branch Code" },
  { value: "branchAddress", label: "Address" },
  { value: "branchHeadId", label: "Branch Head" },
  { value: "radius", label: "Radius" },
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Updated Date" },
];
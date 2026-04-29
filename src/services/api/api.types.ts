// export interface ApiResponse<T = any> {
//   success: boolean;
//   data: T;
//   message: string;
//   errors?: Record<string, string[]>;
//   timestamp?: string;
// }

// export interface PaginatedResponse<T = any> {
//   success: boolean;
//   data: {
//     items: T[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
//   message: string;
// }

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// export interface QueryParams {
//   page?: number;
//   limit?: number;
//   search?: string;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// }

// // export interface Company {
// //   id?: string;
// //   name: string;
// //   code: string;
// //   cost_code: string;
// //   division: string;
// //   type_name: string;
// //   alias_name: string;
// //   display: string;
// //   contact_person: string;
// //   phone_no: string;
// //   fax_no: string;
// //   email: string;
// //   website: string;
// //   address: string;
// //   city: string;
// //   pincode: string;
// //   country: string;
// //   states: string;
// //   timezone: string;
// //   currency: string;
// //   gst: string;
// //   pan: string;
// //   tan_no: string;
// //   tin_no: string;
// //   cst_no: string;
// //   cst_date: string;
// //   cin_no: string;
// //   license_no: string;
// //   registration_no: string;
// //   pf_no: string;
// //   esi_no: string;
// //   esic_code: string;
// //   lin_no: string;
// //   estd_code: string;
// //   bank: string;
// //   twitter: string;
// //   logo?: string;
// //   signature?: string;
// // }

// // export interface MasterData {
// //   divisions: string[];
// //   companyTypes: string[];
// //   cities: string[];
// //   countries: string[];
// //   states: string[];
// //   timezones: string[];
// //   currencies: string[];
// // }

import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";


export interface AssignmentQuery {
  employeeId?: string;
  structureId?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface Assignment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  structureId: string;
  structureCode: string;
  structureName: string;
  ctcAmount: number;
  ctcPeriod: string;
  annualCtc: number;
  monthlyCtc: number;
  effectiveFrom: string;
  status: string;
  bankAccountNumber: string;
  bankName: string;
  bankIfsc: string;
  bankBranch: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branch: string;
}

export interface AssignmentCreatePayload {
  employeeId: string;
  structureId: string;
  ctcAmount: number;
  ctcPeriod: string;
  effectiveFrom: string;
  bankDetails?: BankDetails;
}

export interface BulkAssignmentPayload {
  employeeIds: string[];
  structureId: string;
  ctcAmount: number;
  ctcPeriod: string;
  effectiveFrom: string;
  bankDetails?: BankDetails;
}

export interface BulkAssignmentResponse {
  requested: number;
  assigned: number;
  failed: number;
  assignments: Assignment[];
  failures: Array<{
    employeeId: string;
    reason: string;
  }>;
}

export const assignmentService = {
  async getAssignments(params?: AssignmentQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.ASSIGN.BASE, { params });
  },

  // async getAssignmentByEmployee(employeeId: string) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.ASSIGN.GET_BY_EMPLOYEE(employeeId));
  // },

  async getEmployeeAssignmentHistory(employeeId: string) {
    return apiService.get(API_ENDPOINTS.PAYROLL.ASSIGN.EMPLOYEE_HISTORY(employeeId));
  },

  async createBulkAssignment(payload: BulkAssignmentPayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.ASSIGN.CREATE_BULK, payload);
  },

  // async createAssignment(payload: AssignmentCreatePayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.ASSIGN.CREATE, payload);
  // },

  async deleteAssignment(id: string) {
    return apiService.delete(API_ENDPOINTS.PAYROLL.ASSIGN.DELETE(id));
  },
};
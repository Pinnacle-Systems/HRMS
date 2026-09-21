import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export type RevisionStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "APPLIED";

export type RevisionReason =
  | "ANNUAL_INCREMENT"
  | "PROMOTION"
  | "CORRECTION"
  | "MARKET_ADJUSTMENT"
  | "PROBATION_CONFIRMATION";

export type RevisionTemplateType = "PERCENT" | "FLAT" | "SLAB" | "CTC_BASED";

export interface SalaryComponentValue {
  componentId: string;
  componentName: string;
  componentType: "EARNING" | "DEDUCTION";
  oldValue: number;
  newValue: number;
  delta: number;
  deltaPercent: number;
}

export interface EmployeeRevision {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  oldCtc: number;
  newCtc: number;
  oldGross: number;
  newGross: number;
  incrementAmount: number;
  incrementPercent: number;
  components: SalaryComponentValue[];
  effectiveFrom: string;
  remarks?: string;
}

export interface SalaryRevision {
  id: string;
  revisionCode: string;
  title: string;
  reason: RevisionReason;
  effectiveFrom: string;
  status: RevisionStatus;
  templateId?: string;
  employees: EmployeeRevision[];
  totalEmployees: number;
  totalIncrementCost: number;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface RevisionTemplateConfig {
  percent?: number;
  flatAmount?: number;
  slabs?: { from: number; to: number; percent: number }[];
  minIncrement?: number;
  maxIncrement?: number;
  roundingRule?: "NEAREST_100" | "NEAREST_1000" | "NONE";
}

export interface RevisionTemplate {
  id: string;
  name: string;
  type: RevisionTemplateType;
  config: RevisionTemplateConfig;
}

export interface SalaryHistoryEntry {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  revisionId?: string;
  reason: RevisionReason;
  oldCtc: number;
  newCtc: number;
  incrementPercent: number;
  components: SalaryComponentValue[];
  approvedBy: string;
  createdAt: string;
  letterUrl?: string;
}

export interface GetRevisionParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: RevisionStatus;
  reason?: string;
  branchId?: string;
  companyId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateRevisionPayload {
  title: string;
  reason: string;
  effectiveFrom: string;
  templateId?: string;
  status?: RevisionStatus;
  employees: any[];
  totalEmployees: number;
  totalIncrementCost: number;
}

class SalaryRevisionService {
  // ============ Salary Revisions ============
  async getRevisions(params?: GetRevisionParams | Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.SALARY_REVISION.BASE, { params });
  }

  async getRevisionById(id: string | number) {
    return apiService.get(API_ENDPOINTS.SALARY_REVISION.GET_BY_ID(String(id)));
  }

  async createRevision(payload: CreateRevisionPayload) {
    return apiService.post(API_ENDPOINTS.SALARY_REVISION.BASE, payload);
  }

  async updateRevision(id: string | number, payload: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.SALARY_REVISION.UPDATE(String(id)), payload);
  }

  async deleteRevision(id: string | number) {
    return apiService.delete(API_ENDPOINTS.SALARY_REVISION.DELETE(String(id)));
  }

  async submitForApproval(id: string | number) {
    return apiService.post(API_ENDPOINTS.SALARY_REVISION.SUBMIT(String(id)));
  }

  async approveRevision(id: string | number, remarks?: string) {
    return apiService.post(API_ENDPOINTS.SALARY_REVISION.APPROVE(String(id)), {
      remarks,
    });
  }

  async rejectRevision(id: string | number, reason: string) {
    return apiService.post(API_ENDPOINTS.SALARY_REVISION.REJECT(String(id)), {
      reason,
    });
  }

  async applyRevision(id: string | number) {
    return apiService.post(API_ENDPOINTS.SALARY_REVISION.APPLY(String(id)));
  }

  async previewRevision(payload: {
    employeeIds: string[];
    templateId?: string;
    templateConfig?: any;
    effectiveFrom: string;
  }) {
    return apiService.post(API_ENDPOINTS.SALARY_REVISION.PREVIEW, payload);
  }

  async generateLetter(revisionId: string | number, employeeId: string | number) {
    return apiService.get(
      API_ENDPOINTS.SALARY_REVISION.LETTER(String(revisionId), String(employeeId)),
      { responseType: "blob" }
    );
  }

  // ============ Revision Templates ============
  async getTemplates(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.REVISION_TEMPLATE.BASE, { params });
  }

  async getTemplateById(id: string | number) {
    return apiService.get(API_ENDPOINTS.REVISION_TEMPLATE.GET_BY_ID(String(id)));
  }

  async createTemplate(payload: Partial<RevisionTemplate>) {
    return apiService.post(API_ENDPOINTS.REVISION_TEMPLATE.BASE, payload);
  }

  async updateTemplate(id: string | number, payload: Partial<RevisionTemplate>) {
    return apiService.put(
      API_ENDPOINTS.REVISION_TEMPLATE.UPDATE(String(id)),
      payload
    );
  }

  async deleteTemplate(id: string | number) {
    return apiService.delete(API_ENDPOINTS.REVISION_TEMPLATE.DELETE(String(id)));
  }

  async getTemplateDropdown() {
    return apiService.get(API_ENDPOINTS.REVISION_TEMPLATE.DROPDOWN);
  }

  // ============ Salary History ============
  async getEmployeeHistory(employeeId: string | number) {
    return apiService.get(
      API_ENDPOINTS.SALARY_HISTORY.BY_EMPLOYEE(String(employeeId))
    );
  }

  async getHistoryById(id: string | number) {
    return apiService.get(API_ENDPOINTS.SALARY_HISTORY.GET_BY_ID(String(id)));
  }
}

export const salaryRevisionService = new SalaryRevisionService();
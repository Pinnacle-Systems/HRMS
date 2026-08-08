import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";


// ===== DEDUCTIONS =====
export interface DeductionQuery {
  employeeId?: string;
  status?: string;
  type?: string;
}

export interface Deduction {
  id: string;
  employeeId: string;
  type: string;
  typeLabel: string;
  name: string;
  monthlyAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  progressLabel: string;
  progressPercent: number;
  totalAmount: number;
  startedOn: string;
  status: string;
  sourceType: string;
  sourceRefId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSummary {
  id: string;
  name: string;
  code: string;
  designationId: string;
  departmentId: string;
  annualCtc: number;
}

export interface DeductionSummary {
  compliant: number;
  pending: number;
  nonCompliant: number;
  total: number;
  totalAmount: number;
}

export interface DeductionDistribution {
  label: string;
  amount: number;
  color: string;
}

export interface DeductionResponse {
  employee: EmployeeSummary;
  activeDeductions: Deduction[];
  summary: DeductionSummary;
  distribution: DeductionDistribution[];
}

export interface DeductionPayload {
  employeeId: string;
  type: string;
  name: string;
  monthlyAmount: number;
  totalInstallments: number;
  totalAmount: number;
  startedOn: string;
  sourceType?: string;
  sourceRefId?: string;
  [key: string]: any;
}

// ===== COMPONENTS =====
export interface ComponentQuery {
  type?: string;
  active?: boolean;
}

export interface Component {
  id: string;
  name: string;
  code: string;
  componentType: string;
  calculationType: string;
  calculationValue: number;
  formulaExpression: string;
  minAmount: number;
  maxAmount: number;
  taxable: boolean;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface ComponentPayload {
  name: string;
  code: string;
  componentType: string;
  calculationType: string;
  calculationValue?: number;
  formulaExpression?: string;
  minAmount?: number;
  maxAmount?: number;
  taxable?: boolean;
  displayOrder?: number;
  active?: boolean;
  [key: string]: any;
}

// ===== STRUCTURES =====
export interface StructureQuery {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  status?: string;
  applicableFor?: string;
}

export interface StructureItem {
  id: string;
  name: string;
  code: string;
  description: string;
  applicableFor: string[];
  gradeLevels: string[];
  status: string;
  publishedAt: string;
  earnings: StructureComponent[];
  deductions: StructureComponent[];
  grossEarningsMonthly: number;
  totalDeductionsMonthly: number;
  netMonthly: number;
  annualCtc: number;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface StructureComponent {
  id: string;
  itemType: string;
  componentId: string;
  componentCode: string;
  componentName: string;
  calculationType: string;
  value: number;
  limitValue: number;
  sequence: number;
  preview: string;
  computedMonthlyAmount: number;
}

export interface StructurePayload {
  name: string;
  code: string;
  description?: string;
  applicableFor?: string[];
  gradeLevels?: string[];
  earnings?: Array<{
    componentId: string;
    value: number;
    limitValue?: number;
    sequence?: number;
  }>;
  deductions?: Array<{
    componentId: string;
    value: number;
    limitValue?: number;
    sequence?: number;
  }>;
}

// ===== LOAN & ADVANCE =====
export interface LoanAdvanceQuery {
  status?: string;
  employeeId?: string;
}

export interface LoanAdvancePayload {
  [key: string]: any;
}

export interface LoanAdvanceUpdatePayload {
  status: string;
  remarks?: string;
  [key: string]: any;
}

// ===== COMPLIANCE =====
export interface ComplianceQuery {
  year?: number;
  month?: number;
}

export interface ComplianceReportPayload {
  year: number;
  month: number;
  [key: string]: any;
}

export interface ComplianceReportResponse {
  fileUrl: string;
}

// ===== BANK ADVICE =====
export interface BankAdvicePayload {
  [key: string]: any;
}

// ===== ASSIGN =====
export interface AssignPayload {
  employeeId: string;
  structureId: string;
  effectiveFrom: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfsc?: string;
  bankBranch?: string;
  [key: string]: any;
}

export interface AssignResponse {
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

export const payrollMastersService = {

  // async getEmployeeDeductions(empId: string) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.MASTERS.DEDUCTIONS.GET_BY_ID(empId));
  // },

  // async createDeduction(payload: DeductionPayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.MASTERS.DEDUCTIONS.CREATE, payload);
  // },

  // async updateDeduction(id: string, payload: Partial<DeductionPayload>) {
  //   return apiService.put(API_ENDPOINTS.PAYROLL.MASTERS.DEDUCTIONS.UPDATE(id), payload);
  // },

  // async deleteDeduction(id: string) {
  //   return apiService.delete(API_ENDPOINTS.PAYROLL.MASTERS.DEDUCTIONS.DELETE(id));
  // },

  // async getComponents(params?: ComponentQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.MASTERS.COMPONENTS.BASE, { params });
  // },

  // async createComponent(payload: ComponentPayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.MASTERS.COMPONENTS.CREATE, payload);
  // },

  // async updateComponent(id: string, payload: Partial<ComponentPayload>) {
  //   return apiService.put(API_ENDPOINTS.PAYROLL.MASTERS.COMPONENTS.UPDATE(id), payload);
  // },

  // async deleteComponent(id: string) {
  //   return apiService.delete(API_ENDPOINTS.PAYROLL.MASTERS.COMPONENTS.DELETE(id));
  // },

  // async getStructures(params?: StructureQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.MASTERS.STRUCTURES.BASE, { params });
  // },

  // async createStructure(payload: StructurePayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.MASTERS.STRUCTURES.CREATE, payload);
  // },

  // async getLoanAdvanceRequests(params?: LoanAdvanceQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.MASTERS.LOANADV.BASE, { params });
  // },

  // async createLoanAdvanceRequest(payload: LoanAdvancePayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.MASTERS.LOANADV.CREATE, payload);
  // },

  // async updateLoanAdvanceStatus(id: string, payload: LoanAdvanceUpdatePayload) {
  //   return apiService.put(API_ENDPOINTS.PAYROLL.MASTERS.LOANADV.UPDATE(id), payload);
  // },

  // async getCompliance(params?: ComplianceQuery) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.MASTERS.COMPLIANCE.BASE, { params });
  // },

  // async generateComplianceReport(payload: ComplianceReportPayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.MASTERS.COMPLIANCE.GENERATE_REPORT, payload);
  // },

  // async getBankAdvice(params?: any) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.MASTERS.BANKADVICE.BASE, { params });
  // },

  // async generateBankAdvice(payload: BankAdvicePayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.MASTERS.BANKADVICE.GENERATE, payload);
  // },

  // async getEmployeeAssignment(empId: string) {
  //   return apiService.get(API_ENDPOINTS.PAYROLL.MASTERS.ASSIGN.GET_BY_ID(empId));
  // },

  // async upsertAssignment(payload: AssignPayload) {
  //   return apiService.post(API_ENDPOINTS.PAYROLL.MASTERS.ASSIGN.BASE, payload);
  // },
};
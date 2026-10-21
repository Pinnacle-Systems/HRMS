import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

// --- Types based on API Documentation ---

export interface ApprovalModule {
  id: string;
  moduleName: string;
  description: string;
  tableNames: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalOperator {
  id: string;
  symbol: string;
  label: string;
  active: boolean;
}

export interface ApprovalField {
  id: string;
  moduleId: string;
  moduleName: string;
  parentRelation: string;
  nestedPath: string;
  dbVariableName: string;
  uiLabel: string;
  dataType: string;
  allowedOperatorIds: string[];
  active: boolean;
}

export interface ApprovalRule {
  id?: string;
  seqNo?: number;
  fieldId: string;
  fieldLabel?: string;
  operatorId: string;
  operatorSymbol?: string;
  operatorLabel?: string;
  valueType: "static" | "field" | "dynamic";
  value: string;
}

export type ApprovalApproverType = "user" | "role";

export interface ApprovalLevel {
  id?: string;
  seqNo?: number;
  levelTitle: string;
  approvalCondition: "any" | "all";
  approverType: ApprovalApproverType;
  approvers: {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
  }[];
  approverRoles: string[];
  approverEmployeeIds?: string[];
}

export interface ApprovalConfiguration {
  id: string;
  workflowName: string;
  moduleId: string;
  moduleName: string;
  priorityWeight: number;
  noRulesRequired: boolean;
  active: boolean;
  rules: ApprovalRule[];
  levels: ApprovalLevel[];
}

// Payload for creating/updating a configuration
export interface ApprovalConfigurationPayload {
  workflowName: string;
  moduleId: string;
  priorityWeight: number;
  noRulesRequired: boolean;
  active: boolean;
  rules: {
    fieldId: string;
    operatorId: string;
    valueType: "static" | "field" | "dynamic";
    value: string;
  }[];
  levels: {
    levelTitle: string;
    approvalCondition: "any" | "all";
    approverType: ApprovalApproverType;
    approverEmployeeIds: string[];
    approverRoles: string[];
  }[];
}

// Response for evaluate endpoint
export interface ApprovalEvaluationResult {
  approvalRequired: boolean;
  configurationId: string;
  workflowName: string;
  matchReason: string;
  levels: ApprovalLevel[];
}

export interface DbFields {
  tableName: string;
  columnName: string;
  dataType: string;
}

// Generic API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Paginated response for modules
interface PaginatedModules {
  totalElements: number;
  totalPages: number;
  content: ApprovalModule[];
}

export interface ApprovalApprover {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
}

export interface ApprovalDecision {
  approverEmployeeId: string;
  approverName: string;
  decision: "approved" | "rejected" | string;
  comments: string;
  decidedAt: string;
}

export interface ApprovalRequestLevel {
  seqNo: number;
  levelTitle: string;
  current: boolean;
  cleared: boolean;
  approvers: ApprovalApprover[];
  decisions: ApprovalDecision[];
}

export interface ApprovalRequest {
  id: string;
  moduleId: string;
  moduleName: string;
  configurationId: string;
  workflowName: string;
  recordId: string;
  status: "pending" | "approved" | "rejected" | string;
  currentLevelSeq: number;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  decidedAt: string;
  levels: ApprovalRequestLevel[];
}

export const approvalWorkflowService = {
  // ================= MODULES =================
  async getModules(params?: {
    search?: string;
    active?: boolean;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PaginatedModules>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.MODULES, { params });
  },

  async getModuleById(id: string): Promise<ApiResponse<ApprovalModule>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.MODULE_BY_ID(id));
  },

  async createModule(
    data: Omit<ApprovalModule, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<ApprovalModule>> {
    return apiService.post(API_ENDPOINTS.APPROVAL_WORKFLOW.MODULES, data);
  },

  async updateModule(
    id: string,
    data: Partial<ApprovalModule>
  ): Promise<ApiResponse<ApprovalModule>> {
    return apiService.put(API_ENDPOINTS.APPROVAL_WORKFLOW.MODULE_BY_ID(id), data);
  },

  async deleteModule(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(API_ENDPOINTS.APPROVAL_WORKFLOW.MODULE_BY_ID(id));
  },

  async toggleModuleActive(id: string): Promise<ApiResponse<ApprovalModule>> {
    return apiService.patch(
      API_ENDPOINTS.APPROVAL_WORKFLOW.MODULE_TOGGLE_ACTIVE(id)
    );
  },

  async getDbFieldsByModule(id: string): Promise<ApiResponse<DbFields[]>> {
    return apiService.get(
      API_ENDPOINTS.APPROVAL_WORKFLOW.MODULE_BY_DBFIELDS(id)
    );
  },

  // ================= OPERATORS =================
  async getOperators(params?: {
    activeOnly?: boolean;
  }): Promise<ApiResponse<ApprovalOperator[]>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.OPERATORS, { params });
  },

  async createOperator(
    data: Omit<ApprovalOperator, "id">
  ): Promise<ApiResponse<ApprovalOperator>> {
    return apiService.post(API_ENDPOINTS.APPROVAL_WORKFLOW.OPERATORS, data);
  },

  async updateOperator(
    id: string,
    data: Partial<ApprovalOperator>
  ): Promise<ApiResponse<ApprovalOperator>> {
    return apiService.put(
      API_ENDPOINTS.APPROVAL_WORKFLOW.OPERATOR_BY_ID(id),
      data
    );
  },

  async deleteOperator(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(
      API_ENDPOINTS.APPROVAL_WORKFLOW.OPERATOR_BY_ID(id)
    );
  },

  // ================= FIELDS (Field Dictionary) =================
  async getFields(params?: {
    moduleId?: string;
  }): Promise<ApiResponse<ApprovalField[]>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.FIELDS, { params });
  },

  async createField(
    data: Omit<ApprovalField, "id" | "moduleName">
  ): Promise<ApiResponse<ApprovalField>> {
    return apiService.post(API_ENDPOINTS.APPROVAL_WORKFLOW.FIELDS, data);
  },

  async updateField(
    id: string,
    data: Partial<ApprovalField>
  ): Promise<ApiResponse<ApprovalField>> {
    return apiService.put(API_ENDPOINTS.APPROVAL_WORKFLOW.FIELD_BY_ID(id), data);
  },

  async deleteField(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(API_ENDPOINTS.APPROVAL_WORKFLOW.FIELD_BY_ID(id));
  },

  async getValuesByField(id: string): Promise<ApiResponse<void>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.FIELD_BY_VALUES(id));
  },

  // ================= CONFIGURATIONS (Workflows) =================
  async getConfigurations(params?: {
    moduleId?: string;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<{ content: ApprovalConfiguration[] }>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.CONFIGURATIONS, {
      params,
    });
  },

  async getConfigurationById(
    id: string
  ): Promise<ApiResponse<ApprovalConfiguration>> {
    return apiService.get(
      API_ENDPOINTS.APPROVAL_WORKFLOW.CONFIGURATION_BY_ID(id)
    );
  },

  async createConfiguration(
    data: ApprovalConfigurationPayload
  ): Promise<ApiResponse<ApprovalConfiguration>> {
    return apiService.post(API_ENDPOINTS.APPROVAL_WORKFLOW.CONFIGURATIONS, data);
  },

  async updateConfiguration(
    id: string,
    data: ApprovalConfigurationPayload
  ): Promise<ApiResponse<ApprovalConfiguration>> {
    return apiService.put(
      API_ENDPOINTS.APPROVAL_WORKFLOW.CONFIGURATION_BY_ID(id),
      data
    );
  },

  async deleteConfiguration(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(
      API_ENDPOINTS.APPROVAL_WORKFLOW.CONFIGURATION_BY_ID(id)
    );
  },

  async toggleConfigurationActive(
    id: string
  ): Promise<ApiResponse<ApprovalConfiguration>> {
    return apiService.patch(
      API_ENDPOINTS.APPROVAL_WORKFLOW.CONFIGURATION_TOGGLE_ACTIVE(id)
    );
  },

  // ================= EVALUATE (Dry-run) =================
  async evaluateConfiguration(data: {
    moduleName: string;
    fieldValues: Record<string, any>;
  }): Promise<ApiResponse<ApprovalEvaluationResult>> {
    return apiService.post(API_ENDPOINTS.APPROVAL_WORKFLOW.EVALUATE, data);
  },

  async getApprovalRequestById(id: string): Promise<ApiResponse<ApprovalRequest>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.APPROVAL_REQUESTS.REQUEST_BY_ID(id));
  },

  async getPendingApprovalsForMe(params?: {
    userId?: string;
    tenantId?: string;
    email?: string;
    password?: string;
    active?: boolean;
    roles?: string[];
    permissions?: string[];
  }): Promise<ApiResponse<ApprovalRequest[]>> {
    return apiService.get(API_ENDPOINTS.APPROVAL_WORKFLOW.APPROVAL_REQUESTS.PENDING_FOR_ME, { params });
  },
};
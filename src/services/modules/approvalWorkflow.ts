import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export const APPROVAL_ACTIONS = [
  { id: "CREATE", label: "Create" },
  { id: "UPDATE", label: "Update" },
  { id: "DELETE", label: "Delete" },
  { id: "STATUS_CHANGE", label: "Status change" },
] as const;

export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number]["id"];
export type ApprovalCondition = "ANY" | "ALL";
export type ApprovalRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export const APPROVAL_MODULES = [
  { id: "employees", label: "Employees" },
  { id: "organization", label: "Organization" },
  { id: "attendance", label: "Attendance" },
  { id: "leave", label: "Leave" },
  { id: "payroll", label: "Payroll" },
  { id: "policies", label: "Policies" },
  { id: "onboarding", label: "Onboarding" },
  { id: "system", label: "System settings" },
] as const;

export type ApprovalModule = (typeof APPROVAL_MODULES)[number]["id"];

export interface ApprovalLevel {
  id: string;
  levelTitle: string;
  condition: ApprovalCondition;
  approvers: string[];
}

export interface ApprovalWorkflow {
  id: string;
  workflowName: string;
  module: ApprovalModule;
  action: ApprovalAction;
  priorityWeight: number;
  approvalRequired: boolean;
  status: boolean;
  levels: ApprovalLevel[];
}

export interface ApprovalSettings {
  enabled: boolean;
  workflows: ApprovalWorkflow[];
  updatedAt?: string;
}

export interface ApprovalRequest {
  id: string;
  module: ApprovalModule;
  action: ApprovalAction;
  summary: string;
  entityType: string;
  entityId: string;
  status: ApprovalRequestStatus;
  requestedBy: {
    id: string;
    name: string;
  };
  requestedAt: string;
}

export interface ApprovalDecision {
  decision: "APPROVE" | "REJECT";
  comments?: string;
}

export interface ApprovalDecisionResult {
  request: ApprovalRequest;
  changeApplied: boolean;
  message: string;
}

export const USE_MOCK_APPROVAL_WORKFLOW =
  import.meta.env.VITE_USE_MOCK_APPROVAL_WORKFLOW !== "false";

const clone = <T,>(value: T): T => structuredClone(value);

const defaultLevels = (): ApprovalLevel[] => [
  {
    id: "level-1",
    levelTitle: "Level 1 Approval",
    condition: "ANY",
    approvers: ["admin"],
  },
];

const createWorkflow = (
  module: ApprovalModule,
  action: ApprovalAction,
): ApprovalWorkflow => {
  const moduleName =
    APPROVAL_MODULES.find((item) => item.id === module)?.label ?? module;
  const actionName =
    APPROVAL_ACTIONS.find((item) => item.id === action)?.label ?? action;
  const approvalRequired =
    (module === "employees" && action === "DELETE") ||
    (module === "payroll" && action === "UPDATE");

  return {
    id: `${module}:${action}`,
    workflowName: `${moduleName} ${actionName} Approval`,
    module,
    action,
    priorityWeight: 1,
    approvalRequired,
    status: true,
    levels: approvalRequired ? defaultLevels() : [],
  };
};

const makeDefaultSettings = (): ApprovalSettings => ({
  enabled: true,
  workflows: APPROVAL_MODULES.flatMap(({ id: module }) =>
    APPROVAL_ACTIONS.map(({ id: action }) => createWorkflow(module, action)),
  ),
  updatedAt: "2026-10-06T09:00:00Z",
});

let mockSettings = makeDefaultSettings();
let mockRequests: ApprovalRequest[] = [
  {
    id: "APR-2026-0001",
    module: "employees",
    action: "DELETE",
    summary: "Delete employee E-1024 — Priya Sharma",
    entityType: "Employee",
    entityId: "E-1024",
    status: "PENDING",
    requestedBy: { id: "USR-HR-001", name: "Anita HR" },
    requestedAt: "2026-10-06T08:30:00Z",
  },
  {
    id: "APR-2026-0002",
    module: "payroll",
    action: "UPDATE",
    summary: "Update salary for employee E-2048",
    entityType: "EmployeeSalary",
    entityId: "E-2048",
    status: "PENDING",
    requestedBy: { id: "USR-HR-002", name: "Rahul HR" },
    requestedAt: "2026-10-06T09:15:00Z",
  },
];

export const approvalWorkflowService = {
  getSettings() {
    if (USE_MOCK_APPROVAL_WORKFLOW) return Promise.resolve(clone(mockSettings));
    return apiService.get<ApprovalSettings>(
      API_ENDPOINTS.APPROVAL_WORKFLOW.SETTINGS,
    );
  },

  updateSettings(settings: ApprovalSettings) {
    if (USE_MOCK_APPROVAL_WORKFLOW) {
      mockSettings = { ...clone(settings), updatedAt: new Date().toISOString() };
      return Promise.resolve(clone(mockSettings));
    }
    return apiService.put<ApprovalSettings>(
      API_ENDPOINTS.APPROVAL_WORKFLOW.SETTINGS,
      settings,
    );
  },

  getPendingRequests() {
    if (USE_MOCK_APPROVAL_WORKFLOW) {
      return Promise.resolve(
        clone(mockRequests.filter((request) => request.status === "PENDING")),
      );
    }
    return apiService.get<ApprovalRequest[]>(
      API_ENDPOINTS.APPROVAL_WORKFLOW.REQUESTS,
      { params: { status: "PENDING" } },
    );
  },

  decideRequest(requestId: string, decision: ApprovalDecision) {
    if (USE_MOCK_APPROVAL_WORKFLOW) {
      const requestIndex = mockRequests.findIndex(
        (request) => request.id === requestId,
      );
      if (requestIndex < 0) {
        return Promise.reject(
          new Error(`Approval request ${requestId} was not found.`),
        );
      }
      const status: ApprovalRequestStatus =
        decision.decision === "APPROVE" ? "APPROVED" : "REJECTED";
      const request: ApprovalRequest = {
        ...mockRequests[requestIndex],
        status,
      };
      mockRequests = mockRequests.map((item, index) =>
        index === requestIndex ? request : item,
      );
      return Promise.resolve({
        request: clone(request),
        changeApplied: decision.decision === "APPROVE",
        message:
          decision.decision === "APPROVE"
            ? "Request approved and the change was applied."
            : "Request rejected. The change was not applied.",
      });
    }
    return apiService.post<ApprovalDecisionResult>(
      API_ENDPOINTS.APPROVAL_WORKFLOW.DECIDE(requestId),
      decision,
    );
  },
};

import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export type ApprovalNotificationType =
  | "LEAVE"
  | "OVERTIME"
  | "CORRECTION"
  | "COMP_OFF"
  | "SHIFT_SWAP"
  | "LOAN_ADVANCE"
  | "EXPENSE"
  | "SALARY_REVISION";

export interface PendingApprovalNotification {
  type: ApprovalNotificationType;
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  title: string;
  detail: string;
  date: string;
  submittedAt: string;
  actionPath: string;
}

export interface ApprovalNotificationQuery {
  userId?: string;
  tenantId?: string;
  type?: ApprovalNotificationType;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PendingApprovalsData {
  total: number;
  byType: Partial<Record<ApprovalNotificationType, number>>;
  items: PendingApprovalNotification[];
}

export interface PendingApprovalsCount {
  total: number;
  byType?: Partial<Record<ApprovalNotificationType, number>>;
}

export const notificationsService = {
  async getPendingApprovals(
    params?: ApprovalNotificationQuery,
  ): Promise<ApiEnvelope<PendingApprovalsData>> {
    return apiService.get<ApiEnvelope<PendingApprovalsData>>(
      API_ENDPOINTS.NOTIFICATIONS.APPROVALS,
      { params },
    );
  },

  async getPendingApprovalsCount(
    params?: Omit<ApprovalNotificationQuery, "type">,
  ): Promise<ApiEnvelope<PendingApprovalsCount>> {
    return apiService.get<ApiEnvelope<PendingApprovalsCount>>(
      API_ENDPOINTS.NOTIFICATIONS.APPROVALS_COUNT,
      { params },
    );
  },
};

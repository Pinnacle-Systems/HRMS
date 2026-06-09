import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export type AuditActionType = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";

export interface AuditLogQuery {
  page?: number;
  size?: number;
  sort?: string;
  module?: string;
  screen?: string;
  recordId?: string;
  actionType?: AuditActionType;
  changedBy?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogRecord {
  id: string;
  module: string;
  screen: string;
  recordId: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  actionType: AuditActionType;
  changedBy: {
    userId: string;
    userName: string;
  };
  changedOn: string;
  ipAddress?: string;
  userAgent?: string;
}

export const auditLogService = {
  async getAuditLogs(params?: AuditLogQuery) {
    return apiService.get(API_ENDPOINTS.AUDIT_LOGS.GET_ALL, { params });
  },

  async getAuditHistory(recordId: string | number) {
    return apiService.get(
      API_ENDPOINTS.AUDIT_LOGS.GET_BY_RECORD_ID(String(recordId)),
    );
  },
};

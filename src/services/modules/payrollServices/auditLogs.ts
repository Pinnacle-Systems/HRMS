import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

// ===== AUDIT LOGS =====
export interface AuditLogQuery {
  search?: string;
  actionType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actionLabel: string;
  userName: string;
  userId: string;
  userRole: string;
  entityType: string;
  entityRef: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditLogSummary {
  totalEvents: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface AuditLogExportResponse {
  fileUrl: string;
}

export interface AuditLogCreatePayload {
  action: string;
  actionLabel: string;
  userName: string;
  entityType: string;
  entityRef: string;
  details: string;
}

export interface PayrollAuditQuery {
  page?: number;
  limit?: number;
  action?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PayrollAuditExportQuery {
  format?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export const auditLogService = {
  async getAuditLogs(params?: AuditLogQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.AUDIT.BASE, { params });
  },

  async getAuditLogSummary() {
    return apiService.get(API_ENDPOINTS.PAYROLL.AUDIT.SUMMARY);
  },

  async exportAuditLogs(params?: {
    search?: string;
    actionType?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    return apiService.get(API_ENDPOINTS.PAYROLL.AUDIT.EXPORT, { params });
  },

  async createAuditLog(payload: AuditLogCreatePayload) {
    return apiService.post(API_ENDPOINTS.PAYROLL.AUDIT.CREATE, payload);
  },

  async getPayrollAuditLogs(params?: PayrollAuditQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLL_AUDIT.BASE, { params });
  },

  async exportPayrollAuditLogs(params?: PayrollAuditExportQuery) {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLL_AUDIT.EXPORT, { params });
  },

  async getAuditActions() {
    return apiService.get(API_ENDPOINTS.PAYROLL.PAYROLL_AUDIT.ACTIONS);
  },
};

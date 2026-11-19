import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";

export interface StatutoryReportPeriod {
  year: number;
  month: number;
}

export interface StatutoryReportResponse {
  success: boolean;
  message: string;
  data: {
    fileUrl: string;
  };
  timestamp: string;
}

export interface SalaryStatementQuery extends StatutoryReportPeriod {
  format?: "excel" | "pdf";
}

export interface MusterRollQuery extends StatutoryReportPeriod {
  departmentId?: string;
  format?: "pdf" | "excel";
}

export const statutoryReportsService = {
  async getTimeCard(params: StatutoryReportPeriod & { employeeId: string }) {
    return apiService.get<StatutoryReportResponse>(
      API_ENDPOINTS.PAYROLL.STATUTORY_REPORTS.TIME_CARD,
      { params },
    );
  },

  async getSalaryStatement(params: SalaryStatementQuery) {
    return apiService.get<StatutoryReportResponse>(
      API_ENDPOINTS.PAYROLL.STATUTORY_REPORTS.SALARY_STATEMENT,
      { params },
    );
  },

  async getPfChallan(params: StatutoryReportPeriod) {
    return apiService.get<StatutoryReportResponse>(
      API_ENDPOINTS.PAYROLL.STATUTORY_REPORTS.PF_CHALLAN,
      { params },
    );
  },

  async getMusterRoll(params: MusterRollQuery) {
    return apiService.get<StatutoryReportResponse>(
      API_ENDPOINTS.PAYROLL.STATUTORY_REPORTS.MUSTER_ROLL,
      { params },
    );
  },

  async getEsiChallan(params: StatutoryReportPeriod) {
    return apiService.get<StatutoryReportResponse>(
      API_ENDPOINTS.PAYROLL.STATUTORY_REPORTS.ESI_CHALLAN,
      { params },
    );
  },
};

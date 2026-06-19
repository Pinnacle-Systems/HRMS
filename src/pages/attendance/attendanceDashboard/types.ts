import type { AttendanceStatus } from "../../../services/modules/attendance";

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface AttendanceFilters {
  fromDate: string;
  toDate: string;
  departmentId: string;
  shiftCode: string;
  status: AttendanceStatus | "";
  search: string;
}

export interface MusterFilters {
  month: number;
  year: number;
  departmentId: string;
}

export interface ProcessFilters {
  fromDate: string;
  toDate: string;
  employeeIds: string[];
  departmentId: string;
  reprocess: boolean;
}

export interface SummaryFilters {
  date: string;
  departmentId: string;
  branchId: string;
}

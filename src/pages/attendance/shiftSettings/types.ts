import type { Dayjs } from "dayjs";

// Form data interface
export interface ShiftFormData {
  shiftName: string;
  shiftCode: string;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  shiftType: string;
  graceTime: number;
  breakTime: number;
  active: boolean;
  color: string;
  weeklyOff: string[];
  description: string;
  nightShift: boolean;
}

export interface WeeklyRoster {
  day: string;
  shiftCode: string;
}

export interface RosterEmployee {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentId: string;
  department: string;
  branchId: string;
  shiftCode: string;
  weeklyRoster: WeeklyRoster[];
}

export interface alert {
  type: string;
  message: string;
}

export interface Branch {
  id: string;
  branchName: string;
}

export interface RotationFormData {
  rotationName: string;
  description: string;
  shiftIds: string[];
  cycleDays: number;
  active: boolean;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
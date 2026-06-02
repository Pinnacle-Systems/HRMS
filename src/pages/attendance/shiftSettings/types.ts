import type { Dayjs } from "dayjs";
import type { Shift } from "../../../services/modules/shifts";
import type { EmployeeCategory as EmployeeCategoryType } from '../../../types/policy';

// Form data interface
export interface ShiftFormData {
  shiftName: string;
  shiftCode: string;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  shiftType: string;
  graceTime?: number;
  breakTime?: number;
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

export interface ShiftCategoryConfig {
  type: EmployeeCategoryType;
  graceBeforeCheckIn: number;
  graceAfterCheckIn: number;
  graceBeforeCheckOut: number;
  graceAfterCheckOut: number;
  breakTime: number;
  breakAfterHours: number;
  breakIsPaid: boolean;
  allowMultipleBreaks: boolean;
  maxBreaksPerShift: number;
  minBreakInterval: number;
  lunchDuration: number;
  lunchAfterHours: number;
  lunchIsPaid: boolean;
  lunchGraceBefore: number;
  lunchGraceAfter: number;
  overtimeBeforeShift: number;
  overtimeAfterShift: number;
  minRestBetweenShifts: number;
  maxConsecutiveDays: number;
  lateArrivalThreshold: number;
  earlyDepartureThreshold: number;
  autoBreakDeduction: boolean;
  roundingRule: string;
  roundingInterval: number;
}

export interface AdvancedShiftConfig {
  shiftId: string;
  shiftName: string;
  categoryConfigs: ShiftCategoryConfig[];
}

export interface ShiftAdvancedConfigProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  onSave: () => void;
}
import type { Dayjs } from "dayjs";
import type { Shift } from "../../../services/modules/shifts";
import type { EmployeeCategory as EmployeeCategoryType } from "../../../types/policy";

// Form data interface
export interface ShiftFormData {
  shiftName: string;
  shiftCode: string;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  shiftType: string;
  graceTime?: number;
  breakTime?: number;
  isActive: boolean;
  color: string;
  weeklyOff: string[];
  description: string;
  isNightShift: boolean;
  templateId: string;
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
  allowMultipleBreaks: boolean;
  maxBreaksPerShift: number;
  minBreakInterval: number;
  breakSlots?: BreakSlot[];
  breakStartTime?: string;
  breakEndTime?: string;

  mealDuration: number;
  mealAfterHours: number;
  enableMealBreakGrace: boolean;
  mealGraceBefore: number;
  mealGraceAfter: number;
  mealBreakStartTime?: string;
  mealBreakEndTime?: string;

  overtimeBeforeShift: number;
  overtimeAfterShift: number;

  minRestBetweenShifts: number;
  maxConsecutiveDays: number;

  roundingRule: string;
  roundingInterval: number;
}

export interface AdvancedShiftConfig {
  shiftId: string;
  shiftName: string;
  advancedConfigs: ShiftCategoryConfig[];
}

export interface ShiftAdvancedConfigProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  onSave: () => void;
}

export interface BreakSlot {
  id: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  duration?: number; // Optional - can be calculated or manually set
}

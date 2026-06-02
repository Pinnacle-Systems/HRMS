import { EmployeeCategory, type EmployeeCategory as EmployeeCategoryType } from '../../../types/policy';
import type { ShiftCategoryConfig } from './types';

export const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const getShiftTypeClass = (type: string) => {
  switch (type?.toLowerCase()) {
    case "night":
      return "!bg-indigo-100 !text-indigo-700";
    case "flexible":
      return "!bg-green-100 !text-green-700";
    case "rotational":
      return "!bg-orange-100 !text-orange-700";
    case "morning":
      return "!bg-yellow-100 !text-yellow-700";
    case "evening":
      return "!bg-purple-100 !text-purple-700";
    default:
      return "!bg-blue-100 !text-blue-700";
  }
};

export const colorClasses = {
  red: {
    border: "border-red-500",
    text: "text-red-700",
    icon: "text-red-500",
  },
  green: {
    border: "border-green-500",
    text: "text-green-700",
    icon: "text-green-500",
  },
  blue: {
    border: "border-blue-500",
    text: "text-blue-700",
    icon: "text-blue-500",
  },
  yellow: {
    border: "border-yellow-500",
    text: "text-yellow-700",
    icon: "text-yellow-500",
  },
};

// Format time string to 12-hour format
 export const formatTimeTo12Hour = (timeString?: string): string => {
    if (!timeString) return '--:--';

    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return '--:--';

      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return '--:--';
    }
  };

export const statusColors = {
  Scheduled: '#3b82f6',
  Completed: '#10b981',
  Unassigned: '#ef4444',
  InProgress: '#f59e0b',
  WeeklyOff: '#f97316',
};

export const CATEGORY_LABELS: Record<EmployeeCategoryType, string> = {
  STAFF:         'Staff',
  LABOUR:        'Labour',
  GROUND_WORKER: 'Ground Worker',
  SUPERVISOR:    'Supervisor',
  TECHNICIAN:    'Technician',
};

export const CATEGORY_SUBLABELS: Record<EmployeeCategoryType, string> = {
  STAFF:         'Office / White-collar',
  LABOUR:        'Factory / Production floor',
  GROUND_WORKER: 'Retail / Field / Security',
  SUPERVISOR:    'Team lead / Floor supervisor',
  TECHNICIAN:    'Electrician / Mechanic / Maintenance',
};

export const CATEGORY_COLORS: Record<EmployeeCategoryType, string> = {
  STAFF:         '#1976d2',
  LABOUR:        '#d32f2f',
  GROUND_WORKER: '#388e3c',
  SUPERVISOR:    '#f57c00',
  TECHNICIAN:    '#7b1fa2',
};

// Sensible defaults differ per category
export const CATEGORY_DEFAULTS: Record<EmployeeCategoryType, ShiftCategoryConfig> = {
  STAFF: {
    type: 'STAFF',
    graceBeforeCheckIn: 15, graceAfterCheckIn: 5, graceBeforeCheckOut: 5, graceAfterCheckOut: 15,
    breakTime: 15, breakAfterHours: 2, breakIsPaid: true, allowMultipleBreaks: false,
    maxBreaksPerShift: 2, minBreakInterval: 60,
    lunchDuration: 30, lunchAfterHours: 4, lunchIsPaid: false, lunchGraceBefore: 5, lunchGraceAfter: 5,
    overtimeBeforeShift: 30, overtimeAfterShift: 30,
    minRestBetweenShifts: 8, maxConsecutiveDays: 6,
    lateArrivalThreshold: 10, earlyDepartureThreshold: 10,
    autoBreakDeduction: false, roundingRule: 'nearest', roundingInterval: 15,
  },
  LABOUR: {
    type: 'LABOUR',
    graceBeforeCheckIn: 5, graceAfterCheckIn: 2, graceBeforeCheckOut: 2, graceAfterCheckOut: 5,
    breakTime: 15, breakAfterHours: 2, breakIsPaid: true, allowMultipleBreaks: true,
    maxBreaksPerShift: 3, minBreakInterval: 90,
    lunchDuration: 30, lunchAfterHours: 4, lunchIsPaid: false, lunchGraceBefore: 5, lunchGraceAfter: 5,
    overtimeBeforeShift: 15, overtimeAfterShift: 15,
    minRestBetweenShifts: 12, maxConsecutiveDays: 6,
    lateArrivalThreshold: 5, earlyDepartureThreshold: 5,
    autoBreakDeduction: true, roundingRule: 'down', roundingInterval: 15,
  },
  GROUND_WORKER: {
    type: 'GROUND_WORKER',
    graceBeforeCheckIn: 10, graceAfterCheckIn: 5, graceBeforeCheckOut: 5, graceAfterCheckOut: 10,
    breakTime: 15, breakAfterHours: 2, breakIsPaid: true, allowMultipleBreaks: false,
    maxBreaksPerShift: 2, minBreakInterval: 60,
    lunchDuration: 30, lunchAfterHours: 4, lunchIsPaid: false, lunchGraceBefore: 5, lunchGraceAfter: 5,
    overtimeBeforeShift: 20, overtimeAfterShift: 20,
    minRestBetweenShifts: 8, maxConsecutiveDays: 5,
    lateArrivalThreshold: 10, earlyDepartureThreshold: 10,
    autoBreakDeduction: true, roundingRule: 'nearest', roundingInterval: 15,
  },
  SUPERVISOR: {
    type: 'SUPERVISOR',
    graceBeforeCheckIn: 15, graceAfterCheckIn: 5, graceBeforeCheckOut: 5, graceAfterCheckOut: 15,
    breakTime: 15, breakAfterHours: 2, breakIsPaid: true, allowMultipleBreaks: false,
    maxBreaksPerShift: 2, minBreakInterval: 60,
    lunchDuration: 30, lunchAfterHours: 4, lunchIsPaid: false, lunchGraceBefore: 5, lunchGraceAfter: 5,
    overtimeBeforeShift: 30, overtimeAfterShift: 30,
    minRestBetweenShifts: 8, maxConsecutiveDays: 6,
    lateArrivalThreshold: 10, earlyDepartureThreshold: 10,
    autoBreakDeduction: false, roundingRule: 'nearest', roundingInterval: 15,
  },
  TECHNICIAN: {
    type: 'TECHNICIAN',
    graceBeforeCheckIn: 10, graceAfterCheckIn: 5, graceBeforeCheckOut: 5, graceAfterCheckOut: 10,
    breakTime: 15, breakAfterHours: 2, breakIsPaid: true, allowMultipleBreaks: false,
    maxBreaksPerShift: 2, minBreakInterval: 60,
    lunchDuration: 30, lunchAfterHours: 4, lunchIsPaid: false, lunchGraceBefore: 5, lunchGraceAfter: 5,
    overtimeBeforeShift: 20, overtimeAfterShift: 20,
    minRestBetweenShifts: 8, maxConsecutiveDays: 6,
    lateArrivalThreshold: 10, earlyDepartureThreshold: 10,
    autoBreakDeduction: true, roundingRule: 'nearest', roundingInterval: 15,
  },
};

export const ALL_CATEGORIES = Object.values(EmployeeCategory) as EmployeeCategoryType[];
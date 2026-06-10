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
  staff:         'Staff',
  labour:        'Labour',
  // GROUND_WORKER: 'Ground Worker',
  // SUPERVISOR:    'Supervisor',
  // TECHNICIAN:    'Technician',
};

export const CATEGORY_SUBLABELS: Record<EmployeeCategoryType, string> = {
  staff:         'Office / White-collar',
  labour:        'Factory / Production floor',
  // GROUND_WORKER: 'Retail / Field / Security',
  // SUPERVISOR:    'Team lead / Floor supervisor',
  // TECHNICIAN:    'Electrician / Mechanic / Maintenance',
};

export const CATEGORY_COLORS: Record<EmployeeCategoryType, string> = {
  staff:         '#1976d2',
  labour:        '#d32f2f',
  // GROUND_WORKER: '#388e3c',
  // SUPERVISOR:    '#f57c00',
  // TECHNICIAN:    '#7b1fa2',
};

// Sensible defaults differ per category
export const CATEGORY_DEFAULTS: Record<EmployeeCategoryType, ShiftCategoryConfig> = {
  staff: {
    type: 'staff',
    graceBeforeCheckIn: 15, graceAfterCheckIn: 5, graceBeforeCheckOut: 5, graceAfterCheckOut: 15,
    breakTime: 15, breakAfterHours: 2, allowMultipleBreaks: false,breakEndTime: '00:00', breakStartTime: '00:00',
    maxBreaksPerShift: 2, minBreakInterval: 60,

    mealDuration: 30, mealAfterHours: 4, mealGraceBefore: 5, mealGraceAfter: 5,
    enableMealBreakGrace:false, mealBreakStartTime: '00:00', mealBreakEndTime: '00:00',

    overtimeBeforeShift: 30, overtimeAfterShift: 30,
    minRestBetweenShifts: 8, maxConsecutiveDays: 6,
    roundingRule: 'none', roundingInterval: 0,
  },
  labour: {
    type: 'labour',
    graceBeforeCheckIn: 10, graceAfterCheckIn: 10, graceBeforeCheckOut: 10, graceAfterCheckOut: 10,
    breakTime: 30, breakAfterHours: 4, allowMultipleBreaks: true,
    maxBreaksPerShift: 4, minBreakInterval: 120,

    mealDuration: 60, mealAfterHours: 5, mealGraceBefore: 10, mealGraceAfter: 10,
    enableMealBreakGrace:false, mealBreakStartTime: '00:00', mealBreakEndTime: '00:00',

    overtimeBeforeShift: 15, overtimeAfterShift: 15,
    minRestBetweenShifts: 10, maxConsecutiveDays: 7,
    roundingRule: 'none', roundingInterval: 0,
  },
};

export const ALL_CATEGORIES = [EmployeeCategory.Staff, EmployeeCategory.Labour] as EmployeeCategoryType[];
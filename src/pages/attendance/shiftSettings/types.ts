export interface Shift {
  id: string;
  shiftName: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  graceTime: number;
  breakTime: number;
  totalHours: number;
  // isNightShift: boolean;
  shiftType: string;
  isActive: boolean;
  color: string;
  weeklyOff: string[];
  description?: string;
  // createdAt: string;
  // updatedAt: string;
}

export interface ShiftRotation {
  id: string;
  rotationName: string;
  description: string;
  shiftIds: string[];
  shifts?: Shift[];
  cycleDays: number;
  isActive: boolean;
  assignedEmployees?: number;
  createdAt: string;
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  shiftId: string;
  shiftName: string;
  shiftCode: string;
  rotationId?: string;
  rotationName?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

export interface WeeklyRoster {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  departmentId?: string;
  branchId?: string;
  isPublished: boolean;
  shifts: WeeklyRosterShift[];
}

export interface WeeklyRosterShift {
  employeeId: string;
  employeeName: string;
  department: string;
  shifts: {
    [key: string]: string; // 'MON': 'shiftId'
  };
}

export interface ShiftScheduleDay {
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftName: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Completed' | 'Absent' | 'On Leave' | 'Late';
  checkIn?: string;
  checkOut?: string;
  overtime?: number;
}

export interface ShiftStats {
  totalShifts: number;
  activeShifts: number;
  nightShifts: number;
  flexibleShifts: number;
}
export interface OnboardingTask {
  id: string;
  taskName: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  dueDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingChecklist {
  id: string;
  name: string;
  description: string;
  tasks: OnboardingTask[];
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeOnboarding {
  id: string;
  employeeId: string;
  employeeName: string;
  checklistId: string;
  checklistName: string;
  status: "Not Started" | "In Progress" | "Completed" | "Overdue";
  startDate: string;
  expectedEndDate: string;
  completedDate?: string;
  progress: number; // Percentage 0-100
  tasks: OnboardingTaskProgress[];
  assignedBy: string;
  assignedByName: string;
}

export interface OnboardingTaskProgress {
  taskId: string;
  taskName: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  dueDays: number;
  status: "Pending" | "In Progress" | "Completed" | "Overdue";
  startedAt?: string;
  completedAt?: string;
  remarks?: string;
  attachments?: OnboardingAttachment[];
}

export interface OnboardingAttachment {
  id: string;
  taskId: string;
  employeeOnboardingId: string;
  documentName: string;
  documentType: string;
  fileUrl: string;
  uploadedAt: string;
  remarks?: string;
}

export interface OnboardingProgress {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  overallProgress: number;
  estimatedCompletion: string;
}

export interface OnboardingAssignment {
  onboardingId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeEmail: string;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  overallStatus:
    | "IN_PROGRESS"
    | "COMPLETED"
    | "PENDING"
    | "OVERDUE"
    | "SCHEDULED";
  assignedAt: string;
  welcomeEmailSentAt: string;
  totalChecklists: number;
  completedChecklists: number;
  overallProgressPercent: number;
  isActive: boolean;
  // Additional fields for display
  checklistName?: string;
  startDate?: string;
  expectedEndDate?: string;
  progress?: any;
}
export interface OnboardingProgress {
  onboardingId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeEmail: string;
  overallStatus: string;
  dueDate: string | null;
  assignedAt: string;
  completedAt: string | null;
  welcomeEmailSentAt: string | null;
  notes: string | null;
  totalChecklists: number;
  completedChecklists: number;
  overallProgressPercent: number;
  isActive: boolean;
  deactivatedAt: string | null;
  checklists: any[];
}
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
export interface OnboardingAssignment {
  onboardingId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeEmail: string;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  overallStatus:
    | "IN_PROGRESS"
    | "COMPLETED"
    | "PENDING"
    | "OVERDUE"
    | "SCHEDULED";
  assignedAt: string;
  welcomeEmailSentAt: string;
  totalChecklists: number;
  completedChecklists: number;
  overallProgressPercent: number;
  isActive: boolean;
}
export interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  taskType: string;
  documentName: string | null;
  sortOrder: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  completedAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  notes: string | null;
  required: boolean;
}
export interface Checklist {
  id: string;
  checklistId: string;
  checklistName: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  progressPercent: number;
  tasks: Task[];
}
export interface OnboardingDetail {
  onboardingId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail: string;
  overallStatus: string;
  dueDate: string | null;
  assignedAt: string;
  completedAt: string | null;
  welcomeEmailSentAt: string | null;
  notes: string | null;
  totalChecklists: number;
  completedChecklists: number;
  overallProgressPercent: number;
  isActive: boolean;
  deactivatedAt: string | null;
  checklists: Checklist[];
}

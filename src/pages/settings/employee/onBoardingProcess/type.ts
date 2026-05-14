export interface OnboardingTask {
  id: string;
  taskName: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
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
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
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
  priority: 'High' | 'Medium' | 'Low';
  dueDays: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
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
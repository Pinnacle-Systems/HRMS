import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

// ============ Existing Types (keep as is) ============
export type AssignOnboardingForm = {
    employeeId: string;
    checklistId?: string;
    checklistIds?: string[];
    employeeIds: string[];
    dueDate?: string;
    startDate?: string;
    notes?: string;
};

export type AssignOnboardingRequest = {
    employeeId: string;
    checklistIds: string[];
    dueDate?: string;
    notes?: string;
};

export type SendWelcomeRequest = {
    employeeIds: string[];
};

export type CompleteTaskRequest = {
    notes?: string;
    status?: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "OVERDUE";
};

export type ChecklistTaskType = "DOCUMENT" | "FORM" | "VIDEO" | "TRAINING" | "CUSTOM";

export type ChecklistTaskForm = {
    id?: string;
    taskName?: string;
    title?: string;
    description?: string;
    documentName?: string;
    taskType?: ChecklistTaskType;
    sortOrder?: number;
    required?: boolean;
};

export type ChecklistTaskRequest = {
    title: string;
    description: string;
    taskType: ChecklistTaskType;
    documentName: string;
    sortOrder: number;
    required: boolean;
};

export type OnboardingAssignmentsQuery = {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    isActive?: boolean;
    employeeId?: string;
};

export type OnboardingAssignment = {
    id: string;
    onboardingId?: string;
    employeeId?: string;
    employeeName?: string;
    employeeCode?: string;
    employeeEmail?: string;
    branchName?: string;
    departmentName?: string;
    checklistId?: string;
    checklistName?: string;
    overallStatus?: "IN_PROGRESS" | "COMPLETED" | "PENDING" | "OVERDUE" | "SCHEDULED";
    progress?: number;
    overallProgressPercent?: number;
    totalChecklists?: number;
    completedChecklists?: number;
    startDate?: string;
    assignedAt?: string;
    dueDate?: string;
    expectedEndDate?: string;
    welcomeEmailSentAt?: string | null;
    isActive?: boolean;
    active?: boolean;
    [key: string]: any;
};

export type AssignedTaskDetail = {
    id?: string;
    taskId?: string;
    templateTaskId?: string;
    taskInstanceId?: string;
    taskName?: string;
    title?: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
    description?: string;
    taskType?: ChecklistTaskType;
    documentName?: string;
    required?: boolean;
    completedAt?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    notes?: string | null;
    sortOrder?: number;
    [key: string]: any;
};

export type ChecklistWithTasks = {
    id: string;
    checklistId: string;
    checklistName: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
    dueDate: string | null;
    completedAt: string | null;
    totalTasks: number;
    completedTasks: number;
    skippedTasks: number;
    progressPercent: number;
    tasks: AssignedTaskDetail[];
};

export type OnboardingProgress = {
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
    checklists: ChecklistWithTasks[];
};

export type OnboardingDocument = {
    id?: string;
    taskInstanceId?: string;
    taskId?: string;
    documentType?: string;
    documentName?: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    uploadedAt?: string;
    notes?: string;
    [key: string]: any;
};

export type CreateDocumentRequest = {
    file: File;
    taskInstanceId: string;
    employeeId: string;
    notes?: string;
};

export type OnboardingStats = {
    totalOnboardings: number;
    activeOnboardings: number;
    completedOnboardings: number;
    overdueOnboardings: number;
    averageCompletionTime: number;
    completionRate: number;
    pendingTasks: number;
    totalTasks: number;
    documentsUploaded: number;
    [key: string]: any;
};

export type ReminderRequest = {
    employeeId: string;
    reminderType?: "OVERDUE" | "UPCOMING_DEADLINE" | "WEEKLY_SUMMARY";
    message?: string;
};

export type BulkAssignRequest = {
    employeeIds: string[];
    checklistIds: string[];
    dueDate?: string;
    notes?: string;
};

export type UpdateChecklistRequest = {
    name?: string;
    description?: string;
    active?: boolean;
};

export type ExtendDeadlineRequest = {
    newDueDate: string;
    reason?: string;
};

export type UpdateAssignmentRequest = {
    dueDate?: string;
    notes?: string;
    checklistIds?: string[];
};

export type ReviewOnboardingRequest = {
    status: "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
    comments?: string;
};

export type SkipTaskRequest = {
    reason?: string;
    status?: "SKIPPED";
};

export type AssistanceRequest = {
    message: string;
};

export const CHECKLIST_TASK_TYPES: ChecklistTaskType[] = [
    "DOCUMENT",
    "FORM",
    "VIDEO",
    "TRAINING",
    "CUSTOM",
];

// ============ Utility Functions ============
const compactString = (value?: string) => value?.trim();

export const buildAssignOnboardingPayload = (
    form: AssignOnboardingForm,
): AssignOnboardingRequest => {
    const checklistIds = form.checklistIds?.length
        ? form.checklistIds
        : form.checklistId
            ? [form.checklistId]
            : [];

    const payload: AssignOnboardingRequest = {
        employeeId: form.employeeId,
        checklistIds,
    };

    if (form.dueDate) {
        payload.dueDate = form.dueDate;
    }

    if (compactString(form.notes)) {
        payload.notes = compactString(form.notes);
    }

    return payload;
};

export const buildSendWelcomePayload = (employeeIds: string[]): SendWelcomeRequest => ({
    employeeIds,
});

export const buildChecklistTaskPayload = (
    form: ChecklistTaskForm,
    fallbackSortOrder = 0,
): ChecklistTaskRequest => ({
    title: compactString(form.title) || compactString(form.taskName) || "",
    description: form.description ?? "",
    taskType: form.taskType && CHECKLIST_TASK_TYPES.includes(form.taskType)
        ? form.taskType
        : "CUSTOM",
    documentName: form.documentName ?? "",
    sortOrder: form.sortOrder ?? fallbackSortOrder,
    required: form.required ?? true,
});

export const buildBulkAssignPayload = (
    data: BulkAssignRequest
): BulkAssignRequest => ({
    employeeIds: data.employeeIds,
    checklistIds: data.checklistIds,
    ...(data.dueDate ? { dueDate: data.dueDate } : {}),
    ...(data.notes ? { notes: data.notes } : {}),
});

// ============ Normalization Functions ============
export const normalizeOnboardingAssignmentsResponse = (
    response: any,
): OnboardingAssignment[] => {
    const payload = response?.data ?? response;
    const assignments = payload?.content || payload?.data?.content || payload?.assignments || payload?.data || payload;
    return Array.isArray(assignments) ? assignments : [];
};

export const normalizeAssignedTasksResponse = (
    response: any,
): AssignedTaskDetail[] => {
    const payload = response?.data ?? response;
    const tasks = payload?.tasks || payload?.content || payload?.data?.tasks || payload?.data?.content || payload?.data || payload;
    return Array.isArray(tasks) ? tasks : [];
};

export const normalizeDocumentsResponse = (response: any): OnboardingDocument[] => {
    const payload = response?.data ?? response;
    const documents = payload?.content || payload?.documents || payload?.data?.content || payload?.data || payload;
    return Array.isArray(documents) ? documents : [];
};

// ============ Main Service ============
export const onBoardService = {

    // ============ Checklist Management ============
    async createChecklist(data: any) {
        const response = await apiService.post(API_ENDPOINTS.ONBOARDING.CREATE, data);
        return response;
    },

    async getChecklists(params?: any) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.BASE, { params });
        return response;
    },

    async getChecklistById(id: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_CHK_TASKS(id));
        return response;
    },

    async updateChecklist(id: string, data: UpdateChecklistRequest) {
        const response = await apiService.put(API_ENDPOINTS.ONBOARDING.UPDATE(id), data);
        return response;
    },

    async deleteChecklist(id: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE(id));
        return response;
    },

    // async duplicateChecklist(id: string, newName?: string) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.DUPLICATE(id),
    //         { name: newName }
    //     );
    //     return response;
    // },

    // ============ Task Management ============
    async createTask(checklistId: string, data: ChecklistTaskForm, sortOrder?: number) {
        const response = await apiService.post(
            API_ENDPOINTS.ONBOARDING.CREATE_TASK(checklistId),
            buildChecklistTaskPayload(data, sortOrder),
        );
        return response;
    },

    async updateTask(checklistId: string, taskId: string, data: ChecklistTaskForm, sortOrder?: number) {
        const response = await apiService.put(
            API_ENDPOINTS.ONBOARDING.UPDATE_TASK(checklistId, taskId),
            buildChecklistTaskPayload(data, sortOrder),
        );
        return response;
    },

    async deleteTask(checklistId: string, taskId: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_TASK(checklistId, taskId));
        return response;
    },

    async reorderTasks(checklistId: string, data: Array<{taskId: string, sortOrder: number}>) {
        const response = await apiService.patch(API_ENDPOINTS.ONBOARDING.PATCH_REORDER(checklistId), data);
        return response;
    },

    // async bulkCreateTasks(checklistId: string, tasks: ChecklistTaskForm[]) {
    //     const payload = tasks.map((task, index) =>
    //         buildChecklistTaskPayload(task, index)
    //     );
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.BULK_TASKS(checklistId),
    //         payload
    //     );
    //     return response;
    // },

    // ============ Task Completion ============
    async getEmployeeTasks(onboardingId: string, checklistId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_BY_ID(onboardingId, checklistId));
        return response;
    },

    async completeTask(taskId: string, data?: CompleteTaskRequest) {
        const response = await apiService.patch(
            API_ENDPOINTS.ONBOARDING.PATCH_TASK(taskId),
            data || { status: "COMPLETED" }
        );
        return response;
    },

    // async skipTask(taskId: string, data?: SkipTaskRequest) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.SKIP_TASK(taskId),
    //         data || { status: "SKIPPED" }
    //     );
    //     return response;
    // },

    // async requestTaskAssistance(taskId: string, data: AssistanceRequest) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.REQUEST_ASSISTANCE(taskId),
    //         data
    //     );
    //     return response;
    // },

    // async getTaskDetails(taskId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_TASK(taskId));
    //     return response;
    // },

    // async startTask(taskId: string) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.START_TASK(taskId),
    //         { status: "IN_PROGRESS" }
    //     );
    //     return response;
    // },

    // ============ Assignment Management ============
    async assignOnboarding(data: AssignOnboardingForm) {
        const response = await apiService.post(
            API_ENDPOINTS.ONBOARDING.ASSIGN,
            buildAssignOnboardingPayload(data),
        );
        return response;
    },

    async bulkAssignOnboarding(data: BulkAssignRequest) {
        const response = await apiService.post(
            API_ENDPOINTS.ONBOARDING.BULK_ASSIGN,
            buildBulkAssignPayload(data)
        );
        return response;
    },

    async deleteEmployeeOnboarding(id: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DEACTIVATE(id));
        return response;
    },

    async reactivateOnboarding(id: string) {
        const response = await apiService.patch(API_ENDPOINTS.ONBOARDING.REACTIVATE_EMP(id));
        return response;
    },

    async getAssignments(params?: OnboardingAssignmentsQuery) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.ASSIGNMENTS, { params });
        return response;
    },

    async getEmployeeOnboardings(params?: OnboardingAssignmentsQuery) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.ASSIGNMENTS, { params });
        return response;
    },

    // async getAssignmentById(id: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_ASSIGNMENT(id));
    //     return response;
    // },

    // async updateAssignment(id: string, data: UpdateAssignmentRequest) {
    //     const response = await apiService.put(API_ENDPOINTS.ONBOARDING.UPDATE_ASSIGNMENT(id), data);
    //     return response;
    // },

    // async extendDeadline(id: string, data: ExtendDeadlineRequest) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.EXTEND_DEADLINE(id),
    //         data
    //     );
    //     return response;
    // },

    // ============ Progress Tracking ============
    async getProgress(employeeId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_PROGRESS(employeeId));
        return response;
    },

    // async getOnboardingDetail(onboardingId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_DETAIL(onboardingId));
    //     return response;
    // },

    // async getProgressSummary(params?: { department?: string; branch?: string; from?: string; to?: string }) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.PROGRESS_SUMMARY, { params });
    //     return response;
    // },

    // async getChecklistProgress(checklistId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.CHECKLIST_PROGRESS(checklistId));
    //     return response;
    // },

    // ============ Document Management ============
    async createDocument(data: CreateDocumentRequest) {
        if (!data.taskInstanceId) {
            throw new Error("taskInstanceId is required to upload an onboarding document");
        }
        if (!data.employeeId) {
            throw new Error("employeeId is required to upload an onboarding document");
        }

        const formData = new FormData();
        formData.append("file", data.file);

        const response = await apiService.post(API_ENDPOINTS.ONBOARDING.CREATE_DOC, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            params: {
                taskInstanceId: data.taskInstanceId,
                employeeId: data.employeeId,
                ...(compactString(data.notes) ? { notes: compactString(data.notes) } : {}),
            },
        });
        return response;
    },

    async getDocuments(onboardingId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_DOCUMENTS(onboardingId));
        return response;
    },

    // async getDocumentById(documentId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_DOCUMENT(documentId));
    //     return response;
    // },

    async deleteDocument(taskInstanceId: string) {
        if (!taskInstanceId) {
            throw new Error("taskInstanceId is required to delete an onboarding document");
        }
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_DOC(taskInstanceId));
        return response;
    },

    // async updateDocument(documentId: string, data: { notes?: string; documentType?: string }) {
    //     const response = await apiService.patch(API_ENDPOINTS.ONBOARDING.UPDATE_DOC(documentId), data);
    //     return response;
    // },

    // async downloadDocument(documentId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.DOWNLOAD_DOC(documentId), {
    //         responseType: 'blob'
    //     });
    //     return response;
    // },

    // async bulkUploadDocuments(employeeId: string, files: File[], taskInstanceId: string) {
    //     const formData = new FormData();
    //     files.forEach(file => formData.append("files", file));

    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.BULK_UPLOAD_DOCS,
    //         formData,
    //         {
    //             headers: { 'Content-Type': 'multipart/form-data' },
    //             params: { employeeId, taskInstanceId }
    //         }
    //     );
    //     return response;
    // },

    // ============ Notifications ============
    async sendWelcomeMessage(payload: SendWelcomeRequest) {
        const response = await apiService.post(
            API_ENDPOINTS.ONBOARDING.SEND_WELCOME,
            payload
        );
        return response;
    },

    // async sendReminder(data: ReminderRequest) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.SEND_REMINDER,
    //         data
    //     );
    //     return response;
    // },

    // async sendBulkReminder(employeeIds: string[], reminderType?: string) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.BULK_REMINDER,
    //         { employeeIds, reminderType }
    //     );
    //     return response;
    // },

    // async sendCompletionNotification(employeeId: string) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.COMPLETION_NOTIFICATION,
    //         { employeeId }
    //     );
    //     return response;
    // },

    // async getNotificationSettings() {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.NOTIFICATION_SETTINGS);
    //     return response;
    // },

    // async updateNotificationSettings(data: any) {
    //     const response = await apiService.put(API_ENDPOINTS.ONBOARDING.NOTIFICATION_SETTINGS, data);
    //     return response;
    // },

    // // ============ Completion & Review ============
    // async completeOnboarding(onboardingId: string) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.COMPLETE(onboardingId)
    //     );
    //     return response;
    // },

    // async getCompletionCertificate(onboardingId: string) {
    //     const response = await apiService.get(
    //         API_ENDPOINTS.ONBOARDING.CERTIFICATE(onboardingId)
    //     );
    //     return response;
    // },

    // async downloadCompletionCertificate(onboardingId: string) {
    //     const response = await apiService.get(
    //         API_ENDPOINTS.ONBOARDING.DOWNLOAD_CERTIFICATE(onboardingId),
    //         { responseType: 'blob' }
    //     );
    //     return response;
    // },

    // async reviewOnboarding(onboardingId: string, data: ReviewOnboardingRequest) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.REVIEW(onboardingId),
    //         data
    //     );
    //     return response;
    // },

    // ============ Analytics & Reports ============
    // async getOnboardingStats(params?: { startDate?: string; endDate?: string }) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.STATS, { params });
    //     return response;
    // },

    // async getDetailedReport(params?: {
    //     startDate?: string;
    //     endDate?: string;
    //     department?: string;
    //     branch?: string;
    // }) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.REPORT, { params });
    //     return response;
    // },

    // async exportReport(params?: any) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.EXPORT_REPORT, {
    //         params,
    //         responseType: 'blob'
    //     });
    //     return response;
    // },

    // async getEmployeeOnboardingHistory(employeeId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.EMPLOYEE_HISTORY(employeeId));
    //     return response;
    // },

    // async getChecklistAnalytics(checklistId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.CHECKLIST_ANALYTICS(checklistId));
    //     return response;
    // },

    // // ============ Template Management ============
    // async saveAsTemplate(checklistId: string, templateName: string) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.SAVE_TEMPLATE,
    //         { checklistId, templateName }
    //     );
    //     return response;
    // },

    // async getTemplates() {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.TEMPLATES);
    //     return response;
    // },

    // async applyTemplate(templateId: string, employeeIds: string[]) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.APPLY_TEMPLATE,
    //         { templateId, employeeIds }
    //     );
    //     return response;
    // },

    // async deleteTemplate(templateId: string) {
    //     const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_TEMPLATE(templateId));
    //     return response;
    // },

    // // ============ Employee Self-Service ============
    // async getMyOnboarding() {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.MY_ONBOARDING);
    //     return response;
    // },

    // async getMyTasks() {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.MY_TASKS);
    //     return response;
    // },

    // async getMyDocuments() {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.MY_DOCUMENTS);
    //     return response;
    // },

    // async markTaskAsStarted(taskId: string) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.START_TASK(taskId),
    //         { status: "IN_PROGRESS" }
    //     );
    //     return response;
    // },

    // // ============ Workflow Actions ============
    // async assignReviewer(onboardingId: string, reviewerId: string) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.ASSIGN_REVIEWER,
    //         { onboardingId, reviewerId }
    //     );
    //     return response;
    // },

    // async getWorkflowStatus(onboardingId: string) {
    //     const response = await apiService.get(API_ENDPOINTS.ONBOARDING.WORKFLOW_STATUS(onboardingId));
    //     return response;
    // },

    // async approveStep(onboardingId: string, stepId: string, data?: any) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.APPROVE_STEP(onboardingId, stepId),
    //         data
    //     );
    //     return response;
    // },

    // async rejectStep(onboardingId: string, stepId: string, reason: string) {
    //     const response = await apiService.patch(
    //         API_ENDPOINTS.ONBOARDING.REJECT_STEP(onboardingId, stepId),
    //         { reason }
    //     );
    //     return response;
    // },

    // // ============ Integration APIs ============
    // async syncWithHRIS(employeeId: string) {
    //     const response = await apiService.post(
    //         API_ENDPOINTS.ONBOARDING.SYNC_HRIS,
    //         { employeeId }
    //     );
    //     return response;
    // },

    // async generateOnboardingLetter(employeeId: string) {
    //     const response = await apiService.get(
    //         API_ENDPOINTS.ONBOARDING.GENERATE_LETTER(employeeId),
    //         { responseType: 'blob' }
    //     );
    //     return response;
    // },
};
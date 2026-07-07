import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export type AssignOnboardingForm = {
    employeeId: string;
    checklistId?: string;
    checklistIds?: string[];
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

export type ChecklistTaskType = "DOCUMENT" | "FORM" | "VIDEO" | "TRAINING" | "CUSTOM";

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
    checklistId?: string;
    checklistName?: string;
    status?: string;
    progress?: number;
    startDate?: string;
    expectedEndDate?: string;
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
    status?: string;
    description?: string;
    taskType?: ChecklistTaskType;
    documentName?: string;
    [key: string]: any;
};

export type OnboardingDocument = {
    id?: string;
    taskInstanceId?: string;
    taskId?: string;
    documentType?: string;
    documentName?: string;
    fileName?: string;
    fileUrl?: string;
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

export const CHECKLIST_TASK_TYPES: ChecklistTaskType[] = [
    "DOCUMENT",
    "FORM",
    "VIDEO",
    "TRAINING",
    "CUSTOM",
];

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

    // The assignment UI currently captures startDate, but Swagger accepts dueDate.
    // Do not send startDate unless the UI is changed to capture a true due date.
    return payload;
};

export const buildSendWelcomePayload = (employeeId: string): SendWelcomeRequest => ({
    employeeIds: [employeeId],
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

export const onBoardService = {

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

    async updateChecklist(id: string, data: any) {
        const response = await apiService.put(API_ENDPOINTS.ONBOARDING.UPDATE(id), data);
        return response;
    },

    async deleteChecklist(id: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE(id));
        return response;
    },

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

    async getEmployeeTasks(onboardingId: string, checklistId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_BY_ID(onboardingId, checklistId));
        return response;
    },

    async completeTask(taskId: string, data?: any) {
        const response = await apiService.patch(API_ENDPOINTS.ONBOARDING.PATCH_TASK(taskId), data);
        return response;
    },

    async assignOnboarding(data: AssignOnboardingForm) {
        const response = await apiService.post(
            API_ENDPOINTS.ONBOARDING.ASSIGN,
            buildAssignOnboardingPayload(data),
        );
        return response;
    },

    async deleteEmployeeOnboarding(id: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_EMP(id));
        return response;
    },

    async reactivateOnboarding(id: string) {
        const response = await apiService.patch(API_ENDPOINTS.ONBOARDING.REACTIVATE_EMP(id));
        return response;
    },

    async getProgress(employeeId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_PROGRESS(employeeId));
        return response;
    },

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

    async deleteDocument(taskInstanceId: string) {
        if (!taskInstanceId) {
            throw new Error("taskInstanceId is required to delete an onboarding document");
        }
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_DOC(taskInstanceId));
        return response;
    },

    async sendWelcomeMessage(payload: any) {
        const response = await apiService.post(
            API_ENDPOINTS.ONBOARDING.SEND_WELCOME,
            // buildSendWelcomePayload(employeeId),
             payload 
        );
        return response;
    },

    getAssignments: async (params?: OnboardingAssignmentsQuery) => {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.ASSIGNMENTS, { params });
        return response;
    },

    getEmployeeOnboardings: async (params?: OnboardingAssignmentsQuery) => {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.ASSIGNMENTS, { params });
        return response;
    },
};

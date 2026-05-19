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
    taskType?: string;
    sortOrder?: number;
    required?: boolean;
};

export type ChecklistTaskRequest = {
    title: string;
    description: string;
    taskType: string;
    documentName: string;
    sortOrder: number;
    required: boolean;
};

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
    taskType: form.taskType ?? "GENERAL",
    documentName: form.documentName ?? "",
    sortOrder: form.sortOrder ?? fallbackSortOrder,
    required: form.required ?? true,
});

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

    async reorderTasks(checklistId: string, data: { taskIds: string[] }) {
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

    async getProgress(employeeId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_PROGRESS(employeeId));
        return response;
    },

    async createDocument(data: FormData) {
        const response = await apiService.post(API_ENDPOINTS.ONBOARDING.CREATE_DOC, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    async getDocuments(onboardingId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_DOCUMENTS(onboardingId));
        return response;
    },

    async deleteDocument(documentId: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_DOC(documentId));
        return response;
    },

    async sendWelcomeMessage(employeeId: string) {
        const response = await apiService.post(
            API_ENDPOINTS.ONBOARDING.SEND_WELCOME,
            buildSendWelcomePayload(employeeId),
        );
        return response;
    },

    getEmployeeOnboardings: async (params?: any) => {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.EMPLOYEE_ONBOARDINGS, { params });
        return response;
    },
};

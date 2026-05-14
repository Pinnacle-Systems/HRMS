import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

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

    async createTask(checklistId: string, data: any) {
        const response = await apiService.post(API_ENDPOINTS.ONBOARDING.CREATE_TASK(checklistId), data);
        return response;
    },

    async updateTask(checklistId: string, taskId: string, data: any) {
        const response = await apiService.put(API_ENDPOINTS.ONBOARDING.UPDATE_TASK(checklistId, taskId), data);
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

    async assignOnboarding(data: any) {
        const response = await apiService.post(API_ENDPOINTS.ONBOARDING.ASSIGN, data);
        return response;
    },

    async deleteEmployeeOnboarding(id: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_EMP(id));
        return response;
    },

    async getProgress(onboardingId: string) {
        const response = await apiService.get(API_ENDPOINTS.ONBOARDING.GET_PROGRESS(onboardingId));
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
        const response = await apiService.get(`/onboarding/${onboardingId}/documents`);
        return response;
    },

    async deleteDocument(documentId: string) {
        const response = await apiService.delete(API_ENDPOINTS.ONBOARDING.DELETE_DOC(documentId));
        return response;
    },

    async sendWelcomeMessage(data: { employeeId: string; onboardingId: string }) {
        const response = await apiService.post(API_ENDPOINTS.ONBOARDING.SEND_WELCOME, data);
        return response;
    },

    // Add to onBoardService
    getEmployeeOnboardings: async (params?: any) => {
        const response = await apiService.get('/onboarding/employee-onboardings', { params });
        return response;
    },
};
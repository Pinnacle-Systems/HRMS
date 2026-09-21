import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

// --- Types ---
export interface MusterSetting {
    id: string;
    status: string;
    musterType: string;
    specification: string;
    sequence: number;
    color: string;
    active: boolean;
}

export interface MusterSettingPayload {
    status: string;
    musterType: string;
    specification: string;
    sequence: number;
    color: string;
    active: boolean;
}

export const musterService = {

    async getMusterSettings(): Promise<MusterSetting[]> {
        const response: any = await apiService.get(API_ENDPOINTS.MUSTER_SETTINGS.LIST);
        return response.data;
    },

    async getMusterSettingById(id: string): Promise<MusterSetting> {
        const response: any = await apiService.get(API_ENDPOINTS.MUSTER_SETTINGS.DETAIL(id));
        return response.data;
    },

    async createMusterSetting(data: MusterSettingPayload): Promise<MusterSetting> {
        const response: any = await apiService.post(API_ENDPOINTS.MUSTER_SETTINGS.CREATE, data);
        return response.data;
    },

    async updateMusterSetting(id: string, data: MusterSettingPayload): Promise<MusterSetting> {
        const response: any = await apiService.put(API_ENDPOINTS.MUSTER_SETTINGS.UPDATE(id), data);
        return response.data;
    },
};
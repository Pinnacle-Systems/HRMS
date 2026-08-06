import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface WhatsAppConfig {
  id: string;
  name: string;
  provider: string;
  accountSid: string;
  authToken?: string;
  fromNumber: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateWhatsAppConfigPayload {
  name: string;
  provider: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
  isDefault?: boolean;
  active?: boolean;
}

export interface UpdateWhatsAppConfigPayload {
  name?: string;
  provider?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  isDefault?: boolean;
  active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface SMSConfig {
  id: string;
  name: string;
  provider: "TWILIO" | "GENERIC_HTTP" | string;
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
  baseUrl?: string;
  apiKey?: string;
  senderId?: string;
  httpMethod?: "GET" | "POST" | string;
  paramMapping?: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateSMSConfigPayload {
  name: string;
  provider: string;
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
  baseUrl?: string;
  apiKey?: string;
  senderId?: string;
  httpMethod?: string;
  paramMapping?: string;
  isDefault?: boolean;
  active?: boolean;
}

export interface UpdateSMSConfigPayload {
  name?: string;
  provider?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  baseUrl?: string;
  apiKey?: string;
  senderId?: string;
  httpMethod?: string;
  paramMapping?: string;
  isDefault?: boolean;
  active?: boolean;
}

export interface TestSMSPayload {
  to: string;
  message?: string;
  templateCode?: string;
  variables?: Record<string, any>;
}

export interface TestSMSResponse {
  sent: boolean;
  provider: string;
  reference: string;
  detail: string;
}

export interface EmailConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  auth: boolean;
  starttls: boolean;
  ssl: boolean;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateEmailConfigPayload {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  auth?: boolean;
  starttls?: boolean;
  ssl?: boolean;
  isDefault?: boolean;
  active?: boolean;
}

export interface UpdateEmailConfigPayload {
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
  auth?: boolean;
  starttls?: boolean;
  ssl?: boolean;
  isDefault?: boolean;
  active?: boolean;
}

export interface TestEmailPayload {
  to: string;
  subject?: string;
  body?: string;
  templateCode?: string;
  variables?: Record<string, any>;
}

export interface TestEmailResponse {
  sent: boolean;
  provider: string;
  reference: string;
  detail: string;
}

export const configService = {
  async getWhatsAppConfigs(): Promise<ApiResponse<WhatsAppConfig[]>> {
    try {
      return await apiService.get(
        API_ENDPOINTS.WHATSAPP.GET_ALL,
      );
    } catch (error) {
      console.error("Error fetching WhatsApp configs:", error);
      throw error;
    }
  },

  async getWhatsAppConfigById(
    id: string,
  ): Promise<ApiResponse<WhatsAppConfig>> {
    try {
      return await apiService.get(
        API_ENDPOINTS.WHATSAPP.GET_BY_ID(id),
      );
    } catch (error) {
      console.error(`Error fetching WhatsApp config ${id}:`, error);
      throw error;
    }
  },

  async createWhatsAppConfig(
    payload: CreateWhatsAppConfigPayload,
  ): Promise<ApiResponse<WhatsAppConfig>> {
    try {
      return await apiService.post(
        API_ENDPOINTS.WHATSAPP.CREATE,
        payload,
      );
    } catch (error) {
      console.error("Error creating WhatsApp config:", error);
      throw error;
    }
  },

  async updateWhatsAppConfig(
    id: string,
    payload: UpdateWhatsAppConfigPayload,
  ): Promise<ApiResponse<WhatsAppConfig>> {
    try {
      return await apiService.put(
        API_ENDPOINTS.WHATSAPP.UPDATE(id),
        payload,
      );
    } catch (error) {
      console.error(`Error updating WhatsApp config ${id}:`, error);
      throw error;
    }
  },

  async deleteWhatsAppConfig(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(
        API_ENDPOINTS.WHATSAPP.DELETE(id),
      );
    } catch (error) {
      console.error(`Error deleting WhatsApp config ${id}:`, error);
      throw error;
    }
  },

  async setDefaultWhatsAppConfig(
    id: string,
  ): Promise<ApiResponse<WhatsAppConfig>> {
    try {
      return await apiService.patch(
        API_ENDPOINTS.WHATSAPP.SET_DEFAULT(id),
      );
    } catch (error) {
      console.error(`Error setting default WhatsApp config ${id}:`, error);
      throw error;
    }
  },

  async getSMSConfigs(): Promise<ApiResponse<SMSConfig[]>> {
    try {
      return await apiService.get(API_ENDPOINTS.SMS.GET_ALL);
    } catch (error) {
      console.error("Error fetching SMS configs:", error);
      throw error;
    }
  },

  async getSMSConfigById(id: string): Promise<ApiResponse<SMSConfig>> {
    try {
      return await apiService.get(
        API_ENDPOINTS.SMS.GET_BY_ID(id),
      );
    } catch (error) {
      console.error(`Error fetching SMS config ${id}:`, error);
      throw error;
    }
  },

  async createSMSConfig(
    payload: CreateSMSConfigPayload,
  ): Promise<ApiResponse<SMSConfig>> {
    try {
      return await apiService.post(
        API_ENDPOINTS.SMS.CREATE,
        payload,
      );
    } catch (error) {
      console.error("Error creating SMS config:", error);
      throw error;
    }
  },

  async updateSMSConfig(
    id: string,
    payload: UpdateSMSConfigPayload,
  ): Promise<ApiResponse<SMSConfig>> {
    try {
      return await apiService.put(
        API_ENDPOINTS.SMS.UPDATE(id),
        payload,
      );
    } catch (error) {
      console.error(`Error updating SMS config ${id}:`, error);
      throw error;
    }
  },

  async deleteSMSConfig(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(
        API_ENDPOINTS.SMS.DELETE(id),
      );
    } catch (error) {
      console.error(`Error deleting SMS config ${id}:`, error);
      throw error;
    }
  },

  async setDefaultSMSConfig(id: string): Promise<ApiResponse<SMSConfig>> {
    try {
      return await apiService.patch(
        API_ENDPOINTS.SMS.SET_DEFAULT(id),
      );
    } catch (error) {
      console.error(`Error setting default SMS config ${id}:`, error);
      throw error;
    }
  },

  async testSMSConfig(
    id: string,
    payload: TestSMSPayload,
  ): Promise<ApiResponse<TestSMSResponse>> {
    try {
      return await apiService.post(
        API_ENDPOINTS.SMS.TEST(id),
        payload,
      );
    } catch (error) {
      console.error(`Error testing SMS config ${id}:`, error);
      throw error;
    }
  },

  async getEmailConfigs(): Promise<ApiResponse<EmailConfig[]>> {
    try {
     return await apiService.get(API_ENDPOINTS.EMAIL.GET_ALL);
    } catch (error) {
      console.error("Error fetching Email configs:", error);
      throw error;
    }
  },

  async getEmailConfigById(id: string): Promise<ApiResponse<EmailConfig>> {
    try {
      return await apiService.get(
        API_ENDPOINTS.EMAIL.GET_BY_ID(id),
      );
    } catch (error) {
      console.error(`Error fetching Email config ${id}:`, error);
      throw error;
    }
  },

  async createEmailConfig(
    payload: CreateEmailConfigPayload,
  ): Promise<ApiResponse<EmailConfig>> {
    try {
      return await apiService.post(
        API_ENDPOINTS.EMAIL.CREATE,
        payload,
      );
    } catch (error) {
      console.error("Error creating Email config:", error);
      throw error;
    }
  },

  async updateEmailConfig(
    id: string,
    payload: UpdateEmailConfigPayload,
  ): Promise<ApiResponse<EmailConfig>> {
    try {
      return await apiService.put(
        API_ENDPOINTS.EMAIL.UPDATE(id),
        payload,
      );
    } catch (error) {
      console.error(`Error updating Email config ${id}:`, error);
      throw error;
    }
  },

  async deleteEmailConfig(id: string): Promise<ApiResponse<null>> {
    try {
      return await apiService.delete(
        API_ENDPOINTS.EMAIL.DELETE(id),
      );
    } catch (error) {
      console.error(`Error deleting Email config ${id}:`, error);
      throw error;
    }
  },

  async setDefaultEmailConfig(id: string): Promise<ApiResponse<EmailConfig>> {
    try {
      return await apiService.patch(
        API_ENDPOINTS.EMAIL.SET_DEFAULT(id),
      );
    } catch (error) {
      console.error(`Error setting default Email config ${id}:`, error);
      throw error;
    }
  },

  async testEmailConfig(
    id: string,
    payload: TestEmailPayload,
  ): Promise<ApiResponse<TestEmailResponse>> {
    try {
      return await apiService.post(
        API_ENDPOINTS.EMAIL.TEST(id),
        payload,
      );
    } catch (error) {
      console.error(`Error testing Email config ${id}:`, error);
      throw error;
    }
  },
};

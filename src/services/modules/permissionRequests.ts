import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export type PermissionRequestType = "official_work" | "personal_work";

export type ApiTime = string | {
  hour?: number;
  minute?: number;
  second?: number;
};

export type PermissionRequestDto = {
  id: string;
  requestNumber?: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  permissionType: PermissionRequestType;
  date: string;
  departureTime: ApiTime;
  expectedReturnTime: ApiTime;
  destination: string;
  reason: string;
  gatePassSlipGenerated: boolean;
  qrToken?: string;
  qrGeneratedAt?: string;
  qrCodeImageBase64?: string;
  slipDownloadUrl?: string;
  createdAt: string;
};

export type PermissionRequestPage = {
  content: PermissionRequestDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type PermissionRequestQuery = {
  employeeId?: string;
  permissionType?: PermissionRequestType;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string[];
};

export type CreatePermissionRequestPayload = {
  employeeId: string;
  permissionType: PermissionRequestType;
  date: string;
  departureTime: string;
  expectedReturnTime: string;
  destination: string;
  reason: string;
  generateGatePassSlip: boolean;
};

export type PermissionQrValidation = {
  valid: boolean;
  requestNumber?: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  permissionType?: PermissionRequestType;
  date?: string;
  departureTime?: ApiTime;
  expectedReturnTime?: ApiTime;
  destination?: string;
  reason?: string;
  submittedAt?: string;
  message?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type PermissionType = "PERSONAL" | "OFFICIAL";


function unwrap<T>(response: ApiEnvelope<T>): T {
  if (!response.success) {
    throw new Error(response.message || "Permission request API failed.");
  }
  if (response.data === undefined) {
    throw new Error(response.message || "Permission request response had no data.");
  }
  return response.data;
}

export const permissionRequestService = {
  async permissionReqList(
    query: PermissionRequestQuery,
  ): Promise<PermissionRequestPage> {
    const response = await apiService.get<ApiEnvelope<PermissionRequestPage>>(
      API_ENDPOINTS.PERMISSION_REQUESTS.BASE,
      { params: query },
    );
    return unwrap(response);
  },

  async permissionListMine(query: Pick<PermissionRequestQuery, "page" | "size" | "sort">) {
    const response = await apiService.get<ApiEnvelope<PermissionRequestPage>>(
      API_ENDPOINTS.PERMISSION_REQUESTS.MY,
      { params: query },
    );
    return unwrap(response);
  },

  async getPerRequestById(id: string): Promise<PermissionRequestDto> {
    const response = await apiService.get<ApiEnvelope<PermissionRequestDto>>(
      API_ENDPOINTS.PERMISSION_REQUESTS.BY_ID(id),
    );
    return unwrap(response);
  },

  async createPermission(
    payload: CreatePermissionRequestPayload,
  ): Promise<PermissionRequestDto> {
    const response = await apiService.post<ApiEnvelope<PermissionRequestDto>>(
      API_ENDPOINTS.PERMISSION_REQUESTS.BASE,
      payload,
    );
    return unwrap(response);
  },

  async getQr(id: string): Promise<PermissionRequestDto> {
    const response = await apiService.get<ApiEnvelope<PermissionRequestDto>>(
      API_ENDPOINTS.PERMISSION_REQUESTS.QR(id),
    );
    return unwrap(response);
  },

  async validateQr(qrToken: string): Promise<PermissionQrValidation> {
    const response = await apiService.get<ApiEnvelope<PermissionQrValidation>>(
      API_ENDPOINTS.PERMISSION_REQUESTS.VALIDATE_QR(qrToken),
    );
    return unwrap(response);
  },

  async downloadSlip(id: string, filename: string): Promise<void> {
    await apiService.download(API_ENDPOINTS.PERMISSION_REQUESTS.SLIP(id), filename);
  },
};

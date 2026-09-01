import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

interface GetCompanyParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class CompanyService {
  async getCompany(params?: GetCompanyParams) {
    return apiService.get(API_ENDPOINTS.COMPANY.BASE, { params });
  }

  async deleteCompanyById(id: any) {
    return apiService.delete(API_ENDPOINTS.COMPANY.DELETE(id));
  }

  async getCompanyById(id: any) {
    return apiService.get(API_ENDPOINTS.COMPANY.GET_BY_ID(id));
  }

  async createCompany(payload: any) {
    return apiService.post(API_ENDPOINTS.COMPANY.CREATE, payload);
  }

  async updateCompany(id: any, payload:any) {
    return apiService.put(API_ENDPOINTS.COMPANY.UPDATE(id), payload);
  }

  async uploadLogo (id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiService.post(API_ENDPOINTS.COMPANY.UPLOAD_LOGO(id), formData);
    return response;
  }

  async uploadSignature (id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiService.post(API_ENDPOINTS.COMPANY.UPLOAD_SIGNATURE(id), formData);
    return response;
  }

  async deleteLogo(id: string){
    const response = await apiService.delete(API_ENDPOINTS.COMPANY.DELETE_LOGO(id));
    return response;
  }

  async deleteSignature (id: string){
    const response = await apiService.delete(API_ENDPOINTS.COMPANY.DELETE_SIGNATURE(id));
    return response;
  }

  async getPasswordConfig(params?: any) {
    return apiService.get(API_ENDPOINTS.PASSWORD_CONFIG.BASE, { params });
  }

  async updatePasswordConfig(data: any) {
    return apiService.put(API_ENDPOINTS.PASSWORD_CONFIG.BASE,data);
  }

  async getCompanyDetailsByGST(params: {gstNo : string}) {
    return apiService.get(API_ENDPOINTS.COMPANY.GET_COMPANY_BY_GST, { params });
  }
  
  async getCompanyDetailsByGSTLookup(params: {gstNo : string,refresh: boolean}) {
    return apiService.get(API_ENDPOINTS.COMPANY.GST_LOOKUP, { params });
  }

  async searchGSTByCompany(params: {companyName: string, state?: string}) {
    return apiService.get(API_ENDPOINTS.COMPANY.GET_GST_BY_COMPANY, { params });
  }

}
export const companyService = new CompanyService();

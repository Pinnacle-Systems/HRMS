// // services/modules/company.ts
// import { apiService } from '../api/api.config';
// import { API_ENDPOINTS } from '../api/endpoints';
// import { ApiResponse, Company, MasterData, QueryParams } from '../api/api.types';

// class CompanyService {
//   // ==================== Basic CRUD ====================
  
//   // Get all companies with pagination
//   async getCompanies(params?: QueryParams): Promise<ApiResponse<Company[]>> {
//     return apiService.get<Company[]>(API_ENDPOINTS.COMPANY.BASE, { params });
//   }

//   // Get single company by ID
//   async getCompany(id: string): Promise<ApiResponse<Company>> {
//     return apiService.get<Company>(API_ENDPOINTS.COMPANY.GET_BY_ID(id));
//   }

//   // Create new company
//   async createCompany(data: Partial<Company>): Promise<ApiResponse<Company>> {
//     return apiService.post<Company>(API_ENDPOINTS.COMPANY.CREATE, data);
//   }

//   // Update company
//   async updateCompany(id: string, data: Partial<Company>): Promise<ApiResponse<Company>> {
//     return apiService.put<Company>(API_ENDPOINTS.COMPANY.UPDATE(id), data);
//   }

//   // Delete company
//   async deleteCompany(id: string): Promise<ApiResponse<void>> {
//     return apiService.delete(API_ENDPOINTS.COMPANY.DELETE(id));
//   }

//   // ==================== File Upload ====================
  
//   // Upload company logo
//   async uploadLogo(id: string, file: File): Promise<ApiResponse<{ logoUrl: string }>> {
//     return apiService.upload<{ logoUrl: string }>(
//       API_ENDPOINTS.COMPANY.UPLOAD_LOGO(id),
//       file,
//       'logo'
//     );
//   }

//   // Upload company signature
//   async uploadSignature(id: string, file: File): Promise<ApiResponse<{ signatureUrl: string }>> {
//     return apiService.upload<{ signatureUrl: string }>(
//       API_ENDPOINTS.COMPANY.UPLOAD_SIGNATURE(id),
//       file,
//       'signature'
//     );
//   }

//   // Upload multiple documents
//   async uploadDocuments(id: string, files: File[]): Promise<ApiResponse<{ urls: string[] }>> {
//     return apiService.uploadMultiple<{ urls: string[] }>(
//       `${API_ENDPOINTS.COMPANY.BASE}/${id}/documents`,
//       files,
//       'documents'
//     );
//   }

//   // ==================== File Download ====================
  
//   // Download company report
//   async downloadReport(id: string, format: 'pdf' | 'excel' = 'pdf'): Promise<void> {
//     return apiService.download(
//       API_ENDPOINTS.COMPANY.DOWNLOAD_REPORT(id),
//       `company-report-${id}.${format}`
//     );
//   }

//   // Export all companies
//   async exportCompanies(format: 'excel' | 'csv' = 'excel'): Promise<void> {
//     return apiService.download(
//       `${API_ENDPOINTS.COMPANY.EXPORT}?format=${format}`,
//       `companies.${format}`
//     );
//   }

//   // ==================== Import ====================
  
//   // Import companies from file
//   async importCompanies(file: File): Promise<ApiResponse<{ imported: number; failed: number; errors: any[] }>> {
//     return apiService.upload<{ imported: number; failed: number; errors: any[] }>(
//       API_ENDPOINTS.COMPANY.IMPORT,
//       file,
//       'file'
//     );
//   }

//   // ==================== Master Data ====================
  
//   // Get all master data
//   async getMasterData(): Promise<ApiResponse<MasterData>> {
//     return apiService.get<MasterData>(API_ENDPOINTS.COMPANY.MASTER_DATA);
//   }

//   // Add master data item
//   async addMasterDataItem(field: string, value: string): Promise<ApiResponse<{ field: string; value: string }>> {
//     return apiService.post<{ field: string; value: string }>(
//       API_ENDPOINTS.COMPANY.ADD_MASTER_DATA,
//       { field, value }
//     );
//   }

//   // Update master data
//   async updateMasterData(field: string, values: string[]): Promise<ApiResponse<MasterData>> {
//     return apiService.put<MasterData>(
//       `${API_ENDPOINTS.COMPANY.MASTER_DATA}/${field}`,
//       { values }
//     );
//   }

//   // Get specific master data by field
//   async getMasterDataByField(field: keyof MasterData): Promise<ApiResponse<string[]>> {
//     return apiService.get<string[]>(`${API_ENDPOINTS.COMPANY.MASTER_DATA}/${field}`);
//   }

//   // ==================== Additional Features ====================
  
//   // Search companies
//   async searchCompanies(searchTerm: string): Promise<ApiResponse<Company[]>> {
//     return apiService.get<Company[]>(`${API_ENDPOINTS.COMPANY.BASE}/search`, {
//       params: { q: searchTerm }
//     });
//   }

//   // Get company statistics
//   async getCompanyStats(): Promise<ApiResponse<{
//     total: number;
//     active: number;
//     inactive: number;
//   }>> {
//     return apiService.get(`${API_ENDPOINTS.COMPANY.BASE}/stats`);
//   }

//   // Bulk update companies
//   async bulkUpdateCompanies(updates: Array<{ id: string; data: Partial<Company> }>): Promise<ApiResponse<Company[]>> {
//     return apiService.post<Company[]>(`${API_ENDPOINTS.COMPANY.BASE}/bulk-update`, { updates });
//   }

//   // Delete multiple companies
//   async bulkDeleteCompanies(ids: string[]): Promise<ApiResponse<void>> {
//     return apiService.post(`${API_ENDPOINTS.COMPANY.BASE}/bulk-delete`, { ids });
//   }
// }

// export const companyService = new CompanyService();
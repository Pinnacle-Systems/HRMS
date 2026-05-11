import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export const employeeService = {
  // ==================== MAIN CRUD OPERATIONS ====================
  
  async getEmployees(params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.BASE, { params });
  },

  async getEmployeeById(id: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_BY_ID(id));
  },

  async createEmployee(data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.CREATE, data);
  },

  async updateEmployee(id: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE(id), data);
  },

  async deleteEmployee(id: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE(id));
  },

  // ==================== PATCH OPERATIONS (Specific Sections) ====================
  
  async updatePersonalInfo(id: string, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_PERSONAL(id), data);
  },

  async updateIdentityInfo(id: string, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_IDENTITY(id), data);
  },

  async updateBankDetails(id: string, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_BANK(id), data);
  },

  async updateEligibilityInfo(id: string, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_PF(id), data);
  },

  async updateBackgroundInfo(id: string, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_BG(id), data);
  },

  async updateAdminInfo(id: string, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_ADMIN(id), data);
  },

  // ==================== TRAINING DETAILS ====================
  
  async getTrainingDetails(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_TRAINING(id), { params });
  },

  async addTrainingDetail(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_TRAINING(id), data);
  },

  async updateTrainingDetail(id: string, trainingId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_TRAINING(id, trainingId), data);
  },

  async deleteTrainingDetail(id: string, trainingId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_TRAINING(id, trainingId));
  },

  // ==================== QUALIFICATIONS ====================
  
  async getQualifications(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_QUALIFICATION(id), { params });
  },

  async addQualification(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_QUALIFICATION(id), data);
  },

  async updateQualification(id: string, qualificationId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_QUALIFICATION(id, qualificationId), data);
  },

  async deleteQualification(id: string, qualificationId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_QUALIFICATION(id, qualificationId));
  },

  // ==================== PREVIOUS EMPLOYMENTS ====================
  
  async getPreviousEmployments(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_PRE_EMP(id), { params });
  },

  async addPreviousEmployment(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_PRE_EMP(id), data);
  },

  async updatePreviousEmployment(id: string, employmentId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_PRE_EMP(id, employmentId), data);
  },

  async deletePreviousEmployment(id: string, employmentId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_PRE_EMP(id, employmentId));
  },

  // ==================== PF ACCOUNTS ====================
  
  async getPfAccounts(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_PF(id), { params });
  },

  async addPfAccount(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_PF(id), data);
  },

  async updatePfAccount(id: string, pfId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_PF(id, pfId), data);
  },

  async deletePfAccount(id: string, pfId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_PF(id, pfId));
  },

  // ==================== NOMINATIONS ====================
  
  async getNominations(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_NOMINATION(id), { params });
  },

  async addNomination(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_NOMINATION(id), data);
  },

  async updateNomination(id: string, nominationId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_NOMINATION(id, nominationId), data);
  },

  async deleteNomination(id: string, nominationId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_NOMINATION(id, nominationId));
  },

  // ==================== FAMILY MEMBERS ====================
  
  async getFamilyMembers(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_FAMILY(id), { params });
  },

  async addFamilyMember(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_FAMILY(id), data);
  },

  async updateFamilyMember(id: string, familyId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_FAMILY(id, familyId), data);
  },

  async deleteFamilyMember(id: string, familyId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_FAMILY(id, familyId));
  },

  // ==================== EMERGENCY CONTACTS ====================
  
  async getEmergencyContacts(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_EMERGENCY(id), { params });
  },

  async addEmergencyContact(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_EMERGENCY(id), data);
  },

  async updateEmergencyContact(id: string, contactId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_EMERGENCY(id, contactId), data);
  },

  async deleteEmergencyContact(id: string, contactId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_EMERGENCY(id, contactId));
  },

  // ==================== ADDRESSES ====================
  
  async getAddresses(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_ADDRESS(id), { params });
  },

  async addAddress(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_ADDRESS(id), data);
  },

  async updateAddress(id: string, addressId: string, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_ADDRESS(id, addressId), data);
  },

  async deleteAddress(id: string, addressId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_ADDRESS(id, addressId));
  },

  // ==================== ATTACHMENTS ====================
  
  async getAttachments(id: string, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_ATTACHMENT(id), { params });
  },

  async addAttachment(id: string, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_ATTACHMENT(id), data);
  },

  async deleteAttachment(id: string, attachmentId: string) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_ATTACHMENT(id, attachmentId));
  },

  // ==================== PHOTO UPLOAD ====================
  
  async uploadPhoto(id: string, file: File) {
    const formData = new FormData();
    formData.append("photo", file);
    return apiService.post(API_ENDPOINTS.EMPLOYEE.UPLOAD_PHOTO(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ==================== BULK UPLOAD ====================
  
  async bulkUploadEmployees(formData: FormData, onProgress?: (progress: number) => void) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.BULK_UPLOAD, formData, {
      // headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  // ==================== EMPLOYEE ID PATTERN ====================
  
  async getEmployeeIdPattern() {
    return apiService.get("/employees/id-pattern");
  },

  async incrementIdSequence(pattern: string) {
    return apiService.post("/employees/id-sequence/increment", { pattern });
  },

  // ==================== WELCOME EMAIL ====================
  
  async resendWelcomeEmail(id: string) {
    return apiService.post(`/employees/${id}/resend-welcome`);
  },

  // ==================== SAMPLE TEMPLATE ====================
  
  async downloadSampleTemplate() {
    const response:any = await apiService.get("/employees/sample-template", {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employee_sample_template.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
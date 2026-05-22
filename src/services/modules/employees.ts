import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

type EmployeeLike = Record<string, any>;

export const normalizeEmployeesResponse = (response: any): EmployeeLike[] => {
  const payload = response?.data ?? response;
  const candidates = [
    payload?.content,
    payload?.employees,
    payload?.items,
    payload?.records,
    payload?.data?.content,
    payload?.data,
    payload,
  ];
  const employees = candidates.find(Array.isArray) ?? [];

  return employees.map((employee: EmployeeLike) => {
    const name =
      employee.name ||
      employee.fullName ||
      employee.employeeName ||
      [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      employee.emailAddress ||
      employee.email ||
      employee.employeeId ||
      employee.id ||
      "";

    return {
      ...employee,
      id: employee.id || employee.employeeId,
      employeeId: employee.employeeId || employee.employeeCode || employee.code || "",
      name,
    };
  });
};

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

  async updateEmployee(id: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE(id), data);
  },

  async deleteEmployee(id: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE(id));
  },

  // ==================== PATCH OPERATIONS (Specific Sections) ====================
  
  async updatePersonalInfo(id: any, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_PERSONAL(id), data);
  },

  async updateIdentityInfo(id: any, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_IDENTITY(id), data);
  },

  async updateBankDetails(id: any, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_BANK(id), data);
  },

  async updateEligibilityInfo(id: any, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_PF(id), data);
  },

  async updateBackgroundInfo(id: any, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_BG(id), data);
  },

  async updateAdminInfo(id: any, data: any) {
    return apiService.patch(API_ENDPOINTS.EMPLOYEE.PATCH_ADMIN(id), data);
  },

  // ==================== TRAINING DETAILS ====================
  
  async getTrainingDetails(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_TRAINING(id), { params });
  },

  async addTrainingDetail(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_TRAINING(id), data);
  },

  async updateTrainingDetail(id: any, trainingId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_TRAINING(id, trainingId), data);
  },

  async deleteTrainingDetail(id: any, trainingId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_TRAINING(id, trainingId));
  },

  // ==================== QUALIFICATIONS ====================
  
  async getQualifications(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_QUALIFICATION(id), { params });
  },

  async addQualification(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_QUALIFICATION(id), data);
  },

  async updateQualification(id: any, qualificationId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_QUALIFICATION(id, qualificationId), data);
  },

  async deleteQualification(id: any, qualificationId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_QUALIFICATION(id, qualificationId));
  },

  // ==================== PREVIOUS EMPLOYMENTS ====================
  
  async getPreviousEmployments(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_PRE_EMP(id), { params });
  },

  async addPreviousEmployment(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_PRE_EMP(id), data);
  },

  async updatePreviousEmployment(id: any, employmentId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_PRE_EMP(id, employmentId), data);
  },

  async deletePreviousEmployment(id: any, employmentId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_PRE_EMP(id, employmentId));
  },

  // ==================== PF ACCOUNTS ====================
  
  async getPfAccounts(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_PF(id), { params });
  },

  async addPfAccount(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_PF(id), data);
  },

  async updatePfAccount(id: any, pfId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_PF(id, pfId), data);
  },

  async deletePfAccount(id: any, pfId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_PF(id, pfId));
  },

  // ==================== NOMINATIONS ====================
  
  async getNominations(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_NOMINATION(id), { params });
  },

  async addNomination(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_NOMINATION(id), data);
  },

  async updateNomination(id: any, nominationId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_NOMINATION(id, nominationId), data);
  },

  async deleteNomination(id: any, nominationId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_NOMINATION(id, nominationId));
  },

  // ==================== FAMILY MEMBERS ====================
  
  async getFamilyMembers(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_FAMILY(id), { params });
  },

  async addFamilyMember(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_FAMILY(id), data);
  },

  async updateFamilyMember(id: any, familyId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_FAMILY(id, familyId), data);
  },

  async deleteFamilyMember(id: any, familyId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_FAMILY(id, familyId));
  },

  // ==================== EMERGENCY CONTACTS ====================
  
  async getEmergencyContacts(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_EMERGENCY(id), { params });
  },

  async addEmergencyContact(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_EMERGENCY(id), data);
  },

  async updateEmergencyContact(id: any, contactId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_EMERGENCY(id, contactId), data);
  },

  async deleteEmergencyContact(id: any, contactId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_EMERGENCY(id, contactId));
  },

  // ==================== ADDRESSES ====================
  
  async getAddresses(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_ADDRESS(id), { params });
  },

  async addAddress(id: any, data: any) {
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_ADDRESS(id), data);
  },

  async updateAddress(id: any, addressId: any, data: any) {
    return apiService.put(API_ENDPOINTS.EMPLOYEE.UPDATE_ADDRESS(id, addressId), data);
  },

  async deleteAddress(id: any, addressId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_ADDRESS(id, addressId));
  },

  // ==================== ATTACHMENTS ====================
  
  async getAttachments(id: any, params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.GET_ATTACHMENT(id), { params });
  },

  async addAttachment(id: any, file: any) {
    const formData = new FormData();
    formData.append("file", file.file);
    formData.append("documentName ", file.documentName);
    formData.append("documentType ", file.documentType);
    return apiService.post(API_ENDPOINTS.EMPLOYEE.POST_ATTACHMENT(id), formData);
  },

  async deleteAttachment(id: any, attachmentId: any) {
    return apiService.delete(API_ENDPOINTS.EMPLOYEE.DELETE_ATTACHMENT(id, attachmentId));
  },

  // ==================== PHOTO UPLOAD ====================
  
  async uploadPhoto(id: any, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return apiService.post(API_ENDPOINTS.EMPLOYEE.UPLOAD_PHOTO(id), formData);
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
  
  async resendWelcomeEmail(id: any) {
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

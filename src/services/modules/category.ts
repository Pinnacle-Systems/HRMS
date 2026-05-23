import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface GetCategoryItemsParams {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  isActive?: boolean;
}

export const categoryService = {
  // Category CRUD
  async getCategories() {
    return apiService.get(API_ENDPOINTS.CATEGORY.BASECAT);
  },

  async getCategoryById(id: string) {
    return apiService.get(API_ENDPOINTS.CATEGORY.GET_BY_CATID(id));
  },

  async createCategory(data: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.CATEGORY.CREATECAT, data);
  },

  async updateCategory(id: string, data: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.CATEGORY.UPDATECAT(id), data);
  },

  async deleteCategory(id: string) {
    return apiService.delete(API_ENDPOINTS.CATEGORY.DELETECAT(id));
  },

  async toggleCategoryStatus(id: string) {
    return apiService.patch(API_ENDPOINTS.CATEGORY.PATCHCAT(id));
  },

  // Category Items CRUD
  async getCategoryItems(cid: string, params?: GetCategoryItemsParams) {
    return apiService.get(API_ENDPOINTS.CATEGORY.BASECATITEM(cid), { params });
  },

  async getCategoryItemById(id: string, cid: string) {
    return apiService.get(API_ENDPOINTS.CATEGORY.GET_BY_CATITEMID(id, cid));
  },

  async createCategoryItem(cid: string, data: Record<string, unknown>) {
    return apiService.post(API_ENDPOINTS.CATEGORY.CREATECATITEM(cid), data);
  },

  async updateCategoryItem(id: string, cid: string, data: Record<string, unknown>) {
    return apiService.put(API_ENDPOINTS.CATEGORY.UPDATECATITEM(id, cid), data);
  },

  async deleteCategoryItem(id: string, cid: string) {
    return apiService.delete(API_ENDPOINTS.CATEGORY.DELETECATITEM(id, cid));
  },

  async toggleCategoryItemStatus(id: string, cid: string) {
    return apiService.patch(API_ENDPOINTS.CATEGORY.PATCHCATITEM(id, cid));
  },
};

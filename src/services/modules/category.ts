import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export interface GetCategoriesParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface GetCategoryItemsParams {
  page?: number;
  size?: number;
  search?: string;
}

export const categoryService = {
  // Category CRUD
  getCategories: async (params?: GetCategoriesParams) => {
    return apiService.get(API_ENDPOINTS.CATEGORY.BASECAT, { params });
  },

  getCategoryById: async (id: string) => {
    return apiService.get(API_ENDPOINTS.CATEGORY.GET_BY_CATID(id));
  },

  createCategory: async (data: any) => {
    return apiService.post(API_ENDPOINTS.CATEGORY.CREATECAT, data);
  },

  updateCategory: async (id: string, data: any) => {
    return apiService.put(API_ENDPOINTS.CATEGORY.UPDATECAT(id), data);
  },

  deleteCategory: async (id: string) => {
    return apiService.delete(API_ENDPOINTS.CATEGORY.DELETECAT(id));
  },

  toggleCategoryStatus: async (id: string) => {
    return apiService.patch(API_ENDPOINTS.CATEGORY.PATCHCAT(id));
  },

  // Category Items CRUD
  getCategoryItems: async (cid: string, params?: GetCategoryItemsParams) => {
    return apiService.get(API_ENDPOINTS.CATEGORY.BASECATITEM(cid), { params });
  },

  getCategoryItemById: async (id: string, cid: string) => {
    return apiService.get(API_ENDPOINTS.CATEGORY.GET_BY_CATITEMID(id, cid));
  },

  createCategoryItem: async (cid: string, data: any) => {
    return apiService.post(API_ENDPOINTS.CATEGORY.CREATECATITEM(cid), data);
  },

  updateCategoryItem: async (id: string, cid: string, data: any) => {
    return apiService.put(API_ENDPOINTS.CATEGORY.UPDATECATITEM(id, cid), data);
  },

  deleteCategoryItem: async (id: string, cid: string) => {
    return apiService.delete(API_ENDPOINTS.CATEGORY.DELETECATITEM(id, cid));
  },

  toggleCategoryItemStatus: async (id: string, cid: string) => {
    return apiService.patch(API_ENDPOINTS.CATEGORY.PATCHCATITEM(id, cid));
  },
};
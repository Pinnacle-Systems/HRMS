import { apiService } from '../api/api.config';
import { API_ENDPOINTS } from '../api/endpoints';
// import { ApiResponse, Company, MasterData, QueryParams } from '../api/api.types';

class EmployeeService {
// Get all companies with pagination
  async getEmployees(params?: any) {
    return apiService.get(API_ENDPOINTS.EMPLOYEE.BASE, { params });
  }
}

export const employeeService = new EmployeeService();

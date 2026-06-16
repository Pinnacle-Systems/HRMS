import { apiService } from "../../api/api.config";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { SimulationRunPayload } from "../../../types/policy";

export const simulationService = {
  async getSimulations(params?: Record<string, unknown>) {
    return apiService.get(API_ENDPOINTS.POLICY.SIMULATION.GET, { params });
  },

  async getSimulationById(id: string) {
    return apiService.get(API_ENDPOINTS.POLICY.SIMULATION.GET_BY_ID(id));
  },

  async runVersionSimulation(versionId: string, payload: SimulationRunPayload) {
    return apiService.post(API_ENDPOINTS.POLICY.SIMULATION.RUN(versionId), payload);
  },

  async runImpactAnalysis(versionId: string, employeeIds: string[]) {
    return apiService.post(API_ENDPOINTS.POLICY.SIMULATION.ANALYSIS(versionId), { employeeIds });
  },
};

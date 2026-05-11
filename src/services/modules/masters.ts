import { apiService } from "../api/api.config";
import { API_ENDPOINTS } from "../api/endpoints";

export const masterService = {
  async getCities(params? :any) {
    return apiService.get(API_ENDPOINTS.MASTER.GET_CITY,{params});
  },

  async getCountries(params? :any) {
    return apiService.get(API_ENDPOINTS.MASTER.GET_COUNTRY,{params});
  },

  async getStates(params? :any) {
    return apiService.get(API_ENDPOINTS.MASTER.GET_STATES,{params});
  },

  async getStatesByCountry(countryId: string) {
    return apiService.get(API_ENDPOINTS.MASTER.GET_STATES_BY_COUNTRY(countryId));
  },

  async getCitiesByCountry(countryId: string) {
    return apiService.get(API_ENDPOINTS.MASTER.GET_CITIES_BY_COUNTRY(countryId));
  },

  async getCitiesByState(stateId: string) {
    return apiService.get(API_ENDPOINTS.MASTER.GET_CITIES_BY_STATE(stateId));
  },
};
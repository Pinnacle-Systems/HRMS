import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { masterService, normalizeMasterData } from "../../src/services/modules/masters";
import { useMasterData } from "../../src/hooks/useMasterData";
import { apiService } from "../../src/services/api/api.config";
import { API_ENDPOINTS } from "../../src/services/api/endpoints";

vi.mock("../../src/services/api/api.config", () => ({
  apiService: {
    get: vi.fn(),
  },
}));

describe("Master Data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeMasterData", () => {
    it("handles ApiResponsePage shape (data.content)", () => {
      expect(normalizeMasterData({ data: { content: [{ id: 1 }] } })).toEqual([{ id: 1 }]);
    });

    it("handles ApiResponseList shape (data array)", () => {
      expect(normalizeMasterData({ data: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    });

    it("handles raw array shape", () => {
      expect(normalizeMasterData([{ id: 3 }])).toEqual([{ id: 3 }]);
    });

    it("handles null/undefined gracefully", () => {
      expect(normalizeMasterData(null)).toEqual([]);
      expect(normalizeMasterData(undefined)).toEqual([]);
    });
  });

  describe("masterService", () => {
    it("getActiveCountries calls the correct endpoint", async () => {
      (apiService.get as any).mockResolvedValue({ data: [] });
      await masterService.getActiveCountries();
      expect(apiService.get).toHaveBeenCalledWith(API_ENDPOINTS.MASTER.GET_ACTIVE_COUNTRIES, { params: undefined });
    });

    it("getStatesByCountry calls the correct endpoint", async () => {
      (apiService.get as any).mockResolvedValue({ data: [] });
      await masterService.getStatesByCountry("c1");
      expect(apiService.get).toHaveBeenCalledWith(API_ENDPOINTS.MASTER.GET_STATES_BY_COUNTRY("c1"));
    });

    it("getCitiesByState calls the correct endpoint", async () => {
      (apiService.get as any).mockResolvedValue({ data: [] });
      await masterService.getCitiesByState("s1");
      expect(apiService.get).toHaveBeenCalledWith(API_ENDPOINTS.MASTER.GET_CITIES_BY_STATE("s1"));
    });
  });

  describe("useMasterData", () => {
    it("fetches active countries and currencies on mount but NOT states or cities", async () => {
      (apiService.get as any).mockImplementation((url: string) => {
        if (url === API_ENDPOINTS.MASTER.GET_ACTIVE_COUNTRIES) {
          return Promise.resolve({ data: [{ id: "c1", name: "Country 1" }] });
        }
        if (url === API_ENDPOINTS.MASTER.GET_ACTIVE_CURRENCIES) {
          return Promise.resolve({ data: [{ id: "curr1", name: "Currency 1" }] });
        }
        return Promise.resolve({ data: [] });
      });

      const { result } = renderHook(() => useMasterData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.countries).toEqual([{ id: "c1", name: "Country 1" }]);
      expect(result.current.currencies).toEqual([{ id: "curr1", name: "Currency 1" }]);
      expect(result.current.states).toEqual([]);
      expect(result.current.cities).toEqual([]);

      // Verify states and cities were NOT called initially
      expect(apiService.get).not.toHaveBeenCalledWith(API_ENDPOINTS.MASTER.GET_STATES, expect.any(Object));
      expect(apiService.get).not.toHaveBeenCalledWith(API_ENDPOINTS.MASTER.GET_CITY, expect.any(Object));
    });

    it("fetchStatesByCountry updates states and returns them", async () => {
      (apiService.get as any).mockResolvedValue({ data: [{ id: "s1", name: "State 1" }] });
      
      const { result } = renderHook(() => useMasterData());
      
      let statesData;
      await waitFor(async () => {
        statesData = await result.current.fetchStatesByCountry("c1");
      });

      expect(statesData).toEqual([{ id: "s1", name: "State 1" }]);
      await waitFor(() => {
        expect(result.current.states).toEqual([{ id: "s1", name: "State 1" }]);
      });
    });

    it("fetchCitiesByState updates cities and returns them", async () => {
      (apiService.get as any).mockResolvedValue({ data: [{ id: "city1", name: "City 1" }] });
      
      const { result } = renderHook(() => useMasterData());
      
      let citiesData;
      await waitFor(async () => {
        citiesData = await result.current.fetchCitiesByState("s1");
      });

      expect(citiesData).toEqual([{ id: "city1", name: "City 1" }]);
      await waitFor(() => {
        expect(result.current.cities).toEqual([{ id: "city1", name: "City 1" }]);
      });
    });
  });
});

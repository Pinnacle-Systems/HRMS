import { useState, useEffect, useCallback } from "react";
import { masterService } from "../services/modules/masters";

export const useMasterData = () => {
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Initial load
  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await masterService.getCountries({size:200});
      const data = response.data?.content || response.data || [];
      setCountries(data);
    } catch (error) {
      console.error("Error fetching countries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStates = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await masterService.getStates({size:200});
      const data = response.data?.content || response.data || [];
      setStates(data);
    } catch (error) {
      console.error("Error fetching countries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await masterService.getCities({size:200});
      const data = response.data?.content || response.data || [];
      setCities(data);
    } catch (error) {
      console.error("Error fetching countries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // States by country
// In useMasterData hook
const fetchStatesByCountry = useCallback(async (countryId: string) => {
  if (!countryId) return [];
  
  try {
    setLoading(true);
    const response: any = await masterService.getStatesByCountry(countryId);
    const data = response.data?.content || response.data || [];
    setStates(data); // Update the states state
    return data; // Return the data
  } catch (error) {
    console.error("Error fetching states", error);
    return [];
  } finally {
    setLoading(false);
  }
}, []);

  // Cities by country
  const fetchCitiesByCountry = useCallback(async (countryId: string) => {
    try {
      setLoading(true);

      const response: any =
        await masterService.getCitiesByCountry(countryId);

      const data = response.data?.content || response.data || [];

      setCities(data);

      return data;
    } catch (error) {
      console.error("Error fetching cities by country", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cities by state
  const fetchCitiesByState = useCallback(async (stateId: string) => {
    try {
      setLoading(true);

      const response: any =
        await masterService.getCitiesByState(stateId);

      const data = response.data?.content || response.data || [];

      setCities(data);

      return data;
    } catch (error) {
      console.error("Error fetching cities", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
    fetchStates();
    fetchCities();
  }, [fetchCountries,fetchStates,fetchCities]);

  return {
    countries,
    states,
    cities,
    loading,

    fetchStatesByCountry,
    fetchCitiesByCountry,
    fetchCitiesByState,
  };
};
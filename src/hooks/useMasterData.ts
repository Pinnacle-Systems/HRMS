import { useState, useEffect, useCallback } from "react";
import { masterService } from "../services/modules/masters";

type ApiListResponse = any;

export const useMasterData = (enabled = true) => {
  const [countries, setCountries] = useState<unknown[]>([]);
  const [states, setStates] = useState<unknown[]>([]);
  const [cities, setCities] = useState<unknown[]>([]);
  const [currencies, setCurrencies] = useState<unknown[]>([]);

  const [loading, setLoading] = useState(false);

  // Initial load
  const fetchCountries = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const response = (await masterService.getCountries({
        size: 200,
      })) as ApiListResponse;
      const data = response.data?.content || response.data || [];
      setCountries(data);
    } catch (error) {
      console.error("Error fetching countries", error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const fetchStates = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const response = (await masterService.getStates({
        size: 200,
      })) as ApiListResponse;
      const data = response.data?.content || response.data || [];
      setStates(data);
    } catch (error) {
      console.error("Error fetching countries", error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const fetchCities = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const response = (await masterService.getCities({
        size: 200,
      })) as ApiListResponse;
      const data = response.data?.content || response.data || [];
      setCities(data);
    } catch (error) {
      console.error("Error fetching countries", error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const fetchCurrencies = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const response = (await masterService.getActiveCurrencies()) as ApiListResponse;
      const data = response.data?.content || response.data || [];
      setCurrencies(data);
    } catch (error) {
      console.error("Error fetching currencies", error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // States by country
  const fetchStatesByCountry = useCallback(
    async (countryId: string) => {
      if (!countryId) return [];
      if (!enabled) return;
      try {
        setLoading(true);
        const response = (await masterService.getStatesByCountry(
          countryId,
        )) as ApiListResponse;
        const data = response.data?.content || response.data || [];
        setStates(data);
        return data;
      } catch (error) {
        console.error("Error fetching states", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  // Cities by country
  const fetchCitiesByCountry = useCallback(
    async (countryId: string) => {
      if (!enabled) return;
      try {
        setLoading(true);
        const response = (await masterService.getCitiesByCountry(
          countryId,
        )) as ApiListResponse;
        const data = response.data?.content || response.data || [];
        setCities(data);
        return data;
      } catch (error) {
        console.error("Error fetching cities by country", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  // Cities by state
  const fetchCitiesByState = useCallback(
    async (stateId: string) => {
      if (!enabled) return;
      try {
        setLoading(true);
        const response = (await masterService.getCitiesByState(
          stateId,
        )) as ApiListResponse;
        const data = response.data?.content || response.data || [];
        setCities(data);
        return data;
      } catch (error) {
        console.error("Error fetching cities", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  useEffect(() => {
    void (async () => {
      await fetchCountries();
      await fetchStates();
      await fetchCities();
      await fetchCurrencies();
    })();
  }, [enabled, fetchCountries, fetchStates, fetchCities]);

  return {
    countries,
    states,
    cities,
    currencies,
    loading,
    fetchStatesByCountry,
    fetchCitiesByCountry,
    fetchCitiesByState,
  };
};

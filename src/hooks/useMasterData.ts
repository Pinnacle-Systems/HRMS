import { useState, useEffect, useCallback } from "react";
import { masterService, normalizeMasterData } from "../services/modules/masters";

export const useMasterData = (enabled = true) => {
  const [countries, setCountries] = useState<unknown[]>([]);
  const [states, setStates] = useState<unknown[]>([]);
  const [cities, setCities] = useState<unknown[]>([]);
  const [currencies, setCurrencies] = useState<unknown[]>([]);

  const [loading, setLoading] = useState(false);

  // Initial load uses active countries
  const fetchCountries = useCallback(async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const response = await masterService.getActiveCountries();
      setCountries(normalizeMasterData(response));
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
      const response = await masterService.getActiveCurrencies();
      setCurrencies(normalizeMasterData(response));
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
        const response = await masterService.getStatesByCountry(countryId);
        const data = normalizeMasterData(response);
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
        const response = await masterService.getCitiesByCountry(countryId);
        const data = normalizeMasterData(response);
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
        const response = await masterService.getCitiesByState(stateId);
        const data = normalizeMasterData(response);
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
    if (enabled) {
      void fetchCountries();
      void fetchCurrencies();
    }
  }, [enabled, fetchCountries, fetchCurrencies]);

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

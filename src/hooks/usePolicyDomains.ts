import { useEffect, useState, useCallback } from "react";
import { policyService } from "../services/modules/policy";
import type { Domain } from "../types/policy";
import { useUI } from "../context/Snackbar";

export const usePolicyDomains = (enabled = true) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useUI();

  const extractListPayload = <T = any>(response: any): T[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.content)) return response.data.content;
    if (Array.isArray(response.items)) return response.items;
    return [];
  };

  const fetchDomains = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const domainRes: any = await policyService.getDomains();
      setDomains(extractListPayload<Domain>(domainRes));
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load domains", "error");
    } finally {
      setLoading(false);
    }
  }, [enabled, showSnackbar]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const getDomainName = useCallback(
    (domainId: string) =>
      domains.find((d) => d.id === domainId)?.name || domainId,
    [domains],
  );

  return { domains, loading, refetch: fetchDomains, getDomainName };
};

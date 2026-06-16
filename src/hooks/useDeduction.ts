import { useEffect, useState, useCallback } from "react";
import { policyService } from "../services/modules/policy";
import type { Deduction } from "../components/PolicyManagement/types";
import { useUI } from "../context/Snackbar";

export const useDeductionList = (enabled: boolean) => {
  const [deduction, setDeduction] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useUI();

  const fetchDeduction = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await policyService.getDeduction({
        page: 0,
        size: 100,
        sort: "name,ASC",
        active: true,
      });
      setDeduction(response.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load Deduction", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    if (enabled) fetchDeduction();
  }, [enabled, fetchDeduction]);

  return { deduction, loading, refetch: fetchDeduction };
};
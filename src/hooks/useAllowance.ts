import { useEffect, useState, useCallback } from "react";
import { policyService } from "../services/modules/policy";
import type { Allowance } from "../components/PolicyManagement/types";
import { useUI } from "../context/Snackbar";

export const useAllowanceList = () => {
  const [allowanceList, setAllowanceList] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useUI();

  const fetchAllowance = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await policyService.getAllowance({
        page: 0,
        size: 100,
        sort: "name,ASC",
        active: true,
      });
      setAllowanceList(response.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load allowance", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
      fetchAllowance();
  }, [ fetchAllowance]);

  return { allowanceList, loading, refetch: fetchAllowance };
};

import { useEffect, useState, useCallback } from "react";
import { policyService } from "../services/modules/policy";
import type { ExpenseCat } from "../components/PolicyManagement/types";
import { useUI } from "../context/Snackbar";

export const useExpenseCategoriesList = (enabled: boolean) => {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCat[]>([]);
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useUI();

  const fetchExpenseCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await policyService.getExpenseCategory({
        page: 0,
        size: 100,
        sort: "name,ASC",
        active: true,
      });
      setExpenseCategories(response.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load expense categories", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    if (enabled) fetchExpenseCategories();
  }, [enabled, fetchExpenseCategories]);

  return { expenseCategories, loading, refetch: fetchExpenseCategories };
};

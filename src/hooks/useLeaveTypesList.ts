import { useEffect, useState, useCallback } from "react";
import { leaveService } from "../services/modules/leave";
import type { LeaveType } from "../services/modules/leaveTypes";
import { useUI } from "../context/Snackbar";

export const useLeaveTypesList = (enabled: boolean) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useUI();

  const fetchLeaveTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response:any = await leaveService.getLeaveTypes({
        page: 0,
        size: 50,
        sort: "name,ASC",
      });
      setLeaveTypes(response.data ?? response.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load leave types", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    if (enabled) fetchLeaveTypes();
  }, [enabled, fetchLeaveTypes]);

  return { leaveTypes, loading, refetch: fetchLeaveTypes };
};

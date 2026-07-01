import { useState } from "react";
import dayjs from "dayjs";
import type { OvertimeCalculateParams } from "../services/modules/attendanceTypes";
import { attendanceService } from "../services/modules/attendance";
import { useUI } from "../context/Snackbar";

export function useOvertimeCalculator() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  
  const [loading, setLoading] = useState(false);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [params, setParams] = useState<OvertimeCalculateParams>({
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    employeeId: "",
  });

  const calculateOvertime = async (overrideParams?: Partial<OvertimeCalculateParams>) => {
    const finalParams = { ...params, ...overrideParams };
    
    if (!finalParams.startDate || !finalParams.endDate) {
      showSnackbar("Please select date range", "warning");
      return null;
    }

    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.calculateOvertime(finalParams);
      const data = res?.data?.data ?? res?.data;
      const results = Array.isArray(data) ? data : [data];
      setCalculations(results);
      setDialogOpen(true);
      showSnackbar("Overtime calculation completed", "success");
      return results;
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message ?? "Failed to calculate overtime", "error");
      return null;
    } finally {
      setLoading(false);
      hideSpinner();
    }
  };

  const resetCalculator = () => {
    setCalculations([]);
    setDialogOpen(false);
    setParams({
      startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
      employeeId: "",
    });
  };

  return {
    loading,
    calculations,
    dialogOpen,
    params,
    setParams,
    setDialogOpen,
    calculateOvertime,
    resetCalculator,
  };
}
import { useEffect, useState } from "react";
import { Button, FormControlLabel, MenuItem, Switch, TextField } from "@mui/material";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type { LeaveAccrualRunResult, LeaveType } from "../../services/modules/leaveTypes";
import LeavePageShell from "./components/LeavePageShell";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectSx } from "../../const";

export default function AdminWorkflowsPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [runDate, setRunDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<LeaveAccrualRunResult | null>(null);

  useEffect(() => {
    leaveService
      .getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" })
      .then((response: any) => setLeaveTypes(response.data ?? []))
      .catch(() => setLeaveTypes([]));
  }, []);

  const runAccrual = async () => {
    showSpinner();
    try {
      const response:any = await leaveService.runLeaveAccrual({
        runDate,
        dryRun,
        leaveTypeId: leaveTypeId || undefined,
      });
      if (response.success && response.data) {
        setResult(response.data);
        showSnackbar(response.message || "Leave accrual run completed", "success");
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to run leave accrual", "error");
    } finally {
      hideSpinner();
    }
  };

  return (
    <LeavePageShell
      group="admin"
      title="Workflows"
      subtitle="Run the monthly leave accrual workflow"
    >
      <div className="border border-gray-300 bg-white-50 rounded-lg p-3 pt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
        <TextField
          select
          label="Leave Type"
          value={leaveTypeId}
          onChange={(event) => setLeaveTypeId(event.target.value)}
          slotProps={{
            select: {
              renderValue: (value: unknown) =>
                value ? leaveTypes.find((type) => type.id === value)?.name : "",
            },
          }}
          sx={selectSx}
        >
          <MenuItem value="">All Leave Types</MenuItem>
          {leaveTypes.map((leaveType) => (
            <MenuItem key={leaveType.id} value={leaveType.id}>
              {leaveType.name}
            </MenuItem>
          ))}
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Run Date"
            value={dayjs(runDate)}
            onChange={(newValue) => {
              setRunDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
            }}
          />
        </LocalizationProvider>

        <FormControlLabel
          control={
            <Switch
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
              color="primary"
              className="!text-gray-800"
            />
          }
          label="Dry Run"
        />

        <Button variant="contained" className="!bg-primary h-fit" onClick={runAccrual}>
          Run Accrual
        </Button>
      </div>

      {result && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[12px] text-gray-700">Tenants Processed</div>
            <div className="text-[12px] text-gray-800">{result.tenantsProcessed}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-700">Tenants Failed</div>
            <div className="text-[12px] text-gray-800">{result.tenantsFailed}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-700">Total Credited</div>
            <div className="text-[12px] text-gray-800">{result.totalCredited}</div>
          </div>
          <div>
            <div className="text-[12px] text-gray-700">Total Skipped</div>
            <div className="text-[12px] text-gray-800">{result.totalSkipped}</div>
          </div>
          {/* <div>
            <div className="text-[12px] text-gray-700">Success</div>
            <div className="text-[12px] text-gray-800">{result.success ? "Yes" : "No"}</div>
          </div> */}
        </div>
      )}
    </LeavePageShell>
  );
}
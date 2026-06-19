import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, LinearProgress, IconButton, Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  LockOutlined, LockOpenOutlined, CheckCircleOutlined,
  WarningAmberOutlined, CloseOutlined, HistoryOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import type { FinalisedPeriod } from "../../../services/modules/attendance";
import { MONTHS, FINALISATION_STATUS_COLORS, FINALISATON_STATUS_LABELS, getCurrentMonthYear } from "./const";
import dayjs from "dayjs";

const CHECKLIST = [
  "All attendance records have been reviewed",
  "Pending correction requests are resolved",
  "Leave applications are approved or rejected",
  "On-duty requests are processed",
  "Overtime hours are validated",
  "Irregular attendance is resolved",
];

export function PeriodFinalisation() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const { month: curMonth, year: curYear } = getCurrentMonthYear();

  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [finalisedPeriods, setFinalisedPeriods] = useState<FinalisedPeriod[]>([]);
  const [checklist, setChecklist] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [remarks, setRemarks] = useState("");
  const [finalising, setFinalising] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Unlock dialog
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockPeriod, setUnlockPeriod] = useState<FinalisedPeriod | null>(null);
  const [unlockReason, setUnlockReason] = useState("");

  const loadPeriods = useCallback(async () => {
    showSpinner();
    try {
      const res: any = await attendanceService.getFinalisedPeriods({ year });
      const data = res?.data?.data ?? res?.data;
      setFinalisedPeriods(Array.isArray(data) ? data : []);
    } catch {
      showSnackbar("Failed to load finalised periods", "error");
    } finally {
      hideSpinner();
    }
  }, [year]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const currentPeriod = finalisedPeriods.find((p) => p.month === month && p.year === year);
  const isLocked = currentPeriod?.status === "locked" || currentPeriod?.status === "approved";
  const allChecked = checklist.every(Boolean);

  async function handleFinalise() {
    if (!allChecked) {
      showSnackbar("Please confirm all checklist items before finalising", "warning");
      return;
    }
    showConfirmDialog({
      title: "Finalise Attendance Period",
      message: `Finalise attendance for ${MONTHS[month - 1]} ${year}? This will lock the period and push data to payroll.`,
      confirmText: "Finalise",
      onConfirm: async () => {
        setFinalising(true);
        showSpinner();
        try {
          await attendanceService.finalise({ month, year, remarks });
          showSnackbar(`${MONTHS[month - 1]} ${year} attendance finalised successfully`, "success");
          setChecklist(CHECKLIST.map(() => false));
          setRemarks("");
          loadPeriods();
        } catch (err: any) {
          showSnackbar(err?.response?.data?.message ?? "Failed to finalise period", "error");
        } finally {
          setFinalising(false);
          hideSpinner();
        }
      },
    });
  }

  function openUnlock(period: FinalisedPeriod) {
    setUnlockPeriod(period);
    setUnlockReason("");
    setUnlockDialogOpen(true);
  }

  async function handleUnlock() {
    if (!unlockReason.trim()) {
      showSnackbar("Unlock reason is required", "warning");
      return;
    }
    if (!unlockPeriod) return;
    setUnlocking(true);
    try {
      await attendanceService.unlock({
        periodId: unlockPeriod.id,
        reason: unlockReason,
        unlockedBy: "current-user",
      });
      showSnackbar("Period unlocked for editing", "success");
      setUnlockDialogOpen(false);
      loadPeriods();
    } catch {
      showSnackbar("Failed to unlock period", "error");
    } finally {
      setUnlocking(false);
    }
  }

  const isFutureMonth = dayjs(`${year}-${month}-01`).isAfter(dayjs(), "month");

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Finalisation Panel */}
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <LockOutlined className="text-primary" fontSize="small" />
            <span className="font-bold text-gray-700">Period Finalisation</span>
          </div>

          {/* Period Select */}
          <div className="grid grid-cols-2 gap-3">
            <FormControl>
              <InputLabel>Month</InputLabel>
              <Select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Year</InputLabel>
              <Select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[curYear - 1, curYear, curYear + 1].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Current Period Status */}
          {currentPeriod && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-700">{currentPeriod.periodLabel}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FINALISATION_STATUS_COLORS[currentPeriod.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {FINALISATON_STATUS_LABELS[currentPeriod.status] ?? currentPeriod.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Total Employees", currentPeriod.totalEmployees],
                  ["Present Days", currentPeriod.totalPresentDays],
                  ["Absent Days", currentPeriod.totalAbsentDays],
                  ["Leave Days", currentPeriod.totalLeaveDays],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between bg-head rounded p-2">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
              {currentPeriod.finalisedBy && (
                <div className="text-xs text-gray-400 mt-1">
                  Finalised by {currentPeriod.finalisedBy} on{" "}
                  <span className="text-primary font-bold">{dayjs(currentPeriod.finalisedAt).format("DD MMM YYYY, h:mm A")}</span>
                </div>
              )}
            </div>
          )}

          {isFutureMonth ? (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <span className="text-xs">Cannot finalise a future period.</span>
            </Alert>
          ) : isLocked ? (
            <Alert severity="success" icon={<LockOutlined fontSize="small" />} sx={{ py: 0.5 }}>
              <span className="text-xs">This period is finalised and locked.</span>
            </Alert>
          ) : (
            <>
              {/* Checklist */}
              <div className="space-y-2">
                <div className="text-[12px] text-gray-800">Pre-finalisation Checklist</div>
                {CHECKLIST.map((item, i) => (
                  <label key={i} className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checklist[i]}
                      onChange={() => {
                        const next = [...checklist];
                        next[i] = !next[i];
                        setChecklist(next);
                      }}
                      className="mt-1"
                    />
                    <span className={`text-[12px] ${checklist[i] ? "text-gray-400 line-through" : "text-gray-700"}`}>
                      {item}
                    </span>
                    {checklist[i] && <CheckCircleOutlined fontSize="small" className="text-green-500 ml-auto flex-shrink-0" />}
                  </label>
                ))}
              </div>

              {/* Remarks */}
              <TextField
                label="Remarks (optional)"
                fullWidth
                multiline
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              {!allChecked && (
                <Alert severity="warning" icon={<WarningAmberOutlined fontSize="small" />} sx={{ py: 0.5 }}>
                  <span className="text-xs">Complete all checklist items to enable finalisation.</span>
                </Alert>
              )}

              <button
                onClick={handleFinalise}
                disabled={finalising || !allChecked}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <LockOutlined fontSize="small" />
                {finalising ? "Finalising..." : `Finalise ${MONTHS[month - 1]} ${year}`}
              </button>
              {finalising && <LinearProgress color="primary" />}
            </>
          )}
        </div>

        {/* History Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HistoryOutlined className="text-gray-500" fontSize="small" />
            <span className="font-semibold text-gray-700">Finalisation History — {year}</span>
          </div>

          {finalisedPeriods.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No finalised periods for {year}
            </div>
          ) : (
            <div className="space-y-2">
              {finalisedPeriods.map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-700">{period.periodLabel}</div>
                    <div className="text-xs text-gray-400 ">
                      {period.totalEmployees} employees &nbsp;·&nbsp;
                      {period.totalPresentDays}P / {period.totalAbsentDays}A
                    </div>
                    {period.finalisedAt && (
                      <div className="text-xs text-primary mt-1">
                        {dayjs(period.finalisedAt).format("DD MMM YYYY")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FINALISATION_STATUS_COLORS[period.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {FINALISATON_STATUS_LABELS[period.status] ?? period.status}
                    </span>
                    {(period.status === "locked" || period.status === "approved") && (
                      <Tooltip title="Unlock Period">
                        <IconButton size="small" onClick={() => openUnlock(period)}>
                          <LockOpenOutlined fontSize="small" className="text-primary" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unlock Dialog */}
      <Dialog open={unlockDialogOpen} onClose={() => setUnlockDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!ml-4">Unlock Period</span>
          <IconButton size="small" onClick={() => setUnlockDialogOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <div className="space-y-5 pt-1">
            <Alert severity="warning" sx={{ py: 0.5 }}>
              <span className="text-xs">
                Unlocking <b>{unlockPeriod?.periodLabel}</b> will allow edits. All payroll-linked data may be affected.
              </span>
            </Alert>
            <TextField
              label="Reason for Unlock"
              fullWidth
              multiline
              required
              rows={3}
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button size="small" variant="outlined" className="!border-gray-200 !text-gray-800"
            onClick={() => setUnlockDialogOpen(false)} disabled={unlocking}>
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={handleUnlock}
            disabled={unlocking || !unlockReason.trim()}
          >
            {unlocking ? "Unlocking..." : "Confirm Unlock"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type { WorkCalendar } from "../../services/modules/leaveTypes";
import LeavePageShell from "./components/LeavePageShell";
import {
  leaveTableActionHeaderCellClassName,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableSx,
} from "./components/leaveTableStyles";
import { Delete, Edit } from "@mui/icons-material";
import { getRowColor } from "../const";
import type { Branch } from "../attendance/shiftSettings/types";
import { branchService } from "../../services/modules/branch";
import { selectSx } from "../../const";

const weekDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const emptyForm: any = {
  calendarName: "",
  days: weekDays.map((day) => ({
    dayOfWeek: day,
    workingType: ["SATURDAY", "SUNDAY"].includes(day) ? "OFF" : "FULL",
    workingHours: 8,
  })),
  active: true,
};

export default function AdminWorkCalendarsPage() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [calendars, setCalendars] = useState<WorkCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<WorkCalendar>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [branches, setBranches] = useState<Branch[]>([]);

  const getBranches = async () => {
    try {
      const response: any = await branchService.getDropdownBranches();
      setBranches(response.data.content || response.data || []);
    } catch (error: any) {
      console.error("Failed to load branches:", error.message);
    }
  };

  useEffect(() => {
    getBranches();
  }, []);

  const load = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await leaveService.getWorkCalendars();
      setCalendars(response.data ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load work calendars", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (calendar: WorkCalendar) => {
    setEditingId(calendar.id);
    setForm({ ...calendar });
    setErrors({});
    setOpen(true);
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.calendarName?.trim()) nextErrors.calendarName = "Calendar name is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    console.log(form.days);

    const daysCopy = form.days && form.days.map((day) => {
      const { id, ...dayWithoutId } = day;
      return dayWithoutId;
    });

    const payload: any = {
      calendarName: form.calendarName,
      branchId: form.branchId,
      days: daysCopy ?? [],
      active: form.active,
    };
    showSpinner();
    console.log(payload);

    try {
      const response: any = editingId
        ? await leaveService.updateWorkCalendar(editingId, payload)
        : await leaveService.createWorkCalendar(payload);
      if (response.success) {
        showSnackbar(editingId ? "Work calendar updated" : "Work calendar created", "success");
        setOpen(false);
        await load();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save work calendar", "error");
    } finally {
      hideSpinner();
    }
  };

  const confirmDelete = (calendar: WorkCalendar) => {
    showConfirmDialog({
      title: "Delete Work Calendar",
      message: `Delete "${calendar.calendarName}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response: any = await leaveService.deleteWorkCalendar(calendar.id);
          if (response.success) {
            showSnackbar("Work calendar deleted", "success");
            await load();
          }
        } catch (err: any) {
          showSnackbar(err?.message || "Failed to delete work calendar", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  return (
    <LeavePageShell
      group="admin"
      title="Work Calendars"
      subtitle="Define working hours and weekly-off patterns by location"
      actions={
        <Button variant="contained" startIcon={<AddOutlinedIcon />} className="!bg-primary" onClick={openCreate}>
          Add Work Calendar
        </Button>
      }
    >
      <TableContainer className="overflow-auto" sx={leaveTableContainerSx}>
        <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
          <TableHead>
            <TableRow sx={leaveTableHeaderRowSx}>
              <TableCell className={leaveTableHeaderCellClassName}>#</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Name</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Working Days</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Weekly Offs</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Branch</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Active</TableCell>
              <TableCell className={leaveTableActionHeaderCellClassName}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              calendars.map((calendar, i) => {
                const offDays: any[] = calendar.days.filter((d) => d.workingType === "OFF").map((d) => d.dayOfWeek);
                const fullDays = calendar.days.filter((d) => d.workingType === "FULL");
                const halfDays = calendar.days.filter((d) => d.workingType === "HALF");

                const fullDaysCount = fullDays.length;
                const halfDaysCount = halfDays.length;

                const avgFullHours = fullDaysCount > 0
                  ? (fullDays.reduce((sum, d) => sum + (d.workingHours || 0), 0) / fullDaysCount).toFixed(1)
                  : "0";

                const avgHalfHours = halfDaysCount > 0
                  ? (halfDays.reduce((sum, d) => sum + (d.workingHours || 0), 0) / halfDaysCount).toFixed(1)
                  : "0";

                return (
                  <TableRow key={calendar.id} sx={getRowColor(i)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{calendar.calendarName}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {fullDaysCount > 0 && (
                          <Chip
                            label={`${fullDaysCount} Full (${avgFullHours}h)`}
                            size="small"
                            sx={{
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              fontWeight: 500,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                        {halfDaysCount > 0 && (
                          <Chip
                            label={`${halfDaysCount} Half (${avgHalfHours}h)`}
                            size="small"
                            sx={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              fontWeight: 500,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                        {fullDaysCount === 0 && halfDaysCount === 0 && (
                          <div className="text-[12px]">
                            No days configured
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {offDays.length > 0 ? (
                          <div>
                            {offDays.map((day: any, idx: any) => (
                              <Chip
                                key={idx}
                                label={day}
                                size="small"
                                sx={{
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  height: 20,
                                  '& .MuiChip-label': { px: 1, fontSize: '0.65rem' }
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div>'-'</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{calendar.branchName || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={calendar.active ? "Active" : "Inactive"}
                        color={calendar.active ? "success" : "error"}
                        size="small"

                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(calendar)}>
                          <Edit className="!w-4 !h-4 text-blue-500" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => confirmDelete(calendar)}>
                          <Delete className="!w-4 !h-4 text-red-600" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            {/* {loading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <DataState compact type="loading" title="Loading work calendars..." />
                </TableCell>
              </TableRow>
            )} */}
            {!loading && calendars.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" className="!p-8">
                  {/* <DataState compact type="empty" title="No work calendars found." /> */}
                  No work calendars found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4">{editingId ? "Edit Work Calendar" : "Add Work Calendar"}</div>
          <IconButton onClick={() => setOpen(false)}>
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4 mt-2">
              <TextField
                label="Calendar Name"
                value={form.calendarName ?? ""}
                error={Boolean(errors.calendarName)}
                helperText={errors.calendarName}
                onChange={(event) => setForm((current) => ({ ...current, calendarName: event.target.value }))}
                fullWidth
              />
              <div className="">
                <FormControl fullWidth required>
                  <InputLabel>Select Branch</InputLabel>
                  <Select
                    value={form.branchId || ""}
                    label="Select Branch"
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        branchId: e.target.value,
                      }))
                    }
                    sx={selectSx}
                  >
                    <MenuItem value="">Select Branch</MenuItem>
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <div className="text-[12px] font-semibold mb-3 text-gray-700">Working Days Configuration</div>
              <div className="grid grid-cols-2 gap-3">
                {(form.days ?? []).map((day, idx) => (
                  <div key={day.dayOfWeek} className="border border-gray-200 rounded p-2">
                    <div className="text-xs font-medium text-gray-600 mb-2">{day.dayOfWeek}</div>
                    <div className="flex gap-2">
                      <Select
                        size="small"
                        value={day.workingType}
                        onChange={(e) => {
                          const newDays = [...(form.days ?? [])];
                          newDays[idx] = { ...newDays[idx], workingType: e.target.value as any };
                          setForm((current) => ({ ...current, days: newDays }));
                        }}
                        className="flex-1"
                      >
                        <MenuItem value="OFF">OFF</MenuItem>
                        <MenuItem value="FULL">Full</MenuItem>
                        <MenuItem value="HALF">Half</MenuItem>
                      </Select>
                      {day.workingType !== "OFF" && (
                        <TextField
                          size="small"
                          type="number"
                          slotProps={{
                            htmlInput: { min: 0, max: 24, step: 0.5 },
                          }}
                          value={day.workingHours ?? 8}
                          onChange={(e) => {
                            const newDays = [...(form.days ?? [])];
                            newDays[idx] = { ...newDays[idx], workingHours: Number(e.target.value) };
                            setForm((current) => ({ ...current, days: newDays }));
                          }}
                          className="w-20"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <FormControlLabel
              control={
                <Switch
                  checked={form.active ?? true}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                  color="primary"
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button variant="outlined" className="!text-gray-800 !border-gray-300" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" className="!bg-primary" onClick={submit}>
            {editingId ? "Save Changes" : "Create Work Calendar"}
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}

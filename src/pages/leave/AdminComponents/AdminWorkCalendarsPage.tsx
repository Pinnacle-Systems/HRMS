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
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type { WorkCalendar } from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import {
  leaveTableActionHeaderCellClassName,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableSx,
} from "../components/leaveTableStyles";
import { Delete, Edit } from "@mui/icons-material";
import { getRowColor } from "../../const";
import type { Branch } from "../../attendance/shiftSettings/types";
import { branchService } from "../../../services/modules/branch";
import { selectSx } from "../../../const";

const weekDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

// FIX 1: Added branchId to emptyForm
const emptyForm: any = {
  calendarName: "",
  branchId: "", // Added this
  days: weekDays.map((day) => ({
    dayOfWeek: day,
    workingType: ["SATURDAY", "SUNDAY"].includes(day) ? "OFF" : "FULL",
    workingHours: ["SATURDAY", "SUNDAY"].includes(day) ? 0 : 8,
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
    setForm({ ...emptyForm }); // Use spread to create a new object
    setErrors({});
    setOpen(true);
  };

  const openEdit = (calendar: WorkCalendar) => {
    setEditingId(calendar.id);
    setForm({ ...calendar });
    setErrors({});
    setOpen(true);
  };

  // FIX 2: Enhanced validation and error handling
  const submit = async () => {
    const nextErrors: Record<string, string> = {};

    // Validate calendar name
    if (!form.calendarName?.trim()) {
      nextErrors.calendarName = "Calendar name is required";
    }

    // FIX 3: Validate branch selection
    if (!form.branchId) {
      nextErrors.branchId = "Branch is required";
    }

    // Validate days
    if (form.days) {
      form.days.forEach((day, index) => {
        // Validate working hours for FULL and HALF days
        if (day.workingType !== 'OFF') {
          if (day.workingHours === undefined || day.workingHours === null || day.workingHours <= 0) {
            nextErrors[`days[${index}].workingHours`] = `Working hours required for ${day.dayOfWeek}`;
          }
          // if (day.workingHours > 24) {
          //   nextErrors[`days[${index}].workingHours`] = `Hours cannot exceed 24 for ${day.dayOfWeek}`;
          // }
        }
        // Ensure OFF days have 0 hours
        if (day.workingType === 'OFF' && day.workingHours !== 0 && day.workingHours !== undefined) {
          nextErrors[`days[${index}].workingHours`] = `OFF days should have 0 hours for ${day.dayOfWeek}`;
        }
      });
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      // Show first error in snackbar
      const firstError = Object.values(nextErrors)[0];
      showSnackbar(firstError, "warning");
      return;
    }

    // FIX 4: Clean and prepare payload properly
    const daysCopy = form.days?.map((day) => {
      const { id, ...dayWithoutId } = day;
      // Ensure workingHours is always a number
      const workingHours = dayWithoutId.workingType === 'OFF'
        ? 0
        : (dayWithoutId.workingHours || 8);

      return {
        dayOfWeek: dayWithoutId.dayOfWeek,
        workingType: dayWithoutId.workingType,
        workingHours: workingHours,
      };
    });

    // FIX 5: Sort days in correct order (Monday to Sunday)
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const sortedDays = daysCopy?.sort((a, b) =>
      dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
    );

    const payload: any = {
      calendarName: form.calendarName?.trim(),
      branchId: form.branchId,
      days: sortedDays ?? [],
      active: form.active ?? true,
    };

    // const minimalPayload:any = {
    //   "calendarName": "TEST MINIMAL",
    //   "branchId": "9a022aea-93f4-4c7a-92ea-bf1178928c24",
    //   "days": [
    //     {
    //       "dayOfWeek": "MONDAY",
    //       "workingType": "FULL",
    //       "workingHours": 8
    //     }
    //   ],
    //   "active": true
    // };

    // Debug log
    console.log("Submitting payload:", JSON.stringify(payload, null, 2));

    showSpinner();
    try {
      const response: any = editingId
        ? await leaveService.updateWorkCalendar(editingId, payload)
        : await leaveService.createWorkCalendar(payload);

      if (response.success) {
        showSnackbar(
          editingId ? "Work calendar updated successfully" : "Work calendar created successfully",
          "success"
        );
        setOpen(false);
        await load();
        // Reset form after successful submission
        setForm({ ...emptyForm });
      } else {
        // FIX 6: Better error handling for API errors
        const errorMessage = response.message || response.error || "Failed to save work calendar";
        showSnackbar(errorMessage, "error");

        // If there are field-specific errors from API, set them
        if (response.errors) {
          setErrors(response.errors);
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);

      // FIX 7: Extract detailed error message
      let errorMessage = "Failed to save work calendar";

      if (err?.response?.data) {
        const data = err.response.data;
        if (data.message) errorMessage = data.message;
        else if (data.error) errorMessage = data.error;

        // Check for specific error messages
        if (errorMessage.toLowerCase().includes("duplicate") ||
          errorMessage.toLowerCase().includes("already exists")) {
          errorMessage = "A work calendar with this name already exists for this branch";
        } else if (errorMessage.toLowerCase().includes("branch")) {
          errorMessage = "Invalid branch selected. Please select a valid branch.";
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      showSnackbar(errorMessage, "error");
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
            {!loading && calendars.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" className="!p-8">
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
                required
              />
              <FormControl fullWidth required error={Boolean(errors.branchId)}>
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
                {errors.branchId && (
                  <div className="text-xs text-red-500 mt-1">{errors.branchId}</div>
                )}
              </FormControl>
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
                          const workingHours = e.target.value === 'OFF' ? 0 : (newDays[idx]?.workingHours || 8);
                          newDays[idx] = {
                            ...newDays[idx],
                            workingType: e.target.value as any,
                            workingHours: workingHours
                          };
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
                      {day.workingType === "OFF" && (
                        <div className="flex items-center text-xs text-gray-400 w-20">
                          Off day
                        </div>
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
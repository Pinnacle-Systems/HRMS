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
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  Holiday,
  HolidayCalendar,
  HolidayImport,
  Holidays,
} from "../../../services/modules/leaveTypes";
import HolidayTypeBadge from "../components/HolidayTypeBadge";
import LeavePageShell from "../components/LeavePageShell";
import { formatDate } from "../leaveFormatters";
import {
  leaveTableActionHeaderCellClassName,
  leaveTableClassName,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableSx,
} from "../components/leaveTableStyles";
import { getRowColor } from "../../const";
import { branchService } from "../../../services/modules/branch";
import type { Branch } from "../../attendance/shiftSettings/types";
import { CancelOutlined, Delete, Edit } from "@mui/icons-material";
import { selectSx } from "../../../const";

// ✅ Holiday Types - Backend compatible
const holidayTypes: Holiday["holidayType"][] = [
  "PUBLIC",      // Standard/National holidays
  "RESTRICTED",  // Optional holidays
  "OPTIONAL",    // Optional holidays
  "FLOATING"     // Floating holidays
];

// ✅ User-friendly display names for holiday types
const getHolidayTypeDisplayName = (type: string): string => {
  const displayNames: Record<string, string> = {
    'PUBLIC': 'Public/National',
    'RESTRICTED': 'Restricted (Optional)',
    'OPTIONAL': 'Optional',
    'FLOATING': 'Floating'
  };
  return displayNames[type] || type;
};

const emptyCalendarForm: Partial<HolidayCalendar> & { locationsText?: string } =
{
  calendarName: "",
  year: new Date().getFullYear(),
  locationsText: "",
  active: true,
};

const emptyHolidayForm: Partial<Holidays> = {
  holidayName: "",
  holidayDate: "",
  holidayType: "PUBLIC",
  optionalHoliday: false,
  active: true,
};

export default function AdminHolidayCalendarsPage() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [calendars, setCalendars] = useState<HolidayCalendar[]>([]);
  const [loading, setLoading] = useState(true);

  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(
    null,
  );
  const [calendarForm, setCalendarForm] = useState<
    Partial<HolidayCalendar> & { locationsText?: string }
  >(emptyCalendarForm);
  const [calendarErrors, setCalendarErrors] = useState<Record<string, string>>(
    {},
  );

  const [holidaysDialogOpen, setHolidaysDialogOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] =
    useState<HolidayCalendar | null>(null);
  const [holidaysData, setHolidaysData] = useState<Holidays[]>([]);
  const [holidayForm, setHolidayForm] =
    useState<Partial<Holidays>>(emptyHolidayForm);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [importOpen, setImportOpen] = useState(false);
  const [importCalendarId, setImportCalendarId] = useState("");
  const [importHolidays, setImportHolidays] = useState<HolidayImport[]>([
    {
      holidayCalendarId: "",
      holidayName: "",
      holidayDate: "",
      holidayType: "PUBLIC",
      optionalHoliday: false,
      active: true,
      applicableTo: "Both"
    },
  ]);

  // ✅ Helper: Check if holiday type is optional
  const isOptionalHoliday = (holidayType: string): boolean => {
    return ["RESTRICTED", "OPTIONAL", "FLOATING"].includes(holidayType);
  };

  const load = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await leaveService.getHolidayCalendars();
      setCalendars(response.data || []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load holiday calendars", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateCalendar = () => {
    setEditingCalendarId(null);
    setCalendarForm(emptyCalendarForm);
    setCalendarErrors({});
    setCalendarDialogOpen(true);
  };

  const openEditCalendar = (calendar: HolidayCalendar) => {
    setEditingCalendarId(calendar.id);
    setCalendarForm({
      ...calendar,
      locationsText: calendar.locations?.join(", ") || "",
    });
    setCalendarErrors({});
    setCalendarDialogOpen(true);
  };

  const submitCalendar = async () => {
    const nextErrors: Record<string, string> = {};
    if (!calendarForm.calendarName?.trim())
      nextErrors.calendarName = "Name is required";
    setCalendarErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload: Partial<HolidayCalendar> = {
      calendarName: calendarForm.calendarName,
      branchId: calendarForm.branchId,
      active: calendarForm.active,
      year: calendarForm.year || new Date().getFullYear(),
    };

    showSpinner();
    try {
      const response: any = editingCalendarId
        ? await leaveService.updateHolidayCalendar(editingCalendarId, payload)
        : await leaveService.createHolidayCalendar(payload);
      if (response.success) {
        showSnackbar(
          editingCalendarId
            ? "Holiday calendar updated"
            : "Holiday calendar created",
          "success",
        );
        setCalendarDialogOpen(false);
        await load();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save holiday calendar", "error");
    } finally {
      hideSpinner();
    }
  };

  const confirmDeleteCalendar = (calendar: HolidayCalendar) => {
    showConfirmDialog({
      title: "Delete Holiday Calendar",
      message: `Delete "${calendar.calendarName}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response: any = await leaveService.deleteHolidayCalendar(
            calendar.id,
          );
          if (response.success) {
            showSnackbar("Holiday calendar deleted", "success");
            await load();
          }
        } catch (err: any) {
          showSnackbar(
            err?.message || "Failed to delete holiday calendar",
            "error",
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const openHolidaysDialog = async (calendar: HolidayCalendar) => {
    setSelectedCalendar(calendar);
    setHolidaysDialogOpen(true);
    setEditingHolidayId(null);
    setHolidayForm(emptyHolidayForm);

    showSpinner();
    try {
      const res: any = await leaveService.getHolidays({
        calendarId: calendar.id,
      });
      setHolidaysData(res.data || []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load holidays", "error");
    } finally {
      hideSpinner();
    }
  };

  const closeHolidaysDialog = () => {
    setHolidaysDialogOpen(false);
    setSelectedCalendar(null);
    setHolidaysData([]);
    setEditingHolidayId(null);
    setHolidayForm(emptyHolidayForm);
  };

  const refreshHolidays = async () => {
    if (!selectedCalendar) return;
    showSpinner();
    try {
      const res: any = await leaveService.getHolidays({
        calendarId: selectedCalendar.id,
      });
      setHolidaysData(res.data || []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to refresh holidays", "error");
    } finally {
      hideSpinner();
    }
  };

  const refreshCalendars = async () => {
    const response: any = await leaveService.getHolidayCalendars();
    const refreshed = response.data ?? [];
    setCalendars(refreshed);
    if (selectedCalendar) {
      const updatedCalendar = refreshed.find(
        (calendar: any) => calendar.id === selectedCalendar.id,
      );
      if (updatedCalendar) {
        setSelectedCalendar(updatedCalendar);
      }
    }
  };

  const submitHoliday = async () => {
    if (!selectedCalendar) {
      showSnackbar("No calendar selected", "error");
      return;
    }
    if (!holidayForm.holidayName?.trim() || !holidayForm.holidayDate) {
      showSnackbar("Holiday name and date are required", "error");
      return;
    }

    showSpinner();
    try {
      const isOptional = isOptionalHoliday(holidayForm.holidayType || "PUBLIC");
      
      const payload: any = {
        ...holidayForm,
        holidayCalendarId: selectedCalendar.id,
        optionalHoliday: isOptional,
      };

      const response: any = editingHolidayId
        ? await leaveService.updateHoliday(editingHolidayId, payload)
        : await leaveService.  createHoliday(payload);

      if (response.success) {
        showSnackbar(
          editingHolidayId ? "Holiday updated" : "Holiday created",
          "success",
        );
        setHolidayForm(emptyHolidayForm);
        setEditingHolidayId(null);
        await refreshHolidays();
        await refreshCalendars();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save holiday", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleEditHoliday = (holiday: Holidays) => {
    setEditingHolidayId(holiday.id);
    setHolidayForm({
      holidayName: holiday.holidayName,
      holidayDate: holiday.holidayDate,
      holidayType: holiday.holidayType,
      optionalHoliday: holiday.optionalHoliday ?? isOptionalHoliday(holiday.holidayType),
      active: holiday.active ?? true,
    });
  };

  const deleteHoliday = async (holiday: Holidays) => {
    showConfirmDialog({
      title: "Delete Holiday",
      message: `Delete "${holiday.holidayName}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response: any = await leaveService.deleteHoliday(holiday.id);
          if (response.success) {
            showSnackbar("Holiday deleted", "success");
            await refreshHolidays();
            await refreshCalendars();
          }
        } catch (err: any) {
          showSnackbar(err?.message || "Failed to delete holiday", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Import functions
  const handleImportHolidayChange = (index: number, field: keyof HolidayImport, value: any) => {
    const updatedHolidays = [...importHolidays];
    updatedHolidays[index] = {
      ...updatedHolidays[index],
      [field]: value,
    };
    setImportHolidays(updatedHolidays);
  };

  const addImportHolidayRow = () => {
    setImportHolidays([
      ...importHolidays,
      {
        holidayCalendarId: importCalendarId,
        holidayName: "",
        holidayDate: "",
        holidayType: "PUBLIC",
        optionalHoliday: false,
        active: true,
        applicableTo:"Both"
      },
    ]);
  };

  const removeImportHolidayRow = (index: number) => {
    if (importHolidays.length > 1) {
      const updatedHolidays = importHolidays.filter((_, i) => i !== index);
      setImportHolidays(updatedHolidays);
    }
  };

  const submitImport = async () => {
    if (!importCalendarId) {
      showSnackbar("Select a calendar to import holidays into", "error");
      return;
    }

    const invalidHolidays = importHolidays.some(
      (h) => !h.holidayName?.trim() || !h.holidayDate
    );
    if (invalidHolidays) {
      showSnackbar("Please fill in all required fields for each holiday (Name and Date)", "error");
      return;
    }

    const payload: any = importHolidays.map((holiday) => ({
      ...holiday,
      holidayCalendarId: importCalendarId,
      optionalHoliday: isOptionalHoliday(holiday.holidayType),
    }));

    showSpinner();
    try {
      const response = await leaveService.importHolidays(importCalendarId, payload);
      if (response.success) {
        showSnackbar(
          response.message || `${payload.length} holidays imported successfully`,
          "success"
        );
        setImportOpen(false);
        setImportHolidays([
          {
            holidayCalendarId: "",
            holidayName: "",
            holidayDate: "",
            holidayType: "PUBLIC",
            optionalHoliday: false,
            active: true,
            applicableTo: "Both"
          },
        ]);
        setImportCalendarId("");
        await load();
        if (selectedCalendar && holidaysDialogOpen) {
          await refreshHolidays();
        }
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to import holidays", "error");
    } finally {
      hideSpinner();
    }
  };

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

  const standardHolidays = holidaysData.filter(
    (holiday) => !isOptionalHoliday(holiday.holidayType) && !holiday.optionalHoliday
  );

  const optionalHolidays = holidaysData.filter(
    (holiday) => isOptionalHoliday(holiday.holidayType) || holiday.optionalHoliday
  );

  return (
    <LeavePageShell
      group="admin"
      title="Holiday Calendars"
      subtitle="Configure holiday calendars, holidays, and bulk imports"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<UploadFileOutlinedIcon />}
            className="!text-gray-800 !border-gray-300"
            onClick={() => setImportOpen(true)}
            size="small"
          >
            Import Holidays
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlinedIcon />}
            className="!bg-primary"
            onClick={openCreateCalendar}
          >
            Add Calendar
          </Button>
        </div>
      }
    >
      <TableContainer className="overflow-auto">
        <Table className="border border-gray-200 rounded-sm">
          <TableHead>
            <TableRow sx={leaveTableHeaderRowSx}>
              <TableCell className={leaveTableHeaderCellClassName}>
                S No
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Name
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Year
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Branch
              </TableCell>
              {/* <TableCell className={leaveTableHeaderCellClassName}>
                Applicabel to
              </TableCell> */}
              {/* <TableCell className={leaveTableHeaderCellClassName}>
                Allowed Leaves
              </TableCell> */}
              <TableCell className={leaveTableHeaderCellClassName}>
                Holidays
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Active
              </TableCell>
              <TableCell className={leaveTableActionHeaderCellClassName}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              calendars.map((calendar, i) => (
                <TableRow key={calendar.id} hover sx={getRowColor(i)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{calendar.calendarName}</TableCell>
                  <TableCell>{calendar.year}</TableCell>
                  <TableCell>
                    {calendar.branchName ||
                      calendar.locations?.join(", ") ||
                      "-"}
                  </TableCell>
                  {/* <TableCell>Staff/Labour</TableCell> */}
                  {/* <TableCell>5</TableCell> */}
                  <TableCell>{calendar.holidaysCount || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={calendar.active ? "Active" : "Inactive"}
                      color={calendar.active ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Manage Holidays">
                      <IconButton
                        size="small"
                        onClick={() => openHolidaysDialog(calendar)}
                      >
                        <EventOutlinedIcon className="!w-4 !h-4 text-cyan-500" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEditCalendar(calendar)}
                      >
                        <Edit className="!w-4 !h-4 text-blue-500" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => confirmDeleteCalendar(calendar)}
                      >
                        <Delete className="!w-4 !h-4 text-red-600" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && calendars.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <DataState
                    compact
                    type="empty"
                    title="No holiday calendars found."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Holiday calendar Dialog */}
      <Dialog
        open={calendarDialogOpen}
        onClose={() => setCalendarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4 text-[12px]">
            {editingCalendarId
              ? "Edit Holiday Calendar"
              : "Add Holiday Calendar"}
          </div>
          <IconButton onClick={() => setCalendarDialogOpen(false)}>
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <div className="grid grid-cols-2 gap-5 mt-3">
            <TextField
              label="Name"
              value={calendarForm.calendarName ?? ""}
              error={Boolean(calendarErrors.calendarName)}
              helperText={calendarErrors.calendarName}
              onChange={(event) =>
                setCalendarForm((current) => ({
                  ...current,
                  calendarName: event.target.value,
                }))
              }
              fullWidth
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Year"
                views={['year']}
                openTo="year"
                value={calendarForm.year ? dayjs().year(calendarForm.year) : null}
                onChange={(newValue) => {
                  setCalendarForm((current) => ({
                    ...current,
                    year: dayjs(newValue)?.year(),
                  }));
                }}
                format="YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>

            <div className="col-span-2">
              <FormControl fullWidth required>
                <InputLabel>Select Branch</InputLabel>
                <Select
                  value={calendarForm.branchId || ""}
                  label="Select Branch"
                  onChange={(e) =>
                    setCalendarForm((current) => ({
                      ...current,
                      branchId: e.target.value,
                    }))
                  }
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
            <div className="col-span-2">
              <FormControlLabel
                control={
                  <Switch
                    checked={calendarForm.active ?? true}
                    onChange={(event) =>
                      setCalendarForm((current) => ({
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
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={() => setCalendarDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={submitCalendar}
          >
            {editingCalendarId ? "Save Changes" : "Create Calendar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Holidays dialog */}
      <Dialog
        open={holidaysDialogOpen}
        onClose={closeHolidaysDialog}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4 text-[12px]">
            Holidays - {selectedCalendar?.calendarName || ""}
          </div>
          <IconButton onClick={closeHolidaysDialog}>
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="!p-4 h-[calc(100vh-300px)]">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid gap-5">
              {/* Standard Holidays Table */}
              <TableContainer>
                <div className="text-[12px] text-gray-800 mb-2 font-bold">
                  Standard Holidays
                  <Chip
                    label={standardHolidays.length}
                    size="small"
                    color="success" 
                    className="ml-2" 
                  />
                </div>
                <Table
                  stickyHeader
                  className={leaveTableClassName}
                  size="small"
                  sx={leaveTableSx}
                >
                  <TableHead>
                    <TableRow sx={leaveTableHeaderRowSx}>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        S No
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Date
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Name
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Type
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Applicable To
                      </TableCell>
                      <TableCell className={leaveTableActionHeaderCellClassName}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {standardHolidays.map((holiday, i) => (
                      <TableRow key={holiday.id} sx={getRowColor(i)}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{formatDate(holiday.holidayDate)}</TableCell>
                        <TableCell>{holiday.holidayName}</TableCell>
                        <TableCell>
                          <HolidayTypeBadge type={holiday.holidayType} />
                        </TableCell>
                        <TableCell>{holiday.applicableTo}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditHoliday(holiday)} // ✅ Using handleEditHoliday
                          >
                            <Edit className="!w-4 !h-4 text-blue-500" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteHoliday(holiday)}
                          >
                            <Delete className="!w-4 !h-4 text-red-600" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {standardHolidays.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <DataState
                            compact
                            type="empty"
                            title="No standard holidays in this calendar."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Optional Holidays Table */}
              <TableContainer>
                <div className="text-[12px] text-gray-800 mb-2 font-bold">
                  Optional Holidays
                  <Chip
                    label={optionalHolidays.length}
                    size="small"
                    color="secondary" 
                    className="ml-2" 
                  />
                </div>
                <Table
                  stickyHeader
                  className={leaveTableClassName}
                  size="small"
                  sx={leaveTableSx}
                >
                  <TableHead>
                    <TableRow sx={leaveTableHeaderRowSx}>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        S No
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Date
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Name
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Type
                      </TableCell>
                      <TableCell className={leaveTableHeaderCellClassName}>
                        Applicable To
                      </TableCell>
                      <TableCell className={leaveTableActionHeaderCellClassName}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {optionalHolidays.map((holiday, i) => (
                      <TableRow key={holiday.id} sx={getRowColor(i)}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{formatDate(holiday.holidayDate)}</TableCell>
                        <TableCell>{holiday.holidayName}</TableCell>
                        <TableCell>
                          <HolidayTypeBadge type={holiday.holidayType} />
                        </TableCell>
                        <TableCell>{holiday.applicableTo}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditHoliday(holiday)} // ✅ Using handleEditHoliday
                          >
                            <Edit className="!w-4 !h-4 text-blue-500" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteHoliday(holiday)}
                          >
                            <Delete className="!w-4 !h-4 text-red-600" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {optionalHolidays.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <DataState
                            compact
                            type="empty"
                            title="No optional holidays in this calendar."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Add/Edit Holiday Form */}
              <div className="border border-gray-300 rounded-lg p-3 pt-6 bg-white-50 grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                <DatePicker
                  label="Date"
                  value={
                    holidayForm.holidayDate
                      ? dayjs(holidayForm.holidayDate)
                      : null
                  }
                  onChange={(value) =>
                    setHolidayForm((current) => ({
                      ...current,
                      holidayDate: value ? dayjs(value).format("YYYY-MM-DD") : "",
                    }))
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <TextField
                  label="Name"
                  value={holidayForm.holidayName ?? ""}
                  onChange={(event) =>
                    setHolidayForm((current) => ({
                      ...current,
                      holidayName: event.target.value,
                    }))
                  }
                />
                <TextField
                  select
                  label="Type"
                  value={holidayForm.holidayType ?? "PUBLIC"}
                  onChange={(event) =>
                    setHolidayForm((current) => ({
                      ...current,
                      holidayType: event.target.value as Holiday["holidayType"],
                    }))
                  }
                  sx={selectSx}
                >
                  {holidayTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {getHolidayTypeDisplayName(type)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Applicable To"
                  value={holidayForm.applicableTo ?? "Both"}
                  onChange={(event) =>
                    setHolidayForm((current) => ({
                      ...current,
                      applicableTo: event.target.value,
                    }))
                  }
                  sx={selectSx}
                >
                    <MenuItem value="Staff">Staff</MenuItem>
                    <MenuItem value="Labour">Labour</MenuItem>
                    <MenuItem value="Both">Both</MenuItem>
                </TextField>
                <FormControlLabel 
                  // className="justify-center"
                  control={
                    <Switch
                      checked={holidayForm.optionalHoliday ?? false}
                      onChange={(event) =>
                        setHolidayForm((current) => ({
                          ...current,
                          optionalHoliday: event.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Optional"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={holidayForm.active ?? true}
                      onChange={(event) =>
                        setHolidayForm((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                      color="primary"
                    />
                  }
                  label="Active"
                />

                <Button
                  variant="contained"
                  className="!bg-primary h-fit"
                  onClick={submitHoliday}
                >
                  {editingHolidayId ? "Save Holiday" : "Add Holiday"}
                </Button>
              </div>
            </div>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={closeHolidaysDialog}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="text-[12px] text-gray-900 ml-4">Import Holidays</div>
          <IconButton onClick={() => setImportOpen(false)} size="small">
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>

        <div className="p-4 space-y-4 mt-3">
          <TextField
            select
            label="Target Calendar"
            value={importCalendarId}
            onChange={(event) => {
              const calendarId = event.target.value;
              setImportCalendarId(calendarId);
              setImportHolidays(importHolidays.map(h => ({
                ...h,
                holidayCalendarId: calendarId,
              })));
            }}
            required
            fullWidth
          >
            {calendars.map((calendar) => (
              <MenuItem key={calendar.id} value={calendar.id}>
                {calendar.calendarName} ({calendar.year})
              </MenuItem>
            ))}
          </TextField>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Holidays ({importHolidays.length})
              </span>
              <Button
                size="small"
                startIcon={<AddOutlinedIcon />}
                onClick={addImportHolidayRow}
                disabled={!importCalendarId}
                className="!text-primary !normal-case"
              >
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {importHolidays.map((holiday, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 relative">
                  <div className="flex items-center justify-between pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Date"
                          value={holiday.holidayDate ? dayjs(holiday.holidayDate) : null}
                          onChange={(value) =>
                            handleImportHolidayChange(
                              index,
                              'holidayDate',
                              value ? dayjs(value).format("YYYY-MM-DD") : ""
                            )
                          }
                        />
                      </LocalizationProvider>

                      <TextField
                        label="Name"
                        value={holiday.holidayName}
                        onChange={(e) =>
                          handleImportHolidayChange(index, 'holidayName', e.target.value)
                        }
                        required
                        fullWidth
                        placeholder="Holiday name"
                      />

                      <TextField
                        select
                        label="Type"
                        value={holiday.holidayType}
                        onChange={(e) =>
                          handleImportHolidayChange(index, 'holidayType', e.target.value)
                        }
                        fullWidth
                        sx={selectSx}
                      >
                        {holidayTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {getHolidayTypeDisplayName(type)}
                          </MenuItem>
                        ))}
                      </TextField>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={holiday.optionalHoliday}
                            onChange={(e) =>
                              handleImportHolidayChange(index, 'optionalHoliday', e.target.checked)
                            }
                          />
                        }
                        label="Optional"
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={holiday.active}
                            onChange={(e) =>
                              handleImportHolidayChange(index, 'active', e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Active"
                      />
                    </div>

                    <div>
                      {importHolidays.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeImportHolidayRow(index)}
                          className="absolute top-1 right-1 !text-gray-400 hover:!text-red-500"
                        >
                          <CancelOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <Button
            variant="outlined"
            onClick={() => {
              setImportOpen(false);
              setImportHolidays([{
                holidayCalendarId: "",
                holidayName: "",
                holidayDate: "",
                holidayType: "PUBLIC",
                optionalHoliday: false,
                active: true,
                applicableTo:"Both"
              }]);
              setImportCalendarId("");
            }}
            className="!text-gray-600 !border-gray-300 !normal-case"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitImport}
            disabled={
              !importCalendarId ||
              importHolidays.some(h => !h.holidayName?.trim() || !h.holidayDate)
            }
            className="!bg-primary !normal-case"
          >
            Import {importHolidays.length}
          </Button>
        </div>
      </Dialog>
    </LeavePageShell>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import { useAuth } from "../../auth/authContext";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type { Holiday, HolidayCalendar } from "../../services/modules/leaveTypes";
import { leaveGroupLabels, leaveRoutes } from "./leaveRoutes";

type HolidayGridRow = Holiday & {
  day: string;
  displayDate: string;
  locationOptions: string[];
};

const holidayTypeLabels: Record<Holiday["type"], string> = {
  PUBLIC: "Public Holiday",
  COMPANY: "Company Holiday",
  OPTIONAL: "Optional Holiday",
  RESTRICTED: "Restricted Holiday",
  NATIONAL: "Public Holiday",
  REGIONAL: "Restricted Holiday",
};

const holidayTypeClasses: Record<Holiday["type"], string> = {
  PUBLIC: "!bg-green-50 !text-green-700",
  COMPANY: "!bg-blue-50 !text-blue-700",
  OPTIONAL: "!bg-primary-50 !text-primary",
  RESTRICTED: "!bg-yellow-50 !text-yellow-700",
  NATIONAL: "!bg-green-50 !text-green-700",
  REGIONAL: "!bg-yellow-50 !text-yellow-700",
};

const holidayTextCellSx = {
  color: "var(--text-primary)",
  fontSize: "0.875rem",
};

const tableContainerSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

const tableSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

const tableHeaderRowSx = {
  backgroundColor: "var(--bg-secondary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  },
};

const tableRowSx = {
  backgroundColor: "var(--bg-primary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(
    new Date(value),
  );
}

function splitLocations(value?: string) {
  return (value ?? "")
    .split(",")
    .map((location) => location.trim())
    .filter(Boolean);
}

function uniqueLocations(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export default function HolidayCalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [calendars, setCalendars] = useState<HolidayCalendar[]>([]);
  const [year, setYear] = useState(2026);
  const [dateFilter, setDateFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<Holiday["type"] | "">("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const visibleRoutes = useMemo(() => {
    const roles = session?.user.roles ?? [];
    return leaveRoutes.filter((route) =>
      route.roles.some((role) => roles.includes(role)),
    );
  }, [session?.user.roles]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      showSpinner();
      try {
        const response = await leaveService.getHolidayCalendars({
          page: 0,
          size: 20,
        });
        if (isMounted) {
          setCalendars(response.data?.content ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          showSnackbar(err?.message || "Failed to load holidays", "error");
        }
      } finally {
        if (isMounted) {
          hideSpinner();
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
      hideSpinner();
    };
  }, []);

  const allHolidays = useMemo<HolidayGridRow[]>(
    () =>
      calendars
        .filter((calendar) => calendar.year === year)
        .flatMap((calendar) =>
          calendar.holidays.map((holiday) => {
            const locationOptions = uniqueLocations([
              ...splitLocations(holiday.location),
              ...(calendar.locations ?? []),
              calendar.branchName ?? "",
            ]);
            return {
              ...holiday,
              location: locationOptions.join(", "),
              locationOptions,
            };
          }),
        )
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((holiday) => ({
          ...holiday,
          day: formatDay(holiday.date),
          displayDate: formatDate(holiday.date),
        })),
    [calendars, year],
  );
  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allHolidays.flatMap((holiday) =>
            holiday.locationOptions,
          ),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [allHolidays],
  );
  const holidays = useMemo(
    () =>
      allHolidays.filter((holiday) => {
        const nameMatches = holiday.name
          .toLowerCase()
          .includes(nameFilter.trim().toLowerCase());
        const locationMatches =
          !locationFilter ||
          holiday.locationOptions.some(
            (location) =>
              location.toLowerCase() === locationFilter.toLowerCase(),
          );

        return (
          (!dateFilter || holiday.date === dateFilter) &&
          (!dayFilter || holiday.day === dayFilter) &&
          (!typeFilter || holiday.type === typeFilter) &&
          nameMatches &&
          locationMatches
        );
      }),
    [allHolidays, dateFilter, dayFilter, locationFilter, nameFilter, typeFilter],
  );
  const optionalHolidays = holidays.filter((holiday) => holiday.type === "OPTIONAL");
  const standardHolidays = holidays.filter((holiday) => holiday.type !== "OPTIONAL");

  const confirmOptionalHoliday = (holiday: Holiday) => {
    showConfirmDialog({
      title: "Select Optional Holiday",
      message: `Select "${holiday.name}" as your optional holiday?`,
      confirmText: "Select",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response = await leaveService.selectOptionalHoliday(holiday.id);
          if (response.success) {
            showSnackbar(response.message || "Optional holiday selected", "success");
          }
        } catch (err: any) {
          showSnackbar(err?.message || "Failed to select optional holiday", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const dateFilterValue = dateFilter ? dayjs(dateFilter) : null;
  const handleDateFilterChange = (value: Dayjs | null) => {
    setDateFilter(value ? value.format("YYYY-MM-DD") : "");
  };

  const renderHolidayRows = (items: HolidayGridRow[], includeAction = false) => (
    <>
      {items.map((holiday) => (
        <TableRow key={holiday.id} hover sx={tableRowSx}>
          <TableCell sx={holidayTextCellSx}>
            {holiday.displayDate || "-"}
          </TableCell>
          <TableCell sx={holidayTextCellSx}>
            {holiday.day || "-"}
          </TableCell>
          <TableCell sx={holidayTextCellSx}>
            <span className="font-medium">{holiday.name || "-"}</span>
          </TableCell>
          <TableCell>
            <Chip
              size="small"
              label={holidayTypeLabels[holiday.type]}
              className={holidayTypeClasses[holiday.type]}
            />
          </TableCell>
          <TableCell sx={{ ...holidayTextCellSx, maxWidth: 320 }} title={holiday.location}>
            <span className="break-words">{holiday.location || "-"}</span>
          </TableCell>
          {includeAction && (
            <TableCell className="text-center" sx={holidayTextCellSx}>
              <Button
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                  },
                }}
                onClick={() => confirmOptionalHoliday(holiday)}
              >
                Select
              </Button>
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="text-gray-500 text-sm flex flex-wrap items-center gap-1">
        Leave
        <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
        <span className="text-primary font-medium">{leaveGroupLabels.employee}</span>
        <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
        <span className="text-gray-800 font-medium">Holiday Calendar</span>
      </div>

      <Paper elevation={0} className="border border-gray-300 !bg-white overflow-hidden">
        <Tabs
          value={location.pathname}
          variant="scrollable"
          scrollButtons="auto"
          className="!border-b !border-gray-300"
          sx={{ "& .MuiTabs-indicator": { backgroundColor: "var(--color-primary)", height: 3 } }}
        >
          {visibleRoutes.map((route) => (
            <Tab
              key={route.path}
              value={route.path}
              label={route.label}
              onClick={() => navigate(route.path)}
              className="!text-gray-900"
            />
          ))}
        </Tabs>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-gray-800">
                Holiday Calendar
              </div>
              <div className="text-sm text-gray-500 mt-1">
                View public, company, restricted, and optional holidays
              </div>
            </div>
            <TextField
              select
              label="Year"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="min-w-[140px]"
            >
              {[2026, 2025].map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 border border-gray-300 rounded-lg px-3 pb-3 pt-4 bg-gray-50">
            <DatePicker
              label="Date"
              value={dateFilterValue}
              onChange={handleDateFilterChange}
              format="DD MMM YYYY"
              slots={{
                openPickerIcon: CalendarMonthOutlinedIcon,
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
                openPickerButton: {
                  color: "primary",
                  edge: "end",
                },
              }}
            />
            <TextField
              select
              label="Day"
              value={dayFilter}
              onChange={(event) => setDayFilter(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  displayEmpty: true,
                  renderValue: (value: unknown) => value ? String(value) : "All Days",
                },
              }}
            >
              <MenuItem value="">All Days</MenuItem>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Holiday Name"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Search holiday"
            />
            <TextField
              select
              label="Type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as Holiday["type"] | "")
              }
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  displayEmpty: true,
                  renderValue: (value: unknown) =>
                    value ? holidayTypeLabels[value as Holiday["type"]] : "All Types",
                },
              }}
            >
              <MenuItem value="">All Types</MenuItem>
              {(["PUBLIC", "COMPANY", "OPTIONAL", "RESTRICTED"] as const).map(
                (type) => (
                  <MenuItem key={type} value={type}>
                    {holidayTypeLabels[type]}
                  </MenuItem>
                ),
              )}
            </TextField>
            <TextField
              select
              label="Location/Branch"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  displayEmpty: true,
                  renderValue: (value: unknown) =>
                    value ? String(value) : "All Locations",
                },
              }}
            >
              <MenuItem value="">All Locations</MenuItem>
              {locationOptions.map((location) => (
                <MenuItem key={location} value={location}>
                  {location}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <TableContainer
            component={Paper}
            elevation={0}
            className="overflow-auto"
            sx={tableContainerSx}
          >
            <Table className="border" size="small" sx={tableSx}>
              <TableHead>
                <TableRow sx={tableHeaderRowSx}>
                  <TableCell className="!font-semibold">Date</TableCell>
                  <TableCell className="!font-semibold">Day</TableCell>
                  <TableCell className="!font-semibold">Holiday Name</TableCell>
                  <TableCell className="!font-semibold">Type</TableCell>
                  <TableCell className="!font-semibold">Location/Branch</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{!loading && renderHolidayRows(standardHolidays)}</TableBody>
            </Table>
            {loading && (
              <Typography color="text.secondary" className="text-center py-8">
                Loading holidays...
              </Typography>
            )}
            {!loading && standardHolidays.length === 0 && (
              <Typography color="text.secondary" className="text-center py-8">
                No holidays found.
              </Typography>
            )}
          </TableContainer>

          <div className="font-semibold text-primary">Optional Holidays</div>
          <TableContainer
            component={Paper}
            elevation={0}
            className="overflow-auto"
            sx={tableContainerSx}
          >
            <Table className="border" size="small" sx={tableSx}>
              <TableHead>
                <TableRow sx={tableHeaderRowSx}>
                  <TableCell className="!font-semibold">Date</TableCell>
                  <TableCell className="!font-semibold">Day</TableCell>
                  <TableCell className="!font-semibold">Holiday Name</TableCell>
                  <TableCell className="!font-semibold">Type</TableCell>
                  <TableCell className="!font-semibold">Location/Branch</TableCell>
                  <TableCell className="!font-semibold text-center">Optional Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{!loading && renderHolidayRows(optionalHolidays, true)}</TableBody>
            </Table>
            {!loading && optionalHolidays.length === 0 && (
              <Typography color="text.secondary" className="text-center py-8">
                No optional holidays found.
              </Typography>
            )}
          </TableContainer>
        </div>
        </LocalizationProvider>
      </Paper>
    </div>
  );
}

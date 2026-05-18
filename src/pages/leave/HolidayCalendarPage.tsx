import { useEffect, useMemo, useState } from "react";
import {
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import DataState from "../../components/DataState";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type { Holiday, HolidayCalendar } from "../../services/modules/leaveTypes";
import HolidayTypeBadge from "./components/HolidayTypeBadge";
import LeaveFilterBar from "./components/LeaveFilterBar";
import LeavePageShell from "./components/LeavePageShell";
import { getHolidayTypeMeta } from "./holidayTypeMeta";
import { formatDate, formatDay } from "./leaveFormatters";
import {
  leaveTableActionCellSx,
  leaveTableActionHeaderCellClassName,
  leaveTableBodyCellSx,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableLocationCellSx,
  leaveTableRowSx,
  leaveTableSx,
} from "./components/leaveTableStyles";

type HolidayGridRow = Holiday & {
  day: string;
  displayDate: string;
  locationOptions: string[];
};


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
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [calendars, setCalendars] = useState<HolidayCalendar[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dateFilter, setDateFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<Holiday["type"] | "">("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);

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

  const resetFilters = () => {
    setDateFilter("");
    setDayFilter("");
    setNameFilter("");
    setTypeFilter("");
    setLocationFilter("");
  };

  const renderHolidayRows = (items: HolidayGridRow[], includeAction = false) => (
    <>
      {items.map((holiday) => (
        <TableRow key={holiday.id} hover sx={leaveTableRowSx}>
          <TableCell sx={leaveTableBodyCellSx}>
            {holiday.displayDate || "-"}
          </TableCell>
          <TableCell sx={leaveTableBodyCellSx}>
            {holiday.day || "-"}
          </TableCell>
          <TableCell sx={leaveTableBodyCellSx}>
            <span className="font-medium">{holiday.name || "-"}</span>
          </TableCell>
          <TableCell>
            <HolidayTypeBadge type={holiday.type} />
          </TableCell>
          <TableCell sx={leaveTableLocationCellSx} title={holiday.location}>
            <span className="break-words">{holiday.location || "-"}</span>
          </TableCell>
          {includeAction && (
            <TableCell sx={leaveTableActionCellSx}>
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
    <LeavePageShell
      title="Holiday Calendar"
      subtitle="View public, company, restricted, and optional holidays"
      actions={
        <TextField
          select
          label="Year"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          className="min-w-[140px]"
        >
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
      }
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>

          <LeaveFilterBar className="px-3 pb-3 pt-4" onReset={resetFilters}>
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
                    value ? getHolidayTypeMeta(value as string).label : "All Types",
                },
              }}
            >
              <MenuItem value="">All Types</MenuItem>
              {(["PUBLIC", "COMPANY", "OPTIONAL", "RESTRICTED"] as const).map(
                (type) => (
                  <MenuItem key={type} value={type}>
                    {getHolidayTypeMeta(type).label}
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
          </LeaveFilterBar>

          <TableContainer
            component={Paper}
            elevation={0}
            className="overflow-auto"
            sx={leaveTableContainerSx}
          >
            <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
              <TableHead>
                <TableRow sx={leaveTableHeaderRowSx}>
                  <TableCell className={leaveTableHeaderCellClassName}>Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Day</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Holiday Name</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Type</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Location/Branch</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && renderHolidayRows(standardHolidays)}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <DataState compact type="loading" title="Loading holidays..." />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && standardHolidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <DataState compact type="empty" title="No holidays found." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="font-semibold text-primary">Optional Holidays</div>
          <TableContainer
            component={Paper}
            elevation={0}
            className="overflow-auto"
            sx={leaveTableContainerSx}
          >
            <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
              <TableHead>
                <TableRow sx={leaveTableHeaderRowSx}>
                  <TableCell className={leaveTableHeaderCellClassName}>Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Day</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Holiday Name</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Type</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Location/Branch</TableCell>
                  <TableCell className={leaveTableActionHeaderCellClassName}>Optional Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && renderHolidayRows(optionalHolidays, true)}
                {!loading && optionalHolidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <DataState
                        compact
                        type="empty"
                        title="No optional holidays found."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
      </LocalizationProvider>
    </LeavePageShell>
  );
}

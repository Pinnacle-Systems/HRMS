import { useEffect, useMemo, useState } from "react";
import {
  Chip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventIcon from "@mui/icons-material/Event";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import DataState from "../../components/DataState";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type {
  Holiday,
  HolidayCalendar,
} from "../../services/modules/leaveTypes";
import HolidayTypeBadge from "./components/HolidayTypeBadge";
import LeaveFilterBar from "./components/LeaveFilterBar";
import LeavePageShell from "./components/LeavePageShell";
import { getHolidayTypeMeta } from "./holidayTypeMeta";
import { formatDate, formatDay } from "./leaveFormatters";
import {
  leaveTableClassName,
  leaveTableHeaderCellClassName,
  leaveTableLocationCellSx,
  leaveTableSx,
} from "./components/leaveTableStyles";
import dayjs from "dayjs";
import { selectSx } from "../../const";
import { getRowColor } from "../const";
import {
  LocationOnOutlined,
  ViewListOutlined,
  ViewModuleOutlined,
} from "@mui/icons-material";

type ViewMode = "table" | "card";

// Extended Holiday type with additional fields
type HolidayWithDetails = Holiday & {
  day: string;
  displayDate: string;
  locationOptions: string[];
  calendarName?: string;
  branchName?: string;
};

// Type for the combined data structure
// type HolidayCalendarWithHolidays = HolidayCalendar & {
//   holidays: Holiday[];
// };

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
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const theme = useTheme();

  // State for calendars and holidays
  const [calendarList, setCalendarList] = useState<HolidayCalendar[]>([]);
  const [allHolidaysData, setAllHolidaysData] = useState<Holiday[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");

  // UI state
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [loading, setLoading] = useState(true);

  // Filter states
  const [dateFilter, setDateFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<Holiday["holidayType"] | "">("");
  const [locationFilter, setLocationFilter] = useState("");

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      showSpinner();
      try {
        // Fetch calendars
        const calendarsResponse: any = await leaveService.getHolidayCalendars();
        const calendars = calendarsResponse.data ?? [];

        // Fetch all holidays
        const holidaysResponse: any = await leaveService.getHolidays();
        const holidays = holidaysResponse.data ?? [];

        if (isMounted) {
          setCalendarList(calendars);
          setAllHolidaysData(holidays);

          // Auto-select first calendar if available
          if (calendars.length > 0) {
            setSelectedCalendarId(calendars[0].id);
          }
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

  // Get available years from calendars
  const availableYears = useMemo(() => {
    const years = calendarList.map((cal) => cal.year).filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [calendarList]);

  // Filter calendars by selected year
  const filteredCalendars = useMemo(() => {
    return calendarList.filter((cal) => cal.year === year);
  }, [calendarList, year]);

  // Get selected calendar details
  const selectedCalendar = useMemo(() => {
    return calendarList.find((cal) => cal.id === selectedCalendarId);
  }, [calendarList, selectedCalendarId]);

  // Process holidays data
  const processedHolidays = useMemo<HolidayWithDetails[]>(() => {
    // Filter holidays by selected calendar
    const calendarHolidays = allHolidaysData.filter(
      (holiday) => holiday.holidayCalendarId === selectedCalendarId,
    );

    return calendarHolidays
      .map((holiday) => {
        const locationOptions = uniqueLocations([
          ...splitLocations(holiday.location),
          selectedCalendar?.branchName ?? "",
        ]);

        return {
          ...holiday,
          location: locationOptions.join(", "),
          locationOptions,
          calendarName: selectedCalendar?.calendarName,
          branchName: selectedCalendar?.branchName,
          day: formatDay(holiday.holidayDate),
          displayDate: formatDate(holiday.holidayDate),
        };
      })
      .sort((left, right) => left.holidayDate.localeCompare(right.holidayDate));
  }, [allHolidaysData, selectedCalendarId, selectedCalendar]);

  // Get unique location options
  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          processedHolidays.flatMap((holiday) => holiday.locationOptions),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [processedHolidays],
  );

  // Apply filters
  const holidays = useMemo(
    () =>
      processedHolidays.filter((holiday) => {
        const nameMatches = holiday.holidayName
          .toLowerCase()
          .includes(nameFilter.trim().toLowerCase());
        const locationMatches =
          !locationFilter ||
          holiday.locationOptions.some(
            (location) =>
              location.toLowerCase() === locationFilter.toLowerCase(),
          );
        const holidayDate = holiday.holidayDate;

        return (
          (!dateFilter || holidayDate === dateFilter) &&
          (!dayFilter || holiday.day === dayFilter) &&
          (!typeFilter || holiday.holidayType === typeFilter) &&
          nameMatches &&
          locationMatches
        );
      }),
    [
      processedHolidays,
      dateFilter,
      dayFilter,
      locationFilter,
      nameFilter,
      typeFilter,
    ],
  );

  // Separate optional and standard holidays
  const optionalHolidays = holidays.filter(
    (holiday) => holiday.optionalHoliday === true,
  );
  const standardHolidays = holidays.filter(
    (holiday) => holiday.optionalHoliday !== true,
  );

  // Handler for selecting optional holiday
  // const confirmOptionalHoliday = (holiday: HolidayWithDetails) => {
  //   showConfirmDialog({
  //     title: "Select Optional Holiday",
  //     message: `Select "${holiday.holidayName}" as your optional holiday?`,
  //     confirmText: "Select",
  //     cancelText: "Cancel",
  //     onConfirm: async () => {
  //       showSpinner();
  //       try {
  //         const response: any = await leaveService.selectOptionalHoliday(
  //           holiday.id,
  //         );
  //         if (response.success) {
  //           showSnackbar(
  //             response.message || "Optional holiday selected",
  //             "success",
  //           );
  //         }
  //       } catch (err: any) {
  //         showSnackbar(
  //           err?.message || "Failed to select optional holiday",
  //           "error",
  //         );
  //       } finally {
  //         hideSpinner();
  //       }
  //     },
  //   });
  // };

  // Filter handlers
  const dateFilterValue = dateFilter ? dayjs(dateFilter) : null;
  const handleDateFilterChange = (value: any) => {
    setDateFilter(value ? dayjs(value).format("YYYY-MM-DD") : "");
  };

  const resetFilters = () => {
    setDateFilter("");
    setDayFilter("");
    setNameFilter("");
    setTypeFilter("");
    setLocationFilter("");
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewMode | null,
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  // Render functions
  const renderHolidayRows = (
    items: HolidayWithDetails[],
    // includeAction = false,
  ) => (
    <>
      {items.map((holiday, i) => (
        <TableRow key={holiday.id} sx={getRowColor(i)}>
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventIcon className="!w-3" />
              <span>{holiday.displayDate || "-"}</span>
            </Box>
          </TableCell>
          <TableCell>
            <Chip
              label={holiday.day || "-"}
              size="small"
              variant="outlined"
              className="text-gray-800 bg-gray-100"
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2">
              {holiday.holidayName || "-"}
            </Typography>
          </TableCell>
          <TableCell>
            <HolidayTypeBadge type={holiday.holidayType} />
          </TableCell>
          <TableCell sx={leaveTableLocationCellSx} title={holiday.location}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocationOnOutlined className="text-primary w-3" />
              <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                {holiday.location || "-"}
              </Typography>
            </Box>
          </TableCell>
          {/* {includeAction && (
            <TableCell>
              <Button
                size="small"
                variant="outlined"
                className="!text-primary !border-primary"
                onClick={() => confirmOptionalHoliday(holiday)}
              >
                Select
              </Button>
            </TableCell>
          )} */}
        </TableRow>
      ))}
    </>
  );

  const renderHolidayCards = (
    items: HolidayWithDetails[],
    // includeAction = false,
  ) => {
    if (items.length === 0) {
      return (
        <Box sx={{ py: 4 }}>
          <DataState compact type="empty" title="No holidays found." />
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {items.map((holiday) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={holiday.id}>
            <Card
              className="bg-white-50"
              sx={{
                borderRadius: "12px",
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  transform: "translateY(-4px)",
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <CardContent sx={{ p: 2.5, flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EventIcon
                      sx={{ fontSize: 18, color: theme.palette.primary.main }}
                    />
                    <div className="text-gray-800">{holiday.displayDate}</div>
                  </Box>
                  <Chip
                    label={holiday.day}
                    size="small"
                    className="text-gray-800"
                    sx={{
                      borderRadius: "4px",
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: alpha(theme.palette.primary.main, 0.15),
                      fontWeight: 500,
                    }}
                    variant="outlined"
                  />
                </Box>

                <div className="flex items-center mt-1 justify-between">
                  <div>
                    <div className="text-[12px] text-gray-800">
                      {holiday.holidayName}
                    </div>

                    <div>
                      <HolidayTypeBadge type={holiday.holidayType} />
                    </div>
                  </div>

                  {holiday.location && (
                    <div className="flex items-center gap-1">
                      <LocationOnOutlined className="!w-4 text-primary" />
                      <div className="text-[12px] text-gray-800">
                        {holiday.location}
                      </div>
                    </div>
                  )}
                </div>

                {/* {includeAction && (
                  <Box
                    sx={{
                      mt: 2,
                      pt: 1.5,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        borderRadius: "8px",
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "none",
                          backgroundColor: theme.palette.primary.dark,
                        },
                      }}
                      onClick={() => confirmOptionalHoliday(holiday)}
                    >
                      Select Optional Holiday
                    </Button>
                  </Box>
                )} */}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderStandardHolidays = () => {
    if (viewMode === "table") {
      return (
        <TableContainer className="overflow-auto rounded-sm">
          <Table className={leaveTableClassName} sx={leaveTableSx}>
            <TableHead>
              <TableRow>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Date
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Day
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Holiday Name
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Type
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Location/Branch
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && renderHolidayRows(standardHolidays)}
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <DataState
                      compact
                      type="loading"
                      title="Loading holidays..."
                    />
                  </TableCell>
                </TableRow>
              )}
              {!loading && standardHolidays.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <DataState
                      compact
                      type="empty"
                      title="No holidays found."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return (
      <Box sx={{ mb: 4 }}>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <DataState compact type="loading" title="Loading holidays..." />
          </Box>
        ) : (
          renderHolidayCards(standardHolidays)
        )}
      </Box>
    );
  };

  const renderOptionalHolidays = () => {
    if (viewMode === "table") {
      return (
        <TableContainer className="overflow-auto !mb-4">
          <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
            <TableHead>
              <TableRow>
                <TableCell
                  className={leaveTableHeaderCellClassName}
                  sx={{ fontWeight: 600 }}
                >
                  Date
                </TableCell>
                <TableCell
                  className={leaveTableHeaderCellClassName}
                  sx={{ fontWeight: 600 }}
                >
                  Day
                </TableCell>
                <TableCell
                  className={leaveTableHeaderCellClassName}
                  sx={{ fontWeight: 600 }}
                >
                  Holiday Name
                </TableCell>
                <TableCell
                  className={leaveTableHeaderCellClassName}
                  sx={{ fontWeight: 600 }}
                >
                  Type
                </TableCell>
                <TableCell
                  className={leaveTableHeaderCellClassName}
                  sx={{ fontWeight: 600 }}
                >
                  Location/Branch
                </TableCell>
                {/* <TableCell
                  className={leaveTableActionHeaderCellClassName}
                  sx={{ fontWeight: 600 }}
                >
                  Action
                </TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && renderHolidayRows(optionalHolidays)}
              {!loading && optionalHolidays.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <DataState
                      compact
                      type="empty"
                      title="No optional holidays available."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return (
      <Box>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <DataState compact type="loading" title="Loading holidays..." />
          </Box>
        ) : (
          renderHolidayCards(optionalHolidays)
        )}
      </Box>
    );
  };

  return (
    <LeavePageShell
      group="employee"
      title="Holiday Calendar"
      subtitle="View public, company, restricted, and optional holidays"
      actions={
        <div className="flex items-center gap-2">
          <TextField
            select
            value={year}
            onChange={(event) => {
              const newYear = Number(event.target.value);
              setYear(newYear);
              const firstCalendar = calendarList.find(
                (cal) => cal.year === newYear,
              );
              if (firstCalendar) {
                setSelectedCalendarId(firstCalendar.id);
              }
            }}
            sx={{
              ...selectSx,
              minWidth: "100px",
              "& .MuiSelect-select": {
                padding: "8px !important",
              },
            }}
          >
            {availableYears.map((yearItem) => (
              <MenuItem key={yearItem} value={yearItem}>
                {yearItem}
              </MenuItem>
            ))}
          </TextField>

          {/* Calendar Selector */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="calendar-select-label">Calendar</InputLabel>
            <Select
              labelId="calendar-select-label"
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              sx={{
                ...selectSx,
                minWidth: "100px",
                "& .MuiSelect-select": {
                  padding: "7px !important",
                },
              }}
            >
              {filteredCalendars.map((calendar) => (
                <MenuItem key={calendar.id} value={calendar.id}>
                  {calendar.calendarName}
                  {calendar.branchName && ` (${calendar.branchName})`}
                </MenuItem>
              ))}
              {filteredCalendars.length === 0 && (
                <MenuItem disabled>No calendars available</MenuItem>
              )}
            </Select>
          </FormControl>

          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton
              value="table"
              aria-label="table view"
              className="!h-8 text-gray-500"
              title="Table Mode"
            >
              <ViewListOutlined className="!w-4" />
            </ToggleButton>
            <ToggleButton
              value="card"
              aria-label="card view"
              className="!h-8 text-gray-500"
              title="Card Mode"
            >
              <ViewModuleOutlined className="!w-4" />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      }
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <LeaveFilterBar className="p-3 pt-5" onReset={resetFilters}>
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
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
              select: {
                displayEmpty: true,
                renderValue: (value: unknown) =>
                  value ? String(value) : "All Days",
              },
            }}
            sx={{
              ...selectSx,
              "& .MuiSelect-select": {
                padding: "8px !important",
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
            sx={{
              "& .MuiInputBase-input": {
                padding: "9px !important",
              },
            }}
          />
          <TextField
            select
            label="Type"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as Holiday["holidayType"] | "")
            }
            sx={{
              ...selectSx,
              "& .MuiSelect-select": {
                padding: "8px !important",
              },
            }}
            slotProps={{
              inputLabel: { shrink: true },
              select: {
                displayEmpty: true,
                renderValue: (value: unknown) =>
                  value
                    ? getHolidayTypeMeta(value as string).label
                    : "All Types",
              },
            }}
          >
            <MenuItem value="">All Types</MenuItem>
            {(
              [
                "PUBLIC",
                "COMPANY",
                "OPTIONAL",
                "RESTRICTED",
                "REGIONAL",
                "NATIONAL",
              ] as const
            ).map((type) => (
              <MenuItem key={type} value={type}>
                {getHolidayTypeMeta(type).label}
              </MenuItem>
            ))}
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
            sx={{
              ...selectSx,
              minWidth: "100px",
              "& .MuiSelect-select": {
                padding: "8px !important",
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

        {/* Display selected calendar info */}
        {selectedCalendar && (
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <div className="text-gray-800 text-[12px]">
              <strong>Calendar:</strong> {selectedCalendar.calendarName}
            </div>
            {selectedCalendar.branchName && (
              <div className="text-gray-800 text-[12px]">
                <strong>Branch:</strong> {selectedCalendar.branchName}
              </div>
            )}
            <div className="text-gray-800 text-[12px]">
              <strong>Year:</strong> {selectedCalendar.year}
            </div>
          </Box>
        )}

        {/* Standard Holidays Section */}
        <div className="text-[12px] text-gray-800">
          Standard Holidays
          <Chip
            label={standardHolidays.length}
            size="small"
            className="text-gray-800 bg-gray-100 ml-2"
          />
        </div>
        {renderStandardHolidays()}

        {/* Optional Holidays Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
            mt: 3,
          }}
        >
          <div className="text-gray-800 text-[12px]">
            Optional Holidays
            <Chip
              label={optionalHolidays.length}
              size="small"
              color="warning"
              className="ml-2"
            />
          </div>
          {optionalHolidays.length > 0 && (
            <div className="text-gray-800 text-[12px]">
              Select one optional holiday to avail
            </div>
          )}
        </Box>
        {renderOptionalHolidays()}
      </LocalizationProvider>
    </LeavePageShell>
  );
}

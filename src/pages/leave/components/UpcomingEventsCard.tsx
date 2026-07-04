import { useMemo, useState, useEffect } from "react";
import {
  Card,
  Chip,
  TextField,
  Button,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HolidayVillageIcon from "@mui/icons-material/HolidayVillage";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import RefreshIcon from "@mui/icons-material/Refresh";
import DataState from "../../../components/DataState";
import { formatDate } from "../leaveFormatters";

export interface UpcomingEvent {
  id: string;
  type: "leave" | "holiday";
  name: string;
  fromDate: string;
  toDate: string;
  totalDays?: number;
  holidayType?: string;
  status?: string;
  approver?: string;
  daysFromToday?: number;
  employeeCode?: string;
}

interface UpcomingEventsCardProps {
  events: UpcomingEvent[];
  loading?: boolean;
  error?: string | null;
  daysAhead: number;
  onDaysAheadChange: (days: number) => void;
  onRefresh?: () => void;
}

export default function UpcomingEventsCard({
  events: propEvents = [],
  loading = false,
  error = null,
  daysAhead,
  onDaysAheadChange,
  onRefresh,
}: UpcomingEventsCardProps) {
  const theme = useTheme();
  const [localDaysAhead, setLocalDaysAhead] = useState(daysAhead);

  // Separate real leaves and holidays from props
  const realLeaves = useMemo(
    () => propEvents.filter((e) => e.type === "leave"),
    [propEvents],
  );

  const realHolidays = useMemo(
    () => propEvents.filter((e) => e.type === "holiday"),
    [propEvents],
  );

  // Use real leaves if available, otherwise use mock leaves
  // const leaves = useMemo(() => {
  //   if (realLeaves.length > 0) {
  //     return realLeaves;
  //   }
  // }, [realLeaves]);

  // Combine leaves and holidays for display
  const allEvents = useMemo(() => {
    return [...realLeaves, ...realHolidays];
  }, [realLeaves, realHolidays]);

  // Update local state when prop changes
  useEffect(() => {
    setLocalDaysAhead(daysAhead);
  }, [daysAhead]);

  // Filter events based on days ahead
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + daysAhead);

    return allEvents.filter((event) => {
      const eventDate = new Date(event.fromDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today && eventDate <= futureDate;
    });
  }, [allEvents, daysAhead]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (left, right) =>
        new Date(left.fromDate).getTime() - new Date(right.fromDate).getTime(),
    );
  }, [filteredEvents]);

  const leaveEvents = useMemo(
    () => sortedEvents.filter((e) => e.type === "leave"),
    [sortedEvents],
  );

  const holidayEvents = useMemo(
    () => sortedEvents.filter((e) => e.type === "holiday"),
    [sortedEvents],
  );

  const getDaysRemaining = (date: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusIcon = (status?: string) => {
    if (status === "APPROVED" || status === "approved") {
      return <CheckCircleIcon sx={{ fontSize: 14, color: "#22c55e" }} />;
    }
    if (status === "PENDING" || status === "pending") {
      return <PendingIcon sx={{ fontSize: 14, color: "#eab308" }} />;
    }
    return null;
  };

  const handleApplyDaysAhead = () => {
    if (localDaysAhead > 0 && localDaysAhead <= 365) {
      onDaysAheadChange(localDaysAhead);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleApplyDaysAhead();
    }
  };

  const renderEventList = (events: UpcomingEvent[], isLeave: boolean) => {
    if (events.length === 0) {
      return (
        <div className="py-6">
          <DataState
            compact
            type="empty"
            title={`No upcoming ${isLeave ? "leaves" : "holidays"} in next ${daysAhead} days`}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2 h-[calc(100vh-460px)] overflow-auto">
        {events.map((event) => {
          const daysRemaining =
            event.daysFromToday ?? getDaysRemaining(event.fromDate);
          const isPast = daysRemaining < 0;

          return (
            <div
              key={event.id}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg
                ${isLeave ? "hover:bg-blue-50/50" : "hover:bg-orange-50/50"}
                ${isPast ? "opacity-50" : ""}
                transition-colors duration-200
              `}
            >
              {/* Status dot */}
              <div
                className={`
                w-2 h-2 rounded-full flex-shrink-0
                ${isPast
                    ? "bg-gray-300"
                    : isLeave
                      ? "bg-blue-500"
                      : "bg-primary"
                  }
              `}
              />

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-medium text-gray-800">
                    {event.name}
                  </span>
                  <span className="text-[12px] text-gray-400">({event.employeeCode})</span>
                  {event.status && getStatusIcon(event.status)}
                  {!isLeave && event.holidayType && (
                    <Chip
                      size="small"
                      label={event.holidayType}
                      sx={{
                        height: 18,
                        fontSize: "9px",
                        bgcolor: alpha(theme.palette.info.main, 0.08),
                        color: theme.palette.info.main,
                        "& .MuiChip-label": { fontSize: "9px", px: 1 },
                      }}
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[12px] text-gray-500">
                  <span>
                    {formatDate(event.fromDate)}
                    {event.toDate && event.toDate !== event.fromDate && (
                      <> → {formatDate(event.toDate)}</>
                    )}
                  </span>
                  {event.totalDays}

                  {event.totalDays && (
                    <span className="text-gray-400">• {event.totalDays}dddddddd</span>
                  )}

                  {event.approver && (
                    <span className="text-gray-400">• {event.approver}</span>
                  )}
                </div>
              </div>

              {/* Days remaining */}
              {!isPast && (
                <div
                  className={`
                  text-[12px] font-medium px-2 py-0.5 rounded-full flex-shrink-0
                  ${daysRemaining <= 3
                      ? "bg-red-100 text-red-700"
                      : daysRemaining <= 7
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }
                `}
                >
                  {daysRemaining === 0 ? "Today" : `${daysRemaining}d`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Controls Card */}
      <Card className="border border-gray-200 bg-white mt-4">
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <EventNoteIcon
                sx={{ fontSize: 20, color: theme.palette.primary.main }}
              />
              <div>
                <span className="text-[12px] font-bold text-gray-700">
                  Upcoming Events
                </span>
                <span className="ml-2 text-[12px] text-gray-400">
                  ({leaveEvents.length + holidayEvents.length})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <TextField
                  size="small"
                  type="number"
                  value={localDaysAhead}
                  onChange={(e) =>
                    setLocalDaysAhead(parseInt(e.target.value) || 0)
                  }
                  onKeyPress={handleKeyPress}
                  placeholder="Days"
                  slotProps={{
                    input: {
                      inputProps: {
                        min: 1,
                        max: 365,
                        className: "w-14 text-[12px]",
                      },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5,
                      height: 28,
                      "& fieldset": {
                        borderColor: alpha(theme.palette.divider, 0.6),
                      },
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "13px",
                      padding: "4px 8px",
                    },
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleApplyDaysAhead}
                  className="!bg-primary"
                >
                  Apply
                </Button>
              </div>

              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={onRefresh}>
                    <RefreshIcon className="!w-4 text-gray-800" />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming Holidays Card - Using real API data */}
        <Card className="border border-gray-200 bg-white">
          <div className="px-5 py-3 border-b border-gray-200 bg-primary-50 dark:bg-head">
            <div className="flex items-center gap-2">
              <HolidayVillageIcon className="!w-4 text-primary" />
              <span className="text-[12px] font-semibold text-gray-700">
                Upcoming Holidays ({daysAhead} days)
              </span>
              <Chip
                size="small"
                label={holidayEvents.length}
                className="!text-white !bg-primary"
              />
            </div>
          </div>
          <div className="px-5 py-4">
            {loading && (
              <div className="py-6">
                <DataState type="loading" title="Loading holidays..." />
              </div>
            )}
            {!loading && error && (
              <div className="py-4">
                <DataState type="error" title={error} />
              </div>
            )}
            {!loading && !error && renderEventList(holidayEvents, false)}
          </div>
        </Card>

        {/* Upcoming Leaves Card - Using real API data or mock data */}
        <Card className="border border-gray-200 bg-white">
          <div className="px-5 py-3 border-b border-gray-200 bg-blue-50 dark:bg-head">
            <div className="flex items-center gap-2">
              <EventNoteIcon className="!text-blue-500 !w-4" />
              <span className="text-[12px] font-semibold text-gray-700">
                Upcoming Leaves
              </span>
              <Chip
                size="small"
                label={leaveEvents.length}
                className="!text-white !bg-blue-500"
              />
            </div>
          </div>
          <div className="px-5 py-4">
            {loading && (
              <div className="py-6">
                <DataState type="loading" title="Loading leaves..." />
              </div>
            )}
            {!loading && error && (
              <div className="py-4">
                <DataState type="error" title={error} />
              </div>
            )}
            {!loading && !error && renderEventList(leaveEvents, true)}
          </div>
        </Card>
      </div>

      {/* Footer */}
      {!loading &&
        !error &&
        (leaveEvents.length > 0 || holidayEvents.length > 0) && (
          <div className="px-5 py-2 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex justify-between items-center text-[12px] text-gray-800">
              <span>
                Total: {leaveEvents.length + holidayEvents.length} events
              </span>
              <span>{daysAhead} days ahead</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {leaveEvents.length} leaves
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {holidayEvents.length} holidays
                </span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

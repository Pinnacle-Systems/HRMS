import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  Select,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Paper,
  Grid,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import {
  Cake,
  WorkHistory,
  PersonAdd,
  PersonRemove,
  TrendingUp,
  People,
  BarChart,
  PieChart as PieChartIcon,
  Print,
  GetApp,
  Refresh,
  TrendingDown,
  EventNote,
  Warning,
  Close,
  FilterList,
  Clear,
  Search,
  Analytics,
  Timeline,
  FileDownload,
  DashboardOutlined,
  InsightsOutlined,
  PendingActionsOutlined,
  WarningAmberOutlined,
  AccountBalanceWalletOutlined,
  EventAvailableOutlined,
  CameraAltOutlined,
  KeyboardArrowDownOutlined,
  ArrowForward,
  AccessTime,
} from "@mui/icons-material";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  LeaveRequest,
  // LeaveType,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import { formatDate } from "../leaveFormatters";
import dayjs from "dayjs";
import { EmployeeSelector } from "../../../components/PolicyManagement/Common/EmployeeSelector";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { CHART_COLORS_LIGHT, type BalanceReportItem, type CompOffReportItem, type LeaveUsageItem, type LopReportItem, type PendingApprovalItem, type ReportFilter, type ReportType } from "./types";
import { useAuth } from "../../../auth/authContext";

// ==================== COMPONENTS ====================

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  onClick,
}: any) {
  return (
    <Card
      className="!border !border-gray-200 !bg-white-50 !rounded-2xl !shadow-sm hover:!shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
      onClick={onClick}
      sx={{
        "&:hover": {
          borderColor: color,
          boxShadow: `0 8px 25px ${color}20`,
        },
      }}
    >
      <CardContent className="!p-4">
        <Box className="flex items-start justify-between">
          <Box className="grid">
            <Typography
              variant="caption"
              className="!text-[10px] !text-gray-400 !uppercase !tracking-wider !font-semibold"
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              className="!text-2xl !font-bold !text-gray-900 !mt-1.5"
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                className="!text-[10px] !text-gray-400 !mt-0.5"
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            className="!p-2.5 !rounded-xl transition-all duration-300 flex-shrink-0"
            sx={{ backgroundColor: `${color}12` }}
          >
            <Icon sx={{ fontSize: "20px", color }} />
          </Box>
        </Box>
        {trend !== undefined && (
          <Box className="flex items-center gap-1 mt-1">
            {trend > 0 ? (
              <TrendingUp
                className="!text-emerald-500"
                sx={{ fontSize: "13px" }}
              />
            ) : trend < 0 ? (
              <TrendingDown
                className="!text-red-500"
                sx={{ fontSize: "13px" }}
              />
            ) : null}
            <Typography
              variant="caption"
              className={`!text-[10px] !font-medium ${trend > 0 ? "!text-emerald-500" : trend < 0 ? "!text-red-500" : "!text-gray-400"}`}
            >
              {trend !== 0
                ? `${Math.abs(trend)}% ${trend > 0 ? "↑" : "↓"}`
                : "No change"}
            </Typography>
            <Typography
              variant="caption"
              className="!text-[10px] !text-gray-400"
            >
              from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Filter Bar Component
function FilterBar({
  filters,
  onFilterChange,
  onApply,
  onClear,
  loading,
  reportType,
}: {
  filters: ReportFilter;
  onFilterChange: (key: keyof ReportFilter, value: any) => void;
  onApply: () => void;
  onClear: () => void;
  loading: boolean;
  reportType: ReportType;
}) {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const handleEmployeeChange = (employee: any) => {
    setSelectedEmployee(employee);
    onFilterChange("employeeId", employee?.id || "");
  };
  const { session } = useAuth();

  return (
    <Paper className="!rounded-xl !bg-white-50 !border !border-gray-200 !shadow-sm overflow-hidden transition-all duration-300">
      <Box className="flex justify-between p-2 pt-5">
        <div className="flex gap-2">
          <Box className="flex items-center gap-1">
            <FilterList sx={{ fontSize: "18px", color: "#6b7280" }} />
          </Box>
          {reportType !== "LEAVE_BALANCE" &&
            reportType !== "LEAVE_COMP_OFFS" && (
              <>
                {/* <TextField
                  label="From Date"
                  type="date"
                  size="small"
                  value={filters.from || ""}
                  onChange={(e) => onFilterChange("from", e.target.value)}
                  sx={{ width: "180px" }}
                /> */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="From Date"
                    value={filters.from ? dayjs(filters.from) : null}
                    onChange={(newValue) => {
                      onFilterChange(
                        "from",
                        newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      );
                    }}
                  />
                  <DatePicker
                    label="To Date"
                    value={filters.to ? dayjs(filters.to) : null}
                    minDate={dayjs(filters.from) ?? undefined}
                    onChange={(newValue) => {
                      onFilterChange(
                        "to",
                        newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      );
                    }}
                  />
                </LocalizationProvider>
                {/* <TextField
                  label="To Date"
                  type="date"
                  size="small"
                  value={filters.to || ""}
                  onChange={(e) => onFilterChange("to", e.target.value)}
                  sx={{ width: "180px" }}
                /> */}
                {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
                     
                    </LocalizationProvider> */}
              </>
            )}

          {(reportType === "LEAVE_USAGE" || reportType === "LEAVE_BALANCE") && (
            <div className="w-full">
              <EmployeeSelector
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                hrId={session?.user?.userId}
              />
            </div>
          )}

          {reportType === "LEAVE_BALANCE" && (
            <TextField
              label="Year"
              type="number"
              size="small"
              value={filters.year || dayjs().year()}
              onChange={(e) =>
                onFilterChange(
                  "year",
                  parseInt(e.target.value) || dayjs().year(),
                )
              }
              sx={{ width: "150px" }}
            />
          )}

          {reportType === "LEAVE_COMP_OFFS" && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={filters.status || ""}
                onChange={(e) => onFilterChange("status", e.target.value)}
                displayEmpty
                className="!text-[12px]"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="APPROVED">✅ Approved</MenuItem>
                <MenuItem value="PENDING">⏳ Pending</MenuItem>
                <MenuItem value="REJECTED">❌ Rejected</MenuItem>
              </Select>
            </FormControl>
          )}
        </div>
        <div>
          <Box className="flex gap-1">
            <Button
              size="medium"
              variant="contained"
              className="!text-[12px] !normal-case !bg-primary hover:!bg-primary-700 !rounded-xl !px-5 !shadow-none"
              onClick={onApply}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Search sx={{ fontSize: 16 }} />
                )
              }
            >
              Apply
            </Button>
            <Button
              size="medium"
              variant="text"
              className="!text-[12px] !normal-case !text-gray-500 !rounded-xl !px-4"
              onClick={onClear}
              disabled={loading}
              startIcon={<Clear sx={{ fontSize: 16 }} />}
            >
              Clear
            </Button>
          </Box>
        </div>
      </Box>
    </Paper>
  );
}

// function SnapshotTimeline({
//   title,
//   icon: Icon,
//   entries,
//   loading,
//   color,
//   iconColor,
//   showYears = false,
//   showDays = false,
//   onClick,
// }: {
//   title: string;
//   icon: any;
//   entries: any[];
//   loading: boolean;
//   color: string;
//   iconColor: string;
//   showYears?: boolean;
//   showDays?: boolean;
//   onClick?: () => void;
// }) {
//   const count = entries.length;

//   return (
//     <Card
//       className="!border !border-gray-200/80 !rounded-2xl !shadow-sm hover:!shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
//       onClick={onClick}
//       sx={{
//         "&:hover": {
//           borderColor: color,
//         },
//       }}
//     >
//       <Box
//         className="flex items-center justify-between px-3 py-2"
//         sx={{ backgroundColor: `${color}06` }}
//       >
//         <Box className="flex items-center gap-2">
//           <Avatar
//             className="!w-8 !h-8"
//             sx={{ bgcolor: `${color}15`, color: iconColor }}
//           >
//             <Icon sx={{ fontSize: "18px" }} />
//           </Avatar>
//           <Typography
//             variant="subtitle2"
//             className="!text-[13px] !font-semibold !text-gray-700"
//           >
//             {title}
//           </Typography>
//         </Box>
//         <Badge
//           badgeContent={loading ? "..." : count}
//           color="primary"
//           sx={{
//             "& .MuiBadge-badge": {
//               fontSize: "10px",
//               fontWeight: 600,
//               bgcolor: `${color}15`,
//               color: iconColor,
//               height: "22px",
//               minWidth: "22px",
//               borderRadius: "8px",
//             },
//           }}
//         />
//       </Box>

//       <Box className="p-2 overflow-auto max-h-[220px]">
//         {loading ? (
//           <Box className="flex items-center justify-between p-4">
//             <CircularProgress size={28} />
//           </Box>
//         ) : count > 0 ? (
//           <Box className="grid gap-1">
//             {entries.slice(0, 5).map((entry, index) => (
//               <Box
//                 key={entry.id || index}
//                 className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/80 rounded-xl transition-colors duration-150"
//               >
//                 <Box className="flex items-center justify-between gap-2 flex-1">
//                   <Box
//                     className="!w-6 !h-4 rounded-lg"
//                     sx={{ backgroundColor: color }}
//                   />
//                   <Typography
//                     variant="body2"
//                     className="!text-[12px] !font-medium !text-gray-800 truncate"
//                   >
//                     {entry.name || entry.employeeName}
//                   </Typography>
//                   {showYears && entry.anniversaryYears && (
//                     <Chip
//                       label={`${entry.anniversaryYears} yrs`}
//                       size="small"
//                       className="!h-5 !text-[8px] !bg-gray-100 !text-gray-600 !border-0 flex-shrink-0"
//                     />
//                   )}
//                   {showDays && entry.daysFromToday !== undefined && (
//                     <Chip
//                       label={`${Math.abs(entry.daysFromToday)}d`}
//                       size="small"
//                       className="!h-5 !text-[8px] !bg-gray-100 !text-gray-600 !border-0 flex-shrink-0"
//                     />
//                   )}
//                 </Box>
//                 <Typography
//                   variant="caption"
//                   className="!text-[10px] !text-gray-400 whitespace-nowrap ml-2"
//                 >
//                   {entry.occursOn
//                     ? formatDate(entry.occursOn)
//                     : formatDate(entry.joiningDate)}
//                 </Typography>
//               </Box>
//             ))}
//             {count > 5 && (
//               <Box className="pt-1 border-t text-center border-gray-200">
//                 <Button
//                   size="small"
//                   className="!text-[10px] !normal-case !text-gray-400 hover:!text-gray-600"
//                   endIcon={<ArrowForward sx={{ fontSize: 12 }} />}
//                 >
//                   View all {count} entries
//                 </Button>
//               </Box>
//             )}
//           </Box>
//         ) : (
//           <Box className="text-center p-4">
//             <Typography variant="body2" className="!text-[12px] !text-gray-400">
//               No records found
//             </Typography>
//           </Box>
//         )}
//       </Box>
//     </Card>
//   );
// }

// SnapshotCard with exact same design as SnapshotTimeline
function SnapshotCard({
  title,
  icon: Icon,
  entries,
  loading,
  color,
  iconColor,
  showYears = false,
  showDays = false,
  emptyMessage = "No records",
}: {
  title: string;
  icon: any;
  entries: any[];
  loading: boolean;
  color: string;
  iconColor: string;
  showYears?: boolean;
  showDays?: boolean;
  emptyMessage?: string;
}) {
  const count = entries.length;

  return (
    <div className="bg-white-50 border border-gray-200 rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div
        className="px-4 py-2.5 border-b border-gray-300 flex items-center justify-between"
        style={{ backgroundColor: `${color}08` }}
      >
        <div className="flex items-center gap-2">
          <Avatar
            className="!w-6 !h-6"
            sx={{ bgcolor: `${color}15`, color: iconColor }}
          >
            <Icon sx={{ fontSize: "14px" }} />
          </Avatar>
          <span className="text-[12px] font-semibold text-gray-700">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            label={loading ? "..." : count}
            size="small"
            className="!h-5 !text-[10px] !font-bold"
            sx={{
              bgcolor: `${color}15`,
              color: iconColor,
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="text-[12px] text-gray-400">Loading...</div>
          </div>
        ) : count > 0 ? (
          <List className="!py-1">
            {entries.slice(0, 6).map((entry, index) => (
              <ListItem
                key={entry.id || index}
                className="!px-4 !py-1.5 hover:bg-gray-50 transition-colors duration-150"
                sx={{
                  borderBottom:
                    index < Math.min(entries.length, 6) - 1
                      ? "1px solid #c7c7c755"
                      : "none",
                }}
              >
                <ListItemAvatar className="!min-w-0 !mr-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-gray-800 truncate">
                        {entry.name || entry.employeeName}
                      </span>
                      {showYears && entry.anniversaryYears && (
                        <Chip
                          label={`${entry.anniversaryYears} yrs`}
                          size="small"
                          className="!h-4 !text-[8px] !bg-gray-100 !text-gray-600 !border-0"
                        />
                      )}
                      {showDays && entry.daysFromToday !== undefined && (
                        <Chip
                          label={`${Math.abs(entry.daysFromToday)}d`}
                          size="small"
                          className="!h-4 !text-[8px] !bg-gray-100 !text-gray-600 !border-0"
                        />
                      )}
                    </div>
                  }
                  secondary={
                    <span className="text-[10px] text-gray-400">
                      {entry.occursOn
                        ? formatDate(entry.occursOn)
                        : entry.joiningDate
                          ? formatDate(entry.joiningDate)
                          : ""}
                    </span>
                  }
                />
                <div className="flex items-center gap-1">
                  <AccessTime sx={{ fontSize: "12px", color: "#9ca3af" }} />
                  <span className="text-[10px] text-gray-400">
                    {entry.daysFromToday !== undefined
                      ? `${Math.abs(entry.daysFromToday)} days ${entry.daysFromToday < 0 ? "ago" : "from now"}`
                      : ""}
                  </span>
                </div>
              </ListItem>
            ))}
            {count > 6 && (
              <div className="px-4 py-1.5 text-center border-t border-gray-100">
                <Button
                  size="small"
                  className="!text-[10px] !normal-case !text-gray-400 hover:!text-gray-600"
                  endIcon={<ArrowForward sx={{ fontSize: 12 }} />}
                >
                  View all {count} entries
                </Button>
              </div>
            )}
          </List>
        ) : (
          <div className="p-4 text-center text-[12px] text-gray-400">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function SnapshotTabContent({
  anniversaries,
  birthdays,
  joiners,
  resignations,
  loading,
}: {
  anniversaries: any[];
  birthdays: any[];
  joiners: any[];
  resignations: any[];
  loading: boolean;
}) {
  // Calculate summary stats
  const totalEvents =
    anniversaries.length +
    birthdays.length +
    joiners.length +
    resignations.length;
  const upcomingCount = anniversaries.filter(
    (e) => e.daysFromToday >= 0,
  ).length;
  const recentCount = joiners.length + resignations.length;

  // Get nearest event
  const allEvents = [
    ...anniversaries.map((e) => ({
      ...e,
      type: "anniversary",
      icon: "🎉",
      label: "Work Anniversary",
    })),
    ...birthdays.map((e) => ({
      ...e,
      type: "birthday",
      icon: "🎂",
      label: "Birthday",
    })),
    ...joiners.map((e) => ({
      ...e,
      type: "joiner",
      icon: "👋",
      label: "New Joiner",
    })),
    ...resignations.map((e) => ({
      ...e,
      type: "resignation",
      icon: "👋",
      label: "Resignation",
    })),
  ].sort((a, b) => (a.daysFromToday || 0) - (b.daysFromToday || 0));

  const nearestEvent = allEvents.length > 0 ? allEvents[0] : null;

  // Category configs
  const categories = [
    {
      id: "anniversary",
      title: "Work Anniversaries",
      icon: WorkHistory,
      data: anniversaries,
      color: "#3b82f6",
      iconColor: "#2563eb",
      emptyMessage: "No upcoming anniversaries",
      showYears: true,
      showDays: false,
    },
    {
      id: "birthday",
      title: "Birthdays",
      icon: Cake,
      data: birthdays,
      color: "#ec4899",
      iconColor: "#db2777",
      emptyMessage: "No upcoming birthdays",
      showYears: false,
      showDays: true,
    },
    {
      id: "joiner",
      title: "Recent Joiners",
      icon: PersonAdd,
      data: joiners,
      color: "#10b981",
      iconColor: "#059669",
      emptyMessage: "No recent joiners",
      showYears: false,
      showDays: true,
    },
    {
      id: "resignation",
      title: "Resignations",
      icon: PersonRemove,
      data: resignations,
      color: "#ef4444",
      iconColor: "#dc2626",
      emptyMessage: "No recent resignations",
      showYears: false,
      showDays: true,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Summary Stats - Clean Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Box
            sx={{
              borderRadius: "10px",
              height: "100%",
            }}
            className="bg-white-50 border border-gray-200 p-3"
          >
            <Typography className="text-gray-800">Total Events</Typography>
            <Typography
              sx={{ fontSize: "22px", fontWeight: 600, color: "#2d62d3" }}
            >
              {totalEvents}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Box
            sx={{
              borderRadius: "10px",
              height: "100%",
            }}
            className="bg-white-50 border border-gray-200 p-3"
          >
            <Typography className="text-gray-800">Upcoming</Typography>
            <Typography
              sx={{ fontSize: "22px", fontWeight: 600, color: "#10b981" }}
            >
              {upcomingCount}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Box
            sx={{
              borderRadius: "10px",
              height: "100%",
            }}
            className="bg-white-50 border border-gray-200 p-3"
          >
            <Typography className="text-gray-800">Recent Changes</Typography>
            <Typography
              sx={{ fontSize: "22px", fontWeight: 600, color: "#8b5cf6" }}
            >
              {recentCount}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Box
            sx={{
              borderRadius: "10px",
              height: "100%",
            }}
            className="bg-white-50 border border-gray-200 p-3"
          >
            <Typography className="text-gray-800">Next Event</Typography>
            <Typography className="text-gray-800" noWrap>
              {nearestEvent ? nearestEvent.name : "—"}
            </Typography>
            {nearestEvent && (
              <Typography sx={{ fontSize: "10px", color: "#9ca3af", mt: 0.5 }}>
                {Math.abs(nearestEvent.daysFromToday || 0)} days away
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Upcoming Events - Redesigned with better visual hierarchy */}
      {allEvents.length > 0 && (
        <Box
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            bgcolor: "white",
            overflow: "hidden",
          }}
          className="bg-white-50 border-b border-gray-200"
        >
          {/* Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            className="border-b border-gray-200"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography className="text-[12px] !font-bold text-gray-800">
                📅 Upcoming Events
              </Typography>
              <Chip
                label={`${allEvents.length} events`}
                size="small"
                sx={{
                  height: "22px",
                  fontSize: "10px",
                  bgcolor: "#e5e7eb",
                  color: "#374151",
                  fontWeight: 500,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
              Next 30 days
            </Typography>
          </Box>

          {/* Timeline with grid layout */}
          <Box
            sx={{
              p: 2.5,
              maxHeight: "320px",
              overflow: "auto",
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#d1d5db",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "#9ca3af",
              },
            }}
          >
            <Grid container spacing={1.5}>
              {allEvents.slice(0, 12).map((event) => {
                const colors = {
                  anniversary: "#3b82f6",
                  birthday: "#ec4899",
                  joiner: "#10b981",
                  resignation: "#ef4444",
                };
                const bgColors = {
                  anniversary: "#eff6ff",
                  birthday: "#fdf2f8",
                  joiner: "#ecfdf5",
                  resignation: "#fef2f2",
                };
                const color =
                  colors[event.type as keyof typeof colors] || "#6b7280";
                const bgColor =
                  bgColors[event.type as keyof typeof bgColors] || "#f3f4f6";

                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={event.id}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1.5,
                        borderRadius: "8px",
                        bgcolor: bgColor,
                        border: `1px solid ${color}15`,
                        transition: "all 0.15s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: `0 2px 8px ${color}20`,
                          borderColor: color,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          bgcolor: `${color}20`,
                          fontSize: "16px",
                        }}
                      >
                        {event.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                          noWrap
                        >
                          {event.name}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "9px", color: "#6b7280" }}
                          >
                            {event.employeeId || event.employeeCode}
                          </Typography>
                          <Typography
                            sx={{ fontSize: "9px", color: "#d1d5db" }}
                          >
                            •
                          </Typography>
                          <Typography
                            sx={{ fontSize: "9px", color: "#6b7280" }}
                          >
                            {event.label}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                        <Typography
                          sx={{ fontSize: "11px", fontWeight: 600, color }}
                        >
                          {dayjs(event.occursOn).format("DD MMM")}
                        </Typography>
                        <Typography sx={{ fontSize: "8px", color: "#9ca3af" }}>
                          {event.daysFromToday >= 0
                            ? `${event.daysFromToday}d away`
                            : `${Math.abs(event.daysFromToday)}d ago`}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
              {/* {allEvents.length > 12 && (
                <Grid size={12}>
                  <Box sx={{ textAlign: "center", pt: 1 }}>
                    <Button
                      size="small"
                      sx={{
                        fontSize: "11px",
                        textTransform: "none",
                        color: "#6b7280",
                        "&:hover": { color: "#374151" },
                      }}
                    >
                      View all {allEvents.length} events
                    </Button>
                  </Box>
                </Grid>
              )} */}
            </Grid>
          </Box>
        </Box>
      )}

      {/* Category Cards - Using updated SnapshotCard with exact same design as SnapshotTimeline */}
      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid size={{ xs: 12, md: 6, lg: 3 }} key={category.id}>
            <SnapshotCard
              title={category.title}
              icon={category.icon}
              entries={category.data}
              loading={loading}
              color={category.color}
              iconColor={category.iconColor}
              showYears={category.showYears}
              showDays={category.showDays}
              emptyMessage={category.emptyMessage}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function ExpandableEmployeeRow({ employee }: { employee: any }) {
  const [expanded, setExpanded] = useState(false);

  // Get status for the employee summary
  const hasPending = employee.records.some((r: any) => r.status === "PENDING");
  const hasApproved = employee.records.some(
    (r: any) => r.status === "APPROVED",
  );
  const hasRejected = employee.records.some(
    (r: any) => r.status === "REJECTED",
  );

  let employeeStatus = "ACTIVE";
  let statusColor = "#10b981";
  let statusBg = "#ecfdf5";

  if (hasPending) {
    employeeStatus = "PENDING";
    statusColor = "#f59e0b";
    statusBg = "#fffbeb";
  } else if (hasApproved && !hasPending) {
    employeeStatus = "APPROVED";
    statusColor = "#10b981";
    statusBg = "#ecfdf5";
  } else if (hasRejected && !hasApproved && !hasPending) {
    employeeStatus = "REJECTED";
    statusColor = "#ef4444";
    statusBg = "#fef2f2";
  }

  return (
    <Box
      className="border border-gray-200"
      sx={{
        borderRadius: "10px",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      {/* Employee Summary Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",
          transition: "background 0.15s ease",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left - Employee Info */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#f3e8ff",
              color: "#7c3aed",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {employee.employeeName?.charAt(0) || "?"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography className="text-gray-800">
              {employee.employeeName}
            </Typography>
            <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
              {employee.employeeCode} • {employee.records.length} record
              {employee.records.length > 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* Center - Credit Summary */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          {employee.approvedCredits > 0 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 600, color: "#10b981" }}
              >
                {employee.approvedCredits.toFixed(1)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "8px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                }}
              >
                Approved
              </Typography>
            </Box>
          )}
          {employee.pendingCredits > 0 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 600, color: "#f59e0b" }}
              >
                {employee.pendingCredits.toFixed(1)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "8px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                }}
              >
                Pending
              </Typography>
            </Box>
          )}
          {employee.rejectedCredits > 0 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 600, color: "#ef4444" }}
              >
                {employee.rejectedCredits.toFixed(1)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "8px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                }}
              >
                Rejected
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right - Status & Expand */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          <Chip
            label={employeeStatus}
            size="small"
            sx={{
              height: "24px",
              fontSize: "10px",
              fontWeight: 500,
              bgcolor: statusBg,
              color: statusColor,
              borderRadius: "6px",
              marginLeft: "20px",
            }}
          />
          <Typography
            sx={{
              fontSize: "18px",
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <KeyboardArrowDownOutlined className="text-gray-800" />
          </Typography>
        </Box>
      </Box>

      {/* Expanded Details */}
      {expanded && (
        <Box
          className="bg-white-50 border border-gray-200"
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#6b7280",
              mb: 1.5,
            }}
          >
            All Records
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {employee.records.map((record: any, idx: number) => {
              const statusColors = {
                APPROVED: {
                  bg: "#ecfdf5",
                  color: "#065f46",
                  label: "Approved",
                },
                PENDING: { bg: "#fffbeb", color: "#92400e", label: "Pending" },
                REJECTED: {
                  bg: "#fef2f2",
                  color: "#991b1b",
                  label: "Rejected",
                },
              };
              const statusStyle =
                statusColors[record.status as keyof typeof statusColors] ||
                statusColors.PENDING;

              return (
                <Box
                  key={record.requestNumber || idx}
                  className="bg-head border border-gray-200"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: "8px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flex: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        minWidth: "80px",
                      }}
                    >
                      #{record.requestNumber?.slice(-6) || "N/A"}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#374151" }}>
                      {record.workedDate
                        ? dayjs(record.workedDate).format("DD MMM YYYY")
                        : "N/A"}
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>
                      {record.sessionType?.replace("_", " ").toLowerCase() ||
                        "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#7c3aed",
                      }}
                    >
                      {record.creditDays || 0} days
                    </Typography>
                    <Chip
                      label={statusStyle.label}
                      size="small"
                      sx={{
                        height: "20px",
                        fontSize: "9px",
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: "4px",
                      }}
                    />
                    {record.expiryDate && (
                      <Typography sx={{ fontSize: "9px", color: "#9ca3af" }}>
                        Exp: {dayjs(record.expiryDate).format("DD MMM")}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function ExpandablePendingRow({ employee }: { employee: any }) {
  const [expanded, setExpanded] = useState(false);

  // Determine employee status
  const hasPending = employee.records.some((r: any) => r.status === "PENDING");
  const hasClarification = employee.records.some(
    (r: any) => r.status === "CLARIFICATION_REQUESTED",
  );

  let employeeStatus = "PENDING";
  let statusColor = "#f59e0b";
  let statusBg = "#fffbeb";

  if (hasClarification && !hasPending) {
    employeeStatus = "CLARIFICATION";
    statusColor = "#ef4444";
    statusBg = "#fef2f2";
  } else if (hasPending) {
    employeeStatus = "PENDING";
    statusColor = "#f59e0b";
    statusBg = "#fffbeb";
  }

  return (
    <Box>
      {/* Employee Summary Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",

          transition: "background 0.15s ease",
        }}
        className="bg-white-50 border border-gray-200 rounded-lg"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left - Employee Info */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "#fef3c7",
              color: "#92400e",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {employee.employeeName?.charAt(0) || "?"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <div className="text-[12px] text-gray-800">
              {employee.employeeName}
            </div>
            <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
              {employee.employeeCode} • {employee.totalRequests} request
              {employee.totalRequests > 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* Center - Request Summary */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          {employee.pendingRequests > 0 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 600, color: "#f59e0b" }}
              >
                {employee.pendingRequests}
              </Typography>
              <Typography
                sx={{
                  fontSize: "8px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                }}
              >
                Pending
              </Typography>
            </Box>
          )}
          {employee.clarificationRequests > 0 && (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{ fontSize: "14px", fontWeight: 600, color: "#ef4444" }}
              >
                {employee.clarificationRequests}
              </Typography>
              <Typography
                sx={{
                  fontSize: "8px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                }}
              >
                Clarification
              </Typography>
            </Box>
          )}
          <Box sx={{ textAlign: "center", ml: 1 }}>
            <Typography
              sx={{ fontSize: "14px", fontWeight: 600, color: "#7c3aed" }}
            >
              {employee.totalDays.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                fontSize: "8px",
                color: "#9ca3af",
                textTransform: "uppercase",
              }}
            >
              Days
            </Typography>
          </Box>
        </Box>

        {/* Right - Status & Expand */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          <Chip
            label={employeeStatus}
            size="small"
            sx={{
              height: "24px",
              fontSize: "10px",
              fontWeight: 500,
              bgcolor: statusBg,
              color: statusColor,
              borderRadius: "6px",
              marginLeft: "20px",
            }}
          />
          <Typography
            sx={{
              fontSize: "18px",
              color: "#9ca3af",
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <KeyboardArrowDownOutlined className="text-gray-800" />
          </Typography>
        </Box>
      </Box>

      {/* Expanded Details */}
      {expanded && (
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: "#fafbfc",
            borderTop: "1px solid #f3f4f6",
          }}
          className="bg-white-50 border border-gray-200"
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#6b7280",
              mb: 1.5,
            }}
          >
            All Requests
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {employee.records.map((record: any, idx: number) => {
              const statusColors = {
                PENDING: { bg: "#fffbeb", color: "#92400e", label: "Pending" },
                CLARIFICATION_REQUESTED: {
                  bg: "#fef2f2",
                  color: "#991b1b",
                  label: "Clarification",
                },
              };
              const statusStyle =
                statusColors[record.status as keyof typeof statusColors] ||
                statusColors.PENDING;

              return (
                <Box
                  key={record.requestNumber || idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: "8px",
                  }}
                  className="bg-head border border-gray-200"
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flex: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        minWidth: "80px",
                      }}
                    >
                      #{record.requestNumber?.slice(-6) || "N/A"}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#374151" }}>
                      {record.leaveTypeName} ({record.leaveTypeCode})
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#6b7280" }}>
                      {record.fromDate
                        ? dayjs(record.fromDate).format("DD MMM")
                        : ""}
                      {record.toDate && record.fromDate !== record.toDate
                        ? ` - ${dayjs(record.toDate).format("DD MMM")}`
                        : ""}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#7c3aed",
                      }}
                    >
                      {record.totalDays || 0} days
                    </Typography>
                    <Chip
                      label={statusStyle.label}
                      size="small"
                      sx={{
                        height: "20px",
                        fontSize: "9px",
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: "4px",
                      }}
                    />
                    {record.approverName && (
                      <Typography sx={{ fontSize: "9px", color: "#9ca3af" }}>
                        Approver: {record.approverName}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function UtilizationCard({
  data,
  color,
}: {
  data: LeaveUsageItem;
  color: string;
}) {
  return (
    <Card className="!border !bg-white-50 !border-gray-200 !rounded-2xl !shadow-sm hover:!shadow-lg transition-all duration-300">
      <CardContent className="!p-4">
        <Box className="flex items-center gap-3">
          <Box
            className="flex items-center justify-center rounded-[12px] w-[44px] h-[44px] gap-3"
            sx={{ backgroundColor: `${color}12` }}
          >
            <Typography
              variant="h6"
              className="!text-[16px] !font-bold"
              sx={{ color }}
            >
              {data.leaveTypeCode}
            </Typography>
          </Box>
          <Box className="flex-1">
            <Typography
              variant="subtitle2"
              className="!text-[13px] !font-semibold !text-gray-900 truncate"
            >
              {data.leaveTypeName}
            </Typography>
            <Typography
              variant="caption"
              className="!text-[10px] !text-gray-400"
            >
              {data.requestCount} request{data.requestCount !== 1 ? "s" : ""} •{" "}
              {data.employeeName}
            </Typography>
          </Box>
          <Box className="text-right">
            <Typography
              variant="h6"
              className="!text-xl !font-bold"
              sx={{ color }}
            >
              {data.totalDays}
            </Typography>
            <Typography
              variant="caption"
              className="!text-[9px] !text-gray-400"
            >
              days
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min((data.totalDays / 30) * 100, 100)}
          sx={{
            mt: 2.5,
            height: 4,
            borderRadius: 3,
            bgcolor: "#f3f4f6",
            "& .MuiLinearProgress-bar": {
              bgcolor: color,
              borderRadius: 3,
            },
          }}
        />
      </CardContent>
    </Card>
  );
}

// function PendingRequestCard({ data }: { data: PendingApprovalItem }) {
//   const isPending = data.status === "PENDING";
//   return (
//     <Box className="flex items-center justify-between p-3 bg-white rounded-sm border borde-gray-200 hover:shadow-lg transition-all duration-300">
//       <Box className="flex items-center gap-3 flex-1">
//         <Box
//           className="w-[8px] h-[8px] rounded-lg"
//           sx={{ bgcolor: isPending ? "#f59e0b" : "#ef4444" }}
//         />
//         <Box>
//           <Typography
//             variant="subtitle2"
//             className="!text-[12px] !font-medium !text-gray-900 truncate"
//           >
//             {data.employeeName}
//           </Typography>
//           <Typography
//             variant="caption"
//             className="!text-[10px] !text-gray-400 truncate"
//           >
//             {data.leaveTypeName} • {formatDate(data.fromDate)} -{" "}
//             {formatDate(data.toDate)}
//           </Typography>
//         </Box>
//       </Box>
//       <Box className="flex items-center gap-2">
//         <Chip
//           label={`${data.totalDays}d`}
//           size="small"
//           className="!h-6 !text-[9px] !bg-gray-100 !text-gray-600 !rounded-lg"
//         />
//         <Chip
//           label={isPending ? "⏳ Pending" : "💬 Clarification"}
//           size="small"
//           className={`!h-6 !text-[9px] !rounded-lg ${isPending ? "!bg-amber-50 !text-amber-700" : "!bg-red-50 !text-red-700"}`}
//         />
//       </Box>
//     </Box>
//   );
// }

// function EmployeeBalanceCard({ data }: { data: BalanceReportItem }) {
//   return (
//     <Card className="!border !bg-white-50 mb-5 !border-gray-200 !rounded-2xl !shadow-sm hover:!shadow-lg transition-all duration-300">
//       <CardContent className="!p-4">
//         <Box className="flex items-center gap-3">
//           <Avatar className="!w-10 !h-10 !bg-gray-100">
//             <Typography
//               variant="body1"
//               className="!text-[14px] !font-semibold !text-gray-600"
//             >
//               {data.employeeName.charAt(0)}
//             </Typography>
//           </Avatar>
//           <Box className="flex-1">
//             <Typography
//               variant="subtitle2"
//               className="!text-[13px] !font-medium !text-gray-900 truncate"
//             >
//               {data.employeeName}
//             </Typography>
//             <Typography
//               variant="caption"
//               className="!text-[10px] !text-gray-400"
//             >
//               {data.employeeCode}
//             </Typography>
//           </Box>
//           <Box className="text-right">
//             <Typography
//               variant="h6"
//               className={`!text-base !font-bold ${data.closingBalance < 0 ? "!text-red-500" : "!text-emerald-600"}`}
//             >
//               {data.closingBalance.toFixed(1)}
//             </Typography>
//             <Typography
//               variant="caption"
//               className="!text-[9px] !text-gray-400"
//             >
//               balance
//             </Typography>
//           </Box>
//         </Box>
//         <Box className="flex items-center gap-2 mt-2">
//           <Typography variant="caption" className="!text-[10px] !text-gray-400">
//             Opening: {data.openingBalance.toFixed(1)}
//           </Typography>
//           <Typography
//             variant="caption"
//             className="!text-[10px] !text-emerald-500"
//           >
//             +{data.accruedDays.toFixed(1)}
//           </Typography>
//           <Typography variant="caption" className="!text-[10px] !text-red-400">
//             -{data.consumedDays.toFixed(1)}
//           </Typography>
//         </Box>
//         <Box className="mt-1">
//           <Chip
//             label={data.leaveTypeCode}
//             size="small"
//             className="!h-5 !text-[8px] !bg-gray-100 !text-gray-500 !rounded"
//           />
//         </Box>
//       </CardContent>
//     </Card>
//   );
// }

function LopCard({ data }: { data: LopReportItem }) {
  return (
    <Box className="hover:shadow-lg transition-all duration-300 flex items-center justify-between p-3 bg-red-100/50 roundeed-[16px] border border-red-200">
      <Box className="flex items-center gap-3 flex-1">
        <Box className="flex items-center justify-center gap-3 rounded-lg w-[36px] h-[36px]">
          <Typography variant="body1" className="!text-red-500">
            ⚠
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="subtitle2"
            className="!text-[13px] !font-medium !text-gray-900"
          >
            {data.employeeName}
          </Typography>
          <Typography
            variant="caption"
            className="!text-[10px] !text-gray-400 truncate"
          >
            {data.leaveTypeName} • {formatDate(data.fromDate)} -{" "}
            {formatDate(data.toDate)}
          </Typography>
        </Box>
      </Box>
      <Box className="flex items-center gap-2">
        <Chip
          label={`${data.lopDays} days`}
          size="small"
          className="!bg-red-100 !text-red-700 !text-[10px] !rounded-lg"
        />
        <Chip
          label={data.status}
          size="small"
          className="!bg-gray-100 !text-gray-600 !text-[9px] !rounded-lg"
        />
      </Box>
    </Box>
  );
}

function DrillDownModal({
  open,
  onClose,
  data,
  title,
  type,
}: {
  open: boolean;
  onClose: () => void;
  data: any[];
  title: string;
  type: "usage" | "balance" | "pending" | "lop";
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle className="!text-[18px] !font-bold !pb-2 flex items-center justify-between border-b border-gray-100/60">
        <Box className="flex items-center gap-2">
          <Analytics className="text-primary" />
          <Typography variant="h6" className="!text-[18px] !font-bold">
            {title}
          </Typography>
          <Chip
            label={`${data.length} records`}
            size="small"
            className="!h-5 !text-[9px] !bg-gray-100 !text-gray-500"
          />
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent className="!p-4">
        <Box className="max-h-[550px] overflow-auto">
          {data.length === 0 ? (
            <Box className="text-center py-3">
              <Typography
                variant="body2"
                className="!text-[13px] !text-gray-400"
              >
                No data available
              </Typography>
            </Box>
          ) : (
            <Box className="flex flex-d-c gap-2">
              {data.slice(0, 50).map((item, index) => (
                <Box
                  key={index}
                  className="hover:bg-gray-100/60 transition-colors bg-white rounded-sm borde border-gray-200 p-3"
                >
                  <Box className="flex items-center justify-between">
                    <Box className="flex items-center gap-3">
                      <Typography
                        variant="caption"
                        className="!text-[11px] !font-medium !text-gray-400"
                      >
                        #{index + 1}
                      </Typography>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          className="!text-[13px] !font-medium !text-gray-900"
                        >
                          {item.employeeName || item.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="!text-[10px] !text-gray-400"
                        >
                          {item.employeeCode || item.leaveTypeName}
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="flex items-center gap-3">
                      {type === "usage" && (
                        <Typography
                          variant="body2"
                          className="!text-sm !font-bold !text-blue-600"
                        >
                          {item.totalDays}d
                        </Typography>
                      )}
                      {type === "balance" && (
                        <Typography
                          variant="body2"
                          className={`!text-sm !font-bold ${item.closingBalance < 0 ? "!text-red-500" : "!text-emerald-600"}`}
                        >
                          {item.closingBalance?.toFixed(1)}
                        </Typography>
                      )}
                      {type === "pending" && (
                        <Chip
                          label={item.status}
                          size="small"
                          className={`!h-5 !text-[9px] ${item.status === "PENDING" ? "!bg-amber-50 !text-amber-700" : "!bg-red-50 !text-red-700"}`}
                        />
                      )}
                      {type === "lop" && (
                        <Chip
                          label={`${item.lopDays}d LOP`}
                          size="small"
                          className="!h-5 !text-[9px] !bg-red-100 !text-red-700"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions className="!p-4 !border-t !border-gray-100/60">
        <Button
          variant="outlined"
          className="!text-gray-600 !border-gray-300 !rounded-xl"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          variant="contained"
          className="!bg-primary !rounded-xl !shadow-none"
          startIcon={<FileDownload />}
        >
          Export Data
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ExpandableBalanceRow({ employee }: { employee: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        overflow: "hidden",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#d1d5db",
        },
      }}
    >
      {/* Employee Summary Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",
          transition: "background 0.15s ease",
        }}
        className="p-3 bg-white-50 border border-gray-200"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left - Employee Info */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: employee.totalBalance >= 0 ? "#ecfdf5" : "#fef2f2",
              color: employee.totalBalance >= 0 ? "#065f46" : "#991b1b",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {employee.employeeName?.charAt(0) || "?"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <div className="text-[12px] text-gray-800">
              {employee.employeeName}
            </div>
            <Typography sx={{ fontSize: "11px", color: "#9ca3af" }}>
              {employee.employeeCode} • {employee.leaveTypes.length} leave type
              {employee.leaveTypes.length > 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>

        {/* Center - Balance Summary */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{ fontSize: "14px", fontWeight: 600, color: "#10b981" }}
            >
              {employee.totalOpening.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                fontSize: "8px",
                color: "#9ca3af",
                textTransform: "uppercase",
              }}
            >
              Opening
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{ fontSize: "14px", fontWeight: 600, color: "#3b82f6" }}
            >
              +{employee.totalAccrued.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                fontSize: "8px",
                color: "#9ca3af",
                textTransform: "uppercase",
              }}
            >
              Accrued
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{ fontSize: "14px", fontWeight: 600, color: "#ef4444" }}
            >
              -{employee.totalConsumed.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                fontSize: "8px",
                color: "#9ca3af",
                textTransform: "uppercase",
              }}
            >
              Consumed
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", ml: 1 }}>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 700,
                color: employee.totalBalance >= 0 ? "#10b981" : "#ef4444",
              }}
            >
              {employee.totalBalance.toFixed(1)}
            </Typography>
            <Typography
              sx={{
                fontSize: "8px",
                color: "#9ca3af",
                textTransform: "uppercase",
              }}
            >
              Balance
            </Typography>
          </Box>
        </Box>

        {/* Right - Expand */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
            marginLeft: "20px",
          }}
        >
          <Typography
            sx={{
              transition: "transform 0.2s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <KeyboardArrowDownOutlined className="!w-4 text-gray-800" />
          </Typography>
        </Box>
      </Box>

      {/* Expanded Details - Leave Types Breakdown */}
      {expanded && (
        <Box
          sx={{
            px: 3,
            py: 2.5,
            // bgcolor: "#fafbfc",
            // borderTop: "1px solid #f3f4f6",
          }}
          className="p-3 bg-white-50 border border-gray-200"
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#6b7280",
              mb: 1.5,
            }}
          >
            Leave Type Breakdown
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {employee.leaveTypes.map((type: any, idx: number) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  // p: 1.5,
                  // borderRadius: "8px",
                  // bgcolor: "white",
                  // border: "1px solid #f3f4f6",
                }}
                className="p-3 bg-head border border-gray-200 rounded-lg"
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flex: 1,
                  }}
                >
                  <Chip
                    label={type.typeCode}
                    size="small"
                    sx={{
                      height: "20px",
                      fontSize: "9px",
                      bgcolor: "#f3e8ff",
                      color: "#7c3aed",
                      fontWeight: 600,
                      borderRadius: "4px",
                    }}
                  />
                  <div className="text-gray-800 text-[12px]">
                    {type.typeName}
                  </div>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ fontSize: "10px", color: "#9ca3af" }}>
                    Opening: {type.opening.toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontSize: "10px", color: "#3b82f6" }}>
                    +{type.accrued.toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontSize: "10px", color: "#ef4444" }}>
                    -{type.consumed.toFixed(1)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: type.balance >= 0 ? "#10b981" : "#ef4444",
                      ml: 1,
                    }}
                  >
                    = {type.balance.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ==================== MAIN COMPONENT ====================
export default function HrLeaveReportsPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewType, setViewType] = useState<"bar" | "area" | "line">("bar");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>("LEAVE_USAGE");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");

  // DrillDown
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [drillDownTitle, setDrillDownTitle] = useState("");
  const [drillDownType, setDrillDownType] = useState<
    "usage" | "balance" | "pending" | "lop"
  >("usage");

  // Filters
  const [filters, setFilters] = useState<ReportFilter>({
    from: dayjs().subtract(30, "days").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
    year: dayjs().year(),
    employeeId: "",
    status: "",
    leaveType: "",
  });

  // Data states
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [resignations, setResignations] = useState<any[]>([]);
  const [joiners, setJoiners] = useState<any[]>([]);
  // const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveUsageData, setLeaveUsageData] = useState<LeaveUsageItem[]>([]);
  const [pendingApprovalsData, setPendingApprovalsData] = useState<
    PendingApprovalItem[]
  >([]);
  const [lopData, setLopData] = useState<LopReportItem[]>([]);
  const [balanceData, setBalanceData] = useState<BalanceReportItem[]>([]);
  const [compOffData, setCompOffData] = useState<CompOffReportItem[]>([]);

  const groupedCompOffData = useMemo(() => {
    const grouped = new Map();

    compOffData.forEach((item: any) => {
      const key = item.employeeId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          employeeCode: item.employeeCode,
          totalCredits: 0,
          approvedCredits: 0,
          pendingCredits: 0,
          rejectedCredits: 0,
          records: [],
        });
      }

      const employee = grouped.get(key);
      employee.records.push(item);

      // Calculate credits by status
      if (item.status === "APPROVED") {
        employee.approvedCredits += item.creditDays || 0;
        employee.totalCredits += item.creditDays || 0;
      } else if (item.status === "PENDING") {
        employee.pendingCredits += item.creditDays || 0;
      } else if (item.status === "REJECTED") {
        employee.rejectedCredits += item.creditDays || 0;
      }
    });

    return Array.from(grouped.values());
  }, [compOffData]);

  // Filter grouped data based on status filter
  const filteredGroupedData = useMemo(() => {
    if (!filters.status) return groupedCompOffData;

    return groupedCompOffData.filter((employee: any) =>
      employee.records.some((record: any) => record.status === filters.status),
    );
  }, [groupedCompOffData, filters.status]);

  // Calculate stats from grouped data
  const totalEmployees = groupedCompOffData.length;
  const totalApproved = groupedCompOffData.reduce(
    (sum: number, emp: any) => sum + emp.approvedCredits,
    0,
  );
  const totalPending = groupedCompOffData.reduce(
    (sum: number, emp: any) => sum + emp.pendingCredits,
    0,
  );
  // const totalRejected = groupedCompOffData.reduce(
  //   (sum: number, emp: any) => sum + emp.rejectedCredits,
  //   0,
  // );

  // Group pending approvals by employee
  const groupedPendingData = useMemo(() => {
    const grouped = new Map();

    pendingApprovalsData.forEach((item: any) => {
      const key = item.employeeId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          employeeCode: item.employeeCode,
          totalRequests: 0,
          pendingRequests: 0,
          clarificationRequests: 0,
          totalDays: 0,
          records: [],
          status: "PENDING", // Default status
        });
      }

      const employee = grouped.get(key);
      employee.records.push(item);
      employee.totalRequests += 1;
      employee.totalDays += item.totalDays || 0;

      // Count by status
      if (item.status === "PENDING") {
        employee.pendingRequests += 1;
      } else if (item.status === "CLARIFICATION_REQUESTED") {
        employee.clarificationRequests += 1;
      }
    });

    return Array.from(grouped.values());
  }, [pendingApprovalsData]);

  // Filter grouped data based on status filter
  const filteredPendingData = useMemo(() => {
    if (!filters.status) return groupedPendingData;

    return groupedPendingData.filter((employee: any) =>
      employee.records.some((record: any) => record.status === filters.status),
    );
  }, [groupedPendingData, filters.status]);

  // Calculate pending stats
  const totalPendingRequests = pendingApprovalsData.length;
  const totalPendingEmployees = groupedPendingData.length;
  const totalPendingDays = pendingApprovalsData.reduce(
    (sum: number, item: any) => sum + (item.totalDays || 0),
    0,
  );

  // Group balance data by employee
  const groupedBalanceData = useMemo(() => {
    const grouped = new Map();

    balanceData.forEach((item: any) => {
      const key = item.employeeId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          employeeId: item.employeeId,
          employeeName: item.employeeName,
          employeeCode: item.employeeCode,
          totalBalance: 0,
          totalOpening: 0,
          totalAccrued: 0,
          totalConsumed: 0,
          leaveTypes: [],
          records: [],
        });
      }

      const employee = grouped.get(key);
      employee.records.push(item);
      employee.totalBalance += item.closingBalance || 0;
      employee.totalOpening += item.openingBalance || 0;
      employee.totalAccrued += item.accruedDays || 0;
      employee.totalConsumed += item.consumedDays || 0;

      // Add leave type summary
      employee.leaveTypes.push({
        typeName: item.leaveTypeName,
        typeCode: item.leaveTypeCode,
        balance: item.closingBalance || 0,
        opening: item.openingBalance || 0,
        accrued: item.accruedDays || 0,
        consumed: item.consumedDays || 0,
        leaveTypeId: item.leaveTypeId,
      });
    });

    return Array.from(grouped.values());
  }, [balanceData]);

  // Get unique leave types for filter
  const leaveTypeFilterOptions = useMemo(() => {
    const types = new Set();
    balanceData.forEach((item: any) => {
      types.add(item.leaveTypeName);
    });
    return Array.from(types);
  }, [balanceData]);

  // Filter balance data by leave type
  const filteredBalanceData = useMemo(() => {
    if (!filters.leaveType) return groupedBalanceData;

    return groupedBalanceData.filter((employee: any) =>
      employee.records.some(
        (record: any) => record.leaveTypeName === filters.leaveType,
      ),
    );
  }, [groupedBalanceData, filters.leaveType]);

  // Calculate stats
  // const totalBalanceValue = balanceData.reduce(
  //   (sum: number, item: any) => sum + (item.closingBalance || 0),
  //   0,
  // );
  // const totalPositive = balanceData.filter(
  //   (item: any) => (item.closingBalance || 0) > 0,
  // ).length;
  // const totalNegative = balanceData.filter(
  //   (item: any) => (item.closingBalance || 0) < 0,
  // ).length;
  // const uniqueEmployeesCount = groupedBalanceData.length;

  // Chart data - Top employees by total balance
  // const balanceChartData = groupedBalanceData
  //   .sort((a, b) => b.totalBalance - a.totalBalance)
  //   .slice(0, 10)
  //   .map((item) => ({
  //     name:
  //       item.employeeName.length > 12
  //         ? item.employeeName.substring(0, 12) + "..."
  //         : item.employeeName,
  //     balance: item.totalBalance,
  //     fullName: item.employeeName,
  //     employeeCode: item.employeeCode,
  //   }));

  // Compute monthly trend data from live leave requests
  const monthlyTrendData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const trendMap = new Map();

    months.forEach((month) => {
      trendMap.set(month, { month, requests: 0, days: 0 });
    });

    leaveRequests.forEach((request) => {
      if (request.fromDate) {
        const month = dayjs(request.fromDate).format("MMM");
        const days = request.totalDays || 0;
        if (trendMap.has(month)) {
          const data = trendMap.get(month);
          data.requests += 1;
          data.days += days;
        }
      }
    });

    return Array.from(trendMap.values());
  }, [leaveRequests]);

  // Compute leave type distribution from live data
  const leaveTypeDistribution = useMemo(() => {
    const typeMap = new Map();

    leaveRequests.forEach((request) => {
      const typeId = request.leaveTypeId;
      const typeName = request.leaveTypeName || `Type ${typeId}`;
      const typeCode =
        request.leaveTypeCode || typeId.substring(0, 3).toUpperCase();

      if (typeMap.has(typeId)) {
        const data = typeMap.get(typeId);
        data.count += 1;
        data.days += request.totalDays || 0;
      } else {
        typeMap.set(typeId, {
          name: typeName,
          code: typeCode,
          count: 1,
          days: request.totalDays || 0,
        });
      }
    });

    return Array.from(typeMap.values());
  }, [leaveRequests]);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    showSpinner();
    try {
      const [
        anniversaryResponse,
        birthdayResponse,
        resignationResponse,
        joinerResponse,
        // leaveTypeResponse,
        leaveRequestResponse,
      ]: any = await Promise.all([
        leaveService.getUpcomingWorkAnniversaries({ daysAhead: 30, limit: 10 }),
        leaveService.getUpcomingBirthdays({ daysAhead: 30, limit: 10 }),
        leaveService.getRecentResignations({ days: 30, limit: 10 }),
        leaveService.getRecentJoiners({ days: 30, limit: 10 }),
        // leaveService.getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" }),
        leaveService.getLeaves({ page: 0, size: 200 }),
      ]);

      setAnniversaries(anniversaryResponse.data?.data ?? []);
      setBirthdays(birthdayResponse.data?.data ?? []);
      setResignations(resignationResponse.data?.data ?? []);
      setJoiners(joinerResponse.data?.data ?? []);
      // setLeaveTypes(
      //   leaveTypeResponse.data ?? leaveTypeResponse.data?.content ?? [],
      // );
      setLeaveRequests(leaveRequestResponse.data?.content ?? []);

      await loadReportData();
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load data", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const lastMonth = dayjs().subtract(30, "days").format("YYYY-MM-DD");
      const currentYear = dayjs().year();

      const filterParams: any = {};
      if (filters.from) filterParams.from = filters.from;
      if (filters.to) filterParams.to = filters.to;
      if (filters.employeeId) filterParams.employeeId = filters.employeeId;
      if (filters.year) filterParams.year = filters.year;
      if (filters.status) filterParams.status = filters.status;
      if (filters.leaveType) filterParams.leaveType = filters.leaveType;

      const [
        usageResponse,
        pendingResponse,
        lopResponse,
        balanceResponse,
        compOffResponse,
      ]: any = await Promise.all([
        leaveService.getLeaveUsageReport({
          from: filters.from || lastMonth,
          to: filters.to || today,
          ...(filters.employeeId && { employeeId: filters.employeeId }),
        }),
        leaveService.getLeavePendingApprovalsReport({
          from: filters.from || lastMonth,
          to: filters.to || today,
          ...(filters.employeeId && { employeeId: filters.employeeId }),
        }),
        leaveService.getLeaveLopReport({
          from: filters.from || lastMonth,
          to: filters.to || today,
          ...(filters.employeeId && { employeeId: filters.employeeId }),
        }),
        leaveService.getLeaveBalanceReport({
          year: filters.year || currentYear,
          ...(filters.employeeId && { employeeId: filters.employeeId }),
        }),
        leaveService.getLeaveCompOffReport({
          ...(filters.status && { status: filters.status }),
          ...(filters.employeeId && { employeeId: filters.employeeId }),
        }),
      ]);

      setLeaveUsageData(usageResponse.data || []);
      setPendingApprovalsData(pendingResponse.data || []);
      setLopData(lopResponse.data || []);
      setBalanceData(balanceResponse.data || []);
      setCompOffData(compOffResponse.data || []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load report data", "error");
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleFilterChange = (key: keyof ReportFilter, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    showSpinner();
    try {
      await loadReportData();
      showSnackbar("Filters applied successfully", "success");
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to apply filters", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      from: dayjs().subtract(30, "days").format("YYYY-MM-DD"),
      to: dayjs().format("YYYY-MM-DD"),
      year: dayjs().year(),
      employeeId: "",
      status: "",
      leaveType: "",
    });
    handleApplyFilters();
  };

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    showSpinner();
    try {
      const payload: any = {
        reportType: selectedReportType,
        format: exportFormat,
        filters: {},
      };

      if (selectedReportType === "LEAVE_BALANCE") {
        payload.filters.leaveYear = filters.year || dayjs().year();
      } else if (selectedReportType === "LEAVE_COMP_OFFS") {
        if (filters.status) payload.filters.status = filters.status;
      } else {
        payload.filters.from =
          filters.from || dayjs().subtract(30, "days").format("YYYY-MM-DD");
        payload.filters.to = filters.to || dayjs().format("YYYY-MM-DD");
      }
      if (filters.employeeId) payload.filters.employeeId = filters.employeeId;

      const response: any = await leaveService.exportReport(payload);
      if (response.data?.jobRef) {
        const interval = setInterval(async () => {
          try {
            const statusRes: any = await leaveService.getExportStatus(
              response.data.jobRef,
            );
            setExportProgress(statusRes.data.progressPercent || 0);
            if (statusRes.data.status === "completed") {
              clearInterval(interval);
              setExporting(false);
              hideSpinner();
              if (statusRes.data.downloadUrl) {
                window.open(statusRes.data.downloadUrl, "_blank");
                showSnackbar("Export completed!", "success");
                setShowExportDialog(false);
              }
            } else if (statusRes.data.status === "failed") {
              clearInterval(interval);
              setExporting(false);
              hideSpinner();
              showSnackbar(
                statusRes.data.errorMessage || "Export failed",
                "error",
              );
            }
          } catch (error) {
            clearInterval(interval);
            setExporting(false);
            hideSpinner();
          }
        }, 2000);
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to export", "error");
      setExporting(false);
      hideSpinner();
    }
  };

  const handleDrillDown = (
    data: any[],
    title: string,
    type: "usage" | "balance" | "pending" | "lop",
  ) => {
    setDrillDownData(data);
    setDrillDownTitle(title);
    setDrillDownType(type);
    setDrillDownOpen(true);
  };

  // Computed stats
  const totalRequests = leaveUsageData.reduce(
    (sum, item) => sum + item.requestCount,
    0,
  );
  const totalDays = leaveUsageData.reduce(
    (sum, item) => sum + item.totalDays,
    0,
  );
  // const pendingCount = pendingApprovalsData.length;
  const lopTotal = lopData.reduce((sum, item) => sum + item.lopDays, 0);
  const uniqueEmployees = new Set(balanceData.map((item) => item.employeeId))
    .size;
  // const totalBalance = balanceData.reduce(
  //   (sum, item) => sum + item.closingBalance,
  //   0,
  // );
  // const compOffCount = compOffData.length;

  // Chart data
  const usageChartData = leaveUsageData.map((item) => ({
    name:
      item.leaveTypeName.length > 15
        ? item.leaveTypeName.substring(0, 15) + "..."
        : item.leaveTypeName,
    days: item.totalDays,
    requests: item.requestCount,
    code: item.leaveTypeCode,
    fullName: item.leaveTypeName,
    employeeName: item.employeeName,
  }));

  // const balanceChartDataForChart = balanceData
  //   .filter((item) => item.closingBalance !== 0)
  //   .slice(0, 10)
  //   .map((item) => ({
  //     name:
  //       item.employeeName.length > 12
  //         ? item.employeeName.substring(0, 12) + "..."
  //         : item.employeeName,
  //     balance: item.closingBalance,
  //     leaveType: item.leaveTypeName,
  //     fullName: item.employeeName,
  //   }));

  const pendingStatusData = [
    {
      name: "Pending",
      value: pendingApprovalsData.filter((d) => d.status === "PENDING").length,
    },
    {
      name: "Clarification",
      value: pendingApprovalsData.filter(
        (d) => d.status === "CLARIFICATION_REQUESTED",
      ).length,
    },
  ];

  // Leave type distribution for chart
  const leaveTypeChartData = leaveTypeDistribution.map((item) => ({
    name:
      item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
    count: item.count,
    days: item.days,
    code: item.code,
  }));

  const topEmployees = leaveUsageData
    .reduce((acc: any[], curr) => {
      const existing = acc.find((item) => item.employeeId === curr.employeeId);
      if (existing) {
        existing.totalDays += curr.totalDays;
        existing.requestCount += curr.requestCount;
      } else {
        acc.push({
          employeeId: curr.employeeId,
          employeeName: curr.employeeName,
          employeeCode: curr.employeeCode,
          totalDays: curr.totalDays,
          requestCount: curr.requestCount,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.totalDays - a.totalDays)
    .slice(0, 5);

  const handleAddEmployee = (employee: any) => {
    if (!employee) return;
    setFilters({ ...filters, employeeId: employee?.id || "" });
  };

  // Prepare data for stacked bar chart - Top employees with leave type breakdown
  const topEmployeeStackedData = useMemo(() => {
    // Get top 10 employees by total balance
    const topEmployees = groupedBalanceData
      .sort((a, b) => b.totalBalance - a.totalBalance)
      .slice(0, 10);

    // Get all unique leave type codes from these employees
    const allLeaveTypes = new Set();
    topEmployees.forEach((emp) => {
      emp.leaveTypes.forEach((type: any) => {
        allLeaveTypes.add(type.typeCode);
      });
    });

    // Build the chart data
    return topEmployees.map((emp) => {
      const dataPoint: any = {
        name:
          emp.employeeName.length > 12
            ? emp.employeeName.substring(0, 12) + "..."
            : emp.employeeName,
        fullName: emp.employeeName,
        employeeCode: emp.employeeCode,
        totalBalance: emp.totalBalance,
      };

      // Add each leave type balance
      emp.leaveTypes.forEach((type: any) => {
        dataPoint[type.typeCode] = type.balance;
      });

      // Fill missing leave types with 0
      allLeaveTypes.forEach((code: any) => {
        if (!(code in dataPoint)) {
          dataPoint[code] = 0;
        }
      });

      return dataPoint;
    });
  }, [groupedBalanceData]);

  // Get sorted leave type codes for consistent display
  const sortedLeaveTypeCodes = useMemo(() => {
    const codes = new Set();
    groupedBalanceData.forEach((emp: any) => {
      emp.leaveTypes.forEach((type: any) => {
        if (type.balance !== 0) {
          codes.add(type.typeCode);
        }
      });
    });
    return Array.from(codes);
  }, [groupedBalanceData]);

  // Color mapping for leave types
  // const leaveTypeColors: { [key: string]: string } = {
  //   'CL': '#3b82f6',
  //   'EL': '#8b5cf6',
  //   'SL': '#10b981',
  //   'CO': '#f59e0b',
  //   'LOP': '#ef4444',
  //   'BL': '#ec4899',
  //   'MAR': '#06b6d4',
  //   'default': '#6b7280'
  // };

  // const getLeaveTypeColor = (code: string) => {
  //   return leaveTypeColors[code] || leaveTypeColors.default;
  // };
  const renderTabContent = () => {
    // if (loading) {
    //   return (
    //     <Box className="flex items-center justify-center flex-d-c py-20">
    //       <CircularProgress size={48} />
    //       <Typography
    //         variant="body2"
    //         className="!mt-3 !text-[13px] !text-gray-400"
    //       >
    //         Loading reports...
    //       </Typography>
    //     </Box>
    //   );
    // }

    switch (activeTab) {
      case 0: // Overview Dashboard
        return (
          <Box className="gap-4">
            {/* Charts Row */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card className="!border !bg-white-50 !border-gray-200 !rounded-2xl !shadow-sm">
                  <CardContent className="!p-5">
                    <Box className="flex items-center justify-between mb-2">
                      <Box>
                        <Typography
                          variant="subtitle1"
                          className="!text-[13px] !font-semibold !text-gray-900"
                        >
                          Monthly Leave Trends
                        </Typography>
                        <Typography
                          variant="caption"
                          className="!text-[10px] !text-gray-400"
                        >
                          Requests and days over time
                        </Typography>
                      </Box>
                      <Box className="flex gap-1">
                        {["bar", "area", "line"].map((type) => (
                          <Button
                            key={type}
                            size="small"
                            variant={
                              viewType === type ? "contained" : "outlined"
                            }
                            onClick={() => setViewType(type as any)}
                            className="!min-w-8 !h-7 !p-0 !px-2 !text-[10px] !normal-case !rounded-lg"
                            sx={viewType === type ? { bgcolor: "#3b82f6" } : {}}
                          >
                            {type === "bar" && <BarChart fontSize="small" />}
                            {type === "area" && <TrendingUp fontSize="small" />}
                            {type === "line" && <Timeline fontSize="small" />}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                    <ResponsiveContainer width="100%" height={280}>
                      {viewType === "bar" ? (
                        <RechartsBar data={monthlyTrendData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            fontSize={10}
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} />
                          <RechartsTooltip
                            contentStyle={{
                              fontSize: "12px",
                              borderRadius: "12px",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                          <Bar
                            dataKey="requests"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            name="Requests"
                          />
                          <Bar
                            dataKey="days"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                            name="Days"
                          />
                        </RechartsBar>
                      ) : viewType === "area" ? (
                        <AreaChart data={monthlyTrendData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            fontSize={10}
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} />
                          <RechartsTooltip
                            contentStyle={{
                              fontSize: "12px",
                              borderRadius: "12px",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                          <Area
                            type="monotone"
                            dataKey="requests"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.2}
                            name="Requests"
                          />
                          <Area
                            type="monotone"
                            dataKey="days"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.2}
                            name="Days"
                          />
                        </AreaChart>
                      ) : (
                        <LineChart data={monthlyTrendData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            fontSize={10}
                            tick={{ fill: "#9ca3af" }}
                          />
                          <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} />
                          <RechartsTooltip
                            contentStyle={{
                              fontSize: "12px",
                              borderRadius: "12px",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                          <Line
                            type="monotone"
                            dataKey="requests"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Requests"
                          />
                          <Line
                            type="monotone"
                            dataKey="days"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="Days"
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Card className="!border !bg-white-50 mb-5 !border-gray-200 !rounded-2xl !shadow-sm">
                  <CardContent className="!p-5">
                    <Box className="flex items-center justify-between mb-2">
                      <Box>
                        <Typography
                          variant="subtitle1"
                          className="!text-[13px] !font-semibold !text-gray-900"
                        >
                          Leave Type Distribution
                        </Typography>
                        <Typography
                          variant="caption"
                          className="!text-[10px] !text-gray-400"
                        >
                          Requests by leave type
                        </Typography>
                      </Box>
                      <PieChartIcon
                        className="text-gray-400"
                        fontSize="small"
                      />
                    </Box>
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPie>
                        <Pie
                          data={leaveTypeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="count"
                        >
                          {leaveTypeChartData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CHART_COLORS_LIGHT[
                                index % CHART_COLORS_LIGHT.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            fontSize: "12px",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                          formatter={(value, _name, props) => {
                            const entry = props.payload;
                            return [
                              `${value} requests (${entry.days} days)`,
                              entry.name,
                            ];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Top Employees */}
            <Card className="!border !bg-white-50 mb-5 !border-gray-200 !rounded-2xl !shadow-sm">
              <CardContent className="!p-5">
                <Box className="flex items-center justify-between mb-3">
                  <Box className="flex items-center gap-1">
                    <Typography
                      variant="subtitle1"
                      className="!text-[13px] !font-semibold !text-gray-900"
                    >
                      🏆 Top Leave Users
                    </Typography>
                    <Chip
                      label={`${topEmployees.length} employees`}
                      size="small"
                      className="!h-5 !text-[9px] !bg-primary/10 !text-primary"
                    />
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  {topEmployees.map((item, index) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                      <Box
                        className="flex items-center gap-2 p-3 bg-white rounded-sm border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                        onClick={() =>
                          handleDrillDown(
                            leaveUsageData.filter(
                              (d) => d.employeeId === item.employeeId,
                            ),
                            `Leave Details for ${item.employeeName}`,
                            "usage",
                          )
                        }
                      >
                        <Box
                          className="flex items-center justify-center w-[36px] h-[36px] text-white rounded-sm"
                          sx={{
                            background:
                              index === 0
                                ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                                : index === 1
                                  ? "linear-gradient(135deg, #d1d5db, #9ca3af)"
                                  : index === 2
                                    ? "linear-gradient(135deg, #d97706, #b45309)"
                                    : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box className="flex-1">
                          <Typography
                            variant="subtitle2"
                            className="!text-[12px] !font-medium !text-gray-900 truncate"
                          >
                            {item.employeeName}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="!text-[10px] !text-gray-400"
                          >
                            {item.employeeCode}
                          </Typography>
                        </Box>
                        <Box className="flex items-center gap-3">
                          <Typography
                            variant="body2"
                            className="!text-sm !font-bold !text-blue-600"
                          >
                            {item.totalDays.toFixed(1)}d
                          </Typography>
                          <Typography
                            variant="caption"
                            className="!text-[9px] !text-gray-400"
                          >
                            {item.requestCount} req
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      case 1: // Leave Usage
        return (
          <Box className="gap-3">
            <Card className="!border !bg-white-50 !border-gray-200 !rounded-2xl !shadow-sm mb-5">
              <CardContent className="!p-5">
                <Typography
                  variant="subtitle1"
                  className="!text-[13px] !font-semibold !text-gray-900 mb-4"
                >
                  Leave Usage by Type
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBar data={usageChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      fontSize={10}
                      tick={{ fill: "#9ca3af" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={10}
                      tick={{ fill: "#9ca3af" }}
                      width={120}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value, name) => [`${value} days`, name]}
                    />
                    <Bar dataKey="days" radius={[0, 6, 6, 0]}>
                      {usageChartData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CHART_COLORS_LIGHT[
                            index % CHART_COLORS_LIGHT.length
                            ]
                          }
                        />
                      ))}
                    </Bar>
                  </RechartsBar>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Grid container spacing={2.5}>
              {leaveUsageData.map((item, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                  <UtilizationCard
                    data={item}
                    color={
                      CHART_COLORS_LIGHT[index % CHART_COLORS_LIGHT.length]
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2: // Pending Approvals
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Stats Cards */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 p-3 border border-gray-200 rounded-lg">
                  <Typography className="text-[12px] text-gray-800">
                    Total Requests
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#f59e0b" }}
                  >
                    {totalPendingRequests}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 p-3 border border-gray-200 rounded-lg">
                  <Typography className="text-[12px] text-gray-800">
                    Employees
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#8b5cf6" }}
                  >
                    {totalPendingEmployees}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 p-3 border border-gray-200 rounded-lg">
                  <Typography className="text-[12px] text-gray-800">
                    Total Days
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#7c3aed" }}
                  >
                    {totalPendingDays.toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 p-3 border border-gray-200 rounded-lg">
                  <Typography className="text-[12px] text-gray-800">
                    Avg Days/Request
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#10b981" }}
                  >
                    {totalPendingRequests > 0
                      ? (totalPendingDays / totalPendingRequests).toFixed(1)
                      : 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Status Distribution Chart */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Card
                  className="bg-white-50 border border-gray-200 rounded-lg"
                  sx={{
                    borderRadius: "12px",
                    boxShadow: "none",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#374151",
                        mb: 2,
                      }}
                    >
                      Status Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={pendingStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pendingStatusData.map(
                            (_entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  CHART_COLORS_LIGHT[
                                  index % CHART_COLORS_LIGHT.length
                                  ]
                                }
                              />
                            ),
                          )}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            fontSize: "12px",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                          formatter={(value) => [`${value} requests`, ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending Requests List - Grouped by Employee */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Card
                  className="bg-white-50 border border-gray-200"
                  sx={{
                    boxShadow: "none",
                    borderRadius: "12px",
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* Header with Filter */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2.5,
                        flexWrap: "wrap",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <div className="text-[12px] text-gray-800">
                          📋 Pending Requests
                        </div>
                        <Chip
                          label={`${totalPendingRequests} total`}
                          size="small"
                          sx={{
                            height: "22px",
                            fontSize: "10px",
                            bgcolor: "#f3f4f6",
                            color: "#6b7280",
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Grouped Pending List */}
                    {filteredPendingData.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 6 }}>
                        <Typography sx={{ fontSize: "13px", color: "#9ca3af" }}>
                          No pending requests found
                        </Typography>
                      </Box>
                    ) : (
                      <Box className="max-h-[400px] overflow-auto">
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {filteredPendingData.map((employee: any) => (
                            <ExpandablePendingRow
                              key={employee.employeeId}
                              employee={employee}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 3: // LOP Report
        return (
          <Box className="grid flex-d-c gap-3">
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <StatsCard
                  title="Total LOP Days"
                  value={lopTotal.toFixed(1)}
                  icon={Warning}
                  color="#ef4444"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <StatsCard
                  title="LOP Requests"
                  value={lopData.length}
                  icon={EventNote}
                  color="#f59e0b"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <StatsCard
                  title="Employees on LOP"
                  value={new Set(lopData.map((item) => item.employeeId)).size}
                  icon={People}
                  color="#ec4899"
                />
              </Grid>
            </Grid>

            <Card className="!border !bg-white-50 mb-5 !border-gray-200 !rounded-2xl !shadow-sm">
              <CardContent className="!p-5">
                <Box className="flex items-center justify-between mb-3">
                  <Typography
                    variant="subtitle1"
                    className="!text-[13px] !font-semibold !text-gray-900"
                  >
                    ⚠️ LOP Details
                  </Typography>
                  <Chip
                    label={`${lopData.length} records`}
                    size="small"
                    className="!h-6 !text-[10px] !bg-red-50 !text-red-700"
                  />
                </Box>
                {lopData.length === 0 ? (
                  <Box className="text-center py-6">
                    <Typography
                      variant="body2"
                      className="!text-[13px] !text-gray-400"
                    >
                      ✅ No LOP records found
                    </Typography>
                  </Box>
                ) : (
                  <Box className="flex flex-d-c gap-2 max-h-[400px] overflow-auto">
                    {lopData.map((item, index) => (
                      <LopCard key={index} data={item} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 4: // Balance Report
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Stats Cards */}
            {/* <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box
                 className="p-3 bg-white-50 border border-gray-200 rounded-lg"
                 
                >
                  <Typography
                    className="text-[12px] text-gray-800"
                  >
                    Total Balance
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#10b981" }}
                  >
                    {totalBalanceValue.toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box
                  className="p-3 bg-white-50 border border-gray-200 rounded-lg"
                >
                  <Typography
                    className="text-[12px] text-gray-800"
                  >
                    Positive Balance
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#3b82f6" }}
                  >
                    {totalPositive}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box
                   className="p-3 bg-white-50 border border-gray-200 rounded-lg"
                >
                  <Typography
                    className="text-[12px] text-gray-800"
                  >
                    Negative Balance
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#ef4444" }}
                  >
                    {totalNegative}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box
                 className="p-3 bg-white-50 border border-gray-200 rounded-lg"
                >
                  <Typography
                    className="text-[12px] text-gray-800"
                  >
                    Employees
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#8b5cf6" }}
                  >
                    {uniqueEmployeesCount}
                  </Typography>
                </Box>
              </Grid>
            </Grid> */}

            {/* Chart - Top Employee Balances */}
            {/* <Card
               className="bg-white-50 border border-gray-200 rounded-lg"
            >
              <CardContent sx={{ p: 2 }}>
                <div className="text-[12px] text-gray-800 mb-3"
                >
                  Top Employee Balances
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsBar data={balanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      fontSize={10}
                      tick={{ fill: "#9ca3af" }}
                    />
                    <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} />
                    <RechartsTooltip
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value) => [`${value} days`, "Balance"]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                      {balanceChartData.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={_entry.balance >= 0 ? "#10b981" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </RechartsBar>
                </ResponsiveContainer>
              </CardContent>
            </Card> */}

            <Card className="bg-white border border-gray-200 rounded-lg">
              <CardContent sx={{ p: 3 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[14px] font-semibold text-gray-800">
                      Top Employee Balances by Leave Type
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Stacked view showing leave type distribution for top
                      employees
                    </div>
                  </div>
                  <Chip
                    label={`${topEmployeeStackedData.length} employees`}
                    size="small"
                    sx={{
                      height: "20px",
                      fontSize: "9px",
                      bgcolor: "#f3f4f6",
                      color: "#6b7280",
                    }}
                  />
                </div>

                <ResponsiveContainer width="100%" height={350}>
                  <RechartsBar
                    data={topEmployeeStackedData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={10}
                      tick={{ fill: "#6b7280" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      fontSize={10}
                      tick={{ fill: "#9ca3af" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickLine={false}
                      label={{
                        value: "Days",
                        position: "insideLeft",
                        fontSize: 10,
                        fill: "#9ca3af",
                        angle: -90,
                        offset: -5,
                      }}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          const employee = topEmployeeStackedData.find(
                            (e: any) =>
                              e.name === label || e.fullName === label,
                          );
                          return (
                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg min-w-[200px]">
                              <div className="font-semibold text-sm text-gray-900 mb-2">
                                {employee?.fullName || label}
                                {employee && (
                                  <span className="text-xs text-gray-500 ml-2 font-normal">
                                    ({employee.employeeCode})
                                  </span>
                                )}
                              </div>
                              {payload.map((entry: any, index: number) => {
                                if (entry.value === 0) return null;
                                const typeNameMap: { [key: string]: string } = {
                                  CL: "Casual Leave",
                                  EL: "Earned Leave",
                                  SL: "Sick Leave",
                                  CO: "Comp Off",
                                  LOP: "Loss of Pay",
                                  BL: "Bereavement Leave",
                                  MAR: "Marriage Leave",
                                };
                                return (
                                  <div
                                    key={index}
                                    className="flex justify-between text-xs py-0.5"
                                  >
                                    <span style={{ color: entry.color }}>
                                      {typeNameMap[entry.name] || entry.name}
                                    </span>
                                    <span className="font-medium">
                                      {entry.value.toFixed(1)} days
                                    </span>
                                  </div>
                                );
                              })}
                              <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between text-xs font-bold">
                                <span>Total</span>
                                <span>
                                  {employee?.totalBalance?.toFixed(1) || 0} days
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }}
                      iconType="square"
                      iconSize={10}
                      formatter={(value: any) => {
                        const typeNameMap: { [key: string]: string } = {
                          CL: "Casual Leave",
                          EL: "Earned Leave",
                          SL: "Sick Leave",
                          CO: "Comp Off",
                          LOP: "Loss of Pay",
                          BL: "Bereavement Leave",
                          MAR: "Marriage Leave",
                        };
                        return typeNameMap[value] || value;
                      }}
                    />
                    {sortedLeaveTypeCodes.map((code: any) => (
                      <Bar
                        key={code}
                        dataKey={code}
                        stackId="a"
                        fill={getLeaveTypeColor(code)}
                        radius={[0, 0, 0, 0]}
                        maxBarSize={40}
                      />
                    ))}
                  </RechartsBar>
                </ResponsiveContainer>

                {/* Color Legend with values */}
                <div className="flex flex-wrap gap-4 mt-3 justify-center border-t border-gray-100 pt-3">
                  {sortedLeaveTypeCodes.map((code: any) => {
                    // Calculate total for this leave type across all employees
                    const total = topEmployeeStackedData.reduce(
                      (sum: number, emp: any) => {
                        return sum + (emp[code] || 0);
                      },
                      0,
                    );
                    return (
                      <div key={code} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: getLeaveTypeColor(code) }}
                        />
                        <span className="text-[10px] font-medium text-gray-700">
                          {code}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          ({total.toFixed(1)}d)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Employee Balance List with Leave Type Filter */}
            <Card className="bg-white-50 border border-gray-200 rounded-lg">
              <CardContent>
                {/* Header with Leave Type Filter */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2.5,
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <div className="text-[12px] text-gray-800">
                      Employee Balance Details
                    </div>
                    <Chip
                      label={`${groupedBalanceData.length} employees`}
                      size="small"
                      sx={{
                        height: "22px",
                        fontSize: "10px",
                        bgcolor: "#f3f4f6",
                        color: "#6b7280",
                      }}
                    />
                  </Box>

                  {/* Leave Type Filter */}
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                      value={filters.leaveType || ""}
                      onChange={(e) => {
                        handleFilterChange("leaveType", e.target.value);
                        handleApplyFilters();
                      }}
                      displayEmpty
                    // sx={{
                    //   fontSize: "12px",
                    //   bgcolor: "white",
                    //   borderRadius: "8px",
                    //   "& .MuiOutlinedInput-notchedOutline": {
                    //     borderColor: "#e5e7eb",
                    //   },
                    //   "&:hover .MuiOutlinedInput-notchedOutline": {
                    //     borderColor: "#d1d5db",
                    //   },
                    // }}
                    >
                      <MenuItem value="">All Leave Types</MenuItem>
                      {leaveTypeFilterOptions.map((type: any) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Balance List */}
                {filteredBalanceData.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography sx={{ fontSize: "13px", color: "#9ca3af" }}>
                      No balance records found
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      maxHeight: "500px",
                      overflow: "auto",
                      "&::-webkit-scrollbar": {
                        width: "4px",
                      },
                      // "&::-webkit-scrollbar-track": {
                      //   background: "#f1f1f1",
                      //   borderRadius: "4px",
                      // },
                      // "&::-webkit-scrollbar-thumb": {
                      //   background: "#d1d5db",
                      //   borderRadius: "4px",
                      // },
                      // "&::-webkit-scrollbar-thumb:hover": {
                      //   background: "#9ca3af",
                      // },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {filteredBalanceData.map((employee: any) => (
                        <ExpandableBalanceRow
                          key={employee.employeeId}
                          employee={employee}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 5: // Comp Off
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Stats Cards */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 border border-gray-200 rounded-lg p-3">
                  <Typography className="text-[12px] text-gray-800">
                    Total Employees
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#8b5cf6" }}
                  >
                    {totalEmployees}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 border border-gray-200 rounded-lg p-3">
                  <Typography className="text-[12px] text-gray-800">
                    Total Credits
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#8b5cf6" }}
                  >
                    {compOffData
                      .reduce(
                        (sum: number, item: any) =>
                          sum + (item.creditDays || 0),
                        0,
                      )
                      .toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 border border-gray-200 rounded-lg p-3">
                  <Typography className="text-[12px] text-gray-800">
                    Approved Credits
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#10b981" }}
                  >
                    {totalApproved.toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box className="bg-white-50 border border-gray-200 rounded-lg p-3">
                  <Typography className="text-[12px] text-gray-800">
                    Pending Credits
                  </Typography>
                  <Typography
                    sx={{ fontSize: "22px", fontWeight: 600, color: "#f59e0b" }}
                  >
                    {totalPending.toFixed(1)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Main Comp Off Card with Status Filter */}
            <Card
              className="bg-white-50 border border-gray-200"
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "none",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header with Filter */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2.5,
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography className="text-gray-800">
                      Comp Off Summary
                    </Typography>
                    <Chip
                      label={`${groupedCompOffData.length} employees`}
                      size="small"
                      sx={{
                        height: "22px",
                        fontSize: "10px",
                        bgcolor: "#f3f4f6",
                        color: "#6b7280",
                      }}
                    />
                  </Box>
                </Box>

                {/* Grouped Comp Off List */}
                {filteredGroupedData.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography sx={{ fontSize: "13px", color: "#9ca3af" }}>
                      No comp off records found
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      maxHeight: "500px",
                      overflow: "auto",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {filteredGroupedData.map((employee: any) => (
                        <ExpandableEmployeeRow
                          key={employee.employeeId}
                          employee={employee}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 6: // Snapshot
        return (
          <SnapshotTabContent
            anniversaries={anniversaries}
            birthdays={birthdays}
            joiners={joiners}
            resignations={resignations}
            loading={loading}
          />
        );

      default:
        return null;
    }
  };

  // First, create a more detailed balance chart data with leave types
  // const balanceChartDataWithTypes = useMemo(() => {
  //   // Get top employees by total balance
  //   const topEmployees = groupedBalanceData
  //     .sort((a, b) => b.totalBalance - a.totalBalance)
  //     .slice(0, 10);

  //   // Transform data for stacked bar chart
  //   return topEmployees.map((employee) => {
  //     const dataPoint: any = {
  //       name:
  //         employee.employeeName.length > 12
  //           ? employee.employeeName.substring(0, 12) + "..."
  //           : employee.employeeName,
  //       fullName: employee.employeeName,
  //       employeeCode: employee.employeeCode,
  //       totalBalance: employee.totalBalance,
  //     };

  //     // Add each leave type as a separate data point
  //     employee.leaveTypes.forEach((type: any) => {
  //       dataPoint[type.typeCode] = type.balance;
  //     });

  //     return dataPoint;
  //   });
  // }, [groupedBalanceData]);

  // Get unique leave type codes for the legend
  // const leaveTypeCodes = useMemo(() => {
  //   const codes = new Set();
  //   groupedBalanceData.forEach((employee: any) => {
  //     employee.leaveTypes.forEach((type: any) => {
  //       codes.add(type.typeCode);
  //     });
  //   });
  //   return Array.from(codes);
  // }, [groupedBalanceData]);

  // Generate colors for each leave type
  const leaveTypeColors: { [key: string]: string } = {
    CL: "#3b82f6",
    EL: "#8b5cf6",
    SL: "#10b981",
    CO: "#f59e0b",
    LOP: "#ef4444",
    BL: "#ec4899",
    MAR: "#06b6d4",
    default: "#6b7280",
  };

  const getLeaveTypeColor = (code: string) => {
    return leaveTypeColors[code] || leaveTypeColors.default;
  };

  return (
    <LeavePageShell group="hr" title="Leave Reports" subtitle="Leave Reports">
      <div className="text-[12px] text-gray-800 font-bold">
        Analytics Dashboard
      </div>

      {/* Filter Bar */}
      {selectedReportType !== "LEAVE_PENDING_APPROVALS" && (
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          loading={loading}
          reportType={selectedReportType}
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 flex-wrap">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_e, v) => {
              setActiveTab(v);
              const reportTypes: ReportType[] = [
                "LEAVE_USAGE",
                "LEAVE_USAGE",
                "LEAVE_PENDING_APPROVALS",
                "LEAVE_LOP",
                "LEAVE_BALANCE",
                "LEAVE_COMP_OFFS",
              ];
              setSelectedReportType(reportTypes[v]);
            }}
            sx={{
              alignItems: "center",
              "& .MuiTabs-flexContainer": {
                gap: "4px",
                flexWrap: "wrap",
                justifyContent: "center",
              },
              "& .MuiTab-root": {
                marginRight: "4px",
                minHeight: "40px",
                height: "40px",
                borderRadius: "8px",
                fontSize: "12px",
                textTransform: "none",
                fontWeight: 500,
                padding: "6px 20px",
                color: "#374151",
                "&.Mui-selected": {
                  color: "var(--color-primary, #1976d2)",
                  backgroundColor: "var(--color-primary-50)",
                  // border:  "1px solid var(--color-primary, #1976d2)",
                },
                "& .MuiTab-iconWrapper": {
                  fontSize: "20px",
                },
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab
              icon={<DashboardOutlined />}
              iconPosition="start"
              label="Overview"
            />
            <Tab
              icon={<InsightsOutlined />}
              iconPosition="start"
              label="Usage"
            />
            <Tab
              icon={<PendingActionsOutlined />}
              iconPosition="start"
              label="Pending"
            />
            <Tab
              icon={<WarningAmberOutlined />}
              iconPosition="start"
              label="LOP"
            />
            <Tab
              icon={<AccountBalanceWalletOutlined />}
              iconPosition="start"
              label="Balance"
            />
            <Tab
              icon={<EventAvailableOutlined />}
              iconPosition="start"
              label="Comp Off"
            />
            <Tab
              icon={<CameraAltOutlined />}
              iconPosition="start"
              label="Snapshot"
            />
          </Tabs>
        </Box>

        {/* Action Buttons */}
        <Box className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <IconButton
            size="small"
            className="!border !border-gray-300 !rounded-xl !p-2"
            onClick={() => setShowExportDialog(true)}
          >
            <GetApp fontSize="small" className="text-gray-500" />
          </IconButton>
          <IconButton
            size="small"
            className="!border !border-gray-300 !rounded-xl !p-2"
            onClick={() => window.print()}
          >
            <Print fontSize="small" className="text-gray-500" />
          </IconButton>
          <IconButton
            size="small"
            className="!border !border-gray-300 !rounded-xl !p-2"
            onClick={loadAllData}
          >
            <Refresh fontSize="small" className="text-gray-500" />
          </IconButton>
        </Box>
      </div>

      {/* Content */}
      {renderTabContent()}

      {/* Footer */}
      <Box className="flex items-center justify-between gap-1 mt-4 pt-3 flex-wrap">
        <Typography variant="caption" className="!text-[10px] !text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </Typography>
        <Typography variant="caption" className="!text-[10px] !text-gray-400">
          {totalDays.toFixed(1)} total days • {totalRequests} requests •{" "}
          {uniqueEmployees} employees
        </Typography>
      </Box>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => !exporting && setShowExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="!p-2 flex items-center justify-between border-b border-gray-200">
          <div className="text-[12px] ml-4">Export Report</div>
          {!exporting && (
            <IconButton size="small" onClick={() => setShowExportDialog(false)}>
              <Close fontSize="small" className="text-gray-800" />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent className="!px-5 !py-3">
          <Box className="grid pt-1 gap-3">
            <Box>
              <Typography
                variant="subtitle2"
                className="!text-[12px] !font-medium !text-gray-700 block mb-1.5"
              >
                Report Type <span className="text-red-500">*</span>
              </Typography>
              <RadioGroup
                row
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as any)}
                className="flex-wrap gap-1"
              >
                <FormControlLabel
                  value="LEAVE_USAGE"
                  control={<Radio size="small" />}
                  label="Usage"
                  className="text-[12px] [&_.MuiFormControlLabel-label]:!text-[12px]"
                />
                <FormControlLabel
                  value="LEAVE_BALANCE"
                  control={<Radio size="small" />}
                  label="Balance"
                  className="text-[12px] [&_.MuiFormControlLabel-label]:!text-[12px]"
                />
                <FormControlLabel
                  value="LEAVE_LOP"
                  control={<Radio size="small" />}
                  label="LOP"
                  className="text-[12px] [&_.MuiFormControlLabel-label]:!text-[12px]"
                />
                <FormControlLabel
                  value="LEAVE_PENDING_APPROVALS"
                  control={<Radio size="small" />}
                  label="Pending"
                  className="text-[12px] [&_.MuiFormControlLabel-label]:!text-[12px]"
                />
                <FormControlLabel
                  value="LEAVE_COMP_OFFS"
                  control={<Radio size="small" />}
                  label="Comp Off"
                  className="text-[12px] [&_.MuiFormControlLabel-label]:!text-[12px]"
                />
              </RadioGroup>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                className="!text-[12px] !font-medium !text-gray-700 block mb-1.5"
              >
                Format <span className="text-red-500">*</span>
              </Typography>
              <RadioGroup
                row
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as "csv" | "xlsx")
                }
              >
                <FormControlLabel
                  value="csv"
                  control={<Radio size="small" />}
                  label="CSV"
                  className="text-[12px] [&_.MuiFormControlLabel-label]:!text-[12px]"
                />
                <FormControlLabel
                  value="xlsx"
                  control={<Radio size="small" />}
                  label="Excel"
                  className="text-[12px] [&_.MuiFormControlLabel-label]:!text-[12px]"
                />
              </RadioGroup>
            </Box>

            {selectedReportType !== "LEAVE_BALANCE" &&
              selectedReportType !== "LEAVE_COMP_OFFS" && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      variant="caption"
                      className="!text-[11px] !text-gray-600 block mb-0.5"
                    >
                      From
                    </Typography>
                    {/* <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={filters.from || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, from: e.target.value })
                      }
                      disabled={exporting}
                    /> */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={filters.from ? dayjs(filters.from) : null}
                        onChange={(newValue) => {
                          setFilters({
                            ...filters,
                            from: newValue
                              ? dayjs(newValue).format("YYYY-MM-DD")
                              : "",
                          });
                        }}
                        disabled={exporting}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      variant="caption"
                      className="!text-[11px] !text-gray-600 block mb-0.5"
                    >
                      To
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={filters.to ? dayjs(filters.to) : null}
                        minDate={filters.from ? dayjs(filters.from) : undefined}
                        onChange={(newValue) => {
                          setFilters({
                            ...filters,
                            to: newValue
                              ? dayjs(newValue).format("YYYY-MM-DD")
                              : "",
                          });
                        }}
                        disabled={exporting}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}

            {selectedReportType === "LEAVE_BALANCE" && (
              <Box>
                <Typography
                  variant="caption"
                  className="!text-[11px] !text-gray-600 block mb-0.5"
                >
                  Year
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={filters.year || dayjs().year()}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      year: parseInt(e.target.value) || dayjs().year(),
                    })
                  }
                  disabled={exporting}
                />
              </Box>
            )}

            {selectedReportType === "LEAVE_COMP_OFFS" && (
              <Box>
                <Typography
                  variant="caption"
                  className="!text-[11px] !text-gray-600 block mb-0.5"
                >
                  Status
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.status || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    displayEmpty
                    disabled={exporting}
                    className="!text-[12px]"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="APPROVED">✅ Approved</MenuItem>
                    <MenuItem value="PENDING">⏳ Pending</MenuItem>
                    <MenuItem value="REJECTED">❌ Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {(selectedReportType === "LEAVE_USAGE" ||
              selectedReportType === "LEAVE_BALANCE") && (
                <Box>
                  {/* <EmployeeSelector
                    value={null}
                    onChange={(employee) => {
                      setFilters({ ...filters, employeeId: employee?.id || "" });
                    }}
                  /> */}
                  <EmployeeSelector
                    value={null}
                    onChange={handleAddEmployee}
                    label="Search Employee"
                  />
                </Box>
              )}

            {exporting && (
              <Box className="p-3">
                <Box className="flex items-center justify-between mb-1">
                  <Typography
                    variant="caption"
                    className="!text-[11px] !text-gray-600"
                  >
                    Generating report...
                  </Typography>
                  <Typography
                    variant="caption"
                    className="!text-[11px] !font-medium !text-gray-700"
                  >
                    {exportProgress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={exportProgress}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200 gap-2">
          <Button
            variant="outlined"
            className="!text-gray-600 !border-gray-200  !px-5"
            onClick={() => setShowExportDialog(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary !px-6 !shadow-none"
            onClick={handleExport}
            disabled={exporting}
            startIcon={
              exporting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <GetApp />
              )
            }
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DrillDown Modal */}
      <DrillDownModal
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        data={drillDownData}
        title={drillDownTitle}
        type={drillDownType}
      />
    </LeavePageShell>
  );
}

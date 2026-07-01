// import { useEffect, useMemo, useState } from "react";
// import {
//   Card,
//   CardContent,
//   Avatar,
//   Chip,
//   Box,
//   LinearProgress,
//   Tooltip,
//   IconButton,
// } from "@mui/material";
// import {
//   Cake,
//   WorkHistory,
//   PersonAdd,
//   PersonRemove,
//   TrendingUp,
//   TrendingDown,
//   CalendarToday,
//   People,
//   EmojiEvents,
//   Celebration,
//   BusinessCenter,
//   InsertEmoticon,
//   Email,
//   Star,
// } from "@mui/icons-material";
// import DataState from "../../components/DataState";
// import { useUI } from "../../context/Snackbar";
// import { leaveService } from "../../services/modules/leave";
// import type {
//   EmpOperationalListEntry,
//   LeaveRequest,
//   LeaveType,
// } from "../../services/modules/leaveTypes";
// import LeavePageShell from "./components/LeavePageShell";
// import { formatDate } from "./leaveFormatters";

// // Color palette for leave types
// const COLORS = [
//   "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", 
//   "#f59e0b", "#10b981", "#06b6d4", "#6366f1"
// ];

// // Snapshot Card Component
// function SnapshotCard({
//   title,
//   icon: Icon,
//   entries,
//   loading,
//   color,
//   gradient,
//   showYears = false,
//   showDays = false,
// }: {
//   title: string;
//   icon: any;
//   entries: any[];
//   loading: boolean;
//   color: string;
//   gradient: string;
//   showYears?: boolean;
//   showDays?: boolean;
// }) {
//   const count = entries.length;

//   return (
//     <Card 
//       className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
//       sx={{
//         background: `linear-gradient(135deg, ${gradient})`,
//         borderRadius: '16px',
//         border: 'none',
//       }}
//     >
//       <CardContent className="p-4">
//         <div className="flex items-start justify-between">
//           <div>
//             <div className="text-white/80 text-[11px] font-medium uppercase tracking-wider">
//               {title}
//             </div>
//             <div className="text-white text-2xl font-bold mt-1">
//               {loading ? "..." : count}
//             </div>
//           </div>
//           <Avatar 
//             className="!w-12 !h-12"
//             sx={{ 
//               bgcolor: 'rgba(255,255,255,0.2)',
//               backdropFilter: 'blur(4px)',
//             }}
//           >
//             <Icon className="text-white" />
//           </Avatar>
//         </div>

//         {!loading && count > 0 && (
//           <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
//             {entries.slice(0, 5).map((entry, index) => (
//               <div 
//                 key={entry.id || index} 
//                 className="flex items-center justify-between text-white/90 text-[12px] py-0.5 border-b border-white/10 last:border-0"
//               >
//                 <div className="flex items-center gap-2 truncate">
//                   <span className="truncate">{entry.name || entry.employeeName}</span>
//                   {showYears && entry.anniversaryYears && (
//                     <Chip 
//                       label={`${entry.anniversaryYears} yrs`}
//                       size="small"
//                       className="!h-4 !text-[9px] !bg-white/20 !text-white !border-0"
//                     />
//                   )}
//                   {showDays && entry.daysFromToday !== undefined && (
//                     <Chip 
//                       label={`${entry.daysFromToday} days`}
//                       size="small"
//                       className="!h-4 !text-[9px] !bg-white/20 !text-white !border-0"
//                     />
//                   )}
//                 </div>
//                 <span className="text-white/70 whitespace-nowrap text-[11px]">
//                   {entry.occursOn ? formatDate(entry.occursOn) : formatDate(entry.joiningDate)}
//                 </span>
//               </div>
//             ))}
//             {count > 5 && (
//               <div className="text-white/60 text-[11px] text-center pt-1">
//                 +{count - 5} more
//               </div>
//             )}
//           </div>
//         )}

//         {!loading && count === 0 && (
//           <div className="text-white/70 text-[12px] mt-2">
//             No records found
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// // Utilization Card Component
// function UtilizationCard({ 
//   leaveType, 
//   count, 
//   days, 
//   color,
// }: { 
//   leaveType: LeaveType; 
//   count: number; 
//   days: number; 
//   color: string;
// }) {
//   const maxDays = 30;

//   return (
//     <Card 
//       className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
//       sx={{ 
//         borderRadius: '12px',
//         border: '1px solid #e5e7eb',
//         background: 'white',
//       }}
//     >
//       <CardContent className="p-4">
//         <div className="flex items-center gap-3">
//           <Avatar 
//             className="!w-10 !h-10"
//             sx={{ bgcolor: `${color}15`, color: color }}
//           >
//             <EmojiEvents fontSize="small" />
//           </Avatar>
//           <div className="flex-1 min-w-0">
//             <div className="text-sm font-semibold text-gray-900 truncate">
//               {leaveType.name}
//             </div>
//             <div className="text-[11px] text-gray-500">
//               {count} request{count !== 1 ? 's' : ''}
//             </div>
//           </div>
//           <div className="text-right">
//             <div className="text-lg font-bold" style={{ color }}>
//               {days}
//             </div>
//             <div className="text-[10px] text-gray-400">days</div>
//           </div>
//         </div>

//         <div className="mt-3">
//           <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
//             <span>Utilization</span>
//             <span>{Math.min(Math.round((days / maxDays) * 100), 100)}%</span>
//           </div>
//           <LinearProgress
//             variant="determinate"
//             value={Math.min((days / maxDays) * 100, 100)}
//             sx={{
//               height: 4,
//               borderRadius: 2,
//               bgcolor: '#f3f4f6',
//               '& .MuiLinearProgress-bar': {
//                 bgcolor: color,
//                 borderRadius: 2,
//               },
//             }}
//           />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// export default function HrLeaveReportsPage() {
//   const { showSnackbar, showSpinner, hideSpinner } = useUI();
//   const [anniversaries, setAnniversaries] = useState<any[]>([]);
//   const [birthdays, setBirthdays] = useState<any[]>([]);
//   const [resignations, setResignations] = useState<any[]>([]);
//   const [joiners, setJoiners] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
//   const [requests, setRequests] = useState<LeaveRequest[]>([]);

//   useEffect(() => {
//     let isMounted = true;
//     const load = async () => {
//       setLoading(true);
//       showSpinner();
//       try {
//         const [
//           anniversaryResponse,
//           birthdayResponse,
//           resignationResponse,
//           joinerResponse,
//           leaveTypeResponse,
//           leaveRequestResponse,
//         ]:any = await Promise.all([
//           leaveService.getUpcomingWorkAnniversaries({ daysAhead: 30, limit: 10 }),
//           leaveService.getUpcomingBirthdays({ daysAhead: 30, limit: 10 }),
//           leaveService.getRecentResignations({ days: 30, limit: 10 }),
//           leaveService.getRecentJoiners({ days: 30, limit: 10 }),
//           leaveService.getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" }),
//           leaveService.getLeaves({ page: 0, size: 200 }),
//         ]);
//         if (isMounted) {
//           // Extract data from nested structure: response.data.data
//           setAnniversaries(anniversaryResponse.data?.data ?? []);
//           setBirthdays(birthdayResponse.data?.data ?? []);
//           setResignations(resignationResponse.data?.data ?? []);
//           setJoiners(joinerResponse.data?.data ?? []);
//           setLeaveTypes(leaveTypeResponse.data?.content ?? []);
//           setRequests(leaveRequestResponse.data?.content ?? []);
//         }
//       } catch (err: any) {
//         if (isMounted) {
//           showSnackbar(err?.message || "Failed to load reports", "error");
//         }
//       } finally {
//         if (isMounted) {
//           hideSpinner();
//           setLoading(false);
//         }
//       }
//     };
//     load();
//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   const utilization = useMemo(
//     () =>
//       leaveTypes.map((leaveType, index) => ({
//         leaveType,
//         count: requests.filter((request) => request.leaveTypeId === leaveType.id).length,
//         days: requests
//           .filter((request) => request.leaveTypeId === leaveType.id)
//           .reduce((total, request) => total + (request.days || request.totalDays || 0), 0),
//         color: COLORS[index % COLORS.length],
//       })),
//     [leaveTypes, requests],
//   );

//   const totalRequests = requests.length;
//   const totalLeaveDays = utilization.reduce((sum, u) => sum + u.days, 0);
//   const avgDaysPerRequest = totalRequests > 0 ? (totalLeaveDays / totalRequests).toFixed(1) : 0;

//   // Filter out empty/resignation data
//   const hasAnniversaries = anniversaries.length > 0;
//   const hasBirthdays = birthdays.length > 0;
//   const hasJoiners = joiners.length > 0;
//   const hasResignations = resignations.length > 0;
//   const hasAnyData = hasAnniversaries || hasBirthdays || hasJoiners || hasResignations;

//   return (
//     <LeavePageShell
//       group="hr"
//       title="Leave Reports"
//       subtitle="Workforce snapshot and leave-type utilization"
//     >
//       {/* Stats Overview */}
//       {!loading && (
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
//           <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
//             <div className="p-2 bg-blue-50 rounded-full">
//               <People className="text-blue-500" fontSize="small" />
//             </div>
//             <div>
//               <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Requests</div>
//               <div className="text-lg font-bold text-gray-900">{totalRequests}</div>
//             </div>
//           </div>
//           <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
//             <div className="p-2 bg-green-50 rounded-full">
//               <CalendarToday className="text-green-500" fontSize="small" />
//             </div>
//             <div>
//               <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Days</div>
//               <div className="text-lg font-bold text-gray-900">{totalLeaveDays}</div>
//             </div>
//           </div>
//           <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
//             <div className="p-2 bg-purple-50 rounded-full">
//               <TrendingUp className="text-purple-500" fontSize="small" />
//             </div>
//             <div>
//               <div className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Days/Request</div>
//               <div className="text-lg font-bold text-gray-900">{avgDaysPerRequest}</div>
//             </div>
//           </div>
//           <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
//             <div className="p-2 bg-orange-50 rounded-full">
//               <BusinessCenter className="text-orange-500" fontSize="small" />
//             </div>
//             <div>
//               <div className="text-[10px] text-gray-400 uppercase tracking-wider">Leave Types</div>
//               <div className="text-lg font-bold text-gray-900">{leaveTypes.length}</div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Workforce Snapshot */}
//       <div className="mb-4">
//         <div className="flex items-center gap-2 mb-3">
//           <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
//           <h3 className="text-[13px] font-bold text-gray-900">Workforce Snapshot</h3>
//           <span className="text-[10px] text-gray-400 ml-auto">Next 30 days</span>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
//           {hasAnniversaries ? (
//             <SnapshotCard
//               title="Work Anniversaries"
//               icon={WorkHistory}
//               entries={anniversaries}
//               loading={loading}
//               color="#3b82f6"
//               gradient="#3b82f6, #60a5fa"
//               showYears
//             />
//           ) : (
//             <SnapshotCard
//               title="Work Anniversaries"
//               icon={WorkHistory}
//               entries={[]}
//               loading={loading}
//               color="#3b82f6"
//               gradient="#3b82f6, #60a5fa"
//             />
//           )}

//           {hasBirthdays ? (
//             <SnapshotCard
//               title="Birthdays"
//               icon={Cake}
//               entries={birthdays}
//               loading={loading}
//               color="#ec4899"
//               gradient="#ec4899, #f472b6"
//               showDays
//             />
//           ) : (
//             <SnapshotCard
//               title="Birthdays"
//               icon={Cake}
//               entries={[]}
//               loading={loading}
//               color="#ec4899"
//               gradient="#ec4899, #f472b6"
//             />
//           )}

//           {hasJoiners ? (
//             <SnapshotCard
//               title="Recent Joiners"
//               icon={PersonAdd}
//               entries={joiners}
//               loading={loading}
//               color="#10b981"
//               gradient="#10b981, #34d399"
//             />
//           ) : (
//             <SnapshotCard
//               title="Recent Joiners"
//               icon={PersonAdd}
//               entries={[]}
//               loading={loading}
//               color="#10b981"
//               gradient="#10b981, #34d399"
//             />
//           )}

//           {hasResignations ? (
//             <SnapshotCard
//               title="Recent Resignations"
//               icon={PersonRemove}
//               entries={resignations}
//               loading={loading}
//               color="#ef4444"
//               gradient="#ef4444, #f87171"
//             />
//           ) : (
//             <SnapshotCard
//               title="Recent Resignations"
//               icon={PersonRemove}
//               entries={[]}
//               loading={loading}
//               color="#ef4444"
//               gradient="#ef4444, #f87171"
//             />
//           )}
//         </div>
//       </div>

//       {/* Leave Type Utilization */}
//       <div>
//         <div className="flex items-center gap-2 mb-3">
//           <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
//           <h3 className="text-[13px] font-bold text-gray-900">Leave Type Utilization</h3>
//           <Chip 
//             label={`${utilization.length} types`}
//             size="small"
//             className="!h-5 !text-[10px] !bg-blue-50 !text-blue-600"
//           />
//         </div>
//         {loading && (
//           <div className="bg-white border border-gray-200 rounded-xl p-8">
//             <DataState compact type="loading" title="Loading utilization data..." />
//           </div>
//         )}
//         {!loading && utilization.length === 0 && (
//           <div className="bg-white border border-gray-200 rounded-xl p-8">
//             <DataState compact type="empty" title="No utilization data available." />
//           </div>
//         )}
//         {!loading && utilization.length > 0 && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
//             {utilization.map(({ leaveType, count, days, color }) => (
//               <UtilizationCard
//                 key={leaveType.id}
//                 leaveType={leaveType}
//                 count={count}
//                 days={days}
//                 color={color}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </LeavePageShell>
//   );
// }



import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  Button,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  FormControl,
  Select,
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
  CalendarToday,
  People,
  BusinessCenter,
  ArrowForward,
  BarChart,
  PieChart as PieChartIcon,
  Download,
  Print,
  MoreVert,
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
  LeaveType,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import { formatDate } from "../leaveFormatters";

// Color palette
const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#06b6d4"];

// Snapshot Timeline Component
function SnapshotTimeline({
  title,
  icon: Icon,
  entries,
  loading,
  color,
  iconColor,
  showYears = false,
  showDays = false,
}: {
  title: string;
  icon: any;
  entries: any[];
  loading: boolean;
  color: string;
  iconColor: string;
  showYears?: boolean;
  showDays?: boolean;
}) {
  const count = entries.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-300 flex items-center justify-between" style={{ backgroundColor: `${color}08` }}>
        <div className="flex items-center gap-2">
          <Avatar className="!w-6 !h-6" sx={{ bgcolor: `${color}15`, color: iconColor }}>
            <Icon sx={{ fontSize: '14px' }} />
          </Avatar>
          <span className="text-[12px] font-semibold text-gray-700">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            label={loading ? "..." : count}
            size="small"
            className="!h-5 !text-[10px] !font-bold"
            sx={{
              bgcolor: `${color}15`,
              color: iconColor,
              '& .MuiChip-label': { px: 1 }
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
            {entries.slice(0, 5).map((entry, index) => (
              <ListItem
                key={entry.id || index}
                className="!px-4 !py-1.5 hover:bg-gray-50 transition-colors duration-150"
                sx={{ borderBottom: index < Math.min(entries.length, 5) - 1 ? '1px solid #c7c7c755' : 'none' }}
              >
                <ListItemAvatar className="!min-w-0 !mr-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
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
                      {entry.occursOn ? formatDate(entry.occursOn) : formatDate(entry.joiningDate)}
                    </span>
                  }
                // primaryTypographyProps={{ component: 'div' }}
                // secondaryTypographyProps={{ component: 'div' }}
                />
                <div className="flex items-center gap-1">
                  <AccessTime sx={{ fontSize: '12px', color: '#9ca3af' }} />
                  <span className="text-[10px] text-gray-400">
                    {entry.daysFromToday !== undefined
                      ? `${Math.abs(entry.daysFromToday)} days ${entry.daysFromToday < 0 ? 'ago' : 'from now'}`
                      : ''
                    }
                  </span>
                </div>
              </ListItem>
            ))}
            {count > 5 && (
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
            No records found
          </div>
        )}
      </div>
    </div>
  );
}

// Compact Stat Card
function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="!border !border-gray-200 bg-white-50 !rounded-xl !shadow-none hover:!shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}10` }}>
            <Icon sx={{ fontSize: '20px', color }} />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">{title}</div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HrLeaveReportsPage() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [resignations, setResignations] = useState<any[]>([]);
  const [joiners, setJoiners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [viewType, setViewType] = useState('bar');
  const [period, setPeriod] = useState('monthly');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      showSpinner();
      try {
        const [
          anniversaryResponse,
          birthdayResponse,
          resignationResponse,
          joinerResponse,
          leaveTypeResponse,
          leaveRequestResponse,
        ]: any = await Promise.all([
          leaveService.getUpcomingWorkAnniversaries({ daysAhead: 30, limit: 10 }),
          leaveService.getUpcomingBirthdays({ daysAhead: 30, limit: 10 }),
          leaveService.getRecentResignations({ days: 30, limit: 10 }),
          leaveService.getRecentJoiners({ days: 30, limit: 10 }),
          leaveService.getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" }),
          leaveService.getLeaves({ page: 0, size: 200 }),
        ]);
        if (isMounted) {
          setAnniversaries(anniversaryResponse.data?.data ?? []);
          setBirthdays(birthdayResponse.data?.data ?? []);
          setResignations(resignationResponse.data?.data ?? []);
          setJoiners(joinerResponse.data?.data ?? []);
          setLeaveTypes(leaveTypeResponse.data ?? leaveTypeResponse.data?.content ?? []);
          setRequests(leaveRequestResponse.data?.content ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          showSnackbar(err?.message || "Failed to load reports", "error");
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
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Prepare chart data
  const utilizationData = useMemo(() => {
    return leaveTypes.map((leaveType, index) => ({
      name: leaveType.name,
      days: requests
        .filter((request) => request.leaveTypeId === leaveType.id)
        .reduce((total, request) => total + (request.days || request.totalDays || 0), 0),
      count: requests.filter((request) => request.leaveTypeId === leaveType.id).length,
      color: CHART_COLORS[index % CHART_COLORS.length],
    })).filter(item => item.days > 0 || item.count > 0);
  }, [leaveTypes, requests]);

  const pieData = utilizationData.map(item => ({
    name: item.name,
    value: item.days,
    color: item.color,
  }));

  const monthlyTrendData = [
    { month: 'Jan', requests: 12, days: 18 },
    { month: 'Feb', requests: 8, days: 14 },
    { month: 'Mar', requests: 15, days: 22 },
    { month: 'Apr', requests: 10, days: 16 },
    { month: 'May', requests: 13, days: 20 },
    { month: 'Jun', requests: 7, days: 11 },
  ];

  const deptData = [
    { name: 'Engineering', value: 35 },
    { name: 'Sales', value: 25 },
    { name: 'HR', value: 15 },
    { name: 'Finance', value: 15 },
    { name: 'Marketing', value: 10 },
  ];

  const totalRequests = requests.length;
  const totalLeaveDays = utilizationData.reduce((sum, item) => sum + item.days, 0);
  const avgDaysPerRequest = totalRequests > 0 ? (totalLeaveDays / totalRequests).toFixed(1) : 0;

  return (
    <LeavePageShell
      group="hr"
      title="Leave Reports"
      subtitle="Comprehensive analytics and insights on leave patterns"
    >
      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full"></div>
          <span className="text-[12px] font-bold text-gray-400">
            Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="!text-[12px]"
              sx={{ '& .MuiSelect-select': { py: 0.5 } }}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <Button
            startIcon={<Download />}
            size="small"
            className="!text-[11px] !normal-case !text-gray-600 hover:!text-gray-900 !border !border-gray-300 !rounded-lg !px-3"
          >
            Export
          </Button>
          <Button
            startIcon={<Print />}
            size="small"
            className="!text-[11px] !normal-case !text-gray-600 hover:!text-gray-900 !border !border-gray-300 !rounded-lg !px-3"
          >
            Print
          </Button>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            className="!border !border-gray-300 !rounded-lg !p-1.5"
          >
            <MoreVert fontSize="small" className="text-gray-800" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Refresh Data</MenuItem>
            <MenuItem onClick={handleMenuClose}>View Full Report</MenuItem>
            <MenuItem onClick={handleMenuClose}>Schedule Report</MenuItem>
          </Menu>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard
            title="Total Requests"
            value={totalRequests}
            icon={People}
            color="#3b82f6"
          />
          <StatCard
            title="Total Days"
            value={totalLeaveDays}
            icon={CalendarToday}
            color="#10b981"
          />
          <StatCard
            title="Avg Days/Request"
            value={avgDaysPerRequest}
            icon={TrendingUp}
            color="#8b5cf6"
          />
          <StatCard
            title="Leave Types"
            value={leaveTypes.length}
            icon={BusinessCenter}
            color="#f59e0b"
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <Card className="lg:col-span-2 !border !border-gray-200 bg-white-50 !rounded-xl !shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] font-medium text-gray-700">Leave Distribution</div>
                <div className="text-[10px] text-gray-400">Days by leave type</div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="small"
                  variant={viewType === 'bar' ? 'contained' : 'outlined'}
                  onClick={() => setViewType('bar')}
                  className="!min-w-8 !h-7 !p-0 !px-2 !text-[10px] !normal-case"
                >
                  <BarChart fontSize="small" />
                </Button>
                <Button
                  size="small"
                  variant={viewType === 'area' ? 'contained' : 'outlined'}
                  onClick={() => setViewType('area')}
                  className="!min-w-8 !h-7 !p-0 !px-2 !text-[10px] !normal-case"
                >
                  <TrendingUp fontSize="small" />
                </Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              {viewType === 'bar' ? (
                <RechartsBar data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                  <RechartsTooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="days" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBar>
              ) : (
                <AreaChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                  <RechartsTooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="days" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="!border !border-gray-200 bg-white-50 !rounded-xl !shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] font-medium text-gray-700">Distribution</div>
                <div className="text-[10px] text-gray-400">By leave type</div>
              </div>
              <PieChartIcon className="text-gray-400" fontSize="small" />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  layout="vertical"
                  verticalAlign="bottom"
                  align="center"
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workforce Snapshot - New Timeline Design */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-primary rounded-full"></div>
          <h3 className="text-[13px] font-bold text-gray-900">Workforce Snapshot</h3>
          <span className="text-[10px] text-gray-400 ml-auto">Next 30 days</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SnapshotTimeline
            title="Work Anniversaries"
            icon={WorkHistory}
            entries={anniversaries}
            loading={loading}
            color="#3b82f6"
            iconColor="#2563eb"
            showYears
          />
          <SnapshotTimeline
            title="Birthdays"
            icon={Cake}
            entries={birthdays}
            loading={loading}
            color="#ec4899"
            iconColor="#db2777"
            showDays
          />
          <SnapshotTimeline
            title="Recent Joiners"
            icon={PersonAdd}
            entries={joiners}
            loading={loading}
            color="#10b981"
            iconColor="#059669"
          />
          <SnapshotTimeline
            title="Resignations"
            icon={PersonRemove}
            entries={resignations}
            loading={loading}
            color="#ef4444"
            iconColor="#dc2626"
          />
        </div>
      </div>

      {/* Tabs for detailed reports */}
      <Divider className="!my-4" />

      <Tabs
        value={tabValue}
        onChange={(_e, v) => setTabValue(v)}
        className="mb-3"
        sx={{
          '& .MuiTab-root': {
            fontSize: '12px',
            textTransform: 'none',
            minHeight: '32px',
            padding: '4px 16px',
          }
        }}
      >
        <Tab label="Leave Types" className="text-gray-800" />
        <Tab label="Department" className="text-gray-800" />
        <Tab label="Monthly Trend" className="text-gray-800" />
      </Tabs>

      {tabValue === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {utilizationData.map((item, index) => (
            <Card key={index} className="!border bg-white-50 !border-gray-200 !rounded-xl !shadow-none hover:!shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[13px] font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.days} days</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                  <span>{item.count} requests</span>
                  <span>{totalLeaveDays > 0 ? Math.round((item.days / totalLeaveDays) * 100) : 0}% of total</span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={totalLeaveDays > 0 ? (item.days / totalLeaveDays) * 100 : 0}
                  sx={{
                    mt: 1,
                    height: 3,
                    borderRadius: 2,
                    bgcolor: '#f3f4f6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.color,
                      borderRadius: 2,
                    },
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tabValue === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="!border !border-gray-200 bg-white-50 !rounded-xl !shadow-none">
            <CardContent className="p-4">
              <div className="text-[11px] font-medium text-gray-700 mb-3">Department Distribution</div>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBar data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#722828" />
                  <XAxis type="number" fontSize={10} tick={{ fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#9ca3af' }} width={80} />
                  <RechartsTooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  {/* <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} /> */}
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {deptData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </RechartsBar>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="!border !border-gray-200 bg-white-50 !rounded-xl !shadow-none">
            <CardContent className="p-4">
              <div className="text-[11px] font-medium text-gray-700 mb-3">Department Stats</div>
              <div className="space-y-2">
                {deptData.map((dept, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-[12px] text-gray-600 flex-1">{dept.name}</span>
                    <span className="text-[12px] font-medium text-gray-900">{dept.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tabValue === 2 && (
        <Card className="!border !border-gray-200 bg-white-50 !rounded-xl !shadow-none">
          <CardContent className="p-4">
            <div className="text-[11px] font-medium text-gray-700 mb-3">Monthly Trend</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={10} tick={{ fill: '#9ca3af' }} />
                <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                <RechartsTooltip
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="days" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </span>
        <span className="text-[10px] text-gray-400">
          {utilizationData.length} leave types • {totalRequests} total requests • {totalLeaveDays} total days
        </span>
      </div>
    </LeavePageShell>
  );
}

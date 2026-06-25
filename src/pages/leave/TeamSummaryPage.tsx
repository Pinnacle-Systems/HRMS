import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import { useAuth } from "../../auth/authContext";
import { resolveEmployeeIdFromSession } from "../../auth/sessionIdentity";
import DataState from "../../components/DataState";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type {
  LeaveRequest,
  LeaveType,
} from "../../services/modules/leaveTypes";
import LeavePageShell from "./components/LeavePageShell";
import { getLeaveStatusMeta } from "./leaveStatusMeta";
// import {
//   leaveTableBodyCellSx,
//   leaveTableClassName,
//   leaveTableContainerSx,
//   leaveTableHeaderCellClassName,
//   leaveTableHeaderRowSx,
//   leaveTableRowSx,
//   leaveTableSx,
// } from "./components/leaveTableStyles";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
// import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
// import CancelIcon from "@mui/icons-material/Cancel";
// import EventNoteIcon from "@mui/icons-material/EventNote";
// import BeachAccessIcon from "@mui/icons-material/BeachAccess";
// import WorkIcon from "@mui/icons-material/Work";
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { getRowColor } from "../const";

export default function TeamSummaryPage() {
  const theme = useTheme();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const currentManagerEmployeeId = resolveEmployeeIdFromSession(session);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      showSpinner();
      try {
        const [requestResponse, typeResponse]: any = await Promise.all([
          leaveService.getMyManagerLeaveApprovals(
            { page: 0, size: 100, sort: "createdAt,DESC" },
            currentManagerEmployeeId,
          ),
          leaveService.getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" }),
        ]);
        if (isMounted) {
          setRequests(requestResponse.data?.content ?? []);
          setLeaveTypes(typeResponse.data ?? typeResponse.data?.content ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          showSnackbar(err?.message || "Failed to load team summary", "error");
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
  }, [currentManagerEmployeeId]);

  // Calculate statistics with null checks
  const totalRequests = requests?.length ?? 0;
  const totalDays =
    requests?.reduce((total, req) => total + (req?.days ?? 0), 0) ?? 0;
  const pendingRequests =
    requests?.filter((req) => req?.status === "PENDING").length ?? 0;
  const approvedRequests =
    requests?.filter((req) => req?.status === "APPROVED").length ?? 0;
  // const rejectedRequests =
  //   requests?.filter((req) => req?.status === "REJECTED").length ?? 0;
  // const draftRequests =
  //   requests?.filter((req) => req?.status === "DRAFT").length ?? 0;

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (requests && Array.isArray(requests)) {
      requests.forEach((request) => {
        if (request?.status) {
          counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
        }
      });
    }
    return counts;
  }, [requests]);

  const leaveTypeCounts = useMemo(() => {
    if (!leaveTypes || !Array.isArray(leaveTypes)) return [];

    return leaveTypes.map((leaveType) => ({
      leaveType,
      count:
        requests?.filter((request) => request?.leaveTypeId === leaveType?.id)
          .length ?? 0,
      days:
        requests
          ?.filter((request) => request?.leaveTypeId === leaveType?.id)
          .reduce((total, request) => total + (request?.days ?? 0), 0) ?? 0,
    }));
  }, [requests, leaveTypes]);

  // Get status icon
  // const getStatusIcon = (status?: string) => {
  //   switch (status) {
  //     case "PENDING":
  //       return <PendingIcon sx={{ fontSize: 14 }} />;
  //     case "APPROVED":
  //       return <CheckCircleIcon sx={{ fontSize: 14 }} />;
  //     case "REJECTED":
  //       return <CancelIcon sx={{ fontSize: 14 }} />;
  //     case "DRAFT":
  //       return <AssignmentIcon sx={{ fontSize: 14 }} />;
  //     default:
  //       return <AssignmentIcon sx={{ fontSize: 14 }} />;
  //   }
  // };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PENDING":
        return theme.palette.warning.main;
      case "APPROVED":
        return theme.palette.success.main;
      case "REJECTED":
        return theme.palette.error.main;
      case "DRAFT":
        return theme.palette.grey[500];
      default:
        return theme.palette.info.main;
    }
  };

  // Get status bg color
  const getStatusBgColor = (status?: string) => {
    switch (status) {
      case "PENDING":
        return alpha(theme.palette.warning.main, 0.08);
      case "APPROVED":
        return alpha(theme.palette.success.main, 0.08);
      case "REJECTED":
        return alpha(theme.palette.error.main, 0.08);
      case "DRAFT":
        return alpha(theme.palette.grey[500], 0.08);
      default:
        return alpha(theme.palette.info.main, 0.08);
    }
  };

  // Get leave type icon
  // const getLeaveTypeIcon = (code?: string) => {
  //   switch (code) {
  //     case "EL":
  //       return <BeachAccessIcon sx={{ fontSize: 16 }} />;
  //     case "CL":
  //       return <WorkIcon sx={{ fontSize: 16 }} />;
  //     case "SL":
  //       return <AssignmentIcon sx={{ fontSize: 16 }} />;
  //     case "LOP":
  //       return <CalendarTodayIcon sx={{ fontSize: 16 }} />;
  //     default:
  //       return <EventNoteIcon sx={{ fontSize: 16 }} />;
  //   }
  // };

  const StatCard = ({ icon, label, value, color, trend }: any) => (
    <Card
      elevation={0}
      className="border border-gray-200 bg-white-50"
      sx={{
        borderRadius: 3,
        transition: "all 0.3s ease-in-out",
        // background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(color, 0.03)} 100%)`,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 25px ${alpha(color, 0.15)}`,
          borderColor: alpha(color, 0.3),
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-[12px] text-gray-800">{label}</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">
              {value ?? 0}
            </div>
            {trend && (
              <div
                className={`text-[10px] font-medium mt-1 ${trend > 0 ? "text-green-500" : "text-red-400"}`}
              >
                {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last month
              </div>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            }}
          >
            <span style={{ color, fontSize: 24 }}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <LeavePageShell
      group="manager"
      title="Team Summary"
      subtitle="Leave counts and day totals across your team"
    >
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<PeopleIcon />}
            label="Total Requests"
            value={totalRequests}
            color={theme.palette.secondary.main}
            bgColor={alpha(theme.palette.secondary.main, 0.1)}
            trend={12}
          />
          <StatCard
            icon={<TrendingUpIcon />}
            label="Total Days"
            value={totalDays}
            color={theme.palette.info.main}
            bgColor={alpha(theme.palette.info.main, 0.1)}
            trend={8}
          />
          <StatCard
            icon={<PendingIcon />}
            label="Pending"
            value={pendingRequests}
            color={theme.palette.warning.main}
            bgColor={alpha(theme.palette.warning.main, 0.1)}
            trend={-5}
          />
          <StatCard
            icon={<CheckCircleIcon />}
            label="Approved"
            value={approvedRequests}
            color={theme.palette.success.main}
            bgColor={alpha(theme.palette.success.main, 0.1)}
            trend={15}
          />
        </div>

        {/* Status Breakdown with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* bg-gradient-to-b from-primary to-primary/60 */}
              <div className="w-1 h-6  bg-primary rounded-full" />
              <div>
                <span className="text-[13px] font-semibold text-gray-700">
                  Status Distribution
                </span>
                <span className="ml-2 text-[10px] text-gray-400 font-medium">
                  {requests?.length ?? 0} total requests
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from(statusCounts.entries()).map(([status, count]) => {
              const meta = getLeaveStatusMeta(status);
              const percentage =
                totalRequests > 0 ? (count / totalRequests) * 100 : 0;

              return (
                <div
                  key={status}
                  className="relative group p-4 rounded-2xl border transition-all duration-200 hover:shadow-md"
                  style={{
                    borderColor: alpha(getStatusColor(status), 0.15),
                    backgroundColor: getStatusBgColor(status),
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getStatusColor(status) }}
                      />
                      <span className="text-[11px] font-medium text-gray-600">
                        {meta?.label ?? status}
                      </span>
                    </div>
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: getStatusColor(status) }}
                    >
                      {count}
                    </span>
                  </div>

                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: alpha(getStatusColor(status), 0.1),
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getStatusColor(status),
                        borderRadius: 2,
                      },
                    }}
                  />

                  <div className="mt-1.5 text-[9px] text-gray-400 font-medium">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
            {!loading && statusCounts.size === 0 && (
              <div className="col-span-full">
                <DataState
                  compact
                  type="empty"
                  title="No team leave requests found."
                />
              </div>
            )}
          </div>
        </div>

        {/* Leave Type Breakdown */}
        <div className="!mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <div>
                <span className="text-[13px] font-semibold text-gray-700">
                  Leave Type Distribution
                </span>
                <span className="ml-2 text-[10px] text-gray-400 font-medium">
                  {leaveTypeCounts.filter((item) => item.count > 0).length} active
                  types
                </span>
              </div>
            </div>
          </div>

          <TableContainer className="overflow-auto border border-gray-200 rounded-sm">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell className="!font-semibold ">Leave Type</TableCell>
                  <TableCell align="center" className="!font-semibold">Requests</TableCell>
                  <TableCell align="center" className="!font-semibold">Total Days</TableCell>
                  <TableCell align="center" className="!font-semibold">Avg Days</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading &&
                  leaveTypeCounts
                    .filter(({ count }) => count > 0)
                    .sort((a, b) => b.days - a.days)
                    .map(({ leaveType, count, days }, i) => {
                      const avgDays = count > 0 ? (days / count).toFixed(1) : "0";
                      return (
                        <TableRow
                          key={leaveType?.id ?? Math.random()}
                          sx={getRowColor(i)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3 !py-1">
                              <div>
                                <div className="text-[12px] font-medium text-gray-800">
                                  {leaveType?.name ?? "Unknown"}
                                  <span className="text-[10px] text-gray-500 ml-2">
                                    ({leaveType?.code ?? "N/A"})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell align="center">
                            <span className="font-semibold text-gray-700 text-[12px]">
                              {count}
                            </span>
                          </TableCell>
                          <TableCell align="center">
                            <span className="font-bold text-primary text-[12px]">
                              {days}
                            </span>
                          </TableCell>
                          <TableCell align="center">
                            <span className="text-xs text-gray-500">
                              {avgDays}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <DataState
                        compact
                        type="loading"
                        title="Loading team summary..."
                      />
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  leaveTypeCounts.filter(({ count }) => count > 0).length ===
                  0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <DataState
                          compact
                          type="empty"
                          title="No leave requests found."
                        />
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </LeavePageShell>
  );
}

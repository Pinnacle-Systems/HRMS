import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Tooltip,
  DialogActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Pending from "@mui/icons-material/Pending";
import Warning from "@mui/icons-material/Warning";
import Visibility from "@mui/icons-material/Visibility";
import Schedule from "@mui/icons-material/Schedule";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Email from "@mui/icons-material/Email";
import Business from "@mui/icons-material/Business";
import {
  // normalizeOnboardingAssignmentsResponse,
  onBoardService,
} from "../../../../services/modules/onBoard";
import { useUI } from "../../../../context/Snackbar";
import dayjs from "dayjs";
import { getRowColor } from "../../../const";
import { GlobalPagination } from "../../../../components/GlobalPagination";

interface OnboardingAssignment {
  onboardingId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeEmail: string;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  overallStatus:
    | "IN_PROGRESS"
    | "COMPLETED"
    | "PENDING"
    | "OVERDUE"
    | "SCHEDULED";
  assignedAt: string;
  welcomeEmailSentAt: string | null;
  totalChecklists: number;
  completedChecklists: number;
  overallProgressPercent: number;
  isActive: boolean;
}

interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  taskType: string;
  documentName: string | null;
  sortOrder: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  completedAt: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  notes: string | null;
  required: boolean;
}

interface Checklist {
  id: string;
  checklistId: string;
  checklistName: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  progressPercent: number;
  tasks: Task[];
}

interface OnboardingDetail {
  onboardingId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  employeeEmail: string;
  overallStatus: string;
  dueDate: string | null;
  assignedAt: string;
  completedAt: string | null;
  welcomeEmailSentAt: string | null;
  notes: string | null;
  totalChecklists: number;
  completedChecklists: number;
  overallProgressPercent: number;
  isActive: boolean;
  deactivatedAt: string | null;
  checklists: Checklist[];
}

export const ProgressTracking = () => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [onboardings, setOnboardings] = useState<OnboardingAssignment[]>([]);
  const [selectedOnboarding, setSelectedOnboarding] =
    useState<OnboardingDetail | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [_stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    avgProgress: 0,
  });

  const fetchOnboardings = async () => {
    try {
      showSpinner();
      const response: any = await onBoardService.getAssignments({ size: 100 });
      const content = response.data?.content || response.data || [];
      setOnboardings(content);
      setTotal(response.data.totalElements || 0);

      // Calculate stats from the actual data
      const inProgress = content.filter(
        (o: any) => o.overallStatus === "IN_PROGRESS",
      ).length;
      const completed = content.filter(
        (o: any) => o.overallStatus === "COMPLETED",
      ).length;
      const overdue = content.filter(
        (o: any) => o.overallStatus === "OVERDUE",
      ).length;
      const avgProgress =
        content.length > 0
          ? Math.round(
              content.reduce(
                (sum: number, o: any) => sum + (o.overallProgressPercent || 0),
                0,
              ) / content.length,
            )
          : 0;

      setStats({
        total: content.length,
        inProgress,
        completed,
        overdue,
        avgProgress,
      });
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchOnboardings();
    // const interval = setInterval(fetchOnboardings, 30000);
    // return () => clearInterval(interval);
  }, []);

  const handleViewProgress = async (onboarding: OnboardingAssignment) => {
    setIsDetailsOpen(true);
    if (!onboarding.employeeId) {
      showSnackbar("Cannot load progress: employee id is missing.", "error");
      return;
    }

    try {
      showSpinner();
      const progressRes: any = await onBoardService.getProgress(
        onboarding.employeeId,
      );
      setSelectedOnboarding(progressRes.data);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <CheckCircle className="text-green-500" />;
      case "IN_PROGRESS":
        return <Schedule className="text-blue-500" />;
      case "OVERDUE":
        return <Warning className="text-red-500" />;
      case "PENDING":
        return <Pending className="text-orange-500" />;
      default:
        return <Pending className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "info";
      case "OVERDUE":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      OVERDUE: "Overdue",
      PENDING: "Pending",
      SCHEDULED: "Scheduled",
    };
    return map[status?.toUpperCase()] || status || "—";
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <CheckCircle className="!text-green-500 text-sm" />;
      case "IN_PROGRESS":
        return <Schedule className="text-blue-500 text-sm" />;
      case "OVERDUE":
        return <Warning className="text-red-500 text-sm" />;
      default:
        return <Pending className="!text-gray-400 text-sm" />;
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  return (
    <div className="py-4 pb-0 bg-gray-50">
      <div className="mb-6">
        <Typography variant="h4" className="font-bold text-gray-800">
          Onboarding Progress Tracking
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Track and monitor employee onboarding progress
        </Typography>
      </div>

      {/* Stats Cards */}
      {/* <Grid container spacing={3} className="mb-6">
        <Grid size={{xs:12,sm:6,md:2}}>
          <Card className="!bg-gradient-to-r !from-blue-100 !to-blue-300 shadow-lg">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.total}</Typography>
                  <Typography variant="body2" className="opacity-80">Total Onboardings</Typography>
                </div>
                <TaskAlt fontSize="large" className="text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12,sm:6,md:2}}>
          <Card className="!bg-gradient-to-r !from-yellow-100 !to-yellow-300  shadow-lg">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.inProgress}</Typography>
                  <Typography variant="body2" className="opacity-80">In Progress</Typography>
                </div>
                <Schedule fontSize="large" className="text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12,sm:6,md:2}}>
          <Card className="!bg-gradient-to-r !from-green-100 !to-green-300 shadow-lg">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.completed}</Typography>
                  <Typography variant="body2" >Completed</Typography>
                </div>
                <CheckCircle fontSize="large" className="text-green-500" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12,sm:6,md:2}}>
          <Card className="!bg-gradient-to-r !from-red-100 !to-red-300 shadow-lg">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.overdue}</Typography>
                  <Typography variant="body2" className="opacity-80">Overdue</Typography>
                </div>
                <Cancel fontSize="large" className="text-red-500" />
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12,sm:6,md:2}}>
          <Card className="!bg-gradient-to-r !from-purple-100 !to-purple-300 shadow-lg">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h3" className="font-bold">{stats.avgProgress}%</Typography>
                  <Typography variant="body2" className="opacity-80">Avg Progress</Typography>
                </div>
                <TrendingUp fontSize="large" className="text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Onboarding List */}
      {/* <Paper className="shadow-lg rounded-lg overflow-hidden"> */}
        <TableContainer className="h-[calc(100vh-335px)] overflow-auto">
          <Table className="border border-gray-200 rounded-md">
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell className="font-semibold">#</TableCell>
                <TableCell className="font-semibold">Employee</TableCell>
                <TableCell className="font-semibold">Department</TableCell>
                <TableCell className="font-semibold">Branch</TableCell>
                <TableCell className="font-semibold">Status</TableCell>
                <TableCell className="font-semibold">Progress</TableCell>
                <TableCell className="font-semibold">Checklists</TableCell>
                <TableCell className="font-semibold">Assigned At</TableCell>
                <TableCell className="font-semibold text-center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {onboardings.map((onboarding, index) => {
                const progress = onboarding.overallProgressPercent || 0;
                const statusDisplay = getStatusDisplay(
                  onboarding.overallStatus,
                );
                const statusColor = getStatusColor(onboarding.overallStatus);
                // const isActive = onboarding.isActive;

                return (
                  <TableRow
                    key={onboarding.onboardingId || index}
                    sx={getRowColor(index)}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="!w-8 !h-8 !bg-primary">
                          {onboarding.employeeName?.charAt(0) || "?"}
                        </Avatar>
                        <div>
                          <div className="text-gray-800">
                            {onboarding.employeeName || "—"} <span className="text-[10px] text-gray-500">({onboarding.employeeCode || "—"})</span>
                          </div>
                         
                          <div className="text-[10px] text-primary flex items-center gap-1">
                            {/* <EmailOutlined className="text-[12px]" />{" "} */}
                            {onboarding.employeeEmail || "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={onboarding.departmentName || "—"}
                        size="small"
                        variant="outlined"
                        className="text-gray-800"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={onboarding.branchName || "—"}
                        size="small"
                        variant="outlined"
                        className="text-gray-800"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* {getStatusIcon(onboarding.overallStatus)} */}
                        <Chip
                          label={statusDisplay}
                          size="small"
                          color={statusColor}
                          variant={
                            statusDisplay === "Completed"
                              ? "filled"
                              : "outlined"
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[120px]">
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="font-medium">{progress}%</span>
                          <span className="text-gray-500">
                            {onboarding.completedChecklists || 0}/
                            {onboarding.totalChecklists || 0}
                          </span>
                        </div>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          className="h-2 rounded-full"
                          sx={{
                            backgroundColor: "#e5e7eb",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor:
                                progress === 100
                                  ? "#22c55e"
                                  : progress >= 70
                                    ? "#3b82f6"
                                    : progress >= 40
                                      ? "#f59e0b"
                                      : "#ef4444",
                            },
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[12px] text-center">
                        <div className="font-medium">
                          {onboarding.totalChecklists || 0}
                        </div>
                        {/* <div className="text-xs text-gray-500">Total Checklists</div> */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div >
                        <div>
                          {onboarding.assignedAt
                            ? dayjs(onboarding.assignedAt).format("DD MMM YYYY hh:mm a")
                            : "—"}
                        </div>
                        {/* <div className="text-[10px] text-gray-500">
                          {onboarding.assignedAt
                            ? dayjs(onboarding.assignedAt).format("hh:mm A")
                            : ""}
                        </div> */}
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Progress Details">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleViewProgress(onboarding)}
                          className="!border-primary !text-primary hover:!bg-primary hover:!text-white"
                          sx={{ textTransform: "none" }}
                        >
                          View Details
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      {/* </Paper> */}

      {/* Progress Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle className="border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar className="!w-12 !h-12 !bg-primary">
                {selectedOnboarding?.employeeName?.charAt(0) || "?"}
              </Avatar>
              <div>
                <Typography variant="h5" className="font-bold text-gray-800">
                  {selectedOnboarding?.employeeName || "—"}
                </Typography>
                <Typography className="flex items-center gap-2 text-gray-500">
                  <span>{selectedOnboarding?.employeeCode || "—"}</span>
                  <span className="text-gray-300">|</span>
                  <Email className="text-sm" />{" "}
                  {selectedOnboarding?.employeeEmail || "—"}
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                label={getStatusDisplay(
                  selectedOnboarding?.overallStatus || "",
                )}
                color={getStatusColor(selectedOnboarding?.overallStatus || "")}
                className="font-medium"
              />
              <Chip
                label={selectedOnboarding?.isActive ? "Active" : "Inactive"}
                size="small"
                color={selectedOnboarding?.isActive ? "success" : "default"}
                variant="outlined"
              />
            </div>
          </div>
        </DialogTitle>
        <DialogContent className="!pt-4">
          {selectedOnboarding && (
            <div className="space-y-4">
              {/* Employee Info Cards */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card className="!bg-blue-50 !border !border-blue-100">
                    <CardContent className="flex items-center gap-2">
                      <Business className="text-blue-500" />
                      <div>
                        <Typography variant="caption" color="textSecondary">
                          Department
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {selectedOnboarding.checklists?.[0]?.checklistName ||
                            "—"}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card className="!bg-green-50 !border !border-green-100">
                    <CardContent className="flex items-center gap-2">
                      <CheckCircle className="text-green-500" />
                      <div>
                        <Typography variant="caption" color="textSecondary">
                          Completed Checklists
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {selectedOnboarding.completedChecklists || 0}/
                          {selectedOnboarding.totalChecklists || 0}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card className="!bg-purple-50 !border !border-purple-100">
                    <CardContent className="flex items-center gap-2">
                      <TrendingUp className="text-purple-500" />
                      <div>
                        <Typography variant="caption" color="textSecondary">
                          Overall Progress
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {selectedOnboarding.overallProgressPercent || 0}%
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Overall Progress */}
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent>
                  <div className="mb-2 flex justify-between items-center">
                    <Typography
                      variant="body1"
                      className="font-semibold text-gray-800"
                    >
                      Overall Progress
                    </Typography>
                    <Typography variant="h5" className="font-bold text-primary">
                      {selectedOnboarding.overallProgressPercent || 0}%
                    </Typography>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={selectedOnboarding.overallProgressPercent || 0}
                    className="h-3 rounded-full"
                    sx={{
                      backgroundColor: "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          (selectedOnboarding.overallProgressPercent || 0) ===
                          100
                            ? "#22c55e"
                            : "#3b82f6",
                      },
                    }}
                  />
                </CardContent>
              </Card>

              {/* Checklists */}
              <Typography variant="h6" className="font-semibold mt-4">
                Checklists & Tasks
              </Typography>

              {selectedOnboarding.checklists?.map((checklist: Checklist) => (
                <Accordion
                  key={checklist.id}
                  className="border border-gray-200 rounded-lg shadow-sm bg-white-50"
                  defaultExpanded={false}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon className="text-gray-800" />}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {getStatusIcon(checklist.status)}
                      <div className="flex-1">
                        <Typography className="font-medium text-gray-800">
                          {checklist.checklistName}
                        </Typography>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          <span>
                            Progress: {checklist.progressPercent || 0}%
                          </span>
                          <span>
                            Tasks: {checklist.completedTasks || 0}/
                            {checklist.totalTasks || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mr-4">
                        <Chip
                          label={getStatusDisplay(checklist.status)}
                          size="small"
                          color={getStatusColor(checklist.status)}
                          variant="outlined"
                        />
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div className="space-y-2">
                      {checklist.tasks?.map((task: Task) => (
                        <Card
                          key={task.id}
                          className={`border-l-4 ${
                            task.status === "COMPLETED"
                              ? "border-l-green-500"
                              : task.status === "IN_PROGRESS"
                                ? "border-l-blue-500"
                                : task.status === "OVERDUE"
                                  ? "border-l-red-500"
                                  : "border-l-gray-300"
                          }`}
                        >
                          <CardContent className="py-2 px-4 bg-head text-gray-800">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getTaskStatusIcon(task.status)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Typography className="font-medium text-sm">
                                    {task.title}
                                  </Typography>
                                  {task.required && (
                                    <Chip
                                      label="Required"
                                      size="small"
                                      color="error"
                                      className="!h-4 !text-xs"
                                    />
                                  )}
                                  {task.taskType && (
                                    <Chip
                                      label={task.taskType}
                                      size="small"
                                      variant="outlined"
                                      className="!h-4 !text-xs text-gray-800"
                                    />
                                  )}
                                </div>
                                {task.description && (
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    className="text-sm mt-1 text-gray-500"
                                  >
                                    {task.description}
                                  </Typography>
                                )}
                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                  {task.documentName && (
                                    <span className="flex items-center gap-1">
                                      📄 {task.documentName}
                                    </span>
                                  )}
                                  {task.status === "COMPLETED" &&
                                    task.completedAt && (
                                      <span className="text-green-600 flex items-center gap-1">
                                        ✅ Completed:{" "}
                                        {dayjs(task.completedAt).format(
                                          "DD MMM YYYY",
                                        )}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button
            onClick={() => setIsDetailsOpen(false)}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

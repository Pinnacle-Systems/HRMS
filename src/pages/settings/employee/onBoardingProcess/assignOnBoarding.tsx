import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Box,
  Typography,
  Tooltip,
  DialogTitle,
  CircularProgress,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  OutlinedInput,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  CloseOutlined,
  MarkEmailUnreadOutlined,
  RestoreOutlined,
  SendOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import dayjs from "dayjs";

import { onBoardService } from "../../../../services/modules/onBoard";
import { useUI } from "../../../../context/Snackbar";
import { getRowColor } from "../../../const";
import { GlobalPagination } from "../../../../components/GlobalPagination";
import { EmployeeSelector } from "../../../../components/PolicyManagement/Common/EmployeeSelector";
import type { OnboardingAssignment, OnboardingDetail } from "./type";

// Constants
const STATUS_MAP = {
  COMPLETED: "success",
  IN_PROGRESS: "info",
  OVERDUE: "error",
  PENDING: "warning",
  SCHEDULED: "info",
} as const;

const STATUS_DISPLAY = {
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
} as const;

const TASK_STATUS_MAP = {
  COMPLETED: "success",
  IN_PROGRESS: "info",
  OVERDUE: "error",
  PENDING: "warning",
} as const;

const TASK_STATUS_DISPLAY = {
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  PENDING: "Pending",
} as const;

type StatusKey = keyof typeof STATUS_MAP;

export const AssignOnboarding = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();

  // State
  const [checklists, setChecklists] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<OnboardingAssignment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState<OnboardingAssignment | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(
    new Set()
  );
  const [onboardingDetail, setOnboardingDetail] =
    useState<OnboardingDetail | null>(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    employeeIds: [] as string[],
    checklistIds: [] as string[],
    startDate: dayjs().format("YYYY-MM-DD"),
    dueDate: "",
    notes: "",
  });

  // Derived data
  const totalAssignments = assignments.length;
  const inProgressAssignments = assignments.filter(
    (a) => a.overallStatus === "IN_PROGRESS"
  ).length;
  const completedAssignments = assignments.filter(
    (a) => a.overallStatus === "COMPLETED"
  ).length;
  const pendingAssignments = assignments.filter(
    (a) => a.overallStatus === "PENDING"
  ).length;
  const overdueAssignments = assignments.filter(
    (a) => a.overallStatus === "OVERDUE"
  ).length;

  const unsentAssignments = assignments.filter((a) => !a.welcomeEmailSentAt);
  const isAllSelected =
    unsentAssignments.length > 0 &&
    unsentAssignments.every((a) => selectedAssignments.has(a.onboardingId));
  const isIndeterminate =
    selectedAssignments.size > 0 &&
    selectedAssignments.size < unsentAssignments.length;

  // API calls
  const fetchData = async () => {
    try {
      showSpinner();
      const params: any = {
        page,
        size: limit,
        includeInactive: true,
      };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const [checklistsResult, assignmentsResult] = await Promise.allSettled([
        onBoardService.getChecklists(),
        onBoardService.getAssignments(params),
      ]);

      if (checklistsResult.status === "fulfilled") {
        const checklistsRes: any = checklistsResult.value;
        setChecklists(checklistsRes.data?.content || checklistsRes.data || []);
      }

      if (assignmentsResult.status === "fulfilled") {
        const responseData: any = assignmentsResult.value;
        const content = responseData.data?.content || responseData.data || [];
        setAssignments(content);
        setTotal(responseData.data?.totalElements || 0);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  // Effects
  useEffect(() => {
    fetchData();
  }, [page, limit, statusFilter]);

  // Handlers
  const handleSelectAssignment = (onboardingId: string) => {
    setSelectedAssignments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(onboardingId)) {
        newSet.delete(onboardingId);
      } else {
        newSet.add(onboardingId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allUnsentSelected = unsentAssignments.every((a) =>
      selectedAssignments.has(a.onboardingId)
    );
    if (allUnsentSelected) {
      setSelectedAssignments(new Set());
    } else {
      const unsentIds = unsentAssignments.map((a) => a.onboardingId);
      setSelectedAssignments(new Set(unsentIds));
    }
  };

  const handleStatusFilterClick = (status: string) => {
    setStatusFilter(status);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleOpenBulkAssign = () => {
    const selectedEmployeeIds = Array.from(selectedAssignments)
      .map((id) => assignments.find((a) => a.onboardingId === id)?.employeeId)
      .filter((id): id is string => !!id);

    if (selectedEmployeeIds.length === 0) {
      showSnackbar("No employees selected", "error");
      return;
    }

    const selectedEmployeesList = assignments
      .filter((a) => selectedAssignments.has(a.onboardingId))
      .map((a) => ({
        id: a.employeeId,
        name: a.employeeName,
        email: a.employeeEmail,
        code: a.employeeCode,
      }))
      .filter((emp): emp is any => !!emp.id);

    setSelectedEmployees(selectedEmployeesList);
    setFormData({
      ...formData,
      employeeIds: selectedEmployeeIds,
    });
    setIsBulkAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    const employeeIds =
      formData.employeeIds.length > 0
        ? formData.employeeIds
        : formData.employeeId
        ? [formData.employeeId]
        : [];

    if (employeeIds.length === 0 || formData.checklistIds.length === 0) {
      showSnackbar(
        "Please select employee(s) and at least one checklist",
        "error"
      );
      return;
    }

    try {
      showSpinner();
      const payload = {
        employeeIds,
        checklistIds: formData.checklistIds,
        startDate: formData.startDate,
        ...(formData.dueDate && { dueDate: formData.dueDate }),
        ...(formData.notes && { notes: formData.notes }),
      };

      await onBoardService.bulkAssignOnboarding(payload);

      setIsDialogOpen(false);
      setIsBulkAssignDialogOpen(false);
      setFormData({
        employeeId: "",
        employeeIds: [],
        checklistIds: [],
        startDate: dayjs().format("YYYY-MM-DD"),
        dueDate: "",
        notes: "",
      });
      setSelectedEmployees([]);
      setSelectedAssignments(new Set());
      fetchData();
      showSnackbar(
        `Onboarding assigned to ${employeeIds.length} employee(s) successfully!`,
        "success"
      );
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleBulkSendWelcome = async () => {
    if (selectedAssignments.size === 0) {
      showSnackbar("Please select at least one employee", "error");
      return;
    }

    const selectedEmployeeIds = Array.from(selectedAssignments)
      .map((id) => assignments.find((a) => a.onboardingId === id)?.employeeId)
      .filter((id): id is string => !!id);

    if (selectedEmployeeIds.length === 0) {
      showSnackbar("Selected assignments have no employee IDs", "error");
      return;
    }

    showConfirmDialog({
      title: "Send Welcome Emails",
      message: `Are you sure you want to send welcome emails to ${selectedEmployeeIds.length} selected employee(s)?`,
      confirmText: "Send Emails",
      onConfirm: async () => {
        try {
          setIsBulkSending(true);
          showSpinner();
          await onBoardService.sendWelcomeMessage({
            employeeIds: selectedEmployeeIds,
          });
          showSnackbar(
            `Welcome emails sent to ${selectedEmployeeIds.length} employee(s) successfully!`,
            "success"
          );
          setSelectedAssignments(new Set());
          fetchData();
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          setIsBulkSending(false);
          hideSpinner();
        }
      },
    });
  };

  const handleSendWelcome = async (assignment: OnboardingAssignment) => {
    if (!assignment.employeeId) {
      showSnackbar(
        "Cannot send welcome message: employee id is missing.",
        "error"
      );
      return;
    }

    try {
      showSpinner();
      await onBoardService.sendWelcomeMessage({
        employeeIds: [assignment.employeeId],
      });
      showSnackbar("Welcome message sent successfully!", "success");
      fetchData();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    showConfirmDialog({
      title: "Deactivate Onboarding Assignment",
      message: "Are you sure you want to deactivate this onboarding assignment?",
      confirmText: "Deactivate",
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.deleteEmployeeOnboarding(id);
          fetchData();
          showSnackbar(
            "Onboarding assignment deactivated successfully!",
            "success"
          );
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleReactivateAssignment = async (id: string) => {
    showConfirmDialog({
      title: "Reactivate Onboarding Assignment",
      message:
        "Are you sure you want to reactivate this onboarding assignment?",
      confirmText: "Reactivate",
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.reactivateOnboarding(id);
          fetchData();
          showSnackbar(
            "Onboarding assignment reactivated successfully!",
            "success"
          );
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleViewDetails = async (assignment: OnboardingAssignment) => {
    setSelectedAssignment(assignment);
    setIsDetailsOpen(true);
    setIsLoadingDetail(true);

    if (!assignment.employeeId) {
      showSnackbar("Cannot load progress: employee id is missing.", "error");
      setIsLoadingDetail(false);
      return;
    }

    try {
      showSpinner();
      const progressRes: any = await onBoardService.getProgress(
        assignment.employeeId
      );
      setOnboardingDetail(progressRes.data);
      setSelectedAssignment({ ...assignment, progress: progressRes.data });
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
      setIsLoadingDetail(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    return STATUS_MAP[status as StatusKey] || "default";
  };

  const getStatusDisplay = (status: string): string => {
    return STATUS_DISPLAY[status as keyof typeof STATUS_DISPLAY] || status || "—";
  };

  const calculateProgress = (assignment: OnboardingAssignment): number => {
    return assignment.overallProgressPercent || 0;
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <CheckCircleIcon className="!text-green-700 text-sm" />;
      case "IN_PROGRESS":
        return <PendingIcon className="text-blue-500 text-sm" />;
      case "OVERDUE":
        return <PendingIcon className="text-red-500 text-sm" />;
      default:
        return <PendingIcon className="!text-gray-400 text-sm" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    return TASK_STATUS_MAP[status as keyof typeof TASK_STATUS_MAP] || "default";
  };

  const getTaskStatusDisplay = (status: string) => {
    return (
      TASK_STATUS_DISPLAY[status as keyof typeof TASK_STATUS_DISPLAY] ||
      status ||
      "—"
    );
  };

  const getStatusBadge = (status: string, count: number, label: string) => {
    const colors = {
      ALL: "default",
      IN_PROGRESS: "info",
      COMPLETED: "success",
      OVERDUE: "error",
      PENDING: "warning",
      SCHEDULED: "secondary",
    };
    const isActive = statusFilter === status;

    return (
      <Chip
        label={`${label} (${count})`}
        size="small"
        color={colors[status as keyof typeof colors] as any}
        variant={isActive ? "filled" : "outlined"}
        onClick={() => handleStatusFilterClick(status)}
        className={`cursor-pointer hover:shadow-md transition-all ${
          status === "ALL" ? "text-gray-800 bg-gray-100" : ""
        } ${isActive ? "!font-bold" : ""}`}
      />
    );
  };

  // Render
  return (
    <div className="py-4 pb-0">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-[12px] text-gray-800">Assign Onboarding</div>
          <div className="text-[12px] text-gray-500">
            Manage employee onboarding assignments
          </div>
        </div>
        <div className="flex gap-2">
          {selectedAssignments.size > 0 && (
            <>
              <Button
                variant="contained"
                startIcon={<MarkEmailUnreadOutlined />}
                onClick={handleOpenBulkAssign}
                className="!bg-primary"
              >
                Bulk Assign ({selectedAssignments.size})
              </Button>
              <Button
                variant="contained"
                startIcon={<MarkEmailUnreadOutlined />}
                onClick={handleBulkSendWelcome}
                disabled={isBulkSending}
                className="!bg-primary"
              >
                {isBulkSending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  `Send Welcome (${selectedAssignments.size})`
                )}
              </Button>
            </>
          )}
          <Button
            variant="contained"
            onClick={() => setIsDialogOpen(true)}
            className="!bg-primary"
          >
            Assign New Onboarding
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {getStatusBadge("ALL", totalAssignments, "All")}
        {getStatusBadge("IN_PROGRESS", inProgressAssignments, "In Progress")}
        {getStatusBadge("COMPLETED", completedAssignments, "Completed")}
        {getStatusBadge("PENDING", pendingAssignments, "Pending")}
        {getStatusBadge("OVERDUE", overdueAssignments, "Overdue")}
      </Box>

      {/* Table */}
      <TableContainer className="h-[calc(100vh-370px)] overflow-auto">
        <Table stickyHeader className="border border-gray-200 rounded-md">
          <TableHead>
            <TableRow>
              <TableCell className="!sticky left-0 !z-30">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={handleSelectAll}
                  disabled={unsentAssignments.length === 0}
                  color="primary"
                  className="text-gray-800"
                />
                #
              </TableCell>
              <TableCell className="!font-bold !sticky left-[75px] !z-30">
                Employee
              </TableCell>
              <TableCell className="!font-bold">Department</TableCell>
              <TableCell className="!font-bold">Branch</TableCell>
              <TableCell className="!font-bold">Status</TableCell>
              <TableCell className="!font-bold">Progress</TableCell>
              <TableCell className="!font-bold">Assigned At</TableCell>
              <TableCell className="!font-bold">Welcome Email</TableCell>
              <TableCell
                className="!font-bold !sticky right-0 !z-30"
                align="center"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" className="py-8">
                  <div className="text-gray-500 py-5">No assignments found</div>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment, index) => {
                const progress = calculateProgress(assignment);
                const statusDisplay = getStatusDisplay(assignment.overallStatus);
                const statusColor = getStatusColor(assignment.overallStatus);
                const isSelected = selectedAssignments.has(
                  assignment.onboardingId
                );
                const hasWelcomeSent = !!assignment.welcomeEmailSentAt;

                return (
                  <TableRow
                    key={assignment.onboardingId || assignment.employeeId || index}
                    sx={getRowColor(index)}
                    className={isSelected ? "bg-primary/5" : ""}
                  >
                    <TableCell className="!sticky left-0 !z-20 bg-inherit">
                      <Checkbox
                        checked={isSelected}
                        onChange={() =>
                          handleSelectAssignment(assignment.onboardingId)
                        }
                        disabled={hasWelcomeSent}
                        color="primary"
                        className="text-gray-800"
                      />
                      {index + 1}
                    </TableCell>
                    <TableCell className="!sticky left-[75px] !z-20 bg-inherit">
                      <div className="flex items-center gap-2">
                        <Avatar className="!w-8 !h-8 !bg-primary">
                          {assignment.employeeName?.charAt(0) || "?"}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {assignment.employeeName || "—"}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {assignment.employeeCode || "—"}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {assignment.employeeEmail || "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.departmentName || "N/A"}
                        size="small"
                        variant="outlined"
                        className="text-gray-800"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.branchName || "N/A"}
                        size="small"
                        variant="outlined"
                        className="text-gray-800"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusDisplay}
                        size="small"
                        color={statusColor}
                        variant={
                          assignment.overallStatus === "COMPLETED"
                            ? "filled"
                            : "outlined"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: "80px",
                            bgcolor: "grey.200",
                            borderRadius: 1,
                            height: 8,
                          }}
                        >
                          <Box
                            sx={{
                              width: `${progress}%`,
                              bgcolor:
                                progress === 100
                                  ? "success.main"
                                  : progress >= 70
                                  ? "primary.main"
                                  : progress >= 40
                                  ? "warning.main"
                                  : "error.main",
                              borderRadius: 1,
                              height: 8,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: "35px" }}
                        >
                          {progress}%
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "10px" }}
                      >
                        {assignment.completedChecklists || 0}/
                        {assignment.totalChecklists || 0} checklists
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {assignment.assignedAt
                        ? dayjs(assignment.assignedAt).format("DD MMM YYYY")
                        : "—"}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "10px" }}
                      >
                        {assignment.assignedAt
                          ? dayjs(assignment.assignedAt).format("HH:mm")
                          : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          assignment.welcomeEmailSentAt ? "Sent" : "Not Sent"
                        }
                        size="small"
                        color={
                          assignment.welcomeEmailSentAt ? "success" : "warning"
                        }
                        variant="outlined"
                        sx={{ fontSize: "10px" }}
                      />
                      {assignment.welcomeEmailSentAt && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", fontSize: "10px" }}
                        >
                          {dayjs(assignment.welcomeEmailSentAt).format(
                            "DD MMM YYYY"
                          )}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell
                      align="center"
                      className="!sticky right-0 !z-20 bg-inherit"
                    >
                      <div className="flex gap-1 justify-center">
                        <Tooltip title="View Progress">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(assignment)}
                            color="primary"
                          >
                            <VisibilityOutlined
                              fontSize="small"
                              className="text-primary !w-4"
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Welcome Email">
                          <IconButton
                            size="small"
                            onClick={() => handleSendWelcome(assignment)}
                            color="success"
                            disabled={!!assignment.welcomeEmailSentAt}
                          >
                            <SendOutlined fontSize="small" className="!w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            assignment.isActive
                              ? "Deactivate Assignment"
                              : "Activate Assignment"
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              assignment.isActive
                                ? handleDeleteAssignment(assignment.onboardingId)
                                : handleReactivateAssignment(assignment.onboardingId)
                            }
                            color={assignment.isActive ? "error" : "success"}
                          >
                            {assignment.isActive ? (
                              <DeleteIcon fontSize="small" className="!w-4" />
                            ) : (
                              <RestoreOutlined
                                fontSize="small"
                                className="!w-4"
                              />
                            )}
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {total > 0 && (
        <GlobalPagination
          total={total}
          page={page + 1}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal
        />
      )}

      {/* Assign New Onboarding Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <div className="text-gray-800 ml-4">Assign New Onboarding</div>
          <IconButton onClick={() => setIsDialogOpen(false)}>
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-6 pt-6">
            <EmployeeSelector
              value={selectedEmployees}
              onChange={(value) => {
                const employees = value as any[];
                setSelectedEmployees(employees);
                const employeeIds = employees
                  .map((emp) => emp.id || emp.employeeId)
                  .filter((id) => id);
                setFormData({
                  ...formData,
                  employeeIds,
                  employeeId: employeeIds.length === 1 ? employeeIds[0] : "",
                });
              }}
              multiple
              label="Select Employees"
              placeholder="Search multiple employees..."
            />

            {selectedEmployees.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selectedEmployees.map((emp) => (
                  <Chip
                    key={emp.id}
                    label={emp.name || emp.emailAddress}
                    size="small"
                    className="!bg-primary-50 !text-primary"
                    onDelete={() => {
                      const newEmployees = selectedEmployees.filter(
                        (e) => e.id !== emp.id
                      );
                      setSelectedEmployees(newEmployees);
                      setFormData({
                        ...formData,
                        employeeIds: newEmployees.map((e) => e.id),
                      });
                    }}
                  />
                ))}
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel id="assign-onboarding-checklist-label">
                Select Checklists
              </InputLabel>
              <Select
                labelId="assign-onboarding-checklist-label"
                multiple
                value={formData.checklistIds}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    checklistIds:
                      typeof value === "string" ? value.split(",") : value,
                  });
                }}
                input={<OutlinedInput label="Select Checklists" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const checklist = checklists.find((c) => c.id === value);
                      return (
                        <Chip
                          key={value}
                          label={checklist?.name || value}
                          size="small"
                          className="!bg-primary-50 !text-primary"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {checklists.map((checklist) => (
                  <MenuItem key={checklist.id} value={checklist.id}>
                    <Checkbox
                      checked={formData.checklistIds.indexOf(checklist.id) > -1}
                      className="text-gray-800"
                    />
                    <span className="text-gray-800">
                      {checklist.name} ({checklist.taskCount || 0} tasks)
                    </span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={dayjs(formData.startDate)}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    startDate: dayjs(date)?.format("YYYY-MM-DD") || "",
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date (Optional)"
                value={formData.dueDate ? dayjs(formData.dueDate) : null}
                minDate={
                  formData.startDate ? dayjs(formData.startDate) : undefined
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    dueDate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </div>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button
            onClick={() => setIsDialogOpen(false)}
            className="!text-gray-800 !border-gray-200"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            className="!bg-primary"
            disabled={
              selectedEmployees.length === 0 || formData.checklistIds.length === 0
            }
          >
            Assign to {selectedEmployees.length} Employee
            {selectedEmployees.length > 1 ? "s" : ""}
            {formData.checklistIds.length > 0 &&
              ` with ${formData.checklistIds.length} Checklist${formData.checklistIds.length > 1 ? "s" : ""}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog
        open={isBulkAssignDialogOpen}
        onClose={() => setIsBulkAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <div className="text-gray-800 ml-4">
            Bulk Assign Onboarding ({selectedEmployees.length} Employees)
          </div>
          <IconButton onClick={() => setIsBulkAssignDialogOpen(false)}>
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-6 pt-6">
            <div>
              <Typography variant="subtitle2" className="text-gray-700 !mb-2">
                Selected Employees ({selectedEmployees.length})
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selectedEmployees.map((emp) => (
                  <Chip
                    key={emp.id}
                    label={emp.name || emp.emailAddress}
                    size="small"
                    className="!bg-primary-50 !text-primary"
                  />
                ))}
              </Box>
            </div>

            <FormControl fullWidth>
              <InputLabel id="bulk-assign-checklist-label">
                Select Checklists
              </InputLabel>
              <Select
                labelId="bulk-assign-checklist-label"
                multiple
                value={formData.checklistIds}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    checklistIds:
                      typeof value === "string" ? value.split(",") : value,
                  });
                }}
                input={<OutlinedInput label="Select Checklists" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const checklist = checklists.find((c) => c.id === value);
                      return (
                        <Chip
                          key={value}
                          label={checklist?.name || value}
                          size="small"
                          className="!bg-primary-50 !text-primary"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {checklists.map((checklist) => (
                  <MenuItem key={checklist.id} value={checklist.id}>
                    <Checkbox
                      checked={formData.checklistIds.indexOf(checklist.id) > -1}
                      className="text-gray-800"
                    />
                    <span className="text-gray-800">
                      {checklist.name} ({checklist.taskCount || 0} tasks)
                    </span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={dayjs(formData.startDate)}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    startDate: dayjs(date)?.format("YYYY-MM-DD") || "",
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Due Date (Optional)"
                value={formData.dueDate ? dayjs(formData.dueDate) : null}
                minDate={
                  formData.startDate ? dayjs(formData.startDate) : undefined
                }
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    dueDate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </div>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button
            onClick={() => setIsBulkAssignDialogOpen(false)}
            className="!text-gray-800 !border-gray-200"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            className="!bg-primary"
            disabled={
              selectedEmployees.length === 0 || formData.checklistIds.length === 0
            }
          >
            Assign to {selectedEmployees.length} Employee
            {selectedEmployees.length > 1 ? "s" : ""}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-3">
          <div className="flex items-center gap-2">
            <Avatar className="!w-10 !h-10 !bg-primary">
              {selectedAssignment?.employeeName?.charAt(0) || "?"}
            </Avatar>
            <div>
              <Typography variant="h6" className="font-semibold text-gray-800">
                {selectedAssignment?.employeeName || "—"}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {selectedAssignment?.employeeCode || "—"} •{" "}
                {selectedAssignment?.employeeEmail || "—"}
              </Typography>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              label={getStatusDisplay(selectedAssignment?.overallStatus || "")}
              color={getStatusColor(selectedAssignment?.overallStatus || "")}
              size="small"
            />
            <Chip
              label={selectedAssignment?.isActive ? "Active" : "Inactive"}
              size="small"
              color={selectedAssignment?.isActive ? "success" : "default"}
              variant="outlined"
            />
            <IconButton onClick={() => setIsDetailsOpen(false)}>
              <CloseOutlined className="text-gray-800" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent className="!pt-4">
          {isLoadingDetail ? (
            <Box className="flex justify-center items-center py-12">
              <CircularProgress />
            </Box>
          ) : onboardingDetail ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Card className="!bg-blue-50 !border !border-blue-500">
                    <CardContent className="!py-2 px-3">
                      <Typography variant="caption" color="textSecondary">
                        Overall Progress
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-blue-600"
                      >
                        {onboardingDetail.overallProgressPercent || 0}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Card className="!bg-green-50 !border !border-green-500">
                    <CardContent className="!py-2 px-3">
                      <Typography variant="caption" color="textSecondary">
                        Checklists Completed
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-green-600"
                      >
                        {onboardingDetail.completedChecklists || 0}/
                        {onboardingDetail.totalChecklists || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Card className="!bg-purple-50 !border !border-purple-500">
                    <CardContent className="!py-2 px-3">
                      <Typography variant="caption" color="textSecondary">
                        Assigned At
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {dayjs(onboardingDetail.assignedAt).format(
                          "DD MMM YYYY"
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Card className="!bg-red-50 !border !border-red-500">
                    <CardContent className="!py-2 px-3">
                      <Typography variant="caption" color="textSecondary">
                        Due Date
                      </Typography>
                      <Typography variant="body2">
                        {onboardingDetail.dueDate
                          ? dayjs(onboardingDetail.dueDate).format(
                              "DD MMM YYYY"
                            )
                          : "Not set"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                  <Card className="!bg-amber-50 !border !border-amber-500">
                    <CardContent className="!py-2 px-3">
                      <Typography variant="caption" color="textSecondary">
                        Completed At
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {onboardingDetail.completedAt
                          ? dayjs(onboardingDetail.completedAt).format(
                              "DD MMM YYYY HH:mm"
                            )
                          : "Not completed yet"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Overall Progress Bar */}
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent>
                  <div className="flex justify-between items-center mb-1">
                    <Typography
                      variant="body2"
                      className="font-medium text-gray-800"
                    >
                      Overall Progress
                    </Typography>
                    <Typography
                      variant="body2"
                      className="font-bold text-gray-800"
                    >
                      {onboardingDetail.overallProgressPercent || 0}%
                    </Typography>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={onboardingDetail.overallProgressPercent || 0}
                    className="h-2 rounded-full"
                    sx={{
                      backgroundColor: "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          (onboardingDetail.overallProgressPercent || 0) === 100
                            ? "#1a9246"
                            : "#3b82f6",
                      },
                    }}
                  />
                </CardContent>
              </Card>

              {/* Checklists and Tasks */}
              <Typography variant="subtitle1" className="font-semibold mt-2">
                Checklists & Tasks
              </Typography>

              {onboardingDetail.checklists?.map((checklist, index) => (
                <Accordion
                  key={checklist.id || checklist.checklistId || index}
                  className="border border-gray-200 !bg-white-50 rounded-lg shadow-sm"
                  defaultExpanded={false}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon className="text-gray-800" />}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {getTaskStatusIcon(checklist.status)}
                      <div className="flex-1">
                        <Typography className="font-medium text-gray-800">
                          {checklist.checklistName}
                        </Typography>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            Progress: {checklist.progressPercent || 0}%
                          </span>
                          <span>
                            Tasks: {checklist.completedTasks || 0}/
                            {checklist.totalTasks || 0}
                          </span>
                          <Chip
                            label={getTaskStatusDisplay(checklist.status)}
                            size="small"
                            color={getTaskStatusColor(checklist.status)}
                            variant="outlined"
                            className="!h-5 !text-[10px]"
                          />
                        </div>
                      </div>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={checklist.progressPercent || 0}
                          className="h-1.5 rounded-full"
                        />
                      </Box>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer className="border border-gray-200 rounded-lg">
                      <Table size="small">
                        <TableHead className="bg-gray-50">
                          <TableRow>
                            <TableCell className="font-semibold text-xs">
                              #
                            </TableCell>
                            <TableCell className="font-semibold text-xs">
                              Task
                            </TableCell>
                            <TableCell className="font-semibold text-xs">
                              Type
                            </TableCell>
                            <TableCell className="font-semibold text-xs">
                              Document
                            </TableCell>
                            <TableCell className="font-semibold text-xs">
                              Status
                            </TableCell>
                            <TableCell className="font-semibold text-xs">
                              Completed At
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {checklist.tasks?.map((task, taskIndex) => (
                            <TableRow
                              key={task.id || task.taskId || taskIndex}
                              sx={getRowColor(taskIndex)}
                            >
                              <TableCell>{taskIndex + 1}</TableCell>
                              <TableCell>
                                <div>
                                  <Typography
                                    variant="body2"
                                    className="font-medium"
                                  >
                                    {task.title}{" "}
                                    {task.required && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </Typography>
                                  {task.description && (
                                    <Typography
                                      variant="caption"
                                      className="text-gray-500 block"
                                    >
                                      {task.description}
                                    </Typography>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={task.taskType || "CUSTOM"}
                                  size="small"
                                  variant="outlined"
                                  className="!h-5 !text-[10px] text-gray-800"
                                />
                              </TableCell>
                              <TableCell>
                                {task.documentName ? (
                                  <Chip
                                    label={task.documentName}
                                    size="small"
                                    variant="outlined"
                                    className="!h-5 !text-[10px] text-gray-800"
                                  />
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={getTaskStatusDisplay(task.status)}
                                  size="small"
                                  color={getTaskStatusColor(task.status)}
                                  variant={
                                    task.status === "COMPLETED"
                                      ? "filled"
                                      : "outlined"
                                  }
                                  className="!h-5 !text-[10px]"
                                />
                              </TableCell>
                              <TableCell>
                                {task.completedAt ? (
                                  <Typography
                                    variant="caption"
                                    className="text-gray-800"
                                  >
                                    {dayjs(task.completedAt).format(
                                      "DD MMM YYYY HH:mm"
                                    )}
                                  </Typography>
                                ) : (
                                  <Typography
                                    variant="caption"
                                    className="text-gray-400"
                                  >
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!checklist.tasks || checklist.tasks.length === 0) && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                align="center"
                                className="py-4 text-gray-400"
                              >
                                No tasks in this checklist
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}

              {(!onboardingDetail.checklists ||
                onboardingDetail.checklists.length === 0) && (
                <Card className="bg-gray-50 border border-gray-200 border-dashed">
                  <CardContent className="text-center py-8">
                    <Typography variant="body2" color="textSecondary">
                      No checklists assigned yet
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Box className="text-center py-12">
              <Typography variant="body1" color="textSecondary">
                No detailed progress information available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="!p-3 border-t border-gray-200">
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
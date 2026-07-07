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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import { onBoardService } from "../../../../services/modules/onBoard";
import type { EmployeeSummaryResponse } from "../../../../services/modules/employees";
import { useUI } from "../../../../context/Snackbar";
import EmployeeAsyncCombobox from "../../../../components/employees/EmployeeAsyncCombobox";
import dayjs from "dayjs";
import {
  CloseOutlined,
  MarkEmailUnreadOutlined,
  RestoreOutlined,
  SendOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { getRowColor } from "../../../const";
import { GlobalPagination } from "../../../../components/GlobalPagination";
import type { OnboardingAssignment } from "./type";

export const AssignOnboarding = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<OnboardingAssignment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<OnboardingAssignment | null>(null);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSummaryResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [formData, setFormData] = useState({
    employeeId: "",
    checklistId: "",
    startDate: dayjs().format("YYYY-MM-DD"),
  });

  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(
    new Set(),
  );
  const [isBulkSending, setIsBulkSending] = useState(false);

  const totalAssignments = assignments.length;
  const inProgressAssignments = assignments.filter(
    (a) => a.overallStatus === "IN_PROGRESS",
  ).length;
  const completedAssignments = assignments.filter(
    (a) => a.overallStatus === "COMPLETED",
  ).length;
  const pendingAssignments = assignments.filter(
    (a) => a.overallStatus === "PENDING",
  ).length;
  const overdueAssignments = assignments.filter(
    (a) => a.overallStatus === "OVERDUE",
  ).length;

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
        setTotal(responseData.data.totalElements || 0);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, statusFilter]);

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
    const unsentAssignments = assignments.filter((a) => !a.welcomeEmailSentAt);
    const allUnsentSelected = unsentAssignments.every((a) =>
      selectedAssignments.has(a.onboardingId),
    );
    if (allUnsentSelected) {
      setSelectedAssignments(new Set());
    } else {
      const unsentIds = unsentAssignments.map((a) => a.onboardingId);
      setSelectedAssignments(new Set(unsentIds));
    }
  };

  const handleBulkSendWelcome = async () => {
    if (selectedAssignments.size === 0) {
      showSnackbar("Please select at least one employee", "error");
      return;
    }

    // Get selected employee IDs
    const selectedEmployeeIds = assignments
      .filter((a) => selectedAssignments.has(a.onboardingId))
      .map((a) => a.employeeId)
      .filter((id) => id); // Filter out any null/undefined

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
          const payload = {
            employeeIds: selectedEmployeeIds,
          };
          await onBoardService.sendWelcomeMessage(payload);
          showSnackbar(
            `Welcome emails sent to ${selectedEmployeeIds.length} employee(s) successfully!`,
            "success",
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

  const handleAssign = async () => {
    if (!formData.employeeId || !formData.checklistId) {
      showSnackbar("Please select employee and checklist", "error");
      return;
    }
    try {
      showSpinner();
      await onBoardService.assignOnboarding(formData);
      setIsDialogOpen(false);
      setFormData({
        employeeId: "",
        checklistId: "",
        startDate: dayjs().format("YYYY-MM-DD"),
      });
      setSelectedEmployee(null);
      fetchData();
      showSnackbar("Onboarding assigned successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    showConfirmDialog({
      title: "Deactivate Onboarding Assignment",
      message:
        "Are you sure you want to deactivate this onboarding assignment?",
      confirmText: "Deactivate",
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.deleteEmployeeOnboarding(id);
          fetchData();
          showSnackbar(
            "Onboarding assignment deactivated successfully!",
            "success",
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
            "success",
          );
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleSendWelcome = async (assignment: OnboardingAssignment) => {
    if (!assignment.employeeId) {
      showSnackbar(
        "Cannot send welcome message: employee id is missing.",
        "error",
      );
      return;
    }
    try {
      showSpinner();
      const payload = { employeeIds: [assignment.employeeId] };
      await onBoardService.sendWelcomeMessage(payload);
      showSnackbar("Welcome message sent successfully!", "success");
      fetchData();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleViewDetails = async (assignment: OnboardingAssignment) => {
    setSelectedAssignment(assignment);
    setIsDetailsOpen(true);
    if (!assignment.employeeId) {
      showSnackbar("Cannot load progress: employee id is missing.", "error");
      return;
    }
    try {
      showSpinner();
      const progressRes: any = await onBoardService.getProgress(
        assignment.employeeId,
      );
      setSelectedAssignment({ ...assignment, progress: progressRes.data });
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleStatusFilterClick = (status: string) => {
    setStatusFilter(status);
    setPage(0);
  };

  // Get status chip color based on overallStatus
  const getStatusColor = (
    status: string,
  ): "success" | "info" | "error" | "warning" | "default" => {
    const statusMap: Record<
      string,
      "success" | "info" | "error" | "warning" | "default"
    > = {
      COMPLETED: "success",
      IN_PROGRESS: "info",
      OVERDUE: "error",
      PENDING: "warning",
      SCHEDULED: "info",
    };
    return statusMap[status] || "default";
  };

  // Get formatted status display text
  const getStatusDisplay = (status: string): string => {
    const statusMap: Record<string, string> = {
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      OVERDUE: "Overdue",
      PENDING: "Pending",
      SCHEDULED: "Scheduled",
    };
    return statusMap[status] || status || "—";
  };

  // Calculate progress from API response
  const calculateProgress = (assignment: OnboardingAssignment): number => {
    return assignment.overallProgressPercent || 0;
  };

  // Get status badge with count
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
        className={`cursor-pointer hover:shadow-md transition-all ${status == 'ALL' ? 'text-gray-800 bg-gray-100' : ''} ${isActive ? "!font-bold" : ""}`}
      />
    );
  };

  // const getSelectedChecklist = () => {
  //   return checklists.find((c) => c.id === formData.checklistId);
  // };

  // const getSelectedEmployee = () => {
  //   return selectedEmployee;
  // };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const unsentAssignments = assignments.filter((a) => !a.welcomeEmailSentAt);
  const isAllSelected =
    unsentAssignments.length > 0 &&
    unsentAssignments.every((a) => selectedAssignments.has(a.onboardingId));
  const isIndeterminate =
    selectedAssignments.size > 0 &&
    selectedAssignments.size < unsentAssignments.length;

  return (
    <div className="py-4 pb-0">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-[12px] text-gray-800">Assign Onboarding</div>
          <div className="text-[12px] text-gray-500">
            Manage employee onboarding assignments
          </div>
        </div>
        <div className="flex gap-2">
          {/* Bulk Email Button */}
          {selectedAssignments.size > 0 && (
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

      {/* Stats Cards */}
      {/* <Grid container spacing={3} className="mb-6">
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent className='bg-white'>
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{totalAssignments}</div>
                <div className="text-[12px] text-gray-600">Total</div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent className='bg-white'>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{inProgressAssignments}</div>
                <div className="text-[12px] text-gray-600">In Progress</div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent className='bg-white'>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{completedAssignments}</div>
                <div className="text-[12px] text-gray-600">Completed</div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent className='bg-white'>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{pendingAssignments}</div>
                <div className="text-[12px] text-gray-600">Pending</div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card>
            <CardContent className='bg-white'>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{overdueAssignments}</div>
                <div className="text-[12px] text-gray-600">Overdue</div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Status Filter Chips */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {getStatusBadge("ALL", totalAssignments, "All")}
        {getStatusBadge("IN_PROGRESS", inProgressAssignments, "In Progress")}
        {getStatusBadge("COMPLETED", completedAssignments, "Completed")}
        {getStatusBadge("PENDING", pendingAssignments, "Pending")}
        {getStatusBadge("OVERDUE", overdueAssignments, "Overdue")}
      </Box>

      {/* Assignments Table */}
      <TableContainer className="h-[calc(100vh-370px)] overflow-auto">
        <Table stickyHeader className="border border-gray-200 rounded-md">
          <TableHead>
            <TableRow>
              <TableCell>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={handleSelectAll}
                  disabled={unsentAssignments.length === 0}
                  color="primary"
                />#
              </TableCell>
              {/* <TableCell className="!font-bold ">#</TableCell> */}
              <TableCell className="!font-bold ">Employee</TableCell>
              <TableCell className="!font-bold ">Department</TableCell>
              <TableCell className="!font-bold ">Branch</TableCell>
              <TableCell className="!font-bold ">Status</TableCell>
              <TableCell className="!font-bold ">Progress</TableCell>
              <TableCell className="!font-bold ">Assigned At</TableCell>
              <TableCell className="!font-bold ">Welcome Email</TableCell>
              <TableCell className="!font-bold " align="center">
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
                const statusDisplay = getStatusDisplay(
                  assignment.overallStatus,
                );
                const statusColor = getStatusColor(assignment.overallStatus);
                // const isActive = assignment.isActive;
                const isSelected = selectedAssignments.has(
                  assignment.onboardingId,
                );
                const hasWelcomeSent = !!assignment.welcomeEmailSentAt;
                return (
                  <TableRow
                    key={
                      assignment.onboardingId || assignment.employeeId || index
                    }
                    sx={getRowColor(index)}
                    className={isSelected ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onChange={() =>
                          handleSelectAssignment(assignment.onboardingId)
                        }
                        disabled={hasWelcomeSent}
                        color="primary"
                      />{index + 1}
                    </TableCell>
                    {/* <TableCell>{index + 1}</TableCell> */}
                    <TableCell>
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
                        label={assignment.departmentName || "—"}
                        size="small"
                        variant="outlined"
                        className="text-gray-800"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={assignment.branchName || "—"}
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
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
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
                      {assignment.welcomeEmailSentAt ? (
                        <Chip
                          label="Sent"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontSize: "10px" }}
                        />
                      ) : (
                        <Chip
                          label="Not Sent"
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ fontSize: "10px" }}
                        />
                      )}
                      {assignment.welcomeEmailSentAt && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", fontSize: "10px" }}
                        >
                          {dayjs(assignment.welcomeEmailSentAt).format(
                            "DD MMM YYYY",
                          )}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
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
                            aria-label={`Send welcome to ${assignment.employeeName}`}
                          >
                            <SendOutlined fontSize="small" className="!w-4"/>
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
                                ? handleDeleteAssignment(
                                    assignment.onboardingId,
                                  )
                                : handleReactivateAssignment(
                                    assignment.onboardingId,
                                  )
                            }
                            color={assignment.isActive ? "error" : "success"}
                          >
                            {assignment.isActive ? (
                              <DeleteIcon fontSize="small" color="error" className="!w-4" />
                            ) : (
                              <RestoreOutlined fontSize="small" color="info" className="!w-4" />
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

      {/* Assign Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <div className="text-gray-800 ml-4">Assign New Onboarding</div>
          <IconButton>
            <CloseOutlined
              className="text-gray-800"
              onClick={() => setIsDialogOpen(false)}
            />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-6 pt-6">
            <FormControl fullWidth>
              <EmployeeAsyncCombobox
                value={formData.employeeId}
                selectedEmployee={selectedEmployee}
                label="Select Employee"
                onChange={(employeeId, employee) => {
                  setFormData({ ...formData, employeeId: employeeId || "" });
                  setSelectedEmployee(employee || null);
                }}
                required
              />
            </FormControl>

            {/* {getSelectedEmployee() && (
              <Alert severity="info" className="text-[12px]">
                Assigning to: {getSelectedEmployee()?.name} -{" "}
                {getSelectedEmployee()?.designation}
              </Alert>
            )} */}

            <FormControl fullWidth>
              <InputLabel id="assign-onboarding-checklist-label">
                Select Checklist
              </InputLabel>
              <Select
                labelId="assign-onboarding-checklist-label"
                id="assign-onboarding-checklist"
                value={formData.checklistId}
                label="Select Checklist"
                onChange={(e) =>
                  setFormData({ ...formData, checklistId: e.target.value })
                }
              >
                {checklists.map((checklist) => (
                  <MenuItem key={checklist.id} value={checklist.id}>
                    {checklist.name} ({checklist.taskCount || 0} tasks)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* {getSelectedChecklist() && (
              <Alert severity="info" className="text-[12px]">
                {getSelectedChecklist()?.tasks?.length || 0} tasks to complete
              </Alert>
            )} */}

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
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <div className="text-gray-800 ml-4 text-sm">View Details</div>
          <IconButton onClick={() => setIsDetailsOpen(false)}>
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedAssignment.employeeName || "—"}
                  </h3>
                  <p className="text-[12px] text-gray-600">
                    Code: {selectedAssignment.employeeCode || "—"}
                  </p>
                  <p className="text-[12px] text-gray-600">
                    Email: {selectedAssignment.employeeEmail || "—"}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    Department: {selectedAssignment.departmentName || "—"}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    Branch: {selectedAssignment.branchName || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <Chip
                    label={getStatusDisplay(selectedAssignment.overallStatus)}
                    color={getStatusColor(selectedAssignment.overallStatus)}
                    // icon={getStatusIcon(selectedAssignment.overallStatus)}
                  />
                  <div className="mt-1">
                    <Chip
                      label={
                        selectedAssignment.isActive ? "Active" : "Inactive"
                      }
                      size="small"
                      color={
                        selectedAssignment.isActive ? "success" : "default"
                      }
                      variant="outlined"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-[12px] font-medium">
                    Overall Progress
                  </span>
                  <span className="text-[12px] font-medium">
                    {selectedAssignment.overallProgressPercent || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${selectedAssignment.overallProgressPercent || 0}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 p-2 bg-green-100/40 rounded">
                    <CheckCircleIcon
                      className="text-green-600"
                      fontSize="small"
                    />
                    <div>
                      <span className="text-[12px]">Completed</span>
                      <span className="ml-2 font-semibold">
                        {selectedAssignment.completedChecklists || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-100/40 rounded">
                    <PendingIcon className="text-blue-600" fontSize="small" />
                    <div>
                      <span className="text-[12px]">Total</span>
                      <span className="ml-2 font-semibold">
                        {selectedAssignment.totalChecklists || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-gray-600">Assigned At:</span>
                    <span className="ml-2 font-medium">
                      {selectedAssignment.assignedAt
                        ? dayjs(selectedAssignment.assignedAt).format(
                            "DD MMM YYYY HH:mm",
                          )
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Onboarding ID:</span>
                    <span className="ml-2 font-medium text-xs">
                      {selectedAssignment.onboardingId || "—"}
                    </span>
                  </div>
                  {selectedAssignment.welcomeEmailSentAt && (
                    <div>
                      <span className="text-gray-600">Welcome Email Sent:</span>
                      <span className="ml-2 font-medium">
                        {dayjs(selectedAssignment.welcomeEmailSentAt).format(
                          "DD MMM YYYY HH:mm",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 border-t border-gray-200">
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

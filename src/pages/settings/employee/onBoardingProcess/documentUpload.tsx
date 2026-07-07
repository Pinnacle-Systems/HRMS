import { useState } from "react";
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
  IconButton,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Tooltip,
  Box,
  Avatar,
  Fade,
  Zoom,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachmentIcon from "@mui/icons-material/AttachFile";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import {
  // normalizeAssignedTasksResponse,
  normalizeDocumentsResponse,
  onBoardService,
} from "../../../../services/modules/onBoard";
import type { EmployeeSummaryResponse } from "../../../../services/modules/employees";
import { useUI } from "../../../../context/Snackbar";
import dayjs from "dayjs";
import EmployeeAsyncCombobox from "../../../../components/employees/EmployeeAsyncCombobox";
import { getRowColor } from "../../../const";
import { VisibilityOutlined } from "@mui/icons-material";

interface OnboardingProgress {
  onboardingId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
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
  checklists: any[];
}

export const DocumentsUpload = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSummaryResponse | null>(null);
  const [onboardingProgress, setOnboardingProgress] =
    useState<OnboardingProgress | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    taskInstanceId: "",
    documentType: "",
    remarks: "",
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployeeProgress = async (employeeId: string) => {
    try {
      setIsLoading(true);
      const response: any = await onBoardService.getProgress(employeeId);

      // The response data is a single onboarding progress object
      const progressData = response.data;

      if (progressData) {
        setOnboardingProgress(progressData);
        // Auto-select the onboarding and fetch its tasks and documents
        await handleOnboardingSelect(progressData);
      } else {
        setOnboardingProgress(null);
        setTasks([]);
        setDocuments([]);
        showSnackbar("No active onboarding found for this employee", "warning");
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
      setOnboardingProgress(null);
      setTasks([]);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingSelect = async (progress: OnboardingProgress) => {
    setOnboardingProgress(progress);

    // Fetch tasks from the checklists
    const allTasks: any[] = [];
    if (progress.checklists && progress.checklists.length > 0) {
      progress.checklists.forEach((checklist: any) => {
        if (checklist.tasks && checklist.tasks.length > 0) {
          allTasks.push(...checklist.tasks);
        }
      });
    }
    setTasks(allTasks);

    // Fetch documents
    await fetchDocuments(progress.onboardingId);
  };

  const fetchDocuments = async (onboardingId: string) => {
    try {
      const response: any = await onBoardService.getDocuments(onboardingId);
      setDocuments(normalizeDocumentsResponse(response));
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  const handleEmployeeSelect = async (
    employee: EmployeeSummaryResponse | null,
  ) => {
    setSelectedEmployee(employee);
    setOnboardingProgress(null);
    setDocuments([]);
    setTasks([]);
    if (employee?.id) {
      await fetchEmployeeProgress(employee.id);
    }
  };

  const handleUpload = async () => {
    if (
      !selectedFile ||
      !uploadData.taskInstanceId ||
      !uploadData.documentType
    ) {
      showSnackbar("Please select a file, task, and document type", "error");
      return;
    }
    if (!selectedEmployee?.id) {
      showSnackbar("Cannot upload document: employee id is missing.", "error");
      return;
    }

    try {
      showSpinner();
      await onBoardService.createDocument({
        file: selectedFile,
        taskInstanceId: uploadData.taskInstanceId,
        employeeId: selectedEmployee.id,
        notes: uploadData.remarks,
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({ taskInstanceId: "", documentType: "", remarks: "" });
      if (onboardingProgress) {
        await fetchDocuments(onboardingProgress.onboardingId);
        // Refresh tasks
        await fetchEmployeeProgress(selectedEmployee.id);
      }
      showSnackbar("Document uploaded successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteDocument = async (taskInstanceId?: string) => {
    if (!taskInstanceId) {
      showSnackbar(
        "Cannot delete document: task instance id is missing.",
        "error",
      );
      return;
    }

    showConfirmDialog({
      title: "Delete Document",
      message:
        "Are you sure you want to delete this document? This action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.deleteDocument(taskInstanceId);
          if (onboardingProgress) {
            await fetchDocuments(onboardingProgress.onboardingId);
          }
          showSnackbar("Document deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // const getTaskName = (taskId: string) => {
  //   const task = tasks.find(
  //     (t) => getTaskInstanceId(t) === taskId || t.taskId === taskId,
  //   );
  //   return task?.title || task?.taskName || taskId;
  // };

  const getTaskInstanceId = (task: any) =>
    task.id || task.taskInstanceId || task.taskId || "";

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      OVERDUE: "Overdue",
      PENDING: "Pending",
    };
    return map[status] || status || "—";
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

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<
      string,
      "primary" | "secondary" | "success" | "warning" | "error" | "info"
    > = {
      "ID Proof": "primary",
      "Address Proof": "info",
      Education: "success",
      Experience: "warning",
      Medical: "error",
      Other: "secondary",
    };
    return colors[type] || "default";
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "ID Proof":
        return "🪪";
      case "Address Proof":
        return "🏠";
      case "Education":
        return "🎓";
      case "Experience":
        return "💼";
      case "Medical":
        return "🏥";
      default:
        return "📄";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="py-4 bg-gray-50">
      <div className="mb-6">
        <Typography variant="h4" className="font-bold text-gray-800">
          Onboarding Documents
        </Typography>
        <Typography variant="body2" className="text-gray-800">
          Upload and manage employee onboarding documents
        </Typography>
      </div>

      <Grid container spacing={3}>
        {/* Employee Selection Card */}
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Zoom in={true} style={{ transitionDelay: "100ms" }}>
            <Card className="shadow-lg rounded-xl bg-white text-gray-800 overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PersonIcon className="text-primary" />
                  <Typography variant="subtitle1" className="font-semibold">
                    Select Employee
                  </Typography>
                </div>
                <EmployeeAsyncCombobox
                  value={selectedEmployee?.id || null}
                  selectedEmployee={selectedEmployee}
                  label="Search Employee"
                  placeholder="Search by name or ID..."
                  onChange={(_employeeId, employee) => {
                    void handleEmployeeSelect(employee || null);
                  }}
                />
                {selectedEmployee && (
                  <Fade in={true}>
                    <Box className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary">
                      <div className="flex items-center gap-3">
                        <Avatar className="!bg-primary !w-12 !h-12">
                          {selectedEmployee.name?.charAt(0) || "?"}
                        </Avatar>
                        <div>
                          <Typography variant="body1" className="font-medium">
                            {selectedEmployee.name}
                          </Typography>
                          <Typography variant="caption" className="text-gray-800">
                            ID: {selectedEmployee.employeeId || "—"} •{" "}
                            {selectedEmployee.designation || "—"}
                          </Typography>
                        </div>
                      </div>
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        {/* Onboarding Progress Card */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Zoom in={true} style={{ transitionDelay: "200ms" }}>
            <Card className="shadow-lg rounded-xl bg-white text-gray-800 overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <WorkIcon className="text-primary" />
                  <Typography variant="subtitle1" className="font-semibold">
                    Onboarding Progress
                  </Typography>
                  {onboardingProgress && (
                    <Chip
                      label={`${onboardingProgress.totalChecklists} checklists`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </div>
                {selectedEmployee ? (
                  isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <Typography
                        variant="caption"
                        className="text-gray-800 mt-2 block"
                      >
                        Loading onboarding progress...
                      </Typography>
                    </div>
                  ) : onboardingProgress ? (
                    <div className="space-y-4">
                      <Fade in={true}>
                        <div className="p-4 bg-primary-50 border border-primary text-gray-800 rounded-xl shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <Typography variant="body2" className="font-medium">
                              {onboardingProgress.employeeName}
                            </Typography>
                            <Chip
                              label={getStatusDisplay(
                                onboardingProgress.overallStatus,
                              )}
                              size="small"
                              color={getStatusColor(
                                onboardingProgress.overallStatus,
                              )}
                              className="!h-5 !text-xs"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-gray-800">
                              {onboardingProgress.completedChecklists || 0}/
                              {onboardingProgress.totalChecklists || 0}{" "}
                              checklists
                            </span>
                            <span className="font-semibold">
                              {onboardingProgress.overallProgressPercent || 0}%
                              complete
                            </span>
                          </div>
                          <LinearProgress
                            variant="determinate"
                            value={
                              onboardingProgress.overallProgressPercent || 0
                            }
                            className="h-2 mt-2 rounded-full"
                            // sx={{
                            //   backgroundColor: 'rgba(255,255,255,0.3)',
                            //   '& .MuiLinearProgress-bar': {
                            //     backgroundColor: '#ffffff'
                            //   }
                            // }}
                          />
                        </div>
                      </Fade>

                      {/* Checklist Summary */}
                      {onboardingProgress.checklists &&
                        onboardingProgress.checklists.length > 0 && (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            <Typography
                              variant="caption"
                              
                              className="text-gray-800 block mb-2"
                            >
                              Checklist Details
                            </Typography>
                            {onboardingProgress.checklists.map(
                              (checklist, index) => (
                                <Zoom
                                  key={checklist.id || index}
                                  in={true}
                                  style={{
                                    transitionDelay: `${50 * (index + 1)}ms`,
                                  }}
                                >
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <Typography
                                        variant="body2"
                                        className="font-medium"
                                      >
                                        {checklist.checklistName}
                                      </Typography>
                                      <Chip
                                        label={getStatusDisplay(
                                          checklist.status,
                                        )}
                                        size="small"
                                        color={getStatusColor(checklist.status)}
                                        className="!h-5 !text-xs"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <Typography
                                        variant="caption"
                                        className="text-gray-800"
                                      >
                                        {checklist.completedTasks || 0}/
                                        {checklist.totalTasks || 0} tasks
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        className="text-gray-800"
                                      >
                                        {checklist.progressPercent || 0}%
                                      </Typography>
                                    </div>
                                    <LinearProgress
                                      variant="determinate"
                                      value={checklist.progressPercent || 0}
                                      className="h-1 mt-1 rounded-full"
                                    />
                                  </div>
                                </Zoom>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <PendingIcon className="text-gray-400 text-4xl mb-2" />
                      <Typography className="text-gray-800" variant="body2">
                        No active onboarding found
                      </Typography>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <PersonIcon className="text-gray-300 text-4xl mb-2" />
                    <Typography className="text-gray-800" variant="body2">
                      Select an employee to view onboarding
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        {/* Documents List Card */}
        <Grid size={{ xs: 12, md: 6.5 }}>
          <Zoom in={true} style={{ transitionDelay: "300ms" }}>
            <Card className="shadow-lg rounded-xl bg-white overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FolderIcon className="text-primary" />
                    <Typography variant="subtitle1" className="font-semibold text-gray-800">
                      Documents
                    </Typography>
                    {onboardingProgress && (
                      <Chip
                        label={`${documents.length} uploaded`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </div>
                  {onboardingProgress && (
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setIsUploadDialogOpen(true)}
                      className="!bg-primary !rounded-full !px-4"
                      size="small"
                    >
                      Upload
                    </Button>
                  )}
                </div>

                {onboardingProgress ? (
                  documents.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto pr-1">
                      <TableContainer
                        className="border border-gray-200 rounded-xl"
                      >
                        <Table size="small">
                          <TableHead className="bg-gray-50">
                            <TableRow>
                              <TableCell className="font-semibold text-xs">
                                Type
                              </TableCell>
                              <TableCell className="font-semibold text-xs">
                                File
                              </TableCell>
                              <TableCell className="font-semibold text-xs text-center">
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {documents.map((doc,i) => (
                              <TableRow
                                key={doc.id || doc.taskInstanceId}
                                sx={getRowColor(i)}
                              >
                                <TableCell>
                                  <Tooltip
                                    title={doc.documentType || "Document"}
                                  >
                                    <Chip
                                      label={`${getDocumentTypeIcon(doc.documentType || "Other")} ${doc.documentType || "Document"}`}
                                      size="small"
                                      color={getDocumentTypeColor(
                                        doc.documentType || "Other",
                                      )}
                                      variant="outlined"
                                      className="!text-xs"
                                    />
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <Typography
                                      variant="caption"
                                      className="font-medium block"
                                    >
                                      {doc.documentName ||
                                        doc.fileName ||
                                        "Untitled"}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      
                                      className="text-[10px] text-gray-800"
                                    >
                                      {doc.fileSize
                                        ? formatFileSize(doc.fileSize)
                                        : ""}
                                      {doc.uploadedAt &&
                                        ` • ${dayjs(doc.uploadedAt).format("DD MMM YYYY")}`}
                                    </Typography>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 justify-center">
                                    <Tooltip title="View/Download">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        href={doc.fileUrl}
                                        target="_blank"
                                        component="a"
                                        className="hover:bg-primary-50"
                                      >
                                        <VisibilityOutlined fontSize="small" className="text-primary"/>
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                          handleDeleteDocument(
                                            doc.taskInstanceId || doc.taskId,
                                          )
                                        }
                                        className="hover:bg-red-50"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DescriptionIcon className="text-gray-300 text-5xl mb-2" />
                      <Typography
                        className="text-gray-800 !mb-2"
                        variant="body2"
                      >
                        No documents uploaded yet
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="!rounded-full"
                        size="small"
                      >
                        Upload First Document
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <FolderIcon className="text-gray-300 text-5xl mb-2" />
                    <Typography className="text-gray-800" variant="body2">
                      Select an employee to view documents
                    </Typography>
                  </div>
                )}
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex justify-between items-center p-2 border-b border-gray-200">
            <Typography variant="h6" className="font-bold text-gray-800 !ml-4">
              Upload Document
            </Typography>
            <IconButton
              onClick={() => setIsUploadDialogOpen(false)}
              className="hover:bg-gray-100"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </div>
        <DialogContent className="p-6">      
          <div className="space-y-6">
            <FormControl fullWidth>
              <InputLabel className="text-gray-600">Select Task</InputLabel>
              <Select
                value={uploadData.taskInstanceId}
                label="Select Task"
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    taskInstanceId: e.target.value,
                  })
                }
                className="rounded-xl"
              >
                {tasks
                  .filter((t) => t.status !== "COMPLETED")
                  .map((task) => (
                    <MenuItem
                      key={getTaskInstanceId(task)}
                      value={getTaskInstanceId(task)}
                      className="text-[12px]"
                    >
                      <div className="flex items-center gap-2">
                        <span>{task.title || task.taskName}</span>
                        <Chip
                          label={getStatusDisplay(task.status)}
                          size="small"
                          color={getStatusColor(task.status)}
                          className="!h-5 !text-[10px]"
                        />
                      </div>
                    </MenuItem>
                  ))}
                {tasks.length === 0 && (
                  <MenuItem disabled>
                    <span className="text-gray-400">No tasks available</span>
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel className="text-gray-600">Document Type</InputLabel>
              <Select
                value={uploadData.documentType}
                label="Document Type"
                onChange={(e) =>
                  setUploadData({ ...uploadData, documentType: e.target.value })
                }
                className="rounded-xl"
              >
                <MenuItem value="ID Proof">
                   ID Proof (Aadhaar, PAN, Passport)
                </MenuItem>
                <MenuItem value="Address Proof"> Address Proof</MenuItem>
                <MenuItem value="Education"> Education Certificate</MenuItem>
                <MenuItem value="Experience"> Experience Letter</MenuItem>
                <MenuItem value="Medical"> Medical Certificate</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Remarks (Optional)"
              multiline
              rows={2}
              value={uploadData.remarks}
              onChange={(e) =>
                setUploadData({ ...uploadData, remarks: e.target.value })
              }
              className="rounded-xl"
              placeholder="Add any additional notes about this document..."
            />

            <div>
              <input
                accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.txt"
                style={{ display: "none" }}
                id="document-upload"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showSnackbar(
                        "File size should be less than 5MB",
                        "error",
                      );
                      return;
                    }
                    setSelectedFile(file);
                  }
                }}
              />
              <label htmlFor="document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<AttachmentIcon />}
                  className={`rounded-xl py-3 border-dashed ${
                    selectedFile
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="text-green-600" />
                      <span className="text-green-700">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  ) : (
                    "Choose File (Max 5MB)"
                  )}
                </Button>
              </label>
              {/* {selectedFile && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => setSelectedFile(null)}
                  className="mt-1"
                >
                  Remove File
                </Button>
              )} */}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 border-t border-gray-200">
          <Button
            onClick={() => setIsUploadDialogOpen(false)}
            className="!text-gray-800 !border-gray-200"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            className="!bg-primary"
            disabled={
              !selectedFile ||
              !uploadData.taskInstanceId ||
              !uploadData.documentType
            }
          >
            Upload Document
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

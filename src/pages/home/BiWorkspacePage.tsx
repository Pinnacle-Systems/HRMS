// pages/BiWorkspace/BiWorkspacePage.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  alpha,
  useTheme,
  Avatar,
  LinearProgress,
  Snackbar,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepButton,
} from "@mui/material";
import {
  Assessment,
  Dashboard,
  Download,
  PlayArrow,
  QueryStats,
  Report,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schema as SchemaIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { dashboardService } from "../../services/modules/dashboard";
import { useUI } from "../../context/Snackbar";
import type {
  BIReportListItem,
  BIReport,
  BIDataset,
  BIDatasetSchema,
  BIExportJob,
  BIExportRequest,
  BIQueryRequest,
  BIQueryResponse,
  CreateBIReportRequest,
  UpdateBIReportRequest,
  BIReportExportRequest,
  BIReportRunRequest,
} from "../../services/modules/dashboard";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, index, value }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ============ Utility Functions ============

const safeDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Complex Object]";
    }
  }
  return String(value);
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "processing":
      return "info";
    case "failed":
      return "error";
    default:
      return "default";
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "✅";
    case "pending":
      return "⏳";
    case "processing":
      return "🔄";
    case "failed":
      return "❌";
    default:
      return "📋";
  }
};

// ============ Main Component ============

export default function BiWorkspacePage() {
  const theme = useTheme();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reports
  const [reports, setReports] = useState<BIReportListItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<BIReport | null>(null);
  const [reportDetailOpen, setReportDetailOpen] = useState(false);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [isEditingReport, setIsEditingReport] = useState(false);

  // Report Form State
  const [reportForm, setReportForm] = useState<CreateBIReportRequest>({
    name: "",
    datasetId: "",
    query: {
      dimensions: [],
      metrics: [],
      limit: 50,
      includeTotals: true,
    },
    visualization: {
      type: "table",
      config: {},
    },
    visibility: "private",
  });

  // Datasets
  const [datasets, setDatasets] = useState<BIDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [datasetSchema, setDatasetSchema] = useState<BIDatasetSchema | null>(null);
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);

  // Query
  const [queryText, setQueryText] = useState(
    JSON.stringify(
      {
        dimensions: ["department"],
        metrics: ["payrollCost"],
        dateRange: {
          field: "payPeriod",
          from: "2026-01",
          to: "2026-04",
          granularity: "month",
        },
        limit: 50,
        includeTotals: true,
      },
      null,
      2
    )
  );
  const [queryResult, setQueryResult] = useState<BIQueryResponse | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null);
  const [validating, setValidating] = useState(false);

  // Exports
  const [exportJob, setExportJob] = useState<BIExportJob | null>(null);
  const [exportJobs, setExportJobs] = useState<BIExportJob[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
//   const [exportPollingInterval, setExportPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");

  // Report Export
  const [reportExportDialogOpen, setReportExportDialogOpen] = useState(false);
  const [reportExportFormat, setReportExportFormat] = useState<"csv" | "xlsx">("csv");
  const [reportExportJob, setReportExportJob] = useState<BIExportJob | null>(null);
  const [reportExportLoading, setReportExportLoading] = useState(false);

  // Pagination for drilldown
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tabs = useMemo(
    () => [
      { label: "Reports", icon: <Report /> },
      { label: "Query Engine", icon: <QueryStats /> },
      { label: "Exports", icon: <Download /> },
      { label: "Datasets", icon: <SchemaIcon /> },
    ],
    []
  );

  // ============ Load Data ============

  const loadWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsResponse, datasetsResponse] = await Promise.all([
        dashboardService.listBIReports(),
        dashboardService.listBIDatasets(),
      ]);

      const reportItems = reportsResponse?.data ?? [];
      const datasetItems = datasetsResponse?.data ?? [];

      setReports(Array.isArray(reportItems) ? reportItems : []);
      setDatasets(Array.isArray(datasetItems) ? datasetItems : []);
      if (datasetItems?.length > 0 && datasetItems[0]?.datasetId) {
        setSelectedDataset(datasetItems[0].datasetId);
      }
    } catch (err) {
      setError("Unable to load BI workspace data right now.");
      console.error("Load workspace error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, []);

  // ============ Reports CRUD ============

  const handleViewReport = async (reportId: string) => {
    showSpinner();
    try {
      const response:any = await dashboardService.getBIReport(reportId);
      const data = response?.data;
      if (data) {
        setSelectedReport(data);
        setReportDetailOpen(true);
      }
    } catch (err) {
      showSnackbar("Failed to load report details", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleCreateReport = async () => {
    // Validate form
    if (!reportForm.name.trim()) {
      showSnackbar("Please enter a report name", "error");
      return;
    }
    if (!reportForm.datasetId) {
      showSnackbar("Please select a dataset", "error");
      return;
    }

    showSpinner();
    try {
      // Parse query from text if needed
      let queryPayload = reportForm.query;
      try {
        // If queryText has content, try to parse it
        if (queryText && queryText.trim()) {
          const parsed = JSON.parse(queryText);
          queryPayload = { ...queryPayload, ...parsed };
        }
      } catch (parseError) {
        showSnackbar("Invalid query JSON format", "error");
        hideSpinner();
        return;
      }

      const payload: CreateBIReportRequest = {
        ...reportForm,
        query: queryPayload,
      };

      const response:any = await dashboardService.createBIReport(payload);
      const data = response?.data;
      if (data) {
        showSnackbar("Report created successfully!", "success");
        setReportFormOpen(false);
        setReportForm({
          name: "",
          datasetId: "",
          query: { dimensions: [], metrics: [], limit: 50, includeTotals: true },
          visualization: { type: "table", config: {} },
          visibility: "private",
        });
        await loadWorkspace();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to create report", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    if (!reportForm.name.trim()) {
      showSnackbar("Please enter a report name", "error");
      return;
    }

    showSpinner();
    try {
      const payload: UpdateBIReportRequest = {
        name: reportForm.name,
        datasetId: reportForm.datasetId,
        query: reportForm.query,
        visualization: reportForm.visualization,
        visibility: reportForm.visibility,
      };

      const response:any = await dashboardService.updateBIReport(selectedReport.id, payload);
      const data = response?.data;
      if (data) {
        showSnackbar("Report updated successfully!", "success");
        setReportFormOpen(false);
        setIsEditingReport(false);
        setSelectedReport(data);
        await loadWorkspace();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to update report", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleEditReport = (report: BIReport) => {
    setSelectedReport(report);
    setReportForm({
      name: report.name,
      datasetId: report.datasetId,
      query: report.query,
      visualization: report.visualization || { type: "table", config: {} },
      visibility: report.visibility || "private",
    });
    setIsEditingReport(true);
    setReportFormOpen(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    showSpinner();
    try {
      await dashboardService.deleteBIReport(reportId);
      setReports(reports.filter((r) => r.id !== reportId));
      showSnackbar("Report deleted successfully", "success");
    } catch (err) {
      showSnackbar("Failed to delete report", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleRunReport = async (reportId: string, overrides?: BIReportRunRequest) => {
    showSpinner();
    try {
      const response:any = await dashboardService.runBIReport(reportId, overrides || {});
      const data = response?.data;
      if (data) {
        setQueryResult(data);
        setActiveTab(1); // Switch to Query Engine tab
        showSnackbar("Report executed successfully", "success");
      }
    } catch (err) {
      showSnackbar("Failed to run report", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleExportReport = async (reportId: string, format: "csv" | "xlsx" = "csv") => {
    setReportExportLoading(true);
    try {
      const payload: BIReportExportRequest = {
        format,
        overrides: {},
      };

      const response:any = await dashboardService.exportBIReport(reportId, payload);
      const data = response?.data;
      if (data) {
        setReportExportJob(data);
        setReportExportDialogOpen(true);
        showSnackbar("Report export job created", "success");

        // Start polling for export status
        startPollingReportExport(data.jobRef);
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to export report", "error");
    } finally {
      setReportExportLoading(false);
    }
  };

  // ============ Report Export Polling ============

  const startPollingReportExport = (jobRef: string) => {
    const interval = setInterval(async () => {
      try {
        const response:any = await dashboardService.getBIExportJob(jobRef);
        const data = response?.data;
        if (data) {
          setReportExportJob(data);

          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
            if (data.status === "completed") {
              showSnackbar("Report export completed!", "success");
            } else {
              showSnackbar(`Export failed: ${data.errorMessage || "Unknown error"}`, "error");
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    // Store interval for cleanup
    return () => clearInterval(interval);
  };

  // ============ Query Engine ============

  const handleRunQuery = async () => {
    if (!selectedDataset) {
      setError("Select a dataset before running a query.");
      return;
    }

    setQueryRunning(true);
    setError(null);
    setValidationResult(null);
    try {
      let queryPayload: BIQueryRequest;
      try {
        queryPayload = JSON.parse(queryText);
      } catch (parseError) {
        setError("Invalid JSON query payload. Please check the syntax.");
        setQueryRunning(false);
        return;
      }

      const response:any = await dashboardService.runBIQuery(selectedDataset, queryPayload);
      const data = response?.data;
      if (data) {
        setQueryResult(data);
        showSnackbar(`Query executed successfully (${data.meta?.rowCount || 0} rows)`, "success");
      }
    } catch (err: any) {
      setError(err?.message || "The query request failed. Please verify the payload and try again.");
      console.error("Query error:", err);
    } finally {
      setQueryRunning(false);
    }
  };

  const handleValidateQuery = async () => {
    if (!selectedDataset) {
      setError("Select a dataset first");
      return;
    }

    setValidating(true);
    setValidationResult(null);
    setError(null);
    try {
      let queryPayload: BIQueryRequest;
      try {
        queryPayload = JSON.parse(queryText);
      } catch (parseError) {
        setError("Invalid JSON query payload. Please check the syntax.");
        setValidating(false);
        return;
      }

      await dashboardService.validateBIQuery(selectedDataset, queryPayload);
      setValidationResult({ valid: true, message: "Query is valid!" });
      showSnackbar("Query validation passed!", "success");
    } catch (err: any) {
      setValidationResult({
        valid: false,
        message: err?.message || "Query validation failed",
      });
      showSnackbar("Query validation failed", "error");
    } finally {
      setValidating(false);
    }
  };

  const handleLoadDatasetSchema = async () => {
    if (!selectedDataset) {
      setError("Select a dataset first");
      return;
    }

    showSpinner();
    try {
      const response:any = await dashboardService.getBIDatasetSchema(selectedDataset);
      const data = response?.data;
      if (data) {
        setDatasetSchema(data);
        setSchemaDialogOpen(true);
      }
    } catch (err) {
      showSnackbar("Failed to load dataset schema", "error");
    } finally {
      hideSpinner();
    }
  };

  // ============ Exports ============

  const handleCreateExport = async () => {
    if (!selectedDataset) {
      setError("Select a dataset before creating an export.");
      return;
    }

    setExportLoading(true);
    setError(null);
    try {
      let queryPayload: BIQueryRequest;
      try {
        queryPayload = JSON.parse(queryText);
      } catch (parseError) {
        setError("Invalid JSON query payload. Please check the syntax.");
        setExportLoading(false);
        return;
      }

      const exportRequest: BIExportRequest = {
        format: exportFormat,
        query: queryPayload,
      };

      const response:any = await dashboardService.createBIExport(selectedDataset, exportRequest);
      const data = response?.data;
      if (data) {
        setExportJob(data);
        showSnackbar("Export job created successfully", "success");

        // Start polling for job status
        startPollingExport(data.jobRef);
      }
    } catch (err: any) {
      setError(err?.message || "The export request failed.");
      console.error("Export error:", err);
    } finally {
      setExportLoading(false);
    }
  };

  const startPollingExport = (jobRef: string) => {
    // Clear any existing interval
    // if (exportPollingInterval) {
    //   clearInterval(exportPollingInterval);
    // }

    const interval = setInterval(async () => {
      try {
        const response:any = await dashboardService.getBIExportJob(jobRef);
        const data = response?.data;
        if (data) {
          setExportJob(data);

          // Add to jobs list if not already there
          setExportJobs((prev) => {
            const existing = prev.findIndex((j) => j.jobRef === data.jobRef);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = data;
              return updated;
            }
            return [data, ...prev];
          });

          // Stop polling if completed or failed
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
            // setExportPollingInterval(null);
            if (data.status === "completed") {
              showSnackbar("Export completed! Ready for download.", "success");
            } else {
              showSnackbar(`Export failed: ${data.errorMessage || "Unknown error"}`, "error");
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    // setExportPollingInterval(interval);
  };

  const handleDownloadExport = async (jobRef: string) => {
    try {
      const blob = await dashboardService.downloadBIExport(jobRef);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${jobRef}.${exportJob?.format || "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar("Download started", "success");
    } catch (err) {
      showSnackbar("Failed to download export", "error");
    }
  };

  const handleDownloadFromUrl = (url: string) => {
    window.open(url, "_blank");
  };

  // Cleanup polling on unmount
//   useEffect(() => {
//     return () => {
//       if (exportPollingInterval) {
//         clearInterval(exportPollingInterval);
//       }
//     };
//   }, [exportPollingInterval]);

  // ============ Render Functions ============

  const renderReportsTab = () => (
    <Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {reports.length} Reports Available
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setIsEditingReport(false);
                setReportForm({
                  name: "",
                  datasetId: datasets.length > 0 ? datasets[0].datasetId : "",
                  query: { dimensions: [], metrics: [], limit: 50, includeTotals: true },
                  visualization: { type: "table", config: {} },
                  visibility: "private",
                });
                setReportFormOpen(true);
              }}
            >
              New Report
            </Button>
          </Box>

          <Grid container spacing={2}>
            {reports.length > 0 ? (
              reports.map((report) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: theme.shadows[4],
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardHeader
                      title={
                        <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>{report.name}</Typography>
                      }
                      subheader={
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                          <Chip
                            label={report.datasetId}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.625rem" }}
                          />
                          <Chip
                            label={report.visualizationType || "Table"}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontSize: "0.625rem" }}
                          />
                          <Chip
                            label={report.visibility}
                            size="small"
                            color={report.visibility === "private" ? "default" : "info"}
                            sx={{ fontSize: "0.625rem" }}
                          />
                        </Box>
                      }
                      avatar={
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
                          <Report />
                        </Avatar>
                      }
                      action={
                        <Box>
                          {report.editable && (
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  // Fetch full report details then edit
                                  handleViewReport(report.id);
                                  // Open edit after loading
                                  setTimeout(() => {
                                    if (selectedReport) {
                                      handleEditReport(selectedReport);
                                    }
                                  }, 500);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <CardContent>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={`Updated: ${new Date(report.updatedAt).toLocaleDateString()}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.625rem" }}
                        />
                      </Box>
                    </CardContent>
                    <Box sx={{ display: "flex", gap: 1, p: 2, pt: 0, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewReport(report.id)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => handleRunReport(report.id)}
                      >
                        Run
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => handleExportReport(report.id, "csv")}
                        disabled={reportExportLoading}
                      >
                        Export
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">
                  No reports are currently available. Create your first report!
                </Alert>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );

  const renderQueryEngineTab = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Dataset Selection */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label="Dataset"
          value={selectedDataset}
          onChange={(event) => setSelectedDataset(event.target.value)}
          sx={{ minWidth: 250 }}
          slotProps={{ select: { native: true } }}
        >
          <option value="">Select a dataset</option>
          {datasets.map((dataset) => (
            <option key={dataset.datasetId} value={dataset.datasetId}>
              {dataset.title || dataset.datasetId} {!dataset.available && "(Coming Soon)"}
            </option>
          ))}
        </TextField>
        <Button
          variant="outlined"
          startIcon={<SchemaIcon />}
          onClick={handleLoadDatasetSchema}
          disabled={!selectedDataset}
        >
          View Schema
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadWorkspace}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Query Input */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Query (JSON)
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={8}
          maxRows={12}
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          placeholder="Enter your BI query in JSON format..."
          sx={{
            "& .MuiInputBase-root": {
              fontFamily: "monospace",
              fontSize: "0.875rem",
            },
          }}
        />
      </Box>

      {/* Validation Result */}
      {validationResult && (
        <Alert
          severity={validationResult.valid ? "success" : "error"}
          onClose={() => setValidationResult(null)}
        >
          {validationResult.message}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handleRunQuery}
          disabled={queryRunning || !selectedDataset}
          sx={{ minWidth: 120 }}
        >
          {queryRunning ? <CircularProgress size={24} /> : "Run Query"}
        </Button>
        <Button
          variant="outlined"
          startIcon={validating ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          onClick={handleValidateQuery}
          disabled={validating || !selectedDataset}
        >
          {validating ? "Validating..." : "Validate"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleCreateExport}
          disabled={exportLoading || !selectedDataset}
        >
          {exportLoading ? <CircularProgress size={24} /> : "Export"}
        </Button>
        <TextField
          select
          size="small"
          label="Format"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as "csv" | "xlsx")}
          sx={{ width: 120 }}
        >
          <MenuItem value="csv">CSV</MenuItem>
          <MenuItem value="xlsx">Excel</MenuItem>
        </TextField>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => {
            setIsEditingReport(false);
            setReportForm({
              name: "",
              datasetId: selectedDataset || "",
              query: JSON.parse(queryText),
              visualization: { type: "table", config: {} },
              visibility: "private",
            });
            setReportFormOpen(true);
          }}
          disabled={!selectedDataset}
        >
          Save as Report
        </Button>
      </Box>

      {/* Error Display */}
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Query Result */}
      {queryResult && (
        <Fade in={!!queryResult}>
          <Paper variant="outlined" sx={{ p: 3, bgcolor: theme.palette.grey[50], borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Query Result
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {queryResult.meta?.rowCount || 0} rows • {queryResult.meta?.queryTimeMs || 0}ms
                  {queryResult.meta?.dataset && ` • Dataset: ${queryResult.meta.dataset}`}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  label={`${queryResult.data?.length || 0} rows`}
                  size="small"
                  color="primary"
                />
                {queryResult.totals && Object.keys(queryResult.totals).length > 0 && (
                  <Chip
                    label="Has Totals"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            {/* Table View */}
            {queryResult.data && queryResult.data.length > 0 && (
              <TableContainer sx={{ maxHeight: 400, bgcolor: "white", borderRadius: 2 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {queryResult.columns?.map((col) => (
                        <TableCell key={col.id} sx={{ bgcolor: theme.palette.grey[100], fontWeight: 600 }}>
                          {col.label || col.id}
                          <Chip
                            label={col.type}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, fontSize: "0.5rem", height: 16 }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryResult.data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                      <TableRow key={idx} hover>
                        {queryResult.columns?.map((col) => (
                          <TableCell key={col.id}>{safeDisplayValue(row[col.id])}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {queryResult.data && queryResult.data.length > rowsPerPage && (
              <TablePagination
                component="div"
                count={queryResult.data.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}

            {/* Totals */}
            {queryResult.totals && Object.keys(queryResult.totals).length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Totals
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {Object.entries(queryResult.totals).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${safeDisplayValue(value)}`}
                      variant="outlined"
                      size="small"
                      color="info"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Raw JSON */}
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  const jsonStr = JSON.stringify(queryResult, null, 2);
                  navigator.clipboard?.writeText(jsonStr).then(() => {
                    showSnackbar("JSON copied to clipboard", "success");
                  });
                }}
              >
                Copy JSON
              </Button>
            </Box>
          </Paper>
        </Fade>
      )}
    </Box>
  );

  const renderExportsTab = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Create New Export
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            select
            label="Dataset"
            value={selectedDataset}
            onChange={(event) => setSelectedDataset(event.target.value)}
            sx={{ minWidth: 200 }}
            slotProps={{ select: { native: true } }}
          >
            <option value="">Select a dataset</option>
            {datasets.map((dataset) => (
              <option key={dataset.datasetId} value={dataset.datasetId}>
                {dataset.title || dataset.datasetId}
              </option>
            ))}
          </TextField>
          <TextField
            select
            label="Format"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "csv" | "xlsx")}
            sx={{ width: 150 }}
          >
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="xlsx">Excel</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleCreateExport}
            disabled={exportLoading || !selectedDataset}
          >
            {exportLoading ? "Creating..." : "Create Export"}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Active Export Job */}
      {exportJob && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Export Job Status
            </Typography>
            <Chip
              label={exportJob.status}
              color={getStatusColor(exportJob.status) as any}
              icon={<span>{getStatusIcon(exportJob.status)}</span>}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip label={`Job: ${exportJob.jobRef}`} size="small" variant="outlined" />
              <Chip label={`Format: ${exportJob.format}`} size="small" variant="outlined" />
              {exportJob.rowCount > 0 && (
                <Chip label={`Rows: ${exportJob.rowCount}`} size="small" variant="outlined" />
              )}
              {exportJob.fileBytes > 0 && (
                <Chip
                  label={`Size: ${(exportJob.fileBytes / 1024).toFixed(1)} KB`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={exportJob.progressPercent || 0}
              sx={{ height: 8, borderRadius: 4 }}
              color={exportJob.status === "failed" ? "error" : "primary"}
            />
            <Typography variant="caption" color="textSecondary">
              {exportJob.progressPercent || 0}% complete
            </Typography>
            {exportJob.status === "completed" && exportJob.downloadUrl && (
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => handleDownloadFromUrl(exportJob.downloadUrl!)}
                >
                  Download File
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleDownloadExport(exportJob.jobRef)}
                >
                  Download via Proxy
                </Button>
              </Box>
            )}
            {exportJob.status === "failed" && exportJob.errorMessage && (
              <Alert severity="error">{exportJob.errorMessage}</Alert>
            )}
          </Box>
        </Paper>
      )}

      {/* Export History */}
      {exportJobs.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Export History
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                  <TableCell>Job Reference</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportJobs.slice(0, 10).map((job) => (
                  <TableRow key={job.jobRef}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                        {job.jobRef}
                      </Typography>
                    </TableCell>
                    <TableCell>{job.format?.toUpperCase()}</TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        size="small"
                        color={getStatusColor(job.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={job.progressPercent || 0}
                          sx={{ width: 80, height: 4, borderRadius: 2 }}
                        />
                        <Typography variant="caption">{job.progressPercent || 0}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {job.status === "completed" && job.downloadUrl && (
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleDownloadFromUrl(job.downloadUrl!)}
                          >
                            <FileDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );

  const renderDatasetsTab = () => (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Available Datasets
      </Typography>
      <Grid container spacing={2}>
        {datasets.map((dataset) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dataset.datasetId}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[4],
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{dataset.title || dataset.datasetId}</Typography>
                    {dataset.available ? (
                      <Chip label="Available" size="small" color="success" sx={{ fontSize: "0.625rem" }} />
                    ) : (
                      <Chip label="Coming Soon" size="small" color="warning" sx={{ fontSize: "0.625rem" }} />
                    )}
                  </Box>
                }
                subheader={
                  <Typography variant="caption" color="textSecondary" sx={{ fontFamily: "monospace" }}>
                    {dataset.datasetId}
                  </Typography>
                }
                avatar={
                  <Avatar sx={{ bgcolor: dataset.available ? theme.palette.success.main : theme.palette.warning.main }}>
                    <SchemaIcon />
                  </Avatar>
                }
              />
              <CardContent>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SchemaIcon />}
                    onClick={() => {
                      setSelectedDataset(dataset.datasetId);
                      handleLoadDatasetSchema();
                    }}
                    disabled={!dataset.available}
                  >
                    View Schema
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => {
                      setSelectedDataset(dataset.datasetId);
                      setActiveTab(1); // Switch to Query Engine tab
                    }}
                    disabled={!dataset.available}
                  >
                    Query
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // ============ Report Form Dialog ============

  const renderReportFormDialog = () => (
    <Dialog
      open={reportFormOpen}
      onClose={() => setReportFormOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isEditingReport ? "Edit Report" : "Create New Report"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {isEditingReport ? "Update your saved report" : "Save a query as a report for later use"}
            </Typography>
          </Box>
          <IconButton onClick={() => setReportFormOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            fullWidth
            label="Report Name"
            value={reportForm.name}
            onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
            required
            placeholder="Enter a descriptive name for your report"
          />

          <FormControl fullWidth required>
            <InputLabel>Dataset</InputLabel>
            <Select
              value={reportForm.datasetId}
              onChange={(e) => setReportForm({ ...reportForm, datasetId: e.target.value })}
              label="Dataset"
            >
              {datasets.map((dataset) => (
                <MenuItem key={dataset.datasetId} value={dataset.datasetId}>
                  {dataset.title || dataset.datasetId}
                  {!dataset.available && " (Coming Soon)"}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select the dataset this report will query</FormHelperText>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={reportForm.visibility}
              onChange={(e) =>
                setReportForm({
                  ...reportForm,
                  visibility: e.target.value as "private" | "role" | "tenant",
                })
              }
              label="Visibility"
            >
              <MenuItem value="private">Private (Only you)</MenuItem>
              <MenuItem value="role">Role Based</MenuItem>
              <MenuItem value="tenant">Tenant (All users)</MenuItem>
            </Select>
            <FormHelperText>Who can access this report</FormHelperText>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Query Configuration
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={6}
              maxRows={10}
              value={JSON.stringify(reportForm.query, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setReportForm({ ...reportForm, query: parsed });
                } catch {
                  // Allow invalid JSON during typing
                }
              }}
              placeholder="Enter your query in JSON format..."
              sx={{
                "& .MuiInputBase-root": {
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                },
              }}
            />
            <FormHelperText>
              {(() => {
                try {
                  JSON.stringify(reportForm.query);
                  return "✅ Valid JSON";
                } catch {
                  return "⚠️ Invalid JSON";
                }
              })()}
            </FormHelperText>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Visualization (Optional)
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Chart Type"
                value={reportForm.visualization?.type || "table"}
                onChange={(e) =>
                  setReportForm({
                    ...reportForm,
                    visualization: { ...reportForm.visualization, type: e.target.value },
                  })
                }
                sx={{ flex: 1 }}
              >
                <MenuItem value="table">Table</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button onClick={() => setReportFormOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={isEditingReport ? handleUpdateReport : handleCreateReport}
          disabled={!reportForm.name.trim() || !reportForm.datasetId}
        >
          {isEditingReport ? "Update Report" : "Create Report"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============ Report Export Dialog ============

  const renderReportExportDialog = () => (
    <Dialog
      open={reportExportDialogOpen}
      onClose={() => setReportExportDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Report Export
          </Typography>
          <IconButton onClick={() => setReportExportDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {reportExportJob ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2">Export Status</Typography>
              <Chip
                label={reportExportJob.status}
                color={getStatusColor(reportExportJob.status) as any}
                icon={<span>{getStatusIcon(reportExportJob.status)}</span>}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={reportExportJob.progressPercent || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="textSecondary">
              {reportExportJob.progressPercent || 0}% complete
            </Typography>
            {reportExportJob.status === "completed" && reportExportJob.downloadUrl && (
              <Button
                variant="contained"
                color="success"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  handleDownloadFromUrl(reportExportJob.downloadUrl!);
                  setReportExportDialogOpen(false);
                }}
                fullWidth
              >
                Download Export
              </Button>
            )}
            {reportExportJob.status === "failed" && reportExportJob.errorMessage && (
              <Alert severity="error">{reportExportJob.errorMessage}</Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  // ============ Schema Dialog ============

  const renderSchemaDialog = () => (
    <Dialog open={schemaDialogOpen} onClose={() => setSchemaDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Dataset Schema: {datasetSchema?.title || selectedDataset}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {datasetSchema?.datasetId}
            </Typography>
          </Box>
          <IconButton onClick={() => setSchemaDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {datasetSchema ? (
          <Box>
            {/* Date Fields */}
            {datasetSchema.dateFields && datasetSchema.dateFields.length > 0 && (
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Date Fields
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {datasetSchema.dateFields.map((field) => (
                    <Chip
                      key={field.id}
                      label={`${field.id} (${field.type})`}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Dimensions */}
            {datasetSchema.dimensions && datasetSchema.dimensions.length > 0 && (
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Dimensions
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {datasetSchema.dimensions.map((dim) => (
                    <Chip
                      key={dim.id}
                      label={`${dim.id} (${dim.type})`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Metrics */}
            {datasetSchema.metrics && datasetSchema.metrics.length > 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Metrics
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {datasetSchema.metrics.map((metric) => (
                    <Chip
                      key={metric.id}
                      label={`${metric.id} (${metric.aggregation})`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button variant="contained" onClick={() => setSchemaDialogOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============ Report Detail Dialog ============

  const renderReportDetailDialog = () => (
    <Dialog
      open={reportDetailOpen}
      onClose={() => setReportDetailOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedReport?.name || "Report Details"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {selectedReport?.datasetId} • {selectedReport?.visibility}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                if (selectedReport) {
                  handleEditReport(selectedReport);
                  setReportDetailOpen(false);
                }
              }}
              disabled={!selectedReport?.editable}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => {
                if (selectedReport) {
                  handleRunReport(selectedReport.id);
                  setReportDetailOpen(false);
                }
              }}
            >
              Run
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => {
                if (selectedReport) {
                  handleExportReport(selectedReport.id, "csv");
                  setReportDetailOpen(false);
                }
              }}
            >
              Export
            </Button>
            <IconButton onClick={() => setReportDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {selectedReport ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip label={`Dataset: ${selectedReport.datasetId}`} variant="outlined" />
              <Chip label={`Visibility: ${selectedReport.visibility}`} variant="outlined" />
              <Chip label={`Created: ${new Date(selectedReport.createdAt).toLocaleDateString()}`} variant="outlined" />
              <Chip label={`Updated: ${new Date(selectedReport.updatedAt).toLocaleDateString()}`} variant="outlined" />
              {selectedReport.editable && (
                <Chip label="Editable" color="success" size="small" />
              )}
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
              Query Configuration
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: theme.palette.grey[50],
                fontFamily: "monospace",
                fontSize: "0.75rem",
                maxHeight: 300,
                overflow: "auto",
              }}
            >
              <pre>{JSON.stringify(selectedReport.query, null, 2)}</pre>
            </Paper>

            {selectedReport.visualization && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
                  Visualization
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.grey[50],
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  <pre>{JSON.stringify(selectedReport.visualization, null, 2)}</pre>
                </Paper>
              </>
            )}

            {/* Quick Actions */}
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => {
                  if (selectedReport) {
                    handleRunReport(selectedReport.id);
                    setReportDetailOpen(false);
                  }
                }}
              >
                Run Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (selectedReport) {
                    handleExportReport(selectedReport.id, "csv");
                    setReportDetailOpen(false);
                  }
                }}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (selectedReport) {
                    handleExportReport(selectedReport.id, "xlsx");
                    setReportDetailOpen(false);
                  }
                }}
              >
                Export Excel
              </Button>
            </Box>
          </Box>
        ) : (
          <CircularProgress />
        )}
      </DialogContent>
    </Dialog>
  );

  // ============ Main Render ============

  return (
    <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              BI Workspace
            </Typography>
            <Typography color="text.secondary">
              Manage reports, query datasets, and export jobs from one place.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Dashboard />} onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper sx={{ borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.label} icon={tab.icon} iconPosition="start" label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel index={0} value={activeTab}>
            {renderReportsTab()}
          </TabPanel>

          <TabPanel index={1} value={activeTab}>
            {renderQueryEngineTab()}
          </TabPanel>

          <TabPanel index={2} value={activeTab}>
            {renderExportsTab()}
          </TabPanel>

          <TabPanel index={3} value={activeTab}>
            {renderDatasetsTab()}
          </TabPanel>
        </Box>
      </Paper>

      {/* Dialogs */}
      {renderSchemaDialog()}
      {renderReportDetailDialog()}
      {renderReportFormDialog()}
      {renderReportExportDialog()}
    </Box>
  );
}
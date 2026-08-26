import { useEffect, useMemo, useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
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
  useTheme,
  Avatar,
  LinearProgress,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  OutlinedInput,
  Switch,
  FormControlLabel,
  Menu,
} from "@mui/material";
import {
  Dashboard,
  Download,
  PlayArrow,
  QueryStats,
  Report,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Schema as SchemaIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  EditOutlined,
  DeleteOutlineOutlined,
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
  DashboardBuilderPage,
  DashboardQuerySet,
} from "../../services/modules/dashboard";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import type { TabPanelProps } from "../employees/type";
import { getRowColor } from "../const";

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
    case "completed": return "success";
    case "pending": return "warning";
    case "processing": return "info";
    case "failed": return "error";
    default: return "default";
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed": return "✅";
    case "pending": return "⏳";
    case "processing": return "🔄";
    case "failed": return "❌";
    default: return "📋";
  }
};

// ============ Main Component ============

export default function BiWorkspacePage() {
  const theme = useTheme();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  // Tabs
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
    visualization: { type: "table", config: {} },
    visibility: "PRIVATE",
  });

  // Datasets & Schema
  const [datasets, setDatasets] = useState<BIDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [datasetSchema, setDatasetSchema] = useState<BIDatasetSchema | null>(null);
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);

  // Dashboard Builder / Query Set Administration
  const [builderPages, setBuilderPages] = useState<DashboardBuilderPage[]>([]);
  const [querySets, setQuerySets] = useState<DashboardQuerySet[]>([]);
  const [editingBuilderPageId, setEditingBuilderPageId] = useState<string | null>(null);
  const [editingQuerySetId, setEditingQuerySetId] = useState<string | null>(null);
  const [builderPageForm, setBuilderPageForm] = useState({
    pageKey: "",
    title: "",
    description: "",
    displayOrder: 1,
  });
  const [querySetForm, setQuerySetForm] = useState({
    title: "",
    description: "",
    datasetId: "",
    queryType: "sql",
    sqlText: "SELECT 1",
    active: true,
  });
  const [presetId, setPresetId] = useState("");

  // ====== Dynamic Query State ======
  // The full query payload according to the BI API
  const [queryPayload, setQueryPayload] = useState<BIQueryRequest>({
    dimensions: [],
    metrics: [],
    limit: 50,
    includeTotals: true,
  });

  // UI helper for filters (conditions)
  interface FilterCondition {
    field: string;
    operator: string;
    value: string;
  }
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);

  // Date range
  const [dateRange, setDateRange] = useState<{
    field: string;
    from: string | null;
    to: string | null;
    granularity: string;
  }>({
    field: "",
    from: null,
    to: null,
    granularity: "month",
  });

  // Top N
  const [topN, setTopN] = useState<{
    dimension: string;
    metric: string;
    limit: number;
    includeOthers: boolean;
  } | null>(null);

  // Sort
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" }[]>([]);

  // Query result
  const [queryResult, setQueryResult] = useState<BIQueryResponse | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null);
  const [validating, setValidating] = useState(false);

  // Exports
  const [exportJob, setExportJob] = useState<BIExportJob | null>(null);
  const [exportJobs, setExportJobs] = useState<BIExportJob[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [exportMenuAnchorExports, setExportMenuAnchorExports] = useState<null | HTMLElement>(null);

  // Report Export
  const [reportExportDialogOpen, setReportExportDialogOpen] = useState(false);
  const [reportExportJob, setReportExportJob] = useState<BIExportJob | null>(null);
  const [_reportExportLoading, setReportExportLoading] = useState(false);

  // Pagination for drilldown
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Polling refs
  const exportPollingIntervalRef = useRef<any | null>(null);
  const reportExportPollingIntervalRef = useRef<any | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [jsonError, setJsonError] = useState(false);

  // Tabs
  const tabs = useMemo(
    () => [
      { label: "Reports", icon: <Report /> },
      { label: "Query Engine", icon: <QueryStats /> },
      { label: "Exports", icon: <Download /> },
      { label: "Datasets", icon: <SchemaIcon /> },
      { label: "Builder", icon: <Dashboard /> },
      { label: "Query Sets", icon: <FilterListIcon /> },
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
        await loadSchemaForDataset(datasetItems[0].datasetId);
      }

      const adminResults = await Promise.allSettled([
        dashboardService.listDashboardBuilderPages(),
        dashboardService.listBIQuerySets(),
      ]);

      if (adminResults[0].status === "fulfilled") {
        setBuilderPages(
          Array.isArray(adminResults[0].value?.data)
            ? adminResults[0].value.data
            : []
        );
      }

      if (adminResults[1].status === "fulfilled") {
        setQuerySets(
          Array.isArray(adminResults[1].value?.data)
            ? adminResults[1].value.data
            : []
        );
      }
    } catch (err) {
      setError("Unable to load BI workspace data right now.");
      console.error("Load workspace error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchemaForDataset = async (datasetId: string) => {
    try {
      const response: any = await dashboardService.getBIDatasetSchema(datasetId);
      const schema = response?.data;
      if (schema) {
        setDatasetSchema(schema);
        // Initialize query payload with available dimensions/metrics
        const dims = schema.dimensions?.map((d: any) => d.id) || [];
        const metrics = schema.metrics?.map((m: any) => m.id) || [];
        // Set default date field if any
        const dateField = schema.dateFields?.[0]?.id || "";
        setQueryPayload((prev) => ({
          ...prev,
          dimensions: dims.slice(0, 2), // first two as default
          metrics: metrics.slice(0, 2),
        }));
        setDateRange((prev) => ({
          ...prev,
          field: dateField,
        }));
      }
    } catch (err) {
      console.error("Failed to load schema:", err);
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, []);

  // When dataset selection changes, reload schema
  useEffect(() => {
    if (selectedDataset) {
      void loadSchemaForDataset(selectedDataset);
    }
  }, [selectedDataset]);

  // ============ Polling Cleanup ============

  useEffect(() => {
    return () => {
      if (exportPollingIntervalRef.current) {
        clearInterval(exportPollingIntervalRef.current);
      }
      if (reportExportPollingIntervalRef.current) {
        clearInterval(reportExportPollingIntervalRef.current);
      }
    };
  }, []);

  // ============ Reports CRUD ============

  const handleViewReport = async (reportId: string) => {
    showSpinner();
    try {
      const response: any = await dashboardService.getBIReport(reportId);
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

  const validateQuery = (query: any): { valid: boolean; message?: string } => {
    const dimensions = query.dimensions || [];
    const metrics = query.metrics || [];
    if (dimensions.length === 0 && metrics.length === 0) {
      return { valid: false, message: "Query must include at least one dimension or metric." };
    }
    return { valid: true };
  };

  const handleCreateReport = async () => {
    if (!reportForm.name.trim()) {
      showSnackbar("Please enter a report name", "error");
      return;
    }
    if (!reportForm.datasetId) {
      showSnackbar("Please select a dataset", "error");
      return;
    }

    // Build final query from state
    const finalQuery = buildQueryFromState();

    // Validate
    const validation = validateQuery(finalQuery);
    if (!validation.valid) {
      showSnackbar(validation.message || "Invalid query", "error");
      return;
    }

    showSpinner();
    try {
      const payload: CreateBIReportRequest = {
        ...reportForm,
        query: finalQuery,
        // visibilityRole: ""
      };
      delete payload.query.topN;
      delete payload.query.sort;

      const response: any = await dashboardService.createBIReport(payload);
      if (response?.data) {
        showSnackbar("Report created successfully!", "success");
        setReportFormOpen(false);
        setReportForm({
          name: "",
          datasetId: "",
          query: { dimensions: [], metrics: [], limit: 50, includeTotals: true },
          visualization: { type: "table", config: {} },
          visibility: "PRIVATE",
          // visibilityRole: ""
        });
        await loadWorkspace();
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to create report";
      showSnackbar(message, "error");
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

      const response: any = await dashboardService.updateBIReport(selectedReport.id, payload);
      if (response?.data) {
        showSnackbar("Report updated successfully!", "success");
        setReportFormOpen(false);
        setIsEditingReport(false);
        setSelectedReport(null);
        await loadWorkspace();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to update report", "error");
    } finally {
      hideSpinner();
    }
  };

  const convertSortFromAPI = (
    sort: { field: string; direction: string }[]
  ): { field: string; direction: "asc" | "desc" }[] => {
    return sort.map((s) => ({
      field: s.field,
      direction: s.direction === "asc" ? "asc" : "desc",
    }));
  };

  const handleEditReport = (report: BIReport) => {
    setSelectedReport(report);
    const q = report.query;
    setReportForm({
      name: report.name,
      datasetId: report.datasetId,
      query: q,
      visualization: report.visualization || { type: "table", config: {} },
      visibility: report.visibility || "PRIVATE",
    });
    // Synchronize visual builder state with report's query
    setQueryPayload(q);

    // Reset and populate filters
    if (q.filters?.conditions) {
      setFilterConditions(q.filters.conditions.map(c => ({
        field: c.field,
        operator: c.operator,
        value: String(c.value),
      })));
    } else {
      setFilterConditions([]);
    }

    // Date range
    if (q.dateRange) {
      setDateRange({
        field: q.dateRange.field || "",
        from: q.dateRange.from || null,
        to: q.dateRange.to || null,
        granularity: q.dateRange.granularity || "month",
      });
    } else {
      setDateRange({ field: "", from: null, to: null, granularity: "month" });
    }

    // Top N
    if (q.topN) {
      setTopN({
        dimension: q.topN.dimension || "",
        metric: q.topN.metric || "",
        limit: q.topN.limit || 10,
        includeOthers: q.topN.includeOthers !== undefined ? q.topN.includeOthers : true,
      });
    } else {
      setTopN(null);
    }

    // Sort
    if (q.sort) {
      setSort(convertSortFromAPI(q.sort));
    } else {
      setSort([]);
    }

    // Populate the query builder with report's query
    // setQueryPayload(report.query);
    // Also set filter conditions etc if needed
    setIsEditingReport(true);
    setReportFormOpen(true);
  };

  useEffect(() => {
    // Reset visual builder when dataset changes
    setQueryPayload({ dimensions: [], metrics: [], limit: 50, includeTotals: true });
    setFilterConditions([]);
    setDateRange({ field: "", from: null, to: null, granularity: "month" });
    setTopN(null);
    setSort([]);
    setQueryResult(null);
    setValidationResult(null);
    setError(null);
  }, [selectedDataset]);

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
      const response: any = await dashboardService.runBIReport(reportId, overrides || {});
      const data = response?.data;
      if (data) {
        setQueryResult(data);
        setActiveTab(1);
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
      const response: any = await dashboardService.exportBIReport(reportId, payload);
      const data = response?.data;
      if (data) {
        setReportExportJob(data);
        setReportExportDialogOpen(true);
        showSnackbar("Report export job created", "success");
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
    if (reportExportPollingIntervalRef.current) {
      clearInterval(reportExportPollingIntervalRef.current);
    }
    const interval = setInterval(async () => {
      try {
        const response: any = await dashboardService.getBIExportJob(jobRef);
        const data = response?.data;
        if (data) {
          setReportExportJob(data);
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
            reportExportPollingIntervalRef.current = null;
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
    reportExportPollingIntervalRef.current = interval;
  };

  // ============ Query Engine ============

  // Build the full BI query from the UI state
  const buildQueryFromState = (): BIQueryRequest => {
    const query: BIQueryRequest = {
      dimensions: queryPayload.dimensions || [],
      metrics: queryPayload.metrics || [],
      limit: queryPayload.limit || 50,
      includeTotals: queryPayload.includeTotals !== undefined ? queryPayload.includeTotals : true,
    };

    // Date range
    if (dateRange.field && dateRange.from) {
      const dateRangeObj: any = {
        field: dateRange.field,
        from: dateRange.from,
        granularity: dateRange.granularity || "month",
      };
      if (dateRange.to) {
        dateRangeObj.to = dateRange.to;
      }
      query.dateRange = dateRangeObj;
    }


    // Filters
    if (filterConditions.length > 0) {
      query.filters = {
        operator: "and",
        conditions: filterConditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
      };
    }

    // Top N
    if (topN && topN.dimension && topN.metric) {
      query.topN = {
        dimension: topN.dimension,
        metric: topN.metric,
        limit: topN.limit || 10,
        includeOthers: topN.includeOthers !== undefined ? topN.includeOthers : true,
      };
    }

    // Sort
    if (sort.length > 0) {
      query.sort = sort;
    }

    return query;
  };

  // Update queryPayload from form changes
  const updateQueryPayload = (updates: Partial<BIQueryRequest>) => {
    setQueryPayload((prev) => ({ ...prev, ...updates }));
  };

  const handleRunQuery = async () => {
    if (!selectedDataset) {
      setError("Select a dataset before running a query.");
      return;
    }

    setQueryRunning(true);
    setError(null);
    setValidationResult(null);
    try {
      const query = buildQueryFromState();
      const response: any = await dashboardService.runBIQuery(selectedDataset, query);
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
      const query = buildQueryFromState();
      await dashboardService.validateBIQuery(selectedDataset, query);
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
      const response: any = await dashboardService.getBIDatasetSchema(selectedDataset);
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
    console.log(selectedDataset, 'kkkkkkkk');

    if (!selectedDataset) {
      setError("Select a dataset before creating an export.");
      return;
    }
    console.log(selectedDataset);


    setExportLoading(true);
    setError(null);
    try {
      const query = buildQueryFromState();
      const exportRequest: BIExportRequest = {
        format: exportFormat,
        query,
      };
      console.log(selectedDataset);


      const response: any = await dashboardService.createBIExport(selectedDataset, exportRequest);
      const data = response?.data;
      if (data) {
        setExportJob(data);
        showSnackbar("Export job created successfully", "success");
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
    if (exportPollingIntervalRef.current) {
      clearInterval(exportPollingIntervalRef.current);
    }
    const interval = setInterval(async () => {
      try {
        const response: any = await dashboardService.getBIExportJob(jobRef);
        const data = response?.data;
        if (data) {
          setExportJob(data);
          setExportJobs((prev) => {
            const existing = prev.findIndex((j) => j.jobRef === data.jobRef);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = data;
              return updated;
            }
            return [data, ...prev];
          });
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
            exportPollingIntervalRef.current = null;
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
    exportPollingIntervalRef.current = interval;
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

  // ============ Render Query Builder ============

  const resetBuilderPageForm = () => {
    setEditingBuilderPageId(null);
    setBuilderPageForm({
      pageKey: "",
      title: "",
      description: "",
      displayOrder: 1,
    });
  };

  const createBuilderPage = async () => {
    try {
      const response = await dashboardService.createDashboardBuilderPage({
        pageKey: builderPageForm.pageKey,
        title: builderPageForm.title,
        description: builderPageForm.description,
        displayOrder: builderPageForm.displayOrder,
        active: true,
        roles: [],
        filters: [],
        widgets: [],
      });

      if (response?.success) {
        showSnackbar("Builder page created", "success");
        resetBuilderPageForm();
        await loadWorkspace();
      } else {
        showSnackbar(response?.message || "Unable to create builder page", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to create builder page", "error");
    }
  };

  const handleEditBuilderPage = async (pageId: string) => {
    try {
      const api = dashboardService as any;
      const response: any = await api.getDashboardBuilderPage(pageId);
      const page = response?.data;
      if (!page) {
        showSnackbar("Unable to load builder page", "error");
        return;
      }

      setEditingBuilderPageId(pageId);
      setBuilderPageForm({
        pageKey: page.pageKey || "",
        title: page.title || "",
        description: page.description || "",
        displayOrder: page.displayOrder || 1,
      });
      showSnackbar("Builder page loaded for editing", "success");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load builder page", "error");
    }
  };

  const handleUpdateBuilderPage = async () => {
    if (!editingBuilderPageId) return;

    try {
      const api = dashboardService as any;
      const response: any = await api.updateDashboardBuilderPage(editingBuilderPageId, {
        pageKey: builderPageForm.pageKey,
        title: builderPageForm.title,
        description: builderPageForm.description,
        displayOrder: builderPageForm.displayOrder,
      });

      if (response?.success) {
        showSnackbar("Builder page updated", "success");
        resetBuilderPageForm();
        await loadWorkspace();
      } else {
        showSnackbar(response?.message || "Unable to update builder page", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to update builder page", "error");
    }
  };

  const handleDeleteBuilderPage = async (pageId: string) => {
    if (!window.confirm("Delete this dashboard builder page?")) return;

    try {
      const api = dashboardService as any;
      const response: any = await api.deleteDashboardBuilderPage(pageId);
      if (response?.success) {
        showSnackbar("Builder page deleted", "success");
        await loadWorkspace();
      } else {
        showSnackbar(response?.message || "Unable to delete builder page", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to delete builder page", "error");
    }
  };

  const resetQuerySetForm = () => {
    setEditingQuerySetId(null);
    setQuerySetForm({
      title: "",
      description: "",
      datasetId: "",
      queryType: "sql",
      sqlText: "SELECT 1",
      active: true,
    });
  };

  const createQuerySet = async () => {
    try {
      const response = await dashboardService.createBIQuerySet({
        title: querySetForm.title,
        description: querySetForm.description,
        datasetId: querySetForm.datasetId || selectedDataset,
        queryType: querySetForm.queryType,
        sqlText: querySetForm.sqlText,
        queryJson: {},
        paramBindings: {},
        visualization: {},
        active: querySetForm.active,
      });

      if (response?.success) {
        showSnackbar("Query set created", "success");
        resetQuerySetForm();
        await loadWorkspace();
      } else {
        showSnackbar(response?.message || "Unable to create query set", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to create query set", "error");
    }
  };

  const handleEditQuerySet = async (querySetId: string) => {
    try {
      const api = dashboardService as any;
      const response: any = await api.getBIQuerySet(querySetId);
      const querySet = response?.data;
      if (!querySet) {
        showSnackbar("Unable to load query set", "error");
        return;
      }

      setEditingQuerySetId(querySetId);
      setQuerySetForm({
        title: querySet.title || "",
        description: querySet.description || "",
        datasetId: querySet.datasetId || "",
        queryType: querySet.queryType || "sql",
        sqlText: querySet.sqlText || "SELECT 1",
        active: querySet.active ?? true,
      });
      showSnackbar("Query set loaded for editing", "success");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load query set", "error");
    }
  };

  const handleUpdateQuerySet = async () => {
    if (!editingQuerySetId) return;

    try {
      const api = dashboardService as any;
      const response: any = await api.updateBIQuerySet(editingQuerySetId, {
        title: querySetForm.title,
        description: querySetForm.description,
        datasetId: querySetForm.datasetId || selectedDataset,
        queryType: querySetForm.queryType,
        sqlText: querySetForm.sqlText,
        active: querySetForm.active,
      });

      if (response?.success) {
        showSnackbar("Query set updated", "success");
        resetQuerySetForm();
        await loadWorkspace();
      } else {
        showSnackbar(response?.message || "Unable to update query set", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to update query set", "error");
    }
  };

  const handleDeleteQuerySet = async (querySetId: string) => {
    if (!window.confirm("Delete this query set?")) return;

    try {
      const api = dashboardService as any;
      const response: any = await api.deleteBIQuerySet(querySetId);
      if (response?.success) {
        showSnackbar("Query set deleted", "success");
        await loadWorkspace();
      } else {
        showSnackbar(response?.message || "Unable to delete query set", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to delete query set", "error");
    }
  };

  const handleLoadPreset = async () => {
    if (!selectedDataset || !presetId.trim()) {
      showSnackbar("Select a dataset and enter a preset id", "error");
      return;
    }

    try {
      const api = dashboardService as any;
      const response: any = await api.getBIQueryPreset(selectedDataset, presetId.trim());
      const preset = response?.data;
      if (preset?.query) {
        setQueryPayload({ ...queryPayload, ...preset.query });
        setFilterConditions((preset.query.filters?.conditions || []).map((condition: any) => ({
          field: condition.field || "",
          operator: condition.operator || "eq",
          value: String(condition.value ?? ""),
        })));
        setDateRange({
          field: preset.query.dateRange?.field || "",
          from: preset.query.dateRange?.from || null,
          to: preset.query.dateRange?.to || null,
          granularity: preset.query.dateRange?.granularity || "month",
        });
        setTopN(
          preset.query.topN
            ? {
              dimension: preset.query.topN.dimension || "",
              metric: preset.query.topN.metric || "",
              limit: preset.query.topN.limit || 10,
              includeOthers: preset.query.topN.includeOthers !== undefined ? preset.query.topN.includeOthers : true,
            }
            : null
        );
        setSort(
          Array.isArray(preset.query.sort)
            ? preset.query.sort.map((item: any) => ({ field: item.field, direction: item.direction }))
            : []
        );
        showSnackbar("Preset loaded into the query builder", "success");
      } else {
        showSnackbar("Preset response did not include a query payload", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load query preset", "error");
    }
  };

  const renderBuilderAdmin = () => (
    <Card className="bg-white">
      <CardHeader title="Dashboard Builder" className="text-gray-800" />
      <CardContent className="space-y-4">
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextField
            label="Page key"
            value={builderPageForm.pageKey}
            onChange={(e) =>
              setBuilderPageForm((prev) => ({ ...prev, pageKey: e.target.value }))
            }
          />
          <TextField
            label="Title"
            value={builderPageForm.title}
            onChange={(e) =>
              setBuilderPageForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <TextField
            label="Description"
            value={builderPageForm.description}
            onChange={(e) =>
              setBuilderPageForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <TextField
            label="Display order"
            type="number"
            value={builderPageForm.displayOrder}
            onChange={(e) =>
              setBuilderPageForm((prev) => ({
                ...prev,
                displayOrder: Number(e.target.value || 1),
              }))
            }
          />
        </Box>
        <Box className="flex gap-2">
          <Button
            variant="contained" className="!bg-primary"
            onClick={() => void (editingBuilderPageId ? handleUpdateBuilderPage() : createBuilderPage())}
          >
            {editingBuilderPageId ? "Update Dashboard Page" : "Create Dashboard Page"}
          </Button>
          {editingBuilderPageId && (
            <Button variant="outlined" className="!text-gray-800 !border-gray-200" onClick={resetBuilderPageForm}>
              Cancel
            </Button>
          )}
        </Box>

        <TableContainer className="bg-white">
          <Table className="border border-gray-200">
            <TableHead>
              <TableRow>
                <TableCell>Page Key</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {builderPages.map((page, i) => (
                <TableRow key={page.id} sx={getRowColor(i)}>
                  <TableCell>{page.pageKey}</TableCell>
                  <TableCell>{page.title}</TableCell>
                  <TableCell>{page.description}</TableCell>
                  <TableCell align="right">
                    <Box className="flex justify-end gap-1">
                      <IconButton size="small" color="primary" onClick={() => void handleEditBuilderPage(page.id)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => void handleDeleteBuilderPage(page.id)}>
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderQuerySetAdmin = () => (
    <Card className="bg-white">
      <CardHeader title="Query Sets" className="text-gray-800" />
      <CardContent className="space-y-4">
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextField
            label="Title"
            value={querySetForm.title}
            onChange={(e) =>
              setQuerySetForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <TextField
            label="Description"
            value={querySetForm.description}
            onChange={(e) =>
              setQuerySetForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <TextField
            label="Dataset id"
            value={querySetForm.datasetId || selectedDataset}
            onChange={(e) =>
              setQuerySetForm((prev) => ({ ...prev, datasetId: e.target.value }))
            }
          />
          <TextField
            label="Query type"
            value={querySetForm.queryType}
            onChange={(e) =>
              setQuerySetForm((prev) => ({ ...prev, queryType: e.target.value }))
            }
          />
          <TextField
            label="SQL text"
            multiline
            minRows={3}
            value={querySetForm.sqlText}
            onChange={(e) =>
              setQuerySetForm((prev) => ({ ...prev, sqlText: e.target.value }))
            }
            className="md:col-span-2"
          />
        </Box>
        <Box className="flex gap-2">
          <Button
            variant="contained" className="!bg-primary"
            onClick={() => void (editingQuerySetId ? handleUpdateQuerySet() : createQuerySet())}
          >
            {editingQuerySetId ? "Update Query Set" : "Create Query Set"}
          </Button>
          {editingQuerySetId && (
            <Button variant="outlined" className="!text-gray-800 !border-gray-200" onClick={resetQuerySetForm}>
              Cancel
            </Button>
          )}
        </Box>

        <TableContainer className="bg-white">
          <Table className="border border-gray-200 rounded-sm">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Dataset</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {querySets.map((querySet) => (
                <TableRow key={querySet.id}>
                  <TableCell>{querySet.title}</TableCell>
                  <TableCell>{querySet.datasetId}</TableCell>
                  <TableCell>{querySet.queryType}</TableCell>
                  <TableCell align="right">
                    <Box className="flex justify-end gap-1">
                      <IconButton size="small" color="primary" onClick={() => void handleEditQuerySet(querySet.id)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => void handleDeleteQuerySet(querySet.id)}>
                        <DeleteOutlineOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderQueryBuilder = () => {
    if (!datasetSchema) {
      return <Typography className="text-gray-500">Select a dataset to see its schema and build queries.</Typography>;
    }

    const { dateFields = [], dimensions = [], metrics = [] } = datasetSchema;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} className="h-[calc(100vh-425px)] overflow-auto">
        <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200">
          <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600 }}>
            Query Preset Loader
          </Typography>
          <Box className="flex gap-3 items-center">
            <TextField
              label="Preset id"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
            />
            <Button variant="outlined" onClick={() => void handleLoadPreset()}>
              Load Preset
            </Button>
          </Box>
        </Paper>

        {/* Date Range */}
        <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200">
          <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 3 }}>
            Date Range
          </Typography>
          <Box className="grid grid-cols-4 gap-4">
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Date Field</InputLabel>
              <Select
                value={dateRange.field}
                onChange={(e) => setDateRange({ ...dateRange, field: e.target.value })}
                label="Date Field"
              >
                <MenuItem value="">None</MenuItem>
                {dateFields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>{field.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From"
                value={dateRange.from ? dayjs(dateRange.from) : null}
                onChange={(newValue) => setDateRange({ ...dateRange, from: newValue ? dayjs(newValue).format("YYYY-MM-DD") : null })}
              // slotProps={{ textField: { size: "small" } }}
              />
              <DatePicker
                label="To"
                value={dateRange.to ? dayjs(dateRange.to) : null}
                minDate={dateRange.from ? dayjs(dateRange.from) : undefined}
                onChange={(newValue) => setDateRange({ ...dateRange, to: newValue ? dayjs(newValue).format("YYYY-MM-DD") : null })}
              // slotProps={{ textField: { size: "small" } }}
              />
            </LocalizationProvider>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Granularity</InputLabel>
              <Select
                value={dateRange.granularity}
                onChange={(e) => setDateRange({ ...dateRange, granularity: e.target.value })}
                label="Granularity"
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="quarter">Quarter</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <div className="flex items-center gap-4">
          {/* Dimensions */}
          <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200 w-full">
            <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 3 }}>
              Dimensions
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Dimensions</InputLabel>
              <Select
                multiple
                value={queryPayload.dimensions || []}
                onChange={(e) => updateQueryPayload({ dimensions: e.target.value as string[] })}
                input={<OutlinedInput label="Select Dimensions" />}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {dimensions.map((dim) => (
                  <MenuItem key={dim.id} value={dim.id}>
                    <Checkbox checked={(queryPayload.dimensions || []).indexOf(dim.id) > -1} />
                    {/* <ListItemText primary={dim.id} secondary={dim.type} className="!text-gray-800" /> */}
                    <div>
                      <div className="!text-gray-800" >{dim.id}</div>
                      <div className="!text-gray-500" >{dim.type}</div>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* Metrics */}
          <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200 w-full">
            <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 3 }}>
              Metrics
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Metrics</InputLabel>
              <Select
                multiple
                value={queryPayload.metrics || []}
                onChange={(e) => updateQueryPayload({ metrics: e.target.value as string[] })}
                input={<OutlinedInput label="Select Metrics" />}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {metrics.map((metric) => (
                  <MenuItem key={metric.id} value={metric.id}>
                    <Checkbox checked={(queryPayload.metrics || []).indexOf(metric.id) > -1} />
                    {/* <ListItemText primary={metric.id} secondary={`${metric.aggregation} (${metric.type})`} /> */}
                    <div>
                      <div className="!text-gray-800" >{metric.id}</div>
                      <div className="!text-gray-500" >{metric.aggregation} (${metric.type})</div>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

        </div>

        {/* Filters */}
        <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200">
          <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 3 }}>
            Filters
          </Typography>
          {filterConditions.map((cond, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Field</InputLabel>
                <Select
                  value={cond.field}
                  onChange={(e) => {
                    const newConds = [...filterConditions];
                    newConds[idx].field = e.target.value;
                    setFilterConditions(newConds);
                  }}
                  label="Field"
                >
                  {[...dimensions, ...dateFields].map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={cond.operator}
                  onChange={(e) => {
                    const newConds = [...filterConditions];
                    newConds[idx].operator = e.target.value;
                    setFilterConditions(newConds);
                  }}
                  label="Operator"
                >
                  <MenuItem value="eq">=</MenuItem>
                  <MenuItem value="ne">!=</MenuItem>
                  <MenuItem value="gt">&gt;</MenuItem>
                  <MenuItem value="lt">&lt;</MenuItem>
                  <MenuItem value="gte">&gt;=</MenuItem>
                  <MenuItem value="lte">&lt;=</MenuItem>
                  <MenuItem value="contains">Contains</MenuItem>
                  <MenuItem value="in">In</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Value"
                value={cond.value}
                onChange={(e) => {
                  const newConds = [...filterConditions];
                  newConds[idx].value = e.target.value;
                  setFilterConditions(newConds);
                }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => setFilterConditions(filterConditions.filter((_, i) => i !== idx))}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterConditions([...filterConditions, { field: "", operator: "eq", value: "" }])}
          >
            Add Filter
          </Button>
        </Paper>

        {/* Top N */}
        <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200">
          <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 3 }}>
            Top N
          </Typography>
          <div className="grid grid-cols-4 items-center gap-4">
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Dimension</InputLabel>
              <Select
                value={topN?.dimension || ""}
                onChange={(e) => {
                  const dim = e.target.value;
                  setTopN((prev) => ({
                    dimension: dim,
                    metric: prev?.metric || "",
                    limit: prev?.limit || 10,
                    includeOthers: prev?.includeOthers !== undefined ? prev.includeOthers : true,
                  }));
                }}
                label="Dimension"
              >
                <MenuItem value="">None</MenuItem>
                {dimensions.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={topN?.metric || ""}
                onChange={(e) => {
                  const met = e.target.value;
                  setTopN((prev) => ({
                    dimension: prev?.dimension || "",
                    metric: met,
                    limit: prev?.limit || 10,
                    includeOthers: prev?.includeOthers !== undefined ? prev.includeOthers : true,
                  }));
                }}
                label="Metric"
              >
                <MenuItem value="">None</MenuItem>
                {metrics.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Limit"
              type="number"
              value={topN?.limit || 10}
              // onChange={(e) => setTopN((prev) => ({ ...prev, limit: parseInt(e.target.value, 10) || 10 }))}
              onChange={(e) => {
                const limit = parseInt(e.target.value, 10) || 10;
                setTopN((prev) => ({
                  dimension: prev?.dimension || "",
                  metric: prev?.metric || "",
                  limit: limit,
                  includeOthers: prev?.includeOthers !== undefined ? prev.includeOthers : true,
                }));
              }}
            // sx={{ width: 100 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={topN?.includeOthers !== undefined ? topN.includeOthers : true}
                  // onChange={(e) => setTopN((prev) => ({ ...prev, includeOthers: e.target.checked }))}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTopN((prev) => ({
                      dimension: prev?.dimension || "",
                      metric: prev?.metric || "",
                      limit: prev?.limit || 10,
                      includeOthers: checked,
                    }));
                  }}

                />
              }
              className="!text-gray-800"
              label="Include Others"
            />
          </div>
        </Paper>

        {/* Sort */}
        <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200">
          <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 3 }}>
            Sort
          </Typography>
          {sort.map((s, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Field</InputLabel>
                <Select
                  value={s.field}
                  onChange={(e) => {
                    const newSort = [...sort];
                    newSort[idx].field = e.target.value;
                    setSort(newSort);
                  }}
                  label="Field"
                >
                  {[...dimensions, ...metrics].map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Direction</InputLabel>
                <Select
                  value={s.direction}
                  onChange={(e) => {
                    const newSort = [...sort];
                    newSort[idx].direction = e.target.value as "asc" | "desc";
                    setSort(newSort);
                  }}
                  label="Direction"
                >
                  <MenuItem value="asc">Asc</MenuItem>
                  <MenuItem value="desc">Desc</MenuItem>
                </Select>
              </FormControl>
              <IconButton
                size="small"
                color="error"
                onClick={() => setSort(sort.filter((_, i) => i !== idx))}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSort([...sort, { field: "", direction: "asc" }])}
          >
            Add Sort
          </Button>
        </Paper>

        {/* Limit & Totals */}
        <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200">
          <div className="flex items-center gap-2">
            <TextField
              size="small"
              label="Limit"
              type="number"
              value={queryPayload.limit || 50}
              onChange={(e) => updateQueryPayload({ limit: parseInt(e.target.value, 10) || 50 })}
              sx={{ width: 250 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={queryPayload.includeTotals !== undefined ? queryPayload.includeTotals : true}
                  onChange={(e) => updateQueryPayload({ includeTotals: e.target.checked })}
                />
              }
              className="text-gray-800"
              label="Include Totals"
            />
          </div>
        </Paper>

        {/* JSON Preview (Read-Only / Editable) */}
        <Paper variant="outlined" sx={{ p: 2 }} className="!bg-white border border-gray-200">
          <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 1 }}>
            Query Payload (JSON)
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={6}
            maxRows={12}
            value={JSON.stringify(buildQueryFromState(), null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                // Update state from JSON (advanced users)
                // For simplicity, we can merge or replace
                setQueryPayload(parsed);
                // Also need to sync filter conditions etc. This is advanced.
                // For now, we just show read-only.
              } catch {
                // Allow invalid JSON during typing
              }
            }}
            sx={{
              "& .MuiInputBase-root": { fontFamily: "monospace", fontSize: "0.875rem" },
            }}
          />
          <FormHelperText className="text-gray-500">You can edit this JSON directly. Changes will reflect in the form above (limited).</FormHelperText>
        </Paper>
      </Box>
    );
  };

  // ============ Render Reports Tab ============

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
            {/* <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setIsEditingReport(false);
                setReportForm({
                  name: "",
                  datasetId: datasets.length > 0 ? datasets[0].datasetId : "",
                  query: { dimensions: [], metrics: [], limit: 50, includeTotals: true },
                  visualization: { type: "table", config: {} },
                  visibility: "PRIVATE",
                });
                setReportFormOpen(true);
              }}
            >
              New Report
            </Button> */}
          </Box>

          <Grid container spacing={2}>
            {reports.length > 0 ? (
              reports.map((report) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report.id}>
                  <Card variant="outlined" className="!bg-white" sx={{ height: "100%", borderRadius: 3, transition: "all 0.3s ease", "&:hover": { boxShadow: theme.shadows[4], transform: "translateY(-2px)" } }}>
                    <CardHeader
                      title={<Typography className="text-gray-800 !font-bold">{report.name}</Typography>}
                      subheader={
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                          <Chip label={report.datasetId} size="small" variant="outlined" color="success" />
                          <Chip label={report.visualizationType || "Table"} size="small" variant="outlined" color="primary" />
                          <Chip label={report.visibility} size="small" variant="outlined" color={report.visibility === "PRIVATE" ? "default" : "warning"} />
                        </Box>
                      }
                      // avatar={<Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}><ReportOutlined /></Avatar>}
                      action={
                        <Box>
                          {report.editable && (
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => { handleViewReport(report.id); setTimeout(() => { if (selectedReport) handleEditReport(selectedReport); }, 500); }}>
                                <EditOutlined fontSize="small" color="primary" className="!w-4" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteReport(report.id)}>
                              <DeleteOutlineOutlined fontSize="small" className="!w-4" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <div className="px-4">
                      <Chip label={`Updated: ${new Date(report.updatedAt).toLocaleDateString()}`} size="small" variant="outlined" className="!text-gray-800" />
                    </div>
                    <div className="flex items-center justify-end gap-2 p-4 pt-0">
                      <Button size="small" variant="outlined" className="!text-primary !border-primary" startIcon={<VisibilityIcon />} onClick={() => handleViewReport(report.id)}>View</Button>
                      <Button size="small" variant="contained" color="success" startIcon={<PlayArrow />} onClick={() => handleRunReport(report.id)}>Run</Button>
                      {/* <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => handleExportReport(report.id, "csv")} disabled={reportExportLoading}>Export</Button> */}
                    </div>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info">No reports are currently available. Create your first report!</Alert>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );

  // ============ Render Query Engine Tab ============

  const renderQueryEngineTab = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* <TextField
            select
            label="Dataset"
            value={selectedDataset}
            onChange={(event) => setSelectedDataset(event.target.value)}
            sx={{ width: 250 }}
            slotProps={{ select: { native: true } }}
          >
            <option value="">Select a dataset</option>
            {datasets.map((dataset) => (
              <option key={dataset.datasetId} value={dataset.datasetId}>
                {dataset.title || dataset.datasetId} {!dataset.available && "(Coming Soon)"}
              </option>
            ))}
          </TextField> */}
          <FormControl sx={{ width: 250 }}>
            <InputLabel>Dataset</InputLabel>
            <Select
              value={selectedDataset}
              onChange={(event) => setSelectedDataset(event.target.value)}
              label="Dataset"
            >
              <MenuItem value="">Select a dataset</MenuItem>
              {datasets.map((dataset) => (
                <MenuItem key={dataset.datasetId} value={dataset.datasetId}>{dataset.title || dataset.datasetId} {!dataset.available && "(Coming Soon)"}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<SchemaIcon />} onClick={handleLoadDatasetSchema} disabled={!selectedDataset}>View Schema</Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadWorkspace} disabled={loading}>Refresh</Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={exportLoading || !selectedDataset}
          >
            {exportLoading ? <CircularProgress size={24} /> : "Export"}
          </Button>
        </div>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              setExportMenuAnchor(null);
              setExportFormat("csv");
              handleCreateExport();
            }}
          >
            Export as CSV
          </MenuItem>
          <MenuItem
            onClick={() => {
              setExportMenuAnchor(null);
              setExportFormat("xlsx");
              handleCreateExport();
            }}
          >
            Export as Excel
          </MenuItem>
        </Menu>
        {/* <Button variant="outlined" startIcon={<Download />} onClick={handleCreateExport} disabled={exportLoading || !selectedDataset}>
          {exportLoading ? <CircularProgress size={24} /> : "Export"}
        </Button>
        <TextField select size="small" label="Format" value={exportFormat} onChange={(e) => setExportFormat(e.target.value as "csv" | "xlsx")} sx={{ width: 120 }}>
          <MenuItem value="csv">CSV</MenuItem>
          <MenuItem value="xlsx">Excel</MenuItem>
        </TextField> */}
      </div>

      {renderQueryBuilder()}

      {validationResult && (
        <Alert severity={validationResult.valid ? "success" : "error"} onClose={() => setValidationResult(null)}>
          {validationResult.message}
        </Alert>
      )}

      <div className="flex items-center justify-end gap-4">
        <Button variant="contained" color="success" startIcon={<PlayArrow />} onClick={handleRunQuery} disabled={queryRunning || !selectedDataset} sx={{ minWidth: 120 }}>
          {queryRunning ? <CircularProgress size={24} /> : "Run Query"}
        </Button>
        <Button variant="outlined" color="info" startIcon={validating ? <CircularProgress size={20} /> : <CheckCircleIcon />} onClick={handleValidateQuery} disabled={validating || !selectedDataset}>
          {validating ? "Validating..." : "Validate"}
        </Button>

        <Button variant="outlined" className="!text-primary !border-primary" startIcon={<SaveIcon />} onClick={() => {
          const query = buildQueryFromState();
          const hasDimension = (query.dimensions || []).length > 0;
          const hasMetric = (query.metrics || []).length > 0;
          if (!hasDimension && !hasMetric) {
            showSnackbar("Query must include at least one dimension or metric.", "error");
            return;
          }
          setIsEditingReport(false);
          setReportForm({
            name: "",
            datasetId: selectedDataset || "",
            query: query,
            visualization: { type: "table", config: {} },
            visibility: "PRIVATE",
          });
          setReportFormOpen(true);
        }} disabled={!selectedDataset}>
          Save as Report
        </Button>
      </div>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {queryResult && (
        <Fade in={!!queryResult}>
          <Paper variant="outlined" className="!bg-white" sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600 }}>Query Result</Typography>
                <Typography variant="caption" className="text-gray-500">
                  {queryResult.meta?.rowCount || 0} rows • {queryResult.meta?.queryTimeMs || 0}ms
                  {queryResult.meta?.dataset && ` • Dataset: ${queryResult.meta.dataset}`}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip label={`${queryResult.data?.length || 0} rows`} size="small" color="primary" />
                {queryResult.totals && Object.keys(queryResult.totals).length > 0 && (
                  <Chip label="Has Totals" size="small" color="success" variant="outlined" />
                )}
              </Box>
            </Box>

            {queryResult.data && queryResult.data.length > 0 && (
              <TableContainer className="max-h-[400px] border border-gray-200">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {queryResult.columns?.map((col) => (
                        <TableCell key={col.id} sx={{ bgcolor: theme.palette.grey[100], fontWeight: 600 }}>
                          {col.label || col.id}
                          <Chip label={col.type} size="small" variant="outlined" className="text-gray-800 ml-1 text-[10px] !h-[20px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryResult.data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                      <TableRow key={idx} hover sx={getRowColor(idx)}>
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
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}

            {queryResult.totals && Object.keys(queryResult.totals).length > 0 && (
              <div className="!bg-white-50 !mt-5 !p-2 rounded-md">
                <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 1 }}>Totals</Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {Object.entries(queryResult.totals).map(([key, value]) => (
                    <Chip key={key} label={`${key}: ${safeDisplayValue(value)}`} variant="outlined" size="small" color="info" />
                  ))}
                </Box>
              </div>
            )}

            <Box sx={{ mt: 2 }}>
              <Button size="small" variant="text" onClick={() => {
                const jsonStr = JSON.stringify(queryResult, null, 2);
                navigator.clipboard?.writeText(jsonStr).then(() => showSnackbar("JSON copied to clipboard", "success"));
              }}>Copy JSON</Button>
            </Box>
          </Paper>
        </Fade>
      )}
    </Box>
  );

  // ============ Render Exports Tab ============

  const renderExportsTab = () => (
    <div className="!bg-white border border-gray-200 grid gap-3">
      <Paper variant="outlined" className="!bg-white" sx={{ p: 3 }}>
        <Typography variant="subtitle1" className="text-gray-800" sx={{ fontWeight: 600, mb: 3 }}>Create New Export</Typography>
        <div className="flex items-center gap-4">
          {/* <TextField
            select
            label="Dataset"
            value={selectedDataset}
            onChange={(event) => setSelectedDataset(event.target.value)}
            sx={{ width: 200 }}
            slotProps={{ select: { native: true } }}
          >
            <option value="">Select a dataset</option>
            {datasets.map((dataset) => (
              <option key={dataset.datasetId} value={dataset.datasetId}>
                {dataset.title || dataset.datasetId}
              </option>
            ))}
          </TextField> */}
          <FormControl sx={{ width: 250 }}>
            <InputLabel>Dataset</InputLabel>
            <Select
              value={selectedDataset}
              onChange={(event) => setSelectedDataset(event.target.value)}
              label="Dataset"
            >
              <MenuItem value="">Select a dataset</MenuItem>
              {datasets.map((dataset) => (
                <MenuItem key={dataset.datasetId} value={dataset.datasetId}>{dataset.title || dataset.datasetId} {!dataset.available && "(Coming Soon)"}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportMenuAnchorExports(e.currentTarget)}
            disabled={exportLoading || !selectedDataset}
          >
            {exportLoading ? "Creating..." : "Create Export"}
          </Button>
          <Menu
            anchorEl={exportMenuAnchorExports}
            open={Boolean(exportMenuAnchorExports)}
            onClose={() => setExportMenuAnchorExports(null)}
          >
            <MenuItem
              onClick={() => {
                setExportMenuAnchorExports(null);
                setExportFormat("csv");
                handleCreateExport();
              }}
            >
              Export as CSV
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExportMenuAnchorExports(null);
                setExportFormat("xlsx");
                handleCreateExport();
              }}
            >
              Export as Excel
            </MenuItem>
          </Menu>
        </div>
        {error && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      </Paper>

      {exportJob && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Export Job Status</Typography>
            <Chip label={exportJob.status} color={getStatusColor(exportJob.status) as any} icon={<span>{getStatusIcon(exportJob.status)}</span>} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip label={`Job: ${exportJob.jobRef}`} size="small" variant="outlined" />
              <Chip label={`Format: ${exportJob.format}`} size="small" variant="outlined" />
              {exportJob.rowCount > 0 && <Chip label={`Rows: ${exportJob.rowCount}`} size="small" variant="outlined" />}
              {exportJob.fileBytes > 0 && <Chip label={`Size: ${(exportJob.fileBytes / 1024).toFixed(1)} KB`} size="small" variant="outlined" />}
            </Box>
            <LinearProgress variant="determinate" value={exportJob.progressPercent || 0} sx={{ height: 8, borderRadius: 4 }} color={exportJob.status === "failed" ? "error" : "primary"} />
            <Typography variant="caption" color="textSecondary">{exportJob.progressPercent || 0}% complete</Typography>
            {exportJob.status === "completed" && exportJob.downloadUrl && (
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                <Button variant="contained" color="success" startIcon={<FileDownloadIcon />} onClick={() => handleDownloadFromUrl(exportJob.downloadUrl!)}>Download File</Button>
                <Button variant="outlined" onClick={() => handleDownloadExport(exportJob.jobRef)}>Download via Proxy</Button>
              </Box>
            )}
            {exportJob.status === "failed" && exportJob.errorMessage && <Alert severity="error">{exportJob.errorMessage}</Alert>}
          </Box>
        </Paper>
      )}

      {exportJobs.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Export History</Typography>
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
                    <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{job.jobRef}</Typography></TableCell>
                    <TableCell>{job.format?.toUpperCase()}</TableCell>
                    <TableCell><Chip label={job.status} size="small" color={getStatusColor(job.status) as any} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LinearProgress variant="determinate" value={job.progressPercent || 0} sx={{ width: 80, height: 4, borderRadius: 2 }} />
                        <Typography variant="caption">{job.progressPercent || 0}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="caption">{new Date(job.createdAt).toLocaleDateString()}</Typography></TableCell>
                    <TableCell>
                      {job.status === "completed" && job.downloadUrl && (
                        <Tooltip title="Download">
                          <IconButton size="small" color="success" onClick={() => handleDownloadFromUrl(job.downloadUrl!)}>
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
    </div>
  );

  // ============ Render Datasets Tab ============

  const renderDatasetsTab = () => (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Available Datasets</Typography>
      <Grid container spacing={2}>
        {datasets.map((dataset) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dataset.datasetId}>
            <Card variant="outlined" className="bg-white" sx={{ borderRadius: 3, transition: "all 0.3s ease", "&:hover": { boxShadow: theme.shadows[4], transform: "translateY(-2px)" } }}>
              <CardHeader
                title={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Typography sx={{ fontWeight: 600 }} className="text-gray-800">{dataset.title || dataset.datasetId}</Typography>
                  {dataset.available ? <Chip label="Available" size="small" color="success" sx={{ fontSize: "0.625rem" }} /> :
                    <Chip label="Coming Soon" size="small" color="warning" sx={{ fontSize: "0.625rem" }} />}
                </Box>}
                subheader={<Typography variant="caption" className="text-gray-500" sx={{ fontFamily: "monospace" }}>{dataset.datasetId}</Typography>}
                avatar={<Avatar sx={{ bgcolor: dataset.available ? theme.palette.success.main : theme.palette.warning.main }}><SchemaIcon /></Avatar>}
              />
              <CardContent>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button size="small" variant="outlined" startIcon={<SchemaIcon />} onClick={() => { setSelectedDataset(dataset.datasetId); handleLoadDatasetSchema(); }} disabled={!dataset.available}>View Schema</Button>
                  <Button size="small" variant="contained" startIcon={<PlayArrow />} onClick={() => { setSelectedDataset(dataset.datasetId); setActiveTab(1); }} disabled={!dataset.available}>Query</Button>
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
    <Dialog open={reportFormOpen} onClose={() => setReportFormOpen(false)} maxWidth="md" sx={{ "& .MuiDialog-paper": { width: "600px", maxWidth: "600px" } }}>
      <div className="p-2 border-b border-gray-200 flex items-center justify-between">
        <div className="text-[12px] ml-4">
          <div>{isEditingReport ? "Edit Report" : "Create New Report"}</div>
          <div className="text-[12px] text-gray-500">{isEditingReport ? "Update your saved report" : "Save a query as a report for later use"}</div>
        </div>
        <IconButton onClick={() => setReportFormOpen(false)}><CloseIcon className="text-gray-800" /></IconButton>
      </div>
      <DialogContent sx={{ p: 3 }}>
        <div className="grid gap-5">
          <div className="flex items-center gap-2">
            <TextField fullWidth label="Report Name" value={reportForm.name} onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })} required placeholder="Enter a descriptive name for your report" />
            <FormControl fullWidth required>
              <InputLabel>Dataset</InputLabel>
              <Select value={reportForm.datasetId} onChange={(e) => setReportForm({ ...reportForm, datasetId: e.target.value })} label="Dataset">
                {datasets.map((dataset) => (
                  <MenuItem key={dataset.datasetId} value={dataset.datasetId}>
                    {dataset.title || dataset.datasetId}
                    {!dataset.available && " (Coming Soon)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select value={reportForm.visibility} onChange={(e) => setReportForm({ ...reportForm, visibility: e.target.value as "PRIVATE" | "ROLE" | "TENANT" })} label="Visibility">
                <MenuItem value="PRIVATE">Private (Only you)</MenuItem>
                <MenuItem value="ROLE">Role Based</MenuItem>
                <MenuItem value="TENANT">Tenant (All users)</MenuItem>
              </Select>
            </FormControl>
            {reportForm.visibility === "ROLE" && (
              <TextField
                fullWidth
                label="Visibility Role"
                value={reportForm.visibilityRole || ""}
                onChange={(e) => setReportForm({ ...reportForm, visibilityRole: e.target.value })}
                placeholder="e.g., admin, manager"
              />
            )}
          </div>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Query Configuration</Typography>
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
                  setJsonError(false);
                } catch {
                  setJsonError(true);
                }
              }}
              placeholder="Enter your query in JSON format..."
              sx={{ "& .MuiInputBase-root": { fontFamily: "monospace", fontSize: "0.875rem" } }}
            />
            <FormHelperText className="text-gray-800">
              {(() => {
                try { JSON.stringify(reportForm.query); return "✅ Valid JSON"; } catch { return "⚠️ Invalid JSON"; }
              })()}
            </FormHelperText>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2.5 }}>Visualization (Optional)</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField select label="Chart Type" value={reportForm.visualization?.type || "table"} onChange={(e) => setReportForm({ ...reportForm, visualization: { ...reportForm.visualization, type: e.target.value } })} sx={{ flex: 1 }}>
                <MenuItem value="table">Table</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
              </TextField>
            </Box>
          </Box>
        </div>
      </DialogContent>
      <DialogActions className="border-t border-gray-200 !p-4">
        <Button onClick={() => setReportFormOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200">Cancel</Button>
        <Button variant="contained" className="!bg-primary" startIcon={<SaveIcon />} onClick={isEditingReport ? handleUpdateReport : handleCreateReport} disabled={!reportForm.name.trim() || !reportForm.datasetId || jsonError}>
          {isEditingReport ? "Update Report" : "Create Report"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============ Report Export Dialog ============

  const renderReportExportDialog = () => (
    <Dialog open={reportExportDialogOpen} onClose={() => setReportExportDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Report Export</Typography>
          <IconButton onClick={() => setReportExportDialogOpen(false)}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {reportExportJob ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2">Export Status</Typography>
              <Chip label={reportExportJob.status} color={getStatusColor(reportExportJob.status) as any} icon={<span>{getStatusIcon(reportExportJob.status)}</span>} />
            </Box>
            <LinearProgress variant="determinate" value={reportExportJob.progressPercent || 0} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" color="textSecondary">{reportExportJob.progressPercent || 0}% complete</Typography>
            {reportExportJob.status === "completed" && reportExportJob.downloadUrl && (
              <Button variant="contained" color="success" startIcon={<FileDownloadIcon />} onClick={() => { handleDownloadFromUrl(reportExportJob.downloadUrl!); setReportExportDialogOpen(false); }} fullWidth>
                Download Export
              </Button>
            )}
            {reportExportJob.status === "failed" && reportExportJob.errorMessage && <Alert severity="error">{reportExportJob.errorMessage}</Alert>}
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        )}
      </DialogContent>
    </Dialog>
  );

  // ============ Schema Dialog ============

  const renderSchemaDialog = () => (
    <Dialog open={schemaDialogOpen} onClose={() => setSchemaDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle className="border-b border-gray-200">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Dataset Schema: {datasetSchema?.title || selectedDataset}</Typography>
            <Typography variant="caption" className="text-gray-500">{datasetSchema?.datasetId}</Typography>
          </Box>
          <IconButton onClick={() => setSchemaDialogOpen(false)}><CloseIcon className="text-gray-800" /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {datasetSchema ? (
          <Box>
            {datasetSchema.dateFields && datasetSchema.dateFields.length > 0 ? (
              <div className="border-b border-gray-200 p-4">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Date Fields</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {datasetSchema.dateFields.map((field) => <Chip key={field.id} label={`${field.id} (${field.type})`} size="small" color="info" variant="outlined" />)}
                </Box>
              </div>
            ) : (
              <div className="border-b border-gray-200 p-4 flex items-center justify-center">No Datafields available</div>
            )}
            {datasetSchema.dimensions && datasetSchema.dimensions.length > 0 ? (
              <div className="border-b border-gray-200 p-4">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Dimensions</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {datasetSchema.dimensions.map((dim) => <Chip key={dim.id} label={`${dim.id} (${dim.type})`} size="small" color="primary" variant="outlined" />)}
                </Box>
              </div>
            ) : (
              <div className="border-b border-gray-200 p-4 flex items-center justify-center">No Dimensions available</div>
            )}
            {datasetSchema.metrics && datasetSchema.metrics.length > 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Metrics</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {datasetSchema.metrics.map((metric) => <Chip key={metric.id} label={`${metric.id} (${metric.aggregation})`} size="small" color="success" variant="outlined" />)}
                </Box>
              </Box>
            ) : (
              <div className="border-b border-gray-200 p-4 flex items-center justify-center">No Metrics available</div>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        )}
      </DialogContent>
      <DialogActions className="!p-4 border-t border-gray-200">
        <Button variant="outlined" className="!border-gray-200 !text-gray-800" onClick={() => setSchemaDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // ============ Report Detail Dialog ============

  const renderReportDetailDialog = () => (
    <Dialog open={reportDetailOpen} onClose={() => setReportDetailOpen(false)} maxWidth="lg">
      {/* <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}> */}
      <div className="flex items-center justify-between border-b border-gray-200 p-2">
        <div className="ml-4">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{selectedReport?.name || "Report Details"}</Typography>
          <Typography variant="caption" className="text-gray-500">{selectedReport?.datasetId} • {selectedReport?.visibility}</Typography>
        </div>
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => { if (selectedReport) { handleEditReport(selectedReport); setReportDetailOpen(false); } }} disabled={!selectedReport?.editable}>Edit</Button>
            <Button size="small" variant="contained" startIcon={<PlayArrow />} onClick={() => { if (selectedReport) { handleRunReport(selectedReport.id); setReportDetailOpen(false); } }}>Run</Button>
            <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => { if (selectedReport) { handleExportReport(selectedReport.id, "csv"); setReportDetailOpen(false); } }}>Export</Button> */}
          <IconButton onClick={() => setReportDetailOpen(false)}><CloseIcon className="text-gray-800" /></IconButton>
        </Box>
      </div>
      {/* </DialogTitle> */}
      <DialogContent sx={{ p: 2 }}>
        {selectedReport ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip label={`Dataset: ${selectedReport.datasetId}`} variant="outlined" className="text-gray-800" />
              <Chip label={`Visibility: ${selectedReport.visibility}`} variant="outlined" className="text-gray-800" />
              <Chip label={`Created: ${new Date(selectedReport.createdAt).toLocaleDateString()}`} variant="outlined" className="text-gray-800" />
              <Chip label={`Updated: ${new Date(selectedReport.updatedAt).toLocaleDateString()}`} variant="outlined" className="text-gray-800" />
              {/* {selectedReport.editable && <Chip label="Editable" color="success" size="small" />} */}
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Query Configuration</Typography>
            <Paper variant="outlined" sx={{ p: 2, fontFamily: "monospace", fontSize: "0.75rem", maxHeight: 300, overflow: "auto" }} className="!bg-head">
              <pre className="text-gray-800">{JSON.stringify(selectedReport.query, null, 2)}</pre>
            </Paper>

            {selectedReport.visualization && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Visualization</Typography>
                <Paper variant="outlined" sx={{ p: 2, fontFamily: "monospace", fontSize: "0.75rem", maxHeight: 200, overflow: "auto" }} className="!bg-head">
                  <pre className="text-gray-800">{JSON.stringify(selectedReport.visualization, null, 2)}</pre>
                </Paper>
              </>
            )}


          </Box>
        ) : (
          <CircularProgress />
        )}
      </DialogContent>
      <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => { if (selectedReport) { handleExportReport(selectedReport.id, "csv"); setReportDetailOpen(false); } }}>Export as CSV</Button>
        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => { if (selectedReport) { handleExportReport(selectedReport.id, "xlsx"); setReportDetailOpen(false); } }}>Export as Excel</Button>
        <Button variant="contained" color="success" startIcon={<PlayArrow />} onClick={() => { if (selectedReport) { handleRunReport(selectedReport.id); setReportDetailOpen(false); } }}>Run</Button>
      </div>
    </Dialog>
  );

  // ============ Main Render ============

  return (
    <Box className="bg-white-50">
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }} className="bg-white-50 text-gray-800 border border-gray-200">
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>BI Workspace</Typography>
            <Typography color="text.secondary">Manage reports, query datasets, and export jobs from one place.</Typography>
          </Box>
          <Button variant="contained" className="!bg-primary" startIcon={<Dashboard />} onClick={() => window.history.back()}>Back to Dashboard</Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper sx={{ borderRadius: 3 }} className="bg-white-50 text-gray-800 border border-gray-200">
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable"
          scrollButtons="auto" indicatorColor="primary" textColor="primary" className="!border-b !border-gray-300"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          {tabs.map((tab) => <Tab key={tab.label} className="!text-gray-800" iconPosition="start" label={tab.label} />)}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel index={0} value={activeTab}>{renderReportsTab()}</TabPanel>
          <TabPanel index={1} value={activeTab}>{renderQueryEngineTab()}</TabPanel>
          <TabPanel index={2} value={activeTab}>{renderExportsTab()}</TabPanel>
          <TabPanel index={3} value={activeTab}>{renderDatasetsTab()}</TabPanel>
          <TabPanel index={4} value={activeTab}>{renderBuilderAdmin()}</TabPanel>
          <TabPanel index={5} value={activeTab}>{renderQuerySetAdmin()}</TabPanel>
        </Box>
      </Paper>

      {renderSchemaDialog()}
      {renderReportDetailDialog()}
      {renderReportFormDialog()}
      {renderReportExportDialog()}
    </Box>
  );
}

// ============ TabPanel Component (used internally) ============

// function TabPanel({ children, index, value }: { children?: ReactNode; index: number; value: number }) {
//   return value === index ? <Box sx={{ py: 0 }}>{children}</Box> : null;
// }

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 0 }}>{children}</Box>
      )}
    </div>
  );
}
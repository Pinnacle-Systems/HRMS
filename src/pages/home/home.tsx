import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Fade,
  Zoom,
  alpha,
  useTheme,
  TextField,
  Skeleton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIndicatorIcon,
  FilterList as FilterListIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Restore as RestoreIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  BusinessCenter as BusinessCenterIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  CloudDownload as CloudDownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useUI } from "../../context/Snackbar";
import { dashboardService } from "../../services/modules/dashboard";
import type {
  DashboardPage,
  DashboardData,
  DashboardWidget,
  CatalogWidget,
  DashboardPreferences,
  DrilldownResponse,
  UpdatePreferencesRequest,
  SupportedFilter,
} from "../../services/modules/dashboard";

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

// Widget Type Icons
const getWidgetIcon = (type: string) => {
  const typeLower = type?.toLowerCase() || "";
  if (["employee", "employees", "headcount"].includes(typeLower)) return <PeopleIcon />;
  if (["attendance", "absenteeism"].includes(typeLower)) return <TimelineIcon />;
  if (["performance", "rating"].includes(typeLower)) return <TrendingUpIcon />;
  if (["payroll", "salary", "cost"].includes(typeLower)) return <AttachMoneyIcon />;
  if (["recruitment", "hiring", "candidates"].includes(typeLower)) return <BusinessCenterIcon />;
  if (["training", "learning"].includes(typeLower)) return <SchoolIcon />;
  if (["rewards", "recognition"].includes(typeLower)) return <EmojiEventsIcon />;
  if (["analytics", "report", "kpi"].includes(typeLower)) return <AssessmentIcon />;
  return <DashboardIcon />;
};

// Widget Color Schemes
const getWidgetColor = (type: string) => {
  const typeLower = type?.toLowerCase() || "";
  if (["employee", "employees", "headcount"].includes(typeLower)) {
    return { bg: "#E3F2FD", color: "#1976D2" };
  }
  if (["attendance", "absenteeism"].includes(typeLower)) {
    return { bg: "#E8F5E9", color: "#388E3C" };
  }
  if (["performance", "rating"].includes(typeLower)) {
    return { bg: "#FFF3E0", color: "#F57C00" };
  }
  if (["payroll", "salary", "cost"].includes(typeLower)) {
    return { bg: "#F3E5F5", color: "#7B1FA2" };
  }
  if (["recruitment", "hiring", "candidates"].includes(typeLower)) {
    return { bg: "#E0F7FA", color: "#00838F" };
  }
  if (["training", "learning"].includes(typeLower)) {
    return { bg: "#FFF8E1", color: "#F9A825" };
  }
  if (["rewards", "recognition"].includes(typeLower)) {
    return { bg: "#FCE4EC", color: "#C2185B" };
  }
  if (["analytics", "report", "kpi"].includes(typeLower)) {
    return { bg: "#E8EAF6", color: "#283593" };
  }
  return { bg: "#F5F5F5", color: "#616161" };
};

// ============ Widget Renderer ============

function WidgetContent({ widget }: { widget: DashboardWidget }) {
  const theme = useTheme();
  const colors = getWidgetColor(widget.type);
  const Icon = getWidgetIcon(widget.type);

  if (widget.error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {widget.error}
      </Alert>
    );
  }

  // Render different widget types
  switch (widget.type?.toLowerCase()) {
    case "kpi":
    case "metric":
      return (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
            {widget.data?.value ?? "—"}
          </Typography>
          {widget.data?.comparison && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 1 }}>
              <Chip
                size="small"
                label={`${widget.data.comparison.changePercent > 0 ? "+" : ""}${widget.data.comparison.changePercent}%`}
                color={widget.data.comparison.changePercent > 0 ? "success" : "error"}
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="caption" color="textSecondary">
                {widget.data.comparison.label || "vs previous"}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {widget.data?.label || widget.title || "Metric"}
          </Typography>
        </Box>
      );

    case "chart":
      return (
        <Box sx={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <Typography color="textSecondary" variant="body2">
            Chart Widget
          </Typography>
          {widget.data && Object.keys(widget.data).length > 0 && (
            <Typography variant="caption" color="textSecondary">
              {safeDisplayValue(widget.data).substring(0, 100)}
            </Typography>
          )}
        </Box>
      );

    case "table":
      return (
        <Box sx={{ maxHeight: 300, overflow: "auto" }}>
          <Typography color="textSecondary" variant="body2">
            Table Widget
          </Typography>
        </Box>
      );

    case "summary":
      const data = widget.data || {};
      return (
        <Grid container spacing={1}>
          {Object.entries(data).map(([key, value]) => (
            <Grid size={{ xs: 6, sm: 4 }} key={key}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {safeDisplayValue(value)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {key.replace(/_/g, " ")}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      );

    case "list":
      const items = Array.isArray(widget.data) ? widget.data : [];
      return (
        <Box>
          {items.slice(0, 5).map((item, index) => (
            <Box
              key={index}
              sx={{
                py: 1,
                borderBottom: index < items.length - 1 ? "1px solid" : "none",
                borderColor: theme.palette.divider,
              }}
            >
              <Typography variant="body2">{safeDisplayValue(item)}</Typography>
            </Box>
          ))}
          {items.length > 5 && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
              +{items.length - 5} more
            </Typography>
          )}
        </Box>
      );

    default:
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 100 }}>
          <Avatar sx={{ bgcolor: colors.bg, color: colors.color, width: 48, height: 48, borderRadius: 2 }}>
            {Icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="textSecondary">
              {widget.type || "Widget"}
            </Typography>
            {widget.data && Object.keys(widget.data).length > 0 && (
              <Typography variant="caption" color="textSecondary" component="div" noWrap>
                {safeDisplayValue(widget.data).substring(0, 80)}
              </Typography>
            )}
          </Box>
        </Box>
      );
  }
}

// ============ Main Component ============

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  // State
  const [pages, setPages] = useState<DashboardPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [catalogWidgets, setCatalogWidgets] = useState<CatalogWidget[]>([]);
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [supportedFilters, setSupportedFilters] = useState<SupportedFilter[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dialogs
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [drilldownDialogOpen, setDrilldownDialogOpen] = useState(false);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [widgetToRemove, setWidgetToRemove] = useState<string | null>(null);

  // Pagination for drilldown
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  // Load dashboard when page changes
  useEffect(() => {
    if (selectedPage) {
      loadDashboard(selectedPage);
      loadPreferences(selectedPage);
      loadCatalogWidgets(selectedPage);
      loadPageContext(selectedPage);
    }
  }, [selectedPage]);

  // Apply filters when they change
  useEffect(() => {
    if (selectedPage && Object.keys(filterValues).length > 0) {
      loadDashboard(selectedPage);
    }
  }, [filterValues]);

  const loadPages = async () => {
    try {
      const response = await dashboardService.getPages();
      const data = response?.data || [];
      setPages(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedPage(data[0].pageKey);
      }
    } catch (error) {
      showSnackbar("Failed to load dashboard pages", "error");
    }
  };

  const loadPageContext = async (page: string) => {
    try {
      const response = await dashboardService.getPageContext(page);
      const data = response?.data;
      if (data) {
        setSupportedFilters(data.supportedFilters || []);
        // Initialize filter values with defaults
        const defaults: Record<string, any> = {};
        data.supportedFilters?.forEach((filter: SupportedFilter) => {
          if (filter.defaultValue !== undefined && filter.defaultValue !== null) {
            defaults[filter.id] = filter.defaultValue;
          }
        });
        setFilterValues(defaults);
      }
    } catch (error) {
      console.error("Failed to load page context:", error);
    }
  };

  const loadDashboard = async (page: string) => {
    showSpinner();
    setLoading(true);
    try {
      const params = { ...filterValues };
      const response = await dashboardService.getDashboard(page, params);
      const data = response?.data;
      if (data) {
        const safeData = {
          ...data,
          widgets: data.widgets?.map((widget: any) => ({
            ...widget,
            data: widget.data || {},
            actions: widget.actions || [],
            visible: widget.visible !== false,
          })) || [],
        };
        setDashboardData(safeData);
      }
    } catch (error) {
      showSnackbar("Failed to load dashboard", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadPreferences = async (page: string) => {
    try {
      const response = await dashboardService.getPreferences(page);
      const data = response?.data;
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      setPreferences(null);
    }
  };

  const loadCatalogWidgets = async (page: string) => {
    try {
      const response = await dashboardService.getAvailableWidgets(page);
      const data = response?.data || [];
      setCatalogWidgets(Array.isArray(data) ? data : []);
    } catch (error) {
      showSnackbar("Failed to load available widgets", "error");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(selectedPage);
    await loadPreferences(selectedPage);
    await loadCatalogWidgets(selectedPage);
    setRefreshing(false);
    showSnackbar("Dashboard refreshed successfully", "success");
  };

  const handleFilterChange = (filterId: string, value: any) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const handleAddWidget = async (widgetId: string) => {
    setLoading(true);
    try {
      const currentWidgets = dashboardData?.widgets || [];

      const catalogWidget = catalogWidgets.find((w) => w.widgetId === widgetId);
      if (!catalogWidget) {
        showSnackbar("Widget not found in catalog", "error");
        return;
      }

      const newWidget: DashboardWidget = {
        id: widgetId,
        title: catalogWidget.title || "Untitled",
        type: catalogWidget.type || "unknown",
        size: catalogWidget.size || "medium",
        position: currentWidgets.length,
        locked: catalogWidget.locked || false,
        data: {},
        actions: catalogWidget.actions || [],
        visible: true,
      };

      const updatedWidgets = [...currentWidgets, newWidget];

      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: updatedWidgets.map((w) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: w.position,
          size: w.size || "medium",
        })),
      };

      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadDashboard(selectedPage);
      showSnackbar("Widget added successfully", "success");
      setAddWidgetDialogOpen(false);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to add widget", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    if (!dashboardData) return;

    const updatedWidgets = dashboardData.widgets.filter((w) => w.id !== widgetId);

    try {
      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: updatedWidgets.map((w, index) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: index,
          size: w.size || "medium",
        })),
      };

      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadDashboard(selectedPage);
      showSnackbar("Widget removed successfully", "success");
      setConfirmDialogOpen(false);
      setWidgetToRemove(null);
    } catch (error) {
      showSnackbar("Failed to remove widget", "error");
    }
  };

  const handleToggleVisibility = async (widgetId: string) => {
    if (!dashboardData) return;

    const widget = dashboardData.widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    const newVisibility = widget.visible !== false ? false : true;

    const updatedWidgets = dashboardData.widgets.map((w) => ({
      ...w,
      visible: w.id === widgetId ? newVisibility : w.visible,
    }));

    try {
      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: updatedWidgets.map((w) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: w.position,
          size: w.size || "medium",
        })),
      };

      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadDashboard(selectedPage);
      showSnackbar(`Widget ${newVisibility ? "shown" : "hidden"}`, "success");
    } catch (error) {
      showSnackbar("Failed to update widget visibility", "error");
    }
  };

  const handleResetPreferences = async () => {
    try {
      await dashboardService.resetPreferences(selectedPage);
      await loadDashboard(selectedPage);
      await loadPreferences(selectedPage);
      showSnackbar("Dashboard reset to default", "success");
    } catch (error) {
      showSnackbar("Failed to reset preferences", "error");
    }
  };

  const handleDrilldown = async (widgetId: string, actionId: string) => {
    setDrilldownLoading(true);
    try {
      const response:any = await dashboardService.executeDrilldown(selectedPage, widgetId, {
        actionId,
        context: { ...filterValues, ...(dashboardData?.context || {}) },
      });
      const data = response?.data;
      if (data) {
        setDrilldownData(data);
        setDrilldownDialogOpen(true);
        setPage(0);
      }
    } catch (error) {
      showSnackbar("Failed to execute drilldown", "error");
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleSaveLayout = async () => {
    if (!dashboardData) return;

    try {
      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: dashboardData.widgets.map((w) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: w.position,
          size: w.size || "medium",
        })),
      };

      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadPreferences(selectedPage);
      setEditingMode(false);
      showSnackbar("Layout saved successfully", "success");
    } catch (error) {
      showSnackbar("Failed to save layout", "error");
    }
  };

  const visibleWidgets = dashboardData?.widgets?.filter((w) => w.visible !== false) || [];

  // Render filter bar
  const renderFilters = () => {
    if (supportedFilters.length === 0) return null;

    return (
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterListIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" color="primary">
              Filters
            </Typography>
          </Box>
          {supportedFilters.map((filter) => (
            <TextField
              key={filter.id}
              size="small"
              label={filter.label}
              value={filterValues[filter.id] || ""}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              required={filter.required}
              sx={{ minWidth: 150 }}
              placeholder={filter.required ? "Required" : "Optional"}
            />
          ))}
          <Button size="small" variant="outlined" onClick={() => loadDashboard(selectedPage)}>
            Apply
          </Button>
          {Object.keys(filterValues).length > 0 && (
            <Button
              size="small"
              color="secondary"
              onClick={() => {
                const defaults: Record<string, any> = {};
                supportedFilters.forEach((f) => {
                  if (f.defaultValue !== undefined && f.defaultValue !== null) {
                    defaults[f.id] = f.defaultValue;
                  }
                });
                setFilterValues(defaults);
              }}
            >
              Reset
            </Button>
          )}
        </Box>
      </Paper>
    );
  };

  // Render context chips
  const renderContext = () => {
    if (!dashboardData?.context) return null;

    const contextEntries = Object.entries(dashboardData.context);
    if (contextEntries.length === 0) return null;

    return (
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha(theme.palette.info.main, 0.04),
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <AssessmentIcon color="info" fontSize="small" />
          <Typography variant="subtitle2" color="info.main">
            Dashboard Context
          </Typography>
          {preferences?.usingRoleDefault && (
            <Chip label="Default Layout" size="small" color="info" variant="outlined" sx={{ ml: 1 }} />
          )}
          {!preferences?.usingRoleDefault && preferences && (
            <Chip label="Customized" size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {contextEntries.map(([key, value]) => {
            const displayValue = safeDisplayValue(value);
            return (
              <Chip
                key={key}
                label={`${key}: ${displayValue}`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ borderRadius: "16px", "& .MuiChip-label": { fontWeight: 500 } }}
              />
            );
          })}
        </Box>
      </Paper>
    );
  };

  // Render stats summary
  const renderStats = () => {
    if (!dashboardData) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              {visibleWidgets.length}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Active Widgets
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
              {dashboardData.widgets.filter((w) => w.locked).length}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Locked Widgets
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h5" color="warning.main" sx={{ fontWeight: 700 }}>
              {catalogWidgets.length}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Available Widgets
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 2, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h5" color="info.main" sx={{ fontWeight: 700 }}>
              {dashboardData.widgets.filter((w) => w.visible !== false).length}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Visible Widgets
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <div className="text-gray-800">
          Welcome back, Admin!
          Here's what's happening with your workforce today.
      </div>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          // background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.primary.dark} 100%)`,
          // color: "white",
        }}
        className="!bg-head"
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
            <Avatar
              sx={{
                // bgcolor: alpha(theme.palette.common.white, 0.2),
                width: 56,
                height: 56,
                borderRadius: 2,
              }}
              className="!bg-primary-100"
            >
              <DashboardIcon sx={{ fontSize: 32 }} className="text-primary"/>
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }} className="text-gray-800">
                Dashboard Management
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }} className="text-gray-800">
                Configure and manage your HRMS dashboards
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 200, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
              <InputLabel className="text-gray-800">Dashboard</InputLabel>
              <Select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                // label="Dashboard"
                // sx={{
                //   color: "white",
                //   "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" },
                //   "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
                //   "& .MuiSvgIcon-root": { color: "white" },
                // }}
              >
                {pages.map((page) => (
                  <MenuItem key={page.pageKey} value={page.pageKey}>
                    {page.title || page.pageKey}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
                           className="!bg-primary"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/bi-workspace")}
              className="!bg-primary"
            >
              BI Workspace
            </Button>
            <Button
              variant="contained"
              startIcon={editingMode ? <SaveIcon /> : <EditIcon />}
              onClick={editingMode ? handleSaveLayout : () => setEditingMode(true)}
              className={`${ editingMode ? "!bg-green-700" : '!bg-primary'}`}
             
            >
              {editingMode ? "Save Layout" : "Edit Layout"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      {renderFilters()}

      {/* Context */}
      {renderContext()}

      {/* Stats */}
      {renderStats()}

      {/* Widget Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={250} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : dashboardData ? (
        <Grid container spacing={3}>
          {visibleWidgets.length > 0 ? (
            visibleWidgets.map((widget) => {
              const colors = getWidgetColor(widget.type);
              return (
                <Grid
                  key={widget.id}
                  size={{
                    xs: 12,
                    sm: widget.size === "small" ? 6 : widget.size === "large" ? 12 : 6,
                    md: widget.size === "small" ? 4 : widget.size === "large" ? 12 : 6,
                    lg: widget.size === "small" ? 3 : widget.size === "large" ? 12 : 6,
                  }}
                >
                  <Zoom in={true} style={{ transitionDelay: `${visibleWidgets.indexOf(widget) * 50}ms` }}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: theme.shadows[8],
                          transform: "translateY(-4px)",
                        },
                        position: "relative",
                        overflow: "visible",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {editingMode && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: -10,
                            right: -10,
                            display: "flex",
                            gap: 0.5,
                            zIndex: 10,
                          }}
                        >
                          <Tooltip title={widget.visible !== false ? "Hide Widget" : "Show Widget"}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleVisibility(widget.id)}
                              sx={{
                                bgcolor: "white",
                                boxShadow: theme.shadows[2],
                                "&:hover": { bgcolor: theme.palette.grey[100] },
                                width: 28,
                                height: 28,
                              }}
                            >
                              {widget.visible !== false ? (
                                <VisibilityIcon fontSize="small" color="action" />
                              ) : (
                                <VisibilityOffIcon fontSize="small" color="action" />
                              )}
                            </IconButton>
                          </Tooltip>
                          {!widget.locked && (
                            <Tooltip title="Remove Widget">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setWidgetToRemove(widget.id);
                                  setConfirmDialogOpen(true);
                                }}
                                sx={{
                                  bgcolor: "white",
                                  boxShadow: theme.shadows[2],
                                  "&:hover": { bgcolor: theme.palette.error.light },
                                  width: 28,
                                  height: 28,
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Drag to Reorder">
                            <IconButton
                              size="small"
                              sx={{
                                bgcolor: "white",
                                boxShadow: theme.shadows[2],
                                cursor: "grab",
                                width: 28,
                                height: 28,
                              }}
                            >
                              <DragIndicatorIcon fontSize="small" color="action" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      <CardHeader
                        title={
                          <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>
                            {widget.title || "Widget"}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="caption" color="textSecondary">
                            {widget.type || "Widget"}
                          </Typography>
                        }
                        avatar={
                          <Avatar
                            sx={{
                              bgcolor: colors.bg,
                              color: colors.color,
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                            }}
                          >
                            {getWidgetIcon(widget.type)}
                          </Avatar>
                        }
                        action={
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {widget.actions && widget.actions.length > 0 && !editingMode && (
                              <Tooltip title="Drilldown">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDrilldown(widget.id, widget.actions[0].id)}
                                  color="primary"
                                >
                                  <ExpandMoreIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {widget.locked && (
                              <Chip
                                label="Locked"
                                size="small"
                                color="info"
                                sx={{ fontSize: "0.625rem", height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        sx={{ pb: 0 }}
                      />
                      <Divider />
                      <CardContent sx={{ flex: 1 }}>
                        <WidgetContent widget={widget} />
                      </CardContent>
                      {widget.actions && widget.actions.length > 0 && !editingMode && (
                        <CardActions sx={{ pt: 0, px: 2, pb: 2, flexWrap: "wrap", gap: 0.5 }}>
                          {widget.actions.map((action, idx) => (
                            <Chip
                              key={idx}
                              label={action.label}
                              size="small"
                              variant="outlined"
                              onClick={() => handleDrilldown(widget.id, action.id)}
                              clickable
                              sx={{ borderRadius: "12px" }}
                            />
                          ))}
                        </CardActions>
                      )}
                    </Card>
                  </Zoom>
                </Grid>
              );
            })
          ) : (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ textAlign: "center", py: 8, borderRadius: 3 }}>
                <DashboardIcon sx={{ fontSize: 64, color: theme.palette.grey[300], mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No widgets found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click "Edit Layout" to add widgets to your dashboard
                </Typography>
                {editingMode && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddWidgetDialogOpen(true)}
                    sx={{ mt: 2 }}
                  >
                    Add Widget
                  </Button>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          {/* <CircularProgress /> */}
        </Box>
      )}

      {/* Action Buttons - Edit Mode */}
      {editingMode && (
        <Fade in={editingMode}>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddWidgetDialogOpen(true)}
              sx={{ borderRadius: 2 }}
              className="!bg-primary"
            >
              Add Widget
            </Button>
            <Button
              variant="outlined"
              color="info"
              startIcon={<RestoreIcon />}
              onClick={handleResetPreferences}
              sx={{ borderRadius: 2 }}
            >
              Reset to Default
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setEditingMode(false)}
              sx={{ borderRadius: 2 }}
            >
              Cancel Editing
            </Button>
          </Box>
        </Fade>
      )}

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetDialogOpen} onClose={() => setAddWidgetDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>Add Widget</Typography>
              <Typography variant="caption" color="textSecondary">
                Select a widget to add to your dashboard
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.grey[50] }}>
                <TableRow>
                  <TableCell>Widget</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {catalogWidgets
                  .filter((w) => !dashboardData?.widgets?.some((dw) => dw.id === w.widgetId))
                  .map((widget) => {
                    const colors = getWidgetColor(widget.type);
                    return (
                      <TableRow key={widget.widgetId} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: colors.bg,
                                color: colors.color,
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                              }}
                            >
                              {getWidgetIcon(widget.type)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {widget.title || "Untitled"}
                              </Typography>
                              {widget.locked && (
                                <Chip label="Locked" size="small" color="info" sx={{ fontSize: "0.5rem", height: 16 }} />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={widget.type || "Unknown"} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={widget.size || "medium"}
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddWidget(widget.widgetId)}
                            disabled={loading}
                            sx={{ borderRadius: 2 }}
                          >
                            {loading ? <CircularProgress size={20} /> : "Add"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          {catalogWidgets.filter((w) => !dashboardData?.widgets?.some((dw) => dw.id === w.widgetId)).length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="textSecondary">All widgets are already added to your dashboard</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => setAddWidgetDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Remove Widget
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this widget from your dashboard?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => widgetToRemove && handleRemoveWidget(widgetToRemove)}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drilldown Dialog */}
      <Dialog
        open={drilldownDialogOpen}
        onClose={() => setDrilldownDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {drilldownData?.title || "Drilldown Details"}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {drilldownData?.type || "Report"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Export">
                <IconButton>
                  <CloudDownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print">
                <IconButton>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {drilldownLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : drilldownData ? (
            <>
              <TableContainer sx={{ maxHeight: 450 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {drilldownData.columns?.map((col, index) => (
                        <TableCell
                          key={col.id || `col-${index}`}
                          sx={{ bgcolor: theme.palette.grey[50], fontWeight: 600 }}
                        >
                          {col.label || col.id || `Column ${index + 1}`}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drilldownData.data
                      ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, rowIndex) => (
                        <TableRow key={rowIndex} hover>
                          {drilldownData.columns?.map((col, colIndex) => {
                            const colId = col.id || col.label || `col-${colIndex}`;
                            const displayValue = safeDisplayValue(row?.[colId]);
                            return <TableCell key={`${rowIndex}-${colIndex}`}>{displayValue}</TableCell>;
                          })}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {drilldownData.totals && Object.keys(drilldownData.totals).length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.grey[50],
                    borderTop: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Totals
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {Object.entries(drilldownData.totals).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${safeDisplayValue(value)}`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {drilldownData.data && drilldownData.data.length > rowsPerPage && (
                <TablePagination
                  component="div"
                  count={drilldownData.data.length}
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
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="textSecondary">No drilldown data available</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button variant="contained" onClick={() => setDrilldownDialogOpen(false)} sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
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
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  CardActions,
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
  Skeleton,
  Stack,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIndicatorIcon,
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
  // Fullscreen as FullscreenIcon,
  // Notifications as NotificationsIcon,
  // Settings as SettingsIcon,
  // Person as PersonIcon,
  // Today as TodayIcon,
  // Event as EventIcon,
  // Work as WorkIcon,
  // ExitToApp as ExitToAppIcon,
  PersonOutlined,
  CloseOutlined,
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
  WidgetAction,
} from "../../services/modules/dashboard";

// Recharts
// import {
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   Tooltip as RechartsTooltip,
//   Legend,
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   CartesianGrid,
// } from "recharts";

// Date picker
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Debounce
import { formatDate } from "../leave/leaveFormatters";

// ===== DRAG-DROP: Import dnd-kit =====
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getWidgetColor, isDateString, isIdColumn } from "./const";
import { getRowColor } from "../const";
import { getWorkspaceLabel } from "../../auth/authMapper";
import { useAuth } from "../../auth/authContext";

// ============ Utility Functions ============

const safeDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") {
    if (isDateString(value)) {
      return formatDate(value);
    }
    return value;
  }
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
  if (["employee", "employees", "headcount", "summary-box"].includes(typeLower)) return <PeopleIcon />;
  if (["attendance", "absenteeism"].includes(typeLower)) return <TimelineIcon />;
  if (["performance", "rating"].includes(typeLower)) return <TrendingUpIcon />;
  if (["payroll", "salary", "cost"].includes(typeLower)) return <AttachMoneyIcon />;
  if (["recruitment", "hiring", "candidates"].includes(typeLower)) return <BusinessCenterIcon />;
  if (["training", "learning"].includes(typeLower)) return <SchoolIcon />;
  if (["rewards", "recognition"].includes(typeLower)) return <EmojiEventsIcon />;
  if (["analytics", "report", "kpi"].includes(typeLower)) return <AssessmentIcon />;
  return <DashboardIcon />;
};

// ============ Main Component ============

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { session } = useAuth();
  const user = session?.user;
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  // State
  const [pages, setPages] = useState<DashboardPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [catalogWidgets, setCatalogWidgets] = useState<CatalogWidget[]>([]);
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [_supportedFilters, setSupportedFilters] = useState<SupportedFilter[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  // const [refreshing, setRefreshing] = useState(false);

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

  // ===== DRAG-DROP: sensors =====
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Debounced apply filters
  // const debouncedApplyFilters = useCallback(
  //   debounce((page: string) => {
  //     loadDashboard(page);
  //   }, 500),
  //   []
  // );

  // Load functions
  const loadPages = async () => {
    showSpinner();
    try {
      const response = await dashboardService.getPages();
      const data = response?.data || [];
      setPages(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedPage(data[0].pageKey);
      }
    } catch (error) {
      showSnackbar("Failed to load dashboard pages", "error");
    } finally {
      hideSpinner();
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

  // const handleRefresh = async () => {
  //   setRefreshing(true);
  //   await loadDashboard(selectedPage);
  //   await loadPreferences(selectedPage);
  //   await loadCatalogWidgets(selectedPage);
  //   setRefreshing(false);
  //   showSnackbar("Dashboard refreshed successfully", "success");
  // };

  // const handleFilterChange = (filterId: string, value: any) => {
  //   setFilterValues((prev) => ({
  //     ...prev,
  //     [filterId]: value,
  //   }));
  //   if (selectedPage) {
  //     debouncedApplyFilters(selectedPage);
  //   }
  // };

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

  const handleDrilldown = async (widgetId: string, actionId: string, context?: any) => {
    setDrilldownLoading(true);
    try {
      const response: any = await dashboardService.executeDrilldown(selectedPage, widgetId, {
        actionId,
        context: { ...filterValues, ...(dashboardData?.context || {}), ...context },
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

  // ===== DRAG-DROP: Handler for reordering =====
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      if (dashboardData) {
        const oldIndex = dashboardData.widgets.findIndex((w) => w.id === active.id);
        const newIndex = dashboardData.widgets.findIndex((w) => w.id === over.id);
        const newWidgets = arrayMove(dashboardData.widgets, oldIndex, newIndex);
        // Update position numbers
        const reordered = newWidgets.map((w, idx) => ({ ...w, position: idx }));
        setDashboardData((prev) => prev ? { ...prev, widgets: reordered } : null);
        // Save preferences immediately
        const preferencesPayload: UpdatePreferencesRequest = {
          widgets: reordered.map((w) => ({
            widgetId: w.id,
            visible: w.visible !== false,
            position: w.position,
            size: w.size || "medium",
          })),
        };
        dashboardService.updatePreferences(selectedPage, preferencesPayload)
          .then(() => showSnackbar("Widget order updated", "success"))
          .catch(() => showSnackbar("Failed to save new order", "error"));
      }
    }
  };

  interface WidgetCardProps {
    widget: DashboardWidget;
    editingMode: boolean;
    onToggleVisibility: (id: string) => void;
    onRemove: (id: string) => void;
    onDrilldown: (widgetId: string, actionId: string, context?: any) => void;
    renderWidgetContent: (widget: DashboardWidget) => React.ReactNode;
  }

  function WidgetCard({
    widget,
    editingMode,
    onToggleVisibility,
    onRemove,
    onDrilldown,
    renderWidgetContent,
  }: WidgetCardProps) {
    // const theme = useTheme();
    // const colors = getWidgetColor(widget.type);
    const isVisible = widget.visible !== false;

    // useSortable is now inside this component – hooks order is stable per instance
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: widget.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 'auto',
    };

    return (
      <Grid
        ref={setNodeRef}
        style={style}
        size={{
          xs: 12,
          sm: widget.size === 'small' ? 4 : widget.size === 'large' ? 12 : 6,
          md: widget.size === 'small' ? 3 : widget.size === 'large' ? 12 : 6,
          lg: widget.size === 'small' ? 3 : widget.size === 'large' ? 12 : 6,
        }}
      >
        <Zoom in={true} style={{ transitionDelay: '50ms' }}>
          <Card
            className="!bg-white-50 border border-gray-200"
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'visible',
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              touchAction: 'none',
              visibility: isVisible ? 'visible' : 'hidden',
            }}
          >
            {/* Edit Mode Toolbar */}
            {editingMode && (
              <Box sx={{ position: 'absolute', top: -12, right: -12, display: 'flex', gap: 0.5, zIndex: 10 }}>
                <Tooltip title={isVisible ? "Hide" : "Show"}>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => onToggleVisibility(widget.id)}
                    sx={{ bgcolor: 'white', boxShadow: 1, width: 28, height: 28 }}
                  >
                    {isVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                {!widget.locked && (
                  <Tooltip title="Remove">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemove(widget.id)}
                      sx={{ bgcolor: 'white', boxShadow: 1, width: 28, height: 28 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Drag to reorder">
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ bgcolor: 'white', boxShadow: 1, cursor: 'grab', width: 28, height: 28 }}
                    {...attributes}
                    {...listeners}
                  >
                    <DragIndicatorIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            <CardHeader className="border-b border-gray-200"
              title={<Typography sx={{ fontWeight: 600 }} className="text-gray-800">{widget.title}</Typography>}
              action={
                <Box>
                  {widget.actions?.length > 0 && !editingMode && (
                    <Tooltip title="Drilldown">
                      <IconButton size="small" onClick={() => onDrilldown(widget.id, widget.actions[0].id)}>
                        <ExpandMoreIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {widget.locked && <Chip label="Locked" size="small" color="info" sx={{ fontSize: '0.625rem', height: 20 }} />}
                </Box>
              }
            />
            {/* <Divider /> */}
            <CardContent sx={{ flex: 1, pt: 2 }}>
              {renderWidgetContent(widget)}
            </CardContent>
            {widget.actions?.length > 0 && !editingMode && (
              <CardActions sx={{ pt: 0, px: 2, pb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                {widget.actions.map((action, idx) => (
                  <Chip
                    key={idx}
                    label={action.label}
                    size="small"
                    variant="outlined"
                    onClick={() => onDrilldown(widget.id, action.id)}
                    clickable
                  />
                ))}
              </CardActions>
            )}
          </Card>
        </Zoom>
      </Grid>
    );
  }

  // ============ Widget Renderers (with local state) ============

  // Summary Box Widget (rendered as KPI cards)
  const SummaryBoxWidget = ({ data }: { data: any }) => {
    const rows = data?.data || [];
    if (rows.length === 0) {
      return <Typography color="textSecondary">No summary data available</Typography>;
    }
    const summaryRow = rows[0];
    const entries = Object.entries(summaryRow).filter(
      ([key]) => !key.startsWith("_") && key !== "id" && key !== "meta"
    );
    if (entries.length === 0) {
      return <Typography color="textSecondary">No metrics available</Typography>;
    }
    return (
      <Grid container spacing={2}>
        {entries.map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          return (
            <Grid key={key} size={{ xs: 6, sm: 4 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  borderRadius: 2,
                  textAlign: "center",
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {safeDisplayValue(value)}
                </Typography>
                <Typography variant="caption" color="textSecondary" className="text-gray-800" sx={{ mt: 0.5, display: "block" }}>
                  {label}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Table Widget
  const TableWidget = ({ data }: { data: any }) => {
    const rows = data?.data || [];
    const [localPage, setLocalPage] = useState(0);
    const [localRowsPerPage, setLocalRowsPerPage] = useState(5);

    if (rows.length === 0) {
      return <Typography color="textSecondary" className="text-gray-500">No data available</Typography>;
    }

    const columns = Object.keys(rows[0]).filter((key) => !key.startsWith("_") && key !== "meta" && !isIdColumn(key));
    if (columns.length === 0) {
      return <Typography color="textSecondary">No columns found</Typography>;
    }

    const paginatedRows = rows.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage);

    return (
      <Box>
        <TableContainer>
          <Table size="small" className="border border-gray-200">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                {columns.map((col) => (
                  <TableCell key={col} sx={{ fontWeight: 600 }}>
                    {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row: any, idx: number) => (
                <TableRow key={idx} hover sx={getRowColor(idx)}>
                  {columns.map((col) => (
                    <TableCell key={col}>
                      <div className={`!p-1.5 !text-[11px] ${typeof row[col] == 'number' ? 'text-sky-500' : ''}`}>{safeDisplayValue(row[col])}</div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {rows.length > localRowsPerPage && (
          <TablePagination
            component="div"
            count={rows.length}
            page={localPage}
            onPageChange={(_, newPage) => setLocalPage(newPage)}
            rowsPerPage={localRowsPerPage}
            onRowsPerPageChange={(e) => {
              setLocalRowsPerPage(parseInt(e.target.value, 10));
              setLocalPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </Box>
    );
  };

  interface EmployeeCardListProps {
    data: any;
    widgetId: string;
    onDrilldown?: (actionId: string, context?: any) => void;
    actions?: WidgetAction[];
  }

  function EmployeeCardList({ data, widgetId, onDrilldown, actions }: EmployeeCardListProps) {
    const theme = useTheme();
    const rows = data?.data || [];
    if (rows.length === 0) {
      return <Typography color="textSecondary" className="text-gray-500" sx={{ py: 2, textAlign: 'center' }}>No records found</Typography>;
    }

    // Determine label for the date field
    // let dateLabel = 'Date';
    // let secondaryLabel = '';
    let isAnniversary = false;
    if (widgetId.includes('recentJoiners')) {
      // dateLabel = 'Joining Date';
      // secondaryLabel = 'Days since joining';
    } else if (widgetId.includes('upcomingBirthdays')) {
      // dateLabel = 'Birthday';
      // secondaryLabel = 'Days until birthday';
    } else if (widgetId.includes('workAnniversaries')) {
      // dateLabel = 'Anniversary';
      // secondaryLabel = 'Days until anniversary';
      isAnniversary = true;
    } else if (widgetId.includes('recentResignations')) {
      // dateLabel = 'Resignation Date';
      // secondaryLabel = 'Days since resignation';
    }

    // Find the field names from the first row
    const firstRow = rows[0] || {};
    const nameField = firstRow.name ? 'name' : (firstRow.employeeName ? 'employeeName' : null);
    const dateField = firstRow.joiningDate ? 'joiningDate' :
      firstRow.occursOn ? 'occursOn' :
        firstRow.resignationDate ? 'resignationDate' : null;
    const daysField = firstRow.daysFromToday !== undefined ? 'daysFromToday' : '';
    const idField = firstRow.employeeId ? 'employeeId' : (firstRow.id ? 'id' : '');
    const yearsField = firstRow.anniversaryYears !== undefined ? 'anniversaryYears' : '';

    // If we can't find fields, fallback to table
    if (!nameField || !dateField) {
      return <TableWidget data={data} />;
    }

    const handleCardClick = (record: any) => {
      if (onDrilldown && actions && actions.length > 0) {
        onDrilldown(actions[0].id, { record });
      }
    };

    return (
      <div className="grid items-center gap-2">
        {rows.map((record: any, index: number) => {
          const name = record[nameField] || 'Unknown';
          const date = record[dateField] || '';
          const days = record[daysField] !== undefined ? record[daysField] : null;
          const employeeId = record[idField] || '';
          const anniversaryYears = isAnniversary ? record[yearsField] : null;
          // const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 1);

          let daysText = '';
          let chipColor: 'default' | 'success' | 'warning' | 'error' = 'default';
          if (days !== null) {
            const absDays = Math.abs(days);
            if (days === 0) {
              daysText = 'Today';
              chipColor = 'success';
            } else if (days < 0) {
              daysText = `${absDays} days ago`;
              chipColor = 'error';
            } else {
              daysText = `In ${absDays} days`;
              chipColor = 'warning';
            }
          }

          return (
            <div key={index}>
              <Paper
                elevation={0}
                className="!bg-gray-100/50 dark:!bg-head"
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s',
                  cursor: onDrilldown ? 'pointer' : 'default',
                  '&:hover': {
                    boxShadow: theme.shadows[2],
                    borderColor: theme.palette.primary.main,
                  },
                }}
                onClick={() => handleCardClick(record)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center gap-2">
                    <Avatar sx={{ bgcolor: theme.palette.grey[400], color: theme.palette.primary.contrastText }} className="!w-6 !h-6">
                      <PersonOutlined />
                    </Avatar>
                    <div>
                      <div className="text-gray-800 font-bold text-[12px]">
                        {name}
                        {anniversaryYears && (
                          <Chip
                            label={`${anniversaryYears} years`}
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.625rem', marginLeft: 1 }}
                          />
                        )}
                      </div>
                      {employeeId && (
                        <div className="text-[10px] text-gray-500">
                          {employeeId}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-gray-500 text-[10px]">
                      {date ? formatDate(date) : ''}
                    </div>
                    <div className="flex gap-2">
                      {daysText && (
                        <Chip
                          label={daysText}
                          size="small"
                          color={chipColor}
                          sx={{ height: 20, fontSize: '0.625rem' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                {onDrilldown && actions && actions.length > 0 && (
                  <IconButton size="small" color="primary" onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(record);
                  }}>
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                )}
              </Paper>
            </div>
          );
        })}
      </div>
    );
  }

  // ============ Widget Content Renderer ============

  const renderWidgetContent = (widget: DashboardWidget) => {
    const widgetData = widget.data || {};
    const type = widget.type?.toLowerCase() || "";
    const id = widget.id || '';
    if (type === "chart") {
      return <Typography color="textSecondary">Chart widget (coming soon)</Typography>;
    }
    if (type === "summary-box") {
      return <SummaryBoxWidget data={widgetData} />;
    }
    if (type === "table") {
      const isEmployeeList = ['recentJoiners', 'upcomingBirthdays', 'workAnniversaries', 'recentResignations', 'upcomingHolidays'].some(
        (keyword) => id.includes(keyword)
      );
      if (isEmployeeList) {
        return (
          <EmployeeCardList
            data={widgetData}
            widgetId={id}
            onDrilldown={(actionId, context) => handleDrilldown(widget.id, actionId, context)}
            actions={widget.actions}
          />
        );
      }
      return <TableWidget data={widgetData} />;
    }
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 100 }}>
        <Avatar sx={{ bgcolor: getWidgetColor(type).bg, color: getWidgetColor(type).color, width: 48, height: 48, borderRadius: 2 }}>
          {getWidgetIcon(type)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="textSecondary">{type || "Widget"}</Typography>
          {widgetData && Object.keys(widgetData).length > 0 && (
            <Typography variant="caption" color="textSecondary" component="div" noWrap>
              {safeDisplayValue(widgetData).substring(0, 80)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // ============ Filter rendering ============

  // const renderFilters = () => {
  //   if (supportedFilters.length === 0) return null;
  //   return (
  //     <Paper
  //       sx={{
  //         p: 2,
  //         mb: 3,
  //         borderRadius: 2,
  //         border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  //         bgcolor: alpha(theme.palette.primary.main, 0.02),
  //       }}
  //     >
  //       <Stack direction="row" spacing={2} className="items-center flex-wrap" useFlexGap>
  //         <FilterListIcon color="primary" fontSize="small" />
  //         <Typography variant="subtitle2" color="primary">Filters</Typography>
  //         {/* {supportedFilters.map((filter) => {
  //           const value = filterValues[filter.id] || "";
  //           return (
  //             <TextField
  //               key={filter.id}
  //               size="small"
  //               label={filter.label}
  //               value={value}
  //               onChange={(e) => handleFilterChange(filter.id, e.target.value)}
  //               placeholder={filter.required ? "Required" : "Optional"}
  //               sx={{ minWidth: 150 }}
  //             />
  //           );
  //         })} */}
  //         {supportedFilters.map((filter) => {
  //           const value = filterValues[filter.id] || "";
  //           if (filter.type === 'month') {
  //             return (
  //               <LocalizationProvider key={filter.id} dateAdapter={AdapterDayjs}>
  //                 <DatePicker
  //                   views={['month']}
  //                   label={filter.label}
  //                   value={value ? dayjs(value) : null}
  //                   onChange={(newValue) => handleFilterChange(filter.id, newValue ? dayjs(newValue).format('YYYY-MM') : '')}
  //                   slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
  //                 />
  //               </LocalizationProvider>
  //             );
  //           }
  //           if (filter.type === 'lookup') {
  //             // In a real app, fetch options from a lookup endpoint; for now use text
  //             return (
  //               <TextField
  //                 key={filter.id}
  //                 size="small"
  //                 label={filter.label}
  //                 value={value}
  //                 onChange={(e) => handleFilterChange(filter.id, e.target.value)}
  //                 placeholder="Enter value"
  //                 sx={{ minWidth: 150 }}
  //               />
  //             );
  //           }
  //           // default text
  //           return (
  //             <TextField
  //               key={filter.id}
  //               size="small"
  //               label={filter.label}
  //               value={value}
  //               onChange={(e) => handleFilterChange(filter.id, e.target.value)}
  //               placeholder={filter.required ? "Required" : "Optional"}
  //               sx={{ minWidth: 150 }}
  //             />
  //           );
  //         })}
  //         <Button size="small" variant="outlined" onClick={() => loadDashboard(selectedPage)}>Apply</Button>
  //         {Object.keys(filterValues).length > 0 && (
  //           <Button size="small" color="secondary" onClick={() => {
  //             const defaults: Record<string, any> = {};
  //             supportedFilters.forEach((f) => {
  //               if (f.defaultValue !== undefined && f.defaultValue !== null) {
  //                 defaults[f.id] = f.defaultValue;
  //               }
  //             });
  //             setFilterValues(defaults);
  //           }}>Reset</Button>
  //         )}
  //       </Stack>
  //     </Paper>
  //   );
  // };

  // ============ Context rendering ============

  const renderContext = () => {
    if (!dashboardData?.context) return null;
    const contextEntries = Object.entries(dashboardData.context);
    if (contextEntries.length === 0) return null;
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.04), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} className="items-center flex-wrap">
          <AssessmentIcon color="info" fontSize="small" />
          <Typography variant="subtitle2" color="info.main" className="text-gray-800">Dashboard Context</Typography>
          {preferences?.usingRoleDefault && <Chip label="Default Layout" size="small" color="info" variant="outlined" />}
          {!preferences?.usingRoleDefault && preferences && <Chip label="Customized" size="small" color="warning" variant="outlined" />}
          {contextEntries.map(([key, value]) => (
            <Chip key={key} label={`${key}: ${safeDisplayValue(value)}`} size="small" color="info" variant="outlined" />
          ))}
        </Stack>
      </Paper>
    );
  };

  // ============ Stats / KPI Cards ============

  // const renderKPI = () => {
  //   const headcountWidget = dashboardData?.widgets.find(w => w.id === 'employee.headcountSummary');
  //   if (!headcountWidget) return null;
  //   const rows = headcountWidget.data?.data || [];
  //   if (!rows.length) return null;
  //   const row = rows[0];
  //   const metrics = [
  //     { label: 'Total Employees', value: row.headcount, icon: <PeopleIcon />, color: '#1976D2' },
  //     { label: 'Active Employees', value: row.headcountActive, icon: <WorkIcon />, color: '#2e7d32' },
  //     { label: 'On Leave', value: row.headcountOnLeave, icon: <EventIcon />, color: '#ed6c02' },
  //   ];
  //   return (
  //     <Grid container spacing={3} sx={{ mb: 2 }}>
  //       {metrics.map((metric) => (
  //         <Grid key={metric.label} size={{ xs: 12, sm: 4 }}>
  //           <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, borderLeft: `4px solid ${metric.color}` }} className="!bg-white-50">
  //             <Avatar sx={{ bgcolor: alpha(metric.color, 0.1), color: metric.color }}>{metric.icon}</Avatar>
  //             <Box>
  //               <Typography variant="h5" sx={{ fontWeight: 700 }} className="text-gray-800">{safeDisplayValue(metric.value)}</Typography>
  //               <Typography variant="body2" color="textSecondary" className="text-gray-500">{metric.label}</Typography>
  //             </Box>
  //           </Paper>
  //         </Grid>
  //       ))}
  //     </Grid>
  //   );
  // };

  // ============ Main Render ============

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ pb: 3 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2 }} className="!bg-white-50 border border-gray-200">
          <Stack direction="row" className="items-center flex-wrap gap-2 justify-between">
            <Stack direction="row" spacing={2} className="items-center">
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }} className="!bg-primary">
                <DashboardIcon />
              </Avatar>
              <Box>
                <div className="text-gray-800 font-bold text-[18px]">Dashboard</div>
                <Typography variant="body2" color="textSecondary" className="text-gray-800">Welcome back, {user ? getWorkspaceLabel(user).split(' ')[0] : ''}!</Typography>
              </Box>
            </Stack>
            <div className="flex items-center gap-2">
              <FormControl size="small" className="!w-[200px]">
                <Select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  displayEmpty
                >
                  {pages.map((page) => (
                    <MenuItem key={page.pageKey} value={page.pageKey}>{page.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" className="w-[200px] !text-primary !border-primary" onClick={() => navigate("/bi-workspace")}>BI Workspace</Button>
              <Button
                variant="contained"
                className="w-[200px]"
                onClick={editingMode ? handleSaveLayout : () => setEditingMode(true)}
                sx={{ bgcolor: editingMode ? theme.palette.success.main : "var(--color-primary)" }}
              >
                {editingMode ? "Save Layout" : "Edit Layout"}
              </Button>
            </div>
          </Stack>
        </Paper>

        {/* Filters & Context */}
        {renderContext()}

        {/* KPI Cards */}
        {/* {renderKPI()} */}

        {/* Widget Grid with Drag-and-Drop */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={250} />
              </Grid>
            ))}
          </Grid>
        ) : dashboardData ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={dashboardData.widgets.map(w => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <Grid container spacing={2}>
                {dashboardData.widgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    editingMode={editingMode}
                    onToggleVisibility={handleToggleVisibility}
                    onRemove={(id) => {
                      setWidgetToRemove(id);
                      setConfirmDialogOpen(true);
                    }}
                    onDrilldown={handleDrilldown}
                    renderWidgetContent={renderWidgetContent}
                  />
                ))}
              </Grid>
            </SortableContext>
          </DndContext>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            {/* <CircularProgress /> */}
          </Box>
        )}

        {/* Edit Mode Actions */}
        {editingMode && (
          <Fade in={editingMode}>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddWidgetDialogOpen(true)}>Add Widget</Button>
              <Button variant="outlined" color="info" startIcon={<RestoreIcon />} onClick={handleResetPreferences}>Reset to Default</Button>
              <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setEditingMode(false)}>Cancel Editing</Button>
            </Box>
          </Fade>
        )}

        {/* Dialogs */}
        {/* Add Widget Dialog */}
        <Dialog open={addWidgetDialogOpen} onClose={() => setAddWidgetDialogOpen(false)} maxWidth="md" fullWidth>
          <div className="flex items-center justify-between p-2 border-b border-gray-200">
            <div className="text-gray-800 text-[12px] ml-2">Add Widget</div>
            <IconButton>
              <CloseOutlined className="text-gray-800" onClick={() => setAddWidgetDialogOpen(false)} />
            </IconButton>
          </div>
          {/* <DialogContent>
            <TableContainer>
              <Table className="border border-gray-200 rounded-sm">
                <TableHead><TableRow><TableCell>Widget</TableCell><TableCell>Type</TableCell><TableCell>Size</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                <TableBody>
                  {catalogWidgets.filter(w => !dashboardData?.widgets?.some(dw => dw.id === w.widgetId)).map((widget) => {
                    const colors = getWidgetColor(widget.type);
                    return (
                      <TableRow key={widget.widgetId} hover>
                        <TableCell><Stack className="items-center" direction="row" spacing={1}><Avatar sx={{ bgcolor: colors.bg, color: colors.color, width: 24, height: 24 }}>{getWidgetIcon(widget.type)}</Avatar><Typography variant="body2">{widget.title}</Typography></Stack></TableCell>
                        <TableCell><Chip label={widget.type} size="small" /></TableCell>
                        <TableCell><Chip label={widget.size} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right"><Button size="small" variant="contained" onClick={() => handleAddWidget(widget.widgetId)} disabled={loading}>{loading ? <CircularProgress size={20} /> : "Add"}</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {catalogWidgets.filter(w => !dashboardData?.widgets?.some(dw => dw.id === w.widgetId)).length === 0 && <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="textSecondary">All widgets added</Typography></Box>}
          </DialogContent> */}
          <DialogContent dividers>
            {catalogWidgets.filter(w => !dashboardData?.widgets?.some(dw => dw.id === w.widgetId)).length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="textSecondary" className="text-gray-500">🎉 All available widgets have been added</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {catalogWidgets
                  .filter(w => !dashboardData?.widgets?.some(dw => dw.id === w.widgetId))
                  .map((widget) => {
                    const colors = getWidgetColor(widget.type);
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={widget.widgetId}>
                        <Card
                          variant="outlined"
                          className="bg-white border border-gray-200"
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: theme.shadows[4],
                              transform: 'translateY(-4px)',
                            },
                          }}
                        >
                          <CardContent sx={{ flex: 1 }}>
                            <div className="flex gap-2 items-center mb-1">
                              <Avatar sx={{ bgcolor: colors.bg, color: colors.color, width: 40, height: 40 }}>
                                {getWidgetIcon(widget.type)}
                              </Avatar>
                              <div className="text-[12px] text-gray-800">
                                {widget.title}
                              </div>
                            </div>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Chip label={widget.type} size="small" color="success" />
                              <Chip label={widget.size} size="small" variant="outlined" color="warning" />
                              {widget.locked && <Chip label="Locked" size="small" color="warning" />}
                            </Stack>
                          </CardContent>
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              size="small"
                              className="!bg-primary"
                              onClick={() => handleAddWidget(widget.widgetId)}
                              disabled={loading}
                              startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
                            >
                              {loading ? 'Adding...' : 'Add Widget'}
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
              </Grid>
            )}
          </DialogContent>
          <DialogActions className="border-t border-gray-200 !p-2">
            <Button onClick={() => setAddWidgetDialogOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200">Close</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm Remove Dialog */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <div className="border-b border-gray-200 text-[12px] p-2">Remove Widget</div>
          <DialogContent className="!p-4"><Typography>Are you sure you want to remove this widget?</Typography></DialogContent>
          <DialogActions className="border-t border-gray-200"><Button className="!text-gray-800 !border-gray-200" variant="outlined" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={() => widgetToRemove && handleRemoveWidget(widgetToRemove)}>Remove</Button></DialogActions>
        </Dialog>

        {/* Drilldown Dialog */}
        <Dialog open={drilldownDialogOpen} onClose={() => setDrilldownDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Stack direction="row" className="items-center justify-between">
              <Typography variant="h6">{drilldownData?.title || "Drilldown"}</Typography>
              <Box><IconButton><CloudDownloadIcon /></IconButton><IconButton><PrintIcon /></IconButton><IconButton><ShareIcon /></IconButton></Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {drilldownLoading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : drilldownData ? (
              <>
                <TableContainer sx={{ maxHeight: 450 }}>
                  <Table stickyHeader>
                    <TableHead><TableRow>{drilldownData.columns?.map((col) => <TableCell key={col.id} sx={{ bgcolor: theme.palette.grey[50], fontWeight: 600 }}>{col.label}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                      {drilldownData.data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                        <TableRow key={idx}>{drilldownData.columns?.map((col) => <TableCell key={col.id}>{safeDisplayValue(row[col.id])}</TableCell>)}</TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {drilldownData.totals && Object.keys(drilldownData.totals).length > 0 && (
                  <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2">Totals</Typography>
                    <Stack direction="row" spacing={1} className="flex-wrap">
                      {Object.entries(drilldownData.totals).map(([key, value]) => <Chip key={key} label={`${key}: ${safeDisplayValue(value)}`} size="small" variant="outlined" />)}
                    </Stack>
                  </Box>
                )}
                {drilldownData.data && drilldownData.data.length > rowsPerPage && (
                  <TablePagination
                    component="div"
                    count={drilldownData.data.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                )}
              </>
            ) : <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="textSecondary">No data</Typography></Box>}
          </DialogContent>
          <DialogActions><Button variant="contained" onClick={() => setDrilldownDialogOpen(false)}>Close</Button></DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
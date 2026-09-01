import {
    Add as AddIcon,
    Dashboard as DashboardIcon,
    Widgets as WidgetsIcon,
    FilterList as FilterListIcon,
    Lock as LockIcon,
    Edit,
    Delete,
    CloseOutlined,
    Cancel,
    CheckCircle,
} from "@mui/icons-material";
import {
    Dialog,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Chip,
    Grid,
    Paper,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Checkbox,
    FormHelperText,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { dashboardService, type DashboardBuilderFilter, type DashboardBuilderPage, type DashboardBuilderWidget } from "../../services/modules/dashboard";
import { getRowColor } from "../const";
import { useUI } from "../../context/Snackbar";
import type { BIDimension, BIMetric, BuilderMeta } from "./const";

export function DashboardBuilderFull() {
    const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();

    // ===== Page State =====
    const [builderPages, setBuilderPages] = useState<DashboardBuilderPage[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [editingBuilderPageId, setEditingBuilderPageId] = useState<string | null>(null);
    const [builderPageForm, setBuilderPageForm] = useState({
        pageKey: "",
        title: "",
        description: "",
        displayOrder: 1,
    });

    // ===== Builder Meta =====
    const [builderMeta, setBuilderMeta] = useState<BuilderMeta | null>(null);

    // ===== Widget State =====
    const [widgets, setWidgets] = useState<DashboardBuilderWidget[]>([]);
    const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
    const [widgetFormOpen, setWidgetFormOpen] = useState(false);
    const [widgetForm, setWidgetForm] = useState<Partial<DashboardBuilderWidget>>({
        widgetId: "",
        title: "",
        type: "kpi",
        size: "medium",
        position: 0,
        locked: false,
        dataSource: "",
        dataConfig: {},
        actions: {},
        active: true,
        roles: [],
    });
    const [widgetFormJsonString, setWidgetFormJsonString] = useState("");

    // ===== Filter State =====
    const [filters, setFilters] = useState<DashboardBuilderFilter[]>([]);
    const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
    const [filterFormOpen, setFilterFormOpen] = useState(false);
    const [filterForm, setFilterForm] = useState<Partial<DashboardBuilderFilter>>({
        filterId: "",
        label: "",
        type: "month",
        lookupSource: "",
        required: false,
        defaultExpression: "",
        displayOrder: 0,
    });

    // ===== Dataset Schema State =====
    const [datasetSchema, setDatasetSchema] = useState<{
        dimensions: BIDimension[];
        metrics: BIMetric[];
        dateFields: any[];
    } | null>(null);

    // ===== Data Source State =====
    const [availableDatasets, setAvailableDatasets] = useState<{ id: string; title: string; datasetId: string }[]>([]);
    const [dataSourceType, setDataSourceType] = useState<"bi" | "op" | "sql">("bi");
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string>("");
    const [sqlQuerySets, setSqlQuerySets] = useState<{ id: string; presetId: string; title: string }[]>([]);

    // ===== Widget ID State =====
    const [widgetIdPrefix, setWidgetIdPrefix] = useState<string>("");
    const [widgetIdName, setWidgetIdName] = useState<string>("");
    const [availableWidgetIds, setAvailableWidgetIds] = useState<string[]>([]);

    // ===== UI State =====
    const [builderTab, setBuilderTab] = useState(0);

    // ===== Helper Functions =====
    const combineDataSource = (type: string, id: string) => {
        if (!id) return "";
        return `${type}:${id}`;
    };

    const generateWidgetId = (prefix: string, name: string) => {
        if (!prefix || !name) return "";
        return `${prefix}.${name}`;
    };

    // const isBIWidget = dataSourceType === "bi" && !!selectedDataSourceId;
    // const hasDimensions = (widgetForm.dataConfig?.query?.dimensions?.length || 0) > 0;
    // const hasMetrics = (widgetForm.dataConfig?.query?.metrics?.length || 0) > 0;

    // ===== Get available prefixes =====
    const getAvailablePrefixes = useCallback(() => {
        const prefixes: string[] = [];

        // Add BI dataset names as prefixes
        availableDatasets.forEach(ds => {
            if (!prefixes.includes(ds.datasetId)) {
                prefixes.push(ds.datasetId);
            }
        });

        // Add SQL query set preset IDs as prefixes
        sqlQuerySets.forEach(qs => {
            if (!prefixes.includes(qs.presetId)) {
                prefixes.push(qs.presetId);
            }
        });

        // Add common prefixes
        const commonPrefixes = ['leave', 'attendance', 'payroll', 'employee', 'department', 'project', 'task', 'report', 'hr', 'finance'];
        commonPrefixes.forEach(p => {
            if (!prefixes.includes(p)) {
                prefixes.push(p);
            }
        });

        return prefixes;
    }, [availableDatasets, sqlQuerySets]);

    // ===== Load Functions =====
    const loadBuilderMeta = async () => {
        try {
            const api = dashboardService as any;
            const response: any = await api.getDashboardBuilderMeta();
            if (response?.data) {
                setBuilderMeta(response.data);
            }
        } catch (error) {
            console.error("Failed to load builder meta:", error);
        }
    };

    const loadAvailableDatasets = async () => {
        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.listBIDatasets();
            if (response?.data) {
                const datasets = response.data
                    .filter((ds: any) => ds.available !== false)
                    .map((ds: any) => ({
                        id: ds.datasetId || ds.id,
                        title: ds.title || ds.datasetId || ds.id,
                        datasetId: ds.datasetId || ds.id,
                    }));
                setAvailableDatasets(datasets);
            }
        } catch (error) {
            showSnackbar("Failed to load available datasets", "error");
        } finally {
            hideSpinner();
        }
    };

    const loadSqlQuerySets = async () => {
        try {
            const api = dashboardService as any;
            const response: any = await api.listBIQuerySets();
            if (response?.data) {
                const querySets = response.data
                    .filter((qs: any) => qs.queryType === "SQL" || qs.queryType === "sql")
                    .map((qs: any) => ({
                        id: qs.id,
                        presetId: qs.presetId || qs.id,
                        title: qs.title || qs.presetId || qs.id,
                    }));
                setSqlQuerySets(querySets);
            }
        } catch (error) {
            console.error("Failed to load SQL query sets:", error);
        }
    };

    const loadDatasetSchema = async (dataSource: string) => {
        const match = dataSource.match(/^bi:(.+)$/);
        if (!match) {
            setDatasetSchema(null);
            return;
        }

        const datasetId = match[1];
        try {
            const api = dashboardService as any;
            const response: any = await api.getBIDatasetSchema(datasetId);
            if (response?.data) {
                setDatasetSchema({
                    dimensions: response.data.dimensions || [],
                    metrics: response.data.metrics || [],
                    dateFields: response.data.dateFields || [],
                });
            }
        } catch (error) {
            showSnackbar("Failed to load dataset schema", "error");
        }
    };

    const loadBuilderPages = async () => {
        try {
            const api = dashboardService as any;
            const response: any = await api.listDashboardBuilderPages();
            if (response?.data) {
                setBuilderPages(response.data);
                if (response.data.length > 0 && !selectedPageId) {
                    setSelectedPageId(response.data[0].id);
                    await loadPageDetails(response.data[0].id);
                }
            }
        } catch (error) {
            showSnackbar("Failed to load pages", "error");
        }
    };

    const loadPageDetails = async (pageId: string) => {
        try {
            const api = dashboardService as any;
            const [widgetsResponse, filtersResponse] = await Promise.all([
                api.listDashboardBuilderWidgets(pageId),
                api.listDashboardBuilderFilters(pageId),
            ]);

            if (widgetsResponse?.data) {
                setWidgets(widgetsResponse.data);
            }
            if (filtersResponse?.data) {
                setFilters(filtersResponse.data);
            }
        } catch (error) {
            showSnackbar("Failed to load page details", "error");
        }
    };

    const loadAvailableWidgetIds = useCallback(async () => {
        try {
            const api = dashboardService as any;
            const pagesResponse: any = await api.listDashboardBuilderPages();
            if (pagesResponse?.data) {
                const allWidgetIds: string[] = [];
                for (const page of pagesResponse.data) {
                    const widgetsResponse: any = await api.listDashboardBuilderWidgets(page.id);
                    if (widgetsResponse?.data) {
                        const ids = widgetsResponse.data.map((w: any) => w.widgetId);
                        allWidgetIds.push(...ids);
                    }
                }
                setAvailableWidgetIds(allWidgetIds);
            }
        } catch (error) {
            console.error("Failed to load widget IDs:", error);
        }
    }, []);

    // ===== Effects =====
    // Effect to combine data source
    useEffect(() => {
        if (selectedDataSourceId) {
            const combined = combineDataSource(dataSourceType, selectedDataSourceId);
            setWidgetForm((prev) => ({ ...prev, dataSource: combined }));

            if (dataSourceType === "bi") {
                loadDatasetSchema(combined);
            } else {
                setDatasetSchema(null);
            }
        } else {
            setWidgetForm((prev) => ({ ...prev, dataSource: "" }));
            setDatasetSchema(null);
        }
    }, [dataSourceType, selectedDataSourceId]);

    // Effect to combine widget ID
    useEffect(() => {
        if (widgetIdPrefix && widgetIdName) {
            const combined = generateWidgetId(widgetIdPrefix, widgetIdName);
            setWidgetForm((prev) => ({ ...prev, widgetId: combined }));
        } else {
            setWidgetForm((prev) => ({ ...prev, widgetId: "" }));
        }
    }, [widgetIdPrefix, widgetIdName]);

    // Effect to set initial widget ID when editing
    useEffect(() => {
        if (editingWidgetId && widgetForm.widgetId) {
            const parts = widgetForm.widgetId.split('.');
            if (parts.length >= 2) {
                const prefix = parts.slice(0, -1).join('.');
                const name = parts[parts.length - 1];
                setWidgetIdPrefix(prefix);
                setWidgetIdName(name);
            } else {
                setWidgetIdPrefix("");
                setWidgetIdName(widgetForm.widgetId || "");
            }
        }
    }, [editingWidgetId, widgetForm.widgetId]);

    // Initialize
    useEffect(() => {
        loadBuilderMeta();
        loadBuilderPages();
        loadAvailableDatasets();
        loadSqlQuerySets();
        loadAvailableWidgetIds();
    }, []);

    // ===== Reset Functions =====
    const resetWidgetIdFields = () => {
        setWidgetIdPrefix("");
        setWidgetIdName("");
    };

    const resetBuilderPageForm = () => {
        setEditingBuilderPageId(null);
        setBuilderPageForm({
            pageKey: "",
            title: "",
            description: "",
            displayOrder: 1,
        });
    };

    const resetWidgetForm = () => {
        setEditingWidgetId(null);
        setSelectedDataSourceId("");
        setDataSourceType("bi");
        setDatasetSchema(null);
        resetWidgetIdFields();

        const emptyForm = {
            id: "",
            widgetId: "",
            title: "",
            type: "kpi",
            size: "medium",
            position: 0,
            locked: false,
            dataSource: "",
            dataConfig: {},
            actions: {},
            active: true,
            roles: [],
        };
        setWidgetForm(emptyForm);
        setWidgetFormJsonString(JSON.stringify(emptyForm.dataConfig || {}, null, 2));
    };

    const resetFilterForm = () => {
        setEditingFilterId(null);
        setFilterForm({
            filterId: "",
            label: "",
            type: "month",
            lookupSource: "",
            required: false,
            defaultExpression: "",
            displayOrder: 0,
        });
    };

    // ===== Page CRUD =====
    const createBuilderPage = async () => {
        if (!builderPageForm.pageKey.trim() || !builderPageForm.title.trim()) {
            showSnackbar("Page Key and Title are required", "error");
            return;
        }

        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.createDashboardBuilderPage({
                pageKey: builderPageForm.pageKey,
                title: builderPageForm.title,
                description: builderPageForm.description,
                displayOrder: builderPageForm.displayOrder,
                active: true,
                roles: [],
            });

            if (response?.success) {
                showSnackbar("Page created successfully", "success");
                resetBuilderPageForm();
                await loadBuilderPages();
            } else {
                showSnackbar(response?.message || "Failed to create page", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to create page", "error");
        } finally {
            hideSpinner();
        }
    };

    const handleEditBuilderPage = async (pageId: string) => {
        try {
            const api = dashboardService as any;
            const response: any = await api.getDashboardBuilderPage(pageId);
            const page = response?.data;
            if (!page) {
                showSnackbar("Unable to load page", "error");
                return;
            }

            setEditingBuilderPageId(pageId);
            setBuilderPageForm({
                pageKey: page.pageKey || "",
                title: page.title || "",
                description: page.description || "",
                displayOrder: page.displayOrder || 1,
            });
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to load page", "error");
        }
    };

    const handleUpdateBuilderPage = async () => {
        if (!editingBuilderPageId) return;

        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.updateDashboardBuilderPage(editingBuilderPageId, {
                pageKey: builderPageForm.pageKey,
                title: builderPageForm.title,
                description: builderPageForm.description,
                displayOrder: builderPageForm.displayOrder,
            });

            if (response?.success) {
                showSnackbar("Page updated successfully", "success");
                resetBuilderPageForm();
                await loadBuilderPages();
            } else {
                showSnackbar(response?.message || "Failed to update page", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to update page", "error");
        } finally {
            hideSpinner();
        }
    };

    const handleDeleteBuilderPage = async (pageId: string) => {
        showConfirmDialog({
            title: "Delete Page",
            message: "Are you sure you want to delete this page? This action cannot be undone.",
            confirmText: "Delete",
            onConfirm: async () => {
                showSpinner();
                try {
                    const api = dashboardService as any;
                    const response: any = await api.deleteDashboardBuilderPage(pageId);
                    if (response?.success) {
                        showSnackbar("Page deleted successfully", "success");
                        if (selectedPageId === pageId) {
                            setSelectedPageId(null);
                            setWidgets([]);
                            setFilters([]);
                        }
                        await loadBuilderPages();
                    } else {
                        showSnackbar(response?.message || "Failed to delete page", "error");
                    }
                } catch (error: any) {
                    showSnackbar(error?.message || "Failed to delete page", "error");
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ===== Widget CRUD =====
    const openAddWidgetForm = () => {
        resetWidgetForm();
        setWidgetFormOpen(true);
    };

    const openEditWidgetForm = (widget: DashboardBuilderWidget) => {
        setEditingWidgetId(widget.id);

        // Parse data source
        const match = widget.dataSource?.match(/^(bi|op|sql):(.+)$/);
        if (match) {
            setDataSourceType(match[1] as "bi" | "op" | "sql");
            setSelectedDataSourceId(match[2]);
            if (match[1] === "bi") {
                loadDatasetSchema(widget.dataSource);
            }
        } else {
            setDataSourceType("bi");
            setSelectedDataSourceId("");
        }

        // Parse widget ID
        const parts = widget.widgetId.split('.');
        if (parts.length >= 2) {
            const prefix = parts.slice(0, -1).join('.');
            const name = parts[parts.length - 1];
            setWidgetIdPrefix(prefix);
            setWidgetIdName(name);
        } else {
            setWidgetIdPrefix("");
            setWidgetIdName(widget.widgetId || "");
        }

        const formData = {
            widgetId: widget.widgetId,
            title: widget.title,
            type: widget.type,
            size: widget.size,
            position: widget.position,
            locked: widget.locked,
            dataSource: widget.dataSource,
            dataConfig: widget.dataConfig || {},
            actions: widget.actions || {},
            active: widget.active,
            roles: widget.roles || [],
        };
        setWidgetForm(formData);
        setWidgetFormJsonString(JSON.stringify(formData.dataConfig || {}, null, 2));
        setWidgetFormOpen(true);
    };

    const handleAddWidget = async () => {
        if (!selectedPageId) {
            showSnackbar("Please select a page first", "error");
            return;
        }

        if (!selectedDataSourceId) {
            showSnackbar("Please select a data source", "error");
            return;
        }

        if (!widgetIdPrefix || !widgetIdName) {
            showSnackbar("Please enter a widget ID", "error");
            return;
        }

        const fullWidgetId = generateWidgetId(widgetIdPrefix, widgetIdName);
        if (availableWidgetIds.includes(fullWidgetId)) {
            showSnackbar("Widget ID already exists. Please use a different name.", "error");
            return;
        }

        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.addDashboardBuilderWidget(selectedPageId, {
                widgetId: fullWidgetId,
                title: widgetForm.title,
                type: widgetForm.type || "kpi",
                size: widgetForm.size || "medium",
                position: widgetForm.position || 0,
                locked: widgetForm.locked || false,
                dataSource: widgetForm.dataSource || "",
                dataConfig: widgetForm.dataConfig || {},
                actions: widgetForm.actions || {},
                active: widgetForm.active !== undefined ? widgetForm.active : true,
                roles: widgetForm.roles || [],
            });

            if (response?.success) {
                showSnackbar("Widget added successfully", "success");
                setWidgetFormOpen(false);
                resetWidgetForm();
                await loadPageDetails(selectedPageId);
                await loadAvailableWidgetIds();
            } else {
                showSnackbar(response?.message || "Failed to add widget", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to add widget", "error");
        } finally {
            hideSpinner();
        }
    };

    const handleUpdateWidget = async () => {
        if (!selectedPageId || !editingWidgetId) return;

        if (!selectedDataSourceId) {
            showSnackbar("Please select a data source", "error");
            return;
        }

        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.updateDashboardBuilderWidget(
                selectedPageId,
                editingWidgetId,
                {
                    widgetId: widgetForm.widgetId,
                    title: widgetForm.title,
                    type: widgetForm.type || "kpi",
                    size: widgetForm.size || "medium",
                    position: widgetForm.position || 0,
                    locked: widgetForm.locked || false,
                    dataSource: widgetForm.dataSource || "",
                    dataConfig: widgetForm.dataConfig || {},
                    actions: widgetForm.actions || {},
                    active: widgetForm.active !== undefined ? widgetForm.active : true,
                    roles: widgetForm.roles || [],
                }
            );

            if (response?.success) {
                showSnackbar("Widget updated successfully", "success");
                setWidgetFormOpen(false);
                resetWidgetForm();
                await loadPageDetails(selectedPageId);
                await loadAvailableWidgetIds();
            } else {
                showSnackbar(response?.message || "Failed to update widget", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to update widget", "error");
        } finally {
            hideSpinner();
        }
    };

    const handleToggleWidgetActive = async (widget: DashboardBuilderWidget) => {
        if (!selectedPageId) return;

        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.updateDashboardBuilderWidget(
                selectedPageId,
                widget.id,
                {
                    ...widget,
                    active: !widget.active,
                }
            );

            if (response?.success) {
                showSnackbar(`Widget ${widget.active ? "deactivated" : "activated"} successfully`, "success");
                await loadPageDetails(selectedPageId);
            } else {
                showSnackbar(response?.message || "Failed to update widget", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to update widget", "error");
        } finally {
            hideSpinner();
        }
    };

    const handleDeleteWidget = async (widgetId: string, active: boolean) => {
        if (!selectedPageId) return;
        showConfirmDialog({
            title: `${active ? 'Deactivate' : 'Activate'} Widget`,
            message: `Are you sure you want to ${active ? 'deactivate' : 'activate'} this widget?`,
            confirmText: `${active ? 'Deactivate' : 'Activate'}`,
            onConfirm: async () => {
                showSpinner();
                try {
                    const api = dashboardService as any;
                    const response: any = await api.deleteDashboardBuilderWidget(selectedPageId, widgetId);
                    if (response?.success) {
                        showSnackbar("Widget deactivated successfully", "success");
                        await loadPageDetails(selectedPageId);
                        await loadAvailableWidgetIds();
                    } else {
                        showSnackbar(response?.message || "Failed to deactivate widget", "error");
                    }
                } catch (error: any) {
                    showSnackbar(error?.message || "Failed to deactivate widget", "error");
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ===== Filter CRUD =====
    const openAddFilterForm = () => {
        resetFilterForm();
        setFilterFormOpen(true);
    };

    const openEditFilterForm = (filter: DashboardBuilderFilter) => {
        setEditingFilterId(filter.id);
        setFilterForm({
            filterId: filter.filterId,
            label: filter.label,
            type: filter.type,
            lookupSource: filter.lookupSource || "",
            required: filter.required,
            defaultExpression: filter.defaultExpression || "",
            displayOrder: filter.displayOrder || 0,
        });
        setFilterFormOpen(true);
    };

    const handleAddFilter = async () => {
        if (!selectedPageId) {
            showSnackbar("Please select a page first", "error");
            return;
        }

        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.addDashboardBuilderFilter(selectedPageId, {
                filterId: filterForm.filterId,
                label: filterForm.label,
                type: filterForm.type || "month",
                lookupSource: filterForm.lookupSource || "",
                required: filterForm.required || false,
                defaultExpression: filterForm.defaultExpression || "",
                displayOrder: filterForm.displayOrder || 0,
            });

            if (response?.success) {
                showSnackbar("Filter added successfully", "success");
                setFilterFormOpen(false);
                resetFilterForm();
                await loadPageDetails(selectedPageId);
            } else {
                showSnackbar(response?.message || "Failed to add filter", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to add filter", "error");
        } finally {
            hideSpinner();
        }
    };

    const handleUpdateFilter = async () => {
        if (!selectedPageId || !editingFilterId) return;

        showSpinner();
        try {
            const api = dashboardService as any;
            const response: any = await api.updateDashboardBuilderFilter(
                selectedPageId,
                editingFilterId,
                {
                    filterId: filterForm.filterId,
                    label: filterForm.label,
                    type: filterForm.type || "month",
                    lookupSource: filterForm.lookupSource || "",
                    required: filterForm.required || false,
                    defaultExpression: filterForm.defaultExpression || "",
                    displayOrder: filterForm.displayOrder || 0,
                }
            );

            if (response?.success) {
                showSnackbar("Filter updated successfully", "success");
                setFilterFormOpen(false);
                resetFilterForm();
                await loadPageDetails(selectedPageId);
            } else {
                showSnackbar(response?.message || "Failed to update filter", "error");
            }
        } catch (error: any) {
            showSnackbar(error?.message || "Failed to update filter", "error");
        } finally {
            hideSpinner();
        }
    };

    const handleDeleteFilter = async (filterId: string) => {
        if (!selectedPageId) return;

        showConfirmDialog({
            title: "Delete Filter",
            message: "Are you sure you want to delete this filter?",
            confirmText: "Delete",
            onConfirm: async () => {
                showSpinner();
                try {
                    const api = dashboardService as any;
                    const response: any = await api.deleteDashboardBuilderFilter(selectedPageId, filterId);
                    if (response?.success) {
                        showSnackbar("Filter deleted successfully", "success");
                        await loadPageDetails(selectedPageId);
                    } else {
                        showSnackbar(response?.message || "Failed to delete filter", "error");
                    }
                } catch (error: any) {
                    showSnackbar(error?.message || "Failed to delete filter", "error");
                } finally {
                    hideSpinner();
                }
            },
        });
    };

    // ===== Page Selection =====
    const handlePageSelect = (pageId: string) => {
        setSelectedPageId(pageId);
        setBuilderTab(0);
        loadPageDetails(pageId);
    };

    // ===== Render Functions =====
    const renderPageManagement = () => (
        <div className="bg-white-50">
            <div className="space-y-4">
                <div className="p-4 border bg-white border-gray-200">
                    <Typography variant="subtitle2" className="text-gray-800 !mb-5" sx={{ fontWeight: 600 }}>
                        {editingBuilderPageId ? "Edit Page" : "Create New Page"}
                    </Typography>
                    <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextField
                            label="Page Key"
                            value={builderPageForm.pageKey}
                            required
                            onChange={(e) =>
                                setBuilderPageForm((prev) => ({ ...prev, pageKey: e.target.value }))
                            }
                            placeholder="e.g., sales-dashboard"
                            disabled={!!editingBuilderPageId}
                        />
                        <TextField
                            label="Title"
                            required
                            value={builderPageForm.title}
                            onChange={(e) =>
                                setBuilderPageForm((prev) => ({ ...prev, title: e.target.value }))
                            }
                        />
                        <TextField
                            label="Display Order"
                            type="number"
                            value={builderPageForm.displayOrder}
                            onChange={(e) =>
                                setBuilderPageForm((prev) => ({
                                    ...prev,
                                    displayOrder: Number(e.target.value || 1),
                                }))
                            }
                        />
                        <TextField
                            label="Description"
                            value={builderPageForm.description}
                            multiline
                            rows={3}
                            onChange={(e) =>
                                setBuilderPageForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            className="md:col-span-2"
                        />
                    </Box>
                    <Box className="flex items-center justify-end gap-2 mt-4">
                        <Button
                            variant="contained"
                            className="!bg-primary"
                            onClick={() =>
                                void (editingBuilderPageId ? handleUpdateBuilderPage() : createBuilderPage())
                            }
                        >
                            {editingBuilderPageId ? "Update Page" : "Create Page"}
                        </Button>
                        {editingBuilderPageId && (
                            <Button
                                variant="outlined"
                                className="!text-gray-800 !border-gray-200"
                                onClick={resetBuilderPageForm}
                            >
                                Cancel
                            </Button>
                        )}
                    </Box>
                </div>

                <TableContainer className="bg-white border border-gray-200">
                    <Table>
                        <TableHead className="bg-gray-50">
                            <TableRow>
                                <TableCell className="!font-bold">S No</TableCell>
                                <TableCell className="!font-bold">Page Key</TableCell>
                                <TableCell className="!font-bold">Title</TableCell>
                                <TableCell className="!font-bold">Description</TableCell>
                                <TableCell className="!font-bold">Status</TableCell>
                                <TableCell className="!font-bold" align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {builderPages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                        No pages created yet. Create your first page above.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                builderPages.map((page, i) => (
                                    <TableRow
                                        key={page.id}
                                        className="border-b border-gray-200"
                                        sx={{
                                            ...getRowColor(i),
                                            backgroundColor: selectedPageId === page.id ? "rgba(25, 118, 210, 0.08)" : undefined,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handlePageSelect(page.id)}
                                    >
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" className="font-mono text-xs">
                                                {page.pageKey}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{page.title}</TableCell>
                                        <TableCell>{page.description || "-"}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={page.active ? "Active" : "Inactive"}
                                                size="small"
                                                color={page.active ? "success" : "default"}
                                            />
                                        </TableCell>
                                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                            <Box className="flex justify-end gap-1">
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => void handleEditBuilderPage(page.id)}
                                                    >
                                                        <Edit fontSize="small" className="!w-4" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => void handleDeleteBuilderPage(page.id)}
                                                    >
                                                        <Delete fontSize="small" className="!w-4" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );

    const renderPageDetails = () => {
        if (!selectedPageId) {
            return (
                <Card className="bg-white">
                    <CardContent>
                        <Box className="text-center py-12">
                            <DashboardIcon className="text-gray-300 text-6xl mb-4" />
                            <Typography className="text-gray-500">
                                Select a page from the left to manage its widgets and filters
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            );
        }

        const selectedPage = builderPages.find((p) => p.id === selectedPageId);

        return (
            <Card className="bg-white">
                <CardHeader
                    title={
                        <Box className="flex items-center gap-3">
                            <Typography variant="h6" className="text-gray-800">
                                {selectedPage?.title || "Page Details"}
                            </Typography>
                            <Chip
                                label={`${widgets.length} Widgets`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            <Chip
                                label={`${filters.length} Filters`}
                                size="small"
                                color="secondary"
                                variant="outlined"
                            />
                        </Box>
                    }
                    action={
                        <Box className="flex gap-2">
                            <Button
                                variant="outlined"
                                size="small"
                                className="!border-primary !text-primary"
                                startIcon={<FilterListIcon />}
                                onClick={openAddFilterForm}
                            >
                                Add Filter
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                className="!bg-primary"
                                startIcon={<WidgetsIcon />}
                                onClick={openAddWidgetForm}
                            >
                                Add Widget
                            </Button>
                        </Box>
                    }
                />
                <CardContent>
                    <Tabs
                        value={builderTab}
                        onChange={(_, value) => setBuilderTab(value)}
                        className="border-b border-gray-200"
                        sx={{
                            "& .MuiTabs-indicator": {
                                backgroundColor: "var(--color-primary)",
                                height: 3,
                                borderRadius: "3px 3px 0 0",
                            },
                        }}
                    >
                        <Tab label={`Widgets (${widgets.length})`} className="!text-gray-800" />
                        <Tab label={`Filters (${filters.length})`} className="!text-gray-800" />
                    </Tabs>

                    <Box sx={{ pt: 3 }}>
                        {builderTab === 0 && (
                            <Box>
                                {widgets.length === 0 ? (
                                    <Box className="text-center py-8">
                                        <WidgetsIcon className="text-gray-300 mb-3" />
                                        <Typography className="text-gray-500 !mb-3">
                                            No widgets added to this page yet
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            className="!bg-primary mt-3"
                                            startIcon={<AddIcon />}
                                            onClick={openAddWidgetForm}
                                        >
                                            Add Your First Widget
                                        </Button>
                                    </Box>
                                ) : (
                                    <Grid container spacing={2}>
                                        {widgets.map((widget) => (
                                            <Grid size={{ xs: 12, md: 6 }} key={widget.id}>
                                                <div
                                                    className={`p-4 transition-all bg-white-50 border border-gray-200 hover:shadow-md ${!widget.active ? "opacity-60 bg-gray-50" : ""
                                                        }`}
                                                >
                                                    <Box className="flex justify-between items-start">
                                                        <div>
                                                            <Typography variant="subtitle2" className="text-gray-800 !font-semibold">
                                                                {widget.title}
                                                            </Typography>
                                                            <Typography variant="caption" className="text-gray-500 block">
                                                                {widget.widgetId}
                                                            </Typography>
                                                            <Box className="flex gap-1 !my-3 flex-wrap">
                                                                <Chip
                                                                    label={widget.type}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    className="text-gray-800"
                                                                />
                                                                <Chip
                                                                    label={widget.size}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    className="text-gray-800"
                                                                />
                                                                {widget.locked && (
                                                                    <Chip
                                                                        icon={<LockIcon className="!w-3 !h-3" />}
                                                                        label="Locked"
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="warning"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </div>
                                                        <Box className="flex gap-1">
                                                            <Tooltip title="Edit">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => openEditWidgetForm(widget)}
                                                                >
                                                                    <Edit fontSize="small" className="!w-4" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {
                                                                widget.active &&
                                                                <Tooltip title="Deactivate">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteWidget(widget.id, widget.active)}
                                                                    >
                                                                        <Cancel fontSize="small" className="!w-4" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            }
                                                            {
                                                                !widget.active &&
                                                                <Tooltip title="Activate">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="success"
                                                                        onClick={() => handleToggleWidgetActive(widget)}
                                                                    >
                                                                        <CheckCircle fontSize="small" className="!w-4" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            }
                                                        </Box>
                                                    </Box>
                                                    {widget.dataSource && (
                                                        <Typography variant="caption" className="text-gray-400 block mt-2 truncate">
                                                            Data Source: {widget.dataSource}
                                                        </Typography>
                                                    )}
                                                </div>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Box>
                        )}

                        {builderTab === 1 && (
                            <Box>
                                {filters.length === 0 ? (
                                    <Box className="text-center py-8">
                                        <FilterListIcon className="text-gray-300 mb-3" />
                                        <Typography className="text-gray-500 !mb-3">
                                            No filters added to this page yet
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            className="!bg-primary mt-3"
                                            startIcon={<AddIcon />}
                                            onClick={openAddFilterForm}
                                        >
                                            Add Your First Filter
                                        </Button>
                                    </Box>
                                ) : (
                                    <TableContainer className="border border-gray-200 bg-white-50">
                                        <Table>
                                            <TableHead className="bg-gray-50">
                                                <TableRow>
                                                    <TableCell className="!font-bold">Filter ID</TableCell>
                                                    <TableCell className="!font-bold">Label</TableCell>
                                                    <TableCell className="!font-bold">Type</TableCell>
                                                    <TableCell className="!font-bold">Required</TableCell>
                                                    <TableCell className="!font-bold">Default Expression</TableCell>
                                                    <TableCell className="!font-bold" align="right">Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filters.map((filter, i) => (
                                                    <TableRow key={filter.id} sx={getRowColor(i)}>
                                                        <TableCell>{filter.filterId}</TableCell>
                                                        <TableCell>{filter.label}</TableCell>
                                                        <TableCell>
                                                            <Chip label={filter.type} size="small" variant="outlined" className="text-gray-800" />
                                                        </TableCell>
                                                        <TableCell>
                                                            {filter.required ? (
                                                                <Chip label="Required" size="small" color="error" />
                                                            ) : (
                                                                <Chip label="Optional" size="small" variant="outlined" className="text-gray-800" />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{filter.defaultExpression || "-"}</TableCell>
                                                        <TableCell align="right">
                                                            <Box className="flex justify-end gap-1">
                                                                <Tooltip title="Edit">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => openEditFilterForm(filter)}
                                                                    >
                                                                        <Edit fontSize="small" className="!w-4" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteFilter(filter.id)}
                                                                    >
                                                                        <Delete fontSize="small" className="!w-4" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    // ===== Widget Form Dialog =====
    const renderWidgetFormDialog = () => (
        <Dialog open={widgetFormOpen} onClose={() => setWidgetFormOpen(false)} maxWidth="md" fullWidth>
            <div className="!p-2 border-b border-gray-200">
                <Box className="flex justify-between items-center">
                    <Typography variant="h6" className="text-gray-800 !ml-4">
                        {editingWidgetId ? "Edit Widget" : "Add Widget"}
                    </Typography>
                    <IconButton onClick={() => setWidgetFormOpen(false)}>
                        <CloseOutlined className="text-gray-800" />
                    </IconButton>
                </Box>
            </div>
            <DialogContent className="!py-6">
                <Box className="grid grid-cols-2 gap-x-5 gap-y-5">
                    {/* Widget ID - With Prefix and Name */}
                    <Box className="col-span-2">
                        <Typography variant="subtitle2" className="text-gray-700 mb-2">
                            Widget ID
                        </Typography>
                        <Box className="flex gap-3 items-start">
                            <FormControl fullWidth sx={{ flex: 1 }}>
                                {/* <InputLabel>Prefix</InputLabel> */}
                                <Select
                                    value={widgetIdPrefix}
                                    onChange={(e) => {
                                        setWidgetIdPrefix(e.target.value);
                                    }}
                                    label="Prefix"
                                    disabled={!!editingWidgetId}
                                >
                                    <MenuItem value="">
                                        <em>Select prefix</em>
                                    </MenuItem>
                                    {getAvailablePrefixes().map((prefix) => (
                                        <MenuItem key={prefix} value={prefix}>
                                            <Box>
                                                <Typography variant="body2">{prefix}</Typography>
                                                {/* <Typography variant="caption" className="text-gray-500">
                                                    {availableDatasets.find(d => d.datasetId === prefix)?.title || 
                                                     sqlQuerySets.find(q => q.presetId === prefix)?.title || 
                                                     'Custom'}
                                                </Typography> */}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    Select from available datasets/query sets or type your own
                                </FormHelperText>
                            </FormControl>

                            <Typography variant="h6" className="text-gray-400 mt-2">.</Typography>

                            <TextField
                                label="Name"
                                value={widgetIdName}
                                onChange={(e) => {
                                    // Only allow alphanumeric and underscore
                                    const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                    setWidgetIdName(value);
                                }}
                                placeholder="e.g., testWidget"
                                disabled={!!editingWidgetId}
                                sx={{ flex: 1 }}
                                helperText="Alphanumeric and underscore only"
                            />
                        </Box>

                        {/* Preview */}
                        {widgetIdPrefix && widgetIdName && (
                            <Box className="mt-2">
                                <Typography variant="caption" className="text-gray-500">
                                    Generated Widget ID:
                                </Typography>
                                <Chip
                                    label={`${widgetIdPrefix}.${widgetIdName}`}
                                    size="small"
                                    color="primary"
                                    className="ml-2"
                                />
                                {availableWidgetIds.includes(`${widgetIdPrefix}.${widgetIdName}`) && (
                                    <Typography variant="caption" className="text-red-500 ml-2">
                                        ⚠️ This widget ID already exists!
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Title */}
                    <TextField
                        label="Title"
                        value={widgetForm.title || ""}
                        onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })}
                        required
                        placeholder="e.g., Employee Leave Summary"
                    />

                    {/* Type */}
                    <FormControl fullWidth>
                        <InputLabel>Chart Type</InputLabel>
                        <Select
                            value={widgetForm.type || "kpi"}
                            onChange={(e) => {
                                const type = e.target.value;
                                setWidgetForm({
                                    ...widgetForm,
                                    type,
                                    dataConfig: {
                                        ...widgetForm.dataConfig,
                                        visualization: { type }
                                    }
                                });
                            }}
                            label="Chart Type"
                        >
                            {builderMeta?.chartTypes?.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Size */}
                    <FormControl fullWidth>
                        <InputLabel>Size</InputLabel>
                        <Select
                            value={widgetForm.size || "medium"}
                            onChange={(e) =>
                                setWidgetForm({ ...widgetForm, size: e.target.value as any })
                            }
                            label="Size"
                        >
                            {builderMeta?.widgetSizes?.map((size) => (
                                <MenuItem key={size} value={size}>
                                    {size.charAt(0).toUpperCase() + size.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Position */}
                    <TextField
                        label="Position"
                        type="number"
                        value={widgetForm.position || 0}
                        onChange={(e) =>
                            setWidgetForm({ ...widgetForm, position: Number(e.target.value) })
                        }
                        fullWidth
                        helperText="Order in which widgets appear on the page"
                    />

                    {/* Roles */}
                    <TextField
                        label="Roles (comma separated)"
                        value={(widgetForm.roles || []).join(", ")}
                        onChange={(e) =>
                            setWidgetForm({
                                ...widgetForm,
                                roles: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                            })
                        }
                        fullWidth
                        placeholder="ADMIN, MANAGER, HR, ESS"
                        helperText="Leave empty for all roles"
                    />

                    {/* Data Source Section */}
                    <Box className="col-span-2">
                        <Typography variant="subtitle2" className="text-gray-700 mb-3">
                            Data Source Configuration
                        </Typography>

                        <Box className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <FormControl fullWidth>
                                <InputLabel>Data Source Type</InputLabel>
                                <Select
                                    value={dataSourceType}
                                    onChange={(e) => {
                                        const newType = e.target.value as "bi" | "op" | "sql";
                                        setDataSourceType(newType);
                                        setSelectedDataSourceId("");
                                        setDatasetSchema(null);
                                    }}
                                    label="Data Source Type"
                                    disabled={!!editingWidgetId}
                                >
                                    <MenuItem value="bi">
                                        <Box>
                                            <Typography variant="body2">BI Dataset</Typography>
                                            <Typography variant="caption" className="text-blue-600">
                                                bi:datasetName
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="sql">
                                        <Box>
                                            <Typography variant="body2">SQL Query Set</Typography>
                                            <Typography variant="caption" className="text-purple-600">
                                                sql:querySetId
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="op">
                                        <Box>
                                            <Typography variant="body2">Operational Provider</Typography>
                                            <Typography variant="caption" className="text-green-600">
                                                op:provider.key
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>

                            {dataSourceType === "bi" && (
                                <FormControl fullWidth>
                                    <InputLabel>Select Dataset</InputLabel>
                                    <Select
                                        value={selectedDataSourceId}
                                        onChange={(e) => {
                                            setSelectedDataSourceId(e.target.value);
                                        }}
                                        label="Select Dataset"
                                        disabled={!!editingWidgetId}
                                    >
                                        <MenuItem value="">
                                            <em>Select a dataset</em>
                                        </MenuItem>
                                        {availableDatasets.map((ds) => (
                                            <MenuItem key={ds.id} value={ds.datasetId}>
                                                <Box>
                                                    <Typography variant="body2">{ds.title}</Typography>
                                                    <Typography variant="caption" className="text-gray-500">
                                                        {ds.datasetId}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        {availableDatasets.length === 0 ? (
                                            <Typography variant="caption" className="text-yellow-600">
                                                No datasets available. Create one in the Datasets tab.
                                            </Typography>
                                        ) : (
                                            `Select from ${availableDatasets.length} available datasets`
                                        )}
                                    </FormHelperText>
                                </FormControl>
                            )}

                            {dataSourceType === "sql" && (
                                <FormControl fullWidth>
                                    <InputLabel>Select SQL Query Set</InputLabel>
                                    <Select
                                        value={selectedDataSourceId}
                                        onChange={(e) => {
                                            setSelectedDataSourceId(e.target.value);
                                        }}
                                        label="Select SQL Query Set"
                                        disabled={!!editingWidgetId}
                                    >
                                        <MenuItem value="">
                                            <em>Select a query set</em>
                                        </MenuItem>
                                        {sqlQuerySets.map((qs) => (
                                            <MenuItem key={qs.id} value={qs.presetId}>
                                                <Box>
                                                    <Typography variant="body2">{qs.title}</Typography>
                                                    <Typography variant="caption" className="text-purple-500">
                                                        {qs.presetId}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        {sqlQuerySets.length === 0 ? (
                                            <Typography variant="caption" className="text-yellow-600">
                                                No SQL query sets available. Create one in the Query Sets tab.
                                            </Typography>
                                        ) : (
                                            `Select from ${sqlQuerySets.length} available query sets`
                                        )}
                                    </FormHelperText>
                                </FormControl>
                            )}

                            {dataSourceType === "op" && (
                                <TextField
                                    label="Operational Provider Key"
                                    value={selectedDataSourceId}
                                    onChange={(e) => {
                                        setSelectedDataSourceId(e.target.value);
                                    }}
                                    placeholder="e.g., employee.leaveBalance"
                                    helperText="Format: op:provider.key (e.g., op:employee.leaveBalance)"
                                    disabled={!!editingWidgetId}
                                />
                            )}

                            {selectedDataSourceId && (
                                <Box className="col-span-2 mt-2">
                                    <Typography variant="caption" className="text-gray-500">
                                        Combined Data Source:
                                    </Typography>
                                    <Chip
                                        label={`${dataSourceType}:${selectedDataSourceId}`}
                                        size="small"
                                        color="primary"
                                        className="ml-2"
                                    />
                                    <Typography variant="caption" className="text-gray-400 ml-2">
                                        (This will be used as the dataSource value)
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Dimensions & Metrics - Only for BI */}
                    {dataSourceType === "bi" && datasetSchema && selectedDataSourceId && (
                        <>
                            <FormControl fullWidth className="col-span-2">
                                <InputLabel>Dimensions</InputLabel>
                                <Select
                                    multiple
                                    value={widgetForm.dataConfig?.query?.dimensions || []}
                                    onChange={(e) => {
                                        const dimensions = e.target.value as string[];
                                        setWidgetForm({
                                            ...widgetForm,
                                            dataConfig: {
                                                ...widgetForm.dataConfig,
                                                query: {
                                                    ...widgetForm.dataConfig?.query,
                                                    dimensions,
                                                }
                                            }
                                        });
                                        if (dimensions.length > 0 && (widgetForm.type === 'donut' || widgetForm.type === 'pie')) {
                                            setWidgetForm((prev) => ({
                                                ...prev,
                                                dataConfig: {
                                                    ...prev.dataConfig,
                                                    visualization: {
                                                        ...prev.dataConfig?.visualization,
                                                        labelDim: dimensions[0],
                                                    }
                                                }
                                            }));
                                        }
                                    }}
                                    label="Dimensions"
                                    renderValue={(selected) => (
                                        <Box className="flex flex-wrap gap-1">
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {datasetSchema.dimensions.map((dim) => (
                                        <MenuItem key={dim.id} value={dim.id}>
                                            <Checkbox checked={(widgetForm.dataConfig?.query?.dimensions || []).indexOf(dim.id) > -1} />
                                            <div>
                                                <div className="!text-gray-800">{dim.id}</div>
                                                <div className="!text-gray-500 text-xs">{dim.type}</div>
                                            </div>
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Select dimensions for grouping</FormHelperText>
                            </FormControl>

                            <FormControl fullWidth className="col-span-2">
                                <InputLabel>Metrics</InputLabel>
                                <Select
                                    multiple
                                    value={widgetForm.dataConfig?.query?.metrics || []}
                                    onChange={(e) => {
                                        const metrics = e.target.value as string[];
                                        setWidgetForm({
                                            ...widgetForm,
                                            dataConfig: {
                                                ...widgetForm.dataConfig,
                                                query: {
                                                    ...widgetForm.dataConfig?.query,
                                                    metrics,
                                                }
                                            }
                                        });
                                        if (metrics.length > 0 && (widgetForm.type === 'donut' || widgetForm.type === 'pie')) {
                                            setWidgetForm((prev) => ({
                                                ...prev,
                                                dataConfig: {
                                                    ...prev.dataConfig,
                                                    visualization: {
                                                        ...prev.dataConfig?.visualization,
                                                        valueMetric: metrics[0],
                                                    }
                                                }
                                            }));
                                        }
                                    }}
                                    label="Metrics"
                                    renderValue={(selected) => (
                                        <Box className="flex flex-wrap gap-1">
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={value} size="small" color="primary" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {datasetSchema.metrics.map((metric) => (
                                        <MenuItem key={metric.id} value={metric.id}>
                                            <Checkbox checked={(widgetForm.dataConfig?.query?.metrics || []).indexOf(metric.id) > -1} />
                                            <div>
                                                <div className="!text-gray-800">{metric.id}</div>
                                                <div className="!text-gray-500 text-xs">{metric.aggregation} ({metric.type})</div>
                                            </div>
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Select metrics for calculation</FormHelperText>
                            </FormControl>

                            <div className="col-span-2">
                                <Typography variant="subtitle2" className="text-gray-700 mb-3">
                                    Visualization Configuration
                                </Typography>
                                <Box className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    {(widgetForm.type === 'donut' || widgetForm.type === 'pie') && (
                                        <>
                                            <FormControl fullWidth>
                                                <InputLabel>Label Dimension</InputLabel>
                                                <Select
                                                    value={widgetForm.dataConfig?.visualization?.labelDim || ''}
                                                    onChange={(e) => {
                                                        setWidgetForm({
                                                            ...widgetForm,
                                                            dataConfig: {
                                                                ...widgetForm.dataConfig,
                                                                visualization: {
                                                                    ...widgetForm.dataConfig?.visualization,
                                                                    type: widgetForm.type,
                                                                    labelDim: e.target.value,
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    label="Label Dimension"
                                                >
                                                    <MenuItem value="">None</MenuItem>
                                                    {(widgetForm.dataConfig?.query?.dimensions || []).map((dim: any) => (
                                                        <MenuItem key={dim} value={dim}>{dim}</MenuItem>
                                                    ))}
                                                </Select>
                                                <FormHelperText>Dimension for labels</FormHelperText>
                                            </FormControl>
                                            <FormControl fullWidth>
                                                <InputLabel>Value Metric</InputLabel>
                                                <Select
                                                    value={widgetForm.dataConfig?.visualization?.valueMetric || ''}
                                                    onChange={(e) => {
                                                        setWidgetForm({
                                                            ...widgetForm,
                                                            dataConfig: {
                                                                ...widgetForm.dataConfig,
                                                                visualization: {
                                                                    ...widgetForm.dataConfig?.visualization,
                                                                    type: widgetForm.type,
                                                                    valueMetric: e.target.value,
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    label="Value Metric"
                                                >
                                                    <MenuItem value="">None</MenuItem>
                                                    {(widgetForm.dataConfig?.query?.metrics || []).map((metric: any) => (
                                                        <MenuItem key={metric} value={metric}>{metric}</MenuItem>
                                                    ))}
                                                </Select>
                                                <FormHelperText>Metric for values</FormHelperText>
                                            </FormControl>
                                        </>
                                    )}

                                    {(widgetForm.type === 'bar' || widgetForm.type === 'line' || widgetForm.type === 'area') && (
                                        <>
                                            <FormControl fullWidth>
                                                <InputLabel>X-Axis</InputLabel>
                                                <Select
                                                    value={widgetForm.dataConfig?.visualization?.xAxis || ''}
                                                    onChange={(e) => {
                                                        setWidgetForm({
                                                            ...widgetForm,
                                                            dataConfig: {
                                                                ...widgetForm.dataConfig,
                                                                visualization: {
                                                                    ...widgetForm.dataConfig?.visualization,
                                                                    type: widgetForm.type,
                                                                    xAxis: e.target.value,
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    label="X-Axis"
                                                >
                                                    <MenuItem value="">None</MenuItem>
                                                    {(widgetForm.dataConfig?.query?.dimensions || []).map((dim: any) => (
                                                        <MenuItem key={dim} value={dim}>{dim}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <FormControl fullWidth>
                                                <InputLabel>Y-Axis</InputLabel>
                                                <Select
                                                    multiple
                                                    value={widgetForm.dataConfig?.visualization?.yAxis || []}
                                                    onChange={(e) => {
                                                        const yAxis = e.target.value as string[];
                                                        setWidgetForm({
                                                            ...widgetForm,
                                                            dataConfig: {
                                                                ...widgetForm.dataConfig,
                                                                visualization: {
                                                                    ...widgetForm.dataConfig?.visualization,
                                                                    type: widgetForm.type,
                                                                    xAxis: widgetForm.dataConfig?.visualization?.xAxis || '',
                                                                    yAxis,
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    label="Y-Axis"
                                                    renderValue={(selected) => (
                                                        <Box className="flex flex-wrap gap-1">
                                                            {(selected as string[]).map((value) => (
                                                                <Chip key={value} label={value} size="small" color="primary" />
                                                            ))}
                                                        </Box>
                                                    )}
                                                >
                                                    {(widgetForm.dataConfig?.query?.metrics || []).map((metric: any) => (
                                                        <MenuItem key={metric} value={metric}>
                                                            <Checkbox checked={(widgetForm.dataConfig?.visualization?.yAxis || []).indexOf(metric) > -1} />
                                                            {metric}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </>
                                    )}

                                    {widgetForm.type === 'table' && (
                                        <Box className="col-span-2">
                                            <FormHelperText>Table will display all selected dimensions and metrics</FormHelperText>
                                        </Box>
                                    )}
                                </Box>
                            </div>
                        </>
                    )}

                    {/* Data Config Preview */}
                    {(dataSourceType === "bi" &&
                        widgetForm.dataConfig?.query?.dimensions?.length > 0 &&
                        widgetForm.dataConfig?.query?.metrics?.length > 0) && (
                            <div className="col-span-2">
                                <Typography variant="caption" className="text-gray-500">
                                    Generated Data Config Preview:
                                </Typography>
                                <Paper variant="outlined" className="p-3 mt-1 bg-gray-50">
                                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-32 overflow-auto">
                                        {JSON.stringify({
                                            query: widgetForm.dataConfig?.query || { dimensions: [], metrics: [] },
                                            visualization: widgetForm.dataConfig?.visualization || { type: widgetForm.type }
                                        }, null, 2)}
                                    </pre>
                                </Paper>
                            </div>
                        )}

                    <TextField
                        label="Advanced: Full Data Config (JSON)"
                        multiline
                        minRows={2}
                        value={widgetFormJsonString}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setWidgetFormJsonString(newValue);
                            try {
                                const parsed = JSON.parse(newValue);
                                setWidgetForm({ ...widgetForm, dataConfig: parsed });
                            } catch {
                                // Invalid JSON - don't update
                            }
                        }}
                        fullWidth
                        className="col-span-2"
                        helperText={
                            <Box className="flex flex-col gap-1">
                                <Typography variant="caption" className="text-gray-600">
                                    For advanced users. Leave empty to auto-generate from selections above.
                                </Typography>
                                {(() => {
                                    try {
                                        JSON.parse(widgetFormJsonString);
                                        return <Typography variant="caption" className="text-green-600">✅ Valid JSON</Typography>;
                                    } catch {
                                        return widgetFormJsonString ? <Typography variant="caption" className="text-red-600">⚠️ Invalid JSON</Typography> : null;
                                    }
                                })()}
                            </Box>
                        }
                        error={(() => {
                            try {
                                JSON.parse(widgetFormJsonString);
                                return false;
                            } catch {
                                return widgetFormJsonString.length > 0;
                            }
                        })()}
                    />

                    <Box className="col-span-2 flex gap-6">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={widgetForm.locked || false}
                                    onChange={(e) => setWidgetForm({ ...widgetForm, locked: e.target.checked })}
                                />
                            }
                            label="Locked (prevents repositioning)"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={widgetForm.active !== undefined ? widgetForm.active : true}
                                    onChange={(e) => setWidgetForm({ ...widgetForm, active: e.target.checked })}
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions className="border-t border-gray-200 p-4">
                <Button
                    variant="outlined"
                    className="!text-gray-800 !border-gray-200"
                    onClick={() => {
                        setWidgetFormOpen(false);
                        setSelectedDataSourceId("");
                        setDataSourceType("bi");
                        setDatasetSchema(null);
                        resetWidgetIdFields();
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    className="!bg-primary"
                    onClick={editingWidgetId ? handleUpdateWidget : handleAddWidget}
                    disabled={
                        !widgetIdPrefix ||
                        !widgetIdName ||
                        !widgetForm.title?.trim() ||
                        !selectedDataSourceId ||
                        (dataSourceType === "bi" &&
                            (!widgetForm.dataConfig?.query?.dimensions?.length ||
                                !widgetForm.dataConfig?.query?.metrics?.length)) ||
                        (!editingWidgetId && availableWidgetIds.includes(`${widgetIdPrefix}.${widgetIdName}`))
                    }
                >
                    {editingWidgetId ? "Update Widget" : "Add Widget"}
                </Button>
            </DialogActions>
        </Dialog>
    );

    // ===== Filter Form Dialog =====
    const renderFilterFormDialog = () => (
        <Dialog open={filterFormOpen} onClose={() => setFilterFormOpen(false)} maxWidth="sm" fullWidth>
            <div className="!p-2 border-b border-gray-200">
                <Box className="flex justify-between items-center">
                    <Typography variant="h6" className="text-gray-800 !ml-4">
                        {editingFilterId ? "Edit Filter" : "Add Filter"}
                    </Typography>
                    <IconButton onClick={() => setFilterFormOpen(false)}>
                        <CloseOutlined className="text-gray-800" />
                    </IconButton>
                </Box>
            </div>
            <DialogContent className="pt-4">
                <Box className="grid grid-cols-1 gap-y-5">
                    <TextField
                        label="Filter ID"
                        value={filterForm.filterId || ""}
                        onChange={(e) => setFilterForm({ ...filterForm, filterId: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., date-range"
                    />
                    <TextField
                        label="Label"
                        value={filterForm.label || ""}
                        onChange={(e) => setFilterForm({ ...filterForm, label: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., Date Range"
                    />
                    <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={filterForm.type || "month"}
                            onChange={(e) => setFilterForm({ ...filterForm, type: e.target.value })}
                            label="Type"
                        >
                            {builderMeta?.filterTypes?.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.value}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Lookup Source"
                        value={filterForm.lookupSource || ""}
                        onChange={(e) => setFilterForm({ ...filterForm, lookupSource: e.target.value })}
                        fullWidth
                        placeholder="e.g., dataset-id or API endpoint"
                        helperText="Required for dropdown and multi-select types"
                    />
                    <TextField
                        label="Default Expression"
                        value={filterForm.defaultExpression || ""}
                        onChange={(e) => setFilterForm({ ...filterForm, defaultExpression: e.target.value })}
                        fullWidth
                        placeholder="e.g., currentMonth() or '2024-01-01'"
                    />
                    <TextField
                        label="Display Order"
                        type="number"
                        value={filterForm.displayOrder || 0}
                        onChange={(e) =>
                            setFilterForm({ ...filterForm, displayOrder: Number(e.target.value) })
                        }
                        fullWidth
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={filterForm.required || false}
                                onChange={(e) => setFilterForm({ ...filterForm, required: e.target.checked })}
                            />
                        }
                        label="Required"
                    />
                </Box>
            </DialogContent>
            <DialogActions className="border-t border-gray-200 p-4">
                <Button
                    variant="outlined"
                    className="!text-gray-800 !border-gray-200"
                    onClick={() => setFilterFormOpen(false)}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    className="!bg-primary"
                    onClick={editingFilterId ? handleUpdateFilter : handleAddFilter}
                >
                    {editingFilterId ? "Update Filter" : "Add Filter"}
                </Button>
            </DialogActions>
        </Dialog>
    );

    // ===== Main Render =====
    return (
        <Box>
            <Box className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderPageManagement()}
                {renderPageDetails()}
            </Box>

            {renderWidgetFormDialog()}
            {renderFilterFormDialog()}
        </Box>
    );
}
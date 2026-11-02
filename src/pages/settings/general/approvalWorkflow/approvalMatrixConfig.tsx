import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  FormControlLabel,
  CircularProgress,
  Skeleton,
  Tooltip,
  IconButton,
  Chip,
  Paper,
  Stack,
  Divider,
  Alert,
  Checkbox,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  RestartAlt as ResetIcon,
  Save as SaveIcon,
  WarningAmber as WarningIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import {
  approvalWorkflowService,
  type ApprovalMatrix,
  type ApprovalMatrixModule,
  type ApprovalEndpoint,
  type ApprovalMatrixAction,
} from "../../../../services/modules/approvalWorkflow";
import { useUI } from "../../../../context/Snackbar";
import { getRowColor } from "../../../const";

export type PermissionField = "create" | "update" | "delete" | "statusChange";

interface MatrixRow {
  moduleId: string;
  moduleName: string;
  tableNames: string;
  active: boolean;
  endpointCount: number;
  create: boolean;
  update: boolean;
  delete: boolean;
  statusChange: boolean;
}

export const PERMISSION_FIELDS: PermissionField[] = [
  "create",
  "update",
  "delete",
  "statusChange",
];

export const PERMISSION_LABELS: Record<PermissionField, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  statusChange: "Status change",
};

// const ACTION_TO_FIELD: Record<ApprovalMatrixAction, PermissionField> = {
//   create: "create",
//   update: "update",
//   delete: "delete",
//   status_change: "statusChange",
// };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = response.data;
      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
};

const toRow = (m: ApprovalMatrixModule): MatrixRow => ({
  moduleId: m.id,
  moduleName: m.moduleName,
  tableNames: m.tableNames,
  active: m.active,
  endpointCount: m.endpointCount,
  create: m.create,
  update: m.update,
  delete: m.delete,
  statusChange: m.statusChange,
});

const serializeRows = (rows: MatrixRow[]) =>
  JSON.stringify(
    rows.map((r) => ({
      moduleId: r.moduleId,
      create: r.create,
      update: r.update,
      delete: r.delete,
      statusChange: r.statusChange,
    }))
  );

export default function ApprovalMatrixConfig() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const initRanRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [requireApprovals, setRequireApprovals] = useState(true);
  const [baselineRequireApprovals, setBaselineRequireApprovals] = useState(true);

  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [baselineRows, setBaselineRows] = useState<MatrixRow[]>([]);

  // ---- Endpoint drill-down ----
  const [endpointModule, setEndpointModule] = useState<MatrixRow | null>(null);
  const [endpoints, setEndpoints] = useState<ApprovalEndpoint[]>([]);
  const [endpointsLoading, setEndpointsLoading] = useState(false);
  const [endpointError, setEndpointError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<"" | ApprovalMatrixAction>("");
  const [methodFilter, setMethodFilter] = useState<
    "" | "POST" | "PUT" | "PATCH" | "DELETE"
  >("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ---------- Derived ----------
  const isDirty = useMemo(
    () =>
      requireApprovals !== baselineRequireApprovals ||
      serializeRows(rows) !== serializeRows(baselineRows),
    [requireApprovals, baselineRequireApprovals, rows, baselineRows]
  );

  const activeCount = useMemo(
    () =>
      rows.reduce(
        (total, r) =>
          total + PERMISSION_FIELDS.reduce((n, f) => n + (r[f] ? 1 : 0), 0),
        0
      ),
    [rows]
  );

  // ---------- Load ----------
  const loadMatrix = async (opts?: { silent?: boolean }) => {
    setLoadError(null);
    setLoading(true);
    if (!opts?.silent) showSpinner();
    try {
      const res = await approvalWorkflowService.getApprovalMatrix();
      const data: ApprovalMatrix | undefined = res.data;
      const nextRows: MatrixRow[] = (data?.modules ?? []).map(toRow);
      const nextRequire = data?.requireApprovals ?? true;

      setRows(nextRows);
      setBaselineRows(nextRows.map((r) => ({ ...r })));
      setRequireApprovals(nextRequire);
      setBaselineRequireApprovals(nextRequire);
    } catch (error) {
      setLoadError(
        getErrorMessage(error, "Failed to load approval matrix. Please retry.")
      );
      showSnackbar(
        getErrorMessage(error, "Failed to load approval matrix."),
        "error"
      );
    } finally {
      if (!opts?.silent) hideSpinner();
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;
    void loadMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Mutations (local) ----------
  const handleToggle = (index: number, field: PermissionField) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: !next[index][field] };
      return next;
    });
  };

  const setColumn = (field: PermissionField, value: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, [field]: value })));
  };

  const setAllPermissions = (value: boolean) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        create: value,
        update: value,
        delete: value,
        statusChange: value,
      }))
    );
  };

  const handleReset = () => {
    if (!isDirty) return;
    showConfirmDialog({
      title: "Discard changes?",
      message:
        "This will revert all pending toggles back to the last saved matrix.",
      confirmText: "Discard",
      cancelText: "Keep editing",
      onConfirm: async () => {
        setRows(baselineRows.map((r) => ({ ...r })));
        setRequireApprovals(baselineRequireApprovals);
      },
    });
  };

  // ---------- Save ----------
  const handleSave = async () => {
    setSaving(true);
    try {
      const baselineById = new Map(
        baselineRows.map((r) => [r.moduleId, r] as const)
      );

      const modulesPayload = rows
        .filter((r) => {
          const b = baselineById.get(r.moduleId);
          if (!b) return true;
          return (
            b.create !== r.create ||
            b.update !== r.update ||
            b.delete !== r.delete ||
            b.statusChange !== r.statusChange
          );
        })
        .map((r) => ({
          id: r.moduleId,
          create: r.create,
          update: r.update,
          delete: r.delete,
          statusChange: r.statusChange,
        }));

      await approvalWorkflowService.saveApprovalMatrix({
        requireApprovals,
        modules: modulesPayload,
      });

      setBaselineRows(rows.map((r) => ({ ...r })));
      setBaselineRequireApprovals(requireApprovals);

      showSnackbar("Approval matrix saved successfully.", "success");

      void loadMatrix({ silent: true });
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to save matrix."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (requireApprovals) {
      void handleSave();
      return;
    }
    showConfirmDialog({
      title: "Save with approvals disabled?",
      message:
        "You're about to save with approvals turned OFF. Configured rules will be preserved but no new changes will be held for approval. Continue?",
      confirmText: "Save anyway",
      cancelText: "Go back",
      onConfirm: () => handleSave(),
    });
  };

  // ---------- Endpoint drill-down ----------
  const openEndpoints = (row: MatrixRow) => {
    if (!row.endpointCount) return;
    setEndpointModule(row);
    setEndpoints([]);
    setEndpointError(null);
    setActionFilter("");
    setMethodFilter("");
    setPage(0);
    // void loadEndpoints(row.moduleId, "", "");
  };

  const loadEndpoints = async (
    moduleId: string,
    action: "" | ApprovalMatrixAction,
    method: "" | "POST" | "PUT" | "PATCH" | "DELETE"
  ) => {
    setEndpointsLoading(true);
    setEndpointError(null);
    try {
      const res = await approvalWorkflowService.getModuleEndpoints(moduleId, {
        action: action || undefined,
        method: method || undefined,
      });
      setEndpoints(res.data ?? []);
    } catch (error) {
      setEndpointError(
        getErrorMessage(error, "Failed to load endpoints for this module.")
      );
      setEndpoints([]);
    } finally {
      setEndpointsLoading(false);
    }
  };

  // Reload when a filter changes (while drawer is open)
  useEffect(() => {
    if (!endpointModule?.moduleId) return;
    setPage(0);
    void loadEndpoints(endpointModule.moduleId, actionFilter, methodFilter);
  }, [actionFilter, methodFilter, endpointModule?.moduleId]);

  const filteredEndpoints = endpoints;
  const pagedEndpoints = useMemo(
    () =>
      filteredEndpoints.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [filteredEndpoints, page, rowsPerPage]
  );

  // ---------- Render ----------
  return (
    <Box className="space-y-2">
      {/* ============ MASTER TOGGLE ============ */}
      <div className="border border-gray-200 rounded-md bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div>
            <Typography variant="subtitle2" className="!font-bold !text-gray-800">
              Require approvals
            </Typography>
            <Typography variant="caption" className="!text-gray-600">
              When off, configured rules are preserved but new changes are not
              held for approval.
            </Typography>
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={requireApprovals}
                onChange={(e) => setRequireApprovals(e.target.checked)}
                color="primary"
                disabled={loading}
              />
            }
            label={
              <Chip
                size="small"
                variant="outlined"
                color={requireApprovals ? "success" : "default"}
                label={requireApprovals ? "Enabled" : "Disabled"}
                className="!font-medium"
              />
            }
            labelPlacement="start"
          />
        </div>
      </div>

      {/* ============ LOAD ERROR ============ */}
      {loadError && !loading && (
        <Alert
          severity="error"
          variant="outlined"
          action={
            <Button color="inherit" size="small" onClick={() => void loadMatrix()}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {/* ============ MATRIX TABLE ============ */}
      <Paper
        elevation={0}
        className="!bg-white border border-gray-200"
        sx={{ borderRadius: 1, overflow: "hidden" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-gray-200">
          <Box className="flex items-center gap-2">
            <Typography variant="subtitle2" className="!font-bold !text-gray-800">
              Module Permissions
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              className="!text-primary !border-primary"
              label={`${rows.length} modules`}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`${activeCount} active rules`}
              color={requireApprovals ? "primary" : "warning"}
            />
          </Box>

          <Box className="flex items-center gap-1.5">
            <Button
              size="small"
              variant="outlined"
              onClick={() => setAllPermissions(true)}
              disabled={loading || rows.length === 0}
            >
              Select all
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => setAllPermissions(false)}
              disabled={loading || rows.length === 0}
            >
              Clear all
            </Button>
            <Tooltip title="Reload from server">
              <span>
                <IconButton
                  size="small"
                  onClick={() => void loadMatrix()}
                  disabled={loading || saving}
                >
                  <RefreshIcon className="!w-4 !text-gray-800" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </div>

        <TableContainer className="max-h-[calc(100vh-380px)] overflow-auto">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold" width="34%">
                  Module
                </TableCell>
                <TableCell className="!font-bold" width="10%" align="center">
                  Endpoints
                </TableCell>
                {PERMISSION_FIELDS.map((field) => (
                  <TableCell key={field} align="center" className="!font-bold">
                    <Tooltip title={`Toggle "${PERMISSION_LABELS[field]}" for all modules`}>
                      <span className="inline-flex items-center gap-1 cursor-pointer">
                        <Checkbox
                          size="small"
                          checked={rows.length > 0 && rows.every((r) => r[field])}
                          indeterminate={
                            rows.length > 0 &&
                            !rows.every((r) => r[field]) &&
                            rows.some((r) => r[field])
                          }
                          disabled={loading || rows.length === 0}
                          className="text-gray-800"
                          onChange={(e) => setColumn(field, e.target.checked)}
                          sx={{ p: 0.5 }}
                        />
                        <span>{PERMISSION_LABELS[field]}</span>
                      </span>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell>
                      <Skeleton variant="text" width="60%" height={28} />
                    </TableCell>
                    <TableCell align="center">
                      <Skeleton variant="rounded" width={40} height={20} sx={{ mx: "auto" }} />
                    </TableCell>
                    {PERMISSION_FIELDS.map((f) => (
                      <TableCell key={f} align="center">
                        <Skeleton variant="circular" width={20} height={20} sx={{ mx: "auto" }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                rows.map((row, index) => {
                  const noTables = !row.tableNames?.trim();
                  return (
                    <TableRow key={row.moduleId} sx={getRowColor(index)}>
                      <TableCell>
                        <Box className="flex flex-col">
                          <span className="!text-gray-800 !font-medium">
                            {row.moduleName}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {row.tableNames || "no tables configured"}
                          </span>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip
                          title={
                            row.endpointCount
                              ? "View discovered endpoints"
                              : "No endpoints discovered for this module"
                          }
                        >
                          <span>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={row.endpointCount}
                              className="!text-primary !border-primary"
                              onClick={() => openEndpoints(row)}
                              sx={{
                                cursor: row.endpointCount ? "pointer" : "default",
                                minWidth: 34,
                              }}
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                      {PERMISSION_FIELDS.map((field) => (
                        <TableCell key={field} align="center">
                          <Tooltip
                            title={
                              !requireApprovals
                                ? "Approvals are disabled — toggle is preserved"
                                : noTables
                                  ? "This module needs table names before toggles can be enabled"
                                  : ""
                            }
                          >
                            <span>
                              <Switch
                                size="small"
                                checked={row[field]}
                                onChange={() => handleToggle(index, field)}
                                color="primary"
                                disabled={!requireApprovals || noTables}
                              />
                            </span>
                          </Tooltip>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}

              {!loading && !loadError && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2 + PERMISSION_FIELDS.length} align="center">
                    <div className="py-10 text-[12px] text-gray-500">
                      No modules found. Please add modules in the "Modules" tab
                      first.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ============ STICKY ACTION BAR ============ */}
      <Paper
        elevation={3}
        className="!bg-white"
        sx={{
          position: "sticky",
          bottom: 8,
          p: 1.25,
          px: 2,
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box className="flex items-center gap-2">
          {isDirty ? (
            <Chip
              size="small"
              icon={<WarningIcon className="!w-4" />}
              label="Unsaved changes"
              color="warning"
              variant="outlined"
            />
          ) : (
            <Chip
              size="small"
              icon={<CheckCircleIcon className="!w-4" />}
              label="All changes saved"
              color="success"
              variant="outlined"
            />
          )}
          <Divider orientation="vertical" flexItem />
          <Typography variant="caption" className="!text-gray-500">
            {requireApprovals
              ? "Approvals are enabled for the toggled modules."
              : "Approvals are currently disabled."}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            disabled={!isDirty || saving}
          >
            Reset
          </Button>
          <Button
            size="small"
            variant="contained"
            disableElevation
            className="!bg-primary !px-6"
            sx={{ textTransform: "none" }}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveClick}
            disabled={saving || loading || !isDirty}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Paper>

      {/* ============ ENDPOINTS DRAWER ============ */}
      <Drawer
        anchor="right"
        open={!!endpointModule}
        onClose={() => setEndpointModule(null)}
      // PaperProps={{ sx: { width: { xs: "100%", sm: 720 } } }}
      >
        <div className="flex h-full flex-col">
          {/* Drawer header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
            <div>
              <Typography variant="h6" className="!font-bold !text-gray-800">
                {endpointModule?.moduleName} — Endpoints
              </Typography>
              <Typography variant="caption" className="!text-gray-500">
                {endpointModule?.tableNames
                  ? `Reached tables: ${endpointModule.tableNames}`
                  : "No tables configured"}
              </Typography>
            </div>
            <IconButton onClick={() => setEndpointModule(null)}>
              <CloseIcon />
            </IconButton>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-2">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select
                label="Action"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="create">create</MenuItem>
                <MenuItem value="update">update</MenuItem>
                <MenuItem value="delete">delete</MenuItem>
                <MenuItem value="status_change">status_change</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Method</InputLabel>
              <Select
                label="Method"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>

            <Box className="ml-auto">
              <Tooltip title="Refresh endpoints">
                <IconButton
                  size="small"
                  onClick={() =>
                    endpointModule &&
                    loadEndpoints(endpointModule.moduleId, actionFilter, methodFilter)
                  }
                  disabled={endpointsLoading}
                >
                  <RefreshIcon className="!w-4 !text-gray-800" />
                </IconButton>
              </Tooltip>
            </Box>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto">
            {endpointsLoading ? (
              <div className="flex justify-center py-16">
                <CircularProgress size={28} />
              </div>
            ) : endpointError ? (
              <Alert severity="error" variant="outlined" className="m-4">
                {endpointError}
              </Alert>
            ) : pagedEndpoints.length === 0 ? (
              <div className="py-16 text-center text-[12px] text-gray-500">
                No endpoints match the current filters.
              </div>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow className="!bg-gray-50">
                    <TableCell className="!font-bold" width="80">Method</TableCell>
                    <TableCell className="!font-bold">Path</TableCell>
                    <TableCell className="!font-bold" width="110">Action</TableCell>
                    <TableCell className="!font-bold" width="90" align="center">Governed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedEndpoints.map((ep, i) => (
                    <TableRow key={`${ep.method}-${ep.path}-${i}`}>
                      <TableCell>
                        <Chip
                          size="small"
                          label={ep.method}
                          color={
                            ep.method === "DELETE"
                              ? "error"
                              : ep.method === "POST"
                                ? "success"
                                : ep.method === "PUT"
                                  ? "info"
                                  : "default"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box className="flex flex-col">
                          <code className="text-xs text-gray-800">{ep.path}</code>
                          <span className="text-[10px] text-gray-500">
                            {ep.controller}.{ep.handler}
                          </span>
                          {ep.tables?.length > 0 && (
                            <span className="text-[10px] text-gray-500">
                              tables: {ep.tables.join(", ")}
                            </span>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={ep.action}
                          className="!text-gray-700"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {ep.governed ? (
                          <CheckCircleIcon fontSize="small" className="!text-green-600" />
                        ) : (
                          <UncheckedIcon fontSize="small" className="!text-gray-400" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pager */}
          {!endpointsLoading && filteredEndpoints.length > 0 && (
            <TablePagination
              component="div"
              count={filteredEndpoints.length}
              page={page}
              onPageChange={(_e, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          )}
        </div>
      </Drawer>
    </Box>
  );
}
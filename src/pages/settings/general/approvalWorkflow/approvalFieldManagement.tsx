import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CloseOutlined,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  approvalWorkflowService,
  type ApprovalField,
  type ApprovalModule,
  type ApprovalOperator,
} from "../../../../services/modules/approvalWorkflow";
import { useUI } from "../../../../context/Snackbar";
import { getRowColor } from "../../../const";

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

const DATA_TYPES = ["string", "number", "boolean", "date", "datetime"];

type DbColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
};

const prettify = (col: string) =>
  col
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

interface FormState {
  id?: string;
  moduleId: string;
  parentRelation: string;
  nestedPath: string;
  dbVariableName: string;
  uiLabel: string;
  dataType: string;
  allowedOperatorIds: string[];
  active: boolean;
}

const EMPTY_FORM: FormState = {
  moduleId: "",
  parentRelation: "",
  nestedPath: "",
  dbVariableName: "",
  uiLabel: "",
  dataType: "string",
  allowedOperatorIds: [],
  active: true,
};

export default function ApprovalFieldManagement() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  // const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ApprovalModule[]>([]);
  const [operators, setOperators] = useState<ApprovalOperator[]>([]);
  const [fields, setFields] = useState<ApprovalField[]>([]);
  const [filterModuleId, setFilterModuleId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [dbColumns, setDbColumns] = useState<DbColumn[]>([]);
  const [dbColumnsLoading, setDbColumnsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [modRes, opRes] = await Promise.all([
          approvalWorkflowService.getModules({ size: 100 }),
          approvalWorkflowService.getOperators({ activeOnly: true }),
        ]);
        setModules(modRes.data.content);
        setOperators(opRes.data);
      } catch (error) {
        showSnackbar(getErrorMessage(error, "Failed to load reference data."), "error");
      }
    };
    void init();
  }, [showSnackbar]);

  const loadFields = async () => {
    showSpinner();
    try {
      const res = await approvalWorkflowService.getFields({
        moduleId: filterModuleId || undefined,
      });
      setFields(res.data);
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to load fields."), "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    void loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModuleId]);

  // ---- Load DB columns for the dialog's selected module ----
  useEffect(() => {
    if (!dialogOpen || !form.moduleId) {
      setDbColumns([]);
      return;
    }
    let cancelled = false;
    setDbColumnsLoading(true);
    approvalWorkflowService
      .getDbFieldsByModule(form.moduleId)
      .then((res) => {
        if (cancelled) return;
        const raw: any[] = res.data ?? [];
        const normalized: DbColumn[] = raw
          .filter(
            (c) =>
              c &&
              typeof c.tableName === "string" &&
              typeof c.columnName === "string" &&
              typeof c.dataType === "string"
          )
          .map((c) => ({
            tableName: c.tableName,
            columnName: c.columnName,
            dataType: c.dataType,
          }));
        setDbColumns(normalized);
      })
      .catch((error) => {
        if (cancelled) return;
        setDbColumns([]);
        showSnackbar(
          getErrorMessage(error, "Failed to load DB columns."),
          "error"
        );
      })
      .finally(() => {
        if (!cancelled) setDbColumnsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, form.moduleId, showSnackbar]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, moduleId: filterModuleId || "" });
    setDialogOpen(true);
  };

  const openEdit = (f: ApprovalField) => {
    setForm({
      id: f.id,
      moduleId: f.moduleId,
      parentRelation: f.parentRelation,
      nestedPath: f.nestedPath,
      dbVariableName: f.dbVariableName,
      uiLabel: f.uiLabel,
      dataType: f.dataType,
      allowedOperatorIds: f.allowedOperatorIds || [],
      active: f.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.moduleId || !form.dbVariableName.trim() || !form.uiLabel.trim()) {
      showSnackbar("Module, DB variable, and UI label are required.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        moduleId: form.moduleId,
        parentRelation: form.parentRelation,
        nestedPath: form.nestedPath,
        dbVariableName: form.dbVariableName,
        uiLabel: form.uiLabel,
        dataType: form.dataType,
        allowedOperatorIds: form.allowedOperatorIds,
        active: form.active,
      };
      if (form.id) {
        await approvalWorkflowService.updateField(form.id, payload);
        showSnackbar("Field updated.", "success");
      } else {
        await approvalWorkflowService.createField(payload);
        showSnackbar("Field created.", "success");
      }
      setDialogOpen(false);
      await loadFields();
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to save field."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: ApprovalField) => {
    showConfirmDialog({
      title: "Delete Field",
      message: `Delete field "${f.uiLabel}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await approvalWorkflowService.deleteField(f.id);
          showSnackbar("Field deleted.", "success");
          await loadFields();
        } catch (error) {
          showSnackbar(getErrorMessage(error, "Failed to delete field."), "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const moduleNameById = useMemo(() => {
    const map: Record<string, string> = {};
    modules.forEach((m) => { map[m.id] = m.moduleName; });
    return map;
  }, [modules]);

  return (
    <Box className="space-y-4">
      <div className="flex bg-white border border-gray-200 items-center justify-between gap-4 rounded-md p-2">
        <Box className="flex items-center gap-3">
          <Typography variant="h6" className="!font-bold">Field Dictionary</Typography>
          <Chip label={`${fields.length} total`} size="small" className="!border-primary !text-primary" variant="outlined" />
        </Box>
        <Box className="flex items-center gap-2">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Module</InputLabel>
            <Select
              value={filterModuleId}
              label="Filter by Module"
              onChange={(e) => setFilterModuleId(e.target.value)}
            >
              <MenuItem value="">All Modules</MenuItem>
              {modules.map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.moduleName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" className="whitespace-nowrap !px-6 !bg-primary" startIcon={<AddIcon />} onClick={openCreate}>
            New Field
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={loadFields}>
              <RefreshIcon className="!w-4 text-gray-800" />
            </IconButton>
          </Tooltip>
        </Box>
      </div>

      <div className="">
        <TableContainer className="border border-gray-200 max-h-[calc(100vh-320px)] overflow-auto">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold" width="50px">#</TableCell>
                <TableCell className="!font-bold">Module</TableCell>
                <TableCell className="!font-bold">UI Label</TableCell>
                <TableCell className="!font-bold">DB Variable</TableCell>
                <TableCell className="!font-bold">Data Type</TableCell>
                <TableCell className="!font-bold">Parent / Path</TableCell>
                <TableCell className="!font-bold">Allowed Operators</TableCell>
                <TableCell width="100px" className="!font-bold">Status</TableCell>
                <TableCell width="120px" align="right" className="!font-bold">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((f, idx) => (
                <TableRow key={f.id} sx={getRowColor(idx)}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{f.moduleName || moduleNameById[f.moduleId] || "—"}</TableCell>
                  <TableCell className="!font-medium">{f.uiLabel}</TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-1 text-xs">{f.dbVariableName}</code>
                  </TableCell>
                  <TableCell>
                    <Chip label={f.dataType} size="small" variant="outlined" className="!text-gray-800" />
                  </TableCell>
                  <TableCell>
                    {f.parentRelation ? (
                      <span className="text-xs text-gray-600">
                        {f.parentRelation}
                        {f.nestedPath ? `.${f.nestedPath}` : ""}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Box className="flex flex-wrap gap-1">
                      {(f.allowedOperatorIds || []).slice(0, 3).map((opId) => {
                        const op = operators.find((o) => o.id === opId);
                        return op ? (
                          <Chip key={opId} label={op.symbol} size="small" className="!text-primary !border-primary" variant="outlined" />
                        ) : null;
                      })}
                      {(f.allowedOperatorIds || []).length > 3 && (
                        <Chip
                          label={`+${f.allowedOperatorIds.length - 3}`}
                          size="small"
                          variant="outlined"
                          className="!text-gray-800"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={f.active ? "Active" : "Inactive"}
                      size="small"
                      color={f.active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(f)}>
                      <EditIcon fontSize="small" className="!w-4 text-blue-500" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(f)}>
                      <DeleteIcon fontSize="small" className="!w-4" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                     <div className="py-6 text-gray-500"> No fields configured{filterModuleId ? " for this module" : ""}.</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="flex items-center justify-between !p-2 border-b border-gray-200">
          <div className="!ml-4">{form.id ? "Edit Field" : "New Field"}</div>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseOutlined className="!w-4 !text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-5">
          <Box className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormControl fullWidth required>
              <InputLabel>Module</InputLabel>
              <Select
                value={form.moduleId}
                label="Module"
                onChange={(e) =>
                  setForm({
                    ...form,
                    moduleId: e.target.value,
                    // Clear DB variable when the module changes (its columns change)
                    dbVariableName: "",
                  })
                }
              >
                {modules.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.moduleName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="UI Label"
              required
              fullWidth
              value={form.uiLabel}
              onChange={(e) => setForm({ ...form, uiLabel: e.target.value })}
            />

            <Box className="md:col-span-2">
              <Autocomplete<DbColumn, false, false, true>
                freeSolo
                fullWidth
                options={dbColumns}
                loading={dbColumnsLoading}
                disabled={!form.moduleId}
                getOptionLabel={(opt) =>
                  typeof opt === "string" ? opt : `${opt.tableName}.${opt.columnName}`
                }
                isOptionEqualToValue={(opt, val) =>
                  typeof opt !== "string" &&
                  typeof val !== "string" &&
                  opt.tableName === val.tableName &&
                  opt.columnName === val.columnName
                }
                value={form.dbVariableName}
                onChange={(_e, newVal) => {
                  if (typeof newVal === "string") {
                    setForm({ ...form, dbVariableName: newVal });
                  } else if (newVal) {
                    setForm((prev) => ({
                      ...prev,
                      dbVariableName: newVal.columnName,
                      dataType: prev.dataType || newVal.dataType,
                      uiLabel: prev.uiLabel || prettify(newVal.columnName),
                    }));
                  } else {
                    setForm({ ...form, dbVariableName: "" });
                  }
                }}
                onInputChange={(_e, newInput, reason) => {
                  if (reason === "input") {
                    setForm((prev) => ({ ...prev, dbVariableName: newInput }));
                  }
                }}
                renderOption={(props, opt) => (
                  <li {...props} key={`${opt.tableName}.${opt.columnName}`}>
                    <Box className="flex w-full flex-col">
                      <span className="text-xs font-medium">{opt.columnName}</span>
                      <span className="text-[10px] text-gray-500">
                        {opt.tableName}.{opt.columnName} · {opt.dataType}
                      </span>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="DB Variable Name"
                    required
                    placeholder={
                      form.moduleId ? "Pick a column or type..." : "Select a module first"
                    }
                    helperText={
                      form.moduleId
                        ? dbColumns.length === 0 && !dbColumnsLoading
                          ? "No DB columns found — this module has no table_names configured."
                          : "Pick a column from the selected module's tables, or type a custom name."
                        : "Select a module to load its columns."
                    }
                  />
                )}
                noOptionsText={
                  dbColumnsLoading
                    ? "Loading columns..."
                    : form.moduleId
                    ? "No columns — type a custom name"
                    : "Select a module first"
                }
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={form.dataType}
                label="Data Type"
                onChange={(e) => setForm({ ...form, dataType: e.target.value })}
              >
                {DATA_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Parent Relation"
              fullWidth
              value={form.parentRelation}
              onChange={(e) => setForm({ ...form, parentRelation: e.target.value })}
            />

            <TextField
              label="Nested Path"
              fullWidth
              value={form.nestedPath}
              onChange={(e) => setForm({ ...form, nestedPath: e.target.value })}
            />

            <Box className="md:col-span-2">
              <FormControl fullWidth>
                <InputLabel>Allowed Operators</InputLabel>
                <Select
                  multiple
                  value={form.allowedOperatorIds}
                  label="Allowed Operators"
                  onChange={(e) =>
                    setForm({ ...form, allowedOperatorIds: e.target.value as string[] })
                  }
                  renderValue={(selected) =>
                    selected
                      .map((id) => operators.find((o) => o.id === id)?.symbol || id)
                      .join(", ")
                  }
                >
                  {operators.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box className="md:col-span-2">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    color="success"
                  />
                }
                label={form.active ? "Active" : "Inactive"}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="border-t border-gray-200">
          <Button onClick={() => setDialogOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200" disabled={saving}>Cancel</Button>
          <Button variant="contained" className="!bg-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
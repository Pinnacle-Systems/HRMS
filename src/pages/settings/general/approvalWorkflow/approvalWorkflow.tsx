import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
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
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Rule as RuleIcon,
  AccountTree as AccountTreeIcon,
  Science as ScienceIcon,
} from "@mui/icons-material";
import {
  approvalWorkflowService,
  type ApprovalConfiguration,
  type ApprovalConfigurationPayload,
  type ApprovalEvaluationResult,
  type ApprovalField,
  type ApprovalModule,
  type ApprovalOperator,
  type ApprovalRule,
  type ApprovalLevel,
  type DbFields,
} from "../../../../services/modules/approvalWorkflow";
import { useUI } from "../../../../context/Snackbar";
import { getRowColor } from "../../../const";
import { employeeService } from "../../../../services/modules/employees";

type ApproverOption = {
  id: string;
  name: string;
  code: string;
};

type DbFieldOption = DbFields & {
  tableName: string;
  columnName: string;
  dataType: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

const prettify = (col: string) =>
  col
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const COMPARABLE_TYPES_BLOCKLIST = new Set(["ARRAY", "USER-DEFINED"]);

const dbFieldKey = (f: DbFieldOption) => `${f.tableName}.${f.columnName}`;

// Reusable section header component
const SectionHeader = ({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <Box className="flex items-start justify-between gap-3 pb-3">
    <Box className="flex items-start gap-3">
      <Box
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
        sx={{
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: "primary.main",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" className="!font-semibold !text-gray-800 !leading-tight">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" className="text-gray-500">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {action}
  </Box>
);

export default function ApprovalWorkflowConfig() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  // Guard so init only runs once even if context fns are unstable
  const initRanRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [modules, setModules] = useState<ApprovalModule[]>([]);
  const [fields, setFields] = useState<ApprovalField[]>([]);
  const [operators, setOperators] = useState<ApprovalOperator[]>([]);
  const [configurations, setConfigurations] = useState<ApprovalConfiguration[]>([]);
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);

  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [workflowName, setWorkflowName] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [priorityWeight, setPriorityWeight] = useState(1);
  const [noRulesRequired, setNoRulesRequired] = useState(false);
  const [active, setActive] = useState(true);
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [levels, setLevels] = useState<ApprovalLevel[]>([]);

  const [evalFieldValues, setEvalFieldValues] = useState<Record<string, string>>({});
  const [evalResult, setEvalResult] = useState<ApprovalEvaluationResult | null>(null);

  const [dbFields, setDbFields] = useState<DbFieldOption[]>([]);

  // Stable reset handler
  const handleResetForm = useCallback(() => {
    setSelectedConfigId("");
    setWorkflowName("");
    setPriorityWeight(1);
    setNoRulesRequired(false);
    setActive(true);
    setRules([]);
    setLevels([]);
    setEvalResult(null);
    setEvalFieldValues({});
  }, []);

  // ---- Initial load (modules, operators, employees) ----
  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    const init = async () => {
      showSpinner();
      try {
        const [modRes, opRes, empRes] = await Promise.all([
          approvalWorkflowService.getModules({ size: 100 }),
          approvalWorkflowService.getOperators({ activeOnly: true }),
          employeeService.getEmployees({ size: 500, includeInactive: true }),
        ]);
        setModules(modRes.data.content);
        setOperators(opRes.data);

        const employeeList: ApproverOption[] = (
          empRes.data?.content ??
          empRes.data ??
          []
        ).map((e: any) => ({
          id: e.id,
          name: e.employeeName ?? e.name ?? e.fullName ?? "",
          code: e.employeeCode ?? e.code ?? "",
        }));
        setApprovers(employeeList);
      } catch (error) {
        showSnackbar(getErrorMessage(error, "Failed to load initial data."), "error");
      } finally {
        hideSpinner();
      }
    };
    void init();
  }, [showSnackbar, showSpinner, hideSpinner]);

  // ---- Load fields when module changes ----
  useEffect(() => {
    if (!moduleId) {
      setFields([]);
      return;
    }
    let cancelled = false;
    approvalWorkflowService
      .getFields({ moduleId })
      .then((res) => {
        if (!cancelled) setFields(res.data);
      })
      .catch((err) => {
        if (!cancelled) showSnackbar(getErrorMessage(err, "Failed to load fields."), "error");
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId, showSnackbar]);

  // ---- Load configurations when module changes ----
  useEffect(() => {
    if (!moduleId) {
      setConfigurations([]);
      setSelectedConfigId("");
      handleResetForm();
      return;
    }
    let cancelled = false;
    approvalWorkflowService
      .getConfigurations({ moduleId })
      .then((res) => {
        if (cancelled) return;
        setConfigurations(res.data.content);
        if (res.data.content.length > 0) {
          setSelectedConfigId((prev) => {
            const stillValid = prev && res.data.content.some((c: ApprovalConfiguration) => c.id === prev);
            return stillValid ? prev : res.data.content[0].id;
          });
        } else {
          handleResetForm();
        }
      })
      .catch((err) => {
        if (!cancelled)
          showSnackbar(getErrorMessage(err, "Failed to load configurations."), "error");
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId, showSnackbar, handleResetForm]);

  // ---- Load configuration details when selection changes ----
  useEffect(() => {
    if (!selectedConfigId) return;
    let cancelled = false;
    approvalWorkflowService
      .getConfigurationById(selectedConfigId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setWorkflowName(data.workflowName);
        setPriorityWeight(data.priorityWeight);
        setNoRulesRequired(data.noRulesRequired);
        setActive(data.active);
        setRules(data.rules || []);
        setLevels(data.levels || []);
        setEvalResult(null);
      })
      .catch((err) => {
        if (!cancelled)
          showSnackbar(getErrorMessage(err, "Failed to load configuration details."), "error");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedConfigId, showSnackbar]);

  // ---- Load DB fields when module changes ----
  useEffect(() => {
    if (!moduleId) {
      setDbFields([]);
      return;
    }
    let cancelled = false;
    approvalWorkflowService
      .getDbFieldsByModule(moduleId)
      .then((res) => {
        if (cancelled) return;
        const raw: any[] = res.data ?? [];
        const normalized: DbFieldOption[] = raw
          .filter(
            (f) =>
              f &&
              typeof f.tableName === "string" &&
              typeof f.columnName === "string" &&
              typeof f.dataType === "string" &&
              !COMPARABLE_TYPES_BLOCKLIST.has(f.dataType.toUpperCase())
          )
          .map((f) => ({
            tableName: f.tableName,
            columnName: f.columnName,
            dataType: f.dataType,
          }));
        setDbFields(normalized);
      })
      .catch((err) => {
        if (!cancelled)
          showSnackbar(getErrorMessage(err, "Failed to load DB fields."), "error");
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId, showSnackbar]);

  const addRule = () => {
    setRules([...rules, { fieldId: "", operatorId: "", valueType: "static", value: "" }]);
  };

  const updateRule = (index: number, field: keyof ApprovalRule, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const addLevel = () => {
    setLevels([
      ...levels,
      {
        levelTitle: `Level ${levels.length + 1} Approval`,
        approvalCondition: "any",
        approvers: [],
      },
    ]);
  };

  const updateLevel = (index: number, field: keyof ApprovalLevel, value: any) => {
    const updated = [...levels];
    updated[index] = { ...updated[index], [field]: value };
    setLevels(updated);
  };

  const removeLevel = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  const handleApproversChange = (index: number, selectedIds: string[]) => {
    const selectedEmployees = selectedIds.map((id) => {
      const emp = approvers.find((e) => e.id === id);
      return {
        employeeId: id,
        employeeCode: emp?.code || "",
        employeeName: emp?.name || "",
      };
    });
    updateLevel(index, "approvers", selectedEmployees);
  };

  const handleSave = async () => {
    if (!moduleId || !workflowName) {
      showSnackbar("Please fill in all required fields.", "warning");
      return;
    }

    const invalidApprover = levels
      .flatMap((l) => l.approvers)
      .find((a) => !UUID_RE.test(a.employeeId));

    if (invalidApprover) {
      showSnackbar(
        `Approver "${invalidApprover.employeeName || invalidApprover.employeeId
        }" has an invalid ID. Please re-select approvers.`,
        "error"
      );
      return;
    }

    const payload: ApprovalConfigurationPayload = {
      workflowName,
      moduleId,
      priorityWeight,
      noRulesRequired,
      active,
      rules: rules.map((r) => ({
        fieldId: r.fieldId,
        operatorId: r.operatorId,
        valueType: r.valueType,
        value: r.value,
      })),
      levels: levels.map((l) => ({
        levelTitle: l.levelTitle,
        approvalCondition: l.approvalCondition,
        approverEmployeeIds: l.approvers.map((a) => a.employeeId),
      })),
    };

    setSaving(true);
    try {
      if (selectedConfigId) {
        await approvalWorkflowService.updateConfiguration(selectedConfigId, payload);
        showSnackbar("Configuration updated successfully.", "success");
      } else {
        const res = await approvalWorkflowService.createConfiguration(payload);
        setSelectedConfigId(res.data.id);
        showSnackbar("Configuration created successfully.", "success");
      }
      const res = await approvalWorkflowService.getConfigurations({ moduleId });
      setConfigurations(res.data.content);
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to save configuration."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    if (!window.confirm("Delete this configuration? This cannot be undone.")) return;
    try {
      await approvalWorkflowService.deleteConfiguration(id);
      showSnackbar("Configuration deleted.", "success");
      const res = await approvalWorkflowService.getConfigurations({ moduleId });
      setConfigurations(res.data.content);
      if (res.data.content.length > 0) {
        setSelectedConfigId(res.data.content[0].id);
      } else {
        handleResetForm();
      }
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to delete configuration."), "error");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await approvalWorkflowService.toggleConfigurationActive(id);
      showSnackbar(
        `Configuration ${res.data.active ? "activated" : "deactivated"}.`,
        "success"
      );
      const listRes = await approvalWorkflowService.getConfigurations({ moduleId });
      setConfigurations(listRes.data.content);
      if (id === selectedConfigId) {
        setActive(res.data.active);
      }
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to toggle status."), "error");
    }
  };

  const handleEvaluate = async () => {
    if (!moduleId) {
      showSnackbar("Select a module first.", "warning");
      return;
    }
    setEvaluating(true);
    try {
      const res = await approvalWorkflowService.evaluateConfiguration({
        moduleName: modules.find((m) => m.id === moduleId)?.moduleName || "",
        fieldValues: evalFieldValues,
      });
      setEvalResult(res.data);
      showSnackbar(
        res.data.approvalRequired
          ? `Approval required via "${res.data.workflowName}".`
          : "No approval required for these values.",
        res.data.approvalRequired ? "success" : "info"
      );
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Evaluation failed."), "error");
      setEvalResult(null);
    } finally {
      setEvaluating(false);
    }
  };

  const selectedModuleName = useMemo(
    () => modules.find((m) => m.id === moduleId)?.moduleName || "",
    [modules, moduleId]
  );

  const isNewConfig = !selectedConfigId;

  const compactInputSx = {
    "& .MuiInputBase-root": {
      fontSize: "0.8rem",
      height: 26,
      borderRadius: 1.5,
    },
    "& .MuiInputBase-input": {
      padding: "6px 10px",
    },
  } as const;

  return (
    <Box className="space-y-2">
      <div className="space-y-2 h-[calc(100vh-257px)] overflow-auto">
        {/* ============ HEADER ============ */}
        <div className="bg-white border border-gray-200 rounded-md p-2">
          <Grid container spacing={2} className="items-center">
            {/* Workflow Name */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Workflow Name"
                required
                fullWidth
                variant="outlined"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="e.g. Purchase Order Approval"
                sx={compactInputSx}
                size="small"
              />
            </Grid>

            {/* Module */}
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth required size="small">
                <InputLabel>Form / Module</InputLabel>
                <Select
                  value={moduleId}
                  label="Form / Module"
                  onChange={(e) => setModuleId(e.target.value)}
                  sx={{ height: 26 }}
                >
                  {modules.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.moduleName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Toggles */}
            <Grid size={{ xs: 12, md: 3 }}>
              <div className="flex items-center justify-start gap-3 h-full">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={noRulesRequired}
                      onChange={(e) => setNoRulesRequired(e.target.checked)}
                      className="text-gray-800"
                    />
                  }
                  label={<Typography variant="body2">No Rules Required</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="body2" className="!font-medium">
                      {active ? "Active" : "Inactive"}
                    </Typography>
                  }
                />
              </div>
            </Grid>
          </Grid>

          {/* Configuration selector row */}
          {moduleId && (
            <>
              <Divider className="!my-1" />
              <div className="flex items-center justify-between gap-3 mt-2">
                {/* Left: config selector */}
                <div className="flex items-center gap-2">
                  <Typography variant="caption" className="!text-gray-500 !font-medium">
                    Configuration
                  </Typography>
                  <FormControl sx={{ minWidth: 280 }} size="small">
                    <Select
                      value={selectedConfigId}
                      onChange={(e) => setSelectedConfigId(e.target.value)}
                      displayEmpty
                      sx={{ height: 28 }}
                      renderValue={(selected) => {
                        if (!selected) return <em>— New Configuration —</em>;
                        const cfg = configurations.find((c) => c.id === selected);
                        return (
                          <div className="flex items-center gap-1">
                            <span>{cfg?.workflowName}</span>
                            {cfg && !cfg.active && (
                              <Chip
                                label="inactive"
                                size="small"
                                color="default"
                                variant="outlined"
                                sx={{ height: 18, fontSize: "0.65rem" }}
                              />
                            )}
                          </div>
                        );
                      }}
                    >
                      <MenuItem value="">
                        <em>— New Configuration —</em>
                      </MenuItem>
                      {configurations.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.workflowName} {c.active ? "" : "(inactive)"}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {/* Right: config action buttons */}
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon className="!w-3"/>}
                    onClick={handleResetForm}
                  >
                    New
                  </Button>
                  {selectedConfigId && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        color={active ? "warning" : "success"}
                        onClick={() => handleToggleActive(selectedConfigId)}
                      >
                        {active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon className="!w-3"/>}
                        onClick={() => handleDeleteConfiguration(selectedConfigId)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ============ BUILDER SECTION ============ */}
        <Grid container spacing={1}>
          {/* Rule Builder */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              className="!bg-white border border-gray-200"
              sx={{
                p: 2,
                height: "100%",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SectionHeader
                icon={<RuleIcon fontSize="small" className="!w-3" />}
                title="Rule Builder"
                subtitle="Conditions that trigger this workflow"
                action={
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    disableElevation
                    onClick={addRule}
                    disabled={noRulesRequired}
                    className="!bg-primary"
                  >
                    Add Rule
                  </Button>
                }
              />

              {noRulesRequired ? (
                <Box
                  className="flex flex-1 min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-gray-200 border-dashed p-6 text-center"
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                  }}
                >
                  <CheckCircleIcon color="primary" sx={{ fontSize: 44, mb: 1.5, opacity: 0.7 }} />
                  <Typography variant="subtitle2" color="primary" className="!font-semibold">
                    No trigger rules required
                  </Typography>
                  <Typography variant="body2" className="!mt-1 max-w-xs text-gray-500">
                    All records submitted for this module will automatically enter the approval workflow.
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  className="rounded-lg border border-gray-200"
                  sx={{ "& .MuiTableCell-root": { py: 0.75, px: 1 } }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell className="!font-semibold" sx={{ width: 48 }}>
                          #
                        </TableCell>
                        <TableCell className="!font-semibold" sx={{ minWidth: 180 }}>
                          Field
                        </TableCell>
                        <TableCell className="!font-semibold" sx={{ minWidth: 100 }}>
                          Operator
                        </TableCell>
                        <TableCell className="!font-semibold" sx={{ minWidth: 130 }}>
                          Value Type
                        </TableCell>
                        <TableCell className="!font-semibold" sx={{ minWidth: 200 }}>
                          Value
                        </TableCell>
                        <TableCell width={40} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rules.map((rule, idx) => (
                        <TableRow key={idx} sx={getRowColor(idx)}>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" className="!font-medium">
                              {idx + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Autocomplete
                              size="small"
                              options={dbFields}
                              getOptionLabel={(opt) => prettify(opt.columnName)}
                              isOptionEqualToValue={(opt, val) =>
                                opt.tableName === val.tableName &&
                                opt.columnName === val.columnName
                              }
                              value={dbFields.find((f) => dbFieldKey(f) === rule.fieldId) || null}
                              onChange={(_e, newVal) =>
                                updateRule(idx, "fieldId", newVal ? dbFieldKey(newVal) : "")
                              }
                              renderOption={(props, opt) => (
                                <li {...props} key={dbFieldKey(opt)}>
                                  <Box className="flex w-full flex-col">
                                    <span className="text-xs font-medium">
                                      {prettify(opt.columnName)}
                                    </span>
                                  </Box>
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="outlined"
                                  placeholder="Search..."
                                  sx={compactInputSx}
                                />
                              )}
                              noOptionsText="No matching fields"
                              sx={{ minWidth: 160 }}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={rule.operatorId}
                                onChange={(e) => updateRule(idx, "operatorId", e.target.value)}
                                displayEmpty
                                sx={{
                                  fontSize: "0.8rem",
                                  height: 26,
                                  borderRadius: 1.5,
                                  "& .MuiSelect-select": { padding: "6px 10px" },
                                }}
                              >
                                <MenuItem value="" disabled>
                                  <Typography variant="body2" color="text.disabled">
                                    Select
                                  </Typography>
                                </MenuItem>
                                {operators.map((o) => (
                                  <MenuItem key={o.id} value={o.id}>
                                    <span className="capitalize">{o.symbol}</span>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={rule.valueType}
                                onChange={(e) => updateRule(idx, "valueType", e.target.value)}
                                sx={{
                                  fontSize: "0.8rem",
                                  height: 26,
                                  borderRadius: 1.5,
                                  "& .MuiSelect-select": { padding: "6px 10px" },
                                }}
                              >
                                <MenuItem value="static">Static</MenuItem>
                                <MenuItem value="field">Compare Field</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            {rule.valueType === "field" ? (
                              <Autocomplete
                                size="small"
                                options={dbFields}
                                getOptionLabel={(opt) =>
                                  `${prettify(opt.columnName)} (${opt.tableName}.${opt.columnName})`
                                }
                                isOptionEqualToValue={(opt, val) =>
                                  opt.tableName === val.tableName &&
                                  opt.columnName === val.columnName
                                }
                                value={dbFields.find((f) => dbFieldKey(f) === rule.value) || null}
                                onChange={(_e, newVal) =>
                                  updateRule(idx, "value", newVal ? dbFieldKey(newVal) : "")
                                }
                                renderOption={(props, opt) => (
                                  <li {...props} key={dbFieldKey(opt)}>
                                    <Box className="flex w-full flex-col">
                                      <span className="text-xs font-medium">
                                        {prettify(opt.columnName)}
                                      </span>
                                      <span className="text-[10px] text-gray-500">
                                        {opt.tableName}.{opt.columnName} · {opt.dataType}
                                      </span>
                                    </Box>
                                  </li>
                                )}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    variant="outlined"
                                    placeholder="Search..."
                                    sx={compactInputSx}
                                  />
                                )}
                                noOptionsText="No matching fields"
                                sx={{ minWidth: 160 }}
                              />
                            ) : (
                              <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Enter value..."
                                value={rule.value}
                                onChange={(e) => updateRule(idx, "value", e.target.value)}
                                sx={compactInputSx}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Remove rule">
                              <IconButton color="error" size="small" onClick={() => removeRule(idx)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {rules.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <div className="py-6 text-[12px] text-gray-500">
                              No rules defined. Add a rule to begin.
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Approval Levels */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              className="!bg-white border border-gray-200"
              sx={{
                p: 2,
                height: "100%",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SectionHeader
                icon={<AccountTreeIcon fontSize="small" className="!w-3" />}
                title="Approval Levels"
                subtitle="Sequential approval stages"
                action={
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    disableElevation
                    className="!bg-primary"
                    onClick={addLevel}
                  >
                    Add Level
                  </Button>
                }
              />
              <TableContainer
                className="rounded-lg border border-gray-200"
                sx={{ "& .MuiTableCell-root": { py: 0.75, px: 1 } }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell className="!font-semibold" sx={{ width: 48 }}>
                        #
                      </TableCell>
                      <TableCell className="!font-semibold" sx={{ minWidth: 180 }}>
                        Level Title
                      </TableCell>
                      <TableCell className="!font-semibold" sx={{ minWidth: 120 }}>
                        Condition
                      </TableCell>
                      <TableCell className="!font-semibold" sx={{ minWidth: 220 }}>
                        Approvers
                      </TableCell>
                      <TableCell width={40} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {levels.map((level, idx) => (
                      <TableRow key={idx} sx={getRowColor(idx)}>
                        <TableCell>
                          <Chip
                            label={idx + 1}
                            size="small"
                            variant="outlined"
                            className="!text-gray-800"
                            sx={{ height: 20, minWidth: 24, fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={level.levelTitle}
                            onChange={(e) => updateLevel(idx, "levelTitle", e.target.value)}
                            sx={compactInputSx}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={level.approvalCondition}
                              onChange={(e) =>
                                updateLevel(idx, "approvalCondition", e.target.value)
                              }
                              sx={{
                                fontSize: "0.8rem",
                                height: 26,
                                borderRadius: 1.5,
                                "& .MuiSelect-select": { padding: "6px 10px" },
                              }}
                            >
                              <MenuItem value="any">OR (Any)</MenuItem>
                              <MenuItem value="all">AND (All)</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              multiple
                              value={level.approvers.map((a) => a.employeeId)}
                              onChange={(e) =>
                                handleApproversChange(idx, e.target.value as string[])
                              }
                              renderValue={(selected) => (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                  {selected.map((id) => {
                                    const emp = approvers.find((a) => a.id === id);
                                    return (
                                      <Chip
                                        key={id}
                                        label={emp?.name || id}
                                        size="small"
                                        sx={{ height: 20, fontSize: "0.7rem" }}
                                        className="!bg-gray-300 !text-gray-800"
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                              displayEmpty
                              sx={{
                                fontSize: "0.8rem",
                                minHeight: 26,
                                borderRadius: 1.5,
                                "& .MuiSelect-select": { padding: "4px 8px" },
                              }}
                            >
                              {approvers.length === 0 ? (
                                <MenuItem value="" disabled>
                                  No employees available
                                </MenuItem>
                              ) : (
                                approvers.map((approver) => (
                                  <MenuItem key={approver.id} value={approver.id} className="!p-0">
                                    <Checkbox
                                      size="small"
                                      className="text-gray-800"
                                      checked={level.approvers.some(
                                        (a) => a.employeeId === approver.id
                                      )}
                                    />
                                    <Typography variant="body2">
                                      {approver.name}
                                      {approver.code ? ` (${approver.code})` : ""}
                                    </Typography>
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Remove level">
                            <IconButton color="error" size="small" onClick={() => removeLevel(idx)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {levels.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <div className="py-6 text-[12px] text-gray-500">
                            No approval levels defined. Add a level to begin.
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* ============ EVALUATION PANEL ============ */}
        <Paper
          elevation={0}
          className="bg-white border border-gray-200"
          sx={{ p: 2, borderRadius: 2 }}
        >
          <SectionHeader
            icon={<ScienceIcon fontSize="small" className="!w-3" />}
            title="Test Configuration"
            subtitle={`Dry-run evaluation${selectedModuleName ? ` for "${selectedModuleName}"` : ""}`}
            action={
              <Button
                variant="contained"
                size="small"
                disableElevation
                startIcon={
                  evaluating ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />
                }
                onClick={handleEvaluate}
                disabled={evaluating || !moduleId}
                className="!bg-primary"
              >
                {evaluating ? "Evaluating..." : "Run Evaluation"}
              </Button>
            }
          />

          {fields.length === 0 ? (
            <Alert severity="info" variant="outlined" sx={{ borderRadius: 1.5 }}>
              Select a module to load its fields.
            </Alert>
          ) : (
            <Grid container spacing={1.5}>
              {fields.map((f) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={f.id}>
                  <TextField
                    label={f.uiLabel}
                    fullWidth
                    variant="outlined"
                    value={evalFieldValues[f.dbVariableName || f.id] ?? ""}
                    onChange={(e) =>
                      setEvalFieldValues((prev) => ({
                        ...prev,
                        [f.dbVariableName || f.id]: e.target.value,
                      }))
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {evalResult && (
            <Alert
              severity={evalResult.approvalRequired ? "success" : "info"}
              variant="filled"
              sx={{ mt: 2, borderRadius: 1.5 }}
              icon={evalResult.approvalRequired ? <CheckCircleIcon /> : undefined}
            >
              <Typography variant="subtitle2" className="!font-semibold">
                {evalResult.approvalRequired
                  ? `Approval Required — matched "${evalResult.workflowName}"`
                  : "No approval required"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                Reason: {evalResult.matchReason}
              </Typography>
              {evalResult.levels?.length > 0 && (
                <div className="flex gap-2 items-center mt-1">
                  <Typography variant="body2" className="!font-medium">
                    Levels:
                  </Typography>
                  {evalResult.levels.map((l, i) => (
                    <Chip
                      key={i}
                      label={l.levelTitle}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.25)",
                        color: "inherit",
                        height: 20,
                        fontSize: "0.7rem",
                      }}
                    />
                  ))}
                </div>
              )}
            </Alert>
          )}
        </Paper>
      </div>

      {/* ============ ACTION BAR (sticky) ============ */}
      <Paper
        elevation={3}
        className="!bg-white"
        sx={{
          position: "sticky",
          bottom: 8,
          p: 1.5,
          px: 2,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" className="!text-gray-800">
          {isNewConfig
            ? "Creating a new configuration"
            : `Editing "${workflowName || "configuration"}"`}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleResetForm}
            disabled={saving}
            size="small"
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            className="!text-primary !border-primary"
            startIcon={<RefreshIcon />}
            size="small"
            onClick={() => {
              if (selectedConfigId) {
                approvalWorkflowService
                  .getConfigurationById(selectedConfigId)
                  .then((res) => {
                    const data = res.data;
                    setWorkflowName(data.workflowName);
                    setPriorityWeight(data.priorityWeight);
                    setNoRulesRequired(data.noRulesRequired);
                    setActive(data.active);
                    setRules(data.rules || []);
                    setLevels(data.levels || []);
                  })
                  .catch((err) =>
                    showSnackbar(getErrorMessage(err, "Failed to reload."), "error")
                  );
              } else {
                handleResetForm();
              }
            }}
            disabled={saving}
          >
            Reload
          </Button>
          <Button
            variant="contained"
            disableElevation
            startIcon={
              saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />
            }
            onClick={handleSave}
            disabled={saving}
            className="!bg-primary"
          >
            {saving ? "Saving..." : isNewConfig ? "Create Configuration" : "Save Changes"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
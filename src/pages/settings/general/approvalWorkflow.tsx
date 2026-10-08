import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  APPROVAL_ACTIONS,
  APPROVAL_MODULES,
  approvalWorkflowService,
  type ApprovalAction,
  type ApprovalCondition,
  type ApprovalLevel,
  type ApprovalModule,
  type ApprovalRequest,
  type ApprovalSettings,
  type ApprovalWorkflow,
} from "../../../services/modules/approvalWorkflow";
import { useUI } from "../../../context/Snackbar";

const APPROVERS = [
  { id: "admin", label: "Administrator" },
  { id: "hr", label: "HR" },
  { id: "manager", label: "Manager" },
  { id: "finance_head", label: "Finance Head" },
  { id: "hr_director", label: "HR Director" },
];

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

const getWorkflowLabel = (workflow: ApprovalWorkflow) => {
  const moduleLabel =
    APPROVAL_MODULES.find(({ id }) => id === workflow.module)?.label ??
    workflow.module;
  const actionLabel =
    APPROVAL_ACTIONS.find(({ id }) => id === workflow.action)?.label ??
    workflow.action;
  return `${moduleLabel} — ${actionLabel}`;
};

const cloneSettings = (settings: ApprovalSettings) =>
  structuredClone(settings);

export default function ApprovalWorkflowConfig() {
  const { showSnackbar, showConfirmDialog } = useUI();
  const [settings, setSettings] = useState<ApprovalSettings | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [tab, setTab] = useState(0);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingOnRequest, setActingOnRequest] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const savedSettings = useRef<ApprovalSettings | null>(null);
  const snackbarRef = useRef(showSnackbar);

  useEffect(() => {
    snackbarRef.current = showSnackbar;
  }, [showSnackbar]);

  useEffect(() => {
    let active = true;
    approvalWorkflowService
      .getSettings()
      .then((response) => {
        if (!active) return;
        setSettings(response);
        savedSettings.current = cloneSettings(response);
        setSelectedWorkflowId(response.workflows[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            getErrorMessage(error, "Failed to load approval workflow settings."),
          );
        }
      })
      .finally(() => {
        if (active) setLoadingSettings(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      setRequests(await approvalWorkflowService.getPendingRequests());
    } catch (error) {
      snackbarRef.current(
        getErrorMessage(error, "Failed to load pending approval requests."),
        "error",
      );
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 1) void loadRequests();
  }, [tab, loadRequests]);

  const selectedWorkflow =
    settings?.workflows.find(({ id }) => id === selectedWorkflowId) ?? null;

  const updateWorkflow = (
    update: (workflow: ApprovalWorkflow) => ApprovalWorkflow,
  ) => {
    if (!selectedWorkflowId) return;
    setSettings((current) =>
      current
        ? {
            ...current,
            workflows: current.workflows.map((workflow) =>
              workflow.id === selectedWorkflowId ? update(workflow) : workflow,
            ),
          }
        : current,
    );
  };

  const updateLevel = (
    levelId: string,
    update: (level: ApprovalLevel) => ApprovalLevel,
  ) => {
    updateWorkflow((workflow) => ({
      ...workflow,
      levels: workflow.levels.map((level) =>
        level.id === levelId ? update(level) : level,
      ),
    }));
  };

  const addLevel = () => {
    if (!selectedWorkflow) return;
    const nextNumber =
      selectedWorkflow.levels.reduce((maxNumber, level) => {
        const number = Number(level.id.replace(/\D/g, ""));
        return Number.isFinite(number) ? Math.max(maxNumber, number) : maxNumber;
      }, 0) + 1;
    const newLevel: ApprovalLevel = {
      id: `level-${nextNumber}`,
      levelTitle: `Level ${selectedWorkflow.levels.length + 1} Approval`,
      condition: "ANY",
      approvers: [],
    };
    updateWorkflow((workflow) => ({
      ...workflow,
      levels: [...workflow.levels, newLevel],
    }));
  };

  const saveSettings = async () => {
    if (!settings) return;
    const invalidWorkflow = settings.workflows.find(
      (workflow) =>
        workflow.approvalRequired &&
        workflow.status &&
        (workflow.levels.length === 0 ||
          workflow.levels.some((level) => level.approvers.length === 0)),
    );
    if (invalidWorkflow) {
      showSnackbar(
        `${getWorkflowLabel(invalidWorkflow)} needs at least one level and an approver in every level.`,
        "warning",
      );
      return;
    }
    if (
      settings.workflows.some(
        (workflow) =>
          !workflow.workflowName.trim() ||
          !Number.isInteger(workflow.priorityWeight) ||
          workflow.priorityWeight < 1,
      )
    ) {
      showSnackbar(
        "Every workflow needs a name and a priority weight of at least 1.",
        "warning",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await approvalWorkflowService.updateSettings(settings);
      setSettings(response);
      savedSettings.current = cloneSettings(response);
      showSnackbar("Approval workflow configuration saved.", "success");
    } catch (error) {
      showSnackbar(
        getErrorMessage(error, "Failed to save approval workflow settings."),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    if (savedSettings.current) {
      const restored = cloneSettings(savedSettings.current);
      setSettings(restored);
      if (!restored.workflows.some(({ id }) => id === selectedWorkflowId)) {
        setSelectedWorkflowId(restored.workflows[0]?.id ?? "");
      }
    }
  };

  const decideRequest = async (
    request: ApprovalRequest,
    decision: "APPROVE" | "REJECT",
  ) => {
    setActingOnRequest(request.id);
    try {
      const result = await approvalWorkflowService.decideRequest(request.id, {
        decision,
      });
      snackbarRef.current(result.message, "success");
      await loadRequests();
    } catch (error) {
      snackbarRef.current(
        getErrorMessage(error, `Failed to ${decision.toLowerCase()} request.`),
        "error",
      );
    } finally {
      setActingOnRequest(null);
    }
  };

  const confirmDecision = (
    request: ApprovalRequest,
    decision: "APPROVE" | "REJECT",
  ) => {
    const isApprove = decision === "APPROVE";
    showConfirmDialog({
      title: isApprove ? "Approve request" : "Reject request",
      message: isApprove
        ? `Approve "${request.summary}"? The requested change will be applied.`
        : `Reject "${request.summary}"? The requested change will not be applied.`,
      confirmText: isApprove ? "Approve" : "Reject",
      variant: isApprove ? "success" : "danger",
      onConfirm: () => void decideRequest(request, decision),
    });
  };

  const getActionLabel = (action: ApprovalAction) =>
    APPROVAL_ACTIONS.find(({ id }) => id === action)?.label ?? action;

  const getModuleLabel = (module: ApprovalModule) =>
    APPROVAL_MODULES.find(({ id }) => id === module)?.label ?? module;

  if (loadingSettings) {
    return <Alert severity="info">Loading approval workflow configuration...</Alert>;
  }

  if (!settings) {
    return (
      <Box className="p-4">
        <Alert severity="error">
          {loadError || "Approval workflow settings are unavailable."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="space-y-4 p-3 md:p-6">
      <Paper
        elevation={0}
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-4"
      >
        <Box className="flex items-center gap-3">
          <Typography variant="h6" className="!font-bold">
            Approval Configuration
          </Typography>
          <Chip
            label={selectedWorkflow ? "Edit workflow" : "No workflows"}
            color={selectedWorkflow ? "warning" : "default"}
            size="small"
          />
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={settings.enabled}
              onChange={(_, checked) =>
                setSettings((current) =>
                  current ? { ...current, enabled: checked } : current,
                )
              }
              slotProps={{ input: { "aria-label": "Enable approval workflows" } }}
            />
          }
          label={
            settings.enabled ? "Approval workflows enabled" : "Approval workflows disabled"
          }
        />
      </Paper>

      <Tabs value={tab} onChange={(_, value: number) => setTab(value)}>
        <Tab label="Workflow configuration" />
        <Tab label="Pending approvals" />
      </Tabs>

      {loadError && <Alert severity="warning">{loadError}</Alert>}

      {tab === 0 && (
        <>
          {selectedWorkflow ? (
            <>
              <Paper elevation={0} className="rounded-xl p-4 md:p-6">
                <Grid container spacing={2.5} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Workflow Name"
                      required
                      fullWidth
                      size="small"
                      value={selectedWorkflow.workflowName}
                      onChange={(event) =>
                        updateWorkflow((workflow) => ({
                          ...workflow,
                          workflowName: event.target.value,
                        }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel id="workflow-form-label">Form / Action</InputLabel>
                      <Select
                        labelId="workflow-form-label"
                        value={selectedWorkflow.id}
                        label="Form / Action"
                        onChange={(event) =>
                          setSelectedWorkflowId(event.target.value)
                        }
                      >
                        {settings.workflows.map((workflow) => (
                          <MenuItem key={workflow.id} value={workflow.id}>
                            {getWorkflowLabel(workflow)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      label="Priority Weight"
                      type="number"
                      required
                      fullWidth
                      size="small"
                      slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      value={selectedWorkflow.priorityWeight}
                      onChange={(event) =>
                        updateWorkflow((workflow) => ({
                          ...workflow,
                          priorityWeight: Number(event.target.value),
                        }))
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedWorkflow.status}
                          onChange={(_, checked) =>
                            updateWorkflow((workflow) => ({
                              ...workflow,
                              status: checked,
                            }))
                          }
                          color="success"
                        />
                      }
                      label={selectedWorkflow.status ? "Active" : "Inactive"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedWorkflow.approvalRequired}
                          onChange={(event) =>
                            updateWorkflow((workflow) => ({
                              ...workflow,
                              approvalRequired: event.target.checked,
                            }))
                          }
                        />
                      }
                      label="Approval Required for all matching actions"
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Paper elevation={0} className="h-full rounded-xl p-4 md:p-6">
                    <Typography variant="h6" className="!mb-2 !font-bold">
                      Rule Builder
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    {selectedWorkflow.approvalRequired ? (
                      <Box className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                        <CheckCircleIcon
                          color="primary"
                          sx={{ fontSize: 40, mb: 2, opacity: 0.6 }}
                        />
                        <Typography color="primary" className="!mb-2 !font-medium">
                          Approval is required for every matching action.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Changes in {getWorkflowLabel(selectedWorkflow)} will be
                          held until the configured approval levels are complete.
                          Add conditional rules in the backend to limit approval
                          by field values or business thresholds.
                        </Typography>
                      </Box>
                    ) : (
                      <Box className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center">
                        <Typography color="text.secondary">
                          Approval is not required for this form/action. The
                          existing permission checks continue to apply.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper elevation={0} className="h-full rounded-xl p-4 md:p-6">
                    <Box className="mb-2 flex items-center justify-between gap-3">
                      <Typography variant="h6" className="!font-bold">
                        Approval Levels
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        onClick={addLevel}
                        disabled={!selectedWorkflow.approvalRequired}
                      >
                        Add Level
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                            <TableCell width="60px">S.NO</TableCell>
                            <TableCell>LEVEL TITLE</TableCell>
                            <TableCell>APPROVAL CONDITION</TableCell>
                            <TableCell>APPROVERS</TableCell>
                            <TableCell width="60px">ACTION</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedWorkflow.levels.map((level, index) => (
                            <TableRow key={level.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <TextField
                                  value={level.levelTitle}
                                  onChange={(event) =>
                                    updateLevel(level.id, (current) => ({
                                      ...current,
                                      levelTitle: event.target.value,
                                    }))
                                  }
                                  size="small"
                                  fullWidth
                                  variant="standard"
                                  disabled={!selectedWorkflow.approvalRequired}
                                  slotProps={{
                                    htmlInput: {
                                      "aria-label": `Level ${index + 1} title`,
                                    },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <FormControl
                                  fullWidth
                                  size="small"
                                  variant="standard"
                                >
                                  <Select
                                    value={level.condition}
                                    onChange={(event) =>
                                      updateLevel(level.id, (current) => ({
                                        ...current,
                                        condition: event.target
                                          .value as ApprovalCondition,
                                      }))
                                    }
                                    disableUnderline
                                    disabled={!selectedWorkflow.approvalRequired}
                                    aria-label={`Level ${index + 1} approval condition`}
                                  >
                                    <MenuItem value="ANY">OR (Any)</MenuItem>
                                    <MenuItem value="ALL">AND (All)</MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                <FormControl
                                  fullWidth
                                  size="small"
                                  variant="standard"
                                >
                                  <Select
                                    multiple
                                    value={level.approvers}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      const approvers =
                                        typeof value === "string"
                                          ? value.split(",")
                                          : value;
                                      updateLevel(level.id, (current) => ({
                                        ...current,
                                        approvers,
                                      }));
                                    }}
                                    renderValue={(selected) =>
                                      selected
                                        .map(
                                          (id) =>
                                            APPROVERS.find(
                                              (approver) => approver.id === id,
                                            )?.label ?? id,
                                        )
                                        .join(", ")
                                    }
                                    displayEmpty
                                    disableUnderline
                                    disabled={!selectedWorkflow.approvalRequired}
                                    aria-label={`Level ${index + 1} approvers`}
                                  >
                                    {APPROVERS.map((approver) => (
                                      <MenuItem
                                        key={approver.id}
                                        value={approver.id}
                                      >
                                        <Checkbox
                                          checked={level.approvers.includes(
                                            approver.id,
                                          )}
                                        />
                                        {approver.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label={`Remove ${level.levelTitle}`}
                                  onClick={() =>
                                    updateWorkflow((workflow) => ({
                                      ...workflow,
                                      levels: workflow.levels.filter(
                                        ({ id }) => id !== level.id,
                                      ),
                                    }))
                                  }
                                  disabled={!selectedWorkflow.approvalRequired}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          {selectedWorkflow.levels.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                align="center"
                                sx={{ py: 3, color: "text.secondary" }}
                              >
                                No approval levels defined. Add a level to begin.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>

              <Box className="flex flex-wrap gap-2">
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => void saveSettings()}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={cancelChanges}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </Box>
            </>
          ) : (
            <Alert severity="warning">
              No approval workflows were returned by the API.
            </Alert>
          )}
        </>
      )}

      {tab === 1 && (
        <Paper elevation={0} className="rounded-xl">
          {requests.length === 0 && !loadingRequests ? (
            <Alert severity="info" className="m-4">
              There are no pending approval requests.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Change</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Requested by</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell align="right">Decision</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>{request.summary}</TableCell>
                      <TableCell>{getModuleLabel(request.module)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getActionLabel(request.action)}
                        />
                      </TableCell>
                      <TableCell>{request.requestedBy.name}</TableCell>
                      <TableCell>
                        {new Date(request.requestedAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="success"
                          disabled={actingOnRequest === request.id}
                          onClick={() => confirmDecision(request, "APPROVE")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={actingOnRequest === request.id}
                          onClick={() => confirmDecision(request, "REJECT")}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loadingRequests && (
                    <TableRow>
                      <TableCell colSpan={6}>Refreshing requests...</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}

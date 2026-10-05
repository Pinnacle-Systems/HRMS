import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Grid,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import {
  Description as FileStackIcon,
  People as UsersIcon,
  CalendarToday as CalendarIcon,
  List as ListOrderedIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloseOutlined,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
  payrollService,
  type ApprovalWorkflowStep,
  type AutoSyncFeature,
  type PayrollSettingsHistoryEntry,
  type TaxRules,
  type PayrollSettings,
  type TaxSlab,
  type Schedule,
  type PFESISettings,
} from "../../../services/modules/payrollServices/payroll";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";

// ==================== NAVIGATION ====================

const NAV_ITEMS = [
  { id: "tax", label: "Tax Rules", icon: FileStackIcon },
  { id: "pf-esi", label: "PF / ESI Settings", icon: UsersIcon },
  { id: "schedule", label: "Payroll Schedule", icon: CalendarIcon },
  { id: "approval", label: "Approval Workflow", icon: ListOrderedIcon },
];

// ==================== DEFAULT DATA ====================

const defaultApprovalSteps: ApprovalWorkflowStep[] = [
  { step: 1, role: "Payroll Administrator", action: "Generate Payroll", sla: "2 days", active: true },
  { step: 2, role: "Finance Manager", action: "Review & Verify", sla: "1 day", active: true },
  { step: 3, role: "HR Manager", action: "Final Approval", sla: "1 day", active: true },
  { step: 4, role: "System", action: "Bank Transfer Initiation", sla: "Auto", active: true },
];

const defaultAutoSyncFeatures: AutoSyncFeature[] = [
  { name: "Auto-fetch Attendance", enabled: true },
  { name: "Auto-apply Leaves", enabled: true },
  { name: "Auto-include New Joiners", enabled: true },
  { name: "Auto-apply Salary Revisions", enabled: false },
  { name: "Email Payslips", enabled: false },
  { name: "Bank File Export", enabled: true },
];

const formatCurrency = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN")}`;

// ==================== HISTORY VALUE RENDERERS ====================

const humanizeKey = (key: string): string =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();

const isTaxSlab = (value: unknown): value is TaxSlab =>
  typeof value === "object" &&
  value !== null &&
  "min" in value &&
  "max" in value &&
  "rate" in value;

const formatSlabRange = (slab: TaxSlab): string => {
  if (slab.min === 0) return `Up to ${formatCurrency(slab.max)}`;
  if (slab.max === 0) return `Above ${formatCurrency(slab.min)}`;
  return `${formatCurrency(slab.min)} – ${formatCurrency(slab.max)}`;
};

const renderHistoryValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return (
      <Typography variant="body2" className="!text-gray-800">
        —
      </Typography>
    );
  }

  if (typeof value === "boolean") {
    return (
      <Chip
        size="small"
        label={value ? "Enabled" : "Disabled"}
        color={value ? "success" : "default"}
        variant={value ? "filled" : "outlined"}
        className={` ${value ? "": "!text-gray-800"} `}
      />
    );
  }

  if (typeof value === "number") {
    return (
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value.toLocaleString("en-IN")}
      </Typography>
    );
  }

  if (typeof value === "string") {
    if (value === "Enabled" || value === "Disabled") {
      const on = value === "Enabled";
      return (
        <Chip
          size="small"
          label={value}
          color={on ? "success" : "default"}
          variant={on ? "filled" : "outlined"}
          className={`${on ? "" : "!text-gray-800"}`}
        />
      );
    }
    return <Typography variant="body2">{value}</Typography>;
  }

  if (isTaxSlab(value)) {
    return (
      <Stack direction="row" spacing={1.5}>
        <Typography variant="body2">{formatSlabRange(value)}dd</Typography>
        <Chip
          size="small"
          label={value.rate === 0 ? "Nil" : `${value.rate}%`}
          color="primary"
          variant="outlined"
        />
      </Stack>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <Typography variant="body2" className="!text-gray-800">
          No items
        </Typography>
      );
    }
    return (
      <Stack spacing={1}>
        {value.map((item, i) => (
          <Box
            className="bg-white-50 border border-gray-200 rounded-md p-2"
            key={i}
          >
            <HistoryEntryBody data={item} />
          </Box>
        ))}
      </Stack>
    );
  }

  if (typeof value === "object") {
    return <HistoryEntryBody data={value as Record<string, unknown>} />;
  }

  return <Typography variant="body2">{String(value)}</Typography>;
};

const HistoryEntryBody = ({ data }: { data: unknown }) => {
  if (data === null || data === undefined) {
    return (
      <Typography variant="body2" className="!text-gray-800">
        No data
      </Typography>
    );
  }

  if (typeof data !== "object" || Array.isArray(data)) {
    return <>{renderHistoryValue(data)}</>;
  }

  const fields = Object.entries(data as Record<string, unknown>);
  if (fields.length === 0) {
    return (
      <Typography variant="body2" className="!text-gray-800">
        No fields
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {fields.map(([key, value]) => {
        const isComplex = value !== null && typeof value === "object";
        return (
          <Box
            key={key}
            sx={{
              display: "grid",
              gridTemplateColumns: isComplex ? "1fr" : "minmax(180px, 220px) 1fr",
              gap: 1,
              alignItems: isComplex ? "stretch" : "center",
            }}
          >
            <Typography
              variant="body2"
              className="!text-gray-800"
              sx={{ fontWeight: 500 }}
            >
              {humanizeKey(key)}
            </Typography>
            <Box>{renderHistoryValue(value)}</Box>
          </Box>
        );
      })}
    </Stack>
  );
};

// ==================== HISTORY DIALOG ====================

const SettingsHistoryDialog = ({
  title,
  open,
  onClose,
  loading,
  error,
  entries,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  entries: PayrollSettingsHistoryEntry[];
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle className="!border-b border-gray-200 flex items-center justify-between !p-1">
      <div className="!ml-4">{title}</div>
      <IconButton onClick={onClose}>
        <CloseOutlined className="text-gray-800 !w-4" />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : entries.length === 0 ? (
        <Typography className="!text-gray-800">No previous configurations found.</Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {entries.map((entry, index) => {
            const { id, supersededAt, changedBy, ...configuration } = entry;
            return (
              <Card
                key={id ?? index}
                variant="outlined"
                className="!border !border-gray-200"
                sx={{ borderRadius: 2, overflow: "hidden" }}
              >
                {/* Header strip */}
                <Box
                  className="bg-head text-gray-800"
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    <HistoryIcon fontSize="small" className="!text-gray-800 !w-4" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {supersededAt
                        ? new Date(supersededAt).toLocaleString()
                        : "Date unavailable"}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" className="!text-gray-800">
                    Changed by: <strong>{changedBy ?? "—"}</strong>
                  </Typography>
                </Box>

                {/* Structured body */}
                <CardContent sx={{ p: 2 }} className="!bg-white text-gray-800">
                  <HistoryEntryBody data={configuration} />
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </DialogContent>
    <DialogActions className="!border-t !border-gray-200">
      <Button onClick={onClose} variant="outlined" className="!text-gray-800 !border-gray-200">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

// ==================== COMPONENT PROPS ====================

interface SettingsComponentProps {
  settings: PayrollSettings | null;
  onSave: (data: Partial<PayrollSettings>) => Promise<void>;
  saving: boolean;
}

// ==================== TAX RULES SETTINGS (EDITABLE) ====================

const TaxRulesSettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<PayrollSettingsHistoryEntry[]>([]);

  const [taxRules, setTaxRules] = useState<TaxRules>({
    defaultRegime: "New Regime",
    tdsComputation: {
      projectionMethod: "Annualized",
      declarationConsideration: "Enabled",
      perquisiteTax: "Disabled",
    },
    slabs: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300001, max: 600000, rate: 5 },
      { min: 600001, max: 900000, rate: 10 },
      { min: 900001, max: 1200000, rate: 15 },
      { min: 1200001, max: 1500000, rate: 20 },
      { min: 1500001, max: 0, rate: 30 },
    ],
  });

  useEffect(() => {
    if (settings?.taxRules) setTaxRules(settings.taxRules);
  }, [settings]);

  const handleSave = () => onSave({ taxRules });

  const handleOpenHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response: any = await payrollService.getPayrollTaxRulesHistory();
      if (!response.success) throw new Error(response.message || "Failed to fetch tax rules history");
      if (!Array.isArray(response.data)) throw new Error("The tax rules history response was invalid");
      setHistory(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch tax rules history:", error);
      setHistoryError(error instanceof Error ? error.message : "An error occurred while fetching tax rules history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatSlabRangeLocal = (slab: TaxSlab): string => {
    if (slab.min === 0) return `Up to ${formatCurrency(slab.max)}`;
    if (slab.max === 0) return `Above ${formatCurrency(slab.min)}`;
    return `${formatCurrency(slab.min)} – ${formatCurrency(slab.max)}`;
  };

  // ---------- Slab CRUD ----------
  const updateSlab = (index: number, patch: Partial<TaxSlab>) => {
    setTaxRules((prev) => {
      const slabs = [...prev.slabs];
      slabs[index] = { ...slabs[index], ...patch };
      return { ...prev, slabs };
    });
  };

  const addSlab = () => {
    setTaxRules((prev) => {
      const last = prev.slabs[prev.slabs.length - 1];
      const newMin = last ? (last.max === 0 ? last.min + 300000 : last.max + 1) : 0;
      return {
        ...prev,
        slabs: [...prev.slabs, { min: newMin, max: newMin + 299999, rate: 0 }],
      };
    });
  };

  const removeSlab = (index: number) => {
    setTaxRules((prev) => ({
      ...prev,
      slabs: prev.slabs.filter((_, i) => i !== index),
    }));
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Tax Rules (Income Tax / TDS)
          </Typography>
          <Typography variant="body2" className="text-gray-500 !mt-1">
            Configure tax regime, slabs, and computation rules for FY 2026-27
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            className="!border-amber-500 !text-amber-500"
            startIcon={<HistoryIcon fontSize="small" />}
            onClick={handleOpenHistory}
          >
            View history
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon fontSize="small" />}
            className="!bg-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                Default Tax Regime
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  {["New Regime", "Old Regime"].map((r) => (
                    <Button
                      key={r}
                      variant={r === taxRules.defaultRegime ? "contained" : "outlined"}
                      fullWidth
                      className={` ${r === taxRules.defaultRegime ? "text-white !font-bold" : "!text-gray-800 !border-gray-200"}`}
                      sx={{
                        textTransform: "none",
                        py: 1.5,
                        ...(r === taxRules.defaultRegime && { bgcolor: "var(--color-primary)" }),
                      }}
                      onClick={() => setTaxRules({ ...taxRules, defaultRegime: r })}
                    >
                      {r}
                    </Button>
                  ))}
                </Box>
                <Typography variant="caption" className="text-gray-500">
                  Employees can opt for a different regime during investment declaration.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 1, pb: "10px !important" }}>
              <Typography variant="subtitle2" className="text-gray-800 !mb-6 !font-bold">
                TDS Computation
              </Typography>
              <Stack>
                <FormControl fullWidth>
                  <InputLabel>Projection Method</InputLabel>
                  <Select
                    value={taxRules.tdsComputation.projectionMethod}
                    label="Projection Method"
                    onChange={(e) =>
                      setTaxRules({
                        ...taxRules,
                        tdsComputation: { ...taxRules.tdsComputation, projectionMethod: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="Annualized">Annualized</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Actual">Actual</MenuItem>
                  </Select>
                </FormControl>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
                        Declaration Consideration
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Consider employee investment declarations when computing TDS
                      </Typography>
                    </Box>
                    <Switch
                      checked={taxRules.tdsComputation.declarationConsideration === "Enabled"}
                      onChange={(e) =>
                        setTaxRules({
                          ...taxRules,
                          tdsComputation: {
                            ...taxRules.tdsComputation,
                            declarationConsideration: e.target.checked ? "Enabled" : "Disabled",
                          },
                        })
                      }
                    />
                  </Box>

                  <Divider className="border border-gray-200" />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
                        Perquisite Tax
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Include perquisite value in taxable income
                      </Typography>
                    </Box>
                    <Switch
                      checked={taxRules.tdsComputation.perquisiteTax === "Enabled"}
                      onChange={(e) =>
                        setTaxRules({
                          ...taxRules,
                          tdsComputation: {
                            ...taxRules.tdsComputation,
                            perquisiteTax: e.target.checked ? "Enabled" : "Disabled",
                          },
                        })
                      }
                    />
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card className="border border-gray-200 bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600 }}>
              New Regime Tax Slabs (FY 2026-27)
            </Typography>
            <Button
              size="small"
              className="!bg-primary"
              startIcon={<AddIcon />}
              onClick={addSlab}
              variant="contained"
            >
              Add Slab
            </Button>
          </Box>

          <TableContainer className="border border-gray-200 rounded-sm">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold">From (₹)</TableCell>
                  <TableCell className="!font-bold">To (₹) — 0 = no upper limit</TableCell>
                  <TableCell className="!font-bold">Rate (%)</TableCell>
                  <TableCell align="right" className="!font-bold">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taxRules.slabs.map((slab, index) => (
                  <TableRow key={index} sx={getRowColor(index)}>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={slab.min}
                        onChange={(e) => updateSlab(index, { min: parseInt(e.target.value) || 0 })}
                        sx={{ width: 140, "& .MuiInputBase-input": { px: 2, py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={slab.max}
                        onChange={(e) => updateSlab(index, { max: parseInt(e.target.value) || 0 })}
                        sx={{ width: 140, "& .MuiInputBase-input": { px: 2, py: 0.5 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={slab.rate}
                        onChange={(e) => updateSlab(index, { rate: parseFloat(e.target.value) || 0 })}
                        sx={{ width: 100, "& .MuiInputBase-input": { px: 2, py: 0.5 } }}
                        slotProps={{
                          htmlInput: { min: 0, max: 100, step: 0.5 },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => removeSlab(index)}>
                        <DeleteIcon fontSize="small" className="!w-4" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" className="text-gray-800">
              Preview:
            </Typography>
            <Stack direction="row" sx={{ mt: 0.5 }}>
              {taxRules.slabs.map((slab, i) => (
                <Box key={i} className="p-3 rounded-lg text-[12px] bg-head text-gray-800">
                  {formatSlabRangeLocal(slab)} → {slab.rate === 0 ? "Nil" : `${slab.rate}%`}
                </Box>
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <SettingsHistoryDialog
        title="Tax Rules History"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        loading={historyLoading}
        error={historyError}
        entries={history}
      />
    </Stack>
  );
};

// ==================== PF/ESI SETTINGS (EDITABLE) ====================

const PFESISettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const theme = useTheme();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<PayrollSettingsHistoryEntry[]>([]);

  const [pfEsi, setPfEsi] = useState<PFESISettings>({
    pf: {
      employeeContribution: "12%",
      employerContribution: "12%",
      epsOutOfEmployer: "8.33%",
      edliContribution: "0.5%",
      pfAdminCharges: "0.5%",
      wageCeiling: 15000,
      voluntaryPF: false,
    },
    esi: {
      employeeContribution: "0.75%",
      employerContribution: "3.25%",
      wageCeiling: 21000,
      esiEnabled: true,
    },
  });

  useEffect(() => {
    if (settings?.pfEsiSettings) setPfEsi(settings.pfEsiSettings);
  }, [settings]);

  const handleSave = () => onSave({ pfEsiSettings: pfEsi });

  const handleOpenHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response: any = await payrollService.getPayrollPfEsiHistory();
      if (!response.success) throw new Error(response.message || "Failed to fetch PF / ESI history");
      if (!Array.isArray(response.data)) throw new Error("The PF / ESI history response was invalid");
      setHistory(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch PF / ESI history:", error);
      setHistoryError(error instanceof Error ? error.message : "An error occurred while fetching PF / ESI history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleVoluntaryPF = () =>
    setPfEsi({ ...pfEsi, pf: { ...pfEsi.pf, voluntaryPF: !pfEsi.pf.voluntaryPF } });

  const toggleESI = () =>
    setPfEsi({ ...pfEsi, esi: { ...pfEsi.esi, esiEnabled: !pfEsi.esi.esiEnabled } });

  const EditableRow = ({
    label,
    desc,
    value,
    color,
    onChange,
    type = "text",
  }: {
    label: string;
    desc: string;
    value: string | number;
    color: string;
    onChange: (v: string) => void;
    type?: "text" | "number";
  }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
          {label}
        </Typography>
        <Typography variant="caption" className="text-gray-500">
          {desc}
        </Typography>
      </Box>
      <TextField
        size="small"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          width: 120,
          "& input": { textAlign: "right", fontWeight: 700, color },
        }}
      />
    </Box>
  );

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            PF / ESI Settings
          </Typography>
          <Typography variant="body2" className="text-gray-500 !mt-1">
            Configure Provident Fund and Employee State Insurance parameters
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" className="!border-amber-500 !text-amber-500"
          startIcon={<HistoryIcon fontSize="small" />} onClick={handleOpenHistory}>
            View history
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon fontSize="small" />}
            className="!bg-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "info.main", mb: 2 }}>
                Provident Fund (EPF)
              </Typography>
              <Stack spacing={2}>
                <EditableRow
                  label="Employee Contribution"
                  desc="Of Basic + DA"
                  value={pfEsi.pf.employeeContribution}
                  color={theme.palette.info.main}
                  onChange={(v) => setPfEsi({ ...pfEsi, pf: { ...pfEsi.pf, employeeContribution: v } })}
                />
                <EditableRow
                  label="Employer Contribution"
                  desc="Of Basic + DA"
                  value={pfEsi.pf.employerContribution}
                  color={theme.palette.info.main}
                  onChange={(v) => setPfEsi({ ...pfEsi, pf: { ...pfEsi.pf, employerContribution: v } })}
                />
                <EditableRow
                  label="EPS (Out of Employer)"
                  desc="Capped at ₹1,250"
                  value={pfEsi.pf.epsOutOfEmployer}
                  color={theme.palette.info.main}
                  onChange={(v) => setPfEsi({ ...pfEsi, pf: { ...pfEsi.pf, epsOutOfEmployer: v } })}
                />
                <EditableRow
                  label="EDLI Contribution"
                  desc="Employer only"
                  value={pfEsi.pf.edliContribution}
                  color={theme.palette.info.main}
                  onChange={(v) => setPfEsi({ ...pfEsi, pf: { ...pfEsi.pf, edliContribution: v } })}
                />
                <EditableRow
                  label="PF Admin Charges"
                  desc="Employer only"
                  value={pfEsi.pf.pfAdminCharges}
                  color={theme.palette.info.main}
                  onChange={(v) => setPfEsi({ ...pfEsi, pf: { ...pfEsi.pf, pfAdminCharges: v } })}
                />
                <EditableRow
                  label="Wage Ceiling"
                  desc="For mandatory coverage"
                  value={pfEsi.pf.wageCeiling}
                  color={theme.palette.info.main}
                  type="number"
                  onChange={(v) => setPfEsi({ ...pfEsi, pf: { ...pfEsi.pf, wageCeiling: parseInt(v) || 0 } })}
                />
                <Divider className="border border-gray-200" />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
                      Voluntary PF
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      Allow employees to contribute beyond 12%
                    </Typography>
                  </Box>
                  <Switch checked={pfEsi.pf.voluntaryPF} onChange={toggleVoluntaryPF} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.3)}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "success.main", mb: 2 }}>
                Employee State Insurance (ESI)
              </Typography>
              <Stack spacing={2}>
                <EditableRow
                  label="Employee Contribution"
                  desc="Of Gross Salary"
                  value={pfEsi.esi.employeeContribution}
                  color={theme.palette.success.main}
                  onChange={(v) => setPfEsi({ ...pfEsi, esi: { ...pfEsi.esi, employeeContribution: v } })}
                />
                <EditableRow
                  label="Employer Contribution"
                  desc="Of Gross Salary"
                  value={pfEsi.esi.employerContribution}
                  color={theme.palette.success.main}
                  onChange={(v) => setPfEsi({ ...pfEsi, esi: { ...pfEsi.esi, employerContribution: v } })}
                />
                <EditableRow
                  label="Wage Ceiling"
                  desc="Monthly gross limit"
                  value={pfEsi.esi.wageCeiling}
                  color={theme.palette.success.main}
                  type="number"
                  onChange={(v) => setPfEsi({ ...pfEsi, esi: { ...pfEsi.esi, wageCeiling: parseInt(v) || 0 } })}
                />
                <Divider className="border border-gray-200" />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
                      ESI Enabled
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      For eligible employees
                    </Typography>
                  </Box>
                  <Switch checked={pfEsi.esi.esiEnabled} onChange={toggleESI} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <SettingsHistoryDialog
        title="PF / ESI Settings History"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        loading={historyLoading}
        error={historyError}
        entries={history}
      />
    </Stack>
  );
};

// ==================== SCHEDULE SETTINGS ====================

const ScheduleSettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const [schedule, setSchedule] = useState<Schedule>({
    frequency: "monthly",
    attendanceCutoffDate: 26,
    salaryPaymentDate: 5,
    processingStartDate: 1,
  });

  const [autoSyncFeatures, setAutoSyncFeatures] = useState<AutoSyncFeature[]>(defaultAutoSyncFeatures);

  useEffect(() => {
    if (settings?.schedule) setSchedule(settings.schedule);
    if (settings?.autoSyncFeatures && settings.autoSyncFeatures.length > 0) {
      setAutoSyncFeatures(settings.autoSyncFeatures);
    }
  }, [settings]);

  const handleSave = () => onSave({ schedule, autoSyncFeatures });

  const toggleAutoSync = (index: number) => {
    const updated = [...autoSyncFeatures];
    updated[index].enabled = !updated[index].enabled;
    setAutoSyncFeatures(updated);
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Payroll Schedule
          </Typography>
          <Typography variant="body2" className="text-gray-500 !mt-1">
            Configure processing timelines and payment dates
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon fontSize="small" />}
          className="!bg-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                Processing Schedule
              </Typography>
              <Stack spacing={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payroll Frequency</InputLabel>
                  <Select
                    value={schedule.frequency}
                    label="Payroll Frequency"
                    onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-Weekly</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Attendance Cutoff Date
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      type="number"
                      value={schedule.attendanceCutoffDate}
                      onChange={(e) => setSchedule({ ...schedule, attendanceCutoffDate: parseInt(e.target.value) || 0 })}
                      size="small"
                      sx={{ width: 80 }}
                    />
                    <Typography variant="body2" className="text-gray-500">
                      of each month
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }} className="text-gray-800">
                    Salary Payment Date
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      type="number"
                      value={schedule.salaryPaymentDate}
                      onChange={(e) => setSchedule({ ...schedule, salaryPaymentDate: parseInt(e.target.value) || 0 })}
                      size="small"
                      sx={{ width: 80 }}
                    />
                    <Typography variant="body2" className="text-gray-500">
                      of next month
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }} className="text-gray-800">
                    Processing Start Date
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      type="number"
                      value={schedule.processingStartDate}
                      onChange={(e) => setSchedule({ ...schedule, processingStartDate: parseInt(e.target.value) || 0 })}
                      size="small"
                      sx={{ width: 80 }}
                    />
                    <Typography variant="body2" className="text-gray-500">
                      of next month
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="bg-white border border-gray-200" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                Auto-Sync Features
              </Typography>
              <Stack spacing={1}>
                {autoSyncFeatures.map((feature, index) => (
                  <Box
                    key={feature.name}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                    }}
                    className="border-b border-gray-200"
                  >
                    <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 500 }}>
                      {feature.name}
                    </Typography>
                    <Switch checked={feature.enabled} onChange={() => toggleAutoSync(index)} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

// ==================== APPROVAL WORKFLOW SETTINGS (EDITABLE) ====================

const ApprovalWorkflowSettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const theme = useTheme();
  const [approvalWorkflow, setApprovalWorkflow] = useState<ApprovalWorkflowStep[]>(defaultApprovalSteps);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    if (settings?.approvalWorkflow && settings.approvalWorkflow.length > 0) {
      setApprovalWorkflow(settings.approvalWorkflow);
    }
  }, [settings]);

  const handleSave = () => onSave({ approvalWorkflow });

  const toggleStepActive = (stepIndex: number) => {
    const updated = [...approvalWorkflow];
    updated[stepIndex].active = !updated[stepIndex].active;
    setApprovalWorkflow(updated);
  };

  const updateStep = (index: number, patch: Partial<ApprovalWorkflowStep>) => {
    setApprovalWorkflow((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  };

  const addStep = () => {
    const nextStep = approvalWorkflow.length + 1;
    setApprovalWorkflow([
      ...approvalWorkflow,
      { step: nextStep, role: "", action: "", sla: "1 day", active: true },
    ]);
  };

  const removeStep = (index: number) => {
    setApprovalWorkflow((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, step: i + 1 }))
    );
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Approval Workflow
          </Typography>
          <Typography variant="body2" className="text-gray-500 !mt-1">
            Define the multi-level approval chain for payroll processing
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" className="!border-primary !text-primary" startIcon={<AddIcon />} onClick={addStep}>
            Add Step
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon fontSize="small" />}
            className="!bg-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Workflow"}
          </Button>
        </Stack>
      </Box>

      <Stack spacing={2}>
        {approvalWorkflow.map((step, i) => (
          <Box key={step.step} sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: step.active ? "primary.main" : "grey.400",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                {step.step}
              </Box>
              {i < approvalWorkflow.length - 1 && (
                <Box sx={{ width: 2, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.2) }} />
              )}
            </Box>

            <Card className="bg-white" sx={{ flex: 1, borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2 }}>
                {editIndex === i ? (
                  <div className="flex gap-2 items-center">
                    <TextField
                      label="Action"
                      value={step.action}
                      onChange={(e) => updateStep(i, { action: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="Role"
                      value={step.role}
                      onChange={(e) => updateStep(i, { role: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="SLA"
                      value={step.sla}
                      onChange={(e) => updateStep(i, { sla: e.target.value })}
                      fullWidth
                    />
                    {/* <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}> */}
                      <Button size="small" variant="contained" className="!bg-primary" onClick={() => setEditIndex(null)}>
                        Done
                      </Button>
                    {/* </Box> */}
                  </div>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 600 }}>
                        {step.action || "—"}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Role: <strong>{step.role || "—"}</strong>
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" className="text-gray-800">
                          SLA
                        </Typography>
                        <Typography variant="body2" className="text-gray-500" sx={{ fontWeight: 600 }}>
                          {step.sla}
                        </Typography>
                      </Box>
                      <Switch checked={step.active} onChange={() => toggleStepActive(i)} />
                      <IconButton
                        size="small"
                        onClick={() => setEditIndex(i)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                        }}
                      >
                        <EditIcon fontSize="small" className="!w-4 text-blue-500" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeStep(i)}
                        disabled={approvalWorkflow.length <= 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>

      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <AlertTitle sx={{ fontWeight: 600 }}>Escalation Policy</AlertTitle>
        If an approver does not act within their SLA, payroll is automatically escalated to the next level approver and a reminder email is sent.
      </Alert>
    </Stack>
  );
};

// ==================== CONTENT MAP ====================

const contentMap: Record<string, React.ComponentType<SettingsComponentProps>> = {
  tax: TaxRulesSettings,
  "pf-esi": PFESISettings,
  schedule: ScheduleSettings,
  approval: ApprovalWorkflowSettings,
};

// ==================== MAIN COMPONENT ====================

export default function PayrollSettings() {
  const { tab = "tax" } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const activeTab = contentMap[tab] ? tab : "tax";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const { showSnackbar } = useUI();

  // ---------- FETCH ALL SETTINGS ----------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const [settingsResponse, taxRulesResponse]: any = await Promise.all([
          payrollService.getPayrollSettings(),
          payrollService.getPayrollTaxRules<TaxRules>(),
        ]);

        if (!settingsResponse.success) {
          throw new Error(settingsResponse.message || "Failed to fetch settings");
        }
        if (!taxRulesResponse.success) {
          throw new Error(taxRulesResponse.message || "Failed to fetch tax rules");
        }

        setSettings({
          ...settingsResponse.data,
          taxRules: taxRulesResponse.data,
          // pfEsiSettings is expected to come embedded in settingsResponse.data
        });
      } catch (error: unknown) {
        showSnackbar("Failed to fetch payroll settings", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ---------- SAVE (routes to the right endpoint) ----------
  const handleSaveSettings = async (updatedSettings: Partial<PayrollSettings>) => {
    try {
      setSaving(true);

      // 1) Tax rules → dedicated endpoint
      if (updatedSettings.taxRules) {
        const response: any = await payrollService.updatePayrollTaxRules<TaxRules>(updatedSettings.taxRules);
        if (!response.success) throw new Error(response.message || "Failed to save tax rules");
        setSettings((current) => (current ? { ...current, taxRules: response.data } : current));
      }

      // 2) PF/ESI + Schedule + AutoSync + Approval → base settings endpoint
      const basePayload: Partial<PayrollSettings> = {};
      if (updatedSettings.pfEsiSettings) basePayload.pfEsiSettings = updatedSettings.pfEsiSettings;
      if (updatedSettings.schedule) basePayload.schedule = updatedSettings.schedule;
      if (updatedSettings.autoSyncFeatures) basePayload.autoSyncFeatures = updatedSettings.autoSyncFeatures;
      if (updatedSettings.approvalWorkflow) basePayload.approvalWorkflow = updatedSettings.approvalWorkflow;

      if (Object.keys(basePayload).length > 0) {
        const response: any = await payrollService.updatePayrollSettings(basePayload);
        if (!response.success) throw new Error(response.message || "Failed to save settings");
        setSettings((current) => (current ? { ...current, ...response.data } : response.data));
      }

      showSnackbar("Settings saved successfully!", "success");
    } catch (error: unknown) {
      showSnackbar(error instanceof Error ? error.message : "An error occurred while saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const Content = contentMap[activeTab];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", height: "100%", my: 3, gap: 2 }}>
        {/* Left Nav */}
        <Box sx={{ width: 240, flexShrink: 0 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 1.5 }}>
              <Stack spacing={0.5}>
                {NAV_ITEMS.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => navigate(`/settings/payroll/payroll-settings/${item.id}`)}
                      fullWidth
                      sx={{
                        justifyContent: "flex-start",
                        color: active ? "primary.main" : "text.secondary",
                        bgcolor: active ? "var(--color-primary-100)" : "transparent",
                        "&:hover": {
                          bgcolor: active ? "" : alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <item.icon className="text-gray-500 dark:text-primary mr-2 !w-4" sx={{ fontSize: 18 }} />
                      <Box sx={{ flex: 1, textAlign: "left" }} className={active ? "text-black" : "text-gray-800"}>
                        {item.label}
                      </Box>
                      {active && <ChevronRightIcon className="text-primary" />}
                    </Button>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Content settings={settings} onSave={handleSaveSettings} saving={saving} />
        </Box>
      </Box>
    </>
  );
}
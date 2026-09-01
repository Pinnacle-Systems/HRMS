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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Layers as LayersIcon,
  RemoveCircle as MinusCircleIcon,
  Description as FileStackIcon,
  People as UsersIcon,
  CalendarToday as CalendarIcon,
  List as ListOrderedIcon,
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ChevronRight as ChevronRightIcon,
  CheckCircle as CheckCircleIcon,
  CancelOutlined,
} from "@mui/icons-material";
import { getRowColor } from "../../const";
import { useEffect, useState } from "react";
import { payrollService } from "../../../services/modules/payrollServices/payroll";

// ==================== TYPES BASED ON API RESPONSE ====================

interface TaxSlab {
  min: number;
  max: number;
  rate: number;
}

interface TaxRules {
  defaultRegime: string;
  tdsComputation: {
    perquisiteTax: string;
    projectionMethod: string;
    declarationConsideration: string;
  };
  slabs: TaxSlab[];
}

interface PF {
  voluntaryPF: boolean;
  epsOutOfEmployer: string;
  employerContribution: string;
  employeeContribution: string;
  edliContribution: string;
  wageCeiling: number;
  pfAdminCharges: string;
}

interface ESI {
  employerContribution: string;
  wageCeiling: number;
  employeeContribution: string;
  esiEnabled: boolean;
}

interface PFESISettings {
  pf: PF;
  esi: ESI;
}

interface Schedule {
  salaryPaymentDate: number;
  frequency: string;
  attendanceCutoffDate: number;
  processingStartDate: number;
}

interface AutoSyncFeature {
  enabled: boolean;
  name: string;
}

interface ApprovalWorkflowStep {
  active: boolean;
  action: string;
  step: number;
  role: string;
  sla: string;
}

interface Allowance {
  id?: string;
  name: string;
  basis: string;
  limit: string;
  taxExempt: boolean;
}

interface DeductionRule {
  id?: string;
  employer: string;
  name: string;
  rate: string;
  applicability: string;
  cap: string;
}

interface PayrollSettings {
  taxRules: TaxRules;
  pfEsiSettings: PFESISettings;
  schedule: Schedule;
  autoSyncFeatures: AutoSyncFeature[];
  approvalWorkflow: ApprovalWorkflowStep[];
  allowances: Allowance[];
  deductionRules: DeductionRule[];
}

// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
//   timestamp: string;
// }

// ==================== NAVIGATION ====================

const NAV_ITEMS = [
  { id: "allowances", label: "Allowances Configuration", icon: LayersIcon },
  { id: "deductions", label: "Deduction Rules", icon: MinusCircleIcon },
  { id: "tax", label: "Tax Rules", icon: FileStackIcon },
  { id: "pf-esi", label: "PF / ESI Settings", icon: UsersIcon },
  { id: "schedule", label: "Payroll Schedule", icon: CalendarIcon },
  { id: "approval", label: "Approval Workflow", icon: ListOrderedIcon },
];

// ==================== DEFAULT DATA ====================

const defaultAllowances: Allowance[] = [
  { id: "1", name: "House Rent Allowance", basis: "50% of Basic (Metro) / 40% (Non-Metro)", limit: "Actual or 50% of Basic", taxExempt: true },
  { id: "2", name: "Conveyance Allowance", basis: "Fixed ₹1,600/month", limit: "₹19,200/year", taxExempt: true },
  { id: "3", name: "Medical Allowance", basis: "Fixed ₹1,250/month", limit: "₹15,000/year", taxExempt: true },
  { id: "4", name: "LTA (Leave Travel)", basis: "Actuals as submitted", limit: "2 journeys in 4 years", taxExempt: true },
  { id: "5", name: "Special Allowance", basis: "Balancing component", limit: "Fully taxable", taxExempt: false },
];

const defaultDeductionRules: DeductionRule[] = [
  { id: "1", name: "Provident Fund", applicability: "Salary ≤ ₹15,000 Basic (Mandatory)", rate: "12% of Basic", cap: "₹1,800/month", employer: "12% of Basic" },
  { id: "2", name: "Professional Tax", applicability: "All employees", rate: "Slab based", cap: "₹2,500/year", employer: "N/A" },
  { id: "3", name: "ESIC", applicability: "Gross ≤ ₹21,000/month", rate: "0.75% of Gross", cap: "None", employer: "3.25% of Gross" },
  { id: "4", name: "Income Tax (TDS)", applicability: "Income > exemption limit", rate: "Slab based", cap: "None", employer: "N/A" },
];

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

// ==================== HELPER COMPONENTS ====================

const BoolDot = ({ value }: { value: boolean }) => {
  return (
    <Box
      sx={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mx: "auto",
      }}
    >
      {value ? (
        <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
      ) : (
        <CancelOutlined sx={{ fontSize: 14, color: "error.main" }} />
      )}
    </Box>
  );
};

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// ==================== COMPONENT PROPS ====================

interface SettingsComponentProps {
  settings: PayrollSettings | null;
  onSave: (data: Partial<PayrollSettings>) => Promise<void>;
  saving: boolean;
}

// ==================== ALLOWANCES SETTINGS ====================

const AllowancesSettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const theme = useTheme();
  const [allowances, setAllowances] = useState<Allowance[]>(defaultAllowances);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState<Allowance | null>(null);
  const [formData, setFormData] = useState<Allowance>({
    name: '',
    basis: '',
    limit: '',
    taxExempt: true,
  });

  useEffect(() => {
    if (settings?.allowances && settings.allowances.length > 0) {
      setAllowances(settings.allowances);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({ allowances });
  };

  const handleOpenDialog = (allowance?: Allowance) => {
    if (allowance) {
      setEditingAllowance(allowance);
      setFormData(allowance);
    } else {
      setEditingAllowance(null);
      setFormData({
        name: '',
        basis: '',
        limit: '',
        taxExempt: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAllowance(null);
  };

  const handleFormChange = (field: keyof Allowance, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    if (editingAllowance) {
      // Edit existing
      setAllowances(allowances.map(a => 
        a.id === editingAllowance.id ? { ...formData, id: a.id } : a
      ));
    } else {
      // Add new
      const newId = (Math.max(...allowances.map(a => parseInt(a.id || '0'))) + 1).toString();
      setAllowances([...allowances, { ...formData, id: newId }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this allowance?')) {
      setAllowances(allowances.filter(a => a.id !== id));
    }
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Allowances Configuration
          </Typography>
          <Typography variant="body2" className="text-gray-500 !mt-1">
            Configure allowance rules, limits, and tax exemption eligibility
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PlusIcon fontSize="small" />}
            className="!bg-primary"
            onClick={() => handleOpenDialog()}
          >
            Add Allowance
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon fontSize="small" />}
            className="!bg-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>

      <TableContainer className="border border-gray-200 rounded-md">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold">S.No</TableCell>
              <TableCell className="!font-bold">Allowance</TableCell>
              <TableCell className="!font-bold">Calculation Basis</TableCell>
              <TableCell className="!font-bold">Exemption Limit</TableCell>
              <TableCell align="center" className="!font-bold">Tax Exempt</TableCell>
              <TableCell align="center" className="!font-bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allowances.map((a, i) => (
              <TableRow key={a.id || i} sx={getRowColor(i)}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {a.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.basis}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.limit}</Typography>
                </TableCell>
                <TableCell align="center"><BoolDot value={a.taxExempt} /></TableCell>
                <TableCell align="center">
                  <Stack direction="row">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(a)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    >
                      <EditIcon fontSize="small" className="!w-4 text-blue-500" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(a.id || '')}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.08) },
                      }}
                    >
                      <DeleteIcon fontSize="small" className="text-error !w-4" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAllowance ? 'Edit Allowance' : 'Add New Allowance'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Allowance Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Calculation Basis"
              value={formData.basis}
              onChange={(e) => handleFormChange('basis', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Exemption Limit"
              value={formData.limit}
              onChange={(e) => handleFormChange('limit', e.target.value)}
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Tax Exempt</Typography>
              <Switch
                checked={formData.taxExempt}
                onChange={(e) => handleFormChange('taxExempt', e.target.checked)}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            className="!bg-primary"
            disabled={!formData.name}
          >
            {editingAllowance ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

// ==================== DEDUCTION RULES SETTINGS ====================

const DeductionRulesSettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const theme = useTheme();
  const [deductions, setDeductions] = useState<DeductionRule[]>(defaultDeductionRules);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<DeductionRule | null>(null);
  const [formData, setFormData] = useState<DeductionRule>({
    name: '',
    applicability: '',
    rate: '',
    cap: '',
    employer: '',
  });

  useEffect(() => {
    if (settings?.deductionRules && settings.deductionRules.length > 0) {
      setDeductions(settings.deductionRules);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({ deductionRules: deductions });
  };

  const handleOpenDialog = (deduction?: DeductionRule) => {
    if (deduction) {
      setEditingDeduction(deduction);
      setFormData(deduction);
    } else {
      setEditingDeduction(null);
      setFormData({
        name: '',
        applicability: '',
        rate: '',
        cap: '',
        employer: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDeduction(null);
  };

  const handleFormChange = (field: keyof DeductionRule, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    if (editingDeduction) {
      setDeductions(deductions.map(d => 
        d.id === editingDeduction.id ? { ...formData, id: d.id } : d
      ));
    } else {
      const newId = (Math.max(...deductions.map(d => parseInt(d.id || '0'))) + 1).toString();
      setDeductions([...deductions, { ...formData, id: newId }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this deduction rule?')) {
      setDeductions(deductions.filter(d => d.id !== id));
    }
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Deduction Rules
          </Typography>
          <Typography variant="body2" className="text-gray-500 !mt-1">
            Statutory and custom deduction rules with employee/employer contributions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PlusIcon fontSize="small" />}
            className="!bg-primary"
            onClick={() => handleOpenDialog()}
          >
            Add Deduction
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon fontSize="small" />}
            className="!bg-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>

      <TableContainer className="border border-gray-200 rounded-md">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableCell className="!font-bold">S.No</TableCell>
              <TableCell className="!font-bold">Deduction</TableCell>
              <TableCell className="!font-bold">Applicability</TableCell>
              <TableCell className="!font-bold">Employee Rate</TableCell>
              <TableCell className="!font-bold">Employer Contribution</TableCell>
              <TableCell className="!font-bold">Cap</TableCell>
              <TableCell align="center" className="!font-bold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deductions.map((d, i) => (
              <TableRow key={d.id || i} sx={getRowColor(i)}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {d.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{d.applicability}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "error.main", fontWeight: 500 }}>
                    {d.rate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{d.employer}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{d.cap}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(d)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    >
                      <EditIcon fontSize="small" className="!w-4 text-blue-500" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(d.id || '')}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.08) },
                      }}
                    >
                      <DeleteIcon fontSize="small" className="text-error !w-4" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDeduction ? 'Edit Deduction Rule' : 'Add New Deduction Rule'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Deduction Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Applicability"
              value={formData.applicability}
              onChange={(e) => handleFormChange('applicability', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Employee Rate"
              value={formData.rate}
              onChange={(e) => handleFormChange('rate', e.target.value)}
              fullWidth
            />
            <TextField
              label="Employer Contribution"
              value={formData.employer}
              onChange={(e) => handleFormChange('employer', e.target.value)}
              fullWidth
            />
            <TextField
              label="Cap"
              value={formData.cap}
              onChange={(e) => handleFormChange('cap', e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            className="!bg-primary"
            disabled={!formData.name}
          >
            {editingDeduction ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

// ==================== TAX RULES SETTINGS ====================

const TaxRulesSettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const theme = useTheme();
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
    if (settings?.taxRules) {
      setTaxRules(settings.taxRules);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({ taxRules });
  };

  const formatSlabRange = (slab: TaxSlab): string => {
    if (slab.min === 0) {
      return `Up to ${formatCurrency(slab.max)}`;
    } else if (slab.max === 0) {
      return `Above ${formatCurrency(slab.min)}`;
    } else {
      return `${formatCurrency(slab.min)} – ${formatCurrency(slab.max)}`;
    }
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
                Default Tax Regime
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  {["New Regime", "Old Regime"].map((r) => (
                    <Button
                      key={r}
                      variant={r === taxRules.defaultRegime ? "contained" : "outlined"}
                      fullWidth
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
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
                TDS Computation
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { label: "Projection Method", value: taxRules.tdsComputation.projectionMethod },
                  { label: "Declaration Consideration", value: taxRules.tdsComputation.declarationConsideration },
                  { label: "Perquisite Tax", value: taxRules.tdsComputation.perquisiteTax },
                ].map((s) => (
                  <Box key={s.label} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" className="text-gray-500">
                      {s.label}
                    </Typography>
                    <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 500 }}>
                      {s.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card className="border border-gray-200 bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" className="text-gray-800" sx={{ fontWeight: 600, mb: 2 }}>
            New Regime Tax Slabs (FY 2026-27)
          </Typography>
          <TableContainer className="border border-gray-200 rounded-sm">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell className="!font-bold">Income Range</TableCell>
                  <TableCell align="right" className="!font-bold">Tax Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taxRules.slabs.map((slab, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2">{formatSlabRange(slab)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                        {slab.rate === 0 ? "Nil" : `${slab.rate}%`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
};

// ==================== PF/ESI SETTINGS ====================

const PFESISettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const theme = useTheme();
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
    if (settings?.pfEsiSettings) {
      setPfEsi(settings.pfEsiSettings);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({ pfEsiSettings: pfEsi });
  };

  const toggleVoluntaryPF = () => {
    setPfEsi({
      ...pfEsi,
      pf: { ...pfEsi.pf, voluntaryPF: !pfEsi.pf.voluntaryPF },
    });
  };

  const toggleESI = () => {
    setPfEsi({
      ...pfEsi,
      esi: { ...pfEsi.esi, esiEnabled: !pfEsi.esi.esiEnabled },
    });
  };

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
          <Card className="bg-white" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "info.main", mb: 2 }}>
                Provident Fund (EPF)
              </Typography>
              <Stack spacing={2}>
                {[
                  { label: "Employee Contribution", value: pfEsi.pf.employeeContribution, desc: "Of Basic + DA" },
                  { label: "Employer Contribution", value: pfEsi.pf.employerContribution, desc: "Of Basic + DA" },
                  { label: "EPS (Out of Employer)", value: pfEsi.pf.epsOutOfEmployer, desc: "Capped at ₹1,250" },
                  { label: "EDLI Contribution", value: pfEsi.pf.edliContribution, desc: "Employer only" },
                  { label: "PF Admin Charges", value: pfEsi.pf.pfAdminCharges, desc: "Employer only" },
                  { label: "Wage Ceiling", value: formatCurrency(pfEsi.pf.wageCeiling), desc: "For mandatory coverage" },
                ].map((f) => (
                  <Box key={f.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
                        {f.label}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {f.desc}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "info.main" }}>
                      {f.value}
                    </Typography>
                  </Box>
                ))}
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
                {[
                  { label: "Employee Contribution", value: pfEsi.esi.employeeContribution, desc: "Of Gross Salary" },
                  { label: "Employer Contribution", value: pfEsi.esi.employerContribution, desc: "Of Gross Salary" },
                  { label: "Wage Ceiling", value: formatCurrency(pfEsi.esi.wageCeiling), desc: "Monthly gross limit" },
                ].map((f) => (
                  <Box key={f.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800">
                        {f.label}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {f.desc}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                      {f.value}
                    </Typography>
                  </Box>
                ))}
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
    if (settings?.schedule) {
      setSchedule(settings.schedule);
    }
    if (settings?.autoSyncFeatures && settings.autoSyncFeatures.length > 0) {
      setAutoSyncFeatures(settings.autoSyncFeatures);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({ schedule, autoSyncFeatures });
  };

  const toggleAutoSync = (index: number) => {
    const updatedFeatures = [...autoSyncFeatures];
    updatedFeatures[index].enabled = !updatedFeatures[index].enabled;
    setAutoSyncFeatures(updatedFeatures);
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
                      "&:last-child": { borderBottom: "none" },
                    }}
                    className="border-b border-gray-200"
                  >
                    <Box>
                      <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 500 }}>
                        {feature.name}
                      </Typography>
                    </Box>
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

// ==================== APPROVAL WORKFLOW SETTINGS ====================

const ApprovalWorkflowSettings = ({ settings, onSave, saving }: SettingsComponentProps) => {
  const theme = useTheme();
  const [approvalWorkflow, setApprovalWorkflow] = useState<ApprovalWorkflowStep[]>(defaultApprovalSteps);

  useEffect(() => {
    if (settings?.approvalWorkflow && settings.approvalWorkflow.length > 0) {
      setApprovalWorkflow(settings.approvalWorkflow);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({ approvalWorkflow });
  };

  const toggleStepActive = (stepIndex: number) => {
    const updatedSteps = [...approvalWorkflow];
    updatedSteps[stepIndex].active = !updatedSteps[stepIndex].active;
    setApprovalWorkflow(updatedSteps);
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
        <Button
          variant="contained"
          startIcon={<SaveIcon fontSize="small" />}
          className="!bg-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Workflow"}
        </Button>
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
              <CardContent sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 600 }}>
                    {step.action}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    Role: <strong>{step.role}</strong>
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
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <EditIcon fontSize="small" className="!w-4 text-blue-500" />
                  </IconButton>
                </Box>
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
  allowances: AllowancesSettings,
  deductions: DeductionRulesSettings,
  tax: TaxRulesSettings,
  "pf-esi": PFESISettings,
  schedule: ScheduleSettings,
  approval: ApprovalWorkflowSettings,
};

// ==================== MAIN COMPONENT ====================

export default function PayrollSettings() {
  const { tab = "allowances" } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: any = await payrollService.getPayrollSettings();

        if (response.success) {
          setSettings(response.data);
        } else {
          setError(response.message || 'Failed to fetch settings');
        }
      } catch (error: any) {
        console.error('Failed to fetch payroll settings:', error);
        setError(error?.message || 'An error occurred while fetching settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (updatedSettings: Partial<PayrollSettings>) => {
    try {
      setSaving(true);
      setError(null);
      const response: any = await payrollService.updatePayrollSettings(updatedSettings);

      if (response.success) {
        setSettings(response.data);
        setSuccessMessage('Settings saved successfully!');
      } else {
        setError(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Failed to update payroll settings:', error);
      setError(error?.message || 'An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setError(null);
  };

  const Content = contentMap[tab] ?? AllowancesSettings;

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', my: 3 }}>
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
                  const active = tab === item.id;
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
                      <Box sx={{ flex: 1, textAlign: "left" }} className={active ? 'text-black' : 'text-gray-800'}>
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
          <Content 
            settings={settings} 
            onSave={handleSaveSettings} 
            saving={saving}
          />
        </Box>
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!successMessage || !!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
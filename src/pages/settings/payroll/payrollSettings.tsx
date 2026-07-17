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
  Paper,
  Chip,
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
} from "@mui/material";
import {
  Dashboard as BoxesIcon,
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
} from "@mui/icons-material";

const NAV_ITEMS = [
  { id: "components", label: "Salary Components", icon: BoxesIcon },
  { id: "allowances", label: "Allowances Configuration", icon: LayersIcon },
  { id: "deductions", label: "Deduction Rules", icon: MinusCircleIcon },
  { id: "tax", label: "Tax Rules", icon: FileStackIcon },
  { id: "pf-esi", label: "PF / ESI Settings", icon: UsersIcon },
  { id: "schedule", label: "Payroll Schedule", icon: CalendarIcon },
  { id: "approval", label: "Approval Workflow", icon: ListOrderedIcon },
];

const salaryComponentSettings = [
  { name: "Basic Salary", code: "BASIC", type: "Earning", affectsGross: true, affectsPF: true, affectsESI: false, taxable: true, active: true },
  { name: "House Rent Allowance", code: "HRA", type: "Earning", affectsGross: true, affectsPF: false, affectsESI: false, taxable: true, active: true },
  { name: "Conveyance Allowance", code: "CONV", type: "Earning", affectsGross: true, affectsPF: false, affectsESI: false, taxable: false, active: true },
  { name: "Special Allowance", code: "SPECIAL", type: "Earning", affectsGross: true, affectsPF: false, affectsESI: false, taxable: true, active: true },
  { name: "Medical Allowance", code: "MEDICAL", type: "Earning", affectsGross: false, affectsPF: false, affectsESI: false, taxable: false, active: true },
  { name: "Provident Fund", code: "PF", type: "Deduction", affectsGross: false, affectsPF: true, affectsESI: false, taxable: false, active: true },
  { name: "Professional Tax", code: "PT", type: "Deduction", affectsGross: false, affectsPF: false, affectsESI: false, taxable: false, active: true },
];

const allowanceSettings = [
  { name: "House Rent Allowance", basis: "50% of Basic (Metro) / 40% (Non-Metro)", limit: "Actual or 50% of Basic", taxExempt: true },
  { name: "Conveyance Allowance", basis: "Fixed ₹1,600/month", limit: "₹19,200/year", taxExempt: true },
  { name: "Medical Allowance", basis: "Fixed ₹1,250/month", limit: "₹15,000/year", taxExempt: true },
  { name: "LTA (Leave Travel)", basis: "Actuals as submitted", limit: "2 journeys in 4 years", taxExempt: true },
  { name: "Special Allowance", basis: "Balancing component", limit: "Fully taxable", taxExempt: false },
];

const deductionRules = [
  { name: "Provident Fund", applicability: "Salary ≤ ₹15,000 Basic (Mandatory)", rate: "12% of Basic", cap: "₹1,800/month", employer: "12% of Basic" },
  { name: "Professional Tax", applicability: "All employees", rate: "Slab based", cap: "₹2,500/year", employer: "N/A" },
  { name: "ESIC", applicability: "Gross ≤ ₹21,000/month", rate: "0.75% of Gross", cap: "None", employer: "3.25% of Gross" },
  { name: "Income Tax (TDS)", applicability: "Income > exemption limit", rate: "Slab based", cap: "None", employer: "N/A" },
];

const approvalSteps = [
  { step: 1, role: "Payroll Administrator", action: "Generate Payroll", sla: "2 days", active: true },
  { step: 2, role: "Finance Manager", action: "Review & Verify", sla: "1 day", active: true },
  { step: 3, role: "HR Manager", action: "Final Approval", sla: "1 day", active: true },
  { step: 4, role: "System", action: "Bank Transfer Initiation", sla: "Auto", active: true },
];

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
        bgcolor: value ? "success.light" : "grey.100",
      }}
    >
      {value ? (
        <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
      ) : (
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "grey.400" }} />
      )}
    </Box>
  );
};

const SalaryComponentsSettings = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Salary Components
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Configure which components affect gross, PF, ESI, and tax calculations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon fontSize="small" />}
          sx={{ textTransform: "none" }}
        >
          Add Component
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Component</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Type</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Affects Gross</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Affects PF</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Affects ESI</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Taxable</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Active</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salaryComponentSettings.map((c) => (
              <TableRow key={c.code} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {c.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={c.code} size="small" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={c.type}
                    size="small"
                    sx={{
                      bgcolor: c.type === "Earning" ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                      color: c.type === "Earning" ? "success.main" : "error.main",
                      fontSize: "0.7rem",
                    }}
                  />
                </TableCell>
                <TableCell align="center"><BoolDot value={c.affectsGross} /></TableCell>
                <TableCell align="center"><BoolDot value={c.affectsPF} /></TableCell>
                <TableCell align="center"><BoolDot value={c.affectsESI} /></TableCell>
                <TableCell align="center"><BoolDot value={c.taxable} /></TableCell>
                <TableCell align="center"><BoolDot value={c.active} /></TableCell>
                <TableCell align="center">
                  <Stack direction="row">
                    <IconButton
                      size="small"
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.08) },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

const AllowancesSettings = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Allowances Configuration
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Configure allowance rules, limits, and tax exemption eligibility
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Allowance</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Calculation Basis</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Exemption Limit</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Tax Exempt</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allowanceSettings.map((a) => (
              <TableRow key={a.name} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {a.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {a.basis}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{a.limit}</Typography>
                </TableCell>
                <TableCell align="center"><BoolDot value={a.taxExempt} /></TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

const DeductionRulesSettings = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Deduction Rules
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Statutory and custom deduction rules with employee/employer contributions
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Deduction</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Applicability</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Employee Rate</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Employer Contribution</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Cap</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deductionRules.map((d) => (
              <TableRow key={d.name} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {d.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {d.applicability}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "error.main", fontWeight: 500 }}>
                    {d.rate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {d.employer}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{d.cap}</Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

const TaxRulesSettings = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Tax Rules (Income Tax / TDS)
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Configure tax regime, slabs, and computation rules for FY 2026-27
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Default Tax Regime
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  {["New Regime", "Old Regime"].map((r) => (
                    <Button
                      key={r}
                      variant={r === "New Regime" ? "contained" : "outlined"}
                      fullWidth
                      sx={{
                        textTransform: "none",
                        py: 1.5,
                        ...(r === "New Regime" && { bgcolor: "primary.main" }),
                      }}
                    >
                      {r}
                    </Button>
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Employees can opt for a different regime during investment declaration.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                TDS Computation
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { label: "Projection Method", value: "Annualized" },
                  { label: "Declaration Consideration", value: "Enabled" },
                  { label: "Perquisite Tax", value: "Disabled" },
                ].map((s) => (
                  <Box key={s.label} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {s.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {s.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            New Regime Tax Slabs (FY 2026-27)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                    Income Range
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                    Tax Rate
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  ["Up to ₹3,00,000", "Nil"],
                  ["₹3,00,001 – ₹6,00,000", "5%"],
                  ["₹6,00,001 – ₹9,00,000", "10%"],
                  ["₹9,00,001 – ₹12,00,000", "15%"],
                  ["₹12,00,001 – ₹15,00,000", "20%"],
                  ["Above ₹15,00,000", "30%"],
                ].map(([range, rate]) => (
                  <TableRow key={range} hover>
                    <TableCell>
                      <Typography variant="body2">{range}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                        {rate}
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

const PFESISettings = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          PF / ESI Settings
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Configure Provident Fund and Employee State Insurance parameters
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "info.main", mb: 2 }}>
                Provident Fund (EPF)
              </Typography>
              <Stack spacing={2}>
                {[
                  { label: "Employee Contribution", value: "12%", desc: "Of Basic + DA" },
                  { label: "Employer Contribution", value: "12%", desc: "Of Basic + DA" },
                  { label: "EPS (Out of Employer)", value: "8.33%", desc: "Capped at ₹1,250" },
                  { label: "EDLI Contribution", value: "0.5%", desc: "Employer only" },
                  { label: "PF Admin Charges", value: "0.5%", desc: "Employer only" },
                  { label: "Wage Ceiling", value: "₹15,000", desc: "For mandatory coverage" },
                ].map((f) => (
                  <Box key={f.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {f.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {f.desc}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "info.main" }}>
                      {f.value}
                    </Typography>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Voluntary PF
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Allow employees to contribute beyond 12%
                    </Typography>
                  </Box>
                  <Switch />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.3)}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "success.main", mb: 2 }}>
                Employee State Insurance (ESI)
              </Typography>
              <Stack spacing={2}>
                {[
                  { label: "Employee Contribution", value: "0.75%", desc: "Of Gross Salary" },
                  { label: "Employer Contribution", value: "3.25%", desc: "Of Gross Salary" },
                  { label: "Wage Ceiling", value: "₹21,000", desc: "Monthly gross limit" },
                  { label: "ESI Code", value: "31000000000000000", desc: "Establishment code" },
                ].map((f) => (
                  <Box key={f.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {f.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {f.desc}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                      {f.value}
                    </Typography>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      ESI Enabled
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      For eligible employees
                    </Typography>
                  </Box>
                  <Switch defaultChecked />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

const ScheduleSettings = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Payroll Schedule
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Configure processing timelines and payment dates
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Processing Schedule
              </Typography>
              <Stack spacing={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payroll Frequency</InputLabel>
                  <Select defaultValue="monthly" label="Payroll Frequency">
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-Weekly</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Attendance Cutoff Date
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField type="number" defaultValue={26} size="small" sx={{ width: 80 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      of each month
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Salary Payment Date
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField type="number" defaultValue={5} size="small" sx={{ width: 80 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      of next month
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Processing Start Date
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField type="number" defaultValue={1} size="small" sx={{ width: 80 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      of next month
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Auto-Sync Features
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: "Auto-fetch Attendance", desc: "From attendance module", enabled: true },
                  { label: "Auto-apply Leaves", desc: "Calculate LOP automatically", enabled: true },
                  { label: "Auto-include New Joiners", desc: "Pro-rated for joining date", enabled: true },
                  { label: "Auto-apply Salary Revisions", desc: "Effective from revision date", enabled: false },
                  { label: "Email Payslips", desc: "Send to employee email after processing", enabled: false },
                  { label: "Bank File Export", desc: "Auto-generate NEFT/RTGS file", enabled: true },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1.5,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {s.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {s.desc}
                      </Typography>
                    </Box>
                    <Switch defaultChecked={s.enabled} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon fontSize="small" />}
          sx={{ textTransform: "none" }}
          onClick={() => console.log("Schedule settings saved!")}
        >
          Save Settings
        </Button>
      </Box>
    </Stack>
  );
};

const ApprovalWorkflowSettings = () => {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Approval Workflow
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Define the multi-level approval chain for payroll processing
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch defaultChecked />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Approval Required
          </Typography>
        </Box>
      </Box>

      <Stack spacing={2}>
        {approvalSteps.map((s, i) => (
          <Box key={s.step} sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                {s.step}
              </Box>
              {i < approvalSteps.length - 1 && (
                <Box sx={{ width: 2, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.2) }} />
              )}
            </Box>
            <Card sx={{ flex: 1, borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {s.action}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Role: <strong>{s.role}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      SLA
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {s.sla}
                    </Typography>
                  </Box>
                  <Switch defaultChecked={s.active} />
                  <IconButton
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <EditIcon fontSize="small" />
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

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon fontSize="small" />}
          sx={{ textTransform: "none" }}
          onClick={() => console.log("Workflow settings saved!")}
        >
          Save Workflow
        </Button>
      </Box>
    </Stack>
  );
};

const contentMap: Record<string, React.ComponentType> = {
  components: SalaryComponentsSettings,
  allowances: AllowancesSettings,
  deductions: DeductionRulesSettings,
  tax: TaxRulesSettings,
  "pf-esi": PFESISettings,
  schedule: ScheduleSettings,
  approval: ApprovalWorkflowSettings,
};

export default function PayrollSettings() {
  const { tab = "components" } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const Content = contentMap[tab] ?? SalaryComponentsSettings;

  return (
    <Box sx={{ display: "flex", height: "100%", p: 3, gap: 3 }}>
      {/* Left Nav */}
      <Box sx={{ width: 240, flexShrink: 0 }}>
        <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "text.secondary",
                px: 1.5,
                display: "block",
                mb: 1,
              }}
            >
              Settings
            </Typography>
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
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      borderRadius: 1,
                      textTransform: "none",
                      fontSize: "0.85rem",
                      fontWeight: active ? 600 : 400,
                      color: active ? "primary.main" : "text.secondary",
                      bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                      "&:hover": {
                        bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <item.icon sx={{ fontSize: 18, color: active ? "primary.main" : "text.secondary" }} />
                    <Box sx={{ flex: 1, textAlign: "left" }}>{item.label}</Box>
                    {active && <ChevronRightIcon sx={{ fontSize: 14, color: "primary.main" }} />}
                  </Button>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Content />
      </Box>
    </Box>
  );
}
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Alert,
  Tooltip,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { type PolicyTemplate, type PolicyConfig, type EntitlementConfig } from '../../../types/policy';

interface Step2ConfigureRulesProps {
  template: PolicyTemplate;
  config: PolicyConfig | null;
  onChange: (config: PolicyConfig) => void;
}

const EXPENSE_CATEGORIES = ['TRAVEL', 'FOOD', 'ACCOMMODATION', 'EQUIPMENT', 'STATIONERY', 'OTHER'];

export const Step2ConfigureRules: React.FC<Step2ConfigureRulesProps> = ({
  template,
  config,
  onChange,
}) => {
  const [localConfig, setLocalConfig] = useState<PolicyConfig>(
    config || (template.defaultConfig as PolicyConfig)
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const handleConfigChange = (path: string, value: any) => {
    const newConfig = { ...localConfig };
    const keys = path.split('.');
    let current: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const set = (path: string, value: any) => handleConfigChange(path, value);

  const helperSx = { '& .MuiFormHelperText-root': { color: 'var(--text-primary)' } };

  // ── Leave Entitlements ────────────────────────────────────────────────────────

  const handleLeaveTypeChange = (index: number, field: keyof EntitlementConfig, value: any) => {
    const updated = [...(localConfig.entitlements || [])];
    updated[index] = { ...updated[index], [field]: value };
    set('entitlements', updated);
  };

  const addLeaveType = () => {
    const blank: EntitlementConfig = {
      leaveType: '', name: '', annualEntitlement: 0,
      accrualType: 'YEARLY', allowedDuringProbation: false, requiresDocument: false,
    };
    set('entitlements', [...(localConfig.entitlements || []), blank]);
  };

  const removeLeaveType = (index: number) => {
    const updated = [...(localConfig.entitlements || [])];
    updated.splice(index, 1);
    set('entitlements', updated);
  };

  // ── Renderers ─────────────────────────────────────────────────────────────────

  const renderLeaveEntitlements = () => (
    <Box>
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="subtitle1">Leave Types & Entitlements</Typography>
        <Tooltip title="Add leave type">
          <IconButton onClick={addLeaveType} color="primary" size="small">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {(localConfig.entitlements || []).map((leave, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box className="flex items-center justify-between mb-1">
              <Typography variant="subtitle2">Leave Type {index + 1}</Typography>
              <IconButton size="small" onClick={() => removeLeaveType(index)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth size="small" label="Leave Code"
                  value={leave.leaveType}
                  onChange={(e) => handleLeaveTypeChange(index, 'leaveType', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField fullWidth size="small" label="Leave Name"
                  value={leave.name}
                  onChange={(e) => handleLeaveTypeChange(index, 'name', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth size="small" type="number" label="Annual Days"
                  value={leave.annualEntitlement}
                  onChange={(e) => handleLeaveTypeChange(index, 'annualEntitlement', parseInt(e.target.value) || 0)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Accrual</InputLabel>
                  <Select value={leave.accrualType} label="Accrual"
                    onChange={(e) => handleLeaveTypeChange(index, 'accrualType', e.target.value)}>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    <MenuItem value="YEARLY">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth size="small" type="number" label="Max Consecutive"
                  value={leave.maxConsecutiveDays || ''}
                  onChange={(e) => handleLeaveTypeChange(index, 'maxConsecutiveDays', parseInt(e.target.value) || undefined)} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!leave.requiresDocument}
                    onChange={(e) => handleLeaveTypeChange(index, 'requiresDocument', e.target.checked)} />}
                  label="Requires Document" />
              </Grid>
              {leave.requiresDocument && (
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" type="number" label="Doc after days"
                    value={leave.documentAfterDays || ''}
                    onChange={(e) => handleLeaveTypeChange(index, 'documentAfterDays', parseInt(e.target.value) || undefined)}
                    helperText="Require doc after N days of absence" sx={helperSx} />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!leave.allowedDuringProbation}
                    onChange={(e) => handleLeaveTypeChange(index, 'allowedDuringProbation', e.target.checked)} />}
                  label="Allowed During Probation" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!leave.halfDayAllowed}
                    onChange={(e) => handleLeaveTypeChange(index, 'halfDayAllowed', e.target.checked)} />}
                  label="Half Day Allowed" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!leave.advanceLeaveAllowed}
                    onChange={(e) => handleLeaveTypeChange(index, 'advanceLeaveAllowed', e.target.checked)} />}
                  label="Advance Leave Allowed" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!leave.encashable}
                    onChange={(e) => handleLeaveTypeChange(index, 'encashable', e.target.checked)} />}
                  label="Encashable" />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField fullWidth size="small" type="number" label="Min Service (months)"
                  value={leave.minimumServiceMonths ?? ''}
                  onChange={(e) => handleLeaveTypeChange(index, 'minimumServiceMonths', parseInt(e.target.value) || undefined)}
                  helperText="Required service before first use" sx={helperSx} />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender Restriction</InputLabel>
                  <Select value={leave.genderRestricted ?? ''} label="Gender Restriction"
                    onChange={(e) => handleLeaveTypeChange(index, 'genderRestricted', e.target.value || null)}>
                    <MenuItem value="">No Restriction</MenuItem>
                    <MenuItem value="FEMALE">Female Only (e.g. Maternity)</MenuItem>
                    <MenuItem value="MALE">Male Only (e.g. Paternity)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      {(!localConfig.entitlements || localConfig.entitlements.length === 0) && (
        <Alert severity="info" action={<Button color="info" size="small" onClick={addLeaveType}>Add</Button>}>
          No leave types configured. Click "Add" to create leave types.
        </Alert>
      )}
    </Box>
  );

  const renderAccrualRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.accrualRules?.enableProRata}
            onChange={(e) => set('accrualRules.enableProRata', e.target.checked)} />}
          label="Enable Pro-rata Accrual" />
        <Typography variant="caption">
          Leave accrual is proportional to joining date in first year
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.accrualRules?.carryForwardUnused}
            onChange={(e) => set('accrualRules.carryForwardUnused', e.target.checked)} />}
          label="Carry Forward Unused Leave" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Accrual Frequency</InputLabel>
          <Select value={localConfig.accrualRules?.accrualFrequency || 'MONTHLY'} label="Accrual Frequency"
            onChange={(e) => set('accrualRules.accrualFrequency', e.target.value)}>
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="QUARTERLY">Quarterly</MenuItem>
            <MenuItem value="YEARLY">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Max Accrual (Days)"
          value={localConfig.accrualRules?.maxAccrual || ''}
          onChange={(e) => set('accrualRules.maxAccrual', parseInt(e.target.value) || undefined)}
          helperText="Cap on total accrued balance" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Leave Year Starts In</InputLabel>
          <Select value={localConfig.accrualRules?.leaveYearStartMonth ?? 1} label="Leave Year Starts In"
            onChange={(e) => set('accrualRules.leaveYearStartMonth', Number(e.target.value))}>
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => (
              <MenuItem key={i+1} value={i+1}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.accrualRules?.resetOnYearEnd}
            onChange={(e) => set('accrualRules.resetOnYearEnd', e.target.checked)} />}
          label="Reset Balance on Year End" />
        <Typography variant="caption">
          If off, unused balance carries forward (subject to carry-forward rules)
        </Typography>
      </Grid>
    </Grid>
  );

  const renderCarryForward = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Max Carry Forward (Days)"
          value={localConfig.carryForward?.maxDays || ''}
          onChange={(e) => set('carryForward.maxDays', parseInt(e.target.value))} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Valid Until (Months into next year)"
          value={localConfig.carryForward?.validUntilMonths || ''}
          onChange={(e) => set('carryForward.validUntilMonths', parseInt(e.target.value))} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.carryForward?.allowEncashment}
            onChange={(e) => set('carryForward.allowEncashment', e.target.checked)} />}
          label="Allow Encashment" />
      </Grid>
      {localConfig.carryForward?.allowEncashment && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" type="number" label="Encashment Rate (%)"
            value={localConfig.carryForward?.encashmentRate || ''}
            onChange={(e) => set('carryForward.encashmentRate', parseInt(e.target.value))}
            helperText="% of basic salary per day" sx={helperSx} />
        </Grid>
      )}
    </Grid>
  );

  const renderSandwichRule = () => (
    <Box>
      <FormControlLabel
        control={<Switch checked={!!localConfig.sandwichRule?.enabled}
          onChange={(e) => set('sandwichRule.enabled', e.target.checked)} />}
        label="Enable Sandwich Rule" />
      <Typography sx={{ mb: 1 }}>
        Weekends / holidays between leave days are counted as leave days
      </Typography>
      {localConfig.sandwichRule?.enabled && (
        <Box sx={{ ml: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Switch checked={!!localConfig.sandwichRule?.includeWeekends}
                  onChange={(e) => set('sandwichRule.includeWeekends', e.target.checked)} />}
                label="Include Weekends" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Switch checked={!!localConfig.sandwichRule?.includeHolidays}
                  onChange={(e) => set('sandwichRule.includeHolidays', e.target.checked)} />}
                label="Include Holidays" />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );

  // ── Overtime Rules ────────────────────────────────────────────────────────────

  const renderOvertimeRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max OT Hours / Day"
          value={localConfig.overtimeRules?.maxHoursPerDay ?? ''}
          onChange={(e) => set('overtimeRules.maxHoursPerDay', parseFloat(e.target.value) || 0)}
          helperText="Legal daily OT cap" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max OT Hours / Month"
          value={localConfig.overtimeRules?.maxHoursPerMonth ?? ''}
          onChange={(e) => set('overtimeRules.maxHoursPerMonth', parseFloat(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Weekday Rate Multiplier"
          value={localConfig.overtimeRules?.weekdayMultiplier ?? ''}
          onChange={(e) => set('overtimeRules.weekdayMultiplier', parseFloat(e.target.value) || 1)}
          helperText="e.g. 1.5 = 1.5× basic" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Weekend Rate Multiplier"
          value={localConfig.overtimeRules?.weekendMultiplier ?? ''}
          onChange={(e) => set('overtimeRules.weekendMultiplier', parseFloat(e.target.value) || 1)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Holiday Rate Multiplier"
          value={localConfig.overtimeRules?.holidayMultiplier ?? ''}
          onChange={(e) => set('overtimeRules.holidayMultiplier', parseFloat(e.target.value) || 1)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Compensation Type</InputLabel>
          <Select value={localConfig.overtimeRules?.compensationType || 'COMP_OFF_OR_PAY'}
            label="Compensation Type"
            onChange={(e) => set('overtimeRules.compensationType', e.target.value)}>
            <MenuItem value="PAY">Cash Pay Only</MenuItem>
            <MenuItem value="COMP_OFF">Comp-off Only</MenuItem>
            <MenuItem value="COMP_OFF_OR_PAY">Employee's Choice (Pay or Comp-off)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.overtimeRules?.requiresManagerApproval}
            onChange={(e) => set('overtimeRules.requiresManagerApproval', e.target.checked)} />}
          label="Requires Manager Approval" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="OT Eligible After Work Hours"
          value={localConfig.overtimeRules?.overtimeEligibleAfterHours ?? ''}
          onChange={(e) => set('overtimeRules.overtimeEligibleAfterHours', parseFloat(e.target.value) || undefined)}
          helperText="Must work these hours before OT starts" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max OT Hours / Week"
          value={localConfig.overtimeRules?.weeklyOTLimit ?? ''}
          onChange={(e) => set('overtimeRules.weeklyOTLimit', parseFloat(e.target.value) || undefined)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Comp-off Valid For (days)"
          value={localConfig.overtimeRules?.compOffValidityDays ?? ''}
          onChange={(e) => set('overtimeRules.compOffValidityDays', parseInt(e.target.value) || undefined)}
          helperText="Days before comp-off expires" sx={helperSx} />
      </Grid>
    </Grid>
  );

  // ── Shift / Attendance Rules ──────────────────────────────────────────────────

  const renderShiftRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Timing</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Grace Time (min)"
          value={localConfig.shiftConfig?.graceTimeMinutes ?? ''}
          onChange={(e) => set('shiftConfig.graceTimeMinutes', parseInt(e.target.value) || 0)}
          helperText="Late arrival tolerance" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Late Penalty After (min)"
          value={localConfig.shiftConfig?.latePenaltyAfterMinutes ?? ''}
          onChange={(e) => set('shiftConfig.latePenaltyAfterMinutes', parseInt(e.target.value) || 0)}
          helperText="Minutes late before penalty applies" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Half Day (min)"
          value={localConfig.shiftConfig?.halfDayMinutes ?? ''}
          onChange={(e) => set('shiftConfig.halfDayMinutes', parseInt(e.target.value) || 0)}
          helperText="Work duration counted as half day" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Full Day (min)"
          value={localConfig.shiftConfig?.fullDayMinutes ?? ''}
          onChange={(e) => set('shiftConfig.fullDayMinutes', parseInt(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Absence Penalties</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Absent Deduction (days per day)"
          value={localConfig.penalties?.absentDeductionPerDay ?? ''}
          onChange={(e) => set('penalties.absentDeductionPerDay', parseFloat(e.target.value) || 1)}
          helperText="Salary days deducted per absent day" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="LWP After (absent days)"
          value={localConfig.penalties?.lwpAfterDays ?? ''}
          onChange={(e) => set('penalties.lwpAfterDays', parseInt(e.target.value) || 0)}
          helperText="Mark LWP after this many consecutive absent days" sx={helperSx} />
      </Grid>
    </Grid>
  );

  // ── Rotation Rules ────────────────────────────────────────────────────────────

  const renderRotationRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Rotation Cycle (weeks)"
          value={localConfig.rotationWeeks ?? ''}
          onChange={(e) => set('rotationWeeks', parseInt(e.target.value) || 0)}
          helperText="How many weeks before the rotation repeats" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Min Gap Between Shifts (hours)"
          value={localConfig.minGapBetweenShifts ?? ''}
          onChange={(e) => set('minGapBetweenShifts', parseInt(e.target.value) || 0)}
          helperText="Mandatory rest before the next shift" sx={helperSx} />
      </Grid>
    </Grid>
  );

  // ── Expense Limits ────────────────────────────────────────────────────────────

  const renderExpenseLimits = () => (
    <Box>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Daily Limit (₹)</strong></TableCell>
              <TableCell><strong>Monthly Limit (₹)</strong></TableCell>
              <TableCell><strong>Requires Receipt</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {EXPENSE_CATEGORIES.map((cat) => {
              const limits = localConfig.expenseLimits?.[cat] || {};
              return (
                <TableRow key={cat}>
                  <TableCell>
                    <Chip label={cat} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" sx={{ width: 120 }}
                      value={limits.daily ?? ''}
                      onChange={(e) => set(`expenseLimits.${cat}.daily`, parseFloat(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" sx={{ width: 120 }}
                      value={limits.monthly ?? ''}
                      onChange={(e) => set(`expenseLimits.${cat}.monthly`, parseFloat(e.target.value) || 0)} />
                  </TableCell>
                  <TableCell>
                    <Switch size="small" checked={!!limits.requiresReceipt}
                      onChange={(e) => set(`expenseLimits.${cat}.requiresReceipt`, e.target.checked)} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={<Switch checked={!!localConfig.advanceAllowed}
              onChange={(e) => set('advanceAllowed', e.target.checked)} />}
            label="Allow Expense Advance" />
        </Grid>
        {localConfig.advanceAllowed && (
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth size="small" type="number" label="Max Advance Amount (₹)"
              value={localConfig.maxAdvanceAmount ?? ''}
              onChange={(e) => set('maxAdvanceAmount', parseFloat(e.target.value) || 0)} />
          </Grid>
        )}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" type="number" label="Settlement Days"
            value={localConfig.settlementDays ?? ''}
            onChange={(e) => set('settlementDays', parseInt(e.target.value) || 0)}
            helperText="Days to settle advance after trip" sx={helperSx} />
        </Grid>
      </Grid>
    </Box>
  );

  // ── Payroll Rules ─────────────────────────────────────────────────────────────

  const renderPayrollRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Salary Components (% of CTC or Basic)</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Basic (%)"
          value={localConfig.payrollComponents?.basic?.percentage ?? ''}
          onChange={(e) => set('payrollComponents.basic.percentage', parseFloat(e.target.value) || 0)}
          helperText="% of CTC" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="HRA (%)"
          value={localConfig.payrollComponents?.hra?.percentage ?? ''}
          onChange={(e) => set('payrollComponents.hra.percentage', parseFloat(e.target.value) || 0)}
          helperText="% of Basic" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="DA (%)"
          value={localConfig.payrollComponents?.da?.percentage ?? ''}
          onChange={(e) => set('payrollComponents.da.percentage', parseFloat(e.target.value) || 0)}
          helperText="% of Basic" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="OT Rate Multiplier"
          value={localConfig.overtimeMultiplier ?? ''}
          onChange={(e) => set('overtimeMultiplier', parseFloat(e.target.value) || 1)}
          helperText="e.g. 2.0 for Labour" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Shift Allowance (₹ per shift)</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Morning Shift Allowance"
          value={localConfig.shiftAllowance?.MORNING ?? ''}
          onChange={(e) => set('shiftAllowance.MORNING', parseFloat(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Evening Shift Allowance"
          value={localConfig.shiftAllowance?.EVENING ?? ''}
          onChange={(e) => set('shiftAllowance.EVENING', parseFloat(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Night Shift Allowance"
          value={localConfig.shiftAllowance?.NIGHT ?? ''}
          onChange={(e) => set('shiftAllowance.NIGHT', parseFloat(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Statutory Deductions</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="PF Employee Contribution (%)"
          value={localConfig.pf?.employeeContribution ?? 12}
          onChange={(e) => set('pf.employeeContribution', parseFloat(e.target.value) || 12)}
          helperText="Statutory: 12% of basic" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="PF Employer Contribution (%)"
          value={localConfig.pf?.employerContribution ?? 12}
          onChange={(e) => set('pf.employerContribution', parseFloat(e.target.value) || 12)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="PF Wage Ceiling (₹)"
          value={localConfig.pf?.ceiling ?? 15000}
          onChange={(e) => set('pf.ceiling', parseFloat(e.target.value) || 15000)}
          helperText="PF calculated on min(basic, ceiling)" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="ESI Applicable Below CTC (₹)"
          value={localConfig.esi?.applicableBelowCTC ?? 21000}
          onChange={(e) => set('esi.applicableBelowCTC', parseFloat(e.target.value) || 21000)}
          helperText="ESI applies if gross < this amount" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.professionalTax?.applicable}
            onChange={(e) => set('professionalTax.applicable', e.target.checked)} />}
          label="Professional Tax Applicable" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Gratuity Eligible After (years)"
          value={localConfig.gratuity?.eligibleAfterYears ?? 5}
          onChange={(e) => set('gratuity.eligibleAfterYears', parseInt(e.target.value) || 5)}
          helperText="Statutory: 5 years" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.lwf?.applicable}
            onChange={(e) => set('lwf.applicable', e.target.checked)} />}
          label="LWF Applicable" />
      </Grid>
    </Grid>
  );

  // ── Probation Rules ───────────────────────────────────────────────────────────

  const renderProbationRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Probation Duration (days)"
          value={localConfig.probationDuration ?? ''}
          onChange={(e) => set('probationDuration', parseInt(e.target.value) || 0)}
          helperText="e.g. 90 for 3 months" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.extensionAllowed}
            onChange={(e) => set('extensionAllowed', e.target.checked)} />}
          label="Extension Allowed" />
      </Grid>
      {localConfig.extensionAllowed && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" type="number" label="Max Extension (days)"
            value={localConfig.maxExtensionDays ?? ''}
            onChange={(e) => set('maxExtensionDays', parseInt(e.target.value) || 0)} />
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Review Checkpoints (days)</Typography>
        <Typography variant="caption" color="text.secondary">
          Current: {(localConfig.reviewCheckpoints || [30, 60, 90]).join(', ')} days —
          reviews are triggered at these intervals after joining.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" label="Checkpoint Days (comma separated)"
          value={(localConfig.reviewCheckpoints || [30, 60, 90]).join(', ')}
          onChange={(e) => {
            const vals = e.target.value.split(',').map((v) => parseInt(v.trim())).filter(Boolean);
            set('reviewCheckpoints', vals);
          }}
          helperText="e.g. 30, 60, 90" sx={helperSx} />
      </Grid>
    </Grid>
  );

  // ── Notice Period Rules ───────────────────────────────────────────────────────

  const renderNoticePeriodRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Notice Duration by Grade</Typography>
      </Grid>
      {['DEFAULT', 'MANAGER', 'SENIOR'].map((grade) => (
        <Grid key={grade} size={{ xs: 12, md: 3 }}>
          <TextField fullWidth size="small" type="number" label={`${grade} (days)`}
            value={localConfig.noticeDays?.[grade] ?? ''}
            onChange={(e) => set(`noticeDays.${grade}`, parseInt(e.target.value) || 0)} />
        </Grid>
      ))}
      <Grid size={{ xs: 12 }}>
        <Divider sx={{ my: 1 }} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel
          control={<Switch checked={!!localConfig.buyOutAllowed}
            onChange={(e) => set('buyOutAllowed', e.target.checked)} />}
          label="Notice Period Buy-out Allowed" />
      </Grid>
      {localConfig.buyOutAllowed && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" type="number" label="Buy-out Rate Multiplier"
            value={localConfig.buyOutMultiplier ?? ''}
            onChange={(e) => set('buyOutMultiplier', parseFloat(e.target.value) || 1)}
            helperText="e.g. 1.0 = salary per remaining day" sx={helperSx} />
        </Grid>
      )}
    </Grid>
  );

  const renderGenericConfig = (block: any) => (
    <Alert severity="info">
      <Typography variant="body2">
        <strong>{block.name}</strong> — no dedicated UI for this rule block yet.
        The default config from the template has been pre-loaded and will be saved as-is.
      </Typography>
    </Alert>
  );

  // ── Block router ──────────────────────────────────────────────────────────────

  const renderRuleBlock = (block: any) => {
    switch (block.type) {
      case 'LEAVE_ENTITLEMENTS':  return renderLeaveEntitlements();
      case 'ACCRUAL_RULES':       return renderAccrualRules();
      case 'CARRY_FORWARD':       return renderCarryForward();
      case 'SANDWICH_RULE':       return renderSandwichRule();
      case 'OVERTIME_RULES':      return renderOvertimeRules();
      case 'SHIFT_RULES':         return renderShiftRules();
      case 'ROTATION_RULES':      return renderRotationRules();
      case 'EXPENSE_LIMITS':      return renderExpenseLimits();
      case 'PAYROLL_RULES':       return renderPayrollRules();
      case 'PROBATION_RULES':     return renderProbationRules();
      case 'NOTICE_PERIOD_RULES': return renderNoticePeriodRules();
      default:                    return renderGenericConfig(block);
    }
  };

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Configure Policy Rules</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Customize the rules for <strong>{template.name}</strong>.
        Each section maps to a rule block in your template.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Chip label="Changes auto-saved" size="small" variant="outlined" color="success" />
        {template.domain && (
          <Chip label={template.domain.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ ml: 1 }} />
        )}
        {template.industryType && (
          <Chip label={template.industryType} size="small" variant="outlined" sx={{ ml: 1 }} />
        )}
      </Box>

      {template.ruleBlocks.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This template has no rule blocks defined. Policy will be saved with default configuration.
        </Alert>
      )}

      {template.ruleBlocks.map((block, index) => (
        <Accordion key={block.id} defaultExpanded={index === 0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">{block.name}</Typography>
              {!block.configurable && (
                <Chip label="Read-only" size="small" color="default" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderRuleBlock(block)}
          </AccordionDetails>
        </Accordion>
      ))}

      <Divider sx={{ my: 3 }} />
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="body2">
          You can edit these rules later. Policies are versioned — changes won't affect
          existing records unless you explicitly activate the new version.
        </Typography>
      </Alert>
    </Box>
  );
};

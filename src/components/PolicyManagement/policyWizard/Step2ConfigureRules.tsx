import React, { useEffect, useState } from 'react';
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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { type PolicyConfig, type EntitlementConfig } from '../../../types/policy';
import { EXPENSE_CATEGORIES, helperSx } from '../const';
import { leaveService, type LeaveType } from '../../../services';
import { categoryService } from '../../../services/modules/category';
import { useMasterData } from '../../../hooks/useMasterData';
import type { Step2ConfigureRulesProps } from '../types';

export const Step2ConfigureRules: React.FC<Step2ConfigureRulesProps> = ({
  template,
  config,
  onChange,
}) => {
  const initialConfig = config && Object.keys(config).length > 0
    ? config
    : (template.defaultConfig as PolicyConfig);

  const [localConfig, setLocalConfig] = useState<PolicyConfig>(initialConfig);
  const [leaveType, setLeaveType] = useState<LeaveType[]>([]);
  const [otValues, setOTValues] = useState<any[]>([]);
  const { fetchStatesByCountry } = useMasterData();
  const [states, setStates] = useState<any[]>([]);

  React.useEffect(() => {
    setLocalConfig(initialConfig);
  }, [initialConfig]);

  console.log('Loaded config for template', template.name, localConfig);

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

  // ── Leave Entitlements ────────────────────────────────────────────────────────
  const handleLeaveTypeChange = (index: number, field: keyof EntitlementConfig, value: any) => {
    const updated = [...(localConfig.entitlements || [])];
    if (field === 'leaveType') {
      const selectedLeave = leaveType.find((lt) => lt.code === value);
      updated[index] = {
        ...updated[index],
        leaveType: value,
        name: selectedLeave ? selectedLeave.name : ''
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    set('entitlements', updated);
  };

  const addLeaveType = () => {
    const blank: EntitlementConfig = {
      leaveType: '', name: '', annualEntitlement: 0, accrualType: 'YEARLY',
      allowedDuringProbation: false, requiresDocument: false,
    };
    set('entitlements', [...(localConfig.entitlements || []), blank]);
  };

  const removeLeaveType = (index: number) => {
    const updated = [...(localConfig.entitlements || [])];
    updated.splice(index, 1);
    set('entitlements', updated);
  };

  const getLeaveTypes = async () => {
    try {
      const response = await leaveService.getLeaveTypes({
        page: 0,
        size: 50,
        sort: "name,ASC",
      });
      setLeaveType(response.data?.content ?? []);
    } catch (err: any) {
      console.log(err?.message || "Failed to load leave types", "error");
    }
  };

  const getOTValues = async () => {
    try {
      const response: any = await categoryService.getCategoryItems("3a6987fe-3597-4f87-ab26-2e4c7eab71d9");
      setOTValues(response.data?.content || response.data || []);
    } catch (error: any) {
      console.log(error?.message || "Failed to load OT types", "error");
    }
  }

  const getStates = async () => {
    try {
      const res: any = await fetchStatesByCountry("cc000000-0000-0000-0000-000000000001");
      setStates(res)
    } catch (error: any) {
      console.log(error?.message, "error");
    }
  }

  useEffect(() => {
    if (template.domain == 'LEAVE') {
      getLeaveTypes();
    }
    if (template.domain == 'OVERTIME') {
      getOTValues();
    }
    if (template.domain == 'DEDUCTION') {
      getStates();
    }
  }, [])

  // OT Configurations
  const configs = localConfig.overtimeRules?.configs || [];
  const totalPossibleConfigurations = otValues.length * 2;
  const allConfigurationsUsed = configs.length >= totalPossibleConfigurations;

  const addRow = () => {
    const configs = localConfig.overtimeRules?.configs || [];
    const combinations = ['WEEKDAY', 'HOLIDAY'].flatMap(
      (type) =>
        otValues.map((item) => ({
          otDay: type,
          otCode: item.code,
        }))
    );
    const available = combinations.find(
      (combo) =>
        !configs.some(
          (config) =>
            config.otDay === combo.otDay &&
            config.otCode === combo.otCode
        )
    );
    if (!available) return;
    set('overtimeRules.configs', [
      ...configs,
      {
        ...available,
        multiplier: 0,
        formula: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    const configs = localConfig.overtimeRules?.configs || [];

    set(
      'overtimeRules.configs',
      configs.filter((_, i) => i !== index)
    );
  };

  const updateRow = (
    index: number,
    field: string,
    value: any
  ) => {
    const configs = localConfig.overtimeRules?.configs || [];
    const updated = configs.map((row, i) =>
      i === index
        ? { ...row, [field]: value }
        : row
    );
    set('overtimeRules.configs', updated);
  };

  //Rules Configuration
  const renderLeaveEntitlements = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">Leave Types & Entitlements (as per Indian Labour Laws)</Typography>
        <IconButton onClick={addLeaveType} color="primary" size="small"><AddIcon /></IconButton>
      </Box>
      {(localConfig.entitlements || []).map((leave, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 2 }} className='!border-gray-200'>
          <CardContent className='!bg-white-50 text-gray-800'>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Leave Type {index + 1}</Typography>
              <IconButton size="small" onClick={() => removeLeaveType(index)}><DeleteIcon fontSize="small" className='text-red-500' /></IconButton>
            </Box>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Leave Code</InputLabel>
                  <Select
                    value={leave.leaveType}
                    onChange={(e) => handleLeaveTypeChange(index, 'leaveType', e.target.value)}
                    label="Leave Code"
                  >
                    {leaveType.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {option.code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth label="Leave Name" disabled className='!dark:text-gray-100' value={leave.name} onChange={(e) => handleLeaveTypeChange(index, 'name', e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField fullWidth type="number" label="Annual Days" value={leave.annualEntitlement} onChange={(e) => handleLeaveTypeChange(index, 'annualEntitlement', parseInt(e.target.value) || 0)} />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Accrual</InputLabel>
                  <Select value={leave.accrualType} onChange={(e) => handleLeaveTypeChange(index, 'accrualType', e.target.value)}>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    <MenuItem value="YEARLY">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }} className='!text-center'>
                <FormControlLabel control={<Switch checked={!!leave.allowedDuringProbation} onChange={(e) => handleLeaveTypeChange(index, 'allowedDuringProbation', e.target.checked)} />} label="During Probation" />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }} className='!text-center'>
                <FormControlLabel control={<Switch checked={!!leave.encashable} onChange={(e) => handleLeaveTypeChange(index, 'encashable', e.target.checked)} />} label="Encashable" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      {(!localConfig.entitlements || localConfig.entitlements.length === 0) && (
        <Alert severity="info">No leave types configured. Click Add to create leave types.</Alert>
      )}
    </Box>
  );

  const renderAccrualRules = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Accrual Frequency</InputLabel>
          <Select value={localConfig.accrualRules?.accrualFrequency || 'MONTHLY'} onChange={(e) => set('accrualRules.accrualFrequency', e.target.value)}>
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="QUARTERLY">Quarterly</MenuItem>
            <MenuItem value="YEARLY">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Max Accrual (Days)" value={localConfig.accrualRules?.maxAccrual || ''} onChange={(e) => set('accrualRules.maxAccrual', parseInt(e.target.value) || undefined)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Leave Year Start</InputLabel>
          <Select value={localConfig.accrualRules?.leaveYearStartMonth ?? 4} onChange={(e) => set('accrualRules.leaveYearStartMonth', Number(e.target.value))}>
            {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map((m, i) => (<MenuItem key={i + 1} value={((i + 3) % 12) + 1}>{m}</MenuItem>))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.accrualRules?.enableProRata} onChange={(e) => set('accrualRules.enableProRata', e.target.checked)} />} label="Enable Pro-rata Accrual" />
        <span className='text-gray-500 text-[12px]'>Leave accrual proportional to joining date (as per Indian Labour Laws)</span>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.accrualRules?.carryForwardUnused} onChange={(e) => set('accrualRules.carryForwardUnused', e.target.checked)} />} label="Carry Forward Unused Leave" />
      </Grid>
    </Grid>
  );

  const renderCarryForward = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Max Carry Forward (Days)" value={localConfig.carryForward?.maxDays || 30} onChange={(e) => set('carryForward.maxDays', parseInt(e.target.value) || 0)} helperText="As per Factories Act, max 30 days" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Valid Until (Months)" value={localConfig.carryForward?.validUntilMonths || 3} onChange={(e) => set('carryForward.validUntilMonths', parseInt(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.carryForward?.allowEncashment} onChange={(e) => set('carryForward.allowEncashment', e.target.checked)} />} label="Allow Encashment" />
      </Grid>
    </Grid>
  );

  const renderSandwichRule = () => (
    <Box>
      <FormControlLabel control={<Switch checked={!!localConfig.sandwichRule?.enabled} onChange={(e) => set('sandwichRule.enabled', e.target.checked)} />} label="Enable Sandwich Rule" />
      <span className='text-gray-500 text-[12px]'>Weekends/holidays between leave days counted as leave (Indian courts precedent)</span>
    </Box>
  );

  // ── Overtime Rules (Indian Labour Laws - Factories Act, 1948) ─────────────────
  const renderOvertimeRules = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max OT Hours / Day" value={localConfig.overtimeRules?.maxHoursPerDay ?? 4} onChange={(e) => set('overtimeRules.maxHoursPerDay', parseFloat(e.target.value) || 0)} helperText="Statutory max: 4 hours" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Max OT Hours / Month" value={localConfig.overtimeRules?.maxHoursPerMonth ?? 50} onChange={(e) => set('overtimeRules.maxHoursPerMonth', parseFloat(e.target.value) || 0)} helperText="Statutory max: 50 hours" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Compensation Type</InputLabel>
          <Select value={localConfig.overtimeRules?.compensationType || 'PAY'} onChange={(e) => set('overtimeRules.compensationType', e.target.value)}>
            <MenuItem value="PAY">Cash Payment Only</MenuItem>
            <MenuItem value="COMP_OFF">Compensatory Off</MenuItem>
            <MenuItem value="COMP_OFF_OR_PAY">Employee's Choice</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.overtimeRules?.requiresManagerApproval} onChange={(e) => set('overtimeRules.requiresManagerApproval', e.target.checked)} />} label="Requires Manager Approval" />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="subtitle1" gutterBottom>
          Overtime Rate Configuration
        </Typography>
        <TableContainer className='border border-gray-200 rounded-md pb-2'>
          <Table className=''>
            <TableHead>
              <TableRow>
                <TableCell>OT Day</TableCell>
                <TableCell>OT Value</TableCell>
                <TableCell>Multiplier</TableCell>
                <TableCell>Formula</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" >
                    <div className='!p-4'> No OT Policies found</div>
                  </TableCell>
                </TableRow>
              ) : (
                localConfig.overtimeRules?.configs && localConfig.overtimeRules?.configs.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl>
                        <Select
                          size="small"
                          value={row.otDay}
                          onChange={(e) => {
                            const newType = e.target.value;

                            const duplicateExists =
                              (localConfig.overtimeRules?.configs || []).some(
                                (config, i) =>
                                  i !== index &&
                                  config.otDay === newType &&
                                  config.otCode === row.otCode
                              );
                            if (duplicateExists) {
                              return;
                            }

                            updateRow(index, 'otDay', newType);
                          }}
                        >
                          <MenuItem value="WEEKDAY">
                            Weekday
                          </MenuItem>
                          <MenuItem value="HOLIDAY">
                            Holiday
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <FormControl>
                        <Select
                          size="small"
                          value={row.otCode}
                          onChange={(e) =>
                            updateRow(index, 'otCode', e.target.value)
                          }
                        >
                          {otValues.map((item) => {
                            const alreadyUsed =
                              (localConfig.overtimeRules?.configs || []).some(
                                (config, i) =>
                                  i !== index &&
                                  config.otDay === row.otDay &&
                                  config.otCode === item.code
                              );

                            return (
                              <MenuItem
                                key={item.code}
                                value={item.code}
                                disabled={alreadyUsed}
                              >
                                {item.name}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        slotProps={{
                          htmlInput: {
                            step: 0.5,
                            min: 0,
                          },
                        }}
                        value={row.multiplier}
                        onChange={(e) =>
                          updateRow(
                            index,
                            'multiplier',
                            Number(e.target.value)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={row.formula}
                        onChange={(e) =>
                          updateRow(
                            index,
                            'formula',
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={() => removeRow(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex items-center justify-end  mt-2">
          <Button
            startIcon={<AddIcon />}
            onClick={addRow}
            disabled={allConfigurationsUsed}
            className={`${allConfigurationsUsed ? '' : '!text-primary !border-primary '}`}
            variant='outlined'
          >
            Add OT Configuration
          </Button>
        </div>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Alert severity="info" sx={{ mb: 2 }}>As per Factories Act, 1948 - Overtime at double the ordinary rate of wages</Alert>
      </Grid>
    </Grid>
  );

  // ── Shift & Attendance Rules ─────────────────────────────────────────────────
  // const renderShiftRules = () => (
  //   <Grid container spacing={2}>
  //     <Grid size={{ xs: 12, md: 3 }}>
  //       <TextField fullWidth size="small" type="number" label="Grace Time (min)" value={localConfig.shiftConfig?.graceTimeMinutes ?? 15} onChange={(e) => set('shiftConfig.graceTimeMinutes', parseInt(e.target.value) || 0)} />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 3 }}>
  //       <TextField fullWidth size="small" type="number" label="Late Penalty After (min)" value={localConfig.shiftConfig?.latePenaltyAfterMinutes ?? 30} onChange={(e) => set('shiftConfig.latePenaltyAfterMinutes', parseInt(e.target.value) || 0)} />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 3 }}>
  //       <TextField fullWidth size="small" type="number" label="Half Day (min)" value={localConfig.shiftConfig?.halfDayMinutes ?? 240} onChange={(e) => set('shiftConfig.halfDayMinutes', parseInt(e.target.value) || 0)} />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 3 }}>
  //       <TextField fullWidth size="small" type="number" label="Full Day (min)" value={localConfig.shiftConfig?.fullDayMinutes ?? 480} onChange={(e) => set('shiftConfig.fullDayMinutes', parseInt(e.target.value) || 0)} />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 4 }}>
  //       <FormControlLabel control={<Switch checked={!!localConfig.shiftConfig?.biometricRequired} onChange={(e) => set('shiftConfig.biometricRequired', e.target.checked)} />} label="Biometric Required" />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 4 }}>
  //       <FormControlLabel control={<Switch checked={!!localConfig.shiftConfig?.mobileCheckInAllowed} onChange={(e) => set('shiftConfig.mobileCheckInAllowed', e.target.checked)} />} label="Mobile Check-in Allowed" />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 4 }}>
  //       <TextField fullWidth size="small" type="number" label="Absent Deduction (days)" value={localConfig.penalties?.absentDeductionPerDay ?? 1} onChange={(e) => set('penalties.absentDeductionPerDay', parseFloat(e.target.value) || 1)} />
  //     </Grid>
  //   </Grid>
  // );

  // ── Expense Limits (Indian Tax Norms - Income Tax Act) ───────────────────────
  const renderExpenseLimits = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>As per Income Tax Act, 1961 - Expense reimbursement limits for tax exemption</Alert>
      <TableContainer className='border border-gray-200'>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Category</TableCell>
              <TableCell>Daily Limit (₹)</TableCell>
              <TableCell>Monthly Limit (₹)</TableCell>
              <TableCell>Requires Receipt</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {EXPENSE_CATEGORIES.map((cat) => {
              const limits = localConfig.expenseLimits?.[cat] || {};
              return (
                <TableRow key={cat}>
                  <TableCell><Chip label={cat} size="small" className='!text-gray-800 !bg-gray-100' /></TableCell>
                  <TableCell><TextField size="small" type="number" sx={{
                    width: 100, "& .MuiInputBase-input": {
                      padding: "5px 10px",
                    },
                  }} value={limits.daily ?? ''} onChange={(e) => set(`expenseLimits.${cat}.daily`, parseFloat(e.target.value) || 0)} /></TableCell>
                  <TableCell><TextField size="small" type="number" sx={{
                    width: 100, "& .MuiInputBase-input": {
                      padding: "5px 10px",
                    }
                  }} value={limits.monthly ?? ''} onChange={(e) => set(`expenseLimits.${cat}.monthly`, parseFloat(e.target.value) || 0)} /></TableCell>
                  <TableCell><Switch checked={!!limits.requiresReceipt} onChange={(e) => set(`expenseLimits.${cat}.requiresReceipt`, e.target.checked)} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" type="number" label="Settlement Days" value={localConfig.settlementDays ?? 7} onChange={(e) => set('settlementDays', parseInt(e.target.value) || 0)} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel control={<Switch checked={!!localConfig.perDiemAllowed} onChange={(e) => set('perDiemAllowed', e.target.checked)} />} label="Allow Per Diem" />
        </Grid>
      </Grid>
    </Box>
  );

  // ── Payroll & Statutory Deductions (Indian Labour Laws) ──────────────────────
  const renderPayrollRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Basic (% of CTC)" value={localConfig.payrollComponents?.basic?.percentage ?? 40} onChange={(e) => set('payrollComponents.basic.percentage', parseFloat(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="HRA (% of Basic)" value={localConfig.payrollComponents?.hra?.percentage ?? 40} onChange={(e) => set('payrollComponents.hra.percentage', parseFloat(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>HRA City Type</InputLabel>
          <Select value={localConfig.payrollComponents?.hra?.cityType || 'METRO'} onChange={(e) => set('payrollComponents.hra.cityType', e.target.value)}>
            <MenuItem value="METRO">Metro (50% exemption)</MenuItem>
            <MenuItem value="NON_METRO">Non-Metro (40% exemption)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderStatutoryDeductions = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}><Typography variant="subtitle2" color='info'>PF (Employees' Provident Fund - 12% as per EPF Act)</Typography></Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Employee PF (%)" value={localConfig.pf?.employeeContribution ?? 12} onChange={(e) => set('pf.employeeContribution', parseFloat(e.target.value) || 12)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Employer PF (%)" value={localConfig.pf?.employerContribution ?? 12} onChange={(e) => set('pf.employerContribution', parseFloat(e.target.value) || 12)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="PF Wage Ceiling (₹)" value={localConfig.pf?.ceiling ?? 15000} onChange={(e) => set('pf.ceiling', parseFloat(e.target.value) || 15000)} />
      </Grid>

      <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color='info' sx={{ mt: 1 }}>ESI (Employee State Insurance - as per ESI Act, 1948)</Typography></Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Employee ESI (%)" value={localConfig.esi?.employeeContribution ?? 0.75} onChange={(e) => set('esi.employeeContribution', parseFloat(e.target.value) || 0.75)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Employer ESI (%)" value={localConfig.esi?.employerContribution ?? 3.25} onChange={(e) => set('esi.employerContribution', parseFloat(e.target.value) || 3.25)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="ESI Limit (₹)" value={localConfig.esi?.applicableBelowCTC ?? 21000} onChange={(e) => set('esi.applicableBelowCTC', parseFloat(e.target.value) || 21000)} />
      </Grid>

      <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color='info' sx={{ mt: 1 }}>Professional Tax (State specific)</Typography></Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.professionalTax?.applicable} onChange={(e) => set('professionalTax.applicable', e.target.checked)} />} label="Professional Tax Applicable" />
      </Grid>
      {localConfig.professionalTax?.applicable && (
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>State</InputLabel>
            <Select value={localConfig.professionalTax?.state} onChange={(e) => set('professionalTax.state', e.target.value)}>
              {states.map(s => <MenuItem key={s.id} value={s.id}>{s.name.replace('_', ' ')}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" color='info' sx={{ mt: 1 }}>Gratuity (Payment of Gratuity Act, 1972)</Typography></Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Eligible After (years)" value={localConfig.gratuity?.eligibleAfterYears ?? 5} onChange={(e) => set('gratuity.eligibleAfterYears', parseInt(e.target.value) || 5)} helperText="Statutory: 5 years" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Rate (days/year)" value={localConfig.gratuity?.rate ?? 15} onChange={(e) => set('gratuity.rate', parseInt(e.target.value) || 15)} />
      </Grid>
    </Grid>
  );

  const renderTaxDeductions = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 2 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.tds?.applicable} onChange={(e) => set('tds.applicable', e.target.checked)} />} label="TDS Applicable" />
      </Grid>
      {localConfig.tds?.applicable && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tax Regime</InputLabel>
              <Select value={localConfig.tds?.regime || 'NEW'} onChange={(e) => set('tds.regime', e.target.value)}>
                <MenuItem value="OLD">Old Regime (with deductions)</MenuItem>
                <MenuItem value="NEW">New Regime (lower rates, fewer deductions)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel control={<Switch checked={!!localConfig.tds?.declarationRequired} onChange={(e) => set('tds.declarationRequired', e.target.checked)} />} label="Declaration Required" />
          </Grid>
        </>
      )}
    </Grid>
  );

  // ── Probation Rules (Indian Labour Laws - Industrial Employment Act) ─────────
  const renderProbationRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Probation Duration (days)" value={localConfig.probationDuration ?? 90} onChange={(e) => set('probationDuration', parseInt(e.target.value) || 0)} helperText="Standard: 3 months (90 days)" sx={helperSx} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Salary % During Probation" value={localConfig.salaryPercentageDuringProbation ?? 100} onChange={(e) => set('salaryPercentageDuringProbation', parseInt(e.target.value) || 100)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.benefitsEligible} onChange={(e) => set('benefitsEligible', e.target.checked)} />} label="Benefits Eligible" />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.extensionAllowed} onChange={(e) => set('extensionAllowed', e.target.checked)} />} label="Extension Allowed" />
      </Grid>
      {localConfig.extensionAllowed && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth size="small" type="number" label="Max Extension (days)" value={localConfig.maxExtensionDays ?? 90} onChange={(e) => set('maxExtensionDays', parseInt(e.target.value) || 0)} />
        </Grid>
      )}
    </Grid>
  );

  // ── Notice Period Rules (Indian Labour Laws) ─────────────────────────────────
  const renderNoticePeriodRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Default (days)" value={localConfig.noticeDays?.DEFAULT ?? 30} onChange={(e) => set('noticeDays.DEFAULT', parseInt(e.target.value) || 30)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="Manager (days)" value={localConfig.noticeDays?.MANAGER ?? 60} onChange={(e) => set('noticeDays.MANAGER', parseInt(e.target.value) || 60)} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField fullWidth size="small" type="number" label="During Probation (days)" value={localConfig.noticeDuringProbation ?? 7} onChange={(e) => set('noticeDuringProbation', parseInt(e.target.value) || 7)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.buyOutAllowed} onChange={(e) => set('buyOutAllowed', e.target.checked)} />} label="Notice Period Buy-out Allowed" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.gardenLeaveAllowed} onChange={(e) => set('gardenLeaveAllowed', e.target.checked)} />} label="Garden Leave Allowed" />
      </Grid>
    </Grid>
  );

  // ── Comp Off Rules (Indian Labour Laws) ──────────────────────────────────────
  const renderCompOffRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Validity (days)" value={localConfig.compOffValidityDays ?? 90} onChange={(e) => set('compOffValidityDays', parseInt(e.target.value) || 90)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Min OT Hours for Comp-off" value={localConfig.minOTHoursForCompOff ?? 4} onChange={(e) => set('minOTHoursForCompOff', parseFloat(e.target.value) || 4)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Max Balance (days)" value={localConfig.maxCompOffBalance ?? 5} onChange={(e) => set('maxCompOffBalance', parseInt(e.target.value) || 5)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.requiresManagerApproval} onChange={(e) => set('requiresManagerApproval', e.target.checked)} />} label="Requires Manager Approval" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.autoExpireUnused} onChange={(e) => set('autoExpireUnused', e.target.checked)} />} label="Auto-Expire Unused" />
      </Grid>
    </Grid>
  );

  // ── WFH Rules ────────────────────────────────────────────────────────────────
  const renderWFHRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="WFH Days Per Month" value={localConfig.wfhDaysPerMonth ?? 8} onChange={(e) => set('wfhDaysPerMonth', parseInt(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Advance Notice (days)" value={localConfig.advanceNoticeDays ?? 1} onChange={(e) => set('advanceNoticeDays', parseInt(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.requiresManagerApproval} onChange={(e) => set('requiresManagerApproval', e.target.checked)} />} label="Requires Manager Approval" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.geofencingEnabled} onChange={(e) => set('geofencingEnabled', e.target.checked)} />} label="Enable Geofencing" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.eligibleAfterProbation} onChange={(e) => set('eligibleAfterProbation', e.target.checked)} />} label="Eligible After Probation" />
      </Grid>
    </Grid>
  );

  // ── Holiday Rules (Indian holidays - NI Act, 1881) ───────────────────────────
  const renderHolidayRules = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Holiday Types</InputLabel>
          <Select multiple value={localConfig.holidayTypes || ['NATIONAL', 'STATE', 'COMPANY']} onChange={(e) => set('holidayTypes', e.target.value)}>
            <MenuItem value="NATIONAL">National Holidays (3 days)</MenuItem>
            <MenuItem value="STATE">State Holidays</MenuItem>
            <MenuItem value="COMPANY">Company Holidays</MenuItem>
            <MenuItem value="OPTIONAL">Optional Holidays</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField fullWidth size="small" type="number" label="Optional Holiday Quota" value={localConfig.optionalHolidayQuota ?? 2} onChange={(e) => set('optionalHolidayQuota', parseInt(e.target.value) || 0)} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <FormControlLabel control={<Switch checked={!!localConfig.workOnHolidayAllowed} onChange={(e) => set('workOnHolidayAllowed', e.target.checked)} />} label="Work on Holiday Allowed" />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Alert severity="info">As per Negotiable Instruments Act, 1881 - 3 national holidays: Republic Day, Independence Day, Gandhi Jayanti</Alert>
      </Grid>
    </Grid>
  );

  // ── Allowance Rules (Income Tax Act exemptions) ──────────────────────────────
  const renderAllowanceRules = () => {
    const allowances = localConfig.allowances || [
      { type: 'HRA', percentage: 40, basis: 'BASIC', taxExempt: true },
      { type: 'TRANSPORT', fixedAmount: 1600, taxExempt: true },
      { type: 'MEDICAL', fixedAmount: 1250, taxExempt: true },
    ];

    const addAllowance = () => set('allowances', [...allowances, { type: '', taxExempt: false }]);
    const updateAllowance = (index: number, field: string, value: any) => {
      const updated = [...allowances];
      updated[index] = { ...updated[index], [field]: value };
      set('allowances', updated);
    };
    const removeAllowance = (index: number) => {
      const updated = [...allowances];
      updated.splice(index, 1);
      set('allowances', updated);
    };

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>Income Tax Act, 1961 - Allowances with tax exemptions</Alert>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">Allowances</Typography>
          <IconButton onClick={addAllowance} size="small"><AddIcon /></IconButton>
        </Box>
        {allowances.map((allowance, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }} className='!border-gray-200'>
            <CardContent className='!bg-white-50 !border-gray-200'>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" className='!mb-3 text-gray-800'>Allowance {index + 1}</Typography>
                <IconButton size="small" onClick={() => removeAllowance(index)}><DeleteIcon fontSize="small" className='text-red-500' /></IconButton>
              </Box>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth label="Allowance Type" value={allowance.type} onChange={(e) => updateAllowance(index, 'type', e.target.value)} placeholder="HRA, TRANSPORT, MEDICAL" />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Percentage" value={allowance.percentage ?? ''} onChange={(e) => updateAllowance(index, 'percentage', parseFloat(e.target.value) || undefined)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth type="number" label="Fixed Amount (₹)" value={allowance.fixedAmount ?? ''} onChange={(e) => updateAllowance(index, 'fixedAmount', parseFloat(e.target.value) || undefined)} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Basis</InputLabel>
                    <Select value={allowance.basis || ''} onChange={(e) => updateAllowance(index, 'basis', e.target.value)}>
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="BASIC">Basic</MenuItem>
                      <MenuItem value="CTC">CTC</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} className="text-center text-gray-800">
                  <FormControlLabel control={<Switch checked={!!allowance.taxExempt} onChange={(e) => updateAllowance(index, 'taxExempt', e.target.checked)} />} label="Tax Exempt" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  // const renderApprovalFlow = () => (
  //   <Grid container spacing={2}>
  //     <Grid size={{ xs: 12 }}>
  //       <Typography variant="subtitle2">Approval Levels</Typography>
  //       <Alert severity="info" sx={{ mt: 1 }}>Configure approval hierarchy for requests</Alert>
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 4 }}>
  //       <TextField fullWidth size="small" type="number" label="Auto-Approve Below (days)" value={localConfig.approvalFlow?.autoApproveBelowDays ?? 1} onChange={(e) => set('approvalFlow.autoApproveBelowDays', parseInt(e.target.value) || 0)} />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 4 }}>
  //       <FormControlLabel control={<Switch checked={!!localConfig.approvalFlow?.rejectionRequiresReason} onChange={(e) => set('approvalFlow.rejectionRequiresReason', e.target.checked)} />} label="Require Rejection Reason" />
  //     </Grid>
  //     <Grid size={{ xs: 12, md: 4 }}>
  //       <FormControlLabel control={<Switch checked={!!localConfig.approvalFlow?.parallelApproval} onChange={(e) => set('approvalFlow.parallelApproval', e.target.checked)} />} label="Parallel Approval" />
  //     </Grid>
  //   </Grid>
  // );

  const renderRuleBlock = (block: any) => {
    switch (block.type) {
      case 'LEAVE_ENTITLEMENTS': return renderLeaveEntitlements();
      case 'ACCRUAL_RULES': return renderAccrualRules();
      case 'CARRY_FORWARD': return renderCarryForward();
      case 'SANDWICH_RULE': return renderSandwichRule();
      case 'OVERTIME_RULES': return renderOvertimeRules();
      // case 'SHIFT_RULES': return renderShiftRules();
      case 'EXPENSE_LIMITS': return renderExpenseLimits();
      case 'PAYROLL_RULES': return renderPayrollRules();
      case 'STATUTORY_DEDUCTIONS': return renderStatutoryDeductions();
      case 'TAX_DEDUCTIONS': return renderTaxDeductions();
      case 'PROBATION_RULES': return renderProbationRules();
      case 'NOTICE_PERIOD_RULES': return renderNoticePeriodRules();
      case 'COMP_OFF_RULES': return renderCompOffRules();
      case 'WFH_RULES': return renderWFHRules();
      case 'HOLIDAY_RULES': return renderHolidayRules();
      case 'ALLOWANCE_RULES': return renderAllowanceRules();
      // case 'APPROVAL_FLOW': return renderApprovalFlow();
      default: return <Alert severity="info">Configuration for {block.name} coming soon.</Alert>;
    }
  };

  return (
    <Box>
      <div className="flex justify-between items-center">
        <div>
          <Typography variant="h6">Configure Policy Rules</Typography>
          <div className='text-gray-500 text-[12px] mb-2'>
            Customize rules for <strong className='text-primary'>{template.name}</strong> based on Indian Labour Laws and statutory requirements.
          </div>
        </div>
        <Box sx={{ mb: 2 }}>
          <Chip label={template.domain.replace(/_/g, ' ')} size="small" color='info' />
          <Chip label="Changes auto-saved" size="small" color="success" sx={{ ml: 1 }} />
        </Box>
      </div>
      <div>
        {template.ruleBlocks.map((block, index) => (
          <Accordion key={block.id} defaultExpanded={index === 0} className='bg-white-50 border border-gray-200 rounded-md text-gray-800 mb-2'>
            <AccordionSummary expandIcon={<ExpandMoreIcon className='text-gray-800' />}>
              <Typography variant="subtitle1" >{block.name}</Typography>
            </AccordionSummary>
            <AccordionDetails className='!pt-0'>{renderRuleBlock(block)}</AccordionDetails>
          </Accordion>
        ))}
      </div>
      <Alert severity="info" className='mt-3' icon={<InfoIcon />}>All rules comply with Indian Labour Laws, Factories Act, 1948, and Income Tax Act, 1961.</Alert>
    </Box>
  );
};
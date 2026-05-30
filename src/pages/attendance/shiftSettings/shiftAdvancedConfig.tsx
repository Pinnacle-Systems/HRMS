import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse
} from '@mui/material';
import {
  CloseOutlined,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TimerOutlined,
  FreeBreakfastOutlined,
  LunchDiningOutlined,
  ScheduleOutlined,
  BedtimeOutlined
} from '@mui/icons-material';
import { useUI } from '../../../context/Snackbar';
import { shiftService } from '../../../services/modules/shifts';
import type { Shift } from '../../../services/modules/shifts';

interface AdvancedShiftConfig {
  shiftId: string;
  shiftName: string;
  // Grace/Tolerance Times
  graceBeforeCheckIn: number;
  graceAfterCheckIn: number;
  graceBeforeCheckOut: number;
  graceAfterCheckOut: number;

  // Break Settings
  breakTime: number;
  breakAfterHours: number;
  breakIsPaid: boolean;
  allowMultipleBreaks: boolean;
  maxBreaksPerShift: number;
  minBreakInterval: number;

  // Lunch Settings
  lunchDuration: number;
  lunchAfterHours: number;
  lunchIsPaid: boolean;
  lunchGraceBefore: number;
  lunchGraceAfter: number;

  // Overtime Settings
  overtimeBeforeShift: number;
  overtimeAfterShift: number;
  overtimeRate: number;
  requireOvertimeApproval: boolean;

  // Rest Periods
  minRestBetweenShifts: number;
  maxConsecutiveDays: number;
  nightShiftAllowance: number;

  // Other Settings
  lateArrivalThreshold: number;
  earlyDepartureThreshold: number;
  autoBreakDeduction: boolean;
  roundingRule: string;
  roundingInterval: number;
}

interface ShiftAdvancedConfigProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  onSave: () => void;
}

const ExpandableSection = ({ title, icon, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-gray-700 text-sm">{title}</span>
        </div>
        {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </div>
      <Collapse in={isOpen}>
        <div className="p-4 pt-0 border-t border-gray-200">
          {children}
        </div>
      </Collapse>
    </div>
  );
};

export const ShiftAdvancedConfig = ({ open, onClose, shift, onSave }: ShiftAdvancedConfigProps) => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [config, setConfig] = useState<AdvancedShiftConfig>({
    shiftId: shift?.id || '',
    shiftName: shift?.shiftName || '',
    graceBeforeCheckIn: 15,
    graceAfterCheckIn: 5,
    graceBeforeCheckOut: 5,
    graceAfterCheckOut: 15,
    breakTime: shift?.breakTime || 15,
    breakAfterHours: 2,
    breakIsPaid: true,
    allowMultipleBreaks: false,
    maxBreaksPerShift: 2,
    minBreakInterval: 60,
    lunchDuration: 30,
    lunchAfterHours: 4,
    lunchIsPaid: false,
    lunchGraceBefore: 5,
    lunchGraceAfter: 5,
    overtimeBeforeShift: 30,
    overtimeAfterShift: 30,
    overtimeRate: 1.5,
    requireOvertimeApproval: true,
    minRestBetweenShifts: 8,
    maxConsecutiveDays: 6,
    nightShiftAllowance: 20,
    lateArrivalThreshold: 10,
    earlyDepartureThreshold: 10,
    autoBreakDeduction: true,
    roundingRule: 'nearest',
    roundingInterval: 15,
  });

  useEffect(() => {
    if (shift) {
      setConfig({
        shiftId: shift.id,
        shiftName: shift.shiftName,
        graceBeforeCheckIn: (shift as any).graceBeforeCheckIn || 15,
        graceAfterCheckIn: (shift as any).graceAfterCheckIn || 5,
        graceBeforeCheckOut: (shift as any).graceBeforeCheckOut || 5,
        graceAfterCheckOut: (shift as any).graceAfterCheckOut || 15,
        breakTime: shift.breakTime,
        breakAfterHours: (shift as any).breakAfterHours || 2,
        breakIsPaid: (shift as any).breakIsPaid !== undefined ? (shift as any).breakIsPaid : true,
        allowMultipleBreaks: (shift as any).allowMultipleBreaks || false,
        maxBreaksPerShift: (shift as any).maxBreaksPerShift || 2,
        minBreakInterval: (shift as any).minBreakInterval || 60,
        lunchDuration: (shift as any).lunchDuration || 30,
        lunchAfterHours: (shift as any).lunchAfterHours || 4,
        lunchIsPaid: (shift as any).lunchIsPaid || false,
        lunchGraceBefore: (shift as any).lunchGraceBefore || 5,
        lunchGraceAfter: (shift as any).lunchGraceAfter || 5,
        overtimeBeforeShift: (shift as any).overtimeBeforeShift || 30,
        overtimeAfterShift: (shift as any).overtimeAfterShift || 30,
        overtimeRate: (shift as any).overtimeRate || 1.5,
        requireOvertimeApproval: (shift as any).requireOvertimeApproval !== undefined ? (shift as any).requireOvertimeApproval : true,
        minRestBetweenShifts: (shift as any).minRestBetweenShifts || 8,
        maxConsecutiveDays: (shift as any).maxConsecutiveDays || 6,
        nightShiftAllowance: (shift as any).nightShiftAllowance || 20,
        lateArrivalThreshold: (shift as any).lateArrivalThreshold || 10,
        earlyDepartureThreshold: (shift as any).earlyDepartureThreshold || 10,
        autoBreakDeduction: (shift as any).autoBreakDeduction !== undefined ? (shift as any).autoBreakDeduction : true,
        roundingRule: (shift as any).roundingRule || 'nearest',
        roundingInterval: (shift as any).roundingInterval || 15,
      });
    }
  }, [shift]);

  const handleSave = async () => {
    console.log(config);
    try {
      showSpinner();
      //   await shiftService.updateShiftConfig(config.shiftId, config);
      showSnackbar('Advanced configuration saved successfully!', 'success');
      onSave();
      onClose();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save configuration', 'error');
    } finally {
      hideSpinner();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" sx={{
      "& .MuiDialog-paper": {
        width: "800px",
        maxWidth: "90vw",
        maxHeight: "90vh",
      },
    }}>
      <div className="flex items-center p-2 justify-between border-b border-gray-300 sticky top-0 z-10">
        <div className="text-primary ml-4 flex items-center gap-2">
          <SettingsIcon fontSize="small" />
          Advanced Configuration: {config.shiftName}
        </div>
        <IconButton onClick={onClose}>
          <CloseOutlined className="!text-gray-800" />
        </IconButton>
      </div>
      <DialogContent className="!overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
        <div className="space-y-4">
          {/* Grace & Tolerance Times Section */}
          <ExpandableSection
            title="Grace & Tolerance Times"
            icon={<TimerOutlined fontSize="small" className="text-blue-600" />}
            defaultOpen={true}
          >
            <Grid container spacing={4} className="mt-6">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Grace Time Before Check-in"
                  type="number"
                  size="small"
                  value={config.graceBeforeCheckIn}
                  onChange={(e) => setConfig({ ...config, graceBeforeCheckIn: parseInt(e.target.value) || 0 })}
                  helperText="Minutes allowed to arrive late without penalty"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Grace Time After Check-in"
                  type="number"
                  size="small"
                  value={config.graceAfterCheckIn}
                  onChange={(e) => setConfig({ ...config, graceAfterCheckIn: parseInt(e.target.value) || 0 })}
                  helperText="Minutes allowed to complete check-in process"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Grace Time Before Check-out"
                  type="number"
                  size="small"
                  value={config.graceBeforeCheckOut}
                  onChange={(e) => setConfig({ ...config, graceBeforeCheckOut: parseInt(e.target.value) || 0 })}
                  helperText="Minutes allowed to leave early without penalty"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Grace Time After Check-out"
                  type="number"
                  size="small"
                  value={config.graceAfterCheckOut}
                  onChange={(e) => setConfig({ ...config, graceAfterCheckOut: parseInt(e.target.value) || 0 })}
                  helperText="Minutes allowed to delay checkout process"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </ExpandableSection>

          {/* Break Settings Section */}
          <ExpandableSection
            title="Break Settings"
            icon={<FreeBreakfastOutlined fontSize="small" className="text-green-600" />}
          >
            <Grid container spacing={4} className="mt-6">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Break Duration"
                  type="number"
                  size="small"
                  value={config.breakTime}
                  onChange={(e) => setConfig({ ...config, breakTime: parseInt(e.target.value) || 0 })}
                  helperText="Minutes per break"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Break After (Hours)"
                  type="number"
                  size="small"
                  value={config.breakAfterHours}
                  onChange={(e) => setConfig({ ...config, breakAfterHours: parseInt(e.target.value) || 0 })}
                  helperText="Hours worked before break"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.breakIsPaid}
                      onChange={(e) => setConfig({ ...config, breakIsPaid: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Paid Break"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.allowMultipleBreaks}
                      onChange={(e) => setConfig({ ...config, allowMultipleBreaks: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Allow Multiple Breaks"
                />
              </Grid>
              {config.allowMultipleBreaks && (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Maximum Breaks per Shift"
                      type="number"
                      size="small"
                      value={config.maxBreaksPerShift}
                      onChange={(e) => setConfig({ ...config, maxBreaksPerShift: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Minimum Break Interval"
                      type="number"
                      size="small"
                      value={config.minBreakInterval}
                      onChange={(e) => setConfig({ ...config, minBreakInterval: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </ExpandableSection>

          {/* Lunch Settings Section */}
          <ExpandableSection
            title="Lunch & Meal Break Settings"
            icon={<LunchDiningOutlined fontSize="small" className="text-orange-600" />}
          >
            <Grid container spacing={4} className="mt-6">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Lunch Duration"
                  type="number"
                  size="small"
                  value={config.lunchDuration}
                  onChange={(e) => setConfig({ ...config, lunchDuration: parseInt(e.target.value) || 0 })}
                  helperText="Minutes"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Lunch After (Hours)"
                  type="number"
                  size="small"
                  value={config.lunchAfterHours}
                  onChange={(e) => setConfig({ ...config, lunchAfterHours: parseInt(e.target.value) || 0 })}
                  helperText="Hours worked before lunch"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.lunchIsPaid}
                      onChange={(e) => setConfig({ ...config, lunchIsPaid: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Paid Lunch"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Grace Time Before Lunch"
                  type="number"
                  size="small"
                  value={config.lunchGraceBefore}
                  onChange={(e) => setConfig({ ...config, lunchGraceBefore: parseInt(e.target.value) || 0 })}
                  helperText="Minutes allowed to start lunch early"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Grace Time After Lunch"
                  type="number"
                  size="small"
                  value={config.lunchGraceAfter}
                  onChange={(e) => setConfig({ ...config, lunchGraceAfter: parseInt(e.target.value) || 0 })}
                  helperText="Minutes allowed to return from lunch late"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </ExpandableSection>

          {/* Overtime Settings Section */}
          <ExpandableSection
            title="Overtime Settings"
            icon={<ScheduleOutlined fontSize="small" className="text-purple-600" />}
          >
            <Grid container spacing={4} className="mt-6">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Overtime Before Shift"
                  type="number"
                  size="small"
                  value={config.overtimeBeforeShift}
                  onChange={(e) => setConfig({ ...config, overtimeBeforeShift: parseInt(e.target.value) || 0 })}
                  helperText="Minutes early arrival eligible for OT"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Overtime After Shift"
                  type="number"
                  size="small"
                  value={config.overtimeAfterShift}
                  onChange={(e) => setConfig({ ...config, overtimeAfterShift: parseInt(e.target.value) || 0 })}
                  helperText="Minutes late departure eligible for OT"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Overtime Rate"
                  type="number"
                  size="small"
                  value={config.overtimeRate}
                  onChange={(e) => setConfig({ ...config, overtimeRate: parseFloat(e.target.value) || 0 })}
                  helperText="Multiplier (e.g., 1.5 = time and a half)"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.requireOvertimeApproval}
                      onChange={(e) => setConfig({ ...config, requireOvertimeApproval: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Require Approval for Overtime"
                />
              </Grid>
            </Grid>
          </ExpandableSection>

          {/* Rest Periods Section */}
          <ExpandableSection
            title="Rest Periods & Shift Limits"
            icon={<BedtimeOutlined fontSize="small" className="text-indigo-600" />}
          >
            <Grid container spacing={4} className="mt-6">
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Minimum Rest Between Shifts"
                  type="number"
                  size="small"
                  value={config.minRestBetweenShifts}
                  onChange={(e) => setConfig({ ...config, minRestBetweenShifts: parseInt(e.target.value) || 0 })}
                  helperText="Hours required between shifts"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Max Consecutive Days"
                  type="number"
                  size="small"
                  value={config.maxConsecutiveDays}
                  onChange={(e) => setConfig({ ...config, maxConsecutiveDays: parseInt(e.target.value) || 0 })}
                  helperText="Maximum days without a day off"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Night Shift Allowance (%)"
                  type="number"
                  size="small"
                  value={config.nightShiftAllowance}
                  onChange={(e) => setConfig({ ...config, nightShiftAllowance: parseInt(e.target.value) || 0 })}
                  helperText="Additional pay percentage"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </ExpandableSection>

          {/* Other Settings Section */}
          <ExpandableSection
            title="Advanced Configuration"
            icon={<SettingsIcon fontSize="small" className="text-gray-600" />}
          >
            <Grid container spacing={4} className="mt-6">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Late Arrival Threshold"
                  type="number"
                  size="small"
                  value={config.lateArrivalThreshold}
                  onChange={(e) => setConfig({ ...config, lateArrivalThreshold: parseInt(e.target.value) || 0 })}
                  helperText="Minutes after grace period considered late"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Early Departure Threshold"
                  type="number"
                  size="small"
                  value={config.earlyDepartureThreshold}
                  onChange={(e) => setConfig({ ...config, earlyDepartureThreshold: parseInt(e.target.value) || 0 })}
                  helperText="Minutes before end considered early"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rounding Rule</InputLabel>
                  <Select
                    value={config.roundingRule}
                    label="Rounding Rule"
                    onChange={(e) => setConfig({ ...config, roundingRule: e.target.value })}
                  >
                    <MenuItem value="none">No Rounding</MenuItem>
                    <MenuItem value="up">Round Up</MenuItem>
                    <MenuItem value="down">Round Down</MenuItem>
                    <MenuItem value="nearest">Round to Nearest</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Rounding Interval"
                  type="number"
                  size="small"
                  value={config.roundingInterval}
                  onChange={(e) => setConfig({ ...config, roundingInterval: parseInt(e.target.value) || 0 })}
                  helperText="Minutes to round time entries"
                  sx={{
                    '& .MuiFormHelperText-root': {
                      color:'var(--text-primary)'
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.autoBreakDeduction}
                      onChange={(e) => setConfig({ ...config, autoBreakDeduction: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Automatically Deduct Break Time"
                />
              </Grid>
            </Grid>
          </ExpandableSection>
        </div>
      </DialogContent>
      <DialogActions className='!p-4 border-t border-gray-300 sticky bottom-0'>
        <Button variant='outlined' className='!border-gray-300 !text-gray-800' onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" className="!bg-primary">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};
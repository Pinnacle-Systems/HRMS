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
  Collapse,
  Chip,
  Typography,
  Box,
  Alert,
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
  BedtimeOutlined,
  CheckCircleOutlined,
  SelectAll as SelectAllIcon,
} from '@mui/icons-material';
import { useUI } from '../../../context/Snackbar';
import type { EmployeeCategory as EmployeeCategoryType } from '../../../types/policy';
import type { AdvancedShiftConfig, ShiftAdvancedConfigProps, ShiftCategoryConfig } from './types';
import { ALL_CATEGORIES, CATEGORY_COLORS, CATEGORY_DEFAULTS, CATEGORY_LABELS, CATEGORY_SUBLABELS } from './const';

// ─── Expandable Section ───────────────────────────────────────────────────────
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
        <div className="p-4 pt-0 border-t border-gray-200">{children}</div>
      </Collapse>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ShiftAdvancedConfig = ({ open, onClose, shift, onSave }: ShiftAdvancedConfigProps) => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [masterConfig, setMasterConfig] = useState<AdvancedShiftConfig>({
    shiftId: shift?.id || '',
    shiftName: shift?.shiftName || '',
    categoryConfigs: [],
  });
  const [selectedCategories, setSelectedCategories] = useState<EmployeeCategoryType[]>([]);
  const [currentConfig, setCurrentConfig] = useState<ShiftCategoryConfig>(CATEGORY_DEFAULTS.STAFF);

  useEffect(() => {
    if (shift) {
      setMasterConfig({
        shiftId: shift.id,
        shiftName: shift.shiftName,
        categoryConfigs: (shift as any).categoryConfigs || [],
      });
    }
  }, [shift]);

  useEffect(() => {
    if (selectedCategories.length === 0) return;
    const first = selectedCategories[0];
    const existing = masterConfig.categoryConfigs.find((c) => c.type === first);
    setCurrentConfig(existing ?? CATEGORY_DEFAULTS[first]);
  }, [selectedCategories]);

  const toggleCategory = (cat: EmployeeCategoryType) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const toggleSelectAll = () => {
    setSelectedCategories((prev) =>
      prev.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES],
    );
  };

  const isConfigured = (cat: EmployeeCategoryType) =>
    masterConfig.categoryConfigs.some((c) => c.type === cat);

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      showSnackbar('Please select at least one employee category to configure.', 'warning');
      return;
    }
    try {
      showSpinner();
      let updatedConfigs = [...masterConfig.categoryConfigs];
      selectedCategories.forEach((cat) => {
        const idx = updatedConfigs.findIndex((c) => c.type === cat);
        const entry: ShiftCategoryConfig = { ...currentConfig, type: cat };
        if (idx >= 0) {
          updatedConfigs[idx] = entry;
        } else {
          updatedConfigs.push(entry);
        }
      });
      const saved: AdvancedShiftConfig = { ...masterConfig, categoryConfigs: updatedConfigs };
      setMasterConfig(saved);
      console.log('Saved config:', saved);
      // await shiftService.updateShiftConfig(saved.shiftId, saved);
      showSnackbar(
        `Configuration saved for: ${selectedCategories.map((c) => CATEGORY_LABELS[c]).join(', ')}`,
        'success',
      );
      onSave();
      onClose();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save configuration', 'error');
    } finally {
      hideSpinner();
    }
  };

  const set = (fields: Partial<ShiftCategoryConfig>) =>
    setCurrentConfig((prev) => ({ ...prev, ...fields }));

  const helperSx = { '& .MuiFormHelperText-root': { color: 'var(--text-primary)' } };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      sx={{ '& .MuiDialog-paper': { width: '820px', maxWidth: '95vw', maxHeight: '92vh' } }}
    >
      {/* Header */}
      <div className="flex items-center p-3 justify-between border-b border-gray-300 sticky top-0 bg-white z-10">
        <div className="text-primary ml-3 flex items-center gap-2 font-semibold">
          <SettingsIcon fontSize="small" />
          Advanced Configuration — {masterConfig.shiftName}
        </div>
        <IconButton onClick={onClose} size="small">
          <CloseOutlined className="!text-gray-800" />
        </IconButton>
      </div>

      <DialogContent className="!overflow-y-auto" style={{ maxHeight: 'calc(92vh - 130px)' }}>

        {/* ── Step 1: Category Selector ── */}
        <Box sx={{ mb: 3, p: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography component="div" variant="subtitle1" sx={{ fontWeight: 700 }} color="primary">
              Step 1 — Select Employee Category
            </Typography>
            <Button
              size="small"
              variant={selectedCategories.length === ALL_CATEGORIES.length ? 'contained' : 'outlined'}
              startIcon={<SelectAllIcon />}
              onClick={toggleSelectAll}
            >
              {selectedCategories.length === ALL_CATEGORIES.length ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
          <Typography component="div" variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select one or more categories. The configuration below will be saved to all selected categories.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {ALL_CATEGORIES.map((cat) => {
              const selected = selectedCategories.includes(cat);
              const configured = isConfigured(cat);
              return (
                <Box
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selected ? CATEGORY_COLORS[cat] : 'grey.300',
                    borderRadius: 2,
                    p: 1,
                    minWidth: 150,
                    bgcolor: selected ? `${CATEGORY_COLORS[cat]}18` : 'background.paper',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: CATEGORY_COLORS[cat], bgcolor: `${CATEGORY_COLORS[cat]}10` },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Chip
                      label={CATEGORY_LABELS[cat]}
                      size="small"
                      sx={{
                        bgcolor: selected ? CATEGORY_COLORS[cat] : 'grey.200',
                        color: selected ? '#fff' : 'text.secondary',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                    {configured && (
                      <CheckCircleOutlined sx={{ fontSize: 18, color: 'success.main' }} />
                    )}
                  </Box>
                  <Typography component="div" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {CATEGORY_SUBLABELS[cat]}
                  </Typography>
                  {configured && (
                    <Typography component="div" variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                      ✓ Configured
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── No category selected state ── */}
        {selectedCategories.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select one or more employee categories above to begin configuring their shift rules.
          </Alert>
        )}

        {/* ── Step 2: Config sections — shown only when categories are selected ── */}
        {selectedCategories.length > 0 && (
          <>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography component="div" variant="body2" color="text.secondary">
                Configuring for:{' '}
                {selectedCategories.map((cat) => (
                  <Chip
                    key={cat}
                    label={CATEGORY_LABELS[cat]}
                    size="small"
                    sx={{ mr: 0.5, bgcolor: CATEGORY_COLORS[cat], color: '#fff', fontWeight: 600 }}
                  />
                ))}
              </Typography>
              {selectedCategories.length > 1 && (
                <Typography component="div" variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                  Settings shown are loaded from "{CATEGORY_LABELS[selectedCategories[0]]}". Saving will apply to all selected categories.
                </Typography>
              )}
            </Box>

            <div className="space-y-1">

              {/* Grace & Tolerance Times */}
              <ExpandableSection
                title="Grace & Tolerance Times"
                icon={<TimerOutlined fontSize="small" className="text-blue-600" />}
                defaultOpen
              >
                <Grid container spacing={3} className="mt-4">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Grace Before Check-in" type="number" size="small"
                      value={currentConfig.graceBeforeCheckIn}
                      onChange={(e) => set({ graceBeforeCheckIn: parseInt(e.target.value) || 0 })}
                      helperText="Minutes allowed to arrive late without penalty" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Grace After Check-in" type="number" size="small"
                      value={currentConfig.graceAfterCheckIn}
                      onChange={(e) => set({ graceAfterCheckIn: parseInt(e.target.value) || 0 })}
                      helperText="Minutes allowed to complete check-in process" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Grace Before Check-out" type="number" size="small"
                      value={currentConfig.graceBeforeCheckOut}
                      onChange={(e) => set({ graceBeforeCheckOut: parseInt(e.target.value) || 0 })}
                      helperText="Minutes allowed to leave early without penalty" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Grace After Check-out" type="number" size="small"
                      value={currentConfig.graceAfterCheckOut}
                      onChange={(e) => set({ graceAfterCheckOut: parseInt(e.target.value) || 0 })}
                      helperText="Minutes allowed to delay checkout process" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Late Arrival Threshold" type="number" size="small"
                      value={currentConfig.lateArrivalThreshold}
                      onChange={(e) => set({ lateArrivalThreshold: parseInt(e.target.value) || 0 })}
                      helperText="Minutes after grace period to mark as late" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Early Departure Threshold" type="number" size="small"
                      value={currentConfig.earlyDepartureThreshold}
                      onChange={(e) => set({ earlyDepartureThreshold: parseInt(e.target.value) || 0 })}
                      helperText="Minutes before shift end to mark as early departure" sx={helperSx}
                    />
                  </Grid>
                </Grid>
              </ExpandableSection>

              {/* Break Settings */}
              <ExpandableSection
                title="Break Settings"
                icon={<FreeBreakfastOutlined fontSize="small" className="text-green-600" />}
              >
                <Grid container spacing={3} className="mt-4">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Break Duration (min)" type="number" size="small"
                      value={currentConfig.breakTime}
                      onChange={(e) => set({ breakTime: parseInt(e.target.value) || 0 })}
                      helperText="Duration per break" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Break After (hours worked)" type="number" size="small"
                      value={currentConfig.breakAfterHours}
                      onChange={(e) => set({ breakAfterHours: parseInt(e.target.value) || 0 })}
                      helperText="Trigger break after these hours" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={currentConfig.breakIsPaid}
                        onChange={(e) => set({ breakIsPaid: e.target.checked })} />}
                      label="Paid Break"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={currentConfig.allowMultipleBreaks}
                        onChange={(e) => set({ allowMultipleBreaks: e.target.checked })} />}
                      label="Allow Multiple Breaks"
                    />
                  </Grid>
                  {currentConfig.allowMultipleBreaks && (
                    <>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Max Breaks per Shift" type="number" size="small"
                          value={currentConfig.maxBreaksPerShift}
                          onChange={(e) => set({ maxBreaksPerShift: parseInt(e.target.value) || 0 })} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField fullWidth label="Min Break Interval (min)" type="number" size="small"
                          value={currentConfig.minBreakInterval}
                          onChange={(e) => set({ minBreakInterval: parseInt(e.target.value) || 0 })} />
                      </Grid>
                    </>
                  )}
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={currentConfig.autoBreakDeduction}
                        onChange={(e) => set({ autoBreakDeduction: e.target.checked })} />}
                      label="Auto-deduct break time from attendance"
                    />
                  </Grid>
                </Grid>
              </ExpandableSection>

              {/* Lunch Settings */}
              <ExpandableSection
                title="Lunch & Meal Break"
                icon={<LunchDiningOutlined fontSize="small" className="text-orange-600" />}
              >
                <Grid container spacing={3} className="mt-4">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Lunch Duration (min)" type="number" size="small"
                      value={currentConfig.lunchDuration}
                      onChange={(e) => set({ lunchDuration: parseInt(e.target.value) || 0 })}
                      helperText="Total lunch break duration" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth label="Lunch After (hours worked)" type="number" size="small"
                      value={currentConfig.lunchAfterHours}
                      onChange={(e) => set({ lunchAfterHours: parseInt(e.target.value) || 0 })}
                      helperText="Trigger lunch after these hours" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={currentConfig.lunchIsPaid}
                        onChange={(e) => set({ lunchIsPaid: e.target.checked })} />}
                      label="Paid Lunch"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Grace Before Lunch (min)" type="number" size="small"
                      value={currentConfig.lunchGraceBefore}
                      onChange={(e) => set({ lunchGraceBefore: parseInt(e.target.value) || 0 })}
                      helperText="Minutes allowed to start lunch early" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Grace After Lunch (min)" type="number" size="small"
                      value={currentConfig.lunchGraceAfter}
                      onChange={(e) => set({ lunchGraceAfter: parseInt(e.target.value) || 0 })}
                      helperText="Minutes allowed to return from lunch late" sx={helperSx}
                    />
                  </Grid>
                </Grid>
              </ExpandableSection>

              {/* Overtime Settings */}
              <ExpandableSection
                title="Overtime Settings"
                icon={<ScheduleOutlined fontSize="small" className="text-purple-600" />}
              >
                <Grid container spacing={3} className="mt-4">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="OT Eligible Before Shift (min)" type="number" size="small"
                      value={currentConfig.overtimeBeforeShift}
                      onChange={(e) => set({ overtimeBeforeShift: parseInt(e.target.value) || 0 })}
                      helperText="Minutes of early arrival that count as OT" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="OT Eligible After Shift (min)" type="number" size="small"
                      value={currentConfig.overtimeAfterShift}
                      onChange={(e) => set({ overtimeAfterShift: parseInt(e.target.value) || 0 })}
                      helperText="Minutes of late departure that count as OT" sx={helperSx}
                    />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                  OT rate, max hours, and compensation type are governed by the <strong>Overtime Policy</strong> assigned to each employee category — not by shift config.
                </Alert>
              </ExpandableSection>

              {/* Rest Periods */}
              <ExpandableSection
                title="Rest Periods & Shift Limits"
                icon={<BedtimeOutlined fontSize="small" className="text-indigo-600" />}
              >
                <Grid container spacing={3} className="mt-4">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Min Rest Between Shifts (hours)" type="number" size="small"
                      value={currentConfig.minRestBetweenShifts}
                      onChange={(e) => set({ minRestBetweenShifts: parseInt(e.target.value) || 0 })}
                      helperText="Required gap before next shift starts" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Max Consecutive Working Days" type="number" size="small"
                      value={currentConfig.maxConsecutiveDays}
                      onChange={(e) => set({ maxConsecutiveDays: parseInt(e.target.value) || 0 })}
                      helperText="Days before a mandatory day off" sx={helperSx}
                    />
                  </Grid>
                </Grid>
              </ExpandableSection>

              {/* Advanced / Rounding */}
              <ExpandableSection
                title="Time Rounding"
                icon={<SettingsIcon fontSize="small" className="text-gray-600" />}
              >
                <Grid container spacing={3} className="mt-4">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Rounding Rule</InputLabel>
                      <Select value={currentConfig.roundingRule} label="Rounding Rule"
                        onChange={(e) => set({ roundingRule: e.target.value })}>
                        <MenuItem value="none">No Rounding</MenuItem>
                        <MenuItem value="up">Round Up</MenuItem>
                        <MenuItem value="down">Round Down</MenuItem>
                        <MenuItem value="nearest">Round to Nearest</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Rounding Interval (min)" type="number" size="small"
                      value={currentConfig.roundingInterval}
                      onChange={(e) => set({ roundingInterval: parseInt(e.target.value) || 0 })}
                      helperText="Interval to round attendance time entries" sx={helperSx}
                    />
                  </Grid>
                </Grid>
              </ExpandableSection>

            </div>
          </>
        )}
      </DialogContent>

      <DialogActions className="!p-4 border-t border-gray-300 sticky bottom-0 bg-white">
        <Button variant="outlined" className="!border-gray-300 !text-gray-800" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          className="!bg-primary"
          disabled={selectedCategories.length === 0}
        >
          Save{selectedCategories.length > 0
            ? ` for ${selectedCategories.length} Categor${selectedCategories.length > 1 ? 'ies' : 'y'}`
            : ' Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useUI } from '../../../context/Snackbar';
import type { EmployeeCategory as EmployeeCategoryType } from '../../../types/policy';
import type { AdvancedShiftConfig, ShiftAdvancedConfigProps, ShiftCategoryConfig, BreakSlot } from './types';
import { ALL_CATEGORIES, CATEGORY_COLORS, CATEGORY_DEFAULTS, CATEGORY_LABELS, CATEGORY_SUBLABELS } from './const';
import { shiftService } from '../../../services/modules/shifts';
import { helperSx } from '../../../components/PolicyManagement/const';
import { selectSx } from '../../../const';

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

let calculateEndTime = (startTime: string, durationMinutes: number): string => {
  if (!startTime) return '';
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// ─── Break Slots Component - For multiple breaks mode with editable durations ───────
const BreakSlotsEditor = ({
  maxBreaks,
  breakDuration,
  breakAfterHours,
  minBreakInterval,
  slots,
  onChange,
  shiftStartTime
}: {
  maxBreaks: number;
  breakDuration: number;
  breakAfterHours: number;
  minBreakInterval: number;
  slots: BreakSlot[];
  onChange: (slots: BreakSlot[]) => void;
  shiftStartTime?: string;
}) => {

  // Auto-calculate initial break times based on breakAfterHours
  const calculateInitialBreakTimes = () => {
    if (!shiftStartTime || maxBreaks === 0) return [];
    const [startHours, startMinutes] = shiftStartTime.split(':').map(Number);
    const initialSlots: BreakSlot[] = [];
    let currentTime = new Date();
    currentTime.setHours(startHours, startMinutes, 0, 0);
    // Add breakAfterHours to get first break start time
    const breakAfterHoursValue = breakAfterHours || 2;
    const breakHours = Math.floor(breakAfterHoursValue);
    const breakMinutes = Math.round((breakAfterHoursValue % 1) * 60);
    currentTime.setHours(currentTime.getHours() + breakHours);
    currentTime.setMinutes(currentTime.getMinutes() + breakMinutes);
    for (let i = 0; i < maxBreaks; i++) {
      const startTimeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
      // Use default breakDuration for initial calculation
      const endTimeStr = calculateEndTime(startTimeStr, breakDuration);
      initialSlots.push({
        id: `break_${Date.now()}_${i}`,
        startTime: startTimeStr,
        endTime: endTimeStr,
        duration: breakDuration  // Store individual duration
      });
      // Move to next break time (current end time + minBreakInterval)
      currentTime.setMinutes(currentTime.getMinutes() + breakDuration + minBreakInterval);
    }
    return initialSlots;
  };

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    if (!startTime || durationMinutes <= 0) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Helper function to calculate duration from start and end times
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);
    const end = new Date();
    end.setHours(endHours, endMinutes, 0, 0);
    return (end.getTime() - start.getTime()) / 60000;
  };

  // Format breakAfterHours for display
  const formatBreakAfterHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours % 1) * 60);
    if (wholeHours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
    return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // Auto-calculate when settings change
  useEffect(() => {
    if (maxBreaks > 0 && shiftStartTime && breakAfterHours >= 0) {
      if (slots.length === 0 || slots.length < maxBreaks) {
        const initialSlots = calculateInitialBreakTimes();
        if (initialSlots.length > 0) {
          onChange(initialSlots);
        }
      }
    }
  }, [maxBreaks, breakAfterHours, minBreakInterval, shiftStartTime]);

  // Update slots when maxBreaks changes
  useEffect(() => {
    if (maxBreaks > slots.length && slots.length > 0) {
      const newSlots = [...slots];
      let lastBreak = newSlots[newSlots.length - 1];
      let currentTime = new Date();
      const [endHours, endMinutes] = lastBreak.endTime.split(':').map(Number);
      currentTime.setHours(endHours, endMinutes, 0, 0);
      currentTime.setMinutes(currentTime.getMinutes() + minBreakInterval);
      for (let i = slots.length; i < maxBreaks; i++) {
        const startTimeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
        const duration = breakDuration;
        const endTimeStr = calculateEndTime(startTimeStr, duration);
        newSlots.push({
          id: `break_${Date.now()}_${i}`,
          startTime: startTimeStr,
          endTime: endTimeStr,
          duration: duration
        });
        currentTime.setMinutes(currentTime.getMinutes() + duration + minBreakInterval);
      }
      onChange(newSlots);
    } else if (maxBreaks < slots.length) {
      onChange(slots.slice(0, maxBreaks));
    }
  }, [maxBreaks]);

  // Update start time and recalculate duration
  const updateStartTime = (index: number, startTime: string) => {
    const updated = [...slots];
    const currentSlot = updated[index];
    const duration = currentSlot.duration || breakDuration;
    const endTime = calculateEndTime(startTime, duration);
    updated[index] = {
      ...currentSlot,
      startTime,
      endTime,
      duration
    };
    onChange(updated);
  };

  // Update end time and recalculate duration
  const updateEndTime = (index: number, endTime: string) => {
    const updated = [...slots];
    const currentSlot = updated[index];
    const duration = calculateDuration(currentSlot.startTime, endTime);
    if (duration > 0) {
      updated[index] = {
        ...currentSlot,
        endTime,
        duration
      };
      onChange(updated);
    }
  };

  // Update duration directly
  const updateDuration = (index: number, duration: number) => {
    if (duration <= 0) return;
    const updated = [...slots];
    const currentSlot = updated[index];
    const endTime = calculateEndTime(currentSlot.startTime, duration);
    updated[index] = {
      ...currentSlot,
      endTime,
      duration
    };
    onChange(updated);
  };

  // Validate break intervals
  const getBreakIntervalError = (index: number, startTime: string): string | null => {
    if (index === 0 || !startTime) return null;
    const prevSlot = slots[index - 1];
    if (!prevSlot?.endTime) return null;
    const prevEnd = new Date(`2000-01-01 ${prevSlot.endTime}`);
    const currentStart = new Date(`2000-01-01 ${startTime}`);
    const gapMinutes = (currentStart.getTime() - prevEnd.getTime()) / 60000;
    if (gapMinutes < minBreakInterval && minBreakInterval > 0) {
      return `Minimum ${minBreakInterval} minutes gap required between breaks`;
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeIcon fontSize="small" />
        Break Time Slots ({maxBreaks} break{maxBreaks !== 1 ? 's' : ''})
        {minBreakInterval > 0 && (
          <Chip
            label={`Min gap: ${minBreakInterval} min`}
            size="small"
            variant="outlined" className='text-gray-800'
          />
        )}
      </Typography>
      {!shiftStartTime && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Shift start time is required to auto-calculate break schedules.
        </Alert>
      )}
      {maxBreaks === 0 ? (
        <Alert severity="info">
          Set "Max Breaks per Shift" to 1 or more to configure break time slots.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {slots.map((slot, index) => {
            const intervalError = getBreakIntervalError(index, slot.startTime);
            const duration = slot.duration || breakDuration;
            return (
              <div key={slot.id}  className='bg-white border border-gray-200 rounded-lg p-4'>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">
                    Break #{index + 1}
                  </Typography>
                  <Chip
                    label={`Duration: ${duration} min`}
                    size="small"
                    className='text-gray-800'
                    color={duration !== breakDuration ? "primary" : "default"}
                    variant={duration !== breakDuration ? "filled" : "outlined"}
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Start Time"
                      type="time"
                      size="small"
                      value={slot.startTime}
                      onChange={(e) => updateStartTime(index, e.target.value)}
                      error={!!intervalError}
                      helperText={intervalError || 'When break starts'} sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="End Time"
                      type="time"
                      size="small"
                      value={slot.endTime}
                      onChange={(e) => updateEndTime(index, e.target.value)}
                      helperText="When break ends (editable)" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Duration (minutes)"
                      type="number"
                      size="small"
                      value={duration}
                      onChange={(e) => updateDuration(index, parseInt(e.target.value) || 0)}
                      helperText="Auto-calculated or manual" sx={helperSx}
                      slotProps={{ htmlInput: { min: 1, step: 5 } }}
                    />
                  </Grid>
                </Grid>
                {index === 0 && shiftStartTime && breakAfterHours > 0 && (
                  <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                    <div>
                      💡 First break scheduled {formatBreakAfterHours(breakAfterHours)} after shift start ({shiftStartTime}).
                      You can adjust times/durations as needed.
                    </div>
                  </Alert>
                )}
                {index > 0 && minBreakInterval > 0 && slot.startTime && slots[index - 1]?.endTime && (
                  <div className="!text-[12px] !mt-2 text-gray-600">
                    ⏱️ Should be at least {minBreakInterval} min after previous break end ({slots[index - 1].endTime})
                  </div>
                )}
              </div>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

// ─── Single Break Display Component ─────────────────────────────────────────
const SingleBreakDisplay = ({
  shiftStartTime,
  breakAfterHours,
  breakDuration
}: {
  shiftStartTime?: string;
  breakAfterHours: number;
  breakDuration: number;
}) => {
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const calculateTimes = () => {
    if (shiftStartTime && breakAfterHours > 0 && breakDuration > 0) {
      // Parse shift start time
      const [hours, minutes] = shiftStartTime.split(':').map(Number);
      // Convert breakAfterHours to hours and minutes
      const breakHours = Math.floor(breakAfterHours);
      const breakMinutes = Math.round((breakAfterHours % 1) * 60);
      // Calculate break start time = shift start + breakAfterHours
      const breakStartDate = new Date();
      breakStartDate.setHours(hours + breakHours, minutes + breakMinutes, 0, 0);
      const startTimeStr = `${String(breakStartDate.getHours()).padStart(2, '0')}:${String(breakStartDate.getMinutes()).padStart(2, '0')}`;
      // Calculate break end time = break start + breakDuration
      const breakEndDate = new Date(breakStartDate);
      breakEndDate.setMinutes(breakEndDate.getMinutes() + breakDuration);
      const endTimeStr = `${String(breakEndDate.getHours()).padStart(2, '0')}:${String(breakEndDate.getMinutes()).padStart(2, '0')}`;
      setBreakStart(startTimeStr);
      setBreakEnd(endTimeStr);
    }
  };

  useEffect(() => {
    calculateTimes();
  }, [shiftStartTime, breakAfterHours, breakDuration]);

  // Format breakAfterHours for display
  const formatBreakAfterHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours % 1) * 60);
    if (wholeHours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
    return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (!shiftStartTime) {
    return <Alert severity="info">Shift start time required to calculate break time.</Alert>;
  }

  if (breakAfterHours <= 0) {
    return <Alert severity="warning">Please set "Break After (hours worked)" to calculate break time.</Alert>;
  }

  return (
    <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ScheduleOutlined fontSize="small" />
        Auto-calculated Break Schedule
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Break Start Time"
            type="time"
            size="small"
            value={breakStart}
            disabled
            helperText={`${formatBreakAfterHours(breakAfterHours)} after shift start (${shiftStartTime})`}
            sx={helperSx}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Break End Time"
            type="time"
            size="small"
            value={breakEnd}
            disabled
            helperText={`${breakDuration} minute(s) duration`}
            sx={helperSx}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Add this new component for Meal Break Display (similar to SingleBreakDisplay)
const MealBreakDisplay = ({
  shiftStartTime,
  mealAfterHours,
  mealDuration
}: {
  shiftStartTime?: string;
  mealAfterHours: number;
  mealDuration: number;
}) => {
  const [mealStart, setMealStart] = useState('');
  const [mealEnd, setMealEnd] = useState('');

  const calculateTimes = () => {
    if (shiftStartTime && mealAfterHours > 0 && mealDuration > 0) {
      // Parse shift start time
      const [hours, minutes] = shiftStartTime.split(':').map(Number);

      // Convert mealAfterHours (e.g., 1.5) to hours and minutes
      const mealHours = Math.floor(mealAfterHours); // Gets 1 from 1.5
      const mealMinutes = Math.round((mealAfterHours % 1) * 60); // Gets 30 from 1.5 (0.5 * 60)

      // Calculate meal start time = shift start + mealAfterHours
      const mealStartDate = new Date();
      mealStartDate.setHours(hours + mealHours, minutes + mealMinutes, 0, 0);
      const startTimeStr = `${String(mealStartDate.getHours()).padStart(2, '0')}:${String(mealStartDate.getMinutes()).padStart(2, '0')}`;

      // Calculate meal end time = meal start + mealDuration
      const mealEndDate = new Date(mealStartDate);
      mealEndDate.setMinutes(mealEndDate.getMinutes() + mealDuration);
      const endTimeStr = `${String(mealEndDate.getHours()).padStart(2, '0')}:${String(mealEndDate.getMinutes()).padStart(2, '0')}`;

      setMealStart(startTimeStr);
      setMealEnd(endTimeStr);
    }
  };

  useEffect(() => {
    calculateTimes();
  }, [shiftStartTime, mealAfterHours, mealDuration]);

  // Format mealAfterHours for display (e.g., 1.5 -> "1 hour 30 minutes")
  const formatmealAfterHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours % 1) * 60);
    if (wholeHours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
    return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (!shiftStartTime) {
    return <Alert severity="info">Shift start time required to calculate meal break time.</Alert>;
  }

  if (mealAfterHours <= 0) {
    return <Alert severity="warning">Please set "meal After (hours worked)" to calculate meal break time.</Alert>;
  }

  if (mealDuration <= 0) {
    return <Alert severity="warning">Please set "meal Duration" to calculate meal break time.</Alert>;
  }

  return (
    <div className='bg-head p-2 rounded-lg'>
      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LunchDiningOutlined fontSize="small" />
        Auto-calculated Meal Break Schedule
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Meal Break Start Time"
            type="time"
            size="small"
            value={mealStart}
            disabled
            helperText={`${formatmealAfterHours(mealAfterHours)} after shift start (${shiftStartTime})`}
            sx={helperSx}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Meal Break End Time"
            type="time"
            size="small"
            value={mealEnd}
            disabled
            helperText={`${mealDuration} minute(s) duration`}
            sx={helperSx}
          />
        </Grid>
      </Grid>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ShiftAdvancedConfig = ({ open, onClose, shift, onSave }: ShiftAdvancedConfigProps) => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [masterConfig, setMasterConfig] = useState<AdvancedShiftConfig>({
    shiftId: shift?.id || '',
    shiftName: shift?.shiftName || '',
    advancedConfigs: [],
  });
  const [selectedCategories, setSelectedCategories] = useState<EmployeeCategoryType[]>([]);
  const [currentConfig, setCurrentConfig] = useState<ShiftCategoryConfig>(CATEGORY_DEFAULTS.staff);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && shift) {
      loadExistingConfig();
    }
  }, [open, shift]);

  const loadExistingConfig = async () => {
    if (!shift?.id) return;
    setIsLoading(true);
    try {
      const response: any = await shiftService.getShiftAdvancedConfig(shift.id);
      const apiData = response?.data ?? response;
      if (apiData && apiData.advancedConfigs) {
        setMasterConfig({
          shiftId: apiData.shiftId || shift.id,
          shiftName: apiData.shiftName || shift.shiftName,
          advancedConfigs: apiData.advancedConfigs || [],
        });
        if (apiData.advancedConfigs.length > 0) {
          const firstConfigType = apiData.advancedConfigs[0].type as EmployeeCategoryType;
          setSelectedCategories([firstConfigType]);
          setCurrentConfig(apiData.advancedConfigs[0]);
        } else {
          setSelectedCategories([]);
        }
      } else {
        setMasterConfig({
          shiftId: shift.id,
          shiftName: shift.shiftName,
          advancedConfigs: [],
        });
        setSelectedCategories([]);
      }
    } catch (error: any) {
      showSnackbar(error?.message, 'error');
      setMasterConfig({
        shiftId: shift.id,
        shiftName: shift.shiftName,
        advancedConfigs: [],
      });
      setSelectedCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shift) {
      setMasterConfig(prev => ({
        ...prev,
        shiftId: shift.id,
        shiftName: shift.shiftName,
      }));
    }
  }, [shift]);

  useEffect(() => {
    if (selectedCategories.length === 0) return;
    const selected = selectedCategories[0];
    const existing = masterConfig.advancedConfigs.find((c) => c.type === selected);
    const defaultConfig = CATEGORY_DEFAULTS[selected];
    if (existing) {
      if (!existing.breakSlots) {
        existing.breakSlots = defaultConfig.breakSlots || [];
      }
      setCurrentConfig(existing);
    } else {
      setCurrentConfig(defaultConfig);
    }
  }, [selectedCategories, masterConfig.advancedConfigs]);

  const isConfigured = (cat: EmployeeCategoryType) =>
    masterConfig.advancedConfigs.some((c) => c.type === cat);

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      showSnackbar('Please select either Staff or Labour category to configure.', 'warning');
      return;
    }
    if (currentConfig.allowMultipleBreaks && currentConfig.maxBreaksPerShift > 0) {
      if (!currentConfig.breakSlots || currentConfig.breakSlots.length === 0) {
        showSnackbar('Please configure break time slots when multiple breaks are allowed.', 'warning');
        return;
      }
      if (currentConfig.breakSlots.length !== currentConfig.maxBreaksPerShift) {
        showSnackbar(`Please configure exactly ${currentConfig.maxBreaksPerShift} break slot(s) as specified in "Max Breaks per Shift".`, 'warning');
        return;
      }
      const invalidSlot = currentConfig.breakSlots.find(
        slot => !slot.startTime || !slot.endTime
      );
      if (invalidSlot) {
        showSnackbar('Please ensure all break slots have valid start and end times.', 'warning');
        return;
      }
    }
    try {
      showSpinner();
      let updatedConfigs = [...masterConfig.advancedConfigs];
      selectedCategories.forEach((cat) => {
        const idx = updatedConfigs.findIndex((c) => c.type === cat);
        const entry: ShiftCategoryConfig = {
          ...currentConfig,
          type: cat,
          breakSlots: currentConfig.allowMultipleBreaks ? currentConfig.breakSlots : []
        };
        if (idx >= 0) {
          updatedConfigs[idx] = entry;
        } else {
          updatedConfigs.push(entry);
        }
      });
      const savedConfig: AdvancedShiftConfig = {
        ...masterConfig,
        advancedConfigs: updatedConfigs
      };
      const hasExistingConfig = masterConfig.advancedConfigs.length > 0;
      let response: any;
      if (hasExistingConfig) {
        response = await shiftService.updateShiftAdvancedConfig(savedConfig.shiftId, savedConfig);
      } else {
        response = await shiftService.createShiftAdvancedConfig(savedConfig.shiftId, savedConfig);
      }
      if (response?.success !== false) {
        setMasterConfig(savedConfig);
        showSnackbar(
          `Configuration saved for ${selectedCategories.map((c) => CATEGORY_LABELS[c]).join(', ')}`,
          'success',
        );
        onSave();
        onClose();
      } else {
        throw new Error(response?.message || 'Failed to save configuration');
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save configuration', 'error');
    } finally {
      hideSpinner();
    }
  };

  const set = (fields: Partial<ShiftCategoryConfig>) =>
    setCurrentConfig((prev) => {
      const updated = { ...prev, ...fields };
      if (updated.allowMultipleBreaks && updated.breakSlots && fields.breakTime) {
        updated.breakSlots = updated.breakSlots.map(slot => ({
          ...slot,
          duration: slot.duration === prev.breakTime || !slot.duration ? fields.breakTime : slot.duration,
          endTime: slot.startTime ? calculateEndTime(slot.startTime, slot.duration || fields.breakTime || 0) : slot.endTime
        }));
      }
      return updated;
    });

  const helperSx = { '& .MuiFormHelperText-root': { color: 'var(--text-secondary)' } };

  // Show loading state
  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" sx={{ '& .MuiDialog-paper': { width: '820px', maxWidth: '95vw', maxHeight: '92vh' } }}>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Typography>Loading configuration...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

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
        <div className="text-gray-800 ml-3 flex items-center gap-2 font-semibold">
          <SettingsIcon fontSize="small" />
          Advanced Configuration — {masterConfig.shiftName}
        </div>
        <IconButton onClick={onClose} size="small">
          <CloseOutlined className="!text-gray-800" />
        </IconButton>
      </div>

      <DialogContent className="!overflow-y-auto" style={{ maxHeight: 'calc(92vh - 130px)' }}>
        {/* ── Step 1: Category Selector (Single Selection) ── */}
        <Box sx={{ mb: 3, p: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography component="div" variant="subtitle1" sx={{ fontWeight: 700 }} color="primary">
              Step 1 — Select Employee Template to Configure
            </Typography>
          </Box>
          <Typography component="div" variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select either Staff or Labour Template to configure shift rules.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {ALL_CATEGORIES.map((cat) => {
              const selected = selectedCategories.includes(cat);
              const configured = isConfigured(cat);
              return (
                <Box
                  key={cat}
                  onClick={() => {
                    setSelectedCategories([cat]);
                    const existing = masterConfig.advancedConfigs.find((c) => c.type === cat);
                    const defaultConfig = CATEGORY_DEFAULTS[cat];
                    if (existing) {
                      if (!existing.breakSlots) {
                        existing.breakSlots = defaultConfig.breakSlots || [];
                      }
                      setCurrentConfig(existing);
                    } else {
                      setCurrentConfig(defaultConfig);
                    }
                  }}
                  className={`bg-${selected ? `${CATEGORY_COLORS[cat]}18` : 'white-50'}`}
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selected ? CATEGORY_COLORS[cat] : 'grey.300',
                    borderRadius: 2,
                    p: 1,
                    minWidth: 150,
                    // bgcolor: selected ? `${CATEGORY_COLORS[cat]}18` : 'background.paper',
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
                      <div className="flex ml-5">
                        <CheckCircleOutlined sx={{ fontSize: 18, color: 'success.main' }} />
                        <Typography component="div" variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                          Configured
                        </Typography>
                      </div>
                    )}
                  </Box>
                  <Typography component="div" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {CATEGORY_SUBLABELS[cat]}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {selectedCategories.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select an employee category above to begin configuring their shift rules.
          </Alert>
        )}

        {/* ── Step 2: Config sections — shown only when categories are selected ── */}
        {selectedCategories.length > 0 && (
          <>
            <div className="space-y-1">
              {/* Grace & Tolerance Times */}
              <ExpandableSection
                title="Grace & Tolerance Times"
                icon={<TimerOutlined fontSize="small" className="text-blue-600" />}
                defaultOpen
              >
                <Grid container spacing={3} className="mt-6">
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
                </Grid>
              </ExpandableSection>

              {/* Break Settings */}
              <ExpandableSection
                title="Break Settings"
                icon={<FreeBreakfastOutlined fontSize="small" className="text-green-600" />}
              >
                {/* ... Keep your existing break settings JSX ... */}
                <Grid container spacing={3} className="mt-6">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Break Duration (minutes)"
                      type="number"
                      size="small"
                      value={currentConfig.breakTime}
                      onChange={(e) => {
                        const duration = parseInt(e.target.value) || 0;
                        set({ breakTime: duration });
                        if (currentConfig.allowMultipleBreaks && currentConfig.breakSlots) {
                          const updatedSlots = currentConfig.breakSlots.map(slot => ({
                            ...slot,
                            endTime: slot.startTime ? calculateEndTime(slot.startTime, duration) : ''
                          }));
                          set({ breakSlots: updatedSlots });
                        }
                      }}
                      helperText="Duration of each break"
                      sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Break After (hours worked)"
                      type="number"
                      size="small"
                      value={currentConfig.breakAfterHours}
                      onChange={(e) => set({ breakAfterHours: parseFloat(e.target.value) || 0 })}
                      helperText="Trigger break after these hours"
                      slotProps={{ htmlInput: { step: 0.5, min: 0 } }}
                      sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={currentConfig.allowMultipleBreaks || false}
                        onChange={(e) => {
                          const isMultiple = e.target.checked;
                          set({
                            allowMultipleBreaks: isMultiple,
                            maxBreaksPerShift: isMultiple ? currentConfig.maxBreaksPerShift || 2 : 0,
                            breakSlots: isMultiple ? currentConfig.breakSlots || [] : []
                          });
                        }} />}
                      label="Enable Multiple Breaks"
                    />
                  </Grid>

                  {!currentConfig.allowMultipleBreaks && (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="info">
                          Single break will be automatically scheduled {currentConfig.breakAfterHours} hour(s) after shift start,
                          lasting {currentConfig.breakTime} minutes.
                        </Alert>
                        <SingleBreakDisplay
                          shiftStartTime={shift?.startTime}
                          breakAfterHours={currentConfig.breakAfterHours}
                          breakDuration={currentConfig.breakTime}
                        />
                      </Grid>
                    </>
                  )}

                  {currentConfig.allowMultipleBreaks && (
                    <>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Max Breaks per Shift"
                          type="number"
                          size="small"
                          value={currentConfig.maxBreaksPerShift || 2}
                          onChange={(e) => {
                            const maxBreaks = parseInt(e.target.value) || 0;
                            set({ maxBreaksPerShift: maxBreaks });
                          }}
                          helperText="Number of breaks (1-5)" sx={helperSx}
                          slotProps={{ htmlInput: { min: 1, max: 5 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Min Break Interval (minutes)"
                          type="number"
                          size="small"
                          value={currentConfig.minBreakInterval || 60}
                          onChange={(e) => set({ minBreakInterval: parseInt(e.target.value) || 0 })}
                          helperText="Minimum time between consecutive breaks" sx={helperSx}
                          slotProps={{ htmlInput: { step: 15, min: 0 } }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <BreakSlotsEditor
                          maxBreaks={currentConfig.maxBreaksPerShift || 0}
                          breakDuration={currentConfig.breakTime}
                          minBreakInterval={currentConfig.minBreakInterval || 60}
                          slots={currentConfig.breakSlots || []}
                          onChange={(slots) => set({ breakSlots: slots })}
                          shiftStartTime={shift?.startTime}
                          breakAfterHours={currentConfig.breakAfterHours || 0}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </ExpandableSection>

              {/* Meal Break Settings */}
              <ExpandableSection
                title="Meal Break"
                icon={<LunchDiningOutlined fontSize="small" className="text-orange-600" />}
              >
                <Grid container spacing={3} className="mt-6">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Meal Duration (min)"
                      type="number"
                      size="small"
                      value={currentConfig.mealDuration}
                      onChange={(e) => set({ mealDuration: parseInt(e.target.value) || 0 })}
                      helperText="Duration of meal break"
                      sx={helperSx}
                      slotProps={{ htmlInput: { min: 0, step: 5 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Meal After (hours worked)"
                      type="number"
                      size="small"
                      value={currentConfig.mealAfterHours}
                      onChange={(e) => set({ mealAfterHours: parseFloat(e.target.value) || 0 })} // Changed from parseInt to parseFloat
                      helperText="Trigger meal break after these hours"
                      sx={helperSx}
                      slotProps={{ htmlInput: { min: 0, step: 0.5 } }} // step 0.5 allows 0.5, 1.0, 1.5, 2.0, etc.
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={currentConfig.enableMealBreakGrace || false}
                          onChange={(e) => set({ enableMealBreakGrace: e.target.checked })}
                        />
                      }
                      label="Enable Grace Periods"
                    />
                  </Grid>

                  {/* Grace periods - only show if enabled */}
                  {currentConfig.enableMealBreakGrace && (
                    <>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Grace Before Meal (min)"
                          type="number"
                          size="small"
                          value={currentConfig.mealGraceBefore || 0}
                          onChange={(e) => set({ mealGraceBefore: parseInt(e.target.value) || 0 })}
                          helperText="Minutes allowed to start meal early"
                          sx={helperSx}
                          slotProps={{ htmlInput: { min: 0, step: 5 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Grace After Meal (min)"
                          type="number"
                          size="small"
                          value={currentConfig.mealGraceAfter || 0}
                          onChange={(e) => set({ mealGraceAfter: parseInt(e.target.value) || 0 })}
                          helperText="Minutes allowed to return from meal late"
                          sx={helperSx}
                          slotProps={{ htmlInput: { min: 0, step: 5 } }}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Auto-calculated meal break schedule */}
                  <Grid size={{ xs: 12 }}>
                    <MealBreakDisplay
                      shiftStartTime={shift?.startTime}
                      mealAfterHours={currentConfig.mealAfterHours}
                      mealDuration={currentConfig.mealDuration}
                    />
                  </Grid>
                </Grid>
              </ExpandableSection>

              {/* Overtime Settings */}
              <ExpandableSection
                title="Overtime Settings"
                icon={<ScheduleOutlined fontSize="small" className="text-purple-600" />}
              >
                <Grid container spacing={3} className="mt-6">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="OT Eligible Before Shift (min)" type="number" size="small"
                      value={currentConfig.overtimeBeforeShift || 0}
                      onChange={(e) => set({ overtimeBeforeShift: parseInt(e.target.value) || 0 })}
                      helperText="Minutes of early arrival that count as OT" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="OT Eligible After Shift (min)" type="number" size="small"
                      value={currentConfig.overtimeAfterShift || 0}
                      onChange={(e) => set({ overtimeAfterShift: parseInt(e.target.value) || 0 })}
                      helperText="Minutes of late departure that count as OT" sx={helperSx}
                    />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                  OT rate, max hours, and compensation type are governed by the <strong>Overtime Policy</strong> assigned to each employee category — not by shift config.
                </Alert>
              </ExpandableSection>

              {/* Rest Periods */}
              <ExpandableSection
                title="Rest Periods & Shift Limits"
                icon={<BedtimeOutlined fontSize="small" className="text-indigo-600" />}
              >
                <Grid container spacing={3} className="mt-6">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Min Rest Between Shifts (hours)" type="number" size="small"
                      value={currentConfig.minRestBetweenShifts || 0}
                      onChange={(e) => set({ minRestBetweenShifts: parseInt(e.target.value) || 0 })}
                      helperText="Required gap before next shift starts" sx={helperSx}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Max Consecutive Working Days" type="number" size="small"
                      value={currentConfig.maxConsecutiveDays || 0}
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
                <Grid container spacing={3} className="mt-6">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Rounding Rule</InputLabel>
                      <Select value={currentConfig.roundingRule || 'none'} label="Rounding Rule" sx={selectSx}
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
                      value={currentConfig.roundingInterval || 0}
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
          {masterConfig.advancedConfigs.length == 0 ? 'Save' : 'Update'} Configuration{selectedCategories.length === 1 ? ` for ${CATEGORY_LABELS[selectedCategories[0]]}` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
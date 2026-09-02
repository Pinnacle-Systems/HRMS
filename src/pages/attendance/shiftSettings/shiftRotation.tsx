import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as RotationIcon,
  DragIndicator as DragIcon,
  PlayArrow as ApplyIcon,
  CloseOutlined
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useUI } from '../../../context/Snackbar';
import type { Shift, ShiftRotationData, PaginatedResponse } from '../../../services/modules/shifts';
import { shiftService } from '../../../services/modules/shifts';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { employeeService } from '../../../services/modules/employees';
import type { RotationFormData } from './types';
import { selectSx } from '../../../const';

export const ShiftRotation = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [rotations, setRotations] = useState<ShiftRotationData[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [editingRotation, setEditingRotation] = useState<ShiftRotationData | null>(null);
  const [selectedRotation, setSelectedRotation] = useState<ShiftRotationData | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [applyData, setApplyData] = useState({
    startDate: '',
    endDate: '',
    employeeIds: [] as string[],
    overwrite: false
  });
  const [formData, setFormData] = useState<RotationFormData>({
    rotationName: '',
    description: '',
    shiftIds: [],
    cycleDays: 7,
    active: true
  });

  const fetchData = async () => {
    try {
      showSpinner();
      const [rotationsRes, shiftsRes, employeesRes] = await Promise.all([
        shiftService.getRotations(),
        shiftService.getActiveShifts(),
        employeeService.getEmployees({ includeInactive: true, size: 100 })

      ]);

      const rotationsData = rotationsRes.data as PaginatedResponse<ShiftRotationData>;
      const shiftsData: any = shiftsRes;

      setRotations(rotationsData?.content || []);
      setShifts(shiftsData.data || []);
      setEmployees(employeesRes.data?.content || []);

    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch data', 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!formData.rotationName || formData.shiftIds.length === 0) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    const apiData = {
      rotationName: formData.rotationName,
      description: formData.description,
      shiftIds: formData.shiftIds,
      cycleDays: formData.cycleDays,
      active: formData.active
    };

    try {
      showSpinner();
      if (editingRotation) {
        await shiftService.updateRotation(editingRotation.id, apiData);
        showSnackbar('Rotation updated successfully!', 'success');
      } else {
        await shiftService.createRotation(apiData);
        showSnackbar('Rotation created successfully!', 'success');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save rotation', 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleApplyRotation = async () => {
    if (!applyData.startDate || !applyData.endDate) {
      showSnackbar('Please select start and end dates', 'error');
      return;
    }

    // Validate date range
    if (dayjs(applyData.endDate).isBefore(dayjs(applyData.startDate))) {
      showSnackbar('End date must be after start date', 'error');
      return;
    }

    const payload: any = {
      startDate: applyData.startDate,
      endDate: applyData.endDate,
      overwrite: applyData.overwrite
    };

    // Only include employeeIds if array is not empty
    if (applyData.employeeIds.length > 0) {
      payload.employeeIds = applyData.employeeIds;
    }

    try {
      showSpinner();
      await shiftService.applyRotation(selectedRotation!.id, payload);
      const employeeMessage = applyData.employeeIds.length > 0
        ? ` to ${applyData.employeeIds.length} selected employees`
        : ' to all employees';

      showSnackbar(`Rotation applied successfully${employeeMessage}!`, 'success');
      setIsApplyDialogOpen(false);
      setApplyData({
        startDate: '',
        endDate: '',
        employeeIds: [],
        overwrite: false
      });
      fetchData();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to apply rotation', 'error');
    } finally {
      hideSpinner();
    }
  };

  const resetForm = () => {
    setEditingRotation(null);
    setFormData({
      rotationName: '',
      description: '',
      shiftIds: [],
      cycleDays: 7,
      active: true
    });
  };

  const handleEdit = (rotation: ShiftRotationData) => {
    setEditingRotation(rotation);
    setFormData({
      rotationName: rotation.rotationName,
      description: rotation.description || '',
      shiftIds: rotation.shiftIds,
      cycleDays: rotation.cycleDays,
      active: rotation.active
    });
    setIsDialogOpen(true);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = [...formData.shiftIds];

    const [moved] = items.splice(result.source.index, 1);

    items.splice(result.destination.index, 0, moved);

    setFormData((prev) => ({
      ...prev,
      shiftIds: items,
    }));
  };

  const getShiftName = (id: string) => {
    const shift = shifts.find(s => s.id === id);
    return shift?.shiftName || id;
  };

  const getShiftColor = (id: string) => {
    const shift = shifts.find(s => s.id === id);
    return shift?.color || '#3b82f6';
  };

  const getShiftTiming = (id: string) => {
    const shift = shifts.find(s => s.id === id);
    if (!shift) return '';
    return `${formatTimeTo12Hour(shift.startTime)} - ${formatTimeTo12Hour(shift.endTime)}`;
  };

  // Format time to 12-hour format
  const formatTimeTo12Hour = (timeString?: string): string => {
    if (!timeString) return '--:--';
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '--:--';
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "600px",
      maxWidth: "600px",
    },
  };

  return (
    <div className='bg-gray-50 p-4 !pb-0'>
      <div className="flex justify-between items-center mb-4">
        <div className='ml-2'>
          <Typography variant="h6" className="font-semibold text-gray-800">
            Shift Rotation
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Create and manage shift rotation patterns
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="!bg-primary"
        >
          Create Rotation
        </Button>
      </div>

      {rotations.length === 0 ? (
        <Paper className="p-8 text-center bg-gray-50">
          <RotationIcon className="text-gray-400 text-5xl mb-2" />
          <Typography className="text-gray-500">No rotations created yet</Typography>
        </Paper>
      ) : (
        <div className='h-[calc(100vh-270px)] overflow-auto '>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rotations.map((rotation) => (
              <Card key={rotation.id} className="hover:shadow-lg transition-shadow !border !border-gray-200 bg-white">
                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Typography variant="h6" className="font-semibold flex text-gray-800 items-center gap-2">
                        <RotationIcon className="text-primary" />
                        {rotation.rotationName}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        {rotation.description || 'No description'}
                      </Typography>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip title="Apply Rotation">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRotation(rotation);
                            setIsApplyDialogOpen(true);
                          }}
                          color="success"
                        >
                          <ApplyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(rotation)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            showConfirmDialog({
                              title: 'Delete Rotation',
                              message: `Are you sure you want to delete "${rotation.rotationName}"?`,
                              confirmText: 'Delete',
                              onConfirm: async () => {
                                try {
                                  showSpinner();
                                  await shiftService.deleteRotation(rotation.id);
                                  showSnackbar('Rotation deleted successfully!', 'success');
                                  fetchData();
                                } catch (error: any) {
                                  showSnackbar(error.message || 'Failed to delete rotation', 'error');
                                } finally {
                                  hideSpinner();
                                }
                              }
                            });
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Typography variant="subtitle2" className="text-gray-700 mb-2">
                      Rotation Pattern ({rotation.cycleDays} days cycle)
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {rotation.shiftIds.map((shiftId, idx) => (
                        <Chip
                          key={idx}
                          label={`Day ${idx + 1}: ${getShiftName(shiftId)}`}
                          size="small"
                          sx={{
                            backgroundColor: `${getShiftColor(shiftId)}20`,
                            color: getShiftColor(shiftId),
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Chip
                      label={rotation.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={rotation.active ? 'success' : 'default'}
                    />
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <RotationIcon fontSize="small" />
                      <span>{rotation.shiftIds.length} shifts in rotation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Rotation Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" sx={commonsx}>
        <div className="flex items-center p-2 justify-between border-b border-gray-200">
          <div className="text-gray-800 ml-4">
            {editingRotation ? 'Edit Rotation' : 'Create Rotation'}
          </div>
          <IconButton onClick={() => setIsDialogOpen(false)}>
            <CloseOutlined className="!text-gray-800"/>
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-4">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Rotation Name"
                  value={formData.rotationName}
                  onChange={(e) => setFormData({ ...formData, rotationName: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Shifts (in order)</InputLabel>
                  <Select
                    multiple
                    value={formData.shiftIds}
                    label="Select Shifts (in order)"
                    sx={selectSx}
                    onChange={(e) => setFormData({ ...formData, shiftIds: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <div className="flex flex-wrap gap-1">
                        {(selected as string[]).map((id) => (
                          <Chip key={id} label={getShiftName(id)} size="small" className='text-gray-800 bg-gray-100' />
                        ))}
                      </div>
                    )}
                  >
                    {shifts.filter(s => s.isActive).map((shift) => (
                      <MenuItem key={shift.id} value={shift.id}>
                        {shift.shiftName}
                        {/* ({formatTimeTo12Hour(shift.startTime)} - {formatTimeTo12Hour(shift.endTime)}) */}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cycle Days"
                  value={formData.cycleDays}
                  onChange={(e) => setFormData({ ...formData, cycleDays: parseInt(e.target.value) || 7 })}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {formData.shiftIds.length > 0 && (
              <Paper className="p-3 bg-white text-gray-800">
                <Typography variant="subtitle2" className="!mb-2">Rotation Order (Drag to reorder)</Typography>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="shifts">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {formData.shiftIds.map((shiftId, index) => (
                          <Draggable key={`${shiftId}-${index}`}
                            draggableId={`${shiftId}-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-2 p-2 mb-2 bg-gray-50 rounded-lg border"
                              >
                                <div {...provided.dragHandleProps}>
                                  <DragIcon className="text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium">Day {index + 1}:</span>
                                  <span className="ml-2">{getShiftName(shiftId)}</span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({getShiftTiming(shiftId)})
                                  </span>
                                </div>
                                <Chip
                                  size="small"
                                  label={`Day ${index + 1}`}
                                  sx={{ backgroundColor: `${getShiftColor(shiftId)}20`, color: getShiftColor(shiftId) }}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </Paper>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={() => setIsDialogOpen(false)} variant="outlined" className="!border-gray-300 !text-gray-800">Cancel</Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingRotation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Rotation Dialog */}
      <Dialog open={isApplyDialogOpen} onClose={() => setIsApplyDialogOpen(false)} maxWidth="sm" sx={commonsx}>
        <div className="flex items-center p-2 justify-between border-b border-gray-300">
          <div className="ml-4">
            Apply Rotation: <span className='text-primary '>{selectedRotation?.rotationName}</span>
          </div>
          <IconButton onClick={() => setIsApplyDialogOpen(false)}>
            <CloseOutlined className="!text-gray-800"/>
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-4">
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <DatePicker
                label="Start Date"
                className="!text-gray-800"
                value={applyData.startDate ? dayjs(applyData.startDate) : null}
                onChange={(e) =>
                  setApplyData({
                    ...applyData,
                    startDate: e ? dayjs(e).format("YYYY-MM-DD") : "",
                  })
                }
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    top: 0,
                  },
                }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <DatePicker
                label="End Date"
                value={applyData.endDate ? dayjs(applyData.endDate) : null}
                minDate={applyData.startDate ? dayjs(applyData.startDate) : undefined}
                onChange={(e) =>
                  setApplyData({
                    ...applyData,
                    endDate: e ? dayjs(e).format("YYYY-MM-DD") : "",
                  })
                }
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    top: 0,
                  },
                }}
              />
            </LocalizationProvider>

            {/* Employee Selection */}
            <FormControl fullWidth>
              <InputLabel>Select Employees (Optional)</InputLabel>
              <Select
                multiple
                value={applyData.employeeIds}
                label="Select Employees (Optional)"
                onChange={(e) => setApplyData({ ...applyData, employeeIds: e.target.value as string[] })}
                renderValue={(selected) => (
                  <div className="flex flex-wrap gap-1">
                    {(selected as string[]).map((id) => {
                      const employee = employees.find(e => e.id === id);
                      return (
                        <Chip
                          key={id}
                          className='text-gray-900'
                          label={employee ? `${employee.name} - ${employee.employeeId}` : id}
                          size="small"
                        />
                      );
                    })}
                  </div>
                )}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    <div className="grid">
                      <div>{employee.name} - {employee.employeeId}</div>
                      <div className='text-[10px] text-gray-500'>{employee.department} ({employee.designation})</div>
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" className="text-gray-600 -mt-2">
              Leave empty to apply to all employees
            </Typography>

            {/* Overwrite Switch */}
            <div className="flex items-center justify-between">
              <Typography variant="body2" className="text-gray-700">
                Overwrite existing shifts?
              </Typography>
              <Switch
                checked={applyData.overwrite}
                onChange={(e) => setApplyData({ ...applyData, overwrite: e.target.checked })}
                color="primary"
              />
            </div>

            <Typography variant="body2" className="text-gray-600">
              {applyData.overwrite
                ? "⚠️ This will REPLACE all existing shifts in the selected date range."
                : "ℹ️ This will skip days that already have a roster cell."}
            </Typography>

            <Typography variant="body2" className="text-gray-600">
              The rotation will repeat every {selectedRotation?.cycleDays} days.
              {selectedRotation?.shiftIds.length} shifts in rotation pattern.
            </Typography>
          </div>
        </DialogContent>
        <DialogActions className='border-t border-gray-300 !p-4'>
          <Button onClick={() => setIsApplyDialogOpen(false)} variant="outlined" className='!text-gray-800 !border-gray-300'>
            Cancel
          </Button>
          <Button onClick={handleApplyRotation} variant="contained" className='!bg-primary'>
            Apply Rotation
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
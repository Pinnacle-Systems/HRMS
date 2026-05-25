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
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as RotationIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useUI } from '../../../context/Snackbar';
import type{ Shift, ShiftRotation as ShiftRotationType } from './types';

// Mock API
const rotationApi = {
  getRotations: async () => {
    return { data: [] };
  },
  createRotation: async (data: any) => {
    return { data: { id: Date.now().toString(), ...data } };
  },
  updateRotation: async (id: string, data: any) => {
    return { data: { id, ...data } };
  },
  deleteRotation: async (id: string) => {
    return { data: {id} };
  }
};

const shiftApi = {
  getShifts: async () => {
    return { data: [] };
  }
};

export const ShiftRotation = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [rotations, setRotations] = useState<ShiftRotationType[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRotation, setEditingRotation] = useState<ShiftRotationType | null>(null);
  const [formData, setFormData] = useState({
    rotationName: '',
    description: '',
    shiftIds: [] as string[],
    cycleDays: 7,
    isActive: true
  });

  const fetchData = async () => {
    try {
      showSpinner();
      const [rotationsRes, shiftsRes] = await Promise.all([
        rotationApi.getRotations(),
        shiftApi.getShifts()
      ]);
      setRotations(rotationsRes.data);
      setShifts(shiftsRes.data);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
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

    try {
      showSpinner();
      if (editingRotation) {
        await rotationApi.updateRotation(editingRotation.id, formData);
        showSnackbar('Rotation updated successfully!', 'success');
      } else {
        await rotationApi.createRotation(formData);
        showSnackbar('Rotation created successfully!', 'success');
      }
      setIsDialogOpen(false);
      setEditingRotation(null);
      setFormData({ rotationName: '', description: '', shiftIds: [], cycleDays: 7, isActive: true });
      fetchData();
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(formData.shiftIds);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFormData({ ...formData, shiftIds: items });
  };

  const getShiftName = (id: string) => shifts.find(s => s.id === id)?.shiftName || id;
  const getShiftColor = (id: string) => shifts.find(s => s.id === id)?.color || '#3b82f6';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
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
            setEditingRotation(null);
            setFormData({ rotationName: '', description: '', shiftIds: [], cycleDays: 7, isActive: true });
            setIsDialogOpen(true);
          }}
          className="!bg-primary"
        >
          Create Rotation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rotations.map((rotation) => (
          <Card key={rotation.id} className="hover:shadow-lg transition-shadow">
            <CardContent>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Typography variant="h6" className="font-semibold flex items-center gap-2">
                    <RotationIcon className="text-primary" />
                    {rotation.rotationName}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {rotation.description || 'No description'}
                  </Typography>
                </div>
                <div className="flex gap-1">
                  <IconButton size="small" onClick={() => {
                    setEditingRotation(rotation);
                    setFormData({
                      rotationName: rotation.rotationName,
                      description: rotation.description,
                      shiftIds: rotation.shiftIds,
                      cycleDays: rotation.cycleDays,
                      isActive: rotation.isActive
                    });
                    setIsDialogOpen(true);
                  }} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => {
                    showConfirmDialog({
                      title: 'Delete Rotation',
                      message: `Delete "${rotation.rotationName}"?`,
                      confirmText: 'Delete',
                      onConfirm: async () => {
                        try {
                          showSpinner();
                          await rotationApi.deleteRotation(rotation.id);
                          showSnackbar('Rotation deleted!', 'success');
                          fetchData();
                        } catch (error: any) {
                          showSnackbar(error.message, 'error');
                        } finally {
                          hideSpinner();
                        }
                      }
                    });
                  }} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
                <Chip label={rotation.isActive ? 'Active' : 'Inactive'} size="small" color={rotation.isActive ? 'success' : 'default'} />
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RotationIcon fontSize="small" />
                  <span>{rotation.shiftIds.length} shifts in rotation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Rotation Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography variant="h6" className="mb-4">
            {editingRotation ? 'Edit Rotation' : 'Create Rotation'}
          </Typography>
          
          <div className="space-y-4">
            <TextField
              fullWidth
              label="Rotation Name"
              value={formData.rotationName}
              onChange={(e) => setFormData({ ...formData, rotationName: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid size= {{xs:12, md:8}}>
                <FormControl fullWidth>
                  <InputLabel>Select Shifts (in order)</InputLabel>
                  <Select
                    multiple
                    value={formData.shiftIds}
                    label="Select Shifts (in order)"
                    onChange={(e) => setFormData({ ...formData, shiftIds: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <div className="flex flex-wrap gap-1">
                        {(selected as string[]).map((id) => (
                          <Chip key={id} label={getShiftName(id)} size="small" />
                        ))}
                      </div>
                    )}
                  >
                    {shifts.filter(s => s.isActive).map((shift) => (
                      <MenuItem key={shift.id} value={shift.id}>
                        {shift.shiftName} ({shift.startTime} - {shift.endTime})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size = {{xs:12 ,md:4}}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cycle Days"
                  value={formData.cycleDays}
                  onChange={(e) => setFormData({ ...formData, cycleDays: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>

            {formData.shiftIds.length > 0 && (
              <Paper className="p-3">
                <Typography variant="subtitle2" className="mb-2">Rotation Order (Drag to reorder)</Typography>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="shifts">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {formData.shiftIds.map((shiftId, index) => (
                          <Draggable key={shiftId} draggableId={shiftId} index={index}>
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
                                </div>
                                <Chip size="small" label={`Day ${index + 1}`} sx={{ backgroundColor: `${getShiftColor(shiftId)}20`, color: getShiftColor(shiftId) }} />
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
              control={<Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />}
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingRotation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
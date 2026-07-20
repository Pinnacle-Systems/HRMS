import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Checkbox,
  ListItemText,
  Box,
  Menu,
  MenuItem as MenuItemMUI,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  AccessTime as TimeIcon,
  NightsStay as NightIcon,
  WbSunny as DayIcon,
  Autorenew as RotationalIcon,
  AccessTime as FlexibleIcon,
  LightMode as MorningIcon,
  Bedtime as EveningIcon,
  CloseOutlined,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  EditOutlined,
  DeleteForeverOutlined,
  StarBorderOutlined,
  Star as StarIcon,
} from '@mui/icons-material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useUI } from '../../../context/Snackbar';
import type { Category, Shift, ShiftStats } from '../../../services/modules/shifts';
import { days, getShiftTypeClass, colorClasses, formatTimeTo12Hour, dayMapping } from './const';
import { shiftService } from '../../../services/modules/shifts';
import { GlobalPagination } from '../../../components/GlobalPagination';
import { getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from '../../const';
import type { ShiftFormData } from './types';
import { ShiftAdvancedConfig } from './shiftAdvancedConfig';
import { categoryService } from '../../../services/modules/category';
import { selectSx } from '../../../const';

export const ShiftList = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftTypes, setShiftTypes] = useState<string[]>([]);
  const [template, setTemplate] = useState<Category[]>([]);
  const [stats, setStats] = useState<ShiftStats>({
    totalShifts: 0,
    activeShifts: 0,
    nightShifts: 0,
    flexibleShifts: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdvancedConfigOpen, setIsAdvancedConfigOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedShiftForConfig, setSelectedShiftForConfig] = useState<Shift | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultShiftId, setDefaultShiftId] = useState<string | null>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ShiftFormData>({
    shiftName: '',
    shiftCode: '',
    startTime: dayjs('2000-01-01 09:00'),
    endTime: dayjs('2000-01-01 18:00'),
    shiftType: 'General',
    templateId: '',
    isActive: true,
    color: '#3b82f6',
    weeklyOff: ['MON'],
    description: '',
    isNightShift: false
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, shiftId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedShiftId(shiftId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedShiftId(null);
  };

  // Get the current shift from selectedShiftId
  const getSelectedShift = () => {
    return shifts.find(shift => shift.id === selectedShiftId);
  };

  // Convert time string (e.g., "14:30:00") to Dayjs
  const timeStringToDayjs = (timeString?: string): Dayjs | null => {
    if (!timeString) return null;
    const [hours, minutes, seconds] = timeString.split(':');
    return dayjs(`2000-01-01 ${hours}:${minutes}:${seconds || '00'}`);
  };

  // Convert Dayjs to time string for API (e.g., "09:00:00")
  const dayjsToTimeString = (dateTime: Dayjs | null): string => {
    if (!dateTime) return '00:00:00';
    return dateTime.format('HH:mm:ss');
  };

  const getShiftTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'night':
        return <NightIcon className="!text-indigo-700 !w-4 !h-4" />;
      case 'flexible':
        return <FlexibleIcon className="!text-green-700 !w-4 !h-4" />;
      case 'rotational':
        return <RotationalIcon className="!text-orange-700 !w-4 !h-4" />;
      case 'morning':
        return <MorningIcon className="!text-yellow-700 !w-4 !h-4" />;
      case 'evening':
        return <EveningIcon className="!text-purple-700 !w-4 !h-4" />;
      default:
        return <DayIcon className="!text-blue-700 !w-4 !h-4" />;
    }
  };

  const fetchData = async () => {
    try {
      showSpinner();
      const params: any = {
        page: page,
        size: limit,
        sort: 'createdAt,desc'
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const [shiftsData, statsData, shiftType, defaultShift] = await Promise.all([
        shiftService.getShifts(params),
        shiftService.getShiftStats(),
        shiftService.getShiftTypes(),
        shiftService.getDefaultShift(),
      ]);
      
      // Set default shift ID
      if (defaultShift.id) {
        setDefaultShiftId(defaultShift.id);
      }
      
      const shiftsWithTemplateName =
        shiftsData?.content?.map((shift) => ({
          ...shift,
          templateName:
            template.find((t) => t.id === shift.templateId)?.name ?? '-',
        })) ?? [];
      setShifts(shiftsWithTemplateName);
      setTotal(shiftsData.totalElements || 0);
      setStats(statsData);
      setShiftTypes(shiftType.data);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch data', 'error');
    } finally {
      hideSpinner();
    }
  };

  const fetchMasterData = async () => {
    try {
      showSpinner();
      // const data: any = await categoryService.getCategoryItems("515d5fe8-2f41-41fe-aab3-6da80a5cfae1")
      // setTemplate(data.data.content || []);
      const category: any = await categoryService.getActiveCategoryItem();
      const templateCategory = category.data.find(
        (element: any) => element.categoryName?.toLowerCase().includes('template')
      );
      if (templateCategory) {
        setTemplate(templateCategory.items);
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch data', 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (template.length > 0) {
      fetchData();
    }
  }, [template, page, limit, searchTerm]);

  const handleSave = async () => {
    if (!formData.shiftName || !formData.shiftCode || !formData.startTime || !formData.endTime || !formData.templateId) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }
    const apiData = {
      shiftName: formData.shiftName,
      shiftCode: formData.shiftCode,
      shiftType: formData.shiftType,
      startTime: dayjsToTimeString(formData.startTime),
      endTime: dayjsToTimeString(formData.endTime),
      templateId: formData.templateId,
      weeklyOff: formData.weeklyOff,
      color: formData.color,
      description: formData.description,
      isActive: formData.isActive,
      isNightShift: formData.shiftType.toLowerCase() === 'night'
    };
    try {
      showSpinner();
      if (editingShift) {
        await shiftService.updateShift(editingShift.id, apiData);
        showSnackbar('Shift updated successfully!', 'success');
      } else {
        await shiftService.createShift(apiData);
        showSnackbar('Shift created successfully!', 'success');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('API Error:', error);
      showSnackbar(error.message || 'Failed to save shift', 'error');
    } finally {
      hideSpinner();
    }
  };

  const resetForm = () => {
    setEditingShift(null);
    setFormData({
      shiftName: '',
      shiftCode: '',
      startTime: dayjs('2000-01-01 09:00'),
      endTime: dayjs('2000-01-01 18:00'),
      shiftType: 'General',
      graceTime: 15,
      breakTime: 60,
      isActive: true,
      color: '#3b82f6',
      weeklyOff: ['MON'],
      description: '',
      isNightShift: false,
      templateId: '',
    });
  };

  const handleEdit = (shift: Shift) => {
    const mappedWeeklyOff = shift.weeklyOff?.map((day: string) => 
    dayMapping[day] || day
  ) || [];
    setEditingShift(shift);
    setFormData({
      shiftName: shift.shiftName,
      shiftCode: shift.shiftCode,
      startTime: timeStringToDayjs(shift.startTime),
      endTime: timeStringToDayjs(shift.endTime),
      shiftType: shift.shiftType,
      isActive: shift.isActive,
      color: shift.color,
      weeklyOff: mappedWeeklyOff,
      description: shift.description || '',
      isNightShift: shift.isNightShift,
      templateId: shift.templateId,
    });
    setIsDialogOpen(true);
    handleMenuClose();
  };

  const handleAdvancedConfig = (shift: Shift) => {
    setSelectedShiftForConfig(shift);
    setIsAdvancedConfigOpen(true);
    handleMenuClose();
  };

  const handleDeleteShift = (shift: Shift) => {
    handleMenuClose();
    showConfirmDialog({
      title: 'Delete Shift',
      message: `Are you sure you want to delete "${shift.shiftName}"?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          showSpinner();
          await shiftService.deleteShift(shift.id);
          showSnackbar('Shift deleted successfully!', 'success');
          fetchData();
        } catch (error: any) {
          showSnackbar(error.message || 'Failed to delete shift', 'error');
        } finally {
          hideSpinner();
        }
      }
    });
  };

  const handleToggleStatus = async (shift: Shift) => {
    showSpinner();
    try {
      const res: any = await shiftService.updateShiftStatus(shift.id, { isActive: !shift.isActive });
      if (res.success) {
        showSnackbar(`Shift ${!shift.isActive ? "activated" : "deactivated"} successfully!`, "success");
        await fetchData();
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
    handleMenuClose();
  };

  const setAsDefault = async (shiftId: string) => {
    try {
      showSpinner();
      const res: any = await shiftService.setDefaultShift(shiftId);
      showSnackbar(res.message || 'Default shift set successfully!', 'success');
      setDefaultShiftId(shiftId);
      await fetchData();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to set default shift', 'error');
    } finally {
      hideSpinner();
      handleMenuClose();
    }
  };

  const filteredShifts = shifts.filter(shift =>
    shift.shiftName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shift.shiftCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsCards = [
    { label: 'Total Shifts', value: stats.totalShifts, icon: <TimeIcon />, color: 'red' },
    { label: 'Active Shifts', value: stats.activeShifts, icon: <DayIcon />, color: 'green' },
    { label: 'Night Shifts', value: stats.nightShifts, icon: <NightIcon />, color: 'blue' },
    { label: 'Flexible', value: stats.flexibleShifts, icon: <TimeIcon />, color: 'yellow' },
  ];

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "600px",
      maxWidth: "600px",
    },
  };

  return (
    <div className='bg-gray-50 p-4 !pb-0'>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-[12px]">
        {statsCards.map((stat, index) => {
          const colors = colorClasses[stat.color as keyof typeof colorClasses];

          return (
            <div
              key={index}
              className={`bg-white rounded-lg px-4 py-2 shadow-sm border-l-4 ${colors.border}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className={`font-bold text-xl ${colors.text}`}>
                    {stat.value}
                  </div>

                  <div className="text-gray-500 text-[12px]">
                    {stat.label}
                  </div>
                </div>

                <div className={colors.icon}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <TextField
          placeholder="Search by name or code..."
          size="small"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-80"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="!bg-primary whitespace-nowrap"
        >
          Create Shift
        </Button>
      </div>

      {/* Shifts Table */}
      <TableContainer className='h-[calc(100vh-400px)]'>
        <Table stickyHeader className='border border-gray-200'>
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell className='!font-semibold' sx={{
                ...stickyHeaderLeftSx,
                minWidth: "70px",
              }}>S No</TableCell>
              <TableCell className='nth-c !font-semibold'>Code</TableCell>
              <TableCell className='!font-semibold '>Shift Name</TableCell>
              <TableCell className='!font-semibold'>Timing</TableCell>
              <TableCell className='!font-semibold'>Hours</TableCell>
              <TableCell className='!font-semibold'>Template</TableCell>
              <TableCell className='!font-semibold'>Type</TableCell>
              <TableCell className='!font-semibold'>Shift Type</TableCell>
              <TableCell className='!font-semibold'>Weekly Off</TableCell>
              <TableCell className='!font-semibold !sticky !right-[100px] !z-[100]'>Status</TableCell>
              <TableCell className='!font-semibold' sx={{
                ...stickyHeaderRightSx,
                minWidth: "100px",
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredShifts.map((shift, index) => {
              const isDefault = defaultShiftId === shift.id;
              return (
                <TableRow 
                  key={shift.id} 
                  className="hover:bg-gray-50" 
                  sx={{
                    ...getRowColor(index),
                    ...(isDefault && {
                      '& td': {
                        backgroundColor: "var(--color-primary-50)"
                      }
                    })
                  }}
                >
                  <TableCell sx={{
                    ...getStickyLeftSx(index),
                    minWidth: "70px",
                  }}>{page * limit + index + 1}</TableCell>
                  <TableCell sx={{
                    ...getStickyLeftSx(index),
                    left: "70px",
                    minWidth: "100px",
                  }}>
                    <div className="flex items-center gap-2 font-medium">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: shift.color }}
                      />
                      <span className="!font-mono">{shift.shiftCode}</span>
                      {isDefault && (
                        <Tooltip title="Default Shift">
                          <StarIcon className="!text-yellow-500 !w-4 !h-4" />
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span>{shift.shiftName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TimeIcon fontSize="small" className="text-gray-400" />
                      <span>
                        {formatTimeTo12Hour(shift.startTime)} - {formatTimeTo12Hour(shift.endTime)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{shift.totalHours}h</TableCell>
                  <TableCell>{shift.templateName}</TableCell>
                  <TableCell>{shift?.advancedConfigTypes?.length ? shift?.advancedConfigTypes : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={shift.shiftType}
                      icon={getShiftTypeIcon(shift.shiftType)}
                      className={getShiftTypeClass(shift.shiftType)}
                    />
                  </TableCell>
                  <TableCell>{shift.weeklyOff?.join(', ') || 'None'}</TableCell>
                  <TableCell className='!sticky !right-[100px] !z-[100] bg-inherit'>
                    <Chip
                      size="small"
                      label={shift.isActive ? 'Active' : 'Inactive'}
                      color={shift.isActive ? 'success' : 'error'}
                      onClick={() => handleToggleStatus(shift)}
                    />
                  </TableCell>
                  <TableCell sx={{
                    ...getStickyRightSx(index),
                    minWidth: "50px",
                  }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, shift.id)}
                      aria-label="more options"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title="Advanced Configuration">
                      <IconButton size="small" onClick={() => handleAdvancedConfig(shift)} disabled={!shift.isActive}>
                        <SettingsIcon fontSize="small" className={`${!shift.isActive ? 'text-gray-500' : '!text-primary'}`} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredShifts.length === 0 && (
          <div className="bg-white border border-gray-200 border-t-0 text-gray-900 text-center py-8 text-gray-500"> No shifts available!</div>
        )}
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {getSelectedShift() && (() => {
          const shift = getSelectedShift();
          const isDefault = defaultShiftId === shift?.id;
          return (
            <>
              <MenuItemMUI
                onClick={() => {
                  if (shift) handleEdit(shift);
                }}
                disabled={!shift?.isActive}
              >
                <ListItemIcon>
                  <EditOutlined fontSize="small" color="primary" className='!w-4' />
                </ListItemIcon>
                Edit
              </MenuItemMUI>

              <MenuItemMUI
                onClick={() => {
                  if (shift) setAsDefault(shift.id);
                }}
                disabled={!shift?.isActive || isDefault}
                sx={isDefault ? { opacity: 0.5 } : {}}
              >
                <ListItemIcon>
                  {isDefault ? (
                    <StarIcon fontSize="small" className='!text-yellow-500 !w-4' />
                  ) : (
                    <StarBorderOutlined fontSize="small" color="success" className='!w-4' />
                  )}
                </ListItemIcon>
                {isDefault ? 'Default Shift' : 'Set as Default'}
              </MenuItemMUI>

              <MenuItemMUI
                onClick={() => {
                  if (shift) handleDeleteShift(shift);
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <DeleteForeverOutlined fontSize="small" color="error" className='!w-4' />
                </ListItemIcon>
                Delete
              </MenuItemMUI>
            </>
          );
        })()}
      </Menu>

      {/* Global Pagination */}
      {total > 0 && (
        <GlobalPagination
          total={total}
          page={page + 1}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal={true}
        />
      )}

      {/* Create/Edit Shift Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" sx={commonsx}>
        <div className="flex items-center p-2 justify-between border-b border-gray-300">
          <div className="text-gray-800 ml-4 text-[12px]">
            {editingShift ? 'Edit Shift' : 'Create New Shift'}
          </div>
          <IconButton onClick={() => setIsDialogOpen(false)}>
            <CloseOutlined className='!text-gray-800' />
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-6 pt-1">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Shift Name"
                  value={formData.shiftName}
                  onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Shift Code"
                  value={formData.shiftCode}
                  onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value.toUpperCase() })}
                  required
                />
              </Grid>
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    ampm={false}
                    onChange={(value) => setFormData({ ...formData, startTime: dayjs(value) })}
                    slotProps={{
                      textField: { fullWidth: true, required: true }, openPickerButton: {
                        color: "primary",
                        edge: "end",
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    ampm={false}
                    onChange={(value) => setFormData({ ...formData, endTime: dayjs(value) })}
                    slotProps={{
                      textField: { fullWidth: true, required: true }, openPickerButton: {
                        color: "primary",
                        edge: "end",
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                      value={formData.templateId}
                      label="Template"
                      sx={selectSx}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData,
                          templateId: newType,
                        });
                      }}
                    >
                      {template.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Weekly Off</InputLabel>
                  <Select
                    multiple
                    value={formData.weeklyOff}
                    label="Weekly Off"
                    onChange={(e) => setFormData({ ...formData, weeklyOff: e.target.value as string[] })}
                    renderValue={(selected) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" className='text-gray-800 bg-gray-100' />
                      ))}
                    </Box>}
                  >
                    {days.map(day => (
                      <MenuItem key={day} value={day}>
                        <Checkbox className='!p-0 !pr-2' checked={formData.weeklyOff.indexOf(day) > -1} />
                        <ListItemText primary={day} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="color"
                  label="Shift Color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Shift Type</InputLabel>
                  <Select
                    value={formData.shiftType}
                    label="Shift Type"
                    sx={selectSx}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        shiftType: newType,
                        isNightShift: newType.toLowerCase() === 'night'
                      });
                    }}
                  >
                    {shiftTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-300'>
          <Button variant='outlined' className='!border-gray-300 !text-gray-800' onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingShift ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advanced Configuration Dialog */}
      <ShiftAdvancedConfig
        open={isAdvancedConfigOpen}
        onClose={() => setIsAdvancedConfigOpen(false)}
        shift={selectedShiftForConfig}
        onSave={fetchData}
      />
    </div>
  );
};
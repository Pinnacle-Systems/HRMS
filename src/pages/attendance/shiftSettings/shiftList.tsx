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
import { days, getShiftTypeClass, colorClasses, dayMapping } from './const';
import { shiftService } from '../../../services/modules/shifts';
import { GlobalPagination } from '../../../components/GlobalPagination';
import { getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from '../../const';
import type { ShiftFormData } from './types';
import { ShiftAdvancedConfig } from './shiftAdvancedConfig';
import { categoryService } from '../../../services/modules/category';
import { selectSx } from '../../../const';
import { commonsx } from '../../employees/const';

export const ShiftList = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftTypes, setShiftTypes] = useState<string[]>([]);
  const [template, setTemplate] = useState<Category[]>([]);
  const [commonTemplate, setCommonTemplate] = useState<Category[]>([]);
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
  const [isDataLoading, setIsDataLoading] = useState(false);

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
    commonTemplateId: '',
    isActive: true,
    color: '#3b82f6',
    weeklyOff: ['SUN'],
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

  const fetchMasterData = async () => {
    try {
      showSpinner();
      const category: any = await categoryService.getActiveCategoryItem();
      const templateCategory = category.data.find(
        (element: any) => element.categoryName?.toLowerCase().includes('employee group')
      );
      if (templateCategory) {
        setTemplate(templateCategory.items || []);
      }
      const commonTemplate = category.data.find(
        (element: any) => element.categoryName === 'Shift Common Template'
      );
      if (commonTemplate) {
        setCommonTemplate(commonTemplate.items || []);
      } else {
        setCommonTemplate([]);
      }
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch template data', 'error');
      setTemplate([]);
      setCommonTemplate([]);
    } finally {
      hideSpinner();
    }
  };

  // Fetch master data on component mount
  useEffect(() => {
    fetchMasterData();
  }, []);

  // Fetch shifts after template is loaded
  useEffect(() => {
    if (template.length > 0) {
      fetchData();
    }
  }, [template]);

  // Re-fetch on page/limit/search changes
  useEffect(() => {
    if (template.length > 0) {
      fetchData();
    }
  }, [page, limit, searchTerm]);

  const fetchData = async () => {
    if (isDataLoading) return;
    setIsDataLoading(true);
    try {
      showSpinner();
      const params: any = {
        page: page,
        size: limit,
        sort: 'shiftCode,ASC'
      };
      if (searchTerm) {
        params.search = searchTerm;
      }

      const templateMap = new Map();
      template.forEach((t: any) => {
        templateMap.set(t.id, t.name);
      });

      const [shiftsData, statsData, shiftType, defaultShift] = await Promise.all([
        shiftService.getShifts(params),
        shiftService.getShiftStats(),
        shiftService.getShiftTypes(),
        shiftService.getDefaultShift(),
      ]);

      // Set default shift ID
      if (defaultShift?.id) {
        setDefaultShiftId(defaultShift.id);
      } else {
        setDefaultShiftId(null);
      }

      const shiftsWithTemplateName = shiftsData?.content?.map((shift: any) => ({
        ...shift,
        templateName: templateMap.get(shift.templateId) || '-',
        defaultShift: defaultShift?.id === shift.id,
      })) ?? [];
      setShifts(shiftsWithTemplateName);
      setTotal(shiftsData?.totalElements || 0);
      setStats(statsData || { totalShifts: 0, activeShifts: 0, nightShifts: 0, flexibleShifts: 0 });
      setShiftTypes(shiftType?.data || []);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch data', 'error');
    } finally {
      hideSpinner();
      setIsDataLoading(false);
    }
  };

  // Helper to create advanced config for a new shift
  const createAdvancedConfigForShift = async (shiftId: string, templateType: string) => {
    try {
      // Get default config based on template type
      const defaultConfig = getDefaultConfigForType(templateType);
      const { type, ...configWithoutType } = defaultConfig;

      const configData: any = {
        shiftId: shiftId,
        shiftName: formData.shiftName,
        advancedConfigs: [{
          type: templateType,
          ...configWithoutType
        }]
      };

      await shiftService.createShiftAdvancedConfig(shiftId, configData);
      console.log(`Advanced config created for ${templateType}`);
    } catch (error: any) {
      console.error('Failed to create advanced config:', error);
      // Don't block the main flow, just log the error
    }
  };

  // Helper to update advanced config for existing shift
  const updateAdvancedConfigForShift = async (shiftId: string, templateType: string) => {
    try {
      // Check if config already exists
      const existingConfig: any = await shiftService.getShiftAdvancedConfig(shiftId);

      if (existingConfig?.data?.advancedConfigs || existingConfig?.advancedConfigs) {
        const config = existingConfig.data || existingConfig;

        // Check if config for this type already exists
        const existingTypeConfig = config.advancedConfigs?.find((c: any) => c.type === templateType);

        if (!existingTypeConfig) {
          // Add new config for this type
          const defaultConfig = getDefaultConfigForType(templateType);
          const { type, ...configWithoutType } = defaultConfig;

          const updatedConfigs = [
            ...(config.advancedConfigs || []),
            {
              type: templateType,
              ...configWithoutType
            }
          ];

          await shiftService.updateShiftAdvancedConfig(shiftId, {
            ...config,
            advancedConfigs: updatedConfigs
          });
          console.log(`Advanced config added for ${templateType}`);
        }
      } else {
        // No config exists, create one
        await createAdvancedConfigForShift(shiftId, templateType);
      }
    } catch (error: any) {
      console.error('Failed to update advanced config:', error);
      // Don't block the main flow
    }
  };

  // Get default config for a type
  const getDefaultConfigForType = (type: string) => {
    // These should match the defaults from your ShiftAdvancedConfig component
    const defaultConfig = {
      graceBeforeCheckIn: 5,
      graceAfterCheckIn: 5,
      graceBeforeCheckOut: 5,
      graceAfterCheckOut: 5,
      breakTime: 15,
      breakAfterHours: 2,
      allowMultipleBreaks: false,
      maxBreaksPerShift: 0,
      minBreakInterval: 60,
      breakSlots: [],
      mealDuration: 30,
      mealAfterHours: 4,
      enableMealBreakGrace: false,
      mealGraceBefore: 5,
      mealGraceAfter: 5,
      overtimeBeforeShift: 0,
      overtimeAfterShift: 0,
      minRestBetweenShifts: 8,
      maxConsecutiveDays: 6,
      roundingRule: 'none',
      roundingInterval: 0,
      type: type
    };

    // Customize based on type
    if (type === 'staff') {
      return {
        ...defaultConfig,
        graceBeforeCheckIn: 10,
        graceAfterCheckIn: 10,
        breakTime: 30,
      };
    } else if (type === 'labour') {
      return {
        ...defaultConfig,
        graceBeforeCheckIn: 5,
        graceAfterCheckIn: 5,
        breakTime: 15,
        allowMultipleBreaks: true,
        maxBreaksPerShift: 2,
        minBreakInterval: 120,
        breakSlots: [
          {
            id: `break_${Date.now()}_1`,
            startTime: '10:00',
            endTime: '10:15',
            duration: 15
          },
          {
            id: `break_${Date.now()}_2`,
            startTime: '13:00',
            endTime: '13:15',
            duration: 15
          }
        ]
      };
    }

    return defaultConfig;
  };

  const handleSave = async () => {
    if (!formData.shiftName || !formData.shiftCode || !formData.startTime || !formData.endTime || !formData.templateId) {
      showSnackbar('Please fill all required fields', 'error');
      return;
    }
    const templateType = getTemplateType(formData.templateId);

    const apiData = {
      shiftName: formData.shiftName,
      shiftCode: formData.shiftCode,
      shiftType: formData.shiftType,
      startTime: dayjsToTimeString(formData.startTime),
      endTime: dayjsToTimeString(formData.endTime),
      templateId: formData.templateId,
      commonTemplateId: formData.commonTemplateId || null,
      weeklyOff: formData.weeklyOff,
      color: formData.color,
      description: formData.description,
      isActive: formData.isActive,
      isNightShift: formData.shiftType.toLowerCase() === 'night',
      templateType: templateType
    };
    try {
      showSpinner();
      let createdShift: any;

      if (editingShift) {
        await shiftService.updateShift(editingShift.id, apiData);
        showSnackbar('Shift updated successfully!', 'success');
        if (templateType) {
          await updateAdvancedConfigForShift(editingShift.id, templateType);
        }
      } else {
        createdShift = await shiftService.createShift(apiData);
        showSnackbar('Shift created successfully!', 'success');
        if (createdShift?.id && templateType) {
          await createAdvancedConfigForShift(createdShift.id, templateType);
        }
      }
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
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
      isActive: true,
      color: '#3b82f6',
      weeklyOff: ['SUN'],
      description: '',
      isNightShift: false,
      templateId: '',
      commonTemplateId: '',
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
      commonTemplateId: shift.commonTemplateId || '',
    });
    setIsDialogOpen(true);
    handleMenuClose();
  };

  const handleAdvancedConfig = (shift: Shift) => {
    const templateType = getTemplateType(shift.templateId);
    setSelectedShiftForConfig({
      ...shift,
      templateType: templateType
    });
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
          await fetchData();
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

  const removeDefaultShift = async () => {
    try {
      showSpinner();
      await shiftService.removeDefaultShift();
      showSnackbar('Default shift removed successfully!', 'success');
      await fetchData();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to set default shift', 'error');
    } finally {
      hideSpinner();
      handleMenuClose();
    }
  };

  const statsCards = [
    { label: 'Total Shifts', value: stats.totalShifts, icon: <TimeIcon />, color: 'red' },
    { label: 'Active Shifts', value: stats.activeShifts, icon: <DayIcon />, color: 'green' },
    { label: 'Night Shifts', value: stats.nightShifts, icon: <NightIcon />, color: 'blue' },
    { label: 'Flexible', value: stats.flexibleShifts, icon: <TimeIcon />, color: 'yellow' },
  ];

  const handleDefaultShiftToggle = async (shift: Shift) => {
    const isDefault = defaultShiftId === shift.id;

    if (isDefault) {
      // If it's already default, remove it
      await removeDefaultShift();
    } else {
      // If there's already a default shift, confirm before replacing
      if (defaultShiftId) {
        const defaultShift = shifts.find(s => s.id === defaultShiftId);
        showConfirmDialog({
          title: 'Change Default Shift',
          message: `${defaultShift?.shiftName} is currently the default shift. Do you want to replace it with "${shift.shiftName}"?`,
          confirmText: 'Replace',
          cancelText: 'Cancel',
          onConfirm: async () => {
            await setAsDefault(shift.id);
          }
        });
      } else {
        // No default shift exists, set this as default
        await setAsDefault(shift.id);
      }
    }
  };

  // Add this helper function in ShiftList.tsx
  const getTemplateType = (templateId: string): any | null => {
    const selectedTemplate = template.find(t => t.id === templateId);
    if (!selectedTemplate) return null;

    // Check if template name contains 'staff' or 'labour'
    const name = selectedTemplate.name?.toLowerCase() || '';
    if (name.includes('staff')) return 'staff';
    if (name.includes('labour')) return 'labour';

    // Default to 'staff' if no match
    return 'staff';
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
              <TableCell className='!font-semibold'>Employee Group</TableCell>
              <TableCell className='!font-semibold'>Common Template</TableCell>
              <TableCell className='nth-c !font-semibold'>Shift Code</TableCell>
              <TableCell className='!font-semibold '>Shift Name</TableCell>
              <TableCell className='!font-semibold'>Timing</TableCell>
              <TableCell className='!font-semibold'>Hours</TableCell>
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
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <div className="py-6 text-gray-500">{isDataLoading ? 'Loading shifts...' : 'No shifts available'}</div>
                </TableCell>
              </TableRow>
            )}
            {shifts.map((shift, index) => {
              const isDefault = defaultShiftId === shift.id;
              // Get common template name from ID
              const commonTemplateName = commonTemplate.find(t => t.id === shift.commonTemplateId)?.name || '-';
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
                  <TableCell>{shift.templateName}</TableCell>
                  <TableCell>{commonTemplateName}</TableCell>
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
                    <div className="!font-bold">{shift.shiftName}</div>
                    {shift.description && (
                      <div className="text-gray-500">({shift.description})</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TimeIcon fontSize="small" className="text-gray-400" />
                      <span>
                        {(shift.startTime)} - {(shift.endTime)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{shift.totalHours}h</TableCell>
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
                      <MoreVertIcon fontSize="small" className="!text-gray-800" />
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
                  if (shift) handleDefaultShiftToggle(shift);
                }}
                disabled={!shift?.isActive}
              >
                <ListItemIcon>
                  {isDefault ? (
                    <StarIcon fontSize="small" className='!text-yellow-500 !w-4' />
                  ) : (
                    <StarBorderOutlined fontSize="small" color="success" className='!w-4' />
                  )}
                </ListItemIcon>
                {isDefault ? 'Remove as Default' : 'Set as Default'}
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
                <Grid size={{ xs: 12, md: 6 }}>
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
                <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>
            </LocalizationProvider>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Employee Group</InputLabel>
                  <Select
                    value={formData.templateId}
                    label="Employee Group"
                    sx={selectSx}
                    onChange={(e) => {
                      const newTemplateId = e.target.value;
                      const templateType = getTemplateType(newTemplateId);

                      // Optionally auto-set shift type based on template
                      let shiftType = formData.shiftType;
                      if (templateType === 'staff') {
                        shiftType = 'General';
                      } else if (templateType === 'labour') {
                        shiftType = 'Rotational';
                      }

                      setFormData({
                        ...formData,
                        templateId: newTemplateId,
                        shiftType: shiftType // Auto-set shift type
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
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Shift Common Template</InputLabel>
                  <Select
                    value={formData.commonTemplateId}
                    label="Shift Common Template"
                    sx={selectSx}
                    onChange={(e) => setFormData({ ...formData, commonTemplateId: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    {commonTemplate.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

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
        preselectedType={selectedShiftForConfig?.templateType}
      />
    </div>
  );
};
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Menu,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  GroupAdd as BulkAssignIcon,
  Publish as PublishIcon,
  // PictureAsPdf as PdfIcon,
  // TableChart as ExcelIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  WarningOutlined,
  DownloadOutlined
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useUI } from '../../../context/Snackbar';
import { shiftService, type Shift } from '../../../services/modules/shifts';
import { branchService } from '../../../services/modules/branch';
import { getRowColor, getStickyLeftSx, stickyHeaderLeftSx } from '../../const';
import { days } from './const';
import type { Branch, RosterEmployee, alert } from './types';
import type { Department } from '../../employees/type';
import { departmentService } from '../../../services/modules/department';

dayjs.extend(isoWeek);



export const ShiftRoster = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [selectedWeek, setSelectedWeek] = useState<Dayjs>(dayjs().startOf('isoWeek'));
  const [department, setDepartment] = useState<string>('all');
  const [branch, setBranch] = useState<string>('all');
  const [rosterData, setRosterData] = useState<RosterEmployee[]>([]);
  // const [filteredRosterData, setFilteredRosterData] = useState<RosterEmployee[]>([]);
  const [alerts, setAlerts] = useState<alert[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  // Edit state
  const [editingCell, setEditingCell] = useState<{ employeeId: string; day: string; currentShift: string } | null>(null);

  // Bulk assign dialog state
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignEmployees, setBulkAssignEmployees] = useState<string[]>([]);
  const [bulkAssignShift, setBulkAssignShift] = useState('');
  const [bulkAssignDays, setBulkAssignDays] = useState<string[]>([]);


  // Filter state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  // const [selectedDepartmentId] = useState<string>('');
  // const [selectedBranchId] = useState<string>('');

  const [openAlertDialog, setopenAlertDialog] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState("");


  // Fetch master data
  const fetchMasterData = async () => {
    try {
      const branchRes: any = await branchService.getDropdownBranches();
      const branchesData = branchRes.data?.content || branchRes.data || [];
      setBranches(branchesData);
      const depRes: any = await departmentService.getActiveDepartments();
      const depData = depRes.data?.content || depRes.data || [];
      setDepartments(depData);
      const shiftRes: any = await shiftService.getShiftDropdown();
      const shiftData = shiftRes.data?.content || shiftRes.data || [];
      const updatedShifts = shiftData.map((shift: any) => ({
        ...shift,
        weeklyOff: ["SUN"], // Mock data
      }));
      setShifts(updatedShifts);
    } catch (error: any) {
      console.error('Failed to fetch master data:', error);
    }
  };

  // Fetch roster data
  const fetchRoster = async () => {
    showSpinner();
    try {
      const weekStartDate = selectedWeek.format('YYYY-MM-DD');
      const params: any = {
        weekStartDate
      };
      if (searchTerm) params.search = searchTerm;
      // if (selectedDepartmentId) params.departmentId = selectedDepartmentId;
      // if (selectedBranchId) params.branchId = selectedBranchId;
      if (department !== 'all') {
        params.departmentId = department; // or departmentId based on API
      }

      if (branch !== 'all') {
        params.branchId = branch;
      }

      const response: any = await shiftService.getRoster(params);
      const data = response.data?.data || response.data || [];
      setRosterData(data);

      // Apply client-side filters for department and branch names
      // let filtered = [...data];
      // if (department !== 'all') {
      //   filtered = filtered.filter(emp => emp.department === department);
      // }
      // if (branch !== 'all') {
      //   filtered = filtered.filter(emp => emp.branchId === branch);
      // }
      // setFilteredRosterData(data);
      setIsPublished(false);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to fetch roster', 'error');
    } finally {
      hideSpinner();
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const weekStartDate = selectedWeek.format('YYYY-MM-DD');
      const response: any = await shiftService.getRosterAlerts({ weekStartDate });
      const alertsData = response.data?.data || response.data || [];
      setAlerts(alertsData);
    } catch (error: any) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchRoster();
    fetchAlerts();
  }, [selectedWeek, department, branch, searchTerm]);

  const allEmployeeIds = rosterData.map(emp => emp.employeeId);
  // const allDays = days;

  const handleCopyPrevWeek = async () => {
    showConfirmDialog({
      title: 'Copy Previous Week',
      message: 'This will copy the roster from the previous week. Continue?',
      confirmText: 'Copy',
      cancelText: 'Cancel',
      onConfirm: async () => {
        showSpinner();
        try {
          const fromWeekStartDate = selectedWeek.subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD');
          const toWeekStartDate = selectedWeek.format('YYYY-MM-DD');

          const payload: any = {
            fromWeekStartDate,
            toWeekStartDate
          };
          // if (selectedDepartmentId) payload.departmentId = selectedDepartmentId;
          // if (selectedBranchId) payload.branchId = selectedBranchId;
          if (department !== 'all') {
            payload.departmentId = department; // or departmentId based on API
          }

          if (branch !== 'all') {
            payload.branchId = branch;
          }

          await shiftService.copyPreviousWeekToRoster(payload);
          showSnackbar('Previous week roster copied successfully!', 'success');
          fetchRoster();
        } catch (error: any) {
          showSnackbar(error.message || 'Failed to copy roster', 'error');
        } finally {
          hideSpinner();
        }
      }
    });
  };

  const handleBulkAssign = () => {
    setBulkAssignEmployees([]);
    setBulkAssignShift('');
    setBulkAssignDays([]);
    setBulkAssignOpen(true);
  };

  const handleBulkAssignSubmit = async () => {
    if (!bulkAssignShift) {
      showSnackbar('Please select a shift', 'error');
      return;
    }
    if (bulkAssignEmployees.length === 0) {
      showSnackbar('Please select at least one employee', 'error');
      return;
    }
    if (bulkAssignDays.length === 0) {
      showSnackbar('Please select at least one day', 'error');
      return;
    }
    showSpinner();
    try {
      const weekStartDate = selectedWeek.format('YYYY-MM-DD');
      const payload = {
        employeeIds: bulkAssignEmployees,
        weekStartDate,
        days: bulkAssignDays,
        shiftCode: bulkAssignShift
      };
      await shiftService.bulkAssignShifts(payload);
      showSnackbar('Bulk assignment completed successfully!', 'success');
      setBulkAssignOpen(false);
      fetchRoster();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to assign shifts', 'error');
    } finally {
      hideSpinner();
    }
  };

  const handlePublish = async () => {
    showConfirmDialog({
      title: 'Publish Roster',
      message: 'Publishing the roster will notify all employees. Continue?',
      confirmText: 'Publish',
      cancelText: 'Cancel',
      onConfirm: async () => {
        showSpinner();
        try {
          const payload: any = {
            weekStartDate: selectedWeek.format('YYYY-MM-DD')
          };
          // if (selectedDepartmentId) payload.departmentId = selectedDepartmentId;
          // if (selectedBranchId) payload.branchId = selectedBranchId;
          if (department !== 'all') {
            payload.departmentId = department; // or departmentId based on API
          }

          if (branch !== 'all') {
            payload.branchId = branch;
          }

          await shiftService.publishRoster(payload);
          showSnackbar('Roster published successfully!', 'success');
          setIsPublished(true);
          fetchAlerts();
        } catch (error: any) {
          showSnackbar(error.message || 'Failed to publish roster', 'error');
        } finally {
          hideSpinner();
        }
      }
    });
  };

  const handleShiftChange = async (employeeId: string, day: string, newShift: string) => {
    showSpinner();
    try {
      const weekStartDate = selectedWeek.format('YYYY-MM-DD');
      const payload = {
        weekStartDate,
        day,
        shiftCode: newShift === '-' ? null : newShift
      };

      await shiftService.updateEmployeeRoster(employeeId, payload);
      showSnackbar('Shift updated successfully!', 'success');

      // Update local state
      setRosterData(prev => prev.map(emp => {
        if (emp.employeeId === employeeId) {
          const updatedWeeklyRoster = emp.weeklyRoster.map(roster =>
            roster.day === day ? { ...roster, shiftCode: newShift } : roster
          );
          return { ...emp, weeklyRoster: updatedWeeklyRoster };
        }
        return emp;
      }));

      setEditingCell(null);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update shift', 'error');
    } finally {
      hideSpinner();
    }
  };

  const openExportMenu = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const closeExportMenu = () => {
    setExportAnchorEl(null);
  };

  const handleExportPDF = async () => {
    try {
      showSpinner();
      const weekStartDate = selectedWeek.format("YYYY-MM-DD");
      const params: any = { weekStartDate };

      // if (selectedDepartmentId) {
      //   params.departmentId = selectedDepartmentId;
      // }
      // if (selectedBranchId) {
      //   params.branchId = selectedBranchId;
      // }
      if (department !== 'all') {
        params.departmentId = department; // or departmentId based on API
      }

      if (branch !== 'all') {
        params.branchId = branch;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      await shiftService.exportRosterToPDF(params);
      showSnackbar("PDF exported successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to export PDF", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleExportExcel = async () => {
    try {
      showSpinner();
      const weekStartDate = selectedWeek.format("YYYY-MM-DD");
      const params: any = { weekStartDate };
      // if (selectedDepartmentId) {
      //   params.departmentId = selectedDepartmentId;
      // }
      // if (selectedBranchId) {
      //   params.branchId = selectedBranchId;
      // }
      if (department !== 'all') {
        params.departmentId = department; // or departmentId based on API
      }

      if (branch !== 'all') {
        params.branchId = branch;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      await shiftService.exportRosterToExcel(params);
      showSnackbar("Excel exported successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to export Excel", "error");
    } finally {
      hideSpinner();
    }
  };

  const getShiftForDay = (employee: RosterEmployee, day: string): string => {
    const roster = employee.weeklyRoster.find(r => r.day === day);
    return roster?.shiftCode || '-';
  };

  // const departmentOptions = ['all', ...new Set(rosterData.map(emp => emp.department).filter(Boolean))];
  // console.log(departmentOptions,'000000');

  const selectedShift: any = shifts.find((shift) => shift.shiftCode === bulkAssignShift);
  const availableDays = days.filter((day) => !selectedShift?.weeklyOff?.includes(day));

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "620px",
      maxWidth: "620px",
    },
  };

  return (
    <div className="bg-gray-50 p-4 !pb-0">
      {/* Search Options */}
      <div className="mb-4 bg-white border border-gray-200">
        <div className='!p-4 !pt-6'>
          <div className="grid gap-4 items-center">
            <div className="flex items-center gap-4 justify-between">

              <div className="flex gap-4 items-center">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Week Start Date"
                    value={selectedWeek}
                    onChange={(date) => setSelectedWeek(dayjs(date)?.startOf('isoWeek') || dayjs().startOf('isoWeek'))}
                    slotProps={{ textField: { size: 'small', className: 'w-48' } }}
                    sx={{
                      "& .MuiIconButton-root": {
                        color: "dodgerblue",
                      },
                    }}
                  />
                </LocalizationProvider>

                <FormControl size="small" className="w-48">
                  <InputLabel>Department</InputLabel>
                  <Select value={department} onChange={(e) => setDepartment(e.target.value)} label="Department">
                    <MenuItem value="all">All Departments</MenuItem>
                    {departments.map(d => (
                      <MenuItem key={d.id} value={d.id}>{d.departmentName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" className="w-48">
                  <InputLabel>Branch</InputLabel>
                  <Select value={branch} onChange={(e) => setBranch(e.target.value)} label="Branch">
                    <MenuItem value="all">All Branches</MenuItem>
                    {branches.map(b => (
                      <MenuItem key={b.id} value={b.id}>{b.branchName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search Employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="flex gap-4 items-center">
                  <Button variant="outlined" startIcon={<CopyIcon />} onClick={handleCopyPrevWeek}>
                    Copy Prev Week
                  </Button>
                  <Button variant="outlined" startIcon={<BulkAssignIcon />} onClick={handleBulkAssign}>
                    Bulk Assign
                  </Button>
                </div>

                {
                  alerts.length > 0 &&
                  <Button variant="outlined" className='!text-yellow-600 !border-yellow-600' startIcon={<WarningOutlined />}
                    onClick={() => setopenAlertDialog(true)}>
                    Alerts
                  </Button>
                }
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  startIcon={<DownloadOutlined />}
                  onClick={(e) => openExportMenu(e)}
                >
                  Export
                </Button>
                <Menu
                  anchorEl={exportAnchorEl}
                  open={Boolean(exportAnchorEl)}
                  onClose={closeExportMenu}
                >
                  <MenuItem onClick={() => handleExportPDF()}>
                    Export as PDF
                  </MenuItem>
                  <MenuItem onClick={() => handleExportExcel()}>
                    Export as Excel
                  </MenuItem>
                </Menu>
                <Button
                  variant="contained"
                  startIcon={<PublishIcon />}
                  onClick={handlePublish}
                  disabled={isPublished}
                  className="!bg-primary"
                >
                  {isPublished ? 'Published' : 'Publish Roster'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-auto h-[calc(100vh-430px)]">
        <Table stickyHeader className="border border-gray-200">
          <TableHead className="bg-gray-100">
            <TableRow className="bg-gray-100 !text-primary">
              <TableCell className="!font-semibold text-gray-800" sx={{
                ...stickyHeaderLeftSx,
                minWidth: "70px",
              }}>S No</TableCell>
              <TableCell className="nth-c !font-semibold">
                Employee Code
              </TableCell>
              <TableCell className="!font-semibold text-gray-800">
                Employee Name
              </TableCell>
              {days.map(day => (
                <TableCell key={day} align="center" className="!font-semibold" sx={{ minWidth: 100 }}>
                  {day}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rosterData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12}>
                  <div className="text-gray-500 text-center py-8">
                    No Data Available
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rosterData.map((employee, index) => (
                <TableRow key={employee.employeeId} className="hover:bg-gray-50" sx={getRowColor(index)}>
                  <TableCell className="font-medium text-gray-800" sx={{
                    ...getStickyLeftSx(index),
                    minWidth: "70px",
                  }}>{index + 1}</TableCell>
                  <TableCell className="" sx={{
                    ...getStickyLeftSx(index),
                    left: "70px",
                    minWidth: "100px",
                  }}>
                    {employee.employeeCode}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {employee.employeeName}
                      <div className="text-gray-500 text-[10px]">
                        {employee.department}
                      </div>
                    </div>
                  </TableCell>

                  {days.map((day) => {
                    const shift = getShiftForDay(employee, day);
                    const isEditing = editingCell?.employeeId === employee.employeeId && editingCell?.day === day;

                    return (
                      <TableCell key={day} align="center" className="p-1" sx={{ padding: '5px 16px !important' }}>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Select
                              size="small"
                              value={shift}
                              onChange={(e) => handleShiftChange(employee.employeeId, day, e.target.value)}
                              autoFocus
                              className="w-28"
                            >
                              {shifts.map(opt => (
                                <MenuItem key={opt.id} value={opt.shiftCode}>
                                  {opt.shiftName}
                                </MenuItem>
                              ))}
                            </Select>
                            <IconButton
                              size="small"
                              onClick={() => setEditingCell(null)}
                              sx={{ p: 0.5 }}
                            >
                              <CancelIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </div>
                        ) : (
                          <Tooltip title="Click to edit">
                            <Chip
                              label={shift}
                              onClick={() => setEditingCell({
                                employeeId: employee.employeeId,
                                day,
                                currentShift: shift
                              })}
                              className="cursor-pointer hover:opacity-80 !font-mono !text-[10px]"
                              sx={{
                                backgroundColor: `${shifts.find((opt) => opt.shiftCode === shift)?.color}20` || "#e5e7eb",
                                color: shifts.find((opt) => opt.shiftCode === shift)?.color || "#e5e7eb",
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                height: '28px'
                              }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )))}
          </TableBody>
        </Table>
      </div>

      <Card className='!bg-white-50 my-4 !p-0'>
        <CardContent className='!p-2 border border-gray-200'>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-4 flex-wrap">
              {shifts.slice(0, 5).map((shift) => (
                <div key={shift.id} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }} />
                  <span className="text-xs text-gray-500">{shift.shiftName}</span>
                  <span className="text-xs text-gray-500">
                    ({rosterData.filter(emp =>
                      emp.weeklyRoster.some(r => r.shiftCode === shift.shiftCode)
                    ).length} emp)
                  </span>
                </div>
              ))}
            </div>
            {!isPublished && (
              <Alert severity="warning" className="text-sm !px-2 !py-0" icon={<WarningOutlined fontSize="small" />}>
                Roster unpublished — pending approval
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} maxWidth="md" sx={commonsx}>
        <DialogTitle className='!p-2 border-b border-gray-200'>
          <div className="flex justify-between items-center">
            <span className='ml-4 text-primary'>Bulk Assign Shifts</span>
            <IconButton onClick={() => setBulkAssignOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-3 gap-4 py-5">
            <FormControl fullWidth>
              <InputLabel>Select Shift</InputLabel>
              <Select value={bulkAssignShift} onChange={(e) => setBulkAssignShift(e.target.value)} label="Select Shift">
                {shifts.map((shift) => (
                  <MenuItem key={shift.id} value={shift.shiftCode}>{shift.shiftName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Select Days</InputLabel>
              <Select
                multiple
                value={bulkAssignDays}
                onChange={(e) => {
                  const value = e.target.value as string[];
                  if (value.includes("ALL")) {
                    if (bulkAssignDays.length === availableDays.length) {
                      setBulkAssignDays([]);
                    } else {
                      setBulkAssignDays(availableDays);
                    }
                  } else {
                    setBulkAssignDays(value);
                  }
                }}
                label="Select Days"
                renderValue={(selected) => {
                  const values = selected as string[];
                  if (values.length === availableDays.length) {
                    return (
                      <div className="flex flex-wrap gap-1">
                        <Chip
                          size="small"
                          label="All Days"
                          color="primary"
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-1">
                      {values.map((day) => (
                        <Chip
                          key={day}
                          size="small"
                          label={day}
                        />
                      ))}
                    </div>
                  );
                }}
              >
                <MenuItem value="ALL" className='!py-0'>
                  <Checkbox
                    checked={bulkAssignDays.length === availableDays.length}
                  />
                  Select All
                </MenuItem>

                {availableDays.map((day) => (
                  <MenuItem key={day} value={day} className='!py-0'>
                    <Checkbox
                      checked={bulkAssignDays.includes(day)}
                    />
                    {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <Autocomplete
            multiple
            options={[
              {
                employeeId: "ALL",
                employeeName: "Select All",
                department: "",
                employeeCode: "ALL"
              },
              ...rosterData,
            ]}
            disableCloseOnSelect
            value={rosterData.filter((emp) =>
              bulkAssignEmployees.includes(emp.employeeId)
            )}
            getOptionLabel={(option) =>
              `${option.employeeName} ${option.department ? `- ${option.department}` : ""
              }`
            }
            onChange={(_, value) => {
              const ids = value.map((v) => v.employeeId);

              if (ids.includes("ALL")) {
                if (bulkAssignEmployees.length === allEmployeeIds.length) {
                  setBulkAssignEmployees([]);
                } else {
                  setBulkAssignEmployees(allEmployeeIds);
                }
              } else {
                setBulkAssignEmployees(ids);
              }
            }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              const isAll = option.employeeId === "ALL";
              return (
                <li key={key} {...optionProps} className='!p-2 !flex !items-start'>
                  <Checkbox
                    className='!grid !items-start !justify-start !py-0 '
                    checked={
                      isAll
                        ? bulkAssignEmployees.length === allEmployeeIds.length
                        : bulkAssignEmployees.includes(option.employeeId)
                    }
                  />

                  <div className=''>
                    <div className="text-[12px]">{option.employeeName} - {option.employeeCode}</div>
                    <span className='text-[10px] text-gray-500'> {!isAll && `${option.department ? option.department : ''}`}</span>
                  </div>
                </li>
              );
            }}
            renderValue={(selected) => {
              if (selected.length === allEmployeeIds.length) {
                return (
                  <Chip
                    size="small"
                    label="All Employees"
                    color="primary"
                    className='mr-2'
                  />
                );
              }

              return (
                <div className="flex flex-wrap gap-1">
                  {selected.map((option) => (
                    <Chip
                      key={option.employeeId}
                      size="small"
                      label={option.employeeName}
                      className='mr-1'
                    />
                  ))}
                </div>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Employees"
                placeholder="Search employee..."
              />
            )}
          />
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={() => setBulkAssignOpen(false)} variant='outlined' className='!border-gray-300 !text-gray-800'>Cancel</Button>
          <Button onClick={handleBulkAssignSubmit} variant="contained" className="!bg-primary">
            Assign Shifts
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Info Dialog */}
      <Dialog open={openAlertDialog} onClose={() => setopenAlertDialog(false)} maxWidth="md" sx={commonsx}>
        <DialogTitle className='!p-2 border-b border-gray-200'>
          <div className="flex justify-between items-center">
            <div className='flex ml-4'>
              <WarningOutlined className="text-yellow-600" />
              <div className="ml-2 text-yellow-800 font-semibold">Alerts</div>
            </div>
            <IconButton onClick={() => setopenAlertDialog(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="mt-6 ">
              <div>
                <div className="grid items-start gap-3">

                  <div>
                    <div className='grid grid-cols-1 gap-3'>
                      {alerts.map((alert, index) => (
                        <div key={index} className="text-yellow-700 py-3  px-3 bg-yellow-50 text-[12px]">
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={() => setopenAlertDialog(false)} variant='outlined' className='!border-gray-300 !text-gray-800'>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
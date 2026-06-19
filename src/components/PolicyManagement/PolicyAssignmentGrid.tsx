import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  LocationCity as LocationIcon,
  Badge as BadgeIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  CloseOutlined,
  WorkOutlined,
} from '@mui/icons-material';
import { type Employee, type PolicyAssignment, EmploymentType } from '../../types/policy';

interface PolicyConflict {
  conflictingAssignmentId: string;
  conflictType: string;
  conflictMessage: string;
  id?: string;
  assignmentId?: string;
  createdAt?: string;
}
import { slidersx, typeLabels } from './const';
import { useUI } from '../../context/Snackbar';
import { branchService } from '../../services/modules/branch';
import { departmentService } from '../../services/modules/department';
import { categoryService } from '../../services/modules/category';
import type { Branches, Department, Designation } from '../../pages/employees/type';
import { EmployeeSelector } from './Common/EmployeeSelector';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import type { AssignmentFormData, PolicyAssignmentGridProps } from './types';
import { policyService } from '../../services/modules/policy';
import { formatDate } from '../../utils/dateFormatter';
import { selectSx } from '../../const';

const typeIcons: Record<string, React.ReactNode> = {
  BRANCH: <LocationIcon />,
  DEPARTMENT: <BusinessIcon />,
  DESIGNATION: <BadgeIcon />,
  EMPLOYMENT_TYPE: <GroupIcon />,
  EMPLOYEE_TEMPLATE: <WorkOutlined />,
  SPECIFIC_EMPLOYEES: <PersonIcon />,
};

const extractArrayFromResponse = (response: any): any[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
  if (response.items && Array.isArray(response.items)) return response.items;
  return [];
};

export const PolicyAssignmentGrid: React.FC<PolicyAssignmentGridProps> = ({
  assignments,
  companyId,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onCheckConflicts,
  policyVersionId,
  readOnly = false,
}) => {
  
  // Lookup data
  const [branches, setBranches] = useState<Branches[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<PolicyAssignment | null>(null);
  const [conflicts, setConflicts] = useState<PolicyConflict[]>([]);
  const [conflictsChecked, setConflictsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Selected employee for SPECIFIC_EMPLOYEES type
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<AssignmentFormData>({
    type: 'BRANCH',
    values: [],
    priority: 50,
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  const { showSpinner, hideSpinner } = useUI();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [branchesRes, departmentsRes, designationsRes, employmentTypesRes, templatesRes] = await Promise.all([
          branchService.getDropdownBranches(),
          departmentService.getActiveDepartments(),
          categoryService.getCategoryItems('00c4fd3c-4fb6-4d33-932e-80a615a90825'),
          categoryService.getCategoryItems('5504ad78-7089-42ec-8219-2a579d99bb0a'),
          categoryService.getCategoryItems('515d5fe8-2f41-41fe-aab3-6da80a5cfae1'),
        ]);
        setBranches(extractArrayFromResponse(branchesRes));
        setDepartments(extractArrayFromResponse(departmentsRes));
        setDesignations(extractArrayFromResponse(designationsRes));
        setEmploymentTypes(extractArrayFromResponse(employmentTypesRes));
        setTemplates(extractArrayFromResponse(templatesRes));
      } catch (error) {
        console.error('Error fetching assignment lookup data:', error);
      }
    };
    fetchAllData();
  }, []);

  const getOptionsForType = (type: string): { id: string; name: string }[] => {
    switch (type) {
      case 'BRANCH':
        return branches.map(b => ({ id: b.id, name: b.branchName }));
      case 'DEPARTMENT':
        return departments.map(d => ({ id: d.id, name: d.departmentName }));
      case 'DESIGNATION':
        return designations.map(d => ({ id: d.id, name: d.name }));
      case 'EMPLOYMENT_TYPE':
        return employmentTypes.map(e => ({ id: e.id, name: e.name }));
      case 'EMPLOYEE_TEMPLATE':
        return templates.map(t => ({ id: t.id, name: t.name }));
      default:
        return [];
    }
  };

  const getAssignmentLabel = (assignment: PolicyAssignment) => {
    if (assignment.branchId) {
      const branch = branches.find(b => b.id === assignment.branchId);
      return `${branch?.branchName || assignment.branchId} (Branch)`;
    }
    if (assignment.departmentId) {
      const dept = departments.find(d => d.id === assignment.departmentId);
      return `${dept?.departmentName || assignment.departmentId} (Department)`;
    }
    if (assignment.designationId) {
      const des = designations.find(d => d.id === assignment.designationId);
      return `${des?.name || assignment.designationId} (Designation)`;
    }
    if (assignment.employmentType) {
      return `${assignment.employmentType} (Employment Type)`;
    }
    if (assignment.template) {
      return `${assignment.template} (Template)`;
    }
    if (assignment.employeeGroupId) {
      return `Employee Group: ${assignment.employeeGroupId}`;
    }
    if (assignment.employeeId) {
      return `Specific Employee: ${assignment.employeeId}`;
    }
    return 'All Employees (Company-wide)';
  };

  const resetConflicts = () => {
    setConflicts([]);
    setConflictsChecked(false);
  };

  const handleOpenDialog = async (assignment?: PolicyAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        type: assignment.branchId ? 'BRANCH'
          : assignment.departmentId ? 'DEPARTMENT'
            : assignment.designationId ? 'DESIGNATION'
              : assignment.employmentType ? 'EMPLOYMENT_TYPE'
                : assignment.template ? 'EMPLOYEE_TEMPLATE'
                  : 'SPECIFIC_EMPLOYEES',
        values: [
          assignment.branchId ||
          assignment.departmentId ||
          assignment.designationId ||
          assignment.employmentType ||
          assignment.template ||
          assignment.employeeGroupId ||
          assignment.employeeId ||
          '',
        ].filter(Boolean),
        priority: assignment.priority,
        effectiveFrom: assignment.effectiveFrom.split('T')[0],
        effectiveTo: assignment.effectiveTo?.split('T')[0],
      });
      resetConflicts();
      setDialogOpen(true);

      // if (assignment.employeeId) {
      //   try {
      //     const empRes: any = await employeeService.getEmployeeById(assignment.employeeId);
      //     setSelectedEmployee(empRes?.data || null);
      //   } catch {
      //     setSelectedEmployee(null);
      //   }
      // } else {
      //   setSelectedEmployee(null);
      // }

      try {
        const res = await policyService.getAssignmentConflicts(assignment.id);
        const conflictsData = extractArrayFromResponse(res);
        if (conflictsData.length > 0) {
          setConflicts(conflictsData);
          setConflictsChecked(true);
        }
      } catch {
        // non-critical — user can still check manually
      }
    } else {
      setEditingAssignment(null);
      setFormData({
        type: 'BRANCH',
        values: [],
        priority: 50,
        effectiveFrom: new Date().toISOString().split('T')[0],
      });
      setSelectedEmployee(null);
      resetConflicts();
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAssignment(null);
    setSelectedEmployee(null);
    setFormData({
      type: 'BRANCH',
      values: [],
      priority: 50,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    resetConflicts();
  };

  const buildAssignmentData = (): Partial<PolicyAssignment> => {
    const data: Partial<PolicyAssignment> = {
      policyVersionId,
      companyId,
      priority: formData.priority,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo,
    };
    switch (formData.type) {
      case 'BRANCH': data.branchId = formData.values[0]; break;
      case 'DEPARTMENT': data.departmentId = formData.values[0]; break;
      case 'DESIGNATION': data.designationId = formData.values[0]; break;
      case 'EMPLOYMENT_TYPE': data.employmentType = formData.values[0] as EmploymentType; break;
      case 'EMPLOYEE_TEMPLATE': data.template = formData.values[0]; break;
      case 'SPECIFIC_EMPLOYEES': data.employeeId = formData.values[0]; break;
    }
    return data;
  };

  const isFormValid = () => {
    if (formData.type === 'SPECIFIC_EMPLOYEES') return !!selectedEmployee;
    return !!formData.values[0];
  };

  const handleCheckConflicts = async () => {
    setLoading(true);
    showSpinner();
    try {
      const assignment = buildAssignmentData();
      let conflictsData: PolicyConflict[];
      if (onCheckConflicts) {
        const result = await onCheckConflicts(assignment);
        conflictsData = result as unknown as PolicyConflict[];
      } else {
        const res = await policyService.checkConflicts(assignment);
        conflictsData = extractArrayFromResponse(res);
      }
      setConflicts(conflictsData);
      setConflictsChecked(true);
    } finally {
      setLoading(false);
      hideSpinner();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    showSpinner();
    try {
      const assignmentData = buildAssignmentData();
      if (editingAssignment) {
        await onUpdateAssignment(editingAssignment.id, assignmentData);
      } else {
        await onAddAssignment(assignmentData);
      }
      handleCloseDialog();
    } finally {
      setLoading(false);
      hideSpinner();
    }
  };

  return (
    <Box className="px-4">
      <div className='flex justify-between items-center mb-3'>
        <Typography variant="h6">Policy Assignments</Typography>
        {!readOnly && (
          <Button
            variant="contained"
            className='!bg-primary'
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Assignment
          </Button>
        )}
      </div>

      {Object.keys(assignments).length === 0 ? (
        <Grid container>
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No assignments configured. This policy will not apply to any employees.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        Object.entries(assignments).map(([versionNo, versionAssignments]) => (
          <Box key={versionNo} className="mb-4">
            <Typography variant="subtitle2" className="!mb-2 !text-gray-500">
              Version {versionNo}
            </Typography>
            <Grid container spacing={2}>
              {versionAssignments?.map((assignment) => (
                <Grid size={{ xs: 12, md: 4, sm: 6 }} key={assignment.id}>
                  <Card className='!bg-white-50 !text-gray-800'>
                    <CardContent>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-1'>
                          {typeIcons[
                            assignment.branchId ? 'BRANCH'
                              : assignment.departmentId ? 'DEPARTMENT'
                                : assignment.designationId ? 'DESIGNATION'
                                  : assignment.employmentType ? 'EMPLOYMENT_TYPE'
                                    : assignment.template ? 'EMPLOYEE_TEMPLATE'
                                      : assignment.employeeGroupId ? 'SPECIFIC_EMPLOYEES'
                                        : 'SPECIFIC_EMPLOYEES'
                          ]}
                          <Typography variant="subtitle2">
                            {getAssignmentLabel(assignment)}
                          </Typography>
                        </div>
                        {!readOnly && (
                          <Box>
                            <IconButton size="small" onClick={() => handleOpenDialog(assignment)}>
                              <EditIcon fontSize="small" className='text-blue-500' />
                            </IconButton>
                            <IconButton size="small" onClick={() => onDeleteAssignment(assignment.id)}>
                              <DeleteIcon fontSize="small" className='text-red-500' />
                            </IconButton>
                          </Box>
                        )}
                      </div>

                      <Divider sx={{ my: 1 }} />

                      <div className='flex justify-between mt-1'>
                        <Typography variant="caption" color="text.secondary">
                          Priority: {assignment.priority}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Effective: {formatDate(assignment.effectiveFrom)}
                          {assignment.effectiveTo && ` - ${formatDate(assignment.effectiveTo)}`}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}

      {/* Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <div className='flex justify-between items-center p-2 border-b border-gray-200'>
          <div className="text-[12px] ml-4 text-gray-800">
            {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
          </div>
          <IconButton onClick={handleCloseDialog}>
            <CloseOutlined className='text-gray-800' />
          </IconButton>
        </div>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>

            {/* Assignment Type */}
            <Grid size={{ xs: 12, md:6 }}>
              <FormControl fullWidth>
                <InputLabel>Assignment Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Assignment Type"
                  sx={selectSx}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value as AssignmentFormData['type'], values: [] });
                    setSelectedEmployee(null);
                    resetConflicts();
                  }}
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Value selector — EmployeeSelector for SPECIFIC_EMPLOYEES, Select for the rest */}
            <Grid size={{ xs: 12, md:6 }}>
              {formData.type === 'SPECIFIC_EMPLOYEES' ? (
                <EmployeeSelector
                  // companyId={companyId}
                  value={selectedEmployee}
                  onChange={(emp) => {
                    const e = emp as Employee | null;
                    setSelectedEmployee(e);
                    setFormData({ ...formData, values: e ? [e.id] : [] });
                    resetConflicts();
                  }}
                  label="Select Employee"
                  placeholder="Search and select an employee…"
                />
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Select {typeLabels[formData.type]}</InputLabel>
                  <Select
                    value={formData.values[0] || ''}
                    label={`Select ${typeLabels[formData.type]}`}
                    sx={selectSx}
                    onChange={(e) => {
                      setFormData({ ...formData, values: [e.target.value] });
                      resetConflicts();
                    }}
                  >
                    {getOptionsForType(formData.type).map(option => (
                      <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Effective dates */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                {/* Effective dates */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Effective From"
                    value={formData.effectiveFrom ? dayjs(formData.effectiveFrom) : null}
                    onChange={(newValue) => {
                      setFormData({
                        ...formData,
                        effectiveFrom: newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                      });
                      resetConflicts();
                    }}
                    maxDate={formData.effectiveTo ? dayjs(formData.effectiveTo) : undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Effective To"
                    value={formData.effectiveTo ? dayjs(formData.effectiveTo) : null}
                    onChange={(newValue) => {
                      setFormData({
                        ...formData,
                        effectiveTo: newValue ? dayjs(newValue).format("YYYY-MM-DD") : undefined
                      });
                      resetConflicts();
                    }}
                    minDate={formData.effectiveFrom ? dayjs(formData.effectiveFrom) : undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },
                    }}
                  />
                </Grid>
            </LocalizationProvider>

            {/* Priority slider */}
            <Grid size={{ xs: 12 }} className="!px-4">
              <Typography gutterBottom>Priority: {formData.priority}</Typography>
              <Slider
                value={formData.priority}
                onChange={(_, value) => setFormData({ ...formData, priority: value as number })}
                min={0}
                max={100}
                step={10}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: 'Low' },
                  { value: 50, label: 'Medium' },
                  { value: 100, label: 'High' },
                ]}
                sx={slidersx}
              />
              <div className='mt-2 text-gray-500 text-[12px]'>
                Higher priority policies override lower priority ones when conflicts occur.
              </div>
            </Grid>

            {/* Conflict check result */}
            {conflictsChecked && (
              <Grid size={{ xs: 12 }}>
                {conflicts.length === 0 ? (
                  <Alert severity="success">
                    No conflicts found. This assignment is safe to save.
                  </Alert>
                ) : (
                  <Alert severity="warning" icon={<WarningIcon />}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      This assignment overlaps with existing ones. The higher-priority one will take precedence.
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Conflict Type</TableCell>
                            <TableCell>Details</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {conflicts.map((conflict, i) => (
                            <TableRow key={conflict.conflictingAssignmentId ?? i}>
                              <TableCell>
                                <span className="text-xs font-mono text-orange-700">
                                  {conflict.conflictType}
                                </span>
                              </TableCell>
                              <TableCell className="!text-xs !text-gray-600">
                                {conflict.conflictMessage}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Alert>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={handleCloseDialog} variant='outlined' className='!border-gray-200 !text-gray-800'>
            Cancel
          </Button>
          <Button
            onClick={handleCheckConflicts}
            variant='outlined'
            className='!border-primary !text-primary'
            disabled={!isFormValid() || loading}
          >
            Check Conflicts
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className='!bg-primary'
            disabled={!isFormValid() || loading}
          >
            {editingAssignment ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

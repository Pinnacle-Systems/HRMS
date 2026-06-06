import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Business,
  Group,
  Badge,
  WorkOutlined,
  LocationCityOutlined,
  Person2Outlined,
} from '@mui/icons-material';
import { PolicyScopeLevel, type Employee } from '../../../types/policy';
import { helperSx } from '../const';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SCOPE_PRIORITY_HINTS, type AssignmentRule, type Step3SetEligibilityProps } from '../types';
import { branchService } from '../../../services/modules/branch';
import { departmentService } from '../../../services/modules/department';
import { categoryService } from '../../../services/modules/category';
import type { Branches, Department, Designation } from '../../../pages/employees/type';
import { EmployeeSelector } from '../Common/EmployeeSelector';

export const Step3SetEligibility: React.FC<Step3SetEligibilityProps> = ({
  config,
  onChange,
}) => {
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>(
    config?.assignments || []
  );

  const [branches, setBranches] = useState<Branches[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const extractArrayFromResponse = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.data.content && Array.isArray(response.data.content)) return response.data.content;
    if (response.items && Array.isArray(response.items)) return response.items;
    return [];
  };

  const fetchAllData = async () => {
    try {
      const [branchesRes, departmentsRes, designationsRes, employmentTypesRes, templatesRes] = await Promise.all([
        branchService.getDropdownBranches(),
        departmentService.getActiveDepartments(),
        categoryService.getCategoryItems("00c4fd3c-4fb6-4d33-932e-80a615a90825"),
        categoryService.getCategoryItems("5504ad78-7089-42ec-8219-2a579d99bb0a"),
        categoryService.getCategoryItems("515d5fe8-2f41-41fe-aab3-6da80a5cfae1"),
      ]);
      setBranches(extractArrayFromResponse(branchesRes));
      setDepartments(extractArrayFromResponse(departmentsRes));
      setDesignations(extractArrayFromResponse(designationsRes));
      setEmploymentTypes(extractArrayFromResponse(employmentTypesRes));
      setTemplates(extractArrayFromResponse(templatesRes));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const addAssignmentRule = () => {
    const newRule: AssignmentRule = {
      id: Date.now().toString(),
      type: 'DEPARTMENT',
      values: [],
      priority: PolicyScopeLevel.DEPARTMENT,
      effectiveFrom: new Date().toISOString().split('T')[0],
    };
    setAssignmentRules([...assignmentRules, newRule]);
  };

  const removeAssignmentRule = (id: string) => {
    setAssignmentRules(assignmentRules.filter(r => r.id !== id));
  };

  const updateAssignmentRule = (id: string, updates: Partial<AssignmentRule>) => {
    setAssignmentRules(assignmentRules.map(rule =>
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'BRANCH': return <LocationCityOutlined />;
      case 'DEPARTMENT': return <Business />;
      case 'DESIGNATION': return <Badge />;
      case 'EMPLOYMENT_TYPE': return <Group />;
      case 'EMPLOYEE_TEMPLATE': return <WorkOutlined />;
      case 'SPECIFIC_EMPLOYEES': return <Person2Outlined />;
      default: return <Group />;
    }
  };

  const getValuesForType = (type: string) => {
    switch (type) {
      case 'BRANCH': return branches;
      case 'DEPARTMENT': return departments;
      case 'DESIGNATION': return designations;
      case 'EMPLOYMENT_TYPE': return employmentTypes;
      case 'EMPLOYEE_TEMPLATE': return templates;
      case 'SPECIFIC_EMPLOYEES': return selectedEmployees;
      default: return [];
    }
  };

  useEffect(() => {
    onChange({ assignments: assignmentRules });
  }, [assignmentRules]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Define Eligibility</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Specify which employees this policy applies to. Higher priority number wins when multiple rules match.
      </Typography>

      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light', borderRadius: 1 }}>
        <Typography variant="caption" color="info.dark">
          <strong>Priority guide:</strong> Company (30) → Branch (40) → Department (50) → Designation (60) → Employee Group (70) → Specific Employee (80)
        </Typography>
      </Box>

      <div className='flex justify-end mb-3'>
        <Button variant="contained" className='!bg-primary' startIcon={<AddIcon />} onClick={addAssignmentRule}>
          Add Assignment Rule
        </Button>
      </div>

      {assignmentRules && assignmentRules.map((rule, index) => (
        <div key={rule.id} className='p-3 mb-2 bg-white-50 border border-gray-200 rounded-md'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-1'>
              <div className='!text-blue-400 mr-2'>{getRuleIcon(rule.type)}</div>
              <div className='text-[12px] text-gray-800'>Assignment Rule {index + 1}</div>
              <Chip label={`Priority: ${rule.priority}`} size="small" className='!border-primary !ml-2 !text-primary' variant="outlined" />
            </div>
            <Tooltip title="Remove rule">
              <IconButton onClick={() => removeAssignmentRule(rule.id)} size="small">
                <DeleteIcon className='text-red-500' />
              </IconButton>
            </Tooltip>
          </div>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={rule.type}
                  label="Rule Type"
                  onChange={(e) => {
                    const newType = e.target.value as AssignmentRule['type'];
                    updateAssignmentRule(rule.id, {
                      type: newType,
                      values: [],
                      priority: SCOPE_PRIORITY_HINTS[newType] ?? 50,
                    });
                  }}
                >
                  <MenuItem value="BRANCH">Branch</MenuItem>
                  <MenuItem value="DEPARTMENT">Department</MenuItem>
                  <MenuItem value="DESIGNATION">Designation</MenuItem>
                  <MenuItem value="EMPLOYMENT_TYPE">Employment Type</MenuItem>
                  <MenuItem value="EMPLOYEE_TEMPLATE">Employee Template</MenuItem>
                  <MenuItem value="SPECIFIC_EMPLOYEES">Specific Employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>

              {
                rule.type != 'SPECIFIC_EMPLOYEES' &&
                <Autocomplete
                  multiple
                  options={getValuesForType(rule.type)}
                  getOptionLabel={(option) => option.name || option.departmentName || option.branchName}
                  value={getValuesForType(rule.type).filter((v: any) => rule.values.includes(v.id))}
                  onChange={(_, newValue) => updateAssignmentRule(rule.id, { values: newValue.map(v => v.id) })}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Values" placeholder="Choose…" />
                  )}
                />
              }
              {
                rule.type == 'SPECIFIC_EMPLOYEES' &&
                <Box>
                  <EmployeeSelector
                    companyId="company_123"
                    value={selectedEmployees}
                    onChange={(value) => setSelectedEmployees(value as Employee[])}
                    multiple={true}
                    label="Select Employees"
                    placeholder="Search multiple employees..."
                  />
                </Box>
              }
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth type="number" label="Priority"
                value={rule.priority}
                onChange={(e) => updateAssignmentRule(rule.id, { priority: parseInt(e.target.value) })}
                helperText="Higher = more specific"
                sx={helperSx}
              />
            </Grid>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="Effective From"
                  value={rule.effectiveFrom ? dayjs(rule.effectiveFrom) : null}
                  onChange={(newValue) =>
                    updateAssignmentRule(rule.id, {
                      effectiveFrom: newValue
                        ? dayjs(newValue).format("YYYY-MM-DD")
                        : "",
                    })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="Effective To (optional)"
                  value={rule.effectiveTo ? dayjs(rule.effectiveTo) : null}
                  onChange={(newValue) =>
                    updateAssignmentRule(rule.id, {
                      effectiveTo: newValue
                        ? dayjs(newValue).format("YYYY-MM-DD")
                        : undefined,
                    })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}

                />
              </Grid>
            </LocalizationProvider>
          </Grid>
          {/* {rule.type === 'SPECIFIC_EMPLOYEES' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Employee-specific assignment will be available once the backend API is connected. Priority defaults to 80 (highest).
            </Alert>
          )} */}
        </div>
      ))}

      {assignmentRules.length === 0 && (
        <Alert severity="warning" action={<Button color="warning" size="small" onClick={addAssignmentRule}>Add Rule</Button>}>
          No eligibility rules configured. Without rules this policy applies to the entire company (lowest priority).
        </Alert>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
        <div className='text-[12px] text-green-700 font-bold'>Policy Precedence</div>
        <div className='text-[12px] text-[darkgreen] mt-2'>
          When multiple policies match an employee, the system uses priority (higher number wins).
          Employee-specific overrides (80) always beat department rules (50) which beat company-wide rules (30).
        </div>
      </Box>
    </Box>
  );
};

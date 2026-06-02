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
  Paper,
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
  LocationCity,
  Group,
  Badge,
  WorkOutlined,
} from '@mui/icons-material';
import { PolicyScopeLevel } from '../../../types/policy';
import { MOCK_EMPLOYEE_GROUPS } from '../../../services/mockPolicyService';

interface Step3SetEligibilityProps {
  companyId: string;
  config: any;
  onChange: (config: any) => void;
}

interface AssignmentRule {
  id: string;
  type: 'BRANCH' | 'DEPARTMENT' | 'DESIGNATION' | 'EMPLOYMENT_TYPE' | 'EMPLOYEE_CATEGORY' | 'EMPLOYEE_GROUP' | 'SPECIFIC_EMPLOYEES';
  values: string[];
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  conditions?: Record<string, any>;
}

const SCOPE_PRIORITY_HINTS: Record<string, number> = {
  BRANCH:            PolicyScopeLevel.BRANCH,
  DEPARTMENT:        PolicyScopeLevel.DEPARTMENT,
  DESIGNATION:       PolicyScopeLevel.DESIGNATION,
  EMPLOYMENT_TYPE:   PolicyScopeLevel.DESIGNATION,
  EMPLOYEE_CATEGORY: PolicyScopeLevel.DESIGNATION,
  EMPLOYEE_GROUP:    PolicyScopeLevel.EMPLOYEE_GROUP,
  SPECIFIC_EMPLOYEES: PolicyScopeLevel.EMPLOYEE,
};

export const Step3SetEligibility: React.FC<Step3SetEligibilityProps> = ({
  config,
  onChange,
}) => {
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>(
    config?.assignments || []
  );

  const [branches] = useState([
    { id: 'branch1', name: 'Chennai HQ' },
    { id: 'branch2', name: 'Bangalore Office' },
    { id: 'branch3', name: 'Mumbai Factory' },
  ]);

  const [departments] = useState([
    { id: 'dept1', name: 'Engineering' },
    { id: 'dept2', name: 'Sales' },
    { id: 'dept3', name: 'HR' },
    { id: 'dept4', name: 'Production' },
  ]);

  const [designations] = useState([
    { id: 'des1', name: 'Manager' },
    { id: 'des2', name: 'Senior Engineer' },
    { id: 'des3', name: 'Associate' },
    { id: 'des4', name: 'Worker' },
  ]);

  const employmentTypes = [
    { id: 'PERMANENT',   name: 'Permanent' },
    { id: 'CONTRACT',    name: 'Contract' },
    { id: 'INTERN',      name: 'Intern' },
    { id: 'CONSULTANT',  name: 'Consultant' },
    { id: 'PROBATION',   name: 'Probation' },
    { id: 'TEMPORARY',   name: 'Temporary' },
  ];

  const employeeCategories = [
    { id: 'STAFF',         name: 'Staff (Office / White-collar)' },
    { id: 'LABOUR',        name: 'Labour (Factory / Production floor)' },
    { id: 'GROUND_WORKER', name: 'Ground Worker (Retail / Field / Security)' },
    { id: 'SUPERVISOR',    name: 'Supervisor (Team lead / Floor supervisor)' },
    { id: 'TECHNICIAN',    name: 'Technician (Electrician / Mechanic / Maintenance)' },
  ];

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
      case 'BRANCH':            return <LocationCity />;
      case 'DEPARTMENT':        return <Business />;
      case 'DESIGNATION':       return <Badge />;
      case 'EMPLOYMENT_TYPE':   return <Group />;
      case 'EMPLOYEE_CATEGORY': return <WorkOutlined />;
      default:                  return <Group />;
    }
  };

  const getValuesForType = (type: string) => {
    switch (type) {
      case 'BRANCH':            return branches;
      case 'DEPARTMENT':        return departments;
      case 'DESIGNATION':       return designations;
      case 'EMPLOYMENT_TYPE':   return employmentTypes;
      case 'EMPLOYEE_CATEGORY': return employeeCategories;
      case 'EMPLOYEE_GROUP':    return MOCK_EMPLOYEE_GROUPS;
      default:                  return [];
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

      <div className='flex justify-end mb-2'>
        <Button variant="contained" startIcon={<AddIcon />} onClick={addAssignmentRule}>
          Add Assignment Rule
        </Button>
      </div>

      {assignmentRules.map((rule, index) => (
        <Paper key={rule.id} elevation={2} sx={{ p: 2, mb: 2 }}>
          <div className='flex justify-between items-center mb-2'>
            <div className='flex items-center gap-1'>
              {getRuleIcon(rule.type)}
              <Typography variant="subtitle1">Assignment Rule {index + 1}</Typography>
              <Chip label={`Priority: ${rule.priority}`} size="small" color="primary" variant="outlined" />
            </div>
            <Tooltip title="Remove rule">
              <IconButton onClick={() => removeAssignmentRule(rule.id)} size="small">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </div>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
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
                  <MenuItem value="EMPLOYEE_CATEGORY">Employee Category</MenuItem>
                  <MenuItem value="EMPLOYEE_GROUP">Employee Group</MenuItem>
                  <MenuItem value="SPECIFIC_EMPLOYEES">Specific Employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                multiple
                size="small"
                options={getValuesForType(rule.type)}
                getOptionLabel={(option) => option.name}
                value={getValuesForType(rule.type).filter(v => rule.values.includes(v.id))}
                onChange={(_, newValue) => updateAssignmentRule(rule.id, { values: newValue.map(v => v.id) })}
                renderInput={(params) => (
                  <TextField {...params} label="Select Values" placeholder="Choose…" />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth type="number" size="small" label="Priority"
                value={rule.priority}
                onChange={(e) => updateAssignmentRule(rule.id, { priority: parseInt(e.target.value) })}
                helperText="Higher = more specific"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth size="small" type="date" label="Effective From"
                value={rule.effectiveFrom}
                onChange={(e) => updateAssignmentRule(rule.id, { effectiveFrom: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth size="small" type="date" label="Effective To (optional)"
                value={rule.effectiveTo || ''}
                onChange={(e) => updateAssignmentRule(rule.id, { effectiveTo: e.target.value || undefined })}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText="Leave blank for no expiry"
              />
            </Grid>
          </Grid>

          {rule.type === 'SPECIFIC_EMPLOYEES' && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Employee-specific assignment will be available once the backend API is connected. Priority defaults to 80 (highest).
            </Alert>
          )}
        </Paper>
      ))}

      {assignmentRules.length === 0 && (
        <Alert severity="warning" action={<Button color="warning" size="small" onClick={addAssignmentRule}>Add Rule</Button>}>
          No eligibility rules configured. Without rules this policy applies to the entire company (lowest priority).
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Policy Precedence</Typography>
        <Typography variant="body2" color="text.secondary">
          When multiple policies match an employee, the system uses priority (higher number wins).
          Employee-specific overrides (80) always beat department rules (50) which beat company-wide rules (30).
        </Typography>
      </Box>
    </Box>
  );
};

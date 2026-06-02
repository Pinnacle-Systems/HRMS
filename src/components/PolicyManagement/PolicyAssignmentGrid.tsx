import React, { useState } from 'react';
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
  DialogTitle,
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
  People as PeopleIcon,
  LocationCity as LocationIcon,
  Badge as BadgeIcon,
  Group as GroupIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { type PolicyAssignment, EmploymentType } from '../../types/policy';
// import { DateRangePicker } from './Common/DateRangePicker';

interface PolicyAssignmentGridProps {
  assignments: PolicyAssignment[];
  companyId: string;
  onAddAssignment: (assignment: Partial<PolicyAssignment>) => Promise<void>;
  onUpdateAssignment: (id: string, assignment: Partial<PolicyAssignment>) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onCheckConflicts: (assignment: Partial<PolicyAssignment>) => Promise<PolicyAssignment[]>;
  policyVersionId: string;
  readOnly?: boolean;
}

interface AssignmentFormData {
  type: 'BRANCH' | 'DEPARTMENT' | 'DESIGNATION' | 'EMPLOYMENT_TYPE' | 'EMPLOYEE_GROUP' | 'SPECIFIC_EMPLOYEES';
  values: string[];
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  BRANCH: <LocationIcon />,
  DEPARTMENT: <BusinessIcon />,
  DESIGNATION: <BadgeIcon />,
  EMPLOYMENT_TYPE: <GroupIcon />,
  EMPLOYEE_GROUP: <PeopleIcon />,
  SPECIFIC_EMPLOYEES: <PersonIcon />,
};

const typeLabels: Record<string, string> = {
  BRANCH: 'Branch',
  DEPARTMENT: 'Department',
  DESIGNATION: 'Designation',
  EMPLOYMENT_TYPE: 'Employment Type',
  EMPLOYEE_GROUP: 'Employee Group',
  SPECIFIC_EMPLOYEES: 'Specific Employees',
};

// Mock data - replace with API calls
const mockBranches = [
  { id: 'branch1', name: 'Chennai HQ' },
  { id: 'branch2', name: 'Bangalore Office' },
  { id: 'branch3', name: 'Mumbai Factory' },
];

const mockDepartments = [
  { id: 'dept1', name: 'Engineering' },
  { id: 'dept2', name: 'Sales' },
  { id: 'dept3', name: 'HR' },
  { id: 'dept4', name: 'Production' },
];

const mockDesignations = [
  { id: 'des1', name: 'Manager' },
  { id: 'des2', name: 'Senior Engineer' },
  { id: 'des3', name: 'Associate' },
  { id: 'des4', name: 'Worker' },
];

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<PolicyAssignment | null>(null);
  const [conflicts, setConflicts] = useState<PolicyAssignment[]>([]);
  const [formData, setFormData] = useState<AssignmentFormData>({
    type: 'BRANCH',
    values: [],
    priority: 50,
    effectiveFrom: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleOpenDialog = (assignment?: PolicyAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        type: assignment.branchId ? 'BRANCH' : 
              assignment.departmentId ? 'DEPARTMENT' :
              assignment.designationId ? 'DESIGNATION' :
              assignment.employmentType ? 'EMPLOYMENT_TYPE' :
              assignment.employeeGroupId ? 'EMPLOYEE_GROUP' : 'SPECIFIC_EMPLOYEES',
        values: [
          assignment.branchId || 
          assignment.departmentId || 
          assignment.designationId || 
          assignment.employmentType || 
          assignment.employeeGroupId || 
          assignment.employeeId || 
          ''
        ].filter(v => v),
        priority: assignment.priority,
        effectiveFrom: assignment.effectiveFrom.split('T')[0],
        effectiveTo: assignment.effectiveTo?.split('T')[0],
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        type: 'BRANCH',
        values: [],
        priority: 50,
        effectiveFrom: new Date().toISOString().split('T')[0],
      });
    }
    setConflicts([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAssignment(null);
    setFormData({
      type: 'BRANCH',
      values: [],
      priority: 50,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    setConflicts([]);
  };

  const handleCheckConflicts = async () => {
    setLoading(true);
    try {
      const assignmentData: Partial<PolicyAssignment> = {
        policyVersionId,
        companyId,
        priority: formData.priority,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo,
      };

      switch (formData.type) {
        case 'BRANCH':
          assignmentData.branchId = formData.values[0];
          break;
        case 'DEPARTMENT':
          assignmentData.departmentId = formData.values[0];
          break;
        case 'DESIGNATION':
          assignmentData.designationId = formData.values[0];
          break;
        case 'EMPLOYMENT_TYPE':
          assignmentData.employmentType = formData.values[0] as EmploymentType;
          break;
        case 'EMPLOYEE_GROUP':
          assignmentData.employeeGroupId = formData.values[0];
          break;
        case 'SPECIFIC_EMPLOYEES':
          assignmentData.employeeId = formData.values[0];
          break;
      }

      const conflictsData = await onCheckConflicts(assignmentData);
      setConflicts(conflictsData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const assignmentData: Partial<PolicyAssignment> = {
        policyVersionId,
        companyId,
        priority: formData.priority,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || undefined,
      };

      switch (formData.type) {
        case 'BRANCH':
          assignmentData.branchId = formData.values[0];
          break;
        case 'DEPARTMENT':
          assignmentData.departmentId = formData.values[0];
          break;
        case 'DESIGNATION':
          assignmentData.designationId = formData.values[0];
          break;
        case 'EMPLOYMENT_TYPE':
          assignmentData.employmentType = formData.values[0] as EmploymentType;
          break;
        case 'EMPLOYEE_GROUP':
          assignmentData.employeeGroupId = formData.values[0];
          break;
        case 'SPECIFIC_EMPLOYEES':
          assignmentData.employeeId = formData.values[0];
          break;
      }

      if (editingAssignment) {
        await onUpdateAssignment(editingAssignment.id, assignmentData);
      } else {
        await onAddAssignment(assignmentData);
      }
      handleCloseDialog();
    } finally {
      setLoading(false);
    }
  };

  const getOptionsForType = (type: string) => {
    switch (type) {
      case 'BRANCH': return mockBranches;
      case 'DEPARTMENT': return mockDepartments;
      case 'DESIGNATION': return mockDesignations;
      case 'EMPLOYMENT_TYPE': 
        return Object.values(EmploymentType).map(t => ({ id: t, name: t }));
      default: return [];
    }
  };

  const getAssignmentLabel = (assignment: PolicyAssignment) => {
    if (assignment.branchId) {
      const branch = mockBranches.find(b => b.id === assignment.branchId);
      return `${branch?.name || assignment.branchId} (Branch)`;
    }
    if (assignment.departmentId) {
      const dept = mockDepartments.find(d => d.id === assignment.departmentId);
      return `${dept?.name || assignment.departmentId} (Department)`;
    }
    if (assignment.designationId) {
      const des = mockDesignations.find(d => d.id === assignment.designationId);
      return `${des?.name || assignment.designationId} (Designation)`;
    }
    if (assignment.employmentType) {
      return `${assignment.employmentType} (Employment Type)`;
    }
    if (assignment.employeeId) {
      return `Specific Employee: ${assignment.employeeId}`;
    }
    return 'Unknown';
  };

  return (
    <Box>
      <div className='flex justify-between items-center mb-3'>
        <Typography variant="h6">Policy Assignments</Typography>
        {!readOnly && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Assignment
          </Button>
        )}
      </div>

      <Grid container spacing={2}>
        {assignments.map((assignment) => (
          <Grid size={{xs:12,md:6}} key={assignment.id}>
            <Card>
              <CardContent>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-1'>
                    {typeIcons[assignment.branchId ? 'BRANCH' : 
                               assignment.departmentId ? 'DEPARTMENT' :
                               assignment.designationId ? 'DESIGNATION' :
                               assignment.employmentType ? 'EMPLOYMENT_TYPE' :
                               assignment.employeeGroupId ? 'EMPLOYEE_GROUP' : 'SPECIFIC_EMPLOYEES']}
                    <Typography variant="subtitle2">
                      {getAssignmentLabel(assignment)}
                    </Typography>
                  </div>
                  {!readOnly && (
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenDialog(assignment)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDeleteAssignment(assignment.id)}>
                        <DeleteIcon fontSize="small" />
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
                    Effective: {new Date(assignment.effectiveFrom).toLocaleDateString()}
                    {assignment.effectiveTo && ` - ${new Date(assignment.effectiveTo).toLocaleDateString()}`}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {assignments.length === 0 && (
          <Grid size={{xs:12}}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No assignments configured. This policy will not apply to any employees.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <FormControl fullWidth>
                <InputLabel>Assignment Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Assignment Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, values: [] })}
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12}}>
              <FormControl fullWidth>
                <InputLabel>Select {typeLabels[formData.type]}</InputLabel>
                <Select
                  value={formData.values[0] || ''}
                  label={`Select ${typeLabels[formData.type]}`}
                  onChange={(e) => setFormData({ ...formData, values: [e.target.value] })}
                >
                  {getOptionsForType(formData.type).map(option => (
                    <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12}}>
              <Typography gutterBottom>
                Priority: {formData.priority}
              </Typography>
              <Slider
                value={formData.priority}
                onChange={(_, value) => setFormData({ ...formData, priority: value as number })}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                marks={[
                  { value: 0, label: 'Low' },
                  { value: 50, label: 'Medium' },
                  { value: 100, label: 'High' },
                ]}
              />
              <Typography variant="caption" color="text.secondary">
                Higher priority policies override lower priority ones when conflicts occur.
              </Typography>
            </Grid>

            <Grid size={{xs:12}}>
              {/* <DateRangePicker
                startDate={formData.effectiveFrom}
                endDate={formData.effectiveTo}
                onStartDateChange={(date) => setFormData({ ...formData, effectiveFrom: date })}
                onEndDateChange={(date) => setFormData({ ...formData, effectiveTo: date })}
              /> */}
            </Grid>

            {conflicts.length > 0 && (
              <Grid size={{xs:12}}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="subtitle2">Conflicts Detected</Typography>
                  <Typography variant="body2">
                    This assignment overlaps with existing assignments. The one with higher priority will take precedence.
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Assignment</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell>Effective Period</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {conflicts.map(conflict => (
                          <TableRow key={conflict.id}>
                            <TableCell>{getAssignmentLabel(conflict)}</TableCell>
                            <TableCell>{conflict.priority}</TableCell>
                            <TableCell>
                              {new Date(conflict.effectiveFrom).toLocaleDateString()}
                              {conflict.effectiveTo && ` - ${new Date(conflict.effectiveTo).toLocaleDateString()}`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCheckConflicts} disabled={!formData.values[0] || loading}>
            Check Conflicts
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.values[0] || loading}>
            {editingAssignment ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
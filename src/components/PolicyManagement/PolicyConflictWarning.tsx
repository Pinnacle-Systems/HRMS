// src/components/PolicyManagement/PolicyConflictWarning.tsx

import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Visibility as ViewIcon,
  PriorityHigh as PriorityIcon,
  DateRange as DateIcon,
} from '@mui/icons-material';
import type{ PolicyAssignment } from '../../types/policy';

interface ConflictInfo {
  assignment: PolicyAssignment;
  policyName: string;
  policyVersion: number;
  conflictType: 'OVERLAP' | 'PRIORITY_CONFLICT' | 'DATE_OVERLAP';
  resolution?: string;
}

interface PolicyConflictWarningProps {
  open: boolean;
  onClose: () => void;
  conflicts: ConflictInfo[];
  onViewPolicy: (policyId: string) => void;
  onResolveConflict?: (conflict: ConflictInfo, resolution: 'OVERRIDE' | 'SKIP' | 'ADJUST_PRIORITY') => void;
}

const conflictTypeLabels: Record<string, { label: string; color: any }> = {
  OVERLAP: { label: 'Assignment Overlap', color: 'warning' },
  PRIORITY_CONFLICT: { label: 'Priority Conflict', color: 'error' },
  DATE_OVERLAP: { label: 'Date Overlap', color: 'info' },
};

export const PolicyConflictWarning: React.FC<PolicyConflictWarningProps> = ({
  open,
  onClose,
  conflicts,
  onViewPolicy,
  // onResolveConflict,
}) => {
  // const [expandedConflict, setExpandedConflict] = useState<string | null>(null);

  const getResolutionSuggestion = (conflict: ConflictInfo): string => {
    switch (conflict.conflictType) {
      case 'PRIORITY_CONFLICT':
        return `Consider adjusting priority. Current priority: ${conflict.assignment.priority}`;
      case 'DATE_OVERLAP':
        return `Adjust effective dates to avoid overlap (${new Date(conflict.assignment.effectiveFrom).toLocaleDateString()} - ${conflict.assignment.effectiveTo ? new Date(conflict.assignment.effectiveTo).toLocaleDateString() : 'Ongoing'})`;
      case 'OVERLAP':
        return 'One of these assignments may be redundant. Consider removing one or adjusting scope.';
      default:
        return 'Review assignment configuration';
    }
  };

  const getConflictSeverity = (conflicts: ConflictInfo[]): 'high' | 'medium' | 'low' => {
    if (conflicts.some(c => c.conflictType === 'PRIORITY_CONFLICT')) return 'high';
    if (conflicts.some(c => c.conflictType === 'OVERLAP')) return 'medium';
    return 'low';
  };

  const severity = getConflictSeverity(conflicts);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <div className='flex items-center gap-1'>
          <WarningIcon color="warning" />
          <Typography variant="h6">Policy Assignment Conflicts Detected</Typography>
          <Chip 
            label={severity.toUpperCase()} 
            color={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'}
            size="small"
          />
        </div>
      </DialogTitle>
      
      <DialogContent>
        <Alert 
          severity={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            {conflicts.length} conflict(s) detected in policy assignments. These may cause unexpected behavior
            when policies are evaluated. Review and resolve before activating.
          </Typography>
        </Alert>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Conflict Type</TableCell>
                <TableCell>Conflicting Policy</TableCell>
                <TableCell>Assignment Details</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Effective Period</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conflicts.map((conflict, index) => (
                <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Chip
                      label={conflictTypeLabels[conflict.conflictType].label}
                      color={conflictTypeLabels[conflict.conflictType].color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => onViewPolicy(conflict.assignment.policyVersionId)}
                    >
                      {conflict.policyName}
                    </Link>
                    <Typography>
                      v{conflict.policyVersion}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {conflict.assignment.branchId && `Branch: ${conflict.assignment.branchId}`}
                      {conflict.assignment.departmentId && `Dept: ${conflict.assignment.departmentId}`}
                      {conflict.assignment.designationId && `Designation: ${conflict.assignment.designationId}`}
                      {conflict.assignment.employmentType && `Employment: ${conflict.assignment.employmentType}`}
                      {conflict.assignment.employeeId && `Employee: ${conflict.assignment.employeeId}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Priority: ${conflict.assignment.priority}`}
                      size="small"
                      variant="outlined"
                      icon={<PriorityIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography >
                      <DateIcon fontSize="small" />
                      {new Date(conflict.assignment.effectiveFrom).toLocaleDateString()}
                      {conflict.assignment.effectiveTo && ` → ${new Date(conflict.assignment.effectiveTo).toLocaleDateString()}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Policy">
                      <IconButton size="small" onClick={() => onViewPolicy(conflict.assignment.policyVersionId)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Resolution Suggestions */}
        <div className='mt-3'>
          <Typography variant="subtitle2" gutterBottom>
            Resolution Suggestions
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {conflicts.map((conflict, index) => (
              <div key={index} className={`mb-${index < conflicts.length - 1 ? 2 : 0}`}>
                <Typography variant="body2" color="text.secondary">
                  • {getResolutionSuggestion(conflict)}
                </Typography>
              </div>
            ))}
          </Paper>
        </div>

        {/* Impact Analysis */}
        <div className='mt-3'>
          <Typography variant="subtitle2" gutterBottom>
            Impact Analysis
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2">
              When multiple policies apply to the same employee, the system uses the following precedence:
            </Typography>
            <Box component="ul" sx={{ mt: 0, pl: 2 }}>
              <li>
                <Typography variant="body2">
                  <strong>Higher priority values</strong> override lower priority values
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>More specific assignments</strong> (Employee &gt; Designation &gt; Department &gt; Branch)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Current effective date</strong> must fall within the policy period
                </Typography>
              </li>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                To resolve conflicts, you can either adjust priorities, modify effective dates,
                or refine assignment scopes to be more specific.
              </Typography>
            </Alert>
          </Paper>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="warning"
          onClick={() => {
            onClose();
            // Optionally trigger resolution workflow
          }}
        >
          Resolve Conflicts
        </Button>
      </DialogActions>
    </Dialog>
  );
};
// src/components/PolicyManagement/PolicyPreviewSimulator.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  // School as SchoolIcon,
} from '@mui/icons-material';
import { policyApi } from '../../services/modules/policy';
import { EmployeeSelector } from './Common/EmployeeSelector';
import { type PolicyEvaluationResponse, PolicyDomain } from '../../types/policy';

interface PolicyPreviewSimulatorProps {
  open: boolean;
  onClose: () => void;
  policyVersionId: string;
  policyName?: string;
}

const mockActions = [
  { value: 'APPLY_LEAVE', label: 'Apply for Leave', domain: PolicyDomain.LEAVE },
  { value: 'MARK_ATTENDANCE', label: 'Mark Attendance', domain: PolicyDomain.ATTENDANCE },
  { value: 'REQUEST_OVERTIME', label: 'Request Overtime', domain: PolicyDomain.OVERTIME },
  { value: 'SUBMIT_EXPENSE', label: 'Submit Expense', domain: PolicyDomain.EXPENSE },
];

export const PolicyPreviewSimulator: React.FC<PolicyPreviewSimulatorProps> = ({
  open,
  onClose,
  policyVersionId,
  policyName,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [context, setContext] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolicyEvaluationResponse | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const handleRunSimulation = async () => {
    if (!selectedEmployee || !selectedAction) return;

    setLoading(true);
    try {
      const response = await policyApi.previewPolicy(
        policyVersionId,
        selectedEmployee.id,
        selectedAction,
        context
      );
      setResult(response);
      setActiveStep(2);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedEmployee(null);
    setSelectedAction('');
    setContext({});
    setResult(null);
    setActiveStep(0);
  };

  const renderContextFields = () => {
    const action = mockActions.find(a => a.value === selectedAction);
    if (!action) return null;

    switch (action.domain) {
      case PolicyDomain.LEAVE:
        return (
          <>
            <TextField
              select
              fullWidth
              label="Leave Type"
              value={context.leaveType || ''}
              onChange={(e) => setContext({ ...context, leaveType: e.target.value })}
              margin="normal"
              size="small"
            >
              <MenuItem value="CL">Casual Leave (CL)</MenuItem>
              <MenuItem value="SL">Sick Leave (SL)</MenuItem>
              <MenuItem value="EL">Earned Leave (EL)</MenuItem>
              <MenuItem value="ML">Maternity Leave (ML)</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              value={context.fromDate || ''}
              onChange={(e) => setContext({ ...context, fromDate: e.target.value })}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              type="date"
              label="To Date"
              value={context.toDate || ''}
              onChange={(e) => setContext({ ...context, toDate: e.target.value })}
              margin="normal"
              size="small"
            />
          </>
        );

      case PolicyDomain.EXPENSE:
        return (
          <>
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={context.amount || ''}
              onChange={(e) => setContext({ ...context, amount: parseFloat(e.target.value) })}
              margin="normal"
              size="small"
            />
            <TextField
              select
              fullWidth
              label="Expense Category"
              value={context.category || ''}
              onChange={(e) => setContext({ ...context, category: e.target.value })}
              margin="normal"
              size="small"
            >
              <MenuItem value="TRAVEL">Travel</MenuItem>
              <MenuItem value="FOOD">Food</MenuItem>
              <MenuItem value="STATIONERY">Stationery</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
          </>
        );

      case PolicyDomain.OVERTIME:
        return (
          <TextField
            fullWidth
            type="number"
            label="Overtime Hours"
            value={context.hours || ''}
            onChange={(e) => setContext({ ...context, hours: parseFloat(e.target.value) })}
            margin="normal"
            size="small"
          />
        );

      default:
        return null;
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    if (result.allowed) {
      return <SuccessIcon sx={{ fontSize: 48, color: 'success.main' }} />;
    }
    return <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />;
  };

  const steps = ['Select Employee', 'Configure Action', 'View Results'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box className="flex justify-between items-center">
          <Typography variant="h6">
            Policy Simulator {policyName && `- ${policyName}`}
          </Typography>
          <Chip label="Preview Mode" color="info" size="small" />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Select an employee to test this policy
            </Typography>
            <EmployeeSelector
              companyId="company_123"
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              label="Employee"
              placeholder="Search and select an employee..."
            />
            <Box className="flex items-end">
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                disabled={!selectedEmployee}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Configure the action to simulate
            </Typography>
            
            <FormControl fullWidth size="small" margin="normal">
              <InputLabel>Action</InputLabel>
              <Select
                value={selectedAction}
                label="Action"
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setContext({});
                }}
              >
                {mockActions.map(action => (
                  <MenuItem key={action.value} value={action.value}>
                    {action.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderContextFields()}

            <Box className="flex justify-between items-center">
              <Button onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleRunSimulation}
                disabled={!selectedAction || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Run Simulation'}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && result && (
          <Box>
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Box className="flex gap-2 mb-3 items-center">
                {getResultIcon()}
                <Box>
                  <Typography variant="h6" color={result.allowed ? 'success.main' : 'error.main'}>
                    {result.allowed ? 'REQUEST ALLOWED' : 'REQUEST REJECTED'}
                  </Typography>
                  {result.policyName && (
                    <Typography variant="caption" color="text.secondary">
                      Evaluated by: {result.policyName} v{result.policyVersion}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Evaluation Details
              </Typography>
              
              {result.messages.map((msg, idx) => (
                <Alert 
                  key={idx}
                  severity={msg.type.toLowerCase() as any}
                  sx={{ mb: 1 }}
                  icon={msg.type === 'INFO' ? <InfoIcon /> : undefined}
                >
                  {msg.message}
                </Alert>
              ))}

              {result.computed && Object.keys(result.computed).length > 0 && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Computed Values
                    </Typography>
                    <Grid container spacing={1}>
                      {Object.entries(result.computed).map(([key, value]) => (
                        <Grid size={{xs:6}} key={key}>
                          <Typography variant="caption" color="text.secondary">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </Typography>
                          <Typography variant="body2">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {result.suggestions && result.suggestions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Suggestions
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {result.suggestions.map((suggestion, idx) => (
                      <li key={idx}>
                        <Typography variant="body2">{suggestion}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Paper>

            <Box className="flex justify-between items-center">
              <Button onClick={handleReset}>
                Test Another
              </Button>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Start Over
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
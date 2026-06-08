import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
} from '@mui/icons-material';
import { policyApi } from '../../services/modules/policy';
import { EmployeeSelector } from './Common/EmployeeSelector';
import { type PolicyEvaluationResponse, PolicyDomain } from '../../types/policy';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useUI } from '../../context/Snackbar';
import { leaveService } from '../../services/modules/leave';
import type { LeaveType } from '../../services/modules/leaveTypes';
import { EXPENSE_CATEGORIES, mockActions } from './const';
import type { PolicyPreviewSimulatorProps } from './types';

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
  const { showSpinner, hideSpinner,showSnackbar } = useUI();
  const [leaveType, setLeaveType] = useState<LeaveType[]>([]);

  const handleRunSimulation = async () => {
    if (!selectedEmployee || !selectedAction) return;
    showSpinner();
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
      hideSpinner();
    }
  };

  const handleReset = () => {
    setSelectedEmployee(null);
    setSelectedAction('');
    setContext({});
    setResult(null);
    setActiveStep(0);
  };

  const getLeaveTypes = async () => {
    try {
      const response = await leaveService.getLeaveTypes({
        page: 0,
        size: 50,
        sort: "name,ASC",
      });
      setLeaveType(response.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load leave types", "error");
    }
  };

  useEffect(() => {
    if (PolicyDomain.LEAVE) {
      getLeaveTypes();
    }
  }, [])

  const renderContextFields = () => {
    const action = mockActions.find(a => a.value === selectedAction);
    if (!action) return null;

    switch (action.domain) {
      case PolicyDomain.LEAVE:
        return (
          <>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Leave Type"
                  value={context.leaveType || ''}
                  onChange={(e) => setContext({ ...context, leaveType: e.target.value })}
                  margin="normal"
                  sx={{
                    "& .MuiInputBase-input": {
                      padding: '8px !important'
                    }
                  }}
                >
                  {leaveType.map((option) => (
                    <MenuItem key={option.id} value={option.code}>
                      {option.name} ({option.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DatePicker
                    label="From Date"
                    value={context.fromDate ? dayjs(context.fromDate) : null}
                    onChange={(newValue) =>
                      setContext({
                        ...context,
                        fromDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },

                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <DatePicker
                    label="To Date"
                    value={context.toDate ? dayjs(context.toDate) : null}
                    onChange={(newValue) =>
                      setContext({
                        ...context,
                        toDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                      })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                      },
                    }}
                  />
                </Grid>
              </LocalizationProvider>
            </Grid>

          </>
        );

      case PolicyDomain.EXPENSE:
        return (
          <div className='flex items-center gap-4'>
            <TextField
              select
              fullWidth
              label="Expense Category"
              value={context.category || ''}
              onChange={(e) => setContext({ ...context, category: e.target.value })}
              margin="normal"
            >
              {EXPENSE_CATEGORIES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={context.amount || ''}
              onChange={(e) => setContext({ ...context, amount: parseFloat(e.target.value) })}
              margin="normal"

            />
          </div>
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
            <Typography variant="subtitle2" gutterBottom className='!mb-6'>
              Select an employee to test this policy
            </Typography>
            <EmployeeSelector
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              label="Employee"
              placeholder="Search and select an employee..."
            />
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Configure the action to simulate
            </Typography>

            <FormControl fullWidth margin="normal">
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
          </Box>
        )}

        {activeStep === 2 && result && (
          <Box>
            <div className='px-4 py-2 mb-2 bg-white'>
              <Box className="flex gap-2 mb-2 items-center">
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
                <Card variant="outlined" sx={{ my: 1 }} className='bg-white text-gray-800 border border-gray-200'>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Computed Values
                    </Typography>
                    <Grid container spacing={1}>
                      {Object.entries(result.computed).map(([key, value]) => (
                        <Grid size={{ xs: 6 }} key={key}>
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
                  <Typography variant="subtitle2" gutterBottom className='!ml-1'>
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
            </div>

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

      <div className='!p-4 border-t flex justify-between items-center border-gray-200'>
        <div>
          {
            activeStep == 1 &&
            <Button onClick={() => setActiveStep(0)}>
              Back
            </Button>
          }
        </div>
        <div>
          <Button onClick={onClose} variant='outlined' className='!text-gray-800 !mr-4 !border-gray-200'>Close</Button>
          {
            activeStep == 0 &&
            <Button
              variant="contained" className='!bg-primary'
              onClick={() => setActiveStep(1)}
              disabled={!selectedEmployee}
            >
              Next
            </Button>
          }
          {
            activeStep == 1 &&
            <Button
              variant="contained"
              onClick={handleRunSimulation}
              disabled={!selectedAction || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Run Simulation'}
            </Button>
          }
        </div>
      </div>
    </Dialog>
  );
};
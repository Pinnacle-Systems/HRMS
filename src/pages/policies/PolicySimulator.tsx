import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { EmployeeSelector } from '../../components/PolicyManagement/Common/EmployeeSelector';
import { PolicyDomain, type PolicyEvaluationResponse } from '../../types/policy';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers';
import { policyService } from '../../services';
import { actionOptions } from './const';
import { useUI } from '../../context/Snackbar';
import { usePolicyDomains } from '../../hooks/usePolicyDomains';
import { useLeaveTypesList } from '../../hooks/useLeaveTypesList';
import { useExpenseCategoriesList } from '../../hooks/useExpenseCategoriesList';

export default function PolicySimulator() {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [action, setAction] = useState('');
  const [context, setContext] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolicyEvaluationResponse | null>(null);
  const { showSnackbar } = useUI();
  const { domains } = usePolicyDomains();
  const { leaveTypes: leaveType } = useLeaveTypesList(selectedDomain === PolicyDomain.LEAVE);
  const { expenseCategories: expenseCategory } = useExpenseCategoriesList(selectedDomain === PolicyDomain.EXPENSE);

  const handleRunSimulation = async () => {
    if (!selectedEmployee || !action || !selectedDomain) return;
    setLoading(true);
    try {
      const request: any = {
        employeeId: selectedEmployee.id,
        domain: selectedDomain as PolicyDomain,
        action,
        effectiveDate: new Date().toISOString().split('T')[0],
        context,
      };
      const response: any = await policyService.evaluatePolicy(request);
      setResult(response.data ?? response);
    } catch (error: any) {
      showSnackbar(error?.message || 'Simulation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    if (result.allowed) return <SuccessIcon sx={{ fontSize: 60, color: 'success.main' }} />;
    return <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />;
  };

  const renderContextFields = () => {
    switch (selectedDomain) {
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
              className="!mt-4"
            >
              {leaveType.map((option) => (
                <MenuItem key={option.id} value={option.code}>
                  {option.name} ({option.code})
                </MenuItem>
              ))}
            </TextField>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Effective From"
                value={context.fromDate ? dayjs(context.fromDate) : null}
                onChange={(newValue) => {
                  setContext({
                    ...context,
                    fromDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                  });
                }}
                maxDate={context.toDate ? dayjs(context.toDate) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                  },
                }}
              />

              <DatePicker
                label="Effective To"
                value={context.toDate ? dayjs(context.toDate) : null}
                onChange={(newValue) => {
                  setContext({
                    ...context,
                    toDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : undefined
                  });
                }}
                minDate={context.fromDate ? dayjs(context.fromDate) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                  },
                }}
              />
            </LocalizationProvider>
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
            />
            <TextField
              select
              fullWidth
              label="Expense Type"
              value={context.expenseType || ''}
              onChange={(e) => setContext({ ...context, expenseType: e.target.value })}
              margin="normal"
            >
              {
                expenseCategory.map((exp) => (
                  <MenuItem key={exp.id} value={exp.id}>{exp.name}</MenuItem>
                ))
              }
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

  return (
    <div className='pt-5'>
      <div className='font-bold mb-1 text-gray-800'>
        Policy Simulator
      </div>
      <div className='text-gray-500 text-[12px] mb-4'>
        Test how policies apply to employees by simulating different actions and scenarios.
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <div className='p-5 bg-white dark:bg-white-50 border border-gray-200 shadow-lg rounded-lg'>
            <Typography variant="subtitle1" gutterBottom>
              Simulation Parameters
            </Typography>

            <FormControl fullWidth margin="normal" className="!mt-6">
              <InputLabel>Policy Domain</InputLabel>
              <Select
                value={selectedDomain}
                label="Policy Domain"
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setAction('');
                  setContext({});
                }}
              >
                {domains.map(domain => (
                  <MenuItem key={domain.id} value={domain.code}>{domain.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box className="mt-4">
              <EmployeeSelector
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                label="Select Employee"
              />
            </Box>

            <FormControl fullWidth margin="normal" className="!mt-6">
              <InputLabel>Action</InputLabel>
              <Select
                value={action}
                label="Action"
                onChange={(e) => setAction(e.target.value)}
                disabled={!selectedEmployee}
              >
                {actionOptions[selectedDomain as PolicyDomain]?.map(act => (
                  <MenuItem key={act} value={act}>{act}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderContextFields()}

            <Button
              fullWidth
              variant="contained"
              className='!bg-primary'
              startIcon={<RunIcon />}
              onClick={handleRunSimulation}
              disabled={!selectedDomain || !selectedEmployee || !action || loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Run Simulation'}
            </Button>
          </div>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <div className='p-5 bg-white dark:bg-white-50 border border-gray-200 shadow-lg rounded-lg'>
            <Typography variant="subtitle1" gutterBottom>
              Simulation Results
            </Typography>

            {!result ? (
              <Alert severity="info">
                Configure the parameters above and click "Run Simulation" to see results.
              </Alert>
            ) : (
              <Box>
                <Box className="flex items-center gap-2 justify-center">
                  <div className='flex items-center gap-1 '>
                    {getResultIcon()}
                    <Typography color={result.allowed ? 'success.main' : 'error.main'}>
                      {result.allowed ? 'REQUEST ALLOWED' : 'REQUEST REJECTED'}
                    </Typography>
                  </div>
                  {result.policyName && (
                    <Chip
                      label={`Policy: ${result.policyName} v${result.policyVersion}`}
                      size="small" className='text-gray-800' variant='outlined'
                    />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} className='!border-gray-300' />

                <Typography variant="subtitle2" gutterBottom>
                  Evaluation Messages
                </Typography>
                {result.messages.map((msg, idx) => (
                  <Alert
                    key={idx}
                    severity={msg.type.toLowerCase() as any}
                    sx={{ mb: 1 }}
                    // className={msg.type !== 'INFO' ?'text-gray-800':''}
                    icon={msg.type === 'INFO' ? <InfoIcon /> : undefined}
                  >
                    {msg.message}
                  </Alert>
                ))}

                {result.computed && Object.keys(result.computed).length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Computed Values
                    </Typography>
                    <Card variant="outlined">
                      <CardContent>
                        {Object.entries(result.computed).map(([key, value]) => (
                          <Box key={key} className="flex justify-between">
                            <Typography variant="body2" color="text.secondary">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </Typography>
                            <Typography variant="body2">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}

                {result.suggestions && result.suggestions.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Suggestions
                    </Typography>
                    <ul>
                      {result.suggestions.map((suggestion, idx) => (
                        <li key={idx}>
                          <Typography variant="body2">{suggestion}</Typography>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Box>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
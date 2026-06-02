// src/pages/PolicySimulator.tsx

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
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
import { policyApi } from '../../services/modules/policy';
import { EmployeeSelector } from '../../components/PolicyManagement/Common/EmployeeSelector';
import { type PolicyEvaluationResponse, PolicyDomain } from '../../types/policy';

export  default function PolicySimulator() {
  const [selectedDomain, setSelectedDomain] = useState<PolicyDomain>(PolicyDomain.LEAVE);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [action, setAction] = useState('');
  const [context, setContext] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolicyEvaluationResponse | null>(null);

  const actionOptions: Record<PolicyDomain, string[]> = {
    [PolicyDomain.LEAVE]: ['APPLY_LEAVE', 'CANCEL_LEAVE', 'CHECK_BALANCE', 'GET_APPROVERS'],
    [PolicyDomain.ATTENDANCE]: ['MARK_ATTENDANCE', 'REGULARIZE_ATTENDANCE', 'CHECK_LATE_PENALTY'],
    [PolicyDomain.OVERTIME]: ['REQUEST_OVERTIME', 'APPROVE_OVERTIME', 'CALCULATE_OVERTIME'],
    [PolicyDomain.EXPENSE]: ['SUBMIT_EXPENSE', 'APPROVE_EXPENSE', 'CHECK_ELIGIBILITY'],
    [PolicyDomain.PAYROLL]: ['CALCULATE_SALARY', 'PROCESS_PAYROLL', 'CALCULATE_DEDUCTION'],
    [PolicyDomain.SHIFT]: ['REQUEST_SHIFT_CHANGE', 'CHECK_SHIFT_ELIGIBILITY'],
    [PolicyDomain.HOLIDAY]: ['CHECK_HOLIDAY_ELIGIBILITY', 'REQUEST_HOLIDAY_WORK'],
    [PolicyDomain.ALLOWANCE]: ['CHECK_ALLOWANCE_ELIGIBILITY', 'CALCULATE_ALLOWANCE'],
    [PolicyDomain.DEDUCTION]: ['CALCULATE_DEDUCTION', 'CHECK_DEDUCTION_APPLICABILITY'],
    [PolicyDomain.PROBATION]: ['CHECK_PROBATION_STATUS', 'EXTEND_PROBATION'],
    [PolicyDomain.NOTICE_PERIOD]: ['SUBMIT_RESIGNATION', 'CALCULATE_NOTICE_PAY'],
    [PolicyDomain.APPROVAL_WORKFLOW]: ['GET_APPROVAL_FLOW', 'CHECK_APPROVAL_STATUS'],
    [PolicyDomain.ONBOARDING]: ['CHECK_ONBOARDING_TASKS', 'VALIDATE_DOCUMENTS'],
    [PolicyDomain.OFFBOARDING]: ['INITIATE_OFFBOARDING', 'CHECK_EXIT_TASKS'],
    [PolicyDomain.COMP_OFF]: ['APPLY_COMP_OFF', 'CHECK_COMP_OFF_BALANCE', 'EARN_COMP_OFF'],
    [PolicyDomain.WORK_FROM_HOME]: ['REQUEST_WFH', 'CHECK_WFH_ELIGIBILITY', 'CHECK_WFH_BALANCE'],
  };

  const handleRunSimulation = async () => {
    if (!selectedEmployee || !action) return;

    setLoading(true);
    try {
      const request = {
        employeeId: selectedEmployee.id,
        domain: selectedDomain,
        action,
        effectiveDate: new Date().toISOString().split('T')[0],
        context,
      };
      const response = await policyApi.evaluatePolicy(request);
      setResult(response);
    } catch (error) {
      console.error('Simulation failed:', error);
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
              size="small"
            >
              <MenuItem value="CL">Casual Leave</MenuItem>
              <MenuItem value="SL">Sick Leave</MenuItem>
              <MenuItem value="EL">Earned Leave</MenuItem>
              <MenuItem value="ML">Maternity Leave</MenuItem>
              <MenuItem value="PL">Paternity Leave</MenuItem>
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
              label="Expense Type"
              value={context.expenseType || ''}
              onChange={(e) => setContext({ ...context, expenseType: e.target.value })}
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Policy Simulator
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Test how policies apply to employees by simulating different actions and scenarios.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{xs:12,md:5}}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Simulation Parameters
            </Typography>

            <FormControl fullWidth size="small" margin="normal">
              <InputLabel>Policy Domain</InputLabel>
              <Select
                value={selectedDomain}
                label="Policy Domain"
                onChange={(e) => {
                  setSelectedDomain(e.target.value as PolicyDomain);
                  setAction('');
                  setContext({});
                }}
              >
                {Object.values(PolicyDomain).map(domain => (
                  <MenuItem key={domain} value={domain}>{domain.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <EmployeeSelector
                companyId="company_123"
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                label="Select Employee"
              />
            </Box>

            <FormControl fullWidth size="small" margin="normal">
              <InputLabel>Action</InputLabel>
              <Select
                value={action}
                label="Action"
                onChange={(e) => setAction(e.target.value)}
                disabled={!selectedEmployee}
              >
                {actionOptions[selectedDomain]?.map(act => (
                  <MenuItem key={act} value={act}>{act}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderContextFields()}

            <Button
              fullWidth
              variant="contained"
              startIcon={<RunIcon />}
              onClick={handleRunSimulation}
              disabled={!selectedEmployee || !action || loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Run Simulation'}
            </Button>
          </Paper>
        </Grid>

        <Grid size={{xs:12,md:7}}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Simulation Results
            </Typography>

            {!result ? (
              <Alert severity="info">
                Configure the parameters above and click "Run Simulation" to see results.
              </Alert>
            ) : (
              <Box>
                <Box className="flex items-center justify-center">
                  {getResultIcon()}
                  <Typography  color={result.allowed ? 'success.main' : 'error.main'}>
                    {result.allowed ? 'REQUEST ALLOWED' : 'REQUEST REJECTED'}
                  </Typography>
                  {result.policyName && (
                    <Chip 
                      label={`Policy: ${result.policyName} v${result.policyVersion}`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Evaluation Messages
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
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
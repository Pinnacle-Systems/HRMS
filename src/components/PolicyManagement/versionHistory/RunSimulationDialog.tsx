import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton, TextField,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Grid,
  Chip, Button,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { PolicyVersion, Employee } from '../../../types/policy';
import { EmployeeSelector } from '../Common/EmployeeSelector';
import { policyService } from '../../../services';

interface RunSimulationDialogProps {
  open: boolean;
  version: PolicyVersion | null;
  onClose: () => void;
}

export const RunSimulationDialog: React.FC<RunSimulationDialogProps> = ({ open, version, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setType('');
      setEmployees([]);
      setResult(null);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!version || !name || !type) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await policyService.runVersionSimulation(version.id, {
        simulationName: name,
        simulationType: type,
        employeeIds: employees.map((e) => e.id),
      });
      setResult(res.data ?? res);
    } catch {
      setError('Failed to run simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <div className='flex items-center justify-between p-3 border-b border-gray-200'>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          <Typography variant="subtitle2">
            Run Simulation — v{version?.versionNo}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon className='!text-gray-800' />
        </IconButton>
      </div>
      <DialogContent>
        {!result ? (
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Simulation Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Simulation Type</InputLabel>
              <Select
                value={type}
                label="Simulation Type"
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="FULL">Full</MenuItem>
                <MenuItem value="PARTIAL">Partial</MenuItem>
                <MenuItem value="DRY_RUN">Dry Run</MenuItem>
              </Select>
            </FormControl>
            <EmployeeSelector
              multiple
              value={employees}
              onChange={(val) => setEmployees(Array.isArray(val) ? val : [])}
              label="Employees (optional)"
              placeholder="Search and select employees…"
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>Simulation started successfully.</Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body2">{result.simulationName}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2">{result.simulationType}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2"><Chip label={result.status} size="small" /></Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total Employees</Typography>
                <Typography variant="body2">{result.totalEmployees}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Applied</Typography>
                <Typography variant="body2">{result.appliedCount}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Not Applicable</Typography>
                <Typography variant="body2">{result.notApplicableCount}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions className='!p-4 border-t border-gray-200'>
        <Button onClick={onClose} variant="outlined" className='!text-gray-800 !border-gray-200'>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            className='!bg-primary'
            onClick={handleSubmit}
            disabled={!name || !type || loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {loading ? 'Running…' : 'Run Simulation'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

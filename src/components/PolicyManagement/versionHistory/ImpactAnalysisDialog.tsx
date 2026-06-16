import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton, Chip,
  Alert, CircularProgress, Table, TableBody, TableRow, TableCell, TableContainer, Button,
} from '@mui/material';
import { Close as CloseIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import type { PolicyVersion, ImpactAnalysisResult, Employee } from '../../../types/policy';
import { EmployeeSelector } from '../Common/EmployeeSelector';
import { policyService } from '../../../services';

interface ImpactAnalysisDialogProps {
  open: boolean;
  version: PolicyVersion | null;
  onClose: () => void;
}

export const ImpactAnalysisDialog: React.FC<ImpactAnalysisDialogProps> = ({ open, version, onClose }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analysis, setAnalysis] = useState<ImpactAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAnalysis(null);
      setError(null);
      setEmployees([]);
    }
  }, [open]);

  const handleRun = async () => {
    if (!version) return;
    setLoading(true);
    setError(null);
    try {
      const ids = employees.map((e) => e.id);
      const res: any = await policyService.runImpactAnalysis(version.id, ids);
      setAnalysis(res.data ?? res);
    } catch {
      setError('Failed to run impact analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <div className='flex items-center justify-between p-3 border-b border-gray-200'>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          <AnalyticsIcon fontSize="small" sx={{ color: 'purple' }} />
          <Typography variant="subtitle2">
            Impact Analysis — v{version?.versionNo}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon className='!text-gray-800' />
        </IconButton>
      </div>
      <DialogContent>
        {!analysis ? (
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select employees to scope the analysis, or leave blank to analyse all employees.
            </Typography>
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
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box className="p-3 bg-head rounded border border-gray-200 flex-1 text-center">
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'purple' }}>
                  {analysis.affectedEmployees}
                </Typography>
                <Typography variant="caption" color="text.secondary">Affected Employees</Typography>
              </Box>
              <Box className="p-3 bg-head rounded border border-gray-200 flex-1 text-center">
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {analysis.totalEmployees}
                </Typography>
                <Typography variant="caption" color="text.secondary">Total Employees</Typography>
              </Box>
            </Box>

            {analysis.domainCode && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Domain</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={analysis.domainCode} size="small" />
                </Box>
              </Box>
            )}

            {analysis.metrics && Object.keys(analysis.metrics).length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>Metrics</Typography>
                <TableContainer className='border border-gray-200 rounded'>
                  <Table size="small">
                    <TableBody>
                      {Object.entries(analysis.metrics).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell sx={{ fontWeight: 500 }}>{key}</TableCell>
                          <TableCell>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
      </DialogContent>
      <DialogActions className='!p-4 border-t border-gray-200'>
        <Button onClick={onClose} variant="outlined" className='!text-gray-800 !border-gray-200'>
          {analysis ? 'Close' : 'Cancel'}
        </Button>
        {!analysis && (
          <Button
            variant="contained"
            className='!bg-primary'
            onClick={handleRun}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {loading ? 'Analysing…' : 'Run Analysis'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

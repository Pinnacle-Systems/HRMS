import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton, Grid,
  Chip, Divider, Alert, CircularProgress, FormControl, InputLabel, Select,
  MenuItem, Button,
} from '@mui/material';
import { Close as CloseIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import type { PolicyVersion } from '../../../types/policy';
import { formatDate } from '../../../utils/dateFormatter';
import { policyService } from '../../../services';
import { getConfigChanges, formatDiffValue, type ConfigChange } from './policyVersionDiff';

interface CompareVersionsDialogProps {
  open: boolean;
  versions: PolicyVersion[];
  onClose: () => void;
  onCompared?: (v1: PolicyVersion, v2: PolicyVersion) => void;
}

export const CompareVersionsDialog: React.FC<CompareVersionsDialogProps> = ({ open, versions, onClose, onCompared }) => {
  const [selectedVersions, setSelectedVersions] = useState<[string, string]>(['', '']);
  const [diffView, setDiffView] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [compareResult, setCompareResult] = useState<{
    v1: PolicyVersion;
    v2: PolicyVersion;
    changes: ConfigChange[];
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!selectedVersions[0] || !selectedVersions[1]) return;
    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);
    if (!v1 || !v2) return;
    setCompareLoading(true);
    setCompareError(null);
    try {
      const res: any = await policyService.compareVersion(selectedVersions[0], selectedVersions[1]);
      const data = res.data ?? res;
      const changes = Array.isArray(data?.changes)
        ? data.changes.map((c: any) => ({
            field: c.path ?? c.field ?? '',
            changeType: c.changeType ?? 'MODIFIED',
            oldValue: c.oldValue,
            newValue: c.newValue,
          }))
        : getConfigChanges(v1.configJson, v2.configJson);
      setCompareResult({ v1, v2, changes });
      onCompared?.(v1, v2);
    } catch {
      setCompareError('Failed to load comparison. Showing local diff instead.');
      const changes = getConfigChanges(v1.configJson, v2.configJson);
      setCompareResult({ v1, v2, changes });
    } finally {
      setCompareLoading(false);
    }
  };

  const handleReset = () => {
    setCompareResult(null);
    setCompareError(null);
    setSelectedVersions(['', '']);
  };

  const handleDialogClose = () => {
    onClose();
    handleReset();
  };

  const renderDiffSideBySide = () => {
    if (!compareResult) return null;
    const { v1, v2, changes } = compareResult;

    return (
      <Box>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Box className="p-2 bg-head rounded border border-gray-200 text-center">
              <Typography variant="subtitle2">Version {v1.versionNo}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(v1.createdAt)} · {v1.createdBy}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box className="p-2 bg-head rounded border border-gray-200 text-center">
              <Typography variant="subtitle2">Version {v2.versionNo}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(v2.createdAt)} · {v2.createdBy}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {changes.length === 0 ? (
          <Alert severity="info">No differences found between these two versions.</Alert>
        ) : (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {changes.length} difference{changes.length !== 1 ? 's' : ''} found
            </Typography>
            {changes.map((change, i) => (
              <Box key={i} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }} className="bg-gray-50">
                  <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace', flex: 1 }}>
                    {change.field}
                  </Typography>
                  <Chip
                    label={change.changeType}
                    size="small"
                    sx={{ height: 18, fontSize: 10 }}
                    color={change.changeType === 'ADDED' ? 'success' : change.changeType === 'REMOVED' ? 'error' : 'warning'}
                  />
                </Box>
                <Grid container>
                  <Grid size={{ xs: 6 }} sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ px: 1.5, py: 1 }} className="dark:bg-head bg-[#fff5f5]">
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#c62828' }}
                      >
                        {formatDiffValue(change.oldValue)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ px: 1.5, py: 1 }} className="dark:bg-head bg-[#f5fff5]">
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#2e7d32' }}
                      >
                        {formatDiffValue(change.newValue)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const renderDiffUnified = () => {
    if (!compareResult) return null;
    const { v1, v2, changes } = compareResult;

    return (
      <Box>
        <Box className="p-2 bg-head rounded border border-gray-200 mb-2 flex gap-4 justify-center">
          <Typography variant="caption">
            <strong>Base:</strong> v{v1.versionNo} ({formatDate(v1.createdAt)})
          </Typography>
          <Typography variant="caption">→</Typography>
          <Typography variant="caption">
            <strong>Compare:</strong> v{v2.versionNo} ({formatDate(v2.createdAt)})
          </Typography>
        </Box>

        {changes.length === 0 ? (
          <Alert severity="info">No differences found between these two versions.</Alert>
        ) : (
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {changes.length} change{changes.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {changes.map((change, i) => (
              <Box key={i}>
                {i > 0 && <Divider />}
                <Box sx={{ px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }} className="bg-gray-50">
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, flex: 1 }}>
                    @@ {change.field}
                  </Typography>
                  <Chip
                    label={change.changeType}
                    size="small"
                    sx={{ height: 18, fontSize: 10 }}
                    color={change.changeType === 'ADDED' ? 'success' : change.changeType === 'REMOVED' ? 'error' : 'warning'}
                  />
                </Box>
                <Box sx={{ px: 1.5, py: 0.5}} className="dark:bg-head bg-[#fff5f5]">
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#c62828' }}
                  >
                    − {formatDiffValue(change.oldValue)}
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 0.5}} className="dark:bg-head bg-[#f5fff5]">
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#2e7d32' }}
                  >
                    + {formatDiffValue(change.newValue)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <div className='flex items-center justify-between p-2 border-b border-gray-200'>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          {compareResult && (
            <IconButton size="small" onClick={handleReset}>
              <BackIcon fontSize="small" className='text-gray-800' />
            </IconButton>
          )}
          <Typography variant="subtitle2">
            {compareResult
              ? `v${compareResult.v1.versionNo} → v${compareResult.v2.versionNo}`
              : 'Compare Versions'}
          </Typography>
        </Box>
        <IconButton onClick={handleDialogClose}>
          <CloseIcon className='!text-gray-800' />
        </IconButton>
      </div>

      <DialogContent>
        {!compareResult ? (
          <Grid container spacing={4} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth>
                <InputLabel>Base Version</InputLabel>
                <Select
                  value={selectedVersions[0]}
                  label="Base Version"
                  onChange={(e) => setSelectedVersions([e.target.value, selectedVersions[1]])}
                >
                  {versions.map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      v{v.versionNo} — {formatDate(v.createdAt)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6">→</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth>
                <InputLabel>Compare With</InputLabel>
                <Select
                  value={selectedVersions[1]}
                  label="Compare With"
                  onChange={(e) => setSelectedVersions([selectedVersions[0], e.target.value])}
                >
                  {versions.filter(v => v.id !== selectedVersions[0]).map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      v{v.versionNo} — {formatDate(v.createdAt)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>View Mode</InputLabel>
                <Select
                  value={diffView}
                  label="View Mode"
                  onChange={(e) => setDiffView(e.target.value as any)}
                >
                  <MenuItem value="side-by-side">Side by Side</MenuItem>
                  <MenuItem value="unified">Unified View</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>View Mode</InputLabel>
                <Select
                  value={diffView}
                  label="View Mode"
                  onChange={(e) => setDiffView(e.target.value as any)}
                >
                  <MenuItem value="side-by-side">Side by Side</MenuItem>
                  <MenuItem value="unified">Unified View</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {diffView === 'side-by-side' ? renderDiffSideBySide() : renderDiffUnified()}
          </Box>
        )}
      </DialogContent>

      {compareError && (
        <Alert severity="warning" sx={{ mx: 3, mb: 1 }}>{compareError}</Alert>
      )}
      <DialogActions className='!p-4 border-t border-gray-200'>
        <Button onClick={handleDialogClose} variant="outlined" className='!text-gray-800 !border-gray-200'>
          Cancel
        </Button>
        {!compareResult && (
          <Button
            onClick={handleCompare}
            variant="contained"
            className='!bg-primary'
            disabled={!selectedVersions[0] || !selectedVersions[1] || compareLoading}
            startIcon={compareLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {compareLoading ? 'Comparing…' : 'Compare'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

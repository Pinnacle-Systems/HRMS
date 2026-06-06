import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Menu,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CompareArrows as CompareIcon,
  Restore as RestoreIcon,
  CheckCircle as ApproveIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { type PolicyVersion, VersionStatus } from '../../types/policy';
import type { PolicyVersionHistoryProps } from './types';
import { statusConfig } from './const';

export const PolicyVersionHistory: React.FC<PolicyVersionHistoryProps> = ({
  versions,
  policyName,
  onViewVersion,
  onRestoreVersion,
  onApproveVersion,
  onCompareVersions,
  onExportVersion,
}) => {
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<[string, string]>(['', '']);
  const [diffView, setDiffView] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [compareResult, setCompareResult] = useState<{
    v1: PolicyVersion;
    v2: PolicyVersion;
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
  } | null>(null);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<PolicyVersion | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<PolicyVersion | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreReason, setRestoreReason] = useState('');

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVersionForMenu, setSelectedVersionForMenu] = useState<PolicyVersion | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, version: PolicyVersion) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedVersionForMenu(version);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedVersionForMenu(null);
  };

  const handleViewClick = (version: PolicyVersion) => {
    setViewingVersion(version);
    setViewDialogOpen(true);
    onViewVersion(version);
  };

  const handleRestoreClick = (version: PolicyVersion) => {
    setSelectedVersion(version);
    setRestoreDialogOpen(true);
    handleMenuClose();
  };

  const handleApproveClick = (version: PolicyVersion) => {
    if (onApproveVersion) onApproveVersion(version);
    handleMenuClose();
  };

  const handleExportClick = (version: PolicyVersion) => {
    if (onExportVersion) onExportVersion(version);
    handleMenuClose();
  };

  const getConfigChanges = (oldConfig: any, newConfig: any) => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    const findDifferences = (obj1: any, obj2: any, path: string = '') => {
      const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      for (const key of allKeys) {
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
          findDifferences(val1, val2, currentPath);
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          changes.push({ field: currentPath, oldValue: val1, newValue: val2 });
        }
      }
    };

    findDifferences(oldConfig, newConfig);
    return changes;
  };

  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const handleCompare = () => {
    if (!selectedVersions[0] || !selectedVersions[1]) return;
    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);
    if (!v1 || !v2) return;
    const changes = getConfigChanges(v1.config, v2.config);
    setCompareResult({ v1, v2, changes });
    if (onCompareVersions) onCompareVersions(v1, v2);
  };

  const handleCompareReset = () => {
    setCompareResult(null);
    setSelectedVersions(['', '']);
  };

  const handleCompareDialogClose = () => {
    setCompareDialogOpen(false);
    setCompareResult(null);
    setSelectedVersions(['', '']);
  };

  const handleRestore = () => {
    if (selectedVersion && restoreReason) {
      onRestoreVersion(selectedVersion);
      setRestoreDialogOpen(false);
      setRestoreReason('');
      setSelectedVersion(null);
    }
  };

  const renderDiffSideBySide = () => {
    if (!compareResult) return null;
    const { v1, v2, changes } = compareResult;

    return (
      <Box>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Box className="p-2 bg-head rounded border border-gray-200 text-center">
              <Typography variant="subtitle2">Version {v1.versionNumber}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(v1.createdAt).toLocaleDateString()} · {v1.createdBy}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box className="p-2 bg-head rounded border border-gray-200 text-center">
              <Typography variant="subtitle2">Version {v2.versionNumber}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(v2.createdAt).toLocaleDateString()} · {v2.createdBy}
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
                <Box sx={{ px: 1.5, py: 0.5}} className="bg-gray-50">
                  <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {change.field}
                  </Typography>
                </Box>
                <Grid container>
                  <Grid size={{ xs: 6 }} sx={{ borderRight: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ px: 1.5, py: 1 }} className="dark:bg-head bg-[#fff5f5]">
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#c62828' }}
                      >
                        {formatValue(change.oldValue)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ px: 1.5, py: 1 }} className="dark:bg-head bg-[#f5fff5]">
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#2e7d32' }}
                      >
                        {formatValue(change.newValue)}
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
            <strong>Base:</strong> v{v1.versionNumber} ({new Date(v1.createdAt).toLocaleDateString()})
          </Typography>
          <Typography variant="caption">→</Typography>
          <Typography variant="caption">
            <strong>Compare:</strong> v{v2.versionNumber} ({new Date(v2.createdAt).toLocaleDateString()})
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
                <Box sx={{ px: 1.5, py: 0.5 }} className="bg-gray-50">
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    @@ {change.field}
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 0.5}} className="dark:bg-head bg-[#fff5f5]">
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#c62828' }}
                  >
                    − {formatValue(change.oldValue)}
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 0.5}} className="dark:bg-head bg-[#f5fff5]">
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#2e7d32' }}
                  >
                    + {formatValue(change.newValue)}
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
    <Box className="px-4">
      <div className='flex items-center justify-between mb-4'>
        <div>
          <Typography variant="h6">Version History - {policyName}</Typography>
          <div className='text-[12px] text-gray-500'>
            View and manage all versions of this policy. You can restore previous versions or compare changes.
          </div>
        </div>
        <Button
          variant="outlined"
          className='!border-primary !text-primary'
          startIcon={<CompareIcon />}
          onClick={() => setCompareDialogOpen(true)}
          disabled={versions.length < 2}
        >
          Compare Versions
        </Button>
      </div>

      <TableContainer className='border border-gray-200 bg-white shadow-sm rounded-md'>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>Version</TableCell>
              <TableCell>Effective From</TableCell>
              <TableCell>Effective To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Approved By</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedVersions.map((version, index) => {
              const isLatest = index === 0;
              return (
                <TableRow key={version.id + index}>
                  <TableCell>
                    <Box>
                      <Typography component="span">
                        v{version.versionNumber}
                        {isLatest && (
                          <Chip label="Latest" size="small" className='!bg-primary !text-white' sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      {version.changeLog && (
                        <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                          {version.changeLog}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(version.effectiveFrom).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {version.effectiveTo ? new Date(version.effectiveTo).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[version.status].label}
                      color={statusConfig[version.status].color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{version.createdBy}</TableCell>
                  <TableCell>{version.approvedBy || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title={new Date(version.createdAt).toLocaleString()}>
                      <span>{new Date(version.createdAt).toLocaleDateString()}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewClick(version)}>
                        <ViewIcon fontSize="small" className='text-primary' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More">
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, version)}>
                        <MoreIcon fontSize="small" className='text-gray-800' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedVersionForMenu && selectedVersionForMenu.status !== VersionStatus.ACTIVE && (
          <MenuItem onClick={() => handleRestoreClick(selectedVersionForMenu)}>
            <RestoreIcon fontSize="small" sx={{ mr: 1, color: 'darkcyan' }} />
            Restore Version
          </MenuItem>
        )}
        {selectedVersionForMenu && selectedVersionForMenu.status === VersionStatus.PENDING_APPROVAL && onApproveVersion && (
          <MenuItem onClick={() => handleApproveClick(selectedVersionForMenu)}>
            <ApproveIcon fontSize="small" sx={{ mr: 1, color: 'orangered' }} />
            Approve Version
          </MenuItem>
        )}
        {onExportVersion && selectedVersionForMenu && (
          <MenuItem onClick={() => handleExportClick(selectedVersionForMenu)}>
            <DownloadIcon fontSize="small" sx={{ mr: 1, color: 'dodgerblue' }} />
            Export Configuration
          </MenuItem>
        )}
      </Menu>

      {/* Change Timeline */}
      {sortedVersions.length > 1 && (
        <div className='bg-white-50 mt-3 p-3 border border-gray-200 shadow-md rounded-md'>
          <Typography variant="subtitle2" gutterBottom>
            Change Timeline
          </Typography>
          <Stepper orientation="vertical">
            {sortedVersions.slice(0, 5).map((version, idx) => {
              const nextVersion = sortedVersions[idx + 1];
              const changes = nextVersion
                ? getConfigChanges(nextVersion.config, version.config)
                : [];
              return (
                <Step key={version.id} active>
                  <StepLabel>
                    <Box>
                      <Typography variant="subtitle2">
                        Version {version.versionNumber} — {new Date(version.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {version.changeLog || 'No change log provided'}
                      </Typography>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    {changes.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Changes from previous version:
                        </Typography>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                          {changes.slice(0, 3).map((change, i) => (
                            <li key={i}>
                              <Typography variant="caption">
                                {change.field}: {formatValue(change.oldValue)} → {formatValue(change.newValue)}
                              </Typography>
                            </li>
                          ))}
                          {changes.length > 3 && (
                            <li>
                              <Typography variant="caption">
                                … and {changes.length - 3} more changes
                              </Typography>
                            </li>
                          )}
                        </ul>
                      </Box>
                    )}
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </div>
      )}

      {/* ── View Version Dialog ── */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <div className='flex items-center justify-between p-3 border-b border-gray-200'>
          <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
            Version {viewingVersion?.versionNumber} Details
          </Typography>
          <IconButton onClick={() => setViewDialogOpen(false)}>
            <CloseIcon className='!text-gray-800' />
          </IconButton>
        </div>
        <DialogContent>
          {viewingVersion && (
            <Box>
              {/* Metadata grid */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Version</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>v{viewingVersion.versionNumber}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={statusConfig[viewingVersion.status].label}
                      color={statusConfig[viewingVersion.status].color}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Created By</Typography>
                  <Typography variant="body2">{viewingVersion.createdBy}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography variant="body2">{new Date(viewingVersion.createdAt).toLocaleString()}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Effective From</Typography>
                  <Typography variant="body2">{new Date(viewingVersion.effectiveFrom).toLocaleDateString()}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Effective To</Typography>
                  <Typography variant="body2">
                    {viewingVersion.effectiveTo ? new Date(viewingVersion.effectiveTo).toLocaleDateString() : '—'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Approved By</Typography>
                  <Typography variant="body2">{viewingVersion.approvedBy || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Approved At</Typography>
                  <Typography variant="body2">
                    {viewingVersion.approvedAt ? new Date(viewingVersion.approvedAt).toLocaleString() : '—'}
                  </Typography>
                </Grid>
              </Grid>

              {viewingVersion.changeLog && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'var(--head)', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Change Log</Typography>
                  <Typography variant="body2">{viewingVersion.changeLog}</Typography>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" gutterBottom>Configuration</Typography>
              <Box
                sx={{
                  bgcolor: 'var(--head)',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: 300,
                  overflowY: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <pre style={{ margin: 0, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(viewingVersion.config, null, 2)}
                </pre>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-200'>
          {viewingVersion && viewingVersion.status !== VersionStatus.ACTIVE && (
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={() => {
                setViewDialogOpen(false);
                handleRestoreClick(viewingVersion);
              }}
            >
              Restore This Version
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)} variant="outlined" className='!text-gray-800 !border-gray-200'>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Compare Versions Dialog ── */}
      <Dialog open={compareDialogOpen} onClose={handleCompareDialogClose} maxWidth="md" fullWidth>
        <div className='flex items-center justify-between p-2 border-b border-gray-200'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            {compareResult && (
              <IconButton size="small" onClick={handleCompareReset}>
                <BackIcon fontSize="small" className='text-gray-800' />
              </IconButton>
            )}
            <Typography variant="subtitle2">
              {compareResult
                ? `v${compareResult.v1.versionNumber} → v${compareResult.v2.versionNumber}`
                : 'Compare Versions'}
            </Typography>
          </Box>
          <IconButton onClick={handleCompareDialogClose}>
            <CloseIcon className='!text-gray-800' />
          </IconButton>
        </div>

        <DialogContent>
          {!compareResult ? (
            /* Version selector */
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
                        v{v.versionNumber} — {new Date(v.createdAt).toLocaleDateString()}
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
                        v{v.versionNumber} — {new Date(v.createdAt).toLocaleDateString()}
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
            /* Diff result */
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

        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={handleCompareDialogClose} variant="outlined" className='!text-gray-800 !border-gray-200'>
            Cancel
          </Button>
          {!compareResult && (
            <Button
              onClick={handleCompare}
              variant="contained"
              className='!bg-primary'
              disabled={!selectedVersions[0] || !selectedVersions[1]}
            >
              Compare
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Restore Version Dialog ── */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore Version {selectedVersion?.versionNumber}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Restoring a previous version will create a new version based on this configuration.
            The current active policy will not be affected until you activate the new version.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Restore"
            placeholder="Explain why you are restoring this version..."
            value={restoreReason}
            onChange={(e) => setRestoreReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={() => setRestoreDialogOpen(false)} variant="outlined" className='!text-gray-800 !border-gray-200'>
            Cancel
          </Button>
          <Button onClick={handleRestore} variant="contained" className='!bg-primary' disabled={!restoreReason}>
            Restore Version
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

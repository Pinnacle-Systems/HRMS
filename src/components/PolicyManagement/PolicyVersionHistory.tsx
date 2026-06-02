// src/components/PolicyManagement/PolicyVersionHistory.tsx

import React, { useState } from 'react';
import {
  Box,
  Paper,
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
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CompareArrows as CompareIcon,
  Restore as RestoreIcon,
  CheckCircle as ApproveIcon,
  // Schedule as ScheduleIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  // History as HistoryIcon,
} from '@mui/icons-material';
import { type PolicyVersion, VersionStatus } from '../../types/policy';

interface PolicyVersionHistoryProps {
  versions: PolicyVersion[];
  policyName: string;
  onViewVersion: (version: PolicyVersion) => void;
  onRestoreVersion: (version: PolicyVersion) => void;
  onApproveVersion?: (version: PolicyVersion) => void;
  onCompareVersions?: (version1: PolicyVersion, version2: PolicyVersion) => void;
  onExportVersion?: (version: PolicyVersion) => void;
}

const statusConfig: Record<VersionStatus, { color: any; label: string }> = {
  [VersionStatus.DRAFT]: { color: 'warning', label: 'Draft' },
  [VersionStatus.PENDING_APPROVAL]: { color: 'info', label: 'Pending Approval' },
  [VersionStatus.ACTIVE]: { color: 'success', label: 'Active' },
  [VersionStatus.EXPIRED]: { color: 'default', label: 'Expired' },
  [VersionStatus.ARCHIVED]: { color: 'default', label: 'Archived' },
};

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
  const [selectedVersion, setSelectedVersion] = useState<PolicyVersion | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreReason, setRestoreReason] = useState('');

  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  const handleCompare = () => {
    if (selectedVersions[0] && selectedVersions[1]) {
      const v1 = versions.find(v => v.id === selectedVersions[0]);
      const v2 = versions.find(v => v.id === selectedVersions[1]);
      if (v1 && v2 && onCompareVersions) {
        onCompareVersions(v1, v2);
      }
      setCompareDialogOpen(false);
    }
  };

  const handleRestore = () => {
    if (selectedVersion && restoreReason) {
      onRestoreVersion(selectedVersion);
      setRestoreDialogOpen(false);
      setRestoreReason('');
      setSelectedVersion(null);
    }
  };

  const getConfigChanges = (oldConfig: any, newConfig: any) => {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    // Helper to find differences recursively
    const findDifferences = (obj1: any, obj2: any, path: string = '') => {
      const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      
      for (const key of allKeys) {
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
          findDifferences(val1, val2, currentPath);
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          changes.push({
            field: currentPath,
            oldValue: val1,
            newValue: val2,
          });
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Version History - {policyName}
      </Typography>
      <Typography >
        View and manage all versions of this policy. You can restore previous versions or compare changes.
      </Typography>

      <Box className="flex justify-between items-center mb-2">
        <Button
          variant="outlined"
          startIcon={<CompareIcon />}
          onClick={() => setCompareDialogOpen(true)}
          disabled={versions.length < 2}
        >
          Compare Versions
        </Button>
      </Box>

      <TableContainer component={Paper}>
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
              // const previousVersion = sortedVersions[index + 1];
              // const changes = previousVersion 
              //   ? getConfigChanges(previousVersion.config, version.config)
              //   : [];

              return (
                <TableRow key={version.id} sx={{ bgcolor: isLatest ? 'action.selected' : 'inherit' }}>
                  <TableCell>
                    <Box>
                      <Typography >
                        v{version.versionNumber}
                        {isLatest && <Chip label="Latest" size="small" color="primary" sx={{ ml: 1 }} />}
                      </Typography>
                      {version.changeLog && (
                        <Typography  >
                          {version.changeLog}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(version.effectiveFrom).toLocaleDateString()}
                  </TableCell>
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
                      <IconButton size="small" onClick={() => onViewVersion(version)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {version.status !== VersionStatus.ACTIVE && (
                      <Tooltip title="Restore this version">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedVersion(version);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {version.status === VersionStatus.PENDING_APPROVAL && onApproveVersion && (
                      <Tooltip title="Approve Version">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => onApproveVersion(version)}
                        >
                          <ApproveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onExportVersion && (
                      <Tooltip title="Export Configuration">
                        <IconButton size="small" onClick={() => onExportVersion(version)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Changes Timeline */}
      {sortedVersions.length > 1 && (
        <Paper sx={{ mt: 3, p: 3 }}>
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
                        Version {version.versionNumber} - {new Date(version.createdAt).toLocaleDateString()}
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
                                ... and {changes.length - 3} more changes
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
        </Paper>
      )}

      {/* Compare Versions Dialog */}
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Compare Versions
          <IconButton
            aria-label="close"
            onClick={() => setCompareDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12,md:5}}>
              <FormControl fullWidth>
                <InputLabel>Base Version</InputLabel>
                <Select
                  value={selectedVersions[0]}
                  label="Base Version"
                  onChange={(e) => setSelectedVersions([e.target.value, selectedVersions[1]])}
                >
                  {versions.map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      Version {v.versionNumber} - {new Date(v.createdAt).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12,md:2}} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6">→</Typography>
            </Grid>
            <Grid size={{xs:12,md:5}}>
              <FormControl fullWidth>
                <InputLabel>Compare With</InputLabel>
                <Select
                  value={selectedVersions[1]}
                  label="Compare With"
                  onChange={(e) => setSelectedVersions([selectedVersions[0], e.target.value])}
                >
                  {versions.filter(v => v.id !== selectedVersions[0]).map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      Version {v.versionNumber} - {new Date(v.createdAt).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs:12}}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCompare} variant="contained" disabled={!selectedVersions[0] || !selectedVersions[1]}>
            Compare
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Version Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore Version {selectedVersion?.versionNumber}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Restoring a previous version will create a new version based on this configuration.
            Current active policy will not be affected until you activate the new version.
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
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestore} variant="contained" disabled={!restoreReason}>
            Restore Version
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
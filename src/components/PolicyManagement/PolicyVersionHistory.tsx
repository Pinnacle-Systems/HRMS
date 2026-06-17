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
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Menu,
  MenuItem,
} from '@mui/material';

import {
  Visibility as ViewIcon,
  CompareArrows as CompareIcon,
  Restore as RestoreIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Archive as ArchiveIcon,
  TimerOff as ExpireIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Analytics as AnalyticsIcon,
  PlayArrow,
} from '@mui/icons-material';
import { type PolicyVersion, VersionStatus } from '../../types/policy';
import type { PolicyVersionHistoryProps } from './types';
import { statusConfig } from './const';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';
import { getConfigChanges, formatDiffValue } from './versionHistory/policyVersionDiff';
import { ViewVersionDialog } from './versionHistory/ViewVersionDialog';
import { CompareVersionsDialog } from './versionHistory/CompareVersionsDialog';
import { RejectVersionDialog } from './versionHistory/RejectVersionDialog';
import { RestoreVersionDialog } from './versionHistory/RestoreVersionDialog';
import { ImpactAnalysisDialog } from './versionHistory/ImpactAnalysisDialog';
import { RunSimulationDialog } from './versionHistory/RunSimulationDialog';

// This component used to own the version table AND all 6 dialogs (view,
// compare, reject, restore, impact-analysis, run-simulation) inline, in one
// 1177-line file. Each dialog is now its own component under ./versionHistory/
// with its own local state; this file only keeps the table/menu/timeline and
// tracks which dialog (if any) is currently open.
export const PolicyVersionHistory: React.FC<PolicyVersionHistoryProps> = ({
  versions,
  policyName,
  onViewVersion,
  onRestoreVersion,
  onApproveVersion,
  onRejectVersion,
  onArchiveVersion,
  onExpireVersion,
  onCompareVersions,
  onExportVersion,
}) => {
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<PolicyVersion | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingVersion, setRejectingVersion] = useState<PolicyVersion | null>(null);

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<PolicyVersion | null>(null);

  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [impactVersion, setImpactVersion] = useState<PolicyVersion | null>(null);

  const [simDialogOpen, setSimDialogOpen] = useState(false);
  const [simVersion, setSimVersion] = useState<PolicyVersion | null>(null);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVersionForMenu, setSelectedVersionForMenu] = useState<PolicyVersion | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.versionNo - a.versionNo);

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
    setRestoringVersion(version);
    setRestoreDialogOpen(true);
    handleMenuClose();
  };

  const handleApproveClick = (version: PolicyVersion) => {
    onApproveVersion?.(version);
    handleMenuClose();
  };

  const handleExportClick = (version: PolicyVersion) => {
    onExportVersion?.(version);
    handleMenuClose();
  };

  const handleRejectClick = (version: PolicyVersion) => {
    setRejectingVersion(version);
    setRejectDialogOpen(true);
    handleMenuClose();
  };

  const handleArchiveClick = (version: PolicyVersion) => {
    onArchiveVersion?.(version);
    handleMenuClose();
  };

  const handleExpireClick = (version: PolicyVersion) => {
    onExpireVersion?.(version);
    handleMenuClose();
  };

  const handleImpactAnalysisClick = (version: PolicyVersion) => {
    handleMenuClose();
    setImpactVersion(version);
    setImpactDialogOpen(true);
  };

  const handleRunSimulationClick = (version: PolicyVersion) => {
    handleMenuClose();
    setSimVersion(version);
    setSimDialogOpen(true);
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
                        v{version.versionNo}
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
                  <TableCell>{formatDate(version.effectiveFrom)}</TableCell>
                  <TableCell>
                    {version.effectiveTo ? formatDate(version.effectiveTo) : '-'}
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
                    <Tooltip title={formatDate(version.createdAt)}>
                      <span>{formatDate(version.createdAt)}</span>
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
            <ApproveIcon fontSize="small" sx={{ mr: 1, color: 'green' }} />
            Approve Version
          </MenuItem>
        )}
        {selectedVersionForMenu && selectedVersionForMenu.status === VersionStatus.PENDING_APPROVAL && onRejectVersion && (
          <MenuItem onClick={() => handleRejectClick(selectedVersionForMenu)}>
            <RejectIcon fontSize="small" sx={{ mr: 1, color: 'red' }} />
            Reject Version
          </MenuItem>
        )}
        {selectedVersionForMenu && selectedVersionForMenu.status === VersionStatus.ACTIVE && onArchiveVersion && (
          <MenuItem onClick={() => handleArchiveClick(selectedVersionForMenu)}>
            <ArchiveIcon fontSize="small" sx={{ mr: 1, color: 'gray' }} />
            Archive Version
          </MenuItem>
        )}
        {selectedVersionForMenu && selectedVersionForMenu.status === VersionStatus.ACTIVE && onExpireVersion && (
          <MenuItem onClick={() => handleExpireClick(selectedVersionForMenu)}>
            <ExpireIcon fontSize="small" sx={{ mr: 1, color: 'orange' }} />
            Expire Version
          </MenuItem>
        )}
        {onExportVersion && selectedVersionForMenu && (
          <MenuItem onClick={() => handleExportClick(selectedVersionForMenu)}>
            <DownloadIcon fontSize="small" sx={{ mr: 1, color: 'dodgerblue' }} />
            Export Configuration
          </MenuItem>
        )}
        {selectedVersionForMenu && (
          <MenuItem onClick={() => handleImpactAnalysisClick(selectedVersionForMenu)}>
            <AnalyticsIcon fontSize="small" sx={{ mr: 1, color: 'purple' }} />
            Impact Analysis
          </MenuItem>
        )}
        {selectedVersionForMenu && (
          <MenuItem onClick={() => handleRunSimulationClick(selectedVersionForMenu)}>
            <PlayArrow fontSize="small" sx={{ mr: 1, color: 'green' }} />
            Run Simulation
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
                ? getConfigChanges(nextVersion.configJson, version.configJson)
                : [];
              return (
                <Step key={version.id} active>
                  <StepLabel>
                    <Box>
                      <Typography variant="subtitle2">
                        Version {version.versionNo} — {formatDateTime(version.createdAt)}
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
                                {change.field}: {formatDiffValue(change.oldValue)} → {formatDiffValue(change.newValue)}
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

      <ViewVersionDialog
        open={viewDialogOpen}
        version={viewingVersion}
        onClose={() => setViewDialogOpen(false)}
        onRestore={handleRestoreClick}
      />

      <CompareVersionsDialog
        open={compareDialogOpen}
        versions={versions}
        onClose={() => setCompareDialogOpen(false)}
        onCompared={onCompareVersions}
      />

      <RejectVersionDialog
        open={rejectDialogOpen}
        version={rejectingVersion}
        onClose={() => setRejectDialogOpen(false)}
        onReject={onRejectVersion}
      />

      <RestoreVersionDialog
        open={restoreDialogOpen}
        version={restoringVersion}
        onClose={() => setRestoreDialogOpen(false)}
        onRestore={onRestoreVersion}
      />

      <ImpactAnalysisDialog
        open={impactDialogOpen}
        version={impactVersion}
        onClose={() => setImpactDialogOpen(false)}
      />

      <RunSimulationDialog
        open={simDialogOpen}
        version={simVersion}
        onClose={() => setSimDialogOpen(false)}
      />
    </Box>
  );
};

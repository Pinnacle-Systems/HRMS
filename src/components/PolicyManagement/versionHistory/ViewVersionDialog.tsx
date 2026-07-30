import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton, Grid,
  Chip, Divider, Alert, CircularProgress, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Button,
} from '@mui/material';
import { Close as CloseIcon, Restore as RestoreIcon, History as HistoryIcon } from '@mui/icons-material';
import { type PolicyVersion, VersionStatus } from '../../../types/policy';
import { statusConfig } from '../const';
import { formatDate, formatDateTime } from '../../../utils/dateFormatter';
import { policyService } from '../../../services';
import ConfigurationViewer from '../ConfigurationViewer';

interface ViewVersionDialogProps {
  open: boolean;
  version: PolicyVersion | null;
  onClose: () => void;
  onRestore: (version: PolicyVersion) => void;
}

export const ViewVersionDialog: React.FC<ViewVersionDialogProps> = ({ open, version, onClose, onRestore }) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !version) {
      setAuditLogs([]);
      return;
    }
    setAuditLoading(true);
    setAuditError(null);
    policyService.getVersionAudit(version.id)
      .then((res: any) => setAuditLogs(res.data ?? []))
      .catch(() => setAuditError('Failed to load audit logs'))
      .finally(() => setAuditLoading(false));
  }, [open, version]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div className='flex items-center justify-between p-3 border-b border-gray-200'>
        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
          Version {version?.versionNo} Details
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon className='!text-gray-800' />
        </IconButton>
      </div>
      <DialogContent>
        {version && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Version</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>v{version.versionNo}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={statusConfig[version.status].label}
                    color={statusConfig[version.status].color}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Created By</Typography>
                <Typography variant="body2">{version.createdByName}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Created At</Typography>
                <Typography variant="body2">{formatDateTime(version.createdAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Effective From</Typography>
                <Typography variant="body2">{formatDate(version.effectiveFrom)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Effective To</Typography>
                <Typography variant="body2">
                  {version.effectiveTo ? formatDate(version.effectiveTo) : 'Ongoing'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Approved By</Typography>
                <Typography variant="body2">{version.approvedByName || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="text.secondary">Approved At</Typography>
                <Typography variant="body2">
                  {version.approvedAt ? formatDateTime(version.approvedAt) : '—'}
                </Typography>
              </Grid>
            </Grid>

            {version.changeLog && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'var(--head)', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Change Log</Typography>
                <Typography variant="body2">{version.changeLog}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} className='!bg-white'/>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <HistoryIcon fontSize="small" className="text-primary" />
              <Typography variant="subtitle2">Audit Log</Typography>
            </Box>

            {auditLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {auditError && <Alert severity="error" sx={{ mb: 1 }}>{auditError}</Alert>}
            {!auditLoading && !auditError && (
              auditLogs.length === 0 ? (
                <Alert severity="info">No audit entries found for this version.</Alert>
              ) : (
                <TableContainer className='border border-gray-200 !max-h-[200px] overflow-auto'>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Action By</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Chip label={log.actionType} size="small" variant="outlined" className='!text-gray-800'/>
                          </TableCell>
                          <TableCell>{log.actionByName}</TableCell>
                          <TableCell>{formatDateTime(log.actionDate)}</TableCell>
                          <TableCell>{log.remarks || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            )}

            <Divider sx={{ my: 2 }} className='!bg-white'/>

            <Typography variant="subtitle2" gutterBottom>Configuration</Typography>
            {/* <Box
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
                {JSON.stringify(version.configJson, null, 2)}
              </pre>
            </Box> */}
            <ConfigurationViewer
              configJson={version.configJson}
              versionNo={version.versionNo}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions className='!p-4 border-t border-gray-200'>
        {version && version.status !== VersionStatus.ACTIVE && (
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={() => {
              onClose();
              onRestore(version);
            }}
          >
            Restore This Version
          </Button>
        )}
        <Button onClick={onClose} variant="outlined" className='!text-gray-800 !border-gray-200'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

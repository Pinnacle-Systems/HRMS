import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Alert, TextField, Button } from '@mui/material';
import type { PolicyVersion } from '../../../types/policy';

interface RestoreVersionDialogProps {
  open: boolean;
  version: PolicyVersion | null;
  onClose: () => void;
  onRestore: (version: PolicyVersion) => void;
}

export const RestoreVersionDialog: React.FC<RestoreVersionDialogProps> = ({ open, version, onClose, onRestore }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleRestore = () => {
    if (version && reason) {
      onRestore(version);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Restore Version {version?.versionNo}</DialogTitle>
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
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </DialogContent>
      <DialogActions className='!p-4 border-t border-gray-200'>
        <Button onClick={onClose} variant="outlined" className='!text-gray-800 !border-gray-200'>
          Cancel
        </Button>
        <Button onClick={handleRestore} variant="contained" className='!bg-primary' disabled={!reason}>
          Restore Version
        </Button>
      </DialogActions>
    </Dialog>
  );
};

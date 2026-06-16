import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import type { PolicyVersion } from '../../../types/policy';

interface RejectVersionDialogProps {
  open: boolean;
  version: PolicyVersion | null;
  onClose: () => void;
  onReject?: (version: PolicyVersion, remarks: string) => void;
}

export const RejectVersionDialog: React.FC<RejectVersionDialogProps> = ({ open, version, onClose, onReject }) => {
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (open) setRemarks('');
  }, [open]);

  const handleConfirm = () => {
    if (version && onReject) onReject(version, remarks);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reject Version {version?.versionNo}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Rejection Remarks"
          placeholder="Provide a reason for rejection..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions className='!p-4 border-t border-gray-200'>
        <Button onClick={onClose} variant="outlined" className='!text-gray-800 !border-gray-200'>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={!onReject}>
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
};

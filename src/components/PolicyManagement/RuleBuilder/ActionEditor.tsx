// src/components/RuleBuilder/ActionEditor.tsx

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Grid,
} from '@mui/material';
import { type RuleAction } from '../../../types/policy';

interface ActionEditorProps {
  action: RuleAction;
  onChange: (action: RuleAction) => void;
  domain: string;
}

const actionTypes = [
  { value: 'ALLOW', label: 'Allow Request' },
  { value: 'REJECT', label: 'Reject Request' },
  { value: 'REQUIRE_APPROVAL', label: 'Require Additional Approval' },
  { value: 'REQUIRE_DOCUMENT', label: 'Require Document' },
  { value: 'CALCULATE', label: 'Calculate Value' },
];

export const ActionEditor: React.FC<ActionEditorProps> = ({
  action,
  onChange,
  // domain,
}) => {
  const updateAction = (updates: Partial<RuleAction>) => {
    onChange({ ...action, ...updates });
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Grid container spacing={2}>
        <Grid size={{xs:12}}>
          <FormControl fullWidth size="small">
            <InputLabel>Action Type</InputLabel>
            <Select
              value={action.type}
              label="Action Type"
              onChange={(e) => updateAction({ type: e.target.value as any })}
            >
              {actionTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {(action.type === 'REQUIRE_APPROVAL' || action.type === 'CALCULATE') && (
          <Grid size={{xs:12}}>
            <TextField
              fullWidth
              size="small"
              label="Additional Data"
              placeholder="e.g., approver email, calculation formula"
              value={action.value || ''}
              onChange={(e) => updateAction({ value: e.target.value })}
            />
          </Grid>
        )}

        {action.type === 'REQUIRE_DOCUMENT' && (
          <Grid size={{xs:12}}>
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select
                value={action.value || ''}
                label="Document Type"
                onChange={(e) => updateAction({ value: e.target.value })}
              >
                <MenuItem value="MEDICAL_CERTIFICATE">Medical Certificate</MenuItem>
                <MenuItem value="REPORT">Report/Proof</MenuItem>
                <MenuItem value="MANAGER_APPROVAL">Manager Approval Document</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid size={{xs:12}}>
          <TextField
            fullWidth
            size="small"
            label="Custom Message"
            placeholder="Message to show when this action is triggered"
            value={action.message || ''}
            onChange={(e) => updateAction({ message: e.target.value })}
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
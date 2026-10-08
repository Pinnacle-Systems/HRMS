import React from 'react';
import { FormControlLabel, Grid, Switch } from '@mui/material';
import type { RuleBlockProps } from './types';

export const ApprovalWorkflowRulesBlock: React.FC<RuleBlockProps> = ({ localConfig, set }) => {
    const approvalConfig =
        localConfig?.approvalFLowConfig && typeof localConfig.approvalFLowConfig === 'object'
            ? localConfig.approvalFLowConfig
            : {};

    const handleFieldChange = (field: string, value: any) => {
        set('approvalFLowConfig', { ...approvalConfig, [field]: value });
    };

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
               
                <FormControlLabel
                    className='!text-gray-800'
                    control={
                        <Switch
                            checked={!!approvalConfig.allowAutoApproval}
                            onChange={(e) => handleFieldChange('allowAutoApproval', e.target.checked)}
                        />
                    }
                    label="Allow Auto Approval"
                />
            </Grid>
        </Grid>
    );
};
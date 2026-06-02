// src/components/PolicyManagement/PolicyWizard/PolicyWizard.tsx

import React, { useState, useEffect } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Step1SelectTemplate } from './Step1SelectTemplate';
import { Step2ConfigureRules } from './Step2ConfigureRules';
import { Step3SetEligibility } from './Step3SetEligibility';
import { Step4ApprovalFlow } from './Step4ApprovalFlow';
import { Step5PreviewAssign } from './Step5PreviewAssign';
import { policyApi } from '../../../services/modules/policy';
import { type PolicyTemplate, type PolicyDefinition, type PolicyConfig, PolicyDomain } from '../../../types/policy';

const steps = [
  'Select Template',
  'Configure Rules',
  'Set Eligibility',
  'Approval Flow',
  'Preview & Assign',
];

interface PolicyWizardProps {
  companyId: string;
  existingPolicyId?: string;
  onComplete: (policyId: string) => void;
  onCancel: () => void;
}

export const PolicyWizard: React.FC<PolicyWizardProps> = ({
  companyId,
  existingPolicyId,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Wizard state
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [policyConfig, setPolicyConfig] = useState<PolicyConfig | null>(null);
  const [eligibilityConfig, setEligibilityConfig] = useState<any>(null);
  const [approvalFlow, setApprovalFlow] = useState<any>(null);
  const [policyDefinition, setPolicyDefinition] = useState<Partial<PolicyDefinition>>({
    name: '',
    description: '',
    domain: PolicyDomain['LEAVE'],
  });

  // Load existing policy if editing
  useEffect(() => {
    if (existingPolicyId) {
      loadExistingPolicy();
    }
  }, [existingPolicyId]);

  const loadExistingPolicy = async () => {
    setLoading(true);
    try {
      const policy = await policyApi.getPolicyById(existingPolicyId!);
      const template = await policyApi.getTemplateById(policy.templateId);
      const versions = await policyApi.getPolicyVersions(existingPolicyId!);
      const latestVersion = versions[0];
      
      setSelectedTemplate(template);
      setPolicyDefinition(policy);
      if (latestVersion) {
        setPolicyConfig(latestVersion.config);
      }
    } catch (err) {
      setError('Failed to load existing policy');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    console.log(activeStep,selectedTemplate);
    
    if (activeStep === 0 && !selectedTemplate) {
      setError('Please select a template');
      return;
    }
    
    setError(null);
    
    if (activeStep === steps.length - 1) {
      await handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let policyId = existingPolicyId;
      
      if (!existingPolicyId) {
        // Create new policy
        const newPolicy = await policyApi.createPolicy({
          companyId,
          templateId: selectedTemplate!.id,
          name: policyDefinition.name,
          description: policyDefinition.description,
          domain: selectedTemplate!.domain,
          status: 'DRAFT',
          createdBy: 'current_user_id', // Should come from auth context
        });
        policyId = newPolicy.id;
      }
      
      // Create policy version with complete config
      const completeConfig = {
        ...policyConfig,
        eligibility: eligibilityConfig,
        approvalFlow: approvalFlow,
      };
      
      const newVersion = await policyApi.createPolicyVersion(
        policyId!,
        completeConfig,
        `Created policy version for ${policyDefinition.name}`
      );
      
      // Create assignments if any
      if (eligibilityConfig?.assignments?.length) {
        for (const assignment of eligibilityConfig.assignments) {
          await policyApi.createAssignment({
            ...assignment,
            policyVersionId: newVersion.id,
            companyId,
          });
        }
      }
      
      onComplete(policyId!);
    } catch (err: any) {
      setError(err.message || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Step1SelectTemplate
            companyId={companyId}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
            onPolicyDefinitionChange={setPolicyDefinition}
            policyDefinition={policyDefinition}
          />
        );
      case 1:
        return (
          <Step2ConfigureRules
            template={selectedTemplate!}
            config={policyConfig}
            onChange={setPolicyConfig}
          />
        );
      case 2:
        return (
          <Step3SetEligibility
            companyId={companyId}
            config={eligibilityConfig}
            onChange={setEligibilityConfig}
          />
        );
      case 3:
        return (
          <Step4ApprovalFlow
            config={approvalFlow}
            onChange={setApprovalFlow}
            domain={selectedTemplate?.domain}
          />
        );
      case 4:
        return (
          <Step5PreviewAssign
            policyName={policyDefinition.name}
            templateName={selectedTemplate?.name}
            config={policyConfig}
            eligibilityConfig={eligibilityConfig}
            approvalFlow={approvalFlow}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  if (loading && !selectedTemplate) {
    return (
      <div>
        <CircularProgress />
      </div>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {existingPolicyId ? 'Edit Policy' : 'Create New Policy'}
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ my: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2, mb: 4 }}>
        {getStepContent(activeStep)}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Box>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            {activeStep === steps.length - 1 ? 'Create Policy' : 'Next'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
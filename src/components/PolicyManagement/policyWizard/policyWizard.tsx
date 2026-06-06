import React, { useState, useEffect } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { Step1SelectTemplate } from './Step1SelectTemplate';
import { Step2ConfigureRules } from './Step2ConfigureRules';
import { Step3SetEligibility } from './Step3SetEligibility';
import { Step4ApprovalFlow } from './Step4ApprovalFlow';
import { Step5PreviewAssign } from './Step5PreviewAssign';
import { policyApi } from '../../../services/modules/policy';
import { type PolicyTemplate, type PolicyDefinition, type PolicyConfig, PolicyDomain } from '../../../types/policy';
import { useUI } from '../../../context/Snackbar';
import { steps, type PolicyWizardProps } from '../types';

export const PolicyWizard: React.FC<PolicyWizardProps> = ({
  companyId,
  existingPolicyId,
  onComplete,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showSpinner, hideSpinner } = useUI();
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

  const loadExistingPolicy = async () => {
    setLoading(true);
    showSpinner()
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
      hideSpinner();
    }
  };

  // Load existing policy if editing
  useEffect(() => {
    if (existingPolicyId) {
      loadExistingPolicy();
    }
  }, [existingPolicyId]);

  const handleNext = async () => {
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
        ...(policyConfig || {}),
        eligibility: eligibilityConfig,
        approvalFlow: approvalFlow,
      } as PolicyConfig;

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

  return (
    <div className='py-4 px-6 bg-white shadow-sm'>
      <div className='text-gray-800 font-semibold text-[12px]'>{existingPolicyId ? 'Edit Policy' : 'Create New Policy'}</div>
      <div className='text-gray-500 text-[12px]'>
        Define a new policy by selecting a template and configuring rules, eligibility, and approval workflows.
      </div>
      <Stepper activeStep={activeStep} sx={{ my: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 0, mb: 0 }} className='!h-[calc(100vh-320px)] !overflow-auto'>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {getStepContent(activeStep)}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button disabled={activeStep === 0 || loading} variant='outlined'
          onClick={handleBack}>Back</Button>
        <Box>
          <Button
            variant="outlined"
            onClick={onCancel}
            className='!text-gray-800 !border-gray-200'
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            className='!bg-primary'
          >
            {activeStep === steps.length - 1 ? existingPolicyId ? 'Edit Policy' : 'Create Policy' : 'Next'}
          </Button>
        </Box>
      </Box>
    </div>
  );
};
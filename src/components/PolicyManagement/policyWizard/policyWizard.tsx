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
import { Step3SetEligibility, buildSinglePayload } from './Step3SetEligibility';
import { Step4ApprovalFlow, buildFlowPayload, buildLevelPayload } from './Step4ApprovalFlow';
import { Step5PreviewAssign } from './Step5PreviewAssign';
import { type PolicyTemplate, type PolicyDefinition, type PolicyConfig } from '../../../types/policy';
import { useUI } from '../../../context/Snackbar';
import { steps, type PolicyWizardProps } from '../types';
import { policyService } from '../../../services';

export const PolicyWizard: React.FC<PolicyWizardProps> = ({
  companyId,
  existingPolicyId,
  onComplete,
  onCancel,
  domain
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
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();
  const [policyDefinition, setPolicyDefinition] = useState<Partial<PolicyDefinition>>({
    policyName: '',
    description: '',
    domainId: '',
    policyCode: '',
    effectiveFrom: '',
    effectiveTo: '',
  });
  const [policy, setPolicy] = useState<PolicyDefinition | null>(null);

  const loadExistingPolicy = async () => {
    setLoading(true);
    showSpinner()
    try {
      const policy: any = await policyService.getPolicyById(existingPolicyId!);
      const template: any = await policyService.getTemplateById(policy.data.templateId);
      const versions: any = await policyService.getPolicyVersions(existingPolicyId!);
      const latestVersion = versions.data[0];
      setSelectedTemplate(template.data);
      setPolicyDefinition(policy.data);
      setPolicy(policy.data);
      if (latestVersion) {
        const config = latestVersion.configJson;
        if (typeof config.carryForward === 'boolean') {
          config.carryForward = {};
        }
        setPolicyConfig(config);
        setCurrentVersionId(latestVersion.id);
      }
    } catch (err) {
      setError('Failed to load existing policy');
    } finally {
      setLoading(false);
      hideSpinner();
    }
  };

  useEffect(() => {
    if (existingPolicyId) {
      loadExistingPolicy();
    }
  }, [existingPolicyId]);

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!selectedTemplate) {
        setError('Please select a template');
        return;
      }
      if (!policyDefinition.policyName?.trim()) {
        setError('Please enter a policy name');
        return;
      }
      if (!policyDefinition.policyCode?.trim()) {
        setError('Please enter a policy code');
        return;
      }
      if (!policyDefinition.effectiveFrom) {
        setError('Please select an effective from date');
        return;
      }
    }
    if (activeStep === 2) {
      const assignments: any[] = eligibilityConfig?.assignments ?? [];
      if (existingPolicyId) {
        const hasUnsaved = assignments.some((r: any) => !r._saved);
        if (hasUnsaved) {
          setError('Please save all assignment rules before proceeding.');
          return;
        }
      }
      const priorities = assignments.map((r: any) => r.priority);
      const hasDuplicatePriority = priorities.some((p, i) => priorities.indexOf(p) !== i);
      if (hasDuplicatePriority) {
        setError('Two or more assignment rules share the same priority. Each rule must have a unique priority.');
        return;
      }
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
    showSpinner();
    try {
      const policyPayload = {
        companyId,
        templateId: selectedTemplate!.id,
        domainId: selectedTemplate!.domainId,
        policyCode: policyDefinition.policyCode!,
        policyName: policyDefinition.policyName!,
        description: policyDefinition.description,
        effectiveFrom: policyDefinition.effectiveFrom!,
        effectiveTo: policyDefinition.effectiveTo,
      };

      if (existingPolicyId) {
        await policyService.updatePolicy(existingPolicyId, policyPayload);
        onComplete(existingPolicyId);
        return;
      }

      // Create flow
      const newPolicy: any = await policyService.createPolicy(policyPayload);
      const policyId: string = newPolicy.data?.id || newPolicy.id;

      const completeConfig = {
        ...(policyConfig || {}),
        approvalFlow,
      } as PolicyConfig;

      const newVersion: any = await policyService.createPolicyVersion(policyId, {
        changeLog: 'Initial policy version',
        configJson: completeConfig as unknown as Record<string, unknown>,
        effectiveFrom: policyDefinition.effectiveFrom,
        effectiveTo: policyDefinition.effectiveTo,
      });
      const versionId: string = newVersion.data?.id || newVersion.id;

      if (versionId) {
        // Create assignments from draft eligibility data collected in Step 3.
        // Sibling assignment rows have no dependency on each other, so create
        // them concurrently instead of one HTTP round trip at a time.
        const draftAssignments: any[] = eligibilityConfig?.assignments ?? [];
        await Promise.all(
          draftAssignments.flatMap((rule) =>
            (rule.values as string[]).map((value) =>
              policyService.createAssignment(buildSinglePayload(rule, value, versionId, companyId)),
            ),
          ),
        );

        // Create approval flow and levels from draft data collected in Step 4
        if (approvalFlow) {
          const flowRes: any = await policyService.createApprovalFlow(versionId, buildFlowPayload(approvalFlow));
          const flowId: string = flowRes.data?.id ?? flowRes.id;
          await Promise.all(
            (approvalFlow.levels ?? []).map((level: any) =>
              policyService.createApprovalLevel(flowId, buildLevelPayload(level)),
            ),
          );
        }

        // Submit for approval and stop here — the policy stays PENDING_APPROVAL
        // until a reviewer approves + activates it from PolicyDetails, the same
        // governance path edits to existing active policies already go through.
        // (Previously this also called activateVersion immediately, which
        // bypassed approval entirely for brand-new policies.)
        const res: any = await policyService.submitVersionForApproval(versionId, { remarks: '' });
        await policyService.updatePolicy(policyId, { ...policyPayload, status: res.data.status });
        onComplete(policyId);
      } else {
        await policyService.deletePolicy(policyId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save policy');
    } finally {
      setLoading(false);
      hideSpinner();
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
            policyDomain={domain}
          />
        );
      case 1:
        return (
          <Step2ConfigureRules
            template={selectedTemplate!}
            config={policyConfig}
            onChange={setPolicyConfig}
            policyId={existingPolicyId ?? (policyDefinition as any).id}
            versionId={currentVersionId}
            policyStatus={policyDefinition.status}
            onVersionCreated={setCurrentVersionId}
          />
        );
      case 2:
        return (
          <Step3SetEligibility
            companyId={companyId}
            config={eligibilityConfig}
            onChange={setEligibilityConfig}
            editPolicy={policy}
          />
        );
      case 3:
        return (
          <Step4ApprovalFlow
            config={approvalFlow}
            onChange={setApprovalFlow}
            domain={selectedTemplate?.domainId}
            versionId={currentVersionId}
          />
        );
      case 4:
        return (
          <Step5PreviewAssign
            policyName={policyDefinition.policyName}
            templateName={selectedTemplate?.name}
            domain={(policyDefinition as any).domain ?? selectedTemplate?.domainId}
            config={policyConfig}
            eligibilityConfig={eligibilityConfig}
            approvalFlow={approvalFlow}
            versionId={currentVersionId}
            policyStatus={policyDefinition.status}
            onSubmitForApproval={
              existingPolicyId && currentVersionId
                ? async () => {
                  const res: any = await policyService.submitVersionForApproval(currentVersionId, { remarks: '' });
                  await policyService.updatePolicy(existingPolicyId, {
                    companyId,
                    templateId: selectedTemplate?.id,
                    domainId: selectedTemplate?.domainId,
                    policyCode: policyDefinition.policyCode,
                    policyName: policyDefinition.policyName,
                    description: policyDefinition.description,
                    effectiveFrom: policyDefinition.effectiveFrom,
                    effectiveTo: policyDefinition.effectiveTo,
                    status: res.data.status,
                  });
                  return res.data.status;
                }
                : undefined
            }
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
        {steps.map((label, i) => (
          <Step key={label} className='cursor-pointer'>
            <StepLabel onClick={() => setActiveStep(i)}>{label}</StepLabel>
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
        <Button
          variant="outlined"
          onClick={onCancel}
          className='!text-gray-800 !border-gray-200'
          disabled={loading}
        >
          Cancel
        </Button>

        <Box>
          <Button disabled={activeStep === 0 || loading} variant='outlined'
            onClick={handleBack} className={`!mr-3 ${activeStep !== 0 ? '!text-gray-800' : 'text-gray-500'} !border-gray-200`}>Back</Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            className='!bg-primary'
          >
            {activeStep === steps.length - 1 ? existingPolicyId ? 'Update Policy' : 'Create Policy' : 'Next'}
          </Button>
        </Box>
      </Box>
    </div>
  );
};
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Info as InfoIcon } from '@mui/icons-material';
import { type PolicyConfig } from '../../../types/policy';
import { OBJECT_TYPED_FIELDS } from '../const';
import { policyService } from '../../../services';
import { categoryService } from '../../../services/modules/category';
import { useMasterData } from '../../../hooks/useMasterData';
import type { Step2ConfigureRulesProps } from '../types';
import { useUI } from '../../../context/Snackbar';
import { usePolicyDomains } from '../../../hooks/usePolicyDomains';
import { useLeaveTypesList } from '../../../hooks/useLeaveTypesList';
import { useExpenseCategoriesList } from '../../../hooks/useExpenseCategoriesList';
import {
  LeaveEntitlementsBlock,
  // AccrualRulesBlock,
  CarryForwardBlock,
  SandwichRuleBlock,
  OvertimeRulesBlock,
  ShiftRulesBlock,
  OnboardingRulesBlock,
  OffboardingRulesBlock,
  ExpenseLimitsBlock,
  PayrollRulesBlock,
  StatutoryDeductionsBlock,
  TaxDeductionsBlock,
  ProbationRulesBlock,
  NoticePeriodRulesBlock,
  CompOffRulesBlock,
  WFHRulesBlock,
  HolidayRulesBlock,
  AllowanceRulesBlock,
  BonusRulesBlock,
  LoanAdvanceRulesBlock,
} from './ruleBlocks';

// This component is now a thin orchestrator: it owns the shared config state,
// the deep-path `set` setter, and the debounced validate+save logic. The
// per-rule-block UI (19 of them) lives in ./ruleBlocks/*, one component each,
// so each block can be read/edited independently instead of all living in one
// 1900+ line file.
export const Step2ConfigureRules: React.FC<Step2ConfigureRulesProps> = ({
  template,
  config,
  onChange,
  policyId,
  versionId,
  policyStatus,
  onVersionCreated,
}) => {

  const [otValues, setOTValues] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const { showSnackbar } = useUI();
  const { fetchStatesByCountry } = useMasterData();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // Single debounce timer shared by validate+save — previously these ran as two
  // independent debounced timers (firing two separate network round trips per
  // keystroke, with save racing ahead of validation). Now validation runs first
  // and the save only proceeds if the config is valid.
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newDraftVersionId = useRef<string | undefined>(undefined);
  const { getDomainName } = usePolicyDomains();
  // Local copy of the template's rule blocks — fetched fresh on mount instead
  // of mutating the `template` prop in place (React props must stay immutable).
  const [ruleBlocks, setRuleBlocks] = useState(template.ruleBlocks ?? []);

  const getTemplate = async () => {
    try {
      const res: any = await policyService.getTemplateById(template.id);
      setRuleBlocks(res.data.ruleBlocks || []);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    }
  };

  const initialConfig = (config && Object.keys(config).length > 0
    ? config
    : (template.defaultConfig as PolicyConfig)) ?? ({} as PolicyConfig);

  const [localConfig, setLocalConfig] = useState<PolicyConfig>(initialConfig);

  const domainName = getDomainName(template.domainId);
  const { leaveTypes: leaveType } = useLeaveTypesList(domainName === 'Leave');
  const { expenseCategories: expenseCategory } = useExpenseCategoriesList(domainName === 'Expense');

  useEffect(() => {
    getTemplate();
  }, [])

  // Avoid an in-flight debounced validate/save firing against a stale
  // versionId/policyId after this step has been unmounted (e.g. user
  // navigates away mid-debounce).
  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, []);

  const stripNulls = (obj: any): any => {
    if (obj === null || obj === undefined) return undefined;
    if (Array.isArray(obj)) return obj.map(stripNulls).filter((v) => v !== undefined);
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        // Drop the key if it should be an object but was stored as a primitive
        if (OBJECT_TYPED_FIELDS.has(key) && val !== null && val !== undefined && typeof val !== 'object') continue;
        const v = stripNulls(val);
        if (v !== undefined) result[key] = v;
      }
      return result;
    }
    return obj;
  };

  const validateAndSaveConfig = useCallback((cfg: PolicyConfig) => {
    if (!versionId && !policyId) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    setSaveStatus('saving');
    persistTimer.current = setTimeout(async () => {
      const cfgToPersist = cfg?.entitlements
        ? { ...cfg, entitlements: cfg.entitlements.filter((e) => e.leaveType) }
        : cfg;
      const configJson = stripNulls(cfgToPersist) as Record<string, unknown>;

      if (policyId || template?.domainId) {
        setValidating(true);
        try {
          const res: any = policyId
            ? await policyService.validatePolicyConfigByPolicy(policyId, { configJson })
            : await policyService.validatePolicyConfigByDomain(template.domainId, { configJson });
          const result = res?.data ?? res;
          if (result?.valid === false && Array.isArray(result.errors)) {
            setValidationErrors(result.errors.map((e: any) => e?.message ?? String(e)));
            setSaveStatus('error');
            setValidating(false);
            return; // Don't persist an invalid config.
          }
          setValidationErrors([]);
        } catch (error) {
          console.error('Validation error:', error);
          setSaveStatus('error');
          setValidating(false);
          return;
        } finally {
          setValidating(false);
        }
      }

      try {
        let effectiveVId = newDraftVersionId.current ?? versionId;

        if (policyStatus === 'ACTIVE' && policyId) {
          if (!newDraftVersionId.current) {
            const res: any = await policyService.createPolicyVersion(policyId, {
              changeLog: 'Config update',
              configJson,
              // effectiveFrom,
              // effectiveTo
            });
            const newId = res.data?.id ?? res.id;
            newDraftVersionId.current = newId;
            effectiveVId = newId;
            onVersionCreated?.(newId);
          } else {
            await policyService.updatePolicyVersion(newDraftVersionId.current, {
              changeLog: 'Config update',
              configJson,
            });
          }
        } else if (effectiveVId) {
          await policyService.updatePolicyVersion(effectiveVId, {
            changeLog: 'Auto-saved draft',
            configJson,
          });
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        setSaveStatus('error');
        showSnackbar(error.message, 'error')
      }
    }, 800);
  }, [versionId, policyId, policyStatus, template?.domainId, onVersionCreated]);

  const handleConfigChange = (path: string, value: any) => {
    const newConfig = { ...localConfig };
    const keys = path.split('.');
    let current: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === null || current[keys[i]] === undefined || typeof current[keys[i]] !== 'object') current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
    onChange(newConfig);
    validateAndSaveConfig(newConfig);
  };

  const set = useCallback((path: string, value: any) => {
    handleConfigChange(path, value);
  }, [handleConfigChange]);

  const getOTValues = async () => {
    try {
      const response: any = await categoryService.getCategoryItems("3a6987fe-3597-4f87-ab26-2e4c7eab71d9");
      setOTValues(response.data?.content || response.data || []);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load OT types", "error");
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (domainName === 'Overtime') {
        await getOTValues();
      }
      if (domainName === 'Deduction' || domainName === 'Payroll') {
        try {
          const res: any = await fetchStatesByCountry(
            'cc000000-0000-0000-0000-000000000001'
          );
          setStates(res.data || res);
        } catch (error) {
          console.error('Error fetching states:', error);
        }
      }
    };

    loadData();
  }, [domainName]);

  const renderRuleBlock = (block: any) => {
    switch (block.ruleBlockCode) {
      case 'LEAVE_ENTITLEMENTS': return <LeaveEntitlementsBlock localConfig={localConfig} set={set} leaveType={leaveType} />;
      // case 'ACCRUAL_RULES': return <AccrualRulesBlock localConfig={localConfig} set={set} />;
      case 'CARRY_FORWARD': return <CarryForwardBlock localConfig={localConfig} set={set} />;
      case 'SANDWICH_RULE': return <SandwichRuleBlock localConfig={localConfig} set={set} />;
      case 'OVERTIME_RULES': return <OvertimeRulesBlock localConfig={localConfig} set={set} otValues={otValues} />;
      case 'SHIFT_RULES': return <ShiftRulesBlock localConfig={localConfig} set={set} />;
      case 'ONBOARDING_RULES': return <OnboardingRulesBlock localConfig={localConfig} set={set} />;
      case 'OFFBOARDING_RULES': return <OffboardingRulesBlock localConfig={localConfig} set={set} />;
      case 'EXPENSE_LIMITS': return <ExpenseLimitsBlock localConfig={localConfig} set={set} expenseCategory={expenseCategory} />;
      case 'PAYROLL_RULES': return <PayrollRulesBlock localConfig={localConfig} set={set} />;
      case 'STATUTORY_DEDUCTIONS': return <StatutoryDeductionsBlock localConfig={localConfig} set={set} states={states} />;
      case 'TAX_DEDUCTIONS': return <TaxDeductionsBlock localConfig={localConfig} set={set} />;
      case 'PROBATION_RULES': return <ProbationRulesBlock localConfig={localConfig} set={set} />;
      case 'NOTICE_PERIOD_RULES': return <NoticePeriodRulesBlock localConfig={localConfig} set={set} />;
      case 'COMP_OFF_RULES': return <CompOffRulesBlock localConfig={localConfig} set={set} />;
      case 'WFH_RULES': return <WFHRulesBlock localConfig={localConfig} set={set} />;
      case 'HOLIDAY_RULES': return <HolidayRulesBlock localConfig={localConfig} set={set} />;
      case 'ALLOWANCE_RULES': return <AllowanceRulesBlock localConfig={localConfig} set={set} />;
      case 'BONUS_RULES': return <BonusRulesBlock localConfig={localConfig} set={set} />;
      case 'LOAN_ADVANCE_RULES': return <LoanAdvanceRulesBlock localConfig={localConfig} set={set} />;
      default:
        return <Alert severity="info">Configuration for {block.ruleBlockName} coming soon.</Alert>;
    }
  };

  return (
    <Box>
      <div className="flex justify-between items-center sticky top-0 z-10 bg-white pb-2">
        <div>
          <Typography variant="h6">Configure Policy Rules</Typography>
          <div className='text-gray-500 text-[12px] mb-2'>
            Customize rules for <strong className='text-primary'>{template.name}</strong> based on Indian Labour Laws and statutory requirements.
          </div>
        </div>
        <Box sx={{ mb: 2 }}>
          <Chip label={getDomainName(template.domainId)} size="small" color='info' className='!uppercase' />
          {saveStatus === 'saving' && <Chip label="Saving..." size="small" color="default" sx={{ ml: 1 }} />}
          {saveStatus === 'saved' && <Chip label="Saved" size="small" color="success" sx={{ ml: 1 }} />}
          {saveStatus === 'error' && <Chip label="Save failed" size="small" color="error" sx={{ ml: 1 }} />}
          {saveStatus === 'idle' && (versionId || template.domainId) && <Chip label="Auto-save on" size="small" color="success" sx={{ ml: 1 }} />}
        </Box>
      </div>
      <div>
        {ruleBlocks?.map((block, index) => (
          <Accordion key={block.id || index} defaultExpanded={index === 0} className='bg-white-50 border border-gray-200 rounded-md text-gray-800 mb-2'>
            <AccordionSummary expandIcon={<ExpandMoreIcon className='text-gray-800' />}>
              <Typography variant="subtitle1" >{block.ruleBlockName}</Typography>
            </AccordionSummary>
            <AccordionDetails className='!pt-0'>{renderRuleBlock(block)}</AccordionDetails>
          </Accordion>
        ))}
      </div>
      <Alert severity="info" className='mt-3' icon={<InfoIcon />}>All rules comply with Indian Labour Laws, Factories Act, 1948, and Income Tax Act, 1961.</Alert>
      {validating && (
        <Alert severity="info" className='mt-2'>Validating configuration...</Alert>
      )}
      {!validating && validationErrors.length > 0 && (
        <Alert severity="error" className='mt-2'>
          <strong>Validation errors:</strong>
          <ul className='mt-1 pl-4 list-disc'>
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Box>
  );
};

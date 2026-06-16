import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Switch,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  CloseOutlined,
  DeleteOutlineOutlined,
} from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import { type RuleBlockType, type Domain } from '../../../types/policy';
import { useUI } from '../../../context/Snackbar';
import { type CreateTemplateDialogProps } from '../types';
import { policyService } from '../../../services/modules/policy';

interface CreateTemplateFormData {
  name: string;
  description: string;
  domainId: string;
  domainCode: string;
  selectedBlocks: RuleBlockType[];
}

// Extracted out of Step1SelectTemplate.tsx — this dialog handles both
// "create a new custom template" and "edit an existing custom template",
// including its rule-block selection/configuration. It previously lived
// inline inside the step file, making that file harder to scan.
export const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({
  open, onClose, onCreated, editTemplate, onUpdated,
}) => {
  const isEditMode = !!editTemplate;
  const [formData, setFormData] = useState<CreateTemplateFormData>({
    name: '',
    description: '',
    domainId: '',
    domainCode: '',
    selectedBlocks: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTemplateFormData | 'submit', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [ruleBlocks, setRuleBlocks] = useState<any[]>([]);
  const [ruleBlockConfigs, setRuleBlockConfigs] = useState<Record<string, { configurable: boolean; mandatory: boolean }>>({});
  const [availableDomainBlocks, setAvailableDomainBlocks] = useState<any[]>([]);
  const [newlySelectedConfigs, setNewlySelectedConfigs] = useState<Record<string, { selected: boolean; configurable: boolean }>>({});
  const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);
  const { showSnackbar } = useUI();

  const fetchDomains = async () => {
    try {
      const domainRes: any = await policyService.getDomains();
      setDomains(domainRes.data.content || domainRes.data || []);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    }
  };

  const fetchRuleBlocks = async (domainCode: string) => {
    if (!domainCode) return;
    try {
      const ruleRes: any = await policyService.getRuleBlockByDomain(domainCode);
      const blocks = ruleRes.data.content || ruleRes.data || [];
      setRuleBlocks(blocks);
      setFormData(prev => ({ ...prev, selectedBlocks: blocks.map((b: any) => b.type) }));
    } catch (error: any) {
      showSnackbar(error.message, 'error');
      setRuleBlocks([]);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (isEditMode && editTemplate) {
      setFormData({
        name: editTemplate.name,
        description: editTemplate.description || '',
        domainId: editTemplate.domainId,
        domainCode: '',
        selectedBlocks: [],
      });
      setRuleBlocks([]);
      setRuleBlockConfigs({});
      setAvailableDomainBlocks([]);
      setNewlySelectedConfigs({});
      setPendingRemovals([]);
      setErrors({});
      setIsSubmitting(false);

      Promise.all([
        policyService.getDomains(),
        policyService.getRuleByTemplateId(editTemplate.id),
      ]).then(([domainRes, ruleRes]: any[]) => {
        const allDomains: Domain[] = domainRes.data.content || domainRes.data || [];
        setDomains(allDomains);

        const existing: any[] = ruleRes.data || [];
        setRuleBlocks(existing);
        const configs: Record<string, { configurable: boolean; mandatory: boolean }> = {};
        existing.forEach((b: any) => {
          configs[b.id] = { configurable: b.configurable, mandatory: b.mandatory };
        });
        setRuleBlockConfigs(configs);

        const domain = allDomains.find((d) => d.id === editTemplate.domainId);
        if (domain?.code) {
          policyService.getRuleBlockByDomain(domain.code).then((res: any) => {
            const domainBlocks: any[] = res.data.content || res.data || [];
            const existingCodes = new Set(existing.map((b: any) => b.ruleBlockCode));
            setAvailableDomainBlocks(domainBlocks.filter((b: any) => !existingCodes.has(b.code)));
          }).catch(() => { });
        }
      }).catch((err: any) => showSnackbar(err.message, 'error'));
    } else {
      fetchDomains();
      setFormData({ name: '', description: '', domainId: '', domainCode: '', selectedBlocks: [] });
      setRuleBlocks([]);
      setRuleBlockConfigs({});
      setAvailableDomainBlocks([]);
      setNewlySelectedConfigs({});
      setPendingRemovals([]);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  const handleRemoveBlock = (block: any) => {
    setPendingRemovals(prev => [...prev, block.id]);
    setRuleBlocks(prev => prev.filter((b: any) => b.id !== block.id));
    setAvailableDomainBlocks(prev => [
      ...prev,
      { id: block.ruleBlockId, name: block.ruleBlockName, code: block.ruleBlockCode },
    ]);
  };

  const toggleBlock = (type: RuleBlockType) => {
    setFormData(prev => ({
      ...prev,
      selectedBlocks: prev.selectedBlocks.includes(type)
        ? prev.selectedBlocks.filter((t) => t !== type)
        : [...prev.selectedBlocks, type],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateTemplateFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Template name is required';
    else if (formData.name.length > 100) newErrors.name = 'Template name must be less than 100 characters';
    if (!isEditMode && !formData.domainId) newErrors.domainId = 'Please select a policy domain';
    if (formData.description && formData.description.length > 500) newErrors.description = 'Description must be less than 500 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isEditMode && editTemplate) {
        const updated: any = await policyService.updateTemplate(editTemplate.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          domainId: formData.domainId,
        });
        await Promise.all(
          ruleBlocks.map((block: any) => {
            const cfg = ruleBlockConfigs[block.id];
            if (!cfg) return Promise.resolve();
            return policyService.updateRuleForTemplate(editTemplate.id, block.id, {
              configurable: cfg.configurable,
              mandatory: cfg.mandatory,
              ruleBlockId: block.id
            } as any);
          })
        );
        await Promise.all(
          pendingRemovals.map((rid) => policyService.deleteRuleFromTemplate(editTemplate.id, rid))
        );
        const toAdd = availableDomainBlocks.filter((b: any) => newlySelectedConfigs[b.id]?.selected);
        await Promise.all(
          toAdd.map((block: any, index: number) =>
            policyService.createRuleForTemplate(editTemplate.id, {
              ruleBlockId: block.id,
              sequenceNo: ruleBlocks.length + index,
              configurable: newlySelectedConfigs[block.id]?.configurable ?? true,
              mandatory: true,
            })
          )
        );
        showSnackbar('Template updated successfully', 'success');
        onUpdated?.(updated.data || updated);
      } else {
        const payload = {
          domainId: formData.domainId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          isSystemTemplate: false,
          defaultConfig: {},
        };
        const created: any = await policyService.createTemplate(payload);
        await createRuleBlocks(created.data?.id || created.id);
        showSnackbar('Template created successfully', 'success');
        onCreated(created.data || created);
      }
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save template.' });
      showSnackbar(error.message || 'Failed to save template', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createRuleBlocks = async (templateId: string) => {
    if (!templateId || formData.selectedBlocks.length === 0) return;
    const selectedRuleBlocks = ruleBlocks.filter(block =>
      formData.selectedBlocks.includes(block.code)
    );
    await Promise.all(
      selectedRuleBlocks.map((block, index) =>
        policyService.createRuleForTemplate(templateId, {
          ruleBlockId: block.id,
          sequenceNo: index,
          configurable: true,
          mandatory: true,
        })
      )
    );
  };

  const handleClose = () => { if (!isSubmitting) onClose(); };

  const handleFieldChange = (field: keyof CreateTemplateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleDomainChange = async (domainId: string) => {
    const selectedDomain = domains.find(d => d.id === domainId);
    const domainCode = selectedDomain?.code || '';
    setFormData(prev => ({ ...prev, domainId, domainCode, selectedBlocks: [] }));
    if (domainCode) await fetchRuleBlocks(domainCode);
    else setRuleBlocks([]);
    if (errors.domainId) setErrors(prev => ({ ...prev, domainId: undefined }));
  };

  return (
    <Dialog open={open} onClose={(_, reason) => { if (reason !== 'backdropClick') handleClose(); }} maxWidth="sm" fullWidth>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className='flex items-center justify-between p-2 border-b border-gray-200'>
          <div className='flex items-center text-gray-800 ml-2'>
            <Typography variant="h6" className='font-semibold'>
              {isEditMode ? 'Edit Template' : 'Create Custom Template'}
            </Typography>
          </div>
          <IconButton onClick={handleClose} disabled={isSubmitting}>
            <CloseOutlined className='text-gray-800' />
          </IconButton>
        </div>

        <DialogContent>
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors(prev => ({ ...prev, submit: undefined }))}>
              {errors.submit}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ my: 1 }}>
            <Grid size={{ xs: 12, md: isEditMode ? 12 : 6 }}>
              <TextField
                fullWidth
                required
                label="Template Name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="e.g., My Company Leave Policy 2027"
                error={!!errors.name}
                helperText={errors.name}
                disabled={isSubmitting}
              />
            </Grid>

            {!isEditMode && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required error={!!errors.domainId}>
                  <InputLabel id="policy-domain-label">Policy Domain</InputLabel>
                  <Select
                    labelId="policy-domain-label"
                    value={formData.domainId}
                    label="Policy Domain"
                    onChange={(e) => handleDomainChange(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <MenuItem value=""><em>Select a domain</em></MenuItem>
                    {domains.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                  {errors.domainId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.domainId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Brief description of what this template covers"
                error={!!errors.description}
                helperText={errors.description}
                disabled={isSubmitting}
              />
            </Grid>

            {isEditMode && (
              <Grid size={{ xs: 12 }}>
                {ruleBlocks.length > 0 && (
                  <>
                    <div className='text-gray-800 text-[12px] mb-2 font-medium'>Configured Rule Blocks</div>
                    <div className='flex flex-col gap-2'>
                      {ruleBlocks.map((block: any) => (
                        <div key={block.id} className='flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2'>
                          <div className='grid grid-cols-[35px_auto] gap-1'>
                            <IconButton
                              size="small"
                              disabled={isSubmitting}
                              onClick={() => handleRemoveBlock(block)}
                            >
                              <DeleteOutlineOutlined className='!w-4 text-red-400' />
                            </IconButton>
                            <div>
                              <Typography variant="body2" className='font-medium'>{block.ruleBlockName}</Typography>
                              <Typography variant="caption" color="text.secondary">{block.ruleBlockCode}</Typography>
                            </div>
                          </div>
                          <div className='flex items-center gap-1'>
                            <FormControlLabel
                              sx={{ mr: 0 }}
                              control={
                                <Switch
                                  size="small"
                                  checked={ruleBlockConfigs[block.id]?.configurable ?? block.configurable}
                                  onChange={(e) => setRuleBlockConfigs(prev => ({
                                    ...prev,
                                    [block.id]: { ...prev[block.id], configurable: e.target.checked, mandatory: prev[block.id]?.mandatory ?? block.mandatory },
                                  }))}
                                  disabled={isSubmitting}
                                />
                              }
                              label={<Typography variant="caption" color="text.secondary">Configurable</Typography>}
                              labelPlacement="start"
                            />

                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {availableDomainBlocks.length > 0 && (
                  <div className={ruleBlocks.length > 0 ? 'mt-4' : ''}>
                    <div className='text-gray-800 text-[12px] mb-2 font-medium'>Available Rule Blocks</div>
                    <div className='flex flex-col gap-2'>
                      {availableDomainBlocks.map((block: any) => {
                        const isChecked = !!newlySelectedConfigs[block.id]?.selected;
                        return (
                          <div key={block.id} className='flex items-center justify-between border border-dashed border-gray-300 rounded px-3 py-2'>
                            <FormControlLabel
                              sx={{ mr: 0, flex: 1 }}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={isChecked}
                                  onChange={(e) => setNewlySelectedConfigs(prev => ({
                                    ...prev,
                                    [block.id]: { selected: e.target.checked, configurable: prev[block.id]?.configurable ?? true },
                                  }))}
                                  disabled={isSubmitting}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" className='font-medium'>{block.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{block.code}</Typography>
                                </Box>
                              }
                            />
                            {isChecked && (
                              <FormControlLabel
                                sx={{ mr: 0 }}
                                control={
                                  <Switch
                                    size="small"
                                    checked={newlySelectedConfigs[block.id]?.configurable ?? true}
                                    onChange={(e) => setNewlySelectedConfigs(prev => ({
                                      ...prev,
                                      [block.id]: { ...prev[block.id], configurable: e.target.checked },
                                    }))}
                                    disabled={isSubmitting}
                                  />
                                }
                                label={<Typography variant="caption" color="text.secondary">Configurable</Typography>}
                                labelPlacement="start"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Grid>
            )}

            {!isEditMode && formData.domainId && (
              <Grid size={{ xs: 12 }}>
                <div className='text-gray-800 text-[12px] my-3'>Select Rule Blocks</div>
                {ruleBlocks.length === 0 ? (
                  <Alert severity="info" sx={{ py: 0.5, mt: 1 }}>
                    No predefined rule blocks for this domain. The template will be created with a blank config.
                  </Alert>
                ) : (
                  <FormGroup>
                    <div className='flex flex-wrap gap-2 items-center'>
                      {ruleBlocks.map((block) => (
                        <div key={block.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={formData.selectedBlocks.includes(block.code)}
                                onChange={() => toggleBlock(block.code)}
                                disabled={isSubmitting}
                                className='text-gray-800'
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" className='font-medium'>{block.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{block.code}</Typography>
                              </Box>
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </FormGroup>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }} className='!border-t !border-gray-200'>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting} className='!text-gray-800 !border-gray-200'>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} className='!bg-primary'>
            {isSubmitting ? <CircularProgress size={24} /> : isEditMode ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

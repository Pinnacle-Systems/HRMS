import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutlineOutlined,
  EditOutlined,
  ContentCopy as CopyIcon,
  MoreVertOutlined,
} from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { type PolicyTemplate } from '../../../types/policy';
import { useUI } from '../../../context/Snackbar';
import { type Step1SelectTemplateProps } from '../types';
import { policyService } from '../../../services/modules/policy';
import { usePolicyDomains } from '../../../hooks/usePolicyDomains';
import { CreateTemplateDialog } from './CreateTemplateDialog';

// ── Main Step ─────────────────────────────────────────────────────────────────

export const Step1SelectTemplate: React.FC<Step1SelectTemplateProps> = ({
  selectedTemplate,
  onSelect,
  onPolicyDefinitionChange,
  policyDefinition,
  policyDomain
}) => {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PolicyTemplate[]>([]);
  const [domain, setDomain] = useState<string>(policyDomain || '');
  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; editTemplate: PolicyTemplate | null }>({ open: false, editTemplate: null });
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const { domains, getDomainName } = usePolicyDomains();
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuTemplate, setActionMenuTemplate] = useState<PolicyTemplate | null>(null);

  const loadTemplates = async () => {
    showSpinner();
    try {
      const params = {
        sort: "createdAt,DESC"
      }
      const allTemplates: any = await policyService.getTemplates(params);
      const templateData = allTemplates.data.content || allTemplates.data || [];
      setTemplates(templateData);
      setFilteredTemplates(templateData);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [domain, templates]);

  const filterTemplates = () => {
    let filtered = [...templates];
    if (domain) {
      filtered = filtered.filter((t) => t.domainId === domain);
    }
    setFilteredTemplates(filtered);
  };

  const handleTemplateCreated = async (template: PolicyTemplate) => {
    onSelect(template);
    await loadTemplates();
  };

  const handleTemplateUpdated = async (updated: PolicyTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTemplate?.id === updated.id) onSelect(updated);
    await loadTemplates();
  };

  const handleTemplateDeleted = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplate?.id === id) {
      onSelect(null as any);
      onPolicyDefinitionChange({ name: '', description: '' });
    }
  };

  const handleCopyTemplate = async (template: PolicyTemplate) => {
    showSpinner();
    try {
      await policyService.copyTemplate(template.id, {
        name: `${template.name} (Copy)`,
        description: template.description,
      });
      showSnackbar('Template copied successfully', 'success');
      await loadTemplates();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to copy template', 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleDomainChange = (newDomain: string) => {
    setDomain(newDomain);
    if (selectedTemplate && selectedTemplate.domainId !== newDomain) {
      onSelect(null as any);
      onPolicyDefinitionChange({ name: '', description: '' });
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    template: PolicyTemplate,
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuTemplate(template);
  };

  const handleMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuTemplate(null);
  };

  return (
    <div >
      <Typography variant="h6" gutterBottom>Select Policy Template</Typography>
      <div className='text-gray-500 mb-4 text-[12px]'>
        Choose a system template that matches your policy type, or create a custom one.
        You can customise all rules in the next step.
      </div>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined" sx={{ p: 2 }} className='!bg-white-50'>
            <div className='text-[12px] mb-4 text-gray-800'>Filters</div>
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel id="filter-domain-label">Policy Domain</InputLabel>
              <Select
                labelId="filter-domain-label"
                value={domain}
                label="Policy Domain"
                onChange={(e) => handleDomainChange(e.target.value)}
              >
                <MenuItem value="">All Domains</MenuItem>
                {domains.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setTemplateDialog({ open: true, editTemplate: null })}
              className='!border-primary !text-primary hover:!bg-primary/5'
            >
              Create Custom Template
            </Button>
          </Card>
          {/* Policy name / description — only shown after selecting a template */}
          {selectedTemplate && (
            <div className='mt-4 border border-gray-200 rounded-sm p-4 bg-white-50'>
              <div className='text-[12px] mb-4 text-gray-800'>Policy Information</div>
              <div className='grid gap-y-6'>
                <TextField
                  fullWidth
                  required
                  label="Policy Name"
                  value={policyDefinition.policyName}
                  onChange={(e) => onPolicyDefinitionChange({ ...policyDefinition, policyName: e.target.value })}
                  placeholder="Enter policy name"
                />
                <TextField
                  fullWidth
                  required
                  label="Policy Code"
                  value={(policyDefinition as any).policyCode || ''}
                  onChange={(e) => onPolicyDefinitionChange({ ...policyDefinition, policyCode: e.target.value })}
                  placeholder="e.g., LVE-2026"
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={policyDefinition.description}
                  onChange={(e) => onPolicyDefinitionChange({ ...policyDefinition, description: e.target.value })}
                  placeholder="Enter policy description (optional)"
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Effective From"
                    value={(policyDefinition as any).effectiveFrom ? dayjs((policyDefinition as any).effectiveFrom) : null}
                    onChange={(v) => onPolicyDefinitionChange({ ...policyDefinition, effectiveFrom: v ? dayjs(v).format('YYYY-MM-DD') : '' })}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                  <DatePicker
                    label="Effective To"
                    value={(policyDefinition as any).effectiveTo ? dayjs((policyDefinition as any).effectiveTo) : null}
                    onChange={(v) => onPolicyDefinitionChange({ ...policyDefinition, effectiveTo: v ? dayjs(v).format('YYYY-MM-DD') : '' })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </div>
            </div>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          {filteredTemplates.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No templates match the selected filters. Try clearing filters or create a custom template.
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-3">
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              const isCustom = !template.isSystemTemplate;
              return (
                <div key={template.id}>
                  <Card className={`${isSelected ? '!border-primary' : '!border-gray-200'}`}
                    variant={isSelected ? 'elevation' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                    }}
                    onClick={() => onSelect(template)}
                  >
                    <CardContent className='bg-white'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <div className='text-[12px] text-gray-600 font-bold'>
                              {template.name}
                            </div>
                          </Box>
                          <div className='text-gray-500 text-[12px] mb-2 min-h-[36px]'>
                            {template.description}
                          </div>
                        </div>
                        <div>
                          <IconButton size="small"
                            onClick={(e) => handleMenuOpen(e, template)}>
                            <MoreVertOutlined className='text-gray-800' />
                          </IconButton>
                        </div>
                      </div>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        <Chip
                          label={template.domainName}
                          size="small"
                          color="primary"
                          variant="outlined"
                          className='!text-primary !border-primary'
                        />
                        <Chip
                          label={`${template.blockCount} blocks`}
                          size="small"
                          variant="outlined"
                          className='!text-gray-800 !border-gray-200'
                        />
                        {isCustom && (
                          <Chip
                            label="Custom"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          <Menu
            anchorEl={actionMenuAnchor}
            open={Boolean(actionMenuAnchor)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem
              className="!text-[12px]"
              onClick={(e) => {
                e.stopPropagation();
                if (actionMenuTemplate) handleCopyTemplate(actionMenuTemplate);
                handleMenuClose();
              }}
            >
              <CopyIcon className='text-green-500 !w-4 mr-2' />
              Copy Template
            </MenuItem>

            {actionMenuTemplate && !actionMenuTemplate.isSystemTemplate && (
              <>
                <MenuItem
                  className="!text-[12px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTemplateDialog({ open: true, editTemplate: actionMenuTemplate });
                    handleMenuClose();
                  }}
                >
                  <EditOutlined className='text-blue-500 !w-4 mr-2' />
                  Edit Template
                </MenuItem>

                <MenuItem
                  className="!text-[12px] text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    const template = actionMenuTemplate;
                    showConfirmDialog({
                      title: 'Delete Template',
                      message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
                      confirmText: 'Delete',
                      onConfirm: async () => {
                        try {
                          await policyService.deleteTemplate(template.id);
                          handleTemplateDeleted(template.id);
                          showSnackbar('Template deleted successfully', 'success');
                        } catch (error: any) {
                          showSnackbar(error.message || 'Failed to delete template', 'error');
                        }
                      },
                    });
                    handleMenuClose();
                  }}
                >
                  <DeleteOutlineOutlined className='text-red-500 !w-4 mr-2' />
                  Delete Template
                </MenuItem>
              </>
            )}
          </Menu>
        </Grid>
      </Grid>

      <CreateTemplateDialog
        open={templateDialog.open}
        onClose={() => setTemplateDialog({ open: false, editTemplate: null })}
        onCreated={handleTemplateCreated}
        editTemplate={templateDialog.editTemplate}
        onUpdated={handleTemplateUpdated}
      />
    </div>
  );
};

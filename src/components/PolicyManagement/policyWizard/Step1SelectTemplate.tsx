import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  TextField,
  Chip,
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
  Divider,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  CloseOutlined,
  StarBorder as CustomIcon,
} from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import { policyApi } from '../../../services/modules/policy';
import { type PolicyTemplate, PolicyDomain, type RuleBlockType } from '../../../types/policy';
import { useUI } from '../../../context/Snackbar';
import { DOMAIN_RULE_BLOCKS, type CreateTemplateDialogProps, type Step1SelectTemplateProps } from '../types';
import { MOCK_TEMPLATES } from '../const';

const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<PolicyDomain | ''>('');
  const [selectedBlocks, setSelectedBlocks] = useState<RuleBlockType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const availableBlocks = domain ? (DOMAIN_RULE_BLOCKS[domain] || []) : [];

  useEffect(() => {
    setSelectedBlocks(availableBlocks.map((b) => b.type));
  }, [domain]);

  const toggleBlock = (type: RuleBlockType) => {
    setSelectedBlocks((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Template name is required.'); return; }
    if (!domain) { setError('Please select a policy domain.'); return; }
    setError('');
    setSaving(true);
    try {
      const ruleBlocks = availableBlocks
        .filter((b) => selectedBlocks.includes(b.type))
        .map((b, i) => ({ id: `rb_${i + 1}`, name: b.name, type: b.type, configurable: true, schema: {} }));

      const created = await policyApi.createTemplate({
        name: name.trim(),
        description: description.trim(),
        domain,
        ruleBlocks,
        defaultConfig: {},
        isSystemTemplate: false,
      });
      onCreated(created);
      setName(''); setDescription(''); setDomain(''); setSelectedBlocks([]);
    } catch (e: any) {
      setError(e.message || 'Failed to create template.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName(''); setDescription(''); setDomain('');
    setSelectedBlocks([]); setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <div className='flex items-center justify-between p-2 border-b border-gray-200'>
        <div className='flex text-primary'>
          <CustomIcon fontSize="small" className='ml-3' />
          <div className='ml-3'> Create Custom Template</div>
        </div>
        <IconButton onClick={handleClose}>
          <CloseOutlined className='text-gray-800' />
        </IconButton>
      </div>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2} sx={{ my: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth required label="Template Name"
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Company Leave Policy 2027" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Policy Domain</InputLabel>
              <Select value={domain} label="Policy Domain"
                onChange={(e) => setDomain(e.target.value)}>
                {Object.values(PolicyDomain).map((d) => (
                  <MenuItem key={d} value={d}>{d.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Description" multiline rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template covers" />
          </Grid>

          {domain && (
            <>
              <Grid size={{ xs: 12 }}>
                <Divider />
                <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 1 }}>
                  Rule Blocks
                </Typography>
                {availableBlocks.length === 0 ? (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    No predefined rule blocks for this domain. The template will be created with a blank config.
                  </Alert>
                ) : (
                  <FormGroup>
                    {availableBlocks.map((block) => (
                      <FormControlLabel key={block.type}
                        control={
                          <Checkbox size="small"
                            checked={selectedBlocks.includes(block.type)}
                            onChange={() => toggleBlock(block.type)} />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{block.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{block.type}</Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                )}
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }} className='!border-t !border-gray-200'>
        <Button variant="outlined" onClick={handleClose} className='!text-gray-800 !border-gray-200' disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving} className='!bg-primary' >
          {saving ? 'Creating…' : 'Create Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { showSpinner, hideSpinner } = useUI();

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { filterTemplates(); }, [domain, templates]);

  const loadTemplates = async () => {
    showSpinner()
    try {
      const allTemplates = await policyApi.getTemplates();
      const arr = Array.isArray(allTemplates) && allTemplates.length > 0 ? allTemplates : MOCK_TEMPLATES;
      setTemplates(arr);
      setFilteredTemplates(arr);
    } catch {
      setTemplates(MOCK_TEMPLATES);
      setFilteredTemplates(MOCK_TEMPLATES);
    } finally {
      hideSpinner();
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];
    if (domain) filtered = filtered.filter((t) => t.domain === domain);
    setFilteredTemplates(filtered);
  };

  const handleTemplateCreated = (template: PolicyTemplate) => {
    setTemplates((prev) => [...prev, template]);
    setCreateDialogOpen(false);
    onSelect(template);
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
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Policy Domain</InputLabel>
              <Select value={domain} label="Policy Domain"
                onChange={(e) => setDomain(e.target.value)}>
                <MenuItem value="">All Domains</MenuItem>
                {Object.values(PolicyDomain).map((d) => (
                  <MenuItem key={d} value={d}>{d.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Custom Template
            </Button>
          </Card>
          {/* Policy name / description — only shown after selecting a template */}
          {selectedTemplate && (
            <div className='mt-4 border border-gray-200 rounded-sm p-4 bg-white-50'>
              <div className='text-[12px] mb-4 text-gray-800'>Policy Information</div>
              <div className='grid gap-4'>
                <div>
                  <TextField fullWidth required label="Policy Name"
                    value={policyDefinition.name}
                    onChange={(e) => onPolicyDefinitionChange({ ...policyDefinition, name: e.target.value })}
                  />
                </div>
                <div>
                  <TextField fullWidth label="Description" multiline rows={5}
                    value={policyDefinition.description}
                    onChange={(e) => onPolicyDefinitionChange({ ...policyDefinition, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </Grid>

        {/* Template grid */}
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
                    <CardActionArea>
                      <CardContent className='bg-white'>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <div className='text-[12px] text-gray-600 font-bold'>
                            {template.name}
                          </div>
                        </Box>
                        <div className='text-gray-500 text-[12px] mb-2 min-h-[36px]'>
                          {template.description}
                        </div>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label={template.domain.replace(/_/g, ' ')} size="small"
                            color="primary" variant="outlined" className='!text-primary !border-primary' />

                          <Chip label={`${template.ruleBlocks?.length || 0} blocks`}
                            size="small" variant="outlined" className='!text-gray-800' />
                          {isCustom && (
                            <Chip label="Custom" size="small" color="secondary" variant="outlined" />
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </div>
              );
            })}
          </div>
        </Grid>
      </Grid>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={handleTemplateCreated}
      />
    </div>
  );
};

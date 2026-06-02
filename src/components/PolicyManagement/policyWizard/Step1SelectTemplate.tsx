// src/components/PolicyManagement/PolicyWizard/Step1SelectTemplate.tsx

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
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import {
  BusinessCenter,
  Factory,
  Computer,
  LocalHospital,
  Store,
  Agriculture,
  Add as AddIcon,
  StarBorder as CustomIcon,
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { policyApi } from '../../../services/modules/policy';
import { type PolicyTemplate, PolicyDomain, IndustryType } from '../../../types/policy';
import { MOCK_TEMPLATES } from '../const';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Step1SelectTemplateProps {
  companyId: string;
  selectedTemplate: PolicyTemplate | null;
  onSelect: (template: PolicyTemplate) => void;
  onPolicyDefinitionChange: (data: any) => void;
  policyDefinition: any;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const industryIcons: Record<string, React.ReactNode> = {
  [IndustryType.IT]: <Computer />,
  [IndustryType.MANUFACTURING]: <Factory />,
  [IndustryType.TEXTILE]: <Agriculture />,
  [IndustryType.RETAIL]: <Store />,
  [IndustryType.HEALTHCARE]: <LocalHospital />,
  [IndustryType.CONSTRUCTION]: <BusinessCenter />,
  [IndustryType.LOGISTICS]: <BusinessCenter />,
  [IndustryType.EDUCATION]: <BusinessCenter />,
  [IndustryType.HOSPITALITY]: <BusinessCenter />,
  [IndustryType.BPO]: <Computer />,
};

// Rule blocks available per domain
const DOMAIN_RULE_BLOCKS: Record<string, { type: string; name: string }[]> = {
  LEAVE: [
    { type: 'LEAVE_ENTITLEMENTS', name: 'Leave Entitlements' },
    { type: 'ACCRUAL_RULES',      name: 'Accrual Rules' },
    { type: 'CARRY_FORWARD',      name: 'Carry Forward' },
    { type: 'SANDWICH_RULE',      name: 'Sandwich Rule' },
  ],
  OVERTIME: [
    { type: 'OVERTIME_RULES', name: 'Overtime Rules' },
  ],
  ATTENDANCE: [
    { type: 'SHIFT_RULES', name: 'Shift & Attendance Rules' },
  ],
  SHIFT: [
    { type: 'SHIFT_RULES',    name: 'Shift Rules' },
    { type: 'ROTATION_RULES', name: 'Rotation Rules' },
  ],
  EXPENSE: [
    { type: 'EXPENSE_LIMITS', name: 'Expense Limits' },
  ],
  PAYROLL: [
    { type: 'PAYROLL_RULES', name: 'Payroll Components' },
  ],
  PROBATION: [
    { type: 'PROBATION_RULES', name: 'Probation Rules' },
  ],
  NOTICE_PERIOD: [
    { type: 'NOTICE_PERIOD_RULES', name: 'Notice Period Rules' },
  ],
};

// ── Create Template Dialog ────────────────────────────────────────────────────

interface CreateTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (template: PolicyTemplate) => void;
}

const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<string>('');
  const [industryType, setIndustryType] = useState<string>('');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableBlocks = domain ? (DOMAIN_RULE_BLOCKS[domain] || []) : [];

  // Auto-select all blocks when domain changes
  useEffect(() => {
    setSelectedBlocks(availableBlocks.map((b) => b.type));
  }, [domain]);

  const toggleBlock = (type: string) => {
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
        domain: domain as any,
        industryType: industryType as any || undefined,
        ruleBlocks,
        defaultConfig: {},
        isSystemTemplate: false,
      });
      onCreated(created);
      // Reset form
      setName(''); setDescription(''); setDomain(''); setIndustryType(''); setSelectedBlocks([]);
    } catch (e: any) {
      setError(e.message || 'Failed to create template.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName(''); setDescription(''); setDomain(''); setIndustryType('');
    setSelectedBlocks([]); setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CustomIcon fontSize="small" />
        Create Custom Template
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth required size="small" label="Template Name"
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Company Leave Policy 2027" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth size="small" label="Description" multiline rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template covers" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Policy Domain</InputLabel>
              <Select value={domain} label="Policy Domain"
                onChange={(e) => setDomain(e.target.value)}>
                {Object.values(PolicyDomain).map((d) => (
                  <MenuItem key={d} value={d}>{d.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Industry Type (optional)</InputLabel>
              <Select value={industryType} label="Industry Type (optional)"
                onChange={(e) => setIndustryType(e.target.value)}>
                <MenuItem value="">All Industries</MenuItem>
                {Object.values(IndustryType).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving} startIcon={<AddIcon />}>
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
}) => {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [industryType, setIndustryType] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { filterTemplates(); }, [industryType, domain, templates]);

  const loadTemplates = async () => {
    try {
      const allTemplates = await policyApi.getTemplates();
      const arr = Array.isArray(allTemplates) && allTemplates.length > 0 ? allTemplates : MOCK_TEMPLATES;
      setTemplates(arr);
      setFilteredTemplates(arr);
    } catch {
      setTemplates(MOCK_TEMPLATES);
      setFilteredTemplates(MOCK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];
    if (industryType) filtered = filtered.filter((t) => t.industryType === industryType || !t.industryType);
    if (domain)       filtered = filtered.filter((t) => t.domain === domain);
    setFilteredTemplates(filtered);
  };

  const handleTemplateCreated = (template: PolicyTemplate) => {
    setTemplates((prev) => [...prev, template]);
    setCreateDialogOpen(false);
    onSelect(template);                      // auto-select the newly created template
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Select Policy Template</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose a system template that matches your industry and policy type, or create a custom one.
        You can customise all rules in the next step.
      </Typography>

      <Grid container spacing={3}>
        {/* Sidebar filters */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Filters</Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Industry Type</InputLabel>
              <Select value={industryType} label="Industry Type"
                onChange={(e) => setIndustryType(e.target.value)}>
                <MenuItem value="">All Industries</MenuItem>
                {Object.values(IndustryType).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel>Policy Domain</InputLabel>
              <Select value={domain} label="Policy Domain"
                onChange={(e) => setDomain(e.target.value)}>
                <MenuItem value="">All Domains</MenuItem>
                {Object.values(PolicyDomain).map((d) => (
                  <MenuItem key={d} value={d}>{d.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ mb: 2 }} />

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Custom Template
            </Button>
          </Card>
        </Grid>

        {/* Template grid */}
        <Grid size={{ xs: 12, md: 9 }}>
          {filteredTemplates.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No templates match the selected filters. Try clearing filters or create a custom template.
            </Alert>
          )}

          <Grid container spacing={2}>
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              const isCustom = !template.isSystemTemplate;
              return (
                <Grid size={{ xs: 12, sm: 6 }} key={template.id}>
                  <Card
                    variant={isSelected ? 'elevation' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                    }}
                    onClick={() => onSelect(template)}
                  >
                    <CardActionArea>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          {template.industryType
                            ? industryIcons[template.industryType]
                            : <CustomIcon />
                          }
                          <Typography variant="h6" sx={{ ml: 1, fontSize: '1rem' }}>
                            {template.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 36 }}>
                          {template.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label={template.domain.replace(/_/g, ' ')} size="small"
                            color="primary" variant="outlined" />
                          {template.industryType && (
                            <Chip label={template.industryType} size="small" variant="outlined" />
                          )}
                          <Chip label={`${template.ruleBlocks?.length || 0} blocks`}
                            size="small" variant="outlined" />
                          {isCustom && (
                            <Chip label="Custom" size="small" color="secondary" variant="outlined" />
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>

      {/* Policy name / description — only shown after selecting a template */}
      {selectedTemplate && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Policy Information</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth required label="Policy Name"
                value={policyDefinition.name}
                onChange={(e) => onPolicyDefinitionChange({ ...policyDefinition, name: e.target.value })}
                helperText="Give your policy a unique name" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Description" multiline rows={2}
                value={policyDefinition.description}
                onChange={(e) => onPolicyDefinitionChange({ ...policyDefinition, description: e.target.value })}
                helperText="Optional: describe the purpose of this policy" />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={handleTemplateCreated}
      />
    </Box>
  );
};

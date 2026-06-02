import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  MenuItem,
  Select,
  TextField,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ContentCopy as CopyIcon,
  // HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { ConditionEditor } from './ConditionEditor';
import { ActionEditor } from './ActionEditor';
import { type PolicyRule } from '../../../types/policy';

interface RuleBuilderProps {
  rules: PolicyRule[];
  onChange: (rules: PolicyRule[]) => void;
  availableRuleTypes: string[];
  domain: string;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rules,
  onChange,
  availableRuleTypes,
  domain,
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const addRule = () => {
    const newRule: PolicyRule = {
      id: `rule_${Date.now()}`,
      name: `New Rule ${rules.length + 1}`,
      ruleType: availableRuleTypes[0] || 'CUSTOM',
      condition: {
        field: '',
        operator: 'eq',
        value: null,
      },
      action: {
        type: 'ALLOW',
      },
      priority: rules.length,
      enabled: true,
    };
    onChange([...rules, newRule]);
    setEditingRuleId(newRule.id);
    console.log(editingRuleId);
    
  };

  const updateRule = (ruleId: string, updates: Partial<PolicyRule>) => {
    onChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (ruleId: string) => {
    onChange(rules.filter(rule => rule.id !== ruleId));
  };

  const duplicateRule = (rule: PolicyRule) => {
    const newRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (Copy)`,
      priority: rules.length,
    };
    onChange([...rules, newRule]);
  };

  const moveRule = (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newRules[index], newRules[swapIndex]] = [newRules[swapIndex], newRules[index]];
    onChange(newRules);
  };

  return (
    <Box>
      <Box className="flex justify-between items-center mb-2">
        <Typography variant="subtitle1">
          Business Rules
          <Tooltip title="Rules are evaluated in priority order (highest first)">
            <IconButton size="small">
              {/* <HelpIcon fontSize="small" /> */}
            </IconButton>
          </Tooltip>
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={addRule}
        >
          Add Rule
        </Button>
      </Box>

      {rules.length === 0 && (
        <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No rules configured. Click "Add Rule" to start defining business logic.
          </Typography>
        </Card>
      )}

      {rules.map((rule, index) => (
        <Card key={rule.id} sx={{ mb: 2, position: 'relative' }}>
          <CardContent>
            <Box className="flex items-center mb-2">
              <IconButton size="small" sx={{ cursor: 'grab' }}>
                <DragIcon />
              </IconButton>
              <TextField
                size="small"
                value={rule.name}
                onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                sx={{ flex: 1, mx: 1 }}
                placeholder="Rule name"
              />
              <FormControl size="small" sx={{ minWidth: 150, mx: 1 }}>
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={rule.ruleType}
                  label="Rule Type"
                  onChange={(e) => updateRule(rule.id, { ruleType: e.target.value })}
                >
                  {availableRuleTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Chip 
                label={`Priority: ${rule.priority}`} 
                size="small" 
                variant="outlined"
              />
              <Box>
                <IconButton size="small" onClick={() => duplicateRule(rule)}>
                  <CopyIcon />
                </IconButton>
                <IconButton size="small" onClick={() => moveRule(index, 'up')} disabled={index === 0}>
                  ↑
                </IconButton>
                <IconButton size="small" onClick={() => moveRule(index, 'down')} disabled={index === rules.length - 1}>
                  ↓
                </IconButton>
                <IconButton size="small" onClick={() => deleteRule(rule.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{xs:12,md:6}}>
                <Typography variant="caption" color="text.secondary">
                  WHEN (Condition)
                </Typography>
                <ConditionEditor
                  condition={rule.condition}
                  onChange={(condition) => updateRule(rule.id, { condition })}
                  domain={domain}
                />
              </Grid>
              <Grid size={{xs:12,md:6}}>
                <Typography variant="caption" color="text.secondary">
                  THEN (Action)
                </Typography>
                <ActionEditor
                  action={rule.action}
                  onChange={(action) => updateRule(rule.id, { action })}
                  domain={domain}
                />
              </Grid>
            </Grid>

            <Box className="flex justify-end items-center mb-2">
              <Chip
                label={rule.enabled ? 'Enabled' : 'Disabled'}
                color={rule.enabled ? 'success' : 'default'}
                size="small"
                onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
              />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
// src/components/RuleBuilder/ConditionEditor.tsx

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Button,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import {
  // Add as AddIcon,
  Delete as DeleteIcon,
  MergeType as AndIcon,
  CallSplit as OrIcon,
} from '@mui/icons-material';
import type{ RuleCondition } from '../../../types/policy';

interface ConditionEditorProps {
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
  domain: string;
  level?: number;
}

const fieldOptions: Record<string, string[]> = {
  LEAVE: ['requestedDays', 'leaveType', 'availableBalance', 'employeeJoinDate', 'isProbation'],
  ATTENDANCE: ['lateMinutes', 'absentDays', 'shiftType', 'location', 'dayOfWeek'],
  OVERTIME: ['overtimeHours', 'projectType', 'clientName', 'isWeekend'],
  EXPENSE: ['amount', 'expenseType', 'projectCode', 'billable', 'clientApproved'],
  DEFAULT: ['value', 'days', 'amount', 'type', 'status'],
};

const operators = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less or Equal' },
  { value: 'in', label: 'In List' },
  { value: 'notIn', label: 'Not In List' },
  { value: 'between', label: 'Between' },
];

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  condition,
  onChange,
  domain,
  level = 0,
}) => {
  const fields = fieldOptions[domain as keyof typeof fieldOptions] || fieldOptions.DEFAULT;

  const updateCondition = (updates: Partial<RuleCondition>) => {
    onChange({ ...condition, ...updates });
  };

  const addNestedCondition = (logicalOperator: 'and' | 'or') => {
    const newCondition: RuleCondition = {
      field: '',
      operator: 'eq',
      value: null,
    };
    updateCondition({
      logicalOperator,
      conditions: [...(condition.conditions || []), newCondition],
    });
  };

  const updateNestedCondition = (index: number, nestedCondition: RuleCondition) => {
    const newConditions = [...(condition.conditions || [])];
    newConditions[index] = nestedCondition;
    updateCondition({ conditions: newConditions });
  };

  const removeNestedCondition = (index: number) => {
    const newConditions = [...(condition.conditions || [])];
    newConditions.splice(index, 1);
    if (newConditions.length === 0) {
      updateCondition({ conditions: undefined, logicalOperator: undefined });
    } else {
      updateCondition({ conditions: newConditions });
    }
  };

  // Single condition (leaf node)
  if (!condition.conditions || condition.conditions.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: level > 0 ? 'action.hover' : 'background.paper' }}>
        <Grid container spacing={1}>
          <Grid size={{xs:3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Field</InputLabel>
              <Select
                value={condition.field}
                label="Field"
                onChange={(e) => updateCondition({ field: e.target.value })}
              >
                {fields.map(field => (
                  <MenuItem key={field} value={field}>{field}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Operator</InputLabel>
              <Select
                value={condition.operator}
                label="Operator"
                onChange={(e) => updateCondition({ operator: e.target.value as any })}
              >
                {operators.map(op => (
                  <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:5}}>
            {condition.operator === 'between' ? (
              <div className='flex gap-1'>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="Min"
                  value={Array.isArray(condition.value) ? condition.value[0] : ''}
                  onChange={(e) => updateCondition({ 
                    value: [Number(e.target.value), Array.isArray(condition.value) ? condition.value[1] : 0] 
                  })}
                />
                <span>to</span>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="Max"
                  value={Array.isArray(condition.value) ? condition.value[1] : ''}
                  onChange={(e) => updateCondition({ 
                    value: [Array.isArray(condition.value) ? condition.value[0] : 0, Number(e.target.value)] 
                  })}
                />
              </div>
            ) : condition.operator === 'in' || condition.operator === 'notIn' ? (
              <TextField
                fullWidth
                size="small"
                placeholder="Comma-separated values"
                value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value || ''}
                onChange={(e) => updateCondition({ value: e.target.value.split(',').map(v => v.trim()) })}
              />
            ) : (
              <TextField
                fullWidth
                size="small"
                placeholder="Value"
                value={condition.value || ''}
                onChange={(e) => updateCondition({ value: e.target.value })}
              />
            )}
          </Grid>
        </Grid>
        {level > 0 && (
          <div className='flex items-end mt-1'>
            <Chip
              size="small"
              label={condition.logicalOperator === 'and' ? 'AND' : 'OR'}
              color="primary"
              variant="outlined"
            />
          </div>
        )}
      </Paper>
    );
  }

  // Complex condition with nested conditions
  return (
    <Box>
      <div className='flex gap-1 mb-1'>
        <Button
          size="small"
          startIcon={<AndIcon />}
          onClick={() => addNestedCondition('and')}
        >
          Add AND
        </Button>
        <Button
          size="small"
          startIcon={<OrIcon />}
          onClick={() => addNestedCondition('or')}
        >
          Add OR
        </Button>
      </div>

      <div className='flex flex-col gap-1'>
        {condition.conditions.map((nestedCondition, index) => (
          <div key={index} className='flex items-start gap-1'>
            <div>
              <ConditionEditor
                condition={nestedCondition}
                onChange={(newCond) => updateNestedCondition(index, newCond)}
                domain={domain}
                level={level + 1}
              />
            </div>
            <IconButton size="small" onClick={() => removeNestedCondition(index)}>
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </div>

      {level === 0 && condition.logicalOperator && (
        <div>
          <Chip
            size="small"
            label={`Combine with ${condition.logicalOperator.toUpperCase()}`}
            color="primary"
          />
        </div>
      )}
    </Box>
  );
};
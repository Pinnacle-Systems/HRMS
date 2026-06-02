import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Avatar,
  Box,
  Typography,
} from '@mui/material';
import type { Employee } from '../../../types/policy';
import { MOCK_EMPLOYEES } from '../../../services/mockPolicyService';

interface EmployeeSelectorProps {
  companyId: string;
  value: Employee | null;
  onChange: (employee: Employee | null) => void;
  multiple?: boolean;
  filter?: (employee: Employee) => boolean;
  label?: string;
  placeholder?: string;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  companyId,
  value,
  onChange,
  multiple = false,
  filter,
  label = 'Select Employee',
  placeholder = 'Search employees…',
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Simulate async search against mock data
    const timer = setTimeout(() => {
      let list = MOCK_EMPLOYEES.filter(e => e.companyId === companyId);
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        list = list.filter(
          e =>
            e.name.toLowerCase().includes(q) ||
            e.employeeCode.toLowerCase().includes(q),
        );
      }
      if (filter) list = list.filter(filter);
      setOptions(list);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, searchTerm, companyId, filter]);

  const deptNames: Record<string, string> = {
    dept1: 'Engineering',
    dept2: 'Sales',
    dept3: 'HR',
    dept4: 'Production',
  };
  const desigNames: Record<string, string> = {
    des1: 'Manager',
    des2: 'Senior Engineer',
    des3: 'Associate',
    des4: 'Worker',
  };
  const categoryColors: Record<string, string> = {
    STAFF:        '#1976d2',
    LABOUR:       '#d32f2f',
    GROUND_WORKER:'#388e3c',
    SUPERVISOR:   '#f57c00',
    TECHNICIAN:   '#7b1fa2',
  };

  return (
    <Autocomplete
      multiple={multiple as any}
      value={value}
      onChange={(_, newValue) => onChange(newValue as Employee | null)}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      getOptionLabel={(option) => `${option.employeeCode} — ${option.name}`}
      options={options}
      loading={loading}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
              {option.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {option.employeeCode} · {deptNames[option.departmentId] ?? option.departmentId} ·{' '}
                {desigNames[option.designationId] ?? option.designationId}
                {option.isOnProbation && ' · 🔵 On Probation'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: categoryColors[option.employeeCategory] ?? 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                }}
              >
                {option.employeeCategory?.replace('_', ' ')}
              </Typography>
            </Box>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}
    />
  );
};

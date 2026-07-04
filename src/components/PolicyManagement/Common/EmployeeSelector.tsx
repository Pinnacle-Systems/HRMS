import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import type { Employee } from '../../../types/policy';
import { employeeService } from '../../../services/modules/employees';
import type { EmployeeSelectorProps } from '../types';

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  value,
  onChange,
  multiple,
  filter,
  label = 'Select Employee',
  noLabel,
  placeholder = 'Search employees…',
  pageSize = 20,
  isManager,
  isHR,
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isFetchingRef = useRef(false);
  const searchTermRef = useRef('');

  // Fetch employees function
  const fetchEmployees = useCallback(async (currentPage: number, append = false) => {
    if (isFetchingRef.current) {
      return;
    }
    if (!open) return;
    if (append) {
    } else {
      setLoading(true);
    }
    isFetchingRef.current = true;
    try {
      const response = await employeeService.getEmployees({
        includeInactive: false,
        page: currentPage,
        size: pageSize,
        search: searchTermRef.current || undefined,
      });
      let list: any = response.data.content || [];
       if (isManager) {
        list = list.filter((emp: Employee) => 
          emp.designation?.toLowerCase().includes('manager')  &&
          !emp.designation?.toLowerCase().includes('hr')
        );
      }

      if (isHR) {
        list = list.filter((emp: Employee) => 
          emp.designation?.toLowerCase().includes('hr')
        );
      }
      
      if (filter) {
        list = list.filter(filter);
      }
      if (append) {
        setOptions(prev => {
          const newOptions = [...prev, ...list];
          const uniqueOptions = newOptions.filter((option, index, self) =>
            index === self.findIndex((o) => o.id === option.id)
          );
          return uniqueOptions;
        });
      } else {
        setOptions(list);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [open, filter, pageSize, options.length]);

  // Load initial data when dropdown opens
  useEffect(() => {
    if (!open) {
      setOptions([]);
      setSearchTerm('');
      searchTermRef.current = '';
      return;
    }

    if (options.length === 0 && !isFetchingRef.current) {
      fetchEmployees(0, false);
    }
  }, [open, fetchEmployees, options.length]);

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    searchTermRef.current = value;
    setOptions([]);
    fetchEmployees(0, false);
  };

  const getValue = () => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return !Array.isArray(value) ? value : null;
  };

  // Custom Listbox with Load More button
  const CustomListbox = React.forwardRef<HTMLUListElement, any>((props, ref) => {
    const { children, ownerState: _ownerState, ...other } = props;

    return (
      <Paper elevation={8}>
        <ul ref={ref} {...other} style={{ margin: 0, padding: 0, maxHeight: 300, overflowY: 'auto' }}>
          {children}
        </ul>
      </Paper>
    );
  });

  return (
    <Autocomplete
      multiple={multiple}
      value={getValue()}
      onChange={(_, newValue) => onChange(newValue)}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      getOptionLabel={(option) => `${option.name}`}
      filterSelectedOptions
      filterOptions={(x) => x}
      loadingText="Loading employees..."
      noOptionsText={searchTerm ? "No employees found" : "No employees"}
      slots={{ listbox: CustomListbox }}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'input') {
          handleSearchChange(newInputValue);
        }
      }}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, cursor: 'pointer' }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }} className='!bg-primary'>
              {option.name?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant="body2">{option.name}</Typography>

              <Typography variant="caption" color="text.secondary" className='text-gray-500'>
                {/* {isManager ? '' : option.employeeId}
                {isManager ? '' : option.department ? ' ·' + option.department : ''}
                {option.designation ? ' ·' + option.designation : ''} */}
                {isManager ? (
                  option.designation || ''
                ) : (
                  <>
                    {option.employeeId}
                    {option.department ? ' ·' + option.department : ''}
                    {option.designation ? ' ·' + option.designation : ''}
                  </>
                )}
              </Typography>
            </Box>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={noLabel ? '' : label}
          placeholder={placeholder}
          // helperText={loading ? 'Loading employees...' : `${options.length} employee(s) loaded`}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
          sx={{
            "& .MuiAutocomplete-inputRoot .MuiAutocomplete-input": {
              padding: '10px !important'
            }
          }}
        />
      )}
    />
  );
};
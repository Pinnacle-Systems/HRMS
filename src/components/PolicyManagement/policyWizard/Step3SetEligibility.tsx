import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Business,
  Group,
  Badge,
  WorkOutlined,
  LocationCityOutlined,
  Person2Outlined,
  SaveOutlined,
  Category,
} from '@mui/icons-material';
import { PolicyScopeLevel, type Employee, type PolicyAssignment, type EmploymentType } from '../../../types/policy';
import { helperSx, type AssignmentRuleWithMeta } from '../const';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SCOPE_PRIORITY_HINTS, type AssignmentRule, type Step3SetEligibilityProps } from '../types';
import { branchService } from '../../../services/modules/branch';
import { departmentService } from '../../../services/modules/department';
import { categoryService } from '../../../services/modules/category';
import type { Branches, Department, Designation } from '../../../pages/employees/type';
import { EmployeeSelector } from '../Common/EmployeeSelector';
import { policyService } from '../../../services/modules/policy';
import { useUI } from '../../../context/Snackbar';
import { employeeService, normalizeEmployee } from '../../../services/modules/employees';
import { selectSx } from '../../../const';

const apiToRule = (a: any): AssignmentRuleWithMeta => {
  let type: AssignmentRule['type'] = 'DEPARTMENT';
  let value = '';
  if (a.branchId) { type = 'BRANCH'; value = a.branchId; }
  else if (a.departmentId) { type = 'DEPARTMENT'; value = a.departmentId; }
  else if (a.designationId) { type = 'DESIGNATION'; value = a.designationId; }
  else if (a.employmentType) { type = 'EMPLOYMENT_TYPE'; value = a.employmentType; }
  else if (a.template) { type = 'EMPLOYEE_TEMPLATE'; value = a.template; }
  // else if (a.employeeGroupId) { type = 'SPECIFIC_EMPLOYEES'; value = a.employeeGroupId; }
  else if (a.employeeId) { type = 'SPECIFIC_EMPLOYEES'; value = a.employeeId; }
  else if (a.employeeCategory) { type = 'EMPLOYEE_CATEGORY'; value = a.employeeCategory; }

  return {
    id: a.id,
    type,
    values: value ? [value] : [],
    priority: a.priority ?? 50,
    effectiveFrom: a.effectiveFrom ? a.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0],
    effectiveTo: a.effectiveTo ? a.effectiveTo.split('T')[0] : undefined,
    _apiIds: value ? [a.id] : [],
    _saved: true,
  };
};

export const buildSinglePayload = (
  rule: AssignmentRuleWithMeta,
  value: string,
  versionId: string,
  companyId: string,
): Partial<PolicyAssignment> => {
  const base: Partial<PolicyAssignment> = {
    policyVersionId: versionId,
    companyId,
    priority: rule.priority,
    effectiveFrom: rule.effectiveFrom,
    effectiveTo: rule.effectiveTo,
  };
  switch (rule.type) {
    case 'BRANCH': return { ...base, branchId: value };
    case 'DEPARTMENT': return { ...base, departmentId: value };
    case 'DESIGNATION': return { ...base, designationId: value };
    case 'EMPLOYMENT_TYPE': return { ...base, employmentType: value as EmploymentType };
    case 'EMPLOYEE_TEMPLATE': return { ...base, template: value };
    case 'EMPLOYEE_CATEGORY': return { ...base, employeeCategory: value };
    case 'SPECIFIC_EMPLOYEES': return { ...base, employeeId: value };
    default: return base;
  }
};

const extractArray = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.content && Array.isArray(res.data.content)) return res.data.content;
  if (res.items && Array.isArray(res.items)) return res.items;
  return [];
};

// ── Component ─────────────────────────────────────────────────────────────────

export const Step3SetEligibility: React.FC<Step3SetEligibilityProps> = ({
  companyId,
  config,
  onChange,
  editPolicy,
}) => {
  const { showSnackbar } = useUI();

  const [branches, setBranches] = useState<Branches[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRuleWithMeta[]>(
    config?.assignments || [],
  );
  const versionId = editPolicy?.currentVersion?.id as string | undefined;
  const isEditMode = !!editPolicy;
  const category = [{ id: 'Staff', name: 'Staff' },{ id: 'Labour', name: 'Labour' }];

  // ── Data loading ─────────────────────────────────────────────────────────

  const fetchLookups = async () => {
    try {
      const [branchRes, deptRes, desigRes, empTypeRes, tmplRes] = await Promise.all([
        branchService.getDropdownBranches(),
        departmentService.getActiveDepartments(),
        categoryService.getCategoryItems('00c4fd3c-4fb6-4d33-932e-80a615a90825'),
        categoryService.getCategoryItems('5504ad78-7089-42ec-8219-2a579d99bb0a'),
        categoryService.getCategoryItems('515d5fe8-2f41-41fe-aab3-6da80a5cfae1'),
      ]);
      setBranches(extractArray(branchRes));
      setDepartments(extractArray(deptRes));
      setDesignations(extractArray(desigRes));
      setEmploymentTypes(extractArray(empTypeRes));
      setTemplates(extractArray(tmplRes));
    } catch (err) {
      console.error('Failed to fetch lookups', err);
    }
  };

  const loadAssignments = async () => {
    if (!versionId) return;
    try {
      const res: any = await policyService.getAssignmentsByVersion(versionId);
      const list: any[] = extractArray(res);
      // Group assignments with same type + effectiveFrom + effectiveTo + priority into one rule row
      const groupMap = new Map<string, AssignmentRuleWithMeta>();
      const staleDuplicateApiIds: string[] = [];
      for (const a of list) {
        const single = apiToRule(a);
        const key = `${single.type}__${single.effectiveFrom}__${single.effectiveTo ?? ''}__${single.priority}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, { ...single, _apiIds: [...(single._apiIds ?? [])] });
        } else {
          const existing = groupMap.get(key)!;
          // Some value (branch/department/etc.) may already be present in this
          // group (data left over from earlier double-saves) — keep the first
          // record and queue the rest for deletion instead of showing/saving
          // the same value twice.
          single.values.forEach((v, i) => {
            const apiId = single._apiIds?.[i];
            if (existing.values.includes(v)) {
              if (apiId) staleDuplicateApiIds.push(apiId);
            } else {
              existing.values = [...existing.values, v];
              existing._apiIds = [...(existing._apiIds ?? []), apiId ?? ''];
            }
          });
        }
      }
      const rules = Array.from(groupMap.values());
      setAssignmentRules(rules);
      hydrateSelectedEmployees(rules);
      if (staleDuplicateApiIds.length) {
        Promise.all(staleDuplicateApiIds.map(id => policyService.deleteAssignment(id)))
          .then(() => console.warn(`Cleaned up ${staleDuplicateApiIds.length} duplicate assignment(s).`))
          .catch(err => console.error('Failed to clean up duplicate assignments', err));
      }
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  // For SPECIFIC_EMPLOYEES rules loaded from the API we only have employee ids
  // (rule.values) — resolve them to full Employee records so EmployeeSelector
  // can render the existing selections as chips.
  const hydrateSelectedEmployees = async (rules: AssignmentRuleWithMeta[]) => {
    const specificRules = rules.filter(
      r => r.type === 'SPECIFIC_EMPLOYEES' && r.values.length && !r._selectedEmployees?.length,
    );
    await Promise.all(specificRules.map(async (rule) => {
      try {
        const employees = await Promise.all(
          rule.values.map(async (id) => {
            const res: any = await employeeService.getEmployeeById(id);
            return normalizeEmployee(res?.data ?? res) as unknown as Employee;
          }),
        );
        setAssignmentRules(prev =>
          prev.map(r => r.id === rule.id ? { ...r, _selectedEmployees: employees } : r),
        );
      } catch (err) {
        console.error('Failed to load employee details for rule', rule.id, err);
      }
    }));
  };

  useEffect(() => {
    fetchLookups();
    loadAssignments();
  }, []);

  // Sync local changes up to parent wizard
  useEffect(() => {
    onChange({ assignments: assignmentRules });
  }, [assignmentRules]);

  // A duplicate priority among assignment rules makes precedence ambiguous —
  // the "higher number wins" rule below assumes priorities are unique.
  const hasDuplicatePriority = (rule: AssignmentRuleWithMeta) =>
    assignmentRules.some(r => r.id !== rule.id && r.priority === rule.priority);

  // ── API helpers ───────────────────────────────────────────────────────────

  const saveRule = async (rule: AssignmentRuleWithMeta) => {
    if (!versionId) {
      showSnackbar('No policy version found. Save the policy first.', 'error');
      return;
    }
    if (!rule.values.length) {
      showSnackbar('Please select at least one value before saving.', 'error');
      return;
    }
    if (hasDuplicatePriority(rule)) {
      showSnackbar('Another rule already uses this priority. Each rule must have a unique priority.', 'error');
      return;
    }

    setAssignmentRules(prev =>
      prev.map(r => r.id === rule.id ? { ...r, _saving: true } : r),
    );

    try {
      // Keep indices aligned with rule.values — do NOT filter out empty
      // entries here, that shifts indices and pairs the wrong apiId with the
      // wrong value (causing spurious creates/updates).
      const existingApiIds = rule._apiIds ?? [];
      const newApiIds: string[] = [];
      const newValues: string[] = [];
      const skippedDuplicates: string[] = [];

      // Build a signature for a value's payload so we can detect the same
      // branch/department/designation/employmentType/template/employee already
      // assigned to this version under a *different* rule row or index.
      const signatureOf = (value: string) => {
        const p = buildSinglePayload(rule, value, versionId, companyId);
        return [p.branchId, p.departmentId, p.designationId, p.employmentType, p.template, p.employeeId]
          .map(v => v ?? '')
          .join('|');
      };

      // Signatures already saved on the server, excluding this rule itself,
      // so we don't create a second row for a value that's already assigned.
      const existingSignatures = new Set<string>();
      assignmentRules.forEach(r => {
        if (r.id === rule.id) return;
        r.values.forEach((v, idx) => {
          if (r._apiIds?.[idx]) {
            const p = buildSinglePayload(r, v, versionId, companyId);
            existingSignatures.add(
              [p.branchId, p.departmentId, p.designationId, p.employmentType, p.template, p.employeeId]
                .map(x => x ?? '')
                .join('|'),
            );
          }
        });
      });

      // Update existing API records, create new ones for added values —
      // skipping any value that's already assigned elsewhere for this version.
      for (let i = 0; i < rule.values.length; i++) {
        const value = rule.values[i];
        const payload = buildSinglePayload(rule, value, versionId, companyId);
        if (existingApiIds[i]) {
          await policyService.updateAssignment(existingApiIds[i], payload);
          newApiIds.push(existingApiIds[i]);
          newValues.push(value);
        } else if (existingSignatures.has(signatureOf(value))) {
          skippedDuplicates.push(value);
        } else {
          const res: any = await policyService.createAssignment(payload);
          newApiIds.push(res?.data?.id ?? res?.id);
          newValues.push(value);
        }
      }

      // Delete API records for values that were removed
      for (let i = rule.values.length; i < existingApiIds.length; i++) {
        if (existingApiIds[i]) await policyService.deleteAssignment(existingApiIds[i]);
      }

      setAssignmentRules(prev =>
        prev.map(r =>
          r.id === rule.id
            ? { ...r, values: newValues, _apiIds: newApiIds, _saved: true, _saving: false }
            : r,
        ),
      );
      if (skippedDuplicates.length) {
        showSnackbar('Some values were already assigned to this policy version and were skipped.', 'error');
      } else {
        showSnackbar('Assignment saved.', 'success');
      }
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to save assignment.', 'error');
      setAssignmentRules(prev =>
        prev.map(r => r.id === rule.id ? { ...r, _saving: false } : r),
      );
    }
  };

  const removeRule = async (rule: AssignmentRuleWithMeta) => {
    if (isEditMode) {
      const apiIds = rule._apiIds?.filter(Boolean) ?? [];
      if (apiIds.length) {
        try {
          await Promise.all(apiIds.map(id => policyService.deleteAssignment(id)));
          showSnackbar('Assignment removed.', 'success');
        } catch (err: any) {
          showSnackbar(err?.message || 'Failed to delete assignment.', 'error');
          return;
        }
      }
    }
    setAssignmentRules(prev => prev.filter(r => r.id !== rule.id));
  };

  // ── Local state helpers ───────────────────────────────────────────────────

  const addRule = () => {
    const newRule: AssignmentRuleWithMeta = {
      id: `tmp_${Date.now()}`,
      type: 'DEPARTMENT',
      values: [],
      priority: PolicyScopeLevel.DEPARTMENT,
      effectiveFrom: new Date().toISOString().split('T')[0],
      _apiIds: [],
      _saved: false,
    };
    setAssignmentRules(prev => [...prev, newRule]);
  };

  const updateRule = (id: string, updates: Partial<AssignmentRuleWithMeta>) => {
    setAssignmentRules(prev =>
      prev.map(r => r.id === id ? { ...r, ...updates, _saved: false } : r),
    );
  };

  // ── Rendering helpers ─────────────────────────────────────────────────────

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'BRANCH': return <LocationCityOutlined />;
      case 'DEPARTMENT': return <Business />;
      case 'DESIGNATION': return <Badge />;
      case 'EMPLOYMENT_TYPE': return <Group />;
      case 'EMPLOYEE_TEMPLATE': return <WorkOutlined />;
      case 'EMPLOYEE_CATEGRORY': return <Category />;
      case 'SPECIFIC_EMPLOYEES': return <Person2Outlined />;
      default: return <Group />;
    }
  };

  const getOptionsForType = (type: string) => {
    switch (type) {
      case 'BRANCH': return branches;
      case 'DEPARTMENT': return departments;
      case 'DESIGNATION': return designations;
      case 'EMPLOYMENT_TYPE': return employmentTypes;
      case 'EMPLOYEE_TEMPLATE': return templates;
      case 'EMPLOYEE_CATEGORY': return category;
      default: return [];
    }
  };

  const getOptionLabel = (option: any) =>
    option.name ?? option.departmentName ?? option.branchName ?? '';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Define Eligibility</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Specify which employees this policy applies to. Higher priority number wins when multiple rules match.
      </Typography>

      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light', borderRadius: 1 }}>
        <Typography variant="caption" color="info.dark">
          <strong>Priority guide:</strong> Company (30) → Branch (40) → Department (50) → Designation (60) → Employee Group (70) → Specific Employee (80)
        </Typography>
      </Box>

      <div className='flex justify-end mb-3'>
        <Button variant="contained" className='!bg-primary' startIcon={<AddIcon />} onClick={addRule}>
          Add Assignment Rule
        </Button>
      </div>

      {assignmentRules.map((rule, index) => (
        <div key={rule.id} className='p-3 mb-2 bg-white-50 border border-gray-200 rounded-md'>
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-1'>
              <div className='!text-blue-400 mr-2'>{getRuleIcon(rule.type)}</div>
              <div className='text-[12px] text-gray-800'>Assignment Rule {index + 1}</div>
              <Chip
                label={`Priority: ${rule.priority}`}
                size="small"
                className='!border-primary !ml-2 !text-primary'
                variant="outlined"
              />
              {hasDuplicatePriority(rule) && (
                <Chip label="Duplicate priority" size="small" color="error" variant="outlined" sx={{ ml: 1 }} />
              )}
              {isEditMode && !rule._saved && (
                <Chip label="Unsaved" size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />
              )}
              {!isEditMode && (
                <Chip label="Draft" size="small" color="info" variant="outlined" sx={{ ml: 1 }} />
              )}
            </div>
            <div className='flex items-center gap-1'>
              {isEditMode && (
                <Tooltip title={rule._saved ? 'Saved' : 'Save rule'}>
                  <span>
                    <IconButton
                      onClick={() => saveRule(rule)}
                      size="small"
                      disabled={rule._saving || rule._saved}
                      color="primary"
                    >
                      {rule._saving
                        ? <CircularProgress size={18} />
                        : <SaveOutlined fontSize="small" />
                      }
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip title="Remove rule">
                <IconButton onClick={() => removeRule(rule)} size="small">
                  <DeleteIcon className='text-red-500' />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={rule.type}
                  label="Rule Type"
                  sx={selectSx}
                  onChange={(e) => {
                    const newType = e.target.value as AssignmentRule['type'];
                    updateRule(rule.id, {
                      type: newType,
                      values: [],
                      _apiIds: [],
                      priority: SCOPE_PRIORITY_HINTS[newType] ?? 50,
                    });
                  }}
                >
                  <MenuItem value="BRANCH">Branch</MenuItem>
                  <MenuItem value="DEPARTMENT">Department</MenuItem>
                  <MenuItem value="DESIGNATION">Designation</MenuItem>
                  <MenuItem value="EMPLOYMENT_TYPE">Employment Type</MenuItem>
                  <MenuItem value="EMPLOYEE_CATEGORY">Employee Category</MenuItem>
                  <MenuItem value="EMPLOYEE_TEMPLATE">Employee Template</MenuItem>
                  <MenuItem value="SPECIFIC_EMPLOYEES">Specific Employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              {rule.type !== 'SPECIFIC_EMPLOYEES' ? (
                <Autocomplete
                  multiple
                  options={getOptionsForType(rule.type)}
                  getOptionLabel={getOptionLabel}
                  value={getOptionsForType(rule.type).filter((v: any) => rule.values.includes(v.id))}
                  onChange={(_, newValue) => {
                    const newIds = newValue.map((v: any) => v.id);
                    // Preserve the apiId for any value that's still selected so the
                    // next save updates that record instead of recreating it.
                    const newApiIds = newIds.map((id: string) => {
                      const idx = rule.values.indexOf(id);
                      return idx !== -1 ? (rule._apiIds?.[idx] ?? '') : '';
                    });
                    // A value removed via the chip's close icon is already saved on the
                    // server — delete that assignment right away instead of leaving it orphaned.
                    rule.values.forEach((id, idx) => {
                      const removedApiId = rule._apiIds?.[idx];
                      if (!newIds.includes(id) && removedApiId) {
                        policyService.deleteAssignment(removedApiId).catch(err =>
                          console.error('Failed to delete assignment', removedApiId, err),
                        );
                      }
                    });
                    updateRule(rule.id, { values: newIds, _apiIds: newApiIds });
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Values" placeholder="Choose…" />
                  )}
                />
              ) : (
                <Box>
                  <EmployeeSelector
                    value={rule._selectedEmployees ?? []}
                    onChange={(value) => {
                      const employees = (Array.isArray(value) ? value : [value]).filter(Boolean) as Employee[];
                      const newIds = employees.map(e => e.id);
                      // Preserve the apiId for any employee that's still selected so the
                      // next save updates that record instead of recreating it.
                      const newApiIds = newIds.map((id) => {
                        const idx = rule.values.indexOf(id);
                        return idx !== -1 ? (rule._apiIds?.[idx] ?? '') : '';
                      });
                      // An employee removed via the chip's close icon is already saved on the
                      // server — delete that assignment right away instead of leaving it orphaned.
                      rule.values.forEach((id, idx) => {
                        const removedApiId = rule._apiIds?.[idx];
                        if (!newIds.includes(id) && removedApiId) {
                          policyService.deleteAssignment(removedApiId).catch(err =>
                            console.error('Failed to delete assignment', removedApiId, err),
                          );
                        }
                      });
                      updateRule(rule.id, {
                        values: newIds,
                        _selectedEmployees: employees,
                        _apiIds: newApiIds,
                      });
                    }}
                    multiple={true}
                    label="Select Employees"
                    placeholder="Search employees..."
                  />
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Priority"
                value={rule.priority}
                onChange={(e) => updateRule(rule.id, { priority: parseInt(e.target.value) })}
                helperText="Higher = more specific"
                sx={helperSx}
              />
            </Grid>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="Effective From"
                  value={rule.effectiveFrom ? dayjs(rule.effectiveFrom) : null}
                  onChange={(v) =>
                    updateRule(rule.id, { effectiveFrom: v ? dayjs(v).format('YYYY-MM-DD') : '' })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <DatePicker
                  label="Effective To (optional)"
                  value={rule.effectiveTo ? dayjs(rule.effectiveTo) : null}
                  onChange={(v) =>
                    updateRule(rule.id, { effectiveTo: v ? dayjs(v).format('YYYY-MM-DD') : '' })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </LocalizationProvider>
          </Grid>
        </div>
      ))}

      {assignmentRules.length === 0 && (
        <Alert
          severity="warning"
          action={<Button color="warning" size="small" onClick={addRule}>Add Rule</Button>}
        >
          No eligibility rules configured. Without rules this policy applies to the entire company (lowest priority).
        </Alert>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
        <div className='text-[12px] text-green-700 font-bold'>Policy Precedence</div>
        <div className='text-[12px] text-[darkgreen] mt-2'>
          When multiple policies match an employee, the system uses priority (higher number wins).
          Employee-specific overrides (80) always beat department rules (50) which beat company-wide rules (30).
        </div>
      </Box>
    </Box>
  );
};

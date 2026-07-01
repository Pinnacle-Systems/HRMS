import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  LeavePolicy,
  LeavePolicyRule,
  LeavePolicyRuleType,
  LeaveType,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import {
  leaveTableActionCellSx,
  leaveTableActionHeaderCellClassName,
  leaveTableBodyCellSx,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableRowSx,
  leaveTableSx,
} from "../components/leaveTableStyles";

const ruleTypes: LeavePolicyRuleType[] = [
  "ACCRUAL",
  "CARRY_FORWARD",
  "ENCASHMENT",
  "MIN_SERVICE",
  "MAX_CONSECUTIVE_DAYS",
  "NOTICE_PERIOD",
];

const emptyPolicyForm: Partial<LeavePolicy> = {
  name: "",
  leaveTypeId: "",
  appliesTo: "",
  accrualFrequency: "MONTHLY",
  annualEntitlement: 0,
  carryForwardLimit: 0,
  encashable: false,
  active: true,
};

const emptyRuleForm: Partial<LeavePolicyRule> = {
  ruleType: "ACCRUAL",
  value: undefined,
  unit: "",
  condition: "",
  description: "",
  active: true,
};

export default function AdminLeavePoliciesPage() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState<Partial<LeavePolicy>>(emptyPolicyForm);
  const [policyErrors, setPolicyErrors] = useState<Record<string, string>>({});

  const [rulesDialogPolicy, setRulesDialogPolicy] = useState<LeavePolicy | null>(null);
  const [rules, setRules] = useState<LeavePolicyRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleForm, setRuleForm] = useState<Partial<LeavePolicyRule>>(emptyRuleForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    showSpinner();
    try {
      const [policyResponse, typeResponse]: any = await Promise.all([
        leaveService.getLeavePolicies({ page: 0, size: 50 }),
        leaveService.getLeaveTypes({ page: 0, size: 50, sort: "name,ASC" }),
      ]);
      setPolicies(policyResponse.data ?? []);
      setLeaveTypes(typeResponse.data ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load leave policies", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreatePolicy = () => {
    setEditingPolicyId(null);
    setPolicyForm(emptyPolicyForm);
    setPolicyErrors({});
    setPolicyDialogOpen(true);
  };

  const openEditPolicy = (policy: LeavePolicy) => {
    setEditingPolicyId(policy.id);
    setPolicyForm(policy);
    setPolicyErrors({});
    setPolicyDialogOpen(true);
  };

  const submitPolicy = async () => {
    const nextErrors: Record<string, string> = {};
    if (!policyForm.name?.trim()) nextErrors.name = "Name is required";
    if (!policyForm.leaveTypeId) nextErrors.leaveTypeId = "Leave type is required";
    setPolicyErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    showSpinner();
    try {
      const response:any = editingPolicyId
        ? await leaveService.updateLeavePolicy(editingPolicyId, policyForm)
        : await leaveService.createLeavePolicy(policyForm);
      if (response.success) {
        showSnackbar(editingPolicyId ? "Leave policy updated" : "Leave policy created", "success");
        setPolicyDialogOpen(false);
        await load();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save leave policy", "error");
    } finally {
      hideSpinner();
    }
  };

  const confirmDeletePolicy = (policy: LeavePolicy) => {
    showConfirmDialog({
      title: "Delete Leave Policy",
      message: `Delete "${policy.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response: any = await leaveService.deleteLeavePolicy(policy.id);
          if (response.success) {
            showSnackbar("Leave policy deleted", "success");
            await load();
          }
        } catch (err: any) {
          showSnackbar(err?.message || "Failed to delete leave policy", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const openRulesDialog = async (policy: LeavePolicy) => {
    setRulesDialogPolicy(policy);
    setEditingRuleId(null);
    setRuleForm(emptyRuleForm);
    setRulesLoading(true);
    try {
      const response:any = await leaveService.getLeavePolicyRules({ leavePolicyId: policy.id, page: 0, size: 50 });
      setRules(response.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load policy rules", "error");
    } finally {
      setRulesLoading(false);
    }
  };

  const submitRule = async () => {
    if (!rulesDialogPolicy) return;
    showSpinner();
    try {
      const payload = { ...ruleForm, leavePolicyId: rulesDialogPolicy.id };
      const response: any = editingRuleId
        ? await leaveService.updateLeavePolicyRule(editingRuleId, payload)
        : await leaveService.createLeavePolicyRule(payload);
      if (response.success) {
        showSnackbar(editingRuleId ? "Rule updated" : "Rule created", "success");
        setRuleForm(emptyRuleForm);
        setEditingRuleId(null);
        const refreshed:any = await leaveService.getLeavePolicyRules({
          leavePolicyId: rulesDialogPolicy.id,
          page: 0,
          size: 50,
        });
        setRules(refreshed.data?.content ?? []);
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save rule", "error");
    } finally {
      hideSpinner();
    }
  };

  const deleteRule = async (rule: LeavePolicyRule) => {
    if (!rulesDialogPolicy) return;
    showSpinner();
    try {
      const response:any = await leaveService.deleteLeavePolicyRule(rule.id);
      if (response.success) {
        showSnackbar("Rule deleted", "success");
        const refreshed:any = await leaveService.getLeavePolicyRules({
          leavePolicyId: rulesDialogPolicy.id,
          page: 0,
          size: 50,
        });
        setRules(refreshed.data?.content ?? []);
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to delete rule", "error");
    } finally {
      hideSpinner();
    }
  };

  return (
    <LeavePageShell
      group="admin"
      title="Leave Policies"
      subtitle="Configure leave policies and their accrual/carry-forward rules"
      actions={
        <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} className="!bg-primary" onClick={openCreatePolicy}>
          Add Policy
        </Button>
      }
    >
      <TableContainer className="overflow-auto" sx={leaveTableContainerSx}>
        <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
          <TableHead>
            <TableRow sx={leaveTableHeaderRowSx}>
              <TableCell className={leaveTableHeaderCellClassName}>S No</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Name</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Accrual</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Annual Entitlement</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Active</TableCell>
              <TableCell className={leaveTableActionHeaderCellClassName}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              policies.map((policy,i) => (
                <TableRow key={policy.id} hover sx={leaveTableRowSx}>
                  <TableCell sx={leaveTableBodyCellSx}>{i + 1}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{policy.name}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>
                    {leaveTypes.find((leaveType) => leaveType.id === policy.leaveTypeId)?.name ?? policy.leaveTypeId}
                  </TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{policy.accrualFrequency}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{policy.annualEntitlement}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{policy.active ? "Yes" : "No"}</TableCell>
                  <TableCell sx={leaveTableActionCellSx}>
                    <Tooltip title="Manage Rules">
                      <IconButton size="small" onClick={() => openRulesDialog(policy)}>
                        <RuleOutlinedIcon className="!w-4 !h-4 text-primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditPolicy(policy)}>
                        <EditOutlinedIcon className="!w-4 !h-4 text-primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => confirmDeletePolicy(policy)}>
                        <DeleteOutlineOutlinedIcon className="!w-4 !h-4 text-red-600" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <DataState compact type="loading" title="Loading leave policies..." />
                </TableCell>
              </TableRow>
            )}
            {!loading && policies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <DataState compact type="empty" title="No leave policies found." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={policyDialogOpen} onClose={() => setPolicyDialogOpen(false)} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4">{editingPolicyId ? "Edit Leave Policy" : "Add Leave Policy"}</div>
          <IconButton onClick={() => setPolicyDialogOpen(false)}>
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <div className="grid gap-4">
            <TextField
              label="Name"
              value={policyForm.name ?? ""}
              error={Boolean(policyErrors.name)}
              helperText={policyErrors.name}
              onChange={(event) => setPolicyForm((current) => ({ ...current, name: event.target.value }))}
            />
            <TextField
              select
              label="Leave Type"
              value={policyForm.leaveTypeId ?? ""}
              error={Boolean(policyErrors.leaveTypeId)}
              helperText={policyErrors.leaveTypeId}
              onChange={(event) => setPolicyForm((current) => ({ ...current, leaveTypeId: event.target.value }))}
            >
              {leaveTypes.map((leaveType) => (
                <MenuItem key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Applies To"
              value={policyForm.appliesTo ?? ""}
              onChange={(event) => setPolicyForm((current) => ({ ...current, appliesTo: event.target.value }))}
            />
            <TextField
              select
              label="Accrual Frequency"
              value={policyForm.accrualFrequency ?? "MONTHLY"}
              onChange={(event) =>
                setPolicyForm((current) => ({
                  ...current,
                  accrualFrequency: event.target.value as LeavePolicy["accrualFrequency"],
                }))
              }
            >
              <MenuItem value="MONTHLY">Monthly</MenuItem>
              <MenuItem value="QUARTERLY">Quarterly</MenuItem>
              <MenuItem value="YEARLY">Yearly</MenuItem>
            </TextField>
            <TextField
              label="Annual Entitlement"
              type="number"
              value={policyForm.annualEntitlement ?? 0}
              onChange={(event) =>
                setPolicyForm((current) => ({ ...current, annualEntitlement: Number(event.target.value) }))
              }
            />
            <TextField
              label="Carry Forward Limit"
              type="number"
              value={policyForm.carryForwardLimit ?? 0}
              onChange={(event) =>
                setPolicyForm((current) => ({ ...current, carryForwardLimit: Number(event.target.value) }))
              }
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Encashable</span>
              <Switch
                checked={policyForm.encashable ?? false}
                onChange={(event) => setPolicyForm((current) => ({ ...current, encashable: event.target.checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Active</span>
              <Switch
                checked={policyForm.active ?? true}
                onChange={(event) => setPolicyForm((current) => ({ ...current, active: event.target.checked }))}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button variant="outlined" className="!text-gray-800 !border-gray-300" onClick={() => setPolicyDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" className="!bg-primary" onClick={submitPolicy}>
            {editingPolicyId ? "Save Changes" : "Create Policy"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rulesDialogPolicy)} onClose={() => setRulesDialogPolicy(null)} maxWidth="md" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4">Rules - {rulesDialogPolicy?.name}</div>
          <IconButton onClick={() => setRulesDialogPolicy(null)}>
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <TableContainer component={Paper} elevation={0} className="overflow-auto mb-4" sx={leaveTableContainerSx}>
            <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
              <TableHead>
                <TableRow sx={leaveTableHeaderRowSx}>
                  <TableCell className={leaveTableHeaderCellClassName}>Type</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Value</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Condition</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Description</TableCell>
                  <TableCell className={leaveTableActionHeaderCellClassName}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!rulesLoading &&
                  rules.map((rule) => (
                    <TableRow key={rule.id} hover sx={leaveTableRowSx}>
                      <TableCell sx={leaveTableBodyCellSx}>{rule.ruleType}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>
                        {rule.value ?? "-"} {rule.unit ?? ""}
                      </TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{rule.condition ?? "-"}</TableCell>
                      <TableCell sx={leaveTableBodyCellSx}>{rule.description ?? "-"}</TableCell>
                      <TableCell sx={leaveTableActionCellSx}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingRuleId(rule.id);
                            setRuleForm(rule);
                          }}
                        >
                          <EditOutlinedIcon className="!w-4 !h-4 text-primary" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteRule(rule)}>
                          <DeleteOutlineOutlinedIcon className="!w-4 !h-4 text-red-600" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {!rulesLoading && rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <DataState compact type="empty" title="No rules configured for this policy." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
            <TextField
              select
              label="Rule Type"
              value={ruleForm.ruleType ?? "ACCRUAL"}
              onChange={(event) =>
                setRuleForm((current) => ({ ...current, ruleType: event.target.value as LeavePolicyRuleType }))
              }
            >
              {ruleTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Value"
              type="number"
              value={ruleForm.value ?? ""}
              onChange={(event) =>
                setRuleForm((current) => ({
                  ...current,
                  value: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
            />
            <TextField
              label="Condition"
              value={ruleForm.condition ?? ""}
              onChange={(event) => setRuleForm((current) => ({ ...current, condition: event.target.value }))}
            />
            <TextField
              label="Description"
              value={ruleForm.description ?? ""}
              onChange={(event) => setRuleForm((current) => ({ ...current, description: event.target.value }))}
            />
            <Button variant="contained" className="!bg-primary h-fit" onClick={submitRule}>
              {editingRuleId ? "Save Rule" : "Add Rule"}
            </Button>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button variant="outlined" className="!text-gray-800 !border-gray-300" onClick={() => setRulesDialogPolicy(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}

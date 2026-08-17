import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
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
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type { LeaveType } from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import {
  leaveTableActionHeaderCellClassName,
  leaveTableHeaderCellClassName,
} from "../components/leaveTableStyles";
import { getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from "../../const";
import { CheckCircleOutlineOutlined, Delete, Edit, RemoveCircleOutlineOutlined } from "@mui/icons-material";

const emptyForm: Partial<LeaveType> = {
  code: "",
  name: "",
  description: "",
  paid: true,
  active: true,
  allowHalfDay: false,
  allowNegativeBalance: false,
  encashable: false,
  payrollTreatment: "PAID",
  requiresAttachment: false,
  requiresHrVerification: false,
  // maxDaysPerRequest: undefined,
  // requiresDocumentAfterDays: undefined,
};

export default function AdminLeaveTypesPage() {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LeaveType>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await leaveService.getLeaveTypes({
        includeDisabled: true,
        page: 0,
        size: 50,
        sort: "name,ASC",
      });
      setLeaveTypes(response.data ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load leave types", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (leaveType: LeaveType) => {
    setEditingId(leaveType.id ?? null);
    setForm(leaveType);
    setErrors({});
    setOpen(true);
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.code?.trim()) nextErrors.code = "Code is required";
    if (!form.name?.trim()) nextErrors.name = "Name is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    showSpinner();
    const payload = {
      "name": form.name,
      "code": form.code,
      "description": form.description,
      "allowHalfDay": form.allowHalfDay,
      "allowNegativeBalance": form.allowNegativeBalance,
      "requiresAttachment": form.requiresAttachment,
      "requiresHrVerification": form.requiresHrVerification,
      "payrollTreatment": form.payrollTreatment,
      "active": form.active,
      "paid": form.paid,
      "encashable": form.encashable
    }
    try {
      const response: any = editingId
        ? await leaveService.updateLeaveType(editingId, payload)
        : await leaveService.createLeaveType(form);
      if (response.success) {
        showSnackbar(
          editingId ? "Leave type updated" : "Leave type created",
          "success",
        );
        setOpen(false);
        await load();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save leave type", "error");
    } finally {
      hideSpinner();
    }
  };

  const confirmDelete = (leaveType: LeaveType) => {
    showConfirmDialog({
      title: "Delete Leave Type",
      message: `Delete "${leaveType.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const response: any = await leaveService.deleteLeaveType(leaveType.id);
          if (response.success) {
            showSnackbar("Leave type deleted", "success");
            await load();
          }
        } catch (err: any) {
          showSnackbar(err?.message || "Failed to delete leave type", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  return (
    <LeavePageShell
      group="admin"
      title="Leave Types"
      subtitle="Define the leave types available across leave policies"
      actions={
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          className="!bg-primary"
          onClick={openCreate}
          size="small"
        >
          Add Leave Type
        </Button>
      }
    >
      <TableContainer className="border border-gray-200 rounded-sm h-[calc(100vh-250px)]">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell className={leaveTableHeaderCellClassName} sx={{
                ...stickyHeaderLeftSx,
                minWidth: "70px",
              }}>
                S No
              </TableCell>
              <TableCell className="nth-c !font-bold">
                Code
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Name
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Pay Type
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Paid
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Allow Half a day
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Allow Negative Balance
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Encashable
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Requires Attachment
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Requires Hr Verification
              </TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>
                Active
              </TableCell>
              <TableCell className={leaveTableActionHeaderCellClassName} sx={{
                ...stickyHeaderRightSx,
                minWidth: "100px",
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              leaveTypes.map((leaveType, i) => (
                <TableRow key={leaveType.id} sx={getRowColor(i)}>
                  <TableCell sx={{
                    ...getStickyLeftSx(i),
                    minWidth: "70px",
                  }}>{i + 1}</TableCell>
                  <TableCell sx={{
                    ...getStickyLeftSx(i),
                    left: "70px",
                    minWidth: "100px",
                  }}>{leaveType.code}</TableCell>
                  <TableCell>{leaveType.name}</TableCell>
                  <TableCell>{leaveType.payrollTreatment}</TableCell>
                  <TableCell className="!text-center">{leaveType.paid ? <CheckCircleOutlineOutlined className="text-green-700" /> : <RemoveCircleOutlineOutlined className="text-red-500" />}</TableCell>
                  <TableCell className="!text-center">{leaveType.allowHalfDay ? <CheckCircleOutlineOutlined className="text-green-700" /> : <RemoveCircleOutlineOutlined className="text-red-500" />}</TableCell>
                  <TableCell className="!text-center">{leaveType.allowNegativeBalance ? <CheckCircleOutlineOutlined className="text-green-700" /> : <RemoveCircleOutlineOutlined className="text-red-500" />}</TableCell>
                  <TableCell className="!text-center">{leaveType.encashable ? <CheckCircleOutlineOutlined className="text-green-700" /> : <RemoveCircleOutlineOutlined className="text-red-500" />}</TableCell>
                  <TableCell className="!text-center">{leaveType.requiresAttachment ? <CheckCircleOutlineOutlined className="text-green-700" /> : <RemoveCircleOutlineOutlined className="text-red-500" />}</TableCell>
                  <TableCell className="!text-center">{leaveType.requiresHrVerification ? <CheckCircleOutlineOutlined className="text-green-700" /> : <RemoveCircleOutlineOutlined className="text-red-500" />}</TableCell>
                  <TableCell>
                    <Chip
                      label={leaveType.active ? "Active" : "Inactive"}
                      color={leaveType.active ? "success" : "error"}
                      size="small"
                      // onClick={() => handleToggleStatus(branch)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  <TableCell sx={{
                    ...getStickyRightSx(i),
                    minWidth: "50px",
                  }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(leaveType)}
                      >
                        <Edit className="!w-4 !h-4 text-blue-500" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => confirmDelete(leaveType)}
                      >
                        <Delete className="!w-4 !h-4 text-red-600" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {/* {loading && (
              <TableRow>
                <TableCell colSpan={12}>
                  <DataState
                    compact
                    type="loading"
                    title="Loading leave types..."
                  />
                </TableCell>
              </TableRow>
            )} */}
            {!loading && leaveTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={12}>
                  <DataState
                    compact
                    type="empty"
                    title="No leave types found."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4 text-[12px]">
            {editingId ? "Edit Leave Type" : "Add Leave Type"}
          </div>
          <IconButton onClick={() => setOpen(false)}>
            <CloseOutlinedIcon className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <div className="grid grid-cols-3 gap-5 mt-2">
            <TextField
              label="Name"
              value={form.name ?? ""}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <TextField
              label="Code"
              value={form.code ?? ""}
              error={Boolean(errors.code)}
              helperText={errors.code}
              required
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
            />
            <TextField
              label="Pay Type"
              type="text"
              value={form.payrollTreatment ?? ""}
              disabled
              // onChange={(event) =>
              //   setForm((current) => ({
              //     ...current,
              //     payrollTreatment: form.paid ? 'PAID' : 'UNPAID',
              //   }))
              // }
            />
            <TextField
              className="col-span-3"
              label="Description"
              multiline
              rows={2}
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            {/* <TextField
              label="Requires Document After Days"
              type="number"
              value={form.requiresDocumentAfterDays ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  requiresDocumentAfterDays: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
            /> */}

            <div className="">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.active ?? true}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Active"
              />
            </div>
            <div className="">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.paid ?? true}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paid: event.target.checked,
                        payrollTreatment: event.target.checked ? 'PAID' : 'UNPAID',
                      }))
                    }
                    color="primary"
                  />
                }
                label="Paid"
              />
            </div>
            <div className="">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.allowHalfDay || false}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        allowHalfDay: event.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Allow Half a Day"
              />
            </div>
            <div className="">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.allowNegativeBalance || false}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        allowNegativeBalance: event.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Allow Negative Balance"
              />
            </div>
            <div className="">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.encashable || false}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        encashable: event.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Encashable"
              />
            </div>

            <div className="">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.requiresAttachment || false}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requiresAttachment: event.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Requires Attachment"
              />
            </div>
            <div className="">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.requiresHrVerification || false}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requiresHrVerification: event.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label="Requires Hr Verification"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="contained" className="!bg-primary" onClick={submit}>
            {editingId ? "Save Changes" : "Create Leave Type"}
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}

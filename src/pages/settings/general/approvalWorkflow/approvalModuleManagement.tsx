import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CloseOutlined,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  approvalWorkflowService,
  type ApprovalModule,
} from "../../../../services/modules/approvalWorkflow";
import { useUI } from "../../../../context/Snackbar";
import { getRowColor } from "../../../const";
import { formatDateTime } from "../../../../utils/dateFormatter";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = response.data;
      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
};

interface FormState {
  id?: string;
  moduleName: string;
  description: string;
  tableNames: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  moduleName: "",
  description: "",
  tableNames: "",
  active: true,
};

export default function ApprovalModuleManagement() {
  const { showSnackbar,showSpinner,hideSpinner,showConfirmDialog } = useUI();
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ApprovalModule[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Debounce search input to avoid firing a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadModules = async () => {
    showSpinner();
    try {
      const res = await approvalWorkflowService.getModules({
        search: debouncedSearch || undefined,
        size: 100,
      });
      setModules(res.data.content);
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to load modules."), "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    void loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (m: ApprovalModule) => {
    setForm({
      id: m.id,
      moduleName: m.moduleName,
      description: m.description,
      tableNames: m.tableNames,
      active: m.active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!form.moduleName.trim()) {
      showSnackbar("Module name is required.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        moduleName: form.moduleName.trim(),
        description: form.description.trim(),
        tableNames: form.tableNames.trim(),
        active: form.active,
      };

      if (form.id) {
        await approvalWorkflowService.updateModule(form.id, payload);
        showSnackbar("Module updated.", "success");
      } else {
        await approvalWorkflowService.createModule(payload);
        showSnackbar("Module created.", "success");
      }
      setDialogOpen(false);
      await loadModules();
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to save module."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: ApprovalModule) => {
    showConfirmDialog({
      title: "Delete Module",
      message: `Are you sure you want to delete ${m.moduleName}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await approvalWorkflowService.deleteModule(m.id);
          showSnackbar("Module deleted.", "success");
          await loadModules();
        } catch (error) {
          showSnackbar(getErrorMessage(error, "Failed to delete module."), "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleToggle = async (m: ApprovalModule) => {
    try {
      await approvalWorkflowService.toggleModuleActive(m.id);
      showSnackbar(
        `Module ${m.active ? "deactivated" : "activated"}.`,
        "success"
      );
      await loadModules();
    } catch (error) {
      showSnackbar(getErrorMessage(error, "Failed to toggle module."), "error");
    }
  };

  return (
    <Box className="space-y-4">
      <div className="flex bg-white items-center justify-between gap-4 rounded-md p-2 border border-gray-200">
        <Box className="flex items-center gap-3">
          <Typography variant="h6" className="!font-bold">
            Approval Modules
          </Typography>
          <Chip
            label={`${modules.length} total`}
            size="small"
            className="!text-primary !border-primary"
            variant="outlined"
          />
        </Box>
        <Box className="flex items-center gap-2">
          <TextField
            size="small"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="contained"
            className="!bg-primary whitespace-nowrap w-full"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            New Module
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={loadModules}>
              <RefreshIcon className="!w-4 text-gray-800" />
            </IconButton>
          </Tooltip>
        </Box>
      </div>

      <div>
        {/* {loading ? (
          <Alert severity="info">Loading modules...</Alert>
        ) : ( */}
          <TableContainer className="rounded-md bg-white border border-gray-200 max-h-[calc(100vh-300px)] overflow-auto">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold" width="50px">
                    #
                  </TableCell>
                  <TableCell className="!font-bold">Module Name</TableCell>
                  <TableCell className="!font-bold">Table Names</TableCell>
                  <TableCell className="!font-bold">Description</TableCell>
                  <TableCell className="!font-bold" width="120px">
                    Status
                  </TableCell>
                  <TableCell className="!font-bold" width="150px">
                    Updated
                  </TableCell>
                  <TableCell
                    className="!font-bold"
                    width="140px"
                    align="right"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((m, idx) => (
                  <TableRow key={m.id} sx={getRowColor(idx)}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="!font-medium">
                      {m.moduleName}
                    </TableCell>
                    <TableCell>
                      {m.tableNames ? (
                        <Box className="flex flex-wrap gap-1">
                          {m.tableNames.split(",").map((t) => (
                            <Chip
                              key={t.trim()}
                              label={t.trim()}
                              size="small"
                              variant="outlined"
                              className="text-gray-800"
                            />
                          ))}
                        </Box>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{m.description || "-"}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={m.active}
                        onChange={() => handleToggle(m)}
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      {m.updatedAt ? formatDateTime(m.updatedAt) : "-"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(m)}>
                        <EditIcon
                          fontSize="small"
                          className="!w-4 !text-blue-500"
                        />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(m)}
                      >
                        <DeleteIcon fontSize="small" className="!w-4" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {modules.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No modules found. Create your first module to begin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        {/* )} */}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="flex items-center justify-between !p-2 !border-b !border-gray-200">
          <div className="!ml-4">
            {form.id ? "Edit Module" : "New Module"}
          </div>
          <IconButton onClick={closeDialog} disabled={saving}>
            <CloseOutlined className="!text-gray-800 !w-4" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          <Box className="space-y-6 pt-1">
            <TextField
              label="Module Name"
              required
              fullWidth
              value={form.moduleName}
              onChange={(e) =>
                setForm({ ...form, moduleName: e.target.value })
              }
            />
            <TextField
              label="Table Names"
              fullWidth
              placeholder="e.g. users, orders, invoices"
              helperText="Comma-separated list of table names."
              value={form.tableNames}
              onChange={(e) =>
                setForm({ ...form, tableNames: e.target.value })
              }
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  color="success"
                />
              }
              label={form.active ? "Active" : "Inactive"}
            />
          </Box>
        </DialogContent>
        <DialogActions className="border-t border-gray-200">
          <Button
            onClick={closeDialog}
            disabled={saving}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            className="!bg-primary"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
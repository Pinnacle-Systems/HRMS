import { useEffect, useState } from "react";
import {
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  CloseOutlined,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardDoubleArrowRight as KeyboardDoubleArrowRightIcon,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { getCurrentRouteLabel } from "../const";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";

export interface PolicyMasterItem {
  id: string;
  code: string;
  name: string;
  active?: boolean;
}

export interface PolicyMasterPageProps {
  title: string;
  icon: SvgIconComponent;
  fetchList: (params: { page: number; size: number; sort: string }) => Promise<any>;
  createItem: (payload: Record<string, unknown>) => Promise<any>;
  updateItem: (id: string, payload: Record<string, unknown>) => Promise<any>;
  deleteItem: (id: string) => Promise<any>;
  toggleActive: (id: string) => Promise<any>;
}

const emptyForm: Partial<PolicyMasterItem> = {
  code: "",
  name: "",
  active: true,
};

export default function PolicyMasterPage({
  title,
  icon: Icon,
  fetchList,
  createItem,
  updateItem,
  deleteItem,
  toggleActive,
}: PolicyMasterPageProps) {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [items, setItems] = useState<PolicyMasterItem[]>([]);
  const [allItems, setAllItems] = useState<PolicyMasterItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PolicyMasterItem | null>(null);
  const [formData, setFormData] = useState<Partial<PolicyMasterItem>>(emptyForm);

  const getItems = async () => {
    showSpinner();
    try {
      const response: any = await fetchList({ page: 0, size: 100, sort: "name,ASC" });
      const list = response?.data?.content ?? response?.data ?? [];
      setItems(list);
      setAllItems(list);
    } catch (error: any) {
      showSnackbar(error?.message || `Failed to load ${title}`, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setItems(allItems);
    } else {
      const filtered = allItems.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setItems(filtered);
    }
    setPage(0);
  }, [searchTerm, allItems]);

  const handleOpenDialog = (item?: PolicyMasterItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }
    showSpinner();
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        active: formData.active,
      };
      if (editingItem) {
        const res: any = await updateItem(editingItem.id, payload);
        showSnackbar(res?.message || `${title} updated successfully`, "success");
      } else {
        const res: any = await createItem(payload);
        showSnackbar(res?.message || `${title} created successfully`, "success");
      }
      await getItems();
      setDialogOpen(false);
    } catch (error: any) {
      showSnackbar(error?.message || `Failed to save ${title}`, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleToggleStatus = async (item: PolicyMasterItem) => {
    showSpinner();
    try {
      await toggleActive(item.id);
      showSnackbar(
        `${item.name} ${!item.active ? "activated" : "deactivated"} successfully!`,
        "success",
      );
      await getItems();
    } catch (error: any) {
      showSnackbar(error?.message || `Failed to update ${title}`, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = (item: PolicyMasterItem) => {
    showConfirmDialog({
      title: `Delete ${title}`,
      message: `Are you sure you want to delete "${item.name}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await deleteItem(item.id);
          showSnackbar(`${item.name} deleted successfully`, "success");
          await getItems();
        } catch (error: any) {
          showSnackbar(error?.message || `Failed to delete ${title}`, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "500px",
      maxWidth: "500px",
    },
  };

  const pagedItems = items.slice(page * limit, page * limit + limit);

  return (
    <>
      <div className="flex justify-between items-center mt-3 mb-3">
        <div className="text-gray-500 text-sm flex items-center gap-1">
          Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">{getCurrentRouteLabel()}</span>
        </div>
        <Button variant="contained" onClick={() => handleOpenDialog()} className="!bg-primary">
          Add New {title}
        </Button>
      </div>

      <TextField
        fullWidth
        variant="outlined"
        placeholder={`Search ${title.toLowerCase()} name or code...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="!mb-4"
      />

      <TableContainer className="h-[calc(100vh-295px)] overflow-auto ">
        <Table stickyHeader className="border border-gray-200 bg-white-50 rounded-sm">
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell className="!font-semibold text-gray-800">S No</TableCell>
              <TableCell className="!font-semibold text-gray-800">Code</TableCell>
              <TableCell className="!font-semibold text-gray-800">Name</TableCell>
              <TableCell className="!font-semibold text-gray-800">Status</TableCell>
              <TableCell className="!font-semibold text-gray-800 text-center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedItems.map((item, index) => (
              <TableRow key={item.id} hover sx={getRowColor(index)}>
                <TableCell className="text-gray-800">{page * limit + index + 1}</TableCell>
                <TableCell className="text-gray-800">{item.code}</TableCell>
                <TableCell className="flex items-center gap-2 font-medium text-gray-800">
                  {/* <Icon className="!w-5 !h-5 text-gray-500" /> */}
                  {item.name}
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.active === false ? "Inactive" : "Active"}
                    color={item.active === false ? "error" : "success"}
                    size="small"
                    onClick={() => handleToggleStatus(item)}
                    className="cursor-pointer"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Tooltip title={`Edit ${title}`}>
                    <IconButton size="small" className="!mr-2" onClick={() => handleOpenDialog(item)}>
                      <EditIcon className="!w-4" sx={{ color: "#0087ff" }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={`Delete ${title}`}>
                    <IconButton size="small" onClick={() => handleDelete(item)}>
                      <DeleteIcon className="!w-4" sx={{ color: "#ef4444" }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {items.length === 0 && (
          <div className="text-center py-12 bg-gray-50">
            <Icon className="!w-16 !h-16 text-gray-300 mb-2" />
            <Typography variant="h6" className="text-gray-500">
              No {title} Found
            </Typography>
            <Typography variant="body2" className="text-gray-400 mt-1">
              Click "Add New {title}" to create your first {title.toLowerCase()}
            </Typography>
          </div>
        )}
      </TableContainer>

      {items.length > 0 && (
        <GlobalPagination
          total={items.length}
          page={page + 1}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage - 1)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(0);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal={true}
        />
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" sx={commonsx}>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4 text-[12px]">
            {editingItem ? `Edit ${title}` : `Add New ${title}`}
          </div>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseOutlined className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid gap-5 mt-2">
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
             <TextField
              fullWidth
              label="Code"
              name="code"
              value={formData.code || ""}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active ?? true}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  color="primary"
                />
              }
              label="Active"
              className="text-gray-800"
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingItem ? "Update" : "Save"} {title}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

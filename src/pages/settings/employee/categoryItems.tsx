import { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloseOutlined,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { categoryService } from "../../../services/modules/category";
import { useUI } from "../../../context/Snackbar";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { getRowColor, handleEnterAsTab } from "../../const";

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export default function CategoryItems() {
  const navigate = useNavigate();
  const location = useLocation();
  const { category } = location.state || {};
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<CategoryItem>>({
    name: "",
    code: "",
    active: true,
  });

  const getItems = async () => {
    if (!category?.id) return;
    showSpinner();
    try {
      const params: any = {
        page: page,
        size: limit,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response: any = await categoryService.getCategoryItems(
        category.id,
        params,
      );
      await categoryService.getActiveCategoryItem();
      if (response.success) {
        setItems(response.data?.content || response.data || []);
        setTotal(response.data?.totalElements || response.data?.total || 0);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    if (!category) {
      navigate("/settings/employee/category-settings");
    }
  }, [category, navigate]);

  useEffect(() => {
    if (category) {
      getItems();
    }
  }, [category, page, limit, searchTerm]);

  const handleOpenDialog = (item?: CategoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        code: "",
        active: true,
      });
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
      if (editingItem) {
        const updatedValues = {
          code: formData.code,
          name: formData.name,
          active: formData.active,
        };
        await categoryService.updateCategoryItem(
          editingItem.id,
          category.id,
          updatedValues,
        );
        showSnackbar("Item updated successfully!", "success");
      } else {
        await categoryService.createCategoryItem(category.id, formData);
        showSnackbar("Item added successfully!", "success");
      }
      await getItems();
      setDialogOpen(false);
    } catch (error: any) {
      showSnackbar(error.message || "Failed to save item", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    showConfirmDialog({
      title: "Delete Item",
      message: `Are you sure you want to delete "${name}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await categoryService.deleteCategoryItem(id, category.id);
          showSnackbar("Item deleted successfully!", "success");
          await getItems();
        } catch (error: any) {
          showSnackbar(error.message || "Failed to delete item", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleToggleStatus = async (item: CategoryItem) => {
    showSpinner();
    try {
      await categoryService.toggleCategoryItemStatus(item.id, category.id);
      showSnackbar(
        `Item ${!item.active ? "activated" : "deactivated"} successfully!`,
        "success",
      );
      await getItems();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "500px",
      maxWidth: "500px",
    },
  };

  return (
    <>
      {/* Header with Back Button */}
      <div className="flex justify-between items-center mt-3 mb-4">
        <div className="flex items-center gap-3">
          <IconButton
            onClick={() => navigate("/settings/employee/category-settings")}
            className="!bg-gray-100"
          >
            <ArrowBackIcon className="!text-gray-800"/>
          </IconButton>
          <div>
            <Typography
              variant="h5"
              className="font-semibold text-gray-800 flex items-center gap-2"
            >
              <CategoryIcon className="text-primary" />
              {category.categoryName} (
              {category.enabled ? (
                <span className="text-green-500">Active</span>
              ) : (
                <span className="text-red-500">In Active</span>
              )}
              )
            </Typography>
          </div>
        </div>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          className="!bg-primary"
          disabled={!category.enabled}
        >
          Add Items
        </Button>
      </div>

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder={`Search by name or code...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="!mb-4"
      />

      {/* Items Table */}
      <TableContainer
        className="h-[calc(100vh-295px)] overflow-auto">
        <Table stickyHeader className="border border-gray-200 bg-white-50 rounded-sm w-max">
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell className="!font-semibold text-gray-800">
                S No
              </TableCell>
              <TableCell className="!font-semibold text-gray-800">
                Code
              </TableCell>
              <TableCell className="!font-semibold text-gray-800">
                Name
              </TableCell>
              <TableCell className="!font-semibold text-gray-800">
                Status
              </TableCell>
              <TableCell className="!font-semibold text-gray-800 text-center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id} hover sx={getRowColor(index)}>
                <TableCell className="text-gray-800">
                  {page * limit + index + 1}
                </TableCell>
                <TableCell> {item.code}</TableCell>
                <TableCell className="font-medium text-gray-800">
                  {item.name}
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.active ? "Active" : "Inactive"}
                    color={item.active ? "success" : "error"}
                    size="small"
                    onClick={() => handleToggleStatus(item)}
                    className="cursor-pointer"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Tooltip title="Edit">
                    <IconButton
                      size="small" className="!mr-2"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <EditIcon
                        className="!w-4"
                        sx={{ color: "#0087ff" }}
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item.id, item.name)}
                    >
                      <DeleteIcon className="!w-4" sx={{ color: "#ef4444" }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-sm">
            No {category.categoryName.toLowerCase()} items found
          </div>
        )}
      </TableContainer>

      {/* Pagination */}
      {total > 0 && (
        <GlobalPagination
          total={total}
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

      {/* Add/Edit Item Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        sx={commonsx}
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4">
            {editingItem
              ? `Edit ${category.categoryName}`
              : `Add New ${category.categoryName}`}
          </div>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseOutlined className="!text-gray-800"/>
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid gap-5" onKeyDown={handleEnterAsTab}>
            <div>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <TextField
                fullWidth
                label="Code"
                name="code"
                value={formData.code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
              />
            </div>
            <div>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active || false}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                    color="primary"                    
                  />
                }
                label="Active"
                className="text-gray-800"
              />
            </div>
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
          <Button
            onClick={handleSave}
            variant="contained"
            className="!bg-primary"
          >
            {editingItem ? "Update" : "Save"} Item
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
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
  Card,
  CardContent,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  CloseOutlined,
  Category as CategoryIcon,
  MoreVert as MoreVertIcon,
  DeleteSweep as DeleteSweepIcon,
  EditNote as EditNoteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  KeyboardDoubleArrowRight as KeyboardDoubleArrowRightIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { categoryService } from "../../../services/modules/category";
import { useUI } from "../../../context/Snackbar";
import { getCurrentRouteLabel } from "../const";

interface Category {
  id: string;
  categoryName: string;
  enabled: boolean;
  createdAt?: string;
}

export default function CategorySettings() {
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    categoryName: "",
    enabled: true,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const getCategories = async () => {
    showSpinner();
    try {
      const response: any = await categoryService.getCategories({size:100});
      if (response.success) {
        setCategories(response.data.content || []);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({
        categoryName: "",
        enabled: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.categoryName) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }
    showSpinner();
    try {
      if (editingCategory) {
        const updatedValues = {
          categoryName: formData.categoryName,
          enabled: formData.enabled,
        };
        const res: any = await categoryService.updateCategory(
          editingCategory.id,
          updatedValues,
        );
        res.success ? showSnackbar(res.message, "success") : "";
      } else {
        const res: any = await categoryService.createCategory(formData);
        res.success ? showSnackbar(res.message, "success") : "";
      }
      await getCategories();
      setDialogOpen(false);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleToggleStatus = async (category: Category) => {
    showSpinner();
    try {
      const res: any = await categoryService.toggleCategoryStatus(category.id);
      if (res.success) {
        showSnackbar(
          `${category.categoryName} ${!category.enabled ? "activated" : "deactivated"} successfully!`,
          "success",
        );
        await getCategories();
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = async (category: Category) => {
    showConfirmDialog({
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.categoryName}"? All items under this category will also be deleted.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const res: any = await categoryService.deleteCategory(category.id);
          if (res.success) {
            showSnackbar(res.message, "success");
            await getCategories();
          }
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleViewItems = (category: Category) => {
    navigate(`/settings/employee/category-items/${category.id}`, {
      state: { category },
    });
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    category: Category,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "500px",
      maxWidth: "500px",
    },
  };

  return (
    <>
      <div className="flex justify-between items-center mt-3 mb-3">
        <div className="text-gray-500 text-sm flex items-center gap-1">
          Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {getCurrentRouteLabel()}
          </span>
        </div>
        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          className="!bg-primary"
        >
          Add New Category
        </Button>
      </div>

      {/* Categories Grid View */}
      <div className="h-[calc(100vh-200px)] overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white ${!category.enabled ? "opacity-60" : ""}`}
              onClick={() => handleViewItems(category)}
            >
              <CardContent>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${category.enabled ? "bg-primary/10" : "bg-gray-100"}`}
                    >
                      <CategoryIcon
                        className={`${category.enabled ? "text-primary" : "text-gray-400"}`}
                      />
                    </div>
                    <div>
                      <Typography
                        variant="h6"
                        className="font-semibold text-gray-800"
                      >
                        {category.categoryName}
                      </Typography>
                    </div>
                  </div>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, category);
                    }}
                  >
                    <MoreVertIcon className="!w-4 !h-4" />
                  </IconButton>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <Chip
                    label={category.enabled ? "Active" : "Inactive"}
                    color={category.enabled ? "success" : "error"}
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewItems(category);
                    }}
                    className="!text-primary !border-primary"
                  >
                    View Items
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CategoryIcon className="!w-16 !h-16 text-gray-300 mb-2" />
          <Typography variant="h6" className="text-gray-500">
            No Categories Found
          </Typography>
          <Typography variant="body2" className="text-gray-400 mt-1">
            Click "Add New Category" to create your first category
          </Typography>
        </div>
      )}

      {/* Category Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedCategory) handleOpenDialog(selectedCategory);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditNoteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Category</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedCategory) handleToggleStatus(selectedCategory);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            {selectedCategory?.enabled ? (
              <CancelIcon fontSize="small" />
            ) : (
              <CheckCircleIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedCategory?.enabled ? "Deactivate" : "Activate"}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (selectedCategory) handleDelete(selectedCategory);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteSweepIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Category</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        sx={commonsx}
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </div>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid gap-5 mt-4">
            <div>
              <TextField
                fullWidth
                label="Category Name (Unique Key)"
                name="name"
                value={formData.categoryName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, categoryName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled || false}
                    onChange={(e) =>
                      setFormData({ ...formData, enabled: e.target.checked })
                    }
                    color="primary"
                    className="text-gray-800"
                  />
                }
                label="Active"
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
            {editingCategory ? "Update" : "Save"} Category
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
